"""Tradernet (Freedom24) API client service."""

import logging
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass

from tradernet import TraderNetAPI, TraderNetSymbol, Trading

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class Position:
    """Portfolio position."""
    symbol: str
    quantity: float
    avg_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float


@dataclass
class Quote:
    """Stock quote data."""
    symbol: str
    price: float
    change: float
    change_pct: float
    volume: int
    timestamp: datetime


@dataclass
class OHLC:
    """OHLC candle data."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


@dataclass
class OrderResult:
    """Order execution result."""
    order_id: str
    symbol: str
    side: str
    quantity: float
    price: float
    status: str


class TradernetClient:
    """Client for Tradernet/Freedom24 API."""

    def __init__(self):
        """Initialize the Tradernet client."""
        self._client: Optional[TraderNetAPI] = None
        self._trading: Optional[Trading] = None
        self._connected = False

    def connect(self) -> bool:
        """Connect to Tradernet API."""
        if not settings.tradernet_api_key or not settings.tradernet_api_secret:
            logger.warning("Tradernet API credentials not configured")
            return False

        try:
            self._client = TraderNetAPI(
                settings.tradernet_api_key,
                settings.tradernet_api_secret
            )
            self._trading = Trading(self._client)
            # Test connection - the API validates on first request
            self._connected = True
            logger.info("Connected to Tradernet API")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Tradernet: {e}")
            self._connected = False
            return False

    @property
    def is_connected(self) -> bool:
        """Check if client is connected."""
        return self._connected and self._client is not None

    def get_user_info(self) -> dict:
        """Get user account information."""
        if not self.is_connected:
            raise ConnectionError("Not connected to Tradernet")
        # TraderNetAPI may have different method names
        try:
            return self._client.get_user_info()
        except AttributeError:
            return {}

    def get_portfolio(self) -> list[Position]:
        """Get current portfolio positions."""
        if not self.is_connected:
            raise ConnectionError("Not connected to Tradernet")

        try:
            # The SDK provides portfolio data through user_info
            user_data = self._client.user_info()
            positions = []

            # Parse portfolio from user data
            # Note: Actual structure depends on API response
            portfolio_data = user_data.get("portfolio", [])
            for item in portfolio_data:
                positions.append(Position(
                    symbol=item.get("ticker", ""),
                    quantity=float(item.get("qty", 0)),
                    avg_price=float(item.get("avg_price", 0)),
                    current_price=float(item.get("last_price", 0)),
                    market_value=float(item.get("market_value", 0)),
                    unrealized_pnl=float(item.get("unrealized_pnl", 0)),
                    unrealized_pnl_pct=float(item.get("unrealized_pnl_pct", 0)),
                ))

            return positions
        except Exception as e:
            logger.error(f"Failed to get portfolio: {e}")
            return []

    def get_cash_balance(self) -> float:
        """Get available cash balance."""
        if not self.is_connected:
            raise ConnectionError("Not connected to Tradernet")

        try:
            user_data = self._client.user_info()
            return float(user_data.get("cash", 0))
        except Exception as e:
            logger.error(f"Failed to get cash balance: {e}")
            return 0.0

    def get_quote(self, symbol: str) -> Optional[Quote]:
        """Get current quote for a symbol."""
        if not self.is_connected:
            raise ConnectionError("Not connected to Tradernet")

        try:
            ts = TradernetSymbol(symbol, self._client)
            data = ts.get_data()

            return Quote(
                symbol=symbol,
                price=float(data.get("last_price", 0)),
                change=float(data.get("change", 0)),
                change_pct=float(data.get("change_pct", 0)),
                volume=int(data.get("volume", 0)),
                timestamp=datetime.now(),
            )
        except Exception as e:
            logger.error(f"Failed to get quote for {symbol}: {e}")
            return None

    def get_historical_prices(
        self,
        symbol: str,
        days: int = 200
    ) -> list[OHLC]:
        """Get historical OHLC data for a symbol."""
        if not self.is_connected:
            raise ConnectionError("Not connected to Tradernet")

        try:
            ts = TradernetSymbol(symbol, self._client)
            data = ts.get_data()

            candles = data.candles if hasattr(data, 'candles') else []
            timestamps = data.timestamps if hasattr(data, 'timestamps') else []

            result = []
            for i, candle in enumerate(candles):
                if i < len(timestamps):
                    result.append(OHLC(
                        timestamp=datetime.fromtimestamp(timestamps[i]),
                        open=float(candle.get("o", 0)),
                        high=float(candle.get("h", 0)),
                        low=float(candle.get("l", 0)),
                        close=float(candle.get("c", 0)),
                        volume=int(candle.get("v", 0)),
                    ))

            return result[-days:] if len(result) > days else result
        except Exception as e:
            logger.error(f"Failed to get historical prices for {symbol}: {e}")
            return []

    def place_order(
        self,
        symbol: str,
        side: str,
        quantity: float,
        order_type: str = "market",
        limit_price: Optional[float] = None
    ) -> Optional[OrderResult]:
        """
        Place an order.

        Args:
            symbol: Stock symbol (e.g., "AAPL.US")
            side: "BUY" or "SELL"
            quantity: Number of shares
            order_type: "market" or "limit"
            limit_price: Price for limit orders

        Returns:
            OrderResult if successful, None otherwise
        """
        if not self.is_connected or not self._trading:
            raise ConnectionError("Not connected to Tradernet")

        try:
            if side.upper() == "BUY":
                result = self._trading.buy(symbol, quantity)
            elif side.upper() == "SELL":
                result = self._trading.sell(symbol, quantity)
            else:
                raise ValueError(f"Invalid side: {side}")

            # Handle different response formats
            if isinstance(result, dict):
                return OrderResult(
                    order_id=str(result.get("order_id", result.get("orderId", ""))),
                    symbol=symbol,
                    side=side.upper(),
                    quantity=quantity,
                    price=float(result.get("price", 0)),
                    status=result.get("status", "submitted"),
                )
            return OrderResult(
                order_id=str(result) if result else "",
                symbol=symbol,
                side=side.upper(),
                quantity=quantity,
                price=0,
                status="submitted",
            )
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            return None

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order."""
        if not self.is_connected or not self._trading:
            raise ConnectionError("Not connected to Tradernet")

        try:
            self._trading.cancel(order_id)
            return True
        except Exception as e:
            logger.error(f"Failed to cancel order {order_id}: {e}")
            return False


# Singleton instance
_client: Optional[TradernetClient] = None


def get_tradernet_client() -> TradernetClient:
    """Get or create the Tradernet client singleton."""
    global _client
    if _client is None:
        _client = TradernetClient()
    return _client
