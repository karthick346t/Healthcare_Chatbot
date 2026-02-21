import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    HiCalendar, HiClock, HiLocationMarker, HiOutlineClipboardList,
    HiX, HiCheckCircle, HiUser, HiExclamation, HiClipboardList, HiIdentification
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyAppointments() {
    const { user, token } = useAuth();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal states
    const [viewAppt, setViewAppt] = useState<any | null>(null);
    const [cancelAppt, setCancelAppt] = useState<any | null>(null);

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
            if (Array.isArray(data)) setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelAppt) return;
        setActionLoading(cancelAppt._id);
        try {
            const res = await fetch(`/api/appointments/${cancelAppt._id}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: user?.userId || (user as any)?._id })
            });
            if (res.ok) {
                setCancelAppt(null);
                fetchAppointments();
            } else {
                alert("Failed to cancel appointment. Please try again.");
            }
        } catch (error) {
            console.error("Error cancelling", error);
        } finally {
            setActionLoading(null);
        }
    };

    const now = new Date();
    const upcomingAppointments = appointments
        .filter(a => new Date(a.appointmentDate) >= now && a.status !== 'cancelled')
        .reverse();
    const pastAppointments = appointments
        .filter(a => new Date(a.appointmentDate) < now || a.status === 'cancelled');
    const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

    const statusColor = (status: string) => {
        if (status === 'confirmed') return 'bg-green-100 text-green-700';
        if (status === 'cancelled') return 'bg-red-100 text-red-700';
        return 'bg-orange-100 text-orange-700';
    };

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
                    {['upcoming', 'past'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'upcoming' | 'past')}
                            className={`pb-4 px-4 font-bold text-sm transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab === 'upcoming' ? 'Upcoming' : 'History & Cancelled'}
                            {tab === 'upcoming' && (
                                <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                                    {upcomingAppointments.length}
                                </span>
                            )}
                            {activeTab === tab && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Appointment List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 text-neutral-400 italic">Loading your schedule...</div>
                    ) : displayedAppointments.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-2xl">
                                <HiCalendar />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-700">No appointments found</h3>
                            <p className="text-neutral-400 text-sm">You don't have any {activeTab} appointments.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode='popLayout'>
                            {displayedAppointments.map((appt) => (
                                <motion.div
                                    key={appt._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all"
                                >
                                    {/* Date Block */}
                                    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[100px] ${appt.status === 'cancelled' ? 'bg-red-50 text-red-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="text-3xl font-black">
                                            {new Date(appt.appointmentDate).getDate()}
                                        </span>
                                        <span className="text-xs opacity-60">
                                            {new Date(appt.appointmentDate).getFullYear()}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-neutral-800">
                                                    {appt.doctorId?.name || appt.doctorName || 'Doctor'}
                                                </h3>
                                                <p className="text-indigo-500 text-sm font-medium">
                                                    {appt.doctorId?.specialty || 'Specialist'}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${statusColor(appt.status)}`}>
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
                                                    <p className="font-bold text-neutral-700">{appt.hospitalId?.name || appt.hospitalName}</p>
                                                    <p className="text-xs truncate max-w-[200px]">{appt.hospitalId?.location || 'Main Campus'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-neutral-500 text-sm">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <HiClock />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-neutral-700">Token #{appt.tokenNumber}</p>
                                                    <p className="text-xs">Est. Wait: ~{appt.tokenNumber * 20} mins</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col justify-center border-l border-gray-100 pl-6 gap-2 min-w-[140px]">
                                        {appt.status === 'confirmed' && new Date(appt.appointmentDate) >= now ? (
                                            <button
                                                onClick={() => setCancelAppt(appt)}
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
                                        <button
                                            onClick={() => setViewAppt(appt)}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* ─── VIEW DETAILS MODAL ─── */}
            <AnimatePresence>
                {viewAppt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setViewAppt(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className={`p-6 ${viewAppt.status === 'cancelled' ? 'bg-red-50' : 'bg-indigo-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Appointment Details</p>
                                        <h2 className="text-2xl font-black text-neutral-800">
                                            {viewAppt.doctorId?.name || viewAppt.doctorName || 'Doctor'}
                                        </h2>
                                        <p className="text-indigo-500 font-medium mt-0.5">
                                            {viewAppt.doctorId?.specialty || 'Specialist'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setViewAppt(null)}
                                        className="p-2 rounded-xl hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-all"
                                    >
                                        <HiX className="text-xl" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusColor(viewAppt.status)}`}>
                                        {viewAppt.status}
                                    </span>
                                    <span className="text-sm text-neutral-500 font-medium">
                                        {new Date(viewAppt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4">
                                {/* Hospital */}
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                        <HiLocationMarker className="text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Hospital</p>
                                        <p className="font-bold text-neutral-800">{viewAppt.hospitalId?.name || viewAppt.hospitalName || 'N/A'}</p>
                                        <p className="text-sm text-neutral-500">{viewAppt.hospitalId?.location || 'Main Campus'}</p>
                                    </div>
                                </div>

                                {/* Token */}
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                        <HiIdentification className="text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Token Number</p>
                                        <p className="font-bold text-neutral-800 text-xl">#{viewAppt.tokenNumber}</p>
                                        <p className="text-sm text-neutral-500">Est. wait: ~{viewAppt.tokenNumber * 20} minutes</p>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                        <HiUser className="text-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Patient Information</p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                            <div>
                                                <span className="text-neutral-400">Name: </span>
                                                <span className="font-semibold text-neutral-700">{viewAppt.patientName}</span>
                                            </div>
                                            <div>
                                                <span className="text-neutral-400">Age: </span>
                                                <span className="font-semibold text-neutral-700">{viewAppt.patientAge} yrs</span>
                                            </div>
                                            <div>
                                                <span className="text-neutral-400">Gender: </span>
                                                <span className="font-semibold text-neutral-700">{viewAppt.patientGender}</span>
                                            </div>
                                            <div>
                                                <span className="text-neutral-400">Address: </span>
                                                <span className="font-semibold text-neutral-700">{viewAppt.patientAddress}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Problem */}
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                        <HiClipboardList className="text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Reason / Problem</p>
                                        <p className="font-medium text-neutral-700 capitalize">{viewAppt.problem}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 pb-6">
                                <button
                                    onClick={() => setViewAppt(null)}
                                    className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── CANCEL CONFIRMATION MODAL ─── */}
            <AnimatePresence>
                {cancelAppt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setCancelAppt(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500 text-3xl">
                                <HiExclamation />
                            </div>
                            <h2 className="text-xl font-black text-neutral-800 mb-2">Cancel Appointment?</h2>
                            <p className="text-neutral-500 text-sm mb-2">
                                You're about to cancel your appointment with
                            </p>
                            <p className="font-bold text-neutral-800 text-lg mb-1">
                                {cancelAppt.doctorId?.name || cancelAppt.doctorName}
                            </p>
                            <p className="text-indigo-500 text-sm mb-6">
                                {new Date(cancelAppt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-neutral-400 mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCancelAppt(null)}
                                    className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                                >
                                    Keep It
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={actionLoading !== null}
                                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-60"
                                >
                                    {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
