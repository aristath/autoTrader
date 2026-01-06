package symbolic_regression

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNode_Evaluate_Constant(t *testing.T) {
	node := &Node{
		Type:  NodeTypeConstant,
		Value: 42.0,
	}

	result := node.Evaluate(nil)
	assert.Equal(t, 42.0, result)
}

func TestNode_Evaluate_Variable(t *testing.T) {
	node := &Node{
		Type:     NodeTypeVariable,
		Variable: "cagr",
	}

	variables := map[string]float64{
		"cagr": 0.12,
	}

	result := node.Evaluate(variables)
	assert.Equal(t, 0.12, result)
}

func TestNode_Evaluate_Add(t *testing.T) {
	node := &Node{
		Type: NodeTypeOperation,
		Op:   OpAdd,
		Left: &Node{
			Type:  NodeTypeConstant,
			Value: 10.0,
		},
		Right: &Node{
			Type:  NodeTypeConstant,
			Value: 5.0,
		},
	}

	result := node.Evaluate(nil)
	assert.Equal(t, 15.0, result)
}

func TestNode_Evaluate_Multiply(t *testing.T) {
	node := &Node{
		Type: NodeTypeOperation,
		Op:   OpMultiply,
		Left: &Node{
			Type:     NodeTypeVariable,
			Variable: "cagr",
		},
		Right: &Node{
			Type:  NodeTypeConstant,
			Value: 2.0,
		},
	}

	variables := map[string]float64{
		"cagr": 0.12,
	}

	result := node.Evaluate(variables)
	assert.Equal(t, 0.24, result)
}

func TestNode_Evaluate_Divide(t *testing.T) {
	node := &Node{
		Type: NodeTypeOperation,
		Op:   OpDivide,
		Left: &Node{
			Type:  NodeTypeConstant,
			Value: 10.0,
		},
		Right: &Node{
			Type:  NodeTypeConstant,
			Value: 2.0,
		},
	}

	result := node.Evaluate(nil)
	assert.Equal(t, 5.0, result)
}

func TestNode_Evaluate_DivideByZero(t *testing.T) {
	node := &Node{
		Type: NodeTypeOperation,
		Op:   OpDivide,
		Left: &Node{
			Type:  NodeTypeConstant,
			Value: 10.0,
		},
		Right: &Node{
			Type:  NodeTypeConstant,
			Value: 0.0,
		},
	}

	result := node.Evaluate(nil)
	// Should return a safe value (1.0) instead of infinity
	assert.True(t, !math.IsInf(result, 0) && !math.IsNaN(result))
}

func TestNode_Evaluate_Sqrt(t *testing.T) {
	node := &Node{
		Type: NodeTypeOperation,
		Op:   OpSqrt,
		Left: &Node{
			Type:  NodeTypeConstant,
			Value: 16.0,
		},
	}

	result := node.Evaluate(nil)
	assert.InDelta(t, 4.0, result, 0.001)
}

func TestNode_Evaluate_Log(t *testing.T) {
	node := &Node{
		Type: NodeTypeOperation,
		Op:   OpLog,
		Left: &Node{
			Type:  NodeTypeConstant,
			Value: math.E,
		},
	}

	result := node.Evaluate(nil)
	assert.InDelta(t, 1.0, result, 0.001)
}

func TestNode_Evaluate_LogNegative(t *testing.T) {
	node := &Node{
		Type: NodeTypeOperation,
		Op:   OpLog,
		Left: &Node{
			Type:  NodeTypeConstant,
			Value: -1.0,
		},
	}

	result := node.Evaluate(nil)
	// Should return safe value instead of NaN
	assert.True(t, !math.IsNaN(result))
}

func TestNode_String(t *testing.T) {
	// Formula: (cagr * 2.0) + 0.1
	node := &Node{
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
				Value: 2.0,
			},
		},
		Right: &Node{
			Type:  NodeTypeConstant,
			Value: 0.1,
		},
	}

	str := node.String()
	// Should contain the formula representation
	assert.Contains(t, str, "cagr")
}

func TestRandomFormula_GeneratesValidFormula(t *testing.T) {
	variables := []string{"cagr", "score", "regime"}

	formula := RandomFormula(variables, 3, 5) // Max depth 3, max nodes 5

	require.NotNil(t, formula)

	// Should be able to evaluate with test variables
	variablesMap := map[string]float64{
		"cagr":   0.12,
		"score":  0.75,
		"regime": 0.3,
	}

	result := formula.Evaluate(variablesMap)
	assert.True(t, !math.IsNaN(result) && !math.IsInf(result, 0))
}

func TestMutate_ChangesFormula(t *testing.T) {
	original := &Node{
		Type:  NodeTypeConstant,
		Value: 10.0,
	}

	variables := []string{"cagr", "score"}
	mutated := Mutate(original, variables, 0.5) // 50% mutation rate

	require.NotNil(t, mutated)

	// Mutated formula should be different (or same if mutation didn't trigger)
	// Just verify it's valid
	variablesMap := map[string]float64{
		"cagr":  0.12,
		"score": 0.75,
	}

	result := mutated.Evaluate(variablesMap)
	assert.True(t, !math.IsNaN(result) && !math.IsInf(result, 0))
}

func TestCrossover_CombinesFormulas(t *testing.T) {
	formula1 := &Node{
		Type: NodeTypeOperation,
		Op:   OpAdd,
		Left: &Node{
			Type:     NodeTypeVariable,
			Variable: "cagr",
		},
		Right: &Node{
			Type:  NodeTypeConstant,
			Value: 0.1,
		},
	}

	formula2 := &Node{
		Type: NodeTypeOperation,
		Op:   OpMultiply,
		Left: &Node{
			Type:     NodeTypeVariable,
			Variable: "score",
		},
		Right: &Node{
			Type:  NodeTypeConstant,
			Value: 2.0,
		},
	}

	child1, child2 := Crossover(formula1, formula2)

	require.NotNil(t, child1)
	require.NotNil(t, child2)

	// Both children should be valid
	variablesMap := map[string]float64{
		"cagr":  0.12,
		"score": 0.75,
	}

	result1 := child1.Evaluate(variablesMap)
	result2 := child2.Evaluate(variablesMap)

	assert.True(t, !math.IsNaN(result1) && !math.IsInf(result1, 0))
	assert.True(t, !math.IsNaN(result2) && !math.IsInf(result2, 0))
}

func TestCalculateFitness_MAE(t *testing.T) {
	// Formula: cagr (simple identity)
	formula := &Node{
		Type:     NodeTypeVariable,
		Variable: "cagr",
	}

	examples := []TrainingExample{
		{
			Inputs: TrainingInputs{
				CAGR: 0.10,
			},
			TargetReturn: 0.10,
		},
		{
			Inputs: TrainingInputs{
				CAGR: 0.12,
			},
			TargetReturn: 0.12,
		},
		{
			Inputs: TrainingInputs{
				CAGR: 0.08,
			},
			TargetReturn: 0.08,
		},
	}

	fitness := CalculateFitness(formula, examples, FitnessTypeMAE)

	// Perfect match should have very low MAE
	assert.Less(t, fitness, 0.001)
}

func TestCalculateFitness_Spearman(t *testing.T) {
	// Formula: score (simple identity)
	formula := &Node{
		Type:     NodeTypeVariable,
		Variable: "total_score",
	}

	examples := []TrainingExample{
		{
			Inputs: TrainingInputs{
				TotalScore: 0.9,
			},
			TargetReturn: 0.15, // High score -> high return
		},
		{
			Inputs: TrainingInputs{
				TotalScore: 0.7,
			},
			TargetReturn: 0.10,
		},
		{
			Inputs: TrainingInputs{
				TotalScore: 0.5,
			},
			TargetReturn: 0.05, // Low score -> low return
		},
	}

	fitness := CalculateFitness(formula, examples, FitnessTypeSpearman)

	// Fitness is 1.0 - correlation, so lower is better
	// For positive correlation, fitness should be < 1.0
	// For perfect correlation (1.0), fitness would be 0.0
	assert.Less(t, fitness, 1.0, "Fitness should be less than 1.0 for positive correlation")
	assert.GreaterOrEqual(t, fitness, 0.0, "Fitness should be non-negative")
}

func TestCalculateComplexity(t *testing.T) {
	// Simple formula: constant
	simple := &Node{
		Type:  NodeTypeConstant,
		Value: 10.0,
	}

	// Complex formula: (cagr * score) + (regime / 2.0)
	complex := &Node{
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
				Type:     NodeTypeVariable,
				Variable: "score",
			},
		},
		Right: &Node{
			Type: NodeTypeOperation,
			Op:   OpDivide,
			Left: &Node{
				Type:     NodeTypeVariable,
				Variable: "regime",
			},
			Right: &Node{
				Type:  NodeTypeConstant,
				Value: 2.0,
			},
		},
	}

	simpleComplexity := CalculateComplexity(simple)
	complexComplexity := CalculateComplexity(complex)

	assert.Less(t, simpleComplexity, complexComplexity)
}
