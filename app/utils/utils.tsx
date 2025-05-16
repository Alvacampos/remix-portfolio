import { format, differenceInMonths, formatDuration, intervalToDuration } from 'date-fns';

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

export function getSkillChartData(
  skillChartData: { name: string; dates: { startDate: string; endDate: string | null }[] }[]
): [string, number][] {
  const now = new Date();
  return skillChartData.map(skill => {
    const totalMonths = skill.dates.reduce((sum, { startDate, endDate }) => {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : now;
      return sum + differenceInMonths(end, start);
    }, 0);
    const years = totalMonths / 12;
    return [skill.name, Number(years.toFixed(2))];
  });
}
