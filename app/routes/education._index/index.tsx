import { FormattedMessage, useIntl } from 'react-intl';
import { data, type MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';

import Card from '~/components/Card';
import { EDUCATION } from '~/data/loaded';
import type { Locale } from '~/intl';
import { mergeRouteMeta } from '~/utils/meta';
import { passLoaderHeaders } from '~/utils/route-headers';
import { formatDate, getClassMaker, localized } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Education — Gonzalo Alvarez Campos',
    description:
      'Software Development associate degree from Universidad del Norte Santo Tomas de Aquino, plus Cambridge / EF SET English certifications and Udemy programming courses.',
    ogImage: 'education',
  });

const BLOCK = 'education-route';
const getClasses = getClassMaker(BLOCK);

// Certifications ordered: in-progress first, then startDate DESC.
// Applied once at module scope — the JSON's authored order is roughly
// newest-first already but the `inProgress` items don't reliably float
// to the top. `startDate` is `YYYY-MM`, zero-padded, so localeCompare
// gives correct chronological order.
const ORDERED_CERTIFICATIONS = [...EDUCATION.certifications].sort((a, b) => {
  const aInProgress = a.inProgress ?? false;
  const bInProgress = b.inProgress ?? false;
  if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
  return b.startDate.localeCompare(a.startDate);
});

export async function loader() {
  // Cloudflare Workers freeze Date at module-init (Spectre mitigation),
  // so `new Date()` must run inside the loader. YYYY-MM string compare
  // is enough — both sides are zero-padded ISO-like.
  const now = new Date();
  const todayYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const degreeInProgress = EDUCATION.degree.endDate > todayYearMonth;
  const associateInProgress = EDUCATION.associateDegree.endDate > todayYearMonth;
  // Degrees ordered: in-progress first. Two-entry list so a hand-rolled
  // ternary is clearer than a generic sort. Slug is stapled onto each
  // entry so the JSX can render both from a single .map().
  const degrees = [
    { ...EDUCATION.degree, slug: 'degree' as const, inProgress: degreeInProgress },
    {
      ...EDUCATION.associateDegree,
      slug: 'associate-degree' as const,
      inProgress: associateInProgress,
    },
  ].sort((a, b) => {
    if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1;
    return b.startDate.localeCompare(a.startDate);
  });
  return data(
    { degrees, certifications: ORDERED_CERTIFICATIONS },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        Vary: 'Accept-Language, Cookie',
      },
    }
  );
}

export { passLoaderHeaders as headers };

export default function Skills() {
  const { degrees, certifications } = useLoaderData<typeof loader>();
  const { formatMessage, locale } = useIntl();
  const loc = locale as Locale;
  const dateLabel = formatMessage({ id: 'DATE' });
  const learnMore = (
    <p className={getClasses('learn-more')} aria-hidden>
      <FormattedMessage id="LEARN_MORE" />
      <span className={getClasses('learn-more-arrow')}>→</span>
    </p>
  );

  // Format date ranges with full month names in the active locale,
  // matching the /:slug detail page ("March 2024 → September 2027")
  // instead of the locale-neutral numeric form (01/2024 - 09/2027).
  const formatRange = (start: string, end: string) =>
    `${formatDate(start, '', undefined, loc)} → ${formatDate(end, '', undefined, loc)}`;

  const inProgressBadge = (
    <span
      className={getClasses('in-progress-badge')}
      aria-label={formatMessage({ id: 'CURRENTLY_STUDYING' })}
    >
      <span className={getClasses('in-progress-dot')} aria-hidden="true" />
      <FormattedMessage id="CURRENTLY_STUDYING" />
    </span>
  );

  const degreeCards = degrees.map((d) => ({
    key: d.slug,
    slug: d.slug,
    inProgress: d.inProgress,
    title: localized(d, 'title', loc),
    texts: [
      `${dateLabel}: ${formatRange(d.startDate, d.endDate)}`,
      d.institution,
      localized(d, 'summary', loc),
    ],
  }));

  const certificationsCards = certifications.map((certification) => ({
    key: certification.institution,
    inProgress: certification.inProgress ?? false,
    title: localized(certification, 'title', loc),
    texts: [
      `${dateLabel}: ${formatDate(certification.startDate, '', undefined, loc)}`,
      certification.institution,
      localized(certification, 'description', loc),
    ],
    children: certification?.url && (
      <Link to={certification.url} target="_blank" rel="noreferrer">
        <FormattedMessage id="CERTIFICATION_LINK" />
      </Link>
    ),
  }));

  return (
    <div className={getClasses()}>
      <h1 className="route-page-title">
        <FormattedMessage id="PAGE_TITLE_EDUCATION" />
      </h1>
      <div className={getClasses('degree')}>
        <h2>
          <FormattedMessage id="DEGREES" />
        </h2>
        <div className={getClasses('degree-container')}>
          {degreeCards.map(({ key, slug, inProgress, ...card }) => (
            <Link key={key} to={`/education/${slug}`} className={getClasses('card-link')}>
              <div className={getClasses('card-wrapper')}>
                {inProgress && inProgressBadge}
                <Card {...card}>{learnMore}</Card>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className={getClasses('certification')}>
        <h2>
          <FormattedMessage id="CERTIFICATIONS" />
        </h2>
        <div className={getClasses('card-wrapper', 'certification-wrapper')}>
          {certificationsCards.map(({ key, inProgress, ...card }) => (
            // Individual wrapper per certification so the in-progress
            // badge can hang off its top edge via absolute positioning
            // — mirrors the pattern used for the two degree cards above.
            <div className={getClasses('card-wrapper')} key={key}>
              {inProgress && inProgressBadge}
              <Card {...card} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
