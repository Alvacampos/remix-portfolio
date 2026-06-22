import { Link, useLocation } from '@remix-run/react';
import { useIntl } from 'react-intl';

import { Education, GithubIcon, Home, LinkedinIcon, Paper } from '~/components/icons';
import ThemeToggle from '~/components/ThemeToggle';
import { getClassMaker } from '~/utils/utils';

const BLOCK = 'navbar-component';
const getClasses = getClassMaker(BLOCK);

const GITHUB_URL = 'https://github.com/Alvacampos';
const LINKEDIN_URL = 'https://www.linkedin.com/in/gonzaloalvarezcampos/';

const MAIN_NAV = [
  { url: './', labelId: 'HOME', leftIcon: Home },
  { url: './skills', labelId: 'CV', leftIcon: Paper },
  { url: './education', labelId: 'EDUCATION', leftIcon: Education },
] as const;

export default function NavBar() {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();

  // `/` is exact-match (otherwise it'd match every route); the others
  // use prefix-match so /skills/:uuid still highlights the CV button.
  const isActive = (url: string) => {
    if (url === './') return pathname === '/';
    const target = url.replace(/^\.\//, '/');
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <nav className={getClasses()}>
      {/* Avatar — desktop only. Mobile bottom nav doesn't have the
       * vertical real estate, and the photo doesn't add functional
       * info (the Home page already shows it). */}
      <div className={getClasses('avatar-row')}>
        {/* Filename is intentionally `me.v2.jpeg`, not `me.jpeg`. The /assets/*
         * cache header is `max-age=31536000, immutable`, so when stage-37 fixed
         * the avatar's aspect ratio (192×256 → 256×256) it couldn't reach
         * existing visitors — Cloudflare and browsers held the old 192×256 file
         * for the year-long TTL. Renaming the URL forces a fresh fetch. Bump
         * the suffix again on any future re-crop. */}
        <img
          src="/assets/img/me.v2.jpeg"
          alt="Gonzalo Alvarez Campos"
          width={64}
          height={64}
          className={getClasses('avatar')}
        />
      </div>
      <div className={getClasses('utility-row')}>
        <ThemeToggle />
      </div>
      <div className={getClasses('special-anchor-container')}>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={formatMessage({ id: 'GITHUB_PROFILE' })}
        >
          <div className={getClasses('special-anchor-wrapper')}>
            <GithubIcon className={getClasses('special-anchor')} />
          </div>
        </a>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={getClasses('linkedin-anchor')}
          aria-label={formatMessage({ id: 'LINKEDIN_PROFILE' })}
        >
          <div className={getClasses('special-anchor-wrapper')}>
            <LinkedinIcon className={getClasses('special-anchor')} />
          </div>
        </a>
      </div>
      <div className={getClasses('main-section')}>
        <div className={getClasses('main-buttons')}>
          <ul>
            {MAIN_NAV.map(({ url, labelId, leftIcon: Icon }) => {
              const active = isActive(url);
              const label = formatMessage({ id: labelId });
              return (
                <li key={labelId}>
                  <Link
                    to={url}
                    prefetch="intent"
                    className={`${getClasses('nav-link')} ${active ? getClasses('nav-link', 'active') : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={getClasses('nav-link-icon')} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
