import { SkeletonBlock, SkeletonColumn, SkeletonGrid, SkeletonPage } from './primitives';

// Mirrors app/routes/skills._index — page title, autocomplete + timeline
// cards, "Total years" card, then the SKILLS section (heatmap + TechTree
// side-by-side on desktop), then EXTRA_ACTIVITIES cards.
export default function SkillsSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonBlock variant="title" />
      <SkeletonColumn>
        <SkeletonBlock variant="button" style={{ width: '100%', maxWidth: 480, height: 48 }} />
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
      </SkeletonColumn>
      <SkeletonBlock variant="subtitle" />
      <div className="skeleton-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <SkeletonBlock variant="heatmap" />
        <SkeletonBlock variant="card-tall" />
      </div>
      <SkeletonBlock variant="subtitle" />
      <SkeletonGrid>
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
        <SkeletonBlock variant="card" />
      </SkeletonGrid>
    </SkeletonPage>
  );
}
