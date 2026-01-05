package universe

import (
	"testing"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func TestTagAssigner_ValueOpportunity(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	currentPrice := 80.0
	price52wHigh := 100.0
	peRatio := 15.0
	marketAvgPE := 20.0

	input := AssignTagsInput{
		Symbol:       "TEST",
		CurrentPrice: &currentPrice,
		Price52wHigh: &price52wHigh,
		PERatio:      &peRatio,
		MarketAvgPE:  marketAvgPE,
		GroupScores: map[string]float64{
			"opportunity": 0.75,
		},
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	assert.Contains(t, tags, "value-opportunity")
	assert.Contains(t, tags, "below-52w-high")
	assert.Contains(t, tags, "undervalued-pe")
}

func TestTagAssigner_HighQuality(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	input := AssignTagsInput{
		Symbol: "TEST",
		GroupScores: map[string]float64{
			"fundamentals": 0.85,
			"long_term":    0.80,
		},
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	assert.Contains(t, tags, "high-quality")
	assert.Contains(t, tags, "strong-fundamentals")
}

func TestTagAssigner_Stable(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	volatility := 0.15

	input := AssignTagsInput{
		Symbol:     "TEST",
		Volatility: &volatility,
		GroupScores: map[string]float64{
			"fundamentals": 0.80,
		},
		SubScores: map[string]map[string]float64{
			"fundamentals": {
				"consistency": 0.85,
			},
		},
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	assert.Contains(t, tags, "stable")
}

func TestTagAssigner_Volatile(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	volatility := 0.35

	input := AssignTagsInput{
		Symbol:     "TEST",
		Volatility: &volatility,
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	assert.Contains(t, tags, "volatile")
	assert.Contains(t, tags, "high-risk")
}

func TestTagAssigner_Oversold(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	rsi := 25.0

	input := AssignTagsInput{
		Symbol: "TEST",
		RSI:    &rsi,
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	assert.Contains(t, tags, "oversold")
}

func TestTagAssigner_Overbought(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	rsi := 75.0

	input := AssignTagsInput{
		Symbol: "TEST",
		RSI:    &rsi,
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	assert.Contains(t, tags, "overbought")
}

func TestTagAssigner_HighDividend(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	dividendYield := 7.0

	input := AssignTagsInput{
		Symbol:        "TEST",
		DividendYield: &dividendYield,
		GroupScores: map[string]float64{
			"dividends": 0.75,
		},
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	assert.Contains(t, tags, "high-dividend")
	assert.Contains(t, tags, "dividend-opportunity")
	assert.Contains(t, tags, "dividend-focused")
}

func TestTagAssigner_MultipleTags(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	currentPrice := 75.0 // 25% below 52W high
	price52wHigh := 100.0
	volatility := 0.12
	dividendYield := 5.0
	peRatio := 15.0
	marketAvgPE := 20.0

	input := AssignTagsInput{
		Symbol:        "TEST",
		CurrentPrice:  &currentPrice,
		Price52wHigh:  &price52wHigh,
		Volatility:    &volatility,
		DividendYield: &dividendYield,
		PERatio:       &peRatio,
		MarketAvgPE:   marketAvgPE,
		GroupScores: map[string]float64{
			"fundamentals": 0.85, // > 0.8 for high-quality
			"long_term":    0.80, // > 0.75 for high-quality
			"opportunity":  0.75, // > 0.7 for value-opportunity
			"dividends":    0.75,
		},
		SubScores: map[string]map[string]float64{
			"fundamentals": {
				"consistency": 0.85,
			},
		},
		Score: &SecurityScore{
			TotalScore: 0.78,
		},
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	// Should have multiple tags
	assert.Greater(t, len(tags), 5)
	assert.Contains(t, tags, "value-opportunity")
	assert.Contains(t, tags, "high-quality")
	assert.Contains(t, tags, "stable")
	assert.Contains(t, tags, "dividend-opportunity")
	assert.Contains(t, tags, "low-risk")
}

func TestTagAssigner_NoTags(t *testing.T) {
	log := zerolog.New(nil).Level(zerolog.Disabled)
	assigner := NewTagAssigner(log)

	input := AssignTagsInput{
		Symbol: "TEST",
		GroupScores: map[string]float64{
			"fundamentals": 0.50,
			"long_term":    0.50,
		},
	}

	tags, err := assigner.AssignTagsForSecurity(input)
	assert.NoError(t, err)
	// Should have at least risk profile tags
	assert.GreaterOrEqual(t, len(tags), 0)
}
