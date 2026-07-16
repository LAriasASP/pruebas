import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

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
                        categoriaGestion: 'S/N', ultimoEstatus: 'Puntual', ultimaFechaPago: '-', fechaVencimiento: '-',
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
    const agendaIdRef = useRef(currentAgenda.id);
    const agendaStatusRef = useRef(currentAgenda.status);

    useEffect(() => {
        agendaIdRef.current = currentAgenda.id;
        agendaStatusRef.current = currentAgenda.status;
    }, [currentAgenda.id, currentAgenda.status]);

    const cargarAgendaDelDia = async (silent = false) => {
        if (!silent) setLoadingAgenda(true);
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

                const textFields = ['name', 'classification', 'city', 'colony', 'streets', 'product', 'subProduct', 'program', 'activity', 'notes', 'typeVisitManagement', 'typeIntegration'];

                const normalizeVisits = (visitsArray) => {
                    if (!visitsArray) return [];
                    return visitsArray.map(v => {
                        const normalizedVisit = { ...v };
                        textFields.forEach(field => {
                            if (typeof normalizedVisit[field] === 'string') {
                                normalizedVisit[field] = normalizedVisit[field].toUpperCase();
                            }
                        });
                        return normalizedVisit;
                    });
                };

                const safeSegments = {};
                Object.keys(parsedSegments).forEach(key => {
                    safeSegments[key] = normalizeVisits(parsedSegments[key]);
                });

                ['Promoción', 'Evaluación e Integración', 'Seguimiento de Cartera', 'Gestión de Empresarias'].forEach(key => {
                    if (!safeSegments[key]) safeSegments[key] = [];
                });

                setCurrentAgenda(prev => ({
                    ...prev,
                    id: agendaData.id,
                    status: agendaData.status?.toLowerCase() || 'borrador',
                    notaJefe: agendaData.notaJefe?.toUpperCase() || 'REVISA Y AJUSTA LOS DETALLES DE TU JORNADA.',
                    segments: safeSegments,
                    kpiCompromisos: parsedKpiCompromisos,
                    kpiReal: parsedKpiReal,
                    unplannedVisits: [], 
                    metadata: { ...prev.metadata, role: selectedRole?.name }
                }));
            } else {
                const isBorrador = selectedRole?.id === 'coordinador-l';
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
            if (!silent) setLoadingAgenda(false);
        }
    };

    useEffect(() => {
        if (!selectedRole || selectedRole.category !== 'Operativo') return;
        cargarAgendaDelDia();
    }, [selectedRole?.id]);

    useEffect(() => {
        const API_COBRANZA = import.meta.env.VITE_API_ORIGIN_COBRANZA;
        const wsUrl = `${API_COBRANZA.replace(/^http/, 'ws')}/api/v1/ws/notificaciones`;
        let socket = null;
        let timerReconexion;
        let isMounted = true;

        const conectarWS = () => {
            if (!isMounted) return;
            try {
                socket = new WebSocket(wsUrl);

                socket.onopen = () => console.log('[WS Operativo] Conectado en tiempo real.');

                socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if ((data.type === 'STATUS_UPDATE' || data.type === 'AGENDA_UPDATE') && String(data.payload?.idPlan) === String(agendaIdRef.current)) {
                        const nuevoEstatus = (data.payload.estatus || data.payload.status)?.toLowerCase();
                        const estatusAnterior = agendaStatusRef.current?.toLowerCase();

                        if (nuevoEstatus && nuevoEstatus !== estatusAnterior) {
                            if (nuevoEstatus === 'requiere_modificacion') {
                                setAlertModal({ isOpen: true, title: 'AGENDA DEVUELTA', message: `TU SUPERVISOR HA DEVUELTO TU AGENDA PARA CORRECCIÓN.`, type: 'danger' });
                            }
                            else if ((nuevoEstatus === 'aprobada' || nuevoEstatus === 'autorizada') && estatusAnterior === 'pendiente') {
                                setAlertModal({ isOpen: true, title: '¡AGENDA AUTORIZADA!', message: '¡EXCELENTE! TU SUPERVISOR APROBÓ TU AGENDA. PUEDES INICIAR LA EJECUCIÓN.', type: 'success' });
                            }
                            else if (nuevoEstatus === 'completada' || data.payload.notaDictamen) {
                                setAlertModal({ isOpen: true, title: 'JORNADA EVALUADA', message: 'TU SUPERVISOR HA REGISTRADO EL DICTAMEN FINAL DE TU JORNADA.', type: 'info' });
                            }
                        }
                        cargarAgendaDelDia(true);
                    }
                };

                socket.onerror = (error) => {
                    if (isMounted) console.error("Error WS Operativo Context:", error);
                };

                socket.onclose = () => {
                    if (isMounted) {
                        console.warn("[WS Operativo] Desconectado. Intentando reconectar en 3s...");
                        clearTimeout(timerReconexion);
                        timerReconexion = setTimeout(() => conectarWS(), 3000);
                    }
                };

            } catch (error) {
                if (isMounted) console.error("Fallo crítico", error);
            }
        };

        conectarWS();

        return () => {
            isMounted = false;
            clearTimeout(timerReconexion);
            if (socket) {
                socket.onclose = null;
                socket.onerror = null;
                socket.onmessage = null;

                if (socket.readyState === WebSocket.OPEN) {
                    socket.close();
                } else if (socket.readyState === WebSocket.CONNECTING) {
                    socket.onopen = () => socket.close();
                }
            }
        };
    }, []);

    const getVisibleSegments = () => {
        const roleName = selectedRole?.name?.toUpperCase();
        return MATRIZ_SEGMENTOS[roleName] ?? SEGMENTOS_DEFAULT;
    };

    const updateVisit = (segmentName, index, fieldOrObject, value) => {
        setCurrentAgenda(prev => {
            const newSegments = { ...prev.segments };
            const newSegmentArray = [...newSegments[segmentName]];
            const visit = { ...newSegmentArray[index] };

            if (typeof fieldOrObject === 'object' && fieldOrObject !== null) {
                Object.keys(fieldOrObject).forEach(key => {
                    visit[key] = fieldOrObject[key];
                });
            } else {
                let finalValue = value;
                const textFields = ['city', 'colony', 'streets', 'notes', 'activity'];
                if (textFields.includes(fieldOrObject) && typeof value === 'string') {
                    finalValue = value.toUpperCase();
                }

                visit[fieldOrObject] = finalValue;

                if (fieldOrObject === 'name' && finalValue) {
                    const match = directorio.find(item => item.name === finalValue.toUpperCase());
                    if (match) {
                        Object.keys(match).forEach(key => { visit[key] = match[key]; });
                        visit.idContacto = match.idContacto || match.id_contacto || match.id || null;
                        visit.idControl = match.idControl || match.id_control || null;
                        visit.idCliente = match.idCliente || match.id_cliente || null;

                        let arrayPhones = ["", "", ""];
                        if (match.phones) {
                            try { arrayPhones = typeof match.phones === 'string' ? JSON.parse(match.phones) : match.phones; }
                            catch (e) { console.error("Error parseando teléfonos", e); }
                        }
                        while(arrayPhones.length < 3) arrayPhones.push('');
                        visit.phones = arrayPhones;
                    }
                }
            }

            newSegmentArray[index] = visit;
            newSegments[segmentName] = newSegmentArray;
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
        const valorNumerico = value === '' || isNaN(value) ? 0 : Number(value);

        setCurrentAgenda(prev => ({
            ...prev, kpiReal: { ...prev.kpiReal, [field]: valorNumerico }
        }));

       try {
            if (currentAgenda.id) {
                await api.put('/gestion-diaria/kpis/real', {
                    idPlan: currentAgenda.id, llaveFront: field, nuevoValor: valorNumerico
                });
            }
        } catch (error) {
            console.error("Error actualizando KPI real en el servidor", error);
        }
    };

    const registerCheckIn = async (visitId, data) => {
        try {
            const payload = {
                idPlan: currentAgenda.id,
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
                title: 'ERROR DE SINCRONIZACIÓN',
                message: 'NO SE PUDO GUARDAR LA GESTIÓN EN EL SERVIDOR.',
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
                title: 'ERROR',
                message: 'HUBO UN ERROR AL REGISTRAR EL IMPREVISTO.',
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

    const getRealCheckIns = (agenda = currentAgenda) => {
        if (!agenda) return {};
        const validStatuses = ['aprobada', 'ejecutada', 'completada'];
        if (!validStatuses.includes(agenda.status?.toLowerCase())) return {};

        const result = {};
        const allVisits = Object.values(agenda.segments || {}).flat().filter(v => v && (v.name || String(v.managementResult||'').toUpperCase().includes('IMPREVISTO')));

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
        if (times.length !== new Set(times).size) return { valid: false, message: "NO SE PUEDEN EMPALMAR HORARIOS EXACTOS." };

        const timeToMin = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const promoVisits = (currentAgenda.segments['Promoción'] || []).filter(v => v.name && v.time);
        for (const promo of promoVisits) {
            const pMin = timeToMin(promo.time);
            for (const other of allVisits) {
                if (promo.id === other.id) continue;
                const oMin = timeToMin(other.time);
                if (Math.abs(pMin - oMin) < 30) {
                    return { valid: false, message: `LA VISITA DE PROMOCIÓN (${promo.time}) ESTÁ MUY CERCA DE "${other.name.toUpperCase()}" (${other.time}). REQUIERE AL MENOS 30 MIN DE ESPACIO.` };
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
                title: 'ACCIÓN REQUERIDA',
                message: 'DEBES REGISTRAR AL MENOS UNA VISITA PARA ENVIAR LA AGENDA.',
                type: 'info'
            });
            return;
        }

        const validation = validateAgenda();
        if (!validation.valid) {
            setAlertModal({
                isOpen: true,
                title: 'AJUSTES NECESARIOS',
                message: validation.message.toUpperCase(),
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

                    const cleanNum = (val) => {
                        if (val === null || val === undefined || val === '') return null;
                        const parsed = Number(String(val).replace(/[^0-9.-]+/g, ""));
                        return isNaN(parsed) ? null : parsed;
                    };

                    const { herramientaAplicada, herramientaAplicar, ...cleanVisit } = v;

                    const estAmount = cleanNum(v.estimatedAmount);
                    const aRate = cleanNum(v.annualRate);

                    return {
                        ...cleanVisit,
                        estimatedAmount: estAmount !== null ? String(estAmount) : null,
                        annualRate: aRate !== null ? String(aRate) : null,

                        montoAmortizacion: cleanNum(v.montoAmortizacion),
                        montoRequeridoCorriente: cleanNum(v.montoRequeridoCorriente),
                        saldoInicioMes: cleanNum(v.saldoInicioMes),
                        saldoActual: cleanNum(v.saldoActual),
                        saldoOcupado: cleanNum(v.saldoOcupado),
                        saldoDisponible: cleanNum(v.saldoDisponible),
                        moraInicioMes: cleanNum(v.moraInicioMes),
                        moraActual: cleanNum(v.moraActual),
                        moraDays: cleanNum(v.moraDays),

                        herramientaAplicada: herramientaStr,

                        idProducto: findCatalogId(catalogos.productos, v.product),
                        idSubProducto: findCatalogId(catalogos.subproductos, v.subProduct),
                        idPrograma: findCatalogId(catalogos.programas, v.program),
                        idPortfolioStatus: findCatalogId(catalogos.estatusCartera, v.portfolioStatus),
                        idHerramienta: findCatalogId(catalogos.herramientas, herramientaStr)
                    };
                });
            });

            const numericKpis = {};
            Object.keys(currentAgenda.kpiCompromisos || {}).forEach(k => {
                 const val = currentAgenda.kpiCompromisos[k];
                 numericKpis[k] = val ? Number(String(val).replace(/[^0-9.-]+/g,"")) : 0;
            });

            const payload = {
                idPlan: currentAgenda.id,
                idArea: idAreaMapeado,
                kpiCompromisos: numericKpis,
                segments: mappedSegments
            };

            const response = await api.post(`/agenda/plan/certificar`, payload);

            if (response.data && response.data.codigo === 'OK') {
                const realId = response.data.contenido?.id || prev.id;
                agendaIdRef.current = realId;

                setCurrentAgenda(prev => ({
                    ...prev,
                    id: realId,
                    status: 'pendiente',
                    segments: {
                        'Promoción': [], 'Evaluación e Integración': [], 'Seguimiento de Cartera': [], 'Gestión de Empresarias': []
                    }
                }));
                setAlertModal({
                    isOpen: true,
                    title: 'AGENDA CAPTURADA EXITOSAMENTE',
                    message: 'AGENDA ENVIADA A SUPERVISOR PARA SU VALIDACIÓN.',
                    type: 'success'
                });
            } else {
                setAlertModal({
                    isOpen: true,
                    title: 'ERROR DE SISTEMA',
                    message: 'EL SERVIDOR RESPONDIÓ, PERO HUBO UN PROBLEMA AL GUARDAR LA AGENDA.',
                    type: 'danger'
                });
            }

        } catch (error) {
            console.error("Error al certificar agenda", error);
            setAlertModal({
                isOpen: true,
                title: 'ERROR DE RED',
                message: 'HUBO UN ERROR DE CONEXIÓN AL CERTIFICAR LA AGENDA.',
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
                title: 'ERROR',
                message: 'OCURRIÓ UN PROBLEMA AL LIMPIAR EL FORMULARIO.',
                type: 'danger'
            });
        }
    };

    const updateAgendaStatus = async (idPlan, nuevoEstatus, notes = '') => {
        if (!idPlan || idPlan === 'AJ-LOCAL') {
            setCurrentAgenda(prev => ({ ...prev, status: nuevoEstatus, notes }));
            return;
        }

        try {
            const payload = { estatus: nuevoEstatus, nota: notes };

            const response = await api.put(`/agenda/plan/${idPlan}/estatus`, payload);

            if (response.data && response.data.codigo === 'OK') {
                setCurrentAgenda(prev => ({ ...prev, status: nuevoEstatus, notes }));
                setAlertModal({
                    isOpen: true,
                    title: 'ESTATUS ACTUALIZADO',
                    message: `LA AGENDA HA CAMBIADO A ESTATUS: ${nuevoEstatus}`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error al actualizar estatus de la agenda", error);
            setAlertModal({
                isOpen: true,
                title: 'ERROR DE SINCRONIZACIÓN',
                message: 'NO SE PUDO ACTUALIZAR EL ESTATUS DE LA AGENDA EN EL SERVIDOR.',
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
                title={alertModal.title.toUpperCase()}
                message={alertModal.message.toUpperCase()}
                type={alertModal.type}
            />
        </AgendaContext.Provider>
    );
};

export const useAgenda = () => useContext(AgendaContext);