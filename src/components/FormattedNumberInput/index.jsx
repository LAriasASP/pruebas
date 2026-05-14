import React, { useState, useEffect } from 'react';

const FormattedNumberInput = ({ value, onChange, type = 'currency', label, placeholder = '0.00', disabled = false }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const number = parseFloat(val);
    if (isNaN(number)) return val;
    if (type === 'currency') {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(number);
    } else if (type === 'percentage') {
      return `${number.toFixed(2)}%`;
    }
    return val;
  };

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value));
    } else {
      setDisplayValue(value || '');
    }
  }, [value, isFocused, type]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value || '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatValue(value));
  };

  const handleChange = (e) => {
    let rawValue = e.target.value.replace(/[^0-9.]/g, '');
    if ((rawValue.match(/\./g) || []).length > 1) return; 
    setDisplayValue(rawValue);
    onChange(rawValue);
  };

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={isFocused ? '' : placeholder}
        disabled={disabled}
        className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl block p-3 transition-all outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm'}`}
      />
    </div>
  );
};

export default FormattedNumberInput;