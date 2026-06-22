import { describe, expect, it } from 'vitest';

import type { SkillsData } from '~/data/skills-schema';

import {
  formatDate,
  getClassMaker,
  getSkillHeatmapData,
  getSkillsForJob,
  getSkillSuggestions,
  noop,
} from './utils';

// Test fixture builder for the v2 SkillsData shape.
// Saves repetition: tests usually only care about a couple of jobs and a
// few skills; this fills in the surrounding shape with sensible defaults.
const fixture = (
  jobs: Array<{ id: number; startDate: string; endDate?: string }>,
  skills: Array<{
    name: string;
    category?: 'language' | 'framework' | 'tooling' | 'infra' | 'meta';
    ranges: Array<{ jobId: number; from?: string; to?: string }>;
  }>
): SkillsData => ({
  WORK_ITEMS: jobs.map((j) => ({
    id: j.id,
    title: `Job ${j.id}`,
    startDate: j.startDate,
    endDate: j.endDate,
    rol: 'role',
  })),
  SKILLS: skills.map((s) => ({
    name: s.name,
    category: s.category ?? 'language',
    ranges: s.ranges,
  })),
  EXTRA_ACTIVITIES: [],
});

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
    expect(formatDate('2020-01')).toBe('01/2020 - Present');
  });

  it('returns single-month format when end is empty string', () => {
    expect(formatDate('2020-01', '')).toBe('January 2020');
  });

  it('returns range when both dates are provided', () => {
    expect(formatDate('2020-01', '2021-06')).toBe('01/2020 - 06/2021');
  });

  it('returns duration when formatType is fullYearMonth', () => {
    const out = formatDate('2020-01', '2022-07', 'fullYearMonth');
    expect(out).toMatch(/\d+ year/);
  });

  it('parses YYYY-MM at local midnight (no UTC drift)', () => {
    // In any negative-offset timezone, `new Date('2018-08')` lands on
    // July 31 — which would render as 07/2018. Local-zone parsing
    // anchors to August 1 and renders as 08/2018.
    expect(formatDate('2018-08')).toBe('08/2018 - Present');
  });

  it('still accepts legacy ISO strings with time component', () => {
    expect(formatDate('2020-01-01T00:00:00.000')).toBe('01/2020 - Present');
  });
});

describe('getSkillHeatmapData', () => {
  it('returns a contiguous year span between earliest start and latest end', () => {
    const data = fixture(
      [
        { id: 1, startDate: '2018-01', endDate: '2018-12' },
        { id: 2, startDate: '2022-01', endDate: '2023-01' },
      ],
      [{ name: 'React', ranges: [{ jobId: 1 }, { jobId: 2 }] }]
    );
    expect(getSkillHeatmapData(data).years).toEqual([2018, 2019, 2020, 2021, 2022, 2023]);
  });

  it('buckets skill months per calendar year and tags rows with totals', () => {
    const data = fixture(
      [{ id: 1, startDate: '2020-04', endDate: '2021-04' }],
      [{ name: 'React', ranges: [{ jobId: 1 }] }]
    );
    const react = getSkillHeatmapData(data).rows.find((r) => r.skill === 'React');
    expect(react?.monthsPerYear).toEqual([9, 3]); // 9m in 2020, 3m in 2021
    expect(react?.total).toBe(12);
  });

  it('clamps a year cell at 12 months even when concurrent ranges both list the skill', () => {
    const data = fixture(
      [
        { id: 1, startDate: '2020-01', endDate: '2020-12' },
        { id: 2, startDate: '2020-06', endDate: '2020-11' },
      ],
      [{ name: 'React', ranges: [{ jobId: 1 }, { jobId: 2 }] }]
    );
    const react = getSkillHeatmapData(data).rows.find((r) => r.skill === 'React');
    // Both jobs cover 2020 only; merged interval = 11 months. Without
    // the clamp this would be 11 + 5 = 16, capped to 12.
    expect(react?.monthsPerYear).toEqual([11]);
  });

  it('excludes meta-category skills from the heatmap', () => {
    const data = fixture(
      [{ id: 1, startDate: '2020-01', endDate: '2021-01' }],
      [
        { name: 'React', category: 'framework', ranges: [{ jobId: 1 }] },
        { name: 'Front End', category: 'meta', ranges: [{ jobId: 1 }] },
        { name: 'Agile', category: 'meta', ranges: [{ jobId: 1 }] },
      ]
    );
    expect(getSkillHeatmapData(data).rows.map((r) => r.skill)).toEqual(['React']);
  });

  it('sorts rows by total months descending', () => {
    const data = fixture(
      [
        { id: 1, startDate: '2020-01', endDate: '2022-01' },
        { id: 2, startDate: '2021-01', endDate: '2022-01' },
      ],
      [
        { name: 'React', ranges: [{ jobId: 1 }] },
        { name: 'TypeScript', ranges: [{ jobId: 2 }] },
      ]
    );
    expect(getSkillHeatmapData(data).rows.map((r) => r.skill)).toEqual(['React', 'TypeScript']);
  });

  it('merges paused-and-resumed ranges within a single job', () => {
    // A skill used early in a job, paused, then resumed at the end —
    // the heatmap should show two clusters within the job's span,
    // not one continuous block.
    const data = fixture(
      [{ id: 1, startDate: '2020-01', endDate: '2024-01' }],
      [
        {
          name: 'Python',
          ranges: [
            { jobId: 1, from: '2020-01', to: '2020-07' }, // 6 months in 2020
            { jobId: 1, from: '2023-07', to: '2024-01' }, // 6 months in 2023
          ],
        },
      ]
    );
    const py = getSkillHeatmapData(data).rows.find((r) => r.skill === 'Python');
    // Year span 2020-2024 (job ends 2024-01); Python in 2020 (6m) and 2023 (6m),
    // zero in the gap years 2021-2022 and tail year 2024.
    expect(py?.monthsPerYear).toEqual([6, 0, 0, 6, 0]);
    expect(py?.total).toBe(12);
  });

  it('clips a range to the job span when from/to extend beyond', () => {
    const data = fixture(
      [{ id: 1, startDate: '2020-06', endDate: '2020-12' }],
      [{ name: 'React', ranges: [{ jobId: 1, from: '2020-01', to: '2021-12' }] }]
    );
    const react = getSkillHeatmapData(data).rows.find((r) => r.skill === 'React');
    expect(react?.monthsPerYear).toEqual([6]); // clipped to job's 6-month span
  });
});

describe('getSkillsForJob', () => {
  it('lists every skill with at least one range pointing at the jobId', () => {
    const data = fixture(
      [
        { id: 1, startDate: '2020-01', endDate: '2021-01' },
        { id: 2, startDate: '2021-01' },
      ],
      [
        { name: 'React', ranges: [{ jobId: 1 }, { jobId: 2 }] },
        { name: 'Vue', ranges: [{ jobId: 1 }] },
        { name: 'Next.js', ranges: [{ jobId: 2 }] },
      ]
    );
    expect(getSkillsForJob(data, 1)).toEqual(['React', 'Vue']);
    expect(getSkillsForJob(data, 2)).toEqual(['React', 'Next.js']);
  });

  it('preserves authored order in SKILLS', () => {
    const data = fixture(
      [{ id: 1, startDate: '2020-01' }],
      [
        { name: 'Zod', ranges: [{ jobId: 1 }] },
        { name: 'Apollo', ranges: [{ jobId: 1 }] },
      ]
    );
    expect(getSkillsForJob(data, 1)).toEqual(['Zod', 'Apollo']);
  });
});

describe('getSkillSuggestions', () => {
  it('drops meta-category skills and sorts alphabetically', () => {
    const data = fixture(
      [{ id: 1, startDate: '2020-01' }],
      [
        { name: 'TypeScript', category: 'language', ranges: [{ jobId: 1 }] },
        { name: 'Front End', category: 'meta', ranges: [{ jobId: 1 }] },
        { name: 'React', category: 'framework', ranges: [{ jobId: 1 }] },
        { name: 'Agile', category: 'meta', ranges: [{ jobId: 1 }] },
      ]
    );
    expect(getSkillSuggestions(data)).toEqual(['React', 'TypeScript']);
  });
});

describe('noop', () => {
  it('returns undefined', () => {
    expect(noop()).toBeUndefined();
  });
});
