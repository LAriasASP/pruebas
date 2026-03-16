import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    CalendarRange,
    LogOut,
    UserCircle,
    ChevronDown,
    Briefcase,
    CheckCircle2
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { selectedRole, setSelectedRole, roles } = useRole();
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
                    <span className="text-[10px] font-black uppercase tracking-widest">{isOpen ? 'Cerrar' : 'Menú'}</span>
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
                            <span className="font-black tracking-tighter text-lg leading-tight uppercase">Business</span>
                            <span className="text-[10px] font-bold text-blue-400 tracking-[0.3em] -mt-1 uppercase">Control</span>
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
                                    {item.label}
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
                            <span className="text-xs font-black truncate leading-none mb-1">{session?.name || 'Usuario Demo'}</span>
                            <span className="text-[9px] text-slate-500 truncate uppercase font-bold tracking-widest">{session?.site || 'Sede Matriz'}</span>
                            <span className="text-[9px] text-slate-600 truncate font-semibold mt-1">{session?.email || 'demo@businesscontrol.com'}</span>
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 block px-1">Simular Puesto</label>
                        <div className="relative group">
                            <select
                                value={selectedRole.id}
                                onChange={(e) => setSelectedRole(roles.find(r => r.id === e.target.value))}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold appearance-none cursor-pointer hover:bg-slate-900 transition-all uppercase tracking-wider outline-none"
                            >
                                <optgroup label="── CANAL COMERCIAL ──────────">
                                    {roles.filter(r => r.canal === 'comercial').map(role => (
                                        <option key={role.id} value={role.id} className="bg-primary text-white">
                                            {role.category === 'Jefe' ? `[Jefe N${role.nivel}] ` : ''}{role.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="── CANAL COBRANZA ───────────">
                                    {roles.filter(r => r.canal === 'cobranza').map(role => (
                                        <option key={role.id} value={role.id} className="bg-primary text-white">
                                            {role.category === 'Jefe' ? `[Jefe N${role.nivel}] ` : ''}{role.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                        <div className="mt-2.5 flex items-center gap-2 px-1 flex-wrap">
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedRole.category === 'Operativo' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}></span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{selectedRole.category}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none capitalize">{selectedRole.canal}</span>
                            {selectedRole.nivel && <span className="text-[8px] font-black text-slate-600 bg-white/5 px-1.5 py-0.5 rounded uppercase">Nivel {selectedRole.nivel}</span>}
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-3 py-4 w-full bg-white/5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
