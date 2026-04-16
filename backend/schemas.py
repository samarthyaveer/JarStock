from datetime import date
from typing import Optional

from pydantic import BaseModel


class CompanyOut(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None


class PricePoint(BaseModel):
    date: date
    close: float


class PriceSeriesResponse(BaseModel):
    symbol: str
    prices: list[PricePoint]


class SummaryResponse(BaseModel):
    symbol: str
    high_52w: float
    low_52w: float
    avg_close: float


class InsightResponse(BaseModel):
    symbol: str
    label: str
    confidence: float
    summary: str
    risk: str


class MetricPoint(BaseModel):
    date: date
    daily_return: Optional[float] = None
    ma7: Optional[float] = None
    volatility: Optional[float] = None
    momentum: Optional[float] = None


class MetricSeriesResponse(BaseModel):
    symbol: str
    metrics: list[MetricPoint]


class ComparePoint(BaseModel):
    date: date
    symbol1: float
    symbol2: float


class CompareResponse(BaseModel):
    symbol1: str
    symbol2: str
    correlation: float
    series: list[ComparePoint]


class MoverItem(BaseModel):
    symbol: str
    name: str
    close: float
    daily_return: float


class MoversResponse(BaseModel):
    as_of: date
    items: list[MoverItem]
