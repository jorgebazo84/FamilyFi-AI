import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, ArrowUpCircle, Loader2, Landmark, Users, Lock, ShieldCheck, Receipt, Globe, RefreshCw } from 'lucide-react';
import { Card, Button } from './components.tsx';
import { NotificationService } from './NotificationService.ts';
import { GoogleGenAI } from "@google/genai";

export const AddTransactionView = ({ setView, fetchData, settings, scannedData, showToast, isDemo, setTransactions, transactions, userEmail, API_URL }: any) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [form, setForm] = useState<any>({
        type: 'expense',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Otros',
        description: '',
        account: settings.accounts?.[0] || 'Principal',
        member: 'Me',
        isDeductible: false,
        taxAmount: 0,
        originalAmount: null,
        originalCurrency: settings.currency // Por defecto la moneda base
    });

    useEffect(() => {
        if (scannedData) {
            setForm(f => ({
                ...f,
                ...scannedData,
                amount: scannedData.amount.toString(),
                taxAmount: scannedData.taxAmount ? scannedData.taxAmount.toString() : '0'
            }));
        }
    }, [scannedData]);

    const isSharedAccount = useMemo(() => {
        return (settings.sharedAccounts || []).includes(form.account);
    }, [form.account, settings.sharedAccounts]);

    const currencies = ["€", "$", "£", "¥", "MXN", "CHF", "BTC"];

    const handleCurrencyChange = async (newCurrency: string) => {
        if (newCurrency === settings.currency) {
            setForm({ ...form, originalCurrency: newCurrency, originalAmount: null });
            return;
        }

        const currentAmount = parseFloat(form.amount);
        if (!currentAmount || isNaN(currentAmount)) {
            setForm({ ...form, originalCurrency: newCurrency });
            return;
        }

        setIsConverting(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un conversor de divisas preciso.
            Convierte ${currentAmount} ${newCurrency} a ${settings.currency} (moneda base del usuario).
            Usa el tipo de cambio del día de hoy (${new Date().toISOString().split('T')[0]}).
            Devuelve solo un número decimal.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });

            const convertedAmount = parseFloat(response.text.trim());
            if (!isNaN(convertedAmount)) {
                setForm({ 
                    ...form, 
                    originalCurrency: newCurrency, 
                    originalAmount: currentAmount,
                    amount: convertedAmount.toFixed(2)
                });
                showToast(`Cambio aplicado: 1 ${newCurrency} ≈ ${(convertedAmount/currentAmount).toFixed(4)} ${settings.currency}`, "info");
            }
        } catch (e) {
            showToast("No se pudo obtener el tipo de cambio", "error");
            setForm({ ...form, originalCurrency: newCurrency });
        } finally {
            setIsConverting(false);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const finalAmount = parseFloat(form.amount);
        
        if (isNaN(finalAmount) || finalAmount <= 0) {
            showToast("Importe no válido", "error");
            return;
        }
        if (!form.description.trim()) {
            showToast("Indica una descripción", "error");
            return;
        }

        setIsSaving(true);
        const transactionData = {
            ...form,
            id: Date.now().toString(),
            amount: finalAmount,
            taxAmount: parseFloat(form.taxAmount) || 0,
            member: 'Me'
        };

        try {
            const anomalyMessage = await NotificationService.checkAnomaly(transactionData, transactions, settings);

            if (isDemo) {
                const updatedTs = [transactionData, ...transactions];
                setTransactions(updatedTs);
                localStorage.setItem('demo_transactions', JSON.stringify(updatedTs));
                showToast("Movimiento registrado");
                if (anomalyMessage) setTimeout(() => showToast(anomalyMessage, "info"), 1500);
                setView('dashboard');
                return;
            }

            const res = await fetch(`${API_URL}?action=save_transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(transactionData)
            });
            
            if (res.ok) {
                showToast("Transacción guardada");
                if (anomalyMessage) setTimeout(() => showToast(anomalyMessage, "info"), 1500);
                await fetchData();
                setView('dashboard');
            } else {
                showToast("Error al guardar", "error");
            }
        } catch (e) { showToast("Error de conexión", "error"); } finally { setIsSaving(false); }
    };

    const isValid = parseFloat(form.amount) > 0 && form.description.trim().length > 0;

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            <header className="bg-white border-b border-slate-100 p-4 flex justify-between items-center shrink-0 z-20 shadow-sm">
                <button onClick={() => setView('dashboard')} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                <h2 className="text-lg font-black text-slate-800">Nueva Entrada</h2>
                <button 
                    onClick={() => handleSave()}
                    disabled={!isValid || isSaving || isConverting}
                    className={`p-2 rounded-full transition-all ${isValid ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
                </button>
            </header>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
                <Card className={`flex flex-col items-center p-8 transition-all ${form.type === 'income' ? 'bg-emerald-600' : 'bg-slate-800'} text-white border-none shadow-2xl relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={140} /></div>
                    <div className="flex gap-2 mb-8 bg-white/10 p-1 rounded-2xl w-full relative z-10 backdrop-blur-md">
                        <button type="button" onClick={() => setForm({ ...form, type: 'expense' })} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${form.type === 'expense' ? 'bg-white text-slate-800 shadow-lg' : 'text-white/50'}`}>Gasto</button>
                        <button type="button" onClick={() => setForm({ ...form, type: 'income' })} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${form.type === 'income' ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/50'}`}>Ingreso</button>
                    </div>

                    <div className="flex flex-col items-center gap-2 relative z-10 w-full">
                        <div className="flex items-center gap-3">
                            <select 
                                value={form.originalCurrency} 
                                onChange={(e) => handleCurrencyChange(e.target.value)}
                                className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-4 py-2 font-black text-2xl outline-none appearance-none cursor-pointer border border-white/10"
                            >
                                {currencies.map(c => <option key={c} value={c} className="text-slate-800">{c}</option>)}
                            </select>
                            <input 
                                type="number" 
                                inputMode="decimal" 
                                step="0.01" 
                                value={form.originalAmount || form.amount} 
                                onChange={e => {
                                    if (form.originalCurrency !== settings.currency) {
                                        setForm({...form, originalAmount: e.target.value});
                                    } else {
                                        setForm({...form, amount: e.target.value});
                                    }
                                }} 
                                className="text-5xl font-black text-center w-full bg-transparent outline-none placeholder-white/20" 
                                placeholder="0.00" 
                                autoFocus 
                            />
                        </div>
                        
                        {(form.originalCurrency !== settings.currency && form.originalAmount) && (
                            <div className="flex items-center gap-2 mt-2 bg-black/20 px-4 py-2 rounded-full border border-white/5 animate-in slide-in-from-top-1">
                                {isConverting ? (
                                    <RefreshCw size={14} className="animate-spin text-cyan-400" />
                                ) : (
                                    <Globe size={14} className="text-cyan-400" />
                                )}
                                <span className="text-xs font-black text-white/80">
                                    Convertido a: <span className="text-white">{form.amount}{settings.currency}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </Card>

                {form.type === 'expense' && (
                    <Card className={`p-4 border-none shadow-md ${form.isDeductible ? 'bg-indigo-50 border-indigo-100' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Receipt size={18} className={form.isDeductible ? 'text-indigo-600' : 'text-slate-400'} />
                                <span className="text-xs font-black uppercase text-slate-600">Gasto Profesional</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setForm({...form, isDeductible: !form.isDeductible})}
                                className={`w-12 h-6 rounded-full transition-all relative ${form.isDeductible ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isDeductible ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        
                        {form.isDeductible && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2 px-1">Importe de IVA / TAX Incluido</label>
                                <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-indigo-100">
                                    <ShieldCheck size={16} className="text-indigo-600" />
                                    <input 
                                        type="number" 
                                        value={form.taxAmount} 
                                        onChange={e => setForm({...form, taxAmount: e.target.value})}
                                        className="w-full bg-transparent outline-none font-bold text-slate-700" 
                                        placeholder="0.00"
                                    />
                                    <span className="text-xs font-black text-slate-300">{settings.currency}</span>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cuenta</label>
                        <select 
                            value={form.account} 
                            onChange={e => setForm({ ...form, account: e.target.value })} 
                            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 font-bold text-slate-700 outline-none"
                        >
                            {settings.accounts.map((acc: string) => <option key={acc} value={acc}>{acc}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Concepto</label>
                        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 font-bold text-slate-700 outline-none focus:border-slate-800 transition-colors" placeholder="¿Qué has comprado?" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoría</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 font-bold text-slate-700 outline-none">
                                {settings.customCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Fecha</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 font-bold text-slate-700 outline-none" />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Button onClick={() => handleSave()} disabled={!isValid || isSaving || isConverting} className={`w-full py-5 text-xl shadow-xl transition-all ${form.isDeductible ? 'bg-indigo-600' : (isSharedAccount ? 'bg-cyan-600' : 'bg-slate-900')}`}>
                        {isSaving ? <Loader2 className="animate-spin" /> : <><Check size={24} /> Confirmar {form.type === 'income' ? 'Ingreso' : 'Gasto'}</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};
