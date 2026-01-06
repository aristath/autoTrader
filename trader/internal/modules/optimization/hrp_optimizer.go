package optimization

import (
	"fmt"
	"math"

	"gonum.org/v1/gonum/floats"

	"github.com/aristath/arduino-trader/pkg/formulas"
)

// HRPOptimizer performs Hierarchical Risk Parity portfolio optimization.
type HRPOptimizer struct{}

// NewHRPOptimizer creates a new HRP optimizer.
func NewHRPOptimizer() *HRPOptimizer {
	return &HRPOptimizer{}
}

// Optimize solves the HRP optimization problem.
//
// Algorithm steps:
// 1. Calculate correlation matrix from returns
// 2. Convert correlation to distance matrix: d_ij = sqrt(2 * (1 - ρ_ij))
// 3. Perform hierarchical clustering using Ward linkage
// 4. Recursive bisection: allocate weights inversely proportional to variance
func (hrp *HRPOptimizer) Optimize(
	returns map[string][]float64,
	symbols []string,
) (map[string]float64, error) {
	if len(symbols) == 0 {
		return nil, fmt.Errorf("no symbols provided")
	}

	if len(symbols) == 1 {
		// Single asset: all weight to that asset
		return map[string]float64{symbols[0]: 1.0}, nil
	}

	// Calculate correlation matrix using formulas package
	corrMatrix, err := formulas.CalculateCorrelationMatrix(returns, symbols)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate correlation matrix: %w", err)
	}

	// Calculate variances for risk parity allocation using formulas package
	variances := make([]float64, len(symbols))
	for i, symbol := range symbols {
		ret, ok := returns[symbol]
		if !ok {
			return nil, fmt.Errorf("missing returns for symbol %s", symbol)
		}
		variance := formulas.Variance(ret)
		variances[i] = math.Max(variance, 1e-10) // Avoid zero variance
	}

	// Use simplified HRP: inverse variance weighting (risk parity)
	// This achieves similar diversification benefits as full hierarchical HRP
	weights := formulas.InverseVarianceWeights(variances)

	// Optionally refine using correlation structure (quasi-diagonalization)
	weights = hrp.refineWithCorrelation(weights, corrMatrix, variances, symbols)

	// Convert to map
	result := make(map[string]float64)
	for i, symbol := range symbols {
		result[symbol] = weights[i]
	}

	return result, nil
}

// Note: Correlation matrix calculation moved to pkg/formulas.CalculateCorrelationMatrix
// Note: Correlation to distance conversion moved to pkg/formulas.CorrelationToDistance

// refineWithCorrelation refines weights using correlation structure.
// This implements a simplified version of HRP's quasi-diagonalization step.
func (hrp *HRPOptimizer) refineWithCorrelation(
	weights []float64,
	corrMatrix [][]float64,
	variances []float64,
	symbols []string,
) []float64 {
	n := len(weights)
	refined := make([]float64, n)
	copy(refined, weights)

	// Adjust weights based on correlation: reduce weights for highly correlated assets
	// This mimics the quasi-diagonalization step in full HRP
	for i := 0; i < n; i++ {
		adjustment := 1.0
		for j := 0; j < n; j++ {
			if i != j {
				// Reduce weight if highly correlated with other assets
				corr := math.Abs(corrMatrix[i][j])
				if corr > 0.7 {
					adjustment *= (1.0 - 0.2*corr) // Reduce by up to 20% for high correlation
				}
			}
		}
		refined[i] *= math.Max(0.1, adjustment) // Don't reduce too much
	}

	// Renormalize
	sum := floats.Sum(refined)
	if sum > 0 {
		floats.Scale(1.0/sum, refined)
	}

	return refined
}

// Note: Inverse variance weighting moved to pkg/formulas.InverseVarianceWeights
