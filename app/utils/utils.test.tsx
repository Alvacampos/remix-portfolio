import { describe, expect, it } from 'vitest';

import { formatDate, getClassMaker, getSkillHeatmapData, noop } from './utils';

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

describe('getSkillHeatmapData', () => {
  it('returns a contiguous year span between earliest start and latest end', () => {
    const { years } = getSkillHeatmapData([
      {
        startDate: '2018-01-01T00:00:00.000',
        endDate: '2018-12-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
      {
        startDate: '2022-01-01T00:00:00.000',
        endDate: '2023-01-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
    ]);
    expect(years).toEqual([2018, 2019, 2020, 2021, 2022, 2023]);
  });

  it('buckets skill months per calendar year and tags rows with totals', () => {
    const { rows } = getSkillHeatmapData([
      {
        startDate: '2020-04-01T00:00:00.000',
        endDate: '2021-04-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
    ]);
    const react = rows.find((r) => r.skill === 'React');
    expect(react?.monthsPerYear).toEqual([9, 3]); // 9m in 2020, 3m in 2021
    expect(react?.total).toBe(12);
  });

  it('clamps a year cell at 12 months even when concurrent jobs both list the skill', () => {
    const { rows } = getSkillHeatmapData([
      {
        startDate: '2020-01-01T00:00:00.000',
        endDate: '2020-12-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
      {
        startDate: '2020-06-01T00:00:00.000',
        endDate: '2020-11-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
    ]);
    const react = rows.find((r) => r.skill === 'React');
    // Both jobs cover 2020 only; merged interval = 11 months. Without
    // the clamp this would be 11 + 5 = 16, capped to 12.
    expect(react?.monthsPerYear).toEqual([11]);
  });

  it('excludes filter-chip skills (Front End / Back End / Agile / etc.)', () => {
    const { rows } = getSkillHeatmapData([
      {
        startDate: '2020-01-01T00:00:00.000',
        endDate: '2021-01-01T00:00:00.000',
        skills: [{ name: 'React' }, { name: 'Front End' }, { name: 'Agile' }],
      },
    ]);
    expect(rows.map((r) => r.skill)).toEqual(['React']);
  });

  it('sorts rows by total months descending', () => {
    const { rows } = getSkillHeatmapData([
      {
        startDate: '2020-01-01T00:00:00.000',
        endDate: '2022-01-01T00:00:00.000',
        skills: [{ name: 'React' }],
      },
      {
        startDate: '2021-01-01T00:00:00.000',
        endDate: '2022-01-01T00:00:00.000',
        skills: [{ name: 'TypeScript' }],
      },
    ]);
    expect(rows.map((r) => r.skill)).toEqual(['React', 'TypeScript']);
  });
});

describe('noop', () => {
  it('returns undefined', () => {
    expect(noop()).toBeUndefined();
  });
});
