import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useAgenda } from '../../context/AgendaContext';
import { Target, Lock, TrendingUp, DollarSign, Users, Activity, Loader2 } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// 1. Funciones Auxiliares para Formato y Validación (BLINDADAS)
// ──────────────────────────────────────────────────────────────────────────────
const formatCurrency = (val) => {
    if (!val && val !== 0) return '$0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
};

const formatQuantity = (val) => {
    if (!val && val !== 0) return '0';
    const num = parseInt(val, 10);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('es-MX').format(num);
};

const handleNumericChange = (e, tipo, callback) => {
    let value = e.target.value;
    let finalValue = '';

    if (tipo === 'CANTIDAD') {
        finalValue = value.replace(/\D/g, '');
        if (finalValue !== '' && parseInt(finalValue, 10) > 100000000) {
            finalValue = '100000000';
        }
    } else {
        let clean = value.replace(/[^\d.]/g, '');
        const parts = clean.split('.');
        if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
        
        let numericVal = parseFloat(clean);
        if (!isNaN(numericVal) && numericVal > 100000000) {
            finalValue = '100000000';
        } else {
            finalValue = clean;
        }
    }

    e.target.value = finalValue;
    callback(finalValue === '' ? '' : finalValue);
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. Diccionario de Iconos y Colores
// ──────────────────────────────────────────────────────────────────────────────
const ICON_MAP = {
    DollarSign: DollarSign,
    TrendingUp: TrendingUp,
    Activity: Activity,
    Users: Users
};

const colorMap = {
    blue: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600', icon: 'text-blue-500' },
    emerald: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', icon: 'text-emerald-500' },
    amber: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700', icon: 'text-amber-500' },
    violet: { bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700', icon: 'text-violet-500' },
    rose: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700', icon: 'text-rose-500' },
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. Sub-componentes
// ──────────────────────────────────────────────────────────────────────────────

const KpiField = ({ label, fieldKey, value, tipoValor, onChange, disabled }) => {
    const [isFocused, setIsFocused] = useState(false);

    const displayValue = isFocused 
        ? (value || '') 
        : (tipoValor === 'CANTIDAD' ? formatQuantity(value) : formatCurrency(value));

    const placeholderText = tipoValor === 'CANTIDAD' ? '0' : '$ 0.00';

    return (
        <div className="flex flex-col">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                {label}
            </label>
            <div className="relative">
                <input
                    id={`kpi-${fieldKey}`}
                    type="text"
                    value={displayValue}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => handleNumericChange(e, tipoValor, (val) => onChange(fieldKey, val))}
                    disabled={disabled}
                    placeholder={placeholderText}
                    className={`input-cell font-bold text-center tracking-wider transition-all w-full !py-3
                        ${disabled 
                            ? '!bg-slate-50 text-slate-400 !shadow-inner border-slate-200 cursor-not-allowed' 
                            : '!bg-white text-primary hover:border-blue-300 focus:border-blue-500'}`
                    }
                />
                {disabled && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Lock size={12} />
                    </div>
                )}
            </div>
        </div>
    );
};

const KpiGroup = ({ group, color, iconName, fields, kpi, onUpdate, disabled }) => {
    const c = colorMap[color] || colorMap.blue;
    const IconComponent = ICON_MAP[iconName] || Target;

    return (
        <div className="space-y-3">
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${c.badge} w-fit`}>
                <IconComponent size={12} className={c.icon} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{group}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {fields.map(f => (
                    <KpiField
                        key={f.key}
                        label={f.label}
                        fieldKey={f.key}
                        tipoValor={f.count ? 'CANTIDAD' : 'MONEDA'} 
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
// 4. Componente Principal
// ──────────────────────────────────────────────────────────────────────────────

const KpiCompromisos = ({ disabled: isSubmitting }) => {
    const { selectedRole } = useRole();
    const { currentAgenda, updateKpi, kpiConfig, loadingKpiConfig } = useAgenda();

    // Verificamos si la agenda ya está bloqueada por base de datos
    const isStatusLocked = currentAgenda.status === 'pendiente' || currentAgenda.status === 'aprobada';
    
    const isLocked = isStatusLocked || isSubmitting;
    
    const kpi = currentAgenda.kpiCompromisos || {};

    if (selectedRole?.category !== 'Operativo') return null;

    if (loadingKpiConfig) {
        return (
            <div className="mb-16 flex items-center justify-center p-10 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="ml-3 text-xs font-black uppercase tracking-widest">Cargando KPIs...</span>
            </div>
        );
    }

    if (!kpiConfig || kpiConfig.length === 0) return null;

    return (
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="gradient-header shadow-lg relative z-10 !rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-yellow-400 rounded-full" />
                    <h3 className="text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
                        <Target size={14} className="text-yellow-300" />
                        Compromisos KPI del Día
                    </h3>
                </div>
                {isStatusLocked ? (
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 text-white/60">
                        <Lock size={12} />
                        Comprometido
                    </div>
                ) : (
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/50">
                        {isSubmitting ? 'Guardando...' : 'Obligatorio · Planeación'}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-b-3xl border-x border-b border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-8">
                {isStatusLocked && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 text-amber-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        <Lock size={13} />
                        Los compromisos están bloqueados. La agenda ya fue enviada para autorización.
                    </div>
                )}

                {kpiConfig.map(group => (
                    <KpiGroup
                        key={group.group}
                        group={group.group}
                        color={group.color}
                        iconName={group.iconName}
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