
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

const MODAL_TYPES = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  danger: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
};

const UIModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // info, success, warning, danger
  showConfirmButton = true,
  onConfirm,
  confirmButtonText = 'Aceptar',
  showCancelButton = false,
  onCancel,
  cancelButtonText = 'Cancelar',
}) => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const modalConfig = MODAL_TYPES[type] || MODAL_TYPES.info;
  const IconComponent = modalConfig.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-500 bg-opacity-75 backdrop-filter backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center justify-center mb-4">
          {IconComponent && (
            <IconComponent size={48} className={`${modalConfig.color} mb-2`} />
          )}
          {title && <h3 className="text-xl font-semibold text-slate-800 text-center mb-2">{title}</h3>}
          {message && <p className="text-slate-600 text-center text-sm">{message}</p>}
        </div>

        <div className="flex justify-center space-x-4 mt-6">
          {showCancelButton && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
            >
              {cancelButtonText}
            </button>
          )}
          {showConfirmButton && (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
            >
              {confirmButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  if (isBrowser) {
    return ReactDOM.createPortal(modalContent, document.getElementById('modal-root') || document.body);
  } else {
    return null;
  }
};

export default UIModal;