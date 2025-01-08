import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface HourlyDataChartProps {
  hourlyData: { time: string; totalReports: number }[];
}

const HourlyDataChart: React.FC<HourlyDataChartProps> = ({ hourlyData }) => {
  const data = {
    labels: hourlyData.map((item) =>
        new Date(item.time).toLocaleTimeString([], { month: 'narrow', dayPeriod: 'short', day: 'numeric', hour: '2-digit' })
),
    datasets: [
      {
        label: 'البلاغات كل ساعة',
        data: hourlyData.map((item) => item.totalReports),
        fill: true,
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  // Correctly type the options using ChartOptions<'line'>
  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top', // Ensure this matches the expected values
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'الوقت',
        },
      },
      y: {
        title: {
          display: true,
          text: 'عدد البلاغات',
        },
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default HourlyDataChart;
