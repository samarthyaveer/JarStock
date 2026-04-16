import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Iterable, Optional

import pandas as pd
import yfinance as yf
from fastapi import HTTPException
from sqlalchemy import delete
from sqlalchemy.orm import Session

from models import Metric, Price, Stock
from schemas import CompanyOut, PricePoint, PriceSeriesResponse

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


def list_companies(db: Session) -> list[CompanyOut]:
    rows = db.query(Stock).order_by(Stock.symbol.asc()).all()
    return [CompanyOut(symbol=row.symbol, name=row.name, sector=row.sector) for row in rows]


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


def bootstrap_data(db: Session) -> None:
    refresh = os.getenv("JARSTOCK_REFRESH_ON_STARTUP", "0") == "1"
    symbols_env = os.getenv("JARSTOCK_SYMBOLS")
    symbols = _parse_symbols(symbols_env) if symbols_env else DEFAULT_SYMBOLS

    if not refresh and db.query(Stock).count() > 0:
        return

    for symbol in symbols:
        try:
            refresh_symbol(db, symbol)
        except Exception as exc:
            logger.warning("bootstrap_failed", extra={"symbol": symbol, "error": str(exc)})


def refresh_symbol(db: Session, symbol: str) -> None:
    symbol = _normalize_symbol(symbol)
    if not symbol:
        return

    df = _fetch_history(symbol)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    info = _fetch_info(symbol)
    name = info.get("longName") or info.get("shortName") or symbol
    sector = info.get("sector")

    stock = db.query(Stock).filter(Stock.symbol == symbol).one_or_none()
    if stock is None:
        stock = Stock(symbol=symbol, name=name, sector=sector)
        db.add(stock)
    else:
        stock.name = name
        stock.sector = sector

    db.execute(delete(Price).where(Price.symbol == symbol))
    db.execute(delete(Metric).where(Metric.symbol == symbol))

    price_rows, metric_rows = _build_rows(symbol, df)
    if price_rows:
        db.bulk_save_objects(price_rows)
    if metric_rows:
        db.bulk_save_objects(metric_rows)
    db.commit()


def _fetch_history(symbol: str) -> pd.DataFrame:
    proxy = _get_proxy()
    try:
        ticker = yf.Ticker(symbol, proxy=proxy)
        df = ticker.history(period="1y", auto_adjust=False)
    except Exception as exc:
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


def _fetch_info(symbol: str) -> dict:
    proxy = _get_proxy()
    ticker = yf.Ticker(symbol, proxy=proxy)
    try:
        info = ticker.get_info() or {}
    except Exception as exc:
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
