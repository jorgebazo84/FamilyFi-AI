import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Card } from './components.tsx';

export const CalendarView = ({ settings, transactions, setView }: any) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const getUpcomingEvents = useMemo(() => {
        const rules = settings.recurrentIncomes || []; // Nota: Ahora incluye gastos e ingresos según el tipo
        const events: any[] = [];
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        rules.forEach((rule: any) => {
            const day = parseInt(rule.dayOfMonth);
            const date = new Date(year, month, day);
            const startDate = new Date(rule.startDate);
            const endDate = rule.hasEndDate ? new Date(rule.endDate) : null;

            if (date >= startDate && (!endDate || date <= endDate)) {
                events.push({
                    ...rule,
                    date: date.toISOString().split('T')[0],
                    isRecurrent: true
                });
            }
        });
        return events;
    }, [currentMonth, settings.recurrentIncomes]);

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Ajuste para que Lunes sea 0
        const days = [];

        // Espacios vacíos
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-14"></div>);
        }

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;
            const dayEvents = getUpcomingEvents.filter(e => e.date === dateStr);

            days.push(
                <button 
                    key={d}
                    onClick={() => setSelectedDate(new Date(year, month, d))}
                    className={`h-14 relative flex flex-col items-center justify-center rounded-2xl transition-all ${isSelected ? 'bg-cyan-600 text-white shadow-lg scale-105 z-10' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                    <span className={`text-sm font-black ${isToday && !isSelected ? 'text-cyan-600' : ''}`}>{d}</span>
                    <div className="flex gap-0.5 mt-1">
                        {dayEvents.map((e, idx) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${e.type === 'income' ? 'bg-cyan-400' : 'bg-red-400'}`}></div>
                        ))}
                    </div>
                </button>
            );
        }
        return days;
    };

    const selectedEvents = getUpcomingEvents.filter(e => e.date === selectedDate.toISOString().split('T')[0]);

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in">
            <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-cyan-50 p-2 rounded-xl text-cyan-600">
                        <CalendarIcon size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Previsiones</h2>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="text-slate-400"><ChevronLeft size={20}/></button>
                    <span className="text-xs font-black uppercase text-slate-700 w-24 text-center">
                        {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="text-slate-400"><ChevronRight size={20}/></button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                <Card className="p-4">
                    <div className="grid grid-cols-7 mb-4">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                            <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                    </div>
                </Card>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Clock size={12} /> Eventos para el {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </h3>
                    
                    {selectedEvents.length > 0 ? selectedEvents.map((e, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm animate-in slide-in-from-bottom-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${e.type === 'income' ? 'bg-cyan-50 text-cyan-600' : 'bg-red-50 text-red-500'}`}>
                                {e.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-800 text-sm">{e.description}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase">{e.type === 'income' ? 'Ingreso Estimado' : 'Gasto Estimado'}</p>
                            </div>
                            <p className={`font-black ${e.type === 'income' ? 'text-cyan-600' : 'text-red-500'}`}>
                                {e.type === 'income' ? '+' : '-'}{e.amount}{settings.currency}
                            </p>
                        </div>
                    )) : (
                        <div className="text-center py-10 opacity-30">
                            <CalendarIcon size={40} className="mx-auto mb-2 text-slate-400" />
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sin movimientos previstos</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
