import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { HiUserGroup, HiCalendar, HiClock, HiOfficeBuilding } from 'react-icons/hi';

interface Stats {
    users: number;
    appointments: {
        total: number;
        pending: number;
        confirmed: number;
        cancelled: number;
    };
    doctors: number;
    hospitals: number;
}

const API_BASE = "/api/admin";

export default function AdminDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate, token]);

    const fetchData = async () => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            };

            const statsRes = await fetch(`${API_BASE}/stats`, { headers });
            const usersRes = await fetch(`${API_BASE}/users`, { headers });
            const apptsRes = await fetch(`${API_BASE}/appointments?limit=5`, { headers });

            if (!statsRes.ok) throw new Error("Failed to fetch data");

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();
            const apptsData = await apptsRes.json();

            setStats(statsData);

            // Sort by date descending and take top 5
            setRecentUsers(usersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
            setRecentAppointments(apptsData.appointments || apptsData); // Handle paginated response if wrapped
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate "Confirmed Today" (Mocked logic based on appointments array if full list was fetched, otherwise placeholder)
    // Calculate "New Users (This Week)" (Mocked for now as we only fetch top 5)

    // Combine and sort activities for the feed
    const activities = [
        ...recentUsers.map(u => ({ type: 'user', title: 'New Registration', desc: `${u.name} joined the platform.`, date: new Date(u.createdAt || Date.now()), icon: '👤', color: 'bg-blue-100 text-blue-600' })),
        ...recentAppointments.map(a => {
            const isCancelled = a.status === 'cancelled';
            return {
                type: 'appointment',
                title: isCancelled ? 'Appointment Cancelled' : 'Appointment Booked',
                desc: isCancelled ? `${a.patientName}'s appointment was cancelled.` : `${a.patientName} booked an appointment.`,
                date: new Date(a.updatedAt || a.createdAt || a.appointmentDate || Date.now()),
                icon: isCancelled ? '❌' : '📅',
                color: isCancelled ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
            };
        })
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

    if (loading) return <div className="p-10 text-center">Loading Admin Dashboard...</div>;

    return (
        <div className="w-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard icon={HiUserGroup} label="Total Users" value={stats?.users || 0} color="bg-blue-500" />
                <StatCard icon={HiCalendar} label="Total Appointments" value={stats?.appointments.total || 0} color="bg-purple-500" />
                <StatCard icon={HiClock} label="Pending Actions" value={stats?.appointments.pending || 0} color="bg-orange-500" />
                <StatCard icon={HiOfficeBuilding} label="Hospitals" value={stats?.hospitals || 0} color="bg-emerald-500" />
            </div>

            {/* Main Content Area: Charts & Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Charts & Quick Links (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Simple Visualization: Appointment Status */}
                    <div className="bg-[#eef2f5] rounded-3xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-neutral-800">Appointment Status Distribution</h3>
                            <span className="text-xs font-semibold text-neutral-500 bg-gray-100 px-3 py-1 rounded-full">All Time</span>
                        </div>

                        <div className="flex h-12 rounded-xl overflow-hidden shadow-inner mb-4">
                            {stats?.appointments.total ? (
                                <>
                                    <div style={{ width: `${(stats.appointments.confirmed / stats.appointments.total) * 100}%` }} className="bg-emerald-500 h-full transition-all group relative">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold pointer-events-none">{stats.appointments.confirmed}</div>
                                    </div>
                                    <div style={{ width: `${(stats.appointments.pending / stats.appointments.total) * 100}%` }} className="bg-orange-500 h-full transition-all group relative">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold pointer-events-none">{stats.appointments.pending}</div>
                                    </div>
                                    <div style={{ width: `${(stats.appointments.cancelled / stats.appointments.total) * 100}%` }} className="bg-red-500 h-full transition-all group relative">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold pointer-events-none">{stats.appointments.cancelled}</div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full bg-gray-100 flex items-center justify-center text-xs text-neutral-400 font-medium">No Data</div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-neutral-600 font-medium">Confirmed ({stats?.appointments.confirmed || 0})</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-xs text-neutral-600 font-medium">Pending ({stats?.appointments.pending || 0})</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs text-neutral-600 font-medium">Cancelled ({stats?.appointments.cancelled || 0})</span></div>
                        </div>
                    </div>

                    {/* Quick Panel Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-[#eef2f5] rounded-3xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] p-6">
                            <h3 className="font-bold text-neutral-800 mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-neutral-500 text-sm">Pending Appointments</span>
                                    <span className="font-bold text-neutral-800">{stats?.appointments.pending || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-neutral-500 text-sm">Doctors Registered</span>
                                    <span className="font-bold text-neutral-800">{stats?.doctors || 0}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-neutral-500 text-sm">Hospitals Active</span>
                                    <span className="font-bold text-neutral-800">{stats?.hospitals || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#eef2f5] rounded-3xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] p-6 text-neutral-800 relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl translate-x-10 -translate-y-10 pointer-events-none"></div>

                            <div>
                                <h3 className="font-bold text-lg mb-1 relative z-10 text-cyan-700">Quick Actions</h3>
                                <p className="text-neutral-500 text-xs mb-4 relative z-10 font-medium">Common management tasks.</p>
                            </div>

                            <div className="flex flex-col gap-3 relative z-10 block mt-2">
                                <button onClick={() => navigate('/admin/doctors')} className="w-full text-left px-4 py-3 bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] hover:shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff] rounded-xl transition-all text-sm font-bold text-neutral-700 flex items-center justify-between group block !text-left">
                                    <span>Add New Doctor</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                                <button onClick={() => navigate('/admin/appointments')} className="w-full text-left px-4 py-3 bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] hover:shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff] rounded-xl transition-all text-sm font-bold text-neutral-700 flex items-center justify-between group block !text-left">
                                    <span>Review Appointments</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity Feed */}
                <div className="bg-[#eef2f5] rounded-3xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] p-0 overflow-hidden flex flex-col h-full lg:h-[480px]">
                    <div className="p-6 pb-2 flex justify-between items-center mb-2">
                        <h3 className="font-bold text-neutral-800">Recent Activity</h3>
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" title="Live updates active"></div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2">
                        {activities.length > 0 ? (
                            <div className="space-y-1">
                                {activities.map((act, i) => (
                                    <div key={i} className="flex gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${act.color}`}>
                                            {act.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-neutral-800 truncate">{act.title}</p>
                                            <p className="text-xs text-neutral-500 truncate mt-0.5">{act.desc}</p>
                                            <p className="text-[10px] text-neutral-400 font-medium mt-1">{act.date.toLocaleDateString()} at {act.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-6 text-center">
                                <div className="text-4xl mb-2 opacity-20">📭</div>
                                <p className="text-sm">No recent activity found.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    return (
        <div className="bg-[#eef2f5] p-6 rounded-3xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] flex items-center gap-4 border-none hover:-translate-y-1 transition-transform cursor-default">
            <div className={`p-4 rounded-xl shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] bg-[#eef2f5] ${color.replace('bg-', 'text-')} `}>
                <Icon className="text-2xl" />
            </div>
            <div>
                <div className="text-3xl font-black text-neutral-700">{value}</div>
                <div className="text-sm font-bold text-neutral-500">{label}</div>
            </div>
        </div>
    );
}
