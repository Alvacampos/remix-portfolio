import { getClassMaker } from '~/utils/utils';

// Stage 13: DownloadBtn CSS is inlined into the consuming route's style.css
// via postcss-import. No links() export.

type DownloadButtonProps = {
  fileUrl: string;
  fileName?: string;
  children?: React.ReactNode;
};

const BLOCK = 'download-btn';
const getClasses = getClassMaker(BLOCK);

export default function DownloadButton({
  fileUrl,
  fileName = undefined,
  children = undefined,
}: DownloadButtonProps) {
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
