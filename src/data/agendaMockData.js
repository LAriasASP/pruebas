/**
 * MOCK DATA - Agendas de operativos para demo visual
 * Solo para fines de prototipo. Cada agenda simula un operativo
 * con varias gestiones por segmento.
 */

/**
 * TODO: Estos catálogos se alimentarán del EP: /api/v1/catalogos/zonas-sucursales
 * Consulta:
 * select z.nombre as id, z.descripcion as nombre, s.nombre as sucursales 
 * from catalogos.zonas as z
 * inner join catalogos.sucursales s on z.id_zona = s.id_zona order by z.id_zona ;
 * * Resultado en formato JSON:
 * [
 * {
 * "id" : "zona-1",
 * "nombre" : "ZONA I",
 * "sucursales" : "LA PAZ"
 * },
 * {
 * "id" : "zona-1",
 * "nombre" : "ZONA I",
 * "sucursales" : "HERMOSILLO"
 * }
 * // ...
 * ]
 */
export const ZONAS = [
    { id: 'zona-1', nombre: 'ZONA I', sucursales: ['HERMOSILLO', 'OBREGON', 'NAVOJOA', 'GUAYMAS', 'CABORCA'] },
    { id: 'zona-2', nombre: 'ZONA II', sucursales: ['LA PAZ', 'CABO SAN LUCAS', 'SAN JOSE DEL CABO', 'LORETO'] },
    { id: 'zona-3', nombre: 'ZONA III', sucursales: ['TIJUANA', 'MEXICALI', 'ENSENADA', 'SAN QUINTÍN'] },
    { id: 'zona-4', nombre: 'ZONA IV', sucursales: ['CHIHUAHUA', 'DELICIAS', 'MAZATLÁN', 'TORREON'] },
    { id: 'zona-5', nombre: 'ZONA V', sucursales: ['TAMPICO NORTE', 'POZA RICA', 'TUXPAN'] },
];

const formatCurrency = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

/**
 * TODO: Estos catálogos se alimentarán del EP: /api/v1/catalogos/estados
 * Consulta:
 * SELECT id_estado, nombre FROM catalogos.estados;
 * * Resultado en JSON:
 * [
 * { "id_estado" : 1, "nombre" : "BORRADOR" },
 * { "id_estado" : 2, "nombre" : "PENDIENTE" },
 * { "id_estado" : 3, "nombre" : "APROBADA" },
 * { "id_estado" : 4, "nombre" : "REQUIERE_MODIFICACION" }
 * ]
 */
// Colores/badges por estado
export const STATUS_STYLES = {
    borrador: { label: 'Borrador', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
    pendiente: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    aprobada: { label: 'Autorizada', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    requiere_modificacion: { label: 'Req. Modificación', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: crea una visita rápida
// ─────────────────────────────────────────────────────────────────────────────
let _uid = 1;
const mk = (overrides) => ({ id: String(_uid++), ...overrides });

// ─────────────────────────────────────────────────────────────────────────────
// AGENDAS CANAL COMERCIAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO: Este arreglo se alimentará del EP: /api/v1/agendas/equipo/comercial?fecha=YYYY-MM-DD
 * Consulta:
 * SELECT p.id_plan as id, z.nombre as zona, s.nombre as sucursal, 
 * u.nombre as operativo_nombre, u.puesto as operativo_puesto,
 * p.fch_crea as horaEnvio, e.nombre as status, p.nota_jefe
 * FROM agendas.planes p
 * INNER JOIN seguridad.usuarios u ON p.id_usuario = u.id_usuario
 * INNER JOIN catalogos.estados e ON p.id_estado = e.id_estado ...
 * (Debe incluir el JSON de segmentos/gestiones como subconsulta o detalle)
 */
export const AGENDAS_COMERCIAL = [
    // ── HERMOSILLO ─────────────────────────────────────────────
    {
        id: 'ag-001', zona: 'ZONA I', sucursal: 'HERMOSILLO',
        operativo: { nombre: 'JUAN CARLOS VALENZUELA RUIZ', puesto: 'Asesor Comercial', id: 'AC-0312' },
        fecha: '2026-02-24', horaEnvio: '07:48', status: 'pendiente',
        totalGestiones: 12,
        segments: {
            'Promoción': [
                mk({ time: '08:00', name: 'ANDREA MORALES SOTO', classification: 'Prospecto', product: 'Microcredito', activity: 'Primera visita domicilio, presentación del producto', city: 'Hermosillo', colony: 'Prados del Sol', streets: 'Blvd Solidaridad y Paseo de las Palmas', phones: ['6621234567', '', ''] }),
                mk({ time: '09:00', name: 'ROBERTO FELIX DUARTE', classification: 'Contacto', product: 'Consumo', activity: 'Seguimiento a cotización entregada el lunes', city: 'Hermosillo', colony: 'Villa Satélite', streets: 'Calle Naranjos y Limones', phones: ['6629876543', '', ''] }),
                mk({ time: '10:30', name: 'LUPITA GÁNDARA CASTRO', classification: 'Prospecto', product: 'Pyme', activity: 'Visita a negocio, análisis de necesidades y entrega de solicitud', city: 'Hermosillo', colony: 'Centro', streets: 'Blvd Rodríguez y Sufragio Efectivo', phones: ['6621112233', '6629988776', ''] }),
                mk({ time: '12:00', name: 'MARIO IBARRA NIETO', classification: 'Contacto', product: 'Captación', activity: 'Presentación de cuenta de ahorro empresarial', city: 'Hermosillo', colony: 'San Benito', streets: 'Calle Manzanillo y Uruapan', phones: ['6623334455', '', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '08:30', name: 'CAROLINA RÍOS MEDINA', classification: 'Cliente', typeIntegration: 'Renovación', product: 'Microcredito', estimatedAmount: '35000', annualRate: '56.55', subProduct: 'PREFERENCIAL', program: 'SCORE 500', activity: 'Validación Analista Operaciones o Mesa de Control', city: 'Hermosillo', colony: 'Del Valle', streets: 'Periférico Norte y Reforma', portfolioStatus: 'Abono' }),
                mk({ time: '13:30', name: 'PEDRO ESPINOZA RUIZ', classification: 'Prospecto', typeIntegration: 'Nuevo', product: 'Pyme', estimatedAmount: '150000', annualRate: '42.00', subProduct: 'BOLSÓN', program: 'ATRACCIÓN DE LA COMPETENCIA', activity: 'Integración', city: 'Hermosillo', colony: 'Bugambilias', streets: 'Blvd García Morales', portfolioStatus: 'N/A' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '11:00', name: 'JESSICA LUGO ALTAMIRANO', idCredito: 'CRD-4421', moraInicioMes: 5, moraActual: 12, saldoInicioMes: '28500', saldoActual: '27100', categoriaGestion: 'vencido', ultimoEstatus: 'Promesa de pago', ultimaFechaPago: '31/01/26', fechaVencimiento: '15/02/26', montoAmortizacion: '1850', montoRequeridoCorriente: '3700', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Tratamiento', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '15:00', name: 'ERNESTO MORENO PLAZA', idCredito: 'CRD-3310', moraInicioMes: 0, moraActual: 3, saldoInicioMes: '45000', saldoActual: '44200', categoriaGestion: 'vigente', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '20/02/26', fechaVencimiento: '20/03/26', montoAmortizacion: '2300', montoRequeridoCorriente: '2300', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
            ],
            'Gestión de Empresarias': [
                mk({ time: '14:00', name: 'SOFÍA CONTRERAS VÁSQUEZ', fechaIngreso: '12/01/2025', moraDays: 0, saldoOcupado: '18000', saldoDisponible: '7000', typeManagement: 'Visita integral' }),
                mk({ time: '16:00', name: 'DIANA PALOMARES RÍOS', fechaIngreso: '03/06/2024', moraDays: 8, saldoOcupado: '22000', saldoDisponible: '0', typeManagement: 'Visita correctiva' }),
            ],
        },
    },
    {
        id: 'ag-002', zona: 'ZONA I', sucursal: 'HERMOSILLO',
        operativo: { nombre: 'MARISOL TAPIA GALLEGOS', puesto: 'Coordinador de Línea Revolvente', id: 'CL-0088' },
        fecha: '2026-02-24', horaEnvio: '07:55', status: 'aprobada',
        totalGestiones: 10,
        segments: {
            'Promoción': [
                mk({ time: '08:00', name: 'HÉCTOR BOJÓRQUEZ SALAS', classification: 'Contacto', product: 'Microcredito', activity: 'Referido de cliente activo, primera visita', city: 'Hermosillo', colony: 'Periférico Norte', streets: 'Blvd Colosio y Oriente', phones: ['6624456789', '', ''] }),
                mk({ time: '09:30', name: 'PATRICIA CERVANTES LUNA', classification: 'Prospecto', product: 'Consumo', activity: 'Seguimiento llamada interesada el viernes pasado', city: 'Hermosillo', colony: 'Los Naranjos', streets: 'Calle Cíbola y Sonora', phones: ['6621239954', '', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '10:00', name: 'GABRIEL MONTES PERAZA', classification: 'Prospecto', typeIntegration: 'Nuevo', product: 'Crédito Fácil', estimatedAmount: '25000', annualRate: '65.00', subProduct: 'FASTCREDIT', program: 'OTRO', activity: 'Integración', city: 'Hermosillo', colony: 'Pitic', streets: 'Av Luis Encinas', portfolioStatus: 'N/A' }),
                mk({ time: '11:30', name: 'IRENE VALENZUELA PARDO', classification: 'Cliente', typeIntegration: 'Tratamiento', product: 'Microcredito', estimatedAmount: '40000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Comité de Crédito', city: 'Hermosillo', colony: 'Bugambilias', streets: 'Calle Morelos', portfolioStatus: 'Compromiso de pago' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '13:00', name: 'GUILLERMO ANGULO REYES', idCredito: 'CRD-5512', moraInicioMes: 18, moraActual: 25, saldoInicioMes: '19500', saldoActual: '18900', categoriaGestion: 'vencido', ultimoEstatus: 'Negativa de pago', ultimaFechaPago: '15/01/26', fechaVencimiento: '15/01/26', montoAmortizacion: '1200', montoRequeridoCorriente: '3600', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '14:30', name: 'NORMA GRIJALVA PADILLA', idCredito: 'CRD-2233', moraInicioMes: 0, moraActual: 0, saldoInicioMes: '55000', saldoActual: '53800', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '22/02/26', fechaVencimiento: '22/03/26', montoAmortizacion: '2750', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
            ],
            'Gestión de Empresarias': [
                mk({ time: '16:00', name: 'ELIZABETH MUNGUÍA FIERRO', fechaIngreso: '05/03/2024', moraDays: 0, saldoOcupado: '30000', saldoDisponible: '10000', typeManagement: 'Visita integral' }),
                mk({ time: '17:00', name: 'RAMONA IBÁÑEZ COTA', fechaIngreso: '18/09/2023', moraDays: 4, saldoOcupado: '25000', saldoDisponible: '0', typeManagement: 'Visita preventiva' }),
            ],
        },
    },
    {
        id: 'ag-003', zona: 'ZONA I', sucursal: 'HERMOSILLO',
        operativo: { nombre: 'ALEJANDRO BERNAL QUIROZ', puesto: 'Asesor Financiero', id: 'AF-0201' },
        fecha: '2026-02-24', horaEnvio: '08:05', status: 'requiere_modificacion',
        notaJefe: 'El horario de las 11:00 se empalma con la reunión de sucursal. Mover a 11:30. También falta la dirección completa del cliente Ramírez.',
        totalGestiones: 8,
        segments: {
            'Promoción': [
                mk({ time: '08:00', name: 'CONCEPCIÓN RAMIREZ DÁVILA', classification: 'Contacto', product: 'Microcredito', activity: 'Presentar producto y dejar solicitud pre-llenada', city: 'Hermosillo', colony: 'Olivares', streets: '', phones: ['6625678901', '', ''] }),
                mk({ time: '09:30', name: 'TOMÁS ZÚÑIGA ESCALANTE', classification: 'Prospecto', product: 'Pyme', activity: 'Visita a taller mecánico, evaluación de flujo', city: 'Hermosillo', colony: 'Industrial', streets: 'Calle Fresno y Álamo', phones: ['6628889900', '', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '10:30', name: 'ANA KAREN FIERRO SALAS', classification: 'Cliente', typeIntegration: 'Renovación', product: 'Consumo', estimatedAmount: '60000', annualRate: '38.50', subProduct: 'PREFERENCIAL', program: 'ATRACCIÓN DE LA COMPETENCIA', activity: 'VoBo de Supervisor', city: 'Hermosillo', colony: 'Villa del Real', streets: 'Paseo del Centenario', portfolioStatus: 'Abono' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '11:00', name: 'JORGE LABRADA MOLINA', idCredito: 'CRD-7743', moraInicioMes: 2, moraActual: 9, saldoInicioMes: '12000', saldoActual: '11400', categoriaGestion: 'vigente', ultimoEstatus: 'Sin contacto', ultimaFechaPago: '16/02/26', fechaVencimiento: '16/03/26', montoAmortizacion: '950', montoRequeridoCorriente: '950', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '13:00', name: 'LORENA ESQUER ACOSTA', idCredito: 'CRD-8821', moraInicioMes: 35, moraActual: 42, saldoInicioMes: '8500', saldoActual: '8200', categoriaGestion: 'vencido', ultimoEstatus: 'Ilocalizable', ultimaFechaPago: '10/01/26', fechaVencimiento: '10/01/26', montoAmortizacion: '590', montoRequeridoCorriente: '2360', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial domicilio' }),
            ],
            'Gestión de Empresarias': [],
        },
    },
    // ── OBREGÓN ─────────────────────────────────────────────────
    {
        id: 'ag-004', zona: 'ZONA I', sucursal: 'OBREGON',
        operativo: { nombre: 'DANIELA CUEVAS MORENO', puesto: 'Asesor Comercial', id: 'AC-0445' },
        fecha: '2026-02-24', horaEnvio: '07:52', status: 'aprobada',
        totalGestiones: 11,
        segments: {
            'Promoción': [
                mk({ time: '08:00', name: 'FABIOLA MENDIVIL PARRA', classification: 'Prospecto', product: 'Microcredito', activity: 'Visita tianguis, entrega de volantes y explicación de beneficios', city: 'Cajeme', colony: 'Yucatán', streets: 'Calle Sonora y Guerrero', phones: ['6441122334', '', ''] }),
                mk({ time: '09:30', name: 'RUBÉN GASTÉLUM AMAYA', classification: 'Contacto', product: 'Consumo', activity: 'Cliente referido por compañero de trabajo', city: 'Cajeme', colony: 'Centro', streets: 'Blvd Hidalgo y Allende', phones: ['6442233445', '', ''] }),
                mk({ time: '11:00', name: 'ESPERANZA VILLA CASTRO', classification: 'Prospecto', product: 'Captación', activity: 'Presentación de cuenta empresarial en negocio familiar', city: 'Cajeme', colony: 'La Colonia', streets: 'Calle Jalisco y Zacatecas', phones: ['6443344556', '', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '08:30', name: 'FRANCISCO DUARTE PONCE', classification: 'Cliente', typeIntegration: 'Tratamiento', product: 'Microcredito', estimatedAmount: '22000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Corrección de Expediente', city: 'Cajeme', colony: 'Modelo', streets: 'Blvd Rodríguez', portfolioStatus: 'Convenio' }),
                mk({ time: '10:00', name: 'INGRID MERAZ VALDEZ', classification: 'Prospecto', typeIntegration: 'Nuevo', product: 'Crédito Fácil', estimatedAmount: '18000', annualRate: '65.00', subProduct: 'FASTCREDIT', program: 'SCORE 500', activity: 'Integración', city: 'Cajeme', colony: 'Las Vegas', streets: 'Calle Nayarit y Colima', portfolioStatus: 'N/A' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '12:30', name: 'CRESCENCIO BELTRAN RUIZ', idCredito: 'CRD-2211', moraInicioMes: 0, moraActual: 1, saldoInicioMes: '38000', saldoActual: '37200', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '23/02/26', fechaVencimiento: '23/03/26', montoAmortizacion: '1900', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '14:00', name: 'AURORA HIDALGO MUÑOZ', idCredito: 'CRD-9988', moraInicioMes: 22, moraActual: 29, saldoInicioMes: '14200', saldoActual: '13800', categoriaGestion: 'vencido', ultimoEstatus: 'Negativa de pago', ultimaFechaPago: '25/01/26', fechaVencimiento: '26/01/26', montoAmortizacion: '870', montoRequeridoCorriente: '3480', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Cobranza', typeVisitManagement: 'Visita presencial domicilio' }),
            ],
            'Gestión de Empresarias': [
                mk({ time: '15:30', name: 'VERÓNICA SÁNCHEZ TRUJILLO', fechaIngreso: '22/04/2024', moraDays: 0, saldoOcupado: '20000', saldoDisponible: '5000', typeManagement: 'Visita integral' }),
                mk({ time: '17:00', name: 'BEATRIZ ENCINAS PERALTA', fechaIngreso: '11/11/2023', moraDays: 15, saldoOcupado: '28000', saldoDisponible: '0', typeManagement: 'Visita correctiva' }),
            ],
        },
    },
    {
        id: 'ag-005', zona: 'ZONA I', sucursal: 'OBREGON',
        operativo: { nombre: 'SERGIO OSUNA CASTRO', puesto: 'Coordinador de Línea Revolvente', id: 'CL-0122' },
        fecha: '2026-02-24', horaEnvio: '07:45', status: 'pendiente',
        totalGestiones: 9,
        segments: {
            'Promoción': [
                mk({ time: '08:30', name: 'MINERVA QUIJADA FLORES', classification: 'Prospecto', product: 'Pyme', activity: 'Dueña de papelería, evaluar línea de crédito para surtir', city: 'Cajeme', colony: 'El Rastro', streets: 'Blvd Morelos y Allende', phones: ['6445566778', '', ''] }),
                mk({ time: '10:00', name: 'JESÚS RÍOS AMAYA', classification: 'Contacto', product: 'Microcredito', activity: 'Segundo seguimiento, muy interesado pero falta la identificación', city: 'Cajeme', colony: 'Prados del Oriente', streets: 'Calle Jalisco y Sinaloa', phones: ['6446677889', '', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '09:00', name: 'LOURDES COTA GASTELUM', classification: 'Cliente', typeIntegration: 'Convenio', product: 'Microcredito', estimatedAmount: '15000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Comité de Crédito', city: 'Cajeme', colony: 'Centro', streets: 'Calle Guerrero', portfolioStatus: 'Convenio' }),
                mk({ time: '11:30', name: 'RODRIGO ACUÑA PERALTA', classification: 'Prospecto', typeIntegration: 'Nuevo', product: 'Consumo', estimatedAmount: '42000', annualRate: '38.00', subProduct: 'PREFERENCIAL', program: 'SCORE 500', activity: 'Verificación Telefónica', city: 'Cajeme', colony: 'Villa Bonita', streets: 'Av de los Insurgentes', portfolioStatus: 'N/A' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '13:00', name: 'DOLORES SOTO MONTAÑO', idCredito: 'CRD-4422', moraInicioMes: 4, moraActual: 11, saldoInicioMes: '21000', saldoActual: '20300', categoriaGestion: 'vigente', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '13/02/26', fechaVencimiento: '13/03/26', montoAmortizacion: '1400', montoRequeridoCorriente: '1400', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Visita presencial domicilio' }),
            ],
            'Gestión de Empresarias': [
                mk({ time: '15:00', name: 'CONSUELO PERAZA RUIZ', fechaIngreso: '07/07/2024', moraDays: 2, saldoOcupado: '15000', saldoDisponible: '10000', typeManagement: 'Visita preventiva' }),
                mk({ time: '16:30', name: 'PETRA NAVARRO IBARRA', fechaIngreso: '19/01/2025', moraDays: 0, saldoOcupado: '12000', saldoDisponible: '13000', typeManagement: 'Gestión telefónica' }),
            ],
        },
    },
    // ── LA PAZ ──────────────────────────────────────────────────
    {
        id: 'ag-006', zona: 'ZONA II', sucursal: 'LA PAZ',
        operativo: { nombre: 'ADRIANA VILLALOBOS ROMERO', puesto: 'Asesor Comercial', id: 'AC-0677' },
        fecha: '2026-02-24', horaEnvio: '08:10', status: 'pendiente',
        totalGestiones: 10,
        segments: {
            'Promoción': [
                mk({ time: '08:00', name: 'MAURICIO LAGARDE IBAÑEZ', classification: 'Prospecto', product: 'Microcredito', activity: 'Referido del cliente Torres, negocio de mariscos', city: 'La Paz', colony: 'Centro', streets: 'Calle Independencia y Domínguez', phones: ['6121234567', '', ''] }),
                mk({ time: '09:30', name: 'GABRIELA RUIZ GUERRERO', classification: 'Contacto', product: 'Captación', activity: 'Cuenta de ahorro para negocio de tacos', city: 'La Paz', colony: 'El Manglito', streets: 'Blvd Forjadores y Morelos', phones: ['6122345678', '', ''] }),
                mk({ time: '11:00', name: 'ARMANDO PERALTA SOTO', classification: 'Prospecto', product: 'Pyme', activity: 'Hotel pequeño en zona turística, interesado en crédito para remodelación', city: 'La Paz', colony: 'El Esterito', streets: 'Blvd 5 de Febrero', phones: ['6123456789', '6124567890', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '08:30', name: 'ROSA ELVIA CAMPA ROMO', classification: 'Cliente', typeIntegration: 'Renovación', product: 'Microcredito', estimatedAmount: '28000', annualRate: '56.55', subProduct: 'PREFERENCIAL', program: 'SCORE 500', activity: 'Verificación Presencial', city: 'La Paz', colony: 'Pueblo Nuevo', streets: 'Calle Revolución', portfolioStatus: 'Abono' }),
                mk({ time: '13:00', name: 'ENRIQUE SOLANO DURÁN', classification: 'Prospecto', typeIntegration: 'Nuevo', product: 'Consumo', estimatedAmount: '55000', annualRate: '42.00', subProduct: 'BOLSÓN', program: 'ATRACCIÓN DE LA COMPETENCIA', activity: 'Integración', city: 'La Paz', colony: 'Vista Hermosa', streets: 'Calle Juárez y Allende', portfolioStatus: 'N/A' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '10:00', name: 'CATALINA VILLA SALAS', idCredito: 'CRD-6634', moraInicioMes: 0, moraActual: 0, saldoInicioMes: '42000', saldoActual: '40500', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '24/02/26', fechaVencimiento: '24/03/26', montoAmortizacion: '2100', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '14:00', name: 'IGNACIO BERNAL SANDOVAL', idCredito: 'CRD-1129', moraInicioMes: 10, moraActual: 17, saldoInicioMes: '33000', saldoActual: '32100', categoriaGestion: 'vencido', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '07/02/26', fechaVencimiento: '07/02/26', montoAmortizacion: '1650', montoRequeridoCorriente: '3300', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Tratamiento', typeVisitManagement: 'Visita presencial domicilio' }),
            ],
            'Gestión de Empresarias': [
                mk({ time: '15:00', name: 'YOLANDA ARCE MEDINA', fechaIngreso: '14/02/2025', moraDays: 0, saldoOcupado: '17000', saldoDisponible: '8000', typeManagement: 'Visita integral' }),
                mk({ time: '16:30', name: 'AMPARO CERVANTES QUIROZ', fechaIngreso: '30/08/2024', moraDays: 6, saldoOcupado: '20000', saldoDisponible: '0', typeManagement: 'Visita preventiva' }),
            ],
        },
    },
    // ── TIJUANA ─────────────────────────────────────────────────
    {
        id: 'ag-007', zona: 'ZONA III', sucursal: 'TIJUANA',
        operativo: { nombre: 'EDGAR BUSTAMANTE LUNA', puesto: 'Asesor Comercial', id: 'AC-0903' },
        fecha: '2026-02-24', horaEnvio: '07:50', status: 'aprobada',
        totalGestiones: 13,
        segments: {
            'Promoción': [
                mk({ time: '08:00', name: 'XÓCHITL REYES MIRANDA', classification: 'Prospecto', product: 'Microcredito', activity: 'Negocio de ropa usada en mercado, alta demanda', city: 'Tijuana', colony: 'Zona Norte', streets: 'Calle Artículo 123 y Revolución', phones: ['6641122334', '', ''] }),
                mk({ time: '09:30', name: 'WILFRIDO PÁEZ OLMOS', classification: 'Contacto', product: 'Consumo', activity: 'Empleado de maquiladora, referido por compañero', city: 'Tijuana', colony: 'Mesa de Otay', streets: 'Blvd Industrial y Calle 5ta', phones: ['6642233445', '', ''] }),
                mk({ time: '11:30', name: 'NATIVIDAD ROBLES CANO', classification: 'Prospecto', product: 'Pyme', activity: 'Restaurante pequeño, necesita capital de trabajo urgente', city: 'Tijuana', colony: 'La Mesa', streets: 'Blvd Díaz Ordaz y Calle 14', phones: ['6643344556', '', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '08:30', name: 'REBECA TRUJILLO SAENZ', classification: 'Cliente', typeIntegration: 'Renovación', product: 'Microcredito', estimatedAmount: '38000', annualRate: '56.55', subProduct: 'PREFERENCIAL', program: 'SCORE 500', activity: 'VoBo de Supervisor', city: 'Tijuana', colony: 'Playas', streets: 'Paseo Ensenada', portfolioStatus: 'Abono' }),
                mk({ time: '10:00', name: 'SAMUEL ESPINOSA MORA', classification: 'Prospecto', typeIntegration: 'Nuevo', product: 'Crédito Fácil', estimatedAmount: '20000', annualRate: '65.00', subProduct: 'FASTCREDIT', program: 'ATRACCIÓN DE LA COMPETENCIA', activity: 'Integración', city: 'Tijuana', colony: 'Hipódromo', streets: 'Av Agua Caliente', portfolioStatus: 'N/A' }),
                mk({ time: '13:00', name: 'ALMA DELIA FUENTES ROJO', classification: 'Cliente', typeIntegration: 'Convenio', product: 'Microcredito', estimatedAmount: '16000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Comité de Crédito', city: 'Tijuana', colony: 'Castillo', streets: 'Calle Décima', portfolioStatus: 'Convenio' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '12:00', name: 'BERNARDO SALINAS TELLO', idCredito: 'CRD-3345', moraInicioMes: 8, moraActual: 15, saldoInicioMes: '25000', saldoActual: '24200', categoriaGestion: 'vencido', ultimoEstatus: 'Sin contacto', ultimaFechaPago: '09/02/26', fechaVencimiento: '09/02/26', montoAmortizacion: '1300', montoRequeridoCorriente: '2600', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Cobranza', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '14:30', name: 'LETICIA CORONA VÁSQUEZ', idCredito: 'CRD-7712', moraInicioMes: 0, moraActual: 1, saldoInicioMes: '60000', saldoActual: '58500', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '23/02/26', fechaVencimiento: '23/03/26', montoAmortizacion: '3000', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '16:00', name: 'OSWALDO GUERRERO PITA', idCredito: 'CRD-8890', moraInicioMes: 50, moraActual: 57, saldoInicioMes: '9800', saldoActual: '9800', categoriaGestion: 'vencido', ultimoEstatus: 'Ilocalizable', ultimaFechaPago: '28/12/25', fechaVencimiento: '28/12/25', montoAmortizacion: '650', montoRequeridoCorriente: '5200', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
            ],
            'Gestión de Empresarias': [
                mk({ time: '15:00', name: 'HORTENSIA CABA MEDEL', fechaIngreso: '09/09/2024', moraDays: 3, saldoOcupado: '25000', saldoDisponible: '5000', typeManagement: 'Visita preventiva' }),
                mk({ time: '17:00', name: 'FRANCISCA MONTOYA RIOS', fechaIngreso: '01/01/2025', moraDays: 0, saldoOcupado: '18000', saldoDisponible: '12000', typeManagement: 'Visita integral' }),
            ],
        },
    },
    // ── CHIHUAHUA ───────────────────────────────────────────────
    {
        id: 'ag-008', zona: 'ZONA IV', sucursal: 'CHIHUAHUA',
        operativo: { nombre: 'VIRGINIA FLORES AGUIRRE', puesto: 'Asesor Financiero', id: 'AF-0501' },
        fecha: '2026-02-24', horaEnvio: '08:02', status: 'pendiente',
        totalGestiones: 9,
        segments: {
            'Promoción': [
                mk({ time: '08:00', name: 'LORENZO TRILLO MEZA', classification: 'Prospecto', product: 'Pyme', activity: 'Distribuidora de abarrotes, necesita crédito para temporada', city: 'Chihuahua', colony: 'Santa Rosa', streets: 'Calle Zarco y Libertad', phones: ['6141234567', '', ''] }),
                mk({ time: '09:30', name: 'IDALIA CHAVEZ OLGUIN', classification: 'Contacto', product: 'Microcredito', activity: 'Venta de artesanías en mercado municipal', city: 'Chihuahua', colony: 'Centro', streets: 'Calle Guerrero y Morelos', phones: ['6142345678', '', ''] }),
            ],
            'Evaluación e Integración': [
                mk({ time: '10:30', name: 'MARCO ANTONIO LUGO RASCON', classification: 'Prospecto', typeIntegration: 'Nuevo', product: 'Consumo', estimatedAmount: '80000', annualRate: '38.50', subProduct: 'BOLSÓN', program: 'ATRACCIÓN DE LA COMPETENCIA', activity: 'Integración', city: 'Chihuahua', colony: 'Paseos de Chihuahua', streets: 'Blvd Ortiz Mena', portfolioStatus: 'N/A' }),
                mk({ time: '13:00', name: 'JULIA ACOSTA FUENTES', classification: 'Cliente', typeIntegration: 'Renovación', product: 'Microcredito', estimatedAmount: '30000', annualRate: '56.55', subProduct: 'PREFERENCIAL', program: 'SCORE 500', activity: 'Validación Analista Operaciones o Mesa de Control', city: 'Chihuahua', colony: 'El Saucito', streets: 'Calle Camelia y Azalea', portfolioStatus: 'Abono' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '11:00', name: 'PORFIRIO DÍAZ QUIÑONES', idCredito: 'CRD-5521', moraInicioMes: 1, moraActual: 8, saldoInicioMes: '49000', saldoActual: '47800', categoriaGestion: 'vigente', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '16/02/26', fechaVencimiento: '16/03/26', montoAmortizacion: '2450', montoRequeridoCorriente: '2450', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '14:30', name: 'MERCEDES ROMO HERRERA', idCredito: 'CRD-3398', moraInicioMes: 30, moraActual: 37, saldoInicioMes: '7200', saldoActual: '7200', categoriaGestion: 'vencido', ultimoEstatus: 'Finado', ultimaFechaPago: '17/01/26', fechaVencimiento: '17/01/26', montoAmortizacion: '480', montoRequeridoCorriente: '2880', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
            ],
            'Gestión de Empresarias': [],
        },
    },
];

/**
 * TODO: Este arreglo se alimentará del EP: /api/v1/agendas/equipo/cobranza?fecha=YYYY-MM-DD
 * Consulta: (Misma estructura de Planes pero cruzando con Ejecutivos de Cobranza)
 */

// ─────────────────────────────────────────────────────────────────────────────
// AGENDAS CANAL COBRANZA (Gestor Interno)
// ─────────────────────────────────────────────────────────────────────────────
export const AGENDAS_COBRANZA = [
    {
        id: 'cob-001', zona: 'ZONA I', sucursal: 'HERMOSILLO', ejecutivoId: 'ej-01',
        operativo: { nombre: 'OSVALDO MENDOZA ACOSTA', puesto: 'Gestor Interno', id: 'GI-0034', equipo: 'Cobranza Administrativa' },
        fecha: '2026-02-24', horaEnvio: '07:55', status: 'pendiente',
        totalGestiones: 10,
        segments: {
            'Evaluación e Integración': [
                mk({ time: '09:00', name: 'CLAUDIA BERMÚDEZ SOLÍS', classification: 'Cliente', typeIntegration: 'Tratamiento', product: 'Microcredito', estimatedAmount: '18000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Comité de Crédito', city: 'Hermosillo', colony: 'Rio Sonora', streets: 'Blvd Aguilar', portfolioStatus: 'Compromiso de pago' }),
                mk({ time: '10:30', name: 'HÉCTOR MURILLO FONSECA', classification: 'Cliente', typeIntegration: 'Convenio', product: 'Microcredito', estimatedAmount: '12000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Corrección de Expediente', city: 'Hermosillo', colony: 'Olivares', streets: 'Calle García', portfolioStatus: 'Convenio' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '08:00', name: 'ARACELI SOTO FUENTES', idCredito: 'COB-1122', moraInicioMes: 15, moraActual: 22, saldoInicioMes: '16500', saldoActual: '16000', categoriaGestion: 'vencido', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '01/02/26', fechaVencimiento: '01/02/26', montoAmortizacion: '1050', montoRequeridoCorriente: '3150', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Tratamiento', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '11:30', name: 'TIMOTEO GUTIERREZ PONCE', idCredito: 'COB-2233', moraInicioMes: 30, moraActual: 37, saldoInicioMes: '24000', saldoActual: '23500', categoriaGestion: 'vencido', ultimoEstatus: 'Sin contacto', ultimaFechaPago: '18/01/26', fechaVencimiento: '18/01/26', montoAmortizacion: '1250', montoRequeridoCorriente: '5000', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
                mk({ time: '13:00', name: 'ELVIRA LUNA PERAZA', idCredito: 'COB-3344', moraInicioMes: 5, moraActual: 12, saldoInicioMes: '9800', saldoActual: '9400', categoriaGestion: 'vigente', ultimoEstatus: 'Promesa de pago', ultimaFechaPago: '12/02/26', fechaVencimiento: '12/03/26', montoAmortizacion: '620', montoRequeridoCorriente: '620', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '14:30', name: 'ROLANDO ACUÑA GUERRERO', idCredito: 'COB-4455', moraInicioMes: 60, moraActual: 67, saldoInicioMes: '31000', saldoActual: '31000', categoriaGestion: 'vencido', ultimoEstatus: 'Ilocalizable', ultimaFechaPago: '18/12/25', fechaVencimiento: '18/12/25', montoAmortizacion: '1600', montoRequeridoCorriente: '11200', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
                mk({ time: '16:00', name: 'CONSUELO BRACAMONTES RUIZ', idCredito: 'COB-5566', moraInicioMes: 1, moraActual: 8, saldoInicioMes: '18000', saldoActual: '17400', categoriaGestion: 'vigente', ultimoEstatus: 'Abono', ultimaFechaPago: '16/02/26', fechaVencimiento: '16/03/26', montoAmortizacion: '950', montoRequeridoCorriente: '950', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
            ],
        },
    },
    {
        id: 'cob-002', zona: 'ZONA I', sucursal: 'HERMOSILLO', ejecutivoId: 'ej-01',
        operativo: { nombre: 'KARINA MONTOYA BERNAL', puesto: 'Gestor Interno', id: 'GI-0041', equipo: 'Cobranza Administrativa' },
        fecha: '2026-02-24', horaEnvio: '08:00', status: 'aprobada',
        totalGestiones: 8,
        segments: {
            'Evaluación e Integración': [
                mk({ time: '08:30', name: 'ROGELIO YBARRA DEL RÍO', classification: 'Cliente', typeIntegration: 'Tratamiento', product: 'Microcredito', estimatedAmount: '22000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'VoBo de Supervisor', city: 'Hermosillo', colony: 'El Llano', streets: 'Calle Pinos y Cedros', portfolioStatus: 'Negativa de pago' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '09:00', name: 'MIRIAM YÉPEZ TIJERINA', idCredito: 'COB-6677', moraInicioMes: 0, moraActual: 4, saldoInicioMes: '28000', saldoActual: '27200', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '20/02/26', fechaVencimiento: '20/03/26', montoAmortizacion: '1400', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '10:30', name: 'ISIDRO PALOMINO VARGAS', idCredito: 'COB-7788', moraInicioMes: 25, moraActual: 32, saldoInicioMes: '14500', saldoActual: '14100', categoriaGestion: 'vencido', ultimoEstatus: 'Promesa de pago', ultimaFechaPago: '23/01/26', fechaVencimiento: '23/01/26', montoAmortizacion: '900', montoRequeridoCorriente: '3600', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Tratamiento', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '12:00', name: 'GRACIELA ROJO ESPINOZA', idCredito: 'COB-8899', moraInicioMes: 45, moraActual: 52, saldoInicioMes: '19000', saldoActual: '19000', categoriaGestion: 'vencido', ultimoEstatus: 'Ilocalizable', ultimaFechaPago: '03/01/26', fechaVencimiento: '03/01/26', montoAmortizacion: '1050', montoRequeridoCorriente: '7350', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
                mk({ time: '14:00', name: 'DELFINO SOSA MONTAÑO', idCredito: 'COB-9900', moraInicioMes: 3, moraActual: 10, saldoInicioMes: '37500', saldoActual: '36800', categoriaGestion: 'vigente', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '14/02/26', fechaVencimiento: '14/03/26', montoAmortizacion: '1875', montoRequeridoCorriente: '1875', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '15:30', name: 'VICTORIA ARMENTA LLANES', idCredito: 'COB-0011', moraInicioMes: 12, moraActual: 19, saldoInicioMes: '11200', saldoActual: '10900', categoriaGestion: 'vencido', ultimoEstatus: 'Sin contacto', ultimaFechaPago: '05/02/26', fechaVencimiento: '05/02/26', montoAmortizacion: '700', montoRequeridoCorriente: '1400', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Cobranza', typeVisitManagement: 'Visita presencial domicilio' }),
            ],
        },
    },
    {
        id: 'cob-003', zona: 'ZONA I', sucursal: 'OBREGON', ejecutivoId: 'ej-02',
        operativo: { nombre: 'ALBERTO OCHOA RENDÓN', puesto: 'Gestor Interno', id: 'GI-0057', equipo: 'Cobranza Administrativa' },
        fecha: '2026-02-24', horaEnvio: '07:58', status: 'requiere_modificacion',
        notaJefe: 'El cliente COB-1255 ya tiene convenio activo, no aplica Cobranza. Cambiar herramienta. Además falta la categoría de gestión en el registro de Robles.',
        totalGestiones: 7,
        segments: {
            'Evaluación e Integración': [
                mk({ time: '08:00', name: 'SALVADOR MONTOYA CUEVAS', classification: 'Cliente', typeIntegration: 'Convenio', product: 'Microcredito', estimatedAmount: '15000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Comité de Crédito', city: 'Cajeme', colony: 'Burocrática', streets: 'Calle Rosales', portfolioStatus: 'Convenio' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '09:00', name: 'BLANCA ROBLES ENCINAS', idCredito: 'COB-1255', moraInicioMes: 8, moraActual: 15, saldoInicioMes: '22000', saldoActual: '21400', categoriaGestion: 'vencido', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '09/02/26', fechaVencimiento: '09/02/26', montoAmortizacion: '1100', montoRequeridoCorriente: '2200', herramientaAplicada: 'Convenio', herramientaAplicar: 'Cobranza', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '11:00', name: 'MIGUEL VALENZUELA MAZO', idCredito: 'COB-2366', moraInicioMes: 0, moraActual: 2, saldoInicioMes: '48000', saldoActual: '47000', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '22/02/26', fechaVencimiento: '22/03/26', montoAmortizacion: '2400', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '13:00', name: 'LETICIA FLORES PARRA', idCredito: 'COB-3477', moraInicioMes: 35, moraActual: 42, saldoInicioMes: '18500', saldoActual: '18500', categoriaGestion: 'vencido', ultimoEstatus: 'Ilocalizable', ultimaFechaPago: '13/01/26', fechaVencimiento: '13/01/26', montoAmortizacion: '1000', montoRequeridoCorriente: '7000', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
                mk({ time: '15:00', name: 'CAMILO SÁNCHEZ IBARRA', idCredito: 'COB-4588', moraInicioMes: 12, moraActual: 19, saldoInicioMes: '9000', saldoActual: '8700', categoriaGestion: 'vencido', ultimoEstatus: 'Promesa de pago', ultimaFechaPago: '05/02/26', fechaVencimiento: '05/02/26', montoAmortizacion: '590', montoRequeridoCorriente: '1180', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Tratamiento', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '16:30', name: 'NORMA RIVAS PEDROZA', idCredito: 'COB-5699', moraInicioMes: 0, moraActual: 0, saldoInicioMes: '62000', saldoActual: '61000', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '24/02/26', fechaVencimiento: '24/03/26', montoAmortizacion: '3100', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
            ],
        },
    },
    // ── Gestores adicionales – Ejecutivo ej-02 (MARINA FUENTES) ───────
    {
        id: 'cob-004', zona: 'ZONA II', sucursal: 'LA PAZ', ejecutivoId: 'ej-02',
        operativo: { nombre: 'FERNANDA LEYVA QUIROGA', puesto: 'Gestor Interno', id: 'GI-0068', equipo: 'Cobranza Administrativa' },
        fecha: '2026-02-24', horaEnvio: '08:10', status: 'aprobada',
        totalGestiones: 6,
        segments: {
            'Evaluación e Integración': [
                mk({ time: '09:00', name: 'BENITO SALAZAR OLMOS', classification: 'Cliente', typeIntegration: 'Tratamiento', product: 'Microcredito', estimatedAmount: '20000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'Comité de Crédito', city: 'La Paz', colony: 'El Manglito', streets: 'Calle Bravo', portfolioStatus: 'Compromiso de pago' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '10:00', name: 'REMEDIOS ESTRADA VILLA', idCredito: 'COB-6100', moraInicioMes: 0, moraActual: 3, saldoInicioMes: '29000', saldoActual: '28300', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '21/02/26', fechaVencimiento: '21/03/26', montoAmortizacion: '1450', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '11:30', name: 'CLEMENTE BÁTIZ AMARO', idCredito: 'COB-6200', moraInicioMes: 20, moraActual: 27, saldoInicioMes: '13500', saldoActual: '13100', categoriaGestion: 'vencido', ultimoEstatus: 'Promesa de pago', ultimaFechaPago: '28/01/26', fechaVencimiento: '28/01/26', montoAmortizacion: '850', montoRequeridoCorriente: '2550', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Tratamiento', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '13:00', name: 'JOSEFINA PEÑA QUIÑONES', idCredito: 'COB-6300', moraInicioMes: 40, moraActual: 47, saldoInicioMes: '8800', saldoActual: '8800', categoriaGestion: 'vencido', ultimoEstatus: 'Ilocalizable', ultimaFechaPago: '09/01/26', fechaVencimiento: '09/01/26', montoAmortizacion: '580', montoRequeridoCorriente: '4060', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
                mk({ time: '15:00', name: 'DONATO RUIZ ANGULO', idCredito: 'COB-6400', moraInicioMes: 2, moraActual: 9, saldoInicioMes: '42000', saldoActual: '41100', categoriaGestion: 'vigente', ultimoEstatus: 'Sin contacto', ultimaFechaPago: '15/02/26', fechaVencimiento: '15/03/26', montoAmortizacion: '2100', montoRequeridoCorriente: '2100', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Visita presencial domicilio' }),
            ],
        },
    },
    {
        id: 'cob-005', zona: 'ZONA III', sucursal: 'TIJUANA', ejecutivoId: 'ej-03',
        operativo: { nombre: 'PASCUAL DOMÍNGUEZ FIERRO', puesto: 'Gestor Interno', id: 'GI-0079', equipo: 'Cobranza Administrativa' },
        fecha: '2026-02-24', horaEnvio: '07:45', status: 'pendiente',
        totalGestiones: 8,
        segments: {
            'Evaluación e Integración': [
                mk({ time: '08:30', name: 'ROCÍO CÁRDENAS PÉREZ', classification: 'Cliente', typeIntegration: 'Convenio', product: 'Microcredito', estimatedAmount: '17000', annualRate: '56.55', subProduct: 'NINGUNO', program: 'NINGUNO', activity: 'VoBo de Supervisor', city: 'Tijuana', colony: 'Zona Norte', streets: 'Calle Revolución', portfolioStatus: 'Convenio' }),
            ],
            'Seguimiento de Cartera': [
                mk({ time: '09:30', name: 'GILBERTO MEZA SANTANA', idCredito: 'COB-7100', moraInicioMes: 10, moraActual: 17, saldoInicioMes: '23000', saldoActual: '22400', categoriaGestion: 'vencido', ultimoEstatus: 'Compromiso de pago', ultimaFechaPago: '07/02/26', fechaVencimiento: '07/02/26', montoAmortizacion: '1150', montoRequeridoCorriente: '2300', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Cobranza', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '11:00', name: 'SABINA HURTADO OROZCO', idCredito: 'COB-7200', moraInicioMes: 0, moraActual: 0, saldoInicioMes: '51000', saldoActual: '49800', categoriaGestion: 'preventivo', ultimoEstatus: 'Abono', ultimaFechaPago: '24/02/26', fechaVencimiento: '24/03/26', montoAmortizacion: '2550', montoRequeridoCorriente: '0', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Gestión telefónica' }),
                mk({ time: '12:30', name: 'HILARIO JIMÉNEZ BRITO', idCredito: 'COB-7300', moraInicioMes: 55, moraActual: 62, saldoInicioMes: '11200', saldoActual: '11200', categoriaGestion: 'vencido', ultimoEstatus: 'Finado', ultimaFechaPago: '25/12/25', fechaVencimiento: '25/12/25', montoAmortizacion: '700', montoRequeridoCorriente: '5600', herramientaAplicada: 'Tratamiento', herramientaAplicar: 'Convenio Liquidación', typeVisitManagement: 'Visita presencial aval' }),
                mk({ time: '14:00', name: 'TRINIDAD ÁLVAREZ RUIZ', idCredito: 'COB-7400', moraInicioMes: 6, moraActual: 13, saldoInicioMes: '34000', saldoActual: '33200', categoriaGestion: 'vigente', ultimoEstatus: 'Sin contacto', ultimaFechaPago: '11/02/26', fechaVencimiento: '11/03/26', montoAmortizacion: '1700', montoRequeridoCorriente: '1700', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Ninguna', typeVisitManagement: 'Visita presencial domicilio' }),
                mk({ time: '15:30', name: 'CELESTINA ROMO DÍAZ', idCredito: 'COB-7500', moraInicioMes: 28, moraActual: 35, saldoInicioMes: '16800', saldoActual: '16500', categoriaGestion: 'vencido', ultimoEstatus: 'Negativa de pago', ultimaFechaPago: '20/01/26', fechaVencimiento: '20/01/26', montoAmortizacion: '1050', montoRequeridoCorriente: '3150', herramientaAplicada: 'Ninguna', herramientaAplicar: 'Tratamiento', typeVisitManagement: 'Visita presencial domicilio' }),
            ],
        },
    },
];


/**
 * TODO: Este arreglo se alimentará del EP: /api/v1/jerarquia/cobranza/ejecutivos
 * Consulta:
 * SELECT u.id_usuario as id, u.nombre, j.id_jefe as coordinadorId 
 * FROM seguridad.usuarios u ... WHERE puesto = 'EJECUTIVO-COB'
 */


// ─────────────────────────────────────────────────────────────────────────────
// ESTRUCTURA JERÁRQUICA COBRANZA
// (los gestores no se agrupan por zona/sucursal sino por ejecutivo asignado)
// ─────────────────────────────────────────────────────────────────────────────
export const EJECUTIVOS_COBRANZA = [
    {
        id: 'ej-01',
        nombre: 'ROBERTO DÍAZ PALOMINO',
        coordinadorId: 'coord-01',
        agendaIds: ['cob-001', 'cob-002'],
        // sucursales sólo ilustrativas, no estructurales
        sucursalesRef: ['HERMOSILLO', 'GUAYMAS'],
    },
    {
        id: 'ej-02',
        nombre: 'MARINA FUENTES ESTRADA',
        coordinadorId: 'coord-01',
        agendaIds: ['cob-003', 'cob-004'],
        sucursalesRef: ['OBREGON', 'LA PAZ', 'NAVOJOA'],
    },
    {
        id: 'ej-03',
        nombre: 'CLAUDIA TORRES BRACAMONTES',
        coordinadorId: 'coord-02',
        agendaIds: ['cob-005'],
        sucursalesRef: ['TIJUANA', 'MEXICALI'],
    },
];

/**
 * TODO: Este arreglo se alimentará del EP: /api/v1/jerarquia/cobranza/coordinadores
 * Consulta:
 * SELECT u.id_usuario as id, u.nombre
 * FROM seguridad.usuarios u ... WHERE puesto = 'COORD-COB'
 */
export const COORDINADORES_COBRANZA = [
    {
        id: 'coord-01',
        nombre: 'HÉCTOR SALINAS MONTOYA',
        ejecutivoIds: ['ej-01', 'ej-02'],
    },
    {
        id: 'coord-02',
        nombre: 'PATRICIA CARO DELGADO',
        ejecutivoIds: ['ej-03'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS para agrupar
// ─────────────────────────────────────────────────────────────────────────────
export const agruparPorSucursal = (agendas) => {
    return agendas.reduce((acc, ag) => {
        if (!acc[ag.sucursal]) acc[ag.sucursal] = { zona: ag.zona, agendas: [] };
        acc[ag.sucursal].agendas.push(ag);
        return acc;
    }, {});
};

export const agruparPorZona = (agendas) => {
    return agendas.reduce((acc, ag) => {
        if (!acc[ag.zona]) acc[ag.zona] = {};
        if (!acc[ag.zona][ag.sucursal]) acc[ag.zona][ag.sucursal] = [];
        acc[ag.zona][ag.sucursal].push(ag);
        return acc;
    }, {});
};

/** Devuelve las agendas de cobranza de un ejecutivo específico */
export const agendasDeEjecutivo = (allAgendas, ejecutivoId) =>
    allAgendas.filter(ag => ag.ejecutivoId === ejecutivoId);

export const contarEstados = (agendas) => ({
    total: agendas.length,
    pendiente: agendas.filter(a => a.status === 'pendiente').length,
    aprobada: agendas.filter(a => a.status === 'aprobada').length,
    requiere_modificacion: agendas.filter(a => a.status === 'requiere_modificacion').length,
    totalGestiones: agendas.reduce((s, a) => s + a.totalGestiones, 0),
});


/* ==========================================================================
 * SIMULACIÓN DE ENDPOINTS (API SERVICE)
 * ========================================================================== */
// TODO: Reemplazar el cuerpo de estas funciones con llamadas reales (axios.get/post)

export const AgendaApiService = {
    
    // 1. Obtener las agendas de un equipo (Aplica para todos los jefes)
    // EP Sugerido: GET /api/v1/agendas/equipo?fecha=YYYY-MM-DD
    getAgendasEquipo: async (canal) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const data = canal === 'cobranza' ? AGENDAS_COBRANZA : AGENDAS_COMERCIAL;
                resolve({ codigo: 'OK', contenido: data });
            }, 500); 
        });
    },

    // 2. Obtener la jerarquía de cobranza (Solo para subdirector de cobranza)
    // EP Sugerido: GET /api/v1/jerarquia/cobranza
    getJerarquiaCobranza: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    codigo: 'OK',
                    contenido: {
                        coordinadores: COORDINADORES_COBRANZA,
                        ejecutivos: EJECUTIVOS_COBRANZA
                    }
                });
            }, 300);
        });
    },

    // 3. Autorizar o Rechazar una agenda (PUT / POST)
    // EP Sugerido: PUT /api/v1/agendas/{idPlan}/estatus
    actualizarEstatusAgenda: async (idPlan, estatus, nota = '') => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    codigo: 'OK',
                    mensaje: `Agenda ${idPlan} actualizada a ${estatus} correctamente.`
                });
            }, 600);
        });
    },

    // 4. Registrar Gestión Operativa (Check-in)
    // EP Sugerido: POST /api/v1/gestiones/ejecucion
    registrarCheckIn: async (idVisita, formData) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    codigo: 'OK',
                    mensaje: 'Gestión guardada correctamente en base de datos.'
                });
            }, 800);
        });
    }
};