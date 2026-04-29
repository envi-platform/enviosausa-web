import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function DataTable({ data }: { data: any[] }) {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' } | null>(null);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCarrier, setFilterCarrier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data];

    // Filter
    if (filterEstado) {
      result = result.filter(item => item.estado === filterEstado);
    }
    if (filterCarrier) {
      result = result.filter(item => item.carrier === filterCarrier);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.codigo_envi?.toLowerCase().includes(lower) || 
        item.remitente_nombre?.toLowerCase().includes(lower) || 
        item.destinatario_nombre?.toLowerCase().includes(lower)
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, sortConfig, filterEstado, filterCarrier, searchTerm]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Entregado': return 'bg-green-100 text-green-700';
      case 'En tránsito': return 'bg-blue-100 text-blue-700';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'En aduana': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const uniqueEstados = Array.from(new Set(data.map(d => d.estado))).filter(Boolean);
  const uniqueCarriers = Array.from(new Set(data.map(d => d.carrier))).filter(Boolean);

  return (
    <div className="bg-white rounded-[40px] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden font-montserrat">
      <div className="px-8 py-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por código, remitente, destinatario..."
            className="w-full bg-gray-50 border-none rounded-full pl-10 pr-4 py-3 text-sm font-bold text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-envi-azul"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-envi-azul"
          >
            <option value="">Todos los Estados</option>
            {uniqueEstados.map((e: any) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select 
            value={filterCarrier}
            onChange={e => setFilterCarrier(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-envi-azul"
          >
            <option value="">Todos los Carriers</option>
            {uniqueCarriers.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <th className="px-8 py-4 cursor-pointer hover:text-envi-azul transition-colors min-w-[120px]" onClick={() => requestSort('codigo_envi')}>
                <div className="flex items-center gap-1">Código <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-envi-azul transition-colors min-w-[150px]" onClick={() => requestSort('remitente_nombre')}>
                <div className="flex items-center gap-1">Remitente <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-envi-azul transition-colors min-w-[150px]" onClick={() => requestSort('destinatario_nombre')}>
                <div className="flex items-center gap-1">Destinatario <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-envi-azul transition-colors" onClick={() => requestSort('estado')}>
                <div className="flex items-center gap-1">Estado <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-envi-azul transition-colors" onClick={() => requestSort('carrier')}>
                <div className="flex items-center gap-1">Carrier <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-8 py-4 cursor-pointer hover:text-envi-azul transition-colors" onClick={() => requestSort('fecha_recepcion')}>
                <div className="flex items-center gap-1">Fecha Rec. <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedAndFilteredData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-4">
                  <span className="font-black text-[#232323]">{item.codigo_envi}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-bold text-gray-700">{item.remitente_nombre || 'N/A'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-bold text-gray-700">{item.destinatario_nombre || 'N/A'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(item.estado)}`}>
                    {item.estado || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-bold text-envi-azul bg-envi-azul/10 px-2 py-1 rounded">{item.carrier || 'N/A'}</span>
                </td>
                <td className="px-8 py-4">
                  <span className="text-xs font-bold text-gray-500">
                    {item.fecha_recepcion ? format(new Date(item.fecha_recepcion), 'dd/MM/yyyy') : 'N/A'}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <button 
                    onClick={() => navigate(`/envios?q=${item.codigo_envi}`)}
                    className="text-[10px] font-black text-white bg-envi-azul hover:bg-envi-azul-medio px-4 py-2 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
            {sortedAndFilteredData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-8 py-10 text-center text-sm font-bold text-gray-400">
                  No se encontraron envíos con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
