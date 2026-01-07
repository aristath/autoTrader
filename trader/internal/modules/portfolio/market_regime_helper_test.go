package portfolio

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCalculateMean(t *testing.T) {
	tests := []struct {
		name     string
		values   []float64
		expected float64
	}{
		{
			name:     "empty slice",
			values:   []float64{},
			expected: 0.0,
		},
		{
			name:     "single value",
			values:   []float64{5.0},
			expected: 5.0,
		},
		{
			name:     "multiple values",
			values:   []float64{1.0, 2.0, 3.0, 4.0, 5.0},
			expected: 3.0,
		},
		{
			name:     "negative values",
			values:   []float64{-1.0, 0.0, 1.0},
			expected: 0.0,
		},
		{
			name:     "decimal values",
			values:   []float64{1.5, 2.5, 3.5},
			expected: 2.5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateMean(tt.values)
			assert.InDelta(t, tt.expected, result, 0.0001)
		})
	}
}

func TestCalculateStdDev(t *testing.T) {
	tests := []struct {
		name     string
		values   []float64
		expected float64
	}{
		{
			name:     "empty slice",
			values:   []float64{},
			expected: 0.0,
		},
		{
			name:     "single value",
			values:   []float64{5.0},
			expected: 0.0, // No deviation for single value
		},
		{
			name:     "constant values",
			values:   []float64{3.0, 3.0, 3.0},
			expected: 0.0,
		},
		{
			name:     "simple deviation",
			values:   []float64{1.0, 3.0, 5.0},
			expected: 1.633, // sqrt(8/3) ≈ 1.633
		},
		{
			name:     "returns data",
			values:   []float64{0.01, -0.02, 0.03, -0.01, 0.02},
			expected: 0.01897, // Approximate
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateStdDev(tt.values)
			assert.InDelta(t, tt.expected, result, 0.01)
		})
	}
}

func TestSqrt(t *testing.T) {
	tests := []struct {
		name     string
		input    float64
		expected float64
	}{
		{
			name:     "zero",
			input:    0.0,
			expected: 0.0,
		},
		{
			name:     "one",
			input:    1.0,
			expected: 1.0,
		},
		{
			name:     "four",
			input:    4.0,
			expected: 2.0,
		},
		{
			name:     "nine",
			input:    9.0,
			expected: 3.0,
		},
		{
			name:     "decimal",
			input:    2.0,
			expected: 1.414, // sqrt(2) ≈ 1.414
		},
		{
			name:     "large number",
			input:    100.0,
			expected: 10.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sqrt(tt.input)
			assert.InDelta(t, tt.expected, result, 0.01)
		})
	}
}

func TestCalculateMaxDrawdown(t *testing.T) {
	tests := []struct {
		name     string
		returns  []float64
		expected float64
		desc     string
	}{
		{
			name:     "empty slice",
			returns:  []float64{},
			expected: 0.0,
			desc:     "Empty returns should return 0",
		},
		{
			name:     "single return",
			returns:  []float64{0.01},
			expected: 0.0,
			desc:     "Single return has no drawdown",
		},
		{
			name:     "all positive returns",
			returns:  []float64{0.01, 0.02, 0.03},
			expected: 0.0,
			desc:     "No drawdown if all returns are positive",
		},
		{
			name:     "simple drawdown",
			returns:  []float64{0.10, -0.05, -0.03, 0.02},
			expected: -0.078, // Max drawdown is negative (decline from peak)
			desc:     "Simple drawdown calculation",
		},
		{
			name:     "negative returns",
			returns:  []float64{-0.05, -0.10, -0.03},
			expected: -0.174, // Max drawdown is negative
			desc:     "Drawdown with negative returns",
		},
		{
			name:     "recovery after drawdown",
			returns:  []float64{0.10, -0.15, 0.05, 0.10},
			expected: -0.15, // Max drawdown is negative
			desc:     "Max drawdown should capture the worst decline",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateMaxDrawdown(tt.returns)
			assert.InDelta(t, tt.expected, result, 0.01, tt.desc)
		})
	}
}
