import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    HiDocumentText, HiDownload, HiPlus, HiBeaker, HiClipboardList, 
    HiFolder, HiCalendar, HiSearch, HiFilter,
    HiShieldCheck, HiSparkles, HiPhotograph, HiUser, HiChevronRight,
    HiExclamation, HiTrendingUp, HiTrash, HiRefresh
} from 'react-icons/hi';
import { MdArrowBack, MdTimeline, MdGridView, MdChevronRight } from 'react-icons/md';
import { fetchWithAuth, refreshAuthToken } from '../services/authApi';
import { API_BASE_URL } from '../services/apiConfig';

interface Report {
    _id: string;
    type: 'Lab Report' | 'Prescription' | 'Radiology' | 'Vaccination' | 'Clinical Note' | 'Other';
    category: 'General' | 'Blood Work' | 'Imaging' | 'Medication' | 'Emergency' | 'Routine' | 'Vaccination';
    title: string;
    description?: string;
    insight?: string;
    tags: string[];
    status: 'Normal' | 'Abnormal' | 'Critical' | 'Pending Review';
    date: string;
    fileUrl: string;
    doctorId?: {
        _id: string;
        name: string;
        specialty: string;
    };
}

const CATEGORIES = [
    { id: 'all', name: 'All Records', icon: <HiFolder /> },
    { id: 'Blood Work', name: 'Blood Work', icon: <HiBeaker /> },
    { id: 'Imaging', name: 'Imaging', icon: <HiPhotograph /> },
    { id: 'Medication', name: 'Prescriptions', icon: <HiClipboardList /> },
    { id: 'Vaccination', name: 'Vaccines', icon: <HiShieldCheck /> },
];

export default function MedicalRecords() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'folders'>('folders');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    
    // Consultation Navigation State
    const [selDrId, setSelDrId] = useState<string | null>(null);
    const [selDate, setSelDate] = useState<string | null>(null);
    const [allDoctors, setAllDoctors] = useState<any[]>([]);

    // Form State
    const [newReport, setNewReport] = useState({
        title: '',
        type: 'Lab Report' as Report['type'],
        category: 'General' as Report['category'],
        description: '',
        status: 'Normal' as Report['status'],
        tags: '',
        insight: '',
        doctorId: '', // Now choosing a doctor
        date: new Date().toISOString().split('T')[0], // Choosing a date
        file: null as File | null
    });

    // Mock data fetching or real API call
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchReports(), fetchDoctors(), fetchAppointments()]);
            setLoading(false);
        };
        init();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await fetchWithAuth('/api/appointments/my-appointments');
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await fetchWithAuth('/api/doctors');
            if (res.ok) {
                const data = await res.json();
                setAllDoctors(data);
            }
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    const fetchReports = async () => {
        try {
            setError(null);
            const response = await fetchWithAuth('/api/reports/my-reports');
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            } else {
                throw new Error("Failed to load records from server.");
            }
        } catch (err: any) {
            console.error("Failed to fetch reports", err);
            const isAuthError = err.message?.includes("expired") || err.message?.includes("401") || err.message?.includes("Unauthorized");
            setError(isAuthError ? "SESSION_EXPIRED" : (err.message || "Something went wrong while fetching your records."));
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh logic for background AI processing
    useEffect(() => {
        const hasProcessing = reports.some(r => r.insight?.toLowerCase().includes('analyzing'));
        
        if (hasProcessing) {
            console.log("🔄 Background AI detected, starting auto-refresh poll...");
            const interval = setInterval(() => {
                fetchReports();
            }, 5000); // Poll every 5 seconds
            
            return () => clearInterval(interval);
        }
    }, [reports]);
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently remove this record from your vault?")) return;
        
        try {
            const res = await fetchWithAuth(`/api/reports/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setReports(reports.filter(r => r._id !== id));
            } else {
                alert("Failed to delete the record. Please try again.");
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Delete failed due to a network error.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewReport({ ...newReport, file: e.target.files[0] });
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory || r.type === selectedCategory;
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const uploadWithProgress = (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('skipAI', 'true');

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else if (xhr.status === 401) {
                    reject(new Error('Unauthorized'));
                } else {
                    reject(new Error(xhr.statusText || 'Upload failed'));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload failed')));
            xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

            const token = localStorage.getItem("healthbot_token");
            xhr.open('POST', `${API_BASE_URL}/api/upload`);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.withCredentials = true;
            xhr.send(formData);
        });
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReport.file || !newReport.title) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        let statusInterval: any;

        try {
            statusInterval = setInterval(() => {
                const messages = [
                    "Encrypting your medical data...",
                    "Securing HIPAA compliance...",
                    "Establishing tunnel to Health Vault...",
                    "Finalizing cloud synchronization...",
                    "AI model initializing analysis...",
                    "Almost there! Securing binary layers..."
                ];
                setStatusMessage(messages[Math.floor(Math.random() * messages.length)]);
            }, 3000);
            setStatusMessage("Starting secure transfer...");

            let uploadData;
            try {
                uploadData = await uploadWithProgress(newReport.file);
            } catch (err: any) {
                // If 401, try to refresh and retry
                if (err.message === 'Unauthorized') {
                    const newToken = await refreshAuthToken();
                    if (newToken) {
                        uploadData = await uploadWithProgress(newReport.file);
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }
            
            setStatusMessage("Synchronizing with NEXA Intelligence...");

            if (!uploadData.fileId) {
                throw new Error("File upload failed");
            }

            // Auto-detect Document Type and Category from AI analysis
            let detectedType: Report['type'] = 'Lab Report';
            let detectedCategory: Report['category'] = 'General';
            
            const analysis = uploadData.message || '';
            if (analysis.toLowerCase().includes('prescription')) {
                detectedType = 'Prescription';
                detectedCategory = 'Medication';
            } else if (analysis.toLowerCase().includes('radiology') || analysis.toLowerCase().includes('x-ray') || analysis.toLowerCase().includes('mri')) {
                detectedType = 'Radiology';
                detectedCategory = 'Imaging';
            } else if (analysis.toLowerCase().includes('vaccination') || analysis.toLowerCase().includes('immunization')) {
                detectedType = 'Vaccination';
                detectedCategory = 'Vaccination';
            } else if (analysis.toLowerCase().includes('lab report') || analysis.toLowerCase().includes('blood work')) {
                detectedType = 'Lab Report';
                detectedCategory = 'Blood Work';
            }

            const reportData = {
                title: newReport.title,
                type: detectedType, 
                category: detectedCategory,
                description: newReport.description,
                status: 'Normal',
                insight: '',
                tags: [],
                fileUrl: uploadData.fileUrl || `/uploads/${uploadData.fileId}`,
                doctorId: selDrId && selDrId !== 'general' ? selDrId : undefined,
                date: (selDate && selDate !== 'all') ? new Date(selDate) : new Date()
            };

            const reportRes = await fetchWithAuth('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData)
            });

            if (reportRes.ok) {
                setShowUpload(false);
                fetchReports();
                setNewReport({ 
                    title: '', type: 'Lab Report', category: 'General', description: '', 
                    status: 'Normal', tags: '', insight: '', file: null,
                    doctorId: '', date: new Date().toISOString().split('T')[0]
                });
            }
        } catch (error: any) {
            console.error("Upload failed", error);
            setUploadError(error.message || "Upload failed. Please try again.");
        } finally {
            if (statusInterval) clearInterval(statusInterval);
            setUploading(false);
            setUploadProgress(0);
            setStatusMessage('');
        }
    };

    const currentVisitReports = (selDrId && selDate) ? reports.filter(r => {
        const dStr = new Date(r.date).toISOString().split('T')[0];
        const drMatches = selDrId === "general" ? !r.doctorId : r.doctorId?._id === selDrId;
        if (selDrId === 'general' && selDate === 'all') return drMatches;
        return drMatches && dStr === selDate;
    }) : [];

    const hasVisitRecords = currentVisitReports.length > 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center mb-8">
                <button
                    onClick={() => navigate("/")}
                    className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-[#1f232b] border border-neutral-200 dark:border-white/5 text-neutral-600 dark:text-neutral-300 font-black uppercase tracking-widest text-[10px] hover:border-themeAccent-500 dark:hover:border-themeAccent-500 transition-all shadow-sm hover:shadow-xl hover:shadow-themeAccent-500/10"
                >
                    <MdArrowBack className="group-hover:-translate-x-1 transition-transform" />
                    <span>{t("Secure Exit")}</span>
                </button>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-[#1f232b] p-8 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-900/5">
                <div className="space-y-2">
                    <h1 className="text-5xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight italic">
                        Health <span className="text-themeAccent-500 underline decoration-themeAccent-500/30 underline-offset-8">Vault</span>
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-sm font-medium">
                        Your secure, AI-organized medical digital repository.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group min-w-[300px]">
                        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-themeAccent-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search records, tags, or insights..."
                            className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 dark:bg-black/20 rounded-2xl border border-neutral-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-themeAccent-500/50 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex bg-neutral-100 dark:bg-black/40 p-1.5 rounded-2xl border border-neutral-200 dark:border-white/5">
                        <button 
                            onClick={() => setViewMode('folders')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'folders' ? 'bg-white dark:bg-themeAccent-500 shadow-md text-themeAccent-600 dark:text-white' : 'text-neutral-400 hover:text-neutral-600'}`}
                        >
                            <MdGridView className="text-xl" />
                        </button>
                        <button 
                            onClick={() => setViewMode('timeline')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-themeAccent-500 shadow-md text-themeAccent-600 dark:text-white' : 'text-neutral-400 hover:text-neutral-600'}`}
                        >
                            <MdTimeline className="text-xl" />
                        </button>
                    </div>

                    {(selDrId && selDate && (hasVisitRecords || showUpload || selDrId === 'general')) && (
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className="flex items-center gap-2 px-8 py-3.5 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-[1.2rem] font-bold hover:bg-themeAccent-500 dark:hover:bg-themeAccent-500 dark:hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <HiPlus className="text-xl" />
                            <span>{showUpload ? 'Back to View' : 'Deposit Record'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Breadcrumbs */}
            {(selDrId || selDate) && (
                <div className="flex items-center gap-2 text-sm font-bold tracking-tight px-2">
                    <button 
                        onClick={() => { setSelDrId(null); setSelDate(null); setShowUpload(false); }}
                        className="text-neutral-400 hover:text-themeAccent-500 transition-colors"
                    >
                        Vault
                    </button>
                    {selDrId && (
                        <>
                            <MdChevronRight className="text-neutral-300 text-lg" />
                            <button 
                                onClick={() => { setSelDate(null); setShowUpload(false); }}
                                className={`transition-colors ${!selDate ? 'text-themeAccent-500' : 'text-neutral-400 hover:text-themeAccent-500'}`}
                            >
                                {selDrId === 'general' ? 'General' : (allDoctors.find(d => d._id === selDrId)?.name || 'Doctor')}
                            </button>
                        </>
                    )}
                    {selDate && selDate !== 'all' && (
                        <>
                            <MdChevronRight className="text-neutral-300 text-lg" />
                            <span className="text-themeAccent-500 bg-themeAccent-500/10 px-3 py-1 rounded-full text-xs">
                                {new Date(selDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </>
                    )}
                </div>
            )}


            {/* Upload Modal / Form Area */}
            {showUpload && (
                <div className="bg-white dark:bg-[#1f232b] p-8 rounded-[3rem] shadow-2xl border border-neutral-100 dark:border-white/5 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-themeAccent-500 to-indigo-600" />
                    
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-themeAccent-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-themeAccent-500/20">
                                <HiPlus className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-neutral-800 dark:text-neutral-100 tracking-tight">Upload New Record</h3>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Secure clinical binary encapsulation</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowUpload(false)}
                            className="p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400 transition-all"
                        >
                            Cancel
                        </button>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 ml-1">Document Title</label>
                            <input
                                type="text"
                                className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-black/20 border border-neutral-200 dark:border-white/5 focus:ring-2 focus:ring-themeAccent-500 outline-none text-neutral-800 dark:text-neutral-100 transition-all placeholder:text-neutral-400 font-bold"
                                placeholder="e.g. Annual Blood Panel"
                                value={newReport.title}
                                onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 ml-1">Notes & Clinical Description</label>
                            <textarea
                                className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-black/20 border border-neutral-200 dark:border-white/5 focus:ring-2 focus:ring-themeAccent-500 outline-none text-neutral-800 dark:text-neutral-100 transition-all placeholder:text-neutral-400 font-medium h-24 resize-none"
                                placeholder="Added summary or remarks..."
                                value={newReport.description}
                                onChange={e => setNewReport({ ...newReport, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 ml-1">Attachment</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    required
                                />
                                <label 
                                    htmlFor="file-upload"
                                    className="flex items-center justify-between w-full px-8 py-6 rounded-[2rem] bg-neutral-50 dark:bg-black/20 border-2 border-dashed border-neutral-200 dark:border-white/10 hover:border-themeAccent-500 dark:hover:border-themeAccent-500 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neutral-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:text-themeAccent-500 group-hover:bg-themeAccent-500/10 transition-all">
                                            <HiDownload className="text-2xl" />
                                        </div>
                                        <div>
                                            <span className="block font-black text-neutral-800 dark:text-neutral-100 group-hover:text-themeAccent-500 transition-colors">
                                                {newReport.file ? newReport.file.name : 'Select Medical Document'}
                                            </span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">PDF, JPG, PNG or Scanned Copy</span>
                                        </div>
                                    </div>
                                    <div className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        Browse
                                    </div>
                                </label>
                            </div>

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                            <span>Vault Upload Progress</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-themeAccent-500 to-indigo-600 transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {statusMessage && (
                                        <div className="flex items-center gap-3 px-6 py-4 bg-themeAccent-500/5 dark:bg-white/5 rounded-2xl border border-themeAccent-500/10 animate-pulse">
                                            <HiRefresh className="text-themeAccent-500 animate-spin text-lg" />
                                            <p className="text-xs font-black text-themeAccent-500 uppercase tracking-widest italic">{statusMessage}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {uploadError && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in fade-in zoom-in duration-300">
                                <HiSparkles className="flex-shrink-0" />
                                <p className="text-xs font-bold uppercase tracking-widest">{uploadError}</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={uploading}
                                className="group flex items-center gap-3 px-12 py-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-themeAccent-500 dark:hover:bg-themeAccent-500 hover:text-white transition-all disabled:opacity-50 shadow-2xl shadow-neutral-900/20 active:scale-95"
                            >
                                {uploading ? 'Processing Vault...' : (
                                    <>
                                        <span>Securely Upload</span>
                                        <HiPlus className="text-lg group-hover:rotate-90 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showUpload && (
                <div className="min-h-[50vh]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <div className="w-16 h-16 border-4 border-themeAccent-500/10 border-t-themeAccent-500 rounded-full animate-spin mb-6"></div>
                            <div className="text-neutral-500 dark:text-neutral-400 font-bold italic tracking-widest text-sm uppercase">Synchronizing Vault...</div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#1f232b] rounded-[2.5rem] border border-red-500/10 shadow-xl max-w-md mx-auto">
                             <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 text-3xl">
                                <HiExclamation />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                                {error === "SESSION_EXPIRED" ? "Session Expired" : "Vault Access Issue"}
                            </h3>
                            <p className="text-neutral-500 text-sm italic px-8 text-center">
                                {error === "SESSION_EXPIRED" 
                                    ? "Your secure session has timed out for safety. Please log in again to access your medical records."
                                    : error}
                            </p>
                            {error === "SESSION_EXPIRED" ? (
                                <button 
                                    onClick={() => navigate("/login")}
                                    className="mt-4 px-12 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold hover:bg-themeAccent-500 transition-all active:scale-95 shadow-lg"
                                >
                                    Log In Again
                                </button>
                            ) : (
                                <button 
                                    onClick={fetchReports}
                                    className="mt-4 px-8 py-3 bg-themeAccent-500 text-white rounded-2xl font-bold hover:bg-themeAccent-600 shadow-lg shadow-themeAccent-500/20 transition-all active:scale-95"
                                >
                                    Retry Connection
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* View Selection & Filters Area */}
                            <div className="flex flex-col gap-6">
                                {viewMode === 'folders' && !selDate && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {/* Level 1: Doctors */}
                                        {!selDrId && (() => {
                                            const reportDrIds = reports.map(r => r.doctorId?._id).filter(Boolean);
                                            const apptDrIds = appointments.map(a => a.doctorId?._id || a.doctorId).filter(Boolean);
                                            const uniqueDrs = Array.from(new Set([...reportDrIds, ...apptDrIds]));

                                            const doctorCards = uniqueDrs.map(drId => {
                                                const drInfoFromReport = reports.find(r => r.doctorId?._id === drId)?.doctorId;
                                                const drInfoFromAppt = appointments.find(a => (a.doctorId?._id || a.doctorId) === drId)?.doctorId;
                                                const drInfo = drInfoFromReport || drInfoFromAppt;
                                                const fileCount = reports.filter(r => r.doctorId?._id === drId).length;

                                                return (
                                                    <button 
                                                        key={drId}
                                                        onClick={() => setSelDrId(drId as string)}
                                                        className="p-8 rounded-[2.5rem] bg-white dark:bg-[#1f232b] border border-neutral-100 dark:border-white/5 hover:border-themeAccent-500 transition-all flex flex-col items-center text-center gap-4 group shadow-lg shadow-neutral-900/5"
                                                    >
                                                        <div className="w-20 h-20 bg-themeAccent-500/10 rounded-3xl flex items-center justify-center text-themeAccent-500 text-4xl group-hover:scale-110 transition-transform duration-300">
                                                            <HiUser />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="font-black text-neutral-800 dark:text-neutral-100 tracking-tight">{drInfo?.name || "Doctor"}</h4>
                                                            <p className="text-[10px] uppercase font-black tracking-widest text-neutral-400">{drInfo?.specialty || "Specialist"}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] bg-neutral-100 dark:bg-white/5 px-3 py-1 rounded-full font-black text-neutral-400 uppercase">
                                                                {fileCount} Files
                                                            </span>
                                                            {appointments.filter(a => (a.doctorId?._id || a.doctorId) === drId).length > 0 && (
                                                                <span className="text-[10px] bg-themeAccent-500/10 dark:bg-themeAccent-500/20 px-3 py-1 rounded-full font-black text-themeAccent-500 uppercase">
                                                                    Synced
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            });

                                            return [
                                                <button 
                                                    key="general"
                                                    onClick={() => { setSelDrId("general"); setSelDate("all"); }}
                                                    className="p-8 rounded-[2.5rem] bg-gradient-to-br from-themeAccent-500 to-indigo-600 border border-themeAccent-400/20 hover:shadow-2xl hover:shadow-themeAccent-500/20 transition-all flex flex-col items-center text-center gap-4 group shadow-lg"
                                                >
                                                    <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-white text-4xl group-hover:scale-110 transition-transform duration-300">
                                                        <HiFolder />
                                                    </div>
                                                    <div className="space-y-1 text-white">
                                                        <h4 className="font-black tracking-tight">General</h4>
                                                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Miscellaneous Records</p>
                                                    </div>
                                                    <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-black text-white uppercase">
                                                        {reports.filter(r => !r.doctorId).length} Files
                                                    </span>
                                                </button>,
                                                ...doctorCards
                                            ];
                                        })()}

                                        {/* Level 2: Dates for selected Doctor */}
                                        {selDrId && selDrId !== 'general' && !selDate && (() => {
                                            const isGeneral = selDrId === "general";
                                            const drReports = reports.filter(r => isGeneral ? !r.doctorId : r.doctorId?._id === selDrId);
                                            const drAppts = isGeneral ? [] : appointments.filter(a => (a.doctorId?._id || a.doctorId) === selDrId);
                                            
                                            const reportDates = drReports.map(r => new Date(r.date).toISOString().split('T')[0]);
                                            const apptDates = drAppts.map(a => new Date(a.appointmentDate).toISOString().split('T')[0]);
                                            const uniqueDates = Array.from(new Set([...reportDates, ...apptDates]));

                                            if (isGeneral && uniqueDates.length === 0) {
                                                uniqueDates.push(new Date().toISOString().split('T')[0]);
                                            }

                                            return uniqueDates.sort((a, b) => b.localeCompare(a)).map(dateStr => {
                                                const dateRecords = drReports.filter(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
                                                const isFromApptOnly = dateRecords.length === 0;

                                                return (
                                                    <button 
                                                        key={dateStr}
                                                        onClick={() => setSelDate(dateStr)}
                                                        className={`p-8 rounded-[2.5rem] bg-white dark:bg-[#1f232b] border transition-all flex flex-col items-center text-center gap-4 group shadow-lg shadow-neutral-900/5 ${isFromApptOnly ? 'border-dashed border-neutral-300 dark:border-white/10' : 'border-neutral-100 dark:border-white/5 hover:border-themeAccent-500'}`}
                                                    >
                                                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 ${isFromApptOnly ? 'bg-neutral-100 dark:bg-white/5 text-neutral-300' : 'bg-blue-500/10 text-blue-500'}`}>
                                                            <HiCalendar />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="font-black text-neutral-800 dark:text-neutral-100 tracking-tight">
                                                                {new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </h4>
                                                            <p className="text-[10px] uppercase font-black tracking-widest text-neutral-400">
                                                                {isGeneral ? 'Collection' : isFromApptOnly ? 'Empty Visit' : 'Consultation Visit'}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${isFromApptOnly ? 'bg-themeAccent-500 text-white' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}>
                                                            {isFromApptOnly ? 'Deposit Info' : `${dateRecords.length} Files`}
                                                        </span>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Reports Grid/Timeline Area */}
                            {(viewMode === 'timeline' || (selDrId && selDate)) && (() => {
                                const results = reports
                                    .filter(r => {
                                        if (viewMode === 'timeline') return true;
                                        const dStr = new Date(r.date).toISOString().split('T')[0];
                                        const drMatches = selDrId === "general" ? !r.doctorId : r.doctorId?._id === selDrId;
                                        if (selDrId === 'general' && selDate === 'all') return drMatches;
                                        return drMatches && dStr === selDate;
                                    })
                                    .filter(r => {
                                        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                             r.description?.toLowerCase().includes(searchQuery.toLowerCase());
                                        return matchesSearch;
                                    });

                                if (selDrId && selDate && results.length === 0 && viewMode !== 'timeline') {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-black/20 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-white/10">
                                            <HiSparkles className="text-5xl text-themeAccent-500/30 mb-6" />
                                            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 italic">No Records for this Visit Yet</h3>
                                            <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-xs text-center text-sm font-medium">Ready to fulfill your medical history for this consultation?</p>
                                            <button
                                                onClick={() => {
                                                    const finalDate = (selDate === 'all' || !selDate) ? new Date().toISOString().split('T')[0] : selDate;
                                                    setNewReport({ ...newReport, doctorId: selDrId === 'general' ? '' : (selDrId as string), date: finalDate });
                                                    setShowUpload(true);
                                                }}
                                                className="px-8 py-3 bg-themeAccent-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-themeAccent-500/30 transition-all active:scale-95"
                                            >
                                                Deposit First Record
                                            </button>
                                        </div>
                                    );
                                }

                                if (results.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <HiSearch className="text-5xl text-neutral-300 mb-6" />
                                            <h3 className="text-xl font-bold text-neutral-500 italic">No matching records found</h3>
                                            <p className="text-neutral-400 text-sm">Try adjusting your search query</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className={viewMode === 'timeline' ? "relative before:absolute before:left-8 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 dark:before:bg-white/10 space-y-12 pb-12" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"}>
                                        {results.map((report) => (
                                            <div key={report._id} className={`group relative transition-all duration-500 hover:-translate-y-2 ${viewMode === 'timeline' ? 'ml-16' : ''}`}>
                                                <div className="bg-white dark:bg-[#1f232b] p-8 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-themeAccent-500/10 relative overflow-hidden h-full flex flex-col">
                                                    <div className="flex items-start justify-between mb-8">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                                            report.type === 'Lab Report' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white'
                                                        }`}>
                                                            {report.type === 'Lab Report' ? <HiBeaker className="text-2xl" /> : <HiClipboardList className="text-2xl" />}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest italic">
                                                            {new Date(report.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight mb-4 group-hover:text-themeAccent-500 transition-colors">{report.title}</h3>
                                                    {report.insight && (
                                                        <div className={`bg-themeAccent-500/5 dark:bg-white/5 p-4 rounded-2xl border border-themeAccent-500/10 flex gap-3 items-start mb-4 ${report.insight.toLowerCase().includes('analyzing') ? 'animate-pulse' : ''}`}>
                                                            {report.insight.toLowerCase().includes('analyzing') ? (
                                                                <HiRefresh className="text-themeAccent-500 text-lg flex-shrink-0 mt-0.5 animate-spin" />
                                                            ) : (
                                                                <HiSparkles className="text-themeAccent-500 text-lg flex-shrink-0 mt-0.5" />
                                                            )}
                                                            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300 italic line-clamp-3">{report.insight}</p>
                                                        </div>
                                                    )}
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium flex-1">{report.description}</p>
                                                    <div className="mt-8 pt-6 border-t border-neutral-50 dark:border-white/5 flex items-center justify-between">
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleDelete(report._id)}
                                                                className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all"
                                                                title="Delete Record"
                                                            >
                                                                <HiTrash className="text-lg" />
                                                            </button>
                                                            <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 pl-6 pr-5 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-themeAccent-500 dark:hover:bg-themeAccent-500 hover:text-white transition-all shadow-xl shadow-neutral-900/10">
                                                                <span>Open Vault</span>
                                                                <HiDownload className="text-base" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
