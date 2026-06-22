import { differenceInMonths, format, formatDuration, intervalToDuration } from 'date-fns';

import type { Skill, SkillsData, WorkItem } from '~/data/skills-schema';

export const getClassMaker =
  (block = '') =>
  (element = '', modifier: string | object | undefined = '') => {
    let className = block;
    if (element) {
      className += `__${element}`;
    }
    if (typeof modifier === 'object') {
      Object.keys(modifier).forEach((key) => {
        if (modifier[key as keyof typeof modifier]) {
          className += ` ${block}--${key}`;
        }
      });
      return className;
    }
    if (modifier) {
      className += `--${modifier}`;
    }
    return className;
  };

export const noop = () => {};

// Merge a route's title + description with the root's full meta array,
// preserving the root's Open Graph + Twitter tags so social previews have
// their image/site_name/etc. on every route. Without this, Remix lets the
// child route's meta() *replace* the parent's array completely — meaning
// only the homepage would surface og:image, etc.
export type RouteMetaOverrides = {
  title: string;
  description: string;
};

type MetaArg = { matches: Array<{ meta: Array<Record<string, unknown>> }> };

export function mergeRouteMeta({ matches }: MetaArg, { title, description }: RouteMetaOverrides) {
  const parentMeta = matches.flatMap((m) => m.meta);
  const carry = parentMeta.filter((tag) => {
    if (typeof tag !== 'object' || tag === null) return true;
    if ('title' in tag) return false;
    if ('name' in tag && tag.name === 'description') return false;
    if ('property' in tag && (tag.property === 'og:title' || tag.property === 'og:description'))
      return false;
    if ('name' in tag && (tag.name === 'twitter:title' || tag.name === 'twitter:description'))
      return false;
    return true;
  });
  return [
    ...carry,
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
}

// Parse a YYYY-MM (or longer ISO) string at LOCAL midnight on the 1st of
// the month. Plain `new Date('2018-08')` parses as UTC midnight, which
// shifts to the prior day in negative-offset timezones — for the CV that
// means an August start renders as July. Force local-zone parsing.
const parseYearMonth = (s: string): Date => {
  // Already an ISO with time component? Pass through.
  if (s.length > 10) return new Date(s);
  // YYYY-MM: anchor to the 1st at local midnight.
  if (/^\d{4}-\d{2}$/.test(s)) return new Date(`${s}-01T00:00:00`);
  // YYYY-MM-DD: same — local midnight.
  return new Date(`${s}T00:00:00`);
};

export const formatDate = (dateA: string, dateB?: string, formatType?: string) => {
  if (formatType === 'fullYearMonth') {
    const start = parseYearMonth(dateA);
    const end = dateB && dateB !== '' && dateB !== null ? parseYearMonth(dateB) : new Date();
    const duration = intervalToDuration({ start, end });
    return formatDuration(duration, { format: ['years', 'months'] });
  }

  if (dateB === null || dateB === undefined) {
    return `${format(parseYearMonth(dateA), 'MM/yyyy')} - Present`;
  }

  if (dateB === '') {
    return format(parseYearMonth(dateA), 'MMMM yyyy');
  }

  return `${format(parseYearMonth(dateA), 'MM/yyyy')} - ${format(parseYearMonth(dateB), 'MM/yyyy')}`;
};

// Skill × Year matrix used by the tenure heatmap on /skills.
//   - `years` is the contiguous span from the earliest job year to the
//     latest job's end year (or current year if any job is ongoing).
//     Including all years between makes the gap years explicit instead
//     of silently collapsing the timeline.
//   - `rows` lists each skill (excluding `meta` category) with months of
//     experience per year; `total` is the cell sum.
//   - Cells are clamped to [0, 12] so a January-to-December year reads
//     as 12 months even if multiple concurrent ranges both used the skill.
//   - Rows are sorted by `total` descending so the most-used skills
//     anchor the top of the grid.
export type SkillHeatmapRow = {
  skill: string;
  monthsPerYear: number[];
  total: number;
};

export type SkillHeatmapData = {
  years: number[];
  rows: SkillHeatmapRow[];
};

type Interval = { start: number; end: number };

// Merge overlapping intervals so multiple ranges on the same skill
// (e.g. concurrent jobs both using React, or a paused-and-resumed
// stretch within one job) don't double-count toward the skill's
// per-year wall-clock months.
function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const next = sorted[i];
    if (next.start <= last.end) {
      last.end = Math.max(last.end, next.end);
    } else {
      merged.push(next);
    }
  }
  return merged;
}

// Months of overlap between an interval and a calendar year, given
// pre-computed year boundaries. Hoisting the boundary computation out
// of the inner loop saves ~2N Date allocations per skill row.
function monthsOfOverlap(
  intervalStart: number,
  intervalEnd: number,
  yearStart: number,
  yearEnd: number
): number {
  const start = Math.max(intervalStart, yearStart);
  const end = Math.min(intervalEnd, yearEnd);
  if (end <= start) return 0;
  return differenceInMonths(end, start);
}

// Build a Map<jobId, { startMs, endMs }> once so every skill range
// resolution is O(1) and the parsed Date objects don't get re-allocated
// per range. Called once per heatmap/chip-list build.
function buildJobBounds(workItems: WorkItem[], nowMs: number) {
  const bounds = new Map<number, { startMs: number; endMs: number }>();
  for (const w of workItems) {
    bounds.set(w.id, {
      startMs: parseYearMonth(w.startDate).getTime(),
      endMs: w.endDate ? parseYearMonth(w.endDate).getTime() : nowMs,
    });
  }
  return bounds;
}

// Resolve a skill range to an absolute [startMs, endMs] pair, clipped
// to the referenced job's interval. `from`/`to` default to the job's
// own bounds when omitted; explicit values are still clipped so a
// range can never extend beyond its job's span.
function resolveRange(
  range: Skill['ranges'][number],
  job: { startMs: number; endMs: number }
): Interval | null {
  const startMs = range.from ? parseYearMonth(range.from).getTime() : job.startMs;
  const endMs = range.to ? parseYearMonth(range.to).getTime() : job.endMs;
  const clippedStart = Math.max(startMs, job.startMs);
  const clippedEnd = Math.min(endMs, job.endMs);
  return clippedEnd > clippedStart ? { start: clippedStart, end: clippedEnd } : null;
}

export function getSkillHeatmapData(skillsData: SkillsData): SkillHeatmapData {
  const now = new Date();
  const nowMs = now.getTime();
  const currentYear = now.getFullYear();

  // Year span: earliest job start → latest job end (or current year if
  // any job is ongoing). Don't pre-anchor to the current year — a CV
  // whose most recent job ended in 2023 should render through 2023, not
  // pad empty 2024-2026 columns.
  let minYear = currentYear;
  let maxYear = currentYear;
  let bounded = false;
  for (const w of skillsData.WORK_ITEMS) {
    const start = parseYearMonth(w.startDate).getFullYear();
    const end = w.endDate ? parseYearMonth(w.endDate).getFullYear() : currentYear;
    if (!bounded) {
      minYear = start;
      maxYear = end;
      bounded = true;
    } else {
      if (start < minYear) minYear = start;
      if (end > maxYear) maxYear = end;
    }
  }
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  // Pre-compute year boundaries so the per-cell math doesn't allocate
  // Date objects in the inner loop. Same with job bounds — one parse
  // per job, reused across every range that points at it.
  const yearBounds = years.map((y) => ({
    startMs: new Date(y, 0, 1).getTime(),
    endMs: new Date(y + 1, 0, 1).getTime(),
  }));
  const jobBounds = buildJobBounds(skillsData.WORK_ITEMS, nowMs);

  const rows: SkillHeatmapRow[] = [];
  for (const skill of skillsData.SKILLS) {
    if (skill.category !== 'meta') {
      const intervals: Interval[] = [];
      for (const range of skill.ranges) {
        const job = jobBounds.get(range.jobId);
        // Schema validates jobIds at load; the lookup is defensive only.
        if (job) {
          const resolved = resolveRange(range, job);
          if (resolved) intervals.push(resolved);
        }
      }
      if (intervals.length > 0) {
        const merged = mergeIntervals(intervals);
        const monthsPerYear = yearBounds.map(({ startMs, endMs }) =>
          Math.min(
            12,
            merged.reduce(
              (sum, { start, end }) => sum + monthsOfOverlap(start, end, startMs, endMs),
              0
            )
          )
        );
        const total = monthsPerYear.reduce((sum, m) => sum + m, 0);
        if (total > 0) rows.push({ skill: skill.name, monthsPerYear, total });
      }
    }
  }

  rows.sort((a, b) => b.total - a.total);
  return { years, rows };
}

// Skills attached to a single job, ordered as authored in SKILLS.
// Replaces the per-job `skills: SkillEntry[]` array that v1 carried on
// each WORK_ITEM. Used by the timeline cards on /skills and the chip
// list on /skills/:uuid.
export function getSkillsForJob(skillsData: SkillsData, jobId: number): string[] {
  const result: string[] = [];
  for (const s of skillsData.SKILLS) {
    if (s.ranges.some((r) => r.jobId === jobId)) {
      result.push(s.name);
    }
  }
  return result;
}

// Names of skills shown in the autocomplete on /skills. Excludes `meta`
// category (filter chips like "Front End", "Mentoring") so they don't
// appear as filter options. Sorted alphabetically.
export function getSkillSuggestions(skillsData: SkillsData): string[] {
  return skillsData.SKILLS.filter((s) => s.category !== 'meta')
    .map((s) => s.name)
    .sort();
}
