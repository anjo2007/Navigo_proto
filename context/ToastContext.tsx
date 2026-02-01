
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl shadow-2xl backdrop-blur-md border animate-fade-in-up flex items-center ${
                            toast.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-white' :
                            toast.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-white' :
                            'bg-gray-800/80 border-gray-600/50 text-white'
                        }`}
                    >
                        <span className="mr-3 text-xl">
                            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
                        </span>
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};
