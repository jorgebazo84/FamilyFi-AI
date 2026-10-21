import React, { useState } from 'react';
import { Calendar, ArrowUpRight, Plus, X, Trash2, TrendingUp } from 'lucide-react';
import { Card, Button } from './components.tsx';

export const RecurrentIncomesSection = ({ settings, saveSettings }: any) => {
    const [showForm, setShowForm] = useState(false);
    
    const [form, setForm] = useState({
        amount: '',
        description: '',
        category: 'Trabajo',
        account: settings.accounts[0],
        dayOfMonth: '1',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        hasEndDate: false,
        type: 'income'
    });

    const handleAdd = () => {
        const rule = {
            id: 'inc_' + Date.now().toString(),
            ...form,
            amount: parseFloat(form.amount)
        };
        const current = settings.recurrentIncomes || [];
        saveSettings({ recurrentIncomes: [...current, rule] });
        setShowForm(false);
        setForm({ ...form, amount: '', description: '' });
    };

    const remove = (id: string) => {
        const current = settings.recurrentIncomes || [];
        saveSettings({ recurrentIncomes: current.filter((r: any) => r.id !== id) });
    };

    const incomes = (settings.recurrentIncomes || []).filter((r: any) => r.type === 'income');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ingresos Recurrentes</h3>
                </div>
                <button 
                    onClick={() => setShowForm(true)}
                    className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full"
                >
                    Configurar Ingreso
                </button>
            </div>

            {showForm && (
                <Card className="p-4 bg-emerald-50/30 border-emerald-100 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black text-emerald-800">Nueva Entrada Automática</h4>
                        <button onClick={() => setShowForm(false)} className="text-slate-400"><X size={18}/></button>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Cuenta de Abono</label>
                            <select 
                                value={form.account} 
                                onChange={e => setForm({...form, account: e.target.value})}
                                className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                            >
                                {settings.accounts.map((acc: string) => <option key={acc} value={acc}>{acc}</option>)}
                            </select>
                        </div>
                        <input 
                            placeholder="Importe (Ej: 2000)" 
                            type="number"
                            value={form.amount}
                            onChange={e => setForm({...form, amount: e.target.value})}
                            className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                        />
                        <input 
                            placeholder="Descripción (Ej: Nómina)" 
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Día de Abono</label>
                                <input 
                                    type="number" min="1" max="31" 
                                    value={form.dayOfMonth}
                                    onChange={e => setForm({...form, dayOfMonth: e.target.value})}
                                    className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Fecha Inicio</label>
                                <input 
                                    type="date"
                                    value={form.startDate}
                                    onChange={e => setForm({...form, startDate: e.target.value})}
                                    className="w-full p-3 rounded-xl border-none font-bold text-sm outline-none bg-white"
                                />
                            </div>
                        </div>
                        <Button onClick={handleAdd} className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">Activar Ingreso</Button>
                    </div>
                </Card>
            )}

            <div className="space-y-2">
                {incomes.map((rule: any) => (
                    <div key={rule.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                            <ArrowUpRight size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{rule.description}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase">
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
