import { SkeletonBlock, SkeletonColumn } from '~/components/skeletons/primitives';

// Placeholder for the lazy-loaded TechTree chunk on /skills. Stacks
// three group blocks that roughly mirror the real component's
// section-per-category layout (Languages / Frameworks / Tooling / ...).
export default function TechTreeSkeleton() {
  return (
    <SkeletonColumn>
      <SkeletonBlock variant="subtitle" style={{ width: '40%' }} />
      <SkeletonBlock variant="card" style={{ height: 120 }} />
      <SkeletonBlock variant="subtitle" style={{ width: '35%' }} />
      <SkeletonBlock variant="card" style={{ height: 120 }} />
      <SkeletonBlock variant="subtitle" style={{ width: '45%' }} />
      <SkeletonBlock variant="card" style={{ height: 100 }} />
    </SkeletonColumn>
  );
}
