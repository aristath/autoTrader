package scheduler

import (
	"fmt"

	"github.com/rs/zerolog"
)

// StoreRecommendationsJob stores a generated plan as recommendations
type StoreRecommendationsJob struct {
	log                zerolog.Logger
	recommendationRepo RecommendationRepositoryInterface
	portfolioHash      string
	plan               interface{}
}

// NewStoreRecommendationsJob creates a new StoreRecommendationsJob
func NewStoreRecommendationsJob(
	recommendationRepo RecommendationRepositoryInterface,
	portfolioHash string,
) *StoreRecommendationsJob {
	return &StoreRecommendationsJob{
		log:                zerolog.Nop(),
		recommendationRepo: recommendationRepo,
		portfolioHash:      portfolioHash,
	}
}

// SetLogger sets the logger for the job
func (j *StoreRecommendationsJob) SetLogger(log zerolog.Logger) {
	j.log = log
}

// SetPlan sets the plan to store
func (j *StoreRecommendationsJob) SetPlan(plan interface{}) {
	j.plan = plan
}

// SetPortfolioHash sets the portfolio hash
func (j *StoreRecommendationsJob) SetPortfolioHash(hash string) {
	j.portfolioHash = hash
}

// Name returns the job name
func (j *StoreRecommendationsJob) Name() string {
	return "store_recommendations"
}

// Run executes the store recommendations job
func (j *StoreRecommendationsJob) Run() error {
	if j.recommendationRepo == nil {
		return fmt.Errorf("recommendation repository not available")
	}

	if j.plan == nil {
		return fmt.Errorf("plan not set")
	}

	err := j.recommendationRepo.StorePlan(j.plan, j.portfolioHash)
	if err != nil {
		j.log.Error().Err(err).Msg("Failed to store plan")
		return fmt.Errorf("failed to store plan: %w", err)
	}

	j.log.Info().
		Str("portfolio_hash", j.portfolioHash).
		Msg("Successfully stored recommendations")

	return nil
}
