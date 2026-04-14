import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const { session } = useAuth();

    // Ahora leemos exactamente las llaves que definimos en AuthContext
    const selectedRole = session ? {
        id: session.clavePuesto ? String(session.clavePuesto).toLowerCase() : 'sin-rol', 
        name: session.nombrePuesto || 'Rol Desconocido',
        category: session.category || 'Operativo', // Ya viene como 'Jefe' o 'Operativo' desde AuthContext
        canal: session.canal || 'general',
        nivel: session.nivel || 1
    } : null;

    const roles = selectedRole ? [selectedRole] : [];

    return (
        <RoleContext.Provider value={{ selectedRole, roles }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};