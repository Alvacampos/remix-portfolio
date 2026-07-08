import type { z } from 'zod';

// Format a Zod error tree into a multi-line, path-prefixed list. Replaces
// Zod's default JSON dump (which is dense and includes the entire input
// tree) with a human-readable summary tagged by source filename.
export function formatZodError(source: string, err: z.ZodError): string {
  const lines = err.issues.map((issue) => {
    const path = issue.path
      .map((seg) => (typeof seg === 'number' ? `[${seg}]` : `.${String(seg)}`))
      .join('')
      .replace(/^\./, '');
    return `  ✗ ${path || '(root)'}: ${issue.message}`;
  });
  const count = err.issues.length;
  return [`${source} failed validation (${count} issue${count === 1 ? '' : 's'}):`, ...lines].join(
    '\n'
  );
}
