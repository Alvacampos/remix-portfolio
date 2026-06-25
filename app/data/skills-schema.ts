import { z } from 'zod';

// Zod schema for public/data/skills.json (skill-first model, v2 shape).
//
// Single source of truth for the data layer:
//   - TS types (`SkillsData`, `WorkItem`, `Skill`, etc.) inferred via z.infer
//   - Loader-time validation: malformed JSON throws before any consumer reads it
//   - Pretty-printed errors in the throw so the failing path is obvious
//   - Referential integrity check: every range.jobId resolves to a WORK_ITEMS.id
//
// Add a new field here, regenerate types automatically, get errors at boot.

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

const skillCategory = z.enum(['language', 'framework', 'tooling', 'infra', 'meta']);

const skillRange = z.object({
  jobId: z.number().int().positive(),
  from: yearMonth.optional(),
  to: yearMonth.optional(),
});

const skill = z.object({
  name: z.string().min(1),
  // Optional Spanish sibling. Resolved via `localized(skill, 'name', locale)`.
  // Tech names (TypeScript, React, etc.) stay literal in both locales — only
  // soft / meta skills like "Mentoring" → "Mentoría" need translation.
  name_es: z.string().optional(),
  category: skillCategory,
  ranges: z.array(skillRange).min(1),
});

// Localizable string fields carry an optional `_es` sibling — the
// Spanish variant. Consumers read via `localized(item, key, locale)`
// in app/utils/utils.tsx, which falls back to the English field
// when `_es` is missing or empty. Title/role/description/project
// copy is biographical and translatable; date fields, ids, and
// proper-noun company names are NOT localized and stay as plain
// strings. Tech-stack chip text (the SKILLS array) is also not
// localized — language/framework names are proper nouns.
const projectsField = z.union([
  z.string(),
  z.array(
    z.object({
      title: z.string(),
      title_es: z.string().optional(),
      text: z.string(),
      text_es: z.string().optional(),
    })
  ),
]);

const workItem = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  startDate: yearMonth,
  endDate: yearMonth.optional(),
  rol: z.string(),
  rol_es: z.string().optional(),
  description: z.string().optional(),
  description_es: z.string().optional(),
  projects: projectsField.optional(),
  // When `projects` is a plain string (some teaching roles render a
  // single sentence rather than a structured project list), the
  // Spanish translation lives here as a sibling. Schema-level only —
  // the array variant carries its localization inside each project's
  // own `_es` siblings. Resolved at the loader via
  // `localized(item, 'projects', locale)` for the string case.
  projects_es: z.string().optional(),
});

const extraActivities = z.array(
  z.object({
    // Outer title is the company name (Endava, Qubika, etc.) — proper
    // noun, NOT localized. The nested data items below are.
    title: z.string(),
    data: z.array(
      z.object({
        title: z.string(),
        title_es: z.string().optional(),
        text: z.string(),
        text_es: z.string().optional(),
      })
    ),
  })
);

const schemaMeta = z
  .object({
    version: z.number(),
    notes: z.array(z.string()).optional(),
  })
  .optional();

export const SkillsSchema = z
  .object({
    _schema: schemaMeta,
    WORK_ITEMS: z.array(workItem).min(1),
    SKILLS: z.array(skill).min(1),
    EXTRA_ACTIVITIES: extraActivities,
  })
  .superRefine((data, ctx) => {
    // Referential integrity: every range.jobId must exist in WORK_ITEMS.
    // Catches the "I renamed/renumbered a job and forgot to update a range"
    // class of bugs at loader time, with a path-precise message.
    const jobIds = new Set(data.WORK_ITEMS.map((w) => w.id));
    data.SKILLS.forEach((s, sIdx) => {
      s.ranges.forEach((r, rIdx) => {
        if (!jobIds.has(r.jobId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['SKILLS', sIdx, 'ranges', rIdx, 'jobId'],
            message: `jobId ${r.jobId} does not exist in WORK_ITEMS (skill: "${s.name}")`,
          });
        }
      });
    });

    // Duplicate skill names. Two entries with the same name silently
    // collide downstream — heatmap rows merge by name and one would
    // mask the other. Surface it here.
    const seen = new Set<string>();
    data.SKILLS.forEach((s, sIdx) => {
      if (seen.has(s.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['SKILLS', sIdx, 'name'],
          message: `Duplicate skill name "${s.name}". Skills are keyed by name; merge ranges into one entry.`,
        });
      }
      seen.add(s.name);
    });

    // Duplicate jobIds in WORK_ITEMS. Same rationale — keyed by id.
    const seenIds = new Set<number>();
    data.WORK_ITEMS.forEach((w, wIdx) => {
      if (seenIds.has(w.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['WORK_ITEMS', wIdx, 'id'],
          message: `Duplicate WORK_ITEMS id ${w.id}.`,
        });
      }
      seenIds.add(w.id);
    });
  });

export type SkillsData = z.infer<typeof SkillsSchema>;
export type WorkItem = z.infer<typeof workItem>;
export type Skill = z.infer<typeof skill>;
export type SkillRange = z.infer<typeof skillRange>;
export type SkillCategory = z.infer<typeof skillCategory>;

// Format a Zod error tree into a multi-line, path-prefixed list for log
// output. Replaces Zod's default JSON dump (which is dense and includes
// the entire input tree) with a human-readable summary.
//
// Example:
//   ✗ SKILLS[27].category: Invalid enum value. Expected language|framework|tooling|infra|meta
//   ✗ SKILLS[12].ranges[0].jobId: jobId 99 does not exist in WORK_ITEMS (skill: "Python")
function prettyZodError(err: z.ZodError): string {
  const lines = err.issues.map((issue) => {
    const path = issue.path
      .map((seg) => (typeof seg === 'number' ? `[${seg}]` : `.${String(seg)}`))
      .join('')
      .replace(/^\./, '');
    return `  ✗ ${path || '(root)'}: ${issue.message}`;
  });
  return [
    `skills.json failed validation (${err.issues.length} issue${err.issues.length === 1 ? '' : 's'}):`,
    ...lines,
  ].join('\n');
}

// Parse + validate skills.json content. Throws a pretty-printed error
// that lists every failing path; fix all of them in one pass instead
// of one-at-a-time. Called once per worker boot from the loader.
export function loadSkills(raw: unknown): SkillsData {
  const result = SkillsSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(prettyZodError(result.error));
  }
  return result.data;
}
