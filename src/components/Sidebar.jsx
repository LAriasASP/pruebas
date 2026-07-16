import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    CalendarRange, LogOut, UserCircle, Briefcase, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { selectedRole } = useRole();
    const { session, logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    const menuItems = [
        { icon: CalendarRange, label: 'AGENDA DE TRABAJO', path: '/' },
        { icon: CheckCircle2, label: 'SÉMAFORO DE PAGOS', path: '/semaforo' },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-[60] bg-primary text-white p-3 rounded-xl shadow-lg border border-white/10"
            >
                <div className="flex items-center gap-2">
                    <Briefcase size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isOpen ? 'CERRAR' : 'MENÚ'}</span>
                </div>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 w-72 bg-primary text-white flex flex-col z-[56] transition-transform duration-500
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-4 mb-20">
                        <div className="w-10 h-10 bg-blue-600 rounded-[12px] flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/20">BC</div>
                        <div className="flex flex-col">
                            <span className="font-black tracking-tighter text-lg leading-tight uppercase">BUSINESS</span>
                            <span className="text-[10px] font-bold text-blue-400 tracking-[0.3em] -mt-1 uppercase">CONTROL</span>
                        </div>
                    </div>

                    <nav className="space-y-4">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 border-b-2 border-white/10'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                `}
                            >
                                <item.icon size={20} className="transition-transform group-hover:scale-110" />
                                <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                                    {String(item.label).toUpperCase()}
                                </span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-8 border-t border-white/5 bg-black/20 space-y-6">
                    {/* User Profile */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg border border-white/5">
                            <UserCircle size={28} className="text-slate-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black truncate leading-none mb-1 uppercase">
                                {session?.userName || session?.name || 'USUARIO'}
                            </span>
                            <span className="text-[9px] text-slate-500 truncate uppercase font-bold tracking-widest">{session?.sucursal || 'MATRIZ'}</span>
                            {session?.email && <span className="text-[9px] text-slate-600 truncate font-semibold mt-1 uppercase">{String(session.email).toUpperCase()}</span>}
                        </div>
                    </div>

                    {/* Role Display Oficial */}
                    {selectedRole && (
                        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck size={14} className="text-blue-400" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">PUESTO ACTUAL</span>
                            </div>
                            <p className="text-[11px] font-black text-white uppercase tracking-wider leading-tight mb-2">
                                {String(selectedRole.name).toUpperCase()}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${selectedRole.category === 'Operativo' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}></span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{String(selectedRole.category).toUpperCase()}</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                    {String(selectedRole.canal).toUpperCase()}
                                </span>
                                {selectedRole.nivel && <span className="text-[8px] font-black text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded uppercase">NIVEL {selectedRole.nivel}</span>}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-3 py-4 w-full bg-white/5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
                    >
                        <LogOut size={16} />
                        CERRAR SESIÓN
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;