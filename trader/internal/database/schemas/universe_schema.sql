-- Universe Database Schema
-- Single source of truth for universe.db
-- This schema represents the final state after all migrations

-- Securities table: investment universe (ISIN as PRIMARY KEY)
CREATE TABLE IF NOT EXISTS securities (
    isin TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    yahoo_symbol TEXT,
    name TEXT NOT NULL,
    product_type TEXT,
    industry TEXT,
    country TEXT,
    fullExchangeName TEXT,
    priority_multiplier REAL DEFAULT 1.0,
    min_lot INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,  -- Boolean: 1 = active, 0 = inactive (soft delete)
    allow_buy INTEGER DEFAULT 1,
    allow_sell INTEGER DEFAULT 1,
    currency TEXT,
    last_synced TEXT,  -- ISO 8601 timestamp
    min_portfolio_target REAL,
    max_portfolio_target REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_securities_active ON securities(active);
CREATE INDEX IF NOT EXISTS idx_securities_country ON securities(country);
CREATE INDEX IF NOT EXISTS idx_securities_industry ON securities(industry);
CREATE INDEX IF NOT EXISTS idx_securities_symbol ON securities(symbol);

-- Country groups: custom groupings for allocation strategies
CREATE TABLE IF NOT EXISTS country_groups (
    group_name TEXT NOT NULL,
    country_name TEXT NOT NULL,  -- '__EMPTY__' is special marker for empty groups
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (group_name, country_name)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_country_groups_group ON country_groups(group_name);

-- Industry groups: custom groupings for diversification strategies
CREATE TABLE IF NOT EXISTS industry_groups (
    group_name TEXT NOT NULL,
    industry_name TEXT NOT NULL,  -- '__EMPTY__' is special marker for empty groups
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (group_name, industry_name)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_industry_groups_group ON industry_groups(group_name);

-- Tags table: tag definitions with ID and human-readable name
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,  -- e.g., 'value-opportunity', 'volatile', 'stable'
    name TEXT NOT NULL,   -- e.g., 'Value Opportunity', 'Volatile', 'Stable'
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
) STRICT;

-- Security tags junction table: links securities to tags (many-to-many, ISIN-based)
CREATE TABLE IF NOT EXISTS security_tags (
    isin TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (isin, tag_id),
    FOREIGN KEY (isin) REFERENCES securities(isin) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_security_tags_isin ON security_tags(isin);
CREATE INDEX IF NOT EXISTS idx_security_tags_tag_id ON security_tags(tag_id);

-- Insert default tags (from migrations 028 and 032)
-- Quality Gate Tags
INSERT OR IGNORE INTO tags (id, name, created_at, updated_at) VALUES
    ('quality-gate-pass', 'Quality Gate Pass', datetime('now'), datetime('now')),
    ('quality-gate-fail', 'Quality Gate Fail', datetime('now'), datetime('now')),
    ('quality-value', 'Quality Value', datetime('now'), datetime('now'));

-- Bubble Detection Tags
INSERT OR IGNORE INTO tags (id, name, created_at, updated_at) VALUES
    ('bubble-risk', 'Bubble Risk', datetime('now'), datetime('now')),
    ('quality-high-cagr', 'Quality High CAGR', datetime('now'), datetime('now')),
    ('poor-risk-adjusted', 'Poor Risk-Adjusted', datetime('now'), datetime('now')),
    ('high-sharpe', 'High Sharpe', datetime('now'), datetime('now')),
    ('high-sortino', 'High Sortino', datetime('now'), datetime('now'));

-- Value Trap Tags
INSERT OR IGNORE INTO tags (id, name, created_at, updated_at) VALUES
    ('value-trap', 'Value Trap', datetime('now'), datetime('now'));

-- Total Return Tags
INSERT OR IGNORE INTO tags (id, name, created_at, updated_at) VALUES
    ('high-total-return', 'High Total Return', datetime('now'), datetime('now')),
    ('excellent-total-return', 'Excellent Total Return', datetime('now'), datetime('now')),
    ('dividend-total-return', 'Dividend Total Return', datetime('now'), datetime('now')),
    ('moderate-total-return', 'Moderate Total Return', datetime('now'), datetime('now'));

-- Optimizer Alignment Tags
INSERT OR IGNORE INTO tags (id, name, created_at, updated_at) VALUES
    ('underweight', 'Underweight', datetime('now'), datetime('now')),
    ('target-aligned', 'Target Aligned', datetime('now'), datetime('now')),
    ('needs-rebalance', 'Needs Rebalance', datetime('now'), datetime('now')),
    ('slightly-overweight', 'Slightly Overweight', datetime('now'), datetime('now')),
    ('slightly-underweight', 'Slightly Underweight', datetime('now'), datetime('now'));

-- Regime-Specific Tags
INSERT OR IGNORE INTO tags (id, name, created_at, updated_at) VALUES
    ('regime-bear-safe', 'Bear Market Safe', datetime('now'), datetime('now')),
    ('regime-bull-growth', 'Bull Market Growth', datetime('now'), datetime('now')),
    ('regime-sideways-value', 'Sideways Value', datetime('now'), datetime('now')),
    ('regime-volatile', 'Regime Volatile', datetime('now'), datetime('now'));
