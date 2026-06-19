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

export const formatDate = (dateA: string, dateB?: string, formatType?: string) => {
  if (formatType === 'fullYearMonth') {
    const start = new Date(dateA);
    const end = dateB && dateB !== '' && dateB !== null ? new Date(dateB) : new Date();
    const duration = intervalToDuration({ start, end });
    return formatDuration(duration, { format: ['years', 'months'] });
  }

  // Unified date format across the app: abbreviated month + 4-digit year,
  // joined by an en-dash for ranges. Stage 19 (#3) collapsed the three
  // earlier formats ('MM/yyyy - MM/yyyy', 'MM/yyyy - Present', 'MMMM yyyy')
  // into this single shape so timeline cards, education cards, and
  // certifications all read the same way.
  if (dateB === null || dateB === undefined) {
    return `${format(new Date(dateA), 'MMM yyyy')} – Present`;
  }

  if (dateB === '') {
    return format(new Date(dateA), 'MMM yyyy');
  }

  return `${format(new Date(dateA), 'MMM yyyy')} – ${format(new Date(dateB), 'MMM yyyy')}`;
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
