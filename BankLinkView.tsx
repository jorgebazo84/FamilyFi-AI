import React, { useState } from 'react';
import { X, Landmark, ShieldCheck, ChevronRight, RefreshCw, CreditCard, CheckCircle2 } from 'lucide-react';
import { Button, Card } from './components.tsx';

export const BankLinkView = ({ setView, showToast, fetchData, API_URL }: any) => {
    const [step, setStep] = useState<'list' | 'linking' | 'success'>('list');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);

    const banks = [
        { id: 'bbva', name: 'BBVA', color: 'bg-blue-900' },
        { id: 'santander', name: 'Santander', color: 'bg-red-600' },
        { id: 'caixa', name: 'CaixaBank', color: 'bg-cyan-600' },
        { id: 'revolut', name: 'Revolut', color: 'bg-black' },
        { id: 'n26', name: 'N26', color: 'bg-teal-700' }
    ];

    const handleLink = (bank: string) => {
        setSelectedBank(bank);
        setStep('linking');
        setTimeout(() => {
            setStep('success');
            showToast(`Cuenta de ${bank} vinculada con éxito`);
        }, 2500);
    };

    const importData = async () => {
        // Simulación de importación de datos bancarios
        showToast("Sincronizando con el banco...", "info");
        setTimeout(async () => {
            const mockTransaction = {
                id: 'bank_' + Date.now(),
                amount: Math.floor(Math.random() * 50) + 10,
                description: "Pago con Tarjeta: Supermercado",
                category: "Hogar",
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                account: 'Bank Sync'
            };
            
            await fetch(`${API_URL}?action=save_transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(mockTransaction)
            });
            
            await fetchData();
            showToast("Nuevos movimientos importados");
            setView('dashboard');
        }, 1500);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-500">
            <header className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('settings')} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                    <h2 className="font-black text-slate-800">Cuentas Bancarias</h2>
                </div>
                <div className="bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase">PSD2 Secure</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {step === 'list' && (
                    <>
                        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                            <Landmark className="absolute -right-4 -bottom-4 opacity-20" size={100} />
                            <h3 className="text-xl font-black mb-2">Conecta tu Banco</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-90">
                                Sincroniza tus gastos automáticamente mediante Open Banking. Tus datos están cifrados y son de solo lectura.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bancos Disponibles</h4>
                            {banks.map(bank => (
                                <button 
                                    key={bank.id}
                                    onClick={() => handleLink(bank.name)}
                                    className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm active:scale-95 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 ${bank.color} rounded-xl flex items-center justify-center text-white font-black text-xs`}>
                                            {bank.name[0]}
                                        </div>
                                        <span className="font-bold text-slate-700">{bank.name}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300" />
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {step === 'linking' && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-20">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-slate-200 rounded-full animate-spin border-t-indigo-600"></div>
                            <Landmark className="absolute inset-0 m-auto text-indigo-600" size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Conectando con {selectedBank}</h3>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Estableciendo conexión segura mediante OAuth...</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 pt-10 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                            <CheckCircle2 size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800">¡Cuenta Vinculada!</h3>
                            <p className="text-slate-500 text-sm font-medium px-6">
                                Ahora FamilyFi puede leer tus movimientos de {selectedBank} automáticamente.
                            </p>
                        </div>
                        <Card className="w-full bg-slate-900 text-white border-none p-6">
                            <div className="flex justify-between items-start mb-10">
                                <CreditCard size={32} className="text-emerald-400" />
                                <span className="text-[10px] font-black tracking-widest opacity-50 uppercase">Visa Platinum</span>
                            </div>
                            <p className="text-lg font-mono tracking-[0.2em] mb-4">•••• •••• •••• 8842</p>
                            <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                                <span>Titular: {selectedBank?.toUpperCase()} USER</span>
                                <span>EXP: 12/28</span>
                            </div>
                        </Card>
                        <Button onClick={importData} className="w-full py-5 text-lg">
                            <RefreshCw size={20} /> Sincronizar Movimientos
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
