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

  if (dateB === null || dateB === undefined) {
    return `${format(new Date(dateA), 'MM/yyyy')} - Present`;
  }

  if (dateB === '') {
    return format(new Date(dateA), 'MMMM yyyy');
  }

  return `${format(new Date(dateA), 'MM/yyyy')} - ${format(new Date(dateB), 'MM/yyyy')}`;
};

export type WorkItemForChart = {
  startDate: string;
  endDate?: string | null;
  skills: string[];
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

export function getSkillChartData(workItems: WorkItemForChart[]): [string, number][] {
  const now = new Date();
  const totals = new Map<string, number>();

  for (const item of workItems) {
    const start = new Date(item.startDate);
    const end = item.endDate ? new Date(item.endDate) : now;
    const months = differenceInMonths(end, start);

    for (const skill of item.skills) {
      if (!CHART_EXCLUDE.has(skill)) {
        totals.set(skill, (totals.get(skill) ?? 0) + months);
      }
    }
  }

  return [...totals.entries()]
    .map<[string, number]>(([name, months]) => [name, Number((months / 12).toFixed(2))])
    .sort((a, b) => b[1] - a[1]);
}
