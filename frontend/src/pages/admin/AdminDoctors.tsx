import React, { useState, useEffect } from 'react';
import { HiTrash, HiPlus, HiSearch } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDoctors() {
    const { token } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDoctors = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/admin/doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setDoctors(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [token]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to dismiss Dr. ${name}?`)) return;
        try {
            await fetch(`http://localhost:4000/api/admin/doctors/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDoctors();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredDoctors = doctors.filter(doc => 
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Doctor Management</h1>
                    <p className="text-neutral-500 text-sm mt-1">Manage medical staff.</p>
                </div>
                <button className="flex items-center gap-2 bg-neutral-800 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-neutral-500/20 hover:bg-neutral-900 transition-all active:scale-95 text-sm font-medium">
                    <HiPlus className="text-lg" />
                    <span>Add Doctor</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search doctors by name or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50/30">
                    {loading ? (
                        <div className="col-span-full py-10 text-center text-neutral-400">Loading...</div>
                    ) : filteredDoctors.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-neutral-400">No doctors found.</div>
                    ) : (
                        filteredDoctors.map((doc) => (
                            <div key={doc._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden">
                                        <img src={doc.image || "https://ui-avatars.com/api/?name=" + doc.name} alt={doc.name} className="w-full h-full object-cover" />
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(doc._id, doc.name)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <HiTrash className="text-xl" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-neutral-800 mb-1">{doc.name}</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{doc.specialty}</span>
                                </div>
                                <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed mb-4">{doc.bio}</p>
                                <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-neutral-400 font-medium">
                                    <span>🏥 {doc.hospitalId?.name || 'Unassigned'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
