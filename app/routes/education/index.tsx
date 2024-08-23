import 'react-vertical-timeline-component/style.min.css';

import { Link, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import { Children, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { EDUCATION } from '~/utils/data';
import { v4 as uuid } from 'uuid';

import Card, { links as cardLinks } from '~/components/Card';
import { getClassMaker, formatDate } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [...cardLinks(), { rel: 'stylesheet', href: styles }];

const BLOCK = 'education-route';
const getClasses = getClassMaker(BLOCK);

type DataTypes = {
  degree: {
    title: string;
    startDate: string;
    endDate: string;
    institution: string;
    description: string;
  };
  certifications: {
    title: string;
    startDate: string;
    institution: string;
    description: string;
    url?: string;
  }[];
};

export async function loader() {
  const { degree, certifications }: DataTypes = EDUCATION;

  return json({ degree, certifications });
}

export default function Skills() {
  const { degree, certifications } = useLoaderData<typeof loader>();

  const degreeCard = {
    title: degree.title,
    texts: [
      `Date: ${formatDate(degree.startDate, degree.endDate)}`,
      degree.institution,
      degree.description,
    ],
  };

  const certificationsCards = certifications.map((certification) => ({
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
          <FormattedMessage id="DEGREE" />
        </h2>
        <div className={getClasses('card-wrapper')}>
          <Card {...degreeCard} />
        </div>
      </div>
      <div className={getClasses('certification')}>
        <h2>
          <FormattedMessage id="CERTIFICATION" />
        </h2>
        <div className={getClasses('card-wrapper', 'certification-wrapper')}>
          {certificationsCards.map((card) => (
            <Card {...card} key={uuid()} />
          ))}
        </div>
      </div>
    </div>
  );
}
