import { describe, expect, it } from 'vitest';

import { loadProjects } from './projects-schema';

const validProject = {
  slug: 'sample',
  title: 'Sample',
  summary: 'A representative case study.',
  role: 'Senior Frontend Developer',
  company: 'Qubika',
  startDate: '2024-01',
  endDate: '2024-12',
  tech: ['TypeScript', 'React'],
  problem: 'A real customer problem.',
  constraints: 'Compliance review, tight window.',
  approach: 'Shipped behind feature flags, Storybook-first.',
  outcome: 'Shipped on schedule, design system adoption up.',
};

describe('loadProjects', () => {
  it('parses a valid projects payload', () => {
    const data = loadProjects({ PROJECTS: [validProject] });
    expect(data.PROJECTS).toHaveLength(1);
    expect(data.PROJECTS[0].slug).toBe('sample');
  });

  it('accepts optional _es siblings on every localizable field', () => {
    const withEs = {
      PROJECTS: [
        {
          ...validProject,
          title_es: 'Muestra',
          summary_es: 'Caso de estudio representativo.',
          role_es: 'Desarrollador Senior',
          problem_es: 'Problema real.',
          constraints_es: 'Restricciones.',
          approach_es: 'Enfoque.',
          outcome_es: 'Resultado.',
        },
      ],
    };
    const data = loadProjects(withEs);
    expect(data.PROJECTS[0].summary_es).toBe('Caso de estudio representativo.');
  });

  it('rejects a slug that contains uppercase or unicode', () => {
    expect(() => loadProjects({ PROJECTS: [{ ...validProject, slug: 'BadSlug' }] })).toThrow(
      /PROJECTS\[0\]\.slug/
    );
    expect(() => loadProjects({ PROJECTS: [{ ...validProject, slug: 'café' }] })).toThrow(
      /PROJECTS\[0\]\.slug/
    );
  });

  it('rejects bad date format with a path-precise error', () => {
    expect(() => loadProjects({ PROJECTS: [{ ...validProject, startDate: '2024/01' }] })).toThrow(
      /PROJECTS\[0\]\.startDate/
    );
  });

  it('accepts an ongoing project (no endDate)', () => {
    const ongoing = { ...validProject };
    delete (ongoing as Partial<typeof validProject>).endDate;
    const data = loadProjects({ PROJECTS: [ongoing] });
    expect(data.PROJECTS[0].endDate).toBeUndefined();
  });

  it('rejects duplicate slugs', () => {
    expect(() =>
      loadProjects({
        PROJECTS: [validProject, { ...validProject, title: 'Another' }],
      })
    ).toThrow(/Duplicate slug/);
  });

  it('rejects an empty PROJECTS list', () => {
    expect(() => loadProjects({ PROJECTS: [] })).toThrow();
  });
});
