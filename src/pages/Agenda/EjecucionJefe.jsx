import React, { useState, useMemo, useEffect } from 'react';
import { useRole } from '../../context/RoleContext';
import api from '../../api/axiosConfig'; // <-- Importamos tu cliente real de Axios
import {
    CheckCircle2, Clock, AlertTriangle, ChevronRight, ArrowLeft,
    User, Building2, MapPin, Activity, Users, TrendingUp, Navigation, Target, Loader2
} from 'lucide-react';

// ── Helpers Rescatados del Mock ──────────────────────────────────────────────
const STATUS_STYLES = {
    borrador: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
    pendiente: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    aprobada: { label: 'Autorizada', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    requiere_modificacion: { label: 'Req. Modificación', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
};

const agruparPorZona = (agendas) => {
    return agendas.reduce((acc, ag) => {
        if (!acc[ag.zona]) acc[ag.zona] = {};
        if (!acc[ag.zona][ag.sucursal]) acc[ag.zona][ag.sucursal] = [];
        acc[ag.zona][ag.sucursal].push(ag);
        return acc;
    }, {});
};

// ── Mock CheckIn Generator (Visual) ──────────────────────────────────────────
const MOCK_RESULTADOS = [
    'Abono/ Pago Parcial', 'Compromiso de pago', 'Promesa de pago',
    'Negativa de pago', 'Sin contacto', 'Ilocalizable', 'Convenio',
];
function simCheckIns(agenda) {
    if (agenda.status !== 'aprobada') return {};
    const allVisits = Object.values(agenda.segments || {}).flat().filter(v => v.name && v.time);
    const sorted = [...allVisits].sort((a, b) => a.time.localeCompare(b.time));
    const doneCount = Math.floor(sorted.length * 0.65);
    const result = {};
    sorted.slice(0, doneCount).forEach((visit, idx) => {
        const rIdx = (String(visit.id).charCodeAt(0) + idx) % MOCK_RESULTADOS.length;
        const [h, m] = visit.time.split(':').map(Number);
        const checkH = Math.min(h + Math.floor(idx * 0.2), 20);
        const checkM = (m + 8 + idx * 3) % 60;
        result[visit.id] = {
            checkInTime: `${String(checkH).padStart(2, '0')}:${String(checkM).padStart(2, '0')}`,
            resultado: MOCK_RESULTADOS[rIdx],
            lat: `29.0${idx + 1}`, lng: `-110.9${idx + 1}`,
            gpsStatus: 'ok',
        };
    });
    return result;
}

// ── Componentes UI ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES['borrador'];
    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

const ProgressBar = ({ done, total, color = 'blue' }) => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const barColor = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-400', violet: 'bg-violet-500' };
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor[color] || barColor.blue} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-black text-accent w-8 text-right">{pct}%</span>
        </div>
    );
};

// ── Operative Progress Card ──────────────────────────────────────────────────
const OperativeCard = ({ agenda, onClick }) => {
    const mockCIs = useMemo(() => simCheckIns(agenda), [agenda.id, agenda.status, agenda.segments]);
    const allVisits = Object.values(agenda.segments || {}).flat().filter(v => v.name);
    const done = Object.keys(mockCIs).length;
    const total = allVisits.length;
    const lastCI = Object.values(mockCIs).sort((a, b) => b.checkInTime?.localeCompare(a.checkInTime))[0];

    const nowStr = (() => { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; })();
    const overdue = allVisits.filter(v => v.time && v.time < nowStr && !mockCIs[v.id]).length;

    return (
        <div onClick={onClick}
            className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group
                ${overdue > 0 ? 'border-amber-200' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={agenda.status} />
                        {overdue > 0 && (
                            <span className="flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={8} /> {overdue} retrasada{overdue > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p className="font-black text-[13px] text-primary uppercase leading-tight truncate">{agenda.operativo?.nombre}</p>
                    <p className="text-[10px] text-accent mt-0.5">{agenda.operativo?.puesto}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors mt-1 flex-shrink-0" />
            </div>

            <ProgressBar done={done} total={total} color={done === total && total > 0 ? 'emerald' : 'blue'} />

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> {done}/{total} visitas</span>
                </div>
                {lastCI ? (
                    <span className="flex items-center gap-1 text-[9px] text-slate-400">
                        <Clock size={9} /> Últ: {lastCI.checkInTime} · {lastCI.resultado?.split(' ').slice(0, 2).join(' ')}
                    </span>
                ) : (
                    <span className="text-[9px] text-slate-300 font-bold uppercase">Sin gestiones</span>
                )}
            </div>
        </div>
    );
};

// ── Agenda Execution Detail ───────────────────────────────────────────────────
const AgendaExecDetail = ({ agenda, onBack }) => {
    const mockCIs = useMemo(() => simCheckIns(agenda), [agenda.id, agenda.status, agenda.segments]);
    const nowStr = (() => { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; })();
    const allVisits = Object.entries(agenda.segments || {})
        .flatMap(([seg, visits]) => visits.filter(v => v.name && v.time).map(v => ({ ...v, _seg: seg })))
        .sort((a, b) => a.time.localeCompare(b.time));

    const RESULTADO_BADGE = {
        'Abono/ Pago Parcial': 'bg-emerald-100 text-emerald-700', 'Compromiso de pago': 'bg-blue-100 text-blue-700',
        'Promesa de pago': 'bg-indigo-100 text-indigo-700', 'Negativa de pago': 'bg-red-100 text-red-700',
        'Ilocalizable': 'bg-orange-100 text-orange-700', 'Sin contacto': 'bg-slate-100 text-slate-600',
        'Convenio': 'bg-purple-100 text-purple-700', 'Finado': 'bg-gray-200 text-gray-600',
    };

    const DEMO_KPI_COMPROMISOS = {
        'asesor-f': { captNueva: '120000', captReinversion: '85000', colocInicial: '95000', colocRedisposicion: '45000', rec0: '18000', rec1_7: '12000', rec8_30: '8500', rec31_60: '4000', recMas61: '2000' },
        'asesor-c': { captNueva: '95000', captReinversion: '60000', dispersion: '180000', dispersionNueva: '75000', aperturasCredFacil: '8', montoLineasApertura: '240000', rec0: '22000', rec1_7: '15000', rec8_30: '9000', rec31_60: '5000', recMas61: '2500', servicioPremiumPendiente: '3' },
        'coordinador-l': { captNueva: '80000', captReinversion: '55000', dispersion: '150000', dispersionNueva: '60000', aperturasCredFacil: '6', montoLineasApertura: '180000', rec0: '16000', rec1_7: '11000', rec8_30: '7000', rec31_60: '3500', recMas61: '1500', servicioPremiumPendiente: '2' },
        'gestor-i': { cobranzaTotalDia: '45000', cobranza1_30: '28000', cobranza31_60: '12000', opCobradas: '14', visitasRealizadas: '8', promesasDia: '5', montoPromesas: '18000', saldoSaneadoDia: '8000', contencionMas30: '22000', contencionMas60: '12000', contencionMas89: '5000' },
    };
    const FIELDS_JEFE = {
        'asesor-f': [{ key: 'captNueva', label: 'Captación Nueva' }, { key: 'captReinversion', label: 'Captación Reinv.' }, { key: 'colocInicial', label: 'Colocación Inicial' }, { key: 'rec0', label: 'Recup. 0 días' }, { key: 'rec1_7', label: 'Recup. 1-7d' }],
        'asesor-c': [{ key: 'captNueva', label: 'Captación Nueva' }, { key: 'dispersion', label: 'Dispersión' }, { key: 'rec0', label: 'Recup. 0 días' }, { key: 'servicioPremiumPendiente', label: 'Serv. Premium' }],
        'coordinador-l': [{ key: 'captNueva', label: 'Captación Nueva' }, { key: 'dispersion', label: 'Dispersión' }, { key: 'rec0', label: 'Recup. 0 días' }],
        'gestor-i': [{ key: 'cobranzaTotalDia', label: 'Cobranza Total' }, { key: 'opCobradas', label: 'Ops. Cobradas' }, { key: 'visitasRealizadas', label: '# Visitas' }, { key: 'promesasDia', label: 'Promesas' }],
    };
    const puestoToRoleId = (puesto) => {
        if (puesto?.includes('Financiero')) return 'asesor-f';
        if (puesto?.includes('Comercial')) return 'asesor-c';
        if (puesto?.includes('Revolvente') || puesto?.includes('Coordinador')) return 'coordinador-l';
        if (puesto?.includes('Interno')) return 'gestor-i';
        return null;
    };
    
    const roleId = puestoToRoleId(agenda.operativo?.puesto);
    const compromisos = (agenda.kpiCompromisos && Object.keys(agenda.kpiCompromisos).length > 0)
        ? agenda.kpiCompromisos
        : (DEMO_KPI_COMPROMISOS[roleId] || {});
    const kpiFields = roleId ? (FIELDS_JEFE[roleId] || []) : [];
    const simReal = (comp, seed) => { const n = Number(comp) || 0; const pct = 0.78 + ((seed * 0.17) % 0.22); return Math.round(n * pct); };
    const kpiBullet = (pct) => pct >= 90 ? '🟢' : pct >= 70 ? '🟡' : '🔴';
    const kpiClr = (pct) => pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 70 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';
    const fmtN = (v) => { const n = Number(v); return isNaN(n) ? '—' : n >= 1000 ? `$${n.toLocaleString()}` : String(n); };

    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                <ArrowLeft size={14} /> Volver
            </button>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <StatusBadge status={agenda.status} />
                        <p className="font-black text-lg text-primary uppercase mt-2">{agenda.operativo?.nombre}</p>
                        <p className="text-xs text-accent">{agenda.operativo?.puesto} · {agenda.sucursal}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest font-black">Completadas</p>
                        <p className="text-2xl font-black text-primary">{Object.keys(mockCIs).length}<span className="text-sm text-accent">/{allVisits.length}</span></p>
                    </div>
                </div>
                <div className="mt-4"><ProgressBar done={Object.keys(mockCIs).length} total={allVisits.length} /></div>
            </div>

            <div className="space-y-2">
                {allVisits.map(v => {
                    const ci = mockCIs[v.id];
                    const isOverdue = !ci && v.time < nowStr;
                    return (
                        <div key={v.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-colors
                            ${ci ? 'border-emerald-100' : isOverdue ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                ${ci ? 'bg-emerald-100' : isOverdue ? 'bg-amber-100' : 'bg-slate-100'}`}>
                                {ci ? <CheckCircle2 size={16} className="text-emerald-600" /> :
                                    isOverdue ? <AlertTriangle size={14} className="text-amber-600" /> :
                                        <Clock size={14} className="text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono-tech text-accent">{v.time}</span>
                                    {isOverdue && !ci && <span className="text-[8px] bg-amber-200 text-amber-700 font-black px-1.5 rounded uppercase">Retraso</span>}
                                </div>
                                <p className="font-black text-[12px] text-primary uppercase truncate">{v.name}</p>
                                {ci && (
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${RESULTADO_BADGE[ci.resultado] || 'bg-slate-100 text-slate-600'}`}>
                                            {ci.resultado}
                                        </span>
                                        <span className="text-[9px] text-slate-400">{ci.checkInTime}</span>
                                        {ci.gpsStatus === 'ok' && <span className="text-[9px] text-emerald-500 flex items-center gap-0.5"><Navigation size={8} /> GPS</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {kpiFields.length > 0 && Object.keys(compromisos).length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 bg-yellow-400 rounded-full" />
                        <Target size={12} className="text-yellow-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Compromisos KPI del Día</span>
                        <span className="text-[8px] font-black text-slate-400 ml-auto uppercase tracking-widest">Vista supervisión</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-50">
                            {kpiFields.map(({ key, label }, idx) => {
                                const comp = compromisos[key];
                                if (!comp) return null;
                                const realVal = simReal(comp, idx + 1);
                                const pct = Math.round((realVal / Number(comp)) * 100);
                                return (
                                    <div key={key} className="px-4 py-3 flex items-center gap-3">
                                        <span className="text-[12px] flex-shrink-0">{kpiBullet(pct)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
                                            <p className="text-[8px] text-slate-400 mt-0.5">Comp: <span className="font-black text-slate-600">{fmtN(comp)}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">Real</p>
                                                <p className="text-[11px] font-black text-primary">{fmtN(realVal)}</p>
                                            </div>
                                            <div className={`text-[9px] font-black px-2 py-1 rounded-lg ${kpiClr(pct)}`}>{pct}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── KPI Summary Bar ───────────────────────────────────────────────────────────
const KpiBar = ({ agendas }) => {
    const total = agendas.length;
    const conCheckIns = agendas.filter(ag => ag.status === 'aprobada').length;
    const allVisits = agendas.flatMap(ag => Object.values(ag.segments || {}).flat().filter(v => v.name));
    const mockDone = agendas.filter(ag => ag.status === 'aprobada')
        .reduce((acc, ag) => acc + Math.floor(Object.values(ag.segments || {}).flat().filter(v => v.name).length * 0.65), 0);

    const stats = [
        { label: 'Operativos en Ruta', value: conCheckIns, Icon: Users, color: 'text-emerald-600' },
        { label: 'Gestiones Totales', value: allVisits.length, Icon: Activity, color: 'text-blue-600' },
        { label: 'Gestiones Realizadas', value: mockDone, Icon: CheckCircle2, color: 'text-indigo-600' },
        { label: '% Avance Global', value: `${allVisits.length > 0 ? Math.round(mockDone / allVisits.length * 100) : 0}%`, Icon: TrendingUp, color: 'text-violet-600' },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {stats.map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <s.Icon size={14} className={`${s.color} mb-2`} />
                    <p className="text-xl font-black text-primary">{s.value}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
            ))}
        </div>
    );
};

// ── Supervisor Views ──────────────────────────────────────────────────────────
const VistaGerente = ({ agendas }) => {
    const [detail, setDetail] = useState(null);
    if (detail) return <AgendaExecDetail agenda={detail} onBack={() => setDetail(null)} />;
    return (
        <div>
            <KpiBar agendas={agendas} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agendas.map(ag => <OperativeCard key={ag.id} agenda={ag} onClick={() => setDetail(ag)} />)}
            </div>
        </div>
    );
};

const VistaSucursal = ({ sucursal, agendas, onBack }) => {
    const [detail, setDetail] = useState(null);
    if (detail) return <AgendaExecDetail agenda={detail} onBack={() => setDetail(null)} />;
    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                <ArrowLeft size={14} /> Volver
            </button>
            <h3 className="text-xl font-black text-primary uppercase mb-4">{sucursal}</h3>
            <KpiBar agendas={agendas} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agendas.map(ag => <OperativeCard key={ag.id} agenda={ag} onClick={() => setDetail(ag)} />)}
            </div>
        </div>
    );
};

const VistaZona = ({ zonaData, rolName }) => {
    const [selected, setSelected] = useState(null);
    if (selected) return <VistaSucursal sucursal={selected.suc} agendas={selected.agendas} onBack={() => setSelected(null)} />;
    return (
        <div>
            <KpiBar agendas={Object.values(zonaData).flat()} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(zonaData).map(([suc, agendas]) => {
                    const done = agendas.filter(ag => ag.status === 'aprobada').reduce((a, ag) => a + Math.floor(Object.values(ag.segments || {}).flat().filter(v => v.name).length * 0.65), 0);
                    const total = agendas.reduce((a, ag) => a + Object.values(ag.segments || {}).flat().filter(v => v.name).length, 0);
                    return (
                        <div key={suc} onClick={() => setSelected({ suc, agendas })}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <Building2 size={14} className="text-slate-400 mb-1" />
                                    <p className="font-black text-[14px] text-primary uppercase">{suc}</p>
                                    <p className="text-[10px] text-accent">{agendas.length} operativo{agendas.length !== 1 ? 's' : ''}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <ProgressBar done={done} total={total} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const VistaEjecutivo = ({ ejecutivo, agendas }) => {
    const [detail, setDetail] = useState(null);
    const misAgendas = agendas.filter(ag => ag.ejecutivoId === ejecutivo.id);
    if (detail) return <AgendaExecDetail agenda={detail} onBack={() => setDetail(null)} />;
    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ejecutivo de Cobranza</p>
                <p className="font-black text-lg text-primary uppercase">{ejecutivo.nombre}</p>
                <p className="text-[10px] text-accent">{misAgendas.length} gestor{misAgendas.length !== 1 ? 'es' : ''} asignado{misAgendas.length !== 1 ? 's' : ''}</p>
            </div>
            <KpiBar agendas={misAgendas} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {misAgendas.map(ag => <OperativeCard key={ag.id} agenda={ag} onClick={() => setDetail(ag)} />)}
            </div>
        </div>
    );
};

// ── Main EjecucionJefe ────────────────────────────────────────────────────────
const EjecucionJefe = () => {
    const { selectedRole } = useRole();
    const { canal, nivel, name: rolName } = selectedRole;

    const [loading, setLoading] = useState(true);
    const [agendas, setAgendas] = useState([]);
    const [jerarquia, setJerarquia] = useState({ coordinadores: [], ejecutivos: [] });

    const [selectedZona, setSelectedZona] = useState(null);
    const [selectedEj, setSelectedEj] = useState(null);

    // Carga dinámica del Dashboard de Ejecución desde la API
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // TODO: Cuando la app esté en productivo, usa const hoy = new Date().toISOString().split('T')[0];
                const hoy = '2026-02-24'; 

                // 1. Cargar las agendas
                const resAgendas = await api.get(`/agenda/equipo?fecha=${hoy}`);
                const dataAgendas = resAgendas.data?.contenido || resAgendas.data || [];

                const parsedAgendas = dataAgendas.map(ag => {
                    let parsedSegments = ag.segments || {};
                    if (typeof parsedSegments === 'string') {
                        try { parsedSegments = JSON.parse(parsedSegments); } catch (e) { }
                    }
                    return { ...ag, segments: parsedSegments };
                });
                
                setAgendas(parsedAgendas);

                // 2. Cargar jerarquía si es cobranza
                if (canal === 'cobranza') {
                    const resJerarquia = await api.get('/agenda/jerarquia/cobranza');
                    const dataJerarquia = resJerarquia.data?.contenido || resJerarquia.data || { coordinadores: [], ejecutivos: [] };
                    setJerarquia(dataJerarquia);
                }
            } catch (err) {
                console.error("Error al cargar dashboard de jefes (Ejecución)", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [canal]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <Loader2 size={36} className="animate-spin mb-4 text-blue-500" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Cargando Tablero de Ejecución...</p>
            </div>
        );
    }

    // ── CANAL COMERCIAL ────────────────────────────────────────────
    if (canal === 'comercial') {
        const zonas = agruparPorZona(agendas);

        if (nivel === 1) { // Gerente
            // TODO: Ajustar a la sucursal del jefe logueado cuando el backend lo envíe
            const myAgendas = agendas.filter(ag => ag.sucursal === 'HERMOSILLO');
            return (
                <div className="max-w-4xl mx-auto pb-20 pt-8 px-4 animate-in fade-in duration-500">
                    <header className="mb-8">
                        <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión de Ruta</h2>
                        <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Operativos en campo · Sucursal Hermosillo</p>
                    </header>
                    <VistaGerente agendas={myAgendas} />
                </div>
            );
        }

        if (nivel === 2) { // Subdirector
            // TODO: Ajustar a la zona del jefe logueado
            const myZonaName = Object.keys(zonas)[0] || 'ZONA I';
            const myZona = zonas[myZonaName]; 
            return (
                <div className="max-w-5xl mx-auto pb-20 pt-8 px-4 animate-in fade-in duration-500">
                    <header className="mb-8">
                        <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión de Zona</h2>
                        <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">{myZonaName} · Ejecución en curso</p>
                    </header>
                    {myZona && <VistaZona zonaData={myZona} rolName={rolName} />}
                </div>
            );
        }

        // Director
        if (selectedZona) {
            return (
                <div className="max-w-5xl mx-auto pb-20 pt-8 px-4">
                    <button onClick={() => setSelectedZona(null)} className="flex items-center gap-2 text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                        <ArrowLeft size={14} /> Todas las Zonas
                    </button>
                    <h3 className="text-xl font-black text-primary uppercase mb-6">{selectedZona.nombre}</h3>
                    <VistaZona zonaData={zonas[selectedZona.id] || {}} rolName={rolName} />
                </div>
            );
        }
        
        return (
            <div className="max-w-5xl mx-auto pb-20 pt-8 px-4 animate-in fade-in duration-500">
                <header className="mb-8">
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión Nacional</h2>
                    <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Ejecución en Ruta · Todas las Zonas</p>
                </header>
                <KpiBar agendas={agendas} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { id: 'ZONA I', nombre: 'ZONA I' }, { id: 'ZONA II', nombre: 'ZONA II' },
                        { id: 'ZONA III', nombre: 'ZONA III' }, { id: 'ZONA IV', nombre: 'ZONA IV' },
                    ].map(z => {
                        const zAgendas = agendas.filter(ag => ag.zona === z.id);
                        const done = zAgendas.filter(ag => ag.status === 'aprobada').reduce((a, ag) => a + Math.floor(Object.values(ag.segments || {}).flat().filter(v => v.name).length * 0.65), 0);
                        const total = zAgendas.reduce((a, ag) => a + Object.values(ag.segments || {}).flat().filter(v => v.name).length, 0);
                        return (
                            <div key={z.id} onClick={() => setSelectedZona(z)}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <MapPin size={14} className="text-blue-400 mb-1" />
                                        <p className="font-black text-[15px] text-primary">{z.nombre}</p>
                                        <p className="text-[10px] text-accent">{zAgendas.length} operativos</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <ProgressBar done={done} total={total} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── CANAL COBRANZA ─────────────────────────────────────────────
    if (canal === 'cobranza') {

        if (nivel === 1) { // Ejecutivo
            const myEj = jerarquia.ejecutivos[0] || {}; 
            return (
                <div className="max-w-4xl mx-auto pb-20 pt-8 px-4 animate-in fade-in duration-500">
                    <header className="mb-8">
                        <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Mis Gestores en Ruta</h2>
                        <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Región Ejecutivo · Ejecución en curso</p>
                    </header>
                    <VistaEjecutivo ejecutivo={myEj} agendas={agendas} />
                </div>
            );
        }

        // N2/N3 — sees all ejecutivos
        if (selectedEj) {
            return (
                <div className="max-w-4xl mx-auto pb-20 pt-8 px-4">
                    <button onClick={() => setSelectedEj(null)} className="flex items-center gap-2 text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                        <ArrowLeft size={14} /> Todos los Ejecutivos
                    </button>
                    <VistaEjecutivo ejecutivo={selectedEj} agendas={agendas} />
                </div>
            );
        }
        
        return (
            <div className="max-w-4xl mx-auto pb-20 pt-8 px-4 animate-in fade-in duration-500">
                <header className="mb-8">
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión Cobranza</h2>
                    <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Ejecutivos en Campo · Ruta en Curso</p>
                </header>
                <KpiBar agendas={agendas} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jerarquia.ejecutivos.map(ej => {
                        const ejAg = agendas.filter(ag => ag.ejecutivoId === ej.id);
                        const done = ejAg.filter(ag => ag.status === 'aprobada').reduce((a, ag) => a + Math.floor(Object.values(ag.segments || {}).flat().filter(v => v.name).length * 0.65), 0);
                        const total = ejAg.reduce((a, ag) => a + Object.values(ag.segments || {}).flat().filter(v => v.name).length, 0);
                        return (
                            <div key={ej.id} onClick={() => setSelectedEj(ej)}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <User size={14} className="text-slate-400 mb-1" />
                                        <p className="font-black text-[14px] text-primary uppercase">{ej.nombre}</p>
                                        <p className="text-[10px] text-accent">{ejAg.length} gestor{ejAg.length !== 1 ? 'es' : ''}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <ProgressBar done={done} total={total} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};

export default EjecucionJefe;