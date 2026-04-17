import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_ORIGIN_COBRANZA,
    withCredentials: true, // <--- ¡ESTA ES LA LLAVE MÁGICA! Permite enviar las cookies de sesión
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;