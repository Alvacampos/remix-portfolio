import { describe, expect, it } from 'vitest';

import { loadEducation } from './education-schema';

const validBase = {
  degree: {
    title: 'B.S. CS',
    startDate: '2020-01',
    endDate: '2024-12',
    institution: 'Test U',
    summary: 'Summary',
    description: 'Description',
    skills: ['Python'],
  },
  associateDegree: {
    title: 'Associate',
    startDate: '2018-01',
    endDate: '2020-12',
    institution: 'Test College',
    summary: 'Summary',
    description: 'Description',
    skills: ['JavaScript'],
  },
  certifications: [],
};

describe('loadEducation', () => {
  it('parses a valid education payload', () => {
    const data = loadEducation(validBase);
    expect(data.degree.title).toBe('B.S. CS');
    expect(data.certifications).toEqual([]);
  });

  it('accepts optional _es siblings on localizable fields', () => {
    const withEs = {
      ...validBase,
      degree: {
        ...validBase.degree,
        title_es: 'Lic. en CS',
        summary_es: 'Resumen',
        description_es: 'Descripción',
      },
    };
    const data = loadEducation(withEs);
    expect(data.degree.title_es).toBe('Lic. en CS');
  });

  it('rejects bad date format with a path-precise error', () => {
    const bad = { ...validBase, degree: { ...validBase.degree, startDate: '2020/01' } };
    expect(() => loadEducation(bad)).toThrow(/degree\.startDate/);
  });

  it('rejects missing institution', () => {
    const bad = { ...validBase, degree: { ...validBase.degree, institution: '' } };
    expect(() => loadEducation(bad)).toThrow(/degree\.institution/);
  });

  it('accepts certifications with optional url', () => {
    const withCert = {
      ...validBase,
      certifications: [
        {
          title: 'Cert',
          startDate: '2022-01',
          institution: 'EF SET',
          description: 'C2',
          url: 'https://example.com',
        },
      ],
    };
    const data = loadEducation(withCert);
    expect(data.certifications[0].url).toBe('https://example.com');
  });

  it('rejects an invalid url shape', () => {
    const bad = {
      ...validBase,
      certifications: [
        {
          title: 'Cert',
          startDate: '2022-01',
          institution: 'EF SET',
          description: 'C2',
          url: 'not-a-url',
        },
      ],
    };
    expect(() => loadEducation(bad)).toThrow(/certifications\[0\]\.url/);
  });
});
