const INTRO = [
  'Welcome, my name is Gonzalo Alvarez Campos.',
  "I'm a Software Developer and I made this page so you can get to know me a little better",
];

const WORK_ITEMS = [
  {
    id: 1,
    title: 'Globant',
    startDate: '2018-08-01T00:00:00.000',
    endDate: '2020-12-01T00:00:00.000',
    rol: 'Jr Web developer.',
    description:
      'Worked as a software developer in the analytics team, developing web applications using Vue.js, Vuex, Vue Router, and Highcharts. Also gained exposure to .NET Core and Node.js for backend tasks.',
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
      'Axios',
    ],
    projects: [
      {
        title: 'Project: eVestment',
        text: 'Worked on analytics web development using Vue.js, Vuex, Vue Router, and Highcharts. Also gained exposure to .NET Core and Node.js for backend tasks.',
      },
      {
        title: 'Project: Smile Direct Club',
        text: 'Developed web applications for Smile Direct Club using Vue.js, Nuxt.js, and JavaScript, prioritizing performance optimization through Nuxt server-side rendering. Utilized Vue-axios, Bootstrap-Vue, and ECMA 6+.',
      },
    ],
  },
  {
    id: 2,
    title: 'Cliengo',
    startDate: '2020-12-01T00:00:00.000',
    endDate: '2021-08-01T00:00:00.000',
    rol: 'Mid Level Full-stack developer.',
    description:
      'Developed a CRM application and conversation handler using JavaScript, React, CSS, Router, Redux, and Axios. Implemented unit testing with Jest.js and deployed the application using AWS/Heroku.',
    skills: [
      'HTML',
      'CSS',
      'Sass',
      'Storybook',
      'Highcharts',
      'React',
      'Router',
      'Front End',
      'Cypress',
      'Heroku',
      'Agile',
      'Back End',
      'Express',
      'Axios',
    ],
    projects: [
      {
        title: 'Project: Conversational',
        text: 'Conversational App. Web development using ReactJs, also working with mobile apps using React Native. Tech migrations from angular to react. Use of Axios, Bootstrap, ECMA 6+.',
      },
      {
        title: 'Project: Live/Lit',
        text: 'Developed a CRM application and conversation handler using JavaScript, React, CSS, Router, Redux, and Axios. Implemented unit testing with Jest.js and deployed the application using AWS/Heroku. ',
      },
    ],
  },
  {
    id: 3,
    title: 'Professor (part-time)',
    startDate: '2021-06-01T00:00:00.000',
    endDate: '2022-03-01T00:00:00.000',
    skills: ['Teaching', 'C', 'Programming', 'Mentoring'],
    rol: 'Software Engineering Professor.',
    projects: 'Teaching programming in a university to first year students.',
  },
  {
    id: 4,
    title: 'Endava',
    startDate: '2021-08-01T00:00:00.000',
    endDate: '2022-04-01T00:00:00.000',
    rol: 'Senior Full-stack developer.',
    description:
      'Lead developer and technical consultant for MarkLogic projects, my main tasks focused on integrating Yale University’s data into a MarkLogic database as well as team coordination and leadership. I also organized and mentored the Endava Argentina Internship program.',
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
        text: 'Lead developer and technical consultant for MarkLogic projects, specializing in semantics database implementation for Yale University. Utilized JavaScript and JSON-LD technologies to develop robust solutions.',
      },
      {
        title: 'Endava Argentina Intership',
        text: 'Organized and mentored the Endava Argentina Internship program. Responsible for delivering lectures on JavaScript and general programming topics.',
      },
    ],
  },
  {
    id: 6,
    title: 'Teacher (part-time)',
    startDate: '2022-03-01T00:00:00.000',
    endDate: '2023-03-01T00:00:00.000',
    skills: ['Teaching', 'JavaScript', 'Programming'],
    rol: 'Javascript course Teacher.',
    projects: 'Teaching vanilla JavaScript fundamentals over the weekend.',
  },
  {
    id: 7,
    title: 'Qubika',
    startDate: '2022-04-01T00:00:00',
    rol: 'Senior Frontend developer.',
    description:
      'Fully integrated as a client developer, my day to day tasks where to develop and maintain the client’s application and assist other developers with their tasks.',
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
      'Cloudflare',
    ],
    projects: [
      {
        title: 'Project Avant',
        text: 'Full-stack project for Avant, a US loan company. Utilizes React with Remix.run and PostCSS for responsiveness. Implements Cypress and Playwright for testing. Currently transitioning from JavaScript to TypeScript.',
      },
      {
        title: 'Project Customer Dashboard',
        text: 'Assisting with maintenance and updates for the legacy dashboard, utilizing TypeScript, React class components, and GraphQL technology stack.',
      },
    ],
  },
];

const SKILLS_IMG = [
  {
    title: 'HTML',
  },
  {
    title: 'CSS',
  },
  {
    title: 'Tailwind',
  },
  {
    title: 'JavaScript',
  },
  {
    title: 'TypeScript',
  },
  {
    title: 'React',
  },
  {
    title: 'Remix.run',
  },
  {
    title: 'Redux',
  },
  {
    title: 'Git',
  },
  {
    title: 'GraphQL',
  },
  {
    title: 'Cypress',
  },
  {
    title: 'Playwright',
  },
  {
    title: 'Storybook',
  },
  {
    title: 'NodeJs',
  },
  {
    title: 'Axios',
  },
  {
    title: 'Express',
  },
  {
    title: 'Mongodb',
  },
  {
    title: 'Vue',
  },
  {
    title: 'Highcharts',
  },
  {
    title: 'Agile Development',
  },
  {
    title: 'Sass',
  },
  {
    title: 'Heroku',
  },
];

const TOP_SKILLS = ['Front End', 'Back End'];

const EXTRA_ACTIVITIES = [
  {
    title: 'Endava',
    data: [
      {
        title: 'Endava Argentina Internship',
        text: 'Organizer and mentor for Endava Argentina Internship Program 2022. In charge of lectures related to JS and general programming.',
      },
      {
        title: 'Mentorship',
        text: 'Mentor for 3 Jr developers in the company. In charge of guiding them in their career path and helping them with their technical issues.',
      },
    ],
  },
  {
    title: 'University',
    data: [
      {
        title: 'Technical Leader',
        text: 'Technical Leader of the project for the career of Software Engineering. In charge of the development of the project and the team.',
      },
      {
        title: 'Career coaching',
        text: 'Help students with their career path and guide them in their technical issues.',
      },
    ],
  },
  {
    title: 'Qubika',
    data: [
      {
        title: 'Remix Introduction Talk',
        text: 'Organize and gave a talk about Remix.run a react server side rendering framework that was just released and my project was working with.',
      },
      {
        title: 'Team Induction',
        text: 'Induction of new team members to the project.',
      },
      {
        title: 'Dev Lead Loan Team',
        text: 'Dev Lead of the Loan Team, in charge of the coordinating effort and unblocking the team on front end topics.',
      },
    ],
  },
];

const SKILL_CHART_DATA = [
  {
    name: 'JavaScript',
    startDate: '2018-08-01T00:00:00.000',
  },
  {
    name: 'TypeScript',
    startDate: '2022-04-01T00:00:00.000',
  },
  {
    name: 'ReactJs',
    startDate: '2020-12-01T00:00:00.000',
  },
  {
    name: 'Cypress',
    startDate: '2020-12-01T00:00:00.000',
  },
  {
    name: 'GraphQL',
    startDate: '2022-04-01T00:00:00.000',
  },
  {
    name: 'Storybook',
    startDate: '2018-08-01T00:00:00.000',
  },
  {
    name: 'Remix',
    startDate: '2022-04-01T00:00:00.000',
  },
  {
    name: 'Css',
    startDate: '2018-08-01T00:00:00.000',
  },
  {
    name: 'PostCss',
    startDate: '2022-04-01T00:00:00.000',
  },
  {
    name: 'HTML',
    startDate: '2018-08-01T00:00:00.000',
  },
  {
    name: 'Playwright',
    startDate: '2024-04-01T00:00:00.000',
  },
  {
    name: 'NodeJs',
    startDate: '2023-01-01T00:00:00.000',
  },
  {
    name: 'ExpressJs',
    startDate: '2023-08-01T00:00:00.000',
  },
  {
    name: 'Git',
    startDate: '2018-08-01T00:00:00.000',
  },
  {
    name: 'Agile',
    startDate: '2018-08-01T00:00:00.000',
  },
];

const EDUCATION = {
  degree: [
    {
      title: 'Software Development and Quality Control Technician',
      startDate: '2019-03-01T00:00:00.000',
      endDate: '2021-09-01T00:00:00.000',
      institution: 'Universidad del Norte Santo Tomas de Aquino',
      description:
        'Software Engineering degree with a focus on web development and software architecture.',
    },
  ],
  certifications: [
    {
      title: 'English Certification',
      startDate: '2007-03-01T00:00:00.000',
      institution: 'University of Cambridge',
      description: 'Level 1 Certificate in English (ESOL), First Certificate in English',
    },
    {
      title: 'English Certification',
      startDate: '2022-04-01T00:00:00.000',
      institution: 'EF SET English',
      description: 'Certificate 74/100 (C2 Proficient)',
      url: 'https://cert.efset.org/Vob85P',
    },
    {
      title: 'Certification',
      startDate: '2021-02-01T00:00:00.000',
      institution: 'JavaScript: Understanding the Weird Parts',
      description: 'Credential ID: UC-c532815e-d057-4b92-81fe-abc4762f714c',
      url: 'https://www.udemy.com/certificate/UC-c532815e-d057-4b92-81fe-abc4762f714c/',
    },
    {
      title: 'Certification',
      startDate: '2018-08-01T00:00:00.000',
      institution: 'The Complete Web Developer in 2018: Zero to Mastery',
      description: 'Credential ID: UC-FL354HLN',
      url: 'https://www.udemy.com/certificate/UC-FL354HLN/',
    },
    {
      title: 'Certification',
      startDate: '2018-08-01T00:00:00.000',
      institution: 'The Modern JavaScript Bootcamp',
      description: 'Credential ID: UC-HUFMTDC3',
      url: 'https://www.udemy.com/certificate/UC-HUFMTDC3/',
    },
    {
      title: 'Certification',
      startDate: '2018-08-01T00:00:00.000',
      institution: 'The Complete JavaScript Course 2023: From Zero to Expert!',
      description: 'Credential ID: UC-MBOB6U0K',
      url: 'https://www.udemy.com/certificate/UC-MBOB6U0K/',
    },
  ],
};

export { INTRO, SKILL_CHART_DATA, SKILLS_IMG, TOP_SKILLS, WORK_ITEMS, EXTRA_ACTIVITIES, EDUCATION };
