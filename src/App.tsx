import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, Box, Users, DollarSign, Settings, Search, LogOut, 
  Menu, X, Bell, Plus, Package, Truck, CheckCircle2, AlertCircle, Printer,
  Sun, Moon, Type, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';

// --- PAGES ---
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Shipments from './pages/Shipments.tsx';
import NewShipment from './pages/NewShipment.tsx';
import Contacts from './pages/Contacts.tsx';
import Finance from './pages/Finance.tsx';
import Config from './pages/Config.tsx';
import PublicTracking from './pages/PublicTracking.tsx';
import Login from './pages/Login.tsx';
import Logo from './components/Logo.tsx';
import NotificationCenter from './components/NotificationCenter.tsx';

// --- AUTH GUARD ---
const AuthGuard = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  // SECURITY NOTE: Currently using localStorage for session persistence.
  // In a production environment, sensitive tokens should be moved to httpOnly cookies 
  // to prevent XSS-based token theft.
  const token = localStorage.getItem('envi_token');
  const userStr = localStorage.getItem('envi_user');
  
  // Validation of stored user data
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
    // Basic sanitization/integrity check
    if (user && (!user.id || !user.rol)) {
       throw new Error('Invalid user data');
    }
  } catch (e) {
    console.warn('Auth Error: Session data corrupted');
    localStorage.removeItem('envi_token');
    localStorage.removeItem('envi_user');
    return <Navigate to="/login" />;
  }

  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.rol)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

// --- LAYOUT ---
const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { mode, toggleMode, fontSize, setFontSize, highContrast, setHighContrast } = useTheme();
  
  // Robust localStorage reading
  const userStr = localStorage.getItem('envi_user');
  const user = React.useMemo(() => {
    try {
      return JSON.parse(userStr || '{}');
    } catch (e) {
      return {};
    }
  }, [userStr]);

  const menuItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard', roles: ['admin'] },
    { name: 'Envíos', icon: Package, path: '/envios', roles: ['admin', 'agente'] },
    { name: 'Contactos', icon: Users, path: '/contactos', roles: ['admin', 'agente'] },
    { name: 'Finanzas', icon: DollarSign, path: '/finanzas', roles: ['admin'] },
    { name: 'Configuración', icon: Settings, path: '/config', roles: ['admin'] },
  ].filter(item => !item.roles || item.roles.includes(user.rol));

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', silent: true });
    } catch (e) {}
    localStorage.removeItem('envi_token');
    localStorage.removeItem('envi_user');
    navigate('/login');
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans bg-surface-bg dark:bg-slate-950 transition-colors duration-500 ${highContrast ? 'high-contrast' : ''}`}>
      {/* Sidebar (Hidden on Mobile) */}
      <aside className={`transition-all duration-300 hidden sm:flex flex-col no-print ${isSidebarOpen ? 'w-64' : 'w-20'} bg-envi-azul shadow-xl z-20`}>
        <div className="p-4 flex items-center justify-between h-24 border-b border-white/10">
          {isSidebarOpen ? (
            <Logo variant="navbar" />
          ) : (
            <Logo variant="symbol" className="w-full flex justify-center" />
          )}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 custom-scrollbar overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all group ${
                location.pathname.startsWith(item.path) 
                  ? 'bg-envi-azul-medio border-l-4 border-envi-amarillo text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${location.pathname.startsWith(item.path) ? 'text-envi-amarillo scale-110' : 'group-hover:scale-110'}`} />
              {isSidebarOpen && <span className="font-montserrat font-semibold text-xs uppercase tracking-wider">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded hover:bg-envi-rojo/20 transition-colors text-white/50 hover:text-red-400 group text-xs font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col custom-scrollbar relative pb-20 sm:pb-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-surface-border dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 no-print transition-colors duration-500">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 sm:ml-0 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-all text-gray-400 hover:text-envi-azul active:scale-95 hidden sm:block">
              <Menu className={`w-5 h-5 transition-transform duration-500 ${isSidebarOpen ? '' : 'rotate-180'}`} />
            </button>
            {/* Mobile Menu Logo */}
            <div className="sm:hidden -ml-2 flex items-center pr-2 border-r border-gray-100 dark:border-slate-800 mr-1">
               <Logo variant="symbol" className="h-6 w-auto" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <div className="hidden sm:block w-1 h-4 bg-envi-azul rounded-full" />
              <h2 className="text-xs sm:text-xs font-montserrat font-black text-envi-azul-2 dark:text-envi-celeste uppercase tracking-widest truncate">
                {menuItems.find(i => location.pathname.startsWith(i.path))?.name || 'Administración'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 font-montserrat">
            <div className="hidden md:flex items-center gap-1 border-r border-gray-100 dark:border-slate-800 pr-4 mr-2">
               <button 
                onClick={toggleMode} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 hover:text-envi-azul"
                title="Cambiar Modo"
               >
                 {mode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-envi-amarillo" />}
               </button>
               <button 
                onClick={() => setHighContrast(!highContrast)} 
                className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors ${highContrast ? 'text-envi-amarillo bg-envi-azul/10' : 'text-gray-500'}`}
                title="Contraste"
               >
                 <Eye className="w-4 h-4" />
               </button>
               <select 
                 value={fontSize}
                 onChange={(e) => setFontSize(e.target.value as any)}
                 className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer focus:ring-0 text-gray-400 dark:text-gray-500"
               >
                 <option value="small">T-P</option>
                 <option value="medium">T-M</option>
                 <option value="large">T-G</option>
               </select>
            </div>
            <NotificationCenter />
            
            {/* Desktop CTA */}
            <Link to="/envios/nuevo" className="hidden sm:flex envi-btn-cta items-center gap-2 py-2 px-6 shadow-envi-amarillo/20 hover:shadow-envi-amarillo/30">
              <Plus className="w-4 h-4" />
              <span>NUEVO ENVÍO</span>
            </Link>
            
            <div className="flex items-center gap-3 sm:pl-4 sm:border-l sm:border-gray-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-envi-azul dark:text-white leading-tight">{user.nombre}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">{user.rol}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-envi-azul text-white flex items-center justify-center text-xs sm:text-sm font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                {user.nombre?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* FAB Mobile (New Shipment) */}
      <Link 
        to="/envios/nuevo" 
        className="sm:hidden fixed bottom-24 right-4 z-50 w-14 h-14 bg-envi-amarillo text-envi-azul rounded-full flex items-center justify-center shadow-lg shadow-envi-amarillo/40 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Bottom Navigation Mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-40 px-2 flex justify-between items-center pb-safe text-[9px] font-bold uppercase tracking-wider text-gray-400 font-montserrat shadow-[0_-10px_20px_rgba(0,0,0,0.05)] transition-colors duration-500">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-envi-azul dark:text-envi-celeste' : 'hover:text-gray-600'}`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-envi-azul/10 dark:bg-envi-celeste/10' : ''}`}>
                 <item.icon className={`w-5 h-5 ${isActive ? 'text-envi-azul dark:text-envi-celeste' : ''}`} />
              </div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

import { Outlet } from 'react-router-dom';
import { apiFetch } from './lib/api.ts';

export default function App() {
  useEffect(() => {
    const initCsrf = async () => {
      try {
        await apiFetch('/api/csrf-token', { silent: true });
      } catch (e) {}
    };
    initCsrf();
  }, []);

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/tracking/:code" element={<PublicTracking />} />
          <Route path="/login" element={<Login />} />

          {/* Private Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<AuthGuard allowedRoles={['admin']}><Dashboard /></AuthGuard>} />
            <Route path="/envios" element={<AuthGuard><Shipments /></AuthGuard>} />
            <Route path="/envios/nuevo" element={<AuthGuard><NewShipment /></AuthGuard>} />
            <Route path="/contactos" element={<AuthGuard><Contacts /></AuthGuard>} />
            <Route path="/finanzas" element={<AuthGuard allowedRoles={['admin']}><Finance /></AuthGuard>} />
            <Route path="/config" element={<AuthGuard allowedRoles={['admin']}><Config /></AuthGuard>} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
