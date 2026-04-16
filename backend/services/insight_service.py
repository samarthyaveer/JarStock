from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Metric, Price
from schemas import InsightResponse


def generate_insight(db: Session, symbol: str) -> InsightResponse:
    symbol = _normalize_symbol(symbol)
    latest_price = (
        db.query(Price)
        .filter(Price.symbol == symbol)
        .order_by(Price.date.desc())
        .first()
    )
    latest_metric = (
        db.query(Metric)
        .filter(Metric.symbol == symbol)
        .order_by(Metric.date.desc())
        .first()
    )

    if latest_price is None or latest_metric is None:
        raise HTTPException(status_code=404, detail="No insight data for symbol")

    label = _label_trend(latest_price.close, latest_metric.ma7, latest_metric.momentum)
    risk = _risk_label(latest_metric.volatility)
    summary = _summary_text(latest_price.close, latest_metric.ma7, latest_metric.momentum, risk)
    confidence = _confidence_score(latest_metric.ma7, latest_metric.momentum, latest_metric.volatility)

    return InsightResponse(
        symbol=symbol,
        label=label,
        confidence=confidence,
        summary=summary,
        risk=risk,
    )


def _label_trend(close: Optional[float], ma7: Optional[float], momentum: Optional[float]) -> str:
    if close is None or ma7 is None:
        return "Insufficient data"

    if close > ma7 * 1.01:
        if momentum is not None and momentum > 0.01:
            return "Strong uptrend"
        return "Uptrend"
    if close < ma7 * 0.99:
        if momentum is not None and momentum < -0.01:
            return "Strong downtrend"
        return "Downtrend"
    return "Sideways"


def _risk_label(volatility: Optional[float]) -> str:
    if volatility is None:
        return "Risk unknown"
    if volatility > 0.03:
        return "High volatility"
    if volatility > 0.015:
        return "Moderate volatility"
    return "Low volatility"


def _summary_text(
    close: Optional[float],
    ma7: Optional[float],
    momentum: Optional[float],
    risk: str,
) -> str:
    if close is None or ma7 is None:
        return "Not enough recent data to generate a reliable insight."

    if close > ma7:
        trend = "Price is above the 7-day average"
    elif close < ma7:
        trend = "Price is below the 7-day average"
    else:
        trend = "Price is near the 7-day average"

    if momentum is None:
        momentum_text = "recent momentum is unclear"
    elif momentum > 0.01:
        momentum_text = "recent returns are positive"
    elif momentum < -0.01:
        momentum_text = "recent returns are negative"
    else:
        momentum_text = "recent returns are flat"

    return f"{trend} and {momentum_text}. {risk}."


def _confidence_score(
    ma7: Optional[float],
    momentum: Optional[float],
    volatility: Optional[float],
) -> float:
    score = 0.4
    if ma7 is not None:
        score += 0.2
    if momentum is not None:
        score += 0.2
    if volatility is not None:
        score += 0.1
    return round(min(score, 0.9), 2)


def _normalize_symbol(symbol: str) -> str:
    return (symbol or "").strip().upper()
