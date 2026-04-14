import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const { session } = useAuth();

    // Extraemos el rol directamente desde la sesión autenticada que armamos en AuthContext.
    // Si el usuario no está logueado, selectedRole será null.
    const selectedRole = session ? {
        id: session.clavePuesto ? session.clavePuesto.toLowerCase() : 'sin-rol', 
        name: session.nombrePuesto,
        category: session.category === 'JEFE' ? 'Jefe' : 'Operativo',
        canal: session.canal ? session.canal.toLowerCase() : 'general',
        nivel: session.nivel // Ya viene como número entero desde el AuthContext
    } : null;

    // Solo exportamos el rol real en un arreglo de 1 elemento,
    // para no romper componentes que esperaban iterar sobre `roles` en la demo.
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