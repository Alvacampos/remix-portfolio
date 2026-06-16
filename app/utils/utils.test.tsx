import { describe, expect, it } from 'vitest';

import { formatDate, getClassMaker, getSkillChartData, noop } from './utils';

describe('getClassMaker', () => {
  const getClasses = getClassMaker('block');

  it('returns the block alone with no args', () => {
    expect(getClasses()).toBe('block');
  });

  it('appends an element with __', () => {
    expect(getClasses('elem')).toBe('block__elem');
  });

  it('appends a string modifier with --', () => {
    expect(getClasses('', 'mod')).toBe('block--mod');
  });

  it('appends only truthy keys when modifier is an object', () => {
    expect(getClasses('', { active: true, disabled: false })).toBe('block block--active');
  });
});

describe('formatDate', () => {
  it('returns "MM/yyyy - Present" when end is undefined', () => {
    expect(formatDate('2020-01-01T00:00:00.000')).toBe('01/2020 - Present');
  });

  it('returns single-month format when end is empty string', () => {
    expect(formatDate('2020-01-01T00:00:00.000', '')).toBe('January 2020');
  });

  it('returns range when both dates are provided', () => {
    expect(formatDate('2020-01-01T00:00:00.000', '2021-06-01T00:00:00.000')).toBe(
      '01/2020 - 06/2021'
    );
  });

  it('returns duration when formatType is fullYearMonth', () => {
    const out = formatDate('2020-01-01T00:00:00.000', '2022-07-01T00:00:00.000', 'fullYearMonth');
    expect(out).toMatch(/\d+ year/);
  });
});

describe('getSkillChartData', () => {
  it('sums months across multiple intervals and converts to years', () => {
    const result = getSkillChartData([
      {
        name: 'React',
        dates: [
          { startDate: '2020-01-01T00:00:00.000', endDate: '2021-01-01T00:00:00.000' },
          { startDate: '2022-01-01T00:00:00.000', endDate: '2024-01-01T00:00:00.000' },
        ],
      },
    ]);
    expect(result).toEqual([['React', 3]]);
  });
});

describe('noop', () => {
  it('returns undefined', () => {
    expect(noop()).toBeUndefined();
  });
});
