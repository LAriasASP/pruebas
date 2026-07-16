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
        if (resultadosGestion.length === 0) return ['REALIZADO', 'NO REALIZADO'];
        return resultadosGestion.map(r => r.nombre.toUpperCase());
    }, [resultadosGestion]);

    const STATUS_STYLES = useMemo(() => {
        const config = {};
        estadosAgenda.forEach(est => {
            const key = est.nombre.toLowerCase();
            const upperLabel = String(est.nombre).toUpperCase();
            if (key.includes('borrador')) config[key] = { label: upperLabel, bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' };
            else if (key.includes('pendient')) config[key] = { label: upperLabel, bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' };
            else if (key.includes('aprobada') || key.includes('autoriz')) config[key] = { label: upperLabel, bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' };
            else if (key.includes('modif') || key.includes('rechaz')) config[key] = { label: upperLabel, bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' };
            else config[key] = { label: upperLabel, bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' };
        });
        
        if (!config['borrador']) config['borrador'] = { label: 'BORRADOR', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' };
        if (!config['pendiente']) config['pendiente'] = { label: 'PENDIENTE', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' };
        if (!config['aprobada']) config['aprobada'] = { label: 'AUTORIZADA', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' };
        if (!config['requiere_modificacion']) config['requiere_modificacion'] = { label: 'REQ. MODIFICACIÓN', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' };
        
        return config;
    }, [estadosAgenda]);

    const blockedScreenCfg = useMemo(() => ({
        borrador: { Icon: FileText, bg: 'bg-slate-50', ic: 'text-slate-400', title: 'AGENDA NO CERTIFICADA', msg: 'COMPLETA Y CERTIFICA TU AGENDA EN PLANEACIÓN PARA HABILITAR LA EJECUCIÓN.' },
        pendiente: { Icon: Clock, bg: 'bg-amber-50', ic: 'text-amber-500', title: 'ESPERANDO AUTORIZACIÓN', msg: 'TU AGENDA ESTÁ EN REVISIÓN. TU JEFE DEBE APROBARLA ANTES DE QUE PUEDAS INICIAR LA RUTA.' },
        requiere_modificacion: { Icon: AlertCircle, bg: 'bg-red-50', ic: 'text-red-500', title: 'REQUIERE MODIFICACIONES', msg: 'TU JEFE SOLICITÓ AJUSTES. REVISA LA PESTAÑA PLANEACIÓN, CORRIGE Y RE-CERTIFICA.' },
    }), []);

    return { SEG_CFG, RESULTADO_BADGE, MOCK_RESULTADOS, STATUS_STYLES, blockedScreenCfg };
};


// ── Contexto para proveer UI Dinámica a los subcomponentes ───────────────────
const DynamicUIContext = createContext();
const useDynamicUIContext = () => useContext(DynamicUIContext);


// ── Helpers BLINDADOS ────────────────────────────────────────────────────────
const handleNumericChange = (e, callback, limit = null) => {
    let cleanValue = String(e.target.value).replace(/\D/g, '');
    if (limit && cleanValue.length > limit) {
        cleanValue = cleanValue.slice(0, limit);
    }
    e.target.value = cleanValue; 
    callback(cleanValue === '' ? '' : Number(cleanValue));
};

const formatCurrency = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
};

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
    return <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${c.badge}`}>{String(c.label).toUpperCase()}</span>;
};

const ResultBadge = ({ resultado }) => {
    const { RESULTADO_BADGE } = useDynamicUIContext();
    const cls = RESULTADO_BADGE[resultado] || 'bg-slate-100 text-slate-600';
    return <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${cls}`}>{String(resultado).toUpperCase()}</span>;
};

const nowTimeStr = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
};

// ── GPS Hook ─────────────────────────────────────────────────────────────────
const useGPS = (active) => {
    const [state, setState] = useState({ status: 'idle', lat: null, lng: null, errorCode: null, capturedAt: null });

    const requestPosition = () => {
        setState(prev => ({ ...prev, status: 'loading', errorCode: null }));
        if (!navigator.geolocation) {
            setState({ status: 'error', lat: null, lng: null, errorCode: 2, capturedAt: null });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            p => setState({
                status: 'ok',
                lat: p.coords.latitude.toFixed(5),
                lng: p.coords.longitude.toFixed(5),
                errorCode: null,
                capturedAt: new Date().toISOString()
            }),
            err => setState({ status: 'error', lat: null, lng: null, errorCode: err?.code ?? 2, capturedAt: null }),
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    useEffect(() => {
        if (!active) { setState({ status: 'idle', lat: null, lng: null, errorCode: null, capturedAt: null }); return; }
        requestPosition();
    }, [active]);

    return { ...state, retry: requestPosition };
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
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight mb-3">{String(c.title).toUpperCase()}</h2>
            <p className="text-sm text-accent font-black uppercase leading-relaxed max-w-xs">{String(c.msg).toUpperCase()}</p>
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
    const { selectedRole } = useRole();
    const { 
        motivosNoVisita = [], 
        estatusCartera = [], 
        motivosNoActividad = [], 
        resultadosGestion = [], 
        subEstatus = [],
        tiposGestion = [] 
    } = useCatalogs() || {};

    const isCarteraSegment = CARTERA_SEGS.includes(visit._segment);

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
        tipoGestion: visit.activity || visit.typeVisitManagement || visit.typeManagement || visit.typeIntegration || '',
        subestatus: 'N/A',
        estatusCartera: '',
        pagoMonto: '', pagoFecha: '',
        notes: '', photoUrl: null
    });
    
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', focusId: null });
    const [gpsErrorModal, setGpsErrorModal] = useState({ isOpen: false, message: '' });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [startMs] = useState(() => Date.now());
    const [openTime] = useState(nowTimeStr);
    const gps = useGPS(true);
    const fileRef = useRef(null);

    const isCompromiso = String(form.resultado).toUpperCase().includes('COMPROMISO');
    const isPromesa = String(form.resultado).toUpperCase().includes('PROMESA');
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
        if (form.visitaRealizada === null) return { msg: 'INDICA SI SE REALIZÓ LA VISITA.', id: 'visitaRealizada' };
        
        if (visitaNoRealizada) {
            if (!form.motivoNoVisita) return { msg: 'SELECCIONA EL MOTIVO POR EL CUAL NO SE REALIZÓ LA VISITA.', id: 'motivoNoVisita' };
        } else {
            if (!form.tipoGestion || form.tipoGestion.trim() === '') {
                return { msg: 'POR FAVOR, CAPTURA EL TIPO DE GESTIÓN O ACTIVIDAD REALIZADA.', id: 'tipoGestion' };
            }

            if (isCarteraSegment) {
                if (form.clienteEncontrado === null) return { msg: 'INDICA SI ENCONTRASTE AL CLIENTE.', id: 'clienteEncontrado' };
                if (!form.resultado) return { msg: 'SELECCIONA EL ESTATUS ACTUALIZADO DE LA CARTERA.', id: 'resultadoCartera' };
            } else {
                if (form.actividadRealizada === null) return { msg: 'INDICA SI SE COMPLETÓ LA ACTIVIDAD.', id: 'actividadRealizada' };
                if (form.actividadRealizada === false && !form.motivoNoActividad) return { msg: 'SELECCIONA EL MOTIVO POR EL QUE NO SE REALIZÓ LA ACTIVIDAD.', id: 'motivoNoActividad' };
                if (form.actividadRealizada === true && !form.resultado) return { msg: 'SELECCIONA EL RESULTADO DE LA GESTIÓN.', id: 'resultadoGestion' };
            }

            if (needsAmountDate) {
                if (!form.pagoMonto) return { msg: 'ESPECIFICA EL MONTO DE LA PROMESA O COMPROMISO.', id: 'pagoMonto' };
                if (!form.pagoFecha) return { msg: 'ESPECIFICA LA FECHA DE LA PROMESA O COMPROMISO.', id: 'pagoFecha' };
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

        if (gps.status === 'loading') {
            setGpsErrorModal({
                isOpen: true,
                message: 'AÚN ESTAMOS OBTENIENDO TU UBICACIÓN GPS. POR FAVOR ESPERA UNOS SEGUNDOS Y VUELVE A INTENTARLO.'
            });
            return;
        }
        if (gps.status !== 'ok' || !gps.lat || !gps.lng) {
            const msg = gps.errorCode === 1
                ? 'LA GEOLOCALIZACIÓN ES OBLIGATORIA PARA REGISTRAR LA VISITA. HABILITA EL PERMISO DE UBICACIÓN EN TU NAVEGADOR Y VUELVE A INTENTARLO.'
                : 'NO FUE POSIBLE OBTENER TU UBICACIÓN GPS. VERIFICA TU SEÑAL Y VUELVE A INTENTARLO.';
            setGpsErrorModal({ isOpen: true, message: msg });
            return;
        }

        const durationMin = Math.round((Date.now() - startMs) / 60000);
        const resultadoBase = visitaNoRealizada ? 'NO REALIZADA' : String(form.resultado).toUpperCase();

        let resultadoConcatenado = resultadoBase;
        resultadoConcatenado += ` | GPS: ${gps.lat}, ${gps.lng}`;

        if (needsAmountDate && form.pagoMonto && form.pagoFecha) {
            resultadoConcatenado += ` | PROMESA: $${form.pagoMonto} (${form.pagoFecha})`;
        }

        if (form.notes && form.notes.trim() !== '') {
            resultadoConcatenado += ` | NOTAS: ${String(form.notes).trim().toUpperCase()}`;
        }

        onSubmit({
            ...form,
            resultado: resultadoConcatenado,
            tipoGestion: String(form.tipoGestion || '—').toUpperCase(),
            checkInTime: nowTimeStr(),
            visitaOpenTime: openTime,
            visitaDuration: durationMin,
            latitud: gps.lat,
            longitud: gps.lng,
            timestampLocal: gps.capturedAt || new Date().toISOString(),
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
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REGISTRAR GESTIÓN</p>
                        <h3 className="text-[15px] font-black text-primary uppercase leading-tight mt-0.5">{String(visit.name).toUpperCase()}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <SegBadge seg={visit._segment} />
                            {(visit.typeVisitManagement || visit.typeManagement) && (
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{String(visit.typeVisitManagement || visit.typeManagement).toUpperCase()}</span>
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
                        {gps.status === 'loading' && 'CAPTURANDO COORDENADAS GPS...'}
                        {gps.status === 'ok' && `GPS: ${gps.lat}, ${gps.lng}`}
                        {gps.status === 'error' && 'UBICACIÓN NO DISPONIBLE — GPS OBLIGATORIO'}
                        {gps.status === 'idle' && 'INICIALIZANDO...'}
                        {gps.status === 'error' && (
                            <button
                                type="button"
                                onClick={gps.retry}
                                className="ml-auto bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-[9px] tracking-widest font-black uppercase"
                            >
                                REINTENTAR
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1">¿SE REALIZÓ LA VISITA?</label>
                        <YesNo id="visitaRealizada" value={form.visitaRealizada} onChange={v => setForm(p => ({ ...p, visitaRealizada: v, clienteEncontrado: null, actividadRealizada: null, motivoNoVisita: '' }))} />
                    </div>

                    {visitaNoRealizada && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿POR QUÉ NO SE REALIZÓ?</p>
                            <select id="motivoNoVisita" value={form.motivoNoVisita}
                                onChange={e => setForm(p => ({ ...p, motivoNoVisita: e.target.value }))}
                                className="input-cell focus:ring-rose-400 font-bold uppercase text-[10px]">
                                <option value="" disabled>SELECCIONAR MOTIVO...</option>
                                {motivosNoVisita.map(m => <option key={m.id} value={m.nombre}>{String(m.nombre).toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">TIPO DE GESTIÓN *</label>
                            <select id="tipoGestion" value={form.tipoGestion} onChange={e => setForm(p => ({ ...p, tipoGestion: e.target.value }))} className="input-cell focus:ring-rose-400 font-bold uppercase text-[10px]">
                                <option value="" disabled>SELECCIONAR TIPO DE GESTIÓN...</option>
                                {tiposGestionFiltrados.map(t => <option key={t.id || t.nombre} value={t.nombre}>{String(t.nombre).toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1 mt-5">¿SE ENCONTRÓ AL CLIENTE?</label>
                            <YesNo id="clienteEncontrado" value={form.clienteEncontrado} onChange={v => setForm(p => ({ ...p, clienteEncontrado: v }))} />
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.clienteEncontrado !== null && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">ACTUALIZAR ESTATUS DE CARTERA *</label>
                            <select id="resultadoCartera" value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell focus:ring-rose-400 font-bold uppercase text-[10px]">
                                <option value="" disabled>SELECCIONAR RESULTADO...</option>
                                {estatusCartera.map(e => <option key={e.id} value={e.nombre}>{String(e.nombre).toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.visitaRealizada !== null && (
                        <div className="animate-in fade-in duration-200 bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                            <label className="text-[8px] font-black text-violet-500 uppercase tracking-widest mb-1 block">ACTIVIDAD PLANEADA / REALIZADA *</label>
                            <input id="tipoGestion" type="text" value={form.tipoGestion} onChange={e => setForm(p => ({ ...p, tipoGestion: String(e.target.value).toUpperCase() }))} className="input-cell bg-white focus:ring-violet-400 w-full font-bold uppercase text-[10px]" placeholder="DESCRIBE LA ACTIVIDAD..." />

                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-4">¿SE COMPLETÓ LA ACTIVIDAD?</label>
                            <YesNo id="actividadRealizada" value={form.actividadRealizada} onChange={v => setForm(p => ({ ...p, actividadRealizada: v, motivoNoActividad: '' }))} />
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === false && (
                        <div className="animate-in fade-in duration-200 bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                            <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest">¿POR QUÉ NO SE REALIZÓ LA ACTIVIDAD?</p>
                            <select id="motivoNoActividad" value={form.motivoNoActividad || ''}
                                onChange={e => setForm(p => ({ ...p, motivoNoActividad: e.target.value }))}
                                className="input-cell focus:ring-rose-400 font-bold uppercase text-[10px]">
                                <option value="" disabled>SELECCIONAR MOTIVO...</option>
                                {motivosNoActividad.map(m => <option key={m.id} value={m.nombre}>{String(m.nombre).toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && !isCarteraSegment && form.actividadRealizada === true && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">RESULTADO DE LA GESTIÓN</label>
                            <select id="resultadoGestion" value={form.resultado}
                                onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))}
                                className="input-cell focus:ring-rose-400 font-bold uppercase text-[10px]">
                                <option value="" disabled>SELECCIONAR RESULTADO...</option>
                                {resultadosGestion.map(r => <option key={r.id} value={r.nombre}>{String(r.nombre).toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}

                    {!visitaNoRealizada && isCarteraSegment && form.resultado && form.resultado !== '' && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">SUB-ESTATUS</label>
                            <select value={form.subestatus} onChange={e => setForm(p => ({ ...p, subestatus: e.target.value }))} className="input-cell font-bold uppercase text-[10px]">
                                <option value="N/A">N/A</option>
                                {subEstatus.map(s => <option key={s.id} value={s.nombre}>{String(s.nombre).toUpperCase()}</option>)}
                            </select>
                        </div>
                    )}

                    {needsAmountDate && (
                        <div className={`animate-in slide-in-from-top-2 duration-300 p-4 rounded-2xl border space-y-3 ${isCompromiso ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                            <div className="flex items-start gap-2">
                                <div className="flex-1">
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCompromiso ? 'text-blue-700' : 'text-indigo-700'}`}>
                                        {isCompromiso ? 'DATOS DEL COMPROMISO DE PAGO *' : 'DATOS DE LA PROMESA DE PAGO *'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                               <div id="pagoMonto" tabIndex="-1" className="outline-none focus:ring-2 focus:ring-rose-400 rounded-xl">
                                    <FormattedNumberInput
                                        label="¿CUÁNTO? *"
                                        type="currency"
                                        value={form.pagoMonto}
                                        onChange={val => setForm(p => ({ ...p, pagoMonto: val }))}
                                        placeholder="$ 0.00"
                                        className="font-bold text-[10px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">¿PARA CUÁNDO? *</label>
                                    <input id="pagoFecha" type="date" value={form.pagoFecha}
                                        onChange={e => setForm(p => ({ ...p, pagoFecha: e.target.value }))}
                                        className="input-cell focus:ring-rose-400 font-bold uppercase text-[10px]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {decisionTomada && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">NOTAS</label>
                            <textarea 
                                value={form.notes} 
                                onChange={e => setForm(p => ({ ...p, notes: String(e.target.value).toUpperCase() }))}
                                placeholder="OBSERVACIONES DE LA VISITA..." 
                                className="input-cell w-full !h-auto min-h-[120px] resize-y font-bold uppercase text-[10px] p-3 leading-relaxed" 
                            />
                        </div>
                    )}

                    {decisionTomada && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">EVIDENCIA FOTOGRÁFICA (OPCIONAL)</label>
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
                                    <Camera size={16} /> ADJUNTAR FOTO
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── FOOTER Y BOTÓN ── */}
                <div className="sticky bottom-0 bg-white px-6 pb-6 pt-4 border-t border-slate-50">
                    <button onClick={submit}
                        className={`w-full py-5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl
                        ${isReady ? 'bg-primary text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95' : 'bg-slate-50 border-2 border-slate-200 text-slate-400 opacity-70 cursor-not-allowed'}`}>
                        REGISTRAR GESTIÓN
                    </button>
                </div>
            </div>

            {/* MODALES DE ERROR */}
            <UIModal
                isOpen={alertConfig.isOpen}
                onClose={handleCloseAlert}
                type="warning"
                title="DATOS INCOMPLETOS"
                message={alertConfig.message}
                showConfirmButton={true}
                confirmButtonText="COMPLETAR"
                onConfirm={handleCloseAlert}
            />

            <UIModal
                isOpen={gpsErrorModal.isOpen}
                onClose={() => setGpsErrorModal({ isOpen: false, message: '' })}
                type="danger"
                title="GEOLOCALIZACIÓN OBLIGATORIA"
                message={gpsErrorModal.message}
                showConfirmButton={true}
                confirmButtonText="REINTENTAR GPS"
                onConfirm={() => {
                    setGpsErrorModal({ isOpen: false, message: '' });
                    if (gps.status !== 'loading') gps.retry();
                }}
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
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', focusId: null });
    
    const gps = useGPS(true);
    const [gpsErrorModal, setGpsErrorModal] = useState({ isOpen: false, message: '' });

    const isCompromiso = String(form.resultado).toUpperCase().includes('COMPROMISO');
    const isPromesa = String(form.resultado).toUpperCase().includes('PROMESA');
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
            name: String(contact.nombre || contact.name).toUpperCase(),
            idContacto: contact.id_contacto || contact.idContacto || contact.id || null
        }));
        setShowSuggestions(false);
    };

    const handleBlur = () => {
        setTimeout(() => {
            const exactMatch = directorio.find(item => (item.nombre || item.name || '').toUpperCase() === form.name.trim().toUpperCase());
            if (!exactMatch && form.name.trim() !== '') {
                setForm(p => ({ ...p, name: '', idContacto: null }));
            }
            setShowSuggestions(false);
        }, 150);
    };

    const handleCloseAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        if (alertConfig.focusId) {
            setTimeout(() => document.getElementById(alertConfig.focusId)?.focus(), 100);
        }
    };

    const validateForm = () => {
        if (!form.name || form.name.trim() === '') return { msg: 'POR FAVOR, INGRESA UN NOMBRE VÁLIDO DE LA CARTERA DE CLIENTES.', id: 'unplanned-name' };
        if (!form.tipoGestion || form.tipoGestion === '') return { msg: 'POR FAVOR, SELECCIONA UN TIPO DE GESTIÓN.', id: 'unplanned-tipo' };
        if (!form.resultado || form.resultado === '') return { msg: 'POR FAVOR, SELECCIONA EL RESULTADO DE LA VISITA.', id: 'unplanned-resultado' };
        
        if (needsAmountDate) {
            if (!form.pagoMonto) return { msg: 'ESPECIFICA EL MONTO DE LA PROMESA O COMPROMISO.', id: 'unplanned-monto' };
            if (!form.pagoFecha) return { msg: 'ESPECIFICA LA FECHA DE LA PROMESA O COMPROMISO.', id: 'unplanned-fecha' };
        }
        return null;
    };

    const validationError = validateForm();
    const isReady = validationError === null;
    
    const submit = () => {
        if (isFrozen) return;

        if (!isReady) {
            setAlertConfig({ isOpen: true, message: validationError.msg, focusId: validationError.id });
            return;
        }

        if (gps.status === 'loading') {
            setGpsErrorModal({
                isOpen: true,
                message: 'AÚN ESTAMOS OBTENIENDO TU UBICACIÓN GPS. POR FAVOR ESPERA UNOS SEGUNDOS Y VUELVE A INTENTARLO.'
            });
            return;
        }
        if (gps.status !== 'ok' || !gps.lat || !gps.lng) {
            const msg = gps.errorCode === 1
                ? 'LA GEOLOCALIZACIÓN ES OBLIGATORIA PARA REGISTRAR LA VISITA. HABILITA EL PERMISO DE UBICACIÓN EN TU NAVEGADOR Y VUELVE A INTENTARLO.'
                : 'NO FUE POSIBLE OBTENER TU UBICACIÓN GPS. VERIFICA TU SEÑAL Y VUELVE A INTENTARLO.';
            setGpsErrorModal({ isOpen: true, message: msg });
            return;
        }

        onAdd({
            name: form.name.toUpperCase(),
            idContacto: form.idContacto,
            _segment: 'Imprevisto',
            checkInTime: nowTimeStr(),
            tipoGestion: String(form.tipoGestion).toUpperCase(),
            resultado: String(form.resultado).toUpperCase(),
            notes: String(form.notes).toUpperCase(),
            pagoMonto: form.pagoMonto,
            pagoFecha: form.pagoFecha,
            latitud: gps.lat,
            longitud: gps.lng,
            timestampLocal: gps.capturedAt || new Date().toISOString(),
            lat: gps.lat, lng: gps.lng, gpsStatus: gps.status
        });
    };

    if (isFrozen) return null;

    return (
        <div className="mt-6 border-2 border-dashed border-rose-200 rounded-3xl p-6 bg-rose-50/30 animate-in slide-in-from-bottom-4 duration-300 space-y-4 relative">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">VISITA NO PLANEADA</h4>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 shadow-sm">
                    <X size={15} />
                </button>
            </div>

            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${gps.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : gps.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                {gps.status === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                {gps.status === 'loading' && 'CAPTURANDO COORDENADAS GPS...'}
                {gps.status === 'ok' && `GPS: ${gps.lat}, ${gps.lng}`}
                {gps.status === 'error' && 'UBICACIÓN NO DISPONIBLE — GPS OBLIGATORIO'}
                {gps.status === 'error' && (
                    <button
                        type="button"
                        onClick={gps.retry}
                        className="ml-auto bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-[9px] tracking-widest font-black uppercase"
                    >
                        REINTENTAR
                    </button>
                )}
            </div>

            <div className="relative">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">NOMBRE DEL CLIENTE *</label>
                <input 
                    id="unplanned-name"
                    type="text" 
                    value={form.name} 
                    onChange={handleNameChange}
                    onFocus={() => form.name.length >= 2 && setShowSuggestions(true)}
                    onBlur={handleBlur} 
                    placeholder="ESCRIBE PARA BUSCAR EN TU CARTERA..." 
                    className="input-cell uppercase font-bold w-full focus:ring-rose-400 text-[10px]" 
                />
                
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-slate-200 shadow-xl rounded-xl mt-1 max-h-48 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">
                        {suggestions.map((s, i) => (
                            <li key={i}
                                onMouseDown={(e) => { e.preventDefault(); selectContact(s); }}
                                className="px-4 py-3 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-50 last:border-0 transition-colors uppercase"
                            >
                                {String(s.nombre || s.name).toUpperCase()}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">TIPO GESTIÓN *</label>
                    <select id="unplanned-tipo" value={form.tipoGestion} onChange={e => setForm(p => ({ ...p, tipoGestion: e.target.value }))} className="input-cell text-[10px] font-bold uppercase w-full focus:ring-rose-400">
                        <option value="" disabled>SELECCIONAR TIPO...</option>
                        {tiposGestionFiltrados.length > 0 
                            ? tiposGestionFiltrados.map(t => <option key={t.id || t.nombre} value={t.nombre}>{String(t.nombre).toUpperCase()}</option>)
                            : <option disabled>CARGANDO CATÁLOGO...</option>
                        }
                    </select>
                </div>
                <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">RESULTADO *</label>
                    <select id="unplanned-resultado" value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} className="input-cell text-[10px] font-bold uppercase w-full focus:ring-rose-400">
                        <option value="" disabled>SELECCIONAR RESULTADO...</option>
                        {estatusCartera.length > 0
                            ? estatusCartera.map(e => <option key={e.id || e.nombre} value={e.nombre}>{String(e.nombre).toUpperCase()}</option>)
                            : <option disabled>CARGANDO CATÁLOGO...</option>
                        }
                    </select>
                </div>
            </div>

            {needsAmountDate && (
                <div className={`p-3 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${isCompromiso ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isCompromiso ? 'text-blue-700' : 'text-indigo-700'}`}>
                        {isCompromiso ? 'DATOS DEL COMPROMISO DE PAGO *' : 'DATOS DE LA PROMESA DE PAGO *'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div id="unplanned-monto" tabIndex="-1" className="outline-none focus:ring-2 focus:ring-rose-400 rounded-xl">
                            <FormattedNumberInput
                                label="MONTO *"
                                type="currency"
                                value={form.pagoMonto}
                                onChange={val => setForm(p => ({ ...p, pagoMonto: val }))}
                                placeholder="$ 0.00"
                                className="font-bold text-[10px]"
                            />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">FECHA *</label>
                            <input id="unplanned-fecha" type="date" value={form.pagoFecha}
                                onChange={e => setForm(p => ({ ...p, pagoFecha: e.target.value }))}
                                className="input-cell w-full focus:ring-rose-400 font-bold uppercase text-[10px]" />
                        </div>
                    </div>
                </div>
            )}
            <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">NOTAS</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: String(e.target.value).toUpperCase() }))} placeholder="OBSERVACIONES EXTRAS…" className="input-cell w-full font-bold uppercase text-[10px]" />
            </div>

            <button onClick={submit}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md 
                ${isReady ? 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-lg active:scale-95' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 cursor-not-allowed'}`}>
                REGISTRAR IMPREVISTO
            </button>

            <UIModal
                isOpen={alertConfig.isOpen}
                onClose={handleCloseAlert}
                type="warning"
                title="DATOS INCOMPLETOS"
                message={alertConfig.message}
                showConfirmButton={true}
                confirmButtonText="REVISAR"
                onConfirm={handleCloseAlert}
            />

            <UIModal
                isOpen={gpsErrorModal.isOpen}
                onClose={() => setGpsErrorModal({ isOpen: false, message: '' })}
                type="danger"
                title="GEOLOCALIZACIÓN OBLIGATORIA"
                message={gpsErrorModal.message}
                showConfirmButton={true}
                confirmButtonText="REINTENTAR GPS"
                onConfirm={() => {
                    setGpsErrorModal({ isOpen: false, message: '' });
                    if (gps.status !== 'loading') gps.retry();
                }}
            />
        </div>
    );
};

// ── Visit Card ───────────────────────────────────────────────────────────────
const VisitCard = ({ visit, checkIn, onCheckIn, isFrozen }) => {
    const { SEG_CFG, RESULTADO_BADGE } = useDynamicUIContext();
    const segCfg = SEG_CFG[visit._segment] || SEG_CFG['Imprevisto'] || { dot: 'bg-slate-400' };
    const isFinalizada = String(visit.statusAction).toUpperCase() === 'FINALIZADA'
        || String(visit.statusAction).toUpperCase() === 'NO REALIZADA'
        || String(visit.estado).toUpperCase() === 'FINALIZADA';
    const isDone = !!checkIn || isFinalizada;

    return (
        <div className={`flex items-center gap-4 px-5 py-4 transition-all duration-200 ${isDone ? 'bg-emerald-50/60' : 'bg-white hover:bg-slate-50/80'}`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 border-2 border-white transition-all ${isDone ? 'bg-emerald-500 ring-emerald-200' : `${segCfg.dot} ring-slate-100`}`} />
            <span className="text-[11px] font-black text-accent w-14 flex-shrink-0 font-mono">
                {visit.time || '—:——'}
            </span>
            <SegBadge seg={visit._segment} />
            <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-black uppercase truncate leading-tight ${isDone ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-primary'}`}>
                    {String(visit.name).toUpperCase()}
                </p>
                {(visit.activity || visit.typeVisitManagement || visit.typeManagement) && (
                    <p className="text-[10px] text-slate-400 font-medium uppercase truncate mt-0.5">
                        {String(visit.activity || visit.typeVisitManagement || visit.typeManagement).toUpperCase()}
                    </p>
                )}
                {isDone && checkIn?.resultado && (
                    <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full mt-1 uppercase ${RESULTADO_BADGE[checkIn.resultado] || 'bg-slate-100 text-slate-600'}`}>
                        {String(checkIn.resultado).toUpperCase()}
                    </span>
                )}
            </div>

            {CARTERA_SEGS.includes(visit._segment) && (visit.moraActual || visit.saldoActual) && (
                <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                    {visit.moraActual && Number(visit.moraActual) > 0 && (
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">
                            ⚠️ {visit.moraActual}D MORA
                        </span>
                    )}
                    {visit.saldoActual && (
                        <span className="text-[9px] font-semibold text-slate-400 uppercase">
                            SALDO: ${Number(visit.saldoActual).toLocaleString()}
                        </span>
                    )}
                    {visit.ultimoEstatus && (
                        <span className="text-[8px] text-slate-300 italic uppercase">ANT: {String(visit.ultimoEstatus).toUpperCase()}</span>
                    )}
                </div>
            )}

            {isDone && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0 text-slate-400">
                    {checkIn.checkInTime && (
                        <span className="flex items-center gap-1 text-[9px] uppercase">
                            <Clock size={9} /> {checkIn.checkInTime}
                        </span>
                    )}
                    {checkIn.gpsStatus === 'ok' && (
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 uppercase">
                            <Navigation size={9} /> GPS
                        </span>
                    )}
                </div>
            )}

            {isDone ? (
                <div className="flex items-center gap-1.5 text-emerald-600 flex-shrink-0">
                    <CheckCircle2 size={16} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">REGISTRADO</span>
                </div>
            ) : isFrozen ? (
                <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
                    <Lock size={14} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">BLOQUEADO</span>
                </div>
            ) : (
                <button
                    onClick={() => onCheckIn(visit)}
                    className="flex-shrink-0 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/20 whitespace-nowrap">
                    REGISTRAR GESTIÓN
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

            <span className="text-[11px] font-black text-blue-600 flex-shrink-0 uppercase">
                📅 {String(fmtDate(followUp.compromisoFecha)).toUpperCase()}
            </span>

            <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">SEGUIMIENTO</span>

            <SegBadge seg={followUp._segment} />

            <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-black uppercase truncate leading-tight
                    ${isDone ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-primary'}`}>
                    {String(followUp.name).toUpperCase()}
                </p>
                {followUp.compromisoCuanto && (
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        COMPROMISO: ${Number(followUp.compromisoCuanto).toLocaleString()}
                    </span>
                )}
                {isDone && checkIn?.resultado && (
                    <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full mt-1 uppercase
                        ${RESULTADO_BADGE[checkIn.resultado] || 'bg-slate-100 text-slate-600'}`}>
                        {String(checkIn.resultado).toUpperCase()}
                    </span>
                )}
            </div>

            {!isDone && !isFrozen && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">HORA:</label>
                    <input type="time" defaultValue={followUp.time || ''}
                        onChange={e => onSetTime(followUp.id, e.target.value)}
                        className="text-[11px] font-black border border-slate-200 rounded-lg px-2 py-1 bg-white text-primary uppercase" />
                </div>
            )}

            {isDone ? (
                <div className="flex items-center gap-1.5 text-emerald-600 flex-shrink-0">
                    <CheckCircle2 size={16} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">REGISTRADO</span>
                </div>
            ) : isFrozen ? (
                <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
                    <Lock size={14} />
                    <span className="text-[9px] font-black uppercase tracking-wide hidden md:inline">BLOQUEADO</span>
                </div>
            ) : (
                <button onClick={() => onCheckIn(followUp)}
                    className="flex-shrink-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/20 whitespace-nowrap">
                    REGISTRAR AVANCE
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

const MoneyInput = ({ value, onChange, isCount, disabled }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== undefined && localValue !== value) {
                onChange(localValue);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [localValue, onChange, value]);

    return (
        <div className="w-[84px] text-center">
            <FormattedNumberInput
                type={isCount ? "number" : "currency"}
                value={localValue}
                onChange={v => setLocalValue(v)} 
                placeholder={isCount ? '0' : '$ 0.00'}
                disabled={disabled}
                className="font-bold text-[10px]"
            />
        </div>
    );
};

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
                    <h3 className="text-base font-black uppercase tracking-wider text-primary">COMPROMISOS KPI DEL DÍA</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">{filledCount}/{allFields.length} CAPTURADOS</span>
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
                                    <span className="text-xs font-black uppercase tracking-widest text-white">{String(group).toUpperCase()}</span>
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
                                                <p className="text-sm font-black text-primary uppercase tracking-wide leading-tight">{String(label).toUpperCase()}</p>
                                            </div>
                                            <div className="flex items-end gap-3 flex-shrink-0">
                                                {hasComp && (
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">COMPROMISO</p>
                                                        <div className="bg-slate-100 rounded-xl px-3 py-2 min-w-[80px] text-center">
                                                            <p className="text-sm font-black text-slate-700">{fmtNum(comp, isCount)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {hasComp && <span className="text-slate-300 font-bold text-lg mb-1">→</span>}
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">REAL</p>
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
    const [isSavingDefinitivo, setIsSavingDefinitivo] = useState(false);

    const handleOpenCheckIn = (visit) => {
        const checkIns = currentAgenda.checkIns || {};
        const yaTieneCheckIn = !!checkIns[visit.id];
        const finalizadaEnBD = String(visit.statusAction).toUpperCase() === 'FINALIZADA'
            || String(visit.statusAction).toUpperCase() === 'NO REALIZADA'
            || String(visit.estado).toUpperCase() === 'FINALIZADA';
        const agendaCongelada = String(currentAgenda.status).toLowerCase() === 'ejecutada' || String(currentAgenda.status).toLowerCase() === 'completada';
        if (yaTieneCheckIn || finalizadaEnBD || agendaCongelada) return;
        setModalVisit(visit);
    };
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '' });

    const checkIns = currentAgenda.checkIns || {};
    const unplannedVisits = currentAgenda.unplannedVisits || [];
    const d = new Date();
    const todayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const allFollowUps = scheduledFollowUps || [];
    const todayFollowUps = allFollowUps
        .filter(fu => !fu.compromisoFecha || fu.compromisoFecha === todayISO)
        .map(fu => ({ ...fu, time: followUpTimes[fu.id] ?? fu.time }));
    const setFollowUpTime = (id, time) => setFollowUpTimes(prev => ({ ...prev, [id]: time }));

    const isFrozen = String(currentAgenda.status).toLowerCase() === 'ejecutada' || String(currentAgenda.status).toLowerCase() === 'completada';

    if (String(currentAgenda.status).toLowerCase() !== 'aprobada' && String(currentAgenda.status).toLowerCase() !== 'ejecutada' && String(currentAgenda.status).toLowerCase() !== 'completada') {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
                <BlockedScreen status={currentAgenda.status} />
            </div>
        );
    }

    const getAllVisits = () => {
        const visits = [];
        
        const segmentosDB = currentAgenda.segments || {};
        
        Object.entries(segmentosDB).forEach(([nombreBloque, arregloVisitas]) => {
            if (Array.isArray(arregloVisitas)) {
                arregloVisitas.forEach(v => {
                    const isImprevisto = nombreBloque === 'Visita No Planeada' || nombreBloque === 'Imprevisto' || String(v.managementResult || '').toUpperCase().includes('IMPREVISTO');
                    
                    if (!v || (!v.name && !isImprevisto)) return;

                    let displayName = v.name;
                    if (!displayName && isImprevisto && v.managementResult?.includes('IMPREVISTO:')) {
                        const nameMatch = v.managementResult.match(/IMPREVISTO:\s*(.*?)(?:\s*\||$)/i);
                        displayName = nameMatch ? nameMatch[1].trim() : 'CLIENTE NO PLANEADO';
                    }

                    const isFinalizada = String(v.statusAction).toUpperCase() === 'FINALIZADA' || String(v.statusAction).toUpperCase() === 'NO REALIZADA' || String(v.estado).toUpperCase() === 'FINALIZADA';
                    
                    if (isFinalizada && !checkIns[v.id]) {
                        checkIns[v.id] = {
                            resultado: v.managementResult || v.resultado,
                            visitaRealizada: v.managementRealized || v.realizada,
                            checkInTime: v.time,
                            isFromDB: true
                        };
                    }
                    
                    visits.push({ 
                        ...v, 
                        name: String(displayName).toUpperCase(), 
                        _segment: nombreBloque, 
                        isUnplanned: isImprevisto 
                    });
                });
            }
        });
        
        const localUnplanned = (unplannedVisits || []).map(v => ({ 
            ...v, 
            _segment: v._segment || 'Visita No Planeada', 
            isUnplanned: true 
        }));
        
        const listaFinal = [...visits, ...localUnplanned];
        listaFinal.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
        
        return listaFinal;
    };

    const allVisits = getAllVisits();
    
    const done = allVisits.filter(v => checkIns[v.id] || v._dbCheckIn || v.isUnplanned).length;
    const total = allVisits.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const todayStr = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

    const handleFinalizarEjecucion = async () => {
        if (isSavingDefinitivo) return; 
        
        try {
            setIsSavingDefinitivo(true); 
            
            await api.put(`/agenda/plan/${currentAgenda.id}/estatus`, { 
                estatus: 'ejecutada', 
                nota: 'EJECUCIÓN FINALIZADA POR EL OPERATIVO' 
            });
            updateAgendaStatus(currentAgenda.id, 'ejecutada');
            setShowConfirmModal(false);
            LoggerService.info('EJECUCIÓN FINALIZADA CORRECTAMENTE', { idPlan: currentAgenda.id });
        } catch (error) {
            LoggerService.error('ERROR AL FINALIZAR LA EJECUCIÓN', error);
            setShowConfirmModal(false);
            setErrorModal({
                isOpen: true,
                message: "NO SE PUDO CONECTAR CON EL SERVIDOR PARA FINALIZAR LA EJECUCIÓN."
            });
        } finally {
            setIsSavingDefinitivo(false); 
        }
    };

    const handleIntentarFinalizar = () => {
        if (pct < 100) {
            setAlertConfig({ 
                isOpen: true, 
                message: `TU AVANCE ACTUAL ES DEL ${pct}%. DEBES REGISTRAR TODAS TUS GESTIONES Y SEGUIMIENTOS PARA PODER HACER EL GUARDADO DEFINITIVO.` 
            });
            return;
        }
        setShowConfirmModal(true);
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-32 px-4 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isFrozen && (
                <div className="mt-8 mb-6 bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Lock className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">EJECUCIÓN FINALIZADA</h3>
                        <p className="text-blue-700 text-sm font-bold mt-1 uppercase">HAS REALIZADO EL GUARDADO DEFINITIVO. LOS REGISTROS HAN SIDO BLOQUEADOS, PUEDES VER EL RESUMEN EN LA PESTAÑA DE "CIERRE".</p>
                    </div>
                </div>
            )}

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
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PROGRESO DE RUTA</p>
                        <p className="text-2xl font-black text-primary">{pct}<span className="text-sm text-accent">%</span></p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                </div>
            </header>

            {pct === 100 && total > 0 && (() => {
                const allFinished = allVisits.filter(v => checkIns[v.id] || v._dbCheckIn || v.isUnplanned);
                const compromisos = allFinished.filter(c => {
                    const res = String(checkIns[c.id]?.resultado || c._dbCheckIn?.resultado || c.resultado || '');
                    return res.toUpperCase().includes('COMPROMISO') || res.toUpperCase().includes('PROMESA');
                });
                const totalMonto = compromisos.reduce((s, c) => {
                    const monto = checkIns[c.id]?.pagoMonto || c.pagoMonto || 0;
                    return s + Number(monto);
                }, 0);
                const noRealizadas = allFinished.filter(c => {
                    const res = String(checkIns[c.id]?.resultado || c._dbCheckIn?.resultado || c.resultado || '');
                    return res.toUpperCase().includes('NO REALIZADA');
                }).length;

                return (
                    <div className="mb-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-200 mb-1">RUTA COMPLETADA</p>
                                <h3 className="text-2xl font-black leading-tight uppercase">¡BUEN TRABAJO HOY!</h3>
                                <p className="text-[11px] text-emerald-100 mt-1 uppercase font-bold">{todayStr}</p>
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 size={28} className="text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-5">
                            <div className="bg-white/15 rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black">{done}</p>
                                <p className="text-[8px] font-black text-emerald-100 uppercase tracking-wider mt-0.5">GESTIONES</p>
                            </div>
                            <div className="bg-white/15 rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black">{compromisos.length}</p>
                                <p className="text-[8px] font-black text-emerald-100 uppercase tracking-wider mt-0.5">COMPROMISOS</p>
                            </div>
                            <div className="bg-white/15 rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black">{noRealizadas}</p>
                                <p className="text-[8px] font-black text-emerald-100 uppercase tracking-wider mt-0.5">NO REALIZADAS</p>
                            </div>
                        </div>
                        {totalMonto > 0 && (
                            <div className="mt-3 bg-white/15 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-wider">MONTO TOTAL COMPROMETIDO</span>
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
                        <p className="text-xs font-black uppercase tracking-widest">NO HAY VISITAS AGENDADAS</p>
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
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white ml-2">{String(seg).toUpperCase()}</span>
                                        <span className="ml-1 text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">{visits.length}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-white/60 uppercase">{doneCount}/{visits.length} COMPLETADAS</span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {visits.map((v) => (
                                        <VisitCard 
                                            key={v.id} 
                                            visit={v} 
                                            checkIn={checkIns[v.id] || v._dbCheckIn || (v.isUnplanned ? v : null)} 
                                            onCheckIn={handleOpenCheckIn} 
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
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">SEGUIMIENTOS COMPROMETIDOS</span>
                            <span className="ml-1 text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">{todayFollowUps.length}</span>
                        </div>
                        <span className="text-[9px] font-bold text-white/60 uppercase">
                            {todayFollowUps.filter(fu => checkIns[fu.id]).length}/{todayFollowUps.length} REGISTRADOS
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {todayFollowUps.map(fu => (
                            <FollowUpCard key={fu.id} followUp={fu} checkIn={checkIns[fu.id]} onSetTime={setFollowUpTime} onCheckIn={handleOpenCheckIn} isFrozen={isFrozen} />
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
                        <Plus size={16} /> AGREGAR VISITA NO PLANEADA
                    </button>
                )
            )}

            {modalVisit && !isFrozen && (
                <CheckInModal visit={modalVisit} onClose={() => setModalVisit(null)} onSubmit={data => {
                    registerCheckIn(modalVisit.id, data);
                    if (String(data.resultado).toUpperCase().includes('COMPROMISO') && data.pagoFecha) {
                        scheduleFollowUp(modalVisit, { fecha: data.pagoFecha, monto: data.pagoMonto });
                    }
                    setModalVisit(null);
                }} />
            )}

            {String(currentAgenda.status).toLowerCase() === 'aprobada' && (
                <footer className="fixed bottom-0 left-0 right-0 md:relative md:mt-12 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 md:p-6 flex justify-end md:rounded-[32px] md:border-none md:bg-slate-900 md:shadow-2xl">
                    <div className="flex flex-col md:items-end w-full md:w-auto">
                        <p className="hidden md:block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 text-right">ASEGÚRATE DE REGISTRAR TODAS TUS VISITAS ANTES DE CONTINUAR.</p>
                       <button 
                            onClick={handleIntentarFinalizar}
                            disabled={isSavingDefinitivo}
                            className={`w-full md:w-auto px-12 py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all flex items-center justify-center gap-3
                                ${isSavingDefinitivo 
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                    : 'bg-indigo-950 md:bg-white text-white md:text-indigo-950 hover:scale-105 active:scale-95'
                                }`}
                        >
                            {isSavingDefinitivo ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                            {isSavingDefinitivo ? 'PROCESANDO...' : 'GUARDADO DEFINITIVO'}
                        </button>
                    </div>
                </footer>
            )}

            <UIModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                type="info"
                title="¿FINALIZAR EJECUCIÓN?"
                message="AL HACER EL GUARDADO DEFINITIVO, SE BLOQUEARÁN LOS INPUTS Y YA NO PODRÁS REGISTRAR NUEVAS GESTIONES NI IMPREVISTOS. ASEGÚRATE DE HABER COMPLETADO TODO."
                showCancel={true}
                cancelText="REVISAR DE NUEVO"
                confirmText="SÍ, FINALIZAR EJECUCIÓN"
                onConfirm={handleFinalizarEjecucion}
            />

            <UIModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                title="ERROR DE CONEXIÓN"
                message={errorModal.message}
                type="danger"
            />

            <UIModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ isOpen: false, message: '' })}
                type="warning"
                title="EJECUCIÓN INCOMPLETA"
                message={alertConfig.message}
                showConfirmButton={true}
                confirmButtonText="ENTENDIDO"
            />
        </div>
    );
};

const EjecucionOperativoWrapper = () => {
    const dynamicUI = useDynamicUI();
    return (
        <DynamicUIContext.Provider value={dynamicUI}>
            <EjecucionOperativoContent />
        </DynamicUIContext.Provider>
    );
};

export default EjecucionOperativoWrapper;