import React, { useMemo } from 'react';
import { useAgenda } from '../../context/AgendaContext';
import { Target, CheckCircle2, TrendingUp, AlertTriangle, FileText } from 'lucide-react';

const CierreJornada = () => {
    // 1. Obtenemos la agenda actual desde el contexto global
    const { currentAgenda } = useAgenda();

    // 2. Calculamos el resumen Programado vs Ejecutado
    const resumen = useMemo(() => {
        const segments = currentAgenda?.segments || {};
        const checkIns = currentAgenda?.checkIns || {};
        const unplannedVisits = currentAgenda?.unplannedVisits || [];

        // Mapeamos los segmentos normales
        const stats = Object.keys(segments).map(seg => {
            const visits = segments[seg] || [];
            const programado = visits.length;
            // Contamos como ejecutado si tiene un check-in local o si viene marcado de BD
            const ejecutado = visits.filter(v => checkIns[v.id] || v._dbCheckIn).length;
            const porcentaje = programado === 0 ? 0 : Math.round((ejecutado / programado) * 100);

            return { segmento: seg, programado, ejecutado, porcentaje };
        });

        // Añadimos la fila de visitas no planeadas (imprevistos)
        if (unplannedVisits.length > 0) {
            stats.push({
                segmento: 'Visitas No Planeadas',
                programado: 0, // No se programaron
                ejecutado: unplannedVisits.length, // Pero sí se ejecutaron
                porcentaje: 100
            });
        }

        return stats;
    }, [currentAgenda]);

    // 3. Calculamos los totales globales
    const totales = useMemo(() => {
        return resumen.reduce((acc, curr) => ({
            programado: acc.programado + curr.programado,
            ejecutado: acc.ejecutado + curr.ejecutado
        }), { programado: 0, ejecutado: 0 });
    }, [resumen]);

    const porcentajeTotal = totales.programado === 0 
        ? 0 
        : Math.round((totales.ejecutado / totales.programado) * 100);

    // Renderizado condicional si no hay agenda activa
    if (!currentAgenda || currentAgenda.status === 'borrador') {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-in fade-in duration-500">
                <FileText size={48} className="mb-4 opacity-50" />
                <h3 className="text-lg font-black uppercase tracking-widest text-slate-500">Sin Agenda Activa</h3>
                <p className="text-sm font-medium mt-2">Debes planear y ejecutar tu ruta antes de poder cerrarla.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto pb-20 px-4 md:px-8 pt-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Cabecera de la Vista */}
            <header className="mb-8">
                <h2 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">Cierre de Jornada</h2>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                    Resumen de Operación · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </header>

            {/* Tarjeta de Resumen Global */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-4 border-slate-100 flex-shrink-0 relative">
                        {porcentajeTotal >= 100 ? (
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        ) : (
                            <TrendingUp size={40} className="text-blue-500" />
                        )}
                    </div>
                    <div className="flex-1 w-full text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avance Global de la Ruta</p>
                        <div className="flex items-end justify-center md:justify-start gap-2 mb-3">
                            <span className="text-4xl font-black text-indigo-950">{porcentajeTotal}%</span>
                            <span className="text-sm font-bold text-slate-500 pb-1">completado</span>
                        </div>
                        {/* Barra de progreso */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${porcentajeTotal >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(porcentajeTotal, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla Programado vs Ejecutado */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                    <Target size={18} className="text-slate-500" />
                    <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest">Programado vs Ejecutado</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Segmento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Programado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ejecutado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Avance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {resumen.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        {row.segmento}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-black rounded-lg text-xs">
                                            {row.programado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 font-black rounded-lg text-xs ${row.ejecutado >= row.programado && row.ejecutado > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {row.ejecutado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-xs font-black ${row.porcentaje >= 100 ? 'text-emerald-600' : row.porcentaje >= 50 ? 'text-blue-600' : 'text-slate-400'}`}>
                                            {row.porcentaje}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                            <tr>
                                <td className="px-6 py-4 text-xs font-black text-indigo-950 uppercase tracking-widest">
                                    Total General
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-black text-slate-700">
                                    {totales.programado}
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-black text-indigo-950">
                                    {totales.ejecutado}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-black text-blue-600">
                                    {porcentajeTotal}%
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Aviso si quedaron gestiones pendientes */}
            {totales.ejecutado < totales.programado && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                    <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                    <div>
                        <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Gestiones Incompletas</h4>
                        <p className="text-sm text-amber-700 font-medium leading-relaxed">
                            Tienes {totales.programado - totales.ejecutado} visita(s) sin reportar. Si realizas el cierre ahora, estas gestiones se marcarán automáticamente como "No Realizadas".
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CierreJornada;