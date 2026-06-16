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
  it('defaults skill range to the job range when start/end are omitted', () => {
    const result = getSkillChartData([
      {
        startDate: '2020-01-01T00:00:00.000',
        endDate: '2021-01-01T00:00:00.000',
        skills: [{ name: 'React' }, { name: 'TypeScript' }],
      },
      {
        startDate: '2022-01-01T00:00:00.000',
        endDate: '2024-01-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
    ]);
    expect(result).toEqual([
      ['React', 3],
      ['TypeScript', 1],
    ]);
  });

  it('honours per-skill start/end inside the job range', () => {
    // 4-year job, but Django was only used for the last year of it.
    const result = getSkillChartData([
      {
        startDate: '2022-01-01T00:00:00.000',
        endDate: '2026-01-01T00:00:00.000',
        skills: [
          { name: 'React' },
          { name: 'Django', start: '2025-01-01T00:00:00.000', end: '2026-01-01T00:00:00.000' },
        ],
      },
    ]);
    expect(result).toEqual([
      ['React', 4],
      ['Django', 1],
    ]);
  });

  it('clamps a skill range to the job range so a typo cannot exceed the job', () => {
    // Skill end is past the job end — should be clamped to the job end.
    const result = getSkillChartData([
      {
        startDate: '2022-01-01T00:00:00.000',
        endDate: '2023-01-01T00:00:00.000',
        skills: [{ name: 'React', end: '2099-01-01T00:00:00.000' }],
      },
    ]);
    expect(result).toEqual([['React', 1]]);
  });

  it('treats missing job endDate as Present', () => {
    const FIVE_YEARS_AGO = new Date();
    FIVE_YEARS_AGO.setFullYear(FIVE_YEARS_AGO.getFullYear() - 5);
    const result = getSkillChartData([
      {
        startDate: FIVE_YEARS_AGO.toISOString(),
        endDate: null,
        skills: [{ name: 'Remix' }],
      },
    ]);
    expect(result).toHaveLength(1);
    const [name, years] = result[0];
    expect(name).toBe('Remix');
    expect(years).toBeGreaterThanOrEqual(4.9);
    expect(years).toBeLessThanOrEqual(5.1);
  });

  it('excludes filter-chip and generic-descriptor skills', () => {
    const result = getSkillChartData([
      {
        startDate: '2020-01-01T00:00:00.000',
        endDate: '2021-01-01T00:00:00.000',
        skills: [
          { name: 'React' },
          { name: 'Front End' },
          { name: 'Back End' },
          { name: 'Agile' },
          { name: 'Teaching' },
          { name: 'Mentoring' },
        ],
      },
    ]);
    expect(result.map(([name]) => name)).toEqual(['React']);
  });

  it('merges overlapping intervals per skill so concurrent jobs do not double-count', () => {
    const result = getSkillChartData([
      {
        startDate: '2020-01-01T00:00:00.000',
        endDate: '2021-01-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
      {
        startDate: '2020-06-01T00:00:00.000',
        endDate: '2020-12-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
    ]);
    // Merged span: 2020-01-01 → 2021-01-01 = 1 year (NOT 1.5 years).
    expect(result).toEqual([['React', 1]]);
  });
});

describe('noop', () => {
  it('returns undefined', () => {
    expect(noop()).toBeUndefined();
  });
});
