from sqlalchemy import Column, Date, Float, ForeignKey, Integer, PrimaryKeyConstraint, String

from db import Base


class Stock(Base):
    __tablename__ = "stocks"

    symbol = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=True)


class Price(Base):
    __tablename__ = "prices"

    symbol = Column(String, ForeignKey("stocks.symbol"), nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)

    __table_args__ = (PrimaryKeyConstraint("symbol", "date", name="pk_prices"),)


class Metric(Base):
    __tablename__ = "metrics"

    symbol = Column(String, ForeignKey("stocks.symbol"), nullable=False)
    date = Column(Date, nullable=False)
    daily_return = Column(Float, nullable=True)
    ma7 = Column(Float, nullable=True)
    volatility = Column(Float, nullable=True)
    momentum = Column(Float, nullable=True)

    __table_args__ = (PrimaryKeyConstraint("symbol", "date", name="pk_metrics"),)
