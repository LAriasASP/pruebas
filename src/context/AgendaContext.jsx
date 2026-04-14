import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRole } from './RoleContext';
import { AGENDAS_COMERCIAL, AGENDAS_COBRANZA } from '../data/agendaMockData';
import axios from 'axios'; 

const AgendaContext = createContext();

export const AgendaProvider = ({ children }) => {
    const { selectedRole } = useRole();

    // ── FASE 2: ESTADO DEL DIRECTORIO DE CLIENTES ──
    const [directorio, setDirectorio] = useState([]);
    const [loadingDirectorio, setLoadingDirectorio] = useState(true);

    const cargarDirectorio = async () => {
        try {
            setLoadingDirectorio(true);
            
            /**
             * TODO: EP Lógico -> GET /api/v1/contactos/directorio
             * Cuando el backend esté listo, reemplaza la data estática por esto:
             * const res = await axios.get('/api/v1/contactos/directorio', { withCredentials: true });
             * const rawData = res.data.contenido || [];
             */
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulación de red

            // ESTA ES TU DATA REAL TRAÍDA DE LA BASE DE DATOS
            const rawData = [
                { id_contacto: 1, id_cliente: null, name: "JUAN PEREZ", classification: "CONTACTO", city: "León", colony: "Centro", streets: "Madero 123", phones: "[\"5512345678\", \"5511112222\", \"\"]", product: "NA", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 2, id_cliente: null, name: "MARIA GARCIA", classification: "CONTACTO", city: "León", colony: "Centro", streets: "Madero 124", phones: "[\"5523456789\", \"\", \"\"]", product: "NA", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 3, id_cliente: null, name: "RICARDO TAPIA", classification: "CONTACTO", city: "León", colony: "Zapata", streets: "Hidalgo 456", phones: "[\"5534567890\", \"5588889999\", \"5577776666\"]", product: "NA", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 4, id_cliente: null, name: "LAURA SANCHEZ", classification: "CONTACTO", city: "León", colony: "Zapata", streets: "Hidalgo 457", phones: "[\"5545678901\", \"\", \"\"]", product: "NA", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 5, id_cliente: null, name: "CARLOS LOPEZ", classification: "CONTACTO", city: "León", colony: "Obregon", streets: "Juarez 88", phones: "[\"5556789012\", \"\", \"\"]", product: "NA", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 6, id_cliente: null, name: "LOLA BELTRAN", classification: "CONTACTO", city: "Silao", colony: "Centro", streets: "5 de Mayo 10", phones: "[\"5588990011\", \"\", \"\"]", product: "NA", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 7, id_cliente: null, name: "BRENDA RUIZ", classification: "PROSPECTO", city: "Irapuato", colony: "Juarez", streets: "Reforma 789", phones: "[\"5567890123\", \"\", \"\"]", product: "Microcrédito", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 8, id_cliente: null, name: "FABIAN MORALES", classification: "PROSPECTO", city: "Irapuato", colony: "Juarez", streets: "Reforma 790", phones: "[\"5578901234\", \"\", \"\"]", product: "Consumo", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 9, id_cliente: null, name: "SOFIA HERRERA", classification: "PROSPECTO", city: "Silao", colony: "Centro", streets: "Aldama 12", phones: "[\"5589012345\", \"\", \"\"]", product: "PYME", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 10, id_cliente: null, name: "DIEGO VARGAS", classification: "PROSPECTO", city: "Silao", colony: "Centro", streets: "Aldama 13", phones: "[\"5590123456\", \"\", \"\"]", product: "Microcrédito", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 11, id_cliente: null, name: "ELENA MORENO", classification: "PROSPECTO", city: "Guanajuato", colony: "Marfil", streets: "Callejon 4", phones: "[\"5501234567\", \"\", \"\"]", product: "Captación", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 12, id_cliente: null, name: "JAVIER SOLIS", classification: "PROSPECTO", city: "Irapuato", colony: "Centro", streets: "Pino 5", phones: "[\"5577889900\", \"\", \"\"]", product: "Microcrédito", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 13, id_cliente: null, name: "JOSE ALFREDO", classification: "PROSPECTO", city: "Guanajuato", colony: "Centro", streets: "Dolores 3", phones: "[\"5511002233\", \"\", \"\"]", product: "Captación", idCredito: null, estimatedAmount: null, annualRate: null, subProduct: null, program: null, moraInicioMes: null, moraActual: null, moraDays: null, saldoInicioMes: null, saldoActual: null, portfolioStatus: null, ultimoEstatus: null, fechaIngreso: null, saldoOcupado: null, saldoDisponible: null, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: null, montoRequeridoCorriente: null, herramientaAplicada: null, categoriaGestion: null },
                { id_contacto: 14, id_cliente: 1, name: "KARLA MEDELLIN", classification: "CLIENTE", city: "Guanajuato", colony: "Marfil", streets: "Callejon de la Paz 5", phones: "[\"5511223344\", \"\", \"\"]", product: "Microcrédito", idCredito: "CR-8829-2025", estimatedAmount: 45000.00, annualRate: 35.00, subProduct: "PREFERENCIAL", program: "SCORE 500", moraInicioMes: 0, moraActual: 2, moraDays: 2, saldoInicioMes: 45000.00, saldoActual: 44200.00, portfolioStatus: "Abono/ Pago Parcial", ultimoEstatus: "Vigente", fechaIngreso: "15/05/2024", saldoOcupado: 45000.00, saldoDisponible: 5000.00, ultimaFechaPago: "10/02/2026", fechaVencimiento: "15/03/2026", montoAmortizacion: 2500.00, montoRequeridoCorriente: 0.00, herramientaAplicada: "Ninguna", categoriaGestion: "Preventivo" },
                { id_contacto: 15, id_cliente: 2, name: "HUGO GALAVAN", classification: "CLIENTE", city: "León", colony: "Centro", streets: "Pino Suarez 10", phones: "[\"5522334455\", \"\", \"\"]", product: "Consumo", idCredito: "CR-9012-2025", estimatedAmount: 12000.00, annualRate: 42.50, subProduct: "NINGUNO", program: "NINGUNO", moraInicioMes: 5, moraActual: 0, moraDays: 0, saldoInicioMes: 12000.00, saldoActual: 10500.00, portfolioStatus: "Compromiso de pago", ultimoEstatus: "Vigente", fechaIngreso: "20/06/2024", saldoOcupado: 12000.00, saldoDisponible: 8000.00, ultimaFechaPago: "20/02/2026", fechaVencimiento: "20/03/2026", montoAmortizacion: 1200.00, montoRequeridoCorriente: 0.00, herramientaAplicada: "Ninguna", categoriaGestion: "Control" },
                { id_contacto: 16, id_cliente: 3, name: "ANA VICTORIA", classification: "CLIENTE", city: "Silao", colony: "Centro", streets: "Morelos 22", phones: "[\"5533445566\", \"\", \"\"]", product: "PYME", idCredito: "CR-1122-2025", estimatedAmount: 150000.00, annualRate: 28.00, subProduct: "BOLSÓN", program: "ATRACCIÓN DE LA COMPETENCIA", moraInicioMes: 0, moraActual: 0, moraDays: 0, saldoInicioMes: 85000.00, saldoActual: 80000.00, portfolioStatus: "Sin contacto", ultimoEstatus: "Vigente", fechaIngreso: "10/01/2024", saldoOcupado: 85000.00, saldoDisponible: 15000.00, ultimaFechaPago: "05/02/2026", fechaVencimiento: "10/03/2026", montoAmortizacion: 8500.00, montoRequeridoCorriente: 0.00, herramientaAplicada: "Ninguna", categoriaGestion: "Preventivo" },
                { id_contacto: 17, id_cliente: 4, name: "ROBERTO GOMEZ", classification: "CLIENTE", city: "León", colony: "Lomas", streets: "Roble 12", phones: "[\"5544556677\", \"\", \"\"]", product: "Microcrédito", idCredito: "CR-3344-2025", estimatedAmount: 15000.00, annualRate: 45.00, subProduct: "FASTCREDIT", program: "OTRO", moraInicioMes: 30, moraActual: 32, moraDays: 32, saldoInicioMes: 15000.00, saldoActual: 15000.00, portfolioStatus: "Promesa de pago", ultimoEstatus: "Vencido", fechaIngreso: "12/03/2024", saldoOcupado: 15000.00, saldoDisponible: 0.00, ultimaFechaPago: "12/01/2026", fechaVencimiento: "12/02/2026", montoAmortizacion: 4500.00, montoRequeridoCorriente: 4500.00, herramientaAplicada: "Ninguna", categoriaGestion: "Recuperación" },
                { id_contacto: 18, id_cliente: 5, name: "SANDRA LUZ", classification: "CLIENTE", city: "Irapuato", colony: "Centro", streets: "Juarez 1", phones: "[\"5555667788\", \"\", \"\"]", product: "Captación", idCredito: "CR-5566-2025", estimatedAmount: 0.00, annualRate: 0.00, subProduct: "NINGUNO", program: "NINGUNO", moraInicioMes: 0, moraActual: 0, moraDays: 0, saldoInicioMes: 0.00, saldoActual: 0.00, portfolioStatus: null, ultimoEstatus: "Vigente", fechaIngreso: "05/07/2024", saldoOcupado: 0.00, saldoDisponible: 25000.00, ultimaFechaPago: null, fechaVencimiento: null, montoAmortizacion: 0.00, montoRequeridoCorriente: 0.00, herramientaAplicada: "Ninguna", categoriaGestion: "Preventivo" },
                { id_contacto: 19, id_cliente: 6, name: "PEDRO INFANTE", classification: "CLIENTE", city: "León", colony: "Obregon", streets: "Revolucion 45", phones: "[\"5566778899\", \"\", \"\"]", product: "Consumo", idCredito: "CR-7788-2025", estimatedAmount: 5000.00, annualRate: 38.00, subProduct: "LIQUIDEZ", program: "NINGUNO", moraInicioMes: 0, moraActual: 0, moraDays: 0, saldoInicioMes: 5000.00, saldoActual: 2000.00, portfolioStatus: "Abono/ Pago Parcial", ultimoEstatus: "Vigente", fechaIngreso: "10/08/2024", saldoOcupado: 5000.00, saldoDisponible: 3000.00, ultimaFechaPago: "15/02/2026", fechaVencimiento: "15/03/2026", montoAmortizacion: 500.00, montoRequeridoCorriente: 0.00, herramientaAplicada: "Ninguna", categoriaGestion: "Preventivo" },
                { id_contacto: 20, id_cliente: 7, name: "VICENTE FERNANDEZ", classification: "CLIENTE", city: "Irapuato", colony: "Juarez", streets: "Libertad 100", phones: "[\"5599001122\", \"\", \"\"]", product: "PYME", idCredito: "CR-9900-2025", estimatedAmount: 150000.00, annualRate: 25.00, subProduct: "BACK TO BACK", program: "SCORE 500", moraInicioMes: 10, moraActual: 12, moraDays: 12, saldoInicioMes: 150000.00, saldoActual: 150000.00, portfolioStatus: "Promesa de pago", ultimoEstatus: "Vencido", fechaIngreso: "01/01/2024", saldoOcupado: 150000.00, saldoDisponible: 0.00, ultimaFechaPago: "01/01/2026", fechaVencimiento: "01/02/2026", montoAmortizacion: 15000.00, montoRequeridoCorriente: 15000.00, herramientaAplicada: "Ninguna", categoriaGestion: "Legal" }
            ];

            // PRE-PROCESAMIENTO: Convertimos la cadena JSON de teléfonos a un arreglo real para que el UI no truene
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

    // Esta función devuelve un solo objeto en blanco, sin importar cuántas filas pidas.
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

    // ── FASE 3: El estado inicial comienza completamente vacío (0 filas) ──
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
            userName: 'Usuario Demo',
            hasModifications: false
        }
    });

    const [loadingAgenda, setLoadingAgenda] = useState(false);
    const [scheduledFollowUps, setScheduledFollowUps] = useState([]);

    // ── FASE 3: CARGA DE LA AGENDA DEL OPERATIVO ──
    useEffect(() => {
        if (!selectedRole || selectedRole.category !== 'Operativo') return;

        const cargarAgendaDelDia = async () => {
            setLoadingAgenda(true);
            try {
                /**
                 * TODO: EP Lógico -> GET /api/v1/agendas/operativo/hoy
                 * Aquí puedes hacer la petición real. Si el backend no devuelve
                 * nada para hoy, el estado se queda vacío como lo definimos arriba.
                 */
                await new Promise(resolve => setTimeout(resolve, 800)); // Simulación

                // Simulación: Si es un coordinador-l en nuestra demo, lo dejamos en borrador
                // (vacío para que empiece a planear).
                // Nota: Removí el cargado de la data mockeada anterior.
                const isBorrador = selectedRole.id === 'coordinador-l';
                
                setCurrentAgenda(prev => ({
                    ...prev,
                    status: isBorrador ? 'borrador' : 'aprobada', // Si es 'aprobada', bloqueará la edición en la UI. Ajusta a tu lógica real.
                    metadata: {
                        ...prev.metadata,
                        role: selectedRole.name,
                    }
                }));
            } catch (error) {
                console.error("Error al cargar la agenda del día", error);
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
        setCurrentAgenda(prev => ({
            ...prev,
            kpiReal: { ...prev.kpiReal, [field]: value }
        }));
    };

    const registerCheckIn = async (visitId, data) => {
        const checkInTime = new Date().toISOString();
        setCurrentAgenda(prev => ({
            ...prev,
            checkIns: {
                ...prev.checkIns,
                [visitId]: { ...data, registeredAt: checkInTime }
            }
        }));
    };

    const addUnplannedVisit = async (data) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newVisit = { id, ...data, isUnplanned: true };
        
        setCurrentAgenda(prev => ({
            ...prev,
            unplannedVisits: [...(prev.unplannedVisits || []), newVisit]
        }));
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

        try {
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
        } catch (error) {
            console.error("Error al certificar agenda", error);
            alert("Hubo un error al enviar la agenda.");
        }
    };

    const resetAgenda = () => {
        if (window.confirm("¿Seguro que deseas borrar toda la planificación? Esta acción no se puede deshacer.")) {
            // Reinicia a cero (arreglos vacíos)
            setCurrentAgenda({
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
                metadata: { ...currentAgenda.metadata, hasModifications: false }
            });
            setScheduledFollowUps([]);
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
            loadingAgenda 
        }}>
            {children}
        </AgendaContext.Provider>
    );
};

export const useAgenda = () => useContext(AgendaContext);