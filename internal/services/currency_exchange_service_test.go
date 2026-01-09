package services

import (
	"testing"

	"github.com/aristath/sentinel/internal/domain"
	"github.com/aristath/sentinel/pkg/logger"
	"github.com/stretchr/testify/assert"
)

func TestCurrencyExchangeService_GetAvailableCurrencies(t *testing.T) {
	service := &CurrencyExchangeService{}
	currencies := service.GetAvailableCurrencies()

	// Should include all currencies from DirectPairs
	expectedCurrencies := map[string]bool{
		"EUR": true,
		"USD": true,
		"GBP": true,
		"HKD": true,
	}

	assert.GreaterOrEqual(t, len(currencies), 4, "Should return at least 4 currencies")

	for _, curr := range currencies {
		assert.True(t, expectedCurrencies[curr], "Currency %s should be in expected list", curr)
		delete(expectedCurrencies, curr)
	}

	// All expected currencies should have been found
	for curr := range expectedCurrencies {
		t.Errorf("Expected currency %s not found in result", curr)
	}
}

func TestCurrencyExchangeService_GetConversionPath(t *testing.T) {
	service := &CurrencyExchangeService{}

	tests := []struct {
		name          string
		from          string
		to            string
		expectedSteps int
		expectedErr   bool
		description   string
	}{
		{
			name:          "same currency",
			from:          "EUR",
			to:            "EUR",
			expectedSteps: 0,
			expectedErr:   false,
			description:   "Same currency should return empty path",
		},
		{
			name:          "direct EUR to USD",
			from:          "EUR",
			to:            "USD",
			expectedSteps: 1,
			expectedErr:   false,
			description:   "Direct pair should return single step",
		},
		{
			name:          "direct USD to EUR",
			from:          "USD",
			to:            "EUR",
			expectedSteps: 1,
			expectedErr:   false,
			description:   "Direct pair reverse should return single step",
		},
		{
			name:          "direct GBP to EUR",
			from:          "GBP",
			to:            "EUR",
			expectedSteps: 1,
			expectedErr:   false,
			description:   "Direct GBP-EUR pair",
		},
		{
			name:          "GBP to HKD via EUR",
			from:          "GBP",
			to:            "HKD",
			expectedSteps: 2,
			expectedErr:   false,
			description:   "GBP-HKD should route via EUR",
		},
		{
			name:          "HKD to GBP via EUR",
			from:          "HKD",
			to:            "GBP",
			expectedSteps: 2,
			expectedErr:   false,
			description:   "HKD-GBP should route via EUR",
		},
		{
			name:          "invalid currency",
			from:          "INVALID",
			to:            "EUR",
			expectedSteps: 0,
			expectedErr:   true,
			description:   "Invalid currency should return error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path, err := service.GetConversionPath(tt.from, tt.to)
			if tt.expectedErr {
				assert.Error(t, err, tt.description)
				assert.Nil(t, path, "Path should be nil on error")
			} else {
				assert.NoError(t, err, tt.description)
				assert.NotNil(t, path, "Path should not be nil")
				assert.Equal(t, tt.expectedSteps, len(path), "Should have %d steps", tt.expectedSteps)

				// Verify path structure
				if len(path) > 0 {
					assert.Equal(t, tt.from, path[0].FromCurrency, "First step should start from source currency")
					if len(path) > 1 {
						assert.Equal(t, "EUR", path[0].ToCurrency, "First step in multi-step should go to EUR")
						assert.Equal(t, "EUR", path[1].FromCurrency, "Second step should start from EUR")
						assert.Equal(t, tt.to, path[len(path)-1].ToCurrency, "Last step should end at target currency")
					} else {
						assert.Equal(t, tt.to, path[0].ToCurrency, "Single step should go directly to target")
					}
				}
			}
		})
	}
}

func TestCurrencyExchangeService_findRateSymbol(t *testing.T) {
	service := &CurrencyExchangeService{}

	tests := []struct {
		name            string
		from            string
		to              string
		expectedSymbol  string
		expectedInverse bool
		description     string
	}{
		{
			name:            "direct EUR:USD",
			from:            "EUR",
			to:              "USD",
			expectedSymbol:  "EURUSD_T0.ITS",
			expectedInverse: false,
			description:     "Should find direct symbol",
		},
		{
			name:            "inverse USD:EUR",
			from:            "USD",
			to:              "EUR",
			expectedSymbol:  "EURUSD_T0.ITS",
			expectedInverse: true,
			description:     "Should find inverse symbol",
		},
		{
			name:            "direct GBP:USD",
			from:            "GBP",
			to:              "USD",
			expectedSymbol:  "GBPUSD_T0.ITS",
			expectedInverse: false,
			description:     "Should find GBP-USD symbol",
		},
		{
			name:            "not found",
			from:            "INVALID",
			to:              "EUR",
			expectedSymbol:  "",
			expectedInverse: false,
			description:     "Should return empty for invalid pair",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			symbol, inverse := service.findRateSymbol(tt.from, tt.to)
			assert.Equal(t, tt.expectedSymbol, symbol, tt.description)
			assert.Equal(t, tt.expectedInverse, inverse, tt.description)
		})
	}
}

// ============================================================================
// TDD Phase 1: Currency Exchange Tests - Market Orders
// ============================================================================

// Mock Broker Client that captures limit price
type mockBrokerClientCurrencyTest struct {
	capturedLimitPrice float64
	placeOrderCalled   bool
	placeOrderErr      error
	capturedSymbol     string
	capturedSide       string
	capturedQuantity   float64
}

func (m *mockBrokerClientCurrencyTest) PlaceOrder(symbol, side string, quantity, limitPrice float64) (*domain.BrokerOrderResult, error) {
	m.placeOrderCalled = true
	m.capturedSymbol = symbol
	m.capturedSide = side
	m.capturedQuantity = quantity
	m.capturedLimitPrice = limitPrice

	if m.placeOrderErr != nil {
		return nil, m.placeOrderErr
	}

	return &domain.BrokerOrderResult{
		OrderID:  "fx-order-123",
		Symbol:   symbol,
		Side:     side,
		Quantity: quantity,
		Price:    1.1, // Mock exchange rate
	}, nil
}

func (m *mockBrokerClientCurrencyTest) IsConnected() bool {
	return true
}

func (m *mockBrokerClientCurrencyTest) GetPortfolio() ([]domain.BrokerPosition, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) GetCashBalances() ([]domain.BrokerCashBalance, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) GetExecutedTrades(limit int) ([]domain.BrokerTrade, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) GetPendingOrders() ([]domain.BrokerPendingOrder, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) GetQuote(symbol string) (*domain.BrokerQuote, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) FindSymbol(symbol string, exchange *string) ([]domain.BrokerSecurityInfo, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) GetLevel1Quote(symbol string) (*domain.BrokerOrderBook, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) GetAllCashFlows(limit int) ([]domain.BrokerCashFlow, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) GetCashMovements() (*domain.BrokerCashMovement, error) {
	return nil, nil
}

func (m *mockBrokerClientCurrencyTest) HealthCheck() (*domain.BrokerHealthResult, error) {
	return &domain.BrokerHealthResult{Connected: true}, nil
}

func (m *mockBrokerClientCurrencyTest) SetCredentials(apiKey, apiSecret string) {
}

// TestExecuteStep_MarketOrder tests that FX conversions use market orders
func TestExecuteStep_MarketOrder(t *testing.T) {
	log := logger.New(logger.Config{Level: "error", Pretty: false})

	mockBroker := &mockBrokerClientCurrencyTest{
		capturedLimitPrice: -1, // Sentinel value
	}

	service := &CurrencyExchangeService{
		brokerClient: mockBroker,
		log:          log,
	}

	step := ConversionStep{
		Symbol:       "EURUSD_T0.ITS",
		Action:       "BUY",
		FromCurrency: "EUR",
		ToCurrency:   "USD",
	}

	err := service.executeStep(step, 100.0)

	assert.NoError(t, err)
	assert.True(t, mockBroker.placeOrderCalled, "PlaceOrder should have been called")
	assert.Equal(t, 0.0, mockBroker.capturedLimitPrice, "FX conversion should use market order (limitPrice = 0.0)")
	assert.Equal(t, "EURUSD_T0.ITS", mockBroker.capturedSymbol)
	assert.Equal(t, "BUY", mockBroker.capturedSide)
}
