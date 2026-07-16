import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Plus, MapPin, Search, Navigation, Calendar, Clock, Trash2, Phone, MoreHorizontal, User, Tag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAgenda } from '../../context/AgendaContext';
import { useCatalogs } from '../../context/CatalogContext';
import { useRole } from '../../context/RoleContext';
import KpiCompromisos from './KpiCompromisos';
import UIModal from '../../components/UIModal';

// --- CONFIGURACIÓN INICIAL ---
const timeOptions = [];
for (let hour = 8; hour <= 20; hour++) {
    for (let min of ['00', '15', '30', '45']) {
        if (hour === 20 && min !== '00') break;
        const h = hour.toString().padStart(2, '0');
        timeOptions.push(`${h}:${min}`);
    }
}

// --- JON SNOW / TRUCO DE INTEGRIDAD PARA REVERTIR MODIFICACIONES ---
const getCleanDataSnapshot = (agenda) => {
    if (!agenda || !agenda.segments) return '';
    const cleanSegments = {};
    Object.keys(agenda.segments).forEach(seg => {
        cleanSegments[seg] = (agenda.segments[seg] || []).map(v => {
            const { isModified, isNew, isFocusedAmount, ...rest } = v;
            return rest;
        });
    });
    return JSON.stringify({
        segments: cleanSegments,
        kpis: agenda.kpiCompromisos || {}
    });
};

// --- FUNCIONES AUXILIARES BLINDADAS ---
const handleNumericChange = (e, callback, limit = null) => {
    let cleanValue = String(e.target.value).replace(/\D/g, '');
    if (limit && cleanValue.length > limit) {
        cleanValue = cleanValue.slice(0, limit);
    }
    e.target.value = cleanValue;
    callback(cleanValue === '' ? '' : Number(cleanValue));
};

const formatCurrency = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
};

const handlePercentageChange = (e, callback) => {
    let clean = String(e.target.value).replace(/[^\d.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
    let integerPart = parts[0] || '';
    let decimalPart = parts[1] || '';
    if (integerPart.length > 2) integerPart = integerPart.slice(0, 2);
    if (decimalPart.length > 2) decimalPart = decimalPart.slice(0, 2);
    const finalValue = parts.length > 1 ? `${integerPart}.${decimalPart}` : integerPart;

    e.target.value = finalValue;
    callback(finalValue === '' ? '' : Number(finalValue));
};

// --- COMPONENTES SECUNDARIOS ---

const ClientNameInput = ({ id, value, idx, segmentName, updateVisit, mockDatabase, disabled }) => {
    const [query, setQuery] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null);

    const getAllowedClassifications = () => {
        switch (segmentName) {
            case 'Promoción': return ['CONTACTO', 'PROSPECTO'];
            case 'Evaluación e Integración': return ['CONTACTO', 'PROSPECTO', 'CLIENTE'];
            case 'Seguimiento de Cartera':
            case 'Gestión de Empresarias': return ['CLIENTE'];
            default: return [];
        }
    };

    const allowedClassifications = getAllowedClassifications();

    const validItems = mockDatabase.filter(item => {
        const itemClass = item.classification ? item.classification.toUpperCase() : '';
        return allowedClassifications.includes(itemClass);
    });

    const suggestions = validItems.filter(item =>
        query.length > 1 &&
        item.name.toLowerCase().includes(query.toLowerCase()) &&
        item.name !== query.toUpperCase()
    ).slice(0, 5);

    useEffect(() => { setQuery(value || ''); }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item) => {
        setQuery(item.name);
        const isClientOnlySegment = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';
        const finalClassification = isClientOnlySegment ? 'CLIENTE' : (item.classification ? item.classification.toUpperCase() : '');

        let arrayPhones = ["", "", ""];
        if (item.phones) {
            try { arrayPhones = typeof item.phones === 'string' ? JSON.parse(item.phones) : item.phones; }
            catch (e) { console.error("Error parseando teléfonos", e); }
        }
        while(arrayPhones.length < 3) arrayPhones.push('');

        updateVisit(segmentName, idx, {
            idContacto: item.idContacto, idCliente: item.idCliente, idControl: item.idControl,
            name: item.name, classification: finalClassification, city: item.city, colony: item.colony, streets: item.streets,
            phones: arrayPhones, product: item.product, idCredito: item.idCredito, estimatedAmount: item.estimatedAmount,
            annualRate: item.annualRate, subProduct: item.subProduct, program: item.program, moraInicioMes: item.moraInicioMes,
            moraActual: item.moraActual, moraDays: item.moraDays, saldoInicioMes: item.saldoInicioMes, saldoActual: item.saldoActual,
            portfolioStatus: item.portfolioStatus, ultimoEstatus: item.ultimoEstatus, fechaIngreso: item.fechaIngreso,
            saldoOcupado: item.saldoOcupado, saldoDisponible: item.saldoDisponible, ultimaFechaPago: item.ultimaFechaPago,
            fechaVencimiento: item.fechaVencimiento, montoAmortizacion: item.montoAmortizacion,
            montoRequeridoCorriente: item.montoRequeridoCorriente, herramientaAplicada: item.herramientaAplicada,
            categoriaGestion: item.categoriaGestion
        });
        setShowSuggestions(false);
    };

    const handleBlur = () => {
        setTimeout(() => {
            const exactMatch = validItems.find(item => item.name.toUpperCase() === query.trim().toUpperCase());
            if (!exactMatch && query.trim() !== '') {
                setQuery('');
                updateVisit(segmentName, idx, 'name', '');
            }
        }, 150);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative group">
                <input
                    id={id}
                    value={query}
                    disabled={disabled}
                    onChange={(e) => {
                        const val = e.target.value;
                        setQuery(val);
                        updateVisit(segmentName, idx, 'name', val);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => query.length > 1 && !disabled && setShowSuggestions(true)}
                    onBlur={handleBlur}
                    className="input-cell !bg-white disabled:!bg-slate-50 disabled:!text-slate-400 disabled:cursor-not-allowed !text-[10px] h-[38px] w-full uppercase font-bold pr-10 hover:border-blue-300 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="Escribe nombre o apellido..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-400 transition-colors">
                    <Search size={14} />
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && !disabled && (
                <div className="absolute z-[100] top-full mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Coincidencias para {segmentName}</div>
                    {suggestions.map((item, sIdx) => (
                        <button key={sIdx} onMouseDown={() => handleSelect(item)} className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between group">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 uppercase">{item.name}</span>
                                <span className="text-[9px] font-medium text-slate-400 uppercase">{item.city} | {item.classification}</span>
                            </div>
                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${item.classification === 'Cliente' ? 'bg-emerald-100 text-emerald-700' : item.classification === 'Prospecto' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{item.classification}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const PhoneFields = ({ v, idx, segmentName, updateVisit, disabled }) => {
    const [extraCount, setExtraCount] = useState(0);
    const phones = v.phones || ['', '', ''];

    useEffect(() => {
        if (phones[2] && phones[2] !== '') setExtraCount(2);
        else if (phones[1] && phones[1] !== '') setExtraCount(1);
    }, [phones]);

    const updatePhone = (pIdx, e) => {
        handleNumericChange(e, (cleanVal) => {
            const newPhones = [...phones];
            newPhones[pIdx] = cleanVal;
            updateVisit(segmentName, idx, 'phones', newPhones);
        }, 10);
    };

    const phoneInputClass = "input-cell !bg-white disabled:!bg-slate-50 disabled:!text-slate-400 disabled:!shadow-inner disabled:cursor-not-allowed text-[10px] h-[38px] w-full font-bold";

    return (
        <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex-1 min-w-[120px] max-w-full sm:max-w-[140px]">
                <input value={phones[0] ?? ''} disabled={disabled} onChange={e => updatePhone(0, e)} placeholder="10 dígitos" className={phoneInputClass} />
            </div>
            {extraCount > 0 && (
                <div className="flex-1 min-w-[120px] max-w-full sm:max-w-[140px] animate-in slide-in-from-left-2 duration-200">
                    <input value={phones[1] ?? ''} disabled={disabled} onChange={e => updatePhone(1, e)} placeholder="10 dígitos" className={phoneInputClass} />
                </div>
            )}
            {extraCount > 1 && (
                <div className="flex-1 min-w-[120px] max-w-full sm:max-w-[140px] animate-in slide-in-from-left-2 duration-200">
                    <input value={phones[2] ?? ''} disabled={disabled} onChange={e => updatePhone(2, e)} placeholder="10 dígitos" className={phoneInputClass} />
                </div>
            )}
            {extraCount < 2 && (
                <button onClick={() => setExtraCount(prev => prev + 1)} disabled={disabled} className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest transition-all shrink-0"><Plus size={12} /> Otro Tel</button>
            )}
            {extraCount > 0 && (
                <button onClick={() => setExtraCount(0)} disabled={disabled} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 flex justify-center mt-2 sm:mt-0 shrink-0"><MoreHorizontal size={14} /></button>
            )}
        </div>
    );
};

const DesktopRowFull = ({ v, idx, segmentName, updateVisit, removeRow, isTimeAvailable, mockDatabase, isCobranza, disabled }) => {
    const isClientOnlySegment = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';

    const { productos = [], subproductos = [], estatusCartera = [], programas = [], tiposIntegracion = [], actividades = [], clasificaciones = [], herramientas = [], tiposGestion = [] } = useCatalogs() || {};

    const labelClass = "text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1";
    const boxClass = "input-cell h-[38px] w-full uppercase text-[10px] font-bold !bg-white disabled:!bg-slate-50 disabled:!text-slate-400 disabled:!shadow-inner disabled:!border-slate-200 disabled:cursor-not-allowed transition-all";
    const readOnlyBoxClass = "!bg-slate-50 border border-slate-200 rounded-md h-[38px] w-full flex items-center px-3 text-[10px] font-black text-slate-500 shadow-inner uppercase cursor-not-allowed";
    const readOnlyFlexClass = "!bg-slate-50 border border-slate-200 rounded-md h-[38px] flex-1 flex items-center justify-between px-3 text-[10px] font-bold text-slate-500 shadow-inner uppercase cursor-not-allowed";

    const renderSegmentDetails = () => {
        switch (segmentName) {
            case 'Promoción':
                if (isCobranza) return null;
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 border-t border-slate-100 mt-0">
                        <div className="col-span-1 lg:col-span-2">
                            <label className={labelClass}>Producto</label>
                            <select value={v.product || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'product', e.target.value)} className={`${boxClass} ${!v.product ? 'text-slate-400' : 'text-primary'}`}>
                                <option value="" disabled>SELECCIONAR PRODUCTO...</option>
                                <optgroup label="CRÉDITO">{productos.filter(p => p.categoria === 'CRËDITO').map((p, i) => <option key={`p-c-${p.id || i}`} value={p.nombre}>{p.nombre}</option>)}</optgroup>
                                <optgroup label="AHORRO">{productos.filter(p => p.categoria === 'AHORRO').map((p, i) => <option key={`p-a-${p.id || i}`} value={p.nombre}>{p.nombre}</option>)}</optgroup>
                                <optgroup label="OTRO">{productos.filter(p => p.categoria !== 'CRËDITO' && p.categoria !== 'AHORRO').map((p, i) => <option key={`p-o-${p.id || i}`} value={p.nombre}>{p.nombre}</option>)}</optgroup>
                            </select>
                        </div>
                        <div className="col-span-1 lg:col-span-2">
                            <label className={labelClass}>Teléfonos</label>
                            <div className="flex items-center h-[38px]">
                                <PhoneFields v={v} idx={idx} segmentName={segmentName} updateVisit={updateVisit} disabled={disabled} />
                            </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                            <label className={labelClass}>Dirección (Ciudad / Col / Calle)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input placeholder="CIUDAD" value={v.city ?? ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'city', e.target.value)} className={boxClass} />
                                <input placeholder="COLONIA" value={v.colony ?? ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'colony', e.target.value)} className={boxClass} />
                                <input placeholder="CALLES" value={v.streets ?? ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'streets', e.target.value)} className={boxClass} />
                            </div>
                        </div>
                    </div>
                );
            case 'Evaluación e Integración': {
                const opcionesIntegracion = isCobranza ? tiposIntegracion.filter(t => t.nombre.toUpperCase() === 'TRATAMIENTO' || t.nombre.toUpperCase() === 'CONVENIO') : tiposIntegracion;
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 border-t border-slate-100 mt-0">
                        <div className="col-span-1">
                            <label className={labelClass}>Integración</label>
                            <select value={v.typeIntegration || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'typeIntegration', e.target.value)} className={boxClass}>
                                <option value="" disabled>SELECCIONAR...</option>
                                {opcionesIntegracion.map((t, i) => <option key={`int-${t.id || i}`} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Monto Estimado</label>
                            <input type="text" value={v.isFocusedAmount ? (v.estimatedAmount ?? '') : formatCurrency(v.estimatedAmount)} disabled={disabled} onFocus={() => !disabled && updateVisit(segmentName, idx, 'isFocusedAmount', true)} onBlur={() => !disabled && updateVisit(segmentName, idx, 'isFocusedAmount', false)} onChange={e => handleNumericChange(e, (val) => updateVisit(segmentName, idx, 'estimatedAmount', val))} placeholder="$ 0.00" className={`${boxClass} text-primary`} />
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Tasa Anual</label>
                            <div className="relative">
                                <input value={v.annualRate ?? ''} disabled={disabled} onChange={e => handlePercentageChange(e, (val) => updateVisit(segmentName, idx, 'annualRate', val))} placeholder="0.00" className={`${boxClass} pr-8`} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">%</span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Subproducto</label>
                            {isCobranza ? (
                                <div className={readOnlyBoxClass}>NINGUNO</div>
                            ) : (
                                <select value={v.subProduct || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'subProduct', e.target.value)} className={boxClass}>
                                    <option value="" disabled>SELECCIONAR...</option>
                                    {subproductos.map((s, i) => <option key={`sub-${s.id || i}`} value={s.nombre}>{s.nombre}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Programa</label>
                            {isCobranza ? (
                                <div className={readOnlyBoxClass}>NINGUNO</div>
                            ) : (
                                <select value={v.program || ''} onChange={e => updateVisit(segmentName, idx, 'program', e.target.value)} className={boxClass} disabled={disabled || String(v.product).toUpperCase() === 'CAPTACIÓN'}>
                                    <option value="" disabled>SELECCIONAR...</option>
                                    {programas.map((p, i) => <option key={`pr-${p.id || i}`} value={p.nombre}>{p.nombre}</option>)}
                                </select>
                            )}
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Estatus Cartera (Sistema)</label>
                            <div className={`${readOnlyBoxClass} text-primary`}>{v.portfolioStatus || 'AUTOMÁTICO'}</div>
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                            <label className={labelClass}>Dirección (Ciudad / Col / Calle)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input placeholder="CIUDAD" value={v.city ?? ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'city', e.target.value)} className={boxClass} />
                                <input placeholder="COLONIA" value={v.colony ?? ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'colony', e.target.value)} className={boxClass} />
                                <input placeholder="CALLES" value={v.streets ?? ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'streets', e.target.value)} className={boxClass} />
                            </div>
                        </div>
                    </div>
                );
            }
            case 'Seguimiento de Cartera': {
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 border-t border-slate-100 mt-0">
                        <div className="col-span-1">
                            <label className={labelClass}>ID Crédito</label>
                            <div className={`${readOnlyBoxClass} font-mono-tech`}>{v.idCredito || 'S/N'}</div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Estatus Cartera</label>
                            {isCobranza ? (
                                <select value={v.ultimoEstatus || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'ultimoEstatus', e.target.value)} className={boxClass}>
                                    <option value="" disabled>SELECCIONAR ESTATUS...</option>
                                    {estatusCartera.map((es, i) => <option key={`ec-${es.id || i}`} value={es.nombre}>{es.nombre}</option>)}
                                </select>
                            ) : (
                                <div className={readOnlyBoxClass}>{v.ultimoEstatus || 'S/N'}</div>
                            )}
                        </div>
                        
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Días de Mora (Inicio / Actual)</label>
                            <div className="flex gap-2">
                                <div className={`${readOnlyFlexClass} !justify-start truncate`}>IN: {v.moraInicioMes ?? '-'}</div>
                                <div className={`${readOnlyFlexClass} !justify-start truncate !text-red-500`}>ACT: {v.moraActual ?? '-'}</div>
                            </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Fechas (Último Pago / Venc.)</label>
                            <div className="flex gap-2">
                                <div className={readOnlyFlexClass}><span className="text-slate-400 text-[8px] uppercase">PAGO</span> <span>{v.ultimaFechaPago || '-'}</span></div>
                                <div className={readOnlyFlexClass}><span className="text-slate-400 text-[8px] uppercase">VENC.</span> <span>{v.fechaVencimiento || '-'}</span></div>
                            </div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Saldos (Inicio / Actual)</label>
                            <div className="flex gap-2">
                                <div className={`${readOnlyFlexClass} !justify-start truncate`}>IN: {formatCurrency(v.saldoInicioMes)}</div>
                                <div className={`${readOnlyFlexClass} !justify-start truncate !text-accent`}>ACT: {formatCurrency(v.saldoActual)}</div>
                            </div>
                        </div>

                        <div className="col-span-1">
                            <label className={labelClass}>Bucket de Mora</label>
                            <div className={readOnlyBoxClass}>{v.categoriaGestion || 'S/N'}</div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Monto Amort.</label>
                            <div className={`${readOnlyBoxClass} truncate`}>{formatCurrency(v.montoAmortizacion)}</div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Monto p/Corriente</label>
                            <div className={`${readOnlyBoxClass} !text-red-500 truncate`}>{formatCurrency(v.montoRequeridoCorriente)}</div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Herr. Aplicada (Histórico)</label>
                            <div className={`${readOnlyBoxClass} truncate`}>{v.herramientaAplicada || 'NINGUNA'}</div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Tipo de Gestión (Personal)</label>
                            <select value={v.typeVisitManagement || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'typeVisitManagement', e.target.value)} className={boxClass}>
                                <option value="" disabled>SELECCIONAR TIPO DE GESTIÓN...</option>
                                {tiposGestion.map((t, i) => <option key={`tg-${t.id || i}`} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Herramienta para Aplicar</label>
                            <select value={v.herramientaAplicar || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'herramientaAplicar', e.target.value)} className={boxClass}>
                                <option value="" disabled>SELECCIONAR...</option>
                                {herramientas.map((h, i) => <option key={`ha-${h.id || i}`} value={h.nombre}>{h.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                );
            }
            case 'Gestión de Empresarias':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 border-t border-slate-100 mt-0">
                        <div className="col-span-1">
                            <label className={labelClass}>Información Interna</label>
                            <div className="flex flex-col justify-center bg-slate-50 border border-slate-200 rounded-md px-3 h-[38px] text-[10px] font-bold text-slate-500 shadow-inner cursor-not-allowed leading-tight uppercase">
                                <span>INGRESO: {v.fechaIngreso || '-'}</span>
                                <span>MORA ACTUAL: {v.moraDays || 0}</span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Saldos</label>
                            <div className="flex flex-col justify-center bg-slate-50 border border-slate-200 rounded-md px-3 h-[38px] text-[10px] font-bold text-slate-500 shadow-inner cursor-not-allowed leading-tight uppercase">
                                <span>OCUP: {formatCurrency(v.saldoOcupado)}</span>
                                <span className="text-emerald-600">DISP: {formatCurrency(v.saldoDisponible)}</span>
                            </div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>Tipo Gestión</label>
                            <select value={v.typeManagement || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'typeManagement', e.target.value)} className={boxClass}>
                                <option value="" disabled>SELECCIONAR TIPO DE GESTIÓN...</option>
                                {tiposGestion.map((t, i) => <option key={`tge-${t.id || i}`} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="group border-b border-slate-100 bg-white hover:bg-slate-50/30 transition-all mb-0 p-4 lg:p-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 lg:px-4 lg:py-3 lg:border-b lg:border-slate-50">
                <div className="flex items-center justify-between lg:w-auto lg:justify-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:h-auto bg-slate-900 lg:bg-transparent text-white lg:text-accent rounded flex items-center justify-center font-mono-tech text-[12px]">{idx + 1}</div>
                        <div className="w-32">
                            <select id={`time-${segmentName}-${idx}`} value={v.time} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'time', e.target.value)} className={`${boxClass} text-center`}>
                                <option value="" disabled>HORA...</option>
                                {timeOptions.map((t, i) => <option key={`time-${i}`} value={t} disabled={!isTimeAvailable(t, v.id)}>{t} {!isTimeAvailable(t, v.id) ? ' (X)' : ''}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={() => removeRow(segmentName, idx)} disabled={disabled} className="lg:hidden p-2 text-rose-400 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"><Trash2 size={16} /></button>
                </div>

                <div className="flex-1 w-full min-w-0">
                    <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Nombre del Cliente</label>
                    <ClientNameInput id={`name-${segmentName}-${idx}`} value={v.name ?? ''} idx={idx} segmentName={segmentName} updateVisit={updateVisit} mockDatabase={mockDatabase} disabled={disabled} />
                </div>

                {!isClientOnlySegment && (
                    <div className="w-full lg:w-48">
                        <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Clasificación</label>
                        <select id={`class-${segmentName}-${idx}`} value={v.classification || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'classification', e.target.value)} className={boxClass}>
                            <option value="" disabled>CLASIFICACIÓN...</option>
                            {clasificaciones.filter(c => {
                                const nc = c.nombre.toUpperCase();
                                if (segmentName === 'Promoción') return nc === 'CONTACTO' || nc === 'PROSPECTO';
                                if (segmentName === 'Evaluación e Integración') return nc === 'CONTACTO' || nc === 'PROSPECTO' || nc === 'CLIENTE';
                                return true;
                            }).map((c, i) => {
                                const nc = c.nombre.toUpperCase();
                                const orig = mockDatabase.find(item => item.name.toUpperCase() === v.name?.toUpperCase())?.classification?.toUpperCase();
                                const disabledOption = nc === 'CONTACTO' && (orig === 'PROSPECTO' || orig === 'CLIENTE');
                                return <option key={`cl-${c.id || i}`} value={c.nombre} disabled={disabledOption}>{c.nombre} {disabledOption ? '🔒' : ''}</option>;
                            })}
                        </select>
                    </div>
                )}

                {!isClientOnlySegment && (
                    <div className="w-full lg:flex-1 min-w-0">
                        <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Actividad / Objetivo</label>
                        {segmentName === 'Evaluación e Integración' ? (
                            <select id={`act-${segmentName}-${idx}`} value={v.activity || ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'activity', e.target.value)} className={boxClass}>
                                <option value="" disabled>OBJETIVO...</option>
                                {actividades.map((a, i) => <option key={`act-${a.id || i}`} value={a.nombre}>{a.nombre}</option>)}
                            </select>
                        ) : (
                            <input id={`act-${segmentName}-${idx}`} value={v.activity ?? ''} disabled={disabled} onChange={e => updateVisit(segmentName, idx, 'activity', e.target.value)} className={boxClass} placeholder="OBJETIVO DE LA VISITA..." />
                        )}
                    </div>
                )}

                <div className="hidden lg:flex w-10 justify-end">
                    <button onClick={() => removeRow(segmentName, idx)} disabled={disabled} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"><Trash2 size={16} /></button>
                </div>
            </div>
            {renderSegmentDetails()}
        </div>
    );
};

const SegmentSection = ({ title, visits, segmentName, isCobranza, disabled }) => {
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
                    disabled={disabled}
                    className="flex items-center gap-2 text-[10px] font-black text-white hover:text-white uppercase tracking-widest bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed px-8 py-3 rounded-2xl transition-all border border-white/5 backdrop-blur-sm"
                >
                    <Plus size={18} /> Nueva Gestión
                </button>
            </div>

            <div className="bg-white rounded-b-3xl border-x border-b border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden p-0">
                <div className="hidden lg:flex bg-slate-50/80 border-b border-slate-100 px-4 py-3 items-center gap-4 lg:gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-3">
                        <div className="w-8 text-center">#</div>
                        <div className="w-32 text-center">Horario</div>
                    </div>
                    <div className="flex-1 min-w-0 pl-1">Información del Cliente</div>
                    {!isClientOnlySegment && <div className="w-48 pl-1">Clasificación</div>}
                    {!isClientOnlySegment && <div className="flex-1 min-w-0 pl-1">Actividad / Objetivo</div>}
                    <div className="w-10"></div>
                </div>

                {visits.length === 0 ? (
                    <div className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">Sin gestiones agregadas</div>
                ) : (
                    <div className="flex flex-col">
                        {visits.map((v, idx) => (
                            <DesktopRowFull
                                key={v.id}
                                v={v}
                                idx={idx}
                                segmentName={segmentName}
                                updateVisit={updateVisit}
                                removeRow={removeRow}
                                isTimeAvailable={isTimeAvailable}
                                mockDatabase={mockDatabase}
                                isCobranza={isCobranza}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const PlaneacionOperativo = () => {
    const { currentAgenda, sendForAuthorization, resetAgenda, getVisibleSegments, kpiConfig } = useAgenda();
    const { selectedRole } = useRole();
    const isCobranza = selectedRole?.canal?.toUpperCase() === 'COBRANZA';
    const visibleSegments = getVisibleSegments().filter(name => !(isCobranza && name === 'Promoción'));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showClearModal, setShowClearModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [validationModal, setValidationModal] = useState({ isOpen: false, message: '', focusId: null, type: 'warning', title: 'DATOS INCOMPLETOS' });

    const initialDataRef = useRef(null);
    const prevIdRef = useRef(currentAgenda.id);
    const prevStatusRef = useRef(currentAgenda.status);

    useEffect(() => {
        const currentDataStr = getCleanDataSnapshot(currentAgenda);
        if (
            initialDataRef.current === null ||
            prevIdRef.current !== currentAgenda.id ||
            prevStatusRef.current !== currentAgenda.status
        ) {
            initialDataRef.current = currentDataStr;
            prevIdRef.current = currentAgenda.id;
            prevStatusRef.current = currentAgenda.status;
            setIsDirty(false);
        } else {
            setIsDirty(currentDataStr !== initialDataRef.current);
        }
    }, [currentAgenda.segments, currentAgenda.kpiCompromisos, currentAgenda.id, currentAgenda.status]);

    const handleLimpiarFormulario = () => {
        resetAgenda();
        setShowClearModal(false);
    };

    const handleCertificar = () => {
        if (isSubmitting) return;

        for (const segmentName of visibleSegments) {
            const visits = currentAgenda.segments[segmentName] || [];
            for (let i = 0; i < visits.length; i++) {
                const v = visits[i];
                if (!v.time) {
                    setValidationModal({ isOpen: true, title: 'DATOS INCOMPLETOS', type: 'warning', message: `POR FAVOR SELECCIONA LA HORA EN EL BLOQUE ${segmentName.toUpperCase()}, FILA ${i + 1}.`, focusId: `time-${segmentName}-${i}` });
                    return; 
                }
                if (!v.name || v.name.trim() === '') {
                    setValidationModal({ isOpen: true, title: 'DATOS INCOMPLETOS', type: 'warning', message: `EL NOMBRE DEL CLIENTE NO PUEDE IR VACÍO EN EL BLOQUE ${segmentName.toUpperCase()}, FILA ${i + 1}.`, focusId: `name-${segmentName}-${i}` });
                    return;
                }

                const isClientOnly = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';
                if (!isClientOnly) {
                    if (!v.classification) {
                        setValidationModal({ isOpen: true, title: 'DATOS INCOMPLETOS', type: 'warning', message: `POR FAVOR SELECCIONA UNA CLASIFICACIÓN EN EL BLOQUE ${segmentName.toUpperCase()}, FILA ${i + 1}.`, focusId: `class-${segmentName}-${i}` });
                        return;
                    }
                    if (!v.activity || v.activity.trim() === '') {
                        setValidationModal({ isOpen: true, title: 'DATOS INCOMPLETOS', type: 'warning', message: `LA ACTIVIDAD/OBJETIVO NO PUEDE IR VACÍA EN EL BLOQUE ${segmentName.toUpperCase()}, FILA ${i + 1}.`, focusId: `act-${segmentName}-${i}` });
                        return;
                    }
                }
            }
        }

        const slotsOcupados = new Map();
        for (const segmentName of visibleSegments) {
            const visits = currentAgenda.segments[segmentName] || [];
            for (let i = 0; i < visits.length; i++) {
                const v = visits[i];
                if (!v.time) continue;
                if (slotsOcupados.has(v.time)) {
                    const ya = slotsOcupados.get(v.time);
                    setValidationModal({
                        isOpen: true,
                        type: 'danger',
                        title: 'EMPALME DE HORARIOS DETECTADO',
                        message: `NO PUEDES REGISTRAR DOS VISITAS EN EL MISMO HORARIO (${v.time}). REVISA "${ya.segmentName.toUpperCase()}" FILA ${ya.idx + 1} Y "${segmentName.toUpperCase()}" FILA ${i + 1}.`,
                        focusId: `time-${segmentName}-${i}`
                    });
                    return;
                }
                slotsOcupados.set(v.time, { segmentName, idx: i });
            }
        }

        const kpis = currentAgenda.kpiCompromisos || {};
        if (kpiConfig) {
            for (const group of kpiConfig) {
                for (const field of group.fields) {
                    const val = kpis[field.key];
                    if (!val || val.toString().trim() === '') {
                        setValidationModal({ isOpen: true, title: 'DATOS INCOMPLETOS', type: 'warning', message: `EL CAMPO "${field.label.toUpperCase()}" EN LA SECCIÓN DE KPIs ES OBLIGATORIO.`, focusId: `kpi-${field.key}` });
                        return;
                    }
                }
            }
        }

        setIsSubmitting(true);

        sendForAuthorization()
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    const statusActual = String(currentAgenda?.status || 'borrador').toLowerCase().trim();
    const protectedStatuses = ['pendiente', 'aprobada', 'ejecutada', 'ejecutado', 'completada', 'completado'];

    if (protectedStatuses.includes(statusActual)) {
        let icon, colorClass, message, titleMain;

        if (statusActual.includes('ejecutad') || statusActual.includes('completad')) {
            icon = <CheckCircle2 size={40} />;
            colorClass = 'bg-slate-100 text-slate-600';
            titleMain = 'JORNADA FINALIZADA';
            message = 'TU AGENDA HA SIDO EJECUTADA Y BLOQUEADA';
        } else if (statusActual === 'aprobada') {
            icon = <CheckCircle2 size={40} />;
            colorClass = 'bg-emerald-50 text-emerald-600';
            titleMain = 'AGENDA VALIDADA EXITOSAMENTE';
            message = 'JORNADA AUTORIZADA PARA INICIAR';
        } else {
            icon = <Clock size={40} />;
            colorClass = 'bg-blue-50 text-blue-600';
            titleMain = 'AGENDA CAPTURADA EXITOSAMENTE';
            message = 'ESPERANDO VALIDACIÓN DE TU JEFE';
        }

        return (
            <div className="max-w-2xl mx-auto animate-in zoom-in duration-300 py-10">
                <div className="glass-panel p-10 text-center bg-white shadow-2xl rounded-[32px] border-2 border-slate-50">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 shadow-inner ${colorClass}`}>
                        {icon}
                    </div>
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tight">{titleMain.toUpperCase()}</h2>
                    <p className="text-accent text-[11px] font-black uppercase tracking-[0.2em] mt-3">
                        {message.toUpperCase()}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-40 px-4 md:px-8">
            {statusActual === 'requiere_modificacion' && (
                <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm animate-in slide-in-from-top-2">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-red-100 mt-1 flex-shrink-0">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[12px] font-black text-red-700 uppercase tracking-widest mb-1">
                            Tu supervisor ha solicitado modificaciones a tu agenda
                        </h4>
                        <div className="bg-white/60 p-3 rounded-lg border border-red-100 mt-2">
                            <p className="text-[13px] font-bold text-red-800 italic">
                                "{currentAgenda.notaJefe || 'Revisa y ajusta los detalles de tu jornada.'}"
                            </p>
                        </div>
                    </div>
                </div>
            )}
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
                <SegmentSection key={name} title={name.toUpperCase()} visits={currentAgenda.segments[name]} segmentName={name} isCobranza={isCobranza} disabled={isSubmitting} />
            ))}

            <KpiCompromisos disabled={isSubmitting} />

            <footer className="fixed bottom-0 left-0 right-0 md:relative md:mt-20 z-40">
                <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-200 p-6 md:p-12 md:bg-slate-900 md:text-white md:rounded-[40px] md:border-none shadow-[0_-20px_50px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <button
                        onClick={() => setShowClearModal(true)}
                        disabled={isSubmitting}
                        className={`flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-2xl transition-all w-full md:w-auto justify-center
                            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:text-rose-500 hover:bg-rose-50 md:hover:bg-rose-500/10'}`}
                    >
                        <RotateCcw size={16} /> Limpiar Formulario
                    </button>

                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                        <p className="hidden md:block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">
                            {isDirty ? 'Certifica tu agenda para avisar al supervisor' : 'Realiza cambios para habilitar el envío'}
                        </p>
                        <button
                            onClick={handleCertificar}
                            disabled={!isDirty || isSubmitting}
                            className={`w-full md:w-auto px-10 py-6 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] transition-all
                                ${(!isDirty || isSubmitting)
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-primary md:bg-white md:text-primary text-white shadow-2xl hover:scale-105 active:scale-95'
                                }`}
                        >
                            {isSubmitting ? 'Procesando...' : (isDirty ? 'Certificar Jornada' : 'Sin Cambios')}
                        </button>
                    </div>
                </div>
            </footer>

            <UIModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                type="danger"
                title="¿LIMPIAR FORMULARIO?"
                message="ESTÁS A PUNTO DE BORRAR TODA LA INFORMACIÓN CAPTURADA EN TU PLANEACIÓN. ESTA ACCIÓN NO SE PUEDE DESHACER."
                showConfirmButton={true}
                confirmButtonText="SÍ, LIMPIAR"
                onConfirm={handleLimpiarFormulario}
                showCancelButton={true}
                cancelButtonText="Cancelar"
            />

            <UIModal
                isOpen={validationModal.isOpen}
                onClose={() => {
                    setValidationModal(prev => ({ ...prev, isOpen: false }));
                    if (validationModal.focusId) {
                        setTimeout(() => document.getElementById(validationModal.focusId)?.focus(), 100);
                    }
                }}
                type={validationModal.type || 'warning'}
                title={validationModal.title || 'Datos Incompletos'}
                message={
                    validationModal.type === 'danger' ? (
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={22} className="text-rose-500 mt-0.5 shrink-0" />
                            <span>{validationModal.message.toUpperCase()}</span>
                        </div>
                    ) : validationModal.message
                }
                showConfirmButton={true}
                confirmButtonText="Entendido"
                onConfirm={() => {
                    setValidationModal(prev => ({ ...prev, isOpen: false }));
                    if (validationModal.focusId) {
                        setTimeout(() => document.getElementById(validationModal.focusId)?.focus(), 100);
                    }
                }}
            />
        </div>
    );
};

export default PlaneacionOperativo;