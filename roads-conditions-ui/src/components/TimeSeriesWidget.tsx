import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const TimeSeriesWidget: React.FC<{ timeSeries: any[] }> = ({ timeSeries }) => {
  // Prepare labels and data
  const labels = timeSeries.map((point) =>
    new Date(point.time).toLocaleTimeString([], { month: 'narrow', dayPeriod: 'short', day: 'numeric', hour: '2-digit' })
);
  const data = {
    labels,
    datasets: [
      {
        label: 'للداخل',
        data: timeSeries.map((point) =>
          point.lastEnterState === 'Open_Enter' ? 1 : point.lastEnterState === 'Traffic_Enter' ? 0.5 : 0
        ),
        borderColor: 'blue',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'للخارج',
        data: timeSeries.map((point) =>
          point.lastExitState === 'Open_Exit' ? 1 : point.lastExitState === 'Traffic_Exit' ? 0.5 : 0
        ),
        borderColor: 'purple',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            if (value === 1) return 'فاتح';
            if (value === 0.5) return 'ازمة';
            return 'مغلق';
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        ticks: {
          callback: (tickValue) => {
            if (tickValue === 1) return 'فاتح';
            if (tickValue === 0.5) return 'ازمة';
            if (tickValue === 0) return 'مغلق';
            return ''; // Hide other ticks
          },
          stepSize: 0.5, // Only show the defined states
        },
        beginAtZero: true, // Ensure 0 is included
        suggestedMin: -0.1, // Add padding below the lowest state
        suggestedMax: 1.1, // Add padding above the highest state
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  return (
    <div className="time-series-widget">
      <Line data={data} options={options} />
    </div>
  );
};

export default TimeSeriesWidget;
