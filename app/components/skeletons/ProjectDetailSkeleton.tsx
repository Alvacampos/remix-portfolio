import { SkeletonBlock, SkeletonColumn, SkeletonPage } from './primitives';

// Mirrors app/routes/projects.$slug — big case-study write-up: title +
// summary + four narrative sections (Problem/Constraints/Approach/
// Outcome) + tech chips.
export default function ProjectDetailSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonBlock variant="title" />
      <SkeletonBlock variant="subtitle" />
      <SkeletonBlock variant="text" />
      <SkeletonBlock variant="text" style={{ width: '80%' }} />
      {['Problem', 'Constraints', 'Approach', 'Outcome'].map((section) => (
        <SkeletonColumn key={section}>
          <SkeletonBlock variant="subtitle" style={{ width: '20%' }} />
          <SkeletonBlock variant="text" />
          <SkeletonBlock variant="text" style={{ width: '95%' }} />
          <SkeletonBlock variant="text" style={{ width: '85%' }} />
        </SkeletonColumn>
      ))}
      <div className="skeleton-row">
        {Array.from({ length: 8 }).map((_, idx) => (
          <SkeletonBlock key={idx} variant="chip" style={{ width: 90 + ((idx * 17) % 60) }} />
        ))}
      </div>
    </SkeletonPage>
  );
}
