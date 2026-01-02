package handlers

import (
	"net/http"

	"github.com/aristath/arduino-trader/services/evaluator-go/internal/evaluation"
	"github.com/aristath/arduino-trader/services/evaluator-go/internal/models"
	"github.com/gin-gonic/gin"
)

// AdvancedEvaluator handles advanced evaluation requests (Monte Carlo, Stochastic)
type AdvancedEvaluator struct{}

// NewAdvancedEvaluator creates a new advanced evaluator handler
func NewAdvancedEvaluator() *AdvancedEvaluator {
	return &AdvancedEvaluator{}
}

// EvaluateMonteCarlo handles POST /api/v1/evaluate/monte-carlo
func (ae *AdvancedEvaluator) EvaluateMonteCarlo(c *gin.Context) {
	var request models.MonteCarloRequest

	// Parse request body
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Validate request
	if len(request.Sequence) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No sequence provided",
		})
		return
	}

	if request.Paths <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Paths must be greater than 0",
		})
		return
	}

	if request.Paths > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Paths must be 1000 or less (recommended: 100-500)",
		})
		return
	}

	// Evaluate using Monte Carlo simulation
	result := evaluation.EvaluateMonteCarlo(request)

	c.JSON(http.StatusOK, result)
}

// EvaluateStochastic handles POST /api/v1/evaluate/stochastic
func (ae *AdvancedEvaluator) EvaluateStochastic(c *gin.Context) {
	var request models.StochasticRequest

	// Parse request body
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Validate request
	if len(request.Sequence) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No sequence provided",
		})
		return
	}

	if len(request.Shifts) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No shifts provided",
		})
		return
	}

	// Evaluate using stochastic scenarios
	result := evaluation.EvaluateStochastic(request)

	c.JSON(http.StatusOK, result)
}
