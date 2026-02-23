import React, { useState, useEffect } from 'react';

import { MdBlock, MdEventBusy, MdClose } from 'react-icons/md';

export default function StaffDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Modal State
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctors');
      setDoctors(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    if (!window.confirm(`Are you sure you want to block out ${selectedDoctor.name} for ${blockDate}? All scheduled appointments on this day will be cancelled and patients notified via email.`)) {
      return;
    }

    try {
      setIsBlocking(true);
      const res = await fetch(`/api/doctors/${selectedDoctor._id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: blockDate,
          startTime: 'ALL_DAY', // Simple mock implementation handles whole day
          endTime: 'ALL_DAY',
          reason: blockReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to block doctor slot');
      alert(data.message);
      setSelectedDoctor(null);
      setBlockReason('');
      fetchDoctors();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to block doctor slot');
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-800 drop-shadow-sm">Doctor Availability Management</h1>
          <p className="text-neutral-500 mt-2 font-medium text-lg">Handle emergencies, block slots, and automatically notify patients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#eef2f5] rounded-3xl p-6 h-48 animate-pulse shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff]"></div>
          ))
        ) : (
          doctors.map((doctor: any) => (
            <div key={doctor._id} className="bg-[#eef2f5] rounded-3xl p-8 shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] flex flex-col hover:-translate-y-1 transition-transform group">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center overflow-hidden shrink-0">
                  {doctor.image ? (
                     <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-2xl font-black text-teal-600 drop-shadow-sm">{doctor.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-800 leading-tight mb-1">{doctor.name}</h3>
                  <p className="text-xs font-black text-teal-600 uppercase tracking-widest">{doctor.specialty}</p>
                </div>
              </div>

              <div className="text-sm font-medium text-neutral-500 mb-6 flex-grow truncate px-2" title={doctor.hospitalId?.name}>
                {doctor.hospitalId?.name || "Unknown Hospital"}
              </div>

              <button 
                onClick={() => setSelectedDoctor(doctor)}
                className="w-full py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] hover:shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff] text-rose-500 font-black tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:text-rose-600 border-none"
              >
                <MdBlock className="text-xl" /> Block Out Day
              </button>
            </div>
          ))
        )}
      </div>

      {/* Block Out Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-neutral-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#eef2f5] rounded-3xl p-8 max-w-md w-full shadow-[20px_20px_60px_#c8d0e7,-20px_-20px_60px_#ffffff] border border-white/50 relative">
            <button 
              onClick={() => setSelectedDoctor(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors"
            >
              <MdClose className="text-2xl" />
            </button>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] bg-[#eef2f5] flex items-center justify-center text-rose-500">
                  <MdEventBusy className="text-3xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-neutral-800 tracking-tight">Block Availability</h2>
                  <p className="text-neutral-500 font-medium text-sm mt-0.5">{selectedDoctor.name}</p>
                </div>
              </div>
              <p className="text-neutral-500 font-medium text-sm">
                Blocking this date will automatically cancel all existing appointments and notify patients via email.
              </p>
            </div>

            <form onSubmit={handleBlockSlot} className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Date to Block</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]} // Cannot block past days
                  className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-all border-none"
                  value={blockDate}
                  onChange={e => setBlockDate(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Reason <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Emergency, Personal Day..."
                  className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-all border-none"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isBlocking}
                  className="w-full py-5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white text-lg font-black tracking-wide rounded-2xl transition-all shadow-xl hover:shadow-rose-500/40 flex items-center justify-center gap-3 disabled:opacity-75 transform active:scale-[0.98]"
                >
                  {isBlocking ? "Processing & Notifying..." : "Confirm Block & Cancel Appointments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
