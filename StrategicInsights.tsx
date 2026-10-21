import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, TrendingUp, Target, Calendar, Loader2, BrainCircuit, ChevronRight, ArrowUpRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Card } from './components.tsx';

export const StrategicInsights = ({ transactions, settings }: any) => {
    const [insight, setInsight] = useState<{
        advice: string;
        forecast: number;
        loading: boolean;
    }>({
        advice: '',
        forecast: 0,
        loading: true
    });

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyExpenses = transactions.filter((t: any) => {
            const d = new Date(t.date);
            return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).reduce((acc: number, t: any) => acc + Number(t.amount), 0);

        const monthlyIncome = transactions.filter((t: any) => {
            const d = new Date(t.date);
            return t.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).reduce((acc: number, t: any) => acc + Number(t.amount), 0);

        const avgMonthlySavings = monthlyIncome - monthlyExpenses;
        const projectedYearlySavings = avgMonthlySavings * 12;

        return { monthlyExpenses, monthlyIncome, avgMonthlySavings, projectedYearlySavings };
    }, [transactions]);

    const generateStrategicAdvice = useCallback(async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Analista Financiero Estratégico.
                Datos del mes actual:
                - Ingresos: ${stats.monthlyIncome}${settings.currency}
                - Gastos: ${stats.monthlyExpenses}${settings.currency}
                - Ahorro mensual: ${stats.avgMonthlySavings}${settings.currency}
                - Proyección 12 meses: ${stats.projectedYearlySavings}${settings.currency}
                
                Instrucción: Genera un consejo estratégico proactivo (máx 20 palabras). 
                No digas obviedades como "ahorra más". Busca optimización. 
                Ejemplo: "Tu tasa de ahorro es del 15%. Si reduces suscripciones un 5%, podrías invertir 200€ extra en tu fondo de libertad."`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { systemInstruction: "Eres un consultor financiero de élite. Tu tono es visionario y motivador." }
            });

            return response.text || "Tu trayectoria financiera es estable. Considera diversificar tus ahorros.";
        } catch (e) {
            return "Analizando tendencias para optimizar tu capital...";
        }
    }, [stats, settings.currency]);

    useEffect(() => {
        const update = async () => {
            setInsight(prev => ({ ...prev, loading: true }));
            const advice = await generateStrategicAdvice();
            setInsight({
                advice,
                forecast: stats.projectedYearlySavings,
                loading: false
            });
        };
        update();
    }, [stats.projectedYearlySavings, generateStrategicAdvice]);

    return (
        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <BrainCircuit size={100} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <Sparkles size={18} className="text-cyan-300" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Estrategia Proactiva</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">Proyección Ahorro 12 Meses</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black text-white tracking-tighter">
                                {insight.forecast > 0 ? '+' : ''}{insight.forecast.toLocaleString()}
                                <span className="text-xl ml-1 opacity-50">{settings.currency}</span>
                            </h2>
                            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                <ArrowUpRight size={10} />
                                <span>ESTIMADO</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                        <div className="flex items-start gap-3">
                            {insight.loading ? (
                                <Loader2 size={16} className="animate-spin text-cyan-300 mt-1" />
                            ) : (
                                <Target size={16} className="text-cyan-300 mt-1 shrink-0" />
                            )}
                            <p className="text-xs font-bold text-indigo-50 leading-relaxed">
                                {insight.loading ? "Calculando trayectoria estratégica..." : insight.advice}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Tasa Ahorro</p>
                            <p className="text-xs font-black text-white">
                                {stats.monthlyIncome > 0 ? ((stats.avgMonthlySavings / stats.monthlyIncome) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Eficiencia</p>
                            <p className="text-xs font-black text-white">Alta</p>
                        </div>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all text-white">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </Card>
    );
};
