import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Truck, ShieldCheck, MapPin, 
  Clock, Phone, Instagram, Facebook, 
  ArrowRight, Package, Globe, UserCheck,
  Moon, Sun, Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import Logo from '../components/Logo.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

export default function Home() {
  const [guia, setGuia] = useState('');
  const navigate = useNavigate();
  const { mode, toggleMode, highContrast, setHighContrast } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGuia = guia.trim().toUpperCase();
    if (!/^[A-Z0-9-]{5,20}$/.test(cleanGuia)) {
      alert('Por favor ingresa un número de guía válido (5-20 caracteres alfanuméricos)');
      return;
    }
    navigate(`/tracking/${cleanGuia}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-envi-azul selection:text-white transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo variant="full" />
          <div className="hidden md:flex items-center gap-6">
            <a href="#proceso" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-envi-azul transition-colors">Proceso</a>
            <a href="#contacto" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-envi-azul transition-colors">Contacto</a>
            
            <div className="flex items-center gap-2 px-4 border-l border-gray-100 dark:border-slate-800 ml-2">
               <button onClick={toggleMode} className="p-2 text-gray-400 hover:text-envi-azul transition-colors">
                 {mode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
               </button>
               <button onClick={() => setHighContrast(!highContrast)} className={`p-2 transition-colors ${highContrast ? 'text-envi-amarillo' : 'text-gray-400'}`}>
                 <Eye className="w-4 h-4" />
               </button>
            </div>

            <Link 
              to="/login" 
              className="px-6 py-2.5 rounded-xl border-2 border-envi-azul text-envi-azul text-[10px] font-black uppercase tracking-widest hover:bg-envi-azul hover:text-white transition-all active:scale-95"
            >
              Acceso Staff
            </Link>
          </div>
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleMode} className="p-2 text-gray-400">
               {mode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link to="/login" className="p-2 text-envi-azul">
              <UserCheck className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 opacity-10 dark:opacity-5">
           <Globe className="w-[800px] h-[800px] text-envi-azul translate-x-1/4 -translate-y-1/4" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <span className="w-12 h-[2px] bg-envi-amarillo rounded-full" />
                <span className="text-envi-azul dark:text-envi-celeste text-[10px] font-black uppercase tracking-[0.4em]">
                  Logística Global Guatemala - USA
                </span>
              </div>
              <h1 className="text-7xl md:text-9xl font-black text-envi-azul dark:text-white tracking-tighter leading-[0.85] mb-10 uppercase font-montserrat">
                MOVEMOS <br />
                <span className="text-envi-amarillo">CONEXIONES</span> <br />
                REALES.
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium mb-12 max-w-xl leading-relaxed">
                Seguridad, transparencia y rapidez en cada paquete. Rastrea tu envío en tiempo real desde cualquier dispositivo.
              </p>

              {/* Tracking Input */}
              <form onSubmit={handleSearch} className="relative max-w-2xl group">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-gray-300 dark:text-gray-600 group-focus-within:text-envi-azul transition-colors">
                  <Search className="w-8 h-8" />
                </div>
                <input 
                  type="text" 
                  placeholder="Número de guía..."
                  value={guia}
                  onChange={(e) => setGuia(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 shadow-2xl shadow-envi-azul/10 rounded-[40px] pl-20 pr-52 py-8 text-2xl font-black text-envi-azul dark:text-white focus:border-envi-azul outline-none transition-all placeholder:text-gray-200 dark:placeholder:text-gray-700 uppercase"
                />
                <button 
                  type="submit"
                  className="absolute right-4 inset-y-4 bg-envi-azul text-white px-10 rounded-[28px] font-black uppercase text-xs tracking-[0.2em] hover:bg-envi-azul/90 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-envi-azul/30"
                >
                  Rastrear <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-32 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div>
                <h2 className="text-4xl md:text-6xl font-black text-envi-azul dark:text-white uppercase tracking-tighter leading-none mb-8">
                  TECNOLOGÍA AL <br /> SERVICIO DE <br /> <span className="text-envi-amarillo">TU LOGÍSTICA</span>
                </h2>
                <div className="space-y-8">
                   <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-envi-azul/5 dark:bg-envi-azul/20 flex items-center justify-center shrink-0">
                         <ShieldCheck className="w-7 h-7 text-envi-azul dark:text-envi-celeste" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight mb-2">Seguridad Garantizada</h4>
                         <p className="text-gray-500 dark:text-gray-400 font-medium">Cada envío cuenta con respaldo digital y físico durante todo su trayecto internacional.</p>
                      </div>
                   </div>
                   <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-envi-amarillo/5 dark:bg-envi-amarillo/20 flex items-center justify-center shrink-0">
                         <Clock className="w-7 h-7 text-envi-amarillo" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight mb-2">Tiempos Optimizados</h4>
                         <p className="text-gray-500 dark:text-gray-400 font-medium">Conexiones directas que reducen los tiempos de espera en aduanas y tránsito local.</p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="relative">
                <div className="aspect-square bg-envi-azul/5 dark:bg-slate-900 rounded-[60px] flex items-center justify-center border-4 border-gray-50 dark:border-slate-800 overflow-hidden relative">
                   <Globe className="w-3/4 h-3/4 text-envi-azul/10 absolute animate-pulse" />
                   <div className="relative z-10 grid grid-cols-2 gap-4 p-8">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl">
                         <p className="text-[32px] font-black text-envi-azul dark:text-envi-celeste mb-1">99%</p>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entregas Exitosas</p>
                      </div>
                      <div className="bg-envi-amarillo p-6 rounded-3xl shadow-xl mt-8">
                         <p className="text-[32px] font-black text-envi-azul mb-1">24/7</p>
                         <p className="text-[10px] font-black text-envi-azul/60 uppercase tracking-widest">Soporte Tracking</p>
                      </div>
                      <div className="bg-envi-azul p-6 rounded-3xl shadow-xl">
                         <p className="text-[32px] font-black text-white mb-1">+10k</p>
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Envíos Mensuales</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl mt-8">
                         <p className="text-[32px] font-black text-envi-azul dark:text-envi-celeste mb-1">USA</p>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cobertura Total</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section className="py-32 dark:bg-slate-950" id="contacto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-envi-azul dark:bg-slate-900 rounded-[60px] p-12 md:p-24 overflow-hidden relative shadow-2xl shadow-envi-azul/30">
            <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none">
              <Package className="w-96 h-96" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
              <div className="flex-1">
                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-10">
                  ¿DUDAS SOBRE <br /> <span className="text-envi-amarillo">TU PAQUETE?</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                         <Phone className="w-7 h-7 text-envi-celeste" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Línea Directa</p>
                        <p className="text-xl font-black text-white">+502 5212-1624</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                         <MapPin className="w-7 h-7 text-envi-amarillo" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Oficina Central</p>
                        <p className="text-xl font-black text-white px-2">2 CL 2009 Zona 4, Cobán A.V.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] w-full md:w-[400px] shadow-2xl">
                <p className="text-envi-azul dark:text-envi-celeste font-black uppercase text-[11px] tracking-[0.3em] mb-8 border-b border-gray-100 dark:border-slate-700 pb-4">Conecta con nosotros</p>
                <div className="space-y-4">
                  <a href="https://wa.me/50252121624" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366] group transition-all">
                    <div className="flex items-center gap-4">
                       <Phone className="w-6 h-6 text-[#25D366] group-hover:text-white" />
                       <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-white uppercase text-xs tracking-widest">WhatsApp</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </a>
                  <a href="https://www.instagram.com/enviosinternacionales_" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-slate-900 hover:bg-envi-azul group transition-all">
                    <div className="flex items-center gap-4">
                       <Instagram className="w-6 h-6 text-envi-azul group-hover:text-white" />
                       <span className="font-bold text-gray-500 dark:text-gray-400 group-hover:text-white uppercase text-xs tracking-widest">Instagram</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-white" />
                  </a>
                  <a href="https://www.facebook.com/share/1BGDV6BUDt/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-slate-900 hover:bg-envi-azul group transition-all">
                    <div className="flex items-center gap-4">
                       <Facebook className="w-6 h-6 text-envi-azul group-hover:text-white" />
                       <span className="font-bold text-gray-500 dark:text-gray-400 group-hover:text-white uppercase text-xs tracking-widest">Facebook</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-gray-100 dark:border-slate-900 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center gap-12">
              <Logo variant="navbar" className="grayscale opacity-50 dark:invert" />
              <div className="flex gap-8">
                 <a href="https://wa.me/50252121624" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-envi-azul transition-colors">WhatsApp</a>
                 <a href="https://www.instagram.com/enviosinternacionales_" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-envi-azul transition-colors">Instagram</a>
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center md:text-right">
                &copy; 2024 ENVI Internacional. <br className="md:hidden" /> COBÁN, ALTA VERAPAZ.
              </p>
           </div>
        </div>
      </footer>
    </div>
  );
}
