package cash_utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMakeCashSymbol(t *testing.T) {
	tests := []struct {
		name        string
		currency    string
		want        string
		description string
	}{
		{
			name:        "EUR currency",
			currency:    "EUR",
			want:        "CASH:EUR",
			description: "Standard EUR cash symbol",
		},
		{
			name:        "USD currency",
			currency:    "USD",
			want:        "CASH:USD",
			description: "USD cash symbol",
		},
		{
			name:        "currency is uppercased",
			currency:    "eur",
			want:        "CASH:EUR",
			description: "Currency should be converted to uppercase",
		},
		{
			name:        "mixed case currency",
			currency:    "UsD",
			want:        "CASH:USD",
			description: "Mixed case currency should be uppercased",
		},
		{
			name:        "GBP currency",
			currency:    "GBP",
			want:        "CASH:GBP",
			description: "GBP currency support",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := MakeCashSymbol(tt.currency)
			assert.Equal(t, tt.want, got, tt.description)
		})
	}
}

func TestIsCashSymbol(t *testing.T) {
	tests := []struct {
		name        string
		symbol      string
		want        bool
		description string
	}{
		{
			name:        "valid EUR cash symbol",
			symbol:      "CASH:EUR",
			want:        true,
			description: "Valid cash symbol should return true",
		},
		{
			name:        "valid USD cash symbol",
			symbol:      "CASH:USD",
			want:        true,
			description: "Valid USD cash symbol should return true",
		},
		{
			name:        "regular stock symbol",
			symbol:      "AAPL",
			want:        false,
			description: "Regular stock symbol should return false",
		},
		{
			name:        "symbol starting with CASH but not cash",
			symbol:      "CASHIER",
			want:        false,
			description: "Symbol starting with CASH but not prefix should return false",
		},
		{
			name:        "empty string",
			symbol:      "",
			want:        false,
			description: "Empty string should return false",
		},
		{
			name:        "cash lowercase prefix",
			symbol:      "cash:EUR:core",
			want:        false,
			description: "Lowercase prefix should return false (must be uppercase CASH:)",
		},
		{
			name:        "symbol containing CASH: but not at start",
			symbol:      "SYMBOL:CASH:EUR",
			want:        false,
			description: "CASH: must be at the start of the symbol",
		},
		{
			name:        "just CASH: prefix",
			symbol:      "CASH:",
			want:        true,
			description: "CASH: prefix alone should return true (format validation happens in ParseCashSymbol)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsCashSymbol(tt.symbol)
			assert.Equal(t, tt.want, got, tt.description)
		})
	}
}

func TestParseCashSymbol(t *testing.T) {
	tests := []struct {
		name         string
		symbol       string
		wantCurrency string
		wantErr      bool
		errContains  string
		description  string
	}{
		{
			name:         "valid EUR symbol",
			symbol:       "CASH:EUR",
			wantCurrency: "EUR",
			wantErr:      false,
			description:  "Valid cash symbol should parse correctly",
		},
		{
			name:         "valid USD symbol",
			symbol:       "CASH:USD",
			wantCurrency: "USD",
			wantErr:      false,
			description:  "Valid USD symbol should parse correctly",
		},
		{
			name:         "not a cash symbol",
			symbol:       "AAPL",
			wantCurrency: "",
			wantErr:      true,
			errContains:  "not a cash symbol",
			description:  "Non-cash symbol should return error",
		},
		{
			name:         "invalid format - too few parts",
			symbol:       "CASH",
			wantCurrency: "",
			wantErr:      true,
			errContains:  "not a cash symbol",
			description:  "Symbol without colon should return 'not a cash symbol' error",
		},
		{
			name:         "invalid format - too many parts",
			symbol:       "CASH:EUR:core",
			wantCurrency: "",
			wantErr:      true,
			errContains:  "invalid cash symbol format",
			description:  "Symbol with 3 parts should return format error",
		},
		{
			name:         "empty currency",
			symbol:       "CASH:",
			wantCurrency: "",
			wantErr:      true,
			errContains:  "empty currency",
			description:  "Empty currency should return error",
		},
		{
			name:         "empty string",
			symbol:       "",
			wantCurrency: "",
			wantErr:      true,
			errContains:  "not a cash symbol",
			description:  "Empty string should return error",
		},
		{
			name:         "currency with spaces",
			symbol:       "CASH:EUR ",
			wantCurrency: "EUR ",
			wantErr:      false,
			description:  "Currency with trailing space should be parsed (may want to trim in future)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotCurrency, err := ParseCashSymbol(tt.symbol)

			if tt.wantErr {
				assert.Error(t, err, tt.description)
				if tt.errContains != "" {
					assert.Contains(t, err.Error(), tt.errContains, "Error message should contain expected text")
				}
				assert.Empty(t, gotCurrency, "Currency should be empty on error")
			} else {
				assert.NoError(t, err, tt.description)
				assert.Equal(t, tt.wantCurrency, gotCurrency, "Currency mismatch: %s", tt.description)
			}
		})
	}
}

func TestParseCashSymbol_RoundTrip(t *testing.T) {
	// Test that MakeCashSymbol and ParseCashSymbol are inverse operations
	tests := []struct {
		name     string
		currency string
	}{
		{"EUR", "EUR"},
		{"USD", "USD"},
		{"GBP", "GBP"},
		{"CHF", "CHF"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			symbol := MakeCashSymbol(tt.currency)
			parsedCurrency, err := ParseCashSymbol(symbol)

			assert.NoError(t, err, "Round-trip parsing should not error")
			assert.Equal(t, tt.currency, parsedCurrency, "Currency should match after round-trip")
		})
	}
}

func TestGetCashSecurityName(t *testing.T) {
	tests := []struct {
		name        string
		currency    string
		want        string
		description string
	}{
		{
			name:        "EUR currency",
			currency:    "EUR",
			want:        "Cash (EUR)",
			description: "Standard format for EUR",
		},
		{
			name:        "USD currency",
			currency:    "USD",
			want:        "Cash (USD)",
			description: "Standard format for USD",
		},
		{
			name:        "currency is uppercased",
			currency:    "eur",
			want:        "Cash (EUR)",
			description: "Currency should be converted to uppercase",
		},
		{
			name:        "mixed case currency",
			currency:    "UsD",
			want:        "Cash (USD)",
			description: "Mixed case currency should be uppercased",
		},
		{
			name:        "GBP currency",
			currency:    "GBP",
			want:        "Cash (GBP)",
			description: "GBP currency support",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GetCashSecurityName(tt.currency)
			assert.Equal(t, tt.want, got, tt.description)
		})
	}
}
