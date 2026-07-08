import { z } from 'zod';

// Zod schema for public/data/projects.json — case studies for the
// `/projects` and `/projects/<slug>` routes.
//
// Each entry is a single project write-up: who the client was (in
// abstracted form — no NDA-violating names), the role at the time,
// the dates, the tech stack, plus four narrative sections that mirror
// the engineering-case-study standard: Problem / Constraints /
// Approach / Outcome.
//
// Localizable string fields carry an optional `_es` sibling resolved
// at the loader via `localized(item, key, locale)`. Tech names + the
// slug stay literal in both locales (slugs are URL identifiers).
//
// Mirrors the skills/education schema patterns: single source of
// truth for types + boot-time validation + path-precise errors.

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

const project = z.object({
  // URL-safe identifier used as the route segment in /projects/<slug>.
  // Kebab-case, no Unicode. Stable across locales (the route doesn't
  // change shape when the user switches language; only the content does).
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  // Display title — typically the project codename or a short
  // abstracted phrase. Spanish sibling is optional; falls back to
  // the base title when absent.
  title: z.string().min(1),
  title_es: z.string().optional(),
  // One-line headline shown on the /projects index card. Pulls the
  // visitor in; the detail page has the full narrative.
  summary: z.string().min(1),
  summary_es: z.string().optional(),
  // Role on the project (e.g. "Senior Frontend Developer"). Renders
  // on both the index card and the detail meta line. Optional Spanish
  // sibling.
  role: z.string().min(1),
  role_es: z.string().optional(),
  // The company / employer at the time. Proper noun — not localized.
  // Maps to a logo in public/assets/img/<lowercase company>.webp.
  company: z.string().min(1),
  // Project span. Both YYYY-MM. `endDate` optional for ongoing work;
  // the route renders "Present" / "Presente" when missing.
  startDate: yearMonth,
  endDate: yearMonth.optional(),
  // Tech-stack chip list. Names are proper nouns (TypeScript, React,
  // etc.) — not localized. Authored chronologically; the detail page
  // sorts alphabetically before rendering.
  tech: z.array(z.string()).min(1),
  // Narrative sections. All four are required so every case study
  // tells a complete story; partial drafts can land with placeholder
  // copy. Spanish siblings are optional — fall back to English when
  // absent so partial translations don't block a render.
  problem: z.string().min(1),
  problem_es: z.string().optional(),
  constraints: z.string().min(1),
  constraints_es: z.string().optional(),
  approach: z.string().min(1),
  approach_es: z.string().optional(),
  outcome: z.string().min(1),
  outcome_es: z.string().optional(),
});

const schemaMeta = z
  .object({
    version: z.number(),
    description: z.string().optional(),
    notes: z.array(z.string()).optional(),
  })
  .optional();

const ProjectsSchema = z
  .object({
    _schema: schemaMeta,
    PROJECTS: z.array(project).min(1),
  })
  .superRefine((data, ctx) => {
    // Slugs must be unique — the route `/projects/<slug>` keys by
    // slug and a duplicate would silently mask one entry.
    const seen = new Set<string>();
    data.PROJECTS.forEach((p, idx) => {
      if (seen.has(p.slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['PROJECTS', idx, 'slug'],
          message: `Duplicate slug "${p.slug}". Slugs key the URL — merge or rename.`,
        });
      }
      seen.add(p.slug);
    });
  });

export type ProjectsData = z.infer<typeof ProjectsSchema>;
export type Project = z.infer<typeof project>;

function prettyZodError(err: z.ZodError): string {
  const lines = err.issues.map((issue) => {
    const path = issue.path
      .map((seg) => (typeof seg === 'number' ? `[${seg}]` : `.${String(seg)}`))
      .join('')
      .replace(/^\./, '');
    return `  ✗ ${path || '(root)'}: ${issue.message}`;
  });
  return [
    `projects.json failed validation (${err.issues.length} issue${err.issues.length === 1 ? '' : 's'}):`,
    ...lines,
  ].join('\n');
}

export function loadProjects(raw: unknown): ProjectsData {
  const result = ProjectsSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(prettyZodError(result.error));
  }
  return result.data;
}
