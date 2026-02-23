import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { MdPersonAdd, MdCheckCircle } from 'react-icons/md';

export default function WalkInBooking() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    patientAddress: '',
    problem: '',
    hospitalId: '',
    doctorId: ''
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await fetch('/api/appointments/hospitals');
      setHospitals(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleHospitalChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hid = e.target.value;
    setFormData({ ...formData, hospitalId: hid, doctorId: '' });
    if (hid) {
      try {
        const res = await fetch(`/api/appointments/hospitals/${hid}/doctors`);
        setDoctors(await res.json());
      } catch (err) {
        console.error(err);
      }
    } else {
      setDoctors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/appointments/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/staff/appointments');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to book walk-in patient.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#eef2f5] rounded-3xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] max-w-2xl mx-auto mt-10">
        <MdCheckCircle className="text-7xl text-green-500 mb-6 drop-shadow-md" />
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Walk-in Booked Successfully!</h2>
        <p className="text-neutral-500 mt-3 font-medium text-lg">The patient has been added to the live queue.</p>
        <p className="text-sm text-teal-600 mt-6 font-bold animate-pulse">Redirecting to Live Queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-neutral-800 drop-shadow-sm">Walk-in Booking</h1>
        <p className="text-neutral-500 mt-2 font-medium text-lg">Quickly register a patient directly to the queue.</p>
      </div>

      <div className="bg-[#eef2f5] rounded-3xl p-10 shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff]">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Patient Full Name</label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all border-none"
                placeholder="John Doe"
                value={formData.patientName}
                onChange={e => setFormData({ ...formData, patientName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Age</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all border-none"
                  placeholder="30"
                  value={formData.patientAge}
                  onChange={e => setFormData({ ...formData, patientAge: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Gender</label>
                <select
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all border-none appearance-none cursor-pointer"
                  value={formData.patientGender}
                  onChange={e => setFormData({ ...formData, patientGender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Address / Contact Info</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all border-none"
              placeholder="123 Main St, 555-0192"
              value={formData.patientAddress}
              onChange={e => setFormData({ ...formData, patientAddress: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Reason for Visit / Problem</label>
            <textarea
              required
              rows={3}
              className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all border-none resize-none"
              placeholder="Fever, headache, and cough..."
              value={formData.problem}
              onChange={e => setFormData({ ...formData, problem: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 mt-4 border-t border-gray-200/50">
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Select Hospital / Branch</label>
              <select
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all border-none appearance-none cursor-pointer"
                value={formData.hospitalId}
                onChange={handleHospitalChange}
              >
                <option value="">-- Choose Hospital --</option>
                {hospitals.map((h: any) => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Assign Doctor</label>
              <select
                required
                disabled={!formData.hospitalId}
                className="w-full px-5 py-4 rounded-2xl bg-[#eef2f5] shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all border-none appearance-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                value={formData.doctorId}
                onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d: any) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-lg font-black tracking-wide rounded-2xl transition-all shadow-xl hover:shadow-teal-500/40 flex items-center justify-center gap-3 disabled:opacity-75 transform active:scale-[0.98]"
            >
              {loading ? (
                <span>Adding to Queue...</span>
              ) : (
                <>
                  <MdPersonAdd className="text-2xl" />
                  <span>Book & Add to Queue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
