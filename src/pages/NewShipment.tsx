import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Package, ClipboardCheck, 
  ChevronRight, ChevronLeft, Save, Calculator, CheckCircle2,
  Info, Search as SearchIcon, Loader2, Truck, Plus, Trash2, Printer, Sparkles, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';

const HelpTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1">
    <Info className="w-3 h-3 text-gray-300 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl hidden group-hover:block z-50">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
    </div>
  </div>
);

const step1Schema = z.object({
  remitente_nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  remitente_tel: z.string().min(8, "El teléfono debe tener un mínimo de 8 caracteres"),
  municipio_origen: z.string().min(1, "Municipio requerido")
});

const step2Schema = z.object({
  destinatario_nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  destinatario_tel: z.string().min(8, "El teléfono es obligatorio y debe tener al menos 8 dígitos"),
  direccion_usa: z.string().min(5, "Dirección debe ser más detallada"),
  ciudad_usa: z.string().min(2, "Ciudad requerida"),
  estado_usa: z.string().min(2, "Estado requerido (ej. TEXAS o TX)"),
  zip_usa: z.string().regex(/^\d{5}(-\d{4})?$/, "Zipcode debe de ser de 5 dígitos (ej. 12345 o 12345-6789)")
});

const step3Schema = z.object({
  contenido: z.string().min(3, "Describe el contenido del paquete"),
  peso_lb: z.number().min(0.1, "El peso debe ser mayor a 0"),
  carrier_id: z.number().min(1, "Selecciona un carrier"),
  precio_q: z.number().min(0.1, "El precio debe ser calculado y mayor a 0")
});

export default function NewShipment() {
  const { mode } = useTheme();
  const [step, setStep] = useState(1);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<'remitente' | 'destinatario' | null>(null);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [printMode, setPrintMode] = useState<'label' | 'waybill' | null>(null);

  const [aiPricingHint, setAiPricingHint] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const [isManualPrice, setIsManualPrice] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [zipSuggestions, setZipSuggestions] = useState<string[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [carrierRates, setCarrierRates] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [items, setItems] = useState<{description: string, quantity: number}[]>([{ description: '', quantity: 1 }]);

  const handlePrint = (type: 'label' | 'waybill') => {
    setPrintMode(type);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const [appParams, setAppParams] = useState<any>({});
  const [formData, setFormData] = useState({
    remitente_nombre: '',
    remitente_dpi: '',
    remitente_tel: '',
    municipio_origen: 'Cobán centro',
    destinatario_nombre: '',
    destinatario_tel: '',
    direccion_usa: '',
    ciudad_usa: '',
    estado_usa: 'OREGON',
    zip_usa: '',
    carrier: 'DHL / ISSE',
    carrier_id: 0,
    peso_lb: 0,
    largo: 0,
    ancho: 0,
    alto: 0,
    contenido: '',
    seguro_activo: false,
    impuesto_previo_activo: false,
    precio_q: 0,
    costo_q: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [munsData, carriersData, paramsData] = await Promise.all([
          apiFetch('/api/municipios', { silent: true }),
          apiFetch('/api/carriers', { silent: true }),
          apiFetch('/api/parametros', { silent: true })
        ]);
        
        if (munsData.success) setMunicipios(munsData.data);

        if (carriersData.success) {
          setCarriers(carriersData.data);
          if (carriersData.data.length > 0) {
            setFormData(prev => ({ 
              ...prev, 
              carrier: carriersData.data[0].nombre,
              carrier_id: carriersData.data[0].id 
            }));
          }
        }

        if (paramsData.success) {
          const paramsMap: any = {};
          paramsData.data.forEach((p: any) => paramsMap[p.nombre] = p.valor);
          setAppParams(paramsMap);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.carrier_id) {
      const fetchRates = async () => {
        const data = await apiFetch(`/api/carriers/${formData.carrier_id}/tarifas`, { silent: true });
        if (data.success) setCarrierRates(data.data);
      };
      fetchRates();
    }
  }, [formData.carrier_id]);

  const validateStep = (currentStep: number) => {
    let newErrors: Record<string, string> = {};
    let success = true;

    try {
      if (currentStep === 1) {
        step1Schema.parse(formData);
      } else if (currentStep === 2) {
        step2Schema.parse(formData);
      } else if (currentStep === 3) {
        step3Schema.parse(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        success = false;
        error.issues.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        toast.error('Revisa los campos marcados en rojo');
      }
    }

    setErrors(newErrors);
    return success;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };
  const prevStep = () => {
    setErrors({});
    setStep(step - 1);
  };

  // USA Address Intelligence Data
  const usLocales: Record<string, Record<string, string[]>> = {
    'TEXAS': {
      'DALLAS': ['TX-75201', 'TX-75220', 'TX-75205', 'TX-75219'],
      'HOUSTON': ['TX-77001', 'TX-77002', 'TX-77005'],
      'AUSTIN': ['TX-73301', 'TX-78701']
    },
    'OREGON': {
      'PORTLAND': ['OR-97201', 'OR-97204', 'OR-97233'],
      'SALEM': ['OR-97301', 'OR-97302'],
      'BEAVERTON': ['OR-97005', 'OR-97006']
    },
    'FLORIDA': {
      'MIAMI': ['FL-33101', 'FL-33130'],
      'ORLANDO': ['FL-32801', 'FL-32802'],
      'TAMPA': ['FL-33601']
    },
    'CALIFORNIA': {
      'LOS ANGELES': ['CA-90001', 'CA-90012'],
      'SAN FRANCISCO': ['CA-94101', 'CA-94105'],
      'SAN DIEGO': ['CA-92101']
    },
    'NEW YORK': {
      'NEW YORK CITY': ['NY-10001', 'NY-10002'],
      'BUFFALO': ['NY-14201']
    },
    'ILLINOIS': {
      'CHICAGO': ['IL-60601', 'IL-60605']
    },
    'GEORGIA': {
      'ATLANTA': ['GA-30301', 'GA-30318']
    }
  };

  // Automatic Calculation
  useEffect(() => {
    if (isManualPrice) return;

    const vol = (formData.largo * formData.ancho * formData.alto) / 139;
    const billedWeight = Math.max(formData.peso_lb, vol);
    
    // Find rates in carrierRates
    let cost = 0;
    let sale = 0;

    if (carrierRates.length > 0) {
      // Logic: find applicable rate. Usually [0-1] for first lb, then lb adicional?
      // Simple lookup: max weight <= billedWeight? or range? 
      // Most common: Tarifa for [0-1] is base, then multiply excess by LB adicional rate.
      const baseRate = carrierRates.find(r => r.peso_min === 0 && r.peso_max === 1);
      const extraRate = carrierRates.find(r => r.peso_min === 1); // lb adicional

      if (baseRate) {
        cost = baseRate.precio_costo_q;
        sale = baseRate.precio_venta_q;

        if (billedWeight > 1) {
          const extra = billedWeight - 1;
          cost += extra * (extraRate?.precio_costo_q || 55);
          sale += extra * (extraRate?.precio_venta_q || 85);
        }
      }
    } else {
      // Fallback
      let rate = formData.carrier.includes('DHL') ? 45 : 38;
      if (billedWeight > 10) rate -= 5;
      sale = billedWeight * rate;
      cost = billedWeight * (rate * 0.6);
    }
    
    if (formData.seguro_activo) {
      sale += Number(appParams.seguro_base || 100);
    }

    if (formData.impuesto_previo_activo) {
      sale += Number(appParams.impuesto_previo || 150);
    }

    setFormData(prev => ({ 
      ...prev, 
      precio_q: Math.ceil(sale),
      costo_q: Math.ceil(cost)
    }));
  }, [formData.peso_lb, formData.largo, formData.ancho, formData.alto, formData.carrier_id, carrierRates, formData.seguro_activo, formData.impuesto_previo_activo, appParams]);

  const askAISuggestion = async () => {
    setLoadingAI(true);
    setAiPricingHint('');
    try {
      const prompt = `Sugiere un precio de venta en Quetzales para un envío de ${formData.peso_lb} lbs hacia ${formData.estado_usa} vía ${formData.carrier}. Contenido: ${formData.contenido}. Dame solo el número y una breve razón de 5 palabras.`;
      const data = await apiFetch('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      });
      if (data.success) setAiPricingHint(data.text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSearch = async (type: 'remitente' | 'destinatario', query: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [type === 'remitente' ? 'remitente_nombre' : 'destinatario_nombre']: query 
    }));
    
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(null);
      return;
    }

    setLoadingSearch(true);
    try {
      const data = await apiFetch(`/api/contactos/search?type=${type}&query=${query}`, { silent: true });
      if (data.success) {
        setSuggestions(data.data);
        setShowSuggestions(type);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectSuggestion = (type: 'remitente' | 'destinatario', item: any) => {
    if (type === 'remitente') {
      setFormData(prev => ({
        ...prev,
        remitente_nombre: item.nombre,
        remitente_dpi: item.dpi || '',
        remitente_tel: item.telefono || '',
        municipio_origen: item.municipio || prev.municipio_origen
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        destinatario_nombre: item.nombre,
        destinatario_tel: item.telefono || '',
        direccion_usa: item.direccion || '',
        ciudad_usa: item.ciudad || '',
        estado_usa: item.estado_usa || '',
        zip_usa: item.zip || ''
      }));
    }
    setShowSuggestions(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    const loadToast = toast.loading('Registrando el envío...');
    try {
      const data = await apiFetch('/api/envios', {
        method: 'POST',
        body: JSON.stringify({ ...formData, items })
      });
      if (data.success) {
        toast.success(`Envío ${data.data.codigo} registrado con éxito`, { id: loadToast });
        setSuccessData(data.data);
      } else {
        toast.error('Error: ' + data.error, { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión con el servidor', { id: loadToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500 py-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
          <div className="bg-envi-azul p-12 text-center text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Package className="w-48 h-48 -rotate-12" />
            </div>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 animate-bounce relative z-10">
              <CheckCircle2 className="w-14 h-14" />
            </div>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tight relative z-10">¡Envío Registrado!</h2>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm relative z-10">Procesado por ENVI Internacional</p>
          </div>
          
          <div className="p-10 space-y-8 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-center">Código Interno</p>
                <p className="text-3xl font-black text-envi-azul dark:text-envi-celeste text-center tracking-tighter">{successData.codigo}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-center">Destino</p>
                <p className="text-xl font-black text-gray-800 dark:text-gray-100 text-center tracking-tight leading-tight">{formData.ciudad_usa}, {formData.estado_usa}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col items-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Link de Seguimiento para Cliente</p>
              <div className="w-full flex gap-2">
                <input 
                  readOnly
                  type="text" 
                  value={`${window.location.origin}/tracking/${successData.codigo}`}
                  className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] font-mono text-gray-500 overflow-hidden text-ellipsis outline-none focus:border-envi-azul transition-all"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/tracking/${successData.codigo}`);
                  }}
                  className="bg-envi-azul text-white p-2.5 rounded-lg hover:bg-envi-azul-medio transition-all active:scale-90"
                  title="Copiar Link"
                >
                  <SearchIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-[8px] font-bold text-gray-400 uppercase">Comparte este link oficial con el cliente</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handlePrint('waybill')}
                  className="py-4 rounded-xl bg-envi-azul text-white font-black uppercase tracking-widest hover:bg-envi-azul/90 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <Printer className="w-5 h-5" />
                  GUÍA / WAYBILL
                </button>
                <button 
                  onClick={() => handlePrint('label')}
                  className="py-4 rounded-xl bg-envi-amarillo text-envi-azul font-black uppercase tracking-widest hover:bg-envi-amarillo/90 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <Package className="w-5 h-5" />
                  ETIQUETA / LABEL
                </button>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 rounded-xl border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 transition-all text-xs"
              >
                REGISTRAR OTRO ENVÍO
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .glass-card { border: none !important; background: transparent !important; box-shadow: none !important; }
        }
        .print-only { display: none; }
      `}</style>
      
      <div className="no-print">
        {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative no-print">
         {[1, 2, 3, 4].map((s) => (
           <div key={s} className="flex flex-col items-center z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s ? 'bg-envi-blue text-white' : 'bg-white text-gray-300 border-2'
              }`}>
                {s}
              </div>
              <span className={`text-[10px] font-black mt-2 uppercase tracking-widest ${
                step >= s ? 'text-envi-blue' : 'text-gray-300'
              }`}>
                {s === 1 ? 'Remitente' : s === 2 ? 'Destino' : s === 3 ? 'Paquete' : 'Resumen'}
              </span>
           </div>
         ))}
         <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
      </div>

      <div className="glass-card p-8 md:p-12 mb-8 border-gray-100 bg-white dark:bg-slate-900 border dark:border-slate-800">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-envi-azul dark:text-envi-celeste mb-8 uppercase tracking-tight">DATOS DEL REMITENTE</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Nombre Completo
                  <HelpTooltip text="Ingresa el nombre del cliente que envía. El sistema buscará si ya existe en la base de datos." />
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.remitente_nombre}
                    onChange={(e) => handleSearch('remitente', e.target.value)}
                    onFocus={() => formData.remitente_nombre.length >= 3 && setShowSuggestions('remitente')}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl focus:border-envi-azul outline-none transition-all font-bold text-gray-700 dark:text-gray-200 ${errors.remitente_nombre ? 'border-red-500/50' : 'border-gray-50 dark:border-slate-800'}`}
                    placeholder="Ej: Miriam Esperanza Isem"
                  />
                  {errors.remitente_nombre && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.remitente_nombre}</p>}
                  {loadingSearch && showSuggestions === 'remitente' && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-envi-azul" />}
                </div>
                
                {showSuggestions === 'remitente' && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectSuggestion('remitente', s)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors"
                      >
                        <p className="font-bold text-sm text-envi-azul dark:text-envi-celeste">{s.nombre}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{s.municipio} • {s.telefono}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">DPI / Documento</label>
                <input 
                  type="text" 
                  value={formData.remitente_dpi}
                  onChange={(e) => setFormData(prev => ({ ...prev, remitente_dpi: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-50 dark:border-slate-800 rounded-xl focus:border-envi-azul outline-none transition-all font-bold text-gray-700 dark:text-gray-200"
                  placeholder="3445..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono GT</label>
                <input 
                  type="text" 
                  value={formData.remitente_tel}
                  onChange={(e) => setFormData(prev => ({ ...prev, remitente_tel: e.target.value }))}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-envi-azul outline-none transition-all font-bold text-gray-700 ${errors.remitente_tel ? 'border-red-500/50' : 'border-gray-50'}`}
                  placeholder="3148..."
                />
                {errors.remitente_tel && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.remitente_tel}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Municipio Origen</label>
                <select 
                  value={formData.municipio_origen}
                  onChange={(e) => setFormData(prev => ({ ...prev, municipio_origen: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl focus:border-envi-azul outline-none transition-all font-bold uppercase text-gray-700"
                >
                   {municipios.map(m => (
                     <option key={m.id} value={m.nombre} className="bg-white">{m.nombre}</option>
                   ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-envi-azul mb-8 uppercase tracking-tight">DATOS DEL DESTINATARIO (USA)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2 space-y-2 relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Nombre del Destinatario
                  <HelpTooltip text="Busca por nombre para cargar direcciones guardadas de este destinatario." />
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.destinatario_nombre}
                    onChange={(e) => handleSearch('destinatario', e.target.value)}
                    onFocus={() => formData.destinatario_nombre.length >= 3 && setShowSuggestions('destinatario')}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl focus:border-envi-azul outline-none font-bold text-gray-700" 
                  />
                  {loadingSearch && showSuggestions === 'destinatario' && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-envi-azul" />}
                </div>

                {showSuggestions === 'destinatario' && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectSuggestion('destinatario', s)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <p className="font-bold text-sm text-envi-azul">{s.nombre}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{s.ciudad}, {s.estado_usa} • {s.direccion}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono USA</label>
                <input 
                  type="text" 
                  value={formData.destinatario_tel}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinatario_tel: e.target.value }))}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-envi-azul outline-none font-bold text-gray-700 ${errors.destinatario_tel ? 'border-red-500/50' : 'border-gray-50'}`} 
                  placeholder="+1 ..." 
                />
                {errors.destinatario_tel && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.destinatario_tel}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección Completa en USA</label>
                <textarea 
                  value={formData.direccion_usa}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion_usa: e.target.value }))}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-envi-azul outline-none font-bold h-24 text-gray-700 ${errors.direccion_usa ? 'border-red-500/50' : 'border-gray-50'}`} 
                />
                {errors.direccion_usa && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.direccion_usa}</p>}
              </div>
              <div className="space-y-2 relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</label>
                <input 
                  type="text" 
                  value={formData.estado_usa}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    let autoCity = '';
                    let autoZip = '';
                    if (usLocales[val]) {
                      const cities = Object.keys(usLocales[val]);
                      setCitySuggestions(cities);
                      if (cities.length > 0) {
                        autoCity = cities[0];
                        const zips = usLocales[val][autoCity];
                        if (zips && zips.length > 0) {
                          autoZip = zips[0];
                        }
                      }
                    } else {
                      setCitySuggestions([]);
                    }
                    setFormData(prev => ({ ...prev, estado_usa: val, ciudad_usa: autoCity, zip_usa: autoZip }));
                  }}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-envi-azul outline-none font-bold text-gray-700 uppercase ${errors.estado_usa ? 'border-red-500/50' : 'border-gray-50'}`} 
                  placeholder="Ej: TEXAS, OREGON" 
                />
                {errors.estado_usa && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.estado_usa}</p>}
                {citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden">
                    <p className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Sugerencias de Ciudad en {formData.estado_usa}</p>
                    {citySuggestions.map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, ciudad_usa: city, zip_usa: '' }));
                          setZipSuggestions(usLocales[formData.estado_usa][city]);
                          setCitySuggestions([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-envi-azul uppercase"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</label>
                <input 
                  type="text" 
                  value={formData.ciudad_usa}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setFormData(prev => ({ ...prev, ciudad_usa: val, zip_usa: '' }));
                    if (formData.estado_usa && usLocales[formData.estado_usa]?.[val]) {
                      setZipSuggestions(usLocales[formData.estado_usa][val]);
                    } else {
                      setZipSuggestions([]);
                    }
                  }}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-envi-azul outline-none font-bold text-gray-700 uppercase ${errors.ciudad_usa ? 'border-red-500/50' : 'border-gray-50'}`} 
                />
                {errors.ciudad_usa && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.ciudad_usa}</p>}
                {zipSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden">
                    <p className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Códigos Zip para {formData.ciudad_usa}</p>
                    {zipSuggestions.map(zip => (
                      <button
                        key={zip}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, zip_usa: zip }));
                          setZipSuggestions([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-envi-azul"
                      >
                        {zip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">ZIP Code</label>
                <input 
                  type="text" 
                  value={formData.zip_usa}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_usa: e.target.value }))}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-envi-azul outline-none font-bold text-gray-700 ${errors.zip_usa ? 'border-red-500/50' : 'border-gray-50'}`} 
                  placeholder="OR-97233" 
                />
                {errors.zip_usa && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.zip_usa}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-envi-azul mb-8 uppercase tracking-tight">DETALLES DEL PAQUETE</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Contenido del Envío</label>
                     <input 
                      type="text" 
                      value={formData.contenido}
                      onChange={(e) => setFormData(prev => ({ ...prev, contenido: e.target.value }))}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-envi-azul outline-none transition-all font-bold text-gray-700 ${errors.contenido ? 'border-red-500/50' : 'border-gray-50'}`}
                      placeholder="Ej: Ropa, Calzado, Electrónicos..."
                     />
                     {errors.contenido && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.contenido}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="block text-[10px] font-black text-envi-azul uppercase tracking-widest">Lista de Empaque (Packing List)</label>
                       <button 
                        type="button" 
                        onClick={addItem}
                        className="flex items-center gap-1 text-[9px] font-black text-white bg-envi-azul px-2.5 py-1.5 rounded-lg uppercase tracking-widest hover:bg-envi-azul/90 transition-all shadow-md"
                       >
                         <Plus className="w-3 h-3" /> AGREGAR ARTÍCULO
                       </button>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                       <AnimatePresence>
                         {items.map((item, idx) => (
                           <motion.div 
                             key={idx}
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: 10 }}
                             className="flex gap-2 mb-2"
                           >
                             <input 
                               type="text" 
                               value={item.description}
                               onChange={(e) => updateItem(idx, 'description', e.target.value)}
                               className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-envi-azul placeholder:text-gray-300"
                               placeholder="Descripción del artículo..."
                             />
                             <input 
                               type="number" 
                               value={item.quantity}
                               onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                               className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 text-center outline-none focus:border-envi-azul"
                             />
                             {items.length > 1 && (
                               <button 
                                onClick={() => removeItem(idx)}
                                className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             )}
                           </motion.div>
                         ))}
                       </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Carrier / Servicio</label>
                        <select 
                          value={formData.carrier_id}
                          onChange={(e) => {
                            const cid = Number(e.target.value);
                            const cname = carriers.find(c => c.id === cid)?.nombre || '';
                            setFormData(prev => ({ ...prev, carrier_id: cid, carrier: cname }));
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl focus:border-envi-azul outline-none transition-all font-bold text-gray-700 cursor-pointer"
                        >
                           {carriers.map(c => (
                             <option key={c.id} value={c.id} className="bg-white">{c.nombre}</option>
                           ))}
                        </select>
                     </div>

                     {formData.carrier_id > 0 && carriers.find(c => c.id === formData.carrier_id) && (
                       <div className="p-4 bg-envi-azul/5 border border-envi-azul/10 rounded-xl space-y-2">
                         <div className="flex items-center gap-2">
                           <Truck className="w-3 h-3 text-envi-azul" />
                           <span className="text-[9px] font-black text-envi-azul uppercase tracking-widest">Información del Courier</span>
                         </div>
                         <div className="grid grid-cols-1 gap-1">
                           <p className="text-[10px] font-bold text-gray-600"><span className="text-gray-400 uppercase text-[8px]">Contacto:</span> {carriers.find(c => c.id === formData.carrier_id)?.contacto_nombre}</p>
                           <p className="text-[10px] font-bold text-gray-600"><span className="text-gray-400 uppercase text-[8px]">Tel:</span> {carriers.find(c => c.id === formData.carrier_id)?.contacto_tel}</p>
                           <p className="text-[10px] font-bold text-gray-600"><span className="text-gray-400 uppercase text-[8px] block">Dirección de Recepción:</span> {carriers.find(c => c.id === formData.carrier_id)?.contacto_direccion}</p>
                         </div>
                       </div>
                     )}
                  </div>
               </div>

               <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 space-y-4">
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-envi-azul uppercase tracking-widest">Peso Real (LBS)</label>
                     <input 
                      type="number" 
                      value={formData.peso_lb}
                      onChange={(e) => setFormData(prev => ({ ...prev, peso_lb: Number(e.target.value) }))}
                      className={`w-full px-4 py-4 bg-white border-2 rounded-xl focus:border-envi-azul outline-none font-black text-3xl text-gray-800 ${errors.peso_lb ? 'border-red-500/50' : 'border-gray-200'}`} 
                     />
                     {errors.peso_lb && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.peso_lb}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center block">L (in)</label>
                      <input 
                        type="number" 
                        value={formData.largo}
                        onChange={(e) => setFormData(prev => ({ ...prev, largo: Number(e.target.value) }))}
                        className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-center font-bold text-gray-700" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center block">W (in)</label>
                      <input 
                        type="number" 
                        value={formData.ancho}
                        onChange={(e) => setFormData(prev => ({ ...prev, ancho: Number(e.target.value) }))}
                        className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-center font-bold text-gray-700" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center block">H (in)</label>
                      <input 
                        type="number" 
                        value={formData.alto}
                        onChange={(e) => setFormData(prev => ({ ...prev, alto: Number(e.target.value) }))}
                        className="w-full p-3 bg-white border-2 border-gray-100 rounded-lg text-center font-bold text-gray-700" 
                      />
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-gray-50 border-2 border-gray-100 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-lg transition-all">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-envi-azul uppercase tracking-[0.2em]">Sugerencia AI</h4>
                  <button 
                    onClick={askAISuggestion}
                    disabled={loadingAI}
                    className="text-[9px] font-black text-white bg-envi-azul px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-envi-azul/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3" />
                    {loadingAI ? 'ANALIZANDO...' : 'RECALCULAR CON IA'}
                  </button>
                </div>
                {aiPricingHint ? (
                  <div className="p-4 bg-white rounded-xl border border-envi-azul/10 animate-in fade-in slide-in-from-left-2 shadow-sm">
                    <p className="text-sm text-gray-700 font-bold">{aiPricingHint}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-white/50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium italic">Obtén una recomendación de precio basada en el mercado actual.</p>
                  </div>
                )}
                
                <div className="mt-8 space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Adicionales</h4>
                   
                   <label className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-envi-azul/30 transition-all shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${formData.seguro_activo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Shield className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-800">Seguro de Envío</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Q{appParams.seguro_base || '100'} Adicionales</p>
                         </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.seguro_activo ? 'bg-green-500' : 'bg-gray-300'}`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.seguro_activo ? 'left-7' : 'left-1'}`} />
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={formData.seguro_activo}
                        onChange={(e) => {
                          setIsManualPrice(false);
                          setFormData({...formData, seguro_activo: e.target.checked});
                        }}
                      />
                   </label>

                   <label className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-envi-azul/30 transition-all shadow-sm">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded text-envi-azul focus:ring-envi-azul border-gray-300 pointer-events-none"
                        checked={formData.impuesto_previo_activo}
                        readOnly
                      />
                      <div className="flex-1" onClick={() => { setIsManualPrice(false); setFormData({...formData, impuesto_previo_activo: !formData.impuesto_previo_activo}); }}>
                        <p className="text-sm font-bold text-gray-800">Impuesto Previo (DAP)</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Sumar Q{appParams.impuesto_previo || '150'} al total</p>
                      </div>
                   </label>
                </div>
              </div>

              <div className="w-full md:w-80 bg-envi-azul text-white rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                 <Calculator className="w-10 h-10 text-envi-amarillo mb-3" />
                 <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-60">VALOR VENTA ESTIMADO</p>
                    <button 
                      onClick={() => setIsManualPrice(!isManualPrice)}
                      className={`text-[8px] font-black px-2 py-0.5 rounded border transition-colors ${isManualPrice ? 'bg-envi-amarillo text-envi-azul border-envi-amarillo' : 'border-white/20 text-white/40 hover:border-white/40'}`}
                    >
                      {isManualPrice ? 'MANUAL' : 'AUTO'}
                    </button>
                 </div>
                 <div className="flex items-baseline gap-1 relative group w-full justify-center">
                    <span className="text-2xl font-bold opacity-50">Q</span>
                    <input 
                      type="number"
                      value={formData.precio_q}
                      onChange={(e) => {
                        setIsManualPrice(true);
                        setFormData(prev => ({ ...prev, precio_q: Number(e.target.value) }));
                      }}
                      className={`bg-transparent border-none outline-none text-5xl font-black tracking-tighter w-48 text-center ${errors.precio_q ? 'text-red-400' : 'text-envi-yellow'}`}
                    />
                 </div>
                 {errors.precio_q && <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-2">{errors.precio_q}</p>}
                 <div className="mt-4 pt-4 border-t border-white/10 w-full flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                    <span>Costo: Q{formData.costo_q}</span>
                    <span>Margen: Q{formData.precio_q - formData.costo_q}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-envi-azul/10 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-envi-azul" />
                </div>
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tight leading-none text-gray-800">REVISIÓN FINAL</h2>
                   <p className="font-bold text-gray-400 text-sm uppercase tracking-widest mt-1">Verifica los datos del envío</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div className="space-y-4">
                     <h4 className="font-black text-envi-azul uppercase text-[10px] tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                       <User className="w-4 h-4" /> Entidades
                     </h4>
                     <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-bold uppercase text-[9px] mb-0.5">Remitente</span>
                          <span className="font-black text-gray-700 uppercase text-sm">{formData.remitente_nombre}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-bold uppercase text-[9px] mb-0.5">Destinatario</span>
                          <span className="font-black text-gray-700 uppercase text-sm">{formData.destinatario_nombre}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-bold uppercase text-[9px] mb-0.5">Destino Final</span>
                          <span className="font-black text-gray-700 uppercase text-sm">{formData.ciudad_usa}, {formData.estado_usa} {formData.zip_usa}</span>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h4 className="font-black text-envi-azul uppercase text-[10px] tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                       <Package className="w-4 h-4" /> Paquete
                     </h4>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold uppercase text-[9px]">Carrier / Servicio</span>
                          <span className="font-black text-gray-700 uppercase">{formData.carrier}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold uppercase text-[9px]">Origen</span>
                          <span className="font-black text-gray-700 uppercase">{formData.municipio_origen}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-400 uppercase text-[9px]">Peso Billed:</span>
                          <span className="text-envi-azul">{formData.peso_lb} LBS</span>
                        </div>
                     </div>
                   </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-100 space-y-6 shadow-sm">
                   <h4 className="font-black text-gray-400 uppercase text-[10px] tracking-widest text-center">Resumen Financiero</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-black text-gray-400 uppercase">Costo Carrier</span>
                        <span className="text-lg font-bold text-red-500">Q{formData.costo_q.toFixed(2)}</span>
                      </div>
                      {formData.seguro_activo && (
                        <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                          <span className="text-xs font-black text-green-700 flex items-center gap-1 uppercase"><Shield className="w-3 h-3"/> Seguro Incluido</span>
                          <span className="text-sm font-bold text-green-700">+Q{appParams.seguro_base || '100'}</span>
                        </div>
                      )}
                      {formData.impuesto_previo_activo && (
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                          <span className="text-xs font-black text-blue-700 uppercase">Impuesto Previo</span>
                          <span className="text-sm font-bold text-blue-700">+Q{appParams.impuesto_previo || '150'}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center bg-envi-azul p-6 rounded-2xl shadow-xl">
                        <span className="text-xs font-black text-white/60 uppercase">Cobro al Cliente</span>
                        <span className="text-3xl font-black text-white">Q{formData.precio_q.toFixed(2)}</span>
                      </div>
                   </div>
                   <div className="pt-4 border-t border-gray-100">
                      <p className="flex justify-between items-center text-green-600">
                        <span className="text-[10px] font-black uppercase tracking-widest">Utilidad Estimada</span>
                        <span className="text-xl font-black">Q{(formData.precio_q - formData.costo_q).toFixed(2)}</span>
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 sm:gap-0 pt-8 border-t border-gray-100 no-print">
          <button 
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className="flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3 text-gray-400 font-bold bg-gray-50 sm:bg-transparent rounded-xl hover:text-envi-azul hover:bg-gray-100 sm:hover:bg-transparent transition-colors disabled:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
            ANTERIOR
          </button>

          {step < 4 ? (
            <button 
              onClick={nextStep}
              className="flex w-full sm:w-auto justify-center items-center gap-2 bg-envi-azul text-white px-8 py-3 rounded-xl font-black hover:bg-envi-azul/90 shadow-lg transition-all active:scale-95"
            >
              SIGUIENTE
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex w-full sm:w-auto justify-center items-center gap-2 bg-green-600 text-white px-10 py-4 rounded-xl font-black hover:bg-green-500 shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-6 h-6" />
              )}
              {isSubmitting ? 'REGISTRANDO...' : 'CONFIRMAR Y GUARDAR'}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Printable Area */}
      {printMode === 'waybill' && (
        <div className="print-only bg-white text-black p-10 font-sans border-[12px] border-envi-azul">
          <div className="flex justify-between items-start mb-8 border-b-4 border-envi-azul pb-6">
             <div className="flex items-center gap-4">
                <div className="bg-envi-azul p-3 rounded-xl">
                  <Package className="w-12 h-12 text-white" />
                </div>
                <div>
                   <h1 className="text-4xl font-black text-envi-azul leading-none tracking-tighter">ENVI</h1>
                   <p className="text-xs font-black text-envi-amarillo tracking-[0.3em] uppercase">Internacional</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-2xl font-black text-envi-azul uppercase">Waybill / Guía de Envío</h2>
                <p className="text-sm font-black uppercase mt-1">ID: <span className="text-red-600 text-xl">{successData?.codigo || '---'}</span></p>
                <div className="mt-2 text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded inline-block">
                  FECHA PROCESO: {new Date().toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 mt-8 border-2 border-envi-azul divide-x-2 divide-envi-azul uppercase">
             <div className="p-6 bg-white">
                <p className="text-[11px] font-black text-envi-azul mb-3 tracking-widest border-b border-gray-100 pb-1">REMITENTE (SENDER)</p>
                <p className="text-sm font-black text-gray-800">{formData.remitente_nombre}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">DPI: {formData.remitente_dpi}</p>
                <p className="text-xs font-bold text-gray-500">TEL: {formData.remitente_tel}</p>
                <p className="text-xs font-bold text-gray-500">ORIGEN: {formData.municipio_origen}</p>
             </div>
             <div className="p-6 bg-gray-50">
                <p className="text-[11px] font-black text-envi-azul mb-3 tracking-widest border-b border-gray-100 pb-1">DESTINATARIO (SHIP TO)</p>
                <p className="text-sm font-black text-gray-800">{formData.destinatario_nombre}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">TEL: {formData.destinatario_tel}</p>
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                  <p className="text-xs font-bold text-gray-800 leading-tight">{formData.direccion_usa}</p>
                  <p className="text-xs font-black text-envi-azul mt-1">{formData.ciudad_usa}, {formData.estado_usa} {formData.zip_usa}</p>
                </div>
             </div>
          </div>

          <div className="mt-8">
            <p className="text-[11px] font-black text-envi-azul mb-3 tracking-widest uppercase">Packing List (Detalle de Contenido)</p>
            <table className="w-full border-collapse border-2 border-envi-azul uppercase overflow-hidden rounded-xl shadow-sm">
               <thead>
                  <tr className="bg-envi-azul text-white text-[11px]">
                     <th className="p-3 border border-envi-azul text-left tracking-widest">DESCRIPCIÓN DEL ARTÍCULO</th>
                     <th className="p-3 border border-envi-azul w-32 tracking-widest">CANTIDAD</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                       <td className="p-3 border border-envi-azul text-xs font-bold text-gray-700">{item.description}</td>
                       <td className="p-3 border border-envi-azul text-center font-black text-xs text-envi-azul">{item.quantity}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-12 uppercase">
             <div className="space-y-6">
                <div className="border-t-2 border-gray-300 mt-16 pt-2 text-center relative">
                   <p className="text-[10px] font-black text-gray-400">FIRMA DEL REMITENTE ACORDE A DPI</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[9px] font-bold text-gray-400 leading-relaxed italic">
                    Declaro que el contenido de este paquete no incluye artículos prohibidos por la ley de Guatemala ni de los Estados Unidos (armas, drogas, dinero, perecederos no permitidos). ENVI Internacional actúa como intermediario logístico.
                  </p>
                </div>
             </div>
             <div className="bg-envi-azul/5 p-6 rounded-3xl border-2 border-envi-azul">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-envi-azul/10 pb-2">
                     <span className="text-[11px] font-black text-gray-400">PESO CARGADO:</span>
                     <span className="text-xl font-black text-envi-azul">{formData.peso_lb} LBS</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-envi-azul/10 pb-2">
                     <span className="text-[11px] font-black text-gray-400">CARRIER:</span>
                     <span className="text-xs font-black text-gray-700 uppercase">{formData.carrier}</span>
                  </div>
                  {formData.seguro_activo && (
                     <div className="flex justify-between items-center border-b border-envi-azul/10 pb-2">
                        <span className="text-[11px] font-black text-gray-400 flex items-center gap-1"><Shield className="w-3 h-3"/> SEGURO:</span>
                        <span className="text-xs font-black text-green-600 uppercase">INCLUIDO (+Q{appParams.seguro_base || '100'})</span>
                     </div>
                  )}
                  {formData.impuesto_previo_activo && (
                     <div className="flex justify-between items-center border-b border-envi-azul/10 pb-2">
                        <span className="text-[11px] font-black text-gray-400">IMPUESTO PREVIO:</span>
                        <span className="text-xs font-black text-envi-azul uppercase">INCLUIDO (+Q{appParams.impuesto_previo || '150'})</span>
                     </div>
                  )}
                  <div className="mt-6 pt-4 border-t-4 border-envi-azul flex justify-between items-center text-envi-azul">
                     <span className="text-sm font-black">TOTAL CANCELADO:</span>
                     <span className="text-4xl font-black">Q{formData.precio_q.toFixed(2)}</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {printMode === 'label' && (
        <div className="print-only bg-white text-black p-10 font-sans w-[4.5in] mx-auto border-[8px] border-envi-azul relative">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <Package className="w-40 h-40" />
           </div>
           
           <div className="flex items-center justify-between mb-6 border-b-4 border-envi-azul pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-envi-azul p-2 rounded-lg">
                   <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-black text-2xl text-envi-azul tracking-tighter block leading-none">ENVI</span>
                  <span className="text-[8px] font-black text-envi-amarillo uppercase tracking-widest">Internacional</span>
                </div>
              </div>
              <div className="bg-envi-azul text-white px-4 py-1.5 rounded-full text-[12px] font-black tracking-widest shadow-lg">
                 AIR PRIORITY
              </div>
           </div>
           
           <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SENDER:</p>
                   <p className="text-sm font-black text-gray-800">{formData.remitente_nombre.split(' ')[0]} {formData.remitente_nombre.split(' ')[1] || ''}</p>
                   <p className="text-[10px] text-gray-500 font-bold">{formData.municipio_origen}, GT</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DATE:</p>
                   <p className="text-sm font-black text-gray-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="bg-gray-100 p-6 rounded-2xl border-2 border-gray-200">
                 <p className="text-[11px] font-black text-envi-azul uppercase tracking-[0.2em] mb-2">DELIVER TO:</p>
                 <p className="text-xl font-black text-gray-900 leading-tight">{formData.destinatario_nombre}</p>
                 <p className="text-sm font-bold text-gray-600 mt-2 leading-relaxed">{formData.direccion_usa}</p>
                 <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col">
                   <span className="text-xl font-black text-envi-azul">{formData.ciudad_usa}, {formData.estado_usa}</span>
                   <span className="text-2xl font-black text-gray-900 tracking-[0.2em] mt-1">{formData.zip_usa}</span>
                 </div>
                 <p className="text-sm font-bold text-gray-800 mt-3 border-t border-gray-200 pt-2">PHONE: {formData.destinatario_tel}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t-2 border-envi-azul pt-6">
                 <div className="bg-envi-azul/5 p-4 rounded-xl border border-envi-azul/10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WEIGHT:</p>
                    <p className="text-2xl font-black text-envi-azul">{formData.peso_lb} LBS</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID CONTROL:</p>
                    <p className="text-xl font-black text-gray-800">{successData?.codigo || '---'}</p>
                 </div>
              </div>

              <div className="pt-6 flex flex-col items-center">
                 <div className="w-full h-24 bg-white flex items-center justify-center border-t-2 border-dashed border-gray-200 pt-6">
                    {/* Visual Barcode representation */}
                    <div className="flex gap-[2px] h-full items-stretch w-full justify-center opacity-80">
                       {Array.from({length: 60}).map((_, i) => (
                         <div key={i} className="bg-black w-[1px]" style={{width: Math.random() > 0.8 ? '4px' : Math.random() > 0.4 ? '2px' : '1px'}}></div>
                       ))}
                    </div>
                 </div>
                 <p className="text-[11px] font-mono mt-2 tracking-[0.6em] font-black text-gray-900">*{successData?.codigo?.replace(' ', '')}*</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
