import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { HiUser, HiPhone, HiLocationMarker, HiCalendar, HiSave, HiOutlinePencil } from 'react-icons/hi';
import { MdMedicalServices, MdWarning, MdEmergency, MdBloodtype } from 'react-icons/md';

export default function Profile() {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        phone: '',
        gender: 'Male',
        dateOfBirth: '',
        bloodGroup: '',
        address: '',
        allergies: '',
        chronicConditions: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                phone: user.phone || '',
                gender: user.gender || 'Male',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                bloodGroup: user.bloodGroup || '',
                address: user.address || '',
                allergies: user.allergies ? user.allergies.join(', ') : '',
                chronicConditions: user.chronicConditions ? user.chronicConditions.join(', ') : '',
                emergencyContactName: user.emergencyContact?.name || '',
                emergencyContactPhone: user.emergencyContact?.phone || '',
                emergencyContactRelation: user.emergencyContact?.relation || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                phone: formData.phone,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth,
                bloodGroup: formData.bloodGroup,
                address: formData.address,
                allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
                chronicConditions: formData.chronicConditions.split(',').map(s => s.trim()).filter(Boolean),
                emergencyContact: {
                    name: formData.emergencyContactName,
                    phone: formData.emergencyContactPhone,
                    relation: formData.emergencyContactRelation
                }
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
            
            setSuccess('Profile updated successfully! Refresh to see changes.');
            setIsEditing(false);
            // Optionally trigger a user re-fetch here if context supports it
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                        {user?.name?.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">{user?.name}</h1>
                        <p className="text-neutral-500">{user?.email}</p>
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100 uppercase tracking-wide">
                            {user?.role} Account
                        </div>
                    </div>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all font-medium"
                    >
                        <HiOutlinePencil /> Edit Profile
                    </button>
                )}
            </div>

            {/* Messages */}
            {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 animate-fadeIn">{success}</div>}
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 animate-fadeIn">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <h2 className="text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                        <HiUser className="text-blue-500" /> Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Phone Number</label>
                            <div className="relative">
                                <HiPhone className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="tel" 
                                    name="phone"
                                    disabled={!isEditing}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Gender</label>
                            <select 
                                name="gender"
                                disabled={!isEditing}
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Date of Birth</label>
                            <div className="relative">
                                <HiCalendar className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="date" 
                                    name="dateOfBirth"
                                    disabled={!isEditing}
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Blood Group</label>
                            <div className="relative">
                                <MdBloodtype className="absolute left-3 top-3 text-gray-400" />
                                <select 
                                    name="bloodGroup"
                                    disabled={!isEditing}
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 appearance-none bg-white"
                                >
                                    <option value="">Select Group</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Address</label>
                            <div className="relative">
                                <HiLocationMarker className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="address"
                                    disabled={!isEditing}
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                                    placeholder="123 Wellness Street, Health City"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical History */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                    <h2 className="text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                        <MdMedicalServices className="text-red-500" /> Medical History
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Allergies (Comma separated)</label>
                            <div className="relative">
                                <MdWarning className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="allergies"
                                    disabled={!isEditing}
                                    value={formData.allergies}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-50"
                                    placeholder="Peanuts, Penicillin..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Chronic Conditions</label>
                            <input 
                                type="text" 
                                name="chronicConditions"
                                disabled={!isEditing}
                                value={formData.chronicConditions}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-50"
                                placeholder="Diabetes, Hypertension..."
                            />
                        </div>
                    </div>
                </div>

                 {/* Emergency Contact */}
                 <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                    <h2 className="text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                        <MdEmergency className="text-orange-500" /> Emergency Contact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Name</label>
                            <input 
                                type="text" 
                                name="emergencyContactName"
                                disabled={!isEditing}
                                value={formData.emergencyContactName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-50"
                                placeholder="Contact Name"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Phone</label>
                            <input 
                                type="tel" 
                                name="emergencyContactPhone"
                                disabled={!isEditing}
                                value={formData.emergencyContactPhone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-50"
                                placeholder="Contact Phone"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-neutral-500 mb-2">Relation</label>
                            <input 
                                type="text" 
                                name="emergencyContactRelation"
                                disabled={!isEditing}
                                value={formData.emergencyContactRelation}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-50"
                                placeholder="e.g. Spouse, Parent"
                            />
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="flex justify-end gap-4">
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
                            className="px-8 py-3 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-900 shadow-lg shadow-neutral-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <HiSave /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
