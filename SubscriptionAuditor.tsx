import React, { useMemo } from 'react';
import { Ghost, AlertCircle, Calendar, ArrowRight, Trash2, TrendingDown, Info, CreditCard } from 'lucide-react';
import { Card } from './components.tsx';

export const SubscriptionAuditor = ({ transactions, settings }: any) => {
    const subscriptions = useMemo(() => {
        // Buscamos transacciones que se repitan con la misma descripción en meses distintos
        const expenseMap: Record<string, { dates: Date[], amounts: number[] }> = {};
        
        transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
            const desc = t.description.toLowerCase().trim();
            if (!expenseMap[desc]) expenseMap[desc] = { dates: [], amounts: [] };
            expenseMap[desc].dates.push(new Date(t.date));
            expenseMap[desc].amounts.push(Number(t.amount));
        });

        const detected = Object.entries(expenseMap)
            .filter(([_, data]) => {
                if (data.dates.length < 2) return false;
                // Verificar si hay al menos 2 meses distintos
                const months = new Set(data.dates.map(d => `${d.getMonth()}-${d.getFullYear()}`));
                return months.size >= 2;
            })
            .map(([desc, data]) => {
                const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
                return {
                    name: desc.charAt(0).toUpperCase() + desc.slice(1),
                    monthly: avgAmount,
                    yearly: avgAmount * 12,
                    count: data.dates.length
                };
            })
            .sort((a, b) => b.monthly - a.monthly);

        return detected;
    }, [transactions]);

    const totalAnnualCost = subscriptions.reduce((acc, s) => acc + s.yearly, 0);

    if (subscriptions.length === 0) return null;

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Ghost size={14} className="text-indigo-500" /> Auditor de Suscripciones "Ghost"
                </h3>
                <div className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-1 rounded-full border border-indigo-100 uppercase">
                    {subscriptions.length} Detectadas
                </div>
            </div>

            <Card className="p-5 border-none shadow-xl bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600">
                    <CreditCard size={60} />
                </div>

                <div className="mb-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Anual Total</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                            {totalAnnualCost.toLocaleString()}<span className="text-lg ml-1 opacity-30 font-medium">{settings.currency}</span>
                        </h2>
                        <div className="flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                            <TrendingDown size={10} />
                            <span>FUGA DE CAPITAL</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {subscriptions.slice(0, 3).map((sub, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-500">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{sub.name}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">{sub.monthly.toFixed(2)}{settings.currency} / mes</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-800">-{sub.yearly.toFixed(0)}{settings.currency}</p>
                                <p className="text-[7px] font-black text-slate-300 uppercase">Al año</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-3">
                    <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                        <AlertCircle size={14} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                        Estas suscripciones se cargan automáticamente. Cancela las que no uses para liberar <span className="text-indigo-600 font-black">{totalAnnualCost.toFixed(0)}{settings.currency}</span> anuales.
                    </p>
                </div>
            </Card>
        </div>
    );
};
