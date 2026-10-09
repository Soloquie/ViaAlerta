export type CategoriaReporte = 
  | 'hueco'
  | 'via_deteriorada'
  | 'inundacion'
  | 'arbol_obstaculo'
  | 'senalizacion'
  | 'cierre_via';

export type SeveridadReporte = 'leve' | 'moderado' | 'critico';

export type EstadoReporte = 'reportado' | 'en_revision' | 'en_proceso' | 'solucionado';

export interface HistorialEstado {
  estado: EstadoReporte;
  fecha: string;
  mensaje: string;
}

export interface AporteCiudadano {
  id: string;
  autorId?: string;
  autor: string;
  autorFoto?: string;
  texto: string;
  foto?: string;
  fecha: string;
}

export interface Ubicacion {
  lat: number;
  lng: number;
  direccion: string;
}

export interface Reporte {
  id: string;
  categoria: CategoriaReporte;
  subtipo?: string;
  severidad: SeveridadReporte;
  descripcion: string;
  foto: string;
  ubicacion: Ubicacion;
  fechaHora: string;
  /** Fecha original en ISO (UTC), útil para ordenar. `fechaHora` es el texto ya formateado. */
  fechaIso?: string;
  autorId: string;
  autorNombre: string;
  autorUsuario: string;
  autorFoto: string;
  estado: EstadoReporte;
  historial: HistorialEstado[];
  confirmacionesSigue: number;
  confirmacionesReparado: number;
  /** Calculado por el backend: 3 o más vecinos indicaron "ya fue reparado". */
  comunidadIndicaReparado?: boolean;
  seguidores: string[]; // user IDs
  aportes: AporteCiudadano[];
  usuarioConfirmo?: 'sigue' | 'reparado' | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string; // e.g. @martin.m
  correo: string;
  telefono: string;
  foto: string;
  ciudad: string;
  biografia: string;
  reportesSeguidos: string[]; // reporte IDs
  alertasCount: number;
  zonasCount: number;
  incidentesCount: number;
  actualizacionesCount: number;
  esUsuarioActual?: boolean;
  /** Solo viene para el usuario de la sesión. "admin" habilita el modo demostración. */
  rol?: 'ciudadano' | 'admin';
}

export interface AlertaVial {
  id: string;
  titulo: string;
  descripcion: string;
  sector: string;
  municipio: string;
  ubicacion: { lat: number; lng: number };
  fecha: string;
  rutaAlterna?: string;
  lineaEmergencias?: string;
  hashtag?: string;
}

export interface NotificacionItem {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  grupo: 'hoy' | 'ayer' | 'esta_semana';
  leida: boolean;
  tipo: 'alerta' | 'comentario' | 'verificacion' | 'estado' | 'seguidor';
  reporteId?: string;
}

export interface PreferenciasNotificaciones {
  nuevoComentario: boolean;
  actualizacionEstado: boolean;
  reporteSolucionado: boolean;
  reportesCerca: boolean;
  respuestasComentarios: boolean;
}

export interface CategoriaConfig {
  id: CategoriaReporte;
  nombre: string;
  descripcion: string;
  colorFondo: string;
  colorIcono: string;
  colorBorde: string;
  subtipos?: string[];
}

export interface SeveridadConfig {
  id: SeveridadReporte;
  nombre: string;
  colorTexto: string;
  colorFondo: string;
  colorBorde: string;
}

export interface EstadoConfig {
  id: EstadoReporte;
  nombre: string;
  colorFondo: string;
  colorTexto: string;
  descripcion: string;
}
