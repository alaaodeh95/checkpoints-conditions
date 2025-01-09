import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import './CheckpointStatus.css';
import { Data_API_Base_URL } from '../config';

interface Checkpoint {
  checkpoint: string;
  enterState: string;
  exitState: string;
  enterUpdateTime: string;
  exitUpdateTime: string;
}

const timeAgo = (dateString: string): string => {
  const now = new Date();
  const updatedTime = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - updatedTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} ثواني`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} دقيقة`;
  } else {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ساعة`;
  }
};

const CheckpointStatus: React.FC = () => {
  const cities = [
    'نابلس', 'رام الله', 'بيت لحم', 'الخليل', 'جنين', 'طولكرم',
    'طوباس', 'سلفيت', 'قلقيلية', 'اريحا',
  ];

  const [city, setCity] = useState<string>(cities[0]);
  const [data, setData] = useState<Checkpoint[]>([]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchLastCheckpoints = async () => {
      try {
        const response = await fetch(`${Data_API_Base_URL}/last-checkpoints/${city}`);
        const result = await response.json();
        setData(result.checkpoints.sort((a: Checkpoint, b: Checkpoint) =>
          b.enterUpdateTime.localeCompare(a.enterUpdateTime) || b.exitUpdateTime.localeCompare(a.exitUpdateTime)
        ));
      } catch (error: any) {
        console.error('Error fetching checkpoint data:', error);
      }
    };

    if (city) {
      fetchLastCheckpoints();
      intervalId = setInterval(fetchLastCheckpoints, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId); // Cleanup interval on unmount
    };
  }, [city]);

  if (!data.length) {
    return <div> ...جاري التحميل </div>;
  }

  return (
    <div className="CheckpointStatus">
      <Dropdown
        options={cities}
        value={city}
        onChange={(value: string) => setCity(value)}
      />
      <div className="checkpoint-list">
        {data.map((checkpoint) => (
          <div key={checkpoint.checkpoint} className="checkpoint-card">
            <h3>{checkpoint.checkpoint}</h3>
            <div className="state-section">
              <div>
                 الداخل : {checkpoint.enterState || "-"}
                <br />
                <small>اخر تحديث: {(checkpoint.enterState && timeAgo(checkpoint.enterUpdateTime))|| "-"}</small>
              </div>
              <div>
                الخارج : {checkpoint.exitState || "-"}
                <br />
                <small>اخر تحديث: {(checkpoint.exitState && timeAgo(checkpoint.exitUpdateTime)) || "-"}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckpointStatus;
