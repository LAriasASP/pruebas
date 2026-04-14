import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const STORAGE_KEY = 'bc-auth-session';

const API_LOGIN = import.meta.env.VITE_API_URL_LOGIN;
const API_COBRANZA = import.meta.env.VITE_API_ORIGIN_COBRANZA;

const getStoredSession = () => {
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (!storedSession) return null;
    try {
        return JSON.parse(storedSession);
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(getStoredSession);
    const [loading, setLoading] = useState(true);

    const checkServerSession = async () => {
        try {
            // 1. Validamos cookie con backend de login
            const sessionResponse = await axios.post(`${API_LOGIN}/auth/sesion`, null, {
                withCredentials: true 
            });

            if (sessionResponse.data?.codigo === 'OK' && sessionResponse.data?.contenido === true) {
                
                // 2. Traemos la Info Inicial (Rol y Permisos Reales)
                const infoResponse = await axios.get(`${API_COBRANZA}/usuario/info-inicial`, {
                    withCredentials: true
                });

                if (infoResponse.data?.codigo === 'OK' && infoResponse.data?.contenido) {
                    const userData = infoResponse.data.contenido;
                    
                    // 3. Traemos la Info de Zonas (Sucursal y Zona Reales)
                    let datosUbicacion = { sucursal: "Matriz", zona: "Sin asignar" };
                    try {
                        const zonasResponse = await axios.get(`${API_COBRANZA}/usuario/info-zonas`, {
                            withCredentials: true
                        });
                        if (zonasResponse.data?.codigo === 'OK' && zonasResponse.data?.contenido) {
                            datosUbicacion = {
                                sucursal: zonasResponse.data.contenido.sucursal || "Matriz",
                                zona: zonasResponse.data.contenido.zona || "Sin asignar"
                            };
                        }
                    } catch (zonaError) {
                        console.warn("El usuario no tiene zona asignada o falló el endpoint de zonas", zonaError);
                    }

                    // 4. Armamos la sesión. 
                    // ¡AQUÍ ESTABA EL DETALLE! La clave corta (ej. "COORDINADOR-L") viene en userData.id
                    const activeSession = {
                        isAuthenticated: true,
                        idUsuario: userData.userId,
                        name: userData.userName,
                        email: "", // Si no viene email, lo dejamos vacío
                        puestoId: userData.idPuesto,
                        nombrePuesto: userData.name,
                        canal: userData.canal?.toLowerCase() || 'general',
                        category: userData.category === 'JEFE' ? 'Jefe' : 'Operativo',
                        nivel: userData.nivel ? parseInt(userData.nivel.replace('N', '')) : null,
                        clavePuesto: userData.id, // <--- CORRECCIÓN: Usamos userData.id
                        sucursal: datosUbicacion.sucursal, 
                        zona: datosUbicacion.zona 
                    };

                    setSession(activeSession);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
                } else {
                    throw new Error("No se pudo obtener la información inicial");
                }
            } else {
                throw new Error("Sesión inválida");
            }
        } catch (error) {
            console.log("No hay sesión activa o la cookie expiró.");
            setSession(null);
            localStorage.removeItem(STORAGE_KEY);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkServerSession();
    }, []);

    const login = async ({ email, password }) => {
        if (!email?.trim() || !password?.trim()) {
            throw new Error('Ingresa tu correo y tu contraseña.');
        }
        try {
            await axios.post(`${API_LOGIN}/login`, { email, password }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            await checkServerSession();
        } catch (error) {
            console.error("Error en login:", error);
            throw new Error("Credenciales inválidas o error de conexión.");
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_LOGIN}/auth/cerrar-sesion`, null, {
                withCredentials: true
            });
        } catch (error) {
            console.error("Error al cerrar sesión en el backend", error);
        } finally {
            setSession(null);
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = '/login'; 
        }
    };

    return (
        <AuthContext.Provider value={{ 
            session, 
            isAuthenticated: Boolean(session), 
            loading,
            login, 
            logout, 
            checkServerSession 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};