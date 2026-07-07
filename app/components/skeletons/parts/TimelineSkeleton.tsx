import { SkeletonBlock, SkeletonColumn } from '~/components/skeletons/primitives';

// Placeholder for the lazy-loaded Timeline chunk on /skills. Renders a
// stack of card silhouettes that match the vertical timeline layout so
// the swap to real content doesn't shift the surrounding page.
export default function TimelineSkeleton() {
  return (
    <SkeletonColumn>
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
      <SkeletonBlock variant="card" />
    </SkeletonColumn>
  );
}
