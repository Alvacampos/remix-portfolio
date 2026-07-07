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

// Mirrors app/components/Card — bordered surface with a darker header
// stripe (title-wrapper equivalent) and a padded body with role/skills
// lines + a divider + chip row. Used inside the timeline skeleton so
// each placeholder looks like a real work-item card silhouette rather
// than a flat rectangle.
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__header">
        <SkeletonBlock style={{ width: '40%', height: 24 }} />
      </div>
      <div className="skeleton-card__body">
        <SkeletonBlock variant="text-short" style={{ width: '55%' }} />
        <div className="skeleton-card__divider" />
        <div className="skeleton-row">
          <SkeletonBlock variant="chip" style={{ width: 60 }} />
          <SkeletonBlock variant="chip" style={{ width: 80 }} />
          <SkeletonBlock variant="chip" style={{ width: 100 }} />
          <SkeletonBlock variant="chip" style={{ width: 70 }} />
          <SkeletonBlock variant="chip" style={{ width: 90 }} />
        </div>
      </div>
    </div>
  );
}
