import React, { useRef, useEffect, useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

export const ScannerView = ({ setView, setScannedData, settings, showToast }: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        let activeStream: MediaStream | null = null;
        const start = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
                });
                activeStream = s;
                if (videoRef.current) videoRef.current.srcObject = s;
            } catch { 
                showToast("No se pudo acceder a la cámara", "error");
                setView('dashboard'); 
            }
        };
        start();
        return () => {
            activeStream?.getTracks().forEach(t => t.stop());
        };
    }, [setView, showToast]);

    const capture = async () => {
        if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
        
        setIsAnalyzing(true);
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64 } },
                        { text: `Analiza este ticket. Extrae: importe total (number), fecha (YYYY-MM-DD), nombre del comercio, importe del IVA/Tax (number) y determina si es un gasto profesional deducible (isDeductible: boolean) basándote en si es comida de empresa, oficina, transporte o salud. Categorías: ${settings.customCategories.join(', ')}.` }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { 
                            amount: { type: Type.NUMBER }, 
                            date: { type: Type.STRING }, 
                            description: { type: Type.STRING }, 
                            category: { type: Type.STRING },
                            taxAmount: { type: Type.NUMBER },
                            isDeductible: { type: Type.BOOLEAN }
                        },
                        required: ["amount", "date", "description", "category", "taxAmount", "isDeductible"]
                    }
                }
            });
            
            const result = JSON.parse(response.text.trim());
            setScannedData(result);
            showToast("IA: Ticket fiscal analizado correctamente");
            setView('add');
        } catch (e) { 
            showToast("Error al procesar la imagen fiscal", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex-1 bg-black relative flex flex-col overflow-hidden animate-in fade-in duration-500">
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-72 h-96 border-2 border-white/30 rounded-[2rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl"></div>
                </div>
                <p className="mt-8 text-white/70 font-bold text-sm tracking-widest uppercase bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                    Scanner de Gastos Deducibles
                </p>
            </div>

            {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 border-4 border-white/10 rounded-full animate-spin border-t-emerald-500"></div>
                        <Sparkles className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={32} />
                    </div>
                    <h2 className="text-white font-black text-xl">Detección de IVA y Deducibles</h2>
                    <p className="text-emerald-100/60 text-sm mt-2">Nuestra IA fiscal está extrayendo los datos...</p>
                </div>
            )}

            <div className="absolute bottom-12 w-full flex justify-around items-center px-10 z-20">
                <button 
                    onClick={() => setView('dashboard')} 
                    className="bg-white/10 backdrop-blur-xl p-4 rounded-full text-white active:scale-90 transition-transform"
                    disabled={isAnalyzing}
                >
                    <X />
                </button>
                <button 
                    onClick={capture} 
                    className={`w-20 h-20 bg-white rounded-full border-8 border-emerald-500/30 active:scale-95 transition-all shadow-2xl flex items-center justify-center ${isAnalyzing ? 'opacity-20' : ''}`}
                    disabled={isAnalyzing}
                >
                    <div className="w-14 h-14 bg-white rounded-full border-2 border-slate-200 shadow-inner"></div>
                </button>
                <div className="w-14"></div>
            </div>
        </div>
    );
};
