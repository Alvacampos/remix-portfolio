import { useIntl } from 'react-intl';
import LinkedInQR from '~/../public/assets/img/linkedin_dark.webp';
import Button, { links as ButtonLinks } from '~/components/Button';
import { ConditionalLink } from '~/components/ConditionalWrapper';
import { Education, GithubIcon, Home, Inbox, LinkedinIcon, Paper } from '~/components/icons';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [...ButtonLinks(), { rel: 'stylesheet', href: styles }];

const BLOCK = 'navbar-component';
const getClasses = getClassMaker(BLOCK);

export default function NavBar() {
  const { formatMessage } = useIntl();

  const GIT_LINK_ICON = {
    url: 'https://github.com/Alvacampos',
    label: 'Github',
    className: 'special-anchor',
    target: "_blank"
  };

  const LINKEDIN_LINK_ICON = {
    url: 'https://www.linkedin.com/in/gonzaloalvarezcampos/',
    label: 'Linkedin',
    className: 'special-anchor',
    target: "_blank"
  };

  const MAIN_NAV = [
    {
      url: './',
      label: formatMessage({ id: 'HOME' }),
      leftIcon: Home,
    },
    {
      url: './skills',
      label: formatMessage({ id: 'CV' }),
      leftIcon: Paper,
    },
    {
      url: './education',
      label: formatMessage({ id: 'EDUCATION' }),

      leftIcon: Education,
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
      <div className={getClasses('special-anchor-container')}>
        <ConditionalLink to={GIT_LINK_ICON.url} condition={!!GIT_LINK_ICON.url} label={GIT_LINK_ICON.label} target={GIT_LINK_ICON.target}>
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
            {MAIN_NAV.map((btn) => (
              <li key={btn.label}>
                <Button {...btn} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <img loading="lazy" src={LinkedInQR} alt="LinkedIn" className={getClasses('qr')} />
        </div>
      </div>
    </nav>
  );
}
