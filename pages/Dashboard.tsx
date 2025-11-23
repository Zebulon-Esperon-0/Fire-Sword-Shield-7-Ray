import React, { useState, useEffect } from 'react';
import { base44 } from '../services/mockData';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Calendar,
  Users,
  Clock,
  Shield,
  ArrowRight,
  Sword
} from 'lucide-react';
import TierBadge from '../components/shared/TierBadge';
import PresenceIndicator from '../components/shared/PresenceIndicator';
import { format } from 'date-fns';
import { User, CalendarEvent, ChatMessage } from '../types';

const Card = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={`rounded-xl ${className}`}>{children}</div>
);

const CardHeader = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={`${className}`}>{children}</div>
);

const Button = ({ variant = 'default', size = 'default', className, children, ...props }: any) => {
  const variants: any = {
    ghost: 'hover:bg-white/5 text-slate-400 hover:text-white',
    default: 'bg-brand-blue hover:bg-blue-700 text-white'
  };
  const sizes: any = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2'
  };
  return (
    <button className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [currentUser, events, msgs, users] = await Promise.all([
            base44.auth.me(),
            base44.entities.CalendarEvent.list('-start_time', 3),
            base44.entities.Message.list('-created_date', 5),
            base44.entities.User.list()
        ]);

        setUser(currentUser);
        setUpcomingEvents(events.filter(e => new Date(e.start_time) > new Date()));
        setRecentMessages(msgs);
        setOnlineMembers(users.filter(u => u.presence_status === 'online'));
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Sword className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Active Members',
      value: onlineMembers.length,
      icon: Users,
      color: 'from-brand-green to-emerald-600',
      link: '/members'
    },
    {
      title: 'Upcoming Events',
      value: upcomingEvents.length,
      icon: Calendar,
      color: 'from-brand-blue to-blue-600',
      link: '/calendar'
    },
    {
      title: 'Your Tier',
      value: user.tier_level || 1,
      icon: Shield,
      color: 'from-brand-gold to-amber-600',
      link: '/profile'
    },
    {
      title: 'Hours This Week',
      value: user.hours_this_week || 0,
      icon: Clock,
      color: 'from-brand-red to-rose-600',
      link: '/profile'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl glass-effect p-8 border border-brand-blue/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-gold/10 to-brand-blue/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-12 h-12 text-brand-gold" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Greetings, {user.full_name || 'Member'}
              </h1>
              <p className="text-slate-400 mt-1">Welcome to the Guild Hall.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <TierBadge tier={user.tier_level || 1} size="md" showName />
            <span className="text-slate-500">•</span>
            <div className="flex items-center gap-2">
              <PresenceIndicator status="online" size="sm" />
              <span className="text-sm text-slate-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="glass-effect border border-white/5 hover:border-brand-gold/30 transition-all cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform shadow-lg shadow-black/30`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="glass-effect border border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-blue" />
                Upcoming Events
              </CardTitle>
              <Link to="/calendar">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {upcomingEvents.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-brand-blue/30"
                  >
                    <h4 className="font-medium text-white">{event.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {format(new Date(event.start_time), 'MMM d, yyyy • h:mm a')}
                    </p>
                    {event.location && (
                      <p className="text-xs text-brand-blue mt-1 flex items-center gap-1">
                        {event.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-effect border border-white/5">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-gold" />
                Recent Activity
              </CardTitle>
              <Link to="/chat">
                <Button variant="ghost" size="sm">
                  Join Chat <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {recentMessages.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No recent messages</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-brand-gold/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <TierBadge tier={msg.sender_tier || 1} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{msg.sender_name}</p>
                            <span className="text-xs text-slate-500">{format(new Date(msg.created_date), 'h:mm a')}</span>
                        </div>
                        <p className="text-sm text-slate-400 truncate mt-1">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}