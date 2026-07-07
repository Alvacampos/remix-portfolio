import { SkeletonBlock, SkeletonColumn, SkeletonPage } from './primitives';

// Mirrors app/routes/contact._index — page title + intro paragraph +
// name/email row + subject + message textarea + submit button.
export default function ContactSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonBlock variant="title" />
      <SkeletonBlock variant="text" style={{ width: '75%' }} />
      <div className="skeleton-row">
        <SkeletonBlock variant="button" style={{ width: '100%', flex: 1, height: 56 }} />
        <SkeletonBlock variant="button" style={{ width: '100%', flex: 1, height: 56 }} />
      </div>
      <SkeletonColumn>
        <SkeletonBlock variant="button" style={{ width: '100%', height: 56 }} />
        <SkeletonBlock variant="button" style={{ width: '100%', height: 180 }} />
      </SkeletonColumn>
      <SkeletonBlock variant="button" />
    </SkeletonPage>
  );
}
