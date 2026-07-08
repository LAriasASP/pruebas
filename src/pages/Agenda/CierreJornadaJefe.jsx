import React, { useState, useEffect } from 'react';
import { useRole } from '../../context/RoleContext';
import api from '../../api/axiosConfig'; 
import { CheckCircle2, User, Send, Star, AlertTriangle, Battery, BatteryWarning, ArrowLeft, Loader2, FileText, ChevronRight } from 'lucide-react';
import UIModal from '../../components/UIModal';
import LoggerService from '../../services/LoggerService'; 

const CierreJornadaJefe = () => {
    const { selectedRole } = useRole();
    const canal = selectedRole?.canal?.toLowerCase();

    // 1. Nuevos estados dinámicos
    const [loading, setLoading] = useState(true);
    const [agendas, setAgendas] = useState([]);
    const [selectedAgenda, setSelectedAgenda] = useState(null);

    // Estados del formulario
    const [evaluacion, setEvaluacion] = useState('');
    const [notaCierre, setNotaCierre] = useState('');
    const [enviado, setEnviado] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    // Sprint 5 / RF-12 — Adaptación de terminología por canal
    const isCobranza = canal === 'cobranza';
    const labelOperativo = isCobranza ? 'Gestor Interno' : 'Operativo';
    const labelOperativoPlural = isCobranza ? 'Gestores Internos' : 'Operativos';

    // Opciones del RF-12 del requerimiento
    const opcionesDictamen = [
        { id: 'excelente', label: 'Excelente', icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { id: 'satisfactorio', label: 'Satisfactorio', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'mejora', label: 'Con oportunidad de mejora', icon: BatteryWarning, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
        { id: 'improductivo', label: 'Improductivo', icon: Battery, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    ];

    // 2. Carga dinámica de operativos del día
    useEffect(() => {
        const fetchAgendasCierre = async () => {
            setLoading(true);
            try {
                const d = new Date();
                const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const resAgendas = await api.get(`/agenda/equipo?fecha=${hoy}`);
                const dataAgendas = resAgendas.data?.contenido || resAgendas.data || [];
                setAgendas(dataAgendas);
            } catch (err) {
                console.error("Error al cargar agendas para el cierre", err);
                LoggerService.error("Fallo al cargar equipo en Cierre", err);
            } finally {
                setLoading(false);
            }
        };
        if (canal) fetchAgendasCierre();
    }, [canal]);

    const handleSubmit = async () => {
        if (!evaluacion || !selectedAgenda?.id || submitting) return;

        // RF-12: Bloqueo de re-evaluaciones — si la agenda ya tiene dictamen, no se reenvía.
        if (selectedAgenda.notaDictamen) {
            setErrorModal({
                isOpen: true,
                message: `Este ${labelOperativo.toLowerCase()} ya cuenta con un dictamen registrado (${selectedAgenda.notaDictamen}). No es posible volver a evaluarlo en el mismo día.`
            });
            return;
        }

        setSubmitting(true);
        try {
            const opcionSeleccionada = opcionesDictamen.find(opt => opt.id === evaluacion);
            if (!opcionSeleccionada) {
                setSubmitting(false);
                return;
            }

            // Texto exacto que pide RF-12 (Excelente, Satisfactorio, Con Oportunidad de Mejora, Improductivo)
            const etiquetaTexto = opcionSeleccionada.label.toUpperCase();
            const idCalificacionMap = { excelente: 1, satisfactorio: 2, mejora: 3, improductivo: 4 };
            const idCalificacion = idCalificacionMap[evaluacion] ?? 1;

            const payload = {
                idCalificacion,
                etiqueta: etiquetaTexto,
                notaCierre
            };

            const response = await api.put(`/agenda/plan/${selectedAgenda.id}/dictamen`, payload);

            LoggerService.info('Dictamen de cierre guardado en base de datos', response.data);

            // Sincronizamos la lista local para que la tarjeta quede bloqueada al volver.
            setAgendas(prev => prev.map(ag => ag.id === selectedAgenda.id
                ? { ...ag, notaDictamen: etiquetaTexto }
                : ag));
            setEnviado(true);
        } catch (error) {
            LoggerService.error('Error al guardar el dictamen del jefe', error);
            setErrorModal({
                isOpen: true,
                message: "Hubo un error al guardar el dictamen. Revisa la consola o intenta de nuevo."
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedAgenda(null);
        setEvaluacion('');
        setNotaCierre('');
        setEnviado(false);
    };

    // ── Pantalla de Carga ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <Loader2 size={36} className="animate-spin mb-4 text-indigo-500" />
            </div>
        );
    }

    // ── Pantalla 1: Selección de Operativo (Con márgenes corregidos a 1400px) ──
    if (!selectedAgenda) {
        return (
            <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8 animate-in fade-in duration-500">
                <header className="mb-8">
                    <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">Cierre de Jornada</h2>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                        {`Selecciona un ${labelOperativo.toLowerCase()} para evaluar su desempeño`}
                    </p>
                </header>

                {agendas.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                        <FileText size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{`No hay ${labelOperativoPlural.toLowerCase()} en ruta hoy`}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {agendas.map(ag => {
                            // 1. Leemos la nota directamente de tu nueva consulta SQL
                            const dictamenFinal = ag.notaDictamen; 
                            const isEvaluated = !!dictamenFinal;

                            // 2. Asignamos colores al badge según el resultado
                            let badgeColor = 'bg-slate-100 text-slate-500 border-slate-200';
                            if (dictamenFinal === 'EXCELENTE') badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                            else if (dictamenFinal === 'SATISFACTORIO') badgeColor = 'bg-blue-100 text-blue-700 border-blue-200';
                            else if (dictamenFinal === 'CON OPORTUNIDAD DE MEJORA') badgeColor = 'bg-amber-100 text-amber-700 border-amber-200';
                            else if (dictamenFinal === 'IMPRODUCTIVO') badgeColor = 'bg-red-100 text-red-700 border-red-200';

                            return (
                                <div 
                                    key={ag.id} 
                                    // Bloqueamos el clic si la agenda ya fue evaluada
                                    onClick={() => !isEvaluated && setSelectedAgenda(ag)}
                                    className={`bg-white rounded-2xl border shadow-sm p-5 transition-all group ${
                                        isEvaluated ? 'border-slate-200 opacity-80 cursor-default' : 'border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-colors ${isEvaluated ? 'bg-slate-400' : 'bg-slate-900'}`}>
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-indigo-950 uppercase truncate leading-tight">
                                                    {ag.operativo?.nombre || 'Sin Nombre'}
                                                </p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {ag.operativo?.puesto}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                            ag.status?.toLowerCase() === 'ejecutada' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            Estatus: {ag.status || 'Borrador'}
                                        </span>
                                        
                                        {/* 3. Reemplazo dinámico del botón por la etiqueta de evaluación */}
                                        {isEvaluated ? (
                                            <div className={`px-2 py-1 border rounded-md text-[9px] font-black uppercase tracking-widest ${badgeColor}`}>
                                                {dictamenFinal}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 group-hover:text-indigo-600 uppercase tracking-widest transition-colors">
                                                Evaluar <ChevronRight size={14} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── Pantalla 2: Éxito ──
    if (enviado) {
        return (
            <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-center py-32 text-center animate-in zoom-in duration-500 px-4">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter mb-3">Evaluación Registrada</h3>
                <p className="text-sm text-slate-500 font-medium mb-8">El dictamen de la jornada ha sido guardado exitosamente en el sistema.</p>
                <button 
                    onClick={resetForm} 
                    className="px-6 py-3 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                >
                    Evaluar a otro operativo
                </button>
            </div>
        );
    }

    // ── Pantalla 3: Formulario de Dictamen (Con centrado corregido) ──
    return (
        <div className="max-w-[1400px] mx-auto pb-20 pt-8 px-4 md:px-8 animate-in slide-in-from-right-4 duration-300">
            
            {/* CONTENEDOR CENTRAL: Aquí agregamos mx-auto y metimos el botón y el título */}
            <div className="max-w-4xl mx-auto"> 
                
                <button onClick={() => setSelectedAgenda(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft size={14} /> Volver a la lista
                </button>

                <header className="mb-8">
                    <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">Dictamen de Cierre</h2>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                        Evaluación de la jornada operativa
                    </p>
                </header>

                {/* Cabecera del Operativo / Gestor Interno */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex flex-col md:flex-row items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
                        <User size={20} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{`${labelOperativo} Evaluado`}</p>
                        <p className="text-xl font-black text-indigo-950 uppercase leading-none">
                            {selectedAgenda.operativo?.nombre || 'Desconocido'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{selectedAgenda.operativo?.puesto} · {selectedAgenda.sucursal}</p>
                    </div>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 p-6 md:p-8">
                        <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest">Resultado Global del Día</h3>
                        <p className="text-xs text-slate-500 mt-1">{`Selecciona el dictamen según el cumplimiento de metas y KPIs de este ${labelOperativo.toLowerCase()}.`}</p>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {opcionesDictamen.map((opcion) => (
                                <button
                                    key={opcion.id}
                                    onClick={() => setEvaluacion(opcion.id)}
                                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                                        evaluacion === opcion.id 
                                            ? `${opcion.border} ${opcion.bg} shadow-sm transform scale-[1.02]` 
                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <opcion.icon className={`mt-0.5 flex-shrink-0 ${evaluacion === opcion.id ? opcion.color : 'text-slate-400'}`} size={20} />
                                    <div>
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${evaluacion === opcion.id ? opcion.color : 'text-slate-600'}`}>
                                            {opcion.label}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="pt-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                                Notas del Jefe (Opcional)
                            </label>
                            <textarea
                                value={notaCierre}
                                onChange={(e) => setNotaCierre(e.target.value)}
                                placeholder="Añade observaciones adicionales sobre el desempeño, compromisos cumplidos o áreas de enfoque para el día de mañana..."
                                rows={4}
                                className="w-full rounded-2xl border border-slate-200 p-5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!evaluacion || submitting || !!selectedAgenda?.notaDictamen}
                            className={`flex items-center gap-2 px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                evaluacion && !submitting && !selectedAgenda?.notaDictamen
                                ? 'bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-indigo-900/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {submitting ? 'Guardando…' : 'Guardar Dictamen'}
                        </button>
                    </div>
                </div>
            </div>

             <UIModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                title="Error al Guardar"
                message={errorModal.message}
                type="danger"
            />            
        </div>
    );
};

export default CierreJornadaJefe;