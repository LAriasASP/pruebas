import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRole } from './RoleContext';
import { AGENDAS_COMERCIAL, AGENDAS_COBRANZA } from '../data/agendaMockData';

const AgendaContext = createContext();

/**
 * TODO: EP: GET /api/v1/contactos/directorio
 * Consulta Backend:
 * SELECT 
 * (select cl.id_cliente from agendas.clientes cl where cl.id_contacto = c.id_contacto) as id_cliente,
 * c.id_contacto,
 * c.nombre,
 * (select c2.nombre as calificacion from agendas.clasificaciones as c2 where c2.id_clasificacion = c.id_clasificacion),
 * c.ciudad, 
 * c.colonia, 
 * c.calles,
 * c.telefonos, 
 * (select p.nombre as producto from catalogos.productos p where p.id_producto = c.id_producto),
 * c.correo, 
 * c.fch_crea, 
 * c.fch_modifica, 
 * c.id_usuario_crea,
 * c.id_usuario_modifica,
 * c.activo
 * FROM agendas.contactos c ORDER BY id_contacto ASC;
 * * Resultado en JSON esperado:
 * [
 * {
 * "id_cliente" : null,
 * "id_contacto" : 1,
 * "nombre" : "JUAN PEREZ",
 * "calificacion" : "CONTACTO",
 * "ciudad" : "León",
 * "colonia" : "Centro",
 * "calles" : "Madero 123",
 * "telefonos" : "[\"5512345678\", \"5511112222\", \"\"]",
 * "producto" : "NA"
 * },
 * // ...
 * ]
 */
export const mockDatabase = [
    // --- CONTACTOS (6) ---
    { name: 'JUAN PEREZ', classification: 'Contacto', phones: ['5512345678', '5511112222', ''], city: 'León', colony: 'Centro', streets: 'Madero 123' },
    { name: 'MARIA GARCIA', classification: 'Contacto', phones: ['5523456789', '', ''], city: 'León', colony: 'Centro', streets: 'Madero 124' },
    { name: 'RICARDO TAPIA', classification: 'Contacto', phones: ['5534567890', '5588889999', '5577776666'], city: 'León', colony: 'Zapata', streets: 'Hidalgo 456' },
    { name: 'LAURA SANCHEZ', classification: 'Contacto', phones: ['5545678901', '', ''], city: 'León', colony: 'Zapata', streets: 'Hidalgo 457' },
    { name: 'CARLOS LOPEZ', classification: 'Contacto', phones: ['5556789012', '', ''], city: 'León', colony: 'Obregon', streets: 'Juarez 88' },
    { name: 'LOLA BELTRAN', classification: 'Contacto', phones: ['5588990011', '', ''], city: 'Silao', colony: 'Centro', streets: '5 de Mayo 10' },

    // --- PROSPECTOS (7) ---
    { name: 'BRENDA RUIZ', classification: 'Prospecto', product: 'Microcredito', city: 'Irapuato', colony: 'Juarez', streets: 'Reforma 789', phones: ['5567890123', '', ''] },
    { name: 'FABIAN MORALES', classification: 'Prospecto', product: 'Consumo', city: 'Irapuato', colony: 'Juarez', streets: 'Reforma 790', phones: ['5578901234', '', ''] },
    { name: 'SOFIA HERRERA', classification: 'Prospecto', product: 'Pyme', city: 'Silao', colony: 'Centro', streets: 'Aldama 12', phones: ['5589012345', '', ''] },
    { name: 'DIEGO VARGAS', classification: 'Prospecto', product: 'Microcredito', city: 'Silao', colony: 'Centro', streets: 'Aldama 13', phones: ['5590123456', '', ''] },
    { name: 'ELENA MORENO', classification: 'Prospecto', product: 'Captación', city: 'Guanajuato', colony: 'Marfil', streets: 'Callejon 4', phones: ['5501234567', '', ''] },
    { name: 'JAVIER SOLIS', classification: 'Prospecto', product: 'Microcredito', city: 'Irapuato', colony: 'Centro', streets: 'Pino 5', phones: ['5577889900', '', ''] },
    { name: 'JOSE ALFREDO', classification: 'Prospecto', product: 'Captación', city: 'Guanajuato', colony: 'Centro', streets: 'Dolores 3', phones: ['5511002233', '', ''] },

    // --- CLIENTES (7) - Full data for all possible segments ---
    {
        name: 'KARLA MEDELLIN', 
        
        idCredito: 'CR-8829-2025', 

        product: 'Microcredito',

        typeIntegration: 'Renovación', //Canales ok

        estimatedAmount: '45000', 
        annualRate: '35.00', 
        subProduct: 'PREFERENCIAL', //producto id_tipo 4
        program: 'SCORE 500', //programa
        moraInicioMes: '0', 
        moraActual: '2', 
        saldoInicioMes: '45000', 
        saldoActual: '44200',
        portfolioStatus: 'Abono/ Pago Parcial', //estados
        ultimoEstatus: 'Vigente',
        fechaIngreso: '15/05/2024', 
        entryDate: '15/05/2024', 
        saldoOcupado: '45000', 
        saldoDisponible: '5000',
        moraDays: '2',        

        ultimaFechaPago: '10/02/2026', 
        fechaVencimiento: '15/03/2026', 
        montoAmortizacion: '2500', 
        montoRequeridoCorriente: '0',
        herramientaAplicada: 'Ninguna', //modalidades
        categoriaGestion: 'Preventivo'
    },
    {
        name: 'HUGO GALAVAN', 
        classification: 'Cliente', 
        
        idCredito: 'CR-9012-2025', 
        
        product: 'Consumo',

        typeIntegration: 'Nuevo', 
        estimatedAmount: '12000', 
        annualRate: '42.50', 
        subProduct: 'NINGUNO', 
        program: 'NINGUNO',
        moraInicioMes: '5', 
        moraActual: '0', 
        saldoInicioMes: '12000', 
        saldoActual: '10500',
        portfolioStatus: 'Compromiso de pago', 
        ultimoEstatus: 'Vigente',
        fechaIngreso: '20/06/2024', 
        entryDate: '20/06/2024', 
        saldoOcupado: '12000', 
        saldoDisponible: '8000',
        moraDays: '0', 
        
        phones: ['5522334455', '', ''], 
        city: 'León', 
        colony: 'Centro', 
        streets: 'Pino Suarez 10',

        ultimaFechaPago: '20/02/2026', 
        fechaVencimiento: '20/03/2026', 
        montoAmortizacion: '1200', 
        montoRequeridoCorriente: '0',
        herramientaAplicada: 'Ninguna', 
        categoriaGestion: 'Control'
    },
    {
        name: 'ANA VICTORIA', classification: 'Cliente', idCredito: 'CR-1122-2025', product: 'Pyme',

        typeIntegration: 'Renovación', 
        estimatedAmount: '150000', 
        annualRate: '28.00', 
        subProduct: 'BOLSÓN', 
        program: 'ATRACCIÓN DE LA COMPETENCIA',
        moraInicioMes: '0', 
        moraActual: '0', 
        saldoInicioMes: '85000', 
        saldoActual: '80000',
        portfolioStatus: 'Sin contacto', 
        ultimoEstatus: 'Vigente',
        fechaIngreso: '10/01/2024', 
        entryDate: '10/01/2024', 
        saldoOcupado: '85000',
        saldoDisponible: '15000',
        moraDays: '0', 
        
        phones: ['5533445566', '', ''], 
        city: 'Silao', 
        colony: 'Centro', 
        streets: 'Morelos 22',

        ultimaFechaPago: '05/02/2026', 
        fechaVencimiento: '10/03/2026', 
        montoAmortizacion: '8500', 
        montoRequeridoCorriente: '0',
        herramientaAplicada: 'Ninguna', 
        categoriaGestion: 'Preventivo'
    },
    {
        name: 'ROBERTO GOMEZ', 
        classification: 'Cliente', 

        idCredito: 'CR-3344-2025', 

        product: 'Microcredito',

        typeIntegration: 'Tratamiento', 
        estimatedAmount: '15000', 
        annualRate: '45.00', 
        subProduct: 'FASTCREDIT', 
        program: 'OTRO',
        moraInicioMes: '30', 
        moraActual: '32', 
        saldoInicioMes: '15000', 
        saldoActual: '15000',
        portfolioStatus: 'Promesa de pago', 
        ultimoEstatus: 'Vencido',
        fechaIngreso: '12/03/2024', 
        entryDate: '12/03/2024', 
        saldoOcupado: '15000', 
        saldoDisponible: '0',
        moraDays: '32', 

        phones: ['5544556677', '', ''], 
        city: 'León', 
        colony: 'Lomas', 
        streets: 'Roble 12',

        ultimaFechaPago: '12/01/2026', 
        fechaVencimiento: '12/02/2026', 
        montoAmortizacion: '4500', 
        montoRequeridoCorriente: '4500',
        herramientaAplicada: 'Ninguna', 
        categoriaGestion: 'Recuperación'
    },
    {
        name: 'SANDRA LUZ', 
        classification: 'Cliente', 
        
        idCredito: 'CR-5566-2025', 
        
        product: 'Captación',

        typeIntegration: 'Nuevo', 
        estimatedAmount: '0', 
        annualRate: '0.00', subProduct: 'NINGUNO', 
        program: 'NINGUNO',
        moraInicioMes: '0', 
        moraActual: '0', 
        saldoInicioMes: '0', 
        saldoActual: '0',
        portfolioStatus: 'N/A', 
        ultimoEstatus: 'Vigente',
        fechaIngreso: '05/07/2024', 
        entryDate: '05/07/2024', 
        saldoOcupado: '0', 
        saldoDisponible: '25000',
        moraDays: '0', 
        
        phones: ['5555667788', '', ''], 
        city: 'Irapuato', 
        colony: 'Centro', 
        streets: 'Juarez 1',

        ultimaFechaPago: '-', 
        fechaVencimiento: '-', 
        montoAmortizacion: '0', 
        montoRequeridoCorriente: '0',
        herramientaAplicada: 'N/A', 
        categoriaGestion: 'Preventivo'
    },
    {
        name: 'PEDRO INFANTE', 
        classification: 'Cliente', 

        idCredito: 'CR-7788-2025',

        product: 'Consumo',

        typeIntegration: 'Nuevo', 
        estimatedAmount: '5000', 
        annualRate: '38.00', 
        subProduct: 'LIQUIDEZ', 
        program: 'NINGUNO',
        moraInicioMes: '0', 
        moraActual: '0', 
        saldoInicioMes: '5000', 
        saldoActual: '2000',
        portfolioStatus: 'Abono/ Pago Parcial', 
        ultimoEstatus: 'Vigente',
        fechaIngreso: '10/08/2024', 
        entryDate: '10/08/2024', 
        saldoOcupado: '5000', 
        saldoDisponible: '3000',
        moraDays: '0', 
        phones: ['5566778899', '', ''], 
        city: 'León', 
        colony: 'Obregon', 
        streets: 'Revolucion 45',

        ultimaFechaPago: '15/02/2026', 
        fechaVencimiento: '15/03/2026', 
        montoAmortizacion: '500', 
        montoRequeridoCorriente: '0',
        herramientaAplicada: 'Ninguna', 
        categoriaGestion: 'Preventivo'
    },
    {
        name: 'VICENTE FERNANDEZ', 
        classification: 'Cliente', 
        idCredito: 'CR-9900-2025', 
        product: 'Pyme',
        typeIntegration: 'Convenio', 
        estimatedAmount: '150000', 
        annualRate: '25.00', 
        subProduct: 'BACK TO BACK', 
        program: 'SCORE 500',
        moraInicioMes: '10', 
        moraActual: '12', 
        saldoInicioMes: '150000', 
        saldoActual: '150000',
        portfolioStatus: 'Promesa de pago', 
        ultimoEstatus: 'Vencido',
        fechaIngreso: '01/01/2024',
        entryDate: '01/01/2024', 
        saldoOcupado: '150000', 
        saldoDisponible: '0',
        moraDays: '12', 
        
        phones: ['5599001122', '', ''], 
        city: 'Irapuato', 
        colony: 'Juarez', 
        streets: 'Libertad 100',

        ultimaFechaPago: '01/01/2026', 
        fechaVencimiento: '01/02/2026', 
        montoAmortizacion: '15000', 
        montoRequeridoCorriente: '15000',
        herramientaAplicada: 'Ninguna', //Modalidad
        categoriaGestion: 'Legal'
    }
];

export const AgendaProvider = ({ children }) => {
    const { selectedRole } = useRole();

    // Helper to create empty rows based on segment type
    const createEmptyRows = (segmentName, count = 2) => {
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

    const [currentAgenda, setCurrentAgenda] = useState({
        status: 'borrador',
        segments: {
            'Promoción': createEmptyRows('Promoción'),
            'Evaluación e Integración': createEmptyRows('Evaluación e Integración'),
            'Seguimiento de Cartera': createEmptyRows('Seguimiento de Cartera'),
            'Gestión de Empresarias': createEmptyRows('Gestión de Empresarias')
        },
        kpiCompromisos: { ...emptyKpi },
        kpiReal: {},
        checkIns: {},
        unplannedVisits: [],
        metadata: {
            captureDate: '',
            captureTime: '',
            role: '',
            userName: 'Usuario Demo',
            hasModifications: false
        }
    });

    const [agendas, setAgendas] = useState([]);
    const [scheduledFollowUps, setScheduledFollowUps] = useState([]);

    /**
     * TODO: EP: GET /api/v1/kpis/metas?fecha=YYYY-MM-DD
     * Consulta Backend: Extrae las metas y compromisos capturados previamente.
     * En el futuro este mock se eliminará y el estado kpiCompromisos 
     * se llenará directamente con la respuesta del backend.
     */
    const DEMO_KPI_COMPROMISOS = {
        'asesor-f': { captNueva: '120000', captReinversion: '85000', colocInicial: '95000', colocRedisposicion: '45000', rec0: '18000', rec1_7: '12000', rec8_30: '8500', rec31_60: '4000', recMas61: '2000' },
        'asesor-c': { captNueva: '95000', captReinversion: '60000', dispersion: '180000', dispersionNueva: '75000', aperturasCredFacil: '8', montoLineasApertura: '240000', rec0: '22000', rec1_7: '15000', rec8_30: '9000', rec31_60: '5000', recMas61: '2500', servicioPremiumPendiente: '3' },
        'coordinador-l': { captNueva: '80000', captReinversion: '55000', dispersion: '150000', dispersionNueva: '60000', aperturasCredFacil: '6', montoLineasApertura: '180000', rec0: '16000', rec1_7: '11000', rec8_30: '7000', rec31_60: '3500', recMas61: '1500', servicioPremiumPendiente: '2' },
        'gestor-i': { cobranzaTotalDia: '45000', cobranza1_30: '28000', cobranza31_60: '12000', opCobradas: '14', visitasRealizadas: '8', promesasDia: '5', montoPromesas: '18000', saldoSaneadoDia: '8000', contencionMas30: '22000', contencionMas60: '12000', contencionMas89: '5000' },
        'gestor-e': { captNueva: '70000', captReinversion: '40000', dispersion: '120000', dispersionNueva: '50000', aperturasCredFacil: '5', montoLineasApertura: '150000', rec0: '14000', rec1_7: '9000', rec8_30: '6000', rec31_60: '3000', recMas61: '1200', servicioPremiumPendiente: '2' },
    };

    /**
     * TODO: EP: GET /api/v1/agendas/operativo/hoy
     * Esta constante asocia temporalmente los usuarios Mock con las agendas.
     * En producción, simplemente llamarás al EP que te regresará el JSON 
     * con la agenda del usuario logueado en base a su Token.
     */
    const DEMO_AGENDA_IDS = {
        'asesor-f': AGENDAS_COMERCIAL.find(ag => ag.operativo.puesto === 'Asesor Financiero'),
        'asesor-c': AGENDAS_COMERCIAL.find(ag => ag.operativo.puesto === 'Asesor Comercial' && ag.sucursal === 'HERMOSILLO'),
        'coordinador-l': AGENDAS_COMERCIAL.find(ag => ag.operativo.puesto === 'Coordinador de Línea Revolvente' && ag.sucursal === 'HERMOSILLO'),
        'gestor-i': AGENDAS_COBRANZA.find(ag => ag.operativo.puesto === 'Gestor Interno' && ag.sucursal === 'HERMOSILLO'),
        'gestor-e': AGENDAS_COMERCIAL.find(ag => ag.operativo.puesto === 'Asesor Comercial' && ag.sucursal === 'OBREGON'),
    };

    useEffect(() => {
        if (!selectedRole || selectedRole.category !== 'Operativo') return;
        const demo = DEMO_AGENDA_IDS[selectedRole.id];
        if (!demo) return;
        setCurrentAgenda(prev => ({
            ...prev,
            // coordinador-l shows as borrador so Planeación is editable (not protected)
            // all other demo roles are 'aprobada' so Ejecución is accessible
            status: selectedRole.id === 'coordinador-l' ? 'borrador' : 'aprobada',
            segments: demo.segments,
            checkIns: {},
            unplannedVisits: [],
            kpiReal: {},
            kpiCompromisos: DEMO_KPI_COMPROMISOS[selectedRole.id] || {},
            metadata: {
                ...prev.metadata,
                captureDate: demo.fecha,
                captureTime: demo.horaEnvio,
                role: selectedRole.name,
                hasModifications: false,
            }
        }));
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

            // Logic to auto-fill if name matches mockDatabase
            if (field === 'name' && value) {
                const match = mockDatabase.find(item => item.name === value.toUpperCase());
                if (match) {
                    Object.keys(match).forEach(key => {
                        updatedRow[key] = match[key];
                    });
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

    const updateKpiReal = (field, value) => {
        setCurrentAgenda(prev => ({
            ...prev,
            kpiReal: { ...prev.kpiReal, [field]: value }
        }));
    };

    const registerCheckIn = (visitId, data) => {
        setCurrentAgenda(prev => ({
            ...prev,
            checkIns: {
                ...prev.checkIns,
                [visitId]: { ...data, registeredAt: new Date().toISOString() }
            }
        }));
    };

    const addUnplannedVisit = (data) => {
        const id = Math.random().toString(36).substr(2, 9);
        setCurrentAgenda(prev => ({
            ...prev,
            unplannedVisits: [...(prev.unplannedVisits || []), { id, ...data, isUnplanned: true }]
        }));
    };

    // ── Schedule a follow-up visit (auto-created on Compromiso de pago) ─────────
    const scheduleFollowUp = (visitSource, { fecha, monto }) => {
        setScheduledFollowUps(prev => [...prev, {
            ...visitSource,
            id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            isFollowUp: true,
            time: null,          // operative sets time on the day
            compromisoFecha: fecha,
            compromisoCuanto: monto,
            isUnplanned: false,
            createdAt: new Date().toISOString(),
        }]);
    };
    // ─────────────────────────────────────────────────────────────────────────

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
            if (segment.length <= 1) {
                // Keep at least one empty row or just clear it? User said "cancelar una por una".
                // Usually, we keep at least one as a placeholder, but if they want to cancel anything, let's allow it.
                // Actually, if it's the last row, we can just clear it or remove it. Let's remove it.
            }
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

        // Check for exact overlaps (all segments)
        if (times.length !== new Set(times).size) {
            return { valid: false, message: "No se pueden empalmar horarios exactos." };
        }

        // Convert time HH:mm to minutes from midnight for easy comparison
        const timeToMin = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        // Rule: Promotion visits need 30 min gap with ANY other visit (15 min per side)
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

    const sendForAuthorization = () => {
        const activeVisits = Object.entries(currentAgenda.segments)
            .filter(([name]) => getVisibleSegments().includes(name))
            .flatMap(([_, visits]) => visits.filter(v => v.name));

        if (activeVisits.length === 0) {
            alert("Debes registrar al menos una visita para enviar la agenda.");
            return;
        }

        const validation = validateAgenda();
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        const now = new Date();
        setCurrentAgenda(prev => ({
            ...prev,
            status: 'pendiente',
            metadata: {
                ...prev.metadata,
                captureDate: now.toLocaleDateString(),
                captureTime: now.toLocaleTimeString(),
                role: selectedRole.name
            }
        }));
    };

    const resetAgenda = () => {
        if (window.confirm("¿Seguro que deseas borrar toda la planificación? Esta acción no se puede deshacer.")) {
            setCurrentAgenda({
                status: 'borrador',
                segments: {
                    'Promoción': createEmptyRows('Promoción'),
                    'Evaluación e Integración': createEmptyRows('Evaluación e Integración'),
                    'Seguimiento de Cartera': createEmptyRows('Seguimiento de Cartera'),
                    'Gestión de Empresarias': createEmptyRows('Gestión de Empresarias')
                },
                kpiCompromisos: { ...emptyKpi },
                kpiReal: {},
                checkIns: {},
                unplannedVisits: [],
                metadata: { ...currentAgenda.metadata, hasModifications: false }
            });
            setScheduledFollowUps([]);
        }
    };

    const updateAgendaStatus = (id, status, notes = '') => {
        // In a real app this would call an API. Here we just update the local state for simulation.
        // If it's the current local agenda (AJ-LOCAL)
        if (id === 'AJ-LOCAL') {
            setCurrentAgenda(prev => ({ ...prev, status, notes }));
        }
    };

    return (
        <AgendaContext.Provider value={{
            agendas,
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
            mockDatabase
        }}>
            {children}
        </AgendaContext.Provider>
    );
};

export const useAgenda = () => useContext(AgendaContext);