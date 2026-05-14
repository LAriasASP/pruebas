import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const UIModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'danger'
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
}) => {
  const [mounted, setMounted] = useState(false);

  // Asegura que el portal solo se renderice en el cliente (navegador)
  useEffect(() => {
    setMounted(true);
    
    // Bloquear el scroll del fondo cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-indigo-600" />;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Botón de cierre superior */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenido del Modal */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-2">
            <div className="shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-slate-200 rounded-b-xl">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-indigo-950 hover:bg-slate-900'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  // Inyectar el modal en el body o en un div específico para modales
  return createPortal(
    modalContent,
    document.getElementById('modal-root') || document.body
  );
};

export default UIModal;