import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Truck, CheckCircle2, Clock, 
  Calendar, Package, Phone, User, ExternalLink,
  ShieldCheck
} from 'lucide-react';
import Logo from '../components/Logo.tsx';
import { TrackingRecord } from '../types';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import TrackingMap from '../components/TrackingMap.tsx';

const Step = ({ label, date, active, completed }: { label: string, date?: string, active?: boolean, completed?: boolean }) => (
  <div className="flex flex-col items-center flex-1 relative">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 z-10 transition-colors duration-500 ${
      completed ? 'bg-envi-azul border-white shadow-lg text-white' : 
      active ? 'bg-white border-envi-azul text-envi-azul shadow-sm' : 
      'bg-gray-100 dark:bg-slate-800 border-white dark:border-slate-800 text-gray-400 dark:text-slate-600'
    }`}>
      {completed ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 scale-90" />}
    </div>
    <div className="mt-3 text-center">
      <p className={`text-[11px] font-black uppercase tracking-tight ${active || completed ? 'text-envi-azul dark:text-envi-celeste' : 'text-gray-400 dark:text-slate-600'}`}>
        {label}
      </p>
      {date && <p className="text-[9px] text-gray-500 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-tighter">{date}</p>}
    </div>
  </div>
);

export default function PublicTracking() {
  const { code } = useParams();
  const { mode } = useTheme();
  const [guia, setGuia] = useState(code || '');
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = async (searchCode: string) => {
    if (!searchCode) return;
    
    // Robustness: input validation
    const cleanCode = searchCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{5,20}$/.test(cleanCode)) {
       setError('Por favor ingresa un número de guía válido.');
       return;
    }

    setError('');
    setLoading(true);
    setTracking(null);

    try {
      const data = await apiFetch(`/api/envios/${searchCode}`, { silent: true });
      if (data.success) {
        setTracking(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Número de guía no encontrado. Por favor verifica e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) fetchTracking(code);
  }, [code]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(guia);
  };

  // Logic to determine step status
  const getStepStatus = (stepLabel: string) => {
    if (!tracking) return { completed: false, active: false };
    const states = ['Creado', 'Registrado', 'Recolectado', 'En tránsito', 'En aduana', 'Entregado'];
    const currentIdx = states.findIndex(s => s === tracking.estado);
    const stepIdx = states.findIndex(s => stepLabel.includes(s));
    
    // Adjust for specific label differences
    let targetIdx = stepIdx;
    if (stepLabel === 'Ruta a destino') targetIdx = 3; // En tránsit/Ruta
    
    return {
      completed: targetIdx < currentIdx || tracking.estado === 'Entregado',
      active: targetIdx === currentIdx && tracking.estado !== 'Entregado'
    };
  };

  return (
    <div className={`min-h-screen bg-surface-bg dark:bg-slate-950 font-sans selection:bg-envi-azul/10 transition-colors duration-500`}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 py-4">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <Logo variant="full" />
          <div className="flex items-center gap-2 text-envi-azul dark:text-envi-celeste font-bold text-xs uppercase tracking-widest">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Centro de Ayuda</span>
            <div className="w-8 h-8 rounded-full border dark:border-slate-700 flex items-center justify-center">
               <Package className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-montserrat font-extrabold text-envi-azul dark:text-white tracking-tight mb-2 uppercase">
            Seguimiento de <span className="text-envi-rojo">mi envío</span>
          </h1>
          <p className="text-gray-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[10px]">Logística Internacional • Cobán • USA</p>
        </div>

        {/* Search Field */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-envi-azul transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text" 
              placeholder="¿Cuál es tu número de guía?"
              value={guia}
              onChange={(e) => setGuia(e.target.value.toUpperCase())}
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm rounded-2xl pl-16 pr-6 py-6 text-lg font-bold text-envi-azul dark:text-white focus:ring-4 focus:ring-envi-azul/5 focus:border-envi-azul outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-slate-700"
            />
            {loading && (
              <div className="absolute right-6 inset-y-0 flex items-center">
                 <Clock className="w-6 h-6 text-envi-azul animate-spin" />
              </div>
            )}
          </form>
          {error && <p className="mt-4 text-center text-envi-rojo font-bold text-sm uppercase tracking-tight">{error}</p>}
        </div>

        <AnimatePresence mode="wait">
          {tracking && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              {/* Main Status Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-montserrat font-black text-envi-azul dark:text-white uppercase tracking-tighter">Guía {tracking.codigo_envi}</h2>
                    <span className="bg-[#E8F4FB] dark:bg-envi-azul/20 text-[#3773AF] dark:text-envi-celeste px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight">
                      VÍA {tracking.carrier}
                    </span>
                  </div>
                  <div className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all ${
                    tracking.estado === 'Entregado' ? 'bg-[#217346] text-white' : 'bg-envi-azul text-white'
                  }`}>
                    {tracking.estado}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                      <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-envi-rojo mt-1" />
                        <div>
                          <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Dirección de entrega:</p>
                          <p className="font-bold text-envi-azul dark:text-gray-200 uppercase leading-tight text-sm">
                            {tracking.dest_dir} {tracking.dest_ciu}, {tracking.dest_est} {tracking.dest_zip}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                          <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Fecha Recibido:</p>
                            <p className="font-bold text-envi-azul dark:text-gray-300 text-sm tracking-tight">{tracking.fecha_recepcion}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                          <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Destinatario:</p>
                            <p className="font-bold text-envi-azul dark:text-gray-300 text-sm uppercase truncate max-w-[150px]">{tracking.dest_nom}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Carrier Info */}
                    <div className="border-2 border-envi-rojo/10 bg-envi-rojo/5 dark:bg-envi-rojo/5 p-6 rounded-3xl group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-envi-rojo rounded-2xl flex items-center justify-center shadow-lg shadow-envi-rojo/20">
                             <Truck className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                             <p className="font-black text-envi-azul dark:text-white uppercase tracking-tight text-sm">{tracking.carrier}</p>
                             <p className="text-[10px] font-bold text-envi-azul-2 dark:text-slate-500 uppercase tracking-widest">Courier Internacional</p>
                          </div>
                          {tracking.waybill && (
                            <a 
                              href={`https://www.google.com/search?q=${tracking.waybill}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-envi-azul dark:text-envi-celeste hover:bg-envi-azul hover:text-white transition-all shadow-sm"
                            >
                               <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="relative rounded-[40px] overflow-hidden shadow-xl min-h-[350px]">
                    {tracking.events && tracking.events.length > 0 ? (
                      <TrackingMap 
                        events={tracking.events}
                        origin={{ lat: 15.47, lng: -90.37 }} // Coban default
                        destination={{ lat: 45.51, lng: -122.67 }} // USA example
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <Clock className="w-12 h-12 text-gray-300 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-12 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                   <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                      <ShieldCheck className="w-24 h-24 text-envi-azul" />
                   </div>
                   <div className="flex gap-4 relative z-10">
                      <div className="w-8 h-8 bg-envi-amarillo rounded-full flex items-center justify-center text-envi-azul shrink-0 font-black">!</div>
                      <div>
                        <h4 className="font-black text-envi-amarillo text-[11px] uppercase tracking-[0.2em] mb-2">Aviso de Responsabilidad</h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                          LA CALIDAD Y LA PUBLICIDAD DE LOS PRODUCTOS ENVIADOS SON RESPONSABILIDAD EXCLUSIVA DEL REMITENTE. ENVI SE LIMITA A LA GESTIÓN LOGÍSTICA INTERNACIONAL.
                        </p>
                      </div>
                   </div>
                </div>

                {/* Tracking Steps Animation */}
                <div className="mt-20 pt-10 border-t dark:border-slate-800">
                    <div className="mb-10 flex items-center justify-between">
                       <h3 className="text-xs font-black text-envi-azul dark:text-white uppercase tracking-[0.3em]">Timeline de Envío</h3>
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-envi-azul animate-pulse" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">En Vivo</span>
                       </div>
                    </div>
                   <div className="flex items-center justify-between relative px-4">
                      <div className="absolute left-10 right-10 top-5 h-1 bg-gray-100 dark:bg-slate-800 -z-0 rounded-full">
                         <div className="h-full bg-envi-azul transition-all duration-1000 shadow-sm" style={{ width: `${(['Creado', 'Registrado', 'Recolectado', 'En tránsito', 'Entregado'].findIndex(s => s === tracking.estado) / 4) * 100}%` }}></div>
                      </div>
                      <Step label="Creado" completed={getStepStatus('Creado').completed} active={getStepStatus('Creado').active} date={tracking.fecha_recepcion} />
                      <Step label="Registrado" completed={getStepStatus('Registrado').completed} active={getStepStatus('Registrado').active} />
                      <Step label="Empaque" completed={getStepStatus('Recolectado').completed} active={getStepStatus('Recolectado').active} />
                      <Step label="Envío Local" completed={getStepStatus('Ruta a destino').completed} active={getStepStatus('Ruta a destino').active} />
                      <Step label="Entregado" completed={getStepStatus('Entregado').completed} active={getStepStatus('Entregado').active} />
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-16 border-t dark:border-slate-900 mt-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
           <Logo variant="navbar" className="grayscale opacity-50 dark:invert" />
           <div className="flex flex-col items-center md:items-end gap-3 text-gray-400">
              <div className="flex gap-8">
                 <a href="https://wa.me/50252121624" target="_blank" rel="noopener noreferrer" className="hover:text-envi-azul transition-colors font-black text-[10px] uppercase tracking-[0.2em]">WhatsApp</a>
                 <a href="https://www.instagram.com/enviosinternacionales_" target="_blank" rel="noopener noreferrer" className="hover:text-envi-azul transition-colors font-black text-[10px] uppercase tracking-[0.2em]">Instagram</a>
              </div>
              <p className="text-[9px] font-bold text-gray-300 dark:text-slate-600 uppercase tracking-widest text-center md:text-right">&copy; 2024 ENVI INTERNACIONAL • LOGÍSTICA SIN FRONTERAS • COBÁN, A.V.</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
