import React, { useState, useMemo, useEffect } from 'react';
import { useRole } from '../../context/RoleContext';
import api from '../../api/axiosConfig';
import {
    CheckCircle2, Clock, AlertTriangle, ChevronRight, ArrowLeft,
    User, Building2, MapPin, Activity, Users, TrendingUp, Navigation, Target, Loader2
} from 'lucide-react';
// ✅ IMPORTACIÓN CORREGIDA DEL MODAL
import UIModal from '../../components/UIModal'; 

// ── Helpers ────────────────────────────────────────────────────────
const STATUS_STYLES = {
    borrador: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
    pendiente: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    aprobada: { label: 'Autorizada', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    requiere_modificacion: { label: 'Req. Modificación', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    ejecutada: { label: 'Ejecutada', bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
    completada: { label: 'Completada', bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' }
};

const agruparPorZona = (agendas) => {
    return agendas.reduce((acc, ag) => {
        if (!acc[ag.zona]) acc[ag.zona] = {};
        if (!acc[ag.zona][ag.sucursal]) acc[ag.zona][ag.sucursal] = [];
        acc[ag.zona][ag.sucursal].push(ag);
        return acc;
    }, {});
};

// ── Lector de Check-Ins Reales ─────────────────────────────────────
function getRealCheckIns(agenda) {
    const result = {};
    const validStatuses = ['aprobada', 'ejecutada', 'completada'];
    if (!validStatuses.includes(agenda.status?.toLowerCase())) return {};
    
    const allVisits = Object.values(agenda.segments || {}).flat().filter(v => 
        v.name || v._segment === 'Visita No Planeada' || v.managementResult?.includes('IMPREVISTO')
    );
    
    allVisits.forEach(v => {
        const isDone = v.statusAction === 'FINALIZADA' || v.statusAction === 'NO REALIZADA' || v.estado === 'FINALIZADA';
        
        if (isDone) {
            const resultText = v.managementResult || v.resultado || 'Gestionada';
            let mainResult = resultText.split(' | ')[0]; 
            
            if (resultText.includes('IMPREVISTO:')) {
                const resMatch = resultText.match(/Res:\s*(.*?)(?:\s*\||$)/);
                if (resMatch) mainResult = resMatch[1].trim();
            }

            result[v.id] = {
                checkInTime: v.time || '--:--', 
                resultado: mainResult, 
                resultadoCompleto: resultText,
                gpsStatus: resultText.includes('GPS') ? 'ok' : 'idle'
            };
        }
    });
    return result;
}

// ── FUNCIÓN EXTRAE-COORDENADAS GPS ──────────────────────────────────
const extraerCoordenadasGPS = (managementResult) => {
    if (!managementResult || !managementResult.includes('GPS:')) return null;
    try {
        const partes = managementResult.split('|');
        const fragmentoGps = partes.find(p => p.includes('GPS:'));
        if (fragmentoGps) {
            return fragmentoGps.replace('GPS:', '').trim(); 
        }
    } catch (e) {
        console.error("Error parseando GPS en el Front", e);
    }
    return null;
};

// ── Componentes UI ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES['borrador'];
    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

const ProgressBar = ({ done, total, color = 'blue', label }) => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const fillPct = Math.min(pct, 100); 
    const barColor = { 
        blue: 'bg-blue-500', emerald: 'bg-emerald-500', 
        amber: 'bg-amber-400', violet: 'bg-violet-500', purple: 'bg-purple-500'
    };
    
    return (
        <div className="mb-2 last:mb-0">
            {label && (
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    <span>{label}</span>
                </div>
            )}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full ${barColor[color] || barColor.blue} rounded-full transition-all duration-700`} style={{ width: `${fillPct}%` }} />
                </div>
                <span className={`text-[10px] font-black w-8 text-right ${pct >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {pct}%
                </span>
            </div>
        </div>
    );
};

// --- MOTOR MATEMÁTICO ---
const calculateProgressStats = (agendaList) => {
    const allVisits = agendaList.flatMap(ag => 
        Object.values(ag.segments || {}).flat()
              .filter(v => v.name || v._segment === 'Visita No Planeada' || v.managementResult?.includes('IMPREVISTO'))
    );
    const doneRutas = agendaList.reduce((acc, ag) => acc + Object.keys(getRealCheckIns(ag)).length, 0);
    const totalRutas = allVisits.length;
    const pctRutas = totalRutas > 0 ? (doneRutas / totalRutas) * 100 : 0;

    let sumKpiPct = 0;
    let countKpis = 0;

    agendaList.forEach(ag => {
        const comp = ag.kpiCompromisos || {};
        const real = ag.kpiReal || {};
        Object.keys(comp).forEach(k => {
            const meta = Number(comp[k]) || 0;
            const avance = Number(real[k]) || 0;
            if (meta > 0) {
                sumKpiPct += Math.min((avance / meta) * 100, 100);
                countKpis++;
            }
        });
    });

    const pctKpi = countKpis > 0 ? (sumKpiPct / countKpis) : 0;
    const divisores = (countKpis > 0 && totalRutas > 0) ? 2 : 1;
    const pctGlobal = (countKpis > 0 || totalRutas > 0) ? ((pctRutas + pctKpi) / divisores) : 0;

    return {
        doneRutas, totalRutas,
        pctRutas: Math.round(pctRutas),
        pctKpi: Math.round(pctKpi),
        pctGlobal: Math.round(pctGlobal)
    };
};

const OperativeCard = ({ agenda, onClick }) => {
    const realCIs = useMemo(() => getRealCheckIns(agenda), [agenda.id, agenda.status, agenda.segments]);
    const allVisits = Object.values(agenda.segments || {}).flat().filter(v => v.name || v._segment === 'Visita No Planeada' || v.managementResult?.includes('IMPREVISTO'));
    
    const stats = calculateProgressStats([agenda]);

    const lastCI = Object.values(realCIs).sort((a, b) => b.checkInTime?.localeCompare(a.checkInTime))[0];
    const nowStr = (() => { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; })();
    const overdue = allVisits.filter(v => v.time && v.time < nowStr && !realCIs[v.id]).length;

    return (
        <div onClick={onClick}
            className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between
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

            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 mb-3 space-y-3">
                <ProgressBar done={stats.doneRutas} total={stats.totalRutas} color="blue" label="1. Visitas Físicas" />
                <ProgressBar done={stats.pctKpi} total={100} color="emerald" label="2. Metas KPI" />
                <div className="pt-2 border-t border-slate-200/60">
                    <ProgressBar done={stats.pctGlobal} total={100} color="purple" label="Avance Global Consolidado" />
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                        <CheckCircle2 size={10} className={stats.doneRutas === stats.totalRutas && stats.totalRutas > 0 ? "text-blue-500" : "text-slate-400"} /> 
                        {stats.doneRutas}/{stats.totalRutas} check-ins
                    </span>
                </div>
                {lastCI ? (
                    <span className="flex items-center gap-1 text-[9px] text-slate-400 truncate max-w-[120px]" title={lastCI.resultado}>
                        <Clock size={9} className="flex-shrink-0" /> Últ: {lastCI.checkInTime}
                    </span>
                ) : (
                    <span className="text-[9px] text-slate-300 font-bold uppercase">Sin gestiones</span>
                )}
            </div>
        </div>
    );
};

// ── VISTA DETALLE SUPERVISOR ─────────────────────────────────────────────────
const AgendaExecDetail = ({ agenda, onBack }) => {
    const realCIs = useMemo(() => getRealCheckIns(agenda), [agenda.id, agenda.status, agenda.segments]);
    const nowStr = (() => { const n = new Date(); return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; })();
    
    const esEquipoCobranza = agenda.operativo?.equipo?.toLowerCase() === 'cobranza';

    const allVisits = Object.entries(agenda.segments || {})
        .flatMap(([seg, visits]) => {
            if (esEquipoCobranza && seg === 'Promoción') return []; 
            
            return (visits || [])
                .filter(v => v.name || seg === 'Visita No Planeada' || v.managementResult?.includes('IMPREVISTO'))
                .map(v => ({ ...v, _seg: seg }));
        })
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

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
    
    const kpiBullet = (pct) => pct >= 90 ? '🟢' : pct >= 70 ? '🟡' : '🔴';
    const kpiClr = (pct) => pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 70 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';

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
                       <p className="text-2xl font-black text-primary">{Object.keys(realCIs).length}<span className="text-sm text-accent">/{allVisits.length}</span></p>
                   </div>
               </div>
               <div className="mt-4"><ProgressBar done={Object.keys(realCIs).length} total={allVisits.length} /></div>
           </div>

            {/* ✅ FASE: ARREGLO DE INDICADORES OCULTOS (TARJETAS) DINÁMICAS */}
           {(() => {
                const cards = [
                    ...(!esEquipoCobranza ? [{ label: 'Promociones', val: agenda.segments['Promoción']?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50' }] : []),
                    { label: 'Evaluaciones', val: agenda.segments['Evaluación e Integración']?.length || 0, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Seguimiento', val: agenda.segments['Seguimiento de Cartera']?.length || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Imprevistos', val: agenda.segments['Visita No Planeada']?.length || 0, color: 'text-rose-600', bg: 'bg-rose-50' },
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

           <div className="space-y-2">
               {allVisits.map(v => {
                   const ci = realCIs[v.id];
                   const isOverdue = !ci && v.time && v.time < nowStr;
                   
                   let displayName = v.name;
                   if (!displayName && v.managementResult?.includes('IMPREVISTO:')) {
                       const nameMatch = v.managementResult.match(/IMPREVISTO:\s*(.*?)(?:\s*\||$)/);
                       displayName = nameMatch ? nameMatch[1].trim() : 'CLIENTE NO PLANEADO';
                   }

                   // ✅ FASE: EXTRAEMOS GPS
                   const gpsCoordenadas = extraerCoordenadasGPS(v.managementResult);
                   const isDone = v.managementRealized || ci; // Blindaje visual

                   return (
                       <div key={v.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-colors
                           ${isDone ? 'border-emerald-100' : isOverdue ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                           
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                               ${isDone ? 'bg-emerald-100' : isOverdue ? 'bg-amber-100' : 'bg-slate-100'}`}>
                               {isDone ? <CheckCircle2 size={16} className="text-emerald-600" /> :
                                   isOverdue ? <AlertTriangle size={14} className="text-amber-600" /> :
                                       <Clock size={14} className="text-slate-400" />}
                           </div>
                           
                           <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                   <span className="text-[9px] font-mono-tech text-accent">{v.time || 'Imprevisto'}</span>
                                   {isOverdue && !isDone && <span className="text-[8px] bg-amber-200 text-amber-700 font-black px-1.5 rounded uppercase">Retraso</span>}
                                   
                                   {(!v.name || v._seg === 'Visita No Planeada') && (
                                       <span className="text-[8px] bg-purple-100 text-purple-700 font-black px-1.5 rounded uppercase border border-purple-200">
                                           No Planeada
                                       </span>
                                   )}
                               </div>
                               
                               <p className="font-black text-[12px] text-primary uppercase truncate">{displayName}</p>
                               
                               {isDone && (
                                   <div className="flex items-center gap-2 mt-1 flex-wrap">
                                       <span className={`px-2 py-0.5 rounded text-[8px] font-black ${RESULTADO_BADGE[v.managementResult?.split('|')[0]?.trim() || ci?.resultado] || 'bg-slate-100 text-slate-600'}`}>
                                           {v.managementResult?.split('|')[0]?.trim() || ci?.resultado || 'GESTIONADO'}
                                       </span>
                                       <span className="text-[9px] text-slate-400">{ci?.checkInTime || v.time}</span>
                                       
                                       {/* PINTADO GPS EXPLICITO */}
                                       {(gpsCoordenadas || ci?.gpsStatus === 'ok') && (
                                           <span className="text-[9px] text-emerald-500 font-medium flex items-center gap-1 bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                                               <Navigation size={8} className="fill-emerald-500 text-emerald-500" /> 
                                               GPS: <span className="font-mono-tech font-bold text-[8.5px] text-emerald-600">{gpsCoordenadas || 'Capturado'}</span>
                                           </span>
                                       )}
                                   </div>
                               )}
                           </div>
                       </div>
                   );
               })}
           </div>

           {agenda.kpiCompromisos && Object.keys(agenda.kpiCompromisos).length > 0 && (
               <div className="mt-6">
                   <div className="flex items-center gap-2 mb-3">
                       <div className="w-1 h-5 bg-yellow-400 rounded-full" />
                       <Target size={12} className="text-yellow-600" />
                       <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Compromisos KPI del Día</span>
                   </div>
                   <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                       <div className="divide-y divide-slate-50">
                           {Object.entries(agenda.kpiCompromisos).map(([key, compValue]) => {
                               const comp = Number(compValue);
                               const realVal = Number(agenda.kpiReal?.[key] || 0);
                               const pct = comp > 0 ? Math.round((realVal / comp) * 100) : 0;
                               
                               const kpiBullet = pct >= 90 ? '🟢' : pct >= 70 ? '🟡' : '🔴';
                               const kpiClr = pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 70 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';
                               
                               const KPI_LABELS = {
                                   captNueva: 'Captación Nueva', captReinversion: 'Captación Reinv.', rec0: 'Recup. 0 días', rec1_7: 'Recup. 1-7 días', rec8_30: 'Recup. 8-30 días', rec31_60: 'Recup. 31-60 días', recMas61: 'Recup. +61 días', colocInicial: 'Colocación Inic.', colocRedisposicion: 'Coloc. Redisp.', dispersion: 'Dispersión', cobranzaTotalDia: 'Cobranza Total', visitasRealizadas: 'Visitas Reales', promesasDia: 'Promesas', servicioPremiumPendiente: 'Serv. Premium'
                               };
                               
                               const formatKpiValue = (v, kpiKey) => {
                                   const QUANTITY_KPIS = ['servicioPremiumPendiente', 'visitasRealizadas', 'promesasDia'];
                                   const isQuantity = QUANTITY_KPIS.includes(kpiKey);
                                   
                                   return new Intl.NumberFormat('es-MX', { 
                                       style: isQuantity ? 'decimal' : 'currency', 
                                       currency: isQuantity ? undefined : 'MXN',
                                       maximumFractionDigits: isQuantity ? 0 : 2
                                   }).format(Number(v));
                               };

                               return (
                                   <div key={key} className="px-4 py-3 flex items-center gap-3">
                                       <span className="text-[12px] flex-shrink-0">{kpiBullet}</span>
                                       <div className="flex-1 min-w-0">
                                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{KPI_LABELS[key] || key}</p>
                                           <p className="text-[8px] text-slate-400 mt-0.5">Meta: <span className="font-black text-slate-600">{formatKpiValue(comp, key)}</span></p>
                                       </div>
                                       <div className="flex items-center gap-2 flex-shrink-0">
                                           <div className="text-right">
                                               <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">Real</p>
                                               <p className="text-[11px] font-black text-primary">{formatKpiValue(realVal, key)}</p>
                                           </div>
                                           <div className={`text-[9px] font-black px-2 py-1 rounded-lg ${kpiClr}`}>{pct}%</div>
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

// ── KPI Summary Bar ────────────────────────────────────────────────────────
const KpiBar = ({ agendas }) => {
    const statusEnRuta = ['aprobada', 'ejecutada', 'completada'];
    const conCheckIns = agendas.filter(ag => statusEnRuta.includes(ag.status?.toLowerCase())).length;
    const stats = calculateProgressStats(agendas);

    const cards = [
        { label: 'Operativos en Ruta', value: conCheckIns, Icon: Users, color: 'text-emerald-600' },
        { label: 'Gestiones Totales', value: stats.totalRutas, Icon: Activity, color: 'text-blue-600' },
        { label: 'Rutas Completadas', value: stats.doneRutas, Icon: CheckCircle2, color: 'text-indigo-600' },
        { label: '% Avance Global', value: `${stats.pctGlobal}%`, Icon: TrendingUp, color: 'text-violet-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {cards.map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <s.Icon size={14} className={`${s.color} mb-2`} />
                    <p className="text-xl font-black text-primary">{s.value}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
            ))}
        </div>
    );
};


// ── Supervisor Views ───────────────────────────────────────────────────────
const VistaGerente = ({ agendas, detailId, setDetailId }) => {
    const detailAgenda = agendas.find(a => a.id === detailId);
    if (detailAgenda) return <AgendaExecDetail agenda={detailAgenda} onBack={() => setDetailId(null)} />;
    
    return (
        <div>
            <KpiBar agendas={agendas} />           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agendas.map(ag => <OperativeCard key={ag.id} agenda={ag} onClick={() => setDetailId(ag.id)} />)}
            </div>
        </div>
    );
};

const VistaSucursal = ({ sucursal, agendas, onBack, detailId, setDetailId }) => {
    const detailAgenda = agendas.find(a => a.id === detailId);
    if (detailAgenda) return <AgendaExecDetail agenda={detailAgenda} onBack={() => setDetailId(null)} />;
    
    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                <ArrowLeft size={14} /> Volver
            </button>
            <h3 className="text-xl font-black text-primary uppercase mb-4">{sucursal}</h3>
            <KpiBar agendas={agendas} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agendas.map(ag => <OperativeCard key={ag.id} agenda={ag} onClick={() => setDetailId(ag.id)} />)}
            </div>
        </div>
    );
};

const VistaZona = ({ zonaData, rolName, selectedSucursal, setSelectedSucursal, detailId, setDetailId }) => {
    if (selectedSucursal) return <VistaSucursal sucursal={selectedSucursal.suc} agendas={selectedSucursal.agendas} onBack={() => setSelectedSucursal(null)} detailId={detailId} setDetailId={setDetailId} />;
    
    return (
        <div>
            <KpiBar agendas={Object.values(zonaData).flat()} />
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {Object.entries(zonaData).map(([suc, agendas]) => {
                    const stats = calculateProgressStats(agendas);
                    return (
                        <div key={suc} onClick={() => setSelected({ suc, agendas })}
                            className="block w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-5 w-full">
                                <div className="flex-1 min-w-0 pr-3">
                                    <Building2 size={18} className="text-blue-500 mb-2" />
                                    <h3 className="font-black text-[15px] text-primary uppercase leading-tight break-words">{suc}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{agendas.length} operativo{agendas.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                                    <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600" />
                                </div>
                            </div>
                            <div className="w-full mt-auto bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                                <ProgressBar done={stats.doneRutas} total={stats.totalRutas} color="blue" label="Visitas Físicas" />
                                <ProgressBar done={stats.pctKpi} total={100} color="emerald" label="Metas KPI" />
                                <div className="pt-2 border-t border-slate-200">
                                    <ProgressBar done={stats.pctGlobal} total={100} color="purple" label="Avance Global" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const VistaEjecutivo = ({ ejecutivo, agendas, detailId, setDetailId }) => {
    const misAgendas = agendas.filter(ag => ag.ejecutivoId === ejecutivo.id);
    const detailAgenda = misAgendas.find(a => a.id === detailId);

    if (detailAgenda) return <AgendaExecDetail agenda={detailAgenda} onBack={() => setDetailId(null)} />;

    const stats = calculateProgressStats(misAgendas);
    return (
        <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ejecutivo de Cobranza</p>
                    <p className="font-black text-lg text-primary uppercase">{ejecutivo.nombre}</p>
                    <p className="text-[10px] text-accent">{misAgendas.length} gestor{misAgendas.length !== 1 ? 'es' : ''} asignado{misAgendas.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avance Consolidado del Equipo</p>
                    <ProgressBar done={stats.doneRutas} total={stats.totalRutas} color="blue" label="Visitas Físicas" />
                    <ProgressBar done={stats.pctKpi} total={100} color="emerald" label="Metas KPI" />
                    <ProgressBar done={stats.pctGlobal} total={100} color="purple" label="Avance Global Total" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {misAgendas.map(ag => <OperativeCard key={ag.id} agenda={ag} onClick={() => setDetailId(ag.id)} />)}
            </div>
        </div>
    );
};

// ── Main EjecucionJefe ────────────────────────────────────────────────────────
const EjecucionJefe = () => {
    const { selectedRole } = useRole();
    const { canal, nivel, name: rolName } = selectedRole;

    // 1. Declaración ÚNICA del estado del modal
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    const [loading, setLoading] = useState(true);
    const [agendas, setAgendas] = useState([]);
    const [jerarquia, setJerarquia] = useState({ coordinadores: [], ejecutivos: [] });

    const [selectedZona, setSelectedZona] = useState(null);
    const [selectedSucursal, setSelectedSucursal] = useState(null);
    const [selectedEj, setSelectedEj] = useState(null);
    const [detailId, setDetailId] = useState(null);

    // 2. Extraemos la función de carga para que el WebSocket la pueda invocar
    const fetchDashboardData = async (silent = false) => {
        if (!silent) setLoading(true); 
        try {
            const d = new Date();
            const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            const resAgendas = await api.get(`/agenda/equipo?fecha=${hoy}`);
            const dataAgendasRaw = resAgendas.data?.contenido || resAgendas.data || [];

            const dataAgendas = dataAgendasRaw.filter(ag => {
                const equipoAgenda = ag.operativo?.equipo?.toLowerCase() || '';
                return equipoAgenda === canal?.toLowerCase();
            });

            const parsedAgendas = dataAgendas.map(ag => {
                let parsedSegments = ag.segments || {};
                if (typeof parsedSegments === 'string') {
                    try { parsedSegments = JSON.parse(parsedSegments); } catch (e) { }
                }
                return { ...ag, segments: parsedSegments };
            });

            setAgendas(parsedAgendas);

            if (canal === 'cobranza') {
                const resJerarquia = await api.get('/agenda/jerarquia/cobranza');
                const dataJerarquia = resJerarquia.data?.contenido || resJerarquia.data || { coordinadores: [], ejecutivos: [] };
                setJerarquia(dataJerarquia);
            }
        } catch (err) {
            console.error("Error al cargar dashboard de jefes (Ejecución)", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // 3. Carga inicial
    useEffect(() => {
        if (canal) fetchDashboardData();
    }, [canal]);

    useEffect(() => {
        if (!canal) return;

        const API_COBRANZA = import.meta.env.VITE_API_ORIGIN_COBRANZA;
        const wsUrl = `${API_COBRANZA.replace(/^http/, 'ws')}/api/v1/ws/notificaciones`;
        let socket;

        try {
            socket = new WebSocket(wsUrl);
            socket.onopen = () => console.log('[WS Jefe - Ejecución] Sincronizado en tiempo real.');

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("[WS Jefe] Mensaje recibido del servidor:", data);

                if (data.type === 'NEW_CHECKIN' || data.type === 'AGENDA_UPDATE' || data.type === 'STATUS_UPDATE') {
                    
                    const canalPayload = data.payload?.canal?.toLowerCase();
                    const esMismoCanal = canalPayload === canal.toLowerCase();
                    const esImprevistoUOrganico = !canalPayload; 

                    if (esMismoCanal || esImprevistoUOrganico) {
                        console.log("[WS Jefe] Forzando recarga silenciosa del tablero por actualización.");
                        
                        fetchDashboardData(true); 
                    }
                }
            };

            socket.onerror = (error) => console.error("Error WS Ejecución Jefe:", error);
        } catch (error) { 
            console.error("Fallo crítico al conectar WebSocket", error); 
        }

        return () => { if (socket && socket.readyState === WebSocket.OPEN) socket.close(); };
    }, [canal]); 

    // 5. Consolidamos los returns en una función para que el modal se renderice SIEMPRE al final
    const renderContenido = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                    <Loader2 size={36} className="animate-spin mb-4 text-blue-500" />
                </div>
            );
        }

        // ── CANAL COMERCIAL ────────────────────────────────────────────
        if (canal === 'comercial') {
            const zonas = agruparPorZona(agendas);

            if (nivel === 1) { 
                const myAgendas = agendas; 
                const miSucursal = myAgendas[0]?.sucursal || 'Mi Sucursal';

                return (
                    <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8 animate-in fade-in duration-500">
                        <header className="mb-8">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión de Ruta</h2>
                            <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Operativos en campo · {miSucursal}</p>
                        </header>
                        <VistaGerente agendas={myAgendas} detailId={detailId} setDetailId={setDetailId} />
                    </div>
                );
            }

            if (nivel === 2) { 
                const myZonaName = Object.keys(zonas)[0] || 'ZONA I';
                const myZona = zonas[myZonaName]; 
                return (
                    <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8 animate-in fade-in duration-500">
                        <header className="mb-8">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión de Zona</h2>
                            <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">{myZonaName} · Ejecución en curso</p>
                        </header>
                        {myZona && <VistaZona zonaData={myZona} rolName={rolName} selectedSucursal={selectedSucursal} setSelectedSucursal={setSelectedSucursal} detailId={detailId} setDetailId={setDetailId} />}
                    </div>
                );
            }

            if (selectedZona) {
                return (
                    <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8">
                        <button onClick={() => setSelectedZona(null)} className="flex items-center gap-2 text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                            <ArrowLeft size={14} /> Todas las Zonas
                        </button>
                        <h3 className="text-xl font-black text-primary uppercase mb-6">{selectedZona.nombre}</h3>
                        <VistaZona zonaData={zonas[selectedZona.id] || {}} rolName={rolName} selectedSucursal={selectedSucursal} setSelectedSucursal={setSelectedSucursal} detailId={detailId} setDetailId={setDetailId} />
                    </div>
                );
            }
            
            return (
                <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8 animate-in fade-in duration-500">
                    <header className="mb-8">
                        <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión Nacional</h2>
                        <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Ejecución en Ruta · Todas las Zonas</p>
                    </header>
                    <KpiBar agendas={agendas} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.keys(zonas).map(zonaName => {
                            const zAgendas = agendas.filter(ag => ag.zona === zonaName);
                            const done = zAgendas.reduce((a, ag) => a + Object.keys(getRealCheckIns(ag) || {}).length, 0);
                            const total = zAgendas.reduce((a, ag) => a + Object.values(ag.segments || {}).flat().filter(v => v.name || v._segment === 'Visita No Planeada' || v.managementResult?.includes('IMPREVISTO')).length, 0);
                            
                            return (
                                <div 
                                    key={zonaName} 
                                    onClick={() => setSelectedZona({ id: zonaName, nombre: zonaName })}
                                    className="block w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="pr-4">
                                            <MapPin size={18} className="text-blue-500 mb-2" />
                                            <h3 className="font-black text-lg text-primary uppercase leading-tight break-words">
                                                {zonaName}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 mt-1">
                                                {zAgendas.length} operativos
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                                            <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600" />
                                        </div>
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
            if (nivel === 1) { 
                const myEj = jerarquia.ejecutivos[0] || {}; 
                return (
                    <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8 animate-in fade-in duration-500">
                        <header className="mb-8">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Mis Gestores en Ruta</h2>
                            <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Región Ejecutivo · Ejecución en curso</p>
                        </header>
                        <VistaEjecutivo ejecutivo={myEj} agendas={agendas} detailId={detailId} setDetailId={setDetailId} />
                    </div>
                );
            }

            if (selectedEj) {
                return (
                    <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8">
                        <button onClick={() => setSelectedEj(null)} className="flex items-center gap-2 text-[10px] font-black text-accent hover:text-primary uppercase tracking-widest mb-6 transition-colors">
                            <ArrowLeft size={14} /> Todos los Ejecutivos
                        </button>
                        <VistaEjecutivo ejecutivo={selectedEj} agendas={agendas} detailId={detailId} setDetailId={setDetailId} />
                    </div>
                );
            }
            
            return (
                <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8 animate-in fade-in duration-500">
                    <header className="mb-8">
                        <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Supervisión Cobranza</h2>
                        <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em] mt-1">Ejecutivos en Campo · Ruta en Curso</p>
                    </header>
                    <KpiBar agendas={agendas} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {jerarquia.ejecutivos.map(ej => {
                            const ejAg = agendas.filter(ag => ag.ejecutivoId === ej.id);
                            const done = ejAg.reduce((a, ag) => a + Object.keys(getRealCheckIns(ag)).length, 0);
                            const total = ejAg.reduce((a, ag) => a + Object.values(ag.segments || {}).flat().filter(v => v.name || v._segment === 'Visita No Planeada' || v.managementResult?.includes('IMPREVISTO')).length, 0);
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

    // Retorno único para inyectar el Modal sin importar en qué canal o nivel estemos
    return (
        <>
            {renderContenido()}
            <UIModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </>
    );
};

export default EjecucionJefe;