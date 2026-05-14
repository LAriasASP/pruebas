import axios from 'axios';
import LoggerService from '../services/LoggerService'; 

const api = axios.create({
    baseURL: import.meta.env.VITE_API_ORIGIN_COBRANZA,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Respuestas (Atrapa los errores globalmente)
api.interceptors.response.use(
    // Si la respuesta es exitosa (código 2xx), la dejamos pasar normal
    (response) => response,
    
    // Si hay un error (4xx, 5xx o de red)
    (error) => {
        // Extraemos un mensaje claro del backend o usamos uno por defecto
        const errorMsg = error.response?.data?.mensaje || error.message || 'Error de red desconocido';
        
        const errorData = {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data
        };
        
        // Registramos el error en nuestro servicio centralizado silenciosamente
        LoggerService.error(`Fallo en API: ${errorMsg}`, errorData);
        
        // Rechazamos la promesa para que el componente que hizo la llamada lo sepa
        return Promise.reject(error);
    }
);


export default api;