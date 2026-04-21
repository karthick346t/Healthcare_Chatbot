import React, { useState, useEffect } from 'react';

import { MdRefresh, MdCheckCircle, MdPayment, MdPlayCircleOutline, MdDoneAll, MdEventAvailable } from 'react-icons/md';
import { fetchWithAuth } from '../../services/authApi';

export default function StaffAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/appointments/today');
      setAppointments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'pending' || currentStatus === 'scheduled') nextStatus = 'checked_in';
    else if (currentStatus === 'checked_in') nextStatus = 'in_consultation';
    else if (currentStatus === 'in_consultation') nextStatus = 'completed';
    else return;

    try {
      await fetchWithAuth(`/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      await fetchWithAuth(`/api/appointments/${id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' })
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert('Failed to update payment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'scheduled':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">Pending</span>;
      case 'checked_in':
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">Checked In</span>;
      case 'in_consultation':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">In Consultant</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider">Completed</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const getPaymentBadge = (paymentStatus: string, id: string) => {
    if (paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-100/50">
          <MdCheckCircle /> Paid
        </span>
      );
    }
    return (
      <button 
        onClick={() => markAsPaid(id)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg transition-colors border border-rose-200 text-xs shadow-sm hover:shadow"
      >
        <MdPayment /> Collect Pay
      </button>
    );
  };

  const getActionBtn = (status: string, id: string) => {
    if (status === 'pending' || status === 'scheduled') {
      return (
        <button onClick={() => updateStatus(id, status)} className="w-[140px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow flex items-center justify-center gap-1 transition-all hover:-translate-y-0.5">
          <MdCheckCircle /> Check In
        </button>
      );
    }
    if (status === 'checked_in') {
      return (
        <button onClick={() => updateStatus(id, status)} className="w-[140px] px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow flex items-center justify-center gap-1 transition-all hover:-translate-y-0.5">
          <MdPlayCircleOutline /> Start Consult
        </button>
      );
    }
    if (status === 'in_consultation') {
      return (
        <button onClick={() => updateStatus(id, status)} className="w-[140px] px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold shadow flex items-center justify-center gap-1 transition-all hover:-translate-y-0.5">
          <MdDoneAll /> Mark Done
        </button>
      );
    }
    return <div className="w-[140px] text-center text-sm text-neutral-400 font-medium">No further action</div>;
  };

  const filteredAppointments = appointments.filter((a: any) => 
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.doctorId?.name && a.doctorId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pb-6">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-800 dark:text-neutral-100 drop-shadow-sm">Live Patient Queue</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium text-lg">Manage today's appointments and check-ins.</p>
        </div>
        <div className="flex items-center gap-6">
          <input 
            type="text" 
            placeholder="Search patient or doctor..." 
            className="w-72 px-5 py-4 bg-neu dark:bg-neu-dark rounded-2xl shadow-neu-in dark:shadow-neu-in-dark text-neutral-800 dark:text-neutral-100 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-themeAccent-400/50 transition-all border-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={fetchAppointments}
            className="px-6 py-4 bg-neu dark:bg-neu-dark text-themeAccent-600 font-bold rounded-2xl shadow-neu-out dark:shadow-neu-out-dark hover:shadow-neu-in dark:shadow-neu-in-dark active:scale-95 transition-all flex items-center gap-2 group border-none"
          >
            <MdRefresh className={`text-2xl ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 bg-neu dark:bg-neu-dark rounded-3xl p-6 shadow-neu-out dark:shadow-neu-out-dark flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1 rounded-2xl shadow-neu-in dark:shadow-neu-in-dark bg-neu dark:bg-neu-dark">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neu dark:bg-neu-dark sticky top-0 z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-8 py-6 font-bold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest pl-10 border-b border-gray-200/50">Token</th>
                <th className="px-6 py-6 font-bold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-b border-gray-200/50">Patient</th>
                <th className="px-6 py-6 font-bold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-b border-gray-200/50">Doctor</th>
                <th className="px-6 py-6 font-bold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-b border-gray-200/50">Type</th>
                <th className="px-6 py-6 font-bold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-b border-gray-200/50">Status</th>
                <th className="px-6 py-6 font-bold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-b border-gray-200/50">Payment</th>
                <th className="px-6 py-6 font-bold text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-widest text-right pr-10 border-b border-gray-200/50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {loading && appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-neutral-400">
                      <div className="w-10 h-10 border-4 border-themeAccent-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold tracking-wide">Loading queue...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center text-neutral-400 bg-transparent">
                    <MdEventAvailable className="text-6xl mx-auto mb-4 opacity-30 drop-shadow-sm" />
                    <span className="font-bold text-lg">No appointments found.</span>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((a: any) => (
                  <tr key={a._id} className="hover:bg-white dark:bg-[#1f232b]/40 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap pl-10">
                      <div className="w-12 h-12 rounded-2xl bg-neu dark:bg-neu-dark shadow-neu-in-sm dark:shadow-neu-in-sm-dark flex items-center justify-center font-black text-themeAccent-600 text-lg">
                        {a.tokenNumber}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-neutral-800 dark:text-neutral-100 text-lg group-hover:text-themeAccent-700 transition-colors">{a.patientName}</div>
                      <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1">{a.patientAge}y • {a.patientGender}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap font-semibold text-neutral-600 dark:text-neutral-300">
                      {a.doctorId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {a.userId ? (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm">App</span>
                      ) : (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm">Walk-in</span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {getStatusBadge(a.status)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {getPaymentBadge(a.paymentStatus, a._id)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap flex justify-end pr-10 items-center h-[90px]">
                      {getActionBtn(a.status, a._id)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
