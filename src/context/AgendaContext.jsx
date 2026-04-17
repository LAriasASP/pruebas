import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRole } from './RoleContext';
// Importamos tu cliente de Axios ya configurado (Ajusta la ruta si es necesario)
import api from '../api/axiosConfig';

const AgendaContext = createContext();

export const AgendaProvider = ({ children }) => {
    const { selectedRole } = useRole();

    // ── FASE 2: ESTADO DEL DIRECTORIO DE CLIENTES ──
    const [directorio, setDirectorio] = useState([]);
    const [loadingDirectorio, setLoadingDirectorio] = useState(true);

    const cargarDirectorio = async () => {
        try {
            setLoadingDirectorio(true);
            
            // EP Lógico -> GET /api/v1/agenda/contactos-usuario
            const res = await api.get('/agenda/contactos-usuario');
            const rawData = res.data?.contenido || res.data || [];

            // PRE-PROCESAMIENTO: Convertimos la cadena JSON de teléfonos a un arreglo real
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
                
                // Aseguramos que siempre haya 3 posiciones para los inputs
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

    // ── FASE 4: CARGA DE CONFIGURACIÓN DE KPIS ──
    const [kpiConfig, setKpiConfig] = useState([]);
    const [loadingKpiConfig, setLoadingKpiConfig] = useState(true);

    useEffect(() => {
        if (!selectedRole?.id) return;

        const fetchKpiConfig = async () => {
            setLoadingKpiConfig(true);
            try {
                // EP Lógico -> GET /api/v1/compromisos/config
                const res = await api.get('/compromisos/config');
                const rawConfig = res.data?.contenido || res.data || [];

                // Validamos si el backend manda 'fields' como string JSON y lo parseamos
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

    // ── FASE 3: ESTADO INICIAL DE LA AGENDA ──
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

    // ── FASE 3: CARGA DE LA AGENDA DEL DÍA ──
    useEffect(() => {
        if (!selectedRole || selectedRole.category !== 'Operativo') return;

        const cargarAgendaDelDia = async () => {
            setLoadingAgenda(true);
            try {
                // EP Lógico -> GET /api/v1/agenda/operativo/hoy
                const res = await api.get('/agenda/operativo/hoy');
                
                // Extraemos el primer elemento si devuelve un arreglo, o el objeto directo
                const agendaData = Array.isArray(res.data?.contenido) ? res.data.contenido[0] : (res.data?.contenido || res.data);

                if (agendaData && Object.keys(agendaData).length > 0) {
                    // Validamos si los segmentos vienen como JSON String desde PostgreSQL
                    let parsedSegments = agendaData.segments || {};
                    if (typeof parsedSegments === 'string') {
                        parsedSegments = JSON.parse(parsedSegments);
                    }

                    // 👇 NUEVO: Parseamos los KPIs que ahora manda el Backend
                    let parsedKpiCompromisos = agendaData.kpiCompromisos || {};
                    if (typeof parsedKpiCompromisos === 'string') {
                        parsedKpiCompromisos = JSON.parse(parsedKpiCompromisos);
                    }

                    let parsedKpiReal = agendaData.kpiReal || {};
                    if (typeof parsedKpiReal === 'string') {
                        parsedKpiReal = JSON.parse(parsedKpiReal);
                    }

                    // Aseguramos que existan las llaves principales aunque vengan vacías
                    const safeSegments = {
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
                        kpiCompromisos: parsedKpiCompromisos, // <--- INYECTAMOS LOS COMPROMISOS
                        kpiReal: parsedKpiReal,               // <--- INYECTAMOS EL AVANCE REAL
                        metadata: {
                            ...prev.metadata,
                            role: selectedRole.name,
                        }
                    }));
                } else {
                    // Si el backend responde 200 pero vacío (no tiene agenda hoy)
                    const isBorrador = selectedRole.id === 'coordinador-l';
                    setCurrentAgenda(prev => ({ 
                        ...prev, 
                        status: isBorrador ? 'borrador' : 'borrador',
                        id: null,
                        segments: {
                            'Promoción': [], 
                            'Evaluación e Integración': [],
                            'Seguimiento de Cartera': [],
                            'Gestión de Empresarias': []
                        }
                    }));
                }

            } catch (error) {
                // Manejo inteligente del "error" del backend cuando es un día nuevo
                const mensajeError = error.response?.data?.mensaje || "";
                
                if (error.response?.status === 404 || mensajeError.includes("No se encontró información de la agenda")) {
                    console.log("No hay agenda para hoy. Iniciando en modo Borrador limpio.");
                    setCurrentAgenda(prev => ({ 
                        ...prev, 
                        status: 'borrador',
                        id: null,
                        segments: {
                            'Promoción': [], 
                            'Evaluación e Integración': [],
                            'Seguimiento de Cartera': [],
                            'Gestión de Empresarias': []
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

    const getVisibleSegments = () => {
        const roleId = selectedRole?.id;
        if (roleId === 'asesor-f') return ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera'];
        if (roleId === 'gestor-i') return ['Evaluación e Integración', 'Seguimiento de Cartera'];
        if (roleId === 'gestor-e') return ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera'];
        return ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera', 'Gestión de Empresarias'];
    };

   const updateVisit = (segmentName, index, field, value) => {
        setCurrentAgenda(prev => {
            const newSegments = { ...prev.segments };
            const updatedRow = { ...newSegments[segmentName][index], [field]: value };

            if (field === 'name' && value) {
                const match = directorio.find(item => item.name === value.toUpperCase());
                if (match) {
                    Object.keys(match).forEach(key => {
                        updatedRow[key] = match[key];
                    });
                    
                    updatedRow.idContacto = match.id || match.idContacto || match.id_contacto || null;
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
            // Actualización optimista en el UI para que se sienta rápido
            setCurrentAgenda(prev => ({
                ...prev,
                kpiReal: { ...prev.kpiReal, [field]: value }
            }));

            // LLAMADA REAL AL BACKEND EN SEGUNDO PLANO
            if (currentAgenda.id) {
                await api.put('/gestion-diaria/kpis/real', {
                    idPlan: currentAgenda.id,
                    llaveFront: field,
                    nuevoValor: value || 0
                });
            }
        } catch (error) {
            console.error("Error actualizando KPI real en el servidor", error);
            // Podrías revertir el valor si falla, pero para KPIs suele ser suficiente con loguearlo
        }
    };

   const registerCheckIn = async (visitId, data) => {
        try {
            const payload = {
                idVisita: visitId,
                visitaRealizada: data.visitaRealizada,
                clienteEncontrado: data.clienteEncontrado,
                actividadRealizada: data.actividadRealizada,
                motivoNoVisita: data.motivoNoVisita,
                motivoNoActividad: data.motivoNoActividad,
                resultado: data.resultado,
                tipoGestion: data.tipoGestion,
                checkInTime: data.checkInTime,
                visitaDuration: data.visitaDuration,
                lat: data.lat,
                lng: data.lng,
                gpsStatus: data.gpsStatus,
                pagoMonto: data.pagoMonto,
                pagoFecha: data.pagoFecha,
                notes: data.notes
            };

            //LLAMADA REAL AL BACKEND
            await api.post('/gestion-diaria/ejecucion', payload);

            // Actualizamos la memoria de React para que el UI pinte la palomita verde
            const checkInTime = new Date().toISOString();
            setCurrentAgenda(prev => ({
                ...prev,
                checkIns: {
                    ...prev.checkIns,
                    [visitId]: { ...data, registeredAt: checkInTime }
                }
            }));

        } catch (error) {
            console.error("Error al registrar el check-in", error);
            alert("No se pudo guardar la gestión en el servidor.");
        }
    };


    const addUnplannedVisit = async (data) => {
        try {
            const payload = {
                idVisita: null, // Null porque es imprevisto
                name: data.name,
                resultado: data.resultado,
                tipoGestion: data.tipoGestion,
                checkInTime: data.checkInTime,
                pagoMonto: data.pagoMonto,
                pagoFecha: data.pagoFecha,
                notes: data.notes
            };

            // LLAMADA REAL AL BACKEND
            await api.post('/gestion-diaria/ejecucion/no-planeada', payload);

            // Actualizamos el UI
            const id = Math.random().toString(36).substr(2, 9);
            const newVisit = { id, ...data, isUnplanned: true };
            
            setCurrentAgenda(prev => ({
                ...prev,
                unplannedVisits: [...(prev.unplannedVisits || []), newVisit]
            }));

        } catch (error) {
            console.error("Error al registrar visita no planeada", error);
            alert("Hubo un error al registrar el imprevisto.");
        }
    };

    const scheduleFollowUp = (visitSource, { fecha, monto }) => {
        setScheduledFollowUps(prev => [...prev, {
            ...visitSource,
            id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            isFollowUp: true,
            time: null,          
            compromisoFecha: fecha,
            compromisoCuanto: monto,
            isUnplanned: false,
            createdAt: new Date().toISOString(),
        }]);
    };

    const addRow = (segmentName) => {
        setCurrentAgenda(prev => ({
            ...prev,
            segments: {
                ...prev.segments,
                [segmentName]: [...prev.segments[segmentName], createEmptyRows(segmentName, 1)[0]]
            }
        }));
    };

    const removeRow = (segmentName, index) => {
        setCurrentAgenda(prev => {
            const segment = [...prev.segments[segmentName]];
            segment.splice(index, 1);
            return {
                ...prev,
                segments: {
                    ...prev.segments,
                    [segmentName]: segment
                }
            };
        });
    };

    const validateAgenda = () => {
        const allVisits = Object.entries(currentAgenda.segments)
            .filter(([name]) => getVisibleSegments().includes(name))
            .flatMap(([_, visits]) => visits.filter(v => v.name && v.time));

        const times = allVisits.map(v => v.time);

        if (times.length !== new Set(times).size) {
            return { valid: false, message: "No se pueden empalmar horarios exactos." };
        }

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
                const diff = Math.abs(pMin - oMin);
                if (diff < 30) {
                    return {
                        valid: false,
                        message: `La visita de Promoción (${promo.time}) está muy cerca de "${other.name}" (${other.time}). Requiere al menos 30 min de espacio.`
                    };
                }
            }
        }

        return { valid: true };
    };

   const sendForAuthorization = async () => {
        // 1. Validamos que haya al menos una visita
        const activeVisits = Object.entries(currentAgenda.segments)
            .filter(([name]) => getVisibleSegments().includes(name))
            .flatMap(([_, visits]) => visits.filter(v => v.name));

        if (activeVisits.length === 0) {
            alert("Debes registrar al menos una visita para enviar la agenda.");
            return;
        }

        // 2. Validamos que no haya empalmes de tiempo
        const validation = validateAgenda();
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

       try {
            const payload = {
                idPlan: currentAgenda.id, // Viaja como null si es nueva, o con el número si ya existía
                kpiCompromisos: currentAgenda.kpiCompromisos,
                segments: currentAgenda.segments
            };

            // SIEMPRE le pegamos al mismo endpoint
            const response = await api.post(`/agenda/plan/certificar`, payload);

           // ... dentro del try de sendForAuthorization
            if (response.data && response.data.codigo === 'OK') {
                setCurrentAgenda(prev => ({
                    ...prev,
                    id: response.data.contenido?.id || prev.id,
                    status: 'pendiente', 
                    segments: { // 👈 Limpiamos los segmentos locales para forzar que Ejecución no vea nada viejo
                        'Promoción': [],
                        'Evaluación e Integración': [],
                        'Seguimiento de Cartera': [],
                        'Gestión de Empresarias': []
                    }
                }));
                alert("Agenda certificada.");
            } else {
                alert("El servidor respondió, pero hubo un problema al guardar la agenda.");
            }

        } catch (error) {
            console.error("Error al certificar agenda", error);
            alert("Hubo un error de conexión al certificar la agenda.");
        }
    };

    const resetAgenda = async () => {
        if (window.confirm("¿Seguro que deseas borrar toda la planificación? Esta acción no se puede deshacer.")) {
            
            try {
                // Si la agenda ya existía en BD, podríamos avisarle al backend que borre las acciones
                if (currentAgenda.id) {
                    // await api.delete(`/agenda/plan/${currentAgenda.id}/acciones`);
                }

                setCurrentAgenda(prev => ({
                    ...prev,
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
                    metadata: { ...prev.metadata, hasModifications: false }
                }));
                setScheduledFollowUps([]);

            } catch(error) {
                console.error("Error borrando agenda", error);
                alert("Hubo un error al borrar. Intenta de nuevo.");
            }
        }
    };

    const updateAgendaStatus = (id, status, notes = '') => {
        if (id === 'AJ-LOCAL') {
            setCurrentAgenda(prev => ({ ...prev, status, notes }));
        }
    };

    return (
        <AgendaContext.Provider value={{
            currentAgenda,
            updateVisit,
            updateKpi,
            updateKpiReal,
            registerCheckIn,
            addUnplannedVisit,
            scheduleFollowUp,
            scheduledFollowUps,
            addRow,
            removeRow,
            sendForAuthorization,
            resetAgenda,
            getVisibleSegments,
            updateAgendaStatus,
            mockDatabase: directorio,
            loadingDirectorio,
            loadingAgenda,
            kpiConfig,
            loadingKpiConfig
        }}>
            {children}
        </AgendaContext.Provider>
    );
};

export const useAgenda = () => useContext(AgendaContext);