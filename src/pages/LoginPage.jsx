import React, { useState } from 'react';
import { Chrome, ArrowRight } from 'lucide-react';
// Cambia el nombre de la imagen si tu archivo se llama diferente
import logoEmpresa from '../assets/images/logo.jpg'; 

const API_LOGIN = import.meta.env.VITE_API_URL_LOGIN;

const LoginPage = () => {
    // Regresamos el estado para el efecto de carga del botón
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGoogleLogin = () => {
        setIsSubmitting(true);
        window.location.href = `${API_LOGIN}/oauth2/authorization/google`;
    };

    return (
        <div className="min-h-screen w-full overflow-hidden bg-slate-100 text-slate-900 flex items-center justify-center relative">
            
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_40%),radial-gradient(circle_at_85%_15%,_rgba(15,23,42,0.15),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_50%,_#f8fafc_100%)] pointer-events-none" />
            <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-slate-950/5 blur-[80px] pointer-events-none" />

            {/* Contenedor Principal Estrictamente Apilado */}
            <main className="relative z-10 w-full max-w-[90%] sm:max-w-[400px] mx-auto flex flex-col justify-center">
                
                <section className="w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="glass-panel rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-300/50 flex flex-col gap-6">
                        
                        {/* 1. Cabecera Totalmente Apilada Verticalmente */}
                        <div className="flex flex-col gap-5 text-center">
                            <div className="flex flex-col">
                                <p className="text-[10px] sm:text-[16px] font-black uppercase tracking-[0.3em] text-blue-600">Inicio de sesión</p>
                                <h2 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">Bienvenido</h2>
                                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
                                    Accede utilizando tu cuenta corporativa.
                                </p>
                            </div>
                            
                            {/* Etiqueta Sistema: Ahora se apila abajo del texto principal abarcando el ancho completo */}
                            <div className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-center text-white shadow-md">
                                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Business Control Acceso operativo</p>
                                <p className="mt-1 text-xs font-bold">2026</p>
                            </div>
                        </div>

                        {/* 2. Área de Acción (Caja de Google) */}
                        <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-5 shadow-inner flex flex-col gap-6 items-center text-center">
                            
                            {/* Logotipo y Textos de Google Apilados */}
                            <div className="flex flex-col items-center gap-3">
                                {/* Contenedor adaptado para el logotipo de la empresa */}
                                <div className="flex h-16 w-full items-center justify-center p-1">
                                    <img 
                                        src={logoEmpresa} 
                                        alt="Logo Empresa" 
                                        className="h-full w-auto object-contain max-h-[60px]" 
                                    />
                                </div>
                                <div className="flex flex-col items-center">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Google Workspace</p>
                                    <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">Acceso Institucional</p>
                                </div>
                            </div>

                            {/* EL BOTÓN EXACTO QUE PEDISTE (Adaptado para Google) */}
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                disabled={isSubmitting}
                                className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white transition-all duration-300 hover:-translate-y-[1px] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Chrome size={16} />
                                {isSubmitting ? 'Redirigiendo...' : 'Ingresar con Google'}
                                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                        </div>
                        
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LoginPage;