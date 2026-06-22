import { Link, useLocation } from '@remix-run/react';
import { useIntl } from 'react-intl';

import { ConditionalLink } from '~/components/ConditionalWrapper';
import { Education, GithubIcon, Home, LinkedinIcon, Paper } from '~/components/icons';
import ThemeToggle from '~/components/ThemeToggle';
import { getClassMaker } from '~/utils/utils';

const BLOCK = 'navbar-component';
const getClasses = getClassMaker(BLOCK);

export default function NavBar() {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();

  // Match the current pathname to a nav entry's url to mark it active.
  // `/` is exact-match (otherwise it'd match every route); the others
  // use prefix-match so /skills/:uuid still highlights the CV button.
  const isActive = (url: string) => {
    if (url === './') return pathname === '/';
    const target = url.replace(/^\.\//, '/');
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  const GIT_LINK_ICON = {
    url: 'https://github.com/Alvacampos',
    label: 'Github',
    className: 'special-anchor',
    target: '_blank',
  };

  const LINKEDIN_LINK_ICON = {
    url: 'https://www.linkedin.com/in/gonzaloalvarezcampos/',
    label: 'Linkedin',
    className: 'special-anchor',
    target: '_blank',
  };

  const MAIN_NAV = [
    {
      url: './',
      label: formatMessage({ id: 'HOME' }),
      leftIcon: Home,
      prefetch: 'intent' as const,
    },
    {
      url: './skills',
      label: formatMessage({ id: 'CV' }),
      leftIcon: Paper,
      prefetch: 'intent' as const,
    },
    {
      url: './education',
      label: formatMessage({ id: 'EDUCATION' }),
      leftIcon: Education,
      prefetch: 'intent' as const,
    },
    // TODO: Uncomment when the contact page is ready
    // {
    //   url: './contact',
    //   label: formatMessage({ id: 'CONTACT' }),
    //   leftIcon: Inbox,
    // },
  ];

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
        <ConditionalLink
          to={GIT_LINK_ICON.url}
          condition={!!GIT_LINK_ICON.url}
          label={GIT_LINK_ICON.label}
          target={GIT_LINK_ICON.target}
        >
          <div className={getClasses('special-anchor-wrapper')}>
            <GithubIcon className={getClasses('special-anchor')} />
          </div>
        </ConditionalLink>
        <ConditionalLink
          to={LINKEDIN_LINK_ICON.url}
          condition={!!LINKEDIN_LINK_ICON.url}
          className={getClasses('linkedin-anchor')}
          label={LINKEDIN_LINK_ICON.label}
          target={LINKEDIN_LINK_ICON.target}
        >
          <div className={getClasses('special-anchor-wrapper')}>
            <LinkedinIcon className={getClasses('special-anchor')} />
          </div>
        </ConditionalLink>
      </div>
      <div className={getClasses('main-section')}>
        <div className={getClasses('main-buttons')}>
          <ul>
            {MAIN_NAV.map(({ url, label, leftIcon: Icon, prefetch }) => {
              const active = isActive(url);
              return (
                <li key={label}>
                  <Link
                    to={url}
                    prefetch={prefetch}
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
