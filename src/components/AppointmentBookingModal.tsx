import React, { useState } from 'react';
import { Calendar, Clock, X, User, Mail } from 'lucide-react';
import { Appointment } from '../types';
import { api } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  onSuccess: (appointment: Appointment) => void;
}

export function AppointmentBookingModal({ isOpen, onClose, profileId, onSuccess }: Props) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date || !time || !name || !email) {
      setError('Please fill in all fields');
      return;
    }

    const selectedDate = new Date(date);
    const day = selectedDate.getDay();
    if (day === 0) {
      setError('Appointments are only available Monday to Saturday');
      return;
    }

    try {
      setLoading(true);
      const res = await api.appointments.book(profileId, date, time, name, email);
      onSuccess(res);
      
      // Reset
      setDate('');
      setTime('');
      setName('');
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Min date is today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Book Appointment
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Date (Mon-Sat)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/50 text-white border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-black/50 text-white border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 text-white border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Your Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 text-white border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
