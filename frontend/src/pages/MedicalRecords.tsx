import React, { useState, useEffect } from 'react';
import { HiDocumentText, HiDownload, HiPlus, HiBeaker, HiClipboardList } from 'react-icons/hi';

interface Report {
    _id: string;
    type: 'Lab Report' | 'Prescription';
    title: string;
    description?: string;
    date: string;
    fileUrl: string;
    doctorName?: string; // If we fetch/populate this
    hospitalName?: string;
}

export default function MedicalRecords() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [newReport, setNewReport] = useState({
        title: '',
        type: 'Lab Report',
        description: '',
        file: null as File | null
    });

    // Mock data fetching or real API call
    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            // Retrieve patient name from profile or auth context in real app
            // For demo, we'll just fetch "My Reports" with a hardcoded name or just list all for the user
            const response = await fetch('/api/reports/my-reports?patientName=Demo User');
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewReport({ ...newReport, file: e.target.files[0] });
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReport.file || !newReport.title) return;

        setUploading(true);
        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append('file', newReport.file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadData.fileUrl && !uploadData.fileId) {
                // If S3 is not set up, backend might not return a persistent URL easily accessible 
                // but let's assume it returns something we can use or a placeholder
                throw new Error("File upload failed or S3 not configured");
            }

            // 2. Create Report Metadata
            // For demo, hardcode IDs
            const reportData = {
                title: newReport.title,
                type: newReport.type,
                description: newReport.description,
                fileUrl: uploadData.fileUrl || `/uploads/${uploadData.fileId}`,
                patientName: "Demo User",
                // random valid mongo IDs for demo to pass validation
                doctorId: "65d3d0f0c000000000000001",
                patientId: "65d3d0f0c000000000000002",
                date: new Date()
            };

            const reportRes = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData)
            });

            if (reportRes.ok) {
                setShowUpload(false);
                fetchReports(); // Refresh list
                setNewReport({ title: '', type: 'Lab Report', description: '', file: null });
            }

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Ensure backend has file storage configured.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Medical Records</h1>
                    <p className="text-neutral-500">View and manage your lab reports and prescriptions.</p>
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors shadow-sm"
                >
                    <HiPlus className="text-lg" />
                    <span>Add Record</span>
                </button>
            </div>

            {/* Upload Modal / Form Area */}
            {showUpload && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-lg mb-4">Upload New Record</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="e.g. Blood Test Results"
                                    value={newReport.title}
                                    onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    value={newReport.type}
                                    onChange={e => setNewReport({ ...newReport, type: e.target.value as any })}
                                >
                                    <option>Lab Report</option>
                                    <option>Prescription</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                                placeholder="Optional notes..."
                                value={newReport.description}
                                onChange={e => setNewReport({ ...newReport, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                            <input
                                type="file"
                                className="w-full"
                                onChange={handleFileChange}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowUpload(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Upload Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Records Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading records...</div>
            ) : reports.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <HiDocumentText className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                    <p className="text-gray-500 mt-1">Upload your first medical record to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <div key={report._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.type === 'Lab Report' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {report.type === 'Lab Report' ? <HiBeaker className="text-2xl" /> : <HiClipboardList className="text-2xl" />}
                                </div>
                                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                    {new Date(report.date).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="font-bold text-gray-800 mb-1 group-hover:text-cyan-600 transition-colors">{report.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{report.description || `Medical ${report.type}`}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{report.type}</span>
                                <a
                                    href={report.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-sm font-medium text-cyan-500 hover:text-cyan-700"
                                >
                                    <HiDownload />
                                    <span>Download</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
