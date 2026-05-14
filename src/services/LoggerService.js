/**
 * Servicio centralizado para el registro de errores y eventos.
 * Guarda los logs en localStorage para auditoría y soporte técnico.
 */
class LoggerService {
    constructor() {
        this.storageKey = 'app_logs';
        this.maxLogs = 100; // Límite máximo para no saturar la memoria del navegador
    }

    _saveLog(level, message, data = null) {
        try {
            // Obtenemos los logs actuales o iniciamos un array vacío
            const currentLogs = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            
            // Creamos el nuevo registro con estampa de tiempo
            const newLog = {
                timestamp: new Date().toISOString(),
                level,
                message,
                data: data ? data : null,
            };
            
            // Añadimos el log al inicio del array (el más reciente primero)
            currentLogs.unshift(newLog);
            
            // Si superamos el límite, eliminamos el más antiguo (el último)
            if (currentLogs.length > this.maxLogs) {
                currentLogs.pop(); 
            }
            
            // Guardamos de vuelta en localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(currentLogs));
        } catch (e) {
            console.error("Error al intentar guardar el log en localStorage", e);
        }
    }

    // Métodos públicos para usar en la aplicación
    info(message, data) { 
        this._saveLog('INFO', message, data); 
        console.info(message, data); 
    }
    
    warn(message, data) { 
        this._saveLog('WARN', message, data); 
        console.warn(message, data); 
    }
    
    error(message, errorObj) { 
        // Extraemos solo lo necesario del objeto de error para que sea "stringifyable"
        const errorData = errorObj ? { 
            message: errorObj.message, 
            stack: errorObj.stack,
            url: errorObj.config?.url,
            status: errorObj.response?.status
        } : null;
        
        this._saveLog('ERROR', message, errorData); 
        console.error(`[LoggerService] ${message}`, errorObj); 
    }
    
    // Método para uso futuro de soporte (ej. descargar logs)
    getLogs() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }
    
    clearLogs() {
        localStorage.removeItem(this.storageKey);
    }
}

// Exportamos una única instancia (Singleton)
const loggerServiceInstance = new LoggerService();
export default loggerServiceInstance;