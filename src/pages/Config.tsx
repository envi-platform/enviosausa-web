import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Plus, Trash2, Phone, MapPin, User, ChevronRight, DollarSign, Save, Settings, X, Info, Edit } from 'lucide-react';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface Carrier {
  id: number;
  nombre: string;
  referencia: string;
  contacto_nombre: string;
  contacto_tel: string;
  contacto_direccion: string;
}

interface Tarifa {
  id: number;
  peso_min: number;
  peso_max: number;
  precio_costo_q: number;
  precio_venta_q: number;
}

export default function Config() {
  const { mode } = useTheme();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [showAddCarrier, setShowAddCarrier] = useState(false);
  const [editingCarrierId, setEditingCarrierId] = useState<number | null>(null);
  const [newCarrier, setNewCarrier] = useState({
    nombre: '',
    referencia: '',
    contacto_nombre: '',
    contacto_tel: '',
    contacto_direccion: ''
  });
  const [newTarifa, setNewTarifa] = useState({
    peso_min: 0,
    peso_max: 0,
    precio_costo_q: 0,
    precio_venta_q: 0
  });

  const fetchCarriers = async () => {
    const data = await apiFetch('/api/carriers', { silent: true });
    if (data.success) {
      setCarriers(data.data);
      if (selectedCarrier) {
        const updated = (data.data as Carrier[]).find(c => c.id === selectedCarrier.id);
        if (updated) setSelectedCarrier(updated);
      }
    }
  };

  const fetchTarifas = async (id: number) => {
    const data = await apiFetch(`/api/carriers/${id}/tarifas`, { silent: true });
    if (data.success) setTarifas(data.data);
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  useEffect(() => {
    if (selectedCarrier) fetchTarifas(selectedCarrier.id);
  }, [selectedCarrier]);

  const handleAddCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCarrierId ? `/api/carriers/${editingCarrierId}` : '/api/carriers';
    const method = editingCarrierId ? 'PUT' : 'POST';
    
    const data = await apiFetch(url, {
      method,
      body: JSON.stringify(newCarrier)
    });
    if (data.success) {
      fetchCarriers();
      setShowAddCarrier(false);
      setEditingCarrierId(null);
      setNewCarrier({ nombre: '', referencia: '', contacto_nombre: '', contacto_tel: '', contacto_direccion: '' });
    } else {
      alert('Error al guardar: ' + (data.error || 'Verifica los datos (el nombre debe ser único).'));
    }
  };

  const handleEditClick = (carrier: Carrier) => {
    setEditingCarrierId(carrier.id);
    setNewCarrier({
      nombre: carrier.nombre,
      referencia: carrier.referencia || '',
      contacto_nombre: carrier.contacto_nombre || '',
      contacto_tel: carrier.contacto_tel || '',
      contacto_direccion: carrier.contacto_direccion || '',
    });
    setShowAddCarrier(true);
  };

  const handleAddTarifa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarrier) return;
    const data = await apiFetch(`/api/carriers/${selectedCarrier.id}/tarifas`, {
      method: 'POST',
      body: JSON.stringify(newTarifa)
    });
    if (data.success) {
      fetchTarifas(selectedCarrier.id);
      setNewTarifa({ peso_min: 0, peso_max: 0, precio_costo_q: 0, precio_venta_q: 0 });
    }
  };

  const handleDeleteTarifa = async (id: number) => {
    const data = await apiFetch(`/api/tarifas/${id}`, {
      method: 'DELETE'
    });
    if (data.success && selectedCarrier) fetchTarifas(selectedCarrier.id);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-envi-azul p-3 rounded-2xl shadow-xl shadow-envi-azul/10">
             <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat truncate">Configuración</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Infraestructura Logística y Tarifarios</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddCarrier(true)}
          className="bg-envi-azul text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-envi-azul/90 shadow-xl shadow-envi-azul/20 flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs">Nuevo Carrier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Carrier List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Carriers Disponibles
            </h3>
            <span className="text-[10px] font-black text-envi-azul uppercase">{carriers.length}</span>
          </div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-3">
            {carriers.map(carrier => (
              <button
                key={carrier.id}
                onClick={() => setSelectedCarrier(carrier)}
                className={`w-full text-left p-6 rounded-[24px] border-2 transition-all group relative overflow-hidden ${
                  selectedCarrier?.id === carrier.id 
                    ? 'bg-white dark:bg-slate-900 border-envi-azul shadow-2xl shadow-envi-azul/5' 
                    : 'bg-white/50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 hover:border-envi-azul/30 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                       selectedCarrier?.id === carrier.id ? 'bg-envi-azul text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                    }`}>{carrier.referencia}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedCarrier?.id === carrier.id ? 'rotate-90 text-envi-azul' : 'text-gray-300 group-hover:text-gray-400'}`} />
                  </div>
                  <h4 className={`text-xl font-black tracking-tight font-montserrat ${selectedCarrier?.id === carrier.id ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{carrier.nombre}</h4>
                </div>
                {selectedCarrier?.id === carrier.id && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-envi-azul" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Carrier Details & Tariffs */}
        <div className="lg:col-span-2 space-y-10">
          {selectedCarrier ? (
            <div className="space-y-10">
              {/* Info Card */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-xl shadow-black/5 border border-gray-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <Truck className="w-48 h-48 text-envi-azul" />
                </div>
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50 dark:border-slate-800 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded-xl">
                      <Info className="w-5 h-5 text-envi-azul" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat">
                      Detalles del Operador
                    </h3>
                  </div>
                  <button 
                    onClick={() => handleEditClick(selectedCarrier)}
                    className="p-3 bg-gray-50 dark:bg-slate-800 hover:bg-envi-azul hover:text-white text-gray-400 rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Editar</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-8">
                    <div className="flex items-start gap-5">
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 text-envi-azul border border-gray-100 dark:border-slate-700 shadow-sm">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Representante Legal</p>
                        <p className="font-black text-gray-800 dark:text-white text-xl tracking-tight">{selectedCarrier.contacto_nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-5">
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 text-envi-azul border border-gray-100 dark:border-slate-700 shadow-sm">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Línea de Atención</p>
                        <p className="font-black text-gray-800 dark:text-white text-xl tracking-tight">{selectedCarrier.contacto_tel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="flex items-start gap-5">
                      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 text-envi-azul border border-gray-100 dark:border-slate-700 shadow-sm">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Centro de Acopio / Bodega</p>
                        <p className="font-bold text-gray-500 text-[13px] leading-relaxed italic">{selectedCarrier.contacto_direccion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tariffs section */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-xl shadow-black/5 border border-gray-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-envi-amarillo" /> Matriz de Precios
                  </h3>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-gray-100 dark:border-slate-700">GTQ (QUETZALES)</span>
                </div>

                {/* Add Tarifa Form */}
                <form onSubmit={handleAddTarifa} className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12 p-6 bg-gray-50 dark:bg-slate-950 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-inner">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Peso Min (LB)</label>
                    <input 
                      type="number" step="0.01" value={newTarifa.peso_min}
                      onChange={e => setNewTarifa({ ...newTarifa, peso_min: parseFloat(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold dark:text-white focus:border-envi-azul outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Peso Max (LB)</label>
                    <input 
                      type="number" step="0.01" value={newTarifa.peso_max}
                      onChange={e => setNewTarifa({ ...newTarifa, peso_max: parseFloat(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold dark:text-white focus:border-envi-azul outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo (Q)</label>
                    <input 
                      type="number" step="0.01" value={newTarifa.precio_costo_q}
                      onChange={e => setNewTarifa({ ...newTarifa, precio_costo_q: parseFloat(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold dark:text-white focus:border-envi-azul outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venta (Q)</label>
                    <input 
                      type="number" step="0.01" value={newTarifa.precio_venta_q}
                      onChange={e => setNewTarifa({ ...newTarifa, precio_venta_q: parseFloat(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold dark:text-white focus:border-envi-azul outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full h-[54px] bg-envi-azul hover:bg-envi-azul/90 text-white rounded-[20px] transition-all shadow-xl shadow-envi-azul/20 active:scale-95 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-4 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    <span>Rango Min</span>
                    <span>Rango Max</span>
                    <span>Costo</span>
                    <span>Precio</span>
                    <span className="text-right">Acción</span>
                  </div>
                  <div className="space-y-2.5">
                    {tarifas.length > 0 ? tarifas.map(tarifa => (
                      <div key={tarifa.id} className="grid grid-cols-5 gap-4 px-8 py-5 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-[24px] items-center transition-all group hover:shadow-lg">
                        <span className="font-bold text-envi-azul text-sm">{tarifa.peso_min} LB</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{tarifa.peso_max} LB</span>
                        <span className="font-black text-red-500">Q{tarifa.precio_costo_q.toFixed(2)}</span>
                        <span className="font-black text-green-600">Q{tarifa.precio_venta_q.toFixed(2)}</span>
                        <div className="text-right">
                          <button onClick={() => handleDeleteTarifa(tarifa.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="p-20 text-center text-gray-300 italic font-bold uppercase tracking-widest text-[11px] bg-gray-50 dark:bg-slate-950 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-slate-800">
                        No hay tarifas configuradas para este carrier.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center p-20 bg-gray-50 dark:bg-slate-950 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-slate-800">
              <Truck className="w-24 h-24 text-gray-100 dark:text-slate-800 mb-8" />
              <p className="text-gray-300 font-black uppercase tracking-[0.3em] text-sm text-center">Selecciona un carrier para<br/>gestionar su estructura tarifaria</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Carrier */}
      <AnimatePresence>
        {showAddCarrier && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAddCarrier(false); setEditingCarrierId(null); setNewCarrier({ nombre: '', referencia: '', contacto_nombre: '', contacto_tel: '', contacto_direccion: '' }); }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[48px] p-12 shadow-2xl relative z-10 border border-gray-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat">{editingCarrierId ? 'Editar Carrier' : 'Nuevo Carrier'}</h2>
                 <button onClick={() => { setShowAddCarrier(false); setEditingCarrierId(null); setNewCarrier({ nombre: '', referencia: '', contacto_nombre: '', contacto_tel: '', contacto_direccion: '' }); }} className="p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleAddCarrier} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Comercial</label>
                    <input 
                      required value={newCarrier.nombre}
                      onChange={e => setNewCarrier({ ...newCarrier, nombre: e.target.value })}
                      placeholder="Ej: DHL Express"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-gray-700 dark:text-white focus:border-envi-azul outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alias de Sistema</label>
                    <input 
                      required value={newCarrier.referencia}
                      onChange={e => setNewCarrier({ ...newCarrier, referencia: e.target.value })}
                      placeholder="Ej: DHL"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-gray-700 dark:text-white focus:border-envi-azul outline-none transition-all shadow-inner uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Representante de Ventas</label>
                  <input 
                    required value={newCarrier.contacto_nombre}
                    onChange={e => setNewCarrier({ ...newCarrier, contacto_nombre: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-gray-700 dark:text-white focus:border-envi-azul outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Línea de Contacto</label>
                  <input 
                    required value={newCarrier.contacto_tel}
                    onChange={e => setNewCarrier({ ...newCarrier, contacto_tel: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-gray-700 dark:text-white focus:border-envi-azul outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección Operativa</label>
                  <textarea 
                    required value={newCarrier.contacto_direccion}
                    onChange={e => setNewCarrier({ ...newCarrier, contacto_direccion: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-gray-700 dark:text-white focus:border-envi-azul outline-none transition-all shadow-inner h-24 resize-none"
                  />
                </div>
                <div className="flex gap-4 mt-12">
                  <button type="button" onClick={() => { setShowAddCarrier(false); setEditingCarrierId(null); setNewCarrier({ nombre: '', referencia: '', contacto_nombre: '', contacto_tel: '', contacto_direccion: '' }); }} className="flex-1 px-8 py-5 rounded-[24px] border-2 border-gray-100 dark:border-slate-700 text-gray-400 font-black uppercase text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95">CANCELAR</button>
                  <button type="submit" className="flex-1 px-8 py-5 rounded-[24px] bg-envi-azul text-white font-black uppercase text-xs hover:bg-envi-azul/90 transition-all active:scale-95 shadow-xl shadow-envi-azul/20">{editingCarrierId ? 'GUARDAR CAMBIOS' : 'GUARDAR ENTIDAD'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
