import React from 'react';
import { Pie } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface DirectionPieChartProps {
  directionCounts: Record<string, number>;
}

const DirectionPieChart: React.FC<DirectionPieChartProps> = ({ directionCounts }) => {
  const data = {
    labels: Object.keys(directionCounts),
    datasets: [
      {
        data: Object.values(directionCounts),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  // Correctly type the options using ChartOptions<'pie'>
  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false, // Allows control over the chart's container height
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12, // Control font size in the legend
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '338px' }}>
<Pie data={data} options={options} /></div>);
};

export default DirectionPieChart;
