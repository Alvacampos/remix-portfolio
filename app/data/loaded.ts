// Boot-time parse of every static JSON payload. Each `load*` runs a
// Zod schema (referential-integrity superRefines etc.) that isn't cheap
// — hoisting the call here means every route module reuses the same
// parsed object instead of re-running the validator per import site.
import { loadEducation } from '~/data/education-schema';
import { loadProjects } from '~/data/projects-schema';
import { loadSkills } from '~/data/skills-schema';
import educationJson from '~data/education.json';
import projectsJson from '~data/projects.json';
import skillsJson from '~data/skills.json';

export const SKILLS = loadSkills(skillsJson);
export const EDUCATION = loadEducation(educationJson);
export const PROJECTS = loadProjects(projectsJson);
