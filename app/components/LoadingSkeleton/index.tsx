import { getClassMaker } from '~/utils/utils';
import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'loading-skeleton';
const getClasses = getClassMaker(BLOCK);

export default function LoadingSkeleton() {
  return (
    <div className={getClasses()}>
      <div className={getClasses('title')} />
      <div className={getClasses('row')} />
      <div className={getClasses('row')} />
    </div>
  );
}