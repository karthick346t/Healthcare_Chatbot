import React, { useState, useEffect } from 'react';
import { HiCheck, HiX, HiSearch, HiFilter } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';

export default function AdminAppointments() {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAppointments = async () => {
        try {
            const res = await fetch(`/api/admin/appointments?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setAppointments(data.appointments);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [filter, token]);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await fetch(`/api/admin/appointments/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            fetchAppointments();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredAppointments = appointments.filter(appt =>
        appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.doctorId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto text-neutral-800 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Appointment Management</h1>
                    <p className="text-neutral-500 text-sm mt-1">View and manage all appointments.</p>
                </div>
                <div className="flex items-center gap-3 bg-[#eef2f5] p-1.5 rounded-xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff]">
                    {['all', 'pending', 'confirmed', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                    ? 'bg-[#eef2f5] text-cyan-600 shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff]'
                                    : 'text-neutral-400 hover:text-cyan-600'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[#eef2f5] p-6 rounded-3xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] border-none overflow-hidden">
                <div className="p-4 mb-4 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients or doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#eef2f5] shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] border-none focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium text-sm text-neutral-700 placeholder:text-neutral-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] rounded-xl overflow-hidden">
                            <tr>
                                {['Patient', 'Doctor', 'Date', 'Type', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Loading...</td></tr>
                            ) : filteredAppointments.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-neutral-400">No appointments found.</td></tr>
                            ) : (
                                filteredAppointments.map((appt) => (
                                    <tr key={appt._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-semibold text-neutral-700">{appt.patientName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-neutral-800">{appt.doctorId?.name}</div>
                                            <div className="text-xs text-neutral-400">{appt.hospitalId?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {new Date(appt.appointmentDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 max-w-[150px] truncate">{appt.problem}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${appt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    appt.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {appt.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleStatusUpdate(appt._id, 'confirmed')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"><HiCheck /></button>
                                                    <button onClick={() => handleStatusUpdate(appt._id, 'cancelled')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"><HiX /></button>
                                                </div>
                                            )}
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
