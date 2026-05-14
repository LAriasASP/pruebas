import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { useRole } from '../../context/RoleContext';
import { useAgenda } from '../../context/AgendaContext';
import { useCatalogs } from '../../context/CatalogContext';
import api from '../../api/axiosConfig'; 
import FormattedNumberInput from '../../components/FormattedNumberInput';
import UIModal from '../../components/UIModal';
import LoggerService from '../../services/LoggerService';
import {
    MapPin, CheckCircle2, Clock, Camera, Plus, X, AlertCircle,
    Navigation, FileText, Loader2, Calendar, Image, Shield,
    User, Building2, Activity, Users, TrendingUp, Target, ArrowLeft, DollarSign, Lock
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
        config['Visita No Planeada'] = { label: 'IMPREV', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700' };
        config['Imprevisto'] = { label: 'IMPREV', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700' }; // Por si acaso hay locales
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
const YesNo = ({ id, value, onChange }) => (
    <div id={id} tabIndex="-1" className="flex gap-2 outline-none focus:ring-2 focus:ring-rose-400 rounded-2xl transition-all">
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
    // 1. Agregamos useRole y extraemos tiposGestion del catálogo
    const { selectedRole } = useRole();
    const { 
        motivosNoVisita = [], 
        estatusCartera = [], 
        motivosNoActividad = [], 
        resultadosGestion = [], 
        subEstatus = [],
        tiposGestion = [] // NUEVO: Extraemos el catálogo
    } = useCatalogs() || {};

    const isCarteraSegment = CARTERA_SEGS.includes(visit._segment);

    // 2. Filtramos los tipos de gestión según el rol (igual que en UnplannedForm)
    const tiposGestionFiltrados = useMemo(() => {
        if (!tiposGestion || tiposGestion.length === 0) return [];
        const canal = selectedRole?.canal?.toUpperCase();
        if (canal === 'COBRANZA') {
            const excluidos = ['PROMOCIÓN', 'VENTA', 'COLOCACIÓN'];
            return tiposGestion.filter(t => !excluidos.some(termino => t.nombre.toUpperCase().includes(termino)));
        }
        return tiposGestion;
    }, [tiposGestion, selectedRole]);

    const [form, setForm] = useState({
        visitaRealizada: null,
        clienteEncontrado: null,
        actividadRealizada: null,
        motivoNoVisita: '',
        motivoNoActividad: '',
        resultado: '',
        // 3. NUEVO: Inicializamos tipoGestion con lo planeado (o vacío si no se planeó)
        tipoGestion: visit.activity || visit.typeVisitManagement || visit.typeManagement || visit.typeIntegration || '',
        subestatus: 'N/A',
        estatusCartera: '',
        pagoMonto: '', pagoFecha: '',
        notes: '', photoUrl: null
    });
    
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', focusId: null });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [startMs] = useState(() => Date.now());
    const [openTime] = useState(nowTimeStr);
    const gps = useGPS(true);
    const fileRef = useRef(null);
    
    const isCompromiso = form.resultado?.toLowerCase().includes('compromiso');
    const isPromesa = form.resultado?.toLowerCase().includes('promesa');
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

    const handlePhoto = e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = ev => { setPhotoPreview(ev.target.result); setForm(p => ({ ...p, photoUrl: ev.target.result })); };
        r.readAsDataURL(f);
    };

    const handleCloseAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        if (alertConfig.focusId) {
            setTimeout(() => document.getElementById(alertConfig.focusId)?.focus(), 100);
        }
    };

    const validateForm = () => {
        if (form.visitaRealizada === null) return { msg: 'Indica si se realizó la visita.', id: 'visitaRealizada' };
        
        if (visitaNoRealizada) {
            if (!form.motivoNoVisita) return { msg: 'Selecciona el motivo por el cual no se realizó la visita.', id: 'motivoNoVisita' };
        } else {
            // 4. NUEVO: Validación estricta para asegurar que siempre haya una actividad
            if (!form.tipoGestion || form.tipoGestion.trim() === '') {
                return { msg: 'Por favor, captura el Tipo de Gestión o Actividad realizada.', id: 'tipoGestion' };
            }

            if (isCarteraSegment) {
                if (form.clienteEncontrado === null) return { msg: 'Indica si encontraste al cliente.', id: 'clienteEncontrado' };
                if (!form.resultado) return { msg: 'Selecciona el estatus actualizado de la cartera.', id: 'resultadoCartera' };
                if (needsAmountDate) {
                    if (!form.pagoMonto) return { msg: 'Especifica el Monto del compromiso.', id: 'pagoMonto' };
                    if (!form.pagoFecha) return { msg: 'Especifica la Fecha del compromiso.', id: 'pagoFecha' };
                }
            } else {
                if (form.actividadRealizada === null) return { msg: 'Indica si se completó la actividad.', id: 'actividadRealizada' };
                if (form.actividadRealizada === false && !form.motivoNoActividad) return { msg: 'Selecciona el motivo por el que no se realizó la actividad.', id: 'motivoNoActividad' };
                if (form.actividadRealizada === true && !form.resultado) return { msg: 'Selecciona el resultado de la gestión.', id: 'resultadoGestion' };
            }
        }
        return null; 
    };

    const validationError = validateForm();
    const isReady = validationError === null;

    const submit = () => {
        if (!isReady) {
            setAlertConfig({ isOpen: true, message: validationError.msg, focusId: validationError.id });
            return;
        }

        const durationMin = Math.round((Date.now() - startMs) / 60000);
        const resultadoBase = visitaNoRealizada ? 'No realizada' : form.resultado;
        
        // 5. Tu concatenación impecable se mantiene
        let resultadoConcatenado = resultadoBase;

        if (gps.status === 'ok') {
            resultadoConcatenado += ` | GPS: ${gps.lat}, ${gps.lng}`;
        }

        if (needsAmountDate && form.pagoMonto && form.pagoFecha) {
            resultadoConcatenado += ` | Promesa: $${form.pagoMonto} (${form.pagoFecha})`;
        }

        if (form.notes && form.notes.trim() !== '') {
            resultadoConcatenado += ` | Notas: ${form.notes.trim()}`;
        }
        
        onSubmit({
            ...form,
            resultado: resultadoConcatenado, 
            tipoGestion: form.tipoGestion || '—', // Usamos el input capturado directamente
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
                
                {/* ── HEADER ── */}
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

                {/* ── CUERPO DEL FORMULARIO ── */}
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
                        <YesNo id="visitaRealizada" value={form.visitaRealizada} onChange={v => setForm(p => ({ ...p, visitaRealizada: v, clienteEncontrado: null, actividadRealizada: null, motivoNoVisita: '' }))} />
                    </div>

                    {visitaNoRealizada && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿Por qué no se realizó?</p>
                            <select id="motivoNoVisita" value={form.motivoNoVisita}
                                onChange={e => setForm(p => ({ ...p, motivoNoVisita: e.target.value }))}
                                className="input-cell focus:ring-rose-400">
                                <option value="" disabled>Seleccionar motivo...</option>
                                {motivosNoVisita.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {/* 6. NUEVO: Input/Select de Tipo de Gestión dinámico */}
                    {!visitaNoRealizada && isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Tipo de Gestión *</label>
                            <select id="tipoGestion" value={form.tipoGestion} onChange={e => setForm(p => ({ ...p, tipoGestion: e.target.value }))} className="input-cell focus:ring-rose-400">
                                <option value="" disabled>Seleccionar tipo de gestión...</option>
                                {tiposGestionFiltrados.map(t => <option key={t.id || t.nombre} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1 mt-5">¿Se encontró al cliente?</label>
                            <YesNo id="clienteEncontrado" value={form.clienteEncontrado} onChange={v => setForm(p => ({ ...p, clienteEncontrado: v }))} />
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.clienteEncontrado !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Actualizar Estatus de Cartera *</label>
                            <select id="resultadoCartera" value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell focus:ring-rose-400">
                                <option value="" disabled>Seleccionar resultado...</option>
                                {estatusCartera.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200 bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                            <label className="text-[8px] font-black text-violet-500 uppercase tracking-widest mb-1 block">Actividad Planeada / Realizada *</label>
                            <input id="tipoGestion" type="text" value={form.tipoGestion} onChange={e => setForm(p => ({ ...p, tipoGestion: e.target.value }))} className="input-cell bg-white focus:ring-violet-400 w-full" placeholder="Describe la actividad..." />

                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-4">¿Se completó la actividad?</label>
                            <YesNo id="actividadRealizada" value={form.actividadRealizada} onChange={v => setForm(p => ({ ...p, actividadRealizada: v, motivoNoActividad: '' }))} />
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === false && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿Por qué no se realizó la actividad?</p>
                            <select id="motivoNoActividad" value={form.motivoNoActividad || ''}
                                onChange={e => setForm(p => ({ ...p, motivoNoActividad: e.target.value }))}
                                className="input-cell focus:ring-rose-400">
                                <option value="" disabled>Seleccionar motivo...</option>
                                {motivosNoActividad.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === true && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Resultado de la Gestión</label>
                            <select id="resultadoGestion" value={form.resultado}
                                onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))}
                                className="input-cell focus:ring-rose-400">
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
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                               <div id="pagoMonto" tabIndex="-1" className="outline-none focus:ring-2 focus:ring-rose-400 rounded-xl">
                                    <FormattedNumberInput
                                        label="¿Cuánto? *"
                                        type="currency"
                                        value={form.pagoMonto}
                                        onChange={val => setForm(p => ({ ...p, pagoMonto: val }))}
                                        placeholder="$ 0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">¿Para cuándo? *</label>
                                    <input id="pagoFecha" type="date" value={form.pagoFecha}
                                        onChange={e => setForm(p => ({ ...p, pagoFecha: e.target.value }))}
                                        className="input-cell focus:ring-rose-400" />
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
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">Evidencia Fotográfica (Opcional)</label>
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
                </div>

                {/* ── FOOTER Y BOTÓN ── */}
                <div className="sticky bottom-0 bg-white px-6 pb-6 pt-4 border-t border-slate-50">
                    <button onClick={submit}
                        className={`w-full py-5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl
                        ${isReady ? 'bg-primary text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95' : 'bg-slate-50 border-2 border-slate-200 text-slate-400 opacity-70'}`}>
                        Registrar Gestión
                    </button>
                </div>
            </div>

            {/* MODAL DE ERROR DE VALIDACIÓN */}
            <UIModal
                isOpen={alertConfig.isOpen}
                onClose={handleCloseAlert}
                type="warning"
                title="Datos Incompletos"
                message={alertConfig.message}
                showConfirmButton={true}
                confirmButtonText="Completar"
                onConfirm={handleCloseAlert}
            />
        </div>
    );
};

// ── Unplanned Visit Form (Visita No Planeada) ────────────────────────────────
const UnplannedForm = ({ onAdd, onCancel, isFrozen }) => {
    const { selectedRole } = useRole();
    const { tiposGestion = [], estatusCartera = [] } = useCatalogs() || {};
    const { mockDatabase: directorio = [] } = useAgenda();

    const [form, setForm] = useState({ 
        name: '', tipoGestion: '', resultado: '', 
        notes: '', pagoMonto: '', pagoFecha: '', idContacto: null 
    });

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // ESTADO PARA EL MODAL DE ERROR CON AUTO-FOCUS
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', focusId: null });

    const isCompromiso = form.resultado.toLowerCase().includes('compromiso');
    const isPromesa = form.resultado.toLowerCase().includes('promesa');
    const needsAmountDate = isCompromiso || isPromesa;
    
    const tiposGestionFiltrados = useMemo(() => {
        if (!tiposGestion || tiposGestion.length === 0) return [];
        const canal = selectedRole?.canal?.toUpperCase();
        if (canal === 'COBRANZA') {
            const excluidos = ['PROMOCIÓN', 'VENTA', 'COLOCACIÓN'];
            return tiposGestion.filter(t => !excluidos.some(termino => t.nombre.toUpperCase().includes(termino)));
        }
        return tiposGestion;
    }, [tiposGestion, selectedRole]);

    const handleNameChange = (e) => {
        const val = e.target.value.toUpperCase();
        setForm(p => ({ ...p, name: val, idContacto: null })); 

        if (val.trim().length >= 2) {
            const matches = directorio.filter(c => 
                (c.nombre || c.name || '').toUpperCase().includes(val)
            ).slice(0, 5); 
            
            setSuggestions(matches);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectContact = (contact) => {
        setForm(p => ({
            ...p,
            name: contact.nombre || contact.name,
            idContacto: contact.id_contacto || contact.idContacto || contact.id || null
        }));
        setShowSuggestions(false);
    };

    // Función auxiliar para cerrar la alerta y poner foco
    const handleCloseAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        if (alertConfig.focusId) {
            setTimeout(() => document.getElementById(alertConfig.focusId)?.focus(), 100);
        }
    };

    // NUEVO: Barrera de validación estricta
    const validateForm = () => {
        if (!form.name || form.name.trim() === '') return { msg: 'Por favor, ingresa el Nombre del Cliente.', id: 'unplanned-name' };
        if (!form.tipoGestion || form.tipoGestion === '') return { msg: 'Por favor, selecciona un Tipo de Gestión.', id: 'unplanned-tipo' };
        if (!form.resultado || form.resultado === '') return { msg: 'Por favor, selecciona el Resultado de la visita.', id: 'unplanned-resultado' };
        
        if (needsAmountDate) {
            if (!form.pagoMonto) return { msg: 'Especifica el Monto de la promesa o compromiso.', id: 'unplanned-monto' };
            if (!form.pagoFecha) return { msg: 'Especifica la Fecha de la promesa o compromiso.', id: 'unplanned-fecha' };
        }
        return null;
    };

    // Evaluamos en tiempo real si el formulario está listo
    const validationError = validateForm();
    const isReady = validationError === null;
    
    const submit = () => {
        if (isFrozen) return;

        // Si la barrera detecta errores, abrimos el modal
        if (!isReady) {
            setAlertConfig({ isOpen: true, message: validationError.msg, focusId: validationError.id });
            return;
        }

        onAdd({
            name: form.name.toUpperCase(),
            idContacto: form.idContacto, 
            _segment: 'Imprevisto',
            checkInTime: nowTimeStr(),
            tipoGestion: form.tipoGestion,
            resultado: form.resultado,
            notes: form.notes,
            pagoMonto: form.pagoMonto,
            pagoFecha: form.pagoFecha
        });
    };

    if (isFrozen) return null;

    return (
        <div className="mt-6 border-2 border-dashed border-rose-200 rounded-3xl p-6 bg-rose-50/30 animate-in slide-in-from-bottom-4 duration-300 space-y-4 relative">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Visita No Planeada</h4>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 shadow-sm">
                    <X size={15} />
                </button>
            </div>

            <div className="relative">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Nombre del Cliente *</label>
                <input 
                    id="unplanned-name" // <-- ID AGREGADO
                    type="text" 
                    value={form.name} 
                    onChange={handleNameChange}
                    onFocus={() => form.name.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                    placeholder="Escribe para buscar en tu cartera..." 
                    className="input-cell uppercase font-bold w-full focus:ring-rose-400" 
                />
                
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-slate-200 shadow-xl rounded-xl mt-1 max-h-48 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">
                        {suggestions.map((s, i) => (
                            <li key={i}
                                onMouseDown={(e) => { e.preventDefault(); selectContact(s); }}
                                className="px-4 py-3 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                            >
                                {s.nombre || s.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tipo Gestión *</label>
                    <select id="unplanned-tipo" value={form.tipoGestion} onChange={e => setForm(p => ({ ...p, tipoGestion: e.target.value }))} className="input-cell text-[10px] w-full focus:ring-rose-400">
                        <option value="" disabled>Seleccionar tipo...</option>
                        {tiposGestionFiltrados.length > 0 
                            ? tiposGestionFiltrados.map(t => <option key={t.id || t.nombre} value={t.nombre}>{t.nombre}</option>)
                            : <option disabled>Cargando catálogo...</option>
                        }
                    </select>
                </div>
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Resultado *</label>
                    <select id="unplanned-resultado" value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell text-[10px] w-full focus:ring-rose-400">
                        <option value="" disabled>Seleccionar resultado...</option>
                        {estatusCartera.length > 0
                            ? estatusCartera.map(e => <option key={e.id || e.nombre} value={e.nombre}>{e.nombre}</option>)
                            : <option disabled>Cargando catálogo...</option>
                        }
                    </select>
                </div>
            </div>

            {needsAmountDate && (
                <div className={`p-3 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${isCompromiso ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCompromiso ? 'text-blue-700' : 'text-indigo-700'}`}>
                        {isCompromiso ? 'Datos del Compromiso de Pago *' : 'Datos de la Promesa de Pago *'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div id="unplanned-monto" tabIndex="-1" className="outline-none focus:ring-2 focus:ring-rose-400 rounded-xl">
                            <FormattedNumberInput
                                label="Monto *"
                                type="currency"
                                value={form.pagoMonto}
                                onChange={val => setForm(p => ({ ...p, pagoMonto: val }))}
                                placeholder="$ 0.00"
                            />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fecha *</label>
                            <input id="unplanned-fecha" type="date" value={form.pagoFecha}
                                onChange={e => setForm(p => ({ ...p, pagoFecha: e.target.value }))}
                                className="input-cell w-full focus:ring-rose-400" />
                        </div>
                    </div>
                </div>
            )}
            <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Notas</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones extras…" className="input-cell w-full" />
            </div>

            {/* BOTÓN CON ESTILO DINÁMICO */}
            <button onClick={submit}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md 
                ${isReady ? 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-lg active:scale-95' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                Registrar Imprevisto
            </button>

            {/* MODAL DE ERROR */}
            <UIModal
                isOpen={alertConfig.isOpen}
                onClose={handleCloseAlert}
                type="warning"
                title="Datos Incompletos"
                message={alertConfig.message}
                showConfirmButton={true}
                confirmButtonText="Revisar"
                onConfirm={handleCloseAlert}
            />
        </div>
    );
};

// ── Visit Card ───────────────────────────────────────────────────────────────
const VisitCard = ({ visit, checkIn, onCheckIn, isFrozen }) => {
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
            ) : isFrozen ? (
                <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
                    <Lock size={14} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">Bloqueado</span>
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
const FollowUpCard = ({ followUp, checkIn, onSetTime, onCheckIn, isFrozen }) => {
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

            {!isDone && !isFrozen && (
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
            ) : isFrozen ? (
                <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
                    <Lock size={14} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">Bloqueado</span>
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

const MoneyInput = ({ value, onChange, isCount, disabled }) => (
    <div className="w-[84px] text-center">
        <FormattedNumberInput
            type={isCount ? "number" : "currency"}
            value={value}
            onChange={onChange}
            placeholder={isCount ? '0' : '$ 0.00'}
            disabled={disabled}
        />
    </div>
);

const KpiRealPanel = ({ kpiCompromisos, kpiReal, onUpdate, isFrozen }) => {
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
                                                    <MoneyInput value={real} onChange={v => onUpdate(key, v)} isCount={isCount} disabled={isFrozen} />
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

// ── COMPONENTE RAÍZ — EjecucionOperativo ───────
const EjecucionOperativoContent = () => {
    const { currentAgenda, registerCheckIn, addUnplannedVisit, getVisibleSegments,
        scheduleFollowUp, scheduledFollowUps, updateKpiReal, updateAgendaStatus } = useAgenda();
    const [modalVisit, setModalVisit] = useState(null);
    const [showUnplanned, setShowUnplanned] = useState(false);
    const [followUpTimes, setFollowUpTimes] = useState({});
    
    // ── NUEVO: ESTADO PARA MODAL DE GUARDADO DEFINITIVO ──
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '' });

    const checkIns = currentAgenda.checkIns || {};
    const unplannedVisits = currentAgenda.unplannedVisits || [];
    const todayISO = new Date().toISOString().slice(0, 10);

    const allFollowUps = scheduledFollowUps || [];
    const todayFollowUps = allFollowUps
        .filter(fu => !fu.compromisoFecha || fu.compromisoFecha === todayISO)
        .map(fu => ({ ...fu, time: followUpTimes[fu.id] ?? fu.time }));
    const setFollowUpTime = (id, time) => setFollowUpTimes(prev => ({ ...prev, [id]: time }));

    // ── LÓGICA DE CONGELAMIENTO (isFrozen) ──
    const isFrozen = currentAgenda.status === 'ejecutada' || currentAgenda.status === 'completada';

    // Permitimos renderizar la vista solo si está aprobada o si ya está ejecutada
    if (currentAgenda.status !== 'aprobada' && currentAgenda.status !== 'ejecutada' && currentAgenda.status !== 'completada') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
                <BlockedScreen status={currentAgenda.status} />
            </div>
        );
    }

    const getAllVisits = () => {
        const visits = [];
        
        // 1. LECTURA DINÁMICA: Exploramos todas las llaves que mandó el JSON de la BD
        const segmentosDB = currentAgenda.segments || {};
        
        Object.entries(segmentosDB).forEach(([nombreBloque, arregloVisitas]) => {
            if (Array.isArray(arregloVisitas)) {
                arregloVisitas.forEach(v => {
                    // Omitimos registros vacíos o sin nombre por seguridad
                    if (!v || !v.name) return;

                    // 2. Evaluamos si la visita ya está gestionada en Base de Datos
                    const isFinalizada = v.statusAction === 'FINALIZADA' || v.statusAction === 'NO REALIZADA' || v.estado === 'FINALIZADA';
                    
                    if (isFinalizada && !checkIns[v.id]) {
                        checkIns[v.id] = {
                            resultado: v.managementResult || v.resultado,
                            visitaRealizada: v.managementRealized || v.realizada,
                            checkInTime: v.time,
                            isFromDB: true
                        };
                    }
                    
                    // 3. Añadimos la visita forzando el nombre del bloque exacto que viene del JSON
                    visits.push({ 
                        ...v, 
                        _segment: nombreBloque, 
                        isUnplanned: nombreBloque === 'Visita No Planeada' || nombreBloque === 'Imprevisto' 
                    });
                });
            }
        });
        
        // 4. Agregamos los imprevistos "locales" (los que el usuario acaba de agregar en la interfaz antes de recargar)
        const localUnplanned = (unplannedVisits || []).map(v => ({ 
            ...v, 
            _segment: v._segment || 'Visita No Planeada', 
            isUnplanned: true 
        }));
        
        // 5. Unimos ambas listas y ordenamos cronológicamente
        const listaFinal = [...visits, ...localUnplanned];
        listaFinal.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
        
        return listaFinal;
    };

    const allVisits = getAllVisits();
    
    const done = allVisits.filter(v => checkIns[v.id] || v._dbCheckIn || v.isUnplanned).length;
    const total = allVisits.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const todayStr = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

    // ── FUNCIÓN DE GUARDADO DEFINITIVO ──
    const handleFinalizarEjecucion = async () => {
        try {
            await api.put(`/agenda/plan/${currentAgenda.id}/estatus`, { 
                estatus: 'ejecutada', 
                nota: 'Ejecución finalizada por el operativo' 
            });
            updateAgendaStatus(currentAgenda.id, 'ejecutada');
            setShowConfirmModal(false);
            LoggerService.info('Ejecución finalizada correctamente', { idPlan: currentAgenda.id });
        } catch (error) {
            LoggerService.error('Error al finalizar la ejecución', error);
            setShowConfirmModal(false);
            // 2. Reemplazamos el alert() por el estado del modal
            setErrorModal({
                isOpen: true,
                message: "No se pudo conectar con el servidor para finalizar la ejecución."
            });
        }
    };

    const handleIntentarFinalizar = () => {
        if (pct < 100) {
            setAlertConfig({ 
                isOpen: true, 
                message: `Tu avance actual es del ${pct}%. Debes registrar todas tus gestiones y seguimientos para poder hacer el guardado definitivo.` 
            });
            return;
        }
        // Si el avance es del 100%, mostramos el modal de confirmación original
        setShowConfirmModal(true);
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-32 px-4 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Si está congelada, mostramos un banner informativo */}
            {isFrozen && (
                <div className="mt-8 mb-6 bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Lock className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">Ejecución Finalizada</h3>
                        <p className="text-blue-700 text-sm font-medium mt-1">Has realizado el Guardado Definitivo. Los registros han sido bloqueados para este plan puedes ver el resumen en la pestaña de "Cierre".</p>
                    </div>
                </div>
            )}

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
                const allFinished = allVisits.filter(v => checkIns[v.id] || v._dbCheckIn || v.isUnplanned);
                const compromisos = allFinished.filter(c => {
                    const res = checkIns[c.id]?.resultado || c._dbCheckIn?.resultado || c.resultado || '';
                    return res.toLowerCase().includes('compromiso') || res.toLowerCase().includes('promesa');
                });
                const totalMonto = compromisos.reduce((s, c) => {
                    const monto = checkIns[c.id]?.pagoMonto || c.pagoMonto || 0;
                    return s + Number(monto);
                }, 0);
                const noRealizadas = allFinished.filter(c => {
                    const res = checkIns[c.id]?.resultado || c._dbCheckIn?.resultado || c.resultado || '';
                    return res.toLowerCase().includes('no realizada');
                }).length;

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
                        const doneCount = visits.filter(v => checkIns[v.id] || v._dbCheckIn || v.isUnplanned).length;
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
                                    {visits.map((v) => (
                                        <VisitCard 
                                            key={v.id} 
                                            visit={v} 
                                            checkIn={checkIns[v.id] || v._dbCheckIn || (v.isUnplanned ? v : null)} 
                                            onCheckIn={setModalVisit} 
                                            isFrozen={isFrozen}
                                        />
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
                            <FollowUpCard key={fu.id} followUp={fu} checkIn={checkIns[fu.id]} onSetTime={setFollowUpTime} onCheckIn={setModalVisit} isFrozen={isFrozen} />
                        ))}
                    </div>
                </div>
            )}

            <KpiRealPanel kpiCompromisos={currentAgenda.kpiCompromisos || {}} kpiReal={currentAgenda.kpiReal || {}} onUpdate={updateKpiReal || (() => { })} isFrozen={isFrozen} />

            {!isFrozen && (
                showUnplanned ? (
                    <UnplannedForm onAdd={data => { addUnplannedVisit(data); setShowUnplanned(false); }} onCancel={() => setShowUnplanned(false)} isFrozen={isFrozen} />
                ) : (
                    <button onClick={() => setShowUnplanned(true)}
                        className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-500 py-5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest">
                        <Plus size={16} /> Agregar Visita No Planeada
                    </button>
                )
            )}

            {modalVisit && !isFrozen && (
                <CheckInModal visit={modalVisit} onClose={() => setModalVisit(null)} onSubmit={data => {
                    registerCheckIn(modalVisit.id, data);
                    if (data.resultado?.toLowerCase().includes('compromiso') && data.pagoFecha) {
                        scheduleFollowUp(modalVisit, { fecha: data.pagoFecha, monto: data.pagoMonto });
                    }
                    setModalVisit(null);
                }} />
            )}

            {/* ── BOTÓN FLOTANTE: GUARDADO DEFINITIVO ── */}
            {currentAgenda.status === 'aprobada' && (
                <footer className="fixed bottom-0 left-0 right-0 md:relative md:mt-12 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 md:p-6 flex justify-end md:rounded-[32px] md:border-none md:bg-slate-900 md:shadow-2xl">
                    <div className="flex flex-col md:items-end w-full md:w-auto">
                        <p className="hidden md:block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 text-right">Asegúrate de registrar todas tus visitas antes de continuar.</p>
                        <button 
                            onClick={handleIntentarFinalizar}
                            className="w-full md:w-auto bg-indigo-950 md:bg-white text-white md:text-indigo-950 px-12 py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Lock size={16} /> Guardado Definitivo
                        </button>
                    </div>
                </footer>
            )}

            {/* Modal de Confirmación */}
            <UIModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                type="info"
                title="¿Finalizar Ejecución?"
                message="Al hacer el guardado definitivo, se bloquearán los inputs y ya no podrás registrar nuevas gestiones ni imprevistos. Asegúrate de haber completado todo."
                showCancel={true}
                cancelText="Revisar de nuevo"
                confirmText="Sí, finalizar ejecución"
                onConfirm={handleFinalizarEjecucion}
            />

            <UIModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                title="Error de Conexión"
                message={errorModal.message}
                type="danger"
            />

            <UIModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ isOpen: false, message: '' })}
                type="warning"
                title="Ejecución Incompleta"
                message={alertConfig.message}
                showConfirmButton={true}
                confirmButtonText="Entendido"
            />
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