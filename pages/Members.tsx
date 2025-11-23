import React, { useState, useEffect } from 'react';
import { base44 } from '../services/mockData';
import { User } from '../types';
import TierBadge from '../components/shared/TierBadge';
import PresenceIndicator from '../components/shared/PresenceIndicator';
import { Search, Filter } from 'lucide-react';

export default function Members() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    base44.entities.User.list().then(setUsers);
  }, []);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(filter.toLowerCase()) || 
    u.full_name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Guild Roster</h1>
                <p className="text-slate-400 mt-1">Manage and view all {users.length} members</p>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search members..." 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-brand-gold focus:border-brand-gold focus:outline-none w-64 transition-all"
                    />
                </div>
                <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                    <Filter className="w-4 h-4 text-slate-300" />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
                <div key={user.id} className="glass-effect border border-white/5 p-5 rounded-xl hover:border-brand-gold/20 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center text-lg font-bold text-white relative shadow-lg">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.username.substring(0, 2).toUpperCase()
                                )}
                                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 border-2 border-brand-dark rounded-full">
                                    <PresenceIndicator status={user.presence_status} size="sm" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white group-hover:text-brand-gold transition-colors">{user.full_name}</h3>
                                <p className="text-xs text-slate-500">@{user.username}</p>
                            </div>
                        </div>
                        <TierBadge tier={user.tier_level} size="sm" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Role</span>
                            <span className="text-slate-300">{user.role}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Joined</span>
                            <span className="text-slate-300">{new Date(user.joined_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Weekly Hours</span>
                            <span className="text-slate-300">{user.hours_this_week}h</span>
                        </div>
                    </div>

                    {user.bio && (
                        <p className="text-xs text-slate-400 italic border-t border-white/5 pt-3">
                            "{user.bio}"
                        </p>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}