import { useIntl } from 'react-intl';

import LinkedInQR from '~/assets/img/linkedin_dark.png';
import Button, { links as ButtonLinks } from '~/components/Button';
import { ConditionalLink } from '~/components/ConditionalWrapper';
import {
  Education,
  GithubIcon,
  Home,
  LinkedinIcon,
  Paper,
} from '~/components/icons';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [
  ...ButtonLinks(),
  { rel: 'stylesheet', href: styles },
];

const BLOCK = 'navbar-component';
const getClasses = getClassMaker(BLOCK);

export default function NavBar() {
  const { formatMessage } = useIntl();

  const GIT_LINK_ICON = {
    url: 'https://github.com/Alvacampos',
    className: 'special-anchor',
  };

  const LINKEDIN_LINK_ICON = {
    url: 'https://www.linkedin.com/in/gonzaloalvarezcampos/',
    className: 'special-anchor',
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
  ];

  return (
    <nav className={getClasses()}>
      <div className={getClasses('special-anchor-container')}>
        <ConditionalLink to={GIT_LINK_ICON.url} condition={!!GIT_LINK_ICON.url}>
          <div className={getClasses('special-anchor-wrapper')}>
            <GithubIcon className={getClasses('special-anchor')} />
          </div>
        </ConditionalLink>
        <ConditionalLink
          to={LINKEDIN_LINK_ICON.url}
          condition={!!LINKEDIN_LINK_ICON.url}
          className={getClasses('linkedin-anchor')}
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
          <img src={LinkedInQR} alt="LinkedIn" className={getClasses('qr')} />
        </div>
      </div>
    </nav>
  );
}
