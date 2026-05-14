import React, { useState, useEffect } from 'react';
import { useRole } from '../../context/RoleContext';
import api from '../../api/axiosConfig'; 
import {
    CheckCircle2, Clock, AlertTriangle, ChevronRight, ChevronDown,
    User, Building2, MapPin, FileText, X, Send, RotateCcw,
    Users, TrendingUp, Briefcase, Eye, ArrowLeft, Shield, Layers, Loader2
} from 'lucide-react';
import UIModal from '../../components/UIModal'; // <-- 1. Importamos el UIModal

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS RESCATADOS DEL MOCK
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS RESCATADOS DEL MOCK
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    borrador: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
    pendiente: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    aprobada: { label: 'Autorizada', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    requiere_modificacion: { label: 'Req. Modificación', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    ejecutada: { label: 'Ejecutada', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
    completada: { label: 'Completada', bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' }
};
const formatCurrency = (v) => {
    if (!v) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
};

const agruparPorZona = (agendas) => {
    return agendas.reduce((acc, ag) => {
        if (!acc[ag.zona]) acc[ag.zona] = {};
        if (!acc[ag.zona][ag.sucursal]) acc[ag.zona][ag.sucursal] = [];
        acc[ag.zona][ag.sucursal].push(ag);
        return acc;
    }, {});
};

const agendasDeEjecutivo = (allAgendas, ejecutivoId) =>
    allAgendas.filter(ag => ag.ejecutivoId === ejecutivoId);

const contarEstados = (agendasList) => ({
    total: agendasList.length,
    pendiente: agendasList.filter(a => a.status?.toLowerCase() === 'pendiente').length,
    aprobada: agendasList.filter(a => a.status?.toLowerCase() === 'aprobada' || a.status?.toLowerCase() === 'autorizada').length,
    requiere_modificacion: agendasList.filter(a => a.status?.toLowerCase() === 'requiere_modificacion').length,
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES UI COMPARTIDOS
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status, size = 'sm' }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.borrador;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${size === 'xs' ? 'text-[8px]' : 'text-[9px]'} ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

const CounterBadge = ({ counts }) => (
    <div className="flex gap-2">
        {counts.pendiente > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black border border-amber-200">
                {counts.pendiente} pend.
            </span>
        )}
        {counts.aprobada > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-200">
                {counts.aprobada} aut.
            </span>
        )}
        {counts.requiere_modificacion > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] font-black border border-red-200">
                {counts.requiere_modificacion} mod.
            </span>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE MODIFICACIÓN
// ─────────────────────────────────────────────────────────────────────────────
const ModificacionModal = ({ operativo, onConfirm, onCancel }) => {
    const [nota, setNota] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async () => {
        setEnviando(true);
        await onConfirm(nota);
        setEnviando(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-8 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-primary uppercase tracking-tight">Solicitar Modificación</h3>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">{operativo}</p>
                    </div>
                    <button onClick={onCancel} disabled={enviando} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={16} className="text-slate-400" />
                    </button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={12} /> Campo obligatorio
                    </p>
                    <p className="text-[11px] text-amber-600 mt-1">Debes especificar el motivo de la modificación para continuar.</p>
                </div>
                <label className="text-[9px] font-black text-accent uppercase tracking-widest mb-2 block">
                    Motivo / Instrucciones para el operativo
                </label>
                <textarea
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    disabled={enviando}
                    rows={4}
                    className="w-full border border-slate-200 rounded-2xl p-4 text-[12px] text-primary font-medium resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Ej: Corregir la dirección del cliente #3, empalme de horario en las 11:00..."
                />
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        disabled={enviando}
                        className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-[11px] font-black uppercase tracking-widest text-accent hover:bg-slate-50 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={!nota.trim() || enviando}
                        onClick={handleSubmit}
                        className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${nota.trim() ? 'bg-red-500 hover:bg-red-600 shadow-lg' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 
                        {enviando ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// DETALLE DE AGENDA (Vista solo lectura para jefes)
// ─────────────────────────────────────────────────────────────────────────────
const SegmentReadOnly = ({ title, visits }) => {
    const [open, setOpen] = useState(true);
    if (!visits || visits.length === 0) return null;

    const SEGMENT_COLORS = {
        'Promoción': { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
        'Evaluación e Integración': { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700' },
        'Seguimiento de Cartera': { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
        'Gestión de Empresarias': { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
        // NUEVO: Colores para imprevistos y fallback de seguridad
        'Visita No Planeada': { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700' }
    };
    
    // Si llega un segmento desconocido, usa gris por defecto
    const c = SEGMENT_COLORS[title] || { bg: 'bg-slate-500', light: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };

    return (
        <div className={`rounded-2xl border ${c.border} overflow-hidden mb-3`}>
            <button
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between px-5 py-3 ${c.light} hover:opacity-90 transition-all`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-5 ${c.bg} rounded-full`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${c.text}`}>{title}</span>
                    <span className={`px-2 py-0.5 rounded-full ${c.bg} text-white text-[9px] font-black`}>{visits.length}</span>
                </div>
                {open ? <ChevronDown size={14} className={c.text} /> : <ChevronRight size={14} className={c.text} />}
            </button>
            {open && (
                <div className="divide-y divide-slate-100">
                    {visits.map((v, idx) => (
                        <div key={v.id} className="px-5 py-3 bg-white hover:bg-slate-50/50 grid grid-cols-12 gap-3 items-start text-[10px]">
                            <div className="col-span-1 font-mono-tech text-slate-400 pt-1">{idx + 1}</div>
                            <div className="col-span-2">
                                <span className={`font-black uppercase px-2 py-1 rounded-lg ${c.light} ${c.text}`}>{v.time || 'IMPREVISTO'}</span>
                            </div>
                            <div className="col-span-4">
                                <p className="font-black text-primary uppercase text-[11px] leading-tight">{v.name || '—'}</p>
                                {v.classification && <p className="text-slate-400 font-bold mt-0.5">{v.classification}</p>}
                                {v.idCredito && <p className="text-slate-400 font-bold font-mono-tech mt-0.5">#{v.idCredito}</p>}
                            </div>
                            <div className="col-span-5 space-y-1">
                                {v.activity && <p className="text-slate-600 font-medium">{v.activity}</p>}
                                {v.product && <p className="text-slate-500 font-bold uppercase">{v.product}</p>}
                                {v.estimatedAmount && <p className="text-primary font-bold">{formatCurrency(v.estimatedAmount)}</p>}
                                {v.moraActual != null && (
                                    <div className="flex gap-2 flex-wrap">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${v.categoriaGestion === 'vencido' ? 'bg-red-100 text-red-700' : v.categoriaGestion === 'vigente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {v.categoriaGestion || 'preventivo'}
                                        </span>
                                        <span className="text-slate-400 font-bold">{v.moraActual}d mora | {formatCurrency(v.saldoActual)}</span>
                                    </div>
                                )}
                                {v.typeManagement && <p className="text-slate-500 font-bold">{v.typeManagement}</p>}
                                {v.managementResult && (
                                    <p className="text-slate-600 font-bold bg-slate-100 border border-slate-200 p-1.5 rounded mt-1 inline-block">
                                        {v.managementResult.split(' | ')[0]}
                                    </p>
                                )}
                                </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AgendaDetalle = ({ agenda, onBack, onApprove, onRequestMod }) => {
    const [modModal, setModModal] = useState(false);
    const [localStatus, setLocalStatus] = useState(agenda.status);
    const [localNota, setLocalNota] = useState(agenda.notaJefe || '');
    const [isProcessing, setIsProcessing] = useState(false);

    // NUEVO 1: Diccionario para traducir llaves técnicas a etiquetas elegantes
    const KPI_LABELS = {
        captNueva: 'Captación Nueva',
        captReinversion: 'Captación Reinv.',
        rec0: 'Recup. 0 días',
        rec1_7: 'Recup. 1-7 días',
        rec8_30: 'Recup. 8-30 días',
        rec31_60: 'Recup. 31-60 días',
        recMas61: 'Recup. +61 días',
        colocInicial: 'Colocación Inic.',
        colocRedisposicion: 'Coloc. Redisp.',
        dispersion: 'Dispersión',
        cobranzaTotalDia: 'Cobranza Total',
        visitasRealizadas: 'Visitas Reales',
        promesasDia: 'Promesas'
    };

    // NUEVO 2: Lógica dinámica de segmentos (atrapa "Visitas No Planeadas")
    const baseSegments = ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera', 'Gestión de Empresarias'];
    const extraSegments = Object.keys(agenda.segments || {}).filter(seg => !baseSegments.includes(seg));
    const allSegments = [...baseSegments, ...extraSegments];

    const handleApprove = async () => {
        setIsProcessing(true);
        await onApprove(agenda.id);
        setLocalStatus('aprobada');
        setIsProcessing(false);
    };

    const handleMod = async (nota) => {
        await onRequestMod(agenda.id, nota);
        setLocalStatus('requiere_modificacion');
        setLocalNota(nota);
        setModModal(false);
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            {modModal && (
                <ModificacionModal
                    operativo={agenda.operativo.nombre}
                    onConfirm={handleMod}
                    onCancel={() => setModModal(false)}
                />
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-primary">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none">{agenda.operativo.nombre}</h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">{agenda.operativo.puesto}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-accent">{agenda.sucursal}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-400">{agenda.zona}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-400">ID: {agenda.operativo.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={localStatus} />
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enviada</p>
                        <p className="text-[11px] font-black text-primary">{agenda.horaEnvio} hrs</p>
                    </div>
                </div>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Promociones', val: agenda.segments['Promoción']?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Evaluaciones', val: agenda.segments['Evaluación e Integración']?.length || 0, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Seguimiento', val: agenda.segments['Seguimiento de Cartera']?.length || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Imprevistos', val: agenda.segments['Visita No Planeada']?.length || 0, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                        <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

           
            {/* Nota de modificación anterior */}
            {(localStatus === 'requiere_modificacion' && localNota) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex gap-3">
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Nota enviada al operativo</p>
                        <p className="text-[11px] text-red-700 font-medium">{localNota}</p>
                    </div>
                </div>
            )}

            {/* NUEVO 3: Iteramos sobre los segmentos dinámicos */}
            {allSegments.map(seg => (
                <SegmentReadOnly key={seg} title={seg} visits={agenda.segments[seg] || []} />
            ))}

            {/* Acciones */}
            {localStatus === 'pendiente' && (
                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button
                        onClick={() => setModModal(true)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all font-black text-[11px] uppercase tracking-widest disabled:opacity-50"
                    >
                        <AlertTriangle size={16} /> Solicitar Modificación
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-200 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {isProcessing ? 'Autorizando...' : 'Autorizar Agenda'}
                    </button>
                </div>
            )}
            {localStatus === 'aprobada' && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Agenda autorizada por ti</p>
                </div>
            )}

             {/* Panel de Compromisos KPI con formato */}
            {agenda.kpiCompromisos && Object.keys(agenda.kpiCompromisos).length > 0 && (
                <div className="mb-6 bg-slate-900 rounded-3xl p-6 text-white shadow-lg mgt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 bg-yellow-400 rounded-full" />
                        <h4 className="text-[12px] font-black uppercase tracking-[0.2em]">Compromisos KPI Solicitados</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(agenda.kpiCompromisos).map(([key, value]) => {
                            const valNum = Number(value);
                            
                            const formattedValue = new Intl.NumberFormat('es-MX', { 
                                style: 'currency', 
                                currency: 'MXN' 
                            }).format(valNum);
                            
                            return (
                                <div key={key} className="bg-white/10 border border-white/5 rounded-2xl p-4 hover:bg-white/20 transition-colors">                                    
                                    <p className="text-md font-black text-white">{formattedValue}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {KPI_LABELS[key] || key}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE AGENDA (resumen en listas)
// ─────────────────────────────────────────────────────────────────────────────
const AgendaCard = ({ agenda, onSelect, onApprove, onRequestMod }) => {
    const [modModal, setModModal] = useState(false);
    const [localStatus, setLocalStatus] = useState(agenda.status);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        await onApprove(agenda.id);
        setLocalStatus('aprobada');
        setIsProcessing(false);
    };

    const handleMod = async (nota) => {
        await onRequestMod(agenda.id, nota);
        setLocalStatus('requiere_modificacion');
        setModModal(false);
    };

    const segCounts = {
        prom: agenda.segments['Promoción']?.length || 0,
        eval: agenda.segments['Evaluación e Integración']?.length || 0,
        cart: agenda.segments['Seguimiento de Cartera']?.length || 0,
        emp: agenda.segments['Gestión de Empresarias']?.length || 0,
    };

    return (
        <>
            {modModal && (
                <ModificacionModal
                    operativo={agenda.operativo.nombre}
                    onConfirm={handleMod}
                    onCancel={() => setModModal(false)}
                />
            )}
            <div
                onClick={() => onSelect(agenda)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60 transition-all cursor-pointer group p-5"
            >
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <User size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-primary text-[12px] uppercase leading-tight truncate">{agenda.operativo.nombre}</p>
                            <p className="text-[9px] font-black text-accent uppercase tracking-widest mt-0.5">{agenda.operativo.puesto}</p>
                            {agenda.operativo.equipo && (
                                <p className="text-[8px] font-bold text-slate-400 uppercase">{agenda.operativo.equipo}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <StatusBadge status={localStatus} />
                        <span className="text-[9px] font-bold text-slate-400">Envío {agenda.horaEnvio}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    {segCounts.prom > 0 && <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black">Prom {segCounts.prom}</span>}
                    {segCounts.eval > 0 && <span className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600 text-[9px] font-black">E&I {segCounts.eval}</span>}
                    {segCounts.cart > 0 && <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black">Ctra {segCounts.cart}</span>}
                    {segCounts.emp > 0 && <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black">Emp {segCounts.emp}</span>}
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(agenda); }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest group-hover:gap-2.5 transition-all"
                    >
                        <Eye size={13} /> Ver Detalle <ChevronRight size={13} />
                    </button>

                    {localStatus === 'pendiente' && (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setModModal(true); }}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                                <AlertTriangle size={11} /> Modificar
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} 
                                Autorizar
                            </button>
                        </div>
                    )}
                    {localStatus === 'aprobada' && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                            <CheckCircle2 size={11} /> Autorizada
                        </span>
                    )}
                    {localStatus === 'requiere_modificacion' && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase">
                            <AlertTriangle size={11} /> Modificación solicitada
                        </span>
                    )}
                </div>
            </div>
        </>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE SUCURSAL (para niveles Subdirector/Director)
// ─────────────────────────────────────────────────────────────────────────────
const SucursalCard = ({ sucursal, zona, agendas, onClick }) => {
    const counts = contarEstados(agendas);
    return (
        <div
            onClick={() => onClick(sucursal, zona, agendas)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60 transition-all cursor-pointer p-5 group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="font-black text-primary text-[13px] uppercase tracking-tight">{sucursal}</p>
                        <p className="text-[9px] font-black text-accent uppercase tracking-widest">{zona}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-500 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">Ver detalle</span>
                    <ChevronRight size={14} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-primary">{counts.total}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Agendas</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-amber-500">{counts.pendiente}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Pendientes</p>
                </div>
            </div>
            <CounterBadge counts={counts} />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE ZONA (para nivel Director)
// ─────────────────────────────────────────────────────────────────────────────
const ZonaCard = ({ zona, sucursales, onClick }) => {
    const allAgendas = Object.values(sucursales).flat();
    const counts = contarEstados(allAgendas);
    const sucCount = Object.keys(sucursales).length;

    return (
        <div
            onClick={() => onClick(zona, sucursales)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/60 transition-all cursor-pointer p-6 group"
        >
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-200">
                        <Layers size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="font-black text-primary text-[15px] uppercase tracking-tight">{zona}</p>
                        <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{sucCount} Sucursales</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-violet-500 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">Explorar</span>
                    <ChevronRight size={14} />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { label: 'Sucursales', val: sucCount, color: 'text-violet-600' },
                    { label: 'Agendas', val: counts.total, color: 'text-primary' },
                    { label: 'Pendientes', val: counts.pendiente, color: 'text-amber-500' },
                ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {Object.keys(sucursales).map(suc => (
                    <span key={suc} className="px-2 py-0.5 rounded-lg bg-violet-50 text-violet-600 text-[8px] font-black uppercase">{suc}</span>
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// BREADCRUMB
// ─────────────────────────────────────────────────────────────────────────────
const Breadcrumb = ({ items }) => (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {items.map((item, idx) => (
            <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />}
                {item.onClick ? (
                    <button onClick={item.onClick} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 whitespace-nowrap transition-colors">{item.label}</button>
                ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary whitespace-nowrap">{item.label}</span>
                )}
            </React.Fragment>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KPI HEADER BAR
// ─────────────────────────────────────────────────────────────────────────────
const KpiBar = ({ counts, title, subtitle, icon: Icon }) => (
    <div className="bg-slate-900 rounded-3xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between mb-4">
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
                {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
            {Icon && <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><Icon size={22} className="text-slate-300" /></div>}
        </div>
        <div className="grid grid-cols-4 gap-3">
            {[
                { label: 'Total Agendas', val: counts.total, color: 'text-white' },
                { label: 'Pendientes', val: counts.pendiente, color: 'text-amber-400' },
                { label: 'Autorizadas', val: counts.aprobada, color: 'text-emerald-400' },
                { label: 'Con Req.', val: counts.requiere_modificacion, color: 'text-red-400' },
            ].map(k => (
                <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className={`text-3xl font-black ${k.color}`}>{k.val}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{k.label}</p>
                </div>
            ))}
        </div>
    </div>
);


// ─────────────────────────────────────────────────────────────────────────────
// VISTA GERENTE (Nivel 1 Comercial / Nivel 1 Cobranza)
// ─────────────────────────────────────────────────────────────────────────────
const VistaGerente = ({ agendas, sucursal, zona, rolName, canal, onApproveAgenda, onModAgenda }) => {
    const [detalle, setDetalle] = useState(null);
    const counts = contarEstados(agendas);

    if (detalle) {
        return (
            <AgendaDetalle
                agenda={detalle}
                onBack={() => setDetalle(null)}
                onApprove={onApproveAgenda}
                onRequestMod={onModAgenda}
            />
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <KpiBar
                counts={counts}
                title={sucursal || 'Mi Sucursal'}
                subtitle={`${zona || ''} · ${canal === 'cobranza' ? 'Cobranza' : 'Comercial'} · ${rolName}`}
                icon={canal === 'cobranza' ? Shield : Building2}
            />
            <div className="mb-4">
                <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-3">
                    Agendas por Operativo — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                {agendas.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <FileText size={36} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Sin agendas recibidas hoy</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {agendas.map(ag => (
                            <AgendaCard
                                key={ag.id}
                                agenda={ag}
                                onSelect={setDetalle}
                                onApprove={onApproveAgenda}
                                onRequestMod={onModAgenda}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// VISTA SUBDIRECTOR (Nivel 2)
// ─────────────────────────────────────────────────────────────────────────────
const VistaSubdirector = ({ zona, sucursalesData, rolName, canal, onApproveAgenda, onModAgenda }) => {
    const [drillSucursal, setDrillSucursal] = useState(null);
    const allAgendas = Object.values(sucursalesData).flat();
    const counts = contarEstados(allAgendas);

    if (drillSucursal) {
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: zona, onClick: () => setDrillSucursal(null) },
                    { label: drillSucursal.sucursal },
                ]} />
                <VistaGerente
                    agendas={drillSucursal.agendas}
                    sucursal={drillSucursal.sucursal}
                    zona={zona}
                    rolName="Vista de Sucursal"
                    canal={canal}
                    onApproveAgenda={onApproveAgenda}
                    onModAgenda={onModAgenda}
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <KpiBar
                counts={counts}
                title={zona}
                subtitle={`${rolName} · ${canal === 'cobranza' ? 'Cobranza' : 'Comercial'} · ${Object.keys(sucursalesData).length} sucursales`}
                icon={MapPin}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">Sucursales de la Zona</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(sucursalesData).map(([suc, agendas]) => (
                    <SucursalCard
                        key={suc}
                        sucursal={suc}
                        zona={zona}
                        agendas={agendas}
                        onClick={(sucursal, zona, agendas) => setDrillSucursal({ sucursal, zona, agendas })}
                    />
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// VISTA DIRECTOR (Nivel 3)
// ─────────────────────────────────────────────────────────────────────────────
const VistaDirector = ({ zonasData, rolName, canal, onApproveAgenda, onModAgenda }) => {
    const [drillZona, setDrillZona] = useState(null);
    const allAgendas = Object.values(zonasData).flatMap(suc => Object.values(suc).flat());
    const counts = contarEstados(allAgendas);

    if (drillZona) {
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: 'Nacional', onClick: () => setDrillZona(null) },
                    { label: drillZona.zona },
                ]} />
                <VistaSubdirector
                    zona={drillZona.zona}
                    sucursalesData={drillZona.sucursales}
                    rolName="Vista Subdirector"
                    canal={canal}
                    onApproveAgenda={onApproveAgenda}
                    onModAgenda={onModAgenda}
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <KpiBar
                counts={counts}
                title="Vista Nacional"
                subtitle={`${rolName} · ${canal === 'cobranza' ? 'Cobranza' : 'Comercial'} · ${Object.keys(zonasData).length} zonas`}
                icon={TrendingUp}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">Zonas Activas</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(zonasData).map(([zona, sucursales]) => (
                    <ZonaCard
                        key={zona}
                        zona={zona}
                        sucursales={sucursales}
                        onClick={(zona, sucursales) => setDrillZona({ zona, sucursales })}
                    />
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE EJECUTIVO DE COBRANZA
// ─────────────────────────────────────────────────────────────────────────────
const EjecutivoCard = ({ ejecutivo, agendas, onClick }) => {
    const counts = contarEstados(agendas);
    return (
        <div
            onClick={() => onClick(ejecutivo, agendas)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-md hover:shadow-teal-100/60 transition-all cursor-pointer p-5 group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="font-black text-primary text-[12px] uppercase tracking-tight leading-tight">Región Ej. {ejecutivo.nombre.split(' ').slice(0, 2).join(' ')}</p>
                        <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-0.5">Ejecutivo de Cobranza</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{ejecutivo.sucursalesRef?.join(' · ')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-teal-500 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">Ver región</span>
                    <ChevronRight size={14} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-primary">{counts.total}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Agendas</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-amber-500">{counts.pendiente}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Pendientes</p>
                </div>
            </div>
            <CounterBadge counts={counts} />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// VISTA EJECUTIVO COBRANZA (Nivel 1)
// ─────────────────────────────────────────────────────────────────────────────
const VistaEjecutivoCobranza = ({ ejecutivo, agendas, rolName, onApproveAgenda, onModAgenda }) => {
    const [detalle, setDetalle] = useState(null);
    const counts = contarEstados(agendas);
    const regionLabel = `Región Ej. ${ejecutivo.nombre}`;

    if (detalle) {
        return (
            <AgendaDetalle
                agenda={detalle}
                onBack={() => setDetalle(null)}
                onApprove={onApproveAgenda}
                onRequestMod={onModAgenda}
            />
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <KpiBar
                counts={counts}
                title={regionLabel}
                subtitle={`Cobranza · ${rolName} · ${agendas.length} gestores asignados`}
                icon={Shield}
            />
            {ejecutivo.sucursalesRef?.length > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sucursales de referencia:</span>
                    {ejecutivo.sucursalesRef.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-600 text-[8px] font-black uppercase">{s}</span>
                    ))}
                </div>
            )}
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-3">
                Gestores Internos — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            {agendas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                    <FileText size={36} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Sin agendas recibidas hoy</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {agendas.map(ag => (
                        <AgendaCard
                            key={ag.id}
                            agenda={ag}
                            onSelect={setDetalle}
                            onApprove={onApproveAgenda}
                            onRequestMod={onModAgenda}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// VISTA COORDINADOR COBRANZA (Nivel 2)
// ─────────────────────────────────────────────────────────────────────────────
const VistaCoordCobranza = ({ coordinador, ejecutivos, allAgendas, rolName, onApproveAgenda, onModAgenda }) => {
    const [drillEjecutivo, setDrillEjecutivo] = useState(null);
    const counts = contarEstados(allAgendas);

    if (drillEjecutivo) {
        const ejAgendas = agendasDeEjecutivo(allAgendas, drillEjecutivo.id);
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: `Coord. ${coordinador.nombre.split(' ')[0]}`, onClick: () => setDrillEjecutivo(null) },
                    { label: `Región Ej. ${drillEjecutivo.nombre.split(' ').slice(0, 2).join(' ')}` },
                ]} />
                <VistaEjecutivoCobranza
                    ejecutivo={drillEjecutivo}
                    agendas={ejAgendas}
                    rolName="Vista de Región"
                    onApproveAgenda={onApproveAgenda}
                    onModAgenda={onModAgenda}
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <KpiBar
                counts={counts}
                title={`Coord. ${coordinador.nombre}`}
                subtitle={`Cobranza · ${rolName} · ${ejecutivos.length} ejecutivos`}
                icon={Users}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">Regiones de Ejecutivos</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ejecutivos.map(ej => (
                    <EjecutivoCard
                        key={ej.id}
                        ejecutivo={ej}
                        agendas={agendasDeEjecutivo(allAgendas, ej.id)}
                        onClick={(ej) => setDrillEjecutivo(ej)}
                    />
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// VISTA SUBDIRECTOR COBRANZA (Nivel 3)
// ─────────────────────────────────────────────────────────────────────────────
const VistaSubdirCobranza = ({ coordinadores, ejecutivos, allAgendas, rolName, onApproveAgenda, onModAgenda }) => {
    const [drillCoord, setDrillCoord] = useState(null);
    const counts = contarEstados(allAgendas);

    if (drillCoord) {
        const coordEjs = ejecutivos.filter(e => e.coordinadorId === drillCoord.id);
        const coordAgendas = allAgendas.filter(ag => coordEjs.some(e => e.id === ag.ejecutivoId));
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: 'Nacional Cobranza', onClick: () => setDrillCoord(null) },
                    { label: `Coord. ${drillCoord.nombre.split(' ')[0]}` },
                ]} />
                <VistaCoordCobranza
                    coordinador={drillCoord}
                    ejecutivos={coordEjs}
                    allAgendas={coordAgendas}
                    rolName="Vista de Coordinador"
                    onApproveAgenda={onApproveAgenda}
                    onModAgenda={onModAgenda}
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <KpiBar
                counts={counts}
                title="Nacional Cobranza"
                subtitle={`${rolName} · ${coordinadores.length} coordinadores`}
                icon={TrendingUp}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">Coordinadores de Cobranza</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {coordinadores.map(coord => {
                    const coordEjs = ejecutivos.filter(e => e.coordinadorId === coord.id);
                    const coordAgendas = allAgendas.filter(ag => coordEjs.some(e => e.id === ag.ejecutivoId));
                    const coordCounts = contarEstados(coordAgendas);
                    return (
                        <div
                            key={coord.id}
                            onClick={() => setDrillCoord(coord)}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/60 transition-all cursor-pointer p-6 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Briefcase size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-black text-primary text-[13px] uppercase tracking-tight">{coord.nombre}</p>
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">Coordinador · {coordEjs.length} Ejecutivos</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Explorar</span>
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {[
                                    { label: 'Ejecutivos', val: coordEjs.length, color: 'text-indigo-600' },
                                    { label: 'Agendas', val: coordCounts.total, color: 'text-primary' },
                                    { label: 'Pendientes', val: coordCounts.pendiente, color: 'text-amber-500' },
                                ].map(s => (
                                    <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                                        <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <CounterBadge counts={coordCounts} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE RAÍZ — PlaneacionJefe
// ─────────────────────────────────────────────────────────────────────────────
const PlaneacionJefe = () => {
    const { selectedRole } = useRole();
    const canal = selectedRole?.canal?.toLowerCase();
    const roleName = selectedRole?.name;

    const [loading, setLoading] = useState(true);
    const [agendas, setAgendas] = useState([]);
    const [jerarquia, setJerarquia] = useState({ coordinadores: [], ejecutivos: [] });

    // <-- 2. NUEVO: ESTADO GLOBAL PARA EL MODAL DE ALERTAS -->
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const counts = contarEstados(agendas);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const hoy = new Date().toISOString().split('T')[0];
                const resAgendas = await api.get(`/agenda/equipo?fecha=${hoy}`);
                const dataAgendas = resAgendas.data?.contenido || [];
                
                const parsedAgendas = dataAgendas.map(ag => {
                    let parsedSegments = ag.segments || {};
                    if (typeof parsedSegments === 'string') {
                        try { parsedSegments = JSON.parse(parsedSegments); } catch (e) { }
                    }
                    return { ...ag, segments: parsedSegments };
                });
                setAgendas(parsedAgendas);
            } catch (err) {
                console.error("Error al cargar dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        if (canal) fetchDashboardData();
    }, [canal]);

    const handleApproveAgenda = async (idPlan) => {
        try {
            const response = await api.put(`/agenda/plan/${idPlan}/estatus`, { 
                estatus: 'aprobada', 
                nota: 'Agenda autorizada por el jefe' 
            });

            if (response.data.codigo === 'OK') {
                setAgendas(prev => prev.map(ag => ag.id === idPlan ? { ...ag, status: 'aprobada' } : ag));
           
                // <-- 3. SUSTITUIMOS EL ALERT NATIVO (Éxito) -->
                setAlertModal({
                    isOpen: true,
                    title: 'Autorización Exitosa',
                    message: 'Agenda autorizada con éxito.',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error al autorizar", error);
            // <-- 3. SUSTITUIMOS EL ALERT NATIVO (Error) -->
            setAlertModal({
                isOpen: true,
                title: 'Error de Autorización',
                message: 'No se pudo autorizar la agenda.',
                type: 'danger'
            });
        }
    };

    const handleModAgenda = async (idPlan, nota) => {
        try {
            await api.put(`/agenda/plan/${idPlan}/estatus`, { 
                estatus: 'requiere_modificacion', 
                nota: nota 
            });

            setAgendas(prev => prev.map(ag => 
                ag.id === idPlan 
                    ? { ...ag, status: 'requiere_modificacion', notaJefe: nota } 
                    : ag
            ));
            
            // <-- 3. SUSTITUIMOS EL ALERT NATIVO (Éxito) -->
            setAlertModal({
                isOpen: true,
                title: 'Modificación Solicitada',
                message: 'Se ha solicitado la modificación al asesor.',
                type: 'success'
            });

        } catch (error) {
            console.error("Error al solicitar modificación:", error);
            // <-- 3. SUSTITUIMOS EL ALERT NATIVO (Error) -->
            setAlertModal({
                isOpen: true,
                title: 'Error de Solicitud',
                message: 'No se pudo procesar la solicitud.',
                type: 'danger'
            });
        }
    };

    const WRAP = ({ children }) => (
        <div className="max-w-[1400px] mx-auto pb-20 px-4 md:px-8 pt-6">
            {children}
            {/* <-- 4. INYECTAMOS EL COMPONENTE UIModal --> */}
            <UIModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div>
    );

    if (loading) return <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin text-blue-500" /></div>;

    const renderVistaJerarquica = () => {
        // 1. Agrupamos las agendas usando tu helper
        const zonasData = agruparPorZona(agendas);
        const zonasNombres = Object.keys(zonasData);
        
        // 2. Inferimos el nivel. Si tu Context tiene selectedRole.nivel úsalo, 
        // si no, lo detectamos por el nombre del rol.
        const nivel = selectedRole?.nivel || 
                     (roleName?.toUpperCase().includes('N2') || roleName?.toLowerCase().includes('zona') || roleName?.toLowerCase().includes('subdirector') ? 2 : 1);

        // NIVEL 3: Director (Vista Nacional)
        if (nivel === 3 || roleName?.toUpperCase().includes('N3')) {
            return (
                <VistaDirector 
                    zonasData={zonasData} 
                    rolName={roleName} 
                    canal={canal} 
                    onApproveAgenda={handleApproveAgenda} 
                    onModAgenda={handleModAgenda} 
                />
            );
        }

        // NIVEL 2: Subdirector / Gerente de Zona
        if (nivel === 2) {
            const miZona = zonasNombres[0] || 'Mi Zona';
            const sucursalesDeMiZona = zonasData[miZona] || {};
            return (
                <VistaSubdirector 
                    zona={miZona} 
                    sucursalesData={sucursalesDeMiZona} 
                    rolName={roleName} 
                    canal={canal} 
                    onApproveAgenda={handleApproveAgenda} 
                    onModAgenda={handleModAgenda} 
                />
            );
        }

        // NIVEL 1: Gerente de Sucursal (Por defecto)
        const miZona = zonasNombres[0] || 'Mi Zona';
        const miSucursal = zonasData[miZona] ? Object.keys(zonasData[miZona])[0] : 'Mi Sucursal';
        
        return (
            <VistaGerente 
                agendas={agendas} 
                sucursal={miSucursal} 
                zona={miZona} 
                rolName={roleName} 
                canal={canal} 
                onApproveAgenda={handleApproveAgenda} 
                onModAgenda={handleModAgenda} 
            />
        );
    };

    return (
        <WRAP>
            {renderVistaJerarquica()}
        </WRAP>
    );
};

export default PlaneacionJefe;