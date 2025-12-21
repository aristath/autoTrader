"""Yahoo Finance service for analyst data and fundamentals."""

import logging
from datetime import datetime
from typing import Optional
from dataclasses import dataclass

import yfinance as yf

logger = logging.getLogger(__name__)


@dataclass
class AnalystData:
    """Analyst recommendation data."""
    symbol: str
    recommendation: str  # strongBuy, buy, hold, sell, strongSell
    target_price: float
    current_price: float
    upside_pct: float
    num_analysts: int
    recommendation_score: float  # 0-1 normalized score


@dataclass
class FundamentalData:
    """Fundamental analysis data."""
    symbol: str
    pe_ratio: Optional[float]
    forward_pe: Optional[float]
    peg_ratio: Optional[float]
    price_to_book: Optional[float]
    revenue_growth: Optional[float]
    earnings_growth: Optional[float]
    profit_margin: Optional[float]
    operating_margin: Optional[float]
    roe: Optional[float]
    debt_to_equity: Optional[float]
    current_ratio: Optional[float]
    market_cap: Optional[float]
    dividend_yield: Optional[float]


@dataclass
class HistoricalPrice:
    """Historical price data."""
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adj_close: float


def _normalize_symbol(symbol: str) -> str:
    """
    Convert Tradernet symbol format to Yahoo Finance format.

    Tradernet uses: AAPL.US, SAP.DE, 7203.T
    Yahoo uses: AAPL, SAP.DE, 7203.T (US stocks don't need suffix)
    """
    if symbol.endswith(".US"):
        return symbol[:-3]  # Remove .US suffix for US stocks
    return symbol


def get_analyst_data(symbol: str) -> Optional[AnalystData]:
    """
    Get analyst recommendations and price targets.

    Args:
        symbol: Stock symbol (Tradernet format)

    Returns:
        AnalystData if available, None otherwise
    """
    yf_symbol = _normalize_symbol(symbol)

    try:
        ticker = yf.Ticker(yf_symbol)
        info = ticker.info

        # Get recommendation
        recommendation = info.get("recommendationKey", "hold")

        # Get price targets
        target_price = info.get("targetMeanPrice", 0) or 0
        current_price = info.get("currentPrice") or info.get("regularMarketPrice", 0) or 0

        # Calculate upside
        upside_pct = 0.0
        if current_price > 0 and target_price > 0:
            upside_pct = ((target_price - current_price) / current_price) * 100

        # Number of analysts
        num_analysts = info.get("numberOfAnalystOpinions", 0) or 0

        # Convert recommendation to score (0-1)
        rec_scores = {
            "strongBuy": 1.0,
            "buy": 0.8,
            "hold": 0.5,
            "sell": 0.2,
            "strongSell": 0.0,
        }
        recommendation_score = rec_scores.get(recommendation, 0.5)

        return AnalystData(
            symbol=symbol,
            recommendation=recommendation,
            target_price=target_price,
            current_price=current_price,
            upside_pct=upside_pct,
            num_analysts=num_analysts,
            recommendation_score=recommendation_score,
        )
    except Exception as e:
        logger.error(f"Failed to get analyst data for {symbol}: {e}")
        return None


def get_fundamental_data(symbol: str) -> Optional[FundamentalData]:
    """
    Get fundamental analysis data.

    Args:
        symbol: Stock symbol (Tradernet format)

    Returns:
        FundamentalData if available, None otherwise
    """
    yf_symbol = _normalize_symbol(symbol)

    try:
        ticker = yf.Ticker(yf_symbol)
        info = ticker.info

        return FundamentalData(
            symbol=symbol,
            pe_ratio=info.get("trailingPE"),
            forward_pe=info.get("forwardPE"),
            peg_ratio=info.get("pegRatio"),
            price_to_book=info.get("priceToBook"),
            revenue_growth=info.get("revenueGrowth"),
            earnings_growth=info.get("earningsGrowth"),
            profit_margin=info.get("profitMargins"),
            operating_margin=info.get("operatingMargins"),
            roe=info.get("returnOnEquity"),
            debt_to_equity=info.get("debtToEquity"),
            current_ratio=info.get("currentRatio"),
            market_cap=info.get("marketCap"),
            dividend_yield=info.get("dividendYield"),
        )
    except Exception as e:
        logger.error(f"Failed to get fundamental data for {symbol}: {e}")
        return None


def get_historical_prices(
    symbol: str,
    period: str = "1y"
) -> list[HistoricalPrice]:
    """
    Get historical price data.

    Args:
        symbol: Stock symbol (Tradernet format)
        period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

    Returns:
        List of HistoricalPrice objects
    """
    yf_symbol = _normalize_symbol(symbol)

    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period=period)

        result = []
        for date, row in hist.iterrows():
            result.append(HistoricalPrice(
                date=date.to_pydatetime(),
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=int(row["Volume"]),
                adj_close=float(row.get("Adj Close", row["Close"])),
            ))

        return result
    except Exception as e:
        logger.error(f"Failed to get historical prices for {symbol}: {e}")
        return []


def get_current_price(symbol: str) -> Optional[float]:
    """
    Get current stock price.

    Args:
        symbol: Stock symbol (Tradernet format)

    Returns:
        Current price or None
    """
    yf_symbol = _normalize_symbol(symbol)

    try:
        ticker = yf.Ticker(yf_symbol)
        info = ticker.info
        return info.get("currentPrice") or info.get("regularMarketPrice")
    except Exception as e:
        logger.error(f"Failed to get current price for {symbol}: {e}")
        return None


def get_batch_quotes(symbols: list[str]) -> dict[str, float]:
    """
    Get current prices for multiple symbols efficiently.

    Args:
        symbols: List of stock symbols (Tradernet format)

    Returns:
        Dict mapping symbol to current price
    """
    result = {}

    # Convert symbols
    yf_symbols = [_normalize_symbol(s) for s in symbols]
    symbol_map = dict(zip(yf_symbols, symbols))

    try:
        # Use yfinance download for batch efficiency
        data = yf.download(
            tickers=" ".join(yf_symbols),
            period="1d",
            progress=False,
            threads=True
        )

        if not data.empty:
            # Handle single vs multiple symbols
            if len(yf_symbols) == 1:
                yf_sym = yf_symbols[0]
                orig_sym = symbol_map[yf_sym]
                result[orig_sym] = float(data["Close"].iloc[-1])
            else:
                for yf_sym in yf_symbols:
                    orig_sym = symbol_map[yf_sym]
                    if yf_sym in data["Close"].columns:
                        price = data["Close"][yf_sym].iloc[-1]
                        if not pd.isna(price):
                            result[orig_sym] = float(price)

    except Exception as e:
        logger.error(f"Failed to get batch quotes: {e}")

    return result


# Import pandas for batch quotes
try:
    import pandas as pd
except ImportError:
    pd = None
