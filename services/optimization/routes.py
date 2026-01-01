"""REST API routes for Optimization service."""

from fastapi import APIRouter, Depends

from app.modules.optimization.services.local_optimization_service import (
    LocalOptimizationService,
)
from app.modules.optimization.services.optimization_service_interface import (
    AllocationTarget,
)
from services.optimization.dependencies import get_optimization_service
from services.optimization.models import (
    AllocationChange,
    CalculateRebalancingRequest,
    CalculateRebalancingResponse,
    ExecutionPlan,
    HealthResponse,
    OptimizeAllocationRequest,
    OptimizeAllocationResponse,
    OptimizeExecutionRequest,
    OptimizeExecutionResponse,
)

router = APIRouter()


@router.post("/allocation", response_model=OptimizeAllocationResponse)
async def optimize_allocation(
    request: OptimizeAllocationRequest,
    service: LocalOptimizationService = Depends(get_optimization_service),
):
    """
    Optimize portfolio allocation.

    Args:
        request: Allocation optimization request
        service: Optimization service instance

    Returns:
        Recommended allocation changes
    """
    # Calculate current weights from positions
    total_value = sum(p.market_value for p in request.current_positions)
    current_weights = {}
    if total_value > 0:
        for p in request.current_positions:
            weight = p.market_value / total_value
            current_weights[p.isin] = weight

    # Convert to domain targets
    targets = [
        AllocationTarget(
            isin=t.isin,
            symbol=t.symbol,
            target_weight=t.target_weight,
            current_weight=current_weights.get(t.isin, 0.0),
        )
        for t in request.target_allocations
    ]

    # Optimize allocation
    result = await service.optimize_allocation(
        targets=targets,
        available_cash=request.available_cash,
    )

    # Convert domain result to response
    changes = [
        AllocationChange(
            isin=change.get("isin", ""),
            symbol=change.get("symbol", ""),
            quantity_change=change.get("quantity_change", 0.0),
        )
        for change in result.recommended_changes
    ]

    return OptimizeAllocationResponse(
        success=result.success,
        changes=changes,
        objective_value=result.objective_value or 0.0,
        solver_status=result.message,
    )


@router.post("/execution", response_model=OptimizeExecutionResponse)
async def optimize_execution(
    request: OptimizeExecutionRequest,
    service: LocalOptimizationService = Depends(get_optimization_service),
):
    """
    Optimize trade execution.

    Args:
        request: Execution optimization request
        service: Optimization service instance

    Returns:
        Execution plans for trades
    """
    # Simple execution optimization: sort trades by priority
    # Full implementation would consider slippage, timing, etc.
    execution_plans = []

    for trade in request.trades:
        # Create execution plan for each trade
        plan = ExecutionPlan(
            trade_id=f"{trade.isin}_plan",
            isin=trade.isin,
            symbol=trade.symbol,
            total_quantity=trade.quantity,
            slice_count=1,  # Execute all at once for now
            estimated_slippage=0.001,  # 0.1% slippage estimate
        )
        execution_plans.append(plan)

    return OptimizeExecutionResponse(
        success=True,
        execution_plans=execution_plans,
    )


@router.post("/rebalancing", response_model=CalculateRebalancingResponse)
async def calculate_rebalancing(
    request: CalculateRebalancingRequest,
    service: LocalOptimizationService = Depends(get_optimization_service),
):
    """
    Calculate optimal rebalancing.

    Args:
        request: Rebalancing request
        service: Optimization service instance

    Returns:
        Rebalancing recommendations
    """
    targets = [
        AllocationTarget(
            isin=t.isin,
            symbol=t.symbol,
            target_weight=t.target_weight,
            current_weight=0.0,
        )
        for t in request.target_allocations
    ]

    result = await service.calculate_rebalancing(
        targets=targets,
        available_cash=request.available_cash,
    )

    changes = [
        AllocationChange(
            isin=change.get("isin", ""),
            symbol=change.get("symbol", ""),
            quantity_change=change.get("quantity_change", 0.0),
        )
        for change in result.recommended_changes
    ]

    return CalculateRebalancingResponse(
        needs_rebalancing=result.success,
        changes=changes,
        total_drift_pct=0.0,
    )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns:
        Service health status
    """
    return HealthResponse(
        healthy=True,
        version="1.0.0",
        status="OK",
        checks={},
    )
