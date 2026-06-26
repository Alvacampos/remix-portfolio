import 'react-vertical-timeline-component/style.min.css';

import type { MetaFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';

import Card from '~/components/Card';
import { loadEducation } from '~/data/education-schema';
import type { Locale } from '~/intl';
import { formatDate, getClassMaker, localized, mergeRouteMeta } from '~/utils/utils';

import educationJson from '../../../public/data/education.json';
import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Education — Gonzalo Alvarez Campos',
    description:
      'Software Development associate degree from Universidad del Norte Santo Tomas de Aquino, plus Cambridge / EF SET English certifications and Udemy programming courses.',
  });

const BLOCK = 'education-route';
const getClasses = getClassMaker(BLOCK);

// Validate at worker boot — single source of truth for shape and
// localization metadata. Hoisted out of the loader so the parse
// runs once on cold start, not per request.
const EDUCATION = loadEducation(educationJson);

export async function loader() {
  // Cloudflare Workers freeze Date at module-init (Spectre mitigation),
  // so `new Date()` must run inside the loader. YYYY-MM string compare
  // is enough — both sides are zero-padded ISO-like.
  const now = new Date();
  const todayYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return {
    degree: EDUCATION.degree,
    associateDegree: EDUCATION.associateDegree,
    certifications: EDUCATION.certifications,
    degreeInProgress: EDUCATION.degree.endDate > todayYearMonth,
    associateInProgress: EDUCATION.associateDegree.endDate > todayYearMonth,
  };
}

export default function Skills() {
  const { degree, associateDegree, certifications, degreeInProgress, associateInProgress } =
    useLoaderData<typeof loader>();
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

  const degreeCard = {
    title: localized(degree, 'title', loc),
    texts: [
      `${dateLabel}: ${formatRange(degree.startDate, degree.endDate)}`,
      degree.institution,
      localized(degree, 'summary', loc),
    ],
    children: learnMore,
  };

  const associateDegreeCard = {
    title: localized(associateDegree, 'title', loc),
    texts: [
      `${dateLabel}: ${formatRange(associateDegree.startDate, associateDegree.endDate)}`,
      associateDegree.institution,
      localized(associateDegree, 'summary', loc),
    ],
    children: learnMore,
  };

  const inProgressBadge = (
    <span
      className={getClasses('in-progress-badge')}
      aria-label={formatMessage({ id: 'CURRENTLY_STUDYING' })}
    >
      <span className={getClasses('in-progress-dot')} aria-hidden="true" />
      <FormattedMessage id="CURRENTLY_STUDYING" />
    </span>
  );

  const certificationsCards = certifications.map((certification) => ({
    key: certification.institution,
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
      <div className={getClasses('degree')}>
        <h2>
          <FormattedMessage id="DEGREES" />
        </h2>
        <div className={getClasses('degree-container')}>
          <Link to="/education/degree" className={getClasses('card-link')}>
            <div className={getClasses('card-wrapper')}>
              {degreeInProgress && inProgressBadge}
              <Card {...degreeCard} />
            </div>
          </Link>
          <Link to="/education/associate-degree" className={getClasses('card-link')}>
            <div className={getClasses('card-wrapper')}>
              {associateInProgress && inProgressBadge}
              <Card {...associateDegreeCard} />
            </div>
          </Link>
        </div>
      </div>
      <div className={getClasses('certification')}>
        <h2>
          <FormattedMessage id="CERTIFICATIONS" />
        </h2>
        <div className={getClasses('card-wrapper', 'certification-wrapper')}>
          {certificationsCards.map(({ key, ...card }) => (
            <Card {...card} key={key} />
          ))}
        </div>
      </div>
    </div>
  );
}
