package scheduler

import (
	"fmt"

	"github.com/aristath/sentinel/internal/modules/trading"
	"github.com/aristath/sentinel/internal/services"
	"github.com/rs/zerolog"
)

// RetryTradesJob processes pending trade retries (7-hour interval, max 3 attempts)
type RetryTradesJob struct {
	log                   zerolog.Logger
	tradeRepo             *trading.TradeRepository
	tradeExecutionService *services.TradeExecutionService
}

// RetryTradesConfig holds configuration for retry trades job
type RetryTradesConfig struct {
	Log                   zerolog.Logger
	TradeRepo             *trading.TradeRepository
	TradeExecutionService *services.TradeExecutionService
}

// NewRetryTradesJob creates a new retry trades job
func NewRetryTradesJob(cfg RetryTradesConfig) *RetryTradesJob {
	return &RetryTradesJob{
		log:                   cfg.Log.With().Str("job", "retry_trades").Logger(),
		tradeRepo:             cfg.TradeRepo,
		tradeExecutionService: cfg.TradeExecutionService,
	}
}

// Name returns the job name
func (j *RetryTradesJob) Name() string {
	return "retry_trades"
}

// Run executes the retry trades job
// Processes all pending retries that are due (next_retry_at <= now)
func (j *RetryTradesJob) Run() error {
	j.log.Debug().Msg("Processing pending trade retries")

	if j.tradeRepo == nil {
		j.log.Warn().Msg("Trade repository not available, skipping retry processing")
		return nil
	}

	if j.tradeExecutionService == nil {
		j.log.Warn().Msg("Trade execution service not available, skipping retry processing")
		return nil
	}

	// Get all pending retries that are due
	retries, err := j.tradeRepo.GetPendingRetries()
	if err != nil {
		j.log.Error().Err(err).Msg("Failed to get pending retries")
		return fmt.Errorf("failed to get pending retries: %w", err)
	}

	if len(retries) == 0 {
		j.log.Debug().Msg("No pending retries to process")
		return nil
	}

	j.log.Info().Int("count", len(retries)).Msg("Found pending retries to process")

	successCount := 0
	failedCount := 0
	retriedCount := 0

	for _, retry := range retries {
		j.log.Info().
			Int64("retry_id", retry.ID).
			Str("symbol", retry.Symbol).
			Str("side", retry.Side).
			Int("attempt", retry.AttemptCount+1).
			Int("max_attempts", retry.MaxAttempts).
			Msg("Processing retry")

		// Convert retry to trade recommendation
		rec := services.TradeRecommendation{
			Symbol:         retry.Symbol,
			Side:           retry.Side,
			Quantity:       retry.Quantity,
			EstimatedPrice: retry.EstimatedPrice,
			Currency:       retry.Currency,
			Reason:         fmt.Sprintf("Retry attempt %d/%d: %s", retry.AttemptCount+1, retry.MaxAttempts, retry.Reason),
		}

		// Execute single trade
		result := j.tradeExecutionService.ExecuteTrades([]services.TradeRecommendation{rec})
		if len(result) == 0 {
			j.log.Error().Int64("retry_id", retry.ID).Msg("No result from trade execution")
			continue
		}

		tradeResult := result[0]

		if tradeResult.Status == "success" {
			// Trade succeeded - mark as succeeded
			j.log.Info().
				Int64("retry_id", retry.ID).
				Str("symbol", retry.Symbol).
				Msg("Retry succeeded")

			if err := j.tradeRepo.UpdateRetryStatus(retry.ID, "succeeded"); err != nil {
				j.log.Error().Err(err).Int64("retry_id", retry.ID).Msg("Failed to update retry status")
			}
			successCount++
		} else {
			// Trade failed - increment attempt or mark as failed
			j.log.Warn().
				Int64("retry_id", retry.ID).
				Str("symbol", retry.Symbol).
				Str("error", *tradeResult.Error).
				Msg("Retry attempt failed")

			if err := j.tradeRepo.IncrementRetryAttempt(retry.ID); err != nil {
				j.log.Error().Err(err).Int64("retry_id", retry.ID).Msg("Failed to increment retry attempt")
				failedCount++
			} else {
				// Check if max attempts reached (IncrementRetryAttempt marks as failed if max reached)
				retriedCount++
			}
		}
	}

	j.log.Info().
		Int("total", len(retries)).
		Int("succeeded", successCount).
		Int("retried", retriedCount).
		Int("failed", failedCount).
		Msg("Retry processing completed")

	return nil
}
