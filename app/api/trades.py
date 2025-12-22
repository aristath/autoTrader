"""Trade execution API endpoints."""

from datetime import datetime
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from app.database import get_db
from app.domain.constants import TRADE_SIDE_BUY, TRADE_SIDE_SELL
from app.infrastructure.dependencies import (
    get_portfolio_repository,
    get_position_repository,
    get_allocation_repository,
    get_trade_repository,
    get_stock_repository,
)
from app.domain.repositories import (
    PortfolioRepository,
    PositionRepository,
    AllocationRepository,
    TradeRepository,
    StockRepository,
)

router = APIRouter()


class TradeSide(str, Enum):
    """Trade side enumeration."""
    BUY = TRADE_SIDE_BUY
    SELL = TRADE_SIDE_SELL


class TradeRequest(BaseModel):
    symbol: str = Field(..., min_length=1, description="Stock symbol")
    side: TradeSide = Field(..., description="Trade side: BUY or SELL")
    quantity: float = Field(..., gt=0, description="Quantity to trade (must be positive)")

    @field_validator('symbol')
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        """Validate and normalize symbol."""
        return v.upper().strip()

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: float) -> float:
        """Validate quantity is reasonable."""
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        if v > 1000000:  # Reasonable upper limit
            raise ValueError("Quantity exceeds maximum allowed (1,000,000)")
        return v


class RebalancePreview(BaseModel):
    deposit_amount: float = Field(..., gt=0, description="Deposit amount in EUR (must be positive)")

    @field_validator('deposit_amount')
    @classmethod
    def validate_deposit_amount(cls, v: float) -> float:
        """Validate deposit amount is reasonable."""
        if v <= 0:
            raise ValueError("Deposit amount must be greater than 0")
        if v > 1000000:  # Reasonable upper limit
            raise ValueError("Deposit amount exceeds maximum allowed (€1,000,000)")
        return v


@router.get("")
async def get_trades(
    limit: int = 50,
    trade_repo: TradeRepository = Depends(get_trade_repository),
):
    """Get trade history."""
    trades = await trade_repo.get_history(limit=limit)
    return [
        {
            "id": None,  # Not in domain model
            "symbol": t.symbol,
            "side": t.side,
            "quantity": t.quantity,
            "price": t.price,
            "executed_at": t.executed_at.isoformat() if t.executed_at else None,
            "order_id": t.order_id,
        }
        for t in trades
    ]


@router.post("/execute")
async def execute_trade(
    trade: TradeRequest,
    stock_repo: StockRepository = Depends(get_stock_repository),
    trade_repo: TradeRepository = Depends(get_trade_repository),
):
    """Execute a manual trade."""
    # Side is now validated by Pydantic enum

    # Check stock exists
    stock = await stock_repo.get_by_symbol(trade.symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    from app.services.tradernet import get_tradernet_client
    from app.domain.repositories import Trade

    client = get_tradernet_client()
    if not client.is_connected:
        raise HTTPException(status_code=503, detail="Tradernet not connected")

    result = client.place_order(
        symbol=trade.symbol,
        side=trade.side,
        quantity=trade.quantity,
    )

    if result:
        # Record trade using repository
        trade_record = Trade(
            symbol=trade.symbol,
            side=trade.side,
            quantity=trade.quantity,
            price=result.price,
            executed_at=datetime.now(),
            order_id=result.order_id,
        )
        await trade_repo.create(trade_record)

        return {
            "status": "success",
            "order_id": result.order_id,
            "symbol": trade.symbol,
            "side": trade.side,
            "quantity": trade.quantity,
            "price": result.price,
        }

    raise HTTPException(status_code=500, detail="Trade execution failed")


@router.get("/allocation")
async def get_allocation(
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository),
    position_repo: PositionRepository = Depends(get_position_repository),
    allocation_repo: AllocationRepository = Depends(get_allocation_repository),
):
    """Get current portfolio allocation vs targets."""
    from app.application.services.portfolio_service import PortfolioService

    portfolio_service = PortfolioService(
        portfolio_repo,
        position_repo,
        allocation_repo,
    )
    summary = await portfolio_service.get_portfolio_summary()

    return {
        "total_value": summary.total_value,
        "cash_balance": summary.cash_balance,
        "geographic": [
            {
                "name": a.name,
                "target_pct": a.target_pct,
                "current_pct": a.current_pct,
                "current_value": a.current_value,
                "deviation": a.deviation,
            }
            for a in summary.geographic_allocations
        ],
        "industry": [
            {
                "name": a.name,
                "target_pct": a.target_pct,
                "current_pct": a.current_pct,
                "current_value": a.current_value,
                "deviation": a.deviation,
            }
            for a in summary.industry_allocations
        ],
    }


@router.post("/rebalance/preview")
async def preview_rebalance(
    request: RebalancePreview,
    stock_repo: StockRepository = Depends(get_stock_repository),
    position_repo: PositionRepository = Depends(get_position_repository),
    allocation_repo: AllocationRepository = Depends(get_allocation_repository),
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository),
):
    """Preview rebalance trades for deposit."""
    from app.application.services.rebalancing_service import RebalancingService

    deposit = request.deposit_amount

    try:
        rebalancing_service = RebalancingService(
            stock_repo,
            position_repo,
            allocation_repo,
            portfolio_repo,
        )
        trades = await rebalancing_service.calculate_rebalance_trades(deposit)

        return {
            "deposit_amount": deposit,
            "total_trades": len(trades),
            "total_value": sum(t.estimated_value for t in trades),
            "trades": [
                {
                    "symbol": t.symbol,
                    "name": t.name,
                    "side": t.side,
                    "quantity": t.quantity,
                    "estimated_price": t.estimated_price,
                    "estimated_value": t.estimated_value,
                    "reason": t.reason,
                }
                for t in trades
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rebalance/execute")
async def execute_rebalance(
    request: RebalancePreview,
    db: aiosqlite.Connection = Depends(get_db),
    stock_repo: StockRepository = Depends(get_stock_repository),
    position_repo: PositionRepository = Depends(get_position_repository),
    allocation_repo: AllocationRepository = Depends(get_allocation_repository),
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository),
    trade_repo: TradeRepository = Depends(get_trade_repository),
):
    """Execute rebalance trades."""
    from app.application.services.rebalancing_service import RebalancingService
    from app.application.services.trade_execution_service import TradeExecutionService

    deposit = request.deposit_amount

    try:
        # Calculate trades using application service
        rebalancing_service = RebalancingService(
            stock_repo,
            position_repo,
            allocation_repo,
            portfolio_repo,
        )
        trades = await rebalancing_service.calculate_rebalance_trades(deposit)

        if not trades:
            return {
                "status": "no_trades",
                "message": "No rebalance trades needed",
            }

        # Execute trades using application service with transaction support
        trade_execution_service = TradeExecutionService(trade_repo, db=db)
        results = await trade_execution_service.execute_trades(trades, use_transaction=True)

        successful = sum(1 for r in results if r["status"] == "success")
        failed = sum(1 for r in results if r["status"] != "success")

        return {
            "status": "completed",
            "successful_trades": successful,
            "failed_trades": failed,
            "results": results,
        }

    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
