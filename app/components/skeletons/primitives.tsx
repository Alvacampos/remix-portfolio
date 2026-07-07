// Primitive placeholder blocks composed by every per-route skeleton.
// Classes live in ./style.css and get inlined via postcss-import from
// PendingBoundary/style.css → app/styles/style.css.

type BlockProps = {
  variant?:
    | 'title'
    | 'subtitle'
    | 'text'
    | 'text-short'
    | 'chip'
    | 'button'
    | 'card'
    | 'card-tall'
    | 'banner'
    | 'heatmap';
  style?: React.CSSProperties;
};

export function SkeletonBlock({ variant = undefined, style = undefined }: BlockProps) {
  const className = variant ? `skeleton-block skeleton-block--${variant}` : 'skeleton-block';
  return <div className={className} style={style} aria-hidden="true" />;
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return <div className="skeleton-page">{children}</div>;
}

export function SkeletonRow({ children }: { children: React.ReactNode }) {
  return <div className="skeleton-row">{children}</div>;
}

export function SkeletonGrid({ children }: { children: React.ReactNode }) {
  return <div className="skeleton-grid">{children}</div>;
}

export function SkeletonColumn({ children }: { children: React.ReactNode }) {
  return <div className="skeleton-column">{children}</div>;
}
