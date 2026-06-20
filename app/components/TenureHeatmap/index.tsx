import { useState } from 'react';
import { useIntl } from 'react-intl';

import type { SkillHeatmapData } from '~/utils/utils';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

// Lazy-loaded on /skills (same pattern Timeline + the old BarChart used)
// so the route's eager bundle stays small. CSS is preloaded so the grid
// doesn't paint unstyled when the chunk arrives in a later round-trip.
export const links = () => [
  { rel: 'preload', href: styles, as: 'style' },
  { rel: 'stylesheet', href: styles },
];

const BLOCK = 'tenure-heatmap';
const getClasses = getClassMaker(BLOCK);

const DEFAULT_VISIBLE = 12;

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

  const { years, rows } = data;
  const visibleRows =
    !showAll && rows.length > DEFAULT_VISIBLE ? rows.slice(0, DEFAULT_VISIBLE) : rows;
  const canToggle = rows.length > DEFAULT_VISIBLE;

  return (
    <div className={getClasses()}>
      <div
        className={getClasses('grid')}
        style={{ '--years-count': years.length } as React.CSSProperties}
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
          {years.map((year) => (
            <div key={year} className={getClasses('year-label')} role="columnheader">
              {`'${String(year).slice(2)}`}
            </div>
          ))}
        </div>

        {visibleRows.map((row) => (
          <div key={row.skill} className={getClasses('row')} role="row">
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
