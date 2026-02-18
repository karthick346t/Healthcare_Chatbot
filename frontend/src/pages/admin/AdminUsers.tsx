import React, { useState, useEffect } from 'react';
import { HiTrash, HiSearch, HiUser } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';

export default function AdminUsers() {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            await fetch(`http://localhost:4000/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-800">User Management</h1>
                <p className="text-neutral-500 text-sm mt-1">Manage registered patients.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-neutral-400">Loading...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-neutral-400">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-sm font-bold">
                                                    {user.name?.charAt(0) || <HiUser />}
                                                </div>
                                                <span className="font-semibold text-neutral-700">{user.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(user._id, user.name)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <HiTrash />
                                            </button>
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
