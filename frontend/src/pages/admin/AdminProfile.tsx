import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { HiUser, HiPhone, HiLocationMarker, HiSave, HiOutlinePencil, HiBriefcase, HiMail } from 'react-icons/hi';
import { MdAdminPanelSettings } from 'react-icons/md';

export default function AdminProfile() {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [imageError, setImageError] = useState(false);

    const [formData, setFormData] = useState({
        phone: '',
        address: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                phone: user.phone || '',
                address: user.address || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Reusing the same profile update endpoint but only sending minimal admin fields
            const payload = {
                phone: formData.phone,
                address: formData.address,
            };

            const res = await fetch('http://localhost:4000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to update profile');
            
            setSuccess('Admin profile updated successfully! Refresh to see changes.');
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#eef2f5] p-8 rounded-[2rem] shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] border-none gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-lg shadow-cyan-500/20">
                        {user?.avatar && !imageError ? (
                            <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            user?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">{user?.name}</h1>
                        <p className="text-neutral-500 font-medium flex items-center gap-2 mt-1">
                             <HiMail className="text-gray-400" /> {user?.email}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20 uppercase tracking-widest">
                            <MdAdminPanelSettings className="text-sm" /> System Administrator
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all font-bold shadow-lg shadow-neutral-500/20 hover:-translate-y-0.5"
                    >
                        <HiOutlinePencil className="text-lg" /> Edit Details
                    </button>
                )}
            </div>

            {/* Messages */}
            {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 animate-fadeIn font-medium flex items-center gap-2">✅ {success}</div>}
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 animate-fadeIn font-medium flex items-center gap-2">❌ {error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Administrative Role Details (Read-Only) */}
                <div className="bg-[#eef2f5] p-8 rounded-3xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] border-none relative overflow-hidden">
                    <h2 className="text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                        <HiBriefcase className="text-blue-500 text-2xl" /> Access & Permissions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] border-none p-4 rounded-2xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Account Type</label>
                            <p className="text-neutral-800 font-semibold text-lg">{user?.role?.toUpperCase() || 'ADMIN'}</p>
                        </div>
                        <div className="bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] border-none p-4 rounded-2xl">
                            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Access Level</label>
                            <p className="text-neutral-800 font-semibold text-lg">Full System Access</p>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-[#eef2f5] p-8 rounded-3xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] border-none relative overflow-hidden">
                    <h2 className="text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                        <HiUser className="text-indigo-500 text-2xl" /> Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Primary Phone Number</label>
                            <div className="relative">
                                <HiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                <input 
                                    type="tel" 
                                    name="phone"
                                    disabled={!isEditing}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] border-none focus:shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] outline-none disabled:opacity-75 transition-all font-medium"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Office / Mailing Address</label>
                            <div className="relative">
                                <HiLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                <input 
                                    type="text" 
                                    name="address"
                                    disabled={!isEditing}
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#eef2f5] shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] border-none focus:shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] outline-none disabled:opacity-75 transition-all font-medium"
                                    placeholder="123 Admin Office, Health City"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex justify-end gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-500 hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <HiSave className="text-lg" /> {loading ? 'Saving securely...' : 'Save Profile Details'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
