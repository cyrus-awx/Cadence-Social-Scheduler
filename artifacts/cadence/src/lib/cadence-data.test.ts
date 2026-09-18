import { describe, expect, it } from 'vitest';
import {
  DEMO_TODAY,
  formatDemoDate,
  getDemoCalendarWeeks,
} from './cadence-data';

describe('deterministic demo calendar', () => {
  it('uses the fixed April 2025 demo date', () => {
    expect(DEMO_TODAY).toBe('2025-04-18');
    expect(formatDemoDate(DEMO_TODAY)).toBe('Fri, Apr 18');
  });

  it('returns the complete April 2025 month grid', () => {
    expect(getDemoCalendarWeeks(0)).toEqual([
      [30, 31, 1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10, 11, 12],
      [13, 14, 15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24, 25, 26],
      [27, 28, 29, 30, 1, 2, 3],
    ]);
  });
});
