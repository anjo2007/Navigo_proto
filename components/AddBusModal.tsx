
import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { databaseService } from '../services/databaseService';
import PlusIcon from './icons/PlusIcon';
import MinusIcon from './icons/MinusIcon';

interface AddBusModalProps {
    onClose: () => void;
}

interface BusStop {
    id: string;
    name: string;
    time: string;
}

const AddBusModal: React.FC<AddBusModalProps> = ({ onClose }) => {
    const [busNumber, setBusNumber] = useState('');
    const [startStand, setStartStand] = useState('');
    const [endStand, setEndStand] = useState('');
    const [stops, setStops] = useState<BusStop[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleAddStop = () => {
        setStops([...stops, { id: Math.random().toString(36).substr(2, 9), name: '', time: '' }]);
    };

    const handleRemoveStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };

    const handleStopChange = (id: string, field: 'name' | 'time', value: string) => {
        setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!busNumber || !startStand || !endStand) {
            showToast("Please fill in the main bus details.", 'error');
            return;
        }

        if (stops.some(s => !s.name || !s.time)) {
            showToast("Please complete all stop details.", 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                busNumber,
                startStand,
                endStand,
                stops
            };
            
            await databaseService.submitBusContribution(payload);
            showToast("Bus route submitted for approval!", 'success');
            onClose();
        } catch (error: any) {
            showToast(error.message || "Failed to submit route", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1E1E1E]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <span className="bg-neon/20 text-neon p-2 rounded-lg mr-3">🚌</span>
                            Add Bus Route
                        </h2>
                        <p className="text-xs text-ash mt-1">Contribute to the community transport network.</p>
                    </div>
                    <button onClick={onClose} className="text-ash hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#121212]">
                    <form id="bus-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Main Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neon uppercase tracking-wider mb-2">Bus Number</label>
                                <input 
                                    type="text" 
                                    value={busNumber} 
                                    onChange={e => setBusNumber(e.target.value)}
                                    placeholder="e.g. 500D"
                                    className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-ash uppercase tracking-wider mb-2">Route Span</label>
                                <div className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        value={startStand}
                                        onChange={e => setStartStand(e.target.value)}
                                        placeholder="Start Bus Stand"
                                        className="flex-1 bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                                    />
                                    <div className="flex items-center text-ash">→</div>
                                    <input 
                                        type="text" 
                                        value={endStand}
                                        onChange={e => setEndStand(e.target.value)}
                                        placeholder="End Bus Stand"
                                        className="flex-1 bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Intermediate Stops */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-xs font-bold text-ash uppercase tracking-wider">Intermediate Stops</label>
                                <button 
                                    type="button" 
                                    onClick={handleAddStop}
                                    className="flex items-center space-x-1 text-xs font-bold text-neon hover:text-white transition-colors bg-neon/10 px-3 py-1.5 rounded-lg border border-neon/20"
                                >
                                    <PlusIcon className="w-3 h-3" />
                                    <span>Add Stop</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {stops.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl text-ash text-sm">
                                        No intermediate stops added yet. Click "Add Stop" to begin.
                                    </div>
                                )}
                                {stops.map((stop, index) => (
                                    <div key={stop.id} className="flex space-x-3 items-center animate-fade-in">
                                        <span className="text-ash font-mono text-xs w-6">{index + 1}.</span>
                                        <input 
                                            type="text" 
                                            value={stop.name}
                                            onChange={e => handleStopChange(stop.id, 'name', e.target.value)}
                                            placeholder="Stop Name"
                                            className="flex-1 bg-[#1E1E1E] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-neon outline-none"
                                        />
                                        <input 
                                            type="time" 
                                            value={stop.time}
                                            onChange={e => handleStopChange(stop.id, 'time', e.target.value)}
                                            className="w-32 bg-[#1E1E1E] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-neon outline-none"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveStop(stop.id)}
                                            className="p-2 text-coral hover:bg-coral/10 rounded-lg transition-colors"
                                            title="Remove Stop"
                                        >
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#1E1E1E] flex justify-end space-x-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-ash font-bold hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="bus-form"
                        disabled={loading}
                        className="px-8 py-3 bg-neon text-void font-bold rounded-xl hover:bg-green-400 transition-colors shadow-lg disabled:opacity-50 flex items-center"
                    >
                        {loading ? 'Submitting...' : 'Submit Route'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddBusModal;
