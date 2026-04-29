import React, { useState, useEffect } from 'react';
import { 
  Users, Package, TrendingUp, AlertTriangle, 
  MapPin, Clock, ArrowRight, Printer, Truck, Search, Settings, Sparkles, Target, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { DashboardStats, Envio } from '../types.ts';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import DataTable from '../components/DataTable.tsx';
import UsaHeatmap from '../components/UsaHeatmap.tsx';
import Logo from '../components/Logo.tsx';

const ENVI_PALETTE = ['#083675', '#FFD100', '#00A3E0', '#FF8C00', '#2E7D32', '#D32F2F'];

export default function Dashboard() {
  const { mode } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shipments, setShipments] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataStats, dataEnvios] = await Promise.all([
          apiFetch('/api/stats/dashboard', { silent: true }),
          apiFetch('/api/envios?limit=100', { silent: true })
        ]);
        
        if (dataStats.success) setStats(dataStats.data);
        if (dataEnvios.success) setShipments(dataEnvios.data);
      } catch (err) {
        console.error('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const askAIHeader = async (type: 'query' | 'health') => {
    setLoadingAI(true);
    setAiResponse('');
    try {
      const statsStr = JSON.stringify(stats);
      let contextTemplate = `Datos estadísticos actuales: ${statsStr}. `;
      
      const prompt = type === 'health' 
        ? `${contextTemplate} Analiza la salud general del negocio con base en estos datos. Identifica patrones de envíos con atrasos, el rendimiento por estado y carrier, y la eficiencia financiera. Sugiere 2-3 opciones muy concretas de optimización operativa, de inventario o de rutas basadas en este comportamiento. Mantén la respuesta breve (máximo 3 párrafos), profesional, analítica, e incluye viñetas para las soluciones recomendadas.`
        : `${contextTemplate} Considera estos datos para resolver la siguiente consulta analítica sobre nuestros envíos o tendencias logísticas. Consulta: "${aiPrompt}". Sé directo, profesional e identifica patrones relevantes si aplica.`;

      const data = await apiFetch('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ prompt })
      });
      if (data.success) setAiResponse(data.text);
      else setAiResponse('No pude procesar tu solicitud ahora mismo.');
    } catch (err) {
      setAiResponse('Error conectando con el servicio de IA.');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="w-12 h-12 border-4 border-envi-azul/10 border-t-envi-azul rounded-full animate-spin" />
    </div>
  );

  const kpis = [
    { label: 'Envíos del Mes', value: stats?.total_mes?.count || 0, icon: Package, color: 'bg-[#F0F4F8] dark:bg-slate-800', iconColor: 'text-envi-azul dark:text-envi-celeste' },
    { label: 'Ingresos Brutos', value: `Q${(stats?.ingresos?.sum || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-[#F0F4F8] dark:bg-slate-800', iconColor: 'text-green-600' },
    { label: 'Margen Global', value: `Q${(stats?.margen?.sum || 0).toLocaleString()}`, icon: Target, color: 'bg-[#FFF9E6] dark:bg-slate-800', iconColor: 'text-[#B8860B]' },
    { label: 'Pendientes Cobro', value: 'Q1,250', icon: AlertTriangle, color: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600' },
  ];

  const tooltipStyles = {
    backgroundColor: mode === 'dark' ? '#1e293b' : '#fff',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    color: mode === 'dark' ? '#fff' : '#232323'
  };

  return (
    <div className="space-y-12 pb-20">
      {/* AI Assistant Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl shadow-envi-azul/5 border border-gray-100 dark:border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Zap className="w-40 h-40 text-envi-azul dark:text-white" />
        </div>
        
        <div className="flex items-center gap-4 mb-8 relative">
          <div className="bg-envi-azul p-3.5 rounded-2xl shadow-xl shadow-envi-azul/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#232323] dark:text-white uppercase tracking-tight leading-none mb-1 font-montserrat">INTELIGENCIA ENVI</h3>
            <p className="text-[10px] text-envi-celeste font-black uppercase tracking-[0.2em]">Consultor Logístico en Tiempo Real</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 relative">
          <div className="flex-1 relative group/input">
             <Search className="absolute left-5 top-5 w-5 h-5 text-gray-300 dark:text-slate-600 group-focus-within/input:text-envi-azul transition-colors" />
             <input 
              type="text" 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAIHeader('query')}
              placeholder="¿Carrier más eficiente este mes? o ¿Optimización de costos..."
              className="w-full bg-gray-50 dark:bg-slate-950 border-2 border-transparent dark:border-slate-800 rounded-[24px] pl-14 pr-6 py-5 text-gray-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-envi-azul shadow-inner transition-all font-bold text-[15px]"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <button 
              onClick={() => askAIHeader('query')}
              disabled={loadingAI}
              className="bg-envi-azul text-white px-6 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[24px] font-black hover:bg-envi-azul/90 shadow-xl shadow-envi-azul/20 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loadingAI ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
              ANALIZAR
            </button>
            <button 
              onClick={() => askAIHeader('health')}
              disabled={loadingAI}
              className="bg-envi-amarillo text-envi-azul px-6 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-[24px] font-black hover:brightness-95 transition-all text-xs uppercase tracking-widest active:scale-95 shadow-xl shadow-envi-amarillo/20 w-full sm:w-auto justify-center"
            >
              SALUD NEGOCIO
            </button>
          </div>
        </div>

        {aiResponse && (
          <div className="mt-8 bg-envi-azul/5 dark:bg-white/5 border-l-4 border-envi-azul p-6 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 relative">
             <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">
               <span className="font-black text-envi-azul dark:text-envi-celeste mr-3 uppercase text-[11px] tracking-widest not-italic">Diagnosis:</span>
               "{aiResponse}"
             </p>
          </div>
        )}
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[20px] sm:rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-xl shadow-black/5 hover:shadow-envi-azul/10 transition-all hover:-translate-y-1 group`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${kpi.color} group-hover:scale-110 transition-transform`}>
                <kpi.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${kpi.iconColor}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500 opacity-20 hidden sm:block" />
            </div>
            <div>
              <p className="text-gray-400 font-black text-[9px] sm:text-[10px] uppercase tracking-widest sm:mb-1 truncate">{kpi.label}</p>
              <p className="text-lg sm:text-3xl font-black text-[#232323] dark:text-white tracking-tighter truncate">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-10">
        {/* Main Charts */}
        <div className="lg:col-span-2 space-y-10 order-2 lg:order-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl shadow-black/5 border border-gray-100 dark:border-slate-800 h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-gray-400 tracking-widest uppercase text-[11px]">Estado Flujo Operativo</h3>
                <Target className="w-5 h-5 text-envi-celeste" />
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.estados_envio || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="count"
                      nameKey="estado"
                      stroke="none"
                    >
                      {(stats?.estados_envio || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={ENVI_PALETTE[index % ENVI_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={tooltipStyles}
                      itemStyle={{ color: mode === 'dark' ? '#fff' : '#232323', fontSize: '13px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                 {(stats?.estados_envio?.slice(0, 4) || []).map((e: any, i: number) => (
                   <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ENVI_PALETTE[i % ENVI_PALETTE.length] }} />
                      <span className="text-[10px] font-black text-gray-500 uppercase truncate">{e.estado}</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl shadow-black/5 border border-gray-100 dark:border-slate-800 h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-gray-400 tracking-widest uppercase text-[11px]">Heatmap de Destinos (USA)</h3>
                <MapPin className="w-5 h-5 text-envi-amarillo" />
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                 <UsaHeatmap data={stats?.estados || []} />
              </div>
              <div className="mt-4 flex justify-between items-center px-4">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Menos Envíos</span>
                 <div className="flex-1 mx-4 h-2 rounded-full bg-gradient-to-r from-blue-100 to-[#0A3266]"></div>
                 <span className="text-[10px] font-black text-gray-400 uppercase">Más Envíos</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-xl shadow-black/5 border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-envi-azul/10 p-3 rounded-2xl">
                   <Package className="w-5 h-5 text-envi-azul" />
                </div>
                <div>
                   <h3 className="font-black text-lg text-[#232323] dark:text-white tracking-tighter uppercase font-montserrat">Últimos Envíos</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Actividad Reciente</p>
                </div>
              </div>
            </div>
            
            <DataTable data={shipments} />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-10 order-1 lg:order-2">
          <div className="bg-envi-azul dark:bg-slate-900 p-6 sm:p-10 rounded-[40px] shadow-2xl shadow-envi-azul/30 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-center gap-3 mb-10 relative">
               <Target className="w-6 h-6 text-envi-amarillo" />
               <h3 className="font-black text-sm uppercase tracking-[0.25em] text-white">TOP AGENTES</h3>
            </div>
            <div className="space-y-8 relative">
              {[
                { name: 'Dwight Leal', count: 12, amount: 'Q15,400', color: 'bg-envi-celeste' },
                { name: 'Rey Quiché', count: 8, amount: 'Q9,200', color: 'bg-envi-amarillo' },
                { name: 'Típica Cobán', count: 7, amount: 'Q8,790', color: 'bg-white' }
              ].map((agent, i) => (
                <div key={i} className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-lg ${i === 2 ? 'text-envi-azul bg-white' : 'text-white ' + agent.color}`}>
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white group-hover/item:text-envi-amarillo transition-colors uppercase">{agent.name}</p>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{agent.count} ENVÍOS</p>
                    </div>
                  </div>
                  <p className="font-black text-sm text-envi-amarillo">{agent.amount}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-12 py-4 rounded-[20px] bg-white/10 hover:bg-white/20 border border-white/5 text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95">
               DESCARGAR REPORTES
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl shadow-black/5 border border-gray-100 dark:border-slate-800">
            <h3 className="font-black text-gray-400 mb-8 uppercase text-[11px] tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-envi-amarillo" /> ACCESOS RÁPIDOS
            </h3>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: 'Etiq. Label', icon: Printer, color: 'text-envi-azul' },
                { label: 'Guía Waybill', icon: Truck, color: 'text-envi-celeste' },
                { label: 'Tracking', icon: Search, color: 'text-envi-amarillo' },
                { label: 'Config UI', icon: Settings, color: 'text-gray-400' },
              ].map((link, i) => (
                <button key={i} className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 border-2 border-transparent hover:border-gray-100 dark:hover:border-slate-800 rounded-3xl transition-all group active:scale-95 shadow-sm hover:shadow-lg">
                  <link.icon className={`w-6 h-6 ${link.color} group-hover:scale-110 mb-4 transition-all`} />
                  <span className="text-[11px] font-black text-gray-400 group-hover:text-[#232323] dark:group-hover:text-white uppercase tracking-tighter transition-colors text-center">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
