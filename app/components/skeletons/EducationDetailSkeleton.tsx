import { SkeletonBlock, SkeletonColumn, SkeletonPage } from './primitives';

// Mirrors app/routes/education.$slug — one big degree card.
export default function EducationDetailSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonBlock variant="title" />
      <SkeletonBlock variant="subtitle" />
      <SkeletonColumn>
        <SkeletonBlock variant="text" />
        <SkeletonBlock variant="text" style={{ width: '90%' }} />
        <SkeletonBlock variant="text" style={{ width: '85%' }} />
        <SkeletonBlock variant="text-short" />
      </SkeletonColumn>
      <SkeletonBlock variant="card-tall" />
    </SkeletonPage>
  );
}
