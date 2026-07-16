import React, { useState, useEffect, useRef } from 'react';
import { useRole } from '../../context/RoleContext';
import api from '../../api/axiosConfig'; 
import {
    CheckCircle2, Clock, AlertTriangle, ChevronRight, ChevronDown, ChevronUp,
    User, Building2, MapPin, FileText, X, Send, RotateCcw,
    Users, TrendingUp, Briefcase, Eye, ArrowLeft, Shield, Layers, Loader2
} from 'lucide-react';
import UIModal from '../../components/UIModal'; 

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

const formatTime = (timeRaw) => {
    if (timeRaw == null) return 'S/N';
    const timeStr = String(timeRaw); 
    
    if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }

    const clean = timeStr.replace(/\D/g, '');
    if (clean.length >= 4) return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
    if (clean.length === 3) return `0${clean.slice(0, 1)}:${clean.slice(1, 3)}`; 
    
    return timeStr;
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

const agruparParaCobranza = (agendas) => {
    const ejecutivosMap = new Map();
    const coordinadoresMap = new Map();

    agendas.forEach(ag => {
        const op = ag.operativo || {};
        const ejId = op.ejecutivoId ?? ag.ejecutivoId;
        if (ejId == null) return;

        const coordId = op.coordinadorId ?? ag.coordinadorId ?? -1;
        const coordNombre = op.coordinadorNombre
            ?? ag.coordinadorNombre
            ?? (coordId === -1 ? 'MI COORDINACIÓN' : `COORD. #${coordId}`);
            
        if (!coordinadoresMap.has(coordId)) {
            coordinadoresMap.set(coordId, { id: coordId, nombre: String(coordNombre).toUpperCase() });
        }

        if (!ejecutivosMap.has(ejId)) {
            ejecutivosMap.set(ejId, {
                id: ejId,
                nombre: String(op.ejecutivoNombre ?? ag.ejecutivoNombre ?? `EJECUTIVO #${ejId}`).toUpperCase(),
                sucursalesRef: new Set(),
                coordinadorId: coordId
            });
        }
        const ej = ejecutivosMap.get(ejId);
        if (ag.sucursal) ej.sucursalesRef.add(String(ag.sucursal).toUpperCase());
    });

    const ejecutivos = Array.from(ejecutivosMap.values()).map(e => ({
        ...e,
        sucursalesRef: Array.from(e.sucursalesRef)
    }));
    const coordinadores = Array.from(coordinadoresMap.values());

    return { coordinadores, ejecutivos, allAgendas: agendas };
};

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
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black border border-amber-200 uppercase tracking-widest">
                {counts.pendiente} PEND.
            </span>
        )}
        {counts.aprobada > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-200 uppercase tracking-widest">
                {counts.aprobada} AUT.
            </span>
        )}
        {counts.requiere_modificacion > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] font-black border border-red-200 uppercase tracking-widest">
                {counts.requiere_modificacion} MOD.
            </span>
        )}
    </div>
);

const WRAP = ({ children, alertModal, setAlertModal }) => (
    <div className="max-w-[1400px] mx-auto pb-20 px-4 md:px-8 pt-6">
        {children}
        <UIModal
            isOpen={alertModal.isOpen}
            onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            title={alertModal.title?.toUpperCase()}
            message={alertModal.message?.toUpperCase()}
            type={alertModal.type}
        />
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
                        <h3 className="text-lg font-black text-primary uppercase tracking-tight">SOLICITAR MODIFICACIÓN</h3>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">{String(operativo).toUpperCase()}</p>
                    </div>
                    <button onClick={onCancel} disabled={enviando} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={16} className="text-slate-400" />
                    </button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={12} /> CAMPO OBLIGATORIO
                    </p>
                    <p className="text-[11px] text-amber-600 mt-1 uppercase font-bold tracking-wide">Debes especificar el motivo de la modificación para continuar.</p>
                </div>
                <label className="text-[9px] font-black text-accent uppercase tracking-widest mb-2 block">
                    MOTIVO / INSTRUCCIONES PARA EL OPERATIVO
                </label>
                <textarea
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    disabled={enviando}
                    rows={4}
                    className="w-full border border-slate-200 rounded-2xl p-4 text-[12px] text-primary font-bold uppercase resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="EJ: CORREGIR LA DIRECCIÓN DEL CLIENTE #3..."
                />
                <div className="flex gap-3 mt-6">
                    <button onClick={onCancel} disabled={enviando} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-[11px] font-black uppercase tracking-widest text-accent hover:bg-slate-50 transition-all">
                        CANCELAR
                    </button>
                    <button disabled={!nota.trim() || enviando} onClick={handleSubmit} className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${nota.trim() ? 'bg-red-500 hover:bg-red-600 shadow-lg' : 'bg-slate-300 cursor-not-allowed'}`}>
                        {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 
                        {enviando ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
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
        'Visita No Planeada': { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700' },
        'Imprevisto': { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700' }
    };
    
    const c = SEGMENT_COLORS[title] || { bg: 'bg-slate-500', light: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' };

    return (
        <div className={`rounded-2xl border ${c.border} overflow-hidden mb-3`}>
            <button
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between px-5 py-3 ${c.light} hover:opacity-90 transition-all`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-5 ${c.bg} rounded-full`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${c.text}`}>{String(title).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded-full ${c.bg} text-white text-[9px] font-black`}>{visits.length}</span>
                </div>
                {open ? <ChevronDown size={14} className={c.text} /> : <ChevronRight size={14} className={c.text} />}
            </button>
            {open && (
                <div className="divide-y divide-slate-100">
                    {visits.map((v, idx) => {
                        let displayName = v.name;
                        if (!displayName || String(displayName).toUpperCase() === 'NULL') {
                            const match = String(v.managementResult || '').match(/IMPREVISTO:\s*(.*?)(?:\s*\||$)/i);
                            displayName = match ? match[1].trim() : 'CLIENTE NO IDENTIFICADO';
                        }

                        return (
                            <div key={v.id} className="px-5 py-3 bg-white hover:bg-slate-50/50 grid grid-cols-12 gap-3 items-start text-[10px]">
                                <div className="col-span-1 font-mono-tech text-slate-400 pt-1">{idx + 1}</div>
                                <div className="col-span-2">
                                    <span className={`font-black uppercase px-2 py-1 rounded-lg ${c.light} ${c.text}`}>{v.time || 'IMPREVISTO'}</span>
                                </div>
                                <div className="col-span-4">
                                    <p className="font-black text-primary uppercase text-[11px] leading-tight">{String(displayName).toUpperCase()}</p>
                                    {v.classification && <p className="text-slate-400 font-bold uppercase mt-0.5">{v.classification}</p>}
                                    {v.idCredito && <p className="text-slate-400 font-bold font-mono-tech mt-0.5">#{v.idCredito}</p>}
                                </div>
                                <div className="col-span-5 space-y-1">
                                    {v.activity && <p className="text-slate-600 font-medium uppercase">{v.activity}</p>}
                                    {v.product && <p className="text-slate-500 font-bold uppercase">{v.product}</p>}
                                    {v.estimatedAmount && <p className="text-primary font-bold uppercase">{formatCurrency(v.estimatedAmount)}</p>}
                                    {v.moraActual != null && (
                                        <div className="flex gap-2 flex-wrap">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${String(v.categoriaGestion).toUpperCase() === 'VENCIDO' ? 'bg-red-100 text-red-700' : String(v.categoriaGestion).toUpperCase() === 'VIGENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {v.categoriaGestion || 'PREVENTIVO'}
                                            </span>
                                            <span className="text-slate-400 font-bold uppercase">{v.moraActual} DÍAS MORA | {formatCurrency(v.saldoActual)}</span>
                                        </div>
                                    )}
                                    {v.typeManagement && <p className="text-slate-500 font-bold uppercase">{v.typeManagement}</p>}
                                    {v.managementResult && (
                                        <p className="text-slate-600 font-bold bg-slate-100 border border-slate-200 p-1.5 rounded mt-1 inline-block uppercase">
                                            {String(v.managementResult).split(' | ')[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// DESGLOSE DETALLADO CON MOTOR "DIFF" (HISTORIAL DE CAMBIOS)
// ─────────────────────────────────────────────────────────────────────────────
const DesgloseAgendaJefe = ({ agenda }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [snapshot, setSnapshot] = useState(null);

    const isCobranza = String(agenda.operativo?.equipo || '').toUpperCase() === 'COBRANZA';

    useEffect(() => {
        const savedSnapshot = localStorage.getItem(`diff_snapshot_${agenda.id}`);
        if (savedSnapshot) {
            try { setSnapshot(JSON.parse(savedSnapshot)); } catch (e) { }
        }
    }, [agenda.id]);

    const totalVisitas = Object.values(agenda.segments || {}).flat().length;
    if (totalVisitas === 0) return null;

    const getDiff = (segmentName, visitName, fieldKey, currentValue) => {
        if (!snapshot) return { changed: false }; 
        const oldVisit = snapshot[segmentName]?.find(v => v.name === visitName);
        if (!oldVisit) return { changed: true, isNew: true }; 
        
        const oldVal = String(oldVisit[fieldKey] ?? '').trim();
        const newVal = String(currentValue ?? '').trim();

        if (oldVal !== newVal && newVal !== 'null') {
            return { changed: true, oldValue: oldVisit[fieldKey] }; 
        }
        return { changed: false };
    };

    const FieldVal = ({ segmentName, visitName, fieldKey, val, isCurrency = false, defaultText = 'S/N' }) => {
        const diff = getDiff(segmentName, visitName, fieldKey, val);
        const displayVal = val === null || val === undefined || val === '' || String(val).toUpperCase() === 'NULL' ? defaultText : (isCurrency ? formatCurrency(val) : val);
        const displayOld = diff.oldValue === null || diff.oldValue === undefined || diff.oldValue === '' || String(diff.oldValue).toUpperCase() === 'NULL' ? defaultText : (isCurrency ? formatCurrency(diff.oldValue) : diff.oldValue);

        if (diff.changed && !diff.isNew) {
            return (
                <div className="flex flex-col">
                    <span className="text-[9px] line-through text-red-400 font-medium uppercase">{String(displayOld)}</span>
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 uppercase">{String(displayVal)}</span>
                </div>
            );
        }
        if (diff.isNew) return <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase">{String(displayVal)}</span>;
        return <span className="uppercase">{String(displayVal)}</span>;
    };

    const ManagementResultField = ({ segmentName, visitName, resultString }) => {
        const diff = getDiff(segmentName, visitName, 'managementResult', resultString);
        
        const parseResult = (res) => {
            if (!res || res === 'null') return [];
            const parts = String(res).split('|').map(s => s.trim()).filter(Boolean);
            return [...new Set(parts)];
        };

        const renderTags = (tags, isOld = false) => (
            <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((tag, tIdx) => {
                    let bgColor = isOld ? "bg-red-50 border-red-200 text-red-500 line-through opacity-60" : "bg-white border-slate-200 text-slate-700 shadow-sm";
                    
                    if (!isOld) {
                        const tagUpper = String(tag).toUpperCase();
                        if (tagUpper.startsWith('GPS')) bgColor = "bg-blue-50 border-blue-200 text-blue-700 shadow-sm";
                        else if (tagUpper.startsWith('NOTA')) bgColor = "bg-amber-50 border-amber-200 text-amber-700 shadow-sm";
                        else if (tagUpper.startsWith('RES:') || tagUpper.startsWith('IMPREVISTO')) bgColor = "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm";
                    }
                    return (
                        <span key={tIdx} className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border uppercase ${bgColor}`}>
                            {tag}
                        </span>
                    );
                })}
            </div>
        );

        const currentTags = parseResult(resultString);
        const oldTags = parseResult(diff.oldValue);

        return (
            <div className="flex flex-col w-full bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">RESULTADO DE LA VISITA</span>
                {diff.changed && !diff.isNew ? (
                    <div className="flex flex-col gap-2">
                        {oldTags.length > 0 && renderTags(oldTags, true)}
                        <div className="flex items-start gap-2">
                            <span className="text-amber-400 mt-1.5 font-bold">➔</span>
                            {currentTags.length > 0 ? renderTags(currentTags) : <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase">ELIMINADO</span>}
                        </div>
                    </div>
                ) : (
                    currentTags.length > 0 ? renderTags(currentTags) : <span className="input-cell w-full text-[10px] font-bold text-slate-400 h-[42px] flex items-center px-4 uppercase">SIN RESULTADO CAPTURADO</span>
                )}
            </div>
        );
    };

    const renderSegmentDetails = (segmentName, v) => {
        let vName = v.name;
        if (!vName || String(vName).toUpperCase() === 'NULL') {
            const match = String(v.managementResult || '').match(/IMPREVISTO:\s*(.*?)(?:\s*\||$)/i);
            vName = match ? match[1].trim() : 'CLIENTE NO IDENTIFICADO';
        }
        
        switch (segmentName) {
            case 'Promoción':
                if (isCobranza) return null;
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4 lg:mt-2 lg:ml-14">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">PRODUCTO</label>
                            <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase">
                                <FieldVal val={v.product} segmentName={segmentName} visitName={vName} fieldKey="product" />
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">DIRECCIÓN (CIUDAD / COL / CALLE)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="input-cell w-full sm:w-1/3 text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.city} segmentName={segmentName} visitName={vName} fieldKey="city" defaultText="CIUDAD" /></div>
                                <div className="input-cell w-full sm:w-1/3 text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.colony} segmentName={segmentName} visitName={vName} fieldKey="colony" defaultText="COLONIA" /></div>
                                <div className="input-cell w-full sm:w-1/3 text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.streets} segmentName={segmentName} visitName={vName} fieldKey="streets" defaultText="CALLES" /></div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">TELÉFONOS</label>
                            <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase">
                                <FieldVal val={Array.isArray(v.phones) ? v.phones.filter(p=>p).join(' / ') : (typeof v.phones === 'string' ? JSON.parse(v.phones).filter(p=>p).join(' / ') : 'S/N')} segmentName={segmentName} visitName={vName} fieldKey="phones" />
                            </div>
                        </div>
                    </div>
                );
            case 'Evaluación e Integración':
                return (
                    <div className="space-y-4 mt-4 lg:mt-2 lg:ml-14">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">INTEGRACIÓN</label>
                                <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.typeIntegration} segmentName={segmentName} visitName={vName} fieldKey="typeIntegration" /></div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">MONTO ESTIMADO</label>
                                <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.estimatedAmount} isCurrency={true} segmentName={segmentName} visitName={vName} fieldKey="estimatedAmount" defaultText="$ 0.00" /></div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">TASA ANUAL</label>
                                <div className="relative input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase">
                                    <FieldVal val={v.annualRate} segmentName={segmentName} visitName={vName} fieldKey="annualRate" defaultText="0.00" /> <span className="ml-1 text-slate-400">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">SUBPRODUCTO</label>
                                <div className={`input-cell w-full text-[10px] font-black uppercase h-[42px] flex items-center px-4 ${isCobranza ? 'bg-slate-50 text-slate-400 shadow-inner' : 'text-primary'}`}>
                                    <FieldVal val={isCobranza ? 'NINGUNO' : v.subProduct} segmentName={segmentName} visitName={vName} fieldKey="subProduct" defaultText="NINGUNO" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">PROGRAMA</label>
                                <div className={`input-cell w-full text-[10px] font-black uppercase h-[42px] flex items-center px-4 ${isCobranza ? 'bg-slate-50 text-slate-400 shadow-inner' : 'text-primary'}`}>
                                    <FieldVal val={isCobranza ? 'NINGUNO' : v.program} segmentName={segmentName} visitName={vName} fieldKey="program" defaultText="NINGUNO" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">DIRECCIÓN (CIUDAD / COL / CALLE)</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="input-cell w-full sm:w-1/3 text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.city} segmentName={segmentName} visitName={vName} fieldKey="city" defaultText="CIUDAD" /></div>
                                    <div className="input-cell w-full sm:w-1/3 text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.colony} segmentName={segmentName} visitName={vName} fieldKey="colony" defaultText="COLONIA" /></div>
                                    <div className="input-cell w-full sm:w-1/3 text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.streets} segmentName={segmentName} visitName={vName} fieldKey="streets" defaultText="CALLES" /></div>
                                </div>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">ESTATUS CARTERA (SISTEMA)</label>
                                <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase">
                                    <FieldVal val={isCobranza ? v.ultimoEstatus : v.portfolioStatus} segmentName={segmentName} visitName={vName} fieldKey={isCobranza ? "ultimoEstatus" : "portfolioStatus"} defaultText="AUTOMÁTICO" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Seguimiento de Cartera': 
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4 lg:mt-2 lg:ml-14 shadow-sm">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">ID CRÉDITO</label>
                            <div className="input-cell w-full font-mono-tech flex items-center px-4 h-[42px] bg-white border-slate-100 text-primary uppercase">
                                <FieldVal val={v.idCredito} segmentName={segmentName} visitName={vName} fieldKey="idCredito" defaultText="S/N" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">ESTATUS CARTERA</label>
                            <div className={`input-cell w-full text-[10px] font-black uppercase h-[42px] flex items-center px-4 ${isCobranza ? 'text-primary' : 'bg-white text-primary'}`}>
                                <FieldVal val={v.ultimoEstatus} segmentName={segmentName} visitName={vName} fieldKey="ultimoEstatus" defaultText="S/N" />
                            </div>
                        </div>
                        
                        <div className="col-span-1 sm:col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-1 block pl-1">DÍAS DE MORA (INICIO / ACTUAL)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 relative input-cell h-[42px] flex items-center px-3 text-[10px] font-bold text-accent uppercase">
                                    <span className="text-[9px] font-black text-slate-400 uppercase pointer-events-none mr-2">INICIO</span>
                                    <FieldVal val={v.moraInicioMes} segmentName={segmentName} visitName={vName} fieldKey="moraInicioMes" defaultText="0" />
                                </div>
                                <div className="flex-1 relative input-cell h-[42px] flex items-center px-3 text-[10px] font-bold text-red-500 border-rose-100 bg-rose-50/30 uppercase">
                                    <span className="text-[9px] font-black text-rose-400 uppercase pointer-events-none mr-2">ACTUAL</span>
                                    <FieldVal val={v.moraActual} segmentName={segmentName} visitName={vName} fieldKey="moraActual" defaultText="0" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">FECHAS (ÚLTIMO PAGO / VENC.)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-bold flex flex-col justify-center items-center uppercase"><span className="text-[7px] text-slate-400">PAGO</span><FieldVal val={v.ultimaFechaPago} segmentName={segmentName} visitName={vName} fieldKey="ultimaFechaPago" defaultText="-" /></div>
                                <div className="flex-1 bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-bold flex flex-col justify-center items-center uppercase"><span className="text-[7px] text-slate-400">VENC.</span><FieldVal val={v.fechaVencimiento} segmentName={segmentName} visitName={vName} fieldKey="fechaVencimiento" defaultText="-" /></div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">SALDOS (INICIO / ACTUAL)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold uppercase">IN: <FieldVal val={v.saldoInicioMes} isCurrency={true} segmentName={segmentName} visitName={vName} fieldKey="saldoInicioMes" /></div>
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-accent uppercase">ACT: <FieldVal val={v.saldoActual} isCurrency={true} segmentName={segmentName} visitName={vName} fieldKey="saldoActual" /></div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">BUCKET DE MORA</label>
                            <div className="bg-slate-50 w-full p-2.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase text-slate-500 h-[42px] flex items-center px-4 shadow-inner cursor-not-allowed">
                                <FieldVal val={v.categoriaGestion} segmentName={segmentName} visitName={vName} fieldKey="categoriaGestion" defaultText="S/N" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">MONTO AMORT.</label>
                            <div className="bg-white w-full p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold h-[42px] flex items-center px-4 uppercase"><FieldVal val={v.montoAmortizacion} isCurrency={true} segmentName={segmentName} visitName={vName} fieldKey="montoAmortizacion" /></div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">MONTO P/CORRIENTE</label>
                            <div className="bg-white w-full p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-red-600 h-[42px] flex items-center px-4 uppercase"><FieldVal val={v.montoRequeridoCorriente} isCurrency={true} segmentName={segmentName} visitName={vName} fieldKey="montoRequeridoCorriente" /></div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">HERRAMIENTA APLICADA (HISTÓRICO)</label>
                            <div className="bg-slate-50 w-full p-2.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase text-slate-400 h-[42px] flex items-center px-4 shadow-inner cursor-not-allowed">
                                <FieldVal val={v.herramientaAplicada} segmentName={segmentName} visitName={vName} fieldKey="herramientaAplicada" defaultText="NINGUNA" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">TIPO DE GESTIÓN (PERSONAL)</label>
                            <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.typeVisitManagement} segmentName={segmentName} visitName={vName} fieldKey="typeVisitManagement" /></div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">HERRAMIENTA PARA APLICAR</label>
                            <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.herramientaAplicar} segmentName={segmentName} visitName={vName} fieldKey="herramientaAplicar" /></div>
                        </div>
                    </div>
                );
            case 'Gestión de Empresarias':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4 lg:mt-2 lg:ml-14">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">INFORMACIÓN</label>
                            <div className="flex flex-col w-full text-[10px] font-bold text-accent bg-white p-2 rounded-lg border border-slate-50 uppercase">
                                <span>INGRESO: <FieldVal val={v.fechaIngreso} segmentName={segmentName} visitName={vName} fieldKey="fechaIngreso" defaultText="-" /></span>
                                <span>MORA ACTUAL: <FieldVal val={v.moraDays || v.moraActual} segmentName={segmentName} visitName={vName} fieldKey="moraDays" defaultText="0" /></span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">SALDOS</label>
                            <div className="flex flex-col w-full text-[10px] font-bold text-accent bg-white p-2 rounded-lg border border-slate-50 uppercase">
                                <span>OCUP: <FieldVal val={v.saldoOcupado} isCurrency={true} segmentName={segmentName} visitName={vName} fieldKey="saldoOcupado" /></span>
                                <span className="text-emerald-600">DISP: <FieldVal val={v.saldoDisponible} isCurrency={true} segmentName={segmentName} visitName={vName} fieldKey="saldoDisponible" /></span>
                            </div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">TIPO GESTIÓN</label>
                            <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase"><FieldVal val={v.typeManagement} segmentName={segmentName} visitName={vName} fieldKey="typeManagement" /></div>
                        </div>
                    </div>
                );
            case 'Visita No Planeada':
            case 'Imprevisto':
                const hasValue = (val) => val !== null && val !== undefined && val !== '' && String(val).toUpperCase() !== 'NULL';
                
                const fieldsToRender = [
                    { label: "ID CRÉDITO", val: v.idCredito, key: "idCredito" },
                    { label: "ESTATUS CARTERA", val: v.ultimoEstatus, key: "ultimoEstatus" },
                    { label: "DÍAS MORA", val: v.moraDays || v.moraActual, key: "moraDays" },
                    { label: "FECHA INGRESO", val: v.fechaIngreso, key: "fechaIngreso" },
                    { label: "MONTO ESTIMADO", val: v.estimatedAmount, key: "estimatedAmount", isCurrency: true },
                    { label: "SALDO ACTUAL", val: v.saldoActual, key: "saldoActual", isCurrency: true },
                    { label: "MORA INICIO", val: v.moraInicioMes, key: "moraInicioMes" },
                    { label: "MORA ACTUAL", val: v.moraActual, key: "moraActual" },
                    { label: "ÚLTIMO PAGO", val: v.ultimaFechaPago, key: "ultimaFechaPago" },
                    { label: "VENCIMIENTO", val: v.fechaVencimiento, key: "fechaVencimiento" },
                    { label: "SALDO INICIO", val: v.saldoInicioMes, key: "saldoInicioMes", isCurrency: true },
                    { label: "BUCKET DE MORA", val: v.categoriaGestion, key: "categoriaGestion", isBucket: true },
                    { label: "MONTO AMORT.", val: v.montoAmortizacion, key: "montoAmortizacion", isCurrency: true },
                    { label: "REQ. CORRIENTE", val: v.montoRequeridoCorriente, key: "montoRequeridoCorriente", isCurrency: true },
                    { label: "HERR. HISTÓRICA", val: v.herramientaAplicada, key: "herramientaAplicada", isBucket: true },
                    { label: "HERR. A APLICAR", val: v.herramientaAplicar, key: "herramientaAplicar" },
                    { label: "TIPO GESTIÓN", val: v.typeVisitManagement, key: "typeVisitManagement" }
                ].filter(f => hasValue(f.val));

                if (fieldsToRender.length === 0) return null;

                return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 lg:mt-2 lg:ml-14 shadow-sm">
                        {fieldsToRender.map(f => (
                            <div key={f.key}>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">{f.label}</label>
                                <div className={`input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 uppercase ${f.isBucket ? 'bg-slate-50 text-slate-400 shadow-inner' : 'text-primary bg-white'}`}>
                                    <FieldVal val={f.val} segmentName={segmentName} visitName={vName} fieldKey={f.key} isCurrency={f.isCurrency} />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 mb-8">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full px-6 py-5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                        <FileText size={22} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-sm font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                            DESGLOSE DE RUTA 
                            {snapshot && <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-md border border-amber-200 ml-2 uppercase">REVISANDO CAMBIOS</span>}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                            ANÁLISIS DETALLADO DE {totalVisitas} GESTIONES
                        </p>
                    </div>
                </div>
                <div className="bg-white w-8 h-8 flex items-center justify-center rounded-full shadow-sm border border-slate-200 text-slate-400">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>

            {isOpen && (
                <div className="p-6 space-y-8 border-t border-slate-100 bg-slate-50/50">
                    {Object.entries(agenda.segments || {}).map(([segName, visits]) => {
                        if (!visits || visits.length === 0) return null;
                        
                        return (
                            <div key={segName}>
                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                    <div className="w-2 h-4 bg-indigo-500 rounded-full"></div>
                                    {String(segName).toUpperCase()}
                                </h5>
                                <div className="space-y-4 pl-4 border-l-2 border-indigo-100 ml-1">
                                    {visits.map((v, i) => {
                                        let vName = v.name;
                                        if (!vName || String(vName).toUpperCase() === 'NULL') {
                                            const match = String(v.managementResult || '').match(/IMPREVISTO:\s*(.*?)(?:\s*\||$)/i);
                                            vName = match ? match[1].trim() : 'CLIENTE NO IDENTIFICADO';
                                        }

                                        const isNewRow = getDiff(segName, vName, 'name', vName).isNew; 
                                        
                                        return (
                                            <div key={v.id || i} className={`bg-white p-5 rounded-2xl border transition-all relative ${isNewRow && snapshot ? 'border-blue-300 bg-blue-50/30 shadow-md' : 'border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md'}`}>
                                                
                                                {isNewRow && snapshot && (
                                                    <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                                                        NUEVA VISITA
                                                    </div>
                                                )}

                                                <div className="flex flex-col md:flex-row gap-4 mb-4 pb-4 border-b border-slate-100">
                                                    <div className="flex items-center gap-4 min-w-[250px]">
                                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-mono-tech font-black text-indigo-900 text-lg shadow-inner">
                                                            <FieldVal val={v.time} segmentName={segName} visitName={vName} fieldKey="time" defaultText="--:--" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-primary uppercase text-sm leading-tight">{String(vName).toUpperCase()}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">CLASIF: <span className="text-indigo-600 uppercase">{String(v.classification || 'S/N').toUpperCase()}</span></p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 grid grid-cols-1 gap-4">
                                                        <div>
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">ACTIVIDAD / GESTIÓN</label>
                                                            <div className="input-cell w-full text-[10px] font-bold h-[42px] flex items-center px-4 text-primary uppercase">
                                                                <FieldVal val={v.activity || v.typeVisitManagement || v.typeIntegration || v.typeManagement} segmentName={segName} visitName={vName} fieldKey="activity" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {renderSegmentDetails(segName, v)}

                                                {v.statusAction && String(v.statusAction).toUpperCase() !== 'PENDIENTE' && (
                                                    <ManagementResultField segmentName={segName} visitName={vName} resultString={v.managementResult} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AgendaDetalle = ({ agenda, onBack, onApprove, onRequestMod }) => {
    const [modModal, setModModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleMod = async (nota) => {
        localStorage.setItem(`diff_snapshot_${agenda.id}`, JSON.stringify(agenda.segments));
        await onRequestMod(agenda.id, nota);
        setModModal(false);
    };

    const KPI_LABELS = {
        captNueva: 'CAPTACIÓN NUEVA',
        captReinversion: 'CAPTACIÓN REINV.',
        rec0: 'RECUP. 0 DÍAS',
        rec1_7: 'RECUP. 1-7 DÍAS',
        rec8_30: 'RECUP. 8-30 DÍAS',
        rec31_60: 'RECUP. 31-60 DÍAS',
        recMas61: 'RECUP. +61 DÍAS',
        colocInicial: 'COLOCACIÓN INIC.',
        colocRedisposicion: 'COLOC. REDISP.',
        dispersion: 'DISPERSIÓN',
        cobranzaTotalDia: 'COBRANZA TOTAL',
        visitasRealizadas: 'VISITAS REALES',
        promesasDia: 'PROMESAS'
    };

    const baseSegments = ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera', 'Gestión de Empresarias'];
    const extraSegments = Object.keys(agenda.segments || {}).filter(seg => !baseSegments.includes(seg));
    const allSegments = [...baseSegments, ...extraSegments];

    const handleApprove = async () => {
        setIsProcessing(true);
        await onApprove(agenda.id);
        setIsProcessing(false);
    };

    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            {modModal && (
                <ModificacionModal
                    operativo={String(agenda.operativo.nombre).toUpperCase()}
                    onConfirm={handleMod}
                    onCancel={() => setModModal(false)}
                />
            )}

            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-primary">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none">{String(agenda.operativo.nombre).toUpperCase()}</h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">{String(agenda.operativo.puesto).toUpperCase()}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-accent uppercase">{String(agenda.sucursal).toUpperCase()}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{String(agenda.zona).toUpperCase()}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">ID: {agenda.operativo.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={agenda.status} />
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ENVIADA</p>
                        <p className="text-[11px] font-black text-primary uppercase">{formatTime(agenda.horaEnvio)} HRS</p>
                    </div>
                </div>
            </div>

            {(() => {
                const esEquipoCobranza = String(agenda.operativo?.equipo || '').toUpperCase() === 'COBRANZA';

                const cards = [
                    ...(!esEquipoCobranza ? [{ label: 'PROMOCIONES', val: agenda.segments['Promoción']?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50' }] : []),
                    { label: 'EVALUACIONES', val: agenda.segments['Evaluación e Integración']?.length || 0, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'SEGUIMIENTO', val: agenda.segments['Seguimiento de Cartera']?.length || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'IMPREVISTOS', val: agenda.segments['Visita No Planeada']?.length || agenda.segments['Imprevisto']?.length || 0, color: 'text-rose-600', bg: 'bg-rose-50' },
                ];

                return (
                    <div className={`grid ${esEquipoCobranza ? 'grid-cols-3' : 'grid-cols-4'} gap-3 mb-6`}>
                        {cards.map(s => (
                            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                                <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {(agenda.status === 'requiere_modificacion' && agenda.notaJefe) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex gap-3">
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">NOTA ENVIADA AL OPERATIVO</p>
                        <p className="text-[11px] text-red-700 font-medium uppercase">{String(agenda.notaJefe).toUpperCase()}</p>
                    </div>
                </div>
            )}

            {allSegments.map(seg => (
                <SegmentReadOnly key={seg} title={seg} visits={agenda.segments[seg] || []} />
            ))}

            <DesgloseAgendaJefe agenda={agenda} />

            {agenda.status === 'pendiente' && (
                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100 mb-10">
                    <button
                        onClick={() => setModModal(true)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all font-black text-[11px] uppercase tracking-widest disabled:opacity-50"
                    >
                        <AlertTriangle size={16} /> SOLICITAR MODIFICACIÓN
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-200 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                        {isProcessing ? 'AUTORIZANDO...' : 'AUTORIZAR AGENDA'}
                    </button>
                </div>
            )}
            {agenda.status === 'aprobada' && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">AGENDA AUTORIZADA POR TI</p>
                </div>
            )}

            {agenda.kpiCompromisos && Object.keys(agenda.kpiCompromisos).length > 0 && (
                <div className="mb-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                        <h4 className="text-[12px] font-black text-primary uppercase tracking-[0.2em]">COMPROMISOS KPI SOLICITADOS</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(agenda.kpiCompromisos).map(([key, value]) => {
                            const valNum = Number(value);
                            
                            const QUANTITY_KPIS = ['servicioPremiumPendiente', 'visitasRealizadas', 'promesasDia'];
                            const isQuantity = QUANTITY_KPIS.includes(key);
                            
                            const formattedValue = new Intl.NumberFormat('es-MX', { 
                                style: isQuantity ? 'decimal' : 'currency', 
                                currency: isQuantity ? undefined : 'MXN',
                                maximumFractionDigits: isQuantity ? 0 : 2
                            }).format(valNum);
                            
                            return (
                                <div key={key} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:border-blue-200 transition-colors">                                    
                                    <p className="text-md font-black text-primary">{formattedValue}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {String(KPI_LABELS[key] || key).toUpperCase()}
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
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        await onApprove(agenda.id);
        setIsProcessing(false);
    };

    const handleMod = async (nota) => {
        await onRequestMod(agenda.id, nota);
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
                    operativo={String(agenda.operativo.nombre).toUpperCase()}
                    onConfirm={handleMod}
                    onCancel={() => setModModal(false)}
                />
            )}
            <div
                onClick={() => onSelect(agenda.id)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60 transition-all cursor-pointer group p-5"
            >
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <User size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-primary text-[12px] uppercase leading-tight truncate">{String(agenda.operativo.nombre).toUpperCase()}</p>
                            <p className="text-[9px] font-black text-accent uppercase tracking-widest mt-0.5">{String(agenda.operativo.puesto).toUpperCase()}</p>
                            {agenda.operativo.equipo && (
                                <p className="text-[8px] font-bold text-slate-400 uppercase">{String(agenda.operativo.equipo).toUpperCase()}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <StatusBadge status={agenda.status} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">ENVÍO {formatTime(agenda.horaEnvio)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    {segCounts.prom > 0 && <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black uppercase">PROM {segCounts.prom}</span>}
                    {segCounts.eval > 0 && <span className="px-2 py-1 rounded-lg bg-violet-50 text-violet-600 text-[9px] font-black uppercase">E&I {segCounts.eval}</span>}
                    {segCounts.cart > 0 && <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black uppercase">CTRA {segCounts.cart}</span>}
                    {segCounts.emp > 0 && <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase">EMP {segCounts.emp}</span>}
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(agenda.id); }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest group-hover:gap-2.5 transition-all"
                    >
                        <Eye size={13} /> VER DETALLE <ChevronRight size={13} />
                    </button>

                    {agenda.status === 'pendiente' && (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setModModal(true); }}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                                <AlertTriangle size={11} /> MODIFICAR
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} 
                                AUTORIZAR
                            </button>
                        </div>
                    )}
                    {agenda.status === 'aprobada' && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                            <CheckCircle2 size={11} /> AUTORIZADA
                        </span>
                    )}
                    {agenda.status === 'requiere_modificacion' && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase">
                            <AlertTriangle size={11} /> MODIFICACIÓN SOLICITADA
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
            onClick={() => onClick(sucursal)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60 transition-all cursor-pointer p-5 group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="font-black text-primary text-[13px] uppercase tracking-tight">{String(sucursal).toUpperCase()}</p>
                        <p className="text-[9px] font-black text-accent uppercase tracking-widest">{String(zona).toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-500 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">VER DETALLE</span>
                    <ChevronRight size={14} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-primary">{counts.total}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">AGENDAS</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-amber-500">{counts.pendiente}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">PENDIENTES</p>
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
            onClick={() => onClick(zona)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/60 transition-all cursor-pointer p-6 group"
        >
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-200">
                        <Layers size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="font-black text-primary text-[15px] uppercase tracking-tight">{String(zona).toUpperCase()}</p>
                        <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{sucCount} SUCURSALES</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-violet-500 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">EXPLORAR</span>
                    <ChevronRight size={14} />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { label: 'SUCURSALES', val: sucCount, color: 'text-violet-600' },
                    { label: 'AGENDAS', val: counts.total, color: 'text-primary' },
                    { label: 'PENDIENTES', val: counts.pendiente, color: 'text-amber-500' },
                ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {Object.keys(sucursales).map(suc => (
                    <span key={suc} className="px-2 py-0.5 rounded-lg bg-violet-50 text-violet-600 text-[8px] font-black uppercase">{String(suc).toUpperCase()}</span>
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
                    <button onClick={item.onClick} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 whitespace-nowrap transition-colors">{String(item.label).toUpperCase()}</button>
                ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary whitespace-nowrap">{String(item.label).toUpperCase()}</span>
                )}
            </React.Fragment>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KPI HEADER BAR
// ─────────────────────────────────────────────────────────────────────────────
const KpiBar = ({ counts, title, subtitle, icon: Icon }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
            <div>
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight">{String(title).toUpperCase()}</h2>
                {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{String(subtitle).toUpperCase()}</p>}
            </div>
            {Icon && <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center"><Icon size={22} className="text-blue-500" /></div>}
        </div>
        <div className="grid grid-cols-4 gap-3">
            {[
                { label: 'TOTAL AGENDAS', val: counts.total, color: 'text-primary' },
                { label: 'PENDIENTES', val: counts.pendiente, color: 'text-amber-500' },
                { label: 'AUTORIZADAS', val: counts.aprobada, color: 'text-emerald-500' },
                { label: 'CON REQ.', val: counts.requiere_modificacion, color: 'text-red-500' },
            ].map(k => (
                <div key={k.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
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
    const [detalleId, setDetalleId] = useState(null);
    const counts = contarEstados(agendas);

    const detalle = detalleId ? agendas.find(ag => ag.id === detalleId) : null;

    if (detalle) {
        return (
            <AgendaDetalle
                agenda={detalle}
                onBack={() => setDetalleId(null)}
                onApprove={onApproveAgenda}
                onRequestMod={onModAgenda}
            />
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <KpiBar
                counts={counts}
                title={sucursal || 'MI SUCURSAL'}
                subtitle={`${zona || ''} · ${canal === 'cobranza' ? 'COBRANZA' : 'COMERCIAL'} · ${rolName}`}
                icon={canal === 'cobranza' ? Shield : Building2}
            />
            <div className="mb-4">
                <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-3">
                    AGENDAS POR OPERATIVO — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </h3>
                {agendas.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                        <FileText size={36} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">SIN AGENDAS RECIBIDAS HOY</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {agendas.map(ag => (
                            <AgendaCard
                                key={ag.id}
                                agenda={ag}
                                onSelect={setDetalleId}
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
    const [drillSucursalName, setDrillSucursalName] = useState(null);
    const allAgendas = Object.values(sucursalesData).flat();
    const counts = contarEstados(allAgendas);

    const currentSucursalData = drillSucursalName ? sucursalesData[drillSucursalName] : null;

    if (currentSucursalData) {
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: zona, onClick: () => setDrillSucursalName(null) },
                    { label: drillSucursalName },
                ]} />
                <VistaGerente
                    agendas={currentSucursalData}
                    sucursal={drillSucursalName}
                    zona={zona}
                    rolName="VISTA DE SUCURSAL"
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
                subtitle={`${rolName} · ${canal === 'cobranza' ? 'COBRANZA' : 'COMERCIAL'} · ${Object.keys(sucursalesData).length} SUCURSALES`}
                icon={MapPin}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">SUCURSALES DE LA ZONA</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(sucursalesData).map(([suc, agendas]) => (
                    <SucursalCard
                        key={suc}
                        sucursal={suc}
                        zona={zona}
                        agendas={agendas}
                        onClick={(sucursal) => setDrillSucursalName(sucursal)}
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
    const [drillZonaName, setDrillZonaName] = useState(null);
    const allAgendas = Object.values(zonasData).flatMap(suc => Object.values(suc).flat());
    const counts = contarEstados(allAgendas);

    const currentZonaData = drillZonaName ? zonasData[drillZonaName] : null;

    if (currentZonaData) {
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: 'NACIONAL', onClick: () => setDrillZonaName(null) },
                    { label: drillZonaName },
                ]} />
                <VistaSubdirector
                    zona={drillZonaName}
                    sucursalesData={currentZonaData}
                    rolName="VISTA SUBDIRECTOR"
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
                title="VISTA NACIONAL"
                subtitle={`${rolName} · ${canal === 'cobranza' ? 'COBRANZA' : 'COMERCIAL'} · ${Object.keys(zonasData).length} ZONAS`}
                icon={TrendingUp}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">ZONAS ACTIVAS</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(zonasData).map(([zona, sucursales]) => (
                    <ZonaCard
                        key={zona}
                        zona={zona}
                        sucursales={sucursales}
                        onClick={(zona) => setDrillZonaName(zona)}
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
            onClick={() => onClick(ejecutivo.id)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-md hover:shadow-teal-100/60 transition-all cursor-pointer p-5 group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="font-black text-primary text-[12px] uppercase tracking-tight leading-tight">REGIÓN EJ. {String(ejecutivo.nombre).split(' ').slice(0, 2).join(' ')}</p>
                        <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-0.5">EJECUTIVO DE COBRANZA</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{ejecutivo.sucursalesRef?.map(s => String(s).toUpperCase()).join(' · ')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-teal-500 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">VER REGIÓN</span>
                    <ChevronRight size={14} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-primary">{counts.total}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">AGENDAS</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-amber-500">{counts.pendiente}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">PENDIENTES</p>
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
    const [detalleId, setDetalleId] = useState(null);
    const counts = contarEstados(agendas);
    const regionLabel = `REGIÓN EJ. ${String(ejecutivo.nombre).toUpperCase()}`;

    const detalle = detalleId ? agendas.find(ag => ag.id === detalleId) : null;

    if (detalle) {
        return (
            <AgendaDetalle
                agenda={detalle}
                onBack={() => setDetalleId(null)}
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
                subtitle={`COBRANZA · ${String(rolName).toUpperCase()} · ${agendas.length} GESTORES ASIGNADOS`}
                icon={Shield}
            />
            {ejecutivo.sucursalesRef?.length > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SUCURSALES DE REFERENCIA:</span>
                    {ejecutivo.sucursalesRef.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-600 text-[8px] font-black uppercase">{String(s).toUpperCase()}</span>
                    ))}
                </div>
            )}
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-3">
                GESTORES INTERNOS — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
            </h3>
            {agendas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                    <FileText size={36} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">SIN AGENDAS RECIBIDAS HOY</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {agendas.map(ag => (
                        <AgendaCard
                            key={ag.id}
                            agenda={ag}
                            onSelect={setDetalleId}
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
    const [drillEjecutivoId, setDrillEjecutivoId] = useState(null);
    const counts = contarEstados(allAgendas);

    const currentEjecutivo = drillEjecutivoId ? ejecutivos.find(e => e.id === drillEjecutivoId) : null;

    if (currentEjecutivo) {
        const ejAgendas = agendasDeEjecutivo(allAgendas, currentEjecutivo.id);
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: `COORD. ${String(coordinador.nombre).split(' ')[0].toUpperCase()}`, onClick: () => setDrillEjecutivoId(null) },
                    { label: `REGIÓN EJ. ${String(currentEjecutivo.nombre).split(' ').slice(0, 2).join(' ').toUpperCase()}` },
                ]} />
                <VistaEjecutivoCobranza
                    ejecutivo={currentEjecutivo}
                    agendas={ejAgendas}
                    rolName="VISTA DE REGIÓN"
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
                title={`COORD. ${String(coordinador.nombre).toUpperCase()}`}
                subtitle={`COBRANZA · ${String(rolName).toUpperCase()} · ${ejecutivos.length} EJECUTIVOS`}
                icon={Users}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">REGIONES DE EJECUTIVOS</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ejecutivos.map(ej => (
                    <EjecutivoCard
                        key={ej.id}
                        ejecutivo={ej}
                        agendas={agendasDeEjecutivo(allAgendas, ej.id)}
                        onClick={(id) => setDrillEjecutivoId(id)}
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
    const [drillCoordId, setDrillCoordId] = useState(null);
    const counts = contarEstados(allAgendas);

    const currentCoord = drillCoordId ? coordinadores.find(c => c.id === drillCoordId) : null;

    if (currentCoord) {
        const coordEjs = ejecutivos.filter(e => e.coordinadorId === currentCoord.id);
        const coordAgendas = allAgendas.filter(ag => coordEjs.some(e => e.id === ag.ejecutivoId));
        return (
            <div className="animate-in fade-in duration-300">
                <Breadcrumb items={[
                    { label: 'NACIONAL COBRANZA', onClick: () => setDrillCoordId(null) },
                    { label: `COORD. ${String(currentCoord.nombre).split(' ')[0].toUpperCase()}` },
                ]} />
                <VistaCoordCobranza
                    coordinador={currentCoord}
                    ejecutivos={coordEjs}
                    allAgendas={coordAgendas}
                    rolName="VISTA DE COORDINADOR"
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
                title="NACIONAL COBRANZA"
                subtitle={`${String(rolName).toUpperCase()} · ${coordinadores.length} COORDINADORES`}
                icon={TrendingUp}
            />
            <h3 className="text-[11px] font-black text-accent uppercase tracking-widest mb-4">COORDINADORES DE COBRANZA</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {coordinadores.map(coord => {
                    const coordEjs = ejecutivos.filter(e => e.coordinadorId === coord.id);
                    const coordAgendas = allAgendas.filter(ag => coordEjs.some(e => e.id === ag.ejecutivoId));
                    const coordCounts = contarEstados(coordAgendas);
                    return (
                        <div
                            key={coord.id}
                            onClick={() => setDrillCoordId(coord.id)}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/60 transition-all cursor-pointer p-6 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Briefcase size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-black text-primary text-[13px] uppercase tracking-tight">{String(coord.nombre).toUpperCase()}</p>
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">COORDINADOR · {coordEjs.length} EJECUTIVOS</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <span className="text-[10px] font-black uppercase tracking-widest">EXPLORAR</span>
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {[
                                    { label: 'EJECUTIVOS', val: coordEjs.length, color: 'text-indigo-600' },
                                    { label: 'AGENDAS', val: coordCounts.total, color: 'text-primary' },
                                    { label: 'PENDIENTES', val: coordCounts.pendiente, color: 'text-amber-500' },
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
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const canal = selectedRole?.canal?.toLowerCase();
    const roleName = selectedRole?.name;

    const [loading, setLoading] = useState(true);
    const [agendas, setAgendas] = useState([]);

    const counts = contarEstados(agendas);

    const ultimaAlertaRef = useRef(0);
    const estadoPrevioAgendaRef = useRef({});

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setLoading(true); 
        try {
            const d = new Date();
            const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const resAgendas = await api.get(`/agenda/equipo?fecha=${hoy}`);
            const dataAgendas = resAgendas.data?.contenido || [];
            
            const parsedAgendas = dataAgendas.map(ag => {
                let parsedSegments = ag.segments || {};
                if (typeof parsedSegments === 'string') {
                    try { parsedSegments = JSON.parse(parsedSegments); } catch (e) { }
                }
                // Actualizamos el diccionario de estatus previos
                estadoPrevioAgendaRef.current[ag.id] = String(ag.status).toLowerCase();
                
                return { ...ag, segments: parsedSegments };
            });
            setAgendas(parsedAgendas);
        } catch (err) {
            console.error("Error al cargar dashboard de planeación", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (canal) fetchDashboardData();
    }, [canal]);

    useEffect(() => {
        if (!canal) return;

        const API_COBRANZA = import.meta.env.VITE_API_ORIGIN_COBRANZA;
        const wsUrl = `${API_COBRANZA.replace(/^http/, 'ws')}/api/v1/ws/notificaciones`;
        
        let socket = null;
        let timerReconexion = null;
        let isMounted = true;

        const conectarWS = () => {
            if (!isMounted) return;
            try {
                if (socket) socket.close();

                socket = new WebSocket(wsUrl);
                
                socket.onopen = () => {
                    if (isMounted) console.log('[WS Jefe - Planeación] Conectado de forma única.');
                };

                socket.onmessage = (event) => {
                    if (!isMounted) return;
                    const data = JSON.parse(event.data);
                    
                    if (data.type !== 'PING') {
                        const canalPayload = data.payload?.canal?.toLowerCase() || '';
                        const miCanal = canal.toLowerCase();
                        const esMismoCanal = (canalPayload === miCanal) || (canalPayload === ''); 

                        if (esMismoCanal) {
                            const estatusPayload = String(data.payload?.estatus || data.payload?.status || '').toLowerCase().trim();
                            const idPlanPayload = data.payload?.idPlan;
                            const ahora = Date.now();
                            
                            if (ahora - ultimaAlertaRef.current < 2000) {
                                fetchDashboardData(true); 
                                return; 
                            }

                            if (estatusPayload === 'pendiente' && data.type !== 'CHECKIN_UPDATE') {
                                ultimaAlertaRef.current = ahora; 
                                
                                const estatusPrevio = estadoPrevioAgendaRef.current[idPlanPayload];
                                const isCorregida = estatusPrevio === 'requiere_modificacion';
                                
                                setAlertModal({
                                    isOpen: true,
                                    title: isCorregida ? 'AGENDA CORREGIDA' : 'NUEVA AGENDA POR REVISAR',
                                    message: isCorregida 
                                        ? 'UN GESTOR HA APLICADO LOS CAMBIOS SOLICITADOS Y HA VUELTO A CERTIFICAR SU AGENDA.' 
                                        : 'UN GESTOR A TU CARGO HA CERTIFICADO SU AGENDA Y ESPERA TU APROBACIÓN.',
                                    type: 'info'
                                });
                            }
                            
                            fetchDashboardData(true); 
                        }
                    }
                };

                socket.onerror = () => {
                    if (isMounted) console.log("Sincronizando canal WS Planeación..."); 
                };

                socket.onclose = () => {
                    if (isMounted) {
                        clearTimeout(timerReconexion);
                        timerReconexion = setTimeout(() => conectarWS(), 3000);
                    }
                };

            } catch (error) {
                if (isMounted) console.error("Error WS", error);
            }
        };

        conectarWS();

        return () => { 
            isMounted = false;
            clearTimeout(timerReconexion);
            if (socket) {
                socket.onopen = null;
                socket.onmessage = null;
                socket.onerror = null;
                socket.onclose = null;
                
                setTimeout(() => {
                    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                        socket.close(); 
                    }
                }, 50);
            }
        };
    }, [canal]);

    const handleApproveAgenda = async (idPlan) => {
        try {
            const response = await api.put(`/agenda/plan/${idPlan}/estatus`, { 
                estatus: 'aprobada', 
                nota: 'Agenda autorizada por el jefe' 
            });

            if (response.data.codigo === 'OK') {
                setAgendas(prev => prev.map(ag => ag.id === idPlan ? { ...ag, status: 'aprobada' } : ag));
                ultimaAlertaRef.current = Date.now(); 
                setAlertModal({
                    isOpen: true,
                    title: 'AUTORIZACIÓN EXITOSA',
                    message: 'AGENDA AUTORIZADA CON ÉXITO.',
                    type: 'success'
                });
            }
        } catch (error) {
            setAlertModal({
                isOpen: true,
                title: 'ERROR DE AUTORIZACIÓN',
                message: 'NO SE PUDO AUTORIZAR LA AGENDA.',
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
            
            ultimaAlertaRef.current = Date.now(); 

            setAlertModal({
                isOpen: true,
                title: 'MODIFICACIÓN SOLICITADA',
                message: 'SE HA SOLICITADO LA MODIFICACIÓN AL ASESOR.',
                type: 'success'
            });

        } catch (error) {
            setAlertModal({
                isOpen: true,
                title: 'ERROR DE SOLICITUD',
                message: 'NO SE PUDO PROCESAR LA SOLICITUD.',
                type: 'danger'
            });
        }
    };

    if (loading) return <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin text-blue-500" /></div>;

    const renderVistaJerarquica = () => {
        const nivel = selectedRole?.nivel ||
                     (roleName?.toUpperCase().includes('N3') ? 3 :
                      roleName?.toUpperCase().includes('N2') || roleName?.toLowerCase().includes('zona') || roleName?.toLowerCase().includes('subdirector') || roleName?.toLowerCase().includes('coordinador') ? 2 : 1);

        if (canal === 'cobranza') {
            const { coordinadores, ejecutivos, allAgendas } = agruparParaCobranza(agendas);

            if (nivel === 3) {
                return (
                    <VistaSubdirCobranza
                        coordinadores={coordinadores}
                        ejecutivos={ejecutivos}
                        allAgendas={allAgendas}
                        rolName={roleName}
                        onApproveAgenda={handleApproveAgenda}
                        onModAgenda={handleModAgenda}
                    />
                );
            }

            if (nivel === 2) {
                const miCoordinador = coordinadores[0] || { id: selectedRole?.id, nombre: roleName };
                return (
                    <VistaCoordCobranza
                        coordinador={miCoordinador}
                        ejecutivos={ejecutivos}
                        allAgendas={allAgendas}
                        rolName={roleName}
                        onApproveAgenda={handleApproveAgenda}
                        onModAgenda={handleModAgenda}
                    />
                );
            }

            const miEjecutivo = ejecutivos[0] || {
                id: selectedRole?.id,
                nombre: roleName || 'EJECUTIVO',
                sucursalesRef: []
            };
            return (
                <VistaEjecutivoCobranza
                    ejecutivo={miEjecutivo}
                    agendas={allAgendas}
                    rolName={roleName}
                    onApproveAgenda={handleApproveAgenda}
                    onModAgenda={handleModAgenda}
                />
            );
        }

        const zonasData = agruparPorZona(agendas);
        const zonasNombres = Object.keys(zonasData);

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

        if (nivel === 2) {
            const miZona = zonasNombres[0] || 'MI ZONA';
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

        const miZona = zonasNombres[0] || 'MI ZONA';
        const miSucursal = zonasData[miZona] ? Object.keys(zonasData[miZona])[0] : 'MI SUCURSAL';

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
        <WRAP alertModal={alertModal} setAlertModal={setAlertModal}>
            {renderVistaJerarquica()}
        </WRAP>
    );
};

export default PlaneacionJefe;