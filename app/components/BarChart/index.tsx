import { useIntl } from 'react-intl';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { getClassMaker } from '~/utils/utils';
import LoadingSpinner, { links as loadingSpinnerLinks } from '~/components/LoadingSpinner';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import styles from './style.css?url';

export const links = () => [...loadingSpinnerLinks(), { rel: 'stylesheet', href: styles }];

const BLOCK = 'bar-chart-component';
const getClasses = getClassMaker(BLOCK);

export default function BarChart({ data }: { data: (string | number)[][] }) {
  const { formatMessage } = useIntl();
  const COLOR_CODE = [
    '#d73a49', // Red
    '#e36209', // Orange
    '#dbab09', // Yellow
    '#a37114', // Brown
    '#6f42c1', // Indigo
    '#1f6feb', // Blue
    '#388d3c', // Dark Green
    '#2ea44f', // Green
    '#07948d', // Teal
    '#2b2b2b', // Dark Gray
    '#9be9a8', // Light Green
    '#c9d1d9', // Gray
    '#b392f0', // Purple
    '#d1578f', // Pink
    '#f0f6fc', // White
  ];

  const TEXT_COLOR = '#f0f6fc';

  const [options] = useState({
    chart: {
      type: 'bar',
      backgroundColor: '#0d1117',
    },
    credits: {
      enabled: false,
    },
    title: {
      text: '',
    },
    xAxis: {
      type: 'category',
      labels: {
        autoRotation: [-45, -90],
        style: {
          fontSize: '13px',
          fontFamily: 'Verdana, sans-serif',
          color: TEXT_COLOR,
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: formatMessage({ id: 'YEARS' }),
        style: {
          color: TEXT_COLOR,
        },
      },

      labels: {
        style: {
          color: TEXT_COLOR,
        },
      },
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      pointFormat: `<b>{point.y:.1f} ${formatMessage({ id: 'YEARS' })}</b>`,
      backgroundColor: '#333333',
      style: {
        color: TEXT_COLOR,
      },
    },
    plotOptions: {
      series: {
        borderColor: '#303030',
      },
    },
    series: [
      {
        name: formatMessage({ id: 'YEARS_OF_EXPERIENCE' }),
        colors: COLOR_CODE,
        colorByPoint: true,
        groupPadding: 0,
        dataSorting: {
          enabled: true,
        },
        data,
      },
    ],
  });

  return (
    <ClientOnly fallback={<LoadingSpinner />}>
      {() => (
        <div className={getClasses()}>
          <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
      )}
    </ClientOnly>
  );
}
