# Remix Portfolio

Welcome to my personal portfolio project! This is an ongoing project built with [Remix](https://remix.run/) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/). The goal of this project is to showcase my skills, experience, and education in a visually appealing and interactive way. While the current focus is on the frontend, the backend will eventually be developed using Python and Django. Additionally, a contact form will be added in the future to make it easier for visitors to reach out.

The project has been deployed and is hosted in this url https://gonzalo-alvarez-campos-cv.com/

Although the project is currently built with Remix, a migration to [React Router](https://reactrouter.com/) or [Next.js](https://nextjs.org/) is a possibility in the future, but it is not planned for the near term.

---

## Getting Started

### Prerequisites
To run this project locally, you will need:
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Wrangler CLI** (for Cloudflare Pages)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/Alvacampos/remix-portfolio.git
   cd remix-portfolio
   ```
2. Install dependencies:
    ```sh
    npm install
    ```
3. Run the development server:
    ```sh
    npm run dev
    ```

### Useful Scripts
Here’s a quick summary of the most useful scripts in the package.json file:
1. `build:svg`: This script uses svgo (SVG Optimizer) to optimize all SVG files in the icons directory. Run this script whenever you add or update SVG files in the icons directory to ensure they are optimized for performance.
2. `build:icons`: This script uses @svgr/cli to convert SVG files in the icons directory into React components. Run this script whenever you add or update SVG files and need them converted into React components for use in your project.

## Future Plans
This project is a work in progress, and here are some planned features and improvements:

Backend Development: The backend will be built using Python and Django to handle dynamic content and data.
Contact Form: A contact form will be added to make it easier for visitors to reach out.
Potential Migration: While not planned in the near future, a migration to React Router or Next.js may be considered for better scalability and flexibility.
Stay tuned for updates as the project evolves!