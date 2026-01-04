package cash_utils

import (
	"fmt"
	"strings"
)

// MakeCashSymbol creates synthetic symbol for cash position
// Format: "CASH:{CURRENCY}"
// Examples: "CASH:EUR", "CASH:USD"
func MakeCashSymbol(currency string) string {
	return fmt.Sprintf("CASH:%s", strings.ToUpper(currency))
}

// IsCashSymbol checks if a symbol represents a cash position
func IsCashSymbol(symbol string) bool {
	return strings.HasPrefix(symbol, "CASH:")
}

// ParseCashSymbol extracts currency from cash symbol
// Returns (currency, error)
// Returns error if symbol is not a valid cash symbol
func ParseCashSymbol(symbol string) (string, error) {
	if !IsCashSymbol(symbol) {
		return "", fmt.Errorf("not a cash symbol: %s", symbol)
	}

	parts := strings.Split(symbol, ":")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid cash symbol format: %s (expected CASH:CURRENCY)", symbol)
	}

	currency := parts[1]

	if currency == "" {
		return "", fmt.Errorf("empty currency in cash symbol: %s", symbol)
	}

	return currency, nil
}

// GetCashSecurityName generates human-readable name for cash security
// Examples: "Cash (EUR)", "Cash (USD)"
func GetCashSecurityName(currency string) string {
	return fmt.Sprintf("Cash (%s)", strings.ToUpper(currency))
}
