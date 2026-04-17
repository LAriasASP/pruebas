import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig'; // <-- Ajusta la ruta según donde guardaste el archivo anterior

const CatalogContext = createContext();

export const CatalogProvider = ({ children }) => {
    // 1. Estado inicial vacío
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

            // Ejecutamos las 16 peticiones en paralelo para que sea súper rápido
            const [
                zonasRes, estadosRes, prodRes, subprodRes, progRes, intRes,
                actRes, clasifRes, gestRes, herrRes, estCartRes, subEstRes,
                motVisRes, motActRes, resGestRes, bloquesRes
            ] = await Promise.all([
                api.get('/catalogos/zonas-sucursales'),
                api.get('/catalogos/estados'),
                api.get('/catalogos/productos'),
                api.get('/catalogos/subproductos'),
                api.get('/catalogos/programas'),
                api.get('/catalogos/tipo-integracion'),
                api.get('/catalogos/canales'),
                api.get('/catalogos/clasificaciones'),
                api.get('/catalogos/estados-visita'),
                api.get('/catalogos/herramientas'),
                api.get('/catalogos/estatus-cartera'),
                api.get('/catalogos/sub-estatus'),
                api.get('/catalogos/motivos-no-visita'),
                api.get('/catalogos/motivos-no-actividad'),
                api.get('/catalogos/resultados-gestion'),
                api.get('/catalogos/bloques')
            ]);

            // Función helper: Si el back manda { contenido: [...] } extrae el contenido, si no, usa data directo
            const extractData = (res) => res.data?.contenido || res.data || [];

            setCatalogos({
                zonasSucursales: extractData(zonasRes),
                estadosAgenda: extractData(estadosRes),
                productos: extractData(prodRes),
                subproductos: extractData(subprodRes),
                programas: extractData(progRes),
                tiposIntegracion: extractData(intRes),
                actividades: extractData(actRes),
                clasificaciones: extractData(clasifRes),
                tiposGestion: extractData(gestRes),
                herramientas: extractData(herrRes),
                estatusCartera: extractData(estCartRes),
                subEstatus: extractData(subEstRes),
                motivosNoVisita: extractData(motVisRes),
                motivosNoActividad: extractData(motActRes),
                resultadosGestion: extractData(resGestRes),
                bloques: extractData(bloquesRes),
                loading: false,
                error: null
            });

        } catch (err) {
            console.error("Error cargando catálogos desde el API:", err);
            setCatalogos(prev => ({ 
                ...prev, 
                loading: false, 
                error: 'Error de conexión al cargar catálogos. Verifica que el servidor esté encendido.' 
            }));
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