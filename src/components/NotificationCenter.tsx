import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Info, Package, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface Notification {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  visto: number;
  link?: string;
  created_at: string;
}

export default function NotificationCenter() {
  const { mode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef<number>(0);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/api/notifications', { silent: true });
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.visto).length);

        if (data.data.length > 0) {
          const currentLatest = data.data[0].id;
          
          if (latestIdRef.current > 0 && currentLatest > latestIdRef.current) {
            // New notifications
            const newNotifs = data.data.filter((n: Notification) => n.id > latestIdRef.current);
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              newNotifs.forEach((n: Notification) => {
                new Notification(n.titulo, { body: n.mensaje, icon: '/logo.png' });
              });
            }
          }
          if (currentLatest > latestIdRef.current) {
            latestIdRef.current = currentLatest;
          }
        }
      }
    } catch (err) {
      // Silently catch polling errors during server restarts
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        silent: true
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };
  
  const markAllAsRead = async () => {
     let markPromises = notifications.filter(n => !n.visto).map(n => markAsRead(n.id));
     await Promise.all(markPromises);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'shipment_update': return <Package className="w-5 h-5 text-envi-azul" />;
      case 'delay': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'task': return <AlertCircle className="w-5 h-5 text-envi-amarillo" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggleOpen}
        className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-[16px] transition-all text-gray-400 hover:text-envi-azul active:scale-95"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-4 w-[380px] bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-envi-azul/10 z-50 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-800 dark:text-gray-200">Centro de Notificaciones</h3>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                   <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center">
                    <Bell className="w-12 h-12 text-gray-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bandeja Vacía</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-slate-800">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${!n.visto ? 'bg-blue-50/30 dark:bg-envi-azul/5' : ''}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        {!n.visto && <div className="absolute left-0 top-0 bottom-0 w-1 bg-envi-azul" />}
                        <div className="flex gap-4">
                          <div className={`mt-0.5 p-2 rounded-xl border ${n.tipo === 'delay' ? 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm'}`}>
                             {getIcon(n.tipo)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-[13px] font-bold tracking-tight ${!n.visto ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>{n.titulo}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 leading-snug">{n.mensaje}</p>
                            <div className="flex items-center gap-1.5 mt-3 text-gray-400 group-hover:text-envi-azul dark:group-hover:text-envi-celeste transition-colors">
                               <Clock className="w-3.5 h-3.5" />
                               <p className="text-[10px] font-bold uppercase tracking-widest">
                                 {format(new Date(n.created_at), "dd MMM, HH:mm", { locale: es })}
                               </p>
                            </div>
                          </div>
                          {!n.visto && (
                             <div className="w-2.5 h-2.5 bg-envi-azul rounded-full flex-shrink-0 mt-2 shadow-sm" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                 <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 text-center">
                   <button 
                     className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-envi-azul transition-colors py-2 px-4 rounded-xl hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                     onClick={markAllAsRead}
                   >
                     Marcar todas como leídas
                   </button>
                 </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
