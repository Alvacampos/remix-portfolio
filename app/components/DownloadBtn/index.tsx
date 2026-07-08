import { useCallback, useRef } from 'react';

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

// Prefetch the CV PDF on hover / focus / first pointer-down instead of
// on page load. The old page-load prefetch fired on every home visit —
// a ~300 KB download that competed with LCP on mobile. Prefetch-on-
// intent keeps the click responsive (browser fires the fetch ~100–
// 300 ms before the click event) without paying the bandwidth for
// visitors who never engage. `once` semantics avoid re-inserting the
// tag across repeated hovers.
export default function DownloadButton({
  fileUrl,
  fileName = undefined,
  children,
}: DownloadButtonProps) {
  const prefetchedRef = useRef(false);

  const prefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = fileUrl;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }, [fileUrl]);

  return (
    <a
      href={fileUrl}
      download={fileName}
      className={getClasses()}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
    >
      {children}
    </a>
  );
}
