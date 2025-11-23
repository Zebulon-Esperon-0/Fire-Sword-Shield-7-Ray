import React, { useState, useEffect } from 'react';
import { base44 } from '../services/mockData';
import { CalendarEvent } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
        const allEvents = await base44.entities.CalendarEvent.list();
        setEvents(allEvents);
    };
    loadEvents();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Event Calendar</h1>
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-300">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg w-32 text-center select-none text-brand-gold">
                {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-300">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-slate-500 uppercase tracking-wide">
                {day}
            </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4 auto-rows-fr">
        {days.map((day) => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day));
            
            return (
                <div 
                    key={day.toString()} 
                    className={`min-h-[140px] rounded-xl border p-3 transition-all
                        ${isSameMonth(day, currentDate) 
                            ? 'bg-white/5 border-white/5 hover:border-white/20' 
                            : 'bg-transparent border-transparent opacity-30'}
                        ${isSameDay(day, new Date()) ? 'ring-2 ring-brand-gold bg-brand-gold/5' : ''}
                    `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-brand-gold' : 'text-slate-400'}`}>
                            {format(day, 'd')}
                        </span>
                    </div>
                    
                    <div className="space-y-1">
                        {dayEvents.map(event => (
                            <div 
                                key={event.id} 
                                className={`text-xs p-1.5 rounded border border-l-4 truncate cursor-pointer transition-transform hover:scale-105
                                    ${event.type === 'raid' ? 'bg-brand-red/10 border-brand-red/30 border-l-brand-red text-red-200' : 
                                      event.type === 'meeting' ? 'bg-brand-blue/10 border-brand-blue/30 border-l-brand-blue text-blue-200' :
                                      'bg-slate-700/50 border-slate-600 border-l-slate-500 text-slate-300'}
                                `}
                            >
                                {event.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Event List Detailed View */}
      <div className="mt-12 glass-effect rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Upcoming in {format(currentDate, 'MMMM')}</h3>
        <div className="space-y-4">
            {events.filter(e => isSameMonth(new Date(e.start_time), currentDate)).map(event => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-center px-4 border-r border-white/10">
                        <div className="text-sm font-bold text-slate-500 uppercase">{format(new Date(event.start_time), 'EEE')}</div>
                        <div className="text-2xl font-bold text-white">{format(new Date(event.start_time), 'd')}</div>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white">{event.title}</h4>
                        <p className="text-slate-400 text-sm">{event.description}</p>
                    </div>
                    <div className="text-right text-sm text-slate-400 space-y-1">
                        <div className="flex items-center justify-end gap-2">
                            <MapPin className="w-4 h-4 text-brand-green" /> {event.location}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <Users className="w-4 h-4 text-brand-blue" /> {event.attendees} Attending
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}