import React, { useState } from 'react';
import { Calendar, ArrowDownRight, Plus, X, Trash2, Ghost, Clock } from 'lucide-react';
import { Card, Button } from './components.tsx';

export const RecurrentExpensesSection = ({ settings, saveSettings }: any) => {
    const [showForm, setShowForm] = useState(false);
    
    const [form, setForm] = useState({
        amount: '',
        description: '',
        category: 'Hogar',
        account: settings.accounts[0],
        dayOfMonth: '1',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        hasEndDate: false,
        isEstimated: false,
        type: 'expense'
    });

    const handleAdd = () => {
        const rule = {
            id: 'exp_' + Date.now().toString(),
            ...form,
            amount: parseFloat(form.amount)
        };
        const current = settings.recurrentIncomes || []; 
        saveSettings({ recurrentIncomes: [...current, rule] });
        setShowForm(false);
        setForm({ ...form, amount: '', description: '', isEstimated: false });
    };

    const remove = (id: string) => {
        const current = settings.recurrentIncomes || [];
        saveSettings({ recurrentIncomes: current.filter((r: any) => r.id !== id) });
    };

    const expenses = (settings.recurrentIncomes || []).filter((r: any) => r.type === 'expense');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-red-500" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gastos Recurrentes</h3>
                </div>
                <button 
                    onClick={() => setShowForm(true)}
                    className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-3 py-1 rounded-full"
                >
                    Configurar Gasto
                </button>
            </div>

            {showForm && (
                <Card className="p-4 bg-red-50/30 border-red-100 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black text-red-800">Nuevo Gasto Automático</h4>
                        <button onClick={() => setShowForm(false)} className="text-slate-400"><X size={18}/></button>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Cuenta de Cargo</label>
                            <select 
                                value={form.account} 
                                onChange={e => setForm({...form, account: e.target.value})}
                                className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                            >
                                {settings.accounts.map((acc: string) => <option key={acc} value={acc}>{acc}</option>)}
                            </select>
                        </div>
                        <input 
                            placeholder="Importe Promedio (Ej: 60)" 
                            type="number"
                            value={form.amount}
                            onChange={e => setForm({...form, amount: e.target.value})}
                            className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                        />
                        <input 
                            placeholder="Descripción (Ej: Factura Luz)" 
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Día del Mes</label>
                                <input 
                                    type="number" min="1" max="31" 
                                    value={form.dayOfMonth}
                                    onChange={e => setForm({...form, dayOfMonth: e.target.value})}
                                    className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Inicio</label>
                                <input 
                                    type="date"
                                    value={form.startDate}
                                    onChange={e => setForm({...form, startDate: e.target.value})}
                                    className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 bg-white/50 p-3 rounded-xl border border-red-100">
                            <div className="flex items-center gap-2 px-1">
                                <input 
                                    type="checkbox" 
                                    id="isEstExp"
                                    checked={form.isEstimated}
                                    onChange={e => setForm({...form, isEstimated: e.target.checked})}
                                />
                                <label htmlFor="isEstExp" className="text-[10px] font-black text-red-700 uppercase flex items-center gap-1">
                                    <Clock size={12} /> Importe Estimado
                                </label>
                            </div>
                        </div>

                        <Button onClick={handleAdd} className="w-full bg-red-600 hover:bg-red-700 shadow-red-200">Activar Gasto</Button>
                    </div>
                </Card>
            )}

            <div className="space-y-2">
                {expenses.map((rule: any) => (
                    <div key={rule.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                        <div className={`w-10 h-10 ${rule.isEstimated ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'} rounded-xl flex items-center justify-center`}>
                            {rule.isEstimated ? <Clock size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{rule.description}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase flex items-center gap-2">
                                Día {rule.dayOfMonth} • {rule.amount}{settings.currency} • {rule.account}
                            </p>
                        </div>
                        <button onClick={() => remove(rule.id)} className="text-slate-200 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
