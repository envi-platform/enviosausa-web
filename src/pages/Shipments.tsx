import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ExternalLink, Package, RefreshCw, Edit2, Calendar,
  MoreVertical, ChevronRight, FileText, Printer, CheckCircle2, Clock, MapPin, Plus, Save, Sparkles, AlertTriangle, Truck, Trash2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import TrackingMap from '../components/TrackingMap.tsx';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext.tsx';
import { apiFetch } from '../lib/api.ts';

const COLORS = {
  blue: '#1E53A1',
  blueMedium: '#3275BB',
  yellow: '#F9AD0A',
  green: '#217346',
  red: '#C00000',
  white: '#FFFFFF'
};

import SearchableSelect from '../components/SearchableSelect.tsx';

import { Envio } from '../types.ts';

export default function Shipments() {
  const { mode } = useTheme();
  const [searchParams] = useSearchParams();
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [carrierFilter, setCarrierFilter] = useState('Todos');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{[key: string]: string}>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [editingWaybill, setEditingWaybill] = useState<string | null>(null);
  const [waybillValue, setWaybillValue] = useState('');
  
  const [quickEditEnvio, setQuickEditEnvio] = useState<any>(null);
  const [quickEventParams, setQuickEventParams] = useState({
    evento: '',
    ubicacion: '',
    estado_resultante: '',
    comentario: ''
  });

  const handleQuickUpdate = async () => {
    if (!quickEditEnvio) return;
    try {
      const data = await apiFetch(`/api/envios/${quickEditEnvio.codigo_envi}/tracking`, {
        method: 'POST',
        body: JSON.stringify({
          ...quickEventParams,
          lat: '',
          lng: ''
        })
      });
      if (data.success) {
        setQuickEditEnvio(null);
        setQuickEventParams({ evento: '', ubicacion: '', estado_resultante: '', comentario: '' });
        fetchEnvios();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [newEvent, setNewEvent] = useState({
    evento: '',
    ubicacion: '',
    lat: '',
    lng: '',
    comentario: '',
    estado_resultante: ''
  });

  const fetchCarriers = async () => {
    const data = await apiFetch('/api/carriers', { silent: true });
    if (data.success) setCarriers(data.data);
  };

  const fetchTracking = async (codigo: string) => {
    setLoadingTracking(true);
    try {
      const data = await apiFetch(`/api/envios/${codigo}/tracking`, { silent: true });
      if (data.success) setTrackingEvents(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTracking(false);
    }
  };

  const toggleTracking = async (codigo: string) => {
    if (expandedId === codigo) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(codigo);
    await fetchTracking(codigo);
  };

  const fetchEnvios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'Todos') params.append('estado', statusFilter);
      if (carrierFilter !== 'Todos') params.append('carrier', carrierFilter);
      if (dateRange.start) params.append('start', dateRange.start);
      if (dateRange.end) params.append('end', dateRange.end);

      const data = await apiFetch(`/api/envios?${params.toString()}`, { silent: true });
      if (data.success) {
        setEnvios(data.data);
      } else {
        toast.error(data.error || 'No se pudieron cargar los envíos');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión al cargar envíos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvios();
    fetchCarriers();
  }, [statusFilter, carrierFilter, dateRange]);

  const handleAddEvent = async (envioId: number | string, codigo: string) => {
    try {
      const data = await apiFetch(`/api/envios/${codigo}/tracking`, {
        method: 'POST',
        body: JSON.stringify(newEvent)
      });
      if (data.success) {
        await fetchTracking(codigo);
        setNewEvent({ evento: '', ubicacion: '', lat: '', lng: '', comentario: '', estado_resultante: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePricing = async (id: number | string, precio: number, costo: number) => {
    try {
      await apiFetch(`/api/envios/${id}/pricing`, {
        method: 'PUT',
        body: JSON.stringify({ precio_cliente_q: precio, costo_carrier_q: costo })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWaybill = async (id: number | string) => {
    try {
      const data = await apiFetch(`/api/envios/${id}/waybill`, {
        method: 'PUT',
        body: JSON.stringify({ waybill: waybillValue })
      });
      if (data.success) {
        setEditingWaybill(null);
        fetchEnvios();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWaybillInline = async (id: number | string, waybill: string) => {
    if (waybill === undefined) return;
    const validWaybill = waybill.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const saveToast = toast.loading('Guardando waybill...');
    try {
      const data = await apiFetch(`/api/envios/${id}/waybill`, {
        method: 'PUT',
        body: JSON.stringify({ waybill: validWaybill })
      });
      if (data.success) {
        toast.success('Waybill guardado', { id: saveToast });
      } else {
        toast.error('Error al guardar waybill', { id: saveToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión', { id: saveToast });
    }
  };

  const handleDeleteEnvio = async (id: number | string, codigo: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR COMPLETAMENTE el envío ${codigo}? Esta acción no se puede deshacer.`)) {
      return;
    }
    const loadToast = toast.loading('Eliminando envío...');
    try {
      const data = await apiFetch(`/api/envios/${id}`, {
        method: 'DELETE'
      });
      if (data.success) {
        toast.success(`Envío ${codigo} eliminado`, { id: loadToast });
        setEnvios(prev => prev.filter(e => e.id !== id));
      } else {
        toast.error('Error al eliminar: ' + (data.error || 'Desconocido'), { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión', { id: loadToast });
    }
  };

  const handleEnvioLocalChange = (id: number | string, field: string, value: string | number) => {
    setEnvios(prev => prev.map(e => {
      if (String(e.id) === String(id)) {
        let val = value;
        if (field === 'waybill') val = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        const updated = { ...e, [field]: val };
        
        if (field === 'precio_cliente_q' || field === 'costo_carrier_q') {
          updated.ganancia_q = Number(updated.precio_cliente_q || 0) - Number(updated.costo_carrier_q || 0);
        }
        return updated;
      }
      return e;
    }));
  };

  const copyTrackingLink = (codigo: string) => {
    const url = `${window.location.origin}/tracking/${codigo}`;
    navigator.clipboard.writeText(url);
    alert('¡Enlace de rastreo copiado!');
  };

  const analyzeWithAI = async (envio: any) => {
    if (!process.env.GEMINI_API_KEY) return;
    
    setAnalyzing(envio.codigo_envi);
    try {
      const data = await apiFetch(`/api/envios/${envio.codigo_envi}/tracking`, { silent: true });
      const evts = data.success ? data.data : [];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Analiza el estado de este envío de paquetería de USA a Guatemala. 
      Código: ${envio.codigo_envi}
      Carrier: ${envio.carrier}
      Estado actual: ${envio.estado}
      Historial de eventos:
      ${evts.map((e: any) => `- [${e.fecha_hora}] ${e.evento} en ${e.ubicacion}. Comentario: ${e.comentario || 'N/A'}`).join('\n')}
      
      Por favor, proporciona un resumen en lenguaje natural (máximo 3 frases) y sugiere 2 acciones proactivas si el envío tiene problemas o simplemente el siguiente paso esperado. 
      Habla de forma profesional pero cercana.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });

      const text = response.text || "No se pudo generar el análisis.";
      setAiAnalysis(prev => ({ ...prev, [envio.codigo_envi]: text }));
    } catch (err) {
      console.error("Gemini Error:", err);
      setAiAnalysis(prev => ({ ...prev, [envio.codigo_envi]: "Error al conectar con la inteligencia artificial." }));
    } finally {
      setAnalyzing(null);
    }
  };

  const filtered = envios.filter(e => {
    const term = (search || '').toLowerCase();
    const searchMatch = (
      (e.codigo_envi || '').toLowerCase().includes(term) ||
      (e.remitente_nombre || '').toLowerCase().includes(term) ||
      (e.destinatario_nombre || '').toLowerCase().includes(term) ||
      (e.waybill || '').toLowerCase().includes(term) ||
      (e.estado || '').toLowerCase().includes(term) ||
      (e.carrier || '').toLowerCase().includes(term)
    );
    return searchMatch;
  });

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('entregado')) return 'badge-entregado';
    if (s.includes('aduana')) return 'badge-aduana';
    if (s.includes('tránsito') || s.includes('vuelo')) return 'badge-transito';
    if (s.includes('problema')) return 'badge-problema';
    if (s.includes('procesando')) return 'badge-procesando';
    return 'badge-creado';
  };

  const dataByStatus = React.useMemo(() => {
    const counts = envios.reduce((acc, current) => {
       const statusKey = current.estado || 'Desconocido';
       acc[statusKey] = (acc[statusKey] || 0) + 1;
       return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [envios]);

  const dataByCarrier = React.useMemo(() => {
    const counts = envios.reduce((acc, current) => {
       const carrierKey = current.carrier || 'Desconocido';
       acc[carrierKey] = (acc[carrierKey] || 0) + 1;
       return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [envios]);

  const PIE_COLORS = ['#1E53A1', '#F9AD0A', '#217346', '#C00000', '#A5B4FC', '#60A5FA'];

  // Skeletons implementation for loading states
  const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-border animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-40 bg-gray-100 rounded-xl w-full"></div>
    </div>
  );

  const SkeletonRow = () => (
    <tr className="hidden sm:table-row bg-white/50 animate-pulse border-b border-surface-border">
      <td className="px-6 py-4 border-l-4 border-gray-200">
        <div className="flex gap-4">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-20 bg-gray-100 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-24 bg-gray-100 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-24 bg-gray-100 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-24 bg-gray-100 rounded mb-2"></div>
        <div className="h-3 w-16 bg-gray-100 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-20 bg-gray-200 rounded-full mx-auto"></div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto"></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat">Historial de Envíos</h1>
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión Centralizada</p>
        </div>
      </div>

      {/* DASHBOARD SUMMARY */}
      {(loading && envios.length === 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : envios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-surface-border">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Envíos por Estado</h3>
             <div className="h-[200px] w-full relative min-h-[200px] overflow-hidden">
               <ResponsiveContainer width="100%" height={200}>
                 <PieChart>
                   <Pie
                     data={dataByStatus}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {dataByStatus.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-surface-border">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Volumen por Carrier</h3>
             <div className="h-[200px] w-full relative min-h-[200px] overflow-hidden">
               <ResponsiveContainer width="100%" height={200}>
                 <BarChart data={dataByCarrier} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                   <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="value" fill="#1E53A1" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-xl shadow-black/5 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Buscar Envío</label>
            <div className="relative group">
              <Search className="absolute left-4 top-3 w-4 h-4 text-gray-400 group-focus-within:text-envi-azul transition-colors" />
              <input 
                type="text" 
                placeholder="Código, nombre o waybill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl focus:border-envi-azul outline-none transition-all text-gray-800 dark:text-white text-sm font-medium"
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <SearchableSelect
              label="Estado"
              value={statusFilter}
              onChange={setStatusFilter}
              options={["Todos", "Creado", "En tránsito", "En aduana", "En vuelo", "Entregado", "Problema"]}
            />
          </div>

          <div className="w-full lg:w-48">
            <SearchableSelect
              label="Carrier"
              value={carrierFilter}
              onChange={setCarrierFilter}
              options={["Todos", ...carriers.map(c => c.nombre)]}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Rango de Fechas</label>
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-1.5 focus-within:border-envi-azul transition-all">
              <div className="flex w-full sm:w-auto items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 hidden sm:block" />
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full bg-transparent text-[13px] sm:text-xs text-gray-700 dark:text-slate-300 font-bold outline-none"
                />
              </div>
              <span className="text-[10px] text-gray-400 font-black uppercase hidden sm:block mx-1">a</span>
              <div className="flex w-full sm:w-auto items-center gap-3 border-t sm:border-t-0 border-gray-100 dark:border-slate-800 pt-2 sm:pt-0">
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full bg-transparent text-[13px] sm:text-xs text-gray-700 dark:text-slate-300 font-bold outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setStatusFilter('Todos');
                setCarrierFilter('Todos');
                setDateRange({ start: '', end: '' });
                setSearch('');
              }}
              className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-900 text-gray-400 hover:text-envi-azul transition-all shadow-sm active:scale-95"
              title="Limpiar filtros"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button className="bg-envi-celeste/10 hover:bg-envi-celeste/20 text-envi-azul dark:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-envi-celeste/20">
              <Printer className="w-4 h-4" />
              Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-t border-b sm:border border-surface-border sm:rounded-lg overflow-x-hidden sm:overflow-visible pb-24 sm:pb-24 pt-4 sm:pt-0">
        <div className="overflow-visible w-full sm:min-w-[800px]">
          <table className="w-full text-left border-collapse block sm:table">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-gray-50 dark:bg-slate-800 border-b border-surface-border">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking / Fecha</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remitente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destinatario</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carrier / Waybill</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-48">Finanzas (Q)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">IA</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group divide-y-0 sm:divide-y divide-surface-border bg-gray-50/50 sm:bg-white dark:sm:bg-slate-900">
              {(loading && envios.length === 0) ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filtered.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                     No se encontraron envíos que coincidan con su búsqueda.
                   </td>
                 </tr>
              ) : filtered.map((envio) => (
                <React.Fragment key={envio.id}>
                  {/* MOBILE CARD (Visible only on < sm) */}
                  <tr className="sm:hidden block p-4 mb-3 mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => toggleTracking(envio.codigo_envi)}>
                    <td className="block">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-envi-azul dark:text-envi-celeste text-sm">{envio.codigo_envi}</p>
                          <p className="font-bold text-gray-700 dark:text-gray-300 text-xs mt-1 truncate max-w-[200px]">{envio.remitente_nombre}</p>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setQuickEditEnvio(envio); 
                            setQuickEventParams({ ...quickEventParams, estado_resultante: envio.estado }); 
                          }}
                          className={`badge cursor-pointer hover:opacity-80 transition-opacity ${getStatusBadge(envio.estado)}`}
                        >
                          {envio.estado}
                        </button>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-3">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Precio</p>
                          <p className="text-sm font-black text-envi-verde">Q{envio.precio_cliente_q || 0}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === envio.codigo_envi ? 'rotate-90 text-envi-azul' : ''}`} />
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* DESKTOP ROW */}
                  <tr 
                    className={`hidden sm:table-row hover:bg-envi-azul/[0.02] dark:hover:bg-white/5 transition-colors group cursor-pointer ${expandedId === envio.codigo_envi ? 'bg-envi-azul/[0.03] dark:bg-white/10' : ''}`}
                    onClick={() => toggleTracking(envio.codigo_envi)}
                  >
                    <td className="px-6 py-4 border-l-4 border-l-envi-azul">
                      <div className="flex items-center gap-3">
                        <ChevronRight className={`w-4 h-4 text-gray-300 dark:text-slate-600 transition-transform ${expandedId === envio.codigo_envi ? 'rotate-90 text-envi-azul' : ''}`} />
                        <div>
                          <p className="font-bold text-envi-azul dark:text-envi-celeste text-[13px]">{envio.codigo_envi}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mt-1">
                            {format(new Date(envio.fecha_recepcion), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[13px] text-gray-700 dark:text-gray-300 leading-tight">{envio.remitente_nombre}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[150px]">{envio.municipio_origen}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[13px] text-gray-700 dark:text-gray-300 leading-tight">{envio.destinatario_nombre}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mt-1">{envio.dest_ciu}, {envio.dest_est}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="font-bold text-[11px] text-envi-azul-medio uppercase">{envio.carrier}</p>
                      <div className="relative group/edit flex items-center">
                        <input 
                          type="text" 
                          value={envio.waybill || ''}
                          placeholder="Waybill pendiente"
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleEnvioLocalChange(envio.id, 'waybill', e.target.value)}
                          onBlur={e => handleUpdateWaybillInline(envio.id, e.target.value)}
                          className="text-[10px] font-mono italic text-gray-600 bg-transparent border-b border-dashed border-gray-300 hover:border-envi-azul focus:border-envi-azul outline-none py-1 w-full pr-5 transition-colors"
                        />
                        <Edit2 className="w-3 h-3 text-gray-400 absolute right-0 pointer-events-none opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between text-[10px] group/edit">
                          <span className="text-gray-400">Cliente:</span>
                          <div className="relative flex items-center">
                            <input 
                              type="number"
                              value={envio.precio_cliente_q || 0}
                              onClick={e => e.stopPropagation()}
                              onChange={e => handleEnvioLocalChange(envio.id, 'precio_cliente_q', Number(e.target.value))}
                              onBlur={e => handleUpdatePricing(envio.id, Number(e.target.value), envio.costo_carrier_q || 0)}
                              className="w-16 text-right bg-transparent border-b border-dashed border-gray-300 hover:border-envi-azul focus:border-envi-azul outline-none font-bold text-envi-azul pr-4"
                            />
                            <Edit2 className="w-3 h-3 text-gray-400 absolute right-0 pointer-events-none opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] group/edit">
                          <span className="text-gray-400">Carrier:</span>
                          <div className="relative flex items-center">
                            <input 
                              type="number"
                              value={envio.costo_carrier_q || 0}
                              onClick={e => e.stopPropagation()}
                              onChange={e => handleEnvioLocalChange(envio.id, 'costo_carrier_q', Number(e.target.value))}
                              onBlur={e => handleUpdatePricing(envio.id, envio.precio_cliente_q || 0, Number(e.target.value))}
                              className="w-16 text-right bg-transparent border-b border-dashed border-gray-300 hover:border-envi-azul focus:border-envi-azul outline-none font-bold text-gray-600 pr-4"
                            />
                            <Edit2 className="w-3 h-3 text-gray-400 absolute right-0 pointer-events-none opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] border-t border-gray-100 mt-1 pt-1">
                          <span className="font-bold text-gray-500">Ganancia:</span>
                          <span className="font-bold text-envi-verde" title="Se auto-calcula al editar">
                            Q{((envio.precio_cliente_q || 0) - (envio.costo_carrier_q || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center align-top">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setQuickEditEnvio(envio); 
                          setQuickEventParams({ ...quickEventParams, estado_resultante: envio.estado }); 
                        }}
                        className={`badge cursor-pointer hover:opacity-80 transition-opacity ${getStatusBadge(envio.estado)}`}
                        title="Actualizar estado rápidamente"
                      >
                        {envio.estado}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center align-top relative group/ai">
                      <button 
                        className={`p-2 rounded-full transition-colors ${aiAnalysis[envio.codigo_envi] ? 'bg-envi-azul text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-envi-azul'} ${analyzing === envio.codigo_envi ? 'animate-pulse' : ''}`} 
                        onClick={(e) => { 
                          e.stopPropagation();
                          if (!aiAnalysis[envio.codigo_envi]) {
                            analyzeWithAI(envio);
                          }
                        }}
                        title={aiAnalysis[envio.codigo_envi] ? "Ver análisis IA" : "Generar análisis IA"}
                      >
                         <Sparkles className="w-4 h-4" />
                      </button>

                      {/* Tooltip IA Analysis */}
                      {aiAnalysis[envio.codigo_envi] && (
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-[320px] p-5 bg-white border border-surface-border shadow-[0_10px_40px_-10px_rgba(30,83,161,0.2)] rounded-xl z-[9999] text-left hidden group-hover/ai:block before:absolute before:-right-2 before:top-1/2 before:-translate-y-1/2 before:w-4 before:h-4 before:bg-white before:border-r before:border-b before:border-surface-border before:-rotate-45">
                          <h6 className="text-[10px] font-black uppercase text-envi-azul tracking-widest flex items-center gap-1 mb-3">
                             <Sparkles className="w-3 h-3" />
                             Resumen IA
                          </h6>
                          <p className="text-[11px] text-gray-600 leading-relaxed italic border-l-2 border-envi-celeste pl-3">
                             {aiAnalysis[envio.codigo_envi]}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Funcionalidad de editar envío completo (remitente, dest, pesos) en desarrollo');
                          }}
                          className="p-2 text-gray-400 hover:text-envi-amarillo hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar Envío"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/envios?q=${envio.codigo_envi}`;
                          }}
                          className="text-[10px] font-black text-white bg-envi-azul hover:bg-envi-azul-medio px-3 py-2 rounded-lg uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap"
                        >
                          Ver detalles
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnvio(envio.id, envio.codigo_envi);
                          }}
                          className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors ml-1"
                          title="Eliminar Envío"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {quickEditEnvio?.id === envio.id && (
                    <tr onClick={(e) => e.stopPropagation()} className="block sm:table-row bg-envi-azul/5">
                      <td colSpan={8} className="block sm:table-cell px-4 sm:px-6 py-4 border-l-4 border-l-envi-amarillo">
                        <div className="flex flex-wrap items-end gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Nuevo Estado</label>
                            <select 
                              value={quickEventParams.estado_resultante}
                              onChange={e => setQuickEventParams({...quickEventParams, estado_resultante: e.target.value})}
                              className="w-full bg-white border border-surface-border rounded px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-envi-azul"
                            >
                              <option value="Creado">Creado</option>
                              <option value="Registrado">Registrado</option>
                              <option value="En tránsito">En tránsito</option>
                              <option value="En aduana">En aduana</option>
                              <option value="En vuelo">En vuelo</option>
                              <option value="Entregado">Entregado</option>
                              <option value="Problema">Problema</option>
                            </select>
                          </div>
                          
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Evento</label>
                            <input 
                              type="text" 
                              placeholder="Ej: Salida de bodega"
                              value={quickEventParams.evento}
                              onChange={e => setQuickEventParams({ ...quickEventParams, evento: e.target.value })}
                              className="w-full bg-white border border-surface-border rounded px-3 py-2 text-sm text-gray-700 outline-none focus:border-envi-azul"
                            />
                          </div>

                          <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Ubicación</label>
                            <input 
                              type="text" 
                              placeholder="Ej: Miami, FL"
                              value={quickEventParams.ubicacion}
                              onChange={e => setQuickEventParams({ ...quickEventParams, ubicacion: e.target.value })}
                              className="w-full bg-white border border-surface-border rounded px-3 py-2 text-sm text-gray-700 outline-none focus:border-envi-azul"
                            />
                          </div>

                          <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Comentario</label>
                            <input 
                              type="text" 
                              placeholder="Observaciones..."
                              value={quickEventParams.comentario}
                              onChange={e => setQuickEventParams({ ...quickEventParams, comentario: e.target.value })}
                              className="w-full bg-white border border-surface-border rounded px-3 py-2 text-sm text-gray-700 outline-none focus:border-envi-azul"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={handleQuickUpdate}
                              className="bg-envi-azul hover:bg-envi-azul-medio text-white px-4 py-2 rounded text-xs font-bold uppercase"
                            >
                              Actualizar Envío
                            </button>
                            <button 
                              onClick={() => setQuickEditEnvio(null)}
                              className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase border border-gray-200 rounded bg-white hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {expandedId === envio.codigo_envi && (
                    <tr onClick={(e) => e.stopPropagation()} className="block sm:table-row">
                      <td colSpan={8} className="block sm:table-cell px-2 py-6 sm:px-8 sm:py-10 bg-slate-50/60 sm:border-l-4 sm:border-l-envi-azul shadow-inner" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'%231E53A1\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")', backgroundSize: '12px 12px' }}>
                        <div className="max-w-6xl mx-auto">
                          <div className="flex flex-col lg:flex-row gap-8 mb-8">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-montserrat font-bold text-envi-azul uppercase tracking-wider flex items-center gap-2">
                                  <Truck className="w-4 h-4" color={COLORS.blue} />
                                  Estado Actual y Seguimiento
                                </h4>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => copyTrackingLink(envio.codigo_envi)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-border rounded text-[10px] font-bold text-envi-azul uppercase hover:bg-envi-azul hover:text-white transition-all shadow-sm"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Link Cliente
                                  </button>
                                  <button 
                                    onClick={() => analyzeWithAI(envio)}
                                    disabled={analyzing === envio.codigo_envi}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                                      analyzing === envio.codigo_envi 
                                        ? 'bg-gray-200 text-gray-400 cursor-wait' 
                                        : 'bg-envi-azul text-white hover:bg-envi-azul-medio shadow-sm'
                                    }`}
                                  >
                                    {analyzing === envio.codigo_envi ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    Asistente IA
                                  </button>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-lg border border-surface-border shadow-sm">
                                {aiAnalysis[envio.codigo_envi] && (
                                  <div className="mb-6 p-4 bg-envi-azul/5 border-l-4 border-envi-azul rounded-r-lg">
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                                      {aiAnalysis[envio.codigo_envi]}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="space-y-6">
                                  {loadingTracking ? (
                                    <div className="flex flex-col items-center py-10">
                                      <RefreshCw className="w-8 h-8 text-envi-azul animate-spin mb-2" />
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Cargando eventos...</p>
                                    </div>
                                  ) : trackingEvents.length > 0 ? (
                                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                      {trackingEvents.map((event, idx) => (
                                        <div key={idx} className="relative">
                                          <div className={`absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-envi-azul scale-125' : 'bg-gray-300'}`} />
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                              <p className={`text-sm font-bold uppercase tracking-tight ${idx === 0 ? 'text-envi-azul' : 'text-gray-500'}`}>
                                                {event.evento}
                                              </p>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(event.fecha_hora), "dd MMM, HH:mm", { locale: es })}
                                              </p>
                                            </div>
                                            <div className="bg-gray-100 px-3 py-1 rounded border border-gray-200">
                                              <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {event.ubicacion}
                                              </p>
                                            </div>
                                          </div>
                                          {event.comentario && (
                                            <p className="mt-2 text-[13px] text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 italic">
                                              {event.comentario}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                                      <p className="text-gray-400 text-sm font-medium">Sin historial disponible</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="w-full lg:w-96 space-y-6">
                              <div className="bg-white p-6 rounded-lg border border-surface-border shadow-sm">
                                <h5 className="text-[11px] font-bold text-envi-azul uppercase tracking-wider mb-6 pb-2 border-b">Detalles de Facturación</h5>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-end">
                                    <div className="flex-1 mr-4">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio Cliente (Q)</p>
                                      <input 
                                        type="number" defaultValue={envio.precio_cliente_q}
                                        onBlur={(e) => handleUpdatePricing(envio.id, Number(e.target.value), envio.costo_carrier_q || 0)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm font-bold text-envi-azul"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Costo Carrier (Q)</p>
                                      <input 
                                        type="number" defaultValue={envio.costo_carrier_q}
                                        onBlur={(e) => handleUpdatePricing(envio.id, envio.precio_cliente_q || 0, Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm font-bold text-gray-700"
                                      />
                                    </div>
                                  </div>
                                  <div className="pt-4 border-t flex justify-between items-center text-envi-verde">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Utilidad Estimada:</span>
                                    <span className="text-lg font-black font-mono">Q{((envio.precio_cliente_q || 0) - (envio.costo_carrier_q || 0)).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-lg border border-surface-border shadow-sm">
                                <h5 className="text-[11px] font-bold text-envi-amarillo uppercase tracking-wider mb-6 pb-2 border-b">Identificador Internacional</h5>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Waybill Number / Guía Master</p>
                                  {editingWaybill === envio.codigo_envi ? (
                                    <div className="space-y-2">
                                      <input 
                                        type="text" 
                                        value={waybillValue}
                                        onChange={(e) => setWaybillValue(e.target.value.toUpperCase())}
                                        placeholder="Ej: ABC12345678"
                                        className="w-full bg-envi-amarillo/5 border border-envi-amarillo rounded px-3 py-2 text-sm font-black text-envi-azul uppercase shadow-inner"
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => handleUpdateWaybill(envio.id)}
                                          className="flex-1 bg-envi-azul text-white py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-envi-azul-medio transition-all"
                                        >
                                          Guardar
                                        </button>
                                        <button 
                                          onClick={() => setEditingWaybill(null)}
                                          className="px-4 border border-gray-200 text-gray-400 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 bg-white"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between group/wb bg-gray-50 p-4 rounded-lg border border-gray-100 border-dashed">
                                       <div>
                                          <p className="text-xl font-mono font-black text-envi-azul tracking-tight">{envio.waybill || 'VACÍO'}</p>
                                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">A cargo de: {envio.carrier}</p>
                                       </div>
                                       <button 
                                          onClick={() => {
                                            setEditingWaybill(envio.codigo_envi);
                                            setWaybillValue(envio.waybill || '');
                                          }}
                                          className="p-2 hover:bg-envi-azul hover:text-white rounded text-envi-azul transition-colors border border-envi-azul/20"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                  )}
                                  {!envio.waybill && (
                                    <div className="mt-3 p-3 bg-envi-amarillo/10 border-l-4 border-envi-amarillo rounded-r-lg flex gap-3">
                                      <AlertTriangle className="w-4 h-4 text-envi-amarillo shrink-0 mt-0.5" />
                                      <p className="text-[10px] font-bold text-amber-700 leading-tight">
                                        Asigna el Waybill 1-2 días después de recibir el paquete para habilitar el rastreo internacional.
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-8">
                                  <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b">Acciones Documentales</h5>
                                  <div className="space-y-3">
                                    <button onClick={() => window.open(`/api/envios/${envio.id}/print/label`, '_blank')} className="w-full bg-envi-azul hover:bg-envi-azul-medio text-white px-4 py-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors">
                                      <Printer className="w-4 h-4" />
                                      Imprimir Etiqueta / Label
                                    </button>
                                    <button onClick={() => window.open(`/api/envios/${envio.id}/print/waybill`, '_blank')} className="w-full bg-envi-celeste hover:bg-[#A3D2F7] text-envi-azul px-4 py-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors">
                                      <FileText className="w-4 h-4" />
                                      Imprimir Guía / Waybill
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* New Tracking Event Form */}
                          <div className="bg-white p-8 rounded-lg border border-surface-border shadow-sm">
                            <h5 className="text-[11px] font-bold text-envi-azul uppercase tracking-wider mb-8 flex items-center gap-2">
                              <Plus className="w-4 h-4 text-envi-amarillo" /> Agregar actualización de estado
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Evento</label>
                                <input 
                                  placeholder="Ej: Ingreso a Aduana" 
                                  value={newEvent.evento}
                                  onChange={e => setNewEvent({...newEvent, evento: e.target.value})}
                                  className="w-full bg-gray-50 border border-surface-border rounded px-4 py-2.5 text-[13px] font-bold text-gray-700 outline-none focus:border-envi-azul"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Ubicación</label>
                                <input 
                                  placeholder="Ej: Miami, FL" 
                                  value={newEvent.ubicacion}
                                  onChange={e => setNewEvent({...newEvent, ubicacion: e.target.value})}
                                  className="w-full bg-gray-50 border border-surface-border rounded px-4 py-2.5 text-[13px] font-bold text-gray-700 outline-none focus:border-envi-azul"
                                />
                              </div>
                              <div className="space-y-1 lg:col-span-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Estado del Envío</label>
                                <select 
                                  value={newEvent.estado_resultante}
                                  onChange={e => setNewEvent({...newEvent, estado_resultante: e.target.value})}
                                  className="w-full bg-gray-50 border border-surface-border rounded px-4 py-2.5 text-[13px] font-bold text-gray-700 outline-none focus:border-envi-azul"
                                >
                                  <option value="">Mantener actual</option>
                                  <option value="Registrado">Registrado</option>
                                  <option value="En tránsito">En tránsito</option>
                                  <option value="En aduana">En aduana</option>
                                  <option value="Entregado">Entregado</option>
                                  <option value="Problema">Problema</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Coordenadas (Opcional)</label>
                                <div className="flex gap-2">
                                  <input 
                                    placeholder="Lat" 
                                    value={newEvent.lat}
                                    onChange={e => setNewEvent({...newEvent, lat: e.target.value})}
                                    className="w-full bg-gray-50 border border-surface-border rounded px-2 py-2.5 text-[10px] font-mono text-gray-700 outline-none focus:border-envi-azul"
                                  />
                                  <input 
                                    placeholder="Lng" 
                                    value={newEvent.lng}
                                    onChange={e => setNewEvent({...newEvent, lng: e.target.value})}
                                    className="w-full bg-gray-50 border border-surface-border rounded px-2 py-2.5 text-[10px] font-mono text-gray-700 outline-none focus:border-envi-azul"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Comentario para el cliente</label>
                                <textarea 
                                  placeholder="Detalles adicionales sobre el estado del paquete..."
                                  value={newEvent.comentario}
                                  onChange={e => setNewEvent({...newEvent, comentario: e.target.value})}
                                  className="w-full bg-gray-50 border border-surface-border rounded px-4 py-2.5 text-[13px] font-bold text-gray-700 outline-none focus:border-envi-azul h-20"
                                />
                              </div>
                              <button 
                                onClick={() => handleAddEvent(envio.id, envio.codigo_envi)}
                                className="envi-btn-primary self-end h-12 flex items-center justify-center gap-3 min-w-[200px]"
                              >
                                <RefreshCw className="w-4 h-4" />
                                REGISTRAR EVENTO
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
