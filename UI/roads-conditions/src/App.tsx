import React, { useState } from 'react';
import CheckpointStatus from './components/CheckpointStatus';
import CheckpointWidgets from './components/CheckpointWidgets';
import GeneralWidgets from './components/GeneralWidgets';
import CheckpointPredictor from './components/CheckpointPredictor';

import './App.css';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

// Register the required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

function App() {
  const [activeTab, setActiveTab] = useState<'CheckpointStatus' | 'CheckpointWidgets' | 'GeneralWidgets' | 'Predict'>('CheckpointStatus');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.className = darkMode ? '' : 'dark-mode';
  };

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      <header>
        <h1>احوال الطرق الفلسطينية</h1>
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
        </button>
      </header>
      <div className="tabs">
        <button
          className={activeTab === 'CheckpointStatus' ? 'active' : ''}
          onClick={() => setActiveTab('CheckpointStatus')}
        >
          احوال الحواجز الآن
        </button>
        <button
          className={activeTab === 'CheckpointWidgets' ? 'active' : ''}
          onClick={() => setActiveTab('CheckpointWidgets')}
        >
          تحليل بيانات الحواجز
        </button>
        <button
          className={activeTab === 'GeneralWidgets' ? 'active' : ''}
          onClick={() => setActiveTab('GeneralWidgets')}
        >
          تحليل عام للبيانات
        </button>
        <button
          className={activeTab === 'Predict' ? 'active' : ''}
          onClick={() => setActiveTab('Predict')}
        >
          تنبأ حالة الحاجز
        </button>
      </div>
      <main>
        {activeTab === 'CheckpointStatus' && <CheckpointStatus />}
        {activeTab === 'CheckpointWidgets' && <CheckpointWidgets />}
        {activeTab === 'GeneralWidgets' && <GeneralWidgets />}
        {activeTab === 'Predict' && <CheckpointPredictor />}
      </main>
    </div>
  );
}

export default App;
