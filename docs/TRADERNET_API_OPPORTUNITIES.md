# Tradernet API Integration Opportunities

**Focus:** Improving trade quality and decision-making (not speed)

**Analysis Date:** 2026-01-09

## Executive Summary

After reviewing the complete Tradernet API documentation, several high-value endpoints are available but not yet implemented. These features can significantly improve trading decisions, risk management, and portfolio analysis.

## Current Implementation Status

### ✅ Implemented (Core Trading)
- Basic order placement (Buy/Sell, Market/Limit)
- Portfolio positions and cash balances
- Trade history and pending orders
- Quote data and symbol search
- Cash flows and movements
- Stop loss, trailing stop, take profit (SDK layer)
- Price alerts (SDK layer)
- Security information lookup
- Historical candles (OHLC data)
- Order cancellation

### 🔴 Not Implemented (High-Value Opportunities)

## Priority 1: Pre-Trade Analysis & Risk Management

### 1. Trading Restrictions Validation
**API:** `checkAllowedTickerAndBanOnTrade`
**Documentation:** `quotes_and_market_data/check-allowed-ticker-and-ban-on-trade.md`

**Why It Matters:**
- Validates if a ticker is allowed for trading BEFORE placing order
- Prevents failed orders and wasted time
- Returns allowed order types (Day, GTC, etc.)
- Checks account-level restrictions
- Provides clear error messages if trading is blocked

**Use Cases:**
- Pre-validate all planned trades in sequences
- Filter universe to only tradeable securities
- Avoid broker restrictions on specific securities
- Better error handling in planning module

**Implementation Priority:** HIGH - Prevents failed orders

---

### 2. Order Book / Market Depth
**API:** WebSocket `orderBook` subscription
**Documentation:** `currencies_and_websocket/websocket.md`, `quotes_and_market_data/quotes-orderbook.md`

**Why It Matters:**
- See real-time bid/ask levels beyond best price
- Understand liquidity at different price levels
- Estimate market impact before placing order
- Identify optimal limit prices
- Detect thin markets that could cause slippage

**Use Cases:**
- Set limit prices based on actual liquidity
- Avoid trading securities with poor depth
- Estimate execution quality before trading
- Detect when market is too thin for large orders
- Better position sizing based on available liquidity

**Implementation Priority:** HIGH - Critical for minimizing slippage

**Data Structure:**
```json
{
  "i": "AAPL.US",
  "cnt": 21,
  "ins": [],  // New levels inserted
  "del": [],  // Levels removed
  "upd": [    // Updated levels
    {"p": 150.25, "s": "B", "q": 10000, "k": 1},  // Best bid
    {"p": 150.30, "s": "S", "q": 5000, "k": 1}    // Best ask
  ]
}
```

---

### 3. Historical Cross Rates for Accurate Valuation
**API:** `getCrossRatesForDate`
**Documentation:** `currencies_and_websocket/cross-rates-for-date.md`

**Why It Matters:**
- Get exact exchange rates for historical dates
- Accurate portfolio valuation over time
- Better performance tracking
- Correct dividend conversion

**Use Cases:**
- Historical portfolio snapshots with accurate EUR conversion
- Dividend processing with correct FX rates
- Performance attribution analysis
- Tax reporting with correct FX rates

**Implementation Priority:** MEDIUM - Improves accuracy

---

## Priority 2: Market Intelligence

### 4. Security News Feed
**API:** `getNews`
**Documentation:** `quotes_and_market_data/quotes-get-news.md`

**Why It Matters:**
- Security-specific news for fundamental analysis
- Search by ticker or company name
- Helps explain price movements
- Informs buy/hold/sell decisions
- Can detect emerging risks

**Use Cases:**
- Alert on significant news for portfolio holdings
- Research companies before buying
- Understand why a security dropped
- Detect corporate actions early
- Factor news sentiment into scoring

**Implementation Priority:** MEDIUM - Adds fundamental context

**Parameters:**
- `query`: Search term (company name or keyword)
- `symbol`: Filter by specific ticker
- `storyId`: Get specific news story
- `limit`: Number of news items (default 30)

---

### 5. Top Securities / Market Movers
**API:** `getTopSecurities`
**Documentation:** `quotes_and_market_data/quotes-get-top-securities.md`

**Why It Matters:**
- Identify momentum opportunities
- Track most traded securities (volume leaders)
- Find fastest growing stocks (gainers)
- Available by exchange (USA, Europe, etc.)
- Market sentiment indicator

**Use Cases:**
- Universe screening for momentum stocks
- Identify unusually active securities
- Detect sector rotation
- Find high-conviction opportunities
- Market breadth analysis

**Implementation Priority:** LOW-MEDIUM - Discovery tool

**Parameters:**
- `type`: "stocks", "bonds", "futures", "funds", "indexes"
- `exchange`: "usa", "europe", "ukraine", "kazakhstan", "currencies"
- `gainers`: 1 (fastest growing) or 0 (most traded)
- `limit`: Number of results (default 10)

---

## Priority 3: Advanced Order Types & Execution

### 6. Options Data
**API:** `getOptionsByMktNameAndBaseAsset`
**Documentation:** `quotes_and_market_data/get-options-by-mkt.md`

**Why It Matters:**
- List available option contracts
- Strike prices and expiration dates
- Enable options strategies (covered calls, protective puts)
- Hedge existing positions
- Income generation

**Use Cases:**
- Covered call strategy on existing holdings
- Protective puts for downside protection
- Options as synthetic positions
- Volatility-based strategies
- Enhanced yield through premium collection

**Implementation Priority:** LOW - Future enhancement (requires options knowledge)

**Response:**
```json
[
  {
    "ticker": "+AAPL^C150.US",
    "base_contract_code": "AAPL.US",
    "last_trade_date": "2026-01-17",
    "expire_date": "2026-01-17",
    "strike_price": "150",
    "option_type": "CALL"
  }
]
```

---

## Priority 4: Analysis & Reporting

### 7. Enhanced Cash Flow Analysis
**API:** `getUserCashFlows`
**Documentation:** `reports/get-cashflows.md`

**Why It Matters:**
- Advanced filtering (by type, date range)
- Sorting capabilities
- Grouping by transaction type
- Cash totals over time
- Better reconciliation

**Use Cases:**
- Detailed expense analysis (commissions, fees)
- Track deposits/withdrawals over time
- Dividend income tracking
- Cost basis calculations
- Tax reporting

**Implementation Priority:** MEDIUM - Better analysis

**Advanced Features:**
- Filter by `type_code` (commission, dividend, deposit, etc.)
- Sort by any field
- Pagination (take/skip)
- Group by type
- Running totals

---

### 8. Broker Reports
**API:** `getBrokerReport`, `getDepositaryReport`
**Documentation:** `reports/broker-report.md`, `reports/depositary-report.md`

**Why It Matters:**
- Official periodic reports from broker
- Complete transaction history
- Position snapshots at specific times
- Regulatory compliance
- Reconciliation with internal records

**Use Cases:**
- Monthly/quarterly portfolio review
- Tax documentation
- Audit trail
- Historical position verification
- Performance verification

**Implementation Priority:** LOW - Administrative

---

## Priority 5: Real-Time Data Streaming

### 9. WebSocket Market Data Streams
**APIs:**
- `websocket-markets`: Real-time quotes
- `websocket-portfolio`: Live portfolio updates
- `websocket-orders`: Live order status
- `websocket-sessions`: Market sessions

**Documentation:** `currencies_and_websocket/websocket-*.md`

**Why It Matters:**
- Real-time price updates (no polling)
- Instant portfolio value changes
- Immediate order status updates
- Market status changes
- Lower latency, reduced API calls

**Use Cases:**
- Live portfolio dashboard
- Real-time P&L tracking
- Order fill notifications
- Market close alerts
- Efficient data updates

**Implementation Priority:** LOW-MEDIUM - Nice to have, but polling works

**Note:** System currently runs batch jobs, not real-time trading. WebSocket may be overkill unless building live dashboard.

---

## Recommended Implementation Order

### Phase 1: Pre-Trade Validation (Immediate Impact)
1. **Trading Restrictions Check** - Prevents failed orders
2. **Order Book Analysis** - Minimizes slippage and improves execution

**Estimated Effort:** 1-2 days
**Business Value:** Fewer failed orders, better execution prices

### Phase 2: Market Intelligence (Medium-Term)
3. **Historical Cross Rates** - Accurate valuations
4. **Security News Feed** - Fundamental context
5. **Enhanced Cash Flow Analysis** - Better reporting

**Estimated Effort:** 2-3 days
**Business Value:** Better decisions, accurate reporting

### Phase 3: Discovery & Analysis (Long-Term)
6. **Top Securities** - Opportunity discovery
7. **Broker Reports** - Compliance and auditing

**Estimated Effort:** 1-2 days
**Business Value:** New opportunities, better record-keeping

### Phase 4: Future Enhancements (Optional)
8. **Options Data** - Advanced strategies
9. **WebSocket Streams** - Real-time updates

**Estimated Effort:** 3-5 days
**Business Value:** Advanced strategies, better UX

---

## Integration Points

### Planning Module
- **Trading restrictions check** before generating sequences
- **Order book analysis** for optimal limit pricing
- **News feed** for avoiding securities with negative news

### Scoring Module
- **Top securities** data as momentum signal
- **News sentiment** as scoring factor

### Trade Execution
- **Order book validation** before placing orders
- **Pre-trade restrictions check**

### Analytics Module
- **Historical cross rates** for accurate EUR conversions
- **Enhanced cash flow analysis** for expense tracking
- **Broker reports** for reconciliation

### Universe Module
- **Trading restrictions** filter for universe
- **Top securities** for opportunity screening

---

## Technical Considerations

### API Rate Limits
- Most endpoints are REST-based (no rate limits documented)
- WebSocket subscriptions more efficient for real-time data
- Current polling approach works fine for batch operations

### Data Freshness
- Order book: Real-time (websocket) or near-real-time (REST)
- News: Updated continuously
- Top securities: Updated daily
- Cross rates: Historical, no real-time needed

### Error Handling
- Trading restrictions API returns clear error messages
- Should check restrictions BEFORE generating trade sequences
- Handle "not tradeable" gracefully in planning

### Caching Strategy
- Order book: Short TTL (seconds) or websocket
- News: Medium TTL (minutes)
- Top securities: Long TTL (hours)
- Cross rates: Can cache indefinitely (historical data)

---

## Code Changes Required

### 1. SDK Methods (sdk/methods.go)
Add missing methods:
```go
// CheckTickerAllowed validates if ticker is tradeable
func (c *Client) CheckTickerAllowed(symbol string, checkBan bool) (interface{}, error)

// GetOrderBook gets current order book depth
func (c *Client) GetOrderBook(symbol string) (interface{}, error)

// GetCrossRatesForDate gets historical exchange rates
func (c *Client) GetCrossRatesForDate(baseCurrency string, currencies []string, date string) (interface{}, error)
```

### 2. Client Wrapper (client.go)
Add domain-friendly wrappers:
```go
// CheckTickerAllowed returns trading validation
func (c *Client) CheckTickerAllowed(symbol string) (*TradingRestriction, error)

// GetOrderBook returns market depth
func (c *Client) GetOrderBook(symbol string) (*OrderBook, error)
```

### 3. Domain Models (domain/broker_types.go)
Add new domain types:
```go
type TradingRestriction struct {
    Allowed         bool
    AllowedExpires  []int  // Day, GTC, etc.
    Restriction     string // Reason if not allowed
    Operation       string // Buy/Sell restrictions
}

type OrderBook struct {
    Symbol string
    Bids   []OrderBookLevel
    Asks   []OrderBookLevel
}

type OrderBookLevel struct {
    Price    float64
    Quantity float64
    Position int
}
```

### 4. Transformer Functions (transformers_domain.go)
Add transformation logic from Tradernet format to domain types

---

## Success Metrics

### Execution Quality
- **Slippage reduction:** Track average slippage before/after order book integration
- **Failed orders:** Reduce to near-zero with pre-trade validation
- **Fill rate:** Improve with better limit pricing

### Decision Quality
- **News-informed trades:** Track trades influenced by news
- **Restriction avoidance:** Count prevented failed orders
- **Liquidity assessment:** Avoid thin markets

### Operational
- **Accurate valuations:** Historical EUR conversions within 0.1%
- **Reconciliation:** 100% match with broker reports
- **Trade validation:** Zero failed orders due to restrictions

---

## Next Steps

1. **Review & Prioritize:** Confirm which features align with your goals
2. **Design Integration:** Determine how each feature integrates with existing modules
3. **Implement Phase 1:** Start with trading restrictions and order book
4. **Test & Validate:** Ensure execution quality improves
5. **Iterate:** Add remaining features based on results

---

## Questions to Consider

1. **Order Book:** Do you want to check depth before EVERY order, or only large orders?
2. **News:** Should news feed into scoring algorithm, or just for manual review?
3. **Restrictions:** Check at planning time or execution time (or both)?
4. **Cross Rates:** Backfill historical data, or just use for future calculations?
5. **Options:** Is options trading in scope for retirement portfolio?

---

## Conclusion

The Tradernet API provides rich functionality beyond basic trading. The highest-value additions are:

1. **Trading restrictions check** - Prevents errors
2. **Order book analysis** - Better execution
3. **Historical FX rates** - Accurate reporting
4. **News feed** - Better context

These additions can significantly improve trade quality without adding complexity to the autonomous operation of the system.
