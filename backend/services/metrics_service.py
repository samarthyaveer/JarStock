from typing import Optional

import pandas as pd
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Metric, Price, Stock
from schemas import (
    ComparePoint,
    CompareResponse,
    MetricPoint,
    MetricSeriesResponse,
    MoverItem,
    MoversResponse,
    SummaryResponse,
)


def get_summary(db: Session, symbol: str) -> SummaryResponse:
    symbol = _normalize_symbol(symbol)
    row = (
        db.query(
            func.max(Price.high),
            func.min(Price.low),
            func.avg(Price.close),
        )
        .filter(Price.symbol == symbol)
        .one()
    )

    high_52w, low_52w, avg_close = row
    if high_52w is None or low_52w is None or avg_close is None:
        raise HTTPException(status_code=404, detail="No summary data for symbol")

    return SummaryResponse(
        symbol=symbol,
        high_52w=float(high_52w),
        low_52w=float(low_52w),
        avg_close=float(avg_close),
    )


def get_metric_series(
    db: Session,
    symbol: str,
    range_label: Optional[str] = None,
) -> MetricSeriesResponse:
    symbol = _normalize_symbol(symbol)
    rows = (
        db.query(Metric)
        .filter(Metric.symbol == symbol)
        .order_by(Metric.date.asc())
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No metrics data for symbol")

    rows = _apply_range(rows, range_label)
    metrics = [
        MetricPoint(
            date=row.date,
            daily_return=row.daily_return,
            ma7=row.ma7,
            volatility=row.volatility,
            momentum=row.momentum,
        )
        for row in rows
    ]

    if not metrics:
        raise HTTPException(status_code=404, detail="No metrics data for symbol")

    return MetricSeriesResponse(symbol=symbol, metrics=metrics)


def compare_symbols(
    db: Session,
    symbol1: str,
    symbol2: str,
    range_label: Optional[str] = None,
) -> CompareResponse:
    symbol1 = _normalize_symbol(symbol1)
    symbol2 = _normalize_symbol(symbol2)

    if symbol1 == symbol2:
        raise HTTPException(status_code=400, detail="Symbols must be different")

    rows1 = (
        db.query(Price)
        .filter(Price.symbol == symbol1)
        .order_by(Price.date.asc())
        .all()
    )
    rows2 = (
        db.query(Price)
        .filter(Price.symbol == symbol2)
        .order_by(Price.date.asc())
        .all()
    )

    if not rows1 or not rows2:
        raise HTTPException(status_code=404, detail="No price data for comparison")

    rows1 = _apply_range(rows1, range_label)
    rows2 = _apply_range(rows2, range_label)

    map1 = {row.date: row.close for row in rows1 if row.close is not None}
    map2 = {row.date: row.close for row in rows2 if row.close is not None}
    dates = sorted(set(map1.keys()) & set(map2.keys()))
    aligned = [(date, map1[date], map2[date]) for date in dates]

    if len(aligned) < 2:
        raise HTTPException(status_code=404, detail="Not enough data to compare")

    base1 = aligned[0][1] or 1.0
    base2 = aligned[0][2] or 1.0

    series = [
        ComparePoint(
            date=date,
            symbol1=float(close1) / base1,
            symbol2=float(close2) / base2,
        )
        for date, close1, close2 in aligned
    ]

    values1 = pd.Series([close1 for _, close1, _ in aligned]).pct_change()
    values2 = pd.Series([close2 for _, _, close2 in aligned]).pct_change()
    correlation = values1.corr(values2)
    if correlation is None or pd.isna(correlation):
        correlation_value = 0.0
    else:
        correlation_value = float(correlation)

    return CompareResponse(
        symbol1=symbol1,
        symbol2=symbol2,
        correlation=correlation_value,
        series=series,
    )


def get_top_movers(
    db: Session,
    limit: int,
    direction: str,
) -> MoversResponse:
    metrics = db.query(Metric).order_by(Metric.date.asc()).all()
    prices = db.query(Price).order_by(Price.date.asc()).all()
    stocks = {stock.symbol: stock.name for stock in db.query(Stock).all()}

    if not metrics or not prices:
        raise HTTPException(status_code=404, detail="No mover data available")

    latest_metric: dict[str, Metric] = {}
    for metric in metrics:
        latest_metric[metric.symbol] = metric

    latest_price: dict[str, Price] = {}
    for price in prices:
        latest_price[price.symbol] = price

    items: list[MoverItem] = []
    for symbol, metric in latest_metric.items():
        if metric.daily_return is None:
            continue
        price = latest_price.get(symbol)
        if price is None or price.close is None:
            continue
        items.append(
            MoverItem(
                symbol=symbol,
                name=stocks.get(symbol, symbol),
                close=float(price.close),
                daily_return=float(metric.daily_return),
            )
        )

    if not items:
        raise HTTPException(status_code=404, detail="No mover data available")

    reverse = direction == "gainers"
    items_sorted = sorted(items, key=lambda item: item.daily_return, reverse=reverse)
    as_of = max(metric.date for metric in latest_metric.values())

    return MoversResponse(as_of=as_of, items=items_sorted[:limit])


def _normalize_symbol(symbol: str) -> str:
    return (symbol or "").strip().upper()


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


def _apply_range(rows: list, range_label: Optional[str]) -> list:
    count = _parse_range_label(range_label)
    if count is None:
        return rows
    if len(rows) <= count:
        return rows
    return rows[-count:]
