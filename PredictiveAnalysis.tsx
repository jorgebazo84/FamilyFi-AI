import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle, TrendingDown, Zap, ShieldCheck, Loader2, Info, Calendar } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Card } from './components.tsx';

export const PredictiveAnalysis = ({ transactions, settings, selectedAccount, allTransactions }: any) => {
    const [prediction, setPrediction] = useState<{
        daysRemaining: number;
        status: 'healthy' | 'warning' | 'critical';
        aiInsight: string;
        loading: boolean;
    }>({
        daysRemaining: 0,
        status: 'healthy',
        aiInsight: '',
        loading: true
    });

    const calculateBurnRate = useMemo(() => {
        // 1. Balance de la cuenta actual
        const balance = allTransactions.reduce((acc: number, t: any) => {
            if (selectedAccount !== 'all' && t.account !== selectedAccount) return acc;
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);

        // 2. Cálculo de velocidad de gasto (últimos 30 días)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentExpenses = allTransactions.filter((t: any) => 
            t.type === 'expense' && 
            new Date(t.date) >= thirtyDaysAgo &&
            (selectedAccount === 'all' || t.account === selectedAccount)
        );

        const totalSpent = recentExpenses.reduce((acc: number, t: any) => acc + t.amount, 0);
        const dailyBurnRate = totalSpent / 30;

        // 3. Estimar días restantes
        const days = dailyBurnRate > 0 ? Math.floor(balance / dailyBurnRate) : 999;
        
        return { balance, dailyBurnRate, days };
    }, [allTransactions, selectedAccount]);

    const getAIInsight = useCallback(async (days: number, balance: number, burnRate: number) => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Contexto Financiero:
                - Saldo: ${balance}${settings.currency}
                - Velocidad de gasto: ${burnRate.toFixed(2)}${settings.currency}/día
                - Supervivencia estimada: ${days === 999 ? 'Indefinida' : days + ' días'}.
                
                Instrucción: Da un consejo de 1 frase (máx 12 palabras) sobre cómo optimizar este saldo. 
                Sé profesional, directo y utiliza un tono que coincida con el estado (positivo si días > 45, serio si < 15).`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { systemInstruction: "Eres un analista financiero de alto nivel. Brevedad extrema." }
            });

            return response.text || "Mantén tu disciplina financiera actual.";
        } catch {
            return "Datos insuficientes para análisis avanzado.";
        }
    }, [settings.currency]);

    useEffect(() => {
        let isCancelled = false;
        const updatePrediction = async () => {
            setPrediction(prev => ({ ...prev, loading: true }));
            
            const { days, balance, dailyBurnRate } = calculateBurnRate;
            let status: 'healthy' | 'warning' | 'critical' = 'healthy';
            if (days < 10) status = 'critical';
            else if (days < 25) status = 'warning';

            const insight = await getAIInsight(days, balance, dailyBurnRate);

            if (!isCancelled) {
                setPrediction({
                    daysRemaining: days,
                    status,
                    aiInsight: insight,
                    loading: false
                });
            }
        };

        updatePrediction();
        return () => {
            isCancelled = true;
        };
    }, [calculateBurnRate, getAIInsight]);

    const statusConfig = {
        healthy: { color: 'text-cyan-500', bar: 'bg-cyan-500', bg: 'bg-cyan-50/30', icon: ShieldCheck, label: 'Capital Protegido' },
        warning: { color: 'text-amber-500', bar: 'bg-amber-500', bg: 'bg-amber-50/30', icon: AlertTriangle, label: 'Riesgo de Liquidez' },
        critical: { color: 'text-red-500', bar: 'bg-red-500', bg: 'bg-red-50/30', icon: Zap, label: 'Alerta de Agotamiento' }
    };

    const config = statusConfig[prediction.status];
    const progress = Math.min((prediction.daysRemaining / 60) * 100, 100);

    return (
        <Card className={`p-6 border-none shadow-2xl ${config.bg} transition-all duration-700 relative overflow-hidden group`}>
            {/* Decoración de fondo */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-10 ${config.bar}`}></div>
            
            <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl bg-white shadow-sm ${config.color}`}>
                        <config.icon size={22} />
                    </div>
                    <div>
                        <h4 className={`text-[9px] font-black uppercase tracking-[0.2em] ${config.color}`}>{config.label}</h4>
                        <p className="text-slate-800 font-black text-sm">Pronóstico de Fondos</p>
                    </div>
                </div>
                {prediction.loading && <Loader2 size={16} className="animate-spin text-slate-300" />}
            </div>

            <div className="flex items-baseline gap-2 mb-6 relative z-10">
                <span className={`text-6xl font-black tracking-tighter transition-all duration-1000 ${prediction.daysRemaining < 10 ? 'animate-pulse' : ''} ${config.color}`}>
                    {prediction.daysRemaining > 365 ? '∞' : prediction.daysRemaining}
                </span>
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400 uppercase leading-none">Días</span>
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Restantes</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {/* Liquidity Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400 px-1">
                        <span>Estado de Liquidez</span>
                        <span>{progress.toFixed(0)}% Capacidad</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${config.bar}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* AI Insight Card */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${config.color}`}>
                            <Info size={14} />
                        </div>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                            {prediction.aiInsight || "Analizando tu comportamiento de gasto mensual..."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <TrendingDown size={11} className="text-red-400" />
                        <span>{calculateBurnRate.dailyBurnRate.toFixed(0)}{settings.currency}/día</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-slate-300" />
                        <span>Base 30d</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
