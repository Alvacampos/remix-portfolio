// Run Lighthouse against the production site for each tracked route,
// extract a small summary JSON (matching the shape of the hand-authored
// summaries already in lighthouse/), and write the full report to a
// transient lighthouse-reports/ directory for the GitHub Actions artifact
// upload step.
//
// Designed to run in the CI workflow at .github/workflows/lighthouse.yml.
// Locally you can `npm install lighthouse chrome-launcher` and run this
// directly to capture a snapshot, but the canonical use is CI.

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// `LIGHTHOUSE_SITE` overrides the default production URL. Set to
// `http://localhost:8788` when gating a PR against a local preview
// build, or leave unset to score the deployed prod site (the daily
// post-merge run).
const SITE = process.env.LIGHTHOUSE_SITE || 'https://gonzalo-alvarez-campos-cv.com';
const SHA = (process.env.LIGHTHOUSE_SHA || 'local').slice(0, 7);

// `LIGHTHOUSE_GATE=1` turns the run into a hard CI gate: after every
// route is scored, exit non-zero if any Performance category falls
// below `LIGHTHOUSE_PERF_MIN` (default 0.85). The gate is opt-in
// because the post-merge job still wants warn-only behaviour
// (perf drift on the deployed site is informational, not blocking).
const GATE = process.env.LIGHTHOUSE_GATE === '1';
const PERF_MIN = Number(process.env.LIGHTHOUSE_PERF_MIN || '0.85');

// `LIGHTHOUSE_GATE_ROUTES=<csv>` limits the gate's threshold check to
// the named routes (everything else is scored + reported but NOT
// gated). Useful when one route has consistently higher CI variance
// than the others — score it for visibility, don't fail the build on
// it. Unset = gate every route.
const GATE_ROUTES = process.env.LIGHTHOUSE_GATE_ROUTES
  ? new Set(process.env.LIGHTHOUSE_GATE_ROUTES.split(',').map((s) => s.trim()))
  : null;

// Same five routes as the visual-regression suite.
// (Note: /skills isn't in the visual suite — see Stage 16 — but it IS
// the route we've been benchmarking since Stage 7, so it stays in the
// Lighthouse run.)
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'skills-index', path: '/skills' },
  { name: 'education-index', path: '/education' },
  { name: 'skills-detail', path: '/skills/1' },
  { name: 'education-detail', path: '/education/degree' },
];

const SUMMARY_DIR = resolve('lighthouse');
const REPORTS_DIR = resolve('lighthouse-reports');
mkdirSync(REPORTS_DIR, { recursive: true });

// Lighthouse config: mobile profile + Lantern simulation, matching the
// historical baselines. The defaults already use these.
const LH_OPTIONS = {
  output: 'json',
  logLevel: 'info',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
};

async function importLighthouse() {
  // lighthouse + chrome-launcher are runtime-only deps; in CI the
  // workflow `npm install`s them just before this script. Locally,
  // run `npx -p lighthouse -p chrome-launcher node scripts/run-lighthouse.mjs`
  // or install them as dev deps.
  const [{ default: lighthouse }, chromeLauncher] = await Promise.all([
    import('lighthouse'),
    import('chrome-launcher'),
  ]);
  return { lighthouse, chromeLauncher };
}

function pickMetric(audit) {
  if (!audit) return undefined;
  return {
    displayValue: audit.displayValue,
    numericValue: audit.numericValue,
    score: audit.score,
  };
}

function summarize(lhr) {
  const c = lhr.categories;
  const a = lhr.audits;
  return {
    fetchTime: lhr.fetchTime,
    requestedUrl: lhr.requestedUrl,
    finalUrl: lhr.finalUrl,
    lighthouseVersion: lhr.lighthouseVersion,
    commit: SHA,
    categories: {
      performance: c.performance?.score,
      accessibility: c.accessibility?.score,
      'best-practices': c['best-practices']?.score,
      seo: c.seo?.score,
    },
    metrics: {
      fcp: pickMetric(a['first-contentful-paint']),
      lcp: pickMetric(a['largest-contentful-paint']),
      si: pickMetric(a['speed-index']),
      tbt: pickMetric(a['total-blocking-time']),
      cls: pickMetric(a['cumulative-layout-shift']),
      tti: pickMetric(a['interactive']),
      ttfb: a['server-response-time']?.numericValue,
    },
    failingAudits: Object.values(a)
      .filter((x) => x.score !== null && x.score < 1 && x.scoreDisplayMode !== 'manual')
      .map((x) => ({ id: x.id, title: x.title, score: x.score })),
  };
}

async function main() {
  const { lighthouse, chromeLauncher } = await importLighthouse();
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });

  const belowThreshold = [];

  try {
    for (const route of ROUTES) {
      const url = `${SITE}${route.path}`;
      console.log(`Lighthouse: ${url}`);
      const result = await lighthouse(url, { ...LH_OPTIONS, port: chrome.port });
      if (!result) {
        throw new Error(`Lighthouse returned no result for ${url}`);
      }
      const summary = summarize(result.lhr);
      const summaryPath = `${SUMMARY_DIR}/${route.name}-${SHA}.summary.json`;
      const fullPath = `${REPORTS_DIR}/${route.name}-${SHA}.json`;
      writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
      writeFileSync(fullPath, result.report);
      const cat = summary.categories;
      console.log(
        `  perf=${cat.performance} a11y=${cat.accessibility} bp=${cat['best-practices']} seo=${cat.seo}`
      );
      if (
        GATE &&
        (GATE_ROUTES === null || GATE_ROUTES.has(route.name)) &&
        typeof cat.performance === 'number' &&
        cat.performance < PERF_MIN
      ) {
        belowThreshold.push({ name: route.name, score: cat.performance });
      }
    }
  } finally {
    await chrome.kill();
  }

  if (GATE && belowThreshold.length > 0) {
    console.error(
      `\nLighthouse gate failed: ${belowThreshold.length} route(s) below perf ${PERF_MIN}:`
    );
    for (const r of belowThreshold) {
      console.error(`  - ${r.name}: ${r.score}`);
    }
    process.exit(1);
  }

  console.log('Done. Summaries written to lighthouse/. Full reports in lighthouse-reports/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
