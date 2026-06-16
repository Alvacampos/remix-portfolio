import { v4 as uuid } from 'uuid';

import {
  AgileSoftware,
  Axios,
  Cloudflare,
  Css,
  Cypress,
  Django,
  Express,
  GitIcon,
  Graphql,
  Heroku,
  Highcharts,
  Html,
  Js,
  Mongodb,
  Nodejs,
  Playwright,
  Python,
  React,
  Redux,
  Remix,
  Sass,
  Storybook,
  Tailwind,
  Ts,
  VueJs,
} from '~/components/icons';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'carousel-component';
const getClasses = getClassMaker(BLOCK);

export default function Carousel() {
  const items = {
    html: <Html />,
    css: <Css />,
    tailwind: <Tailwind />,
    js: <Js />,
    ts: <Ts />,
    python: <Python />,
    django: <Django />,
    react: <React />,
    remix: <Remix />,

    redux: <Redux />,
    gitIcon: <GitIcon />,
    graphql: <Graphql />,
    cypress: <Cypress />,
    playwright: <Playwright />,
    storybook: <Storybook />,
    nodejs: <Nodejs />,
    axios: <Axios />,
    express: <Express />,
    mongodb: <Mongodb />,
    vueJs: <VueJs />,
    highcharts: <Highcharts />,
    agileSoftware: <AgileSoftware />,
    sass: <Sass />,
    heroku: <Heroku />,
    cloudflare: <Cloudflare />,
  };

  const keys = Object.keys(items);

  return (
    <div className={getClasses()}>
      {keys.map((key) => {
        const uuidKey = uuid();
        return (
          <div key={uuidKey} className={getClasses('item')}>
            {items[key as keyof typeof items]}
          </div>
        );
      })}
    </div>
  );
}
