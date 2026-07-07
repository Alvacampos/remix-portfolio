import { SkeletonBlock, SkeletonGrid, SkeletonPage } from './primitives';

// Mirrors app/routes/education._index — page title + degrees grid +
// certifications grid.
export default function EducationSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonBlock variant="title" />
      <SkeletonBlock variant="subtitle" />
      <SkeletonGrid>
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
      </SkeletonGrid>
      <SkeletonBlock variant="subtitle" />
      <SkeletonGrid>
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
      </SkeletonGrid>
    </SkeletonPage>
  );
}
