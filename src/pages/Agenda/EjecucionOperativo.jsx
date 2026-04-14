import React, { useState, useEffect, useRef } from 'react';
import { useRole } from '../../context/RoleContext';
import { useAgenda } from '../../context/AgendaContext';
import {
    MapPin, CheckCircle2, Clock, Camera, Plus, X, AlertCircle,
    Navigation, FileText, Loader2, Calendar, Image, Shield
} from 'lucide-react';

// ── Catálogos ────────────────────────────────────────────────────────────────

/**
 * TODO: Estos catálogos se alimentarán del EP: /api/v1/catalogos/estatus-cartera
 * Consulta:
 * SELECT id_estatus_cartera as id, nombre FROM catalogos.estatus_cartera WHERE activo = true;
 * * Resultado en JSON:
 * [
 * { "id": 1, "nombre": "Abono/ Pago Parcial" },
 * { "id": 2, "nombre": "Compromiso de pago" },
 * { "id": 3, "nombre": "Negativa de pago" }
 * ]
 */
const ESTATUS_CARTERA = [
    'Seleccionar resultado...',
    'Abono/ Pago Parcial', 'Compromiso de pago', 'Negativa de pago',
    'Ilocalizable', 'Promesa de pago', 'Sin contacto', 'Convenio', 'Finado',
];

/**
 * TODO: Estos catálogos se alimentarán del EP: /api/v1/catalogos/sub-estatus
 * Consulta:
 * SELECT id_sub_estatus as id, nombre FROM catalogos.sub_estatus WHERE activo = true;
 */
const SUB_ESTATUS = [
    'N/A', 'Insolvente', 'Solvente', 'No reconoce el crédito',
    'Dice que ya pago', 'Liquidación', 'Normalización', 'Trat Especial',
    'Cliente no estuvo', 'Aviso debajo de la puerta', 'Se cambio domicilio',
    'Convenio vigentes', 'Convenio incumplidos',
];

/**
 * TODO: Estos catálogos se alimentarán del EP: /api/v1/catalogos/tipos-gestion
 * Consulta:
 * SELECT id_tipo_gestion as id, nombre FROM catalogos.tipos_gestion WHERE activo = true;
 */
const TIPO_GESTION_UNPLANNED = [
    'Seleccionar tipo...',
    'Visita integral', 'Visita correctiva', 'Visita preventiva',
    'Visita presencial domicilio', 'Visita presencial aval',
    'Visita presencial Trabajo', 'Gestión telefónica',
    'Gestión envió de sms', 'Gestión telefónica aval',
];

/**
 * TODO: Estos catálogos se alimentarán del EP: /api/v1/catalogos/motivos-no-visita
 * Consulta:
 * SELECT id_motivo as id, descripcion as nombre FROM catalogos.motivos_no_visita WHERE activo = true;
 */
const MOTIVO_NO_VISITA = [
    'Seleccionar motivo...',
    'Cliente no disponible',
    'Dirección incorrecta o no encontrada',
    'Visita reagendada por el cliente',
    'Emergencia de ruta',
    'Condiciones de seguridad',
    'Tiempo insuficiente en ruta',
    'Otro',
];

const SEG_CFG = {
    'Promoción': { label: 'PROMO', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
    'Evaluación e Integración': { label: 'EVAL', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
    'Seguimiento de Cartera': { label: 'CARTERA', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
    'Gestión de Empresarias': { label: 'EMPRES', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    'Imprevisto': { label: 'IMPREV', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700' },
};

const RESULTADO_BADGE = {
    'Abono/ Pago Parcial': 'bg-emerald-100 text-emerald-700',
    'Compromiso de pago': 'bg-blue-100 text-blue-700',
    'Promesa de pago': 'bg-indigo-100 text-indigo-700',
    'Negativa de pago': 'bg-red-100 text-red-700',
    'Ilocalizable': 'bg-orange-100 text-orange-700',
    'Sin contacto': 'bg-slate-100 text-slate-600',
    'Convenio': 'bg-purple-100 text-purple-700',
    'Finado': 'bg-gray-200 text-gray-600',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const ProgressRing = ({ done, total, size = 68 }) => {
    const r = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    const pct = total > 0 ? done / total : 0;
    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={7} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3b82f6" strokeWidth={7}
                    strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
                <span className="text-[16px] font-black text-primary">{done}</span>
                <span className="text-[9px] font-bold text-slate-400">/{total}</span>
            </div>
        </div>
    );
};

const SegBadge = ({ seg }) => {
    const c = SEG_CFG[seg] || SEG_CFG['Imprevisto'];
    return <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${c.badge}`}>{c.label}</span>;
};

const ResultBadge = ({ resultado }) => {
    const cls = RESULTADO_BADGE[resultado] || 'bg-slate-100 text-slate-600';
    return <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${cls}`}>{resultado}</span>;
};

const nowTimeStr = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
};

// ── GPS Hook ─────────────────────────────────────────────────────────────────
const useGPS = (active) => {
    const [state, setState] = useState({ status: 'idle', lat: null, lng: null });
    useEffect(() => {
        if (!active) { setState({ status: 'idle', lat: null, lng: null }); return; }
        setState({ status: 'loading', lat: null, lng: null });
        if (!navigator.geolocation) { setState({ status: 'error', lat: null, lng: null }); return; }
        navigator.geolocation.getCurrentPosition(
            p => setState({ status: 'ok', lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) }),
            () => setState({ status: 'error', lat: null, lng: null }),
            { timeout: 10000, enableHighAccuracy: true }
        );
    }, [active]);
    return state;
};

// ── Blocked Screen ────────────────────────────────────────────────────────────
const BlockedScreen = ({ status }) => {
    const cfg = {
        borrador: { Icon: FileText, bg: 'bg-slate-50', ic: 'text-slate-400', title: 'Agenda no certificada', msg: 'Completa y certifica tu agenda en Planeación para habilitar la ejecución.' },
        pendiente: { Icon: Clock, bg: 'bg-amber-50', ic: 'text-amber-500', title: 'Esperando autorización', msg: 'Tu agenda está en revisión. Tu jefe debe aprobarla antes de que puedas iniciar la ruta.' },
        requiere_modificacion: { Icon: AlertCircle, bg: 'bg-red-50', ic: 'text-red-500', title: 'Requiere modificaciones', msg: 'Tu jefe solicitó ajustes. Revisa la pestaña Planeación, corrige y re-certifica.' },
    };
    const c = cfg[status] || cfg['borrador'];
    return (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-in fade-in duration-500">
            <div className={`w-24 h-24 rounded-full ${c.bg} flex items-center justify-center mb-8`}>
                <c.Icon size={40} className={c.ic} />
            </div>
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight mb-3">{c.title}</h2>
            <p className="text-sm text-accent font-medium leading-relaxed max-w-xs">{c.msg}</p>
        </div>
    );
};

// ── Yes/No Toggle Button ─────────────────────────────────────────────────────
const YesNo = ({ value, onChange }) => (
    <div className="flex gap-2">
        {[{ label: 'SÍ', val: true }, { label: 'NO', val: false }].map(opt => (
            <button key={opt.label} type="button" onClick={() => onChange(opt.val)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${value === opt.val
                        ? opt.val ? 'bg-emerald-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                {opt.label}
            </button>
        ))}
    </div>
);

// ── Check-In Modal ────────────────────────────────────────────────────────────
const CARTERA_SEGS = ['Seguimiento de Cartera', 'Gestión de Empresarias'];

const CheckInModal = ({ visit, onClose, onSubmit }) => {
    const isCarteraSegment = CARTERA_SEGS.includes(visit._segment);

    const [form, setForm] = useState({
        visitaRealizada: null,
        clienteEncontrado: null,
        actividadRealizada: null,
        motivoNoVisita: '',
        motivoNoActividad: '',
        resultado: '',
        subestatus: 'N/A',
        estatusCartera: '',
        pagoMonto: '', pagoFecha: '',
        notes: '', photoUrl: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [startMs] = useState(() => Date.now());
    const [openTime] = useState(nowTimeStr);
    const gps = useGPS(true);
    const fileRef = useRef(null);
    const isCompromiso = form.resultado === 'Compromiso de pago';
    const isPromesa = form.resultado === 'Promesa de pago';
    const needsAmountDate = isCompromiso || isPromesa;
    const visitaNoRealizada = form.visitaRealizada === false;

     // decisionTomada: controls visibility of Notes + Photo sections
    const decisionTomada = visitaNoRealizada
        ? form.motivoNoVisita && form.motivoNoVisita !== 'Seleccionar motivo...'
        : isCarteraSegment
            ? form.clienteEncontrado !== null
            : form.actividadRealizada !== null && (
                form.actividadRealizada === false
                    ? !!form.motivoNoActividad
                    : !!form.resultado
            );

    const canSave = form.visitaRealizada !== null && (
        visitaNoRealizada
            ? form.motivoNoVisita && form.motivoNoVisita !== 'Seleccionar motivo...'
            : isCarteraSegment
                ? form.clienteEncontrado !== null
                && form.resultado && form.resultado !== 'Seleccionar resultado...'
                && (!needsAmountDate || (form.pagoMonto && form.pagoFecha))
                : form.actividadRealizada !== null && (
                    form.actividadRealizada === false
                        ? !!form.motivoNoActividad
                        : !!form.resultado
                )
    );

    const handlePhoto = e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = ev => { setPhotoPreview(ev.target.result); setForm(p => ({ ...p, photoUrl: ev.target.result })); };
        r.readAsDataURL(f);
    };

    const submit = () => {
        if (!canSave) return;
        const durationMin = Math.round((Date.now() - startMs) / 60000);
        const resultadoFinal = visitaNoRealizada
            ? 'No realizada'
            : isCarteraSegment
                ? form.resultado
                : form.actividadRealizada ? 'Actividad realizada' : 'Actividad no realizada';
        
        /**
         * TODO: EP Lógico para registrar el check-in (Gestión / Ejecución en ruta).
         * EP Sugerido: POST /api/v1/gestiones/ejecucion
         */
        onSubmit({
            ...form,
            resultado: resultadoFinal,
            tipoGestion: visit.typeVisitManagement || visit.typeManagement || '—',
            checkInTime: nowTimeStr(),
            visitaOpenTime: openTime,
            visitaDuration: durationMin,
            lat: gps.lat, lng: gps.lng, gpsStatus: gps.status
        });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[28px] shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
                 {/* Header */}
                <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between z-10">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registrar Gestión</p>
                        <h3 className="text-[15px] font-black text-primary uppercase leading-tight mt-0.5">{visit.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <SegBadge seg={visit._segment} />
                            {(visit.typeVisitManagement || visit.typeManagement) && (
                                <span className="text-[9px] text-slate-400 font-semibold">{visit.typeVisitManagement || visit.typeManagement}</span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors mt-1">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                               <div className="px-6 py-5 space-y-5">
                    {/* GPS */}
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest
                        ${gps.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : gps.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {gps.status === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                        {gps.status === 'loading' && 'Capturando coordenadas GPS...'}
                        {gps.status === 'ok' && `GPS: ${gps.lat}, ${gps.lng}`}
                        {gps.status === 'error' && 'Ubicación no disponible'}
                        {gps.status === 'idle' && 'Inicializando...'}
                    </div>

                    {/* 1. ¿Se realizó la visita? */}
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1">¿Se realizó la visita?</label>
                        <YesNo value={form.visitaRealizada} onChange={v => setForm(p => ({ ...p, visitaRealizada: v, clienteEncontrado: null, actividadRealizada: null, motivoNoVisita: '' }))} />
                    </div>

                    {/* Rama NO: Motivo de no-visita */}
                    {visitaNoRealizada && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿Por qué no se realizó?</p>
                            <select value={form.motivoNoVisita}
                                onChange={e => setForm(p => ({ ...p, motivoNoVisita: e.target.value }))}
                                className="input-cell">
                                {MOTIVO_NO_VISITA.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Rama SÍ - CARTERA: ¿Se encontró al cliente? */}
                    {!visitaNoRealizada && isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1">¿Se encontró al cliente?</label>
                            <YesNo value={form.clienteEncontrado} onChange={v => setForm(p => ({ ...p, clienteEncontrado: v }))} />
                        </div>
                    )}

                    {/* Rama SÍ - CARTERA: Actualizar Estatus */}
                    {!visitaNoRealizada && isCarteraSegment && form.clienteEncontrado !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Actualizar Estatus de Cartera *</label>
                            <select value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell">
                                {ESTATUS_CARTERA.map(e => <option key={e}>{e}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Rama SÍ - PROMO/EVAL: ¿Se realizó la actividad planeada? */}
                    {!visitaNoRealizada && !isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200 bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-violet-500 uppercase tracking-widest mb-1">Actividad Planeada</p>
                            <p className="text-[11px] font-black text-primary">{visit.activity || visit.typeVisitManagement || '—'}</p>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">¿Se realizó la actividad?</label>
                            <YesNo value={form.actividadRealizada} onChange={v => setForm(p => ({ ...p, actividadRealizada: v, motivoNoActividad: '' }))} />
                        </div>
                    )}

                    {/* Rama NO actividad — ¿por qué no? */}
                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === false && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿Por qué no se realizó la actividad?</p>
                            {/**
                             * TODO: EP: /api/v1/catalogos/motivos-no-actividad
                             */}
                            <select value={form.motivoNoActividad || ''}
                                onChange={e => setForm(p => ({ ...p, motivoNoActividad: e.target.value }))}
                                className="input-cell">
                                <option value="">Seleccionar motivo...</option>
                                <option>Cliente no disponible</option>
                                <option>Actividad reagendada por el cliente</option>
                                <option>Tiempo insuficiente</option>
                                <option>Documentación incompleta</option>
                                <option>Decisión del cliente posponida</option>
                                <option>Pendiente de autorización interna</option>
                                <option>Otro</option>
                            </select>
                        </div>
                    )}

                     {/* Rama SÍ actividad PROMO/EVAL — resultado de la gestión */}
                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === true && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Resultado de la Gestión</label>
                            {/**
                             * TODO: EP: /api/v1/catalogos/resultados-gestion
                             */}
                            <select value={form.resultado}
                                onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))}
                                className="input-cell">
                                <option value="">Seleccionar resultado...</option>
                                <option>Solicitud pre-llenada entregada</option>
                                <option>Solicitud completa entregada</option>
                                <option>Prospecto interesado — seguimiento</option>
                                <option>Cita agendada</option>
                                <option>Evaluación completada</option>
                                <option>VoBo de supervisor obtenido</option>
                                <option>Cliente no interesado</option>
                                <option>Otro</option>
                            </select>
                        </div>
                    )}

                    {/* Sub-estatus — solo Cartera, solo si visitaRealizada */}
                    {!visitaNoRealizada && isCarteraSegment && form.resultado && form.resultado !== 'Seleccionar resultado...' && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Sub-estatus</label>
                            <select value={form.subestatus} onChange={e => setForm(p => ({ ...p, subestatus: e.target.value }))} className="input-cell">
                                {SUB_ESTATUS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    
                    {/* Promesa / Compromiso de pago: monto + fecha */}
                    {needsAmountDate && (
                        <div className={`animate-in slide-in-from-top-2 duration-300 p-4 rounded-2xl border space-y-3 ${isCompromiso ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'
                            }`}>
                            <div className="flex items-start gap-2">
                                <div className="flex-1">
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCompromiso ? 'text-blue-700' : 'text-indigo-700'
                                        }`}>
                                        {isCompromiso ? 'Datos del Compromiso de Pago *' : 'Datos de la Promesa de Pago *'}
                                    </p>
                                    {isCompromiso && (
                                        <p className="text-[9px] text-blue-600 mt-0.5">
                                            ★ Se agendará automáticamente una visita de seguimiento para esa fecha.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">¿Cuánto? *</label>
                                    <input type="text" inputMode="numeric" placeholder="$ 0.00"
                                        value={form.pagoMonto}
                                        onChange={e => setForm(p => ({ ...p, pagoMonto: e.target.value.replace(/\D/g, '') }))}
                                        className="input-cell font-bold" />
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">¿Para cuándo? *</label>
                                    <input type="date" value={form.pagoFecha}
                                        onChange={e => setForm(p => ({ ...p, pagoFecha: e.target.value }))}
                                        className="input-cell" />
                                </div>
                            </div>
                        </div>
                    )} 

                    {/* Notas — siempre que haya una decisión tomada */}
                    {decisionTomada && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Notas</label>
                            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Observaciones de la visita..." rows={3} className="input-cell resize-none" />
                        </div>
                    )}

                    {/* Foto — siempre que haya una decisión tomada */}
                    {decisionTomada && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Evidencia Fotográfica</label>
                            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                            {photoPreview ? (
                                <div className="relative">
                                    <img src={photoPreview} alt="Evidencia" className="w-full h-32 object-cover rounded-xl border border-slate-100" />
                                    <button onClick={() => { setPhotoPreview(null); setForm(p => ({ ...p, photoUrl: null })); }}
                                        className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow text-red-500"><X size={13} /></button>
                                </div>
                            ) : (
                                <button onClick={() => fileRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 py-5 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest">
                                    <Camera size={16} /> Adjuntar Foto
                                </button>
                            )}
                        </div>
                    )}
                    {/* Estatus de Cartera — siempre al final de toda gestión */}
                    {decisionTomada && (
                        <div className="animate-in fade-in duration-200 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Estatus de Cartera</p>
                            <select
                                value={form.estatusCartera}
                                onChange={e => setForm(p => ({ ...p, estatusCartera: e.target.value }))}
                                className="input-cell">
                                <option value="">Seleccionar estatus...</option>
                                {ESTATUS_CARTERA.filter(e => e !== 'Seleccionar resultado...').map(e => (
                                    <option key={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                 {/* Footer */}
                <div className="sticky bottom-0 bg-white px-6 pb-6 pt-4 border-t border-slate-50">
                    <button onClick={submit} disabled={!canSave}
                        className={`w-full py-5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all
                            ${canSave ? 'bg-primary text-white shadow-xl hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                        Registrar Gestión
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Unplanned Visit Form ──────────────────────────────────────────────────────
const UnplannedForm = ({ onAdd, onCancel }) => {
    const [form, setForm] = useState({ name: '', tipoGestion: '', resultado: '', notes: '', pagoMonto: '', pagoFecha: '' });
    const isCompromiso = form.resultado === 'Compromiso de pago';
    const isPromesa = form.resultado === 'Promesa de pago';
    const needsAmountDate = isCompromiso || isPromesa;
    const ok = form.name
        && form.tipoGestion && form.tipoGestion !== 'Seleccionar tipo...'
        && form.resultado && form.resultado !== 'Seleccionar resultado...'
        && (!needsAmountDate || (form.pagoMonto && form.pagoFecha));    
    const submit = () => {
        if (!ok) return;
        
        /**
         * TODO: EP Lógico para registrar el check-in (Gestión No Planeada).
         * EP Sugerido: POST /api/v1/gestiones/ejecucion/no-planeada
         */
        onAdd({
            name: form.name.toUpperCase(), _segment: 'Imprevisto',
            checkInTime: nowTimeStr(), tipoGestion: form.tipoGestion,
            resultado: form.resultado, notes: form.notes,
            pagoMonto: form.pagoMonto, pagoFecha: form.pagoFecha
        });
    };
    return (
        <div className="mt-6 border-2 border-dashed border-rose-200 rounded-3xl p-6 bg-rose-50/30 animate-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Visita No Planeada</h4>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
            </div>
            <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del cliente…" className="input-cell uppercase font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tipo Gestión *</label>
                    <select value={form.tipoGestion} onChange={e => setForm(p => ({ ...p, tipoGestion: e.target.value }))} className="input-cell text-[10px]">
                        {TIPO_GESTION_UNPLANNED.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Resultado *</label>
                    <select value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell text-[10px]">
                        {ESTATUS_CARTERA.map(e => <option key={e}>{e}</option>)}
                    </select>
                </div>
            </div>
            {/* Compromiso / Promesa: monto + fecha */}
            {needsAmountDate && (
                <div className={`p-3 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${isCompromiso ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'
                    }`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCompromiso ? 'text-blue-700' : 'text-indigo-700'
                        }`}>
                        {isCompromiso ? 'Datos del Compromiso de Pago *' : 'Datos de la Promesa de Pago *'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Monto *</label>
                            <input type="text" inputMode="numeric" placeholder="$ 0.00"
                                value={form.pagoMonto}
                                onChange={e => setForm(p => ({ ...p, pagoMonto: e.target.value.replace(/\D/g, '') }))}
                                className="input-cell font-bold" />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fecha *</label>
                            <input type="date" value={form.pagoFecha}
                                onChange={e => setForm(p => ({ ...p, pagoFecha: e.target.value }))}
                                className="input-cell" />
                        </div>
                    </div>
                </div>
            )}
            <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Notas</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones…" className="input-cell" />
            </div>
             <button onClick={submit} disabled={!ok}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${ok ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                Registrar Imprevisto
            </button>
        </div>
    );
};

// ── Visit Card ───────────────────────────────────────────────────────────────
const VisitCard = ({ visit, checkIn, onCheckIn }) => {
    const segCfg = SEG_CFG[visit._segment] || SEG_CFG['Imprevisto'];
    const isDone = !!checkIn;

    return (
        <div className={`flex items-center gap-4 px-5 py-4 transition-all duration-200
            ${isDone ? 'bg-emerald-50/60' : 'bg-white hover:bg-slate-50/80'}`}>

            {/* Status dot */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 border-2 border-white transition-all
                ${isDone ? 'bg-emerald-500 ring-emerald-200' : `${segCfg.dot} ring-slate-100`}`} />

            {/* Hora */}
            <span className="text-[11px] font-black text-accent w-14 flex-shrink-0 font-mono">
                {visit.time || '—:——'}
            </span>

            {/* Segment badge */}
            <SegBadge seg={visit._segment} />

            {/* Nombre y actividad */}
            <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-black uppercase truncate leading-tight
                    ${isDone ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-primary'}`}>
                    {visit.name}
                </p>
                {(visit.activity || visit.typeVisitManagement || visit.typeManagement) && (
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {visit.activity || visit.typeVisitManagement || visit.typeManagement}
                    </p>
                )}
                {isDone && checkIn?.resultado && (
                    <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full mt-1
                        ${RESULTADO_BADGE[checkIn.resultado] || 'bg-slate-100 text-slate-600'}`}>
                        {checkIn.resultado}
                    </span>
                )}
            </div>

            {/* Cartera mini-info (solo en cartera/empresarias) */}
            {CARTERA_SEGS.includes(visit._segment) && (visit.moraActual || visit.saldoActual) && (
                <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                    {visit.moraActual && Number(visit.moraActual) > 0 && (
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                            ⚠️ {visit.moraActual}d mora
                        </span>
                    )}
                    {visit.saldoActual && (
                        <span className="text-[9px] font-semibold text-slate-400">
                            Saldo: ${Number(visit.saldoActual).toLocaleString()}
                        </span>
                    )}
                    {visit.ultimoEstatus && (
                        <span className="text-[8px] text-slate-300 italic">Ant: {visit.ultimoEstatus}</span>
                    )}
                </div>
            )}

            {/* Tiempo + GPS si completado */}
            {isDone && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0 text-slate-400">
                    {checkIn.checkInTime && (
                        <span className="flex items-center gap-1 text-[9px]">
                            <Clock size={9} /> {checkIn.checkInTime}
                        </span>
                    )}
                    {checkIn.gpsStatus === 'ok' && (
                        <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                            <Navigation size={9} /> GPS
                        </span>
                    )}
                </div>
            )}

            {/* Action */}
            {isDone ? (
                <div className="flex items-center gap-1.5 text-emerald-600 flex-shrink-0">
                    <CheckCircle2 size={16} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">Registrado</span>
                </div>
            ) : (
                <button
                    onClick={() => onCheckIn(visit)}
                    className="flex-shrink-0 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/20 whitespace-nowrap">
                    Registrar Gestión
                </button>
            )}
        </div>
    );
};

// ── KPI Field Definitions (mirrored from KpiCompromisos for reuse) ─────────────
const FIELDS_BY_ROLE = {
    'asesor-f': [
        { group: 'Captación', color: 'blue', fields: [{ key: 'captNueva', label: 'Captación Nueva' }, { key: 'captReinversion', label: 'Captación Reinversión' }] },
        { group: 'Colocación', color: 'emerald', fields: [{ key: 'colocInicial', label: 'Colocación Inicial' }, { key: 'colocRedisposicion', label: 'Colocación Redisposición' }] },
        { group: 'Recuperación', color: 'amber', fields: [{ key: 'rec0', label: 'Recup. 0 días' }, { key: 'rec1_7', label: '1–7 días' }, { key: 'rec8_30', label: '8–30 días' }, { key: 'rec31_60', label: '31–60 días' }, { key: 'recMas61', label: '+61 días' }] },
    ],
    'asesor-c': [
        { group: 'Captación', color: 'blue', fields: [{ key: 'captNueva', label: 'Captación Nueva' }, { key: 'captReinversion', label: 'Captación Reinversión' }] },
        { group: 'Dispersión', color: 'violet', fields: [{ key: 'dispersion', label: 'Dispersión' }, { key: 'dispersionNueva', label: 'Dispersión Nueva' }, { key: 'aperturasCredFacil', label: '# Apert. Créd. Fácil', count: true }, { key: 'montoLineasApertura', label: 'Monto Líneas' }] },
        { group: 'Recuperación', color: 'amber', fields: [{ key: 'rec0', label: 'Recup. 0 días' }, { key: 'rec1_7', label: '1–7 días' }, { key: 'rec8_30', label: '8–30 días' }, { key: 'rec31_60', label: '31–60 días' }, { key: 'recMas61', label: '+61 días' }] },
    ],
    'gestor-i': [
        { group: 'Cobranza', color: 'emerald', fields: [{ key: 'cobranzaTotalDia', label: 'Cobranza Total' }, { key: 'cobranza1_30', label: 'Cobr. 1–30 días' }, { key: 'cobranza31_60', label: 'Cobr. 31–60 días' }, { key: 'opCobradas', label: 'Ops. Cobradas', count: true }] },
        { group: 'Visitas y Promesas', color: 'blue', fields: [{ key: 'visitasRealizadas', label: '# Visitas', count: true }, { key: 'promesasDia', label: 'Promesas del Día', count: true }, { key: 'montoPromesas', label: 'Monto Promesas' }] },
        { group: 'Saneamiento', color: 'amber', fields: [{ key: 'saldoSaneadoDia', label: 'Saldo Saneado' }, { key: 'contencionMas30', label: 'Contencion +30d' }, { key: 'contencionMas60', label: '+60d' }, { key: 'contencionMas89', label: '+89d' }] },
    ],
};
FIELDS_BY_ROLE['coordinador-l'] = FIELDS_BY_ROLE['asesor-c'];
FIELDS_BY_ROLE['gestor-e'] = FIELDS_BY_ROLE['asesor-c'];

const KPI_COLORS = {
    blue: { badge: 'bg-blue-50 text-blue-700', bar: 'bg-blue-500' },
    emerald: { badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
    amber: { badge: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400' },
    violet: { badge: 'bg-violet-50 text-violet-700', bar: 'bg-violet-500' },
    rose: { badge: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500' },
};

const kpiPct = (real, comp) => {
    const r = Number(real) || 0;
    const c = Number(comp) || 0;
    if (c === 0) return real ? 100 : 0;
    return Math.min(Math.round((r / c) * 100), 200);
};
const kpiColor = (pct) => pct >= 90 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500';
const kpiBg = (pct) => pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400';
const kpiDotCls = (pct, hasValue) => !hasValue ? 'bg-slate-200' : pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-500';
const fmtNum = (v, isCount) => { const n = Number(v); if (isNaN(n)) return '—'; return isCount ? String(n) : `$${n.toLocaleString()}`; };

// Simple controlled money input — no internal hooks, no key tricks
const MoneyInput = ({ value, onChange, isCount }) => (
    <input
        type="text" inputMode="numeric"
        value={value || ''}
        onChange={e => onChange(e.target.value.replace(/[$,]/g, '').replace(/\D/g, ''))}
        placeholder={isCount ? '0' : '$0'}
        className="w-[84px] text-center text-sm font-black border-2 border-blue-300 rounded-xl px-2 py-2 bg-white text-primary focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
    />
);

const KpiRealPanel = ({ roleId, kpiCompromisos, kpiReal, onUpdate }) => {
    const groups = FIELDS_BY_ROLE[roleId];
    const hasCompromisos = groups && Object.keys(kpiCompromisos || {}).length > 0;
    if (!groups || !hasCompromisos) return null;

    const allFields = groups.flatMap(g => g.fields);
    const filledCount = allFields.filter(f => kpiReal?.[f.key]).length;
    const avgPct = allFields.length > 0
        ? Math.round(allFields.reduce((s, f) => s + kpiPct(kpiReal?.[f.key], kpiCompromisos?.[f.key]), 0) / allFields.length)
        : 0;

    const GROUP_DOT = {
        blue: 'bg-blue-400', emerald: 'bg-emerald-400',
        amber: 'bg-amber-400', violet: 'bg-violet-400', rose: 'bg-rose-400',
    };

    return (
        <div className="mt-10 mb-4">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-7 bg-yellow-400 rounded-full" />
                    <h3 className="text-base font-black uppercase tracking-wider text-primary">Compromisos KPI del Día</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">{filledCount}/{allFields.length} capturados</span>
                    <span className={`text-sm font-black px-3 py-1.5 rounded-xl ${kpiColor(avgPct)} ${avgPct >= 90 ? 'bg-emerald-50 border border-emerald-200' : avgPct >= 70 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                        {avgPct}% {avgPct >= 90 ? '🟢' : avgPct >= 70 ? '🟡' : '🔴'}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {groups.map(({ group, color, fields }) => {
                    const dotCls = GROUP_DOT[color] || GROUP_DOT.blue;
                    return (
                        <div key={group} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                            {/* Group header — navy gradient matching Planeación */}
                            <div className="gradient-header !rounded-t-2xl shadow-md">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-4 rounded-full ${dotCls}`} />
                                    <span className="text-xs font-black uppercase tracking-widest text-white">{group}</span>
                                </div>
                            </div>
                            {/* Fields */}
                            <div className="divide-y divide-slate-100">
                                {fields.map(({ key, label, count: isCount }) => {
                                    const comp = kpiCompromisos?.[key];
                                    const real = kpiReal?.[key];
                                    const pct = kpiPct(real, comp);
                                    const hasComp = comp !== undefined && comp !== '';
                                    const hasReal = !!real;
                                    return (
                                        <div key={key} className="px-5 py-4 flex items-center gap-4">
                                            {/* Colored dot bullet — always visible, color depends on status */}
                                            <div className={`w-4 h-4 rounded-full flex-shrink-0 transition-colors duration-300 ${kpiDotCls(pct, hasReal)}`} />
                                            {/* KPI label */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-primary uppercase tracking-wide leading-tight">{label}</p>
                                            </div>
                                            {/* Compromiso → Real → % — always full width, no layout shift */}
                                            <div className="flex items-end gap-3 flex-shrink-0">
                                                {/* Compromiso column */}
                                                {hasComp && (
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compromiso</p>
                                                        <div className="bg-slate-100 rounded-xl px-3 py-2 min-w-[80px] text-center">
                                                            <p className="text-sm font-black text-slate-700">{fmtNum(comp, isCount)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {hasComp && <span className="text-slate-300 font-bold text-lg mb-1">→</span>}
                                                {/* Real input */}
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Real</p>
                                                    <MoneyInput
                                                        value={real}
                                                        onChange={v => onUpdate(key, v)}
                                                        isCount={isCount}
                                                    />
                                                </div>
                                                {/* % column — always reserved, never causes layout shift */}
                                                <div className="text-center min-w-[52px] mb-0.5">
                                                    {hasReal && hasComp ? (
                                                        <>
                                                            <p className={`text-base font-black ${kpiColor(pct)}`}>{pct}%</p>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-500 ${kpiBg(pct)}`}
                                                                    style={{ width: `${Math.min(pct, 100)}%` }} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-base font-black text-slate-200">—</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Follow-Up Visit Card (Compromiso de pago agendado) ──────────────────────
const FollowUpCard = ({ followUp, checkIn, onSetTime, onCheckIn }) => {
    const isDone = !!checkIn;
    const fmtDate = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };
    return (
         <div className={`flex items-center gap-4 px-5 py-4 transition-all duration-200
            ${isDone ? 'bg-emerald-50/60' : 'bg-white hover:bg-slate-50/80'}`}>

            {/* Status dot */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 border-2 border-white transition-all
                ${isDone ? 'bg-emerald-500 ring-emerald-200' : 'bg-blue-500 ring-blue-100'}`} />

            {/* Date badge */}
            <span className="text-[11px] font-black text-blue-600 flex-shrink-0">
                📅 {fmtDate(followUp.compromisoFecha)}
            </span>

            {/* Seguimiento badge */}
            <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">Seguimiento</span>

            {/* Segment */}
            <SegBadge seg={followUp._segment} />

           {/* Nombre + monto comprometido */}
            <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-black uppercase truncate leading-tight
                    ${isDone ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-primary'}`}>
                    {followUp.name}
                </p>
                {followUp.compromisoCuanto && (
                    <span className="text-[10px] font-bold text-emerald-700">
                        Compromiso: ${Number(followUp.compromisoCuanto).toLocaleString()}
                    </span>
                )}
                {isDone && checkIn?.resultado && (
                    <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full mt-1
                        ${RESULTADO_BADGE[checkIn.resultado] || 'bg-slate-100 text-slate-600'}`}>
                        {checkIn.resultado}
                    </span>
                )}
            </div>

            {/* Hora input (solo si no está registrado) */}
            {!isDone && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hora:</label>
                    <input type="time" defaultValue={followUp.time || ''}
                        onChange={e => onSetTime(followUp.id, e.target.value)}
                        className="text-[11px] font-black border border-slate-200 rounded-lg px-2 py-1 bg-white text-primary" />
                </div>
            )}

            {/* Action */}
            {isDone ? (
                <div className="flex items-center gap-1.5 text-emerald-600 flex-shrink-0">
                    <CheckCircle2 size={16} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">Registrado</span>
                </div>
            ) : (
                <button onClick={() => onCheckIn(followUp)}
                    className="flex-shrink-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/20 whitespace-nowrap">
                    Registrar Avance
                </button>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const EjecucionOperativo = () => {
    const { selectedRole } = useRole();
    const { currentAgenda, registerCheckIn, addUnplannedVisit, getVisibleSegments,
        scheduleFollowUp, scheduledFollowUps, updateKpiReal } = useAgenda();
    const [modalVisit, setModalVisit] = useState(null);
    const [showUnplanned, setShowUnplanned] = useState(false);
    const [followUpTimes, setFollowUpTimes] = useState({});

    const checkIns = currentAgenda.checkIns || {};
    const unplannedVisits = currentAgenda.unplannedVisits || [];
    const todayISO = new Date().toISOString().slice(0, 10);

    // Follow-ups scheduled for today (or show all in demo if none match today)
    const allFollowUps = scheduledFollowUps || [];
    const todayFollowUps = allFollowUps
        .filter(fu => !fu.compromisoFecha || fu.compromisoFecha === todayISO)
        .map(fu => ({ ...fu, time: followUpTimes[fu.id] ?? fu.time }));
    const setFollowUpTime = (id, time) => setFollowUpTimes(prev => ({ ...prev, [id]: time }));

    // Allow Ejecución when approved OR when there is pre-loaded visit data
    // (coordinador-l shows as 'borrador' so Planning is editable, but still has demo visits)
    const hasSegmentData = Object.values(currentAgenda.segments || {})
        .some(seg => seg.some(v => v.name));

    if (currentAgenda.status !== 'aprobada' && !hasSegmentData) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-primary uppercase">Ejecución en Ruta</h2>
                <BlockedScreen status={currentAgenda.status} />
            </div>
        );
    }

    // Build sorted visit list
    const getAllVisits = () => {
        const segs = getVisibleSegments();
        const visits = [];
        segs.forEach(seg => {
            (currentAgenda.segments[seg] || []).filter(v => v.name).forEach(v => visits.push({ ...v, _segment: seg }));
        });
        visits.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
        return [...visits, ...unplannedVisits.map(v => ({ ...v, _segment: v._segment || 'Imprevisto' }))];
    };

    const allVisits = getAllVisits();
    const done = allVisits.filter(v => checkIns[v.id]).length + unplannedVisits.length;
    const total = allVisits.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const todayStr = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="max-w-[1400px] mx-auto pb-32 px-4 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="pt-8 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black text-primary tracking-tighter leading-none">EJECUCIÓN</h2>
                    <div className="flex items-center gap-2 mt-2 text-accent text-[11px] font-black uppercase tracking-[0.3em]">
                        <Calendar size={12} /> {todayStr}
                    </div>
                </div>
                <div className="flex items-center gap-5 bg-white rounded-[24px] border border-slate-100 shadow-md px-6 py-4">
                    <ProgressRing done={done} total={total} />
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progreso de Ruta</p>
                        <p className="text-2xl font-black text-primary">{pct}<span className="text-sm text-accent">%</span></p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Completion Summary Banner — aparece cuando la ruta está al 100% */}
            {pct === 100 && total > 0 && (() => {
                const compromisos = Object.values(checkIns).filter(c => c.resultado === 'Compromiso de pago' || c.resultado === 'Promesa de pago');
                const totalMonto = compromisos.reduce((s, c) => s + (Number(c.pagoMonto) || 0), 0);
                const noRealizadas = Object.values(checkIns).filter(c => c.resultado === 'No realizada').length;
                return (
                    <div className="mb-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-200 mb-1">✅ Ruta completada</p>
                                <h3 className="text-2xl font-black leading-tight">¡Buen trabajo hoy!</h3>
                                <p className="text-[11px] text-emerald-100 mt-1">{todayStr}</p>
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 size={28} className="text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-5">
                            <div className="bg-white/15 rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black">{done}</p>
                                <p className="text-[8px] font-black text-emerald-100 uppercase tracking-wider mt-0.5">Gestiones</p>
                            </div>
                            <div className="bg-white/15 rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black">{compromisos.length}</p>
                                <p className="text-[8px] font-black text-emerald-100 uppercase tracking-wider mt-0.5">Compromisos</p>
                            </div>
                            <div className="bg-white/15 rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black">{noRealizadas}</p>
                                <p className="text-[8px] font-black text-emerald-100 uppercase tracking-wider mt-0.5">No realizadas</p>
                            </div>
                        </div>
                        {totalMonto > 0 && (
                            <div className="mt-3 bg-white/15 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-wider">Monto total comprometido</span>
                                <span className="text-[15px] font-black">${totalMonto.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Visit list — grouped by segment, matching Planeación style */}
            <div className="space-y-6">
                {allVisits.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <MapPin size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-black uppercase tracking-widest">No hay visitas agendadas</p>
                    </div>
                ) : (() => {
                    // Group by segment
                    const grouped = {};
                    allVisits.forEach(v => {
                        const seg = v._segment || 'Imprevisto';
                        if (!grouped[seg]) grouped[seg] = [];
                        grouped[seg].push(v);
                    });
                    const SEG_DOT = {
                        'Promoción': 'bg-blue-400',
                        'Evaluación e Integración': 'bg-violet-400',
                        'Seguimiento de Cartera': 'bg-amber-400',
                        'Gestión de Empresarias': 'bg-emerald-400',
                        'Imprevisto': 'bg-rose-400',
                    };
                    return Object.entries(grouped).map(([seg, visits]) => {
                        const doneCount = visits.filter(v => checkIns[v.id]).length;
                        const dot = SEG_DOT[seg] || 'bg-slate-400';
                        const cfg = SEG_CFG[seg] || SEG_CFG['Imprevisto'];
                        return (
                            <div key={seg} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                                {/* Segment header — gradient-header matching Planeación */}
                                <div className="gradient-header !rounded-t-3xl shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-4 rounded-full ${dot}`} />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{seg}</span>
                                        <span className="ml-1 text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">{visits.length}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-white/60">{doneCount}/{visits.length} completadas</span>
                                </div>
                                {/* Visit cards */}
                                <div className="divide-y divide-slate-50">
                                    {visits.map((v, idx) => (
                                        <VisitCard key={v.id} visit={v} checkIn={checkIns[v.id]} onCheckIn={setModalVisit} isLast={idx === visits.length - 1} />
                                    ))}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

            {/* Seguimientos agendados (Compromisos de pago) */}
            {todayFollowUps.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                    {/* Segment header — same style as visit segments */}
                    <div className="gradient-header !rounded-t-3xl shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 rounded-full bg-blue-400" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Seguimientos Comprometidos</span>
                            <span className="ml-1 text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">{todayFollowUps.length}</span>
                        </div>
                        <span className="text-[9px] font-bold text-white/60">
                            {todayFollowUps.filter(fu => checkIns[fu.id]).length}/{todayFollowUps.length} registrados
                        </span>
                    </div>
                    {/* Follow-up rows */}
                    <div className="divide-y divide-slate-50">
                        {todayFollowUps.map(fu => (
                            <FollowUpCard
                                key={fu.id} followUp={fu}
                                checkIn={checkIns[fu.id]}
                                onSetTime={setFollowUpTime}
                                onCheckIn={setModalVisit}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Compromisos vs Real */}
            {/**
             * TODO: EP Lógico para actualizar los KPIs Reales del día en la Base de Datos.
             * EP Sugerido: PUT /api/v1/kpis/real
             */}
            <KpiRealPanel
                roleId={selectedRole?.id}
                kpiCompromisos={currentAgenda.kpiCompromisos || {}}
                kpiReal={currentAgenda.kpiReal || {}}
                onUpdate={updateKpiReal || (() => { })}
            />

            {/* Unplanned form / button */}
            {showUnplanned ? (
                <UnplannedForm
                    onAdd={data => { addUnplannedVisit(data); setShowUnplanned(false); }}
                    onCancel={() => setShowUnplanned(false)}
                />
            ) : (
                <button onClick={() => setShowUnplanned(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-500 py-5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest">
                    <Plus size={16} /> Agregar Visita No Planeada
                </button>
            )}

            {/* Check-in Modal */}
            {modalVisit && (
                <CheckInModal
                    visit={modalVisit}
                    onClose={() => setModalVisit(null)}
                    onSubmit={data => {
                        registerCheckIn(modalVisit.id, data);
                        // Auto-schedule follow-up if Compromiso de pago
                        if (data.resultado === 'Compromiso de pago' && data.pagoFecha) {
                            scheduleFollowUp(modalVisit, { fecha: data.pagoFecha, monto: data.pagoMonto });
                        }
                        setModalVisit(null);
                    }}
                />
            )}
        </div>
    );
};

export default EjecucionOperativo;
