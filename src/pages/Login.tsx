import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Globe, Shield, ArrowLeft, Sun, Moon } from 'lucide-react';
import Logo from '../components/Logo.tsx';
import { apiFetch } from '../lib/api.ts';
import { useTheme } from '../context/ThemeContext.tsx';

export default function Login() {
  const { mode, toggleMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, ingresa correo y contraseña');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Correo electrónico inválido');
      return;
    }

    setLoading(true);
    
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        silent: true 
      });
      
      if (data.success) {
        localStorage.setItem('envi_token', data.data.token);
        localStorage.setItem('envi_user', JSON.stringify(data.data.user));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Theme Toggle in Login */}
      <button 
        onClick={toggleMode}
        className="absolute top-8 right-8 p-3 bg-white dark:bg-slate-900 shadow-xl rounded-full text-gray-400 hover:text-envi-azul transition-all active:scale-95 border border-gray-100 dark:border-slate-800 z-50"
      >
        {mode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-envi-amarillo" />}
      </button>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-envi-azul transition-colors group z-20"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Regresar al Inicio
      </Link>

      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-envi-azul/5 dark:bg-envi-azul/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-envi-amarillo/5 dark:bg-envi-amarillo/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-[440px] w-full relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-envi-azul/5 overflow-hidden border border-gray-100 dark:border-slate-800">
          <div className="p-10">
            <div className="flex flex-col items-center mb-10">
              <div className="mb-8 scale-125">
                 <Logo variant="full" />
              </div>
              <h1 className="text-2xl font-black text-[#2C2C2C] dark:text-white tracking-tight mb-1 font-montserrat">SISTEMA INTERNO</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Gestión Logística Internacional</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-300 group-focus-within:text-envi-azul transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:border-envi-azul outline-none transition-all text-gray-700 dark:text-white placeholder:text-gray-300 font-bold"
                    placeholder="usuario@envi.gt"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-300 group-focus-within:text-envi-azul transition-colors" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:border-envi-azul outline-none transition-all text-gray-700 dark:text-white placeholder:text-gray-300 font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 text-[11px] rounded-xl border border-red-100 dark:border-red-900/30 font-bold text-center uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-envi-azul text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-envi-azul/90 active:scale-95 transition-all shadow-xl shadow-envi-azul/20 disabled:opacity-50 uppercase flex items-center justify-center gap-3 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    INGRESAR AL PANEL
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between px-10">
             <div className="flex items-center gap-2 text-[9px] text-gray-400 font-black uppercase tracking-widest">
                <Globe className="w-3 h-3" />
                GUATEMALA
             </div>
             <span className="text-[9px] text-gray-300 dark:text-slate-600 font-bold uppercase tracking-widest">v2.4.0</span>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] text-gray-400 font-medium px-10 leading-relaxed uppercase tracking-widest">
          Propiedad exclusiva de <span className="font-black text-gray-500 dark:text-gray-300">ENVI Internacional S.A.</span> Prohibido el acceso no autorizado.
        </p>
      </div>
    </div>
  );
}
