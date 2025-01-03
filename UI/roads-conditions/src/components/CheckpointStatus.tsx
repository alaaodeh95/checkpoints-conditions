import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import './CheckpointStatus.css';

interface Checkpoint {
  checkpoint: string;
  enterState: string;
  exitState: string;
  enterUpdateTime: string;
  exitUpdateTime: string;
}

const API_BASE_URL = 'http://localhost:3001';

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
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    let abortController = new AbortController();

    const fetchLastCheckpoints = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/last-checkpoints/${city}`, {
          signal: abortController.signal,
        });
        const result = await response.json();
        setData(
          (result.checkpoints || []).sort((a: Checkpoint, b: Checkpoint) =>
            a.checkpoint.localeCompare(b.checkpoint)
          )
        );
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching checkpoint data:', error);
        }
      }
    };

    fetchLastCheckpoints();
    const interval = window.setInterval(fetchLastCheckpoints, 2000);
    setRefreshInterval(interval);

    return () => {
      abortController.abort();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [city]);

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
