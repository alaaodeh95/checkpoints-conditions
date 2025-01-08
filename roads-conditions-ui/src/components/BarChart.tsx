import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface BarChartProps {
  counts: Record<string, number>;
  label: string;
  orientation?: 'vertical' | 'horizontal'; // Add orientation prop
}

const BarChart: React.FC<BarChartProps> = ({ counts, label, orientation = 'vertical' }) => {
  const data = {
    labels: Object.keys(counts),
    datasets: [
      {
        label: 'مجمل البلاغات',
        data: Object.values(counts),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: orientation === 'horizontal' ? 'y' : 'x', // Explicitly use "x" or "y"
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { title: { display: orientation === 'vertical', text: label } },
      y: { title: { display: orientation === 'horizontal', text: 'البلاغات' }, beginAtZero: true },
    },
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
