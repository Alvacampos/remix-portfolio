import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { v4 as uuid } from 'uuid';
import { WORK_ITEMS } from '~/utils/data';

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params && params?.uuid;
  let data;
  if (id) {
    data = WORK_ITEMS.find((item) => item.id === +id);
  }

  if (data === undefined) throw new Error('Oh no! Something went wrong!');
  return json({
    data,
  });
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return <h1>There was a problem while loading this work experience</h1>;
}

export default function UuidIndex() {
  const { data } = useLoaderData<typeof loader>();
  console.log(data);
  const { title, projects } = data;

  const renderProjects = () => {
    if (Array.isArray(projects)) {
      return projects.map((project) => {
        const key = uuid();
        return (
          <div key={key}>
            <p>{project.title}</p>
            <p>{project.description}</p>
          </div>
        );
      });
    }
    return <p>{projects}</p>;
  };

  return (
    <div>
      <h1>{title}</h1>
      {renderProjects()}
      <p>Work in progress</p>
    </div>
  );
}
