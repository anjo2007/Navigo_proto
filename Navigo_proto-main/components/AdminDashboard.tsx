
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { CrowdReport } from '../types';
import { useToast } from '../context/ToastContext';

interface AdminDashboardProps {
    onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'reports' | 'bulk'>('reports');
    const [reports, setReports] = useState<CrowdReport[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        // Initial fetch
        databaseService.getReports().then(setReports);

        // Real-time subscription
        const subscription = databaseService.subscribeToReports((payload) => {
            if (payload.eventType === 'INSERT') {
                const newReport = payload.new;
                setReports(prev => [{
                    id: newReport.id,
                    userId: newReport.user_id,
                    type: newReport.type,
                    level: newReport.level,
                    location: { lat: newReport.lat, lng: newReport.lng },
                    timestamp: new Date(newReport.created_at).getTime(),
                    status: newReport.status
                }, ...prev]);
                showToast("New crowd report received!", 'info');
            } else if (payload.eventType === 'UPDATE') {
                setReports(prev => prev.map(r => r.id === payload.new.id ? { ...r, status: payload.new.status } : r));
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [showToast]);

    const handleValidation = async (id: string, isValid: boolean) => {
        await databaseService.validateReport(id, isValid);
        showToast(`Report ${isValid ? 'verified' : 'rejected'}.`, isValid ? 'success' : 'info');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#121212] w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10">
                {/* Header */}
                <div className="bg-[#1E1E1E] p-6 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center">
                        <div className="bg-coral/20 p-2 rounded-lg mr-3">
                            <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Controller Dashboard</h2>
                            <p className="text-xs text-ash">System Integrity & Data Verification • <span className="text-neon animate-pulse">● Live</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-ash">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#121212]">
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`px-6 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'reports' ? 'border-neon text-neon' : 'border-transparent text-ash hover:text-white'}`}
                    >
                        Crowd Reports <span className="ml-2 bg-white/10 px-2 py-0.5 rounded-full text-xs">{reports.filter(r => r.status === 'PENDING').length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('bulk')}
                        className={`px-6 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'bulk' ? 'border-neon text-neon' : 'border-transparent text-ash hover:text-white'}`}
                    >
                        Bulk Data Ingestion
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#121212]">
                    {activeTab === 'reports' && (
                        <div className="space-y-4">
                            {reports.length === 0 && (
                                <div className="text-center py-20 text-ash">No reports to validate.</div>
                            )}
                            {reports.map((report) => (
                                <div key={report.id} className="bg-[#1E1E1E] p-4 rounded-xl border border-white/5 flex justify-between items-center animate-fade-in-up">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                                            report.level?.includes('CRUSHED') ? 'bg-red-900/50' : 'bg-green-900/50'
                                        }`}>
                                            {report.level?.includes('CRUSHED') ? '🔴' : '🟢'}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-bold text-white text-sm">{report.type}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                    report.status === 'PENDING' ? 'border-yellow-500/50 text-yellow-500' :
                                                    report.status === 'APPROVED' ? 'border-neon/50 text-neon' : 'border-coral/50 text-coral'
                                                }`}>{report.status}</span>
                                            </div>
                                            <p className="text-xs text-ash mt-1">
                                                User: <span className="text-azure">{report.userId.substring(0,8)}...</span> • {new Date(report.timestamp).toLocaleTimeString()}
                                            </p>
                                            <p className="text-sm text-gray-300 mt-1">Value: {report.level}</p>
                                        </div>
                                    </div>
                                    
                                    {report.status === 'PENDING' && (
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleValidation(report.id, false)}
                                                className="px-3 py-1.5 rounded-lg border border-coral text-coral hover:bg-coral/10 text-xs font-bold transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleValidation(report.id, true)}
                                                className="px-3 py-1.5 rounded-lg bg-neon/10 border border-neon text-neon hover:bg-neon/20 text-xs font-bold transition-colors"
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'bulk' && (
                        <div className="flex flex-col items-center justify-center h-full text-ash border-2 border-dashed border-white/10 rounded-xl p-10">
                           <p>Bulk CSV Upload Module</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
