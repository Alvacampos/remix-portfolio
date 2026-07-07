import { SkeletonBlock, SkeletonGrid, SkeletonPage } from './primitives';

// Mirrors app/routes/projects._index — page title + case-study grid.
export default function ProjectsSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonBlock variant="title" />
      <SkeletonBlock variant="text" style={{ width: '65%' }} />
      <SkeletonGrid>
        <SkeletonBlock variant="card-tall" />
        <SkeletonBlock variant="card-tall" />
        <SkeletonBlock variant="card-tall" />
      </SkeletonGrid>
    </SkeletonPage>
  );
}
