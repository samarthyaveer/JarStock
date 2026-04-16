import json
import logging
import os
import threading
import time
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Iterable, Optional

import pandas as pd
import yfinance as yf
from fastapi import HTTPException
from sqlalchemy import delete, func
from sqlalchemy.orm import Session

from models import Metric, Price, Stock
from schemas import (
    CompanyOut,
    MarketSnapshotItem,
    MarketSnapshotResponse,
    PricePoint,
    PriceSeriesResponse,
)

logger = logging.getLogger("jarstock")

DEFAULT_SYMBOLS = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "NVDA",
    "META",
    "TSLA",
    "NFLX",
]

FALLBACK_PATH = Path(__file__).resolve().parents[1] / "data" / "fallback_prices.json"

_REFRESH_LOCK = threading.Lock()
_REFRESH_IN_FLIGHT: set[str] = set()
_LAST_REFRESH: dict[str, float] = {}
_MARKET_SNAPSHOT_WINDOW = 7
_YF_LOCK = threading.Lock()
_LAST_YF_FAILURE: dict[str, float] = {}
_LAST_YF_BULK_FAILURE: Optional[float] = None


def list_companies(db: Session) -> list[CompanyOut]:
    rows = db.query(Stock).order_by(Stock.symbol.asc()).all()
    return [CompanyOut(symbol=row.symbol, name=row.name, sector=row.sector) for row in rows]


def parse_symbols_param(symbols_param: Optional[str]) -> list[str]:
    if not symbols_param:
        return []
    return _parse_symbols(symbols_param)


def resolve_symbols(db: Session, symbols: Optional[Iterable[str]] = None) -> list[str]:
    normalized = [s for s in (_normalize_symbol(item) for item in (symbols or [])) if s]
    if normalized:
        return sorted(set(normalized))

    rows = db.query(Stock.symbol).order_by(Stock.symbol.asc()).all()
    if rows:
        return [row[0] for row in rows]

    return DEFAULT_SYMBOLS


def get_market_snapshot(db: Session, window: int = _MARKET_SNAPSHOT_WINDOW) -> MarketSnapshotResponse:
    stocks = db.query(Stock).order_by(Stock.symbol.asc()).all()
    if not stocks:
        fallback = _fallback_market_snapshot(window)
        if fallback:
            return fallback
        raise HTTPException(status_code=404, detail="No market data available")

    items: list[MarketSnapshotItem] = []
    as_of_dates = []
    for stock in stocks:
        rows = (
            db.query(Price)
            .filter(Price.symbol == stock.symbol)
            .order_by(Price.date.desc())
            .limit(window)
            .all()
        )
        if not rows:
            continue
        recent = list(reversed(rows))
        price_points = [
            PricePoint(date=row.date, close=row.close)
            for row in recent
            if row.close is not None
        ]
        if not price_points:
            continue
        items.append(
            MarketSnapshotItem(
                symbol=stock.symbol,
                name=stock.name,
                sector=stock.sector,
                prices=price_points,
            )
        )
        as_of_dates.append(price_points[-1].date)

    if not items:
        fallback = _fallback_market_snapshot(window)
        if fallback:
            return fallback
        raise HTTPException(status_code=404, detail="No market data available")

    as_of = max(as_of_dates)
    return MarketSnapshotResponse(as_of=as_of, items=items)


def get_price_series(
    db: Session,
    symbol: str,
    range_label: Optional[str] = None,
) -> PriceSeriesResponse:
    symbol = _normalize_symbol(symbol)
    rows = (
        db.query(Price)
        .filter(Price.symbol == symbol)
        .order_by(Price.date.asc())
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No price data for symbol")

    rows = _apply_range(rows, range_label)

    prices = [PricePoint(date=row.date, close=row.close) for row in rows if row.close is not None]
    if not prices:
        raise HTTPException(status_code=404, detail="No price data for symbol")

    return PriceSeriesResponse(symbol=symbol, prices=prices)


def refresh_symbol_if_needed(
    db: Session,
    symbol: str,
    force: bool = False,
) -> bool:
    symbol = _normalize_symbol(symbol)
    if not symbol:
        return False

    if not force:
        latest_date = _latest_price_date(db, symbol)
        if latest_date and _is_recent_date(latest_date, _market_stale_days()):
            return False

    now = time.time()
    with _REFRESH_LOCK:
        if symbol in _REFRESH_IN_FLIGHT:
            return False
        if not force:
            last = _LAST_REFRESH.get(symbol)
            if last and now - last < _refresh_ttl_seconds():
                return False
        _REFRESH_IN_FLIGHT.add(symbol)

    try:
        include_info = _should_fetch_info(db, symbol)
        refresh_symbol(db, symbol, include_info=include_info)
        with _REFRESH_LOCK:
            _LAST_REFRESH[symbol] = time.time()
        return True
    finally:
        with _REFRESH_LOCK:
            _REFRESH_IN_FLIGHT.discard(symbol)


def refresh_market_data(
    db: Session,
    symbols: Iterable[str],
    force: bool = False,
) -> dict[str, list[str]]:
    normalized = [_normalize_symbol(item) for item in symbols if item]
    normalized = sorted({symbol for symbol in normalized if symbol})
    if not normalized:
        return {"refreshed": [], "skipped": []}

    now = time.time()
    symbols_to_refresh: list[str] = []
    skipped: list[str] = []
    latest_dates = _latest_price_dates(db, normalized)
    stale_days = _market_stale_days()

    with _REFRESH_LOCK:
        for symbol in normalized:
            if symbol in _REFRESH_IN_FLIGHT:
                skipped.append(symbol)
                continue
            if not force:
                last = _LAST_REFRESH.get(symbol)
                if last and now - last < _refresh_ttl_seconds():
                    skipped.append(symbol)
                    continue
                latest_date = latest_dates.get(symbol)
                if latest_date and _is_recent_date(latest_date, stale_days):
                    skipped.append(symbol)
                    continue
            _REFRESH_IN_FLIGHT.add(symbol)
            symbols_to_refresh.append(symbol)

    if not symbols_to_refresh:
        return {"refreshed": [], "skipped": skipped}

    refreshed: list[str] = []
    try:
        history_map = _fetch_history_bulk(symbols_to_refresh)
        existing = {
            stock.symbol: stock
            for stock in db.query(Stock)
            .filter(Stock.symbol.in_(symbols_to_refresh))
            .all()
        }

        for symbol in symbols_to_refresh:
            df = history_map.get(symbol)
            if df is None or df.empty:
                df = _fallback_history(symbol)
            if df is None or df.empty:
                skipped.append(symbol)
                continue

            name, sector = _resolve_stock_info(symbol, existing.get(symbol), include_info=False)
            _upsert_symbol_data(db, symbol, name, sector, df, existing)
            refreshed.append(symbol)

        db.commit()

        with _REFRESH_LOCK:
            refreshed_at = time.time()
            for symbol in refreshed:
                _LAST_REFRESH[symbol] = refreshed_at
    finally:
        with _REFRESH_LOCK:
            for symbol in symbols_to_refresh:
                _REFRESH_IN_FLIGHT.discard(symbol)

    return {"refreshed": refreshed, "skipped": skipped}


def bootstrap_data(db: Session) -> None:
    refresh = os.getenv("JARSTOCK_REFRESH_ON_STARTUP", "0") == "1"
    symbols_env = os.getenv("JARSTOCK_SYMBOLS")
    symbols = _parse_symbols(symbols_env) if symbols_env else DEFAULT_SYMBOLS
    has_data = db.query(Stock).count() > 0

    if not has_data:
        seeded = _seed_from_fallback(db, symbols)
        has_data = bool(seeded)
        if has_data and not refresh:
            return

    if not refresh and has_data:
        return

    try:
        refresh_market_data(db, symbols, force=not has_data)
    except Exception as exc:
        logger.warning("bootstrap_failed", extra={"error": str(exc)})


def refresh_symbol(db: Session, symbol: str, include_info: bool = True) -> None:
    symbol = _normalize_symbol(symbol)
    if not symbol:
        return

    df = _fetch_history(symbol)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    stock = db.query(Stock).filter(Stock.symbol == symbol).one_or_none()
    name, sector = _resolve_stock_info(symbol, stock, include_info=include_info)
    _upsert_symbol_data(db, symbol, name, sector, df, {symbol: stock} if stock else {})
    db.commit()


def _refresh_ttl_seconds() -> int:
    raw_value = os.getenv("JARSTOCK_REFRESH_TTL_SECONDS", "900")
    try:
        value = int(raw_value)
    except ValueError:
        value = 900
    return max(60, value)


def _yf_cooldown_seconds() -> int:
    raw_value = os.getenv("JARSTOCK_YF_COOLDOWN_SECONDS", "900")
    try:
        value = int(raw_value)
    except ValueError:
        value = 900
    return max(60, value)


def _yf_disabled() -> bool:
    return os.getenv("JARSTOCK_YF_DISABLE", "0") == "1"


def _market_stale_days() -> int:
    raw_value = os.getenv("JARSTOCK_MARKET_STALE_DAYS", "2")
    try:
        value = int(raw_value)
    except ValueError:
        value = 2
    return max(1, value)


def _should_fetch_info(db: Session, symbol: str) -> bool:
    stock = db.query(Stock).filter(Stock.symbol == symbol).one_or_none()
    if stock is None:
        return True
    return not stock.name


def _resolve_stock_info(
    symbol: str,
    stock: Optional[Stock],
    include_info: bool,
) -> tuple[str, Optional[str]]:
    info: dict = {}
    if include_info:
        info = _fetch_info(symbol)

    fallback_info = _fallback_info(symbol)
    name = (
        info.get("longName")
        or info.get("shortName")
        or (stock.name if stock else None)
        or fallback_info.get("longName")
        or fallback_info.get("shortName")
        or symbol
    )
    sector = (
        info.get("sector")
        or (stock.sector if stock else None)
        or fallback_info.get("sector")
    )
    return name, sector


def _upsert_symbol_data(
    db: Session,
    symbol: str,
    name: str,
    sector: Optional[str],
    df: pd.DataFrame,
    existing: Optional[dict[str, Stock]] = None,
) -> None:
    stock = existing.get(symbol) if existing else None
    if stock is None:
        stock = Stock(symbol=symbol, name=name, sector=sector)
        db.add(stock)
        if existing is not None:
            existing[symbol] = stock
    else:
        stock.name = name
        if sector is not None:
            stock.sector = sector

    db.execute(delete(Price).where(Price.symbol == symbol))
    db.execute(delete(Metric).where(Metric.symbol == symbol))

    price_rows, metric_rows = _build_rows(symbol, df)
    if price_rows:
        db.bulk_save_objects(price_rows)
    if metric_rows:
        db.bulk_save_objects(metric_rows)


def _fetch_history(symbol: str) -> pd.DataFrame:
    if _should_skip_yf(symbol=symbol):
        fallback_df = _fallback_history(symbol)
        if not fallback_df.empty:
            logger.info("yfinance_skipped", extra={"symbol": symbol})
        return fallback_df

    proxy = _get_proxy()
    try:
        ticker = yf.Ticker(symbol, proxy=proxy)
        df = ticker.history(period="1y", auto_adjust=False)
    except Exception as exc:
        _record_yf_failure(symbol)
        logger.warning("yfinance_history_failed", extra={"symbol": symbol, "error": str(exc)})
        df = pd.DataFrame()

    df = _clean_history(df)
    if not df.empty:
        return df

    fallback_df = _fallback_history(symbol)
    if not fallback_df.empty:
        logger.warning("fallback_history_used", extra={"symbol": symbol})
        return fallback_df

    return pd.DataFrame()


def _fetch_history_bulk(symbols: list[str]) -> dict[str, pd.DataFrame]:
    if not symbols:
        return {}

    if _should_skip_yf(bulk=True):
        logger.info("yfinance_bulk_skipped")
        return {}

    proxy = _get_proxy()

    try:
        df = yf.download(
            tickers=" ".join(symbols),
            period="1y",
            group_by="ticker",
            auto_adjust=False,
            threads=False,
            progress=False,
            proxy=proxy,
        )
    except Exception as exc:
        _record_yf_bulk_failure()
        logger.warning("yfinance_bulk_failed", extra={"error": str(exc)})
        return {}

    result: dict[str, pd.DataFrame] = {}
    if df is None or df.empty:
        return result

    if isinstance(df.columns, pd.MultiIndex):
        for symbol in symbols:
            if symbol not in df.columns.levels[0]:
                continue
            symbol_df = df[symbol].copy()
            cleaned = _clean_history(symbol_df)
            if not cleaned.empty:
                result[symbol] = cleaned
        return result

    symbol = symbols[0]
    cleaned = _clean_history(df)
    if not cleaned.empty:
        result[symbol] = cleaned
    return result


def _fetch_info(symbol: str) -> dict:
    if _should_skip_yf(symbol=symbol):
        return _fallback_info(symbol)

    proxy = _get_proxy()
    ticker = yf.Ticker(symbol, proxy=proxy)
    try:
        info = ticker.get_info() or {}
    except Exception as exc:
        _record_yf_failure(symbol)
        logger.warning("yfinance_info_failed", extra={"symbol": symbol, "error": str(exc)})
        info = {}

    if info:
        return info

    fallback_info = _fallback_info(symbol)
    if fallback_info:
        logger.warning("fallback_info_used", extra={"symbol": symbol})
        return fallback_info

    return {}


def _clean_history(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or df.empty:
        return pd.DataFrame()

    df = df.copy().reset_index()
    if "Date" in df.columns:
        df = df.rename(columns={"Date": "date"})
    if "Datetime" in df.columns:
        df = df.rename(columns={"Datetime": "date"})

    rename_map = {
        "Open": "open",
        "High": "high",
        "Low": "low",
        "Close": "close",
        "Volume": "volume",
    }
    df = df.rename(columns=rename_map)

    if "date" not in df.columns:
        return pd.DataFrame()

    if pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = df["date"].dt.date

    columns = ["date", "open", "high", "low", "close", "volume"]
    df = df[columns].sort_values("date")

    numeric_cols = ["open", "high", "low", "close", "volume"]
    df[numeric_cols] = df[numeric_cols].ffill()
    df = df.dropna(subset=["open", "close"])

    df["daily_return"] = (df["close"] - df["open"]) / df["open"].replace(0, pd.NA)
    close_returns = df["close"].pct_change()
    df["ma7"] = df["close"].rolling(window=7, min_periods=1).mean()
    df["volatility"] = close_returns.rolling(window=7, min_periods=2).std()
    df["momentum"] = close_returns.rolling(window=7, min_periods=2).mean()

    return df


def _build_rows(symbol: str, df: pd.DataFrame) -> tuple[list[Price], list[Metric]]:
    price_rows: list[Price] = []
    metric_rows: list[Metric] = []

    for item in df.to_dict(orient="records"):
        price_rows.append(
            Price(
                symbol=symbol,
                date=item["date"],
                open=_to_float(item.get("open")),
                high=_to_float(item.get("high")),
                low=_to_float(item.get("low")),
                close=_to_float(item.get("close")),
                volume=_to_int(item.get("volume")),
            )
        )
        metric_rows.append(
            Metric(
                symbol=symbol,
                date=item["date"],
                daily_return=_to_float(item.get("daily_return")),
                ma7=_to_float(item.get("ma7")),
                volatility=_to_float(item.get("volatility")),
                momentum=_to_float(item.get("momentum")),
            )
        )

    return price_rows, metric_rows


def _normalize_symbol(symbol: str) -> str:
    return (symbol or "").strip().upper()


def _get_proxy() -> Optional[str]:
    proxy = os.getenv("JARSTOCK_YF_PROXY", "").strip()
    return proxy or None


def _should_skip_yf(symbol: Optional[str] = None, bulk: bool = False) -> bool:
    if _yf_disabled():
        return True

    cooldown = _yf_cooldown_seconds()
    now = time.time()
    with _YF_LOCK:
        if bulk and _LAST_YF_BULK_FAILURE:
            if now - _LAST_YF_BULK_FAILURE < cooldown:
                return True
        if symbol:
            last = _LAST_YF_FAILURE.get(symbol)
            if last and now - last < cooldown:
                return True

    return False


def _record_yf_failure(symbol: str) -> None:
    with _YF_LOCK:
        _LAST_YF_FAILURE[symbol] = time.time()


def _record_yf_bulk_failure() -> None:
    global _LAST_YF_BULK_FAILURE
    with _YF_LOCK:
        _LAST_YF_BULK_FAILURE = time.time()


def _is_recent_date(value: date, stale_days: int) -> bool:
    cutoff = date.today() - timedelta(days=stale_days)
    return value >= cutoff


def _latest_price_dates(db: Session, symbols: list[str]) -> dict[str, date]:
    if not symbols:
        return {}
    rows = (
        db.query(Price.symbol, func.max(Price.date))
        .filter(Price.symbol.in_(symbols))
        .group_by(Price.symbol)
        .all()
    )
    return {symbol: latest for symbol, latest in rows if latest}


def _latest_price_date(db: Session, symbol: str) -> Optional[date]:
    row = (
        db.query(func.max(Price.date))
        .filter(Price.symbol == symbol)
        .one()
    )
    return row[0] if row else None


@lru_cache(maxsize=1)
def _fallback_payload() -> dict:
    if not FALLBACK_PATH.exists():
        return {}
    try:
        with FALLBACK_PATH.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as exc:
        logger.warning("fallback_load_failed", extra={"error": str(exc)})
        return {}


def _parse_date_value(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        return None


def _fallback_market_snapshot(window: int) -> Optional[MarketSnapshotResponse]:
    payload = _fallback_payload()
    symbols = payload.get("symbols") or {}
    if not symbols:
        return None

    as_of = _parse_date_value(payload.get("as_of"))
    items: list[MarketSnapshotItem] = []
    derived_as_of: Optional[date] = None

    for symbol, entry in symbols.items():
        prices = entry.get("prices") or []
        recent = prices[-window:] if window else prices
        points: list[PricePoint] = []
        for item in recent:
            item_date = _parse_date_value(item.get("date"))
            close = item.get("close")
            if item_date is None or close is None:
                continue
            points.append(PricePoint(date=item_date, close=float(close)))
        if not points:
            continue
        items.append(
            MarketSnapshotItem(
                symbol=symbol,
                name=entry.get("name") or symbol,
                sector=entry.get("sector"),
                prices=points,
            )
        )
        derived_as_of = (
            max(derived_as_of, points[-1].date)
            if derived_as_of
            else points[-1].date
        )

    if not items:
        return None

    return MarketSnapshotResponse(as_of=as_of or derived_as_of or date.today(), items=items)


def _seed_from_fallback(db: Session, symbols: list[str]) -> list[str]:
    if not symbols:
        return []

    existing = {
        stock.symbol: stock
        for stock in db.query(Stock)
        .filter(Stock.symbol.in_(symbols))
        .all()
    }
    seeded: list[str] = []
    for symbol in symbols:
        df = _fallback_history(symbol)
        if df.empty:
            continue
        name, sector = _resolve_stock_info(symbol, existing.get(symbol), include_info=False)
        _upsert_symbol_data(db, symbol, name, sector, df, existing)
        seeded.append(symbol)

    if seeded:
        db.commit()

    return seeded


def _fallback_history(symbol: str) -> pd.DataFrame:
    payload = _fallback_payload()
    entry = (payload.get("symbols") or {}).get(symbol)
    if not entry:
        return pd.DataFrame()

    prices = entry.get("prices") or []
    if not prices:
        return pd.DataFrame()

    df = pd.DataFrame(prices)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return _clean_history(df)


def _fallback_info(symbol: str) -> dict:
    payload = _fallback_payload()
    entry = (payload.get("symbols") or {}).get(symbol)
    if not entry:
        return {}

    info: dict[str, str] = {}
    name = entry.get("name")
    sector = entry.get("sector")
    if name:
        info["longName"] = name
    if sector:
        info["sector"] = sector
    return info


def _parse_range_label(range_label: Optional[str]) -> Optional[int]:
    if not range_label:
        return None
    key = range_label.strip().lower()
    mapping = {
        "30d": 30,
        "90d": 90,
        "1y": 365,
        "max": None,
    }
    if key not in mapping:
        raise HTTPException(status_code=400, detail="Invalid range parameter")
    return mapping[key]


def _apply_range(rows: list[Price], range_label: Optional[str]) -> list[Price]:
    count = _parse_range_label(range_label)
    if count is None:
        return rows
    if len(rows) <= count:
        return rows
    return rows[-count:]


def _parse_symbols(symbols_env: str) -> list[str]:
    return [s.strip().upper() for s in symbols_env.split(",") if s.strip()]


def _to_float(value):
    if value is None or pd.isna(value):
        return None
    return float(value)


def _to_int(value):
    if value is None or pd.isna(value):
        return None
    return int(value)
