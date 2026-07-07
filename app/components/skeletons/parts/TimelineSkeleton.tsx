import { SkeletonBlock, SkeletonCard } from '~/components/skeletons/primitives';

// Placeholder for the lazy-loaded Timeline chunk on /skills. Reuses
// react-vertical-timeline-component's own DOM structure + class names so
// it inherits the existing Timeline styles (accent-colored vertical line,
// circular icon dots, alternating card sides on desktop) with no extra
// CSS. The card silhouettes come from SkeletonCard so each placeholder
// mirrors the real work-item card: title-wrapper header + body with
// role line, divider, and tech chips.
const PLACEHOLDER_COUNT = 4;

export default function TimelineSkeleton() {
  return (
    <div className="timeline-component" aria-hidden="true">
      <div className="vertical-timeline vertical-timeline--two-columns vertical-timeline--animate">
        {Array.from({ length: PLACEHOLDER_COUNT }).map((_, idx) => (
          <div key={idx} className="vertical-timeline-element">
            <span className="vertical-timeline-element-icon">
              <SkeletonBlock style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            </span>
            <div className="vertical-timeline-element-content">
              <div className="bounce-in">
                <SkeletonCard />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
