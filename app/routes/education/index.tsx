import 'react-vertical-timeline-component/style.min.css';

import { Link, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import { useState } from 'react';
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
  id: number;
  title: string;
  date: string;
  texts: string[];
  skills: string[];
};

export async function loader() {
  const { degree, certifications } = EDUCATION;
  return json({ degree, certifications });
}

export default function Skills() {
  const { formatMessage } = useIntl();
  const data = useLoaderData<typeof loader>();
  console.log(data);

  return (
    <div className={getClasses()}>
      <div className={getClasses('degree')}>
        <h2>
          <FormattedMessage id="DEGREE" />
        </h2>
      </div>
      <div className={getClasses('certification')}>
        <h2>
          <FormattedMessage id="CERTIFICATION" />
        </h2>
      </div>

      <h1>In progress...</h1>
    </div>
  );
}
