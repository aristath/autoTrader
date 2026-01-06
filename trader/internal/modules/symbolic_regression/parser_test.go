package symbolic_regression

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseFormula_SimpleExpression(t *testing.T) {
	// Formula: 0.65*cagr + 0.28*score
	formulaStr := "0.65*cagr + 0.28*score"

	formula, err := ParseFormula(formulaStr)
	require.NoError(t, err)
	require.NotNil(t, formula)

	// Test evaluation
	variables := map[string]float64{
		"cagr":  0.12,
		"score": 0.75,
	}

	result := formula.Evaluate(variables)
	expected := 0.65*0.12 + 0.28*0.75
	assert.InDelta(t, expected, result, 0.001)
}

func TestParseFormula_WithRegime(t *testing.T) {
	// Formula: cagr + regime*0.1
	formulaStr := "cagr + regime*0.1"

	formula, err := ParseFormula(formulaStr)
	require.NoError(t, err)
	require.NotNil(t, formula)

	variables := map[string]float64{
		"cagr":   0.12,
		"regime": 0.3,
	}

	result := formula.Evaluate(variables)
	expected := 0.12 + 0.3*0.1
	assert.InDelta(t, expected, result, 0.001)
}

func TestParseFormula_ComplexExpression(t *testing.T) {
	// Formula: (cagr * score) + sqrt(regime + 1.0)
	formulaStr := "(cagr * score) + sqrt(regime + 1.0)"

	formula, err := ParseFormula(formulaStr)
	require.NoError(t, err)
	require.NotNil(t, formula)

	variables := map[string]float64{
		"cagr":   0.12,
		"score":  0.75,
		"regime": 0.3,
	}

	result := formula.Evaluate(variables)
	// Should be valid (not NaN or Inf)
	assert.False(t, isNaNOrInf(result))
}

func TestParseFormula_InvalidExpression(t *testing.T) {
	// Invalid: unmatched parentheses
	formulaStr := "(cagr + score"

	_, err := ParseFormula(formulaStr)
	assert.Error(t, err)
}

func TestFormulaToFunction_ExpectedReturn(t *testing.T) {
	// Create a simple formula node
	formula := &Node{
		Type: NodeTypeOperation,
		Op:   OpAdd,
		Left: &Node{
			Type: NodeTypeOperation,
			Op:   OpMultiply,
			Left: &Node{
				Type:     NodeTypeVariable,
				Variable: "cagr",
			},
			Right: &Node{
				Type:  NodeTypeConstant,
				Value: 0.65,
			},
		},
		Right: &Node{
			Type: NodeTypeOperation,
			Op:   OpMultiply,
			Left: &Node{
				Type:     NodeTypeVariable,
				Variable: "total_score",
			},
			Right: &Node{
				Type:  NodeTypeConstant,
				Value: 0.28,
			},
		},
	}

	// Convert to function
	fn := FormulaToFunction(formula)
	require.NotNil(t, fn)

	// Test function
	inputs := TrainingInputs{
		CAGR:       0.12,
		TotalScore: 0.75,
	}

	result := fn(inputs)
	expected := 0.65*0.12 + 0.28*0.75
	assert.InDelta(t, expected, result, 0.001)
}

func isNaNOrInf(f float64) bool {
	return f != f || (f > 1e10) || (f < -1e10)
}
