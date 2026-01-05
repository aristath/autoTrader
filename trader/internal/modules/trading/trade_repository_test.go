package trading

import (
	"database/sql"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTradeRepository_Create_LowercaseSide(t *testing.T) {
	// Setup in-memory database with ledger schema
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err)
	defer db.Close()

	// Create trades table with CHECK constraint
	_, err = db.Exec(`
		CREATE TABLE trades (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			symbol TEXT NOT NULL,
			isin TEXT,
			side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
			quantity REAL NOT NULL,
			price REAL NOT NULL,
			executed_at TEXT NOT NULL,
			order_id TEXT,
			currency TEXT,
			value_eur REAL,
			source TEXT DEFAULT 'manual',
			mode TEXT DEFAULT 'normal',
			created_at TEXT NOT NULL
		)
	`)
	require.NoError(t, err)

	repo := NewTradeRepository(db, zerolog.Nop())

	// Test with uppercase side - should be converted to lowercase
	trade := Trade{
		Symbol:     "AAPL",
		Side:       TradeSideBuy, // Uppercase "BUY"
		Quantity:   10.0,
		Price:      150.0,
		ExecutedAt: time.Now(),
		Currency:   "USD",
		ValueEUR:   func() *float64 { v := 1500.0; return &v }(),
		OrderID:    "TEST-123",
		Source:     "test",
		Mode:       "normal",
	}

	err = repo.Create(trade)
	require.NoError(t, err)

	// Verify side was stored as lowercase
	var storedSide string
	err = db.QueryRow("SELECT side FROM trades WHERE order_id = ?", "TEST-123").Scan(&storedSide)
	require.NoError(t, err)
	assert.Equal(t, "buy", storedSide) // Should be lowercase
}

func TestTradeRepository_Create_LowercaseSide_SELL(t *testing.T) {
	// Setup in-memory database with ledger schema
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err)
	defer db.Close()

	// Create trades table with CHECK constraint
	_, err = db.Exec(`
		CREATE TABLE trades (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			symbol TEXT NOT NULL,
			isin TEXT,
			side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
			quantity REAL NOT NULL,
			price REAL NOT NULL,
			executed_at TEXT NOT NULL,
			order_id TEXT,
			currency TEXT,
			value_eur REAL,
			source TEXT DEFAULT 'manual',
			mode TEXT DEFAULT 'normal',
			created_at TEXT NOT NULL
		)
	`)
	require.NoError(t, err)

	repo := NewTradeRepository(db, zerolog.Nop())

	// Test with uppercase side - should be converted to lowercase
	trade := Trade{
		Symbol:     "AAPL",
		Side:       TradeSideSell, // Uppercase "SELL"
		Quantity:   10.0,
		Price:      150.0,
		ExecutedAt: time.Now(),
		Currency:   "USD",
		ValueEUR:   func() *float64 { v := 1500.0; return &v }(),
		OrderID:    "TEST-456",
		Source:     "test",
		Mode:       "normal",
	}

	err = repo.Create(trade)
	require.NoError(t, err)

	// Verify side was stored as lowercase
	var storedSide string
	err = db.QueryRow("SELECT side FROM trades WHERE order_id = ?", "TEST-456").Scan(&storedSide)
	require.NoError(t, err)
	assert.Equal(t, "sell", storedSide) // Should be lowercase
}
