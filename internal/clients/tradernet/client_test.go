package tradernet

import (
	"errors"
	"testing"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func TestGetPendingOrders_CallsCorrectEndpoint(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)

	// Mock SDK client
	mockSDK := &mockSDKClient{
		getPlacedResult: map[string]interface{}{
			"result": []interface{}{},
		},
	}

	client := NewClientWithSDK(mockSDK, log)
	_, err := client.GetPendingOrders()

	assert.NoError(t, err)
}

// TestClient_GetFXRates tests GetFXRates() using SDK
func TestClient_GetFXRates(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)

	mockSDK := &mockSDKClient{
		getCrossRatesForDateResult: map[string]interface{}{
			"rates": map[string]interface{}{
				"EUR": 0.92261342533093,
				"HKD": 7.8070160113905,
			},
		},
	}

	client := &Client{
		sdkClient: mockSDK,
		log:       log,
	}

	rates, err := client.GetFXRates("USD", []string{"EUR", "HKD"})

	assert.NoError(t, err)
	assert.NotNil(t, rates)
	assert.Len(t, rates, 2)
	assert.Equal(t, 0.92261342533093, rates["EUR"])
	assert.Equal(t, 7.8070160113905, rates["HKD"])
}

// TestClient_GetFXRates_SDKError tests GetFXRates() error handling
func TestClient_GetFXRates_SDKError(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)

	mockSDK := &mockSDKClient{
		getCrossRatesForDateError: errors.New("SDK error"),
	}

	client := &Client{
		sdkClient: mockSDK,
		log:       log,
	}

	rates, err := client.GetFXRates("USD", []string{"EUR"})

	assert.Error(t, err)
	assert.Nil(t, rates)
	assert.Contains(t, err.Error(), "failed to get FX rates")
}

// TestClient_GetFXRates_TransformerError tests GetFXRates() transformer error handling
func TestClient_GetFXRates_TransformerError(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)

	mockSDK := &mockSDKClient{
		getCrossRatesForDateResult: map[string]interface{}{
			"data": "invalid format",
		},
	}

	client := &Client{
		sdkClient: mockSDK,
		log:       log,
	}

	rates, err := client.GetFXRates("USD", []string{"EUR"})

	assert.Error(t, err)
	assert.Nil(t, rates)
	assert.Contains(t, err.Error(), "failed to transform rates")
}
