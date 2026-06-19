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
  Nextjs,
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
//
// Order: current-stack first (what I'm using day-to-day), then web
// fundamentals, then tooling/test infra, then less-current/legacy. Tweak
// when the daily stack shifts; the carousel auto-scrolls so first
// items are seen most.
const ICONS: { name: string; Icon: () => ReactElement }[] = [
  // Current stack
  { name: 'react', Icon: React },
  { name: 'ts', Icon: Ts },
  { name: 'nextjs', Icon: Nextjs },
  { name: 'nodejs', Icon: Nodejs },
  { name: 'python', Icon: Python },
  { name: 'django', Icon: Django },
  { name: 'graphql', Icon: Graphql },
  { name: 'cloudflare', Icon: Cloudflare },
  { name: 'remix', Icon: Remix },
  // Web fundamentals
  { name: 'html', Icon: Html },
  { name: 'css', Icon: Css },
  { name: 'js', Icon: Js },
  { name: 'tailwind', Icon: Tailwind },
  { name: 'sass', Icon: Sass },
  // Tooling / testing / infra
  { name: 'storybook', Icon: Storybook },
  { name: 'playwright', Icon: Playwright },
  { name: 'cypress', Icon: Cypress },
  { name: 'git', Icon: GitIcon },
  { name: 'agile', Icon: AgileSoftware },
  // Less current / legacy
  { name: 'redux', Icon: Redux },
  { name: 'express', Icon: Express },
  { name: 'mongodb', Icon: Mongodb },
  { name: 'axios', Icon: Axios },
  { name: 'vue', Icon: VueJs },
  { name: 'highcharts', Icon: Highcharts },
  { name: 'heroku', Icon: Heroku },
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
