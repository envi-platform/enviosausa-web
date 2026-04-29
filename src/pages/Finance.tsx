import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, 
  BarChart3, PieChart, ArrowUpRight, 
  ArrowDownRight, Wallet, Receipt,
  ChevronRight, Download, Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';

export default function Finance() {
  const { mode } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const data = await apiFetch('/api/stats/dashboard', { silent: true });
        if (data.success) setStats(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  const financeKpis = [
    { label: 'Facturación Total', value: `Q${(stats?.ingresos?.sum || 0).toLocaleString()}`, growth: '+12.4%', up: true, icon: Wallet, color: 'azul' },
    { label: 'Utilidad Neta', value: `Q${(stats?.margen?.sum || 0).toLocaleString()}`, growth: '+5.2%', up: true, icon: TrendingUp, color: 'verde' },
    { label: 'Proyección Aduanas', value: 'Q4,250', growth: '-2.1%', up: false, icon: Receipt, color: 'amarillo' },
    { label: 'Eficiencia Operativa', value: '94.2%', growth: '+1.8%', up: true, icon: BarChart3, color: 'azul' },
  ];

  const formatMes = (mesStr: string) => {
     if (!mesStr) return '';
     const [year, month] = mesStr.split('-');
     const date = new Date(parseInt(year), parseInt(month)-1, 1);
     return date.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
  };

  const chartData = stats?.tendencia_meses?.map((t: any) => ({
    name: formatMes(t.mes),
    ingresos: t.ingresos,
    costos: t.costos
  })) || [];

  if (loading) return (
     <div className="h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-envi-azul border-t-transparent rounded-full animate-spin" />
     </div>
  );

  const tooltipStyles = {
    backgroundColor: mode === 'dark' ? '#1e293b' : '#fff',
    border: 'none',
    borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    color: mode === 'dark' ? '#fff' : '#1E53A1'
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-envi-azul p-3 rounded-2xl shadow-xl shadow-envi-azul/10">
             <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat truncate">Finanzas</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Monitoreo de Salud Financiera y Proyecciones</p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm mr-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <Calendar className="w-4 h-4 text-envi-azul" /> Este Mes
           </div>
           <button className="w-full sm:w-auto justify-center bg-envi-azul text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black hover:bg-envi-azul/90 shadow-xl shadow-envi-azul/20 flex items-center gap-2 sm:gap-3 transition-all active:scale-95">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs">Exportar PDF</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {financeKpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] shadow-lg shadow-black/[0.02] border border-gray-100 dark:border-slate-800 relative overflow-hidden group hover:border-envi-azul/20 transition-all">
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full transition-transform group-hover:scale-110 opacity-[0.03] ${
               kpi.color === 'verde' ? 'bg-green-50' : kpi.color === 'amarillo' ? 'bg-envi-amarillo' : 'bg-envi-azul'
            }`} />
            
            <div className="flex items-center justify-between mb-4 sm:mb-6 relative">
              <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm ${
                 kpi.color === 'verde' ? 'bg-green-50 text-green-600' : kpi.color === 'amarillo' ? 'bg-amber-50 text-envi-amarillo' : 'bg-blue-50 text-envi-azul'
              }`}>
                <kpi.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border-2 ${
                 kpi.up ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'
              }`}>
                {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{kpi.growth}</span>
              </div>
            </div>
            
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-1.5 truncate">{kpi.label}</p>
            <p className="text-xl sm:text-3xl font-black text-gray-800 dark:text-white tracking-tighter font-montserrat truncate">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-xl shadow-black/[0.02] border border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat">Revenue Semanal</h3>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-widest uppercase">Flujo real de ingresos por facturación</p>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-envi-azul shadow-lg shadow-envi-azul/20" />
                <span className="text-[10px] font-black text-gray-400 uppercase hidden sm:block">GTQ (GT)</span>
             </div>
          </div>
          
          <div className="h-[350px] w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[500px] h-full pr-4 overflow-hidden">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E53A1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1E53A1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCostos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD100" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FFD100" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke={mode === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis 
                   dataKey="name" 
                   fontSize={11} 
                   fontWeight={700} 
                   stroke="#94a3b8" 
                   axisLine={false} 
                   tickLine={false} 
                   dy={10}
                />
                <YAxis 
                   fontSize={11} 
                   fontWeight={700} 
                   stroke="#94a3b8" 
                   axisLine={false} 
                   tickLine={false} 
                   dx={-10}
                />
                <Tooltip 
                   contentStyle={tooltipStyles}
                   itemStyle={{ color: '#1E53A1', fontSize: '13px', fontWeight: 800 }}
                   labelStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px' }}
                />
                <Area 
                   type="monotone" 
                   dataKey="ingresos" 
                   name="Ingresos"
                   stroke="#1E53A1" 
                   strokeWidth={6} 
                   fillOpacity={1} 
                   fill="url(#colorIngresos)" 
                   animationDuration={2000}
                />
                <Area 
                   type="monotone" 
                   dataKey="costos" 
                   name="Costos"
                   stroke="#FFD100" 
                   strokeWidth={6} 
                   fillOpacity={1} 
                   fill="url(#colorCostos)" 
                   animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
           <div className="bg-envi-azul dark:bg-slate-800 p-10 rounded-[48px] shadow-2xl shadow-envi-azul/10 text-white relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute top-0 right-0 p-8 opacity-20">
                 <BarChart3 className="w-16 h-16" />
              </div>
              <div className="relative z-10">
                 <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                    <TrendingUp className="w-6 h-6 text-envi-amarillo" />
                 </div>
                 <h4 className="text-2xl font-black uppercase tracking-tighter mb-3 font-montserrat">Análisis Predictivo</h4>
                 <p className="text-white/60 text-sm font-medium leading-relaxed mb-10">Basado en el historial de rutas, el Revenue proyectado para Junio superará el +15%.</p>
                 <button className="w-full py-5 rounded-[24px] bg-white text-envi-azul font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-envi-amarillo hover:text-white transition-all transform active:scale-95 active:shadow-inner">
                    Detalles de Optimización
                 </button>
              </div>
           </div>
           
           <div className="bg-gray-50 dark:bg-slate-900 p-10 rounded-[48px] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center group">
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                 <Receipt className="w-8 h-8 text-envi-amarillo" />
              </div>
              <h5 className="text-gray-800 dark:text-white font-black uppercase tracking-tight text-lg mb-2">Conciliación Bancaria</h5>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Ultima sincronización: Hace 2h</p>
              <button className="text-envi-azul dark:text-envi-celeste font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                 Revisar Movimientos <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
