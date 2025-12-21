/**
 * Arduino Trader - Utility Functions
 * Formatting and helper functions used across components
 */

/**
 * Format a number as currency (EUR)
 * @param {number|null} value - The value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

/**
 * Format a date string as date only
 * @param {string|null} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE');
}

/**
 * Format a date string as date and time
 * @param {string|null} dateStr - ISO date string
 * @returns {string} Formatted date and time
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a percentage value
 * @param {number} value - Decimal value (e.g., 0.5 for 50%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
function formatPercent(value, decimals = 1) {
  if (value == null) return '-';
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format a score value
 * @param {number|null} value - Score value (0-1)
 * @returns {string} Formatted score
 */
function formatScore(value) {
  if (value == null) return '-';
  return value.toFixed(2);
}

/**
 * Get CSS class for score value
 * @param {number|null} score - Score value (0-1)
 * @returns {string} CSS class name
 */
function getScoreClass(score) {
  if (score == null) return 'score--low';
  if (score > 0.7) return 'score--high';
  if (score > 0.4) return 'score--medium';
  return 'score--low';
}

/**
 * Format a priority score value
 * @param {number|null} value - Priority score (0-3 range)
 * @returns {string} Formatted priority
 */
function formatPriority(value) {
  if (value == null) return '-';
  return value.toFixed(2);
}

/**
 * Get CSS class for priority score value
 * @param {number|null} score - Priority score (0-1.5 range, can be higher with multipliers)
 * @returns {string} CSS class name
 */
function getPriorityClass(score) {
  if (score == null) return 'priority--low';
  if (score >= 0.6) return 'priority--high';    // Strong buy signal
  if (score >= 0.4) return 'priority--medium';  // Moderate priority
  return 'priority--low';                        // Low priority
}

/**
 * Get CSS class for allocation deviation
 * @param {number} deviation - Deviation value
 * @returns {string} CSS class suffix
 */
function getDeviationClass(deviation) {
  if (deviation < -0.05) return 'under';
  if (deviation > 0.05) return 'over';
  return 'balanced';
}

/**
 * Get tag class for geography
 * @param {string} geography - Region code (EU, ASIA, US)
 * @returns {string} CSS class name
 */
function getGeoTagClass(geography) {
  const map = {
    'EU': 'tag--eu',
    'ASIA': 'tag--asia',
    'US': 'tag--us'
  };
  return map[geography] || '';
}

/**
 * Get tag class for trade side
 * @param {string} side - Trade side (BUY, SELL)
 * @returns {string} CSS class name
 */
function getSideTagClass(side) {
  return side === 'BUY' ? 'tag--buy' : 'tag--sell';
}

// Make functions available globally for Alpine.js
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatPercent = formatPercent;
window.formatScore = formatScore;
window.formatPriority = formatPriority;
window.getScoreClass = getScoreClass;
window.getPriorityClass = getPriorityClass;
window.getDeviationClass = getDeviationClass;
window.getGeoTagClass = getGeoTagClass;
window.getSideTagClass = getSideTagClass;
