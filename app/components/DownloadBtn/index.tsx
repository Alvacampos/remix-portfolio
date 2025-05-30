import styles from './style.css?url';
import { getClassMaker } from '~/utils/utils';

export const links = () => [{ rel: 'stylesheet', href: styles }];

type DownloadButtonProps = {
  fileUrl: string;
  fileName?: string;
  children?: React.ReactNode;
};

const BLOCK = 'download-btn';
const getClasses = getClassMaker(BLOCK);

export default function DownloadButton({ fileUrl, fileName, children }: DownloadButtonProps) {
  return (
    <a
      href={fileUrl}
      download={fileName}
      className={getClasses()}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children || 'Download PDF'}
    </a>
  );
}