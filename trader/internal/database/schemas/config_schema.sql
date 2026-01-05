-- Config Database Schema
-- Single source of truth for config.db
-- This schema represents the final state after all migrations

-- Settings table: application configuration (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL
) STRICT;

-- Allocation targets table: group-based allocation rules
CREATE TABLE IF NOT EXISTS allocation_targets (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,      -- 'geography', 'industry', 'country_group', 'industry_group'
    name TEXT NOT NULL,
    target_pct REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(type, name)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_allocation_type ON allocation_targets(type);

-- Planner settings: Direct storage of planner configuration
-- Single row table (only one config exists)
CREATE TABLE IF NOT EXISTS planner_settings (
    -- Primary key (constant value - only one row exists)
    id TEXT PRIMARY KEY DEFAULT 'main',

    -- Basic identification
    name TEXT NOT NULL DEFAULT 'default',
    description TEXT DEFAULT '',

    -- Global planner settings
    enable_batch_generation INTEGER DEFAULT 1,  -- Boolean
    max_depth INTEGER DEFAULT 5,
    max_opportunities_per_category INTEGER DEFAULT 5,
    enable_diverse_selection INTEGER DEFAULT 1,  -- Boolean
    diversity_weight REAL DEFAULT 0.3,

    -- Transaction costs
    transaction_cost_fixed REAL DEFAULT 5.0,
    transaction_cost_percent REAL DEFAULT 0.001,

    -- Trade permissions
    allow_sell INTEGER DEFAULT 1,  -- Boolean
    allow_buy INTEGER DEFAULT 1,   -- Boolean

    -- Risk management settings
    min_hold_days INTEGER DEFAULT 90,
    sell_cooldown_days INTEGER DEFAULT 180,
    max_loss_threshold REAL DEFAULT -0.20,
    max_sell_percentage REAL DEFAULT 0.20,

    -- Opportunity Calculator enabled flags
    enable_profit_taking_calc INTEGER DEFAULT 1,
    enable_averaging_down_calc INTEGER DEFAULT 1,
    enable_opportunity_buys_calc INTEGER DEFAULT 1,
    enable_rebalance_sells_calc INTEGER DEFAULT 1,
    enable_rebalance_buys_calc INTEGER DEFAULT 1,
    enable_weight_based_calc INTEGER DEFAULT 1,

    -- Pattern Generator enabled flags
    enable_direct_buy_pattern INTEGER DEFAULT 1,
    enable_profit_taking_pattern INTEGER DEFAULT 1,
    enable_rebalance_pattern INTEGER DEFAULT 1,
    enable_averaging_down_pattern INTEGER DEFAULT 1,
    enable_single_best_pattern INTEGER DEFAULT 1,
    enable_multi_sell_pattern INTEGER DEFAULT 1,
    enable_mixed_strategy_pattern INTEGER DEFAULT 1,
    enable_opportunity_first_pattern INTEGER DEFAULT 1,
    enable_deep_rebalance_pattern INTEGER DEFAULT 1,
    enable_cash_generation_pattern INTEGER DEFAULT 1,
    enable_cost_optimized_pattern INTEGER DEFAULT 1,
    enable_adaptive_pattern INTEGER DEFAULT 1,
    enable_market_regime_pattern INTEGER DEFAULT 1,

    -- Sequence Generator enabled flags
    enable_combinatorial_generator INTEGER DEFAULT 1,
    enable_enhanced_combinatorial_generator INTEGER DEFAULT 1,
    enable_constraint_relaxation_generator INTEGER DEFAULT 1,

    -- Filter enabled flags
    enable_correlation_aware_filter INTEGER DEFAULT 1,
    enable_diversity_filter INTEGER DEFAULT 1,
    enable_eligibility_filter INTEGER DEFAULT 1,
    enable_recently_traded_filter INTEGER DEFAULT 1,

    -- Optimizer settings
    optimizer_blend REAL DEFAULT 0.5,  -- Blend between Mean-Variance (0.0) and HRP (1.0)

    -- Timestamps
    updated_at TEXT NOT NULL
) STRICT;

-- Insert default row (single row table - use INSERT OR REPLACE)
INSERT OR REPLACE INTO planner_settings (id, name, description, updated_at)
VALUES ('main', 'default', 'Default planner configuration', datetime('now'));
