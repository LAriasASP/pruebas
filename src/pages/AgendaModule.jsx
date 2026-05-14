import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import {
    ClipboardList,
    MapPin,
    CheckCircle2
} from 'lucide-react';
import PlaneacionOperativo from './Agenda/PlaneacionOperativo';
import PlaneacionJefe from './Agenda/PlaneacionJefe';
import EjecucionOperativo from './Agenda/EjecucionOperativo';
import EjecucionJefe from './Agenda/EjecucionJefe';
// Importaciones de Cierre
import CierreOperativo from './Agenda/CierreJornadaOperativo';
import CierreJefe from './Agenda/CierreJornadaJefe';

/**
 * MÓDULO PRINCIPAL DE AGENDAS
 * Renderiza las pestañas de navegación principales (Planeación, Ejecución, Cierre).
 * Decide qué componente cargar dependiendo de la categoría del usuario (Operativo vs Jefe).
 */
const AgendaModule = () => {
    const { selectedRole } = useRole();
    const [activeTab, setActiveTab] = useState('planeacion');

    // Opciones de navegación estáticas del frontend
    const tabs = [
        { id: 'planeacion', label: 'Planeación', icon: ClipboardList },
        { id: 'ejecucion', label: 'Ejecución', icon: MapPin },
        { id: 'cierre', label: 'Cierre', icon: CheckCircle2 },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'planeacion':
                return selectedRole.category === 'Operativo'
                    ? <PlaneacionOperativo />
                    : <PlaneacionJefe />;
            case 'ejecucion':
                return selectedRole.category === 'Operativo'
                    ? <EjecucionOperativo />
                    : <EjecucionJefe />;
            case 'cierre':
                // Lógica inyectada para el cierre de jornada
                return selectedRole.category === 'Operativo'
                    ? <CierreOperativo />
                    : <CierreJefe />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Info */}
            <div className="flex justify-between items-end mb-1">
                <div className="flex flex-col">
                    <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Módulo de Operación</h1>
                </div>
                <span className="text-[10px] font-mono-tech text-accent opacity-50">
                    ID: {selectedRole.id.toUpperCase()}-2026
                </span>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-end">
                <div className="glass-panel p-1 flex gap-1 rounded-xl bg-white/50 backdrop-blur-sm border-slate-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'text-accent hover:bg-slate-50 hover:text-primary'}
                            `}
                        >
                            <tab.icon size={12} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default AgendaModule;