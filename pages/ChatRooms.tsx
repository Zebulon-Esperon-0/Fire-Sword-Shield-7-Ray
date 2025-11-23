import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '../services/mockData';
import { ChatMessage, ChatChannel, User } from '../types';
import TierBadge from '../components/shared/TierBadge';
import { Send, Hash, Users, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatRooms() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
        const [user, chanList] = await Promise.all([
            base44.auth.me(),
            base44.entities.Channel.list()
        ]);
        setCurrentUser(user);
        setChannels(chanList);
    };
    init();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
        const msgs = await base44.entities.Message.getByChannel(activeChannel);
        setMessages(msgs);
    };
    loadMessages();
    // Polling simulation
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const tempText = inputText;
    setInputText(''); // Optimistic clear

    try {
        await base44.entities.Message.send(tempText, activeChannel, currentUser);
        const msgs = await base44.entities.Message.getByChannel(activeChannel);
        setMessages(msgs);
    } catch (err) {
        console.error("Failed to send", err);
        setInputText(tempText); // Restore if fail
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex rounded-2xl border border-white/5 overflow-hidden glass-effect shadow-2xl">
      {/* Sidebar - Channels */}
      <div className="w-64 bg-brand-dark/50 border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-white/5">
            <h2 className="font-bold text-brand-gold uppercase tracking-wider text-xs">Channels</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map(channel => (
                <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeChannel === channel.id 
                        ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                >
                    <Hash className="w-4 h-4 opacity-70" />
                    <span className="truncate">{channel.name}</span>
                </button>
            ))}
        </div>
        <div className="p-4 bg-black/20 border-t border-white/5">
            {currentUser && (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-black">
                        {currentUser.username.slice(0,2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
                        <p className="text-xs text-brand-green">Online</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-transparent">
        {/* Header */}
        <div className="h-14 px-4 border-b border-white/5 flex items-center justify-between bg-brand-dark/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-white">{channels.find(c => c.id === activeChannel)?.name}</span>
                <span className="text-slate-500 text-sm hidden sm:inline">
                    - {channels.find(c => c.id === activeChannel)?.description}
                </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
                <Users className="w-5 h-5 cursor-pointer hover:text-white" />
                <MoreHorizontal className="w-5 h-5 cursor-pointer hover:text-white" />
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 group">
                    <div className="mt-1 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                        <span className="font-bold text-brand-gold text-sm">
                            {msg.sender_name.charAt(0)}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-200 hover:underline cursor-pointer">
                                {msg.sender_name}
                            </span>
                            <TierBadge tier={msg.sender_tier} size="sm" />
                            <span className="text-xs text-slate-500">
                                {format(new Date(msg.created_date), 'h:mm a')}
                            </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mt-0.5">
                            {msg.content}
                        </p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-brand-dark/40 border-t border-white/5">
            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message #${activeChannel}...`}
                    className="w-full bg-black/20 text-slate-200 pl-4 pr-12 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue placeholder:text-slate-600 transition-all"
                />
                <button 
                    type="submit"
                    disabled={!inputText.trim()}
                    className="absolute right-2 top-2 p-1.5 bg-brand-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}