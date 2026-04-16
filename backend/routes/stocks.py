from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import get_db
from schemas import PriceSeriesResponse
from services.data_service import get_price_series

router = APIRouter()


@router.get("/data/{symbol}", response_model=PriceSeriesResponse)
def get_stock_data(
    symbol: str,
    range_label: str = Query("1y", alias="range"),
    db: Session = Depends(get_db),
) -> PriceSeriesResponse:
    return get_price_series(db, symbol, range_label)
