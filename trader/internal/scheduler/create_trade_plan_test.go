package scheduler

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockPlannerService is a mock implementation of PlannerServiceInterface
type MockPlannerService struct {
	CreatePlanFunc func(ctx interface{}, config interface{}) (interface{}, error)
}

func (m *MockPlannerService) CreatePlan(ctx interface{}, config interface{}) (interface{}, error) {
	if m.CreatePlanFunc != nil {
		return m.CreatePlanFunc(ctx, config)
	}
	return nil, nil
}

// MockConfigRepoForPlan is a mock implementation of ConfigRepositoryInterface
type MockConfigRepoForPlan struct {
	GetDefaultConfigFunc func() (interface{}, error)
}

func (m *MockConfigRepoForPlan) GetDefaultConfig() (interface{}, error) {
	if m.GetDefaultConfigFunc != nil {
		return m.GetDefaultConfigFunc()
	}
	return nil, nil
}

func TestCreateTradePlanJob_Name(t *testing.T) {
	job := NewCreateTradePlanJob(nil, nil)
	assert.Equal(t, "create_trade_plan", job.Name())
}

func TestCreateTradePlanJob_Run_Success(t *testing.T) {
	createPlanCalled := false
	var calledContext interface{}
	var calledConfig interface{}

	mockPlannerService := &MockPlannerService{
		CreatePlanFunc: func(ctx interface{}, config interface{}) (interface{}, error) {
			createPlanCalled = true
			calledContext = ctx
			calledConfig = config
			return map[string]interface{}{
				"Steps": []interface{}{},
			}, nil
		},
	}

	mockConfigRepo := &MockConfigRepoForPlan{
		GetDefaultConfigFunc: func() (interface{}, error) {
			return map[string]interface{}{
				"Name": "default",
			}, nil
		},
	}

	opportunityContext := map[string]interface{}{
		"Positions": []interface{}{},
	}

	job := NewCreateTradePlanJob(mockPlannerService, mockConfigRepo)
	job.SetOpportunityContext(opportunityContext)

	err := job.Run()
	require.NoError(t, err)
	assert.True(t, createPlanCalled, "CreatePlan should have been called")
	assert.Equal(t, opportunityContext, calledContext)
	assert.NotNil(t, calledConfig)
}

func TestCreateTradePlanJob_Run_NoPlannerService(t *testing.T) {
	job := NewCreateTradePlanJob(nil, nil)
	job.SetOpportunityContext(map[string]interface{}{})

	err := job.Run()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "planner service not available")
}

func TestCreateTradePlanJob_Run_NoOpportunityContext(t *testing.T) {
	mockPlannerService := &MockPlannerService{}

	job := NewCreateTradePlanJob(mockPlannerService, nil)
	// Don't set opportunity context

	err := job.Run()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "opportunity context not set")
}

func TestCreateTradePlanJob_Run_PlannerServiceError(t *testing.T) {
	mockPlannerService := &MockPlannerService{
		CreatePlanFunc: func(ctx interface{}, config interface{}) (interface{}, error) {
			return nil, assert.AnError
		},
	}

	job := NewCreateTradePlanJob(mockPlannerService, nil)
	job.SetOpportunityContext(map[string]interface{}{})

	err := job.Run()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to create plan")
}

func TestCreateTradePlanJob_Run_ConfigRepoError(t *testing.T) {
	mockPlannerService := &MockPlannerService{
		CreatePlanFunc: func(ctx interface{}, config interface{}) (interface{}, error) {
			return map[string]interface{}{}, nil
		},
	}

	mockConfigRepo := &MockConfigRepoForPlan{
		GetDefaultConfigFunc: func() (interface{}, error) {
			return nil, assert.AnError
		},
	}

	job := NewCreateTradePlanJob(mockPlannerService, mockConfigRepo)
	job.SetOpportunityContext(map[string]interface{}{})

	// Should use default config when repo fails
	err := job.Run()
	require.NoError(t, err)
}
