import React, { useState } from 'react';
import './CheckpointTable.css';

interface CheckpointTableProps {
  checkpointCounts: Record<string, number>;
}

const CheckpointTable: React.FC<CheckpointTableProps> = ({ checkpointCounts }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sort and filter checkpoints based on the search term
  const checkpoints = Object.entries(checkpointCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([checkpoint]) => checkpoint.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      {/* Search Box */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 ابحث عن حاجز..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-box"
        />
      </div>

      {/* Checkpoint Grid */}
      <div className="checkpoint-grid">
        {checkpoints.slice(0, 25).map(([checkpoint, count]) => (
          <div key={checkpoint} className="checkpoint-card-2">
            <h3 className="checkpoint-name">{checkpoint}</h3>
            <p className="checkpoint-count">{count} بلاغات</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckpointTable;
