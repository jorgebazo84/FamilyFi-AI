import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Wallet, Camera, Coffee, ShoppingCart, TrendingUp, ShoppingBag, ArrowRight, Ghost, Landmark, Layers, Cpu, Users, User, Heart, Mic, MicOff, Loader2, Sparkles, Check, X, Clock, AlertCircle, Info, Building2 } from 'lucide-react';
import { Card, IconButton, EmptyState, Button } from './components.tsx';
import { PredictiveAnalysis } from './PredictiveAnalysis.tsx';
import { StrategicInsights } from './StrategicInsights.tsx';
import { SubscriptionAuditor } from './SubscriptionAuditor.tsx';
import { FinancialAnalytics } from './FinancialAnalytics.tsx';
import { GoogleGenAI, Type } from "@google/genai";
import { NotificationService } from './NotificationService.ts';
import { motion, AnimatePresence } from 'motion/react';

export const DashboardView = ({ transactions, allTransactions, settings, setView, startCamera, setScannedData, selectedAccount, setSelectedAccount, isDemo, setTransactions, fetchData, showToast, activeSpace, setActiveSpace, API_URL }: any) => {
    
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [confirmingEstimate, setConfirmingEstimate] = useState<any>(null);
    const [realAmount, setRealAmount] = useState('');
    const [isDismissed, setIsDismissed] = useState(() => localStorage.getItem('onboarding_seen') === 'true');
    
    const showOnboarding = !isDismissed && transactions.length < 3;

    const dismissOnboarding = () => {
        localStorage.setItem('onboarding_seen', 'true');
        setIsDismissed(true);
    };
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthly = transactions.filter((t: any) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const spent = monthly.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + Number(t.amount), 0);
    const income = monthly.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + Number(t.amount), 0);
    
    const balance = transactions.reduce((acc: number, t: any) => {
        return t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
    }, 0);

    const handleConfirmEstimate = async () => {
        if (!confirmingEstimate || !realAmount) return;
        const amount = parseFloat(realAmount);
        if (isNaN(amount)) return;
        
        const transactionData = {
            id: 'sum_' + Date.now().toString(),
            amount: amount,
            description: confirmingEstimate.description,
            date: new Date().toISOString().split('T')[0],
            category: confirmingEstimate.category,
            type: 'expense',
            account: confirmingEstimate.account,
            isConfirmed: true
        };

        if (isDemo) {
            const updated = [transactionData, ...allTransactions];
            setTransactions(updated);
            localStorage.setItem('demo_transactions', JSON.stringify(updated));
            showToast("Gasto confirmado");
            setConfirmingEstimate(null);
            return;
        }

        try {
            await fetch(`${API_URL}?action=save_transaction`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                credentials: 'include',
                body: JSON.stringify(transactionData) 
            });
            await fetchData();
            showToast("Gasto confirmado");
            setConfirmingEstimate(null);
        } catch (e) { showToast("Error al confirmar", "error"); }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                processVoiceCommand(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
            showToast("Escuchando...", "info");
        } catch (err) { showToast("Error de micrófono", "error"); }
    };

    const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } };

    const processVoiceCommand = async (audioBlob: Blob) => {
        setIsProcessingVoice(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Analiza este comando de voz financiero. Extrae JSON con: amount (number), description, category, type ('expense' o 'income'), account. Categorías: ${settings.customCategories.join(', ')}.`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                        parts: [
                            { inlineData: { mimeType: 'audio/webm', data: base64Audio } }, 
                            { text: prompt }
                        ]
                    },
                    config: { responseMimeType: "application/json" }
                });
                
                const result = JSON.parse(response.text.trim());
                if (result && result.amount > 0) {
                    setScannedData(result);
                    setView('add');
                } else {
                    showToast("No entendí bien el importe", "error");
                }
                setIsProcessingVoice(false);
            };
        } catch (e) { 
            showToast("Error de IA", "error"); 
            setIsProcessingVoice(false); 
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 relative scroll-smooth"
        >
            
            <AnimatePresence>
                {isProcessingVoice && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 glass-dark z-[100] flex flex-col items-center justify-center p-8 text-white"
                    >
                        <div className="relative mb-8">
                            <div className="w-24 h-24 border-4 border-cyan-500/20 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-cyan-400 animate-pulse" size={40} /></div>
                        </div>
                        <h2 className="text-xl font-black tracking-widest uppercase">Analizando Voz</h2>
                        <p className="text-slate-400 text-xs mt-2 font-bold tracking-widest">Sincronizando con Gemini AI...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass p-1.5 rounded-[2.5rem] flex items-center border border-white/50 shadow-xl mx-auto w-fit ring-1 ring-black/5"
            >
                <button onClick={() => setActiveSpace('personal')} className={`flex items-center gap-2 px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${activeSpace === 'personal' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400'}`}><User size={14} /> Personal</button>
                <button onClick={() => setActiveSpace('family')} className={`flex items-center gap-2 px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${activeSpace === 'family' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400'}`}><Users size={14} /> Familia</button>
            </motion.div>

            {/* BALANCE CARD PREMIUM */}
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-700 ${activeSpace === 'family' ? 'bg-indigo-600 shadow-indigo-200/50' : 'bg-slate-900 shadow-slate-900/20'}`}
            >
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-[60px]"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-[40px]"></div>
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="space-y-1">
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{activeSpace === 'family' ? 'Capital Familiar Disponible' : 'Balance Personal Total'}</p>
                        <h1 className="text-5xl font-black tracking-tighter text-white tabular-nums">
                            {balance.toLocaleString()}<span className="text-2xl ml-1 opacity-50 font-medium">{settings.currency}</span>
                        </h1>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xl border border-white/20 text-white">
                        {activeSpace === 'family' ? <Users size={24} /> : <User size={24} />}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10">
                        <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Ingresos Mes</p>
                        <div className="flex items-center gap-2 text-cyan-400">
                            <TrendingUp size={14} strokeWidth={3} />
                            <span className="font-black text-sm">+{income.toLocaleString()}{settings.currency}</span>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10">
                        <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Gastos Mes</p>
                        <div className="flex items-center gap-2 text-red-400">
                            <ShoppingBag size={14} strokeWidth={3} />
                            <span className="font-black text-sm">-{spent.toLocaleString()}{settings.currency}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {transactions.length > 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <PredictiveAnalysis transactions={transactions} allTransactions={transactions} settings={settings} selectedAccount={selectedAccount} />
                </motion.div>
            )}

            <div className="space-y-8">
                <FinancialAnalytics transactions={transactions} settings={settings} isSkeleton={transactions.length <= 5} />
                {transactions.length > 5 && (
                    <>
                        <StrategicInsights transactions={transactions} settings={settings} />
                        <SubscriptionAuditor transactions={transactions} settings={settings} />
                    </>
                )}
            </div>

            <div className="space-y-4 relative">
                <AnimatePresence>
                    {showOnboarding && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute -top-24 left-0 right-0 z-50 bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl border border-white/20"
                        >
                            <div className="flex gap-3">
                                <div className="bg-white/20 p-2 rounded-xl h-fit mt-1"><Info size={16} /></div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">Truco Pro</p>
                                    <p className="text-[11px] font-bold leading-relaxed">Usa el Scanner o la Voz IA para registrar gastos en segundos sin escribir nada.</p>
                                </div>
                                <button onClick={dismissOnboarding} className="p-1 hover:bg-white/10 rounded-lg h-fit"><X size={16} /></button>
                            </div>
                            <div className="absolute -bottom-2 left-12 w-4 h-4 bg-indigo-600 rotate-45 border-r border-b border-white/20"></div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Módulos Inteligentes</h3>
                <div className="flex gap-6 overflow-x-auto pb-2 hide-scrollbar -mx-6 px-6">
                    <IconButton icon={Camera} label="Scanner" onClick={startCamera} color="cyan" />
                    <IconButton icon={Building2} label="Casas & Luz" onClick={() => setView('utilities')} color="indigo" />
                    <IconButton icon={isRecording ? MicOff : Mic} label={isRecording ? "Grabando" : "Voz IA"} onClick={isRecording ? stopRecording : startRecording} color={isRecording ? "red" : "indigo"} />
                    <IconButton icon={Coffee} label="Gastros" onClick={() => { setScannedData({category:'Comida', description:'Restaurante', amount: 0, account: settings.sharedAccounts?.[0] || settings.accounts[0]}); setView('add'); }} color="orange" />
                    <IconButton icon={ShoppingCart} label="Súper" onClick={() => { setScannedData({category:'Hogar', description:'Compra Supermercado', amount: 0, account: settings.sharedAccounts?.[0] || settings.accounts[0]}); setView('add'); }} color="blue" />
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-cyan-600" /> Registro Reciente
                    </h2>
                    <button onClick={() => setView('planner')} className="text-cyan-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">Ver Historial <ArrowRight size={12} /></button>
                </div>
                <div className="space-y-3">
                    {transactions.length > 0 ? transactions.slice(0, 5).map((t: any, idx: number) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.1) }}
                        >
                            <Card className="p-4 flex items-center gap-4 hover:translate-x-1 transition-all group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${t.type === 'income' ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-50 text-slate-400'} relative`}>
                                    {t.type === 'income' ? <TrendingUp size={20} strokeWidth={2.5} /> : <ShoppingBag size={20} strokeWidth={2.5} />}
                                    {activeSpace === 'family' && t.member && (<div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[7px] font-black text-slate-800 shadow-sm">{t.member[0]}</div>)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 truncate text-xs uppercase tracking-tight mb-0.5">{t.description}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">{t.category}</span>
                                        {activeSpace === 'family' && (settings.sharedAccounts || []).includes(t.account) && (
                                            <div className="flex items-center gap-1 text-[7px] font-black text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                <Users size={8} /> Familiar
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black tabular-nums text-sm ${t.type === 'income' ? 'text-cyan-600' : 'text-slate-800'}`}>
                                        {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()}
                                    </p>
                                    <p className="text-[8px] font-bold text-slate-300 uppercase">{new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                                </div>
                            </Card>
                        </motion.div>
                    )) : (<EmptyState icon={Ghost} title="Silencio Financiero" message="Tu historial está listo para recibir el primer movimiento." />)}
                </div>
            </div>
        </motion.div>
    );
};
