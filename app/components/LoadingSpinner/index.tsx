import { useIntl } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'spinner-container';
const getClasses = getClassMaker(BLOCK);

export default function LoadingSpinner() {
  const { formatMessage } = useIntl();
  const label = formatMessage({ id: 'LOADING' });
  return (
    <div className={getClasses()} role="status" aria-live="polite" aria-label={label}>
      <div className={getClasses('spinner-circle')} aria-hidden="true" />
    </div>
  );
}
