"""Local Generator Service - Domain service wrapper for sequence generation."""

from typing import AsyncIterator, Dict, List

from app.modules.planning.domain.holistic_planner import generate_action_sequences
from app.modules.planning.domain.models import ActionCandidate
from services.generator.models import (
    ActionCandidateModel,
    GenerateSequencesRequest,
    SequenceBatch,
)


class LocalGeneratorService:
    """
    Service for generating and filtering action sequences.

    Wraps the sequence generation logic from holistic_planner.py
    for use by the Generator microservice.
    """

    def __init__(self):
        """Initialize the service."""
        pass

    async def generate_sequences_batched(
        self, request: GenerateSequencesRequest
    ) -> AsyncIterator[SequenceBatch]:
        """
        Generate action sequences from opportunities and yield in batches.

        Uses combinatorial generation with adaptive patterns, then applies
        filters (correlation-aware, feasibility), and yields results in
        batches for streaming to evaluators.

        Args:
            request: Opportunities, settings, and batch size

        Yields:
            SequenceBatch objects containing sequences
        """
        # Convert Pydantic opportunities to domain format
        opportunities: Dict[str, List[ActionCandidate]] = {
            "profit_taking": [
                self._action_candidate_from_model(a)
                for a in request.opportunities.profit_taking
            ],
            "averaging_down": [
                self._action_candidate_from_model(a)
                for a in request.opportunities.averaging_down
            ],
            "rebalance_sells": [
                self._action_candidate_from_model(a)
                for a in request.opportunities.rebalance_sells
            ],
            "rebalance_buys": [
                self._action_candidate_from_model(a)
                for a in request.opportunities.rebalance_buys
            ],
            "opportunity_buys": [
                self._action_candidate_from_model(a)
                for a in request.opportunities.opportunity_buys
            ],
        }

        # Call domain logic to generate sequences
        all_sequences = await generate_action_sequences(
            opportunities=opportunities,
            available_cash=request.feasibility.available_cash,
            max_depth=request.combinatorial.max_depth,
            enable_combinatorial=request.combinatorial.enable_weighted_combinations,
        )

        # Apply feasibility filtering
        feasible_sequences = self._apply_feasibility_filter(
            all_sequences, request.feasibility
        )

        # Yield in batches
        batch_size = request.batch_size
        total_batches = max(1, (len(feasible_sequences) + batch_size - 1) // batch_size)

        for batch_number in range(total_batches):
            start_idx = batch_number * batch_size
            end_idx = min(start_idx + batch_size, len(feasible_sequences))
            batch_sequences = feasible_sequences[start_idx:end_idx]

            # Convert domain models to Pydantic
            pydantic_sequences = [
                [self._action_candidate_to_model(action) for action in sequence]
                for sequence in batch_sequences
            ]

            yield SequenceBatch(
                batch_number=batch_number,
                sequences=pydantic_sequences,
                total_batches=total_batches,
                more_available=batch_number < total_batches - 1,
            )

    def _apply_feasibility_filter(
        self, sequences: List[List[ActionCandidate]], feasibility
    ) -> List[List[ActionCandidate]]:
        """
        Filter sequences by feasibility (cash requirements).

        Args:
            sequences: Generated sequences
            feasibility: Feasibility settings

        Returns:
            Filtered sequences that are feasible
        """
        feasible = []
        for sequence in sequences:
            # Calculate total cash required for sequence
            cash_required = 0.0
            cash_generated = 0.0

            for action in sequence:
                trade_cost = (
                    feasibility.transaction_cost_fixed
                    + action.value_eur * feasibility.transaction_cost_percent
                )

                side_str = (
                    action.side.value
                    if hasattr(action.side, "value")
                    else str(action.side)
                )
                if side_str == "BUY":
                    cash_required += action.value_eur + trade_cost
                else:  # SELL
                    cash_generated += action.value_eur - trade_cost

            net_cash_required = cash_required - cash_generated

            # Check if sequence is feasible
            if net_cash_required <= feasibility.available_cash:
                # Also check minimum trade value
                all_above_min = all(
                    action.value_eur >= feasibility.min_trade_value
                    for action in sequence
                )
                if all_above_min:
                    feasible.append(sequence)

        return feasible

    def _action_candidate_from_model(
        self, model: ActionCandidateModel
    ) -> ActionCandidate:
        """
        Convert Pydantic model to domain ActionCandidate.

        Args:
            model: Pydantic ActionCandidateModel

        Returns:
            Domain ActionCandidate
        """
        from app.domain.value_objects.trade_side import TradeSide

        return ActionCandidate(
            side=TradeSide(model.side),
            symbol=model.symbol,
            name=model.name,
            quantity=model.quantity,
            price=model.price,
            value_eur=model.value_eur,
            currency=model.currency,
            priority=model.priority,
            reason=model.reason,
            tags=model.tags,
        )

    def _action_candidate_to_model(
        self, action: ActionCandidate
    ) -> ActionCandidateModel:
        """
        Convert domain ActionCandidate to Pydantic model.

        Args:
            action: Domain ActionCandidate

        Returns:
            ActionCandidateModel for API response
        """
        return ActionCandidateModel(
            side=action.side.value if hasattr(action.side, "value") else action.side,
            symbol=action.symbol,
            name=action.name,
            quantity=action.quantity,
            price=action.price,
            value_eur=action.value_eur,
            currency=action.currency,
            priority=action.priority,
            reason=action.reason,
            tags=action.tags if hasattr(action, "tags") else [],
        )
