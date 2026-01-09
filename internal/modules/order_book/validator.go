package order_book

import (
	"fmt"

	"github.com/aristath/sentinel/internal/domain"
)

// validateSufficientLiquidity checks if sufficient liquidity exists in the order book
// Ensures we have enough depth to execute the trade without excessive slippage
func (s *Service) validateSufficientLiquidity(orderBook *domain.BrokerOrderBook, side string, quantity float64) error {
	if orderBook == nil {
		return fmt.Errorf("order book is nil")
	}

	// Get settings
	minLiquidityMultiple := s.getSettingFloat("min_liquidity_multiple", 2.0)
	depthLevels := int(s.getSettingFloat("order_book_depth_levels", 5.0))

	// Required liquidity (e.g., 2x the trade quantity)
	requiredLiquidity := quantity * minLiquidityMultiple

	// Select the appropriate side of the book
	var levels []domain.OrderBookLevel
	if side == "BUY" {
		// For buying, we need asks (sell orders)
		levels = orderBook.Asks
	} else if side == "SELL" {
		// For selling, we need bids (buy orders)
		levels = orderBook.Bids
	} else {
		return fmt.Errorf("invalid side: %s (must be BUY or SELL)", side)
	}

	// Check if we have any levels
	if len(levels) == 0 {
		return fmt.Errorf("no %s orders in order book for %s", getBookSideName(side), orderBook.Symbol)
	}

	// Sum up available liquidity across depth levels
	availableLiquidity := 0.0
	levelsToCheck := min(depthLevels, len(levels))

	for i := 0; i < levelsToCheck; i++ {
		availableLiquidity += levels[i].Quantity
	}

	// Check if we have sufficient liquidity
	if availableLiquidity < requiredLiquidity {
		return fmt.Errorf(
			"insufficient liquidity for %s %s: need %.2f (%.1fx of %.2f), but only %.2f available in top %d levels",
			side, orderBook.Symbol,
			requiredLiquidity, minLiquidityMultiple, quantity,
			availableLiquidity, levelsToCheck,
		)
	}

	s.log.Info().
		Str("symbol", orderBook.Symbol).
		Str("side", side).
		Float64("quantity", quantity).
		Float64("required_liquidity", requiredLiquidity).
		Float64("available_liquidity", availableLiquidity).
		Int("levels_checked", levelsToCheck).
		Msg("Liquidity validation passed")

	return nil
}

// getBookSideName returns human-readable name for order book side
func getBookSideName(tradeSide string) string {
	if tradeSide == "BUY" {
		return "ask" // When buying, we take from asks
	}
	return "bid" // When selling, we take from bids
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
