import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import './LiveMessages.css';
import { Data_API_Base_URL } from '../config';

interface Message {
  checkpoint: string;
  sentTime: string;
  group: string;
  isReply: boolean;
  isAdmin: boolean;
  text: String;
  messageId: number;
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

const uniqueByMessageId = (array: Message[]) => {
  const seen = new Set();
  return array.filter(item => {
    const value = item["messageId"];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

const LiveMessages: React.FC = () => {
  const cities = [
    'نابلس', 'رام الله', 'بيت لحم', 'الخليل', 'جنين', 'طولكرم',
    'طوباس', 'سلفيت', 'قلقيلية', 'اريحا',
  ];

  const [city, setCity] = useState<string>(cities[0]);
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchLastMessages = async (firstRun = false) => {
      try {
        var from = firstRun ?
          new Date(new Date().getTime() -  30 * 60 * 1000).toISOString() :
          new Date(new Date().getTime() -  15 * 1000).toISOString();

        var to = new Date(new Date().getTime()).toISOString();

        firstRun && setLoading(true);
        const response = await fetch(`${Data_API_Base_URL}/last-messages/${city}?from=${from}&to=${to}`);
        const result = (await response.json()).data || [];
        
        setData((prevData) => uniqueByMessageId([...result, ...prevData]));
        firstRun && setLoading(false);
      } catch (error: any) {
        console.error('Error fetching messages data:', error);
      }
    };

    if (city) {
      fetchLastMessages(true);
      intervalId = setInterval(() => {
        fetchLastMessages()
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId); // Cleanup interval on unmount
    };
  }, [city]);

  var content = loading ? <div> ...جاري التحميل </div> : data.length ? 
    <div className="checkpoint-list">
      {data.map((message, index) => (
        <div key={`${message.checkpoint}-${index}`} className="message-card">
          <div className="message-header">
            <span className={`badge ${message.isAdmin ? 'admin-badge' : 'user-badge'}`}>
              {message.isAdmin ? 'Admin' : 'User'}
            </span>
            <span className="sent-time">{timeAgo(message.sentTime)}</span>
          </div>
          <div className="message-content">
            <p>{message.text}</p>
          </div>
        </div>
      ))}
    </div> : <div>لا توجد بيانات</div>;

  return (
    <div className="CheckpointStatus">
      <Dropdown
        options={cities}
        value={city}
        onChange={(value: string) => {
          setData([]);
          setCity(value);
        }}
      />
      {content}
    </div>
  );
};

export default LiveMessages;
