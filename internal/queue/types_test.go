package queue

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestGetJobDescription_AllJobTypes tests that all job types have descriptions
func TestGetJobDescription_AllJobTypes(t *testing.T) {
	// All job types that should have descriptions
	allJobTypes := []JobType{
		// Composite jobs
		JobTypePlannerBatch,
		JobTypeEventBasedTrading,
		JobTypeTagUpdate,
		JobTypeSyncCycle,
		JobTypeDividendReinvest,
		JobTypeHealthCheck,
		JobTypeHourlyBackup,
		JobTypeDailyBackup,
		JobTypeDailyMaintenance,
		JobTypeWeeklyBackup,
		JobTypeWeeklyMaintenance,
		JobTypeMonthlyBackup,
		JobTypeMonthlyMaintenance,
		JobTypeFormulaDiscovery,
		JobTypeAdaptiveMarket,
		JobTypeHistoryCleanup,
		JobTypeRecommendationGC,
		JobTypeDeployment,
		JobTypeR2Backup,
		JobTypeR2BackupRotation,

		// Sync jobs
		JobTypeSyncTrades,
		JobTypeSyncCashFlows,
		JobTypeSyncPortfolio,
		JobTypeCheckNegativeBalances,
		JobTypeSyncPrices,
		JobTypeSyncExchangeRates,
		JobTypeUpdateDisplayTicker,
		JobTypeRetryTrades,

		// Planning jobs
		JobTypeGeneratePortfolioHash,
		JobTypeGetOptimizerWeights,
		JobTypeBuildOpportunityContext,
		JobTypeIdentifyOpportunities,
		JobTypeGenerateSequences,
		JobTypeEvaluateSequences,
		JobTypeCreateTradePlan,
		JobTypeStoreRecommendations,

		// Dividend jobs
		JobTypeGetUnreinvestedDividends,
		JobTypeGroupDividendsBySymbol,
		JobTypeCheckDividendYields,
		JobTypeCreateDividendRecommendations,
		JobTypeSetPendingBonuses,
		JobTypeExecuteDividendTrades,

		// Health check jobs
		JobTypeCheckCoreDatabases,
		JobTypeCheckHistoryDatabases,
		JobTypeCheckWALCheckpoints,
	}

	for _, jobType := range allJobTypes {
		t.Run(string(jobType), func(t *testing.T) {
			desc := GetJobDescription(jobType)

			// Should not be empty
			assert.NotEmpty(t, desc, "Job type %s should have a description", jobType)

			// Should not just return the job type string (indicates missing description)
			// Allow exact match only if it's intentional
			if desc == string(jobType) {
				t.Errorf("Job type %s has no custom description (returns raw job type)", jobType)
			}

			// Description should be human-readable (starts with capital letter)
			if len(desc) > 0 {
				firstChar := desc[0]
				assert.True(t, firstChar >= 'A' && firstChar <= 'Z',
					"Description for %s should start with capital letter", jobType)
			}
		})
	}
}

// TestGetJobDescription_SpecificDescriptions tests specific expected descriptions
func TestGetJobDescription_SpecificDescriptions(t *testing.T) {
	testCases := []struct {
		jobType             JobType
		expectedDescription string
	}{
		{JobTypePlannerBatch, "Generating trading recommendations"},
		{JobTypeEventBasedTrading, "Executing trade"},
		{JobTypeSyncCycle, "Syncing all data from broker"},
		{JobTypeDividendReinvest, "Processing dividend reinvestment"},
		{JobTypeSyncTrades, "Syncing trades from broker"},
		{JobTypeSyncPortfolio, "Syncing portfolio positions"},
		{JobTypeSyncPrices, "Updating security prices"},
		{JobTypeHourlyBackup, "Creating hourly backup"},
		{JobTypeR2Backup, "Uploading backup to cloud"},
		{JobTypeGeneratePortfolioHash, "Generating portfolio hash"},
		{JobTypeGetOptimizerWeights, "Running portfolio optimizer"},
		{JobTypeGenerateSequences, "Generating trade sequences"},
		{JobTypeEvaluateSequences, "Evaluating trade sequences"},
		{JobTypeGetUnreinvestedDividends, "Getting unreinvested dividends"},
		{JobTypeCheckDividendYields, "Checking dividend yields"},
		{JobTypeCheckCoreDatabases, "Checking core databases"},
		{JobTypeFormulaDiscovery, "Discovering optimal formulas"},
		{JobTypeHistoryCleanup, "Cleaning up historical data"},
		{JobTypeAdaptiveMarket, "Checking market regime"},
		{JobTypeDeployment, "Checking for system updates"},
	}

	for _, tc := range testCases {
		t.Run(string(tc.jobType), func(t *testing.T) {
			desc := GetJobDescription(tc.jobType)
			assert.Equal(t, tc.expectedDescription, desc)
		})
	}
}

// TestGetJobDescription_UnknownType tests fallback for unknown job types
func TestGetJobDescription_UnknownType(t *testing.T) {
	unknownType := JobType("unknown_job_type")
	desc := GetJobDescription(unknownType)

	// Should return the job type string as fallback
	assert.Equal(t, "unknown_job_type", desc)
}

// TestGetJobDescription_EmptyType tests empty job type
func TestGetJobDescription_EmptyType(t *testing.T) {
	emptyType := JobType("")
	desc := GetJobDescription(emptyType)

	// Should return empty string
	assert.Equal(t, "", desc)
}

// TestGetJobDescription_Consistency tests frontend/backend consistency
// This test documents the mapping between backend and frontend descriptions
func TestGetJobDescription_Consistency(t *testing.T) {
	// These should match the frontend descriptions in eventHandlers.js
	// This test serves as documentation of the contract
	frontendMappings := map[JobType]string{
		// Job type -> expected description that frontend should display
		JobTypePlannerBatch:      "Generating trading recommendations",
		JobTypeEventBasedTrading: "Executing trade",
		JobTypeSyncCycle:         "Syncing all data from broker",
		JobTypeSyncTrades:        "Syncing trades from broker",
		JobTypeSyncPortfolio:     "Syncing portfolio positions",
		JobTypeSyncPrices:        "Updating security prices",
	}

	for jobType, expectedDesc := range frontendMappings {
		desc := GetJobDescription(jobType)
		assert.Equal(t, expectedDesc, desc,
			"Backend description for %s should match frontend mapping", jobType)
	}
}

// TestJobType_StringConversion tests JobType to string conversion
func TestJobType_StringConversion(t *testing.T) {
	jobType := JobTypePlannerBatch
	str := string(jobType)
	assert.Equal(t, "planner_batch", str)
}

// TestGetJobDescription_AllDescriptionsUnique tests that descriptions are unique
func TestGetJobDescription_AllDescriptionsUnique(t *testing.T) {
	allJobTypes := []JobType{
		JobTypePlannerBatch, JobTypeEventBasedTrading, JobTypeTagUpdate,
		JobTypeSyncCycle, JobTypeDividendReinvest, JobTypeHealthCheck,
		JobTypeHourlyBackup, JobTypeDailyBackup, JobTypeDailyMaintenance,
		JobTypeWeeklyBackup, JobTypeWeeklyMaintenance, JobTypeMonthlyBackup,
		JobTypeMonthlyMaintenance, JobTypeFormulaDiscovery, JobTypeAdaptiveMarket,
		JobTypeHistoryCleanup, JobTypeRecommendationGC, JobTypeDeployment,
		JobTypeR2Backup, JobTypeR2BackupRotation, JobTypeSyncTrades,
		JobTypeSyncCashFlows, JobTypeSyncPortfolio, JobTypeCheckNegativeBalances,
		JobTypeSyncPrices, JobTypeSyncExchangeRates, JobTypeUpdateDisplayTicker,
		JobTypeRetryTrades, JobTypeGeneratePortfolioHash, JobTypeGetOptimizerWeights,
		JobTypeBuildOpportunityContext, JobTypeIdentifyOpportunities,
		JobTypeGenerateSequences, JobTypeEvaluateSequences, JobTypeCreateTradePlan,
		JobTypeStoreRecommendations, JobTypeGetUnreinvestedDividends,
		JobTypeGroupDividendsBySymbol, JobTypeCheckDividendYields,
		JobTypeCreateDividendRecommendations, JobTypeSetPendingBonuses,
		JobTypeExecuteDividendTrades, JobTypeCheckCoreDatabases,
		JobTypeCheckHistoryDatabases, JobTypeCheckWALCheckpoints,
	}

	descriptions := make(map[string]JobType)
	duplicates := make([]string, 0)

	for _, jobType := range allJobTypes {
		desc := GetJobDescription(jobType)

		if existingJobType, exists := descriptions[desc]; exists {
			duplicates = append(duplicates, desc)
			t.Errorf("Duplicate description '%s' used by both %s and %s",
				desc, existingJobType, jobType)
		} else {
			descriptions[desc] = jobType
		}
	}

	assert.Empty(t, duplicates, "All job descriptions should be unique")
}
