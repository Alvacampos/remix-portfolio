import { differenceInMonths, format, formatDuration, intervalToDuration } from 'date-fns';
import { es as dfEs } from 'date-fns/locale';

import type { Skill, SkillCategory, SkillsData, WorkItem } from '~/data/skills-schema';
import type { Locale } from '~/intl';

// Toggle this to `true` once a Spanish CV PDF lands at
// public/assets/files/gonzalo_alvarez_campos_cv_es.pdf. Until then,
// `getCvUrl('es')` falls back to the English file so a Spanish-locale
// visitor still gets a working download instead of a 404.
const HAS_ES_CV = false;

const CV_URLS: Record<Locale, string> = {
  en: '/assets/files/gonzalo_alvarez_campos_cv.pdf',
  es: '/assets/files/gonzalo_alvarez_campos_cv_es.pdf',
};

export function getCvUrl(locale: Locale): string {
  if (locale === 'es' && !HAS_ES_CV) return CV_URLS.en;
  return CV_URLS[locale];
}

// Resolve a localizable field. Reads `<key>_es` when locale === 'es'
// and falls back to the base field when the sibling is missing/empty
// — partial translations render in both languages without breaking.
export function localized<T, K extends keyof T>(
  item: T,
  key: K,
  locale: Locale
): T[K] extends string | undefined ? T[K] : never {
  type R = T[K] extends string | undefined ? T[K] : never;
  if (locale === 'es') {
    const esKey = `${String(key)}_es` as keyof T;
    const esValue = item[esKey];
    if (typeof esValue === 'string' && esValue.length > 0) {
      return esValue as R;
    }
  }
  return item[key] as R;
}

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

// Parse a YYYY-MM (or longer ISO) string at LOCAL midnight on the 1st of
// the month. Plain `new Date('2018-08')` parses as UTC midnight, which
// shifts to the prior day in negative-offset timezones — for the CV that
// means an August start renders as July. Force local-zone parsing.
//
// Both data files (skills.json, education.json) are validated to
// `YYYY-MM` at the Zod boundary, so this only handles that format.
const parseYearMonth = (s: string): Date => new Date(`${s}-01T00:00:00`);

// `locale` only affects the human-readable formats — `fullYearMonth`
// ("4 años 2 meses") and the single-month case ("agosto 2018"). The
// numeric `MM/yyyy` branches are locale-neutral.
export const formatDate = (
  dateA: string,
  dateB?: string,
  formatType?: string,
  locale: Locale = 'en'
) => {
  const dfLocale = locale === 'es' ? dfEs : undefined;

  if (formatType === 'fullYearMonth') {
    const start = parseYearMonth(dateA);
    const end = dateB && dateB !== '' && dateB !== null ? parseYearMonth(dateB) : new Date();
    const duration = intervalToDuration({ start, end });
    return formatDuration(duration, { format: ['years', 'months'], locale: dfLocale });
  }

  if (dateB === null || dateB === undefined) {
    return `${format(parseYearMonth(dateA), 'MM/yyyy')} - Present`;
  }

  if (dateB === '') {
    return format(parseYearMonth(dateA), 'MMMM yyyy', { locale: dfLocale });
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
//   - Row order: active skills first (any cells in the last column)
//     then lapsed skills. Within each group, sort is:
//       weight DESC → total DESC (active) / last-used year DESC, total DESC (lapsed)
//     `weight` is an optional curator signal on each skill (see the
//     schema): raw cumulative months treats CSS/HTML/Git (used for a
//     decade) as more important than TypeScript/Playwright/Claude Code
//     (newer but recruiter-facing), so weight lets an author pin what
//     matters. Splitting active/lapsed keeps the chart's recency tail
//     at the bottom. `isActive` is exposed so consumers can render a
//     divider between the groups if they want.
export type SkillHeatmapRow = {
  skill: string;
  monthsPerYear: number[];
  total: number;
  isActive: boolean;
  // Curator weight carried on the row so the sort can use it — no
  // consumer reads it, so it's optional to keep test fixtures and
  // Storybook stubs from having to invent a value they don't care about.
  weight?: number;
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

// Cache keyed by the SkillsData reference + `${year}-${month}` so a
// worker instance that serves multiple cold-start /skills requests
// within the same calendar month only builds the heatmap once. Output
// depends on `new Date()` (for the year span's "ongoing job" clamp and
// current-month bucket), so invalidate when the month rolls over. Also
// keyed by reference so unit tests with different fixtures each get a
// fresh compute — production always passes the deploy-frozen singleton.
const HEATMAP_CACHE = new WeakMap<SkillsData, { key: string; value: SkillHeatmapData }>();

export function getSkillHeatmapData(skillsData: SkillsData): SkillHeatmapData {
  const now = new Date();
  const cacheKey = `${now.getFullYear()}-${now.getMonth()}`;
  const cached = HEATMAP_CACHE.get(skillsData);
  if (cached && cached.key === cacheKey) return cached.value;
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
        if (total > 0) {
          // "Active" = has any months in the rightmost column (current year
          // when a job is ongoing, otherwise the latest job's end year).
          const isActive = monthsPerYear[monthsPerYear.length - 1] > 0;
          const weight = skill.weight ?? 0;
          rows.push({ skill: skill.name, monthsPerYear, total, isActive, weight });
        }
      }
    }
  }

  // Sort: active-first, then within each group `weight DESC` (curator
  // signal) is the primary key. Ties fall back to the historical
  // ordering — total DESC among active, last-used year DESC / total
  // DESC among lapsed — so skills without a weight still rank sanely.
  const lastUsedYear = (row: SkillHeatmapRow): number => {
    for (let i = row.monthsPerYear.length - 1; i >= 0; i--) {
      if (row.monthsPerYear[i] > 0) return i;
    }
    return -1;
  };
  rows.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const aw = a.weight ?? 0;
    const bw = b.weight ?? 0;
    if (aw !== bw) return bw - aw;
    if (a.isActive) return b.total - a.total;
    const aLast = lastUsedYear(a);
    const bLast = lastUsedYear(b);
    if (aLast !== bLast) return bLast - aLast;
    return b.total - a.total;
  });
  const value: SkillHeatmapData = { years, rows };
  HEATMAP_CACHE.set(skillsData, { key: cacheKey, value });
  return value;
}

// Skills attached to a single job, bucketed by category. The `id` on
// each group is the intl message id for the heading rendered above
// the chip list. Empty buckets are dropped.
//
// Consumers that just need a flat chip list (e.g. timeline cards on
// /skills) call this and flatMap the items — the bucket order
// (language → framework → tooling → infra → meta) gives them
// deterministic, category-grouped ordering for free.
export type SkillGroup = { id: string; items: string[] };

const CATEGORY_GROUPS: Array<{ id: string; categories: SkillCategory[] }> = [
  { id: 'TECH_GROUP_LANGUAGES', categories: ['language'] },
  { id: 'TECH_GROUP_FRAMEWORKS', categories: ['framework'] },
  { id: 'TECH_GROUP_TOOLING', categories: ['tooling'] },
  { id: 'TECH_GROUP_INFRA', categories: ['infra'] },
  // AI-assisted development sits between infra and soft skills — after
  // the "how you build" categories and before the "how you work"
  // meta bucket. Own group so it stands out; heatmap includes it as a
  // regular row (not filtered like `meta`) since these are actual
  // tools with tenure at specific jobs.
  { id: 'TECH_GROUP_AI', categories: ['ai'] },
  { id: 'TECH_GROUP_SOFT', categories: ['meta'] },
];

function buildGroups(skills: Skill[], locale: Locale): SkillGroup[] {
  const groups: SkillGroup[] = [];
  for (const group of CATEGORY_GROUPS) {
    const items: string[] = [];
    for (const s of skills) {
      if (group.categories.includes(s.category)) {
        items.push(localized(s, 'name', locale));
      }
    }
    if (items.length > 0) {
      items.sort((a, b) => a.localeCompare(b));
      groups.push({ id: group.id, items });
    }
  }
  return groups;
}

export function getSkillGroupsForJob(
  skillsData: SkillsData,
  jobId: number,
  locale: Locale = 'en'
): SkillGroup[] {
  const skills = skillsData.SKILLS.filter((s) => s.ranges.some((r) => r.jobId === jobId));
  return buildGroups(skills, locale);
}

// Every skill in the data layer, bucketed by category. Used by the
// home TechTree to render the full tech-stack overview without
// hardcoding the list in the component. Mirrors getSkillGroupsForJob
// but doesn't filter by job — every entry in SKILLS contributes.
export function getAllSkillGroups(skillsData: SkillsData, locale: Locale = 'en'): SkillGroup[] {
  return buildGroups(skillsData.SKILLS, locale);
}

// Names of skills shown in the autocomplete on /skills. Excludes `meta`
// category (filter chips like "Front End", "Mentoring") so they don't
// appear as filter options. Sorted alphabetically.
export function getSkillSuggestions(skillsData: SkillsData): string[] {
  return skillsData.SKILLS.filter((s) => s.category !== 'meta')
    .map((s) => s.name)
    .sort();
}
