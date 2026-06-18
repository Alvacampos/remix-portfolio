import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'bar-chart-component';
const getClasses = getClassMaker(BLOCK);

const COLOR_CODE = [
  '#d73a49',
  '#e36209',
  '#dbab09',
  '#a37114',
  '#6f42c1',
  '#1f6feb',
  '#388d3c',
  '#2ea44f',
  '#07948d',
  '#2b2b2b',
  '#9be9a8',
  '#c9d1d9',
  '#b392f0',
  '#d1578f',
  '#f0f6fc',
];

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
          <span className={getClasses('tooltip-value')}>{item.value.toFixed(2)} yrs</span>
        </div>
      </div>
    );
  }
  return null;
}

type Props = {
  data: (string | number)[][];
};

export default function CustomBarChart({ data }: Props) {
  const sortedData = [...data]
    .map(([name, value]) => ({ name: String(name), value: Number(value) }))
    .sort((a, b) => b.value - a.value); // sort descending

  return (
    <div className={getClasses()}>
      <ResponsiveContainer width="100%" height={sortedData.length * 40}>
        <BarChart data={sortedData} layout="vertical" barSize={20}>
          <XAxis type="number" stroke="#f0f6fc" />
          <YAxis type="category" dataKey="name" stroke="#f0f6fc" width={100} />
          <Tooltip
            wrapperClassName={getClasses('custom-tooltip')}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="value" isAnimationActive={false}>
            {sortedData.map((entry, index) => (
              <Cell key={entry.name} fill={COLOR_CODE[index % COLOR_CODE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
