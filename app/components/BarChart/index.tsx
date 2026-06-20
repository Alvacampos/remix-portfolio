import { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'bar-chart-component';
const getClasses = getClassMaker(BLOCK);

// Green-shaded ramp inspired by GitHub's contribution graph: brighter
// greens go to the strongest skills, fading down as years of
// experience drop. Same hex set works in both themes — the bars sit
// on the card surface, which has enough contrast in either mode.
//
// Order is darkest-to-lightest so index 0 is the most-experienced
// skill. Falls back via modulo for >14 bars.
const COLOR_CODE = [
  '#0fbf3e', // green-4 (hero)
  '#0fa838',
  '#0e9233',
  '#0c7c2d',
  '#0a6627',
  '#085021',
  '#08827b', // green-5 (teal-tinted deep)
  '#0a9c93',
  '#0db5ab',
  '#5fed83', // green-3
  '#7ef096',
  '#9bf2a8',
  '#bff5c4',
  '#bfffd1', // green-1
];

// Match the "Total years of experience" card format. Decimal years confuse
// readers ("7.83" doesn't read as "7y 10m" at a glance even though it's
// the same duration). For very short durations we fall back to months.
function formatYears(value: number): string {
  const totalMonths = Math.round(value * 12);
  if (totalMonths === 0) return '<1m';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}m`;
}

type TooltipPayload = {
  active?: boolean;
  payload?: { value: number; payload: { name: string } }[];
};

function CustomTooltip({ active = false, payload = [] }: TooltipPayload) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className={getClasses('custom-tooltip')}>
        <div className={getClasses('tooltip-item')}>
          <span className={getClasses('tooltip-label')}>{item.payload.name}</span>
          <span className={getClasses('tooltip-value')}>{formatYears(item.value)}</span>
        </div>
      </div>
    );
  }
  return null;
}

type Props = {
  data: (string | number)[][];
};

// Default visible bars: top N skills by years of experience. The bars
// below this drop into "show all" — they're real but their share of
// chart real estate makes the strongest skills look weaker by
// comparison. Number picked to comfortably cover the core stack.
const DEFAULT_VISIBLE = 12;

export default function CustomBarChart({ data }: Props) {
  const { formatMessage } = useIntl();
  const [showAll, setShowAll] = useState(false);

  const sortedData = [...data]
    .map(([name, value]) => ({ name: String(name), value: Number(value) }))
    .sort((a, b) => b.value - a.value); // sort descending

  const visibleData =
    !showAll && sortedData.length > DEFAULT_VISIBLE
      ? sortedData.slice(0, DEFAULT_VISIBLE)
      : sortedData;
  const canToggle = sortedData.length > DEFAULT_VISIBLE;

  return (
    <div className={getClasses()}>
      <ResponsiveContainer width="100%" height={visibleData.length * 40}>
        <BarChart data={visibleData} layout="vertical" barSize={20}>
          {/* Axis ticks hidden: precise values are on the bar labels.
              Keeping the line as a baseline reference. `currentColor`
              inherits from `<div className="bar-chart-component">`,
              which CSS sets to var(--fg-base) — works in both themes. */}
          <XAxis type="number" stroke="currentColor" tick={false} />
          <YAxis type="category" dataKey="name" stroke="currentColor" width={100} />
          <Tooltip
            wrapperClassName={getClasses('custom-tooltip')}
            cursor={{ fill: 'rgba(15, 191, 62, 0.08)' }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="value" isAnimationActive={false}>
            {visibleData.map((entry, index) => (
              <Cell key={entry.name} fill={COLOR_CODE[index % COLOR_CODE.length]} />
            ))}
            <LabelList
              dataKey="value"
              formatter={(value: unknown) => formatYears(Number(value))}
              /* Bar value labels render INSIDE the bar — pinned to a
               * dark color so they read on every bar in our green ramp
               * (the lightest greens are too pale for white labels). */
              fill="#0a241b"
              fontSize={14}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {canToggle && (
        <button
          type="button"
          className={getClasses('toggle')}
          onClick={() => setShowAll((prev) => !prev)}
          aria-expanded={showAll}
        >
          {showAll
            ? formatMessage({ id: 'CHART_SHOW_LESS' })
            : formatMessage(
                { id: 'CHART_SHOW_ALL' },
                { count: sortedData.length - DEFAULT_VISIBLE }
              )}
        </button>
      )}
    </div>
  );
}
