import { getClassMaker } from '~/utils/utils';

// DownloadBtn CSS is inlined into the consuming route's style.css
// via postcss-import — no links() export.

type DownloadButtonProps = {
  fileUrl: string;
  fileName?: string;
  children: React.ReactNode;
};

const BLOCK = 'download-btn';
const getClasses = getClassMaker(BLOCK);

export default function DownloadButton({
  fileUrl,
  fileName = undefined,
  children,
}: DownloadButtonProps) {
  return (
    <a
      href={fileUrl}
      download={fileName}
      className={getClasses()}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
