export interface TrackingRecord {
  fecha: string;
  estado: string;
  ciudad: string;
  descripcion?: string;
}

export interface Envio {
  id: number | string;
  codigo_envi: string;
  remitente_nombre: string;
  destinatario_nombre: string;
  dest_ciu?: string;
  dest_est?: string;
  dest_zip?: string;
  dest_dir?: string;
  estado: string;
  carrier?: string;
  waybill?: string;
  municipio_origen?: string;
  fecha_creacion: string;
  fecha_recepcion: string;
  precio_cliente_q?: number;
  costo_carrier_q?: number;
  ganancia_q?: number;
  tracking?: TrackingRecord[];
}

export interface DashboardStats {
  total_mes: { count: number };
  ingresos: { sum: number };
  margen: { sum: number };
  estados_envio: { estado: string, count: number }[];
  estados: { id: string, value: number }[];
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'agente';
}
