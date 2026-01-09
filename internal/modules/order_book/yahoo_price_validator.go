package order_book

import (
	"fmt"

	"github.com/aristath/sentinel/internal/clients/yahoo"
	"github.com/rs/zerolog"
)

// YahooPriceValidator implements PriceValidator using Yahoo Finance as data source
// This adapter isolates Yahoo-specific logic from the business layer
type YahooPriceValidator struct {
	yahooClient yahoo.FullClientInterface
	log         zerolog.Logger
}

// NewYahooPriceValidator creates a new Yahoo Finance price validator
func NewYahooPriceValidator(yahooClient yahoo.FullClientInterface, log zerolog.Logger) *YahooPriceValidator {
	return &YahooPriceValidator{
		yahooClient: yahooClient,
		log:         log.With().Str("component", "yahoo_price_validator").Logger(),
	}
}

// GetValidationPrice implements PriceValidator interface
// Fetches current price from Yahoo Finance with automatic retries
func (v *YahooPriceValidator) GetValidationPrice(symbol string) (*float64, error) {
	// Transform broker symbol to Yahoo symbol
	// Example: "AAPL.US" → "AAPL"
	yahooSymbol := v.extractYahooSymbol(symbol)

	v.log.Debug().
		Str("broker_symbol", symbol).
		Str("yahoo_symbol", yahooSymbol).
		Msg("Fetching validation price from Yahoo Finance")

	// Fetch with 3 retries (handles transient failures)
	price, err := v.yahooClient.GetCurrentPrice(symbol, &yahooSymbol, 3)
	if err != nil {
		v.log.Warn().
			Err(err).
			Str("symbol", symbol).
			Msg("Failed to fetch Yahoo price after retries")
		return nil, fmt.Errorf("yahoo price unavailable: %w", err)
	}

	// Validate price
	if price == nil {
		v.log.Warn().Str("symbol", symbol).Msg("Yahoo returned nil price")
		return nil, fmt.Errorf("yahoo returned nil price for %s", symbol)
	}

	if *price <= 0 {
		v.log.Warn().
			Str("symbol", symbol).
			Float64("price", *price).
			Msg("Yahoo returned invalid price")
		return nil, fmt.Errorf("yahoo returned invalid price: %.2f", *price)
	}

	v.log.Debug().
		Str("symbol", symbol).
		Float64("price", *price).
		Msg("Successfully fetched Yahoo validation price")

	return price, nil
}

// extractYahooSymbol transforms broker symbol to Yahoo Finance symbol
// Yahoo Finance uses simplified symbols without exchange suffix
//
// Examples:
//   - "AAPL.US" → "AAPL"
//   - "TSLA.US" → "TSLA"
//   - "IBM" → "IBM" (no change if no suffix)
//
// This is Yahoo-specific logic and properly belongs in the adapter layer
func (v *YahooPriceValidator) extractYahooSymbol(symbol string) string {
	// Find the first dot and extract everything before it
	for i, c := range symbol {
		if c == '.' {
			return symbol[:i]
		}
	}

	// No dot found, return as-is
	return symbol
}
