import { getClassMaker } from '~/utils/utils';
import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'spinner-container';
const getClasses = getClassMaker(BLOCK);

export default function LoadingSpinner() {
  return (
    <div className={getClasses()}>
      <div className={getClasses('spinner-circle')}></div>
    </div>
  );
}
