import { FormattedMessage } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'home-route';
const getClasses = getClassMaker(BLOCK);

export default function Index() {
  return (
    <div className={getClasses()}>
      <h1>
        <FormattedMessage id="WELCOME_MY_NAME_IS" />
      </h1>
      <p>
        <FormattedMessage id="I_AM_A_SOFTWARE_ENGINEER" />
      </p>
      <p>
        <FormattedMessage id="DISCLAIMER" />
      </p>
      <p className={getClasses('repo-url')}>
        <FormattedMessage id="CHECK_THIS_PROJECT_REPO" />
        <span>
          <a href="https://github.com/Alvacampos/remix-portfolio" target="_blank" rel="noopener noreferrer">
            <FormattedMessage id="REPO_GITHUB" />
          </a>
        </span>
      </p>
    </div>
  );
}
