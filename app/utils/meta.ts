// Merge a route's title + description with the root's full meta array,
// preserving the root's Open Graph + Twitter tags so social previews have
// their image/site_name/etc. on every route. Without this, Remix lets the
// child route's meta() *replace* the parent's array completely — meaning
// only the homepage would surface og:image, etc.
//
// Per-route OG image override: pass `ogImage: '<slug>'` to point at
// `/assets/img/og-<slug>.png` (must exist; `npm run build:og` regenerates
// from `scripts/og/<slug>.svg`). When omitted, the route inherits the
// root's default OG image. Detail routes typically inherit their parent
// section's OG (e.g. `/skills/:uuid` inherits `/skills`).
const SITE_URL = 'https://gonzalo-alvarez-campos-cv.com';

type RouteMetaOverrides = {
  title: string;
  description: string;
  ogImage?: string;
};

type MetaArg = { matches: Array<{ meta: Array<Record<string, unknown>> }> };

export function mergeRouteMeta(
  { matches }: MetaArg,
  { title, description, ogImage }: RouteMetaOverrides
) {
  const parentMeta = matches.flatMap((m) => m.meta);
  const carry = parentMeta.filter((tag) => {
    if (typeof tag !== 'object' || tag === null) return true;
    if ('title' in tag) return false;
    if ('name' in tag && tag.name === 'description') return false;
    if ('property' in tag && (tag.property === 'og:title' || tag.property === 'og:description'))
      return false;
    if ('name' in tag && (tag.name === 'twitter:title' || tag.name === 'twitter:description'))
      return false;
    // When this route specifies its own ogImage, strip the parent's
    // image tags so we can replace them cleanly below. Otherwise let
    // the parent's default carry through.
    if (ogImage) {
      if (
        'property' in tag &&
        typeof tag.property === 'string' &&
        tag.property.startsWith('og:image')
      ) {
        return false;
      }
      if ('name' in tag && tag.name === 'twitter:image') return false;
      if ('name' in tag && tag.name === 'twitter:image:alt') return false;
    }
    return true;
  });
  const tags: Array<Record<string, unknown>> = [
    ...carry,
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
  if (ogImage) {
    const url = `${SITE_URL}/assets/img/og-${ogImage}.png`;
    tags.push(
      { property: 'og:image', content: url },
      { property: 'og:image:secure_url', content: url },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: title },
      { name: 'twitter:image', content: url },
      { name: 'twitter:image:alt', content: title }
    );
  }
  return tags;
}
