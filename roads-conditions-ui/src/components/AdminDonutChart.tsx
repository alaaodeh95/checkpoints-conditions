import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface AdminDonutChartProps {
  admin: number;
  nonAdmin: number;
}

const AdminDonutChart: React.FC<AdminDonutChartProps> = ({ admin, nonAdmin }) => {
  const data = {
    labels: ['مدير للمجموعة', 'عضو عادي'],
    datasets: [
      {
        data: [admin, nonAdmin],
        backgroundColor: ['#FF6384', '#36A2EB'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
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
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default AdminDonutChart;
