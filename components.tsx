import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
    const base = "px-4 py-3.5 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 uppercase text-[10px] tracking-widest";
    const variants: any = {
        primary: "bg-slate-900 text-white shadow-slate-900/10 shadow-xl hover:bg-slate-800",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-md",
        danger: "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-100",
        ghost: "bg-transparent text-slate-400 hover:text-slate-800 hover:bg-slate-100"
    };
    return (
        <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

export const Card = ({ children, className = '', onClick }: any) => {
    const hasCustomBg = className.includes('bg-');
    return (
        <div 
            onClick={onClick} 
            className={`${hasCustomBg ? '' : 'bg-white'} rounded-[2rem] p-6 shadow-xl shadow-slate-900/5 border border-white/40 ${className}`}
        >
            {children}
        </div>
    );
};

export const IconButton = ({ icon: Icon, label, onClick, color = "cyan" }: any) => {
    const colorMap: any = {
        cyan: "text-cyan-600 bg-cyan-50 border-cyan-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        red: "text-red-600 bg-red-50 border-red-100"
    };
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 min-w-[75px] group">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-active:scale-90 shadow-lg border-2 ${colorMap[color] || colorMap.cyan}`}>
                <Icon size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-800 transition-colors">{label}</span>
        </button>
    );
};

export const Toast = ({ message, type = 'success', onClose }: any) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons: any = {
        success: <CheckCircle className="text-cyan-500" size={18} />,
        error: <AlertCircle className="text-red-500" size={18} />,
        info: <Info className="text-indigo-500" size={18} />
    };

    return (
        <div className="fixed top-24 left-6 right-6 z-[60] animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="glass shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 border border-white/50">
                <div className="shrink-0">{icons[type]}</div>
                <span className="text-xs font-black text-slate-800 flex-1 tracking-tight">{message}</span>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={16}/></button>
            </div>
        </div>
    );
};

export const EmptyState = ({ icon: Icon, title, message }: any) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4 opacity-40">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Icon size={36} strokeWidth={1.5} />
        </div>
        <div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{title}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-1 leading-relaxed max-w-[200px]">{message}</p>
        </div>
    </div>
);
