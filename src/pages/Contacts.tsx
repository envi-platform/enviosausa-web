import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, MapPin, Phone, Search, Filter, ChevronRight, Hash, Edit } from 'lucide-react';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';

export default function Contacts() {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const [type, setType] = useState<'remitente' | 'destinatario'>('remitente');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/contactos?type=${type}`, { silent: true });
      if (data.success) setContacts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [type]);

  const filtered = contacts.filter(c => 
    (c.nombre || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (c.dpi && c.dpi.includes(search)) ||
    (c.telefono && String(c.telefono).includes(search))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-envi-azul p-3 rounded-2xl shadow-xl shadow-envi-azul/10">
             <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-800 dark:text-white tracking-tighter uppercase font-montserrat truncate">Directorio</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Base de Datos Maestros de Clientes</p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-[20px] border border-gray-200 dark:border-slate-700">
          <button 
            onClick={() => setType('remitente')}
            className={`px-8 py-3 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${type === 'remitente' ? 'bg-white dark:bg-slate-900 text-envi-azul shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Remitentes GUA
          </button>
          <button 
            onClick={() => setType('destinatario')}
            className={`px-8 py-3 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${type === 'destinatario' ? 'bg-white dark:bg-slate-900 text-envi-azul shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Destinatarios USA
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl shadow-black/5 border border-gray-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
          <input 
            type="text" 
            placeholder={`Filtrar por nombre, identificación o teléfono de ${type}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent border-gray-50 dark:border-slate-800 rounded-[20px] pl-16 pr-6 py-5 text-gray-700 dark:text-white outline-none focus:border-envi-azul transition-all font-bold placeholder:text-gray-300 shadow-inner"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[40px] border border-gray-100 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((contact) => (
            <div key={contact.id} className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-gray-100 dark:border-slate-800 shadow-lg shadow-black/[0.02] hover:shadow-xl hover:border-envi-azul/20 transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 rounded-[24px] bg-gray-50 dark:bg-slate-800 text-envi-azul flex items-center justify-center text-3xl font-black border border-gray-100 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105 group-hover:bg-envi-azul group-hover:text-white duration-500">
                  {contact.nombre.charAt(0)}
                </div>
                <div className="text-right">
                  <div className="bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700 mb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Record Global</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Hash className="w-4 h-4 text-envi-amarillo" />
                    <p className="text-3xl font-black text-gray-800 dark:text-white tracking-tighter">{contact.total_envios || 0}</p>
                  </div>
                </div>
              </div>

              <h3 className="font-black text-gray-800 dark:text-white mb-6 uppercase tracking-tight text-xl leading-tight group-hover:text-envi-azul dark:group-hover:text-envi-celeste transition-colors font-montserrat">
                {contact.nombre}
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-gray-400">
                  <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg group-hover:text-envi-azul">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold tracking-tight text-gray-600 dark:text-gray-300">{contact.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-start gap-4 text-gray-400">
                   <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg group-hover:text-envi-azul">
                    <MapPin className="w-5 h-5 mt-0.5" />
                  </div>
                  <span className="text-sm font-bold leading-tight text-gray-500 dark:text-gray-400">
                    {type === 'remitente' 
                      ? contact.municipio || 'Sin ubicación' 
                      : `${contact.ciudad}, ${contact.estado_usa} ${contact.zip}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => alert('Función de editar contacto en desarrollo')}
                  className="flex items-center justify-center p-5 rounded-[24px] bg-gray-50 dark:bg-slate-800 hover:bg-envi-amarillo text-gray-400 hover:text-white transition-all border border-gray-100 dark:border-slate-700 shadow-sm active:scale-95 group-hover:bg-envi-amarillo group-hover:text-white group-hover:border-envi-amarillo"
                  title="Editar Contacto"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => navigate(`/envios?q=${encodeURIComponent(contact.nombre)}`)}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[24px] bg-gray-50 dark:bg-slate-800 hover:bg-envi-azul text-gray-400 hover:text-white font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-gray-100 dark:border-slate-700 shadow-sm active:scale-95 group-hover:bg-envi-azul group-hover:text-white group-hover:border-envi-azul"
                >
                  Ver Historial de Envíos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
             <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-slate-900 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-slate-800">
                <Users className="w-16 h-16 text-gray-200 dark:text-slate-800 mx-auto mb-6" />
                <p className="text-gray-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] text-sm">No se encontraron contactos</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
