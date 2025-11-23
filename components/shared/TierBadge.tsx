import React, { useState } from 'react';
import { Shield, Crown, Star } from 'lucide-react';

interface TierBadgeProps {
  tier: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', showName = false }) => {
  let colorClass = '';
  let Icon = Shield;
  let name = 'Novice';

  switch (tier) {
    case 3:
      colorClass = 'text-brand-gold bg-brand-gold/10 border-brand-gold/20';
      Icon = Crown;
      name = 'Legend';
      break;
    case 2:
      colorClass = 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
      Icon = Star;
      name = 'Veteran';
      break;
    default:
      colorClass = 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      Icon = Shield;
      name = 'Recruit';
  }

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border ${colorClass}`}>
      <Icon className={sizeClasses[size]} />
      {showName && <span className="text-xs font-bold uppercase tracking-wider">{name}</span>}
    </div>
  );
};

export default TierBadge;