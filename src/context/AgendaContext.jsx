import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRole } from './RoleContext';
import { useCatalogs } from './CatalogContext'; 
import api from '../api/axiosConfig';
import UIModal from '../components/UIModal'; 

const MATRIZ_SEGMENTOS = {
    'ASESOR FINANCIERO': ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera'],
    'ASESOR COMERCIAL': ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera','Gestión de Empresarias'],
    'COORDINADOR DE LÍNEA REVOLVENTE': ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera','Gestión de Empresarias'],
    'ASESOR EN FORMACIÓN (SIN AGENDA)': [],
    'GESTOR INTERNO': ['Seguimiento de Cartera', 'Evaluación e Integración']
};

const SEGMENTOS_DEFAULT = ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera', 'Gestión de Empresarias'];

const AgendaContext = createContext();

export const AgendaProvider = ({ children }) => {
    const { selectedRole } = useRole();
    const catalogos = useCatalogs() || {}; 

    // ESTADO GLOBAL PARA ALERTAS
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // ── ESTADO DEL DIRECTORIO DE CLIENTES ──
    const [directorio, setDirectorio] = useState([]);
    const [loadingDirectorio, setLoadingDirectorio] = useState(true);

    const cargarDirectorio = async () => {
        try {
            setLoadingDirectorio(true);
            const res = await api.get('/agenda/contactos-usuario');
            const rawData = res.data?.contenido || res.data || [];

            const formattedData = rawData.map(item => {
                let parsedPhones = ['', '', ''];
                try {
                    if (typeof item.phones === 'string') {
                        parsedPhones = JSON.parse(item.phones);
                    } else if (Array.isArray(item.phones)) {
                        parsedPhones = item.phones;
                    }
                } catch (e) {
                    console.error("Error parseando teléfonos del cliente", item.name, e);
                }
                
                while (parsedPhones.length < 3) parsedPhones.push('');
                
                return {
                    ...item,
                    phones: parsedPhones
                };
            });

            setDirectorio(formattedData);
        } catch (error) {
            console.error("Error cargando el directorio de clientes", error);
        } finally {
            setLoadingDirectorio(false);
        }
    };

    useEffect(() => {
        cargarDirectorio();
    }, []);

    // ── CARGA DE CONFIGURACIÓN DE KPIS ──
    const [kpiConfig, setKpiConfig] = useState([]);
    const [loadingKpiConfig, setLoadingKpiConfig] = useState(true);

    useEffect(() => {
        if (!selectedRole?.id) return;

        if (selectedRole?.category !== 'Operativo') {
            setKpiConfig([]);
            setLoadingKpiConfig(false);
            return; 
        }

        const fetchKpiConfig = async () => {
            setLoadingKpiConfig(true);
            try {
                const res = await api.get('/compromisos/config');
                const rawConfig = res.data?.contenido || res.data || [];

                const parsedConfig = rawConfig.map(group => ({
                    ...group,
                    fields: typeof group.fields === 'string' ? JSON.parse(group.fields) : group.fields
                }));

                setKpiConfig(parsedConfig);
            } catch (error) {
                console.error("Error cargando la configuración de KPIs", error);
            } finally {
                setLoadingKpiConfig(false);
            }
        };

        fetchKpiConfig();
    }, [selectedRole?.id]);

    // ── CREACIÓN DE FILAS VACÍAS ──
    const createEmptyRows = (segmentName, count = 1) => {
        return Array.from({ length: count }, (_, i) => {
            const base = { id: Math.random().toString(36).substr(2, 9), time: '', name: '', isNew: true };

            switch (segmentName) {
                case 'Promoción':
                    return { ...base, classification: 'Prospecto', product: '', activity: '', city: '', colony: '', streets: '', phones: ['', '', ''] };
                case 'Evaluación e Integración':
                    return {
                        ...base, classification: 'Prospecto', typeIntegration: 'Nuevo', product: '',
                        estimatedAmount: '', annualRate: '0.00%', subProduct: 'NINGUNO', program: 'NINGUNO',
                        activity: 'Integración', city: '', colony: '', streets: '', portfolioStatus: 'N/A'
                    };
                case 'Seguimiento de Cartera':
                    return {
                        ...base, idCredito: '', moraInicioMes: '0', moraActual: '0', saldoInicioMes: '0', saldoActual: '0',
                        categoriaGestion: 'preventivo', ultimoEstatus: 'Puntual', ultimaFechaPago: '-', fechaVencimiento: '-',
                        montoAmortizacion: '0', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeManagement: ''
                    };
                case 'Gestión de Empresarias':
                    return { ...base, fechaIngreso: '-', moraDays: '0', saldoOcupado: '0', saldoDisponible: '0', typeManagement: 'Visita integral' };
                default:
                    return base;
            }
        });
    };

    const emptyKpi = {};

    // ── ESTADO INICIAL DE LA AGENDA ──
    const [currentAgenda, setCurrentAgenda] = useState({
        id: null,
        status: 'borrador',
        segments: {
            'Promoción': [], 
            'Evaluación e Integración': [],
            'Seguimiento de Cartera': [],
            'Gestión de Empresarias': []
        },
        kpiCompromisos: { ...emptyKpi },
        kpiReal: {},
        checkIns: {},
        unplannedVisits: [],
        metadata: {
            captureDate: '',
            captureTime: '',
            role: '',
            userName: 'Usuario Activo',
            hasModifications: false
        }
    });

    const [loadingAgenda, setLoadingAgenda] = useState(false);
    const [scheduledFollowUps, setScheduledFollowUps] = useState([]);

    useEffect(() => {
        if (!selectedRole || selectedRole.category !== 'Operativo') return;

        const cargarAgendaDelDia = async () => {
            setLoadingAgenda(true);
            try {
                const res = await api.get('/agenda/operativo/hoy');
                const agendaData = Array.isArray(res.data?.contenido) ? res.data.contenido[0] : (res.data?.contenido || res.data);

                if (agendaData && Object.keys(agendaData).length > 0) {
                    let parsedSegments = agendaData.segments || {};
                    if (typeof parsedSegments === 'string') parsedSegments = JSON.parse(parsedSegments);

                    let parsedKpiCompromisos = agendaData.kpiCompromisos || {};
                    if (typeof parsedKpiCompromisos === 'string') parsedKpiCompromisos = JSON.parse(parsedKpiCompromisos);

                    let parsedKpiReal = agendaData.kpiReal || {};
                    if (typeof parsedKpiReal === 'string') parsedKpiReal = JSON.parse(parsedKpiReal);

                    const safeSegments = {
                        ...parsedSegments,
                        'Promoción': parsedSegments['Promoción'] || [],
                        'Evaluación e Integración': parsedSegments['Evaluación e Integración'] || [],
                        'Seguimiento de Cartera': parsedSegments['Seguimiento de Cartera'] || [],
                        'Gestión de Empresarias': parsedSegments['Gestión de Empresarias'] || []
                    };

                    setCurrentAgenda(prev => ({
                        ...prev,
                        id: agendaData.id,
                        status: agendaData.status?.toLowerCase() || 'borrador',
                        segments: safeSegments,
                        kpiCompromisos: parsedKpiCompromisos,
                        kpiReal: parsedKpiReal,
                        metadata: { ...prev.metadata, role: selectedRole.name }
                    }));
                } else {
                    const isBorrador = selectedRole.id === 'coordinador-l';
                    setCurrentAgenda(prev => ({ 
                        ...prev, 
                        status: isBorrador ? 'borrador' : 'borrador',
                        id: null,
                        segments: {
                            'Promoción': [], 'Evaluación e Integración': [], 'Seguimiento de Cartera': [], 'Gestión de Empresarias': []
                        }
                    }));
                }

            } catch (error) {
                const mensajeError = error.response?.data?.mensaje || "";
                if (error.response?.status === 404 || mensajeError.includes("No se encontró información de la agenda")) {
                    setCurrentAgenda(prev => ({ 
                        ...prev, status: 'borrador', id: null,
                        segments: {
                            'Promoción': [], 'Evaluación e Integración': [], 'Seguimiento de Cartera': [], 'Gestión de Empresarias': []
                        }
                    }));
                } else {
                    console.error("Error crítico al cargar la agenda del día", error);
                }
            } finally {
                setLoadingAgenda(false);
            }
        };

        cargarAgendaDelDia();
    }, [selectedRole?.id]);

    // ── RENDERIZADO CONDICIONAL POR ROLES (RBAC) ──
    const getVisibleSegments = () => {
        const roleName = selectedRole?.name?.toUpperCase();
        return MATRIZ_SEGMENTOS[roleName] ?? SEGMENTOS_DEFAULT;
    };

    const updateVisit = (segmentName, index, field, value) => {
        setCurrentAgenda(prev => {
            const newSegments = { ...prev.segments };
            const updatedRow = { ...newSegments[segmentName][index], [field]: value };

            if (field === 'name' && value) {
                const match = directorio.find(item => item.name === value.toUpperCase());
                if (match) {
                    Object.keys(match).forEach(key => { updatedRow[key] = match[key]; });
                    updatedRow.idContacto = match.id || match.idContacto || match.id_contacto || null;
                    updatedRow.idControl = match.idControl || match.id_control || null;
                }
            }

            newSegments[segmentName][index] = updatedRow;
            return { ...prev, segments: newSegments };
        });
    };

    const updateKpi = (field, value) => {
        setCurrentAgenda(prev => ({
            ...prev,
            kpiCompromisos: { ...prev.kpiCompromisos, [field]: value }
        }));
    };

    const updateKpiReal = async (field, value) => {
        try {
            setCurrentAgenda(prev => ({
                ...prev, kpiReal: { ...prev.kpiReal, [field]: value }
            }));
            if (currentAgenda.id) {
                await api.put('/gestion-diaria/kpis/real', {
                    idPlan: currentAgenda.id, llaveFront: field, nuevoValor: value || 0
                });
            }
        } catch (error) {
            console.error("Error actualizando KPI real en el servidor", error);
        }
    };

    const registerCheckIn = async (visitId, data) => {
        try {
            const payload = {
                idVisita: visitId, visitaRealizada: data.visitaRealizada, clienteEncontrado: data.clienteEncontrado,
                actividadRealizada: data.actividadRealizada, motivoNoVisita: data.motivoNoVisita,
                motivoNoActividad: data.motivoNoActividad, resultado: data.resultado, tipoGestion: data.tipoGestion,
                checkInTime: data.checkInTime, visitaDuration: data.visitaDuration, lat: data.lat, lng: data.lng,
                gpsStatus: data.gpsStatus, pagoMonto: data.pagoMonto, pagoFecha: data.pagoFecha, notes: data.notes
            };
            await api.post('/gestion-diaria/ejecucion', payload);

            const checkInTime = new Date().toISOString();
            setCurrentAgenda(prev => ({
                ...prev,
                checkIns: { ...prev.checkIns, [visitId]: { ...data, registeredAt: checkInTime } }
            }));
        } catch (error) {
            console.error("Error al registrar el check-in", error);
            setAlertModal({
                isOpen: true,
                title: 'Error de Sincronización',
                message: 'No se pudo guardar la gestión en el servidor.',
                type: 'danger'
            });
        }
    };

    const addUnplannedVisit = async (data) => {
        try {
            const payload = {
                idPlan: currentAgenda.id,      
                idContacto: data.idContacto,   
                idVisita: null, 
                name: data.name, 
                resultado: data.resultado, 
                tipoGestion: data.tipoGestion,
                checkInTime: data.checkInTime, 
                pagoMonto: data.pagoMonto, 
                pagoFecha: data.pagoFecha, 
                notes: data.notes
            };

            await api.post('/gestion-diaria/ejecucion/no-planeada', payload);

            const id = Math.random().toString(36).substr(2, 9);
            
            const newVisit = { 
                id, 
                ...data, 
                isUnplanned: true,
                _segment: 'Visita No Planeada', 
                estado: 'FINALIZADA',           
                statusAction: 'FINALIZADA',
                _dbCheckIn: {                   
                    resultado: data.resultado,
                    visitaRealizada: true,
                    checkInTime: data.checkInTime,
                    gpsStatus: 'ok'
                }
            };
            
            setCurrentAgenda(prev => ({ 
                ...prev, 
                unplannedVisits: [...(prev.unplannedVisits || []), newVisit] 
            }));
        } catch (error) {
            console.error("Error al registrar visita no planeada", error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Hubo un error al registrar el imprevisto.',
                type: 'danger'
            });
        }
    };

    const scheduleFollowUp = (visitSource, { fecha, monto }) => {
        setScheduledFollowUps(prev => [...prev, {
            ...visitSource, id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            isFollowUp: true, time: null, compromisoFecha: fecha, compromisoCuanto: monto,
            isUnplanned: false, createdAt: new Date().toISOString(),
        }]);
    };

    const addRow = (segmentName) => {
        setCurrentAgenda(prev => ({
            ...prev, segments: { ...prev.segments, [segmentName]: [...prev.segments[segmentName], createEmptyRows(segmentName, 1)[0]] }
        }));
    };

    const removeRow = (segmentName, index) => {
        setCurrentAgenda(prev => {
            const segment = [...prev.segments[segmentName]];
            segment.splice(index, 1);
            return { ...prev, segments: { ...prev.segments, [segmentName]: segment } };
        });
    };

    // ── Sprint 5 / RF-11: Lector de gestiones REALMENTE ejecutadas ──────────
    // Si no se pasa una agenda, usa la del propio Context (`currentAgenda`).
    // Devuelve un mapa { [idVisita]: { checkInTime, resultado, gpsStatus } }
    // sólo cuando la agenda está en un estatus que admite gestiones cerradas.
    const getRealCheckIns = (agenda = currentAgenda) => {
        if (!agenda) return {};
        const validStatuses = ['aprobada', 'ejecutada', 'completada'];
        if (!validStatuses.includes(agenda.status?.toLowerCase())) return {};

        const result = {};
        const allVisits = Object.values(agenda.segments || {}).flat().filter(v => v && v.name);

        allVisits.forEach(v => {
            const isDone = v.statusAction === 'FINALIZADA'
                || v.statusAction === 'NO REALIZADA'
                || v.estado === 'FINALIZADA';
            if (isDone) {
                const resultText = v.managementResult || v.resultado || 'Gestionada';
                result[v.id] = {
                    checkInTime: v.time || '--:--',
                    resultado: String(resultText).split(' | ')[0],
                    resultadoCompleto: resultText,
                    gpsStatus: String(resultText).includes('GPS') ? 'ok' : 'idle'
                };
            }
        });
        return result;
    };

    const validateAgenda = () => {
        const allVisits = Object.entries(currentAgenda.segments)
            .filter(([name]) => getVisibleSegments().includes(name))
            .flatMap(([_, visits]) => visits.filter(v => v.name && v.time));

        const times = allVisits.map(v => v.time);
        if (times.length !== new Set(times).size) return { valid: false, message: "No se pueden empalmar horarios exactos." };

        const timeToMin = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const promoVisits = currentAgenda.segments['Promoción'].filter(v => v.name && v.time);
        for (const promo of promoVisits) {
            const pMin = timeToMin(promo.time);
            for (const other of allVisits) {
                if (promo.id === other.id) continue;
                const oMin = timeToMin(other.time);
                if (Math.abs(pMin - oMin) < 30) {
                    return { valid: false, message: `La visita de Promoción (${promo.time}) está muy cerca de "${other.name}" (${other.time}). Requiere al menos 30 min de espacio.` };
                }
            }
        }
        return { valid: true };
    };

    const sendForAuthorization = async () => {
        const activeVisits = Object.entries(currentAgenda.segments)
            .filter(([name]) => getVisibleSegments().includes(name))
            .flatMap(([_, visits]) => visits.filter(v => v.name));

        if (activeVisits.length === 0) {
            setAlertModal({
                isOpen: true,
                title: 'Acción Requerida',
                message: 'Debes registrar al menos una visita para enviar la agenda.',
                type: 'info'
            });
            return;
        }

        const validation = validateAgenda();
        if (!validation.valid) {
            setAlertModal({
                isOpen: true,
                title: 'Ajustes Necesarios',
                message: validation.message,
                type: 'danger'
            });
            return;
        }

        try {
            const idAreaMapeado = selectedRole?.canal?.toUpperCase() === 'COBRANZA' ? 2 : 1;

            const findCatalogId = (arrayCatalog, textValue) => {
                if (!textValue || !arrayCatalog) return null;
                const match = arrayCatalog.find(item => 
                    item.nombre?.toUpperCase().trim() === String(textValue).toUpperCase().trim()
                );
                if (match) return match.id_producto || match.id_programa || match.id_etiqueta || match.id_herramienta || match.id || null;
                return null;
            };

            const mappedSegments = {};
            Object.keys(currentAgenda.segments).forEach(segmentName => {
                mappedSegments[segmentName] = currentAgenda.segments[segmentName].map(v => {
                    const herramientaStr = v.herramientaAplicar || v.herramientaAplicada;

                    return {
                        ...v,
                        idProducto: findCatalogId(catalogos.productos, v.product),
                        idSubProducto: findCatalogId(catalogos.subproductos, v.subProduct),
                        idPrograma: findCatalogId(catalogos.programas, v.program),
                        idPortfolioStatus: findCatalogId(catalogos.estatusCartera, v.portfolioStatus),
                        idHerramienta: findCatalogId(catalogos.herramientas, herramientaStr)
                    };
                });
            });

            const payload = {
                idPlan: currentAgenda.id,
                idArea: idAreaMapeado,
                kpiCompromisos: currentAgenda.kpiCompromisos,
                segments: mappedSegments 
            };

            const response = await api.post(`/agenda/plan/certificar`, payload);

            if (response.data && response.data.codigo === 'OK') {
                setCurrentAgenda(prev => ({
                    ...prev,
                    id: response.data.contenido?.id || prev.id,
                    status: 'pendiente', 
                    segments: {
                        'Promoción': [], 'Evaluación e Integración': [], 'Seguimiento de Cartera': [], 'Gestión de Empresarias': []
                    }
                }));
                setAlertModal({
                    isOpen: true,
                    title: 'Ruta Certificada',
                    message: 'Agenda certificada y enviada a revisión exitosamente.',
                    type: 'success'
                });
            } else {
                setAlertModal({
                    isOpen: true,
                    title: 'Error de Sistema',
                    message: 'El servidor respondió, pero hubo un problema al guardar la agenda.',
                    type: 'danger'
                });
            }

        } catch (error) {
            console.error("Error al certificar agenda", error);
            setAlertModal({
                isOpen: true,
                title: 'Error de Red',
                message: 'Hubo un error de conexión al certificar la agenda.',
                type: 'danger'
            });
        }
    };

    const resetAgenda = async () => {
        try {
            setCurrentAgenda(prev => ({
                ...prev, status: 'borrador', kpiCompromisos: { ...emptyKpi }, kpiReal: {}, checkIns: {}, unplannedVisits: [],
                segments: { 'Promoción': [], 'Evaluación e Integración': [], 'Seguimiento de Cartera': [], 'Gestión de Empresarias': [] },
                metadata: { ...prev.metadata, hasModifications: false }
            }));
            setScheduledFollowUps([]);
        } catch(error) {
            console.error("Error borrando agenda", error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Ocurrió un problema al limpiar el formulario.',
                type: 'danger'
            });
        }
    };

    // ── INTEGRACIÓN REAL: ACTUALIZAR ESTATUS (Guardado Definitivo) ──
    const updateAgendaStatus = async (idPlan, nuevoEstatus, notes = '') => {
        // En caso de que se llame de forma local sin ID real, mantenemos protección
        if (!idPlan || idPlan === 'AJ-LOCAL') {
            setCurrentAgenda(prev => ({ ...prev, status: nuevoEstatus, notes }));
            return;
        }

        try {
            // Se envía el payload correspondiente al ActualizarEstatusRequest que espera el backend
            const payload = { estatus: nuevoEstatus, nota: notes };
            
            const response = await api.put(`/agenda/plan/${idPlan}/estatus`, payload);

            if (response.data && response.data.codigo === 'OK') {
                setCurrentAgenda(prev => ({ ...prev, status: nuevoEstatus, notes }));
                setAlertModal({
                    isOpen: true,
                    title: 'Estatus Actualizado',
                    message: `La agenda ha cambiado a estatus: ${nuevoEstatus}`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error al actualizar estatus de la agenda", error);
            setAlertModal({
                isOpen: true,
                title: 'Error de Sincronización',
                message: 'No se pudo actualizar el estatus de la agenda en el servidor.',
                type: 'danger'
            });
        }
    };

    return (
        <AgendaContext.Provider value={{
            currentAgenda, updateVisit, updateKpi, updateKpiReal, registerCheckIn, addUnplannedVisit,
            scheduleFollowUp, scheduledFollowUps, addRow, removeRow, sendForAuthorization, resetAgenda,
            getVisibleSegments, updateAgendaStatus, mockDatabase: directorio, loadingDirectorio,
            loadingAgenda, kpiConfig, loadingKpiConfig, getRealCheckIns
        }}>
            {children}
            
            <UIModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </AgendaContext.Provider>
    );
};

export const useAgenda = () => useContext(AgendaContext);