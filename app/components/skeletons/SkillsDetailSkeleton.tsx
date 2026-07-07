import { SkeletonBlock, SkeletonColumn, SkeletonPage } from './primitives';

// Mirrors app/routes/skills.$uuid — logo banner + title + role +
// description + skills group chips.
export default function SkillsDetailSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonBlock variant="banner" />
      <SkeletonColumn>
        <SkeletonBlock variant="title" style={{ width: '55%' }} />
        <SkeletonBlock variant="subtitle" style={{ width: '35%' }} />
        <SkeletonBlock variant="text" />
        <SkeletonBlock variant="text" style={{ width: '85%' }} />
        <SkeletonBlock variant="text-short" />
      </SkeletonColumn>
      <SkeletonBlock variant="subtitle" style={{ width: '25%' }} />
      <div className="skeleton-row">
        <SkeletonBlock variant="chip" />
        <SkeletonBlock variant="chip" style={{ width: 80 }} />
        <SkeletonBlock variant="chip" style={{ width: 140 }} />
        <SkeletonBlock variant="chip" style={{ width: 100 }} />
        <SkeletonBlock variant="chip" style={{ width: 90 }} />
        <SkeletonBlock variant="chip" style={{ width: 160 }} />
      </div>
    </SkeletonPage>
  );
}
