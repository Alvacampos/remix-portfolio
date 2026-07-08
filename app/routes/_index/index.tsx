import { FormattedMessage } from 'react-intl';
import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';

import DownloadButton from '~/components/DownloadBtn';
import { loadSkills } from '~/data/skills-schema';
import { pickLocale } from '~/intl';
import { mergeRouteMeta } from '~/utils/meta';
import { getClassMaker, getCvUrl } from '~/utils/utils';
import skillsJson from '~data/skills.json';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const SKILLS = loadSkills(skillsJson);
const CURRENT_COMPANY = 'Qubika';

export async function loader({ request }: LoaderFunctionArgs) {
  // Year count for the hero chip. Cloudflare freezes Date at
  // module-init (Spectre mitigation) so the math has to run here.
  // Floor the diff in years — the "+" in "7+ years" handles the rest.
  const firstStart = SKILLS.WORK_ITEMS[0].startDate; // 'YYYY-MM'
  const [startYear, startMonth] = firstStart.split('-').map(Number);
  const now = new Date();
  const yearsOfExp = Math.floor(
    now.getFullYear() - startYear + (now.getMonth() + 1 - startMonth) / 12
  );

  return {
    cvUrl: getCvUrl(pickLocale(request)),
    yearsOfExp,
  };
}

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Gonzalo Alvarez Campos — Senior Frontend / Full-stack Engineer',
    description:
      'Senior Frontend / Full-stack Engineer with 7+ years across React, TypeScript, Remix, Next.js, Python and Django. Download my CV.',
  });

const BLOCK = 'home-route';
const getClasses = getClassMaker(BLOCK);

export default function Index() {
  const { cvUrl, yearsOfExp } = useLoaderData<typeof loader>();
  return (
    <div className={getClasses()}>
      <div className={getClasses('hero')}>
        <h1 className={getClasses('hero-greeting')}>
          <FormattedMessage id="WELCOME_MY_NAME_IS" />
        </h1>
        <p className={getClasses('hero-role')}>
          <FormattedMessage id="HOME_ROLE" />
        </p>
        <p className={getClasses('hero-tagline')}>
          <FormattedMessage id="HOME_TAGLINE" />
        </p>

        <div className={getClasses('hero-chips')}>
          <span className={getClasses('hero-chip')}>
            <FormattedMessage id="HOME_YEARS_OF_EXP" values={{ years: yearsOfExp }} />
          </span>
          <span className={getClasses('hero-status-badge')}>
            <span className={getClasses('hero-status-dot')} aria-hidden="true" />
            <FormattedMessage id="HOME_CURRENTLY_AT" values={{ company: CURRENT_COMPANY }} />
          </span>
        </div>

        <div className={getClasses('hero-ctas')}>
          <DownloadButton fileUrl={cvUrl} fileName="Gonzalo_Alvarez_CV.pdf">
            <FormattedMessage id="DOWNLOAD_CV" />
          </DownloadButton>
          <Link to="/skills" className={getClasses('hero-secondary-cta')}>
            <FormattedMessage id="HOME_VIEW_SKILLS" />
            <span aria-hidden="true" className={getClasses('hero-secondary-cta-arrow')}>
              →
            </span>
          </Link>
        </div>
      </div>

      <p className={getClasses('repo-url')}>
        <FormattedMessage id="CHECK_THIS_PROJECT_REPO" />
        <span className={getClasses('repo-link')}>
          <a
            href="https://github.com/Alvacampos/remix-portfolio"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage id="REPO_GITHUB" />
          </a>
        </span>
      </p>
    </div>
  );
}
