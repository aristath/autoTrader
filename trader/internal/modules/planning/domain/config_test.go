package domain

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewDefaultConfiguration(t *testing.T) {
	config := NewDefaultConfiguration()

	assert.NotNil(t, config)
	assert.Equal(t, "default", config.Name)
	assert.True(t, config.EnableBatchGeneration)
	assert.Equal(t, 5, config.MaxDepth)
	assert.Equal(t, 5, config.MaxOpportunitiesPerCategory)
	assert.Equal(t, 0.3, config.PriorityThreshold)
	assert.Equal(t, 10, config.BeamWidth)
	assert.True(t, config.EnableDiverseSelection)
	assert.Equal(t, 0.3, config.DiversityWeight)
	assert.Equal(t, 5.0, config.TransactionCostFixed)
	assert.Equal(t, 0.001, config.TransactionCostPercent)
	assert.True(t, config.AllowSell)
	assert.True(t, config.AllowBuy)

	// All modules should be enabled by default
	assert.True(t, config.EnableProfitTakingCalc)
	assert.True(t, config.EnableAveragingDownCalc)
	assert.True(t, config.EnableOpportunityBuysCalc)
	assert.True(t, config.EnableRebalanceSellsCalc)
	assert.True(t, config.EnableRebalanceBuysCalc)
	assert.True(t, config.EnableWeightBasedCalc)
	assert.True(t, config.EnableDirectBuyPattern)
	assert.True(t, config.EnableProfitTakingPattern)
	assert.True(t, config.EnableRebalancePattern)
	assert.True(t, config.EnableAdaptivePattern)
	assert.True(t, config.EnableCombinatorialGenerator)
	assert.True(t, config.EnableCorrelationAwareFilter)
}

func TestGetEnabledCalculators(t *testing.T) {
	tests := []struct {
		name     string
		config   *PlannerConfiguration
		expected []string
	}{
		{
			name: "all enabled",
			config: &PlannerConfiguration{
				EnableProfitTakingCalc:    true,
				EnableAveragingDownCalc:   true,
				EnableOpportunityBuysCalc: true,
				EnableRebalanceSellsCalc:  true,
				EnableRebalanceBuysCalc:   true,
				EnableWeightBasedCalc:     true,
			},
			expected: []string{"profit_taking", "averaging_down", "opportunity_buys", "rebalance_sells", "rebalance_buys", "weight_based"},
		},
		{
			name: "only profit taking enabled",
			config: &PlannerConfiguration{
				EnableProfitTakingCalc:    true,
				EnableAveragingDownCalc:   false,
				EnableOpportunityBuysCalc: false,
				EnableRebalanceSellsCalc:  false,
				EnableRebalanceBuysCalc:   false,
				EnableWeightBasedCalc:     false,
			},
			expected: []string{"profit_taking"},
		},
		{
			name: "none enabled",
			config: &PlannerConfiguration{
				EnableProfitTakingCalc:    false,
				EnableAveragingDownCalc:   false,
				EnableOpportunityBuysCalc: false,
				EnableRebalanceSellsCalc:  false,
				EnableRebalanceBuysCalc:   false,
				EnableWeightBasedCalc:     false,
			},
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			enabled := tt.config.GetEnabledCalculators()
			assert.ElementsMatch(t, tt.expected, enabled)
		})
	}
}

func TestGetEnabledPatterns(t *testing.T) {
	config := NewDefaultConfiguration()
	enabled := config.GetEnabledPatterns()

	// Default config has all patterns enabled
	assert.Len(t, enabled, 13)
	assert.Contains(t, enabled, "direct_buy")
	assert.Contains(t, enabled, "profit_taking")
	assert.Contains(t, enabled, "rebalance")
	assert.Contains(t, enabled, "averaging_down")
	assert.Contains(t, enabled, "single_best")
	assert.Contains(t, enabled, "multi_sell")
	assert.Contains(t, enabled, "mixed_strategy")
	assert.Contains(t, enabled, "opportunity_first")
	assert.Contains(t, enabled, "deep_rebalance")
	assert.Contains(t, enabled, "cash_generation")
	assert.Contains(t, enabled, "cost_optimized")
	assert.Contains(t, enabled, "adaptive")
	assert.Contains(t, enabled, "market_regime")
}

func TestGetEnabledGenerators(t *testing.T) {
	config := NewDefaultConfiguration()
	enabled := config.GetEnabledGenerators()

	// Default config has all generators enabled
	assert.Len(t, enabled, 4)
	assert.Contains(t, enabled, "combinatorial")
	assert.Contains(t, enabled, "enhanced_combinatorial")
	assert.Contains(t, enabled, "partial_execution")
	assert.Contains(t, enabled, "constraint_relaxation")
}

func TestGetEnabledFilters(t *testing.T) {
	config := NewDefaultConfiguration()
	enabled := config.GetEnabledFilters()

	// Default config has all filters enabled
	assert.Len(t, enabled, 4)
	assert.Contains(t, enabled, "correlation_aware")
	assert.Contains(t, enabled, "diversity")
	assert.Contains(t, enabled, "eligibility")
	assert.Contains(t, enabled, "recently_traded")
}

func TestGetCalculatorParams(t *testing.T) {
	config := &PlannerConfiguration{}

	// Simplified: Returns empty map (parameters removed)
	params := config.GetCalculatorParams("profit_taking")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)

	// Non-existent calculator should return empty map
	params = config.GetCalculatorParams("non_existent")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)
}

func TestGetPatternParams(t *testing.T) {
	config := &PlannerConfiguration{}

	// Simplified: Returns empty map (parameters removed)
	params := config.GetPatternParams("adaptive")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)

	// Non-existent pattern should return empty map
	params = config.GetPatternParams("non_existent")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)
}

func TestGetGeneratorParams(t *testing.T) {
	config := &PlannerConfiguration{}

	// Simplified: Returns empty map (parameters removed)
	params := config.GetGeneratorParams("combinatorial")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)

	// Non-existent generator should return empty map
	params = config.GetGeneratorParams("non_existent")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)
}

func TestGetFilterParams(t *testing.T) {
	config := &PlannerConfiguration{}

	// Simplified: Returns empty map (parameters removed)
	params := config.GetFilterParams("diversity")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)

	// Non-existent filter should return empty map
	params = config.GetFilterParams("non_existent")
	assert.NotNil(t, params)
	assert.Len(t, params, 0)
}
