import { describe, expect, it } from 'vitest';

import { loadSkills, SKILL_NAME_ES_REGISTRY } from './skills-schema';

const validWorkItem = {
  id: 1,
  title: 'Qubika',
  startDate: '2022-04',
  rol: 'Senior Frontend Developer',
};

const base = {
  WORK_ITEMS: [validWorkItem],
  SKILLS: [
    {
      name: 'TypeScript',
      category: 'language' as const,
      ranges: [{ jobId: 1 }],
    },
  ],
  EXTRA_ACTIVITIES: [],
};

describe('loadSkills', () => {
  it('parses a valid payload', () => {
    const data = loadSkills(base);
    expect(data.SKILLS).toHaveLength(1);
  });

  it('rejects a range that references a missing jobId', () => {
    const bad = {
      ...base,
      SKILLS: [{ ...base.SKILLS[0], ranges: [{ jobId: 999 }] }],
    };
    expect(() => loadSkills(bad)).toThrow(/jobId 999 does not exist in WORK_ITEMS/);
  });

  it('rejects duplicate skill names', () => {
    const bad = {
      ...base,
      SKILLS: [
        { name: 'React', category: 'framework' as const, ranges: [{ jobId: 1 }] },
        { name: 'React', category: 'framework' as const, ranges: [{ jobId: 1 }] },
      ],
    };
    expect(() => loadSkills(bad)).toThrow(/Duplicate skill name "React"/);
  });

  describe('SKILL_NAME_ES_REGISTRY', () => {
    it('accepts a name_es that matches the registry', () => {
      const withEs = {
        ...base,
        SKILLS: [
          {
            name: 'Mentoring',
            category: 'meta' as const,
            name_es: 'Mentoría',
            ranges: [{ jobId: 1 }],
          },
        ],
      };
      expect(() => loadSkills(withEs)).not.toThrow();
    });

    it('rejects a name_es typo (Mentoria vs Mentoría)', () => {
      const bad = {
        ...base,
        SKILLS: [
          {
            name: 'Mentoring',
            category: 'meta' as const,
            name_es: 'Mentoria',
            ranges: [{ jobId: 1 }],
          },
        ],
      };
      expect(() => loadSkills(bad)).toThrow(/disagrees with registry/);
    });

    it('rejects a name_es on a skill that has no registry entry', () => {
      const bad = {
        ...base,
        SKILLS: [
          {
            name: 'React',
            category: 'framework' as const,
            name_es: 'Reactivo',
            ranges: [{ jobId: 1 }],
          },
        ],
      };
      expect(() => loadSkills(bad)).toThrow(/no entry in SKILL_NAME_ES_REGISTRY/);
    });

    it('allows a skill without a name_es even when the registry has an entry', () => {
      // Registry defines the canonical translation; setting name_es is
      // still optional. Only mismatch throws.
      const withoutEs = {
        ...base,
        SKILLS: [{ name: 'Mentoring', category: 'meta' as const, ranges: [{ jobId: 1 }] }],
      };
      expect(() => loadSkills(withoutEs)).not.toThrow();
    });

    it('registry entries all agree with what skills.json ships today', async () => {
      // Belt-and-braces: importing the real file re-runs the validator.
      // If someone edits skills.json without updating the registry (or
      // vice versa), this test fails loud instead of at boot in prod.
      const raw = await import('~data/skills.json');
      expect(() => loadSkills(raw.default)).not.toThrow();
      // Sanity: at least one known pair round-trips.
      expect(SKILL_NAME_ES_REGISTRY.Mentoring).toBe('Mentoría');
    });
  });
});
