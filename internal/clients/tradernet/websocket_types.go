package tradernet

import (
	"fmt"
	"strings"
	"time"
)

// WSMarketMessage represents the top-level WebSocket message structure
type WSMarketMessage struct {
	Channel string
	Data    WSMarketData
}

// WSMarketData represents the data payload from Tradernet markets WebSocket
type WSMarketData struct {
	Timestamp string     `json:"t"`
	Markets   []WSMarket `json:"m"`
}

// WSMarket represents a single market from Tradernet WebSocket
type WSMarket struct {
	Name      string `json:"n"`  // Full name (e.g., "NASDAQ")
	Code      string `json:"n2"` // Market code (e.g., "XNAS")
	Status    string `json:"s"`  // Status: OPEN, CLOSE, PRE_OPEN, POST_CLOSE
	OpenTime  string `json:"o"`  // Open time (e.g., "09:30")
	CloseTime string `json:"c"`  // Close time (e.g., "16:00")
	Date      string `json:"dt"` // Date (e.g., "2024-01-09")
}

// MarketStatusData represents the domain model for market status (cached)
type MarketStatusData struct {
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Status    string    `json:"status"`     // "open", "closed", "pre_open", "post_close"
	OpenTime  string    `json:"open_time"`  // "09:30"
	CloseTime string    `json:"close_time"` // "16:00"
	Date      string    `json:"date"`       // "2024-01-09"
	UpdatedAt time.Time `json:"updated_at"` // Timestamp of last update
}

// TransformWSMarket converts WebSocket market data to domain model
func TransformWSMarket(ws WSMarket) (*MarketStatusData, error) {
	// Validate required fields
	if ws.Code == "" {
		return nil, fmt.Errorf("market code (n2) is required")
	}
	if ws.Name == "" {
		return nil, fmt.Errorf("market name (n) is required")
	}
	if ws.Status == "" {
		return nil, fmt.Errorf("market status (s) is required")
	}

	// Transform status to lowercase
	status := strings.ToLower(ws.Status)

	// Validate status value
	validStatuses := map[string]bool{
		"open":       true,
		"close":      true,
		"closed":     true,
		"pre_open":   true,
		"post_close": true,
	}

	if !validStatuses[status] {
		return nil, fmt.Errorf("invalid market status: %s", ws.Status)
	}

	// Normalize "close" to "closed"
	if status == "close" {
		status = "closed"
	}

	return &MarketStatusData{
		Name:      ws.Name,
		Code:      ws.Code,
		Status:    status,
		OpenTime:  ws.OpenTime,
		CloseTime: ws.CloseTime,
		Date:      ws.Date,
		UpdatedAt: time.Now(),
	}, nil
}

// TransformWSMarkets converts a slice of WebSocket markets to a map keyed by code
func TransformWSMarkets(wsMarkets []WSMarket) (map[string]MarketStatusData, error) {
	result := make(map[string]MarketStatusData, len(wsMarkets))

	for _, wsMarket := range wsMarkets {
		transformed, err := TransformWSMarket(wsMarket)
		if err != nil {
			// Log error but continue with other markets
			continue
		}
		result[transformed.Code] = *transformed
	}

	return result, nil
}
