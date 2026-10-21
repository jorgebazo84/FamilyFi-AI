import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { Card } from './components.tsx';
import { TrendingUp, PieChart as PieIcon, Activity, ArrowUpRight, ArrowDownRight, Lock } from 'lucide-react';
import { motion } from 'motion/react';

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <p className="text-xs font-bold text-white">
                            {entry.name}: {entry.value.toLocaleString()}{currency}
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const FinancialAnalytics = ({ transactions, settings, isSkeleton = false }: any) => {
    
    // 1. Preparar datos para Comparativa Mensual (Ingresos vs Gastos)
    const monthlyData = useMemo(() => {
        // Datos dummy para el modo skeleton
        const dummyMonthlyData = [
            { name: 'Ene', ingresos: 4000, gastos: 2400 },
            { name: 'Feb', ingresos: 3000, gastos: 1398 },
            { name: 'Mar', ingresos: 2000, gastos: 9800 },
            { name: 'Abr', ingresos: 2780, gastos: 3908 },
            { name: 'May', ingresos: 1890, gastos: 4800 },
            { name: 'Jun', ingresos: 2390, gastos: 3800 },
        ];

        if (isSkeleton) return dummyMonthlyData;
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentYear = new Date().getFullYear();
        
        const data = months.map((month, index) => {
            const monthTransactions = transactions.filter((t: any) => {
                const d = new Date(t.date);
                return d.getMonth() === index && d.getFullYear() === currentYear;
            });

            return {
                name: month,
                ingresos: monthTransactions.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + Number(t.amount), 0),
                gastos: monthTransactions.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + Number(t.amount), 0),
            };
        });

        // Solo mostrar meses que tengan datos o el mes actual y anteriores
        const currentMonth = new Date().getMonth();
        return data.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    }, [transactions, isSkeleton]);

    // 2. Preparar datos para Distribución por Categorías
    const categoryData = useMemo(() => {
        const dummyCategoryData = [
            { name: 'Comida', value: 400 },
            { name: 'Hogar', value: 300 },
            { name: 'Ocio', value: 300 },
            { name: 'Transporte', value: 200 },
        ];

        if (isSkeleton) return dummyCategoryData;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const expenses = transactions.filter((t: any) => {
            const d = new Date(t.date);
            return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const catMap: Record<string, number> = {};
        expenses.forEach((t: any) => {
            catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
        });

        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions, isSkeleton]);

    // Colores elegantes para las gráficas
    const COLORS = ['#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 relative"
        >
            {isSkeleton && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/10 backdrop-blur-[2px] rounded-[2.5rem] pointer-events-none">
                    <div className="bg-white/90 p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-[280px] animate-in zoom-in duration-500">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                            <Lock className="text-indigo-600" size={24} />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Analítica Bloqueada</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Registra al menos 5 transacciones para desbloquear tu mapa de calor financiero y proyecciones.</p>
                    </div>
                </div>
            )}
            
            <div className={isSkeleton ? 'opacity-20 grayscale blur-[1px]' : ''}>
                {/* Gráfica de Flujo Mensual */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-cyan-500" /> Flujo de Caja (6 meses)
                        </h3>
                    </div>
                    <Card className="p-6 bg-white border-none shadow-xl h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                                />
                                <Tooltip content={<CustomTooltip currency={settings.currency} />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="gastos" name="Gastos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Distribución por Categoría y Resumen */}
                <div className="grid grid-cols-1 gap-6 mt-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <PieIcon size={14} className="text-indigo-500" /> Reparto de Gastos
                            </h3>
                        </div>
                        <Card className="p-6 bg-white border-none shadow-xl flex flex-col items-center">
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip currency={settings.currency} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full">
                                {categoryData.slice(0, 4).map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase truncate">{entry.name}</span>
                                        <span className="text-[9px] font-bold text-slate-800 ml-auto">{entry.value.toLocaleString()}{settings.currency}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Tendencia de Saldo */}
                <div className="space-y-4 mt-8">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-500" /> Evolución del Patrimonio
                        </h3>
                    </div>
                    <Card className="p-6 bg-slate-900 border-none shadow-2xl h-48 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area 
                                        type="monotone" 
                                        dataKey="ingresos" 
                                        stroke="#06b6d4" 
                                        fillOpacity={1} 
                                        fill="url(#colorBalance)" 
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="relative z-10">
                            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Tendencia de Ingresos</p>
                            <h4 className="text-2xl font-black text-white tracking-tighter">Crecimiento Sostenido</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                    <ArrowUpRight size={10} />
                                    <span>+12.5% vs mes anterior</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};
