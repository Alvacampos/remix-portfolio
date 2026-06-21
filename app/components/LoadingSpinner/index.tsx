import { useIntl } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

// LoadingSpinner CSS is inlined into the consuming route's
// style.css via postcss-import — no links() export.

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
