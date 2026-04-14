import React from 'react';
import { useRole } from '../../context/RoleContext';
import { useAgenda } from '../../context/AgendaContext';
import { Target, Lock, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Field Definitions per Role
// ──────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Estos catálogos de configuración de KPIs se alimentarán del EP: /api/v1/catalogos/kpis-config
 * Consulta Backend Lógica:
 * SELECT k.grupo, k.color, k.llave_campo, k.etiqueta 
 * FROM catalogos.kpis_configuracion k 
 * WHERE k.clave_puesto = 'ASESOR-F' AND k.activo = true;
 * * Resultado en JSON esperado: 
 * Arreglos agrupados por categoría para construir los inputs dinámicamente.
 */
const FIELDS_ASESOR_F = [
    {
        group: 'Captación',
        color: 'blue',
        icon: DollarSign,
        fields: [
            { key: 'captNueva', label: 'Captación Nueva' },
            { key: 'captReinversion', label: 'Captación Reinversión' },
        ]
    },
    {
        group: 'Colocación',
        color: 'emerald',
        icon: TrendingUp,
        fields: [
            { key: 'colocInicial', label: 'Colocación Inicial' },
            { key: 'colocRedisposicion', label: 'Colocación Redisposición' },
        ]
    },
    {
        group: 'Recuperación',
        color: 'amber',
        icon: Activity,
        fields: [
            { key: 'rec0', label: 'Recuperación 0 días' },
            { key: 'rec1_7', label: 'Recuperación 1 a 7 días' },
            { key: 'rec8_30', label: 'Recuperación 8 a 30 días' },
            { key: 'rec31_60', label: 'Recuperación 31 a 60 días' },
            { key: 'recMas61', label: 'Recuperación +61 días' },
        ]
    },
];

/**
 * TODO: Mismo EP: /api/v1/catalogos/kpis-config filtrando por clave ASESOR-C o COORDINADOR-L
 */
const FIELDS_COORD_ASESOR_C = [
    {
        group: 'Captación',
        color: 'blue',
        icon: DollarSign,
        fields: [
            { key: 'captNueva', label: 'Captación Nueva' },
            { key: 'captReinversion', label: 'Captación Reinversión' },
        ]
    },
    {
        group: 'Dispersión',
        color: 'violet',
        icon: TrendingUp,
        fields: [
            { key: 'dispersion', label: 'Dispersión' },
            { key: 'dispersionNueva', label: 'Dispersión Nueva' },
            { key: 'aperturasCredFacil', label: '# Aperturas Crédito Fácil' },
            { key: 'montoLineasApertura', label: 'Monto Líneas de Apertura' },
        ]
    },
    {
        group: 'Recuperación',
        color: 'amber',
        icon: Activity,
        fields: [
            { key: 'rec0', label: 'Recuperación 0 días' },
            { key: 'rec1_7', label: 'Recuperación 1 a 7 días' },
            { key: 'rec8_30', label: 'Recuperación 8 a 30 días' },
            { key: 'rec31_60', label: 'Recuperación 31 a 60 días' },
            { key: 'recMas61', label: 'Recuperación +61 días' },
        ]
    },
    {
        group: 'Servicio',
        color: 'rose',
        icon: Users,
        fields: [
            { key: 'servicioPremiumPendiente', label: 'Servicio Premium Pendiente' },
        ]
    },
];

/**
 * TODO: Mismo EP: /api/v1/catalogos/kpis-config filtrando por clave GESTOR-I
 */
const FIELDS_GESTOR_I = [
    {
        group: 'Cobranza',
        color: 'emerald',
        icon: DollarSign,
        fields: [
            { key: 'cobranzaTotalDia', label: 'Cobranza Total Día' },
            { key: 'cobranza1_30', label: 'Cobranza 1 a 30 días' },
            { key: 'cobranza31_60', label: 'Cobranza 31 a 60 días' },
            { key: 'opCobradas', label: 'Operaciones Cobradas' },
        ]
    },
    {
        group: 'Visitas y Promesas',
        color: 'blue',
        icon: Users,
        fields: [
            { key: 'visitasRealizadas', label: '# Visitas Realizadas' },
            { key: 'promesasDia', label: 'Promesas de Pago del Día' },
            { key: 'montoPromesas', label: 'Monto de Promesas Generadas' },
        ]
    },
    {
        group: 'Saneamiento y Contención',
        color: 'amber',
        icon: Activity,
        fields: [
            { key: 'saldoSaneadoDia', label: 'Saldo Saneado Día' },
            { key: 'contencionMas30', label: 'Contención +30 días' },
            { key: 'contencionMas60', label: 'Contención +60 días' },
            { key: 'contencionMas89', label: 'Contención +89 días' },
        ]
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// Color map for group headers
// ──────────────────────────────────────────────────────────────────────────────

const colorMap = {
    blue: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600', icon: 'text-blue-500' },
    emerald: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', icon: 'text-emerald-500' },
    amber: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700', icon: 'text-amber-500' },
    violet: { bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700', icon: 'text-violet-500' },
    rose: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700', icon: 'text-rose-500' },
};

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

const KpiField = ({ label, fieldKey, value, onChange, disabled }) => (
    <div className="flex flex-col">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
            {label}
        </label>
        <div className="relative">
            <input
                type="text"
                inputMode="numeric"
                value={value || ''}
                onChange={e => {
                    const clean = e.target.value.replace(/\D/g, '');
                    onChange(fieldKey, clean);
                }}
                disabled={disabled}
                placeholder="0"
                className={`
                    input-cell font-bold text-center text-primary tracking-wider
                    transition-all duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'hover:border-blue-300 focus:border-blue-500'}
                `}
            />
            {disabled && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <Lock size={10} />
                </div>
            )}
        </div>
    </div>
);

const KpiGroup = ({ group, color, icon: Icon, fields, kpi, onUpdate, disabled }) => {
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className="space-y-3">
            {/* Group header */}
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${c.badge} w-fit`}>
                <Icon size={12} className={c.icon} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{group}</span>
            </div>
            {/* Fields grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {fields.map(f => (
                    <KpiField
                        key={f.key}
                        label={f.label}
                        fieldKey={f.key}
                        value={kpi[f.key]}
                        onChange={onUpdate}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────

const KpiCompromisos = () => {
    const { selectedRole } = useRole();
    const { currentAgenda, updateKpi } = useAgenda();

    const isLocked = currentAgenda.status === 'pendiente' || currentAgenda.status === 'aprobada';
    
    /**
     * TODO: Los valores capturados aquí se extraen y envían al backend
     * al momento de certificar la agenda (PlaneacionOperativo.jsx).
     * EP de Inserción: POST /api/v1/agendas/{idPlan}/kpis-compromisos
     */
    const kpi = currentAgenda.kpiCompromisos || {};

    // Determine which field groups to render
    let fieldGroups = null;
    const roleId = selectedRole?.id;

    if (roleId === 'asesor-f') {
        fieldGroups = FIELDS_ASESOR_F;
    } else if (roleId === 'asesor-c' || roleId === 'coordinador-l') {
        fieldGroups = FIELDS_COORD_ASESOR_C;
    } else if (roleId === 'gestor-i') {
        fieldGroups = FIELDS_GESTOR_I;
    }

    // Only operatives fill this form
    if (!fieldGroups || selectedRole?.category !== 'Operativo') return null;

    return (
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section header — matches SegmentSection style */}
            <div className="gradient-header shadow-lg relative z-10 !rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-yellow-400 rounded-full" />
                    <h3 className="text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
                        <Target size={14} className="text-yellow-300" />
                        Compromisos KPI del Día
                    </h3>
                </div>
                {isLocked ? (
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 text-white/60">
                        <Lock size={12} />
                        Comprometido
                    </div>
                ) : (
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/50">
                        Obligatorio · Planeación
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="bg-white rounded-b-3xl border-x border-b border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-8">
                {isLocked && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 text-amber-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        <Lock size={13} />
                        Los compromisos están bloqueados. La agenda ya fue enviada para autorización.
                    </div>
                )}

                {fieldGroups.map(group => (
                    <KpiGroup
                        key={group.group}
                        group={group.group}
                        color={group.color}
                        icon={group.icon}
                        fields={group.fields}
                        kpi={kpi}
                        onUpdate={updateKpi}
                        disabled={isLocked}
                    />
                ))}
            </div>
        </div>
    );
};

export default KpiCompromisos;
