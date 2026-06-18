import 'react-vertical-timeline-component/style.min.css';

import type { MetaFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { FormattedMessage } from 'react-intl';

import Card from '~/components/Card';
import { formatDate, getClassMaker } from '~/utils/utils';

// Import the JSON server-side: Vite bakes it into the server bundle so
// the loader doesn't have to do an HTTP round-trip to the static asset
// at /data/education.json on every request. The asset is still served
// publicly via the `/data/*` exclude in public/_routes.json.
import educationData from '../../../public/data/education.json';
import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction = () => [
  { title: 'Education — Gonzalo Alvarez Campos' },
  {
    name: 'description',
    content:
      'Software Development associate degree from Universidad del Norte Santo Tomas de Aquino, plus Cambridge / EF SET English certifications and Udemy programming courses.',
  },
];

const BLOCK = 'education-route';
const getClasses = getClassMaker(BLOCK);

type Certification = {
  title: string;
  startDate: string;
  endDate?: string;
  institution: string;
  description: string;
  url?: string;
};

export async function loader() {
  // Widen the inferred type: TS reads the JSON literal and produces a
  // discriminated union based on which entries have `url`, so
  // `cert.url` isn't accessible without narrowing. Casting up to a
  // single shape with `url?: string` matches the old behavior and
  // keeps the consumer code simple.
  return {
    degree: educationData.degree,
    associateDegree: educationData.associateDegree,
    certifications: educationData.certifications as Certification[],
  };
}

export default function Skills() {
  const { degree, associateDegree, certifications } = useLoaderData<typeof loader>();
  const learnMore = (
    <p className={getClasses('learn-more')} aria-hidden>
      <FormattedMessage id="LEARN_MORE" />
      <span className={getClasses('learn-more-arrow')}>→</span>
    </p>
  );

  const degreeCard = {
    title: degree.title,
    texts: [
      `Date: ${formatDate(degree.startDate, degree.endDate)}`,
      degree.institution,
      degree.summary,
    ],
    children: learnMore,
  };

  const associateDegreeCard = {
    title: associateDegree.title,
    texts: [
      `Date: ${formatDate(associateDegree.startDate, associateDegree.endDate)}`,
      associateDegree.institution,
      associateDegree.summary,
    ],
    children: learnMore,
  };

  const certificationsCards = certifications.map((certification) => ({
    // institution is unique across certifications in education.json — stable key.
    key: certification.institution,
    title: certification.title,
    texts: [
      `Date: ${formatDate(certification.startDate, '')}`,
      certification.institution,
      certification.description,
    ],
    children: certification?.url && <Link to={certification.url}>Certification Link</Link>,
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
