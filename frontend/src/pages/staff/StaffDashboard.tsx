import React, { useState, useEffect } from 'react';

import { MdTrendingUp, MdPeople, MdEventAvailable, MdPayments } from 'react-icons/md';
import { fetchWithAuth } from '../../services/authApi';

const STATS = [
  { label: 'Total Walk-ins', value: '12', icon: MdTrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Patients in Queue', value: '3', icon: MdPeople, color: 'text-amber-600', bg: 'bg-amber-100' },
  { label: 'Consultations Completed', value: '18', icon: MdEventAvailable, color: 'text-themeAccent-600', bg: 'bg-themeAccent-100' },
  { label: 'Revenue Collected', value: '₹4,500', icon: MdPayments, color: 'text-green-600', bg: 'bg-green-100' },
];

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      // In a real scenario, this would aggregate data. We'll use the today's appointments API to calculate stats.
      const res = await fetchWithAuth('/api/appointments/today');
      const data = await res.json();
      setAppointments(data);

      const completed = data.filter((a: any) => a.status === 'completed').length;
      const inQueue = data.filter((a: any) => ['scheduled', 'checked_in', 'pending'].includes(a.status)).length;
      const walkIns = data.filter((a: any) => !a.userId).length;
      const revenue = data.filter((a: any) => a.paymentStatus === 'paid').length * 500; // Mock 500 per visit

      setStats([
        { label: 'Total Walk-ins', value: walkIns.toString(), icon: MdTrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Patients in Queue', value: inQueue.toString(), icon: MdPeople, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Completed Today', value: completed.toString(), icon: MdEventAvailable, color: 'text-themeAccent-600', bg: 'bg-themeAccent-100' },
        { label: 'Revenue Collected', value: `₹${revenue.toLocaleString()}`, icon: MdPayments, color: 'text-green-600', bg: 'bg-green-100' },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-800 dark:text-neutral-100 drop-shadow-sm">Staff Overview</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium text-lg">Live reception status and hospital queue metrics.</p>
        </div>
        <button 
          onClick={fetchTodayData}
          className="px-6 py-3 bg-neu dark:bg-neu-dark text-themeAccent-600 font-bold rounded-2xl shadow-neu-out dark:shadow-neu-out-dark hover:shadow-neu-in dark:shadow-neu-in-dark active:scale-95 transition-all flex items-center gap-2 group"
        >
          <span className="group-hover:rotate-180 transition-transform duration-500">↻</span>
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-neu dark:bg-neu-dark rounded-3xl p-6 h-36 shadow-neu-in dark:shadow-neu-in-dark"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-neu dark:bg-neu-dark p-6 rounded-3xl shadow-neu-out dark:shadow-neu-out-dark flex items-center gap-5 hover:-translate-y-1 transition-transform cursor-default">
              <div className={`p-4 rounded-xl shadow-neu-in-sm dark:shadow-neu-in-sm-dark bg-neu dark:bg-neu-dark ${stat.color}`}>
                <stat.icon className="text-3xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-neutral-700 dark:text-neutral-200">{stat.value}</span>
                <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Area */}
      <div className="bg-neu dark:bg-neu-dark rounded-3xl p-8 shadow-neu-in dark:shadow-neu-in-dark mb-10">
        <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mb-8 border-b border-gray-200 pb-4 inline-block">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a href="/staff/walk-in" className="flex flex-col items-center justify-center p-8 bg-neu dark:bg-neu-dark rounded-3xl shadow-neu-out dark:shadow-neu-out-dark hover:shadow-neu-in dark:shadow-neu-in-dark transition-all group">
            <div className="w-16 h-16 rounded-2xl shadow-neu-in-sm dark:shadow-neu-in-sm-dark bg-neu dark:bg-neu-dark flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MdTrendingUp className="text-3xl text-themeAccent-600" />
            </div>
            <span className="font-black text-lg text-neutral-700 dark:text-neutral-200 group-hover:text-themeAccent-700">New Walk-in</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">Register a patient manually</span>
          </a>
          <a href="/staff/appointments" className="flex flex-col items-center justify-center p-8 bg-neu dark:bg-neu-dark rounded-3xl shadow-neu-out dark:shadow-neu-out-dark hover:shadow-neu-in dark:shadow-neu-in-dark transition-all group">
            <div className="w-16 h-16 rounded-2xl shadow-neu-in-sm dark:shadow-neu-in-sm-dark bg-neu dark:bg-neu-dark flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MdPeople className="text-3xl text-amber-600" />
            </div>
            <span className="font-black text-lg text-neutral-700 dark:text-neutral-200 group-hover:text-amber-700">Manage Queue</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">Check-in and consultation statuses</span>
          </a>
          <a href="/staff/doctors" className="flex flex-col items-center justify-center p-8 bg-neu dark:bg-neu-dark rounded-3xl shadow-neu-out dark:shadow-neu-out-dark hover:shadow-neu-in dark:shadow-neu-in-dark transition-all group">
            <div className="w-16 h-16 rounded-2xl shadow-neu-in-sm dark:shadow-neu-in-sm-dark bg-neu dark:bg-neu-dark flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MdEventAvailable className="text-3xl text-rose-600" />
            </div>
            <span className="font-black text-lg text-neutral-700 dark:text-neutral-200 group-hover:text-rose-700">Doctor Availability</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">Block emergency slots</span>
          </a>
        </div>
      </div>
    </div>
  );
}
