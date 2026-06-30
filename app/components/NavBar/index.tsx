import { Link, useLocation } from '@remix-run/react';
import { useIntl } from 'react-intl';

import {
  Briefcase,
  Education,
  GithubIcon,
  Home,
  LinkedinIcon,
  Mail,
  Paper,
} from '~/components/icons';
import LocaleToggle from '~/components/LocaleToggle';
import ThemeToggle from '~/components/ThemeToggle';
import type { Locale } from '~/intl';
import { getClassMaker } from '~/utils/utils';

const BLOCK = 'navbar-component';
const getClasses = getClassMaker(BLOCK);

const GITHUB_URL = 'https://github.com/Alvacampos';
const LINKEDIN_URL = 'https://www.linkedin.com/in/gonzaloalvarezcampos/';

const MAIN_NAV = [
  { url: './', labelId: 'HOME', leftIcon: Home },
  { url: './skills', labelId: 'CV', leftIcon: Paper },
  { url: './projects', labelId: 'PROJECTS', leftIcon: Briefcase },
  { url: './education', labelId: 'EDUCATION', leftIcon: Education },
  { url: './contact', labelId: 'CONTACT', leftIcon: Mail },
] as const;

export default function NavBar() {
  const { formatMessage, locale } = useIntl();
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
        {/* Filename is suffix-versioned so re-crops / re-encodes can reach
         * existing visitors despite the year-long /assets/* immutable cache.
         * v3 is the WebP re-encode (was v2.jpeg, ~19 KB → ~9 KB). Bump the
         * suffix again on any future re-crop or re-encode. */}
        <img
          src="/assets/img/me.v3.webp"
          alt="Gonzalo Alvarez Campos"
          width={64}
          height={64}
          className={getClasses('avatar')}
        />
      </div>
      <div className={getClasses('utility-row')}>
        {/* Each utility-slot wrapper takes half the row width so the
         * ThemeToggle and LocaleToggle columns align with the GitHub
         * and LinkedIn columns below — even though the four items
         * have different intrinsic widths. The toggles inside keep
         * their natural size. */}
        <div className={getClasses('utility-slot')}>
          <ThemeToggle />
        </div>
        <div className={getClasses('utility-slot')}>
          <LocaleToggle current={locale as Locale} />
        </div>
      </div>
      <div className={getClasses('special-anchor-container')}>
        <div className={getClasses('utility-slot')}>
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
        </div>
        <div className={getClasses('utility-slot')}>
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
