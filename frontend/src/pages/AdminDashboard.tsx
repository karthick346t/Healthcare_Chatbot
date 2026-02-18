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



const API_BASE = "http://localhost:4000/api/admin";

export default function AdminDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
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

            if (!statsRes.ok) throw new Error("Failed to fetch data");

            const statsData = await statsRes.json();
            setStats(statsData);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };



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

            {/* Recent Activity / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-neutral-800 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-neutral-500 text-sm">Pending Appointments</span>
                            <span className="font-bold text-neutral-800">{stats?.appointments.pending || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-neutral-500 text-sm">Confirmed Today</span>
                            <span className="font-bold text-neutral-800">5</span> {/* Mock data for now */}
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-neutral-500 text-sm">New Users (This Week)</span>
                            <span className="font-bold text-neutral-800">12</span> {/* Mock data for now */}
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
                    <h3 className="font-bold text-lg mb-2 relative z-10">System Status</h3>
                    <p className="text-neutral-400 text-sm mb-6 relative z-10">All systems operational.</p>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                            <div className="text-xs text-neutral-400 mb-1">Server Load</div>
                            <div className="text-xl font-bold text-green-400">12%</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                            <div className="text-xs text-neutral-400 mb-1">Memory</div>
                            <div className="text-xl font-bold text-cyan-400">45%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
                <Icon className="text-2xl" />
            </div>
            <div>
                <div className="text-2xl font-bold text-neutral-800">{value}</div>
                <div className="text-sm text-neutral-500">{label}</div>
            </div>
        </div>
    );
}
