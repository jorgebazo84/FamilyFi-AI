import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Home, 
  PieChart as PieChartIcon, 
  Plus, 
  Settings, 
  BrainCircuit, 
  Lock, 
  Calendar as CalendarIcon, 
  Users, 
  User, 
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Camera,
  Mic,
  MicOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Fingerprint,
  Bot,
  Unlock as UnlockIcon,
  LogOut,
  Info,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { DashboardView } from './DashboardView.tsx';
import { AIView } from './AIView.tsx';
import { AuthView } from './AuthView.tsx';
import { PlannerView } from './PlannerView.tsx';
import { SettingsView } from './SettingsView.tsx';
import { ScannerView } from './ScannerView.tsx';
import { AddTransactionView } from './AddTransactionView.tsx';
import { CalendarView } from './CalendarView.tsx';
import { UtilitiesManagerView } from './UtilitiesManagerView.tsx';
import { Toast } from './components.tsx';
import { NotificationService } from './NotificationService.ts';

// API endpoint unificado para Node.js / Render + Turso
const API_URL = '/api';

export const AppLogo = ({ size = 40, className = "" }: { size?: number, className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
            <rect x="10" y="10" width="80" height="80" rx="24" fill="#0f172a" />
            <path d="M30 70 V50 M50 70 V35 M70 70 V25" stroke="url(#logoGrad)" strokeWidth="8" strokeLinecap="round" />
            <path d="M25 45 L50 20 L75 45" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.3" />
            <circle cx="50" cy="50" r="6" fill="white" className="animate-pulse" />
        </svg>
    </div>
);

const MOCK_DATA = {
    transactions: [
        { id: 'm1', amount: 2450, description: 'Nómina Mensual', category: 'Trabajo', date: new Date().toISOString().split('T')[0], type: 'income', account: 'Nómina', member: 'Me' }
    ],
    settings: { 
        monthlyBudget: 1800, 
        currency: '€', 
        customCategories: ['Comida', 'Hogar', 'Ocio', 'Salud', 'Trabajo', 'Transporte', 'Otros'], 
        accounts: ['Personal', 'Nómina', 'Gastos Comunes'],
        sharedAccounts: ['Gastos Comunes'],
        securityPin: null,
        biometryEnabled: false,
        familyId: 'FAM-DEMO-2025',
        recurrentIncomes: []
    }
};

const App = () => {
    const [view, setView] = useState<'welcome' | 'auth' | 'lock' | 'dashboard' | 'scan' | 'add' | 'planner' | 'settings' | 'ai' | 'calendar'>('welcome');
    const [activeSpace, setActiveSpace] = useState<'personal' | 'family'>('personal');
    const [selectedAccount, setSelectedAccount] = useState<string | 'all'>('all');
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(MOCK_DATA.settings);
    const [loading, setLoading] = useState(true);
    const [scannedData, setScannedData] = useState<any>(null);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    }, []);

    const fetchData = async () => {
        if (isDemo) return;
        try {
            const res = await fetch(`${API_URL}?action=get_data`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.transactions) setTransactions(data.transactions.map((t: any) => ({...t, amount: Number(t.amount)})));
                if (data.settings) setSettings(data.settings);
                
                if (data.settings?.biometryEnabled && view === 'welcome') {
                    setView('lock');
                } else if (view === 'welcome' || view === 'auth') {
                    setView('dashboard');
                }
            }
        } catch (e: any) { 
            console.error("Fetch Data Error:", e);
        }
    };

    const checkAuth = async () => {
        const demoSession = localStorage.getItem('familyfi_demo');
        if (demoSession === 'true') {
            enterDemoMode();
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}?action=check_auth`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    setUserEmail(data.email);
                    await fetchData();
                } else { 
                    setView('welcome'); 
                }
            }
        } catch (e) { 
            setView('welcome'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleUnlock = async () => {
        if (!settings.biometryEnabled) {
            setView('dashboard');
            return;
        }
        setIsUnlocking(true);
        try {
            // Lógica real de WebAuthn para biometría
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: "required"
                }
            });

            if (assertion) {
                showToast("Acceso Concedido");
                setView('dashboard');
            }
        } catch (e) {
            console.error("Biometric Error:", e);
            showToast("Error Biométrico o Cancelado", "error");
        } finally {
            setIsUnlocking(false);
        }
    };

    const enterDemoMode = () => {
        setIsDemo(true);
        setUserEmail('demo@familyfi.ai');
        localStorage.setItem('familyfi_demo', 'true');
        const savedTs = localStorage.getItem('demo_transactions');
        const savedSt = localStorage.getItem('demo_settings');
        setTransactions(savedTs ? JSON.parse(savedTs) : MOCK_DATA.transactions);
        setSettings(savedSt ? JSON.parse(savedSt) : MOCK_DATA.settings);
        setView('dashboard');
    };

    useEffect(() => { 
        checkAuth();
        NotificationService.requestPermission();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        if (isDemo) localStorage.removeItem('familyfi_demo');
        else fetch(`${API_URL}?action=logout`, { credentials: 'include' });
        setIsDemo(false);
        setUserEmail(null);
        setView('welcome');
    };

    const commonProps = { 
        transactions, settings, userEmail, setView, fetchData, showToast, isDemo, setTransactions, setSettings,
        selectedAccount, setSelectedAccount, activeSpace, setActiveSpace, allTransactions: transactions, API_URL,
        handleBiometricAuth: handleUnlock
    };

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white">
            <AppLogo size={100} className="mb-6 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tighter">FamilyFi <span className="text-cyan-400">AI</span></h1>
            <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.4em]">Optimizando Núcleo...</p>
        </div>
    );

    return (
        <div className={`h-full flex flex-col max-w-md mx-auto w-full shadow-2xl relative overflow-hidden font-sans transition-colors duration-700 ${activeSpace === 'family' ? 'bg-indigo-50/30' : 'bg-slate-50'}`}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <AnimatePresence mode="wait">
                {view === 'welcome' && (
                  <motion.div 
                    key="welcome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center text-white relative"
                  >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px]"></div>
                      <AppLogo size={120} className="mb-8" />
                      <h1 className="text-4xl font-black tracking-tighter mb-4">Finanzas <span className="text-cyan-400">Inteligentes</span></h1>
                      <p className="text-slate-400 font-medium mb-12">Gestiona tus gastos y el ahorro familiar con inteligencia artificial.</p>
                      <div className="w-full space-y-4 relative z-10">
                          <button onClick={() => setView('auth')} className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Empezar</button>
                          
                          <button onClick={handleUnlock} className="w-full py-5 bg-cyan-600/20 text-cyan-400 rounded-[2rem] font-black text-xs uppercase tracking-widest border border-cyan-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">
                              <Fingerprint size={18} /> Acceso Biométrico
                          </button>

                          <button onClick={enterDemoMode} className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest border border-slate-700 active:scale-95 transition-all">Modo Demo</button>
                      </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {view !== 'welcome' && view !== 'ai' && view !== 'scan' && view !== 'auth' && view !== 'lock' && (
                <motion.header 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="pt-safe-top glass border-b border-white/50 px-6 py-4 flex justify-between items-center z-30 sticky top-0 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <AppLogo size={42} />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-slate-800 tracking-tighter leading-none">FamilyFi <span className="text-cyan-600">AI</span></h1>
                            </div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isDemo ? 'Invitado' : 'Core v1.0.5-Stable'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('utilities')} title="Facturas & Inmuebles" className={`p-2.5 rounded-xl active:scale-90 transition-all ${view === 'utilities' ? 'bg-cyan-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Building2 size={18}/></button>
                        <button onClick={() => setView('ai')} className="bg-cyan-500/10 p-2.5 rounded-xl text-cyan-600 active:scale-90 transition-all"><BrainCircuit size={18}/></button>
                        <button onClick={() => setView('settings')} className="bg-slate-50 p-2.5 rounded-xl text-slate-500 active:scale-90 transition-all"><Settings size={18}/></button>
                    </div>
                </motion.header>
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {view === 'auth' && <AuthView {...commonProps} setUserEmail={setUserEmail} onDemo={enterDemoMode} />}
                        {view === 'dashboard' && <DashboardView {...commonProps} setScannedData={setScannedData} startCamera={() => setView('scan')} />}
                        {view === 'ai' && <AIView {...commonProps} />}
                        {view === 'planner' && <PlannerView {...commonProps} />}
                        {view === 'settings' && <SettingsView {...commonProps} handleLogout={handleLogout} />}
                        {view === 'add' && <AddTransactionView {...commonProps} scannedData={scannedData} />}
                        {view === 'scan' && <ScannerView {...commonProps} setScannedData={setScannedData} />}
                        {view === 'calendar' && <CalendarView {...commonProps} />}
                        {view === 'utilities' && <UtilitiesManagerView setView={setView} showToast={showToast} />}
                        
                        {view === 'lock' && (
                            <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 text-white">
                                <Lock size={64} className="mb-6 text-cyan-500 animate-pulse" />
                                <h1 className="text-3xl font-black mb-12 tracking-tighter text-center">Acceso Protegido</h1>
                                <button 
                                    onClick={handleUnlock}
                                    disabled={isUnlocking}
                                    className="w-full bg-cyan-600 py-5 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                                >
                                    {isUnlocking ? <Loader2 className="animate-spin" /> : <UnlockIcon />} Acceder a la Bóveda
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {view !== 'welcome' && view !== 'scan' && view !== 'auth' && view !== 'lock' && (
                <motion.nav 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="glass border-t border-white/50 pb-safe-bottom px-8 py-4 flex justify-between items-center fixed bottom-6 left-6 right-6 rounded-[2.5rem] z-30 shadow-2xl ring-1 ring-black/5"
                >
                    <button onClick={() => setView('dashboard')} className={`transition-all ${view === 'dashboard' ? 'text-cyan-600 scale-125' : 'text-slate-300'}`}><Home size={22}/></button>
                    <button onClick={() => setView('calendar')} className={`transition-all ${view === 'calendar' ? 'text-cyan-600 scale-125' : 'text-slate-300'}`}><CalendarIcon size={22}/></button>
                    <button onClick={() => { setScannedData(null); setView('add'); }} className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all ring-4 ring-white">
                        <Plus size={24} strokeWidth={3} />
                    </button>
                    <button onClick={() => setView('planner')} className={`transition-all ${view === 'planner' ? 'text-cyan-600 scale-125' : 'text-slate-300'}`}><PieChartIcon size={22}/></button>
                    <button onClick={() => setView('settings')} className={`transition-all ${view === 'settings' ? 'text-cyan-600 scale-125' : 'text-slate-300'}`}><Settings size={22}/></button>
                </motion.nav>
            )}
        </div>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
}
