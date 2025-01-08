import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChartWidget: React.FC<{ a: number; b: number, labela: string, labelb: string }> = ({
  a,
  b,
  labela,
  labelb
}) => {
  const data = {
    labels: [labela, labelb],
    datasets: [
      {
        data: [a, b],
        backgroundColor: ['#007bff', '#ff6384'],
      },
    ],
  };

  return (
    <div className="pie-chart">
      <Pie data={data} />
    </div>
  );
};

export default PieChartWidget;
