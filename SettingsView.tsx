import React, { useState } from 'react';
import { Wallet, LogOut, Landmark, Plus, Trash2, Share2, ShieldCheck, Calendar, ArrowUpRight, X, Users, Lock, Eye, EyeOff, Fingerprint, Smartphone, Link as LinkIcon, Copy } from 'lucide-react';
import { Card, Button } from './components.tsx';
import { AppLogo } from './index.tsx';
import { RecurrentExpensesSection } from './RecurrentExpensesSection.tsx';
import { RecurrentIncomesSection } from './RecurrentIncomesSection.tsx';

export const SettingsView = ({ settings, userEmail, handleLogout, fetchData, isDemo, setSettings, setView, showToast, API_URL }: any) => {
    const [newAcc, setNewAcc] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    
    const saveSettings = async (updates: any) => {
        const newSettings = { ...settings, ...updates };
        if (isDemo) {
            setSettings(newSettings);
            localStorage.setItem('demo_settings', JSON.stringify(newSettings));
            return;
        }
        try {
            await fetch(`${API_URL}?action=save_settings`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(newSettings)
            });
            fetchData();
            showToast("Ajustes sincronizados");
        } catch (e) { console.error(e); }
    };

    const linkFamily = () => {
        if (!linkInput.startsWith('FAM-')) {
            showToast("Código de familia no válido", "error");
            return;
        }
        saveSettings({ familyId: linkInput.toUpperCase() });
        showToast("Vinculación familiar actualizada");
        setLinkInput('');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Código copiado al portapapeles");
    };

    const enableBiometry = async () => {
        if (!window.PublicKeyCredential) {
            showToast("Tu dispositivo no soporta biometría web", "error");
            return;
        }

        setIsLinking(true);
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "FamilyFi AI" },
                    user: {
                        id: new Uint8Array(16),
                        name: userEmail,
                        displayName: userEmail
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: { userVerification: "required" },
                    timeout: 60000
                }
            });

            if (credential) {
                await saveSettings({ biometryEnabled: true });
                showToast("¡Biometría vinculada con éxito!");
            }
        } catch (e) {
            console.error(e);
            showToast("No se pudo vincular la biometría", "error");
        } finally {
            setIsLinking(false);
        }
    };

    const addAccount = () => {
        if (!newAcc.trim()) return;
        if (settings.accounts.includes(newAcc)) return;
        saveSettings({ accounts: [...settings.accounts, newAcc] });
        setNewAcc('');
    };

    const removeAccount = (acc: string) => {
        if (settings.accounts.length <= 1) return;
        saveSettings({ accounts: settings.accounts.filter((a: string) => a !== acc) });
    };

    const toggleShared = (acc: string) => {
        const shared = settings.sharedAccounts || [];
        if (shared.includes(acc)) {
            saveSettings({ sharedAccounts: shared.filter((s: string) => s !== acc) });
        } else {
            saveSettings({ sharedAccounts: [...shared, acc] });
        }
    };

    return (
        <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-32 animate-in fade-in">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ajustes Core</h2>
            
            <Card className="flex items-center gap-4 border-cyan-50 bg-cyan-50/20">
                <div className="w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-white">
                    {userEmail?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">Master Identity</p>
                    <p className="font-bold text-slate-800 text-sm truncate">{userEmail}</p>
                </div>
                <button className="p-2 text-slate-300 hover:text-cyan-600 transition-colors"><Share2 size={18} /></button>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <Users size={16} className="text-cyan-600" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vínculo Familiar</h3>
                </div>
                <Card className="bg-slate-900 p-5 text-white border-none shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><LinkIcon size={80} /></div>
                    <div className="relative z-10 space-y-4">
                        <div>
                            <label className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.2em] block mb-1">Tu Family ID (Comparte este)</label>
                            <div className="bg-white/10 p-3 rounded-xl flex items-center justify-between border border-white/5">
                                <span className="font-mono font-black text-xs text-cyan-400 tracking-wider">{settings.familyId}</span>
                                <button onClick={() => copyToClipboard(settings.familyId)} className="text-white/40 hover:text-white transition-colors">
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Vincular con el ID de tu Pareja</label>
                            <div className="flex gap-2">
                                <input 
                                    value={linkInput} 
                                    onChange={e => setLinkInput(e.target.value)}
                                    placeholder="FAM-..."
                                    className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl font-mono text-xs text-white outline-none focus:border-cyan-500/50"
                                />
                                <button onClick={linkFamily} className="bg-cyan-600 text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                                    Vincular
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <Lock size={16} className="text-cyan-600" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seguridad y Acceso</h3>
                </div>
                <Card className="p-4 bg-white shadow-md border-slate-50">
                    <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
                                <Fingerprint size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Biometría (FaceID/TouchID)</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Protección de Bóveda</p>
                            </div>
                        </div>
                        <button 
                            onClick={enableBiometry}
                            disabled={isLinking}
                            className={`w-12 h-6 rounded-full transition-all relative ${settings.biometryEnabled ? 'bg-cyan-600' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.biometryEnabled ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <Landmark size={16} className="text-cyan-600" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuentas y Privacidad</h3>
                </div>
                
                <Card className="p-4 space-y-4 bg-white shadow-md border-slate-50">
                    <div className="flex gap-2">
                        <input 
                            value={newAcc} 
                            onChange={e => setNewAcc(e.target.value)}
                            placeholder="Añadir nueva cuenta..."
                            className="flex-1 bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none border border-slate-100 focus:border-cyan-500 transition-colors"
                        />
                        <button onClick={addAccount} className="bg-cyan-600 text-white px-5 rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={20}/></button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
                        {settings.accounts.map((acc: string) => {
                            const isShared = (settings.sharedAccounts || []).includes(acc);
                            return (
                                <div key={acc} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${isShared ? 'bg-cyan-400 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <span className="font-bold text-slate-700 text-sm">{acc}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleShared(acc)} className={`p-2 rounded-lg transition-colors ${isShared ? 'text-cyan-600 bg-cyan-50' : 'text-slate-300'}`}>
                                            {isShared ? <Users size={16} /> : <Lock size={16} />}
                                        </button>
                                        <button onClick={() => removeAccount(acc)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            <div className="space-y-8">
                <RecurrentIncomesSection settings={settings} saveSettings={saveSettings} />
                <RecurrentExpensesSection settings={settings} saveSettings={saveSettings} />
            </div>

            <div className="pt-4 space-y-8">
                <Button variant="danger" className="w-full py-5 shadow-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all" onClick={handleLogout}>
                    <LogOut size={20}/> Cerrar Sesión Segura
                </Button>
                
                <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 opacity-30">
                        <AppLogo size={16} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FamilyFi-AI Core</p>
                    </div>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Build V.1.0.5-Stable • PWA Optimized</p>
                </div>
            </div>
        </div>
    );
};
