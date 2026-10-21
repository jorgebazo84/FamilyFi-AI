import React, { useState, useRef, useEffect } from 'react';
import { X, BrainCircuit, Send, Sparkles, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const AIView = ({ userEmail, transactions, settings, setView }: any) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

    const askAI = async () => {
        if (!input.trim() || isThinking) return;
        const prompt = input;
        setInput('');
        setHistory(prev => [...prev, { role: 'user', text: prompt }]);
        setIsThinking(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const context = `Usuario: ${userEmail}. Transacciones: ${JSON.stringify(transactions.slice(0, 30))}. Presupuesto: ${settings.monthlyBudget}${settings.currency}.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `${context}\n\nPregunta: ${prompt}`,
                config: {
                    systemInstruction: "Eres FamilyFi Bot, un asesor financiero experto. Analiza los datos del usuario para responder. Si no hay datos, da consejos generales de ahorro. Responde en Markdown, sé motivador y directo."
                }
            });
            setHistory(prev => [...prev, { role: 'model', text: response.text || "Lo siento, no pude generar una respuesta." }]);
        } catch (e) {
            setHistory(prev => [...prev, { role: 'model', text: "Hubo un error al conectar con mis circuitos financieros. Inténtalo de nuevo." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-500">
            <header className="p-4 bg-white border-b border-slate-100 flex items-center gap-4 shadow-sm z-10">
                <button onClick={() => setView('dashboard')} className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-transform">
                    <X size={20}/>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 leading-none">FamilyFi Advisor</h2>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inteligencia Activa</p>
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {history.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in fade-in zoom-in duration-700">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500">
                            <BrainCircuit size={48} />
                        </div>
                        <div className="max-w-[240px]">
                            <p className="font-black text-slate-800 text-lg">Hola {userEmail?.split('@')[0]} 👋</p>
                            <p className="text-sm text-slate-400 mt-2 font-medium">Pregúntame sobre tus gastos, ahorros o pide consejos financieros personalizados.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {["¿Cómo va mi mes?", "Consejo de ahorro", "Resumen de gastos"].map(tag => (
                                <button 
                                    key={tag} 
                                    onClick={() => { setInput(tag); }}
                                    className="bg-white px-4 py-2 rounded-full border border-slate-100 text-xs font-bold text-indigo-600 shadow-sm active:scale-95 transition-transform"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {history.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm ${
                            chat.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none font-bold' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 font-medium leading-relaxed'
                        }`}>
                            {chat.text}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs font-bold text-slate-400 ml-2 italic">Analizando tus finanzas...</span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 pb-safe-bottom">
                <div className="flex gap-2 bg-slate-50 p-1 rounded-[2rem] border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                    <input 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && askAI()} 
                        placeholder="Escribe tu consulta..." 
                        className="flex-1 bg-transparent px-5 py-3 border-none font-bold text-sm focus:outline-none" 
                    />
                    <button 
                        onClick={askAI} 
                        disabled={!input.trim() || isThinking} 
                        className="bg-indigo-600 text-white p-3 rounded-full disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
