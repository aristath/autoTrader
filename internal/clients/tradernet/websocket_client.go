package tradernet

import (
	"encoding/json"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/aristath/sentinel/internal/events"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
)

const (
	// WebSocket connection constants
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512KB

	// Reconnection constants
	baseReconnectDelay   = 5 * time.Second
	maxReconnectDelay    = 5 * time.Minute
	maxReconnectAttempts = 10

	// Cache staleness threshold
	cacheStaleThreshold = 5 * time.Minute
)

// MarketStatusWebSocket handles real-time market status updates from Tradernet
type MarketStatusWebSocket struct {
	// Connection
	url  string
	sid  string // Optional session ID
	conn *websocket.Conn
	mu   sync.RWMutex

	// Dependencies
	eventBus *events.Bus
	log      zerolog.Logger

	// State
	connected    bool
	reconnecting bool
	stopChan     chan struct{}
	stopped      bool

	// Cache (thread-safe)
	marketCache map[string]MarketStatusData
	lastUpdate  time.Time
	cacheMu     sync.RWMutex
}

// NewMarketStatusWebSocket creates a new market status WebSocket client
func NewMarketStatusWebSocket(url, sid string, eventBus *events.Bus, log zerolog.Logger) *MarketStatusWebSocket {
	return &MarketStatusWebSocket{
		url:         url,
		sid:         sid,
		eventBus:    eventBus,
		log:         log.With().Str("component", "market_status_websocket").Logger(),
		marketCache: make(map[string]MarketStatusData),
		stopChan:    make(chan struct{}),
	}
}

// Start initializes the WebSocket connection and starts the read loop
func (ws *MarketStatusWebSocket) Start() error {
	ws.log.Info().Msg("Starting market status WebSocket client")

	// Initial connection
	if err := ws.Connect(); err != nil {
		ws.log.Warn().Err(err).Msg("Initial WebSocket connection failed, will retry in background")
		// Start reconnect loop in background
		go ws.reconnectLoop()
		return err
	}

	// Start read loop in background
	go ws.readMessages()

	ws.log.Info().Msg("Market status WebSocket client started successfully")
	return nil
}

// Stop gracefully shuts down the WebSocket connection
func (ws *MarketStatusWebSocket) Stop() error {
	ws.mu.Lock()
	if ws.stopped {
		ws.mu.Unlock()
		return nil
	}
	ws.stopped = true
	ws.mu.Unlock()

	ws.log.Info().Msg("Stopping market status WebSocket client")

	// Signal stop
	close(ws.stopChan)

	// Close connection
	return ws.Disconnect()
}

// Connect establishes WebSocket connection and subscribes to markets channel
func (ws *MarketStatusWebSocket) Connect() error {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	// Build WebSocket URL with optional SID
	wsURL := ws.url
	if ws.sid != "" {
		wsURL += "?SID=" + ws.sid
	}

	ws.log.Info().Str("url", wsURL).Msg("Connecting to Tradernet WebSocket")

	// Dial WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		return fmt.Errorf("failed to dial WebSocket: %w", err)
	}

	ws.conn = conn
	ws.connected = true

	// Configure connection
	if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		ws.log.Warn().Err(err).Msg("Failed to set initial read deadline")
	}
	conn.SetPongHandler(func(string) error {
		// Note: Pong handler uses local conn variable to avoid race with Disconnect()
		if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
			ws.log.Warn().Err(err).Msg("Failed to set read deadline in pong handler")
		}
		return nil
	})

	// Subscribe to markets channel
	if err := ws.subscribe(); err != nil {
		if disconnectErr := ws.Disconnect(); disconnectErr != nil {
			ws.log.Warn().Err(disconnectErr).Msg("Failed to disconnect after subscribe error")
		}
		return fmt.Errorf("failed to subscribe to markets: %w", err)
	}

	ws.log.Info().Msg("Successfully connected to Tradernet WebSocket")
	return nil
}

// Disconnect closes the WebSocket connection
func (ws *MarketStatusWebSocket) Disconnect() error {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	if ws.conn == nil {
		return nil
	}

	ws.log.Info().Msg("Disconnecting from Tradernet WebSocket")

	// Send close message
	err := ws.conn.WriteMessage(
		websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
	)

	// Close connection
	ws.conn.Close()
	ws.conn = nil
	ws.connected = false

	if err != nil {
		return fmt.Errorf("error sending close message: %w", err)
	}

	return nil
}

// subscribe sends subscription message to markets channel
func (ws *MarketStatusWebSocket) subscribe() error {
	// Tradernet WebSocket protocol: ["markets"]
	subscribeMsg := []string{"markets"}

	ws.log.Info().Msg("Subscribing to markets channel")

	if err := ws.conn.WriteJSON(subscribeMsg); err != nil {
		return fmt.Errorf("failed to send subscription message: %w", err)
	}

	ws.log.Info().Msg("Subscribed to markets channel")
	return nil
}

// readMessages continuously reads messages from WebSocket
func (ws *MarketStatusWebSocket) readMessages() {
	defer func() {
		ws.log.Info().Msg("Read loop stopped")
		// Attempt reconnection if not intentionally stopped
		ws.mu.RLock()
		stopped := ws.stopped
		ws.mu.RUnlock()
		if !stopped {
			go ws.reconnectLoop()
		}
	}()

	for {
		select {
		case <-ws.stopChan:
			return
		default:
		}

		// Read message
		ws.mu.RLock()
		conn := ws.conn
		ws.mu.RUnlock()

		if conn == nil {
			ws.log.Warn().Msg("Connection is nil, stopping read loop")
			return
		}

		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				ws.log.Error().Err(err).Msg("Unexpected WebSocket close")
			} else {
				ws.log.Warn().Err(err).Msg("WebSocket read error")
			}
			return
		}

		// Parse and handle message
		if err := ws.handleMessage(message); err != nil {
			ws.log.Error().Err(err).Str("message", string(message)).Msg("Failed to handle WebSocket message")
			// Continue reading despite parse errors
		}
	}
}

// handleMessage parses and processes WebSocket messages
func (ws *MarketStatusWebSocket) handleMessage(message []byte) error {
	// Tradernet WebSocket protocol: ["event", data]
	var rawMessage []json.RawMessage
	if err := json.Unmarshal(message, &rawMessage); err != nil {
		return fmt.Errorf("failed to parse message array: %w", err)
	}

	if len(rawMessage) < 2 {
		return fmt.Errorf("message array too short: expected 2 elements, got %d", len(rawMessage))
	}

	// Extract channel name
	var channel string
	if err := json.Unmarshal(rawMessage[0], &channel); err != nil {
		return fmt.Errorf("failed to parse channel: %w", err)
	}

	// Only handle markets channel
	if channel != "markets" {
		ws.log.Debug().Str("channel", channel).Msg("Ignoring non-markets message")
		return nil
	}

	// Parse market data
	var data WSMarketData
	if err := json.Unmarshal(rawMessage[1], &data); err != nil {
		return fmt.Errorf("failed to parse market data: %w", err)
	}

	// Handle market update
	return ws.handleMarketUpdate(data)
}

// handleMarketUpdate processes market status updates
func (ws *MarketStatusWebSocket) handleMarketUpdate(data WSMarketData) error {
	if len(data.Markets) == 0 {
		ws.log.Warn().Msg("Received empty markets update")
		return nil
	}

	ws.log.Debug().
		Int("market_count", len(data.Markets)).
		Str("timestamp", data.Timestamp).
		Msg("Processing market status update")

	// Transform WebSocket data to domain model
	transformedMarkets, err := TransformWSMarkets(data.Markets)
	if err != nil {
		return fmt.Errorf("failed to transform markets: %w", err)
	}

	// Update cache (thread-safe)
	ws.cacheMu.Lock()
	for code, market := range transformedMarkets {
		ws.marketCache[code] = market
	}
	ws.lastUpdate = time.Now()
	cacheSnapshot := make(map[string]MarketStatusData, len(ws.marketCache))
	for k, v := range ws.marketCache {
		cacheSnapshot[k] = v
	}
	ws.cacheMu.Unlock()

	ws.log.Info().
		Int("market_count", len(transformedMarkets)).
		Msg("Market status cache updated")

	// Emit event to EventBus
	if ws.eventBus != nil {
		if err := ws.emitMarketStatusEvent(cacheSnapshot); err != nil {
			ws.log.Error().Err(err).Msg("Failed to emit market status event")
		}
	}

	return nil
}

// emitMarketStatusEvent emits MarketsStatusChanged event to EventBus
func (ws *MarketStatusWebSocket) emitMarketStatusEvent(markets map[string]MarketStatusData) error {
	// Convert tradernet.MarketStatusData to map format for event
	eventMarkets := make(map[string]interface{}, len(markets))
	openCount := 0
	closedCount := 0

	for code, market := range markets {
		if market.Status == "open" {
			openCount++
		} else {
			closedCount++
		}

		eventMarkets[code] = map[string]interface{}{
			"name":       market.Name,
			"code":       market.Code,
			"status":     market.Status,
			"open_time":  market.OpenTime,
			"close_time": market.CloseTime,
			"date":       market.Date,
			"updated_at": market.UpdatedAt.Format(time.RFC3339),
		}
	}

	eventData := map[string]interface{}{
		"markets":      eventMarkets,
		"open_count":   openCount,
		"closed_count": closedCount,
		"last_updated": time.Now().Format(time.RFC3339),
	}

	ws.log.Debug().
		Int("open_count", openCount).
		Int("closed_count", closedCount).
		Msg("Emitting MARKETS_STATUS_CHANGED event")

	ws.eventBus.Emit(events.MarketsStatusChanged, "market_status_websocket", eventData)
	return nil
}

// reconnectLoop handles automatic reconnection with exponential backoff
func (ws *MarketStatusWebSocket) reconnectLoop() {
	ws.mu.Lock()
	if ws.reconnecting || ws.stopped {
		ws.mu.Unlock()
		return
	}
	ws.reconnecting = true
	ws.mu.Unlock()

	defer func() {
		ws.mu.Lock()
		ws.reconnecting = false
		ws.mu.Unlock()
	}()

	attempt := 0
	for {
		select {
		case <-ws.stopChan:
			ws.log.Info().Msg("Reconnection loop stopped by user")
			return
		default:
		}

		ws.mu.RLock()
		stopped := ws.stopped
		ws.mu.RUnlock()
		if stopped {
			return
		}

		attempt++

		// Calculate backoff delay
		delay := ws.calculateBackoff(attempt)

		if attempt <= maxReconnectAttempts {
			ws.log.Info().
				Int("attempt", attempt).
				Dur("delay", delay).
				Msg("Attempting to reconnect to WebSocket")
		} else {
			ws.log.Warn().
				Int("attempt", attempt).
				Dur("delay", delay).
				Msg("Reconnection attempt (exceeded max attempts, will keep retrying)")
		}

		// Wait before reconnecting
		select {
		case <-time.After(delay):
		case <-ws.stopChan:
			return
		}

		// Attempt connection
		if err := ws.Connect(); err != nil {
			ws.log.Error().Err(err).
				Int("attempt", attempt).
				Msg("Reconnection failed")
			continue
		}

		// Successfully reconnected
		ws.log.Info().
			Int("attempt", attempt).
			Msg("Successfully reconnected to WebSocket")

		// Reset attempt counter on successful connection
		attempt = 0

		// Start read loop
		go ws.readMessages()
		return
	}
}

// calculateBackoff calculates exponential backoff delay
func (ws *MarketStatusWebSocket) calculateBackoff(attempt int) time.Duration {
	// Exponential backoff: baseDelay * 2^attempt
	delay := float64(baseReconnectDelay) * math.Pow(2, float64(attempt-1))

	// Cap at max delay
	if delay > float64(maxReconnectDelay) {
		delay = float64(maxReconnectDelay)
	}

	return time.Duration(delay)
}

// GetMarketStatus returns status for a specific market (thread-safe)
func (ws *MarketStatusWebSocket) GetMarketStatus(code string) (*MarketStatusData, error) {
	ws.cacheMu.RLock()
	defer ws.cacheMu.RUnlock()

	market, exists := ws.marketCache[code]
	if !exists {
		return nil, fmt.Errorf("market %s not found in cache", code)
	}

	return &market, nil
}

// GetAllMarketStatuses returns all cached market statuses (thread-safe)
func (ws *MarketStatusWebSocket) GetAllMarketStatuses() map[string]MarketStatusData {
	ws.cacheMu.RLock()
	defer ws.cacheMu.RUnlock()

	// Return a copy to prevent external modifications
	result := make(map[string]MarketStatusData, len(ws.marketCache))
	for k, v := range ws.marketCache {
		result[k] = v
	}

	return result
}

// IsCacheStale checks if the cache hasn't been updated recently
func (ws *MarketStatusWebSocket) IsCacheStale() bool {
	ws.cacheMu.RLock()
	defer ws.cacheMu.RUnlock()

	if ws.lastUpdate.IsZero() {
		return true
	}

	return time.Since(ws.lastUpdate) > cacheStaleThreshold
}

// IsConnected returns current connection status
func (ws *MarketStatusWebSocket) IsConnected() bool {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	return ws.connected
}
