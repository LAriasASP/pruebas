import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Plus, MapPin, Search, Navigation, Calendar, Clock, Trash2, Phone, MoreHorizontal, User, Tag, CheckCircle2 } from 'lucide-react';
import { useAgenda } from '../../context/AgendaContext';
import { useCatalogs } from '../../context/CatalogContext';
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

// --- FUNCIONES AUXILIARES ---
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

// --- COMPONENTES SECUNDARIOS ---

// Input de Autocompletado con Filtros por Bloque y soporte de ID
// Autocomplete Name Input con validación estricta
const ClientNameInput = ({ id, value, idx, segmentName, updateVisit, mockDatabase }) => {
    const [query, setQuery] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null);

    // 1. Definimos qué clasificaciones están permitidas según el bloque
    const getAllowedClassifications = () => {
        switch (segmentName) {
            case 'Promoción': 
                return ['CONTACTO', 'PROSPECTO'];
            case 'Evaluación e Integración': 
                return ['CONTACTO', 'PROSPECTO', 'CLIENTE'];
            case 'Seguimiento de Cartera':
            case 'Gestión de Empresarias': 
                return ['CLIENTE'];
            default: 
                return [];
        }
    };

    const allowedClassifications = getAllowedClassifications();

    // 2. Separamos la lista de todos los elementos válidos para poder validarlos después
    const validItems = mockDatabase.filter(item => {
        const itemClass = item.classification ? item.classification.toUpperCase() : '';
        return allowedClassifications.includes(itemClass);
    });

    // 3. Filtramos las sugerencias que se muestran en pantalla mientras el usuario teclea
    const suggestions = validItems.filter(item => 
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
        
        if (!isClientOnlySegment && item.classification) {
            updateVisit(segmentName, idx, 'classification', item.classification);
        }
        setShowSuggestions(false);
    };

    // NUEVO: 4. Función de validación cuando el usuario sale del campo (onBlur)
    const handleBlur = () => {
        // Usamos setTimeout para dar tiempo a que React procese un clic en una sugerencia si es que hubo uno
        setTimeout(() => {
            // Buscamos si el texto escrito coincide exactamente con algún nombre válido en este bloque
            const exactMatch = validItems.find(item => item.name.toUpperCase() === query.trim().toUpperCase());
            
            // Si el campo no está vacío y no hay coincidencia exacta, lo borramos
            if (!exactMatch && query.trim() !== '') {
                setQuery('');
                updateVisit(segmentName, idx, 'name', ''); // Borramos del estado global de la agenda
                
                // Opcional: Si además quieres borrar la clasificación cuando el nombre es inválido
                // updateVisit(segmentName, idx, 'classification', ''); 
            }
        }, 150);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative group">
                <input
                    id={id}
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value;
                        setQuery(val);
                        updateVisit(segmentName, idx, 'name', val);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => query.length > 1 && setShowSuggestions(true)}
                    onBlur={handleBlur} // NUEVO: Ejecutamos la validación estricta al salir
                    className="input-cell !text-sm !py-2 bg-white w-full uppercase font-bold pr-10 hover:border-blue-300 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="Escribe nombre o apellido..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-400 transition-colors">
                    <Search size={14} />
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[100] top-full mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                        Coincidencias permitidas para {segmentName}
                    </div>
                    {suggestions.map((item, sIdx) => (
                        <button
                            key={sIdx}
                            // NUEVO: Usamos onMouseDown en lugar de onClick para que se ejecute antes del onBlur del input
                            onMouseDown={() => handleSelect(item)} 
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
        <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex-1 min-w-[120px] max-w-full sm:max-w-[140px]">
                <input
                    value={phones[0] || ''}
                    onChange={e => updatePhone(0, e.target.value)}
                    placeholder="10 dígitos"
                    className="input-cell text-[10px] py-2 w-full"
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
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-left-2 duration-200 items-center w-full sm:w-auto">
                    {[1, 2].map((pIdx) => (
                        <input
                            key={pIdx}
                            value={phones[pIdx] || ''}
                            onChange={e => updatePhone(pIdx, e.target.value)}
                            placeholder="10 dígitos"
                            className="input-cell text-[10px] py-2 w-full sm:w-24 flex-1"
                        />
                    ))}
                    <button onClick={() => setShowOthers(false)} className="text-slate-300 hover:text-slate-500 w-full sm:w-auto flex justify-center mt-2 sm:mt-0">
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

const DesktopRowFull = ({ v, idx, segmentName, updateVisit, removeRow, isTimeAvailable, mockDatabase }) => {
    const isClientOnlySegment = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';
    
    const { 
        productos = [], subproductos = [], programas = [], tiposIntegracion = [], 
        actividades = [], clasificaciones = [], herramientas = [], tiposGestion = []
    } = useCatalogs() || {};

    const renderSegmentDetails = () => {
        switch (segmentName) {
            case 'Promoción':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4 lg:mt-2 lg:ml-14">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Producto</label>
                            <select value={v.product || ''} onChange={e => updateVisit(segmentName, idx, 'product', e.target.value)} className={`input-cell w-full uppercase ${!v.product ? 'text-slate-400' : 'text-primary'}`}>
                                <option value="" disabled>Seleccionar producto...</option>
                                <optgroup label="Crédito">
                                    {productos.filter(p => p.categoria === 'CRËDITO').map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </optgroup>
                                <optgroup label="Ahorro">
                                    {productos.filter(p => p.categoria === 'AHORRO').map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </optgroup>
                                <optgroup label="Otro">
                                    {productos.filter(p => p.categoria !== 'CRËDITO' && p.categoria !== 'AHORRO').map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </optgroup>
                            </select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Dirección (Ciudad / Col / Calle)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input placeholder="Ciudad" value={v.city} onChange={e => updateVisit(segmentName, idx, 'city', e.target.value)} className="input-cell w-full sm:w-1/3 text-[10px]" />
                                <input placeholder="Colonia" value={v.colony} onChange={e => updateVisit(segmentName, idx, 'colony', e.target.value)} className="input-cell w-full sm:w-1/3 text-[10px]" />
                                <input placeholder="Calles" value={v.streets} onChange={e => updateVisit(segmentName, idx, 'streets', e.target.value)} className="input-cell w-full sm:w-1/3 text-[10px]" />
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
                    <div className="space-y-4 mt-4 lg:mt-2 lg:ml-14">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Integración</label>
                                <select value={v.typeIntegration || ''} onChange={e => updateVisit(segmentName, idx, 'typeIntegration', e.target.value)} className="input-cell w-full uppercase text-[10px]">
                                    <option value="" disabled>Seleccionar...</option>
                                    {tiposIntegracion.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Monto Estimado</label>
                                <input type="text" value={v.isFocusedAmount ? v.estimatedAmount : formatCurrency(v.estimatedAmount)} onFocus={() => updateVisit(segmentName, idx, 'isFocusedAmount', true)} onBlur={() => updateVisit(segmentName, idx, 'isFocusedAmount', false)} onChange={e => handleNumericChange(e.target.value, (val) => updateVisit(segmentName, idx, 'estimatedAmount', val))} placeholder="$ 0.00" className="input-cell w-full font-bold text-primary" />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tasa Anual</label>
                                <div className="relative">
                                    <input value={v.annualRate} onChange={e => handlePercentageChange(e.target.value, (val) => updateVisit(segmentName, idx, 'annualRate', val))} placeholder="0.00" className="input-cell w-full font-bold pr-8" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Subproducto</label>
                                <select value={v.subProduct || ''} onChange={e => updateVisit(segmentName, idx, 'subProduct', e.target.value)} className="input-cell w-full uppercase text-[10px]">
                                    <option value="" disabled>Seleccionar...</option>
                                    {subproductos.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Programa</label>
                                <select value={v.program || ''} onChange={e => updateVisit(segmentName, idx, 'program', e.target.value)} className="input-cell w-full uppercase text-[10px]" disabled={v.product === 'Captación'}>
                                    <option value="" disabled>Seleccionar...</option>
                                    {programas.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Dirección (Ciudad / Col / Calle)</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input placeholder="Ciudad" value={v.city} onChange={e => updateVisit(segmentName, idx, 'city', e.target.value)} className="input-cell w-full sm:w-1/3 text-[10px]" />
                                    <input placeholder="Colonia" value={v.colony} onChange={e => updateVisit(segmentName, idx, 'colony', e.target.value)} className="input-cell w-full sm:w-1/3 text-[10px]" />
                                    <input placeholder="Calles" value={v.streets} onChange={e => updateVisit(segmentName, idx, 'streets', e.target.value)} className="input-cell w-full sm:w-1/3 text-[10px]" />
                                </div>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Estatus Cartera (Sistema)</label>
                                <div className={`input-cell w-full text-[10px] font-bold flex items-center h-[42px] px-4 ${v.portfolioStatus && v.portfolioStatus !== 'N/A' ? 'text-primary' : 'text-slate-400'}`}>
                                    {v.portfolioStatus || 'AUTOMÁTICO'}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'Seguimiento de Cartera':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4 lg:mt-2 lg:ml-14 shadow-sm">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">ID Crédito</label>
                            <div className="input-cell w-full font-mono-tech flex items-center px-4 h-[42px] bg-white border-slate-100 text-primary">{v.idCredito || 'S/N'}</div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Estatus Cartera</label>
                            <div className="bg-white w-full p-2.5 rounded-lg border border-slate-100 text-[10px] font-black uppercase text-primary h-[42px] flex items-center px-4">{v.ultimoEstatus || 'S/N'}</div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Mora (Inicio / Actual)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-accent">Inicio: {v.moraInicioMes || 0} días</div>
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-red-500">Actual: {v.moraActual || 0} días</div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Fechas (Último Pago / Venc.)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-bold flex flex-col justify-center items-center"><span className="text-[7px] text-slate-400">PAGO</span>{v.ultimaFechaPago || '-'}</div>
                                <div className="flex-1 bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-bold flex flex-col justify-center items-center"><span className="text-[7px] text-slate-400">VENC.</span>{v.fechaVencimiento || '-'}</div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Saldos (Inicio / Actual)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold">In: {formatCurrency(v.saldoInicioMes)}</div>
                                <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-accent">Act: {formatCurrency(v.saldoActual)}</div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Categoría</label>
                            <div className="bg-white w-full p-2.5 rounded-lg border border-slate-100 text-[10px] font-black uppercase text-accent h-[42px] flex items-center px-4">{v.categoriaGestion || 'PREVENTIVO'}</div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Monto Amort.</label>
                            <div className="bg-white w-full p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold h-[42px] flex items-center px-4">{formatCurrency(v.montoAmortizacion)}</div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Monto p/Corriente</label>
                            <div className="bg-white w-full p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-red-600 h-[42px] flex items-center px-4">{formatCurrency(v.montoRequeridoCorriente)}</div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Herramienta Aplicada</label>
                            <div className="bg-white w-full p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold h-[42px] flex items-center px-4">{v.herramientaAplicada || 'NINGUNA'}</div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tipo de Gestión (Personal)</label>
                            <select value={v.typeVisitManagement || ''} onChange={e => updateVisit(segmentName, idx, 'typeVisitManagement', e.target.value)} className="input-cell w-full uppercase text-[10px] h-[42px]">
                                <option value="" disabled>Seleccionar tipo...</option>
                                {tiposGestion.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Herramienta para Aplicar</label>
                            <select value={v.herramientaAplicar || ''} onChange={e => updateVisit(segmentName, idx, 'herramientaAplicar', e.target.value)} className="input-cell w-full uppercase text-[10px] h-[42px]">
                                <option value="" disabled>Seleccionar...</option>
                                {herramientas.map(h => <option key={h.id} value={h.nombre}>{h.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'Gestión de Empresarias':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-4 lg:mt-2 lg:ml-14">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Información</label>
                            <div className="flex flex-col w-full text-[10px] font-bold text-accent bg-white p-2 rounded-lg border border-slate-50">
                                <span>Ingreso: {v.fechaIngreso || '-'}</span>
                                <span>Mora Actual: {v.moraDays || 0}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Saldos</label>
                            <div className="flex flex-col w-full text-[10px] font-bold text-accent bg-white p-2 rounded-lg border border-slate-50">
                                <span>Ocup: {formatCurrency(v.saldoOcupado)}</span>
                                <span className="text-emerald-600">Disp: {formatCurrency(v.saldoDisponible)}</span>
                            </div>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Tipo Gestión</label>
                            <select value={v.typeManagement || ''} onChange={e => updateVisit(segmentName, idx, 'typeManagement', e.target.value)} className="input-cell w-full uppercase text-[10px]">
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
        <div className="group border border-slate-100 lg:border-0 lg:border-b lg:border-slate-50 rounded-2xl lg:rounded-none bg-white hover:bg-slate-50/30 p-4 transition-all mb-4 lg:mb-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                
                {/* Opciones Superiores Móvil / Fijas en Escritorio */}
                <div className="flex items-center justify-between lg:w-auto lg:justify-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:h-auto bg-slate-900 lg:bg-transparent text-white lg:text-accent rounded flex items-center justify-center font-mono-tech text-[12px]">{idx + 1}</div>
                        <div className="w-32">
                            <select 
                                id={`time-${segmentName}-${idx}`} // ID para validación
                                value={v.time} 
                                onChange={e => updateVisit(segmentName, idx, 'time', e.target.value)} 
                                className="input-cell !py-2 font-bold w-full"
                            >
                                <option value="" disabled>Hora...</option>
                                {timeOptions.map(t => (
                                    <option key={t} value={t} disabled={!isTimeAvailable(t, v.id)}>{t} {!isTimeAvailable(t, v.id) ? ' (X)' : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={() => removeRow(segmentName, idx)} className="lg:hidden p-2 text-rose-400 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>

                {/* Cliente */}
                <div className="flex-1 w-full min-w-0">
                    <label className="lg:hidden text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Nombre del Cliente</label>
                    <ClientNameInput 
                        id={`name-${segmentName}-${idx}`} // ID para validación
                        value={v.name} 
                        idx={idx} 
                        segmentName={segmentName} 
                        updateVisit={updateVisit} 
                        mockDatabase={mockDatabase} 
                    />
                </div>

                {/* Clasificación (Filtrada) */}
                {!isClientOnlySegment && (
                    <div className="w-full lg:w-48">
                        <label className="lg:hidden text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Clasificación</label>
                        <select 
                            id={`class-${segmentName}-${idx}`} // ID para validación
                            value={v.classification || ''} 
                            onChange={e => updateVisit(segmentName, idx, 'classification', e.target.value)} 
                            className="input-cell w-full !py-2 uppercase font-black tracking-widest text-[9px]"
                        >
                            <option value="" disabled>Clasificación...</option>
                            {clasificaciones.filter(c => {
                                const nombreClase = c.nombre.toUpperCase();
                                if (segmentName === 'Promoción') {
                                    return nombreClase === 'CONTACTO' || nombreClase === 'PROSPECTO';
                                }
                                if (segmentName === 'Evaluación e Integración') {
                                    return nombreClase === 'CONTACTO' || nombreClase === 'PROSPECTO' || nombreClase === 'CLIENTE';
                                }
                                return true;
                            }).map(c => (
                                <option key={c.id} value={c.nombre}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Actividad */}
                {!isClientOnlySegment && (
                    <div className="w-full lg:flex-1 min-w-0">
                        <label className="lg:hidden text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Actividad / Objetivo</label>
                        {segmentName === 'Evaluación e Integración' ? (
                            <select 
                                id={`act-${segmentName}-${idx}`} // ID para validación
                                value={v.activity || ''} 
                                onChange={e => updateVisit(segmentName, idx, 'activity', e.target.value)} 
                                className="input-cell w-full !py-2 uppercase text-[10px] font-black"
                            >
                                <option value="" disabled>Seleccionar actividad...</option>
                                {actividades.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                            </select>
                        ) : (
                            <input 
                                id={`act-${segmentName}-${idx}`} // ID para validación
                                value={v.activity} 
                                onChange={e => updateVisit(segmentName, idx, 'activity', e.target.value)} 
                                className="input-cell w-full !py-2 bg-white" 
                                placeholder="Objetivo principal de la visita..." 
                            />
                        )}
                    </div>
                )}

                <div className="hidden lg:flex w-10 justify-end">
                    <button onClick={() => removeRow(segmentName, idx)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
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

            <div className="bg-white rounded-b-3xl border-x border-b border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[100px] p-4 lg:p-0">
                <div className="hidden lg:flex bg-slate-50/80 border-b border-slate-100 px-4 py-3 items-center gap-6 text-[10px] font-black text-accent uppercase tracking-widest">
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
    // IMPORTANTE: Extraemos kpiConfig para poder validar los KPIs
    const { currentAgenda, sendForAuthorization, resetAgenda, getVisibleSegments, kpiConfig } = useAgenda();
    const visibleSegments = getVisibleSegments();

    const [showClearModal, setShowClearModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [validationModal, setValidationModal] = useState({ isOpen: false, message: '', focusId: null });
    
    const initialDataRef = useRef(null);
    const prevIdRef = useRef(currentAgenda.id);

    useEffect(() => {
        const currentDataStr = JSON.stringify({
            segments: currentAgenda.segments,
            kpis: currentAgenda.kpiCompromisos
        });

        if (initialDataRef.current === null || prevIdRef.current !== currentAgenda.id) {
            initialDataRef.current = currentDataStr;
            prevIdRef.current = currentAgenda.id;
            setIsDirty(false);
        } else {
            setIsDirty(currentDataStr !== initialDataRef.current);
        }
    }, [currentAgenda.segments, currentAgenda.kpiCompromisos, currentAgenda.id]);

    const handleLimpiarFormulario = () => {
        resetAgenda();
        setShowClearModal(false);
    };

    const handleCertificar = () => {
        // 1. Validación de Bloques de Planeación
        for (const segmentName of visibleSegments) {
            const visits = currentAgenda.segments[segmentName] || [];
            for (let i = 0; i < visits.length; i++) {
                const v = visits[i];
                if (!v.time) {
                    setValidationModal({ isOpen: true, message: `Por favor selecciona la Hora en el bloque ${segmentName}, fila ${i + 1}.`, focusId: `time-${segmentName}-${i}` });
                    return; // Detiene el proceso
                }
                if (!v.name || v.name.trim() === '') {
                    setValidationModal({ isOpen: true, message: `El Nombre del Cliente no puede ir vacío en el bloque ${segmentName}, fila ${i + 1}.`, focusId: `name-${segmentName}-${i}` });
                    return;
                }
                
                const isClientOnly = segmentName === 'Seguimiento de Cartera' || segmentName === 'Gestión de Empresarias';
                if (!isClientOnly) {
                    if (!v.classification) {
                        setValidationModal({ isOpen: true, message: `Por favor selecciona una Clasificación en el bloque ${segmentName}, fila ${i + 1}.`, focusId: `class-${segmentName}-${i}` });
                        return;
                    }
                    if (!v.activity || v.activity.trim() === '') {
                        setValidationModal({ isOpen: true, message: `La Actividad/Objetivo no puede ir vacía en el bloque ${segmentName}, fila ${i + 1}.`, focusId: `act-${segmentName}-${i}` });
                        return;
                    }
                }
            }
        }

        // 2. Validación de KPIs (Todos son obligatorios)
        const kpis = currentAgenda.kpiCompromisos || {};
        if (kpiConfig) {
            for (const group of kpiConfig) {
                for (const field of group.fields) {
                    const val = kpis[field.key];
                    if (!val || val.toString().trim() === '') {
                        setValidationModal({ isOpen: true, message: `El campo "${field.label}" en la sección de KPIs es obligatorio.`, focusId: `kpi-${field.key}` });
                        return; // Detiene el proceso
                    }
                }
            }
        }

        // Si pasa todas las validaciones, ejecutamos la autorización
        sendForAuthorization();
    };

    // 1. Normalizamos el estatus para evitar errores por espacios, mayúsculas o variaciones ("ejecutado" vs "ejecutada")
    const statusActual = String(currentAgenda?.status || 'borrador').toLowerCase().trim();
    
    // 2. Definimos la lista blindada con todas las variaciones posibles
    const protectedStatuses = ['pendiente', 'aprobada', 'ejecutada', 'ejecutado', 'completada', 'completado'];

    if (protectedStatuses.includes(statusActual)) {
        let icon, colorClass, message;
        
        // 3. Comprobación flexible (atrapa "ejecutado" y "ejecutada")
        if (statusActual.includes('ejecutad') || statusActual.includes('completad')) {
            icon = <CheckCircle2 size={40} />; 
            colorClass = 'bg-slate-100 text-slate-600';
            message = 'Jornada finalizada y bloqueada';
        } else if (statusActual === 'aprobada') {
            icon = <CheckCircle2 size={40} />;
            colorClass = 'bg-emerald-50 text-emerald-600';
            message = 'Jornada autorizada para iniciar';
        } else {
            icon = <Clock size={40} />;
            colorClass = 'bg-blue-50 text-blue-600';
            message = 'Esperando validación de tu jefe';
        }

        return (
            <div className="max-w-2xl mx-auto animate-in zoom-in duration-300 py-10">
                <div className="glass-panel p-10 text-center bg-white shadow-2xl rounded-[32px] border-2 border-slate-50">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 shadow-inner ${colorClass}`}>
                        {icon}
                    </div>
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Agenda Protegida</h2>
                    <p className="text-accent text-[11px] font-black uppercase tracking-[0.2em] mt-3">
                        {message}
                    </p>
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

            <KpiCompromisos />

            <footer className="fixed bottom-0 left-0 right-0 md:relative md:mt-20 z-40">
                <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-200 p-6 md:p-12 md:bg-slate-900 md:text-white md:rounded-[40px] md:border-none shadow-[0_-20px_50px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    <button 
                        onClick={() => setShowClearModal(true)} 
                        className="flex items-center gap-3 text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 md:hover:bg-rose-500/10 px-6 py-4 rounded-2xl transition-all w-full md:w-auto justify-center"
                    >
                        <RotateCcw size={16} /> Limpiar Formulario
                    </button>
                    
                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                        <p className="hidden md:block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">
                            {isDirty ? 'Certifica tu agenda para avisar al supervisor' : 'Realiza cambios para habilitar el envío'}
                        </p>
                        
                        {/* BOTÓN ACTUALIZADO CON VALIDACIÓN */}
                        <button 
                            onClick={handleCertificar} 
                            disabled={!isDirty}
                            className={`w-full md:w-auto px-20 py-6 rounded-[24px] text-xs font-black uppercase tracking-[0.3em] transition-all
                                ${isDirty 
                                    ? 'bg-primary md:bg-white md:text-primary text-white shadow-2xl hover:scale-105 active:scale-95' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                        >
                            {isDirty ? 'Certificar Jornada' : 'Sin Cambios'}
                        </button>
                    </div>
                </div>
            </footer>

            <UIModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                type="danger"
                title="¿Limpiar Formulario?"
                message="Estás a punto de borrar toda la información capturada en tu planeación. Esta acción no se puede deshacer."
                showConfirmButton={true}
                confirmButtonText="Sí, limpiar"
                onConfirm={handleLimpiarFormulario}
                showCancelButton={true}
                cancelButtonText="Cancelar"
            />

            {/* NUEVO: Modal de Validación */}
            <UIModal
                isOpen={validationModal.isOpen}
                onClose={() => {
                    setValidationModal(prev => ({ ...prev, isOpen: false }));
                    // Hacemos focus dinámico después de que el modal se cierra
                    if (validationModal.focusId) {
                        setTimeout(() => document.getElementById(validationModal.focusId)?.focus(), 100);
                    }
                }}
                type="warning"
                title="Datos Incompletos"
                message={validationModal.message}
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