import { format } from 'date-fns';

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

export const formatDate = (dateA: string, dateB?: string) => {
  if (dateB === null || dateB === undefined) {
    return `${format(new Date(dateA), 'MM/yyyy')} - Present`;
  }

  if (dateB === '') {
    return format(new Date(dateA), 'MMMM yyyy');
  }

  return `${format(new Date(dateA), 'MM/yyyy')} - ${format(new Date(dateB), 'MM/yyyy')}`;
};
