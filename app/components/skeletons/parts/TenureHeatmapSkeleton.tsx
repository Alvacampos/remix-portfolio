import { SkeletonBlock } from '~/components/skeletons/primitives';

// Placeholder for the lazy-loaded TenureHeatmap chunk on /skills.
// A single tall block that matches the heatmap's rough footprint —
// enough to hold the row height so the surrounding grid doesn't jump
// when real content lands.
export default function TenureHeatmapSkeleton() {
  return <SkeletonBlock variant="heatmap" />;
}
