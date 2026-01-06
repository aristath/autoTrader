package formulas

import (
	"fmt"
	"math"

	"gonum.org/v1/gonum/stat"
)

// CalculateCorrelationMatrix calculates the correlation matrix from returns.
//
// Formula: correlation(i,j) = covariance(i,j) / sqrt(variance(i) * variance(j))
//
// Args:
//   - returns: Map of symbol to returns array
//   - symbols: Ordered list of symbols (determines matrix row/column order)
//
// Returns:
//   - Correlation matrix [][]float64 where corrMatrix[i][j] is correlation between symbols[i] and symbols[j]
//   - Error if calculation fails
func CalculateCorrelationMatrix(returns map[string][]float64, symbols []string) ([][]float64, error) {
	n := len(symbols)
	if n == 0 {
		return nil, fmt.Errorf("no symbols provided")
	}

	// Find return length
	var returnLength int
	for _, symbol := range symbols {
		ret, ok := returns[symbol]
		if !ok {
			return nil, fmt.Errorf("missing returns for symbol %s", symbol)
		}
		if returnLength == 0 {
			returnLength = len(ret)
		}
		if len(ret) != returnLength {
			return nil, fmt.Errorf("inconsistent return lengths")
		}
	}

	// Calculate correlation matrix
	corrMatrix := make([][]float64, n)
	for i := range corrMatrix {
		corrMatrix[i] = make([]float64, n)
	}

	for i := 0; i < n; i++ {
		for j := i; j < n; j++ {
			retI := returns[symbols[i]]
			retJ := returns[symbols[j]]

			// Calculate correlation
			corr := stat.Correlation(retI, retJ, nil)

			// Ensure correlation is in valid range [-1, 1]
			corr = math.Max(-1.0, math.Min(1.0, corr))

			corrMatrix[i][j] = corr
			if i != j {
				corrMatrix[j][i] = corr // Symmetry
			}
		}
		corrMatrix[i][i] = 1.0 // Self-correlation
	}

	return corrMatrix, nil
}

// CorrelationToDistance converts correlation matrix to distance matrix.
// Distance formula: d_ij = sqrt(2 * (1 - ρ_ij))
// where ρ_ij is the correlation between assets i and j.
//
// This is used in hierarchical clustering for HRP optimization.
//
// Args:
//   - corrMatrix: Correlation matrix
//
// Returns:
//   - Distance matrix where distance[i][j] is the distance between assets i and j
func CorrelationToDistance(corrMatrix [][]float64) [][]float64 {
	n := len(corrMatrix)
	distMatrix := make([][]float64, n)

	for i := 0; i < n; i++ {
		distMatrix[i] = make([]float64, n)
		for j := 0; j < n; j++ {
			corr := corrMatrix[i][j]
			// Clamp correlation to valid range
			corr = math.Max(-1.0, math.Min(1.0, corr))
			distMatrix[i][j] = math.Sqrt(2.0 * (1.0 - corr))
		}
	}

	return distMatrix
}

// InverseVarianceWeights calculates risk parity weights using inverse variance weighting.
// This is a simplified HRP implementation that achieves risk parity without full dendrogram traversal.
//
// Formula: w_i = (1/v_i) / Σ(1/v_j)
// where v_i is the variance of asset i.
//
// This gives higher weights to assets with lower variance (lower risk).
//
// Args:
//   - variances: Vector of variances for each asset
//
// Returns:
//   - Vector of weights (sums to 1.0)
func InverseVarianceWeights(variances []float64) []float64 {
	n := len(variances)
	weights := make([]float64, n)

	var totalInvVariance float64
	for _, v := range variances {
		if v > 0 {
			totalInvVariance += 1.0 / v
		}
	}

	if totalInvVariance == 0 {
		// If all variances are zero or invalid, use equal weights
		for i := range weights {
			weights[i] = 1.0 / float64(n)
		}
		return weights
	}

	for i, v := range variances {
		if v > 0 {
			weights[i] = (1.0 / v) / totalInvVariance
		} else {
			weights[i] = 0.0
		}
	}

	return weights
}
