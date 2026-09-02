import { describe, expect, it } from 'vitest';
import { shouldLoadInactiveDetails, shouldShowSecurityForFilter } from './UnifiedPage';

const quietSecurity = {
  symbol: 'AAPL.US',
  allow_buy: 1,
  allow_sell: 1,
  current_allocation: 0,
  ideal_allocation: 0,
  has_position: false,
  recommendation: null,
  price_warning: null,
};

describe('UnifiedPage filters', () => {
  it('shows quiet active securities with the All Securities filter', () => {
    expect(shouldShowSecurityForFilter(quietSecurity, 'all')).toBe(true);
  });

  it('loads inactive details only after the section is expanded', () => {
    expect(shouldLoadInactiveDetails({ 'inactive-securities': true }, 40)).toBe(false);
    expect(shouldLoadInactiveDetails({ 'inactive-securities': false }, 40)).toBe(true);
    expect(shouldLoadInactiveDetails({ 'inactive-securities': false }, 0)).toBe(false);
  });
});
