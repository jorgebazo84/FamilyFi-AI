import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, ShoppingBag, Trash2, Calendar, Ghost, FileText, Download, ShieldCheck, Sparkles, Loader2, Globe } from 'lucide-react';
import { EmptyState, Card } from './components.tsx';
import { jsPDF } from "jspdf";

export const PlannerView = ({ transactions, settings, fetchData, isDemo, setTransactions, API_URL, showToast }: any) => {
    const [search, setSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const deductibleTransactions = useMemo(() => {
        return transactions.filter((t: any) => t.isDeductible === true || t.isDeductible === 1);
    }, [transactions]);

    const grouped = useMemo(() => {
        const filtered = transactions.filter((t: any) => 
            t.description.toLowerCase().includes(search.toLowerCase()) || 
            t.category.toLowerCase().includes(search.toLowerCase())
        );

        const groups: Record<string, any[]> = {};
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        filtered.forEach((t: any) => {
            let label = t.date;
            if (t.date === today) label = 'Hoy';
            else if (t.date === yesterday) label = 'Ayer';
            
            if (!groups[label]) groups[label] = [];
            groups[label].push(t);
        });

        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [transactions, search]);

    const generateTaxReport = () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const now = new Date();
            const quarter = Math.floor((now.getMonth() + 3) / 3);
            
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42); 
            doc.text("FamilyFi-AI: Reporte Fiscal", 20, 30);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generado: ${now.toLocaleDateString()} | Periodo: Q${quarter} ${now.getFullYear()}`, 20, 38);
            doc.line(20, 45, 190, 45);

            const totalDeductible = deductibleTransactions.reduce((acc: number, t: any) => acc + Number(t.amount), 0);
            const totalTax = deductibleTransactions.reduce((acc: number, t: any) => acc + (Number(t.taxAmount) || 0), 0);

            doc.setFontSize(12);
            doc.text(`Base Imponible: ${totalDeductible.toFixed(2)}${settings.currency}`, 20, 55);
            doc.text(`IVA Deducible: ${totalTax.toFixed(2)}${settings.currency}`, 20, 62);

            let y = 80;
            deductibleTransactions.forEach((t: any) => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.setFontSize(8);
                doc.text(`${t.date} - ${t.description.substring(0, 30)} - ${t.amount}${settings.currency}`, 20, y);
                y += 6;
            });

            doc.save(`Fiscal_Q${quarter}_${now.getFullYear()}.pdf`);
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    const deleteT = async (id: string) => {
        if (!confirm("¿Eliminar este movimiento?")) return;
        if (isDemo) {
            const updated = transactions.filter((t: any) => t.id !== id);
            setTransactions(updated);
            localStorage.setItem('demo_transactions', JSON.stringify(updated));
            return;
        }
        await fetch(`${API_URL}?action=delete_transaction&id=${id}`, { credentials: 'include' });
        fetchData();
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in">
            <div className="p-4 bg-white border-b border-slate-100 z-10 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="w-full bg-slate-50 pl-12 pr-4 py-4 rounded-2xl border-none font-bold text-sm outline-none" 
                        placeholder="Buscar transacciones..." 
                    />
                </div>
                
                <Card className="bg-indigo-600 border-none p-4 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform"><FileText size={80} /></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck size={16} className="text-indigo-200" />
                                <h4 className="font-black text-xs uppercase tracking-widest">Reportes de IVA</h4>
                            </div>
                            <p className="text-[10px] font-medium opacity-70">Descarga el PDF trimestral de gastos profesionales.</p>
                        </div>
                        <button 
                            onClick={generateTaxReport}
                            disabled={isGenerating || deductibleTransactions.length === 0}
                            className="bg-white text-indigo-600 p-3 rounded-2xl shadow-lg active:scale-90 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        </button>
                    </div>
                </Card>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                {grouped.length > 0 ? grouped.map(([date, items]) => (
                    <div key={date} className="space-y-3">
                        <div className="flex items-center gap-2 ml-2">
                            <Calendar size={12} className="text-slate-300" />
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{date}</h3>
                        </div>
                        {items.map((t: any) => (
                            <div key={t.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-50 hover:border-cyan-100 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {t.type === 'income' ? <TrendingUp size={18} /> : <ShoppingBag size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800 text-sm truncate">{t.description}</p>
                                        {t.originalCurrency && t.originalCurrency !== settings.currency && (
                                            <div className="flex items-center gap-1 text-[8px] font-black text-cyan-500 uppercase bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                                                <Globe size={8} /> {t.originalAmount}{t.originalCurrency}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-400 font-black uppercase">{t.category}</p>
                                        {(t.isDeductible === true || t.isDeductible === 1) && (
                                            <span className="bg-indigo-50 text-indigo-600 text-[7px] font-black px-1.5 py-0.5 rounded uppercase border border-indigo-100">TAX Deducible</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className={`font-black ${t.type === 'income' ? 'text-cyan-600' : 'text-slate-800'}`}>
                                        {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()}{settings.currency}
                                    </p>
                                    <button onClick={() => deleteT(t.id)} className="p-2 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )) : (
                    <EmptyState icon={Ghost} title="Lista vacía" message="No hay movimientos registrados en este periodo." />
                )}
            </div>
        </div>
    );
};
