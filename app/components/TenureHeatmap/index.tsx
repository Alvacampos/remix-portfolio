import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import type { SkillHeatmapData } from '~/utils/utils';
import { getClassMaker } from '~/utils/utils';

// Lazy-loaded on /skills so the route's eager bundle stays small.
// TenureHeatmap CSS is `@import`-inlined into the consuming route's
// style.css via postcss-import — no links() export.

const BLOCK = 'tenure-heatmap';
const getClasses = getClassMaker(BLOCK);

const DEFAULT_VISIBLE = 18;

// Desktop breakpoint shared with the route stylesheet ($bp-lg = 1024px).
// Above this width the layout transposes (skills become columns, years
// become rows) and we expand the rendered set to all rows. Below it,
// 30 skill columns + the 200px nav rail can't fit without horizontal
// overflow, so we keep the mobile orientation (skills down the left,
// years across the top) which scales gracefully on narrow screens.
const DESKTOP_QUERY = '(min-width: 1024px)';

// Five-step intensity scale matching GitHub's contribution graph.
// 0 → no activity, 4 → full year. Anything in between is interpolated
// from months / 12 → bucket via the simple `Math.ceil(months / 3)`
// (3 months ≈ a quarter) so a single quarter still registers as level 1
// instead of being indistinguishable from "0 months".
function intensity(months: number): 0 | 1 | 2 | 3 | 4 {
  if (months <= 0) return 0;
  if (months <= 3) return 1;
  if (months <= 6) return 2;
  if (months <= 9) return 3;
  return 4;
}

type Props = {
  data: SkillHeatmapData;
};

export default function TenureHeatmap({ data }: Props) {
  const { formatMessage } = useIntl();
  const [showAll, setShowAll] = useState(false);
  // Desktop expands the rendered set to all skills (columns are
  // fluid-sized, no vertical pressure to clip) and the toggle goes
  // away. Lazy-initialized from matchMedia so the very first render
  // already knows the viewport — avoids a one-frame flash where a
  // desktop user sees the mobile-clipped 18 skills + toggle before
  // the effect hydrates the desktop value. The component is lazy-
  // loaded behind Suspense, so by the time it mounts we're always
  // in the browser; SSR returns false here and that's fine because
  // the entire component never renders server-side.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const { years, rows } = data;
  const expanded = isDesktop || showAll;
  const visibleRows =
    !expanded && rows.length > DEFAULT_VISIBLE ? rows.slice(0, DEFAULT_VISIBLE) : rows;
  const canToggle = !isDesktop && rows.length > DEFAULT_VISIBLE;

  return (
    <div className={getClasses()}>
      <div
        className={getClasses('grid')}
        style={
          {
            '--years-count': years.length,
            '--skills-count': visibleRows.length,
          } as React.CSSProperties
        }
        role="table"
        aria-label={formatMessage({ id: 'TENURE_HEATMAP_LABEL' })}
      >
        {/* Header row — year labels */}
        <div className={`${getClasses('row')} ${getClasses('row', 'head')}`} role="row">
          <div
            className={`${getClasses('skill')} ${getClasses('skill', 'head')}`}
            role="columnheader"
            aria-hidden="true"
          />
          {years.map((year, idx) => (
            <div
              key={year}
              className={getClasses('year-label')}
              role="columnheader"
              /* --year-idx drives `grid-row` on desktop so years render
               * newest-first (top) without touching mobile DOM order. */
              style={{ '--year-idx': idx } as React.CSSProperties}
            >
              {`'${String(year).slice(2)}`}
            </div>
          ))}
        </div>

        {visibleRows.map((row, skillIdx) => (
          <div
            key={row.skill}
            className={getClasses('row')}
            role="row"
            /* --skill-idx pins this row's skill label and cells to a
             * specific grid column on desktop (where rows use
             * `display: contents` and the grid is transposed). Without
             * an explicit column, cells with explicit grid-row would
             * auto-flow into implicit tracks and scatter. */
            style={{ '--skill-idx': skillIdx } as React.CSSProperties}
          >
            <div className={getClasses('skill')} role="rowheader">
              {row.skill}
            </div>
            {row.monthsPerYear.map((months, idx) => {
              const level = intensity(months);
              return (
                <div
                  key={`${row.skill}-${years[idx]}`}
                  /* getClassMaker is BLOCK-modifier only — it does
                   * not emit `block__cell block__cell--level-N`, so
                   * we hand-compose the pair here. The base class
                   * carries size + border + hover; the modifier
                   * paints the level color. */
                  className={`${getClasses('cell')} ${getClasses('cell', `level-${level}`)}`}
                  role="cell"
                  title={`${row.skill} · ${years[idx]} · ${months}m`}
                  aria-label={`${row.skill}, ${years[idx]}, ${months} months`}
                  /* --year-idx pairs with --skill-idx (set on the row
                   * wrapper) to place this cell at an explicit
                   * (column, row) on desktop. */
                  style={{ '--year-idx': idx } as React.CSSProperties}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* GitHub-style legend: "Less ▢▢▣▣▣ More" */}
      <div className={getClasses('legend')}>
        <span className={getClasses('legend-label')}>{formatMessage({ id: 'HEATMAP_LESS' })}</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`${getClasses('cell')} ${getClasses('cell', `level-${level}`)}`}
            aria-hidden="true"
          />
        ))}
        <span className={getClasses('legend-label')}>{formatMessage({ id: 'HEATMAP_MORE' })}</span>
      </div>

      {canToggle && (
        <button
          type="button"
          className={getClasses('toggle')}
          onClick={() => setShowAll((prev) => !prev)}
          aria-expanded={showAll}
        >
          {showAll
            ? formatMessage({ id: 'CHART_SHOW_LESS' })
            : formatMessage({ id: 'CHART_SHOW_ALL' })}
        </button>
      )}
    </div>
  );
}
