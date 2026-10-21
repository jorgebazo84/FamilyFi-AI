import React, { useState } from 'react';
import { Mail, Key, Loader2, Sparkles, Binary, Fingerprint, FileText, Download, ChevronRight } from 'lucide-react';
import { Button, Card } from './components.tsx';
import { AppLogo } from './index.tsx';
import { jsPDF } from "jspdf";

export const AuthView = ({ setUserEmail, fetchData, onDemo, showToast, handleBiometricAuth, settings, API_URL }: any) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const action = isLogin ? 'login' : 'register';
            // Se usa API_URL que viene como prop desde index.tsx
            const res = await fetch(`${API_URL}?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setUserEmail(data.email);
                await fetchData();
                showToast(isLogin ? "Sesión iniciada" : "Cuenta creada con éxito");
            } else {
                setError(data.error || 'Credenciales o datos no válidos');
            }
        } catch (err) {
            setError('Error de comunicación. Revisa tu conexión.');
            console.error("Auth Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const generateGuidePdf = () => {
        setIsGeneratingPdf(true);
        try {
            const doc = new jsPDF();
            const slate = [15, 23, 42] as const;
            const cyan = [6, 182, 212] as const;
            
            doc.setFillColor(...slate);
            doc.rect(0, 0, 210, 60, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.text("FamilyFi AI", 20, 35);
            doc.setFontSize(10);
            doc.text("GUÍA DE USUARIO: GESTIÓN FAMILIAR INTELIGENTE", 20, 45);

            doc.setTextColor(...slate);
            doc.setFontSize(14);
            doc.text("1. Registro Individual", 20, 80);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Cada miembro de la pareja debe registrarse con su propio email.", 25, 90);
            doc.text("Esto garantiza que tus cuentas personales sean invisibles para el otro.", 25, 95);

            doc.setTextColor(...slate);
            doc.setFontSize(14);
            doc.text("2. Configurar Cuentas Comunes", 20, 115);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("En Ajustes > Cuentas, uno de los dos debe crear una cuenta.", 25, 125);
            doc.text("Pulsa el icono de 'Usuarios' para marcarla como compartida.", 25, 130);
            
            doc.save("Guia_FamilyFi_AI.pdf");
            showToast("Guía descargada correctamente");
        } catch (e) {
            showToast("Error al generar la guía", "error");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="flex-1 bg-slate-950 flex flex-col justify-center p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px]"></div>
            
            <div className="mb-8 text-center relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <AppLogo size={90} className="mx-auto mb-4" />
                <h1 className="text-3xl font-black tracking-tighter leading-tight">FamilyFi <span className="text-cyan-400">AI</span></h1>
                <p className="text-slate-500 font-bold mt-2 uppercase text-[9px] tracking-[0.4em] flex items-center justify-center gap-2">
                    <Binary size={12} className="text-cyan-500/50" /> Inteligencia Financiera Compartida
                </p>
            </div>

            <div className="space-y-4 relative z-10">
                <Card className="p-6 bg-slate-900 border-slate-800 text-slate-100 shadow-2xl ring-1 ring-white/5">
                    <h2 className="text-lg font-black mb-6 text-center text-cyan-400 uppercase tracking-widest">
                        {isLogin ? 'Acceso Seguro' : 'Crear Identidad'}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Email Personal</label>
                            <input 
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 font-bold text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                                placeholder="ej: tu_nombre@gmail.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Contraseña</label>
                            <input 
                                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 font-bold text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <div className="text-red-400 text-[9px] font-black text-center uppercase tracking-tight py-1">{error}</div>}

                        <div className="flex flex-col gap-2 pt-2">
                            <Button type="submit" className="w-full py-4 text-xs uppercase tracking-widest bg-cyan-600 shadow-cyan-500/20" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Entrar' : 'Registrar')}
                            </Button>
                            
                            {isLogin && (
                                <button type="button" onClick={handleBiometricAuth} className="w-full py-3.5 border border-cyan-500/10 rounded-xl flex items-center justify-center gap-2 text-cyan-400 font-black text-[9px] uppercase tracking-widest hover:bg-white/5 transition-all">
                                    <Fingerprint size={14} /> Acceso Biométrico
                                </button>
                            )}
                        </div>
                    </form>

                    <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-center text-slate-600 font-black text-[9px] uppercase tracking-widest hover:text-cyan-400">
                        {isLogin ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta, ir a Login'}
                    </button>
                </Card>

                <div className="flex flex-col gap-3 px-2">
                    <button 
                        onClick={generateGuidePdf}
                        disabled={isGeneratingPdf}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between px-6 group active:scale-95 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <FileText size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">¿Cómo vincular mi pareja?</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Descargar Guía Visual (PDF)</p>
                            </div>
                        </div>
                        {isGeneratingPdf ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <Download size={18} className="text-slate-500" />}
                    </button>

                    <button 
                        onClick={onDemo}
                        className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between px-6 group active:scale-95 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <Sparkles size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Explorar la App</p>
                                <p className="text-[8px] font-bold text-emerald-500/50 uppercase tracking-tighter">Modo Invitado sin Registro</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-emerald-500/40" />
                    </button>
                </div>
            </div>
        </div>
    );
};
