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
  return {
    degree: EDUCATION.degree,
    associateDegree: EDUCATION.associateDegree,
    certifications: EDUCATION.certifications,
  };
}

export default function Skills() {
  const { degree, associateDegree, certifications } = useLoaderData<typeof loader>();
  const { formatMessage, locale } = useIntl();
  const loc = locale as Locale;
  const dateLabel = formatMessage({ id: 'DATE' });
  const learnMore = (
    <p className={getClasses('learn-more')} aria-hidden>
      <FormattedMessage id="LEARN_MORE" />
      <span className={getClasses('learn-more-arrow')}>→</span>
    </p>
  );

  const degreeCard = {
    title: localized(degree, 'title', loc),
    texts: [
      `${dateLabel}: ${formatDate(degree.startDate, degree.endDate)}`,
      degree.institution,
      localized(degree, 'summary', loc),
    ],
    children: learnMore,
  };

  const associateDegreeCard = {
    title: localized(associateDegree, 'title', loc),
    texts: [
      `${dateLabel}: ${formatDate(associateDegree.startDate, associateDegree.endDate)}`,
      associateDegree.institution,
      localized(associateDegree, 'summary', loc),
    ],
    children: learnMore,
  };

  const certificationsCards = certifications.map((certification) => ({
    key: certification.institution,
    title: localized(certification, 'title', loc),
    texts: [
      `${dateLabel}: ${formatDate(certification.startDate, '')}`,
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
              <Card {...degreeCard} />
            </div>
          </Link>
          <Link to="/education/associate-degree" className={getClasses('card-link')}>
            <div className={getClasses('card-wrapper')}>
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
