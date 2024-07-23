import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { WORK_ITEMS } from '~/utils/data';
import Card, { links as cardLinks } from '~/components/Card';
import { getClassMaker, formatDate } from '~/utils/utils';
import globant from '~/assets/img/globant.png';

import styles from './style.css?url';
import { eachWeekOfInterval } from 'date-fns';
import { useEffect } from 'react';

export const links = () => [...cardLinks(), { rel: 'stylesheet', href: styles }];

const BLOCK = 'skills-id-route';
const getClasses = getClassMaker(BLOCK);

type DataTypes =
  | {
      id: number;
      title: string;
      projects:
        | {
            title: string;
            text: string;
          }[]
        | string;
      rol: string;
      description?: string;
      skills: string[];
      endDate?: string;
      startDate: string;
    }
  | undefined;

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params && params?.uuid;
  let data: DataTypes;
  let imagePath: string | undefined;
  if (id) {
    data = WORK_ITEMS.find((item) => item.id === +id);
    if (data?.title.includes('Professor') && id === '3') {
      imagePath = data && '/assets/img/unsta2.jpg';
    } else if (data?.title.includes('Teacher') && id === '6') {
      imagePath = data && '/assets/img/coderhouse.png';
    } else {
      imagePath = data && `/assets/img/${data.title.toLowerCase()}.png`;
    }
  }

  if (data === undefined) throw new Error('Oh no! Something went wrong!');
  return json({
    data,
    imagePath,
  });
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return <h1>There was a problem while loading this work experience</h1>;
}

export default function UuidIndex() {
  const { data, imagePath } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const { title, projects, startDate, skills } = data;

  const renderDates = () => {
    return (
      <div>
        <p>
          <FormattedMessage id="START_DATE" />: {formatDate(startDate, '')}
        </p>
        {data?.endDate && (
          <p>
            <FormattedMessage id="END_DATE" />: {formatDate(data.endDate, '')}
          </p>
        )}
        {!data?.endDate && (
          <p>
            <FormattedMessage id="END_DATE" />: Present
          </p>
        )}
      </div>
    );
  };

  const renderJobDescription = () => {
    return (
      <div>
        <p>{data.rol}</p>
        <p>{data.description}</p>
      </div>
    );
  };

  return (
    <div className={getClasses()}>
      <h1 className={getClasses('title')}>{title}</h1>
      <div className={getClasses('main-container')}>
        <div className={getClasses('img-container')}>
          <img src={imagePath} alt={title} className={getClasses('company-logo')} />
        </div>
        <div className={getClasses('info-container')}>
          <Card title={formatMessage({ id: 'HIRE_DATES' })} children={renderDates()} />
          <Card
            title={formatMessage({ id: 'ROLL_JOB_DESCRIPTION' })}
            children={renderJobDescription()}
          />
        </div>
      </div>
      <div className={getClasses('projects')}>
        {Array.isArray(projects) ? (
          <Card title={formatMessage({ id: 'PROJECTS' })} itemList={projects} />
        ) : (
          <Card title={formatMessage({ id: 'PROJECTS' })} texts={[projects]} />
        )}
      </div>
      {skills && (
        <div className={getClasses('skills')}>
          <Card title={formatMessage({ id: 'SKILLS' })} texts={skills} />
        </div>
      )}
    </div>
  );
}
