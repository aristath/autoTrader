package settings

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSettingDefaults_LimitOrderBuffer(t *testing.T) {
	// Verify default exists
	val, exists := SettingDefaults["limit_order_buffer_percent"]
	assert.True(t, exists, "limit_order_buffer_percent must exist in defaults")

	// Verify default value is 0.05 (5%)
	floatVal, ok := val.(float64)
	assert.True(t, ok, "limit_order_buffer_percent must be float64")
	assert.Equal(t, 0.05, floatVal, "default should be 5%")
}

func TestSettingDescriptions_LimitOrderBuffer(t *testing.T) {
	// Verify description exists
	desc, exists := SettingDescriptions["limit_order_buffer_percent"]
	assert.True(t, exists, "limit_order_buffer_percent description must exist")
	assert.NotEmpty(t, desc, "description must not be empty")
	assert.Contains(t, desc, "Buffer", "description should mention buffer")
}
