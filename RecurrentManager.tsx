import React, { useState } from 'react';
import { Plus, X, ArrowUpRight, ArrowDownRight, Trash2, Landmark } from 'lucide-react';
import { Card, Button } from './components.tsx';

export const RecurrentManager = ({ settings, saveSettings }: any) => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        type: 'income',
        amount: '',
        description: '',
        category: 'Hogar',
        account: settings.accounts[0],
        dayOfMonth: '1',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        hasEndDate: false
    });

    const handleAdd = () => {
        const rule = {
            id: Date.now().toString(),
            ...form,
            amount: parseFloat(form.amount)
        };
        const current = settings.recurrentIncomes || [];
        saveSettings({ recurrentIncomes: [...current, rule] });
        setShowForm(false);
    };

    const remove = (id: string) => {
        const current = settings.recurrentIncomes || [];
        saveSettings({ recurrentIncomes: current.filter((r: any) => r.id !== id) });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Automatizaciones</h3>
                <button onClick={() => setShowForm(true)} className="text-[10px] font-black text-cyan-600 uppercase bg-cyan-50 px-3 py-1 rounded-full">+ Añadir Regla</button>
            </div>

            {showForm && (
                <Card className="p-4 bg-slate-50 border-cyan-200 animate-in zoom-in">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black uppercase text-slate-500">Nueva Regla Programada</span>
                        <button onClick={() => setShowForm(false)} className="text-slate-400"><X size={18}/></button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex bg-white p-1 rounded-xl mb-2">
                            <button onClick={() => setForm({...form, type: 'income'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${form.type === 'income' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Ingreso</button>
                            <button onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${form.type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-400'}`}>Gasto</button>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Landmark size={10}/> Cuenta Destino</label>
                            <select 
                                value={form.account} 
                                onChange={e => setForm({...form, account: e.target.value})}
                                className="w-full p-3 rounded-xl border-none font-bold text-sm bg-white outline-none"
                            >
                                {settings.accounts.map((acc: string) => <option key={acc} value={acc}>{acc}</option>)}
                            </select>
                        </div>

                        <input placeholder="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 rounded-xl border-none font-bold text-sm bg-white outline-none" />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder="Importe" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-3 rounded-xl border-none font-bold text-sm bg-white outline-none" />
                            <input type="number" placeholder="Día (1-31)" min="1" max="31" value={form.dayOfMonth} onChange={e => setForm({...form, dayOfMonth: e.target.value})} className="w-full p-3 rounded-xl border-none font-bold text-sm bg-white outline-none" />
                        </div>
                        <Button onClick={handleAdd} className="w-full">Guardar Programación</Button>
                    </div>
                </Card>
            )}

            <div className="space-y-2">
                {(settings.recurrentIncomes || []).map((rule: any) => (
                    <div key={rule.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.type === 'income' ? 'bg-cyan-50 text-cyan-600' : 'bg-red-50 text-red-500'}`}>
                            {rule.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm">{rule.description}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase">Día {rule.dayOfMonth} • {rule.amount}{settings.currency} • {rule.account}</p>
                        </div>
                        <button onClick={() => remove(rule.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};
