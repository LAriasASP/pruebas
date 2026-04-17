import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { useRole } from '../../context/RoleContext';
import { useAgenda } from '../../context/AgendaContext';
import { useCatalogs } from '../../context/CatalogContext';
import api from '../../api/axiosConfig'; 
import {
    MapPin, CheckCircle2, Clock, Camera, Plus, X, AlertCircle,
    Navigation, FileText, Loader2, Calendar, Image, Shield,
    User, Building2, Activity, Users, TrendingUp, Target, ArrowLeft, DollarSign
} from 'lucide-react';

// ── Diccionario Dinámico de Iconos ───────────────────────────────────────────
const ICON_MAP = {
    DollarSign: DollarSign,
    TrendingUp: TrendingUp,
    Activity: Activity,
    Users: Users,
    Target: Target
};

// ── Custom Hook: UI Dinámica Basada en Base de Datos ─────────────────────────
const useDynamicUI = () => {
    const { 
        bloques = [], 
        resultadosGestion = [], 
        estadosAgenda = [] 
    } = useCatalogs() || {};

    const SEG_CFG = useMemo(() => {
        const palette = [
            { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
            { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
            { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
            { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
            { dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700' }
        ];
        const config = {};
        bloques.forEach((b, idx) => {
            config[b.nombre] = { 
                label: b.nombre.substring(0, 6).toUpperCase(), 
                ...palette[idx % palette.length] 
            };
        });
        config['Imprevisto'] = { label: 'IMPREV', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700' };
        return config;
    }, [bloques]);

    const RESULTADO_BADGE = useMemo(() => {
        const palette = [
            'bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700',
            'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700',
            'bg-orange-100 text-orange-700', 'bg-teal-100 text-teal-700'
        ];
        const config = {};
        resultadosGestion.forEach((res, idx) => {
            const n = res.nombre.toLowerCase();
            if (n.includes('negativa')) config[res.nombre] = 'bg-red-100 text-red-700';
            else if (n.includes('sin contacto') || n.includes('finado')) config[res.nombre] = 'bg-slate-100 text-slate-600';
            else config[res.nombre] = palette[idx % palette.length];
        });
        return config;
    }, [resultadosGestion]);

    const MOCK_RESULTADOS = useMemo(() => {
        if (resultadosGestion.length === 0) return ['Realizado', 'No realizado'];
        return resultadosGestion.map(r => r.nombre);
    }, [resultadosGestion]);

    const STATUS_STYLES = useMemo(() => {
        const config = {};
        estadosAgenda.forEach(est => {
            const key = est.nombre.toLowerCase();
            if (key.includes('borrador')) config[key] = { label: est.nombre, bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' };
            else if (key.includes('pendient')) config[key] = { label: est.nombre, bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' };
            else if (key.includes('aprobada') || key.includes('autoriz')) config[key] = { label: est.nombre, bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' };
            else if (key.includes('modif') || key.includes('rechaz')) config[key] = { label: est.nombre, bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' };
            else config[key] = { label: est.nombre, bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' };
        });
        
        // Salvavidas por si el catálogo no carga a tiempo
        if (!config['borrador']) config['borrador'] = { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' };
        if (!config['pendiente']) config['pendiente'] = { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' };
        if (!config['aprobada']) config['aprobada'] = { label: 'Autorizada', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' };
        if (!config['requiere_modificacion']) config['requiere_modificacion'] = { label: 'Req. Modificación', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' };
        
        return config;
    }, [estadosAgenda]);

    const blockedScreenCfg = useMemo(() => ({
        borrador: { Icon: FileText, bg: 'bg-slate-50', ic: 'text-slate-400', title: 'Agenda no certificada', msg: 'Completa y certifica tu agenda en Planeación para habilitar la ejecución.' },
        pendiente: { Icon: Clock, bg: 'bg-amber-50', ic: 'text-amber-500', title: 'Esperando autorización', msg: 'Tu agenda está en revisión. Tu jefe debe aprobarla antes de que puedas iniciar la ruta.' },
        requiere_modificacion: { Icon: AlertCircle, bg: 'bg-red-50', ic: 'text-red-500', title: 'Requiere modificaciones', msg: 'Tu jefe solicitó ajustes. Revisa la pestaña Planeación, corrige y re-certifica.' },
    }), []);

    return { SEG_CFG, RESULTADO_BADGE, MOCK_RESULTADOS, STATUS_STYLES, blockedScreenCfg };
};


// ── Contexto para proveer UI Dinámica a los subcomponentes ───────────────────
const DynamicUIContext = createContext();
const useDynamicUIContext = () => useContext(DynamicUIContext);


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
    const { SEG_CFG } = useDynamicUIContext();
    const c = SEG_CFG[seg] || SEG_CFG['Imprevisto'] || { badge: 'bg-slate-100 text-slate-700', label: 'OTRO' };
    return <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${c.badge}`}>{c.label}</span>;
};

const ResultBadge = ({ resultado }) => {
    const { RESULTADO_BADGE } = useDynamicUIContext();
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
    const { blockedScreenCfg } = useDynamicUIContext();
    const c = blockedScreenCfg[status?.toLowerCase()] || blockedScreenCfg['borrador'];
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
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${value === opt.val ? (opt.val ? 'bg-emerald-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg') : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                {opt.label}
            </button>
        ))}
    </div>
);

// ── Check-In Modal ────────────────────────────────────────────────────────────
const CARTERA_SEGS = ['Seguimiento de Cartera', 'Gestión de Empresarias'];

const CheckInModal = ({ visit, onClose, onSubmit }) => {
    const { 
        motivosNoVisita = [], 
        estatusCartera = [], 
        motivosNoActividad = [], 
        resultadosGestion = [], 
        subEstatus = [] 
    } = useCatalogs() || {};

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
    
    // Logica para saber si es compromiso/promesa
    const isCompromiso = form.resultado.toLowerCase().includes('compromiso');
    const isPromesa = form.resultado.toLowerCase().includes('promesa');
    const needsAmountDate = isCompromiso || isPromesa;
    const visitaNoRealizada = form.visitaRealizada === false;

    const decisionTomada = visitaNoRealizada
        ? form.motivoNoVisita && form.motivoNoVisita !== ''
        : isCarteraSegment
            ? form.clienteEncontrado !== null
            : form.actividadRealizada !== null && (
                form.actividadRealizada === false
                    ? !!form.motivoNoActividad
                    : !!form.resultado
            );

    const canSave = form.visitaRealizada !== null && (
        visitaNoRealizada
            ? form.motivoNoVisita && form.motivoNoVisita !== ''
            : isCarteraSegment
                ? form.clienteEncontrado !== null
                && form.resultado && form.resultado !== ''
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
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${gps.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : gps.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {gps.status === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                        {gps.status === 'loading' && 'Capturando coordenadas GPS...'}
                        {gps.status === 'ok' && `GPS: ${gps.lat}, ${gps.lng}`}
                        {gps.status === 'error' && 'Ubicación no disponible'}
                        {gps.status === 'idle' && 'Inicializando...'}
                    </div>

                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1">¿Se realizó la visita?</label>
                        <YesNo value={form.visitaRealizada} onChange={v => setForm(p => ({ ...p, visitaRealizada: v, clienteEncontrado: null, actividadRealizada: null, motivoNoVisita: '' }))} />
                    </div>

                    {visitaNoRealizada && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿Por qué no se realizó?</p>
                            <select value={form.motivoNoVisita}
                                onChange={e => setForm(p => ({ ...p, motivoNoVisita: e.target.value }))}
                                className="input-cell">
                                <option value="" disabled>Seleccionar motivo...</option>
                                {motivosNoVisita.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1">¿Se encontró al cliente?</label>
                            <YesNo value={form.clienteEncontrado} onChange={v => setForm(p => ({ ...p, clienteEncontrado: v }))} />
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.clienteEncontrado !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Actualizar Estatus de Cartera *</label>
                            <select value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell">
                                <option value="" disabled>Seleccionar resultado...</option>
                                {estatusCartera.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200 bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-violet-500 uppercase tracking-widest mb-1">Actividad Planeada</p>
                            <p className="text-[11px] font-black text-primary">{visit.activity || visit.typeVisitManagement || '—'}</p>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">¿Se realizó la actividad?</label>
                            <YesNo value={form.actividadRealizada} onChange={v => setForm(p => ({ ...p, actividadRealizada: v, motivoNoActividad: '' }))} />
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === false && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿Por qué no se realizó la actividad?</p>
                            <select value={form.motivoNoActividad || ''}
                                onChange={e => setForm(p => ({ ...p, motivoNoActividad: e.target.value }))}
                                className="input-cell">
                                <option value="" disabled>Seleccionar motivo...</option>
                                {motivosNoActividad.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === true && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Resultado de la Gestión</label>
                            <select value={form.resultado}
                                onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))}
                                className="input-cell">
                                <option value="" disabled>Seleccionar resultado...</option>
                                {resultadosGestion.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.resultado && form.resultado !== '' && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Sub-estatus</label>
                            <select value={form.subestatus} onChange={e => setForm(p => ({ ...p, subestatus: e.target.value }))} className="input-cell">
                                <option value="N/A">N/A</option>
                                {subEstatus.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {needsAmountDate && (
                        <div className={`animate-in slide-in-from-top-2 duration-300 p-4 rounded-2xl border space-y-3 ${isCompromiso ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                            <div className="flex items-start gap-2">
                                <div className="flex-1">
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCompromiso ? 'text-blue-700' : 'text-indigo-700'}`}>
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

                    {decisionTomada && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Notas</label>
                            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Observaciones de la visita..." rows={3} className="input-cell resize-none" />
                        </div>
                    )}

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
                    
                    {decisionTomada && (
                        <div className="animate-in fade-in duration-200 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Estatus de Cartera</p>
                            <select
                                value={form.estatusCartera}
                                onChange={e => setForm(p => ({ ...p, estatusCartera: e.target.value }))}
                                className="input-cell">
                                <option value="" disabled>Seleccionar estatus...</option>
                                {estatusCartera.map(e => (
                                    <option key={e.id} value={e.nombre}>{e.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white px-6 pb-6 pt-4 border-t border-slate-50">
                    <button onClick={submit} disabled={!canSave}
                        className={`w-full py-5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all ${canSave ? 'bg-primary text-white shadow-xl hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                        Registrar Gestión
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Unplanned Visit Form ──────────────────────────────────────────────────────
const UnplannedForm = ({ onAdd, onCancel }) => {
    const { tiposGestionNoPlaneada = [], estatusCartera = [] } = useCatalogs() || {};

    const [form, setForm] = useState({ name: '', tipoGestion: '', resultado: '', notes: '', pagoMonto: '', pagoFecha: '' });
    const isCompromiso = form.resultado.toLowerCase().includes('compromiso');
    const isPromesa = form.resultado.toLowerCase().includes('promesa');
    const needsAmountDate = isCompromiso || isPromesa;
    
    const ok = form.name
        && form.tipoGestion && form.tipoGestion !== ''
        && form.resultado && form.resultado !== ''
        && (!needsAmountDate || (form.pagoMonto && form.pagoFecha));
    
    const submit = () => {
        if (!ok) return;
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
                        <option value="" disabled>Seleccionar tipo...</option>
                        {tiposGestionNoPlaneada.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Resultado *</label>
                    <select value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell text-[10px]">
                        <option value="" disabled>Seleccionar resultado...</option>
                        {estatusCartera.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                </div>
            </div>
            {needsAmountDate && (
                <div className={`p-3 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${isCompromiso ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCompromiso ? 'text-blue-700' : 'text-indigo-700'}`}>
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
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${ok ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                Registrar Imprevisto
            </button>
        </div>
    );
};

// ── Visit Card ───────────────────────────────────────────────────────────────
const VisitCard = ({ visit, checkIn, onCheckIn }) => {
    const { SEG_CFG, RESULTADO_BADGE } = useDynamicUIContext();
    const segCfg = SEG_CFG[visit._segment] || SEG_CFG['Imprevisto'] || { dot: 'bg-slate-400' };
    const isDone = !!checkIn;

    return (
        <div className={`flex items-center gap-4 px-5 py-4 transition-all duration-200 ${isDone ? 'bg-emerald-50/60' : 'bg-white hover:bg-slate-50/80'}`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 border-2 border-white transition-all ${isDone ? 'bg-emerald-500 ring-emerald-200' : `${segCfg.dot} ring-slate-100`}`} />
            <span className="text-[11px] font-black text-accent w-14 flex-shrink-0 font-mono">
                {visit.time || '—:——'}
            </span>
            <SegBadge seg={visit._segment} />
            <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-black uppercase truncate leading-tight ${isDone ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-primary'}`}>
                    {visit.name}
                </p>
                {(visit.activity || visit.typeVisitManagement || visit.typeManagement) && (
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {visit.activity || visit.typeVisitManagement || visit.typeManagement}
                    </p>
                )}
                {isDone && checkIn?.resultado && (
                    <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full mt-1 ${RESULTADO_BADGE[checkIn.resultado] || 'bg-slate-100 text-slate-600'}`}>
                        {checkIn.resultado}
                    </span>
                )}
            </div>

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

// ── Follow-Up Visit Card ─────────────────────────────────────────────────────
const FollowUpCard = ({ followUp, checkIn, onSetTime, onCheckIn }) => {
    const { RESULTADO_BADGE } = useDynamicUIContext();
    const isDone = !!checkIn;
    const fmtDate = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };
    return (
        <div className={`flex items-center gap-4 px-5 py-4 transition-all duration-200
            ${isDone ? 'bg-emerald-50/60' : 'bg-white hover:bg-slate-50/80'}`}>

            <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 border-2 border-white transition-all
                ${isDone ? 'bg-emerald-500 ring-emerald-200' : 'bg-blue-500 ring-blue-100'}`} />

            <span className="text-[11px] font-black text-blue-600 flex-shrink-0">
                📅 {fmtDate(followUp.compromisoFecha)}
            </span>

            <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">Seguimiento</span>

            <SegBadge seg={followUp._segment} />

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

            {!isDone && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hora:</label>
                    <input type="time" defaultValue={followUp.time || ''}
                        onChange={e => onSetTime(followUp.id, e.target.value)}
                        className="text-[11px] font-black border border-slate-200 rounded-lg px-2 py-1 bg-white text-primary" />
                </div>
            )}

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

// ── Paneles de KPI Dinámicos ─────────────────────────────────────────────────
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

const MoneyInput = ({ value, onChange, isCount }) => (
    <input
        type="text" inputMode="numeric"
        value={value || ''}
        onChange={e => onChange(e.target.value.replace(/[$,]/g, '').replace(/\D/g, ''))}
        placeholder={isCount ? '0' : '$0'}
        className="w-[84px] text-center text-sm font-black border-2 border-blue-300 rounded-xl px-2 py-2 bg-white text-primary focus:border-blue-500 focus:outline-none transition-colors shadow-sm"
    />
);

const KpiRealPanel = ({ kpiCompromisos, kpiReal, onUpdate }) => {
    const { kpiConfig: groups } = useAgenda();

    if (!groups || groups.length === 0) return null;

    const allFields = groups.flatMap(g => g.fields);
    const filledCount = allFields.filter(f => kpiReal?.[f.key]).length;
    const avgPct = allFields.length > 0
        ? Math.round(allFields.reduce((s, f) => s + kpiPct(kpiReal?.[f.key], kpiCompromisos?.[f.key]), 0) / allFields.length)
        : 0;

    return (
        <div className="mt-10 mb-4">
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
                {groups.map((groupData) => {
                    const { group, color, fields, iconName } = groupData;
                    const IconComponent = ICON_MAP[iconName] || Target;
                    
                    const bgHeaderMap = {
                        blue: 'bg-blue-400', emerald: 'bg-emerald-400',
                        amber: 'bg-amber-400', violet: 'bg-violet-400', rose: 'bg-rose-400'
                    };
                    const dotCls = bgHeaderMap[color] || bgHeaderMap.blue;

                    return (
                        <div key={group} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                            <div className="gradient-header !rounded-t-2xl shadow-md">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-4 rounded-full ${dotCls}`} />
                                    <IconComponent size={14} className="text-white/80" />
                                    <span className="text-xs font-black uppercase tracking-widest text-white">{group}</span>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {fields.map(({ key, label, count: isCount }) => {
                                    const comp = kpiCompromisos?.[key];
                                    const real = kpiReal?.[key];
                                    const pct = kpiPct(real, comp);
                                    const hasComp = comp !== undefined && comp !== '';
                                    const hasReal = !!real;
                                    
                                    return (
                                        <div key={key} className="px-5 py-4 flex items-center gap-4">
                                            <div className={`w-4 h-4 rounded-full flex-shrink-0 transition-colors duration-300 ${kpiDotCls(pct, hasReal)}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-primary uppercase tracking-wide leading-tight">{label}</p>
                                            </div>
                                            <div className="flex items-end gap-3 flex-shrink-0">
                                                {hasComp && (
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Compromiso</p>
                                                        <div className="bg-slate-100 rounded-xl px-3 py-2 min-w-[80px] text-center">
                                                            <p className="text-sm font-black text-slate-700">{fmtNum(comp, isCount)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {hasComp && <span className="text-slate-300 font-bold text-lg mb-1">→</span>}
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Real</p>
                                                    <MoneyInput value={real} onChange={v => onUpdate(key, v)} isCount={isCount} />
                                                </div>
                                                <div className="text-center min-w-[52px] mb-0.5">
                                                    {hasReal && hasComp ? (
                                                        <>
                                                            <p className={`text-base font-black ${kpiColor(pct)}`}>{pct}%</p>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-500 ${kpiBg(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
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

// ── COMPONENTE RAÍZ — EjecucionOperativo (El principal que exportamos) ───────
const EjecucionOperativoContent = () => {
    const { currentAgenda, registerCheckIn, addUnplannedVisit, getVisibleSegments,
        scheduleFollowUp, scheduledFollowUps, updateKpiReal } = useAgenda();
    const [modalVisit, setModalVisit] = useState(null);
    const [showUnplanned, setShowUnplanned] = useState(false);
    const [followUpTimes, setFollowUpTimes] = useState({});

    const checkIns = currentAgenda.checkIns || {};
    const unplannedVisits = currentAgenda.unplannedVisits || [];
    const todayISO = new Date().toISOString().slice(0, 10);

    const allFollowUps = scheduledFollowUps || [];
    const todayFollowUps = allFollowUps
        .filter(fu => !fu.compromisoFecha || fu.compromisoFecha === todayISO)
        .map(fu => ({ ...fu, time: followUpTimes[fu.id] ?? fu.time }));
    const setFollowUpTime = (id, time) => setFollowUpTimes(prev => ({ ...prev, [id]: time }));

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

            {/* Completion Summary Banner */}
            {pct === 100 && total > 0 && (() => {
                const compromisos = Object.values(checkIns).filter(c => c.resultado?.toLowerCase().includes('compromiso') || c.resultado?.toLowerCase().includes('promesa'));
                const totalMonto = compromisos.reduce((s, c) => s + (Number(c.pagoMonto) || 0), 0);
                const noRealizadas = Object.values(checkIns).filter(c => c.resultado?.toLowerCase().includes('no realizada')).length;
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

            <div className="space-y-6">
                {allVisits.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <MapPin size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-black uppercase tracking-widest">No hay visitas agendadas</p>
                    </div>
                ) : (() => {
                    const grouped = {};
                    allVisits.forEach(v => {
                        const seg = v._segment || 'Imprevisto';
                        if (!grouped[seg]) grouped[seg] = [];
                        grouped[seg].push(v);
                    });
                    
                    return Object.entries(grouped).map(([seg, visits]) => {
                        const doneCount = visits.filter(v => checkIns[v.id]).length;
                        return (
                            <div key={seg} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                                <div className="gradient-header !rounded-t-3xl shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <SegBadge seg={seg} />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white ml-2">{seg}</span>
                                        <span className="ml-1 text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">{visits.length}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-white/60">{doneCount}/{visits.length} completadas</span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {visits.map((v, idx) => (
                                        <VisitCard key={v.id} visit={v} checkIn={checkIns[v.id]} onCheckIn={setModalVisit} />
                                    ))}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

            {todayFollowUps.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
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
                    <div className="divide-y divide-slate-50">
                        {todayFollowUps.map(fu => (
                            <FollowUpCard key={fu.id} followUp={fu} checkIn={checkIns[fu.id]} onSetTime={setFollowUpTime} onCheckIn={setModalVisit} />
                        ))}
                    </div>
                </div>
            )}

            <KpiRealPanel
                kpiCompromisos={currentAgenda.kpiCompromisos || {}}
                kpiReal={currentAgenda.kpiReal || {}}
                onUpdate={updateKpiReal || (() => { })}
            />

            {showUnplanned ? (
                <UnplannedForm onAdd={data => { addUnplannedVisit(data); setShowUnplanned(false); }} onCancel={() => setShowUnplanned(false)} />
            ) : (
                <button onClick={() => setShowUnplanned(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-500 py-5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest">
                    <Plus size={16} /> Agregar Visita No Planeada
                </button>
            )}

            {modalVisit && (
                <CheckInModal visit={modalVisit} onClose={() => setModalVisit(null)} onSubmit={data => {
                    registerCheckIn(modalVisit.id, data);
                    if (data.resultado?.toLowerCase().includes('compromiso') && data.pagoFecha) {
                        scheduleFollowUp(modalVisit, { fecha: data.pagoFecha, monto: data.pagoMonto });
                    }
                    setModalVisit(null);
                }} />
            )}
        </div>
    );
};

// ── Wrapper Component: Provee el contexto dinámico ───────────────────────────
const EjecucionOperativoWrapper = () => {
    const dynamicUI = useDynamicUI();
    return (
        <DynamicUIContext.Provider value={dynamicUI}>
            <EjecucionOperativoContent />
        </DynamicUIContext.Provider>
    );
};

export default EjecucionOperativoWrapper;