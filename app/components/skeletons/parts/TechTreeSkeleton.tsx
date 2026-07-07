import { SkeletonBlock } from '~/components/skeletons/primitives';

// Mirrors app/components/TechTree — bordered padded surface with a stack
// of category groups (small uppercase label + wrapping chip row). Chip
// widths vary so the placeholder doesn't read as a grid of identical
// blocks. Row counts approximate the real category distribution
// (Languages / Frameworks / Tooling / Infra / AI).
const GROUP_CHIP_WIDTHS = [
  [58, 62, 74, 90, 68], // Languages
  [70, 96, 82, 60], // Frameworks
  [80, 66, 92, 74, 88, 60], // Tooling
  [76, 84, 66], // Infra
  [72, 96], // AI
];

export default function TechTreeSkeleton() {
  return (
    <div className="skeleton-tech-tree" aria-hidden="true">
      {GROUP_CHIP_WIDTHS.map((widths, idx) => (
        <div key={idx} className="skeleton-tech-tree__group">
          <SkeletonBlock style={{ width: 80, height: 12 }} />
          <div className="skeleton-row">
            {widths.map((w, chipIdx) => (
              <SkeletonBlock key={chipIdx} variant="chip" style={{ width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
