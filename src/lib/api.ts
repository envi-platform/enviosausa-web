import toast from 'react-hot-toast';

export async function apiFetch(endpoint: string, options: any = {}) {
  const token = localStorage.getItem('envi_token');
  
  // Base URL para el backend (ej. Cloudflare Pages -> Express en VPS)
  // @ts-ignore
  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.enviosausa.com";
  
  // Only prefix if the endpoint starts with / (and not already http)
  const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const url = isAbsolute ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Get CSRF token from cookie
  const getCsrfToken = () => {
    const name = "XSRF-TOKEN=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
  };

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(['POST', 'PUT', 'DELETE'].includes(options.method || 'GET') ? { 'X-CSRF-TOKEN': getCsrfToken() } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include'
  };

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401 && !url.includes('/api/auth/login')) {
      // Session expired
      localStorage.removeItem('envi_token');
      localStorage.removeItem('envi_user');
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }
    
    return data;
  } catch (error: any) {
    // Only toast on non-background errors if needed, but here we do it generally
    if (!options.silent) {
       toast.error(error.message || 'Error de conexión');
    }
    throw error;
  }
}
