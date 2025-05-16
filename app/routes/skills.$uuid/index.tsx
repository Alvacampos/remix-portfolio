import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';
import Card, { links as cardLinks } from '~/components/Card';
import { getClassMaker, formatDate } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [...cardLinks(), { rel: 'stylesheet', href: styles }];

const BLOCK = 'skills-id-route';
const getClasses = getClassMaker(BLOCK);

type skillsDataTypes = {
  WORK_ITEMS: {
    id: string | number;
    title: string;
    startDate: string;
    endDate: string;
    rol: string;
    skills: string[];
    projects?: {
      title: string;
      text: string;
    }[] | string;
    description: string;
  }[];
} | undefined;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const id = params && params?.uuid;
  const url = new URL('/data/skills.json', request.url);
  
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch skills.json');
    }
  
  const skillsData: skillsDataTypes = await response.json();
  let data;
  let imagePath: string | undefined;

  if (id) {
    data = skillsData?.WORK_ITEMS.find((item) => item.id === +id);
    if (data?.title.includes('Professor') && id === '3') {
      imagePath = data && '/assets/img/unsta2.webp';
    } else if (data?.title.includes('Teacher') && id === '6') {
      imagePath = data && '/assets/img/coderhouse.webp';
    } else {
      imagePath = data && `/assets/img/${data.title.toLowerCase()}.webp`;
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
  return <h1 className={getClasses('error')}>There was a problem while loading this work experience</h1>;
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
          <img loading="lazy" src={imagePath} alt={title} className={getClasses('company-logo')} />
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
          <Card title={formatMessage({ id: 'PROJECTS' })} texts={projects ? [projects] : []} />
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
