import type { ReactElement } from 'react';

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

// Static module-level list — keys are the technology names so React can use
// content-stable keys without paying for uuid generation on every render.
const ICONS: { name: string; Icon: () => ReactElement }[] = [
  { name: 'html', Icon: Html },
  { name: 'css', Icon: Css },
  { name: 'tailwind', Icon: Tailwind },
  { name: 'js', Icon: Js },
  { name: 'ts', Icon: Ts },
  { name: 'python', Icon: Python },
  { name: 'django', Icon: Django },
  { name: 'react', Icon: React },
  { name: 'remix', Icon: Remix },
  { name: 'redux', Icon: Redux },
  { name: 'git', Icon: GitIcon },
  { name: 'graphql', Icon: Graphql },
  { name: 'cypress', Icon: Cypress },
  { name: 'playwright', Icon: Playwright },
  { name: 'storybook', Icon: Storybook },
  { name: 'nodejs', Icon: Nodejs },
  { name: 'axios', Icon: Axios },
  { name: 'express', Icon: Express },
  { name: 'mongodb', Icon: Mongodb },
  { name: 'vue', Icon: VueJs },
  { name: 'highcharts', Icon: Highcharts },
  { name: 'agile', Icon: AgileSoftware },
  { name: 'sass', Icon: Sass },
  { name: 'heroku', Icon: Heroku },
  { name: 'cloudflare', Icon: Cloudflare },
];

export default function Carousel() {
  return (
    <div className={getClasses()}>
      {ICONS.map(({ name, Icon }) => (
        <div key={name} className={getClasses('item')}>
          <Icon />
        </div>
      ))}
    </div>
  );
}
