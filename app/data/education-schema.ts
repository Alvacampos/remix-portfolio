import { z } from 'zod';

// Zod schema for public/data/education.json.
//
// Mirrors the skills-schema.ts pattern: single source of truth for
// types + boot-time validation + path-precise errors on bad data.
// Localizable string fields carry an optional `_es` sibling that
// consumers resolve via `localized(item, key, locale)` in
// app/utils/utils.tsx.

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

// One degree (full or associate). Title/summary/description carry
// optional Spanish siblings; institution + skills[] stay literal
// (institution is a proper noun; skill chips are tech names).
const degree = z.object({
  title: z.string().min(1),
  title_es: z.string().optional(),
  startDate: yearMonth,
  endDate: yearMonth,
  institution: z.string().min(1),
  summary: z.string(),
  summary_es: z.string().optional(),
  description: z.string(),
  description_es: z.string().optional(),
  skills: z.array(z.string()).min(1),
});

const certification = z.object({
  title: z.string().min(1),
  title_es: z.string().optional(),
  startDate: yearMonth,
  institution: z.string().min(1),
  description: z.string(),
  description_es: z.string().optional(),
  url: z.string().url().optional(),
  // When true, the certification renders with the "Currently studying"
  // badge — matches how in-progress degrees are surfaced. Degrees infer
  // in-progress state from `endDate > todayYearMonth`; certifications
  // don't have `endDate` on the schema, so this is an explicit flag on
  // the JSON side. Set to `true` for in-flight programs (e.g. Claude
  // Certified Architect); leave undefined for completed certifications.
  inProgress: z.boolean().optional(),
});

const schemaMeta = z
  .object({
    version: z.number(),
    description: z.string().optional(),
    notes: z.array(z.string()).optional(),
  })
  .optional();

export const EducationSchema = z.object({
  _schema: schemaMeta,
  degree,
  associateDegree: degree,
  certifications: z.array(certification),
});

export type EducationData = z.infer<typeof EducationSchema>;
export type Degree = z.infer<typeof degree>;
export type Certification = z.infer<typeof certification>;

// Format a Zod error tree into a multi-line, path-prefixed list for
// log output — same shape as the skills-schema helper so failures in
// either file produce a consistent, scannable error format.
function prettyZodError(err: z.ZodError): string {
  const lines = err.issues.map((issue) => {
    const path = issue.path
      .map((seg) => (typeof seg === 'number' ? `[${seg}]` : `.${String(seg)}`))
      .join('')
      .replace(/^\./, '');
    return `  ✗ ${path || '(root)'}: ${issue.message}`;
  });
  return [
    `education.json failed validation (${err.issues.length} issue${err.issues.length === 1 ? '' : 's'}):`,
    ...lines,
  ].join('\n');
}

// Parse + validate education.json content. Throws a pretty-printed
// error that lists every failing path; fix all of them in one pass
// instead of one-at-a-time. Called once per worker boot from the
// route loaders that consume it.
export function loadEducation(raw: unknown): EducationData {
  const result = EducationSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(prettyZodError(result.error));
  }
  return result.data;
}
