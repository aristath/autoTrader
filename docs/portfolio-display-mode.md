# Portfolio Display Mode

Multi-cluster organic visualization for the Arduino Uno Q LED matrix that displays portfolio health through visual metaphors.

## Overview

Portfolio mode transforms the 8x13 LED matrix into a living visualization of your retirement portfolio. Each of your top 5 holdings displays as a separate animated cluster, with visual characteristics that reflect individual security performance vs your 11% annual target.

## Visual Design

### Cluster Representation

- **Top 5 Holdings**: Individual animated clusters
  - Cluster size = Portfolio percentage (min 5 pixels)
  - Visual parameters based on security performance vs 11% target
- **Background Cluster**: Positions 6-25 combined
  - Size = Remaining portfolio percentage
  - Visual parameters based on weighted average performance
  - Lower brightness to emphasize top holdings

### Visual Parameter Mapping

Performance metrics translate to visual characteristics:

#### Thriving (+3% or more above target)
- **Brightness**: 180-220 (very bright)
- **Clustering**: 3 (loose, organic movement)
- **Animation**: 100ms (smooth, flowing)
- **Mood**: Confident, expansive

#### On Target (0% to +3%)
- **Brightness**: 150-180 (bright)
- **Clustering**: 4 (moderate cohesion)
- **Animation**: 100ms (smooth)
- **Mood**: Steady, balanced

#### Below Target (-3% to 0%)
- **Brightness**: 120-150 (moderate)
- **Clustering**: 5 (moderate-tight)
- **Animation**: 100ms (smooth)
- **Mood**: Cautious, consolidating

#### Critical (below -3%)
- **Brightness**: 100-120 (dim)
- **Clustering**: 7 (tight, erratic)
- **Animation**: 40ms (fast, chaotic)
- **Mood**: Alert, unstable

## Performance Calculation

### Individual Security Performance

Each security's trailing 12-month CAGR is calculated from its history database:
- Data source: `data/history/{SYMBOL}.db`
- Metric: Annualized return over 12 months
- Comparison: Difference from 11% target

### Background Performance

Weighted average of positions 6-25:
- Each position's trailing 12mo CAGR
- Weighted by market value
- Combined into single aggregate metric

### Portfolio Performance

Overall portfolio metric (shown in metadata, not currently visualized):
- 70% weight: Trailing 12-month annualized return
- 30% weight: Since-inception CAGR
- Heavy recent weighting for responsive feedback

## Multi-Cluster Algorithm

### Organic Clustering

Each cluster animates independently with:

1. **Intra-cluster attraction**: Pixels seek neighbors from same cluster
2. **Inter-cluster repulsion**: Pixels avoid neighbors from different clusters
3. **Per-cluster timing**: Each cluster updates at its own animation speed

### Algorithm Details

```
For each cluster:
  1. Find isolated pixel (few same-cluster neighbors, many other-cluster neighbors)
  2. Find target position (many same-cluster neighbors, few other-cluster neighbors)
  3. Swap pixels to improve clustering
  4. Update at cluster's animation speed
```

Result: Organic, flowing clusters that naturally separate from each other while maintaining internal cohesion.

## Configuration

All visual parameters are configurable via settings database (`config.db`):

### Performance Thresholds
```
display_performance_thriving_threshold = 0.03
display_performance_on_target_threshold = 0.00
display_performance_below_threshold = -0.03
```

### Performance Calculation Weights
```
display_performance_trailing12mo_weight = 0.70
display_performance_inception_weight = 0.30
```

### Brightness Ranges (0-255)
```
display_brightness_thriving_min = 180
display_brightness_thriving_max = 220
display_brightness_on_target_min = 150
display_brightness_on_target_max = 180
display_brightness_below_min = 120
display_brightness_below_max = 150
display_brightness_critical_min = 100
display_brightness_critical_max = 120
display_background_brightness_min = 80
display_background_brightness_max = 120
```

### Clustering Strengths (1-10)
Higher = tighter clustering
```
display_clustering_thriving = 3
display_clustering_on_target = 4
display_clustering_below = 5
display_clustering_critical = 7
```

### Animation Speeds (ms)
Lower = faster
```
display_animation_speed_smooth = 100
display_animation_speed_chaotic = 40
```

### Cluster Configuration
```
display_min_cluster_size = 5
display_top_holdings_count = 5
```

## Activation

### 1. Set Display Mode

```sql
UPDATE settings SET value = 'PORTFOLIO' WHERE key = 'display_mode';
```

Or using the settings API:
```bash
curl -X PUT http://192.168.1.11:8000/api/settings/display_mode \
  -H "Content-Type: application/json" \
  -d '{"value": "PORTFOLIO"}'
```

### 2. Restart Arduino App

```bash
docker restart trader-display
```

### 3. Verify

Check the Python bridge logs:
```bash
docker logs -f trader-display
```

Expected output:
```
LED Display starting (portfolio + stats + ticker modes)...
Portfolio mode: 6 clusters
```

Check the Go API logs for cluster calculation:
```
Calculated portfolio display state num_clusters=6 portfolio_perf=0.12 perf_vs_target=0.01
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Go Backend (trader-go)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. PortfolioDisplayCalculator.CalculateDisplayState()      │
│    ├─ Get top 5 holdings by market value                   │
│    ├─ For each holding:                                    │
│    │   ├─ Open history/{SYMBOL}.db                         │
│    │   ├─ Calculate trailing 12mo CAGR                     │
│    │   ├─ Compare to 11% target                            │
│    │   └─ Map to brightness/clustering/speed               │
│    ├─ Calculate background cluster (positions 6-25)        │
│    └─ Return cluster data                                  │
│                                                             │
│ 2. /api/status/led/display endpoint                        │
│    └─ Returns JSON with mode="PORTFOLIO", clusters=[...]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Python Bridge (arduino-app/python/main.py)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Poll API every 2 seconds                                │
│ 2. Parse mode == "PORTFOLIO"                               │
│ 3. Convert clusters to JSON string                         │
│ 4. Bridge.call("setPortfolioMode", clustersJSON)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Arduino Router Bridge (MCU)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Receive setPortfolioMode RPC call                       │
│ 2. Parse JSON cluster data                                 │
│ 3. Allocate pixels to clusters                             │
│ 4. Set inPortfolioMode = true                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Arduino Sketch (loop)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Every 25ms (40 FPS):                                        │
│ 1. updatePortfolioPattern()                                │
│    ├─ For each cluster:                                    │
│    │   ├─ Check if animation interval elapsed              │
│    │   ├─ Find isolated pixel from this cluster            │
│    │   ├─ Find better clustering position                  │
│    │   └─ Swap pixels                                      │
│    └─ Update pixel-to-cluster mapping                      │
│                                                             │
│ 2. renderPortfolioFrame()                                  │
│    ├─ Map each pixel to cluster's brightness               │
│    └─ Render to LED matrix                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### No Display / Blank Screen

1. Check display mode setting:
   ```sql
   SELECT * FROM settings WHERE key = 'display_mode';
   ```

2. Check Python bridge logs:
   ```bash
   docker logs trader-display
   ```
   Should show: "Portfolio mode: X clusters"

3. Verify API endpoint returns cluster data:
   ```bash
   curl http://192.168.1.11:8000/api/status/led/display
   ```

### Clusters Look Identical

If all clusters have the same brightness/behavior:

1. Check if security history databases exist:
   ```bash
   ls -la data/history/
   ```

2. Check Go API logs for performance calculation errors:
   ```bash
   docker logs trader-go 2>&1 | grep "security performance"
   ```

3. Verify price data exists:
   ```bash
   sqlite3 data/history/AAPL_US.db "SELECT COUNT(*) FROM daily_prices"
   ```

### Ticker Mode Not Working

Portfolio mode exits when ticker text arrives. If ticker doesn't work:

1. Check that ticker data is being generated
2. Verify Python bridge can send scrollText
3. Check Arduino sketch ticker handling

## Tuning

### Adjust Visual Parameters

Start with the default thresholds and tune based on observation:

1. **Too bright overall**: Lower all brightness ranges by 20
2. **Too dim overall**: Raise all brightness ranges by 20
3. **Clusters too tight**: Lower clustering strength values
4. **Clusters too loose**: Raise clustering strength values
5. **Animation too fast**: Increase animation speed (ms values)
6. **Animation too slow**: Decrease animation speed (ms values)

### Adjust Performance Thresholds

Based on your portfolio's typical performance:

```sql
-- More sensitive (wider thriving range)
UPDATE settings SET value = 0.02 WHERE key = 'display_performance_thriving_threshold';

-- Less sensitive (narrower thriving range)
UPDATE settings SET value = 0.05 WHERE key = 'display_performance_thriving_threshold';
```

### Adjust Weighting

Prefer more recent performance:
```sql
UPDATE settings SET value = 0.90 WHERE key = 'display_performance_trailing12mo_weight';
UPDATE settings SET value = 0.10 WHERE key = 'display_performance_inception_weight';
```

Prefer since-inception performance:
```sql
UPDATE settings SET value = 0.50 WHERE key = 'display_performance_trailing12mo_weight';
UPDATE settings SET value = 0.50 WHERE key = 'display_performance_inception_weight';
```

## Implementation Files

### Go Backend
- `trader-go/internal/modules/settings/models.go` - Display settings definitions
- `trader-go/internal/modules/display/models.go` - Cluster data structures
- `trader-go/internal/modules/display/portfolio_performance.go` - Portfolio-level metrics
- `trader-go/internal/modules/display/security_performance.go` - Per-security metrics
- `trader-go/internal/modules/display/portfolio_display_calculator.go` - Core cluster calculation
- `trader-go/internal/server/system_handlers.go` - LED display API endpoint

### Arduino
- `arduino-app/sketch/portfolio_mode.h` - Cluster structures and function signatures
- `arduino-app/sketch/portfolio_mode.cpp` - Multi-cluster organic algorithm
- `arduino-app/sketch/sketch.ino` - Main loop integration

### Python Bridge
- `arduino-app/python/main.py` - Portfolio mode handler and Router Bridge integration

## Future Enhancements

Potential additions (not currently implemented):

1. **Vertical bias**: Rising/sinking animation based on trend direction
2. **Color coding**: Use RGB LEDs to indicate overall portfolio state
3. **Time-of-day variations**: Different visual themes for market hours vs after-hours
4. **Alert animations**: Special patterns for significant events (large gains/losses)
5. **Seasonal patterns**: Adjust brightness based on time of year

## Philosophy

The portfolio display embodies the project philosophy:
- **Autonomous**: Updates automatically without human intervention
- **Informative**: Conveys complex information through simple visual metaphors
- **Lean**: No unnecessary complexity, every parameter has purpose
- **Robust**: Graceful degradation when data unavailable

The visualization is not meant to replace detailed analytics - it provides **ambient awareness** of portfolio health that you can understand at a glance.
