from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from schemas import PriceSeriesResponse, RefreshResponse
from services.data_service import get_price_series, refresh_symbol_if_needed

router = APIRouter()


@router.get("/data/{symbol}", response_model=PriceSeriesResponse)
def get_stock_data(
    symbol: str,
    range_label: str = Query("1y", alias="range"),
    db: Session = Depends(get_db),
) -> PriceSeriesResponse:
    return get_price_series(db, symbol, range_label)


@router.post("/refresh/{symbol}", response_model=RefreshResponse)
def refresh_symbol(
    symbol: str,
    db: Session = Depends(get_db),
) -> RefreshResponse:
    refreshed = refresh_symbol_if_needed(db, symbol)
    normalized = symbol.strip().upper()
    return RefreshResponse(
        scope="symbol",
        refreshed=[normalized] if refreshed else [],
        skipped=[] if refreshed else [normalized],
    )
