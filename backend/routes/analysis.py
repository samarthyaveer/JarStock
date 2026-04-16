from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from schemas import (
    CompareResponse,
    InsightResponse,
    MarketSnapshotResponse,
    MetricSeriesResponse,
    MoversResponse,
    RefreshResponse,
    SummaryResponse,
)
from services.data_service import (
    get_market_snapshot,
    parse_symbols_param,
    refresh_market_data,
    resolve_symbols,
)
from services.insight_service import generate_insight
from services.metrics_service import compare_symbols, get_metric_series, get_summary, get_top_movers

router = APIRouter()


@router.get("/summary/{symbol}", response_model=SummaryResponse)
def summary(symbol: str, db: Session = Depends(get_db)) -> SummaryResponse:
    return get_summary(db, symbol)


@router.get("/insights/{symbol}", response_model=InsightResponse)
def insights(symbol: str, db: Session = Depends(get_db)) -> InsightResponse:
    return generate_insight(db, symbol)


@router.get("/metrics/{symbol}", response_model=MetricSeriesResponse)
def metrics(
    symbol: str,
    range_label: str = Query("1y", alias="range"),
    db: Session = Depends(get_db),
) -> MetricSeriesResponse:
    return get_metric_series(db, symbol, range_label)


@router.get("/compare", response_model=CompareResponse)
def compare(
    symbol1: str,
    symbol2: str,
    range_label: str = Query("90d", alias="range"),
    db: Session = Depends(get_db),
) -> CompareResponse:
    return compare_symbols(db, symbol1, symbol2, range_label)


@router.get("/market/top-gainers", response_model=MoversResponse)
def top_gainers(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
) -> MoversResponse:
    return get_top_movers(db, limit, "gainers")


@router.get("/market/top-losers", response_model=MoversResponse)
def top_losers(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
) -> MoversResponse:
    return get_top_movers(db, limit, "losers")


@router.get("/market/snapshot", response_model=MarketSnapshotResponse)
def market_snapshot(db: Session = Depends(get_db)) -> MarketSnapshotResponse:
    return get_market_snapshot(db)


@router.post("/refresh/market", response_model=RefreshResponse)
def refresh_market(
    symbols: str | None = Query(None),
    db: Session = Depends(get_db),
) -> RefreshResponse:
    parsed = parse_symbols_param(symbols)
    resolved = resolve_symbols(db, parsed)
    result = refresh_market_data(db, resolved)
    return RefreshResponse(
        scope="market",
        refreshed=result["refreshed"],
        skipped=result["skipped"],
    )
