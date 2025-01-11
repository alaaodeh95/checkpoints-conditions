import React, { useEffect, useState } from 'react';
import Dropdown from './Dropdown';
import CheckpointTable from './CheckpointTable';
import HourlyDataChart from './HourlyDataChart';
import DirectionPieChart from './DirectionPieChart';
import AdminDonutChart from './AdminDonutChart';
import './GeneralWidgets.css';
import BarChart from './BarChart';
import { Data_API_Base_URL } from '../config';

const GeneralWidgets: React.FC = () => {
  const [widgets, setWidgets] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'اخر يوم' | 'اخر ٧ ايام' | 'اخر ١٤ يوم' | 'اختر'>('اخر يوم');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

  // Fetch widget data from API
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchData = async (fromInterval: boolean) => {
      try {
        !fromInterval && setLoading(true);
        const response = await fetch(`${Data_API_Base_URL}/widgets?from=${from}&to=${to}`);
        const data = await response.json();
        setWidgets(data || null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching widget data:', error);
      }
    };

    // Fetch data immediately and refresh every 2 seconds
    if (from && to) {
      fetchData(false);
      intervalId = setInterval(() => fetchData(true), 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId); // Cleanup interval on unmount
    };
  }, [from, to]);

  var content = loading ? <div> ...جاري التحميل </div> : 
    <>
    <div className="widget-row">
      <div className="widget">
        <h2>بيانات الحواجز</h2>
        <CheckpointTable checkpointCounts={widgets.checkpointCounts} />
      </div>
      <div className="widget">
        <h2>تفاصيل اوقات البلاغات</h2>
        <HourlyDataChart hourlyData={widgets.hourlyData} />
      </div>
    </div>
    <div className="widget-row">
      <div className="widget" style={{ flex: '0 0 46%' }}>
        <h2>البلاغات لحواجز المدن</h2>
        <BarChart counts={widgets.cityCounts} label={"المدن"} />
      </div>
      <div className="widget" style={{ flex: '0 0 auto' }}>
        <h2>بلاغات مدراء المجموعات والاعضاء</h2>
        <AdminDonutChart
          admin={widgets.adminCounts.admin}
          nonAdmin={widgets.adminCounts.nonAdmin}
        />
      </div>
      <div className="widget" style={{ flex: '0 0 auto' }}>
        <h2>البلاغات باتجاه الحاجز</h2>
        <DirectionPieChart directionCounts={widgets.directionCounts} />
      </div>
    </div>
    <div className="widget-row">
      <div className="widget" style={{ flex: '0 0 50%' }}>
        <h2>البلاغات القادمة من كل مجموعة</h2>
        <BarChart counts={widgets.groupCounts} label={"المجموعات"} orientation='horizontal'/>
      </div>
    </div>
  </>;

  return (
    <div className="GeneralWidgets">
      <div className="control-panel">
        <Dropdown
          options={['اخر يوم', 'اخر ٧ ايام', 'اخر ١٤ يوم', 'اختر']}
          value={timeRange}
          onChange={(value) => setTimeRange(value as any)}
        />
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
      {content}
    </div>
  );
};

export default GeneralWidgets;
