import { differenceInMonths, format, formatDuration, intervalToDuration } from 'date-fns';

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
//
// Usage:
//   export const meta: MetaFunction = (args) =>
//     mergeRouteMeta(args, { title: 'Page — App', description: '…' });
//
// `args.matches` is provided by Remix; the root match's meta is the
// flattened parent array. We drop the parent's `title` and `description`
// so the route's overrides win, and append our overrides at the end so
// per-route og:title / og:description (if added later) supersede the
// root defaults.
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

export const formatDate = (dateA: string, dateB?: string, formatType?: string) => {
  if (formatType === 'fullYearMonth') {
    const start = new Date(dateA);
    const end = dateB && dateB !== '' && dateB !== null ? new Date(dateB) : new Date();
    const duration = intervalToDuration({ start, end });
    return formatDuration(duration, { format: ['years', 'months'] });
  }

  if (dateB === null || dateB === undefined) {
    return `${format(new Date(dateA), 'MM/yyyy')} - Present`;
  }

  if (dateB === '') {
    return format(new Date(dateA), 'MMMM yyyy');
  }

  return `${format(new Date(dateA), 'MM/yyyy')} - ${format(new Date(dateB), 'MM/yyyy')}`;
};

export type SkillEntry = {
  name: string;
  // Optional per-skill date range. `start` defaults to the work item's
  // startDate; `end` defaults to the work item's endDate (or "now" if the
  // job is ongoing). Lets staff-aug roles record real per-skill tenure.
  start?: string;
  end?: string | null;
};

export type WorkItemForChart = {
  startDate: string;
  endDate?: string | null;
  skills: SkillEntry[];
};

// Skills that appear in WORK_ITEMS as filter chips or generic descriptors,
// not technologies — excluded from the chart.
const CHART_EXCLUDE = new Set([
  'Front End',
  'Back End',
  'Agile',
  'Teaching',
  'Mentoring',
  'Programming',
  'Leadership',
  'Interviewing',
  'C',
  'Router',
]);

type Interval = { start: number; end: number };

// Merge overlapping intervals so that two concurrent jobs that both list the
// same skill don't double-count toward that skill's wall-clock experience.
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

// Skill × Year matrix used by the tenure heatmap on /skills.
//   - `years` is the contiguous span from the earliest job year to the
//     latest job's end year (or current year if the job is ongoing).
//     Including all years between makes the gap years explicit instead
//     of silently collapsing the timeline.
//   - `rows` lists each skill (excluding filter chips) with months of
//     experience per year; `total` is the cell sum.
//   - Cells are clamped to [0, 12] so a January-to-December year reads
//     as 12 months even if multiple concurrent jobs both used the skill.
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

function monthsOfOverlap(intervalStart: number, intervalEnd: number, year: number): number {
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  const start = Math.max(intervalStart, yearStart);
  const end = Math.min(intervalEnd, yearEnd);
  if (end <= start) return 0;
  return differenceInMonths(end, start);
}

export function getSkillHeatmapData(workItems: WorkItemForChart[]): SkillHeatmapData {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Year span: earliest job start → latest job end (or now if a job
  // is ongoing). Don't pre-anchor to the current year — a CV whose
  // most recent job ended in 2023 should render through 2023, not
  // pad empty 2024-2026 columns.
  let minYear = currentYear;
  let maxYear = currentYear;
  let bounded = false;
  for (const item of workItems) {
    const start = new Date(item.startDate).getFullYear();
    const end = item.endDate ? new Date(item.endDate).getFullYear() : currentYear;
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

  // Same interval collection as getSkillChartData — overlap-merging
  // happens before per-year bucketing so concurrent jobs using the
  // same skill don't double-count.
  const intervalsBySkill = new Map<string, Interval[]>();
  for (const item of workItems) {
    const jobStart = new Date(item.startDate).getTime();
    const jobEnd = (item.endDate ? new Date(item.endDate) : now).getTime();
    for (const entry of item.skills) {
      if (CHART_EXCLUDE.has(entry.name)) {
        // skipped
      } else {
        const skillStart = entry.start ? new Date(entry.start).getTime() : jobStart;
        const skillEnd = entry.end ? new Date(entry.end).getTime() : jobEnd;
        const start = Math.max(skillStart, jobStart);
        const end = Math.min(skillEnd, jobEnd);
        if (end > start) {
          const list = intervalsBySkill.get(entry.name);
          if (list) list.push({ start, end });
          else intervalsBySkill.set(entry.name, [{ start, end }]);
        }
      }
    }
  }

  const rows: SkillHeatmapRow[] = [];
  for (const [skill, intervals] of intervalsBySkill) {
    const merged = mergeIntervals(intervals);
    const monthsPerYear = years.map((year) =>
      Math.min(
        12,
        merged.reduce((sum, { start, end }) => sum + monthsOfOverlap(start, end, year), 0)
      )
    );
    const total = monthsPerYear.reduce((s, m) => s + m, 0);
    rows.push({ skill, monthsPerYear, total });
  }

  rows.sort((a, b) => b.total - a.total);
  return { years, rows };
}

export function getSkillChartData(workItems: WorkItemForChart[]): [string, number][] {
  const now = new Date();
  const intervalsBySkill = new Map<string, Interval[]>();

  for (const item of workItems) {
    const jobStart = new Date(item.startDate).getTime();
    const jobEnd = (item.endDate ? new Date(item.endDate) : now).getTime();

    for (const entry of item.skills) {
      if (CHART_EXCLUDE.has(entry.name)) {
        // Skipped — filter chip / generic descriptor.
      } else {
        // Skill-level dates fall back to the job's range when omitted.
        const skillStart = entry.start ? new Date(entry.start).getTime() : jobStart;
        const skillEnd = entry.end ? new Date(entry.end).getTime() : jobEnd;
        // Clamp to the job's range so a typo can't credit a skill more time
        // than the job itself lasted.
        const start = Math.max(skillStart, jobStart);
        const end = Math.min(skillEnd, jobEnd);
        if (end > start) {
          const list = intervalsBySkill.get(entry.name);
          if (list) {
            list.push({ start, end });
          } else {
            intervalsBySkill.set(entry.name, [{ start, end }]);
          }
        }
      }
    }
  }

  const totals: [string, number][] = [];
  for (const [skill, intervals] of intervalsBySkill) {
    const merged = mergeIntervals(intervals);
    const totalMonths = merged.reduce(
      (sum, { start, end }) => sum + differenceInMonths(end, start),
      0
    );
    totals.push([skill, Number((totalMonths / 12).toFixed(2))]);
  }

  return totals.sort((a, b) => b[1] - a[1]);
}
