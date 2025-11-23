import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TierBadge from '../components/shared/TierBadge';
import { Save, User as UserIcon, Mail, Shield, Clock, Calendar, Camera, Edit2 } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
        setFormData({
            full_name: user.full_name,
            username: user.username,
            bio: user.bio || '',
            avatar_url: user.avatar_url || ''
        });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    await updateUser(formData);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-effect border border-white/5 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-brand-blue via-brand-dark to-brand-dark relative group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
            <div className="absolute bottom-0 left-8 transform translate-y-1/2">
                <div className="w-32 h-32 rounded-full bg-brand-dark p-1 border-4 border-brand-dark relative">
                     <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold text-slate-600 overflow-hidden relative">
                        {formData.avatar_url ? (
                            <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            user.username.charAt(0).toUpperCase()
                        )}
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-white/80" />
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>

        <div className="pt-20 pb-8 px-8">
            <div className="flex justify-between items-start">
                <div className="w-full mr-4">
                    {isEditing ? (
                        <div className="space-y-3 mb-2">
                             <input 
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="text-2xl font-bold text-white bg-white/10 border border-white/20 rounded px-2 py-1 w-full focus:outline-none focus:border-brand-gold"
                                placeholder="Display Name"
                             />
                             <div className="flex items-center gap-1 text-slate-400 text-lg">
                                @<input 
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-sm w-48 focus:outline-none focus:border-brand-gold"
                                    placeholder="Username"
                                />
                             </div>
                             <input 
                                name="avatar_url"
                                value={formData.avatar_url}
                                onChange={handleChange}
                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs w-full text-slate-400 focus:outline-none focus:border-brand-gold"
                                placeholder="Avatar URL (https://...)"
                             />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-white">{user.full_name}</h1>
                            <p className="text-slate-400 text-lg">@{user.username}</p>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <TierBadge tier={user.tier_level} size="lg" showName />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-blue/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-brand-blue" />
                        <span className="text-sm font-bold text-slate-400">Role</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{user.role}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-gold/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-brand-gold" />
                        <span className="text-sm font-bold text-slate-400">Joined</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{new Date(user.joined_date).getFullYear()}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-green/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-brand-green" />
                        <span className="text-sm font-bold text-slate-400">Hours/Week</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{user.hours_this_week}</p>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">About</h3>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-sm text-brand-gold hover:text-yellow-300 transition-colors">
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="text-sm text-slate-400 hover:text-white px-3 py-1">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-2 text-sm bg-brand-green text-white px-4 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    )}
                </div>
                {isEditing ? (
                    <textarea 
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-slate-200 focus:ring-1 focus:ring-brand-gold focus:outline-none resize-none"
                        placeholder="Tell us about your playstyle..."
                    />
                ) : (
                    <p className="text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 min-h-[80px]">
                        {user.bio || "No bio set yet."}
                    </p>
                )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-slate-400">
                        <UserIcon className="w-5 h-5" />
                        <span>ID: <span className="font-mono text-slate-500">{user.id}</span></span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Mail className="w-5 h-5" />
                        <span>Connected via Google</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}