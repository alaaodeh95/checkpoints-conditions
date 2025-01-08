import React, { useEffect, useState } from 'react';
import Dropdown from './Dropdown';
import TimeSeriesWidget from './TimeSeriesWidget';
import AggregationWidget from './AggregationWidgets';
import PieChartWidget from './PieChartWidget';
import './CheckpointWidgets.css';
import { Data_API_Base_URL } from '../config';

const CheckpointWidgets: React.FC = () => {
  const [city, setCity] = useState<string>('نابلس');
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'اخر يوم' | 'اخر ٧ ايام' | 'اخر ١٤ يوم' | 'اختر'>('اخر ٧ ايام');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const cities = [
    'نابلس',
    'رام الله',
    'بيت لحم',
    'الخليل',
    'جنين',
    'طولكرم',
    'طوباس',
    'سلفيت',
    'قلقيلية',
    'اريحا',
  ];

  // Update from and to based on selected time range
  useEffect(() => {
    const now = new Date();
    if (timeRange === 'اخر يوم') {
      setFrom(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
      setTo(now.toISOString());
    } else if (timeRange === 'اخر ٧ ايام') {
      setFrom(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
      setTo(now.toISOString());
    } else if (timeRange === 'اخر ١٤ يوم') {
      setFrom(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString());
      setTo(now.toISOString());
    }
  }, [timeRange]);

  // Fetch checkpoints data
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchCheckpoints = async () => {
      try {
        const response = await fetch(`${Data_API_Base_URL}/checkpoints/${city}?from=${from}&to=${to}`);
        const data = await response.json();

        // Sort by timeSeries length in descending order
        const sortedCheckpoints = data.checkpoints.sort(
          (a: any, b: any) => b.timeSeries.length - a.timeSeries.length
        );

        setCheckpoints(sortedCheckpoints || []);
      } catch (error) {
        console.error('Error fetching checkpoint data:', error);
      }
    };

    // Fetch data immediately and every 2 seconds
    if (from && to) {
      fetchCheckpoints();
      intervalId = setInterval(fetchCheckpoints, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId); // Cleanup interval on unmount
    };
  }, [city, from, to]);

  return (
    <div className="CheckpointWidgets">
      <div className="control-panel">
        {/* City Selector */}
        <Dropdown options={cities} value={city} onChange={setCity} />
        {/* Time Range Selector */}
        <Dropdown
          options={['اخر يوم', 'اخر ٧ ايام', 'اخر ١٤ يوم', 'اختر']}
          value={timeRange}
          onChange={(value) => setTimeRange(value as any)}
        />
        {/* Custom Range Inputs */}
        {timeRange === 'اختر' && (
          <div className="custom-range">
            <label>
              From:
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(new Date(e.target.value).toISOString())}
              />
            </label>
            <label>
              To:
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(new Date(e.target.value).toISOString())}
              />
            </label>
          </div>
        )}
      </div>

      {/* Checkpoint Widgets */}
      {checkpoints.map((checkpoint) => (
        <div key={checkpoint.name} className="checkpoint-widget">
          <h2>{checkpoint.name}</h2>
          <div className="widget-row">
            <AggregationWidget aggregations={checkpoint.aggregations} />
            <TimeSeriesWidget timeSeries={checkpoint.timeSeries} />
            <PieChartWidget
              a={checkpoint.aggregations.adminCount}
              b={checkpoint.aggregations.nonAdminCount}
              labela='مدير مجموعة'
              labelb='عضو عادي'
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CheckpointWidgets;
