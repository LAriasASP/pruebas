import React, { createContext, useContext, useState, useEffect } from 'react';

const CatalogContext = createContext();

export const CatalogProvider = ({ children }) => {
    // 1. Estado inicial vacío (Es lo que verá React durante los milisegundos que tarda la petición)
    const [catalogos, setCatalogos] = useState({
        zonasSucursales: [],
        estadosAgenda: [],
        productos: [],
        subproductos: [],
        programas: [],
        tiposIntegracion: [],
        actividades: [],
        clasificaciones: [],
        tiposGestion: [],
        herramientas: [],
        estatusCartera: [],
        subEstatus: [],
        motivosNoVisita: [],
        motivosNoActividad: [],
        resultadosGestion: [],
        bloques: [],
        loading: true,
        error: null
    });

    const loadCatalogs = async () => {
        try {
            setCatalogos(prev => ({ ...prev, loading: true, error: null }));

            /**
             * TODO: ENDPOINT MAESTRO
             * Cuando el backend tenga listo el EP maestro que devuelve todo el JSON,
             * borra el "await new Promise..." y el objeto "mockData", y descomenta esto:
             * * const response = await axios.get('/api/v1/catalogos/generales', { withCredentials: true });
             * if (response.data?.codigo === 'OK') {
             * setCatalogos({ ...response.data.contenido, loading: false, error: null });
             * }
             * return;
             */

            // Simulamos el retraso de la red (borrar al conectar el EP Real)
            await new Promise(resolve => setTimeout(resolve, 600));

            // ESTA DATA ES EXACTAMENTE LA DE TU BASE DE DATOS (EP_catalogos.txt)
            const mockData = {
                zonasSucursales: [
                    { id: "zona-1", nombre: "ZONA I", sucursal: "LA PAZ" },
                    { id: "zona-1", nombre: "ZONA I", sucursal: "PUERTO PEÑASCO" },
                    { id: "zona-1", nombre: "ZONA I", sucursal: "OBREGON" },
                    { id: "zona-1", nombre: "ZONA I", sucursal: "NAVOJOA" },
                    { id: "zona-1", nombre: "ZONA I", sucursal: "HUATABAMPO" },
                    { id: "zona-1", nombre: "ZONA I", sucursal: "HERMOSILLO" },
                    { id: "zona-1", nombre: "ZONA I", sucursal: "GUAYMAS" },
                    { id: "zona-1", nombre: "ZONA I", sucursal: "CABORCA" },
                    { id: "zona-2", nombre: "ZONA II", sucursal: "VIZCAINO" },
                    { id: "zona-2", nombre: "ZONA II", sucursal: "SANTA ROSALIA" },
                    { id: "zona-2", nombre: "ZONA II", sucursal: "SAN JOSE DEL CABO" },
                    { id: "zona-2", nombre: "ZONA II", sucursal: "LORETO" },
                    { id: "zona-2", nombre: "ZONA II", sucursal: "CONSTITUCIÓN" },
                    { id: "zona-2", nombre: "ZONA II", sucursal: "CABO SAN LUCAS" },
                    { id: "zona-3", nombre: "ZONA III", sucursal: "TIJUANA" },
                    { id: "zona-3", nombre: "ZONA III", sucursal: "SAN QUINTíN" },
                    { id: "zona-3", nombre: "ZONA III", sucursal: "SAN LUIS RIO COLORADO" },
                    { id: "zona-3", nombre: "ZONA III", sucursal: "MOD ENSENADA" },
                    { id: "zona-3", nombre: "ZONA III", sucursal: "MEXICALI" },
                    { id: "zona-3", nombre: "ZONA III", sucursal: "ENSENADA" },
                    { id: "zona-4", nombre: "ZONA IV", sucursal: "TORREON" },
                    { id: "zona-4", nombre: "ZONA IV", sucursal: "PUERTO VALLARTA" },
                    { id: "zona-4", nombre: "ZONA IV", sucursal: "MAZATLÁN" },
                    { id: "zona-4", nombre: "ZONA IV", sucursal: "GUASAVE" },
                    { id: "zona-4", nombre: "ZONA IV", sucursal: "GUAMUCHIL" },
                    { id: "zona-4", nombre: "ZONA IV", sucursal: "DELICIAS" },
                    { id: "zona-4", nombre: "ZONA IV", sucursal: "CHIHUAHUA" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "VERACRUZ" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "TUXPAN" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "TAMPICO NORTE" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "POZA RICA" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "ORIZABA" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "MINATITLÁN" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "CÓRDOBA" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "COATZACOALCOS" },
                    { id: "zona-5", nombre: "ZONA V", sucursal: "ACAYUCAN" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "ROSA MORADA" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "SAN BLAS" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "RUIZ" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "SANTIAGO IXCUINTLA" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "COMPOSTELA" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "XALISCO" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "TEPIC" },
                    { id: "zona-6", nombre: "ZONA VI", sucursal: "NAYARIT" }
                ],
                estadosAgenda: [
                    { id: 1, nombre: "BORRADOR" },
                    { id: 2, "nombre": "PENDIENTE" },
                    { id: 3, "nombre": "APROBADA" },
                    { id: 4, "nombre": "REQUIERE_MODIFICACION" }
                ],
                productos: [
                    { id: 1, nombre: "NA", categoria: "Otro" },
                    { id: 2, nombre: "Microcrédito", categoria: "Crédito" },
                    { id: 3, nombre: "PYME", categoria: "Crédito" },
                    { id: 4, nombre: "Empresarial", categoria: "Crédito" },
                    { id: 5, nombre: "Consumo", categoria: "Crédito" },
                    { id: 6, nombre: "Crédito Fácil", categoria: "Crédito" },
                    { id: 7, nombre: "Captación", categoria: "Ahorro" }
                ],
                subproductos: [
                    { id: 8, nombre: "NINGUNO" },
                    { id: 9, nombre: "PREFERENCIAL" },
                    { id: 10, nombre: "BOLSÓN" },
                    { id: 11, nombre: "BACK TO BACK" },
                    { id: 12, nombre: "LIQUIDEZ" },
                    { id: 13, nombre: "FASTCREDIT" }
                ],
                programas: [
                    { id: 1, nombre: "NINGUNO" },
                    { id: 2, nombre: "SCORE 500" },
                    { id: 3, nombre: "ATRACCIÓN DE LA COMPETENCIA" },
                    { id: 4, nombre: "OTRO" }
                ],
                tiposIntegracion: [
                    { id: 1, nombre: "Nuevo" },
                    { id: 2, nombre: "Renovación" },
                    { id: 3, nombre: "Tratamiento" },
                    { id: 4, nombre: "Convenio" }
                ],
                actividades: [
                    { id: 1, nombre: "Integración" },
                    { id: 2, nombre: "Validación Analista Operaciones o Mesa de Control" },
                    { id: 3, nombre: "Verificación Telefónica" },
                    { id: 4, nombre: "Verificación Presencial" },
                    { id: 5, nombre: "Comité de Crédito" },
                    { id: 6, nombre: "Corrección de Expediente" },
                    { id: 7, nombre: "VoBo de Supervisor" }
                ],
                clasificaciones: [
                    { id: 1, nombre: "CONTACTO" },
                    { id: 2, nombre: "CLIENTE" },
                    { id: 3, nombre: "PROSPECTO" },
                    { id: 4, nombre: "NO EVALUADO" }
                ],
                tiposGestion: [
                    { id: 1, nombre: "Visita integral" },
                    { id: 2, nombre: "Visita correctiva" },
                    { id: 3, nombre: "Visita preventiva" },
                    { id: 4, nombre: "Visita presencial domicilio" },
                    { id: 5, nombre: "Visita presencial aval" },
                    { id: 6, nombre: "Visita presencial Trabajo" },
                    { id: 7, nombre: "Gestión telefónica" },
                    { id: 8, nombre: "Gestión envió de sms" },
                    { id: 9, nombre: "Gestión telefónica aval" },
                    { id: 10, nombre: "Gestión envió de sms aval" }
                ],
                herramientas: [
                    { id: 1, nombre: "Ninguna" },
                    { id: 2, nombre: "Cobranza" },
                    { id: 3, nombre: "Renovación Especial" },
                    { id: 4, nombre: "Tratamiento" },
                    { id: 5, nombre: "Convenio Liquidacion" }
                ],
                estatusCartera: [
                    { id: 1, nombre: "Abono/ Pago Parcial" },
                    { id: 2, nombre: "Compromiso de pago" },
                    { id: 3, nombre: "Negativa de pago" },
                    { id: 4, nombre: "Ilocalizable" },
                    { id: 5, nombre: "Promesa de pago" },
                    { id: 6, nombre: "Sin contacto" },
                    { id: 7, nombre: "Convenio" },
                    { id: 8, nombre: "Finado" }
                ],
                subEstatus: [
                    { id: 1, nombre: "N/A" },
                    { id: 2, nombre: "Insolvente" },
                    { id: 3, "nombre": "Solvente" },
                    { id: 4, "nombre": "No reconoce el crédito" },
                    { id: 5, "nombre": "Dice que ya pago" },
                    { id: 6, "nombre": "Liquidación" },
                    { id: 7, "nombre": "Normalización" },
                    { id: 8, "nombre": "Trat Especial" },
                    { id: 9, "nombre": "Cliente no estuvo " },
                    { id: 10, "nombre": "Aviso debajo de la puerta" },
                    { id: 11, "nombre": "Se cambio domicilio (Ilocalizable)" },
                    { id: 12, "nombre": "Convenio vigentes" },
                    { id: 13, "nombre": "Convenios Liquidados" },
                    { id: 14, "nombre": "Convenio cumplidos" },
                    { id: 15, "nombre": "Convenio pago parcial" },
                    { id: 16, "nombre": "Convenio incumplidos" },
                    { id: 17, "nombre": "Convenio generados mes" }
                ],
                motivosNoVisita: [
                    { id: 1, nombre: "Cliente no disponible" },
                    { id: 2, nombre: "Dirección incorrecta o no encontrada" },
                    { id: 3, nombre: "Visita reagendada por el cliente" },
                    { id: 4, nombre: "Emergencia de ruta" },
                    { id: 5, nombre: "Condiciones de seguridad" },
                    { id: 6, nombre: "Tiempo insuficiente en ruta" },
                    { id: 7, nombre: "Otro" }
                ],
                motivosNoActividad: [
                    { id: 1, nombre: "Cliente no disponible" },
                    { id: 2, nombre: "Actividad reagendada por el cliente" },
                    { id: 3, nombre: "Tiempo insuficiente" },
                    { id: 4, nombre: "Documentación incompleta" },
                    { id: 5, nombre: "Decisión del cliente pospuesta" },
                    { id: 6, nombre: "Pendiente de autorización interna" },
                    { id: 7, nombre: "Otro" }
                ],
                resultadosGestion: [
                    { id: 1, nombre: "Solicitud pre-llenada entregada" },
                    { id: 2, nombre: "Solicitud completa entregada" },
                    { id: 3, nombre: "Prospecto interesado — seguimiento" },
                    { id: 4, nombre: "Cita agendada" },
                    { id: 5, nombre: "Evaluación completada" },
                    { id: 6, nombre: "VoBo de supervisor obtenido" },
                    { id: 7, nombre: "Cliente no interesado" },
                    { id: 8, nombre: "Otro" }
                ],
                bloques: [
                    { id: 1, nombre: "Promoción" },
                    { id: 2, nombre: "Evaluación e Integración" },
                    { id: 3, nombre: "Seguimiento de Cartera" },
                    { id: 4, nombre: "Gestión de Empresarias" },
                    { id: 5, nombre: "Visita No Planeada" }
                ]
            };

            setCatalogos({
                ...mockData,
                loading: false,
                error: null
            });

        } catch (err) {
            console.error("Error cargando catálogos", err);
            setCatalogos(prev => ({ ...prev, loading: false, error: 'Error al cargar catálogos' }));
        }
    };

    useEffect(() => {
        loadCatalogs();
    }, []);

    return (
        <CatalogContext.Provider value={catalogos}>
            {children}
        </CatalogContext.Provider>
    );
};

export const useCatalogs = () => useContext(CatalogContext);