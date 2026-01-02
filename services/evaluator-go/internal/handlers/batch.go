package handlers

import (
	"net/http"

	"github.com/aristath/arduino-trader/services/evaluator-go/internal/models"
	"github.com/aristath/arduino-trader/services/evaluator-go/internal/workers"
	"github.com/gin-gonic/gin"
)

// BatchEvaluator handles batch evaluation requests
type BatchEvaluator struct {
	workerPool *workers.WorkerPool
}

// NewBatchEvaluator creates a new batch evaluator handler
func NewBatchEvaluator(numWorkers int) *BatchEvaluator {
	return &BatchEvaluator{
		workerPool: workers.NewWorkerPool(numWorkers),
	}
}

// EvaluateBatch handles POST /api/v1/evaluate/batch
func (be *BatchEvaluator) EvaluateBatch(c *gin.Context) {
	var request models.BatchEvaluationRequest

	// Parse request body
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Validate request
	if len(request.Sequences) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No sequences provided",
		})
		return
	}

	// Evaluate sequences using worker pool
	results := be.workerPool.EvaluateBatch(
		request.Sequences,
		request.EvaluationContext,
	)

	// Build response
	response := models.BatchEvaluationResponse{
		Results: results,
		Errors:  []string{}, // Errors per sequence (if any)
	}

	c.JSON(http.StatusOK, response)
}

// SimulateBatch handles POST /api/v1/simulate/batch
func (be *BatchEvaluator) SimulateBatch(c *gin.Context) {
	var request models.BatchSimulationRequest

	// Parse request body
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Validate request
	if len(request.Sequences) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No sequences provided",
		})
		return
	}

	// Simulate sequences using worker pool (parallel)
	results := be.workerPool.SimulateBatch(
		request.Sequences,
		request.EvaluationContext,
	)

	// Build response
	response := models.BatchSimulationResponse{
		Results: results,
	}

	c.JSON(http.StatusOK, response)
}
