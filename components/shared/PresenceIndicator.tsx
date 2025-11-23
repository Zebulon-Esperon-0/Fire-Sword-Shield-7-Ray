import React from 'react';

interface PresenceIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md';
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ status, size = 'sm' }) => {
  const colorMap = {
    online: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    offline: 'bg-slate-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className={`rounded-full ${sizeClass} ${colorMap[status]} transition-all duration-300`} />
  );
};

export default PresenceIndicator;