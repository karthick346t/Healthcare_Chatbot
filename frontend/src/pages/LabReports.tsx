import React, { useState } from 'react';
import { 
    HiUpload, HiDocumentText, HiTrendingUp, HiSearch, HiFilter, HiDownload, HiShare 
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Component for Charts
const TrendLine = ({ color, data }: { color: string, data: number[] }) => (
    <svg viewBox="0 0 100 30" className="w-full h-12 overflow-visible">
        <path
            d={`M0 ${30 - data[0]} ${data.map((d, i) => `L${(i + 1) * (100 / (data.length - 1))} ${30 - d}`).join(' ')}`}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d={`M0 ${30 - data[0]} ${data.map((d, i) => `L${(i + 1) * (100 / (data.length - 1))} ${30 - d}`).join(' ')} V30 H0 Z`}
            fill={color}
            fillOpacity="0.1"
        />
        {data.map((d, i) => (
             <circle key={i} cx={(i + 1) * (100 / (data.length - 1))} cy={30 - d} r="2" fill="white" stroke={color} strokeWidth="2" />
        ))}
    </svg>
);

export default function LabReports() {
    const [activeTab, setActiveTab] = useState<'reports' | 'trends'>('reports');
    const [dragging, setDragging] = useState(false);

    const reports = [
        { id: 1, name: "Comprehensive Metabolic Panel", date: "Oct 24, 2025", doctor: "Dr. Sarah Wilson", type: "PDF", size: "2.4 MB" },
        { id: 2, name: "Lipid Profile", date: "Sep 12, 2025", doctor: "Dr. James Lee", type: "PDF", size: "1.8 MB" },
        { id: 3, name: "Thyroid Function Test", date: "Aug 05, 2025", doctor: "Dr. Emily Chen", type: "JPG", size: "3.1 MB" },
        { id: 4, name: "CBC with Differential", date: "Jul 22, 2025", doctor: "Dr. Sarah Wilson", type: "PDF", size: "1.5 MB" },
    ];

    const trends = [
        { title: "Total Cholesterol", data: [180, 175, 172, 168, 165], unit: "mg/dL", status: "Optimal", color: "#10b981" },
        { title: "Glucose (Fasting)", data: [95, 98, 92, 94, 90], unit: "mg/dL", status: "Normal", color: "#3b82f6" },
        { title: "Vitamin D", data: [28, 32, 35, 40, 42], unit: "ng/mL", status: "Improving", color: "#f59e0b" },
    ];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        alert("Upload functionality coming soon!"); // Mock
    };


    return (
        <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-neutral-800">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <span className="p-3 bg-purple-100 rounded-2xl text-purple-600 shadow-sm">
                                <HiDocumentText />
                            </span>
                            Lab Reports
                        </h1>
                        <p className="text-neutral-500 mt-2 ml-16">Centralize and analyze your medical records.</p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <HiSearch className="absolute left-3 top-3 text-gray-400 text-lg" />
                            <input 
                                type="text" 
                                placeholder="Search reports..." 
                                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                            />
                        </div>
                        <button className="p-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-500 shadow-sm transition-colors">
                            <HiFilter className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Upload Zone */}
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        mb-10 w-full rounded-3xl border-2 border-dashed transition-all p-10 text-center cursor-pointer group relative overflow-hidden
                        ${dragging ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50'}
                    `}
                >
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform group-hover:scale-110 duration-300 ${dragging ? 'bg-purple-200 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                            <HiUpload />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-neutral-700">Upload New Report</h3>
                            <p className="text-sm text-neutral-400 mt-1">Drag & drop files here, or <span className="text-purple-600 font-bold underline">browse files</span></p>
                        </div>
                         <p className="text-xs text-gray-400 mt-4 uppercase tracking-wider font-bold">Supports PDF, JPG, PNG up to 10MB</p>
                    </div>
                </div>


                {/* Content Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-8">
                     <button
                        onClick={() => setActiveTab('reports')}
                        className={`pb-4 px-2 font-bold text-sm transition-all relative flex items-center gap-2 ${
                            activeTab === 'reports' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <HiDocumentText className="text-lg" /> All Reports
                        {activeTab === 'reports' && (
                            <motion.div layoutId="underline_labs" className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('trends')}
                        className={`pb-4 px-2 font-bold text-sm transition-all relative flex items-center gap-2 ${
                            activeTab === 'trends' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                         <HiTrendingUp className="text-lg" /> Analytics & Trends
                         <span className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-full ml-1 font-extrabold">NEW</span>
                        {activeTab === 'trends' && (
                            <motion.div layoutId="underline_labs" className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />
                        )}
                    </button>
                </div>


                <AnimatePresence mode='wait'>
                    {activeTab === 'reports' ? (
                        <motion.div 
                            key="reports"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {reports.map((report) => (
                                <div key={report.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between h-48">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 font-bold text-xs uppercase tracking-wider border border-purple-100">
                                            {report.type}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><HiShare /></button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><HiDownload /></button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-bold text-neutral-800 line-clamp-1">{report.name}</h3>
                                        <p className="text-sm text-neutral-400 mt-1">{report.date} • {report.size}</p>
                                    </div>

                                    <div className="pt-4 border-t border-dashed border-gray-100 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {report.doctor.split(' ')[1][0]}
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{report.doctor}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="trends"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {trends.map((trend, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="font-bold text-neutral-700">{trend.title}</h3>
                                            <div className="flex items-baseline gap-2 mt-2">
                                                <span className="text-4xl font-black text-neutral-800">{trend.data[trend.data.length-1]}</span>
                                                <span className="text-sm font-medium text-gray-400">{trend.unit}</span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-opacity-20`} style={{ backgroundColor: `${trend.color}20`, color: trend.color }}>
                                            {trend.status}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <TrendLine color={trend.color} data={trend.data} />
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
