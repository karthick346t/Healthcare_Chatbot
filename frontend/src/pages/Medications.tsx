import React, { useState } from 'react';
import { 
    HiOutlineClipboardList, HiPlus, HiCheck, HiX, HiClock, HiCalendar, HiBell, HiFilter 
} from 'react-icons/hi';
import { MdMedication, MdLocalPharmacy, MdHistory, MdAccessTimeFilled } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

export default function Medications() {
    const [activeTab, setActiveTab] = useState<'schedule' | 'list'>('schedule');
    const [showAddModal, setShowAddModal] = useState(false);

    // Mock Data
    const [medications, setMedications] = useState([
        { 
            id: 1, 
            name: "Amoxicillin", 
            dosage: "500mg", 
            frequency: "3x Daily", 
            times: ["08:00", "14:00", "20:00"], 
            stock: 12, 
            color: "bg-blue-100 text-blue-600",
            icon: "💊"
        },
        { 
            id: 2, 
            name: "Vitamin D3", 
            dosage: "1000IU", 
            frequency: "1x Daily", 
            times: ["09:00"], 
            stock: 45, 
            color: "bg-yellow-100 text-yellow-600",
            icon: "☀️"
        },
        { 
            id: 3, 
            name: "Lisinopril", 
            dosage: "10mg", 
            frequency: "1x Daily", 
            times: ["08:00"], 
            stock: 28, 
            color: "bg-red-100 text-red-600",
            icon: "❤️"
        }
    ]);

    const [todaysDoses, setTodaysDoses] = useState([
        { id: 101, medId: 1, time: "08:00", taken: true },
        { id: 102, medId: 3, time: "08:00", taken: true },
        { id: 103, medId: 2, time: "09:00", taken: false }, // Missed/Pending
        { id: 104, medId: 1, time: "14:00", taken: false }, // Pending
        { id: 105, medId: 1, time: "20:00", taken: false }, // Pending
    ]);

    const toggleTaken = (doseId: number) => {
        setTodaysDoses(prev => prev.map(d => d.id === doseId ? { ...d, taken: !d.taken } : d));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-neutral-800">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <span className="p-3 bg-orange-100 rounded-2xl text-orange-600 shadow-sm">
                                <MdMedication />
                            </span>
                            Medication Tracker
                        </h1>
                        <p className="text-neutral-500 mt-2 ml-16">Manage your prescriptions and track adherence.</p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 font-bold"
                    >
                        <HiPlus className="text-xl" /> Add Medication
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Schedule */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Progress Card */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-400/20 to-emerald-300/20 rounded-bl-full -mr-8 -mt-8"></div>
                            
                            <div className="flex-1 z-10">
                                <h3 className="text-lg font-bold text-neutral-700 mb-1">Today's Progress</h3>
                                <p className="text-sm text-neutral-400 mb-4">You have taken {todaysDoses.filter(d => d.taken).length} out of {todaysDoses.length} doses.</p>
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${(todaysDoses.filter(d => d.taken).length / todaysDoses.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 z-10 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/60 shadow-sm">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-neutral-800">{todaysDoses.filter(d => d.taken).length}</div>
                                    <div className="text-xs font-bold text-green-600 uppercase">Taken</div>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-neutral-800">{todaysDoses.length - todaysDoses.filter(d => d.taken).length}</div>
                                    <div className="text-xs font-bold text-orange-500 uppercase">Pending</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`pb-4 px-4 font-bold text-sm transition-all relative ${
                                    activeTab === 'schedule' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                Today's Schedule
                                {activeTab === 'schedule' && (
                                    <motion.div layoutId="underline_meds" className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`pb-4 px-4 font-bold text-sm transition-all relative ${
                                    activeTab === 'list' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                All Medications
                                {activeTab === 'list' && (
                                    <motion.div layoutId="underline_meds" className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600" />
                                )}
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
                                    className="space-y-4"
                                >
                                    {todaysDoses.map((dose) => {
                                        const med = medications.find(m => m.id === dose.medId);
                                        if (!med) return null;
                                        
                                        const now = new Date();
                                        const [hours, mins] = dose.time.split(':').map(Number);
                                        const doseTime = new Date();
                                        doseTime.setHours(hours, mins, 0, 0);
                                        const isPast = doseTime < now && !dose.taken;

                                        return (
                                            <div 
                                                key={dose.id} 
                                                className={`p-4 rounded-2xl border transition-all flex items-center gap-4 group ${
                                                    dose.taken ? 'bg-green-50/50 border-green-100 opacity-75 grayscale-[0.3]' : 
                                                    isPast ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-100 hover:shadow-md'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${med.color}`}>
                                                    {med.icon}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`font-bold text-lg ${dose.taken ? 'line-through text-gray-400' : 'text-neutral-800'}`}>{med.name}</h4>
                                                        <span className={`text-sm font-bold flex items-center gap-1 ${
                                                            dose.taken ? 'text-green-600' : isPast ? 'text-red-500' : 'text-neutral-500'
                                                        }`}>
                                                            <MdAccessTimeFilled /> {dose.time}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-neutral-400 font-medium">{med.dosage} • {isPast ? 'Missed Dose' : 'Take with food'}</p>
                                                </div>

                                                <button 
                                                    onClick={() => toggleTaken(dose.id)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                                        dose.taken 
                                                            ? 'bg-green-500 text-white shadow-green-200' 
                                                            : 'bg-gray-100 text-gray-300 hover:bg-green-100 hover:text-green-500'
                                                    }`}
                                                >
                                                    <HiCheck className="text-xl" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="list"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {medications.map(med => (
                                        <div key={med.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${med.color}`}>
                                                    {med.icon}
                                                </div>
                                                <button className="text-gray-300 hover:text-neutral-600 transition-colors">
                                                    <HiOutlineClipboardList className="text-xl" />
                                                </button>
                                            </div>
                                            <h4 className="font-bold text-lg text-neutral-800 mb-1">{med.name}</h4>
                                            <p className="text-sm text-orange-500 font-bold mb-4">{med.dosage}</p>
                                            
                                            <div className="space-y-2 text-sm text-neutral-500">
                                                <div className="flex items-center gap-2">
                                                    <HiClock className="text-gray-400" />
                                                    <span>{med.frequency}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MdLocalPharmacy className="text-gray-400" />
                                                    <span>{med.stock} pills remaining</span>
                                                </div>
                                            </div>

                                            {med.stock <= 15 && (
                                                <div className="mt-4 p-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg text-center animate-pulse">
                                                    Low Stock - Refill Soon
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>

                    {/* Right Column: Refills & Stats */}
                    <div className="space-y-6">
                        
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-neutral-700 mb-4 flex items-center gap-2">
                                <HiBell className="text-orange-500" /> Refill Alerts
                            </h3>
                            <div className="space-y-4">
                                {medications.filter(m => m.stock < 20).map(med => (
                                    <div key={med.id} className="flex items-center gap-4 p-3 bg-red-50 rounded-xl border border-red-100">
                                        <div className="text-2xl">{med.icon}</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-neutral-800">{med.name}</h4>
                                            <p className="text-xs text-red-500 font-bold">{med.stock} left</p>
                                        </div>
                                        <button className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-colors">
                                            Refill
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                         <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h3 className="font-bold text-lg mb-2 relative z-10">Adherence Score</h3>
                            <div className="flex items-baseline gap-1 relative z-10">
                                <span className="text-5xl font-black tracking-tight">92</span>
                                <span className="text-xl font-medium opacity-80">%</span>
                            </div>
                            <p className="text-indigo-100 text-sm mt-2 relative z-10">You're doing great! Keep taking your meds on time to maintain your streak.</p>
                        </div>

                    </div>
                </div>

            </div>

             {/* Add Modal (Mock) */}
             <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <HiPlus className="bg-black text-white rounded-full p-1" /> Add Medication
                                </h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <HiX className="text-xl text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <input type="text" placeholder="Medication Name" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-medium" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Dosage (e.g. 500mg)" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-medium" />
                                    <input type="number" placeholder="Total Stock" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-medium" />
                                </div>
                                <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-medium text-gray-500">
                                    <option>Frequency</option>
                                    <option>Once Daily</option>
                                    <option>Twice Daily</option>
                                    <option>Three Times Daily</option>
                                </select>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-95">Save Details</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
