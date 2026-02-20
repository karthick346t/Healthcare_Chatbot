import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiCalendar, HiClock, HiLocationMarker, HiOutlineClipboardList, HiX, HiCheckCircle } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyAppointments() {
    const { user, token } = useAuth();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (user?.userId || (user as any)?._id) {
            fetchAppointments();
        }
    }, [user, token]);

    const fetchAppointments = async () => {
        try {
            const userId = user?.userId || (user as any)?._id;
            const res = await fetch(`/api/appointments/my-appointments?userId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setAppointments(data);
            }
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

        setActionLoading(id);
        try {
            const res = await fetch(`/api/appointments/${id}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAppointments(); // Refresh list
            } else {
                alert("Failed to cancel appointment");
            }
        } catch (error) {
            console.error("Error cancelling", error);
        } finally {
            setActionLoading(null);
        }
    };

    const now = new Date();
    const upcomingAppointments = appointments.filter(a => new Date(a.appointmentDate) >= now && a.status !== 'cancelled').reverse(); // Closest first
    const pastAppointments = appointments.filter(a => new Date(a.appointmentDate) < now || a.status === 'cancelled');

    const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-800 flex items-center gap-3">
                        <span className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                            <HiOutlineClipboardList />
                        </span>
                        My Appointments
                    </h1>
                    <p className="text-neutral-500 mt-2 ml-16">
                        Manage your upcoming visits and view your medical history.
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`pb-4 px-4 font-bold text-sm transition-all relative ${activeTab === 'upcoming' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Upcoming
                        <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                            {upcomingAppointments.length}
                        </span>
                        {activeTab === 'upcoming' && (
                            <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`pb-4 px-4 font-bold text-sm transition-all relative ${activeTab === 'past' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        History & Cancelled
                        {activeTab === 'past' && (
                            <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
                        )}
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 text-neutral-400 italic">Loading your schedule...</div>
                    ) : displayedAppointments.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-2xl">
                                <HiCalendar />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-700">No appointments found</h3>
                            <p className="text-neutral-400 text-sm">You verify don't have any {activeTab} appointments.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode='popLayout'>
                            {displayedAppointments.map((appt) => (
                                <motion.div
                                    key={appt._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 group hover:shadow-md transition-all"
                                >
                                    {/* Date Logic */}
                                    <div className={`
                                        flex flex-col items-center justify-center p-4 rounded-2xl min-w-[100px]
                                        ${appt.status === 'cancelled' ? 'bg-red-50 text-red-400' : 'bg-indigo-50 text-indigo-600'}
                                    `}>
                                        <span className="text-xs font-bold uppercase tracking-wider">{new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-3xl font-black">{new Date(appt.appointmentDate).getDate()}</span>
                                        <span className="text-xs opacity-60">{new Date(appt.appointmentDate).getFullYear()}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-neutral-800">{appt.doctorName || appt.doctorId?.name}</h3>
                                                <p className="text-indigo-500 text-sm font-medium">{appt.doctorId?.specialty || "Specialist"}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {appt.status === 'confirmed' && <HiCheckCircle />}
                                                {appt.status === 'cancelled' && <HiX />}
                                                {appt.status}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="flex items-center gap-3 text-neutral-500 text-sm">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <HiLocationMarker />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-neutral-700">{appt.hospitalName || appt.hospitalId?.name}</p>
                                                    <p className="text-xs truncate max-w-[200px]">{appt.hospitalId?.location || "Main Campus"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-neutral-500 text-sm">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <HiClock />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-neutral-700">Token #{appt.tokenNumber}</p>
                                                    <p className="text-xs">Est. Wait: 20 mins</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col justify-center border-l border-gray-100 pl-6 gap-2">
                                        {appt.status === 'confirmed' && new Date(appt.appointmentDate) >= now ? (
                                            <button
                                                onClick={() => handleCancel(appt._id)}
                                                disabled={actionLoading === appt._id}
                                                className="px-4 py-2 rounded-xl bg-white border border-red-100 text-red-500 text-sm font-bold hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                                            >
                                                {actionLoading === appt._id ? 'Cancelling...' : 'Cancel Visit'}
                                            </button>
                                        ) : (
                                            <button disabled className="px-4 py-2 rounded-xl bg-gray-50 text-gray-300 text-sm font-bold cursor-not-allowed">
                                                {appt.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                            </button>
                                        )}
                                        {appt.status === 'confirmed' && (
                                            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                                                View Details
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
