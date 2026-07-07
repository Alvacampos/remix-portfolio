import { SkeletonBlock, SkeletonColumn, SkeletonPage, SkeletonRow } from './primitives';

// Mirrors app/routes/_index — hero heading + role/tagline lines + chip
// row + two CTAs + a small footer link.
export default function HomeSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonColumn>
        <SkeletonBlock variant="title" style={{ width: '80%', height: 48 }} />
        <SkeletonBlock variant="subtitle" style={{ width: '55%' }} />
        <SkeletonBlock variant="text" style={{ width: '70%' }} />
      </SkeletonColumn>
      <SkeletonRow>
        <SkeletonBlock variant="chip" />
        <SkeletonBlock variant="chip" style={{ width: 220 }} />
      </SkeletonRow>
      <SkeletonRow>
        <SkeletonBlock variant="button" />
        <SkeletonBlock variant="button" />
      </SkeletonRow>
      <SkeletonBlock variant="text-short" />
    </SkeletonPage>
  );
}
