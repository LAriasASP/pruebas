import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BriefcaseBusiness,
    Chrome,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_LOGIN = import.meta.env.VITE_API_URL_LOGIN;

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const from = location.state?.from?.pathname || '/';

    const handleGoogleLogin = () => {
        window.location.href = `${API_LOGIN}/oauth2/authorization/google`;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            login({ email, password });
            navigate(from, { replace: true });
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden bg-slate-100 text-slate-900">
            <div className="relative isolate min-h-screen">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(15,23,42,0.16),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_45%,_#f8fafc_100%)]" />
                <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-slate-950/10 blur-3xl" />

                <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-10">
                    <section className="mb-8 flex-1 lg:mb-0">
                        <div className="max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-blue-900/20">
                                    <BriefcaseBusiness size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Business Control</span>
                                    <span className="text-xs font-semibold text-slate-900">Acceso operativo</span>
                                </div>
                            </div>

                            <h1 className="max-w-lg text-4xl font-black uppercase tracking-tight text-slate-950 sm:text-5xl">
                                Inicia sesión y entra al tablero de operación.
                            </h1>
                            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                                Mantuvimos la misma línea visual del sistema: paneles limpios, acentos azul profundo y un enfoque
                                ejecutivo para que la transición entre login y operación se sienta natural.
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <article className="glass-panel rounded-[24px] border border-white/70 bg-white/80 p-5 backdrop-blur">
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Acceso protegido</p>
                                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                                        Entrada controlada para supervisores, coordinadores y personal operativo.
                                    </p>
                                </article>

                                <article className="glass-panel rounded-[24px] border border-white/70 bg-white/80 p-5 backdrop-blur">
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                                        <Sparkles size={18} />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Misma experiencia</p>
                                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                                        El diseño conserva el carácter del dashboard para que todo se sienta parte del mismo producto.
                                    </p>
                                </article>
                            </div>
                        </div>
                    </section>

                    <section className="w-full max-w-md">
                        <div className="glass-panel rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-300/40 backdrop-blur sm:p-8">
                            <div className="mb-8 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">Inicio de sesión</p>
                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Bienvenido</h2>
                                    <p className="mt-3 text-sm leading-6 text-slate-500">
                                        Puedes entrar con Google o seguir usando el acceso demo por correo.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
                                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Sistema</p>
                                    <p className="mt-1 text-xs font-bold">2026</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                                            <Chrome size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Google</p>
                                            <p className="text-sm font-semibold text-slate-800">Acceso Corporativo</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGoogleLogin}
                                        type="button"
                                        className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-blue-300 transition-all"
                                    >
                                        <Chrome size={16} className="text-blue-500" />
                                        Continuar con Google
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 py-2">
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">o continuar con correo</span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <label className="block">
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Correo</span>
                                    <div className="relative">
                                        <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder="nombre@empresa.com"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Contraseña</span>
                                    <div className="relative">
                                        <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Ingresa tu contraseña"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-14 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </label>

                                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Sesión demo</p>
                                        <p className="mt-1 text-xs font-medium text-slate-600">El login se guarda localmente en este navegador.</p>
                                    </div>
                                    <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.7)]" />
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white transition-all duration-300 hover:-translate-y-[1px] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Entrando...' : 'Entrar al sistema'}
                                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;