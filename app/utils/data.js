const SECTION_TITLES = [
  'Work Experience',
  'Total years of experience',
  'Skills & Tools',
  'Years of experience',
  'Extra Activities',
];

const WORK_ITEMS = [
  {
    id: 1,
    title: 'Globant',
    startDate: '2018-08-01T00:00:00.000',
    endDate: '2020-12-01T00:00:00.000',
    subtitle: 'Jr Web developer.',
    skills: [
      'HTML',
      'CSS',
      'Storybook',
      'Highcharts',
      'Vue',
      '.Net',
      'Agile',
      'Front End',
      'Back End',
    ],
    projects: [
      {
        title: 'Project: eVestment',
        description:
          'Worked on analytics web development using Vue.js, Vuex, Vue Router, and Highcharts. Also gained exposure to .NET Core and Node.js for backend tasks.',
      },
      {
        title: 'Project: Smile Direct Club',
        description:
          'Developed web applications for Smile Direct Club using Vue.js, Nuxt.js, and JavaScript, prioritizing performance optimization through Nuxt server-side rendering. Utilized Vue-axios, Bootstrap-Vue, and ECMA 6+.',
      },
    ],
  },
  {
    id: 2,
    title: 'Cliengo',
    startDate: '2020-12-01T00:00:00.000',
    endDate: '2021-08-01T00:00:00.000',
    subtitle: 'Mid Level Full-stack developer.',
    skills: [
      'HTML',
      'CSS',
      'Storybook',
      'Highcharts',
      'React',
      'Front End',
      'Cypress',
      'Agile',
    ],
    projects: [
      {
        title: 'Project: Conversational',
        description:
          'Conversational App. Web development using ReactJs, also working with mobile apps using React Native. Tech migrations from angular to react. Use of Axios, Bootstrap, ECMA 6+.',
      },
      {
        title: 'Project: Live/Lit',
        description:
          'Developed a CRM application and conversation handler using JavaScript, React, CSS, Router, Redux, and Axios. Implemented unit testing with Jest.js and deployed the application using AWS/Heroku. ',
      },
    ],
  },
  {
    id: 3,
    title: 'Professor (part-time)',
    startDate: '2021-06-01T00:00:00.000',
    endDate: '2022-03-01T00:00:00.000',
    skills: ['Teaching', 'C', 'Programming'],
    subtitle: 'Software Engineering Professor.',
    projects: 'Teaching programming in a university to first year students.',
  },
  {
    id: 4,
    title: 'Endava',
    startDate: '2021-08-01T00:00:00.000',
    endDate: '2022-04-01T00:00:00.000',
    subtitle: 'Senior Full-stack developer.',
    skills: [
      'HTML',
      'CSS',
      'JavaScript',
      'SQL',
      'Marklogic',
      'Teaching',
      'Leadership',
      'Interviewing',
      'Back End',
      'Agile',
    ],
    projects: [
      {
        title: 'Project: Marklogic',
        description:
          'Lead developer and technical consultant for MarkLogic projects, specializing in semantics database implementation for Yale University. Utilized JavaScript and JSON-LD technologies to develop robust solutions.',
      },
      {
        title: 'Endava Argentina Intership',
        description:
          'Organized and mentored the Endava Argentina Internship program. Responsible for delivering lectures on JavaScript and general programming topics.',
      },
    ],
  },
  {
    id: 6,
    title: 'Teacher (part-time)',
    startDate: '2022-03-01T00:00:00.000',
    endDate: '2023-03-01T00:00:00.000',
    skills: ['Teaching', 'JavaScript', 'Programming'],
    subtitle: 'Javascript course Teacher.',
    projects: 'Teaching vanilla JavaScript fundamentals over the weekend.',
  },
  {
    id: 6,
    title: 'Qubika',
    startDate: '2022-04-01T00:00:00',
    subtitle: 'Senior Frontend developer.',
    isCurrent: true,
    skills: [
      'HTML',
      'CSS',
      'JavaScript',
      'TypeScript',
      'Storybook',
      'Highcharts',
      'React',
      'Remix',
      'Post-css',
      'GraphQL',
      'Cypress',
      'Playwright',
      'Front End',
      'Agile',
    ],
    projects: [
      {
        title: 'Project Avant',
        description:
          'Full-stack project for Avant, a US loan company. Utilizes React with Remix.run and PostCSS for responsiveness. Implements Cypress and Playwright for testing. Currently transitioning from JavaScript to TypeScript.',
      },
      {
        title: 'Project Customer Dashboard',
        description:
          'Assisting with maintenance and updates for the legacy dashboard, utilizing TypeScript, React class components, and GraphQL technology stack.',
      },
    ],
  },
];

const SKILLS_IMG = [
  {
    src: '../assets/icons/html.svg',
    alt: 'HTML Logo',
    title: 'HTML',
  },
  {
    src: '../assets/icons/css.svg',
    alt: 'CSS Logo',
    title: 'CSS',
  },
  {
    src: '../assets/icons/tailwind.svg',
    alt: 'Tailwind Logo',
    title: 'Tailwind',
  },
  {
    src: '../assets/icons/js.svg',
    alt: 'JavaScript Logo',
    title: 'JavaScript',
  },
  {
    src: '../assets/icons/ts.svg',
    alt: 'TypeScript Logo',
    title: 'TypeScript',
  },
  {
    src: '../assets/icons/react.svg',
    alt: 'React Logo',
    title: 'React',
  },
  {
    src: '../assets/icons/remix.svg',
    alt: 'Remix.run Logo',
    title: 'Remix.run',
  },
  {
    src: '../assets/icons/redux.svg',
    alt: 'Redux Logo',
    title: 'Redux',
  },
  {
    src: '../assets/icons/git-icon.svg',
    alt: 'Git Logo',
    title: 'Git',
  },
  {
    src: '../assets/icons/graphql.svg',
    alt: 'GraphQL Logo',
    title: 'GraphQL',
  },
  {
    src: '../assets/icons/cypress.svg',
    alt: 'Cypress Logo',
    title: 'Cypress',
  },
  {
    src: '../assets/icons/playwright.svg',
    alt: 'Playwright Logo',
    title: 'Playwright',
  },
  {
    src: '../assets/icons/storybook.svg',
    alt: 'Storybook Logo',
    title: 'Storybook',
  },
  {
    src: '../assets/icons/nodejs.svg',
    alt: 'Nodejs Logo',
    title: 'NodeJs',
  },
  {
    src: '../assets/icons/axios.svg',
    alt: 'Axios Logo',
    title: 'Axios',
  },
  {
    src: '../assets/icons/express.svg',
    alt: 'Express Logo',
    title: 'Express',
  },
  {
    src: '../assets/icons/mongodb.svg',
    alt: 'Mongodb Logo',
    title: 'Mongodb',
  },
  {
    src: '../assets/icons/vue-js.svg',
    alt: 'Vue Logo',
    title: 'Vue',
  },
  {
    src: '../assets/icons/highcharts.svg',
    alt: 'Highcharts Logo',
    title: 'Highcharts',
  },
  {
    src: '../assets/icons/agile-software.svg',
    alt: 'Agile Logo',
    title: 'Agile Development',
  },
  {
    src: '../assets/icons/sass.svg',
    alt: 'Sass Logo',
    title: 'Sass',
  },
  {
    src: '../assets/icons/heroku.svg',
    alt: 'Heroku Logo',
    title: 'Heroku',
  },
];

const TOP_SKILLS = ['Front End', 'Back End'];

const ENDAVA_EXTRA = [
  {
    title: 'Endava Argentina Internship',
    text: 'Organizer and mentor for Endava Argentina Internship Program 2022. In charge of lectures related to JS and general programming.',
  },
  {
    title: 'Mentorship',
    text: 'Mentor for 3 Jr developers in the company. In charge of guiding them in their career path and helping them with their technical issues.',
  },
];

const ENDAVA_EXTRA_IMG = {
  src: '../assets/img/endava.png',
  className: 'skills__work--icon',
  id: 'endava',
  alt: 'Endava Logo',
};

const UNSTA_EXTRA = [
  {
    title: 'Technical Leader',
    text: 'Technical Leader of the project for the career of Software Engineering. In charge of the development of the project and the team.',
  },
  {
    title: 'Professor',
    text: 'Teaching programming to first year students Engineering Career.',
  },
];

const UNSTA_EXTRA_IMG = {
  src: '../assets/img/unsta.png',
  className: 'skills__work--icon',
  alt: 'UNSTA Logo',
};

const QUBIKA_EXTRA = [
  {
    title: 'Remix Introduction Talk',
    text: 'Organize and gave a talk about Remix.run a react server side rendering framework that was just released and my project was working with.',
  },
  {
    title: 'Team Induction',
    text: 'Induction of new team members to the project.',
  },
];

const QUBIKA_EXTRA_IMG = {
  src: '../assets/img/qubika.png',
  className: 'skills__work--icon',
  id: 'qubika',
  alt: 'Qubika Logo',
};

const NAV_BAR = [
  {
    path: '../index.html',
    name: 'Home',
    src: '../assets/icons/home.svg',
    className: ['nav-bar__icon'],
    alt: 'Home Logo',
    title: 'Home',
    tabindex: '-1',
    location: 'Home',
  },
  {
    path: './views/skills.html',
    name: 'CV',
    src: '../assets/icons/paper.svg',
    className: ['nav-bar__icon'],
    alt: 'CV Logo',
    title: 'CV',
    tabindex: '-1',
    location: 'CV',
  },
  {
    path: './views/education.html',
    name: 'Education',
    src: '../assets/icons/education.svg',
    className: ['nav-bar__icon'],
    alt: 'Education Logo',
    title: 'Education',
    tabindex: '-1',
    location: 'Education',
  },
];

const SKILL_CHART_DATA = [
  {
    name: 'JavaScript',
    startDate: '20180801',
  },
  {
    name: 'TypeScript',
    startDate: '20220401',
  },
  {
    name: 'ReactJs',
    startDate: '20201201',
  },
  {
    name: 'Cypress',
    startDate: '20201201',
  },
  {
    name: 'GraphQL',
    startDate: '20220401',
  },
  {
    name: 'Storybook',
    startDate: '20180801',
  },
  {
    name: 'Remix',
    startDate: '20220401',
  },
  {
    name: 'Css',
    startDate: '20180801',
  },
  {
    name: 'PostCss',
    startDate: '20220401',
  },
  {
    name: 'HTML',
    startDate: '20180801',
  },
  {
    name: 'Playwright',
    startDate: '20240101',
  },
  {
    name: 'NodeJs',
    startDate: '20230101',
  },
  {
    name: 'ExpressJs',
    startDate: '20230101',
  },
  {
    name: 'Git',
    startDate: '20180801',
  },
  {
    name: 'Agile',
    startDate: '20180801',
  },
];

const INTRO = [
  'Welcome, my name is Gonzalo Alvarez Campos.',
  "I'm a Software Developer and I made this page so you can get to know me a little better",
];

export {
  ENDAVA_EXTRA,
  ENDAVA_EXTRA_IMG,
  INTRO,
  NAV_BAR,
  QUBIKA_EXTRA,
  QUBIKA_EXTRA_IMG,
  SECTION_TITLES,
  SKILL_CHART_DATA,
  SKILLS_IMG,
  TOP_SKILLS,
  UNSTA_EXTRA,
  UNSTA_EXTRA_IMG,
  WORK_ITEMS,
};
