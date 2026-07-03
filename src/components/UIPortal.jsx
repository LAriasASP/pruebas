import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Componente Reutilizable: UIPortal
 * Propósito: Teletransportar elementos visuales flotantes fuera de la jerarquía 
 * principal del DOM para evitar que sean ocultados por contenedores padres.
 * 
 * @param {ReactNode} children - El contenido (botones, menús, etc.) que se va a teletransportar.
 */
const UIPortal = ({ children }) => {
    // Estado para saber si el componente ya se cargó en el navegador de forma segura
    const [isMounted, setIsMounted] = useState(false);

    // useEffect se ejecuta solo una vez cuando el componente se muestra en pantalla
    useEffect(() => {
        setIsMounted(true); // Confirmamos que es seguro usar el "document"
    }, []);

    // Si aún no estamos en el navegador, no intentamos renderizar nada para evitar errores
    if (!isMounted) {
        return null;
    }

    // createPortal requiere 2 cosas:
    // 1. Qué vamos a renderizar (children)
    // 2. En dónde lo vamos a colocar (al final del todo en el document.body)
    return createPortal(children, document.body);
};

export default UIPortal;