import React, { useState } from 'react';
import { 
    HiPlus, HiCheck, HiX, HiClock, HiBell, 
    HiPencil, HiTrash, HiCheckCircle
} from 'react-icons/hi';
import { MdMedication, MdLocalPharmacy, MdAccessTimeFilled } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

// Define types 
interface Medication {
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    times: string[];
    stock: number;
    color: string;
    icon: string;
}

interface Dose {
    id: number;
    medId: number;
    time: string;
    taken: boolean;
}

export default function Medications() {
    const [activeTab, setActiveTab] = useState<'schedule' | 'list'>('schedule');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Medication>>({
        name: '',
        dosage: '',
        stock: 0,
        frequency: '1x Daily',
        times: ['09:00'] 
    });

    // Mock Data - Initial State
    const [medications, setMedications] = useState<Medication[]>([
        { 
            id: 1, 
            name: "Amoxicillin", 
            dosage: "500mg", 
            frequency: "3x Daily", 
            times: ["08:00", "14:00", "20:00"], 
            stock: 12, 
            color: "text-blue-500",
            icon: "💊"
        },
        { 
            id: 2, 
            name: "Vitamin D3", 
            dosage: "1000IU", 
            frequency: "1x Daily", 
            times: ["09:00"], 
            stock: 45, 
            color: "text-yellow-500",
            icon: "☀️"
        },
        { 
            id: 3, 
            name: "Lisinopril", 
            dosage: "10mg", 
            frequency: "1x Daily", 
            times: ["08:00"], 
            stock: 28, 
            color: "text-red-500",
            icon: "❤️"
        }
    ]);

    const [todaysDoses, setTodaysDoses] = useState<Dose[]>([
        { id: 101, medId: 1, time: "08:00", taken: true },
        { id: 102, medId: 3, time: "08:00", taken: true },
        { id: 103, medId: 2, time: "09:00", taken: false }, // Missed/Pending
        { id: 104, medId: 1, time: "14:00", taken: false }, // Pending
        { id: 105, medId: 1, time: "20:00", taken: false }, // Pending
    ]);

    const toggleTaken = (doseId: number) => {
        setTodaysDoses(prev => prev.map(d => d.id === doseId ? { ...d, taken: !d.taken } : d));
    };

    // --- CRUD Handlers ---

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({
            name: '',
            dosage: '',
            stock: 30,
            frequency: '1x Daily',
            times: ['09:00']
        });
        setShowAddModal(true);
    };

    const handleEdit = (med: Medication) => {
        setEditingId(med.id);
        setFormData({ ...med });
        setShowAddModal(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Are you sure you want to delete this medication?")) {
            setMedications(prev => prev.filter(m => m.id !== id));
            setTodaysDoses(prev => prev.filter(d => d.medId !== id));
        }
    };

    const handleRefill = (id: number) => {
        setMedications(prev => prev.map(m => 
            m.id === id ? { ...m, stock: m.stock + 30 } : m
        ));
    };

    const handleSave = () => {
        if (!formData.name || !formData.dosage) return;

        if (editingId) {
            setMedications(prev => prev.map(m => 
                m.id === editingId ? { ...m, ...formData } as Medication : m
            ));
        } else {
            const newMed: Medication = {
                id: Date.now(),
                name: formData.name!,
                dosage: formData.dosage!,
                stock: Number(formData.stock) || 0,
                frequency: formData.frequency || '1x Daily',
                times: formData.times || ['09:00'],
                color: "text-purple-500",
                icon: "💊"
            };
            setMedications(prev => [...prev, newMed]);
            setTodaysDoses(prev => [
                ...prev, 
                { id: Date.now() + 100, medId: newMed.id, time: "09:00", taken: false }
            ]);
        }
        setShowAddModal(false);
    };

    return (
        <div className="min-h-screen bg-[#eef2f5] p-6 font-sans text-neutral-800">
            <div className="max-w-6xl mx-auto">
                
                {/* Neumorphic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-neutral-700 flex items-center gap-3 tracking-tight">
                            <span className="w-12 h-12 rounded-xl flex items-center justify-center text-cyan-600 shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff]">
                                <MdMedication className="text-2xl" />
                            </span>
                            Medication Tracker
                        </h1>
                        <p className="text-neutral-500 mt-2 ml-16 font-medium">Manage your prescriptions and track adherence.</p>
                    </div>
                    <button 
                        onClick={handleAddNew}
                        className="neu-btn px-6 py-3 text-cyan-700 hover:text-cyan-800"
                    >
                        <HiPlus className="text-xl mr-2" /> Add Medication
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Schedule */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Embossed Progress Card */}
                        <div className="neu-card p-8 relative overflow-hidden">
                            <div className="flex-1 z-10 relative">
                                <h3 className="text-lg font-bold text-neutral-600 mb-1">Today's Progress</h3>
                                
                                <div className="flex items-end justify-between mb-2">
                                     <p className="text-sm text-neutral-400 font-medium">You have taken {todaysDoses.filter(d => d.taken).length} out of {todaysDoses.length} doses.</p>
                                     <span className="text-3xl font-black text-cyan-600">{Math.round((todaysDoses.filter(d => d.taken).length / todaysDoses.length) * 100) || 0}%</span>
                                </div>

                                {/* Embossed Progress Bar Track */}
                                <div className="h-4 w-full rounded-full shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] bg-[#eef2f5] overflow-hidden p-[2px]">
                                    {/* Popped out Progress Bar Fill */}
                                    <div 
                                        className="h-full rounded-full bg-cyan-500 shadow-[2px_2px_4px_#b8e0e0] transition-all duration-1000 ease-out"
                                        style={{ width: `${todaysDoses.length > 0 ? (todaysDoses.filter(d => d.taken).length / todaysDoses.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Neumorphic Tabs */}
                        <div className="flex p-1.5 bg-[#eef2f5] rounded-xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] w-fit">
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                    activeTab === 'schedule' 
                                    ? 'bg-[#eef2f5] text-cyan-600 shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff]' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                Today's Schedule
                            </button>
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                    activeTab === 'list' 
                                    ? 'bg-[#eef2f5] text-cyan-600 shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff]' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                All Medications
                            </button>
                        </div>

                        {/* Content Area */}
                        <AnimatePresence mode='wait'>
                            {activeTab === 'schedule' ? (
                                <motion.div 
                                    key="schedule"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {todaysDoses.length === 0 ? (
                                        <div className="neu-card p-10 text-center text-gray-400 italic">No doses scheduled.</div>
                                    ) : (
                                        todaysDoses.map((dose) => {
                                            const med = medications.find(m => m.id === dose.medId);
                                            if (!med) return null;
                                            
                                            // Check time logic...
                                            const now = new Date();
                                            const [hours, mins] = dose.time.split(':').map(Number);
                                            const doseTime = new Date();
                                            doseTime.setHours(hours, mins, 0, 0);
                                            const isPast = doseTime < now && !dose.taken;

                                            return (
                                                <div 
                                                    key={dose.id} 
                                                    className={`p-6 rounded-2xl transition-all flex items-center gap-6 group ${
                                                        dose.taken 
                                                        ? 'shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] opacity-60' // Pressed in when taken
                                                        : 'neu-card hover:-translate-y-1' // Popped out when active
                                                    }`}
                                                >
                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 ${
                                                        dose.taken ? 'bg-[#eef2f5]' : 'bg-[#eef2f5] shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff]'
                                                    } ${med.color}`}>
                                                        {med.icon}
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className={`font-bold text-lg ${dose.taken ? 'line-through text-gray-400' : 'text-neutral-700'}`}>{med.name}</h4>
                                                            <span className={`text-sm font-bold flex items-center gap-1 ${
                                                                dose.taken ? 'text-green-600' : isPast ? 'text-red-500' : 'text-neutral-400 shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] px-2 py-1 rounded-lg'
                                                            }`}>
                                                                <MdAccessTimeFilled /> {dose.time}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-neutral-400 font-medium mt-1">{med.dosage} • {isPast ? 'Missed Dose' : 'Take with food'}</p>
                                                    </div>

                                                    <button 
                                                        onClick={() => toggleTaken(dose.id)}
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                                            dose.taken 
                                                                ? 'text-green-500 shadow-[inset_3px_3px_6px_#c8d0e7,inset_-3px_-3px_6px_#ffffff] bg-[#eef2f5]' 
                                                                : 'text-gray-300 hover:text-green-500 shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] bg-[#eef2f5]'
                                                        }`}
                                                    >
                                                        {dose.taken ? <HiCheckCircle className="text-2xl" /> : <HiCheck className="text-xl" />}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="list"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    {medications.map(med => (
                                        <div key={med.id} className="neu-card p-6 flex flex-col justify-between group h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] ${med.color}`}>
                                                    {med.icon}
                                                </div>
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => handleEdit(med)}
                                                        className="neu-icon-btn w-10 h-10 text-gray-400 hover:text-blue-500"
                                                    >
                                                        <HiPencil className="text-lg" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(med.id)}
                                                        className="neu-icon-btn w-10 h-10 text-gray-400 hover:text-red-500"
                                                    >
                                                        <HiTrash className="text-lg" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-bold text-xl text-neutral-700 mb-1">{med.name}</h4>
                                                <p className="text-sm text-cyan-600 font-bold mb-4">{med.dosage}</p>
                                                
                                                <div className="space-y-3 text-sm text-neutral-500">
                                                    <div className="flex items-center gap-3 p-2 rounded-xl">
                                                        <HiClock className="text-xl text-neutral-400" />
                                                        <span className="font-medium">{med.frequency}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-2 rounded-xl">
                                                        <MdLocalPharmacy className="text-xl text-neutral-400" />
                                                        <span className="font-medium">{med.stock} pills left</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>

                    {/* Right Column: Refills */}
                    <div className="space-y-8">
                        
                        <div className="neu-card p-8">
                            <h3 className="font-bold text-neutral-700 mb-6 flex items-center gap-3">
                                <span className="p-2 rounded-lg shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff] text-orange-500"><HiBell /></span>
                                Refill Alerts
                            </h3>
                            <div className="space-y-4">
                                {medications.filter(m => m.stock < 20).length === 0 ? (
                                     <p className="text-sm text-gray-400 text-center py-4">All stocked up!</p>
                                ) : (
                                    medications.filter(m => m.stock < 20).map(med => (
                                        <div key={med.id} className="flex items-center gap-4 p-4 rounded-2xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff]">
                                            <div className="text-2xl">{med.icon}</div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm text-neutral-700">{med.name}</h4>
                                                <p className="text-xs text-red-500 font-bold">{med.stock} left</p>
                                            </div>
                                            <button 
                                                onClick={() => handleRefill(med.id)}
                                                className="neu-btn px-4 py-2 text-xs text-red-500 hover:text-red-600"
                                            >
                                                Refill
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>

             {/* Add/Edit Modal (Glassmorphism for contrast) */}
             <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#eef2f5]/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="neu-card w-full max-w-md p-8 relative"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-neutral-700">
                                    {editingId ? 'Edit Medication' : 'Add Medication'}
                                </h2>
                                <button onClick={() => setShowAddModal(false)} className="neu-icon-btn w-10 h-10 text-gray-400 hover:text-red-500">
                                    <HiX className="text-lg" />
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 ml-2 uppercase">Medication Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="neu-input mt-2"
                                        placeholder="e.g. Amoxicillin" 
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-400 ml-2 uppercase">Dosage</label>
                                        <input 
                                            type="text" 
                                            value={formData.dosage}
                                            onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                                            className="neu-input mt-2"
                                            placeholder="500mg" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-400 ml-2 uppercase">Stock</label>
                                        <input 
                                            type="number" 
                                            value={formData.stock}
                                            onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                                            className="neu-input mt-2"
                                            placeholder="30" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-neutral-400 ml-2 uppercase">Frequency</label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {['1x Daily', '2x Daily', '3x Daily'].map((freq) => (
                                            <button
                                                key={freq}
                                                onClick={() => setFormData({...formData, frequency: freq})}
                                                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                                    formData.frequency === freq
                                                    ? 'neu-pressed text-cyan-600 shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff]'
                                                    : 'neu-flat text-neutral-400 hover:text-neutral-600 shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff]'
                                                }`}
                                            >
                                                {freq.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-bold text-neutral-400 hover:text-neutral-600 transition-colors">Cancel</button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 py-4 neu-btn bg-cyan-500 text-white shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] hover:bg-cyan-600"
                                >
                                    {editingId ? 'Update' : 'Save Details'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
