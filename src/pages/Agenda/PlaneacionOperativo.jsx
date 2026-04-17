import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Plus, MapPin, Search, Navigation, Calendar, Clock, Trash2, Phone, MoreHorizontal, User, Tag, CheckCircle2 } from 'lucide-react';
import { useAgenda } from '../../context/AgendaContext';
import { useCatalogs } from '../../context/CatalogContext';
import KpiCompromisos from './KpiCompromisos';

const timeOptions = [];
for (let hour = 8; hour <= 20; hour++) {
    for (let min of ['00', '15', '30', '45']) {
        if (hour === 20 && min !== '00') break;
        const h = hour.toString().padStart(2, '0');
        timeOptions.push(`${h}:${min}`);
    }
}

// --- HELPER COMPONENTS & FUNCTIONS ---

const handleNumericChange = (value, callback, limit = null) => {
    const cleanValue = value.replace(/\D/g, '');
    if (limit && cleanValue.length > limit) return;
    callback(cleanValue);
};

const formatCurrency = (val) => {
    if (!val) return '$0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
};

const handlePercentageChange = (value, callback) => {
    let clean = value.replace(/[^\d.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
    let integerPart = parts[0] || '';
    let decimalPart = parts[1] || '';
    if (integerPart.length > 2) integerPart = integerPart.slice(0, 2);
    if (decimalPart.length > 2) decimalPart = decimalPart.slice(0, 2);
    const finalValue = parts.length > 1 ? `${integerPart}.${decimalPart}` : integerPart;
    callback(finalValue);
};

// Autocomplete Name Input
const ClientNameInput = ({ value, idx, segmentName, updateVisit, mockDatabase }) => {
    const [query, setQuery] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null);

    const suggestions = mockDatabase.filter(item =>
        query.length > 1 &&
        item.name.toLowerCase().includes(query.toLowerCase()) &&
        item.name !== query.toUpperCase()
    ).slice(0, 5);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item) => {
        setQuery(item.name);
        const isClientOnlySegment = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';
        if (isClientOnlySegment) {
            updateVisit(segmentName, idx, 'classification', 'Cliente');
        }
        updateVisit(segmentName, idx, 'name', item.name);
        setShowSuggestions(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative group">
                <input
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value;
                        setQuery(val);
                        updateVisit(segmentName, idx, 'name', val);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => query.length > 1 && setShowSuggestions(true)}
                    className="input-cell !text-sm !py-2 bg-white uppercase font-bold pr-10 hover:border-blue-300 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="Escribe nombre o apellido..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-400 transition-colors">
                    <Search size={14} />
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[100] top-full mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                        Coincidencias encontradas
                    </div>
                    {suggestions.map((item, sIdx) => (
                        <button
                            key={sIdx}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                        >
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 uppercase">{item.name}</span>
                                <span className="text-[9px] font-medium text-slate-400">{item.city} | {item.classification}</span>
                            </div>
                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${item.classification === 'Cliente' ? 'bg-emerald-100 text-emerald-700' :
                                item.classification === 'Prospecto' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {item.classification}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const PhoneFields = ({ v, idx, segmentName, updateVisit }) => {
    const [showOthers, setShowOthers] = useState(false);
    const phones = v.phones || ['', '', ''];

    const updatePhone = (pIdx, val) => {
        handleNumericChange(val, (cleanVal) => {
            const newPhones = [...phones];
            newPhones[pIdx] = cleanVal;
            updateVisit(segmentName, idx, 'phones', newPhones);
        }, 10);
    };

    return (
        <div className="flex items-center gap-3 w-full">
            <div className="flex-1 max-w-[140px]">
                <input
                    value={phones[0] || ''}
                    onChange={e => updatePhone(0, e.target.value)}
                    placeholder="10 dígitos"
                    className="input-cell text-[10px] py-2"
                />
            </div>

            {!showOthers ? (
                <button
                    onClick={() => setShowOthers(true)}
                    className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all"
                >
                    <Plus size={12} /> Otro Tel
                </button>
            ) : (
                <div className="flex gap-2 animate-in slide-in-from-left-2 duration-200 items-center">
                    {[1, 2].map((pIdx) => (
                        <input
                            key={pIdx}
                            value={phones[pIdx] || ''}
                            onChange={e => updatePhone(pIdx, e.target.value)}
                            placeholder="10 dígitos"
                            className="input-cell text-[10px] py-2 w-24"
                        />
                    ))}
                    <button onClick={() => setShowOthers(false)} className="text-slate-300 hover:text-slate-500"><MoreHorizontal size={14} /></button>
                </div>
            )}
        </div>
    );
};

const DesktopRowFull = ({ v, idx, segmentName, updateVisit, removeRow, isTimeAvailable, mockDatabase }) => {
    const isClientOnlySegment = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';
    
    // ── Extraemos todos los catálogos del contexto ──
    const { 
        productos = [], 
        subproductos = [], 
        programas = [], 
        tiposIntegracion = [], 
        actividades = [], 
        clasificaciones = [], 
        herramientas = [],
        tiposGestion = []
    } = useCatalogs() || {};

    const renderSegmentDetails = () => {
        switch (segmentName) {
            case 'Promoción':
                return (
                    <div className="grid grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 mt-2 ml-14">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Producto</label>
                            <select
                                value={v.product || ''}
                                onChange={e => updateVisit(segmentName, idx, 'product', e.target.value)}
                                className={`input-cell uppercase ${!v.product ? 'text-slate-400' : 'text-primary'}`}
                            >
                                <option value="" disabled>Seleccionar producto...</option>
                                <optgroup label="Crédito">
                                    {productos.filter(p => p.categoria === 'Crédito').map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Ahorro">
                                    {productos.filter(p => p.categoria === 'Ahorro').map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Otro">
                                    {productos.filter(p => p.categoria !== 'Crédito' && p.categoria !== 'Ahorro').map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Dirección (Ciudad / Col / Calle)</label>
                            <div className="flex gap-1.5">
                                <input placeholder="Ciudad" value={v.city} onChange={e => updateVisit(segmentName, idx, 'city', e.target.value)} className="input-cell text-[10px]" />
                                <input placeholder="Colonia" value={v.colony} onChange={e => updateVisit(segmentName, idx, 'colony', e.target.value)} className="input-cell text-[10px]" />
                                <input placeholder="Calles" value={v.streets} onChange={e => updateVisit(segmentName, idx, 'streets', e.target.value)} className="input-cell text-[10px]" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Teléfonos</label>
                            <PhoneFields v={v} idx={idx} segmentName={segmentName} updateVisit={updateVisit} />
                        </div>
                    </div>
                );
            case 'Evaluación e Integración':
                return (
                    <div className="space-y-3 mt-2 ml-14">
                        <div className="grid grid-cols-5 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Integración</label>
                                <select value={v.typeIntegration || ''} onChange={e => updateVisit(segmentName, idx, 'typeIntegration', e.target.value)} className="input-cell uppercase text-[10px]">
                                    <option value="" disabled>Seleccionar...</option>
                                    {tiposIntegracion.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Monto Estimado</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={v.isFocusedAmount ? v.estimatedAmount : formatCurrency(v.estimatedAmount)}
                                        onFocus={() => updateVisit(segmentName, idx, 'isFocusedAmount', true)}
                                        onBlur={() => updateVisit(segmentName, idx, 'isFocusedAmount', false)}
                                        onChange={e => handleNumericChange(e.target.value, (val) => updateVisit(segmentName, idx, 'estimatedAmount', val))}
                                        placeholder="$ 0.00"
                                        className="input-cell font-bold text-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tasa Anual</label>
                                <div className="relative">
                                    <input
                                        value={v.annualRate}
                                        onChange={e => handlePercentageChange(e.target.value, (val) => updateVisit(segmentName, idx, 'annualRate', val))}
                                        placeholder="0.00"
                                        className="input-cell font-bold pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Subproducto</label>
                                <select value={v.subProduct || ''} onChange={e => updateVisit(segmentName, idx, 'subProduct', e.target.value)} className="input-cell uppercase text-[10px]">
                                    <option value="" disabled>Seleccionar...</option>
                                    {subproductos.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Programa</label>
                                <select value={v.program || ''} onChange={e => updateVisit(segmentName, idx, 'program', e.target.value)} className="input-cell uppercase text-[10px]" disabled={v.product === 'Captación'}>
                                    <option value="" disabled>Seleccionar...</option>
                                    {programas.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <div className="col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Dirección (Ciudad / Col / Calle)</label>
                                <div className="flex gap-1.5">
                                    <input placeholder="Ciudad" value={v.city} onChange={e => updateVisit(segmentName, idx, 'city', e.target.value)} className="input-cell text-[10px]" />
                                    <input placeholder="Colonia" value={v.colony} onChange={e => updateVisit(segmentName, idx, 'colony', e.target.value)} className="input-cell text-[10px]" />
                                    <input placeholder="Calles" value={v.streets} onChange={e => updateVisit(segmentName, idx, 'streets', e.target.value)} className="input-cell text-[10px]" />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Estatus Cartera (Sistema)</label>
                                <div className={`input-cell text-[10px] font-bold flex items-center h-[42px] px-4 ${v.portfolioStatus && v.portfolioStatus !== 'N/A' ? 'text-primary' : 'text-slate-400'}`}>
                                    {v.portfolioStatus || 'AUTOMÁTICO'}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Seguimiento de Cartera':
                return (
                    <div className="grid grid-cols-4 gap-x-3 gap-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-2 ml-14 shadow-sm">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">ID Crédito</label>
                            <div className="input-cell font-mono-tech flex items-center px-4 h-[42px] bg-white border-slate-100 text-primary">
                                {v.idCredito || 'S/N'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Estatus Cartera</label>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-black uppercase text-primary h-[42px] flex items-center px-4">
                                {v.ultimoEstatus || 'S/N'}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Mora (Inicio / Actual)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-accent">Inicio: {v.moraInicioMes || 0} días</div>
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-red-500">Actual: {v.moraActual || 0} días</div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Fechas (Último Pago / Venc.)</label>
                            <div className="flex gap-1">
                                <div className="flex-1 bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-bold flex flex-col justify-center items-center">
                                    <span className="text-[7px] text-slate-400">PAGO</span>
                                    {v.ultimaFechaPago || '-'}
                                </div>
                                <div className="flex-1 bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-bold flex flex-col justify-center items-center">
                                    <span className="text-[7px] text-slate-400">VENC.</span>
                                    {v.fechaVencimiento || '-'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Saldos (Inicio / Actual)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold">In: {formatCurrency(v.saldoInicioMes)}</div>
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-accent">Act: {formatCurrency(v.saldoActual)}</div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Categoría</label>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-black uppercase text-accent h-[42px] flex items-center px-4">
                                {v.categoriaGestion || 'PREVENTIVO'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Monto Amort.</label>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold h-[42px] flex items-center px-4">
                                {formatCurrency(v.montoAmortizacion)}
                            </div>
                        </div>

                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Monto p/Corriente</label>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-red-600 h-[42px] flex items-center px-4">
                                {formatCurrency(v.montoRequeridoCorriente)}
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Herramienta Aplicada</label>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold h-[42px] flex items-center px-4">
                                {v.herramientaAplicada || 'NINGUNA'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tipo de Gestión (Personal)</label>
                            <select
                                value={v.typeVisitManagement || ''}
                                onChange={e => updateVisit(segmentName, idx, 'typeVisitManagement', e.target.value)}
                                className="input-cell uppercase text-[10px] h-[42px]"
                            >
                                <option value="" disabled>Seleccionar tipo...</option>
                                {tiposGestion.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Herramienta para Aplicar</label>
                            <select
                                value={v.herramientaAplicar || ''}
                                onChange={e => updateVisit(segmentName, idx, 'herramientaAplicar', e.target.value)}
                                className="input-cell uppercase text-[10px] h-[42px]"
                            >
                                <option value="" disabled>Seleccionar...</option>
                                {herramientas.map(h => <option key={h.id} value={h.nombre}>{h.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'Gestión de Empresarias':
                return (
                    <div className="grid grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 mt-2 ml-14">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Información</label>
                            <div className="flex flex-col text-[10px] font-bold text-accent bg-white p-2 rounded-lg border border-slate-50">
                                <span>Ingreso: {v.fechaIngreso || '-'}</span>
                                <span>Mora Actual: {v.moraDays || 0}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Saldos</label>
                            <div className="flex flex-col text-[10px] font-bold text-accent bg-white p-2 rounded-lg border border-slate-50">
                                <span>Ocup: {formatCurrency(v.saldoOcupado)}</span>
                                <span className="text-emerald-600">Disp: {formatCurrency(v.saldoDisponible)}</span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tipo Gestión</label>
                            <select 
                                value={v.typeManagement || ''} 
                                onChange={e => updateVisit(segmentName, idx, 'typeManagement', e.target.value)} 
                                className="input-cell uppercase text-[10px]"
                            >
                                <option value="" disabled>Seleccionar tipo...</option>
                                {tiposGestion.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="group border-b border-slate-50 hover:bg-slate-50/30 p-4 transition-all">
            <div className="flex items-center gap-6">
                <div className="w-8 flex justify-center font-mono-tech text-[12px] text-accent">{idx + 1}</div>

                <div className="w-32">
                    <select
                        value={v.time}
                        onChange={e => updateVisit(segmentName, idx, 'time', e.target.value)}
                        className="input-cell !py-2 font-bold"
                    >
                        <option value="" disabled>Hora...</option>
                        {timeOptions.map(t => (
                            <option key={t} value={t} disabled={!isTimeAvailable(t, v.id)}>
                                {t} {!isTimeAvailable(t, v.id) ? ' (X)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-[2] min-w-0">
                    <ClientNameInput
                        value={v.name}
                        idx={idx}
                        segmentName={segmentName}
                        updateVisit={updateVisit}
                        mockDatabase={mockDatabase}
                    />
                </div>

                {!isClientOnlySegment && (
                    <div className="w-48">
                        <select 
                            value={v.classification || ''} 
                            onChange={e => updateVisit(segmentName, idx, 'classification', e.target.value)} 
                            className="input-cell !py-2 uppercase font-black tracking-widest text-[9px]"
                        >
                            <option value="" disabled>Clasificación...</option>
                            {clasificaciones.map(c => {
                                // Ocultar 'CLIENTE' si el segmento es 'Promoción'
                                if (segmentName === 'Promoción' && c.nombre.toUpperCase() === 'CLIENTE') return null;
                                return <option key={c.id} value={c.nombre}>{c.nombre}</option>;
                            })}
                        </select>
                    </div>
                )}

                {!isClientOnlySegment && (
                    <div className="flex-1 min-w-0">
                        {segmentName === 'Evaluación e Integración' ? (
                            <select
                                value={v.activity || ''}
                                onChange={e => updateVisit(segmentName, idx, 'activity', e.target.value)}
                                className="input-cell !py-2 uppercase text-[10px] font-black"
                            >
                                <option value="" disabled>Seleccionar actividad...</option>
                                {actividades.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                            </select>
                        ) : (
                            <input
                                value={v.activity}
                                onChange={e => updateVisit(segmentName, idx, 'activity', e.target.value)}
                                className="input-cell !py-2 bg-white"
                                placeholder="Objetivo principal de la visita..."
                            />
                        )}
                    </div>
                )}

                <div className="w-10">
                    <button
                        onClick={() => removeRow(segmentName, idx)}
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            {renderSegmentDetails()}
        </div>
    );
};

const SegmentSection = ({ title, visits, segmentName }) => {
    const { currentAgenda, updateVisit, addRow, removeRow, getVisibleSegments, mockDatabase } = useAgenda();
    const isClientOnlySegment = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';

    const isTimeAvailable = (time, currentVisitId) => {
        const allVisits = Object.entries(currentAgenda.segments)
            .filter(([name]) => getVisibleSegments().includes(name))
            .flatMap(([_, vArr]) => vArr.filter(v => v.time && v.id !== currentVisitId));

        const timeToMin = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const targetMin = timeToMin(time);

        for (const v of allVisits) {
            const vMin = timeToMin(v.time);
            if (v.time === time) return false;
            const isOnePromo = segmentName === 'Promoción' || currentAgenda.segments['Promoción'].some(p => p.id === v.id);
            if (isOnePromo && Math.abs(targetMin - vMin) < 30) return false;
        }
        return true;
    };

    return (
        <div className="mb-16">
            <div className="gradient-header shadow-lg relative z-10 !rounded-t-3xl">
                <h3 className="text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                    {title}
                </h3>
                <button
                    onClick={() => addRow(segmentName)}
                    className="flex items-center gap-2 text-[10px] font-black text-white hover:text-white uppercase tracking-widest bg-white/10 hover:bg-white/20 px-8 py-3 rounded-2xl transition-all border border-white/5 backdrop-blur-sm"
                >
                    <Plus size={18} /> Nueva Gestión
                </button>
            </div>

            <div className="bg-white rounded-b-3xl border-x border-b border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[100px]">
                <div className="hidden lg:block">
                    <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-3 flex items-center gap-6 text-[10px] font-black text-accent uppercase tracking-widest">
                        <div className="w-8 text-center">#</div>
                        <div className="w-32 pl-4">Horario</div>
                        <div className="flex-[2] pl-2">Información del Cliente</div>
                        {!isClientOnlySegment && <div className="w-48 pl-2">Clasificación</div>}
                        {!isClientOnlySegment && <div className="flex-1 pl-2">Actividad / Objetivo</div>}
                        <div className="w-10"></div>
                    </div>
                    {visits.length === 0 ? (
                        <div className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">Sin gestiones agregadas</div>
                    ) : (
                        visits.map((v, idx) => (
                            <DesktopRowFull
                                key={v.id}
                                v={v}
                                idx={idx}
                                segmentName={segmentName}
                                updateVisit={updateVisit}
                                removeRow={removeRow}
                                isTimeAvailable={isTimeAvailable}
                                mockDatabase={mockDatabase}
                            />
                        ))
                    )}
                </div>

                <div className="lg:hidden space-y-4 px-3 py-6">
                    {visits.map((v, idx) => (
                        <div key={v.id} className="glass-panel p-6 bg-white border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <span className="bg-slate-900 text-white w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono-tech">
                                    {idx + 1}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => removeRow(segmentName, idx)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                                    <select
                                        value={v.time}
                                        onChange={(e) => updateVisit(segmentName, idx, 'time', e.target.value)}
                                        className={`border-none rounded px-3 py-1.5 text-[11px] font-black uppercase tracking-widest outline-none ${v.time ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        <option value="" disabled>Hora...</option>
                                        {timeOptions.map(t => (
                                            <option key={t} value={t} disabled={!isTimeAvailable(t, v.id)} className="bg-white text-primary">{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-accent uppercase tracking-widest mb-1.5 block">Nombre del Cliente</label>
                                    <input value={v.name} onChange={e => updateVisit(segmentName, idx, 'name', e.target.value)} className="input-cell !text-xs !py-3 uppercase font-bold" placeholder="Ingresar nombre..." />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PlaneacionOperativo = () => {
    const { currentAgenda, sendForAuthorization, resetAgenda, getVisibleSegments } = useAgenda();
    const visibleSegments = getVisibleSegments();

    if (currentAgenda.status === 'pendiente' || currentAgenda.status === 'aprobada') {
        return (
            <div className="max-w-2xl mx-auto animate-in zoom-in duration-300 py-10">
                <div className="glass-panel p-10 text-center bg-white shadow-2xl rounded-[32px] border-2 border-slate-50">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 shadow-inner ${currentAgenda.status === 'aprobada' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {currentAgenda.status === 'aprobada' ? <CheckCircle2 size={40} /> : <Clock size={40} />}
                    </div>
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Agenda Protegida</h2>
                    <p className="text-accent text-[11px] font-black uppercase tracking-[0.2em] mt-3">{currentAgenda.status === 'pendiente' ? 'Esperando validación de tu jefe' : 'Jornada autorizada para iniciar'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-40 px-4 md:px-8">
            <header className="mb-12 pt-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black text-primary tracking-tighter leading-none">PLANEACIÓN</h2>
                    <p className="text-accent text-[11px] font-black uppercase tracking-[0.4em] mt-4">Ruta de Trabajo Diaria</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">
                    <Calendar size={16} className="text-blue-400" />
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </header>

            {visibleSegments.map(name => (
                <SegmentSection key={name} title={name.toUpperCase()} visits={currentAgenda.segments[name]} segmentName={name} />
            ))}

            {/* Segment E: Compromisos KPI Diario */}
            <KpiCompromisos />

            <footer className="fixed bottom-0 left-0 right-0 md:relative md:mt-20 z-40">
                <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-200 p-6 md:p-12 md:bg-slate-900 md:text-white md:rounded-[40px] md:border-none shadow-[0_-20px_50px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <button onClick={resetAgenda} className="flex items-center gap-3 text-red-500 md:text-red-400 font-black text-[11px] uppercase tracking-widest hover:bg-red-50 md:hover:bg-red-500/10 px-8 py-5 rounded-2xl transition-all w-full md:w-auto justify-center">
                        <RotateCcw size={20} /> Borrar Prototipo
                    </button>
                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                        <p className="hidden md:block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Certifica tu agenda para avisar al supervisor</p>
                        <button onClick={sendForAuthorization} className="w-full md:w-auto bg-primary md:bg-white md:text-primary text-white px-20 py-6 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                            Certificar Jornada
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PlaneacionOperativo;