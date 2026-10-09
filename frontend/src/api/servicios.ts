import type {
  AlertaVial,
  AporteCiudadano,
  CategoriaReporte,
  NotificacionItem,
  PreferenciasNotificaciones,
  Reporte,
  SeveridadReporte,
  Usuario,
} from '../types';
import { fechaHoraLarga, fechaNotificacion, fechaRelativa } from '../utils/fechas';
import { dataUrlABlob } from '../utils/imageCompressor';
import { guardarToken, solicitar } from './cliente';

// ---------------------------------------------------------------------------
// Normalización: la API entrega fechas ISO; la interfaz muestra texto en español.
// ---------------------------------------------------------------------------

/** Avatar con iniciales para usuarios sin foto de perfil. */
export function avatarPorDefecto(nombre: string): string {
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('') || 'RV';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#0A7FA3"/><text x="40" y="51" font-family="Poppins,Arial,sans-serif" font-size="30" font-weight="700" fill="#ffffff" text-anchor="middle">${iniciales}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

type UsuarioApi = Omit<Usuario, 'foto'> & { foto: string };

function normalizarUsuario(usuario: UsuarioApi): Usuario {
  return { ...usuario, foto: usuario.foto || avatarPorDefecto(usuario.nombre) };
}

type ReporteApi = Omit<Reporte, 'fechaIso'>;

export function normalizarReporte(reporte: ReporteApi): Reporte {
  return {
    ...reporte,
    fechaIso: reporte.fechaHora,
    fechaHora: fechaHoraLarga(reporte.fechaHora),
    autorFoto: reporte.autorFoto || avatarPorDefecto(reporte.autorNombre),
    historial: reporte.historial.map((h) => ({ ...h, fecha: fechaHoraLarga(h.fecha) })),
    aportes: reporte.aportes.map((a: AporteCiudadano) => ({ ...a, fecha: fechaRelativa(a.fecha) })),
  };
}

function normalizarNotificacion(n: NotificacionItem): NotificacionItem {
  return { ...n, fecha: fechaNotificacion(n.fecha, n.grupo) };
}

function normalizarAlerta(a: AlertaVial): AlertaVial {
  return { ...a, fecha: fechaRelativa(a.fecha) };
}

function formularioConFoto(campos: Record<string, string | undefined>, foto?: string | null): FormData {
  const formulario = new FormData();
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor !== undefined) formulario.append(clave, valor);
  }
  if (foto?.startsWith('data:')) {
    const blob = dataUrlABlob(foto);
    const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    formulario.append('foto', blob, `foto.${extension}`);
  }
  return formulario;
}

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

interface SesionApi {
  token: string;
  usuario: UsuarioApi;
}

export async function iniciarSesion(identificador: string, contrasena: string): Promise<Usuario> {
  const sesion = await solicitar<SesionApi>('/auth/login', { metodo: 'POST', cuerpo: { identificador, contrasena } });
  guardarToken(sesion.token);
  return normalizarUsuario(sesion.usuario);
}

export interface DatosRegistro {
  nombre: string;
  usuario: string;
  correo: string;
  contrasena: string;
  aceptoTratamientoDatos: boolean;
}

export async function registrarse(datos: DatosRegistro): Promise<Usuario> {
  const sesion = await solicitar<SesionApi>('/auth/registro', { metodo: 'POST', cuerpo: datos });
  guardarToken(sesion.token);
  return normalizarUsuario(sesion.usuario);
}

export function cerrarSesion(): void {
  guardarToken(null);
}

export async function obtenerUsuarioActual(): Promise<Usuario> {
  return normalizarUsuario(await solicitar<UsuarioApi>('/auth/yo'));
}

export async function cambiarContrasena(actual: string, nueva: string): Promise<void> {
  await solicitar('/auth/contrasena', { metodo: 'PUT', cuerpo: { actual, nueva } });
}

// ---------------------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------------------

export async function listarReportes(): Promise<Reporte[]> {
  return (await solicitar<ReporteApi[]>('/reportes')).map(normalizarReporte);
}

export async function buscarDuplicado(categoria: CategoriaReporte, lat: number, lng: number): Promise<Reporte | null> {
  const { duplicado } = await solicitar<{ duplicado: ReporteApi | null }>('/reportes/duplicados', { consulta: { categoria, lat, lng } });
  return duplicado ? normalizarReporte(duplicado) : null;
}

export interface DatosNuevoReporte {
  categoria: CategoriaReporte;
  subtipo?: string;
  severidad: SeveridadReporte;
  descripcion?: string;
  lat: number;
  lng: number;
  direccion: string;
  foto: string;
  /** Publicar aunque exista un posible duplicado. */
  forzar?: boolean;
}

export async function crearReporte(datos: DatosNuevoReporte): Promise<Reporte> {
  const formulario = formularioConFoto(
    {
      categoria: datos.categoria,
      subtipo: datos.subtipo || undefined,
      severidad: datos.severidad,
      descripcion: datos.descripcion?.trim() || undefined,
      lat: String(datos.lat),
      lng: String(datos.lng),
      direccion: datos.direccion,
      forzar: datos.forzar ? 'true' : undefined,
    },
    datos.foto,
  );
  return normalizarReporte(await solicitar<ReporteApi>('/reportes', { metodo: 'POST', formulario }));
}

export async function confirmarDanio(reporteId: string, tipo: 'sigue' | 'reparado'): Promise<Reporte> {
  return normalizarReporte(await solicitar<ReporteApi>(`/reportes/${reporteId}/confirmaciones`, { metodo: 'POST', cuerpo: { tipo } }));
}

export async function seguirReporte(reporteId: string, seguir: boolean): Promise<Reporte> {
  return normalizarReporte(await solicitar<ReporteApi>(`/reportes/${reporteId}/seguimiento`, { metodo: seguir ? 'POST' : 'DELETE' }));
}

export async function aportarInformacion(reporteId: string, texto: string, foto?: string | null): Promise<Reporte> {
  const formulario = formularioConFoto({ texto }, foto);
  return normalizarReporte(await solicitar<ReporteApi>(`/reportes/${reporteId}/aportes`, { metodo: 'POST', formulario }));
}

export async function avanzarEstadoDemo(reporteId: string): Promise<Reporte> {
  return normalizarReporte(await solicitar<ReporteApi>(`/reportes/${reporteId}/avanzar-estado`, { metodo: 'POST' }));
}

export async function restablecerDatosDemo(): Promise<void> {
  await solicitar('/demo/restablecer', { metodo: 'POST' });
}

// ---------------------------------------------------------------------------
// Perfil y comunidad
// ---------------------------------------------------------------------------

export interface CambiosPerfil {
  nombre: string;
  usuario: string;
  correo: string;
  telefono: string;
  ciudad: string;
  biografia: string;
  foto?: string;
}

export async function actualizarPerfil(cambios: CambiosPerfil): Promise<Usuario> {
  const { foto, ...campos } = cambios;
  const formulario = formularioConFoto(campos, foto);
  return normalizarUsuario(await solicitar<UsuarioApi>('/usuarios/yo', { metodo: 'PATCH', formulario }));
}

export async function listarComunidad(): Promise<Usuario[]> {
  return (await solicitar<UsuarioApi[]>('/usuarios/comunidad')).map(normalizarUsuario);
}

export async function listarSeguidos(): Promise<string[]> {
  return solicitar<string[]>('/usuarios/seguidos');
}

export async function seguirUsuario(usuarioId: string, seguir: boolean): Promise<string[]> {
  return solicitar<string[]>(`/usuarios/${usuarioId}/seguimiento`, { metodo: seguir ? 'POST' : 'DELETE' });
}

// ---------------------------------------------------------------------------
// Notificaciones y noticias
// ---------------------------------------------------------------------------

export async function listarNotificaciones(): Promise<NotificacionItem[]> {
  return (await solicitar<NotificacionItem[]>('/notificaciones')).map(normalizarNotificacion);
}

export async function marcarTodasLeidas(): Promise<void> {
  await solicitar('/notificaciones/leidas', { metodo: 'PATCH' });
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  await solicitar(`/notificaciones/${id}/leida`, { metodo: 'PATCH' });
}

export async function obtenerPreferencias(): Promise<PreferenciasNotificaciones> {
  return solicitar<PreferenciasNotificaciones>('/notificaciones/preferencias');
}

export async function guardarPreferencias(preferencias: PreferenciasNotificaciones): Promise<PreferenciasNotificaciones> {
  return solicitar<PreferenciasNotificaciones>('/notificaciones/preferencias', { metodo: 'PUT', cuerpo: preferencias });
}

export async function listarAlertas(): Promise<AlertaVial[]> {
  return (await solicitar<AlertaVial[]>('/alertas')).map(normalizarAlerta);
}

// ---------------------------------------------------------------------------
// Geocodificación y métricas de uso
// ---------------------------------------------------------------------------

export async function geocodificarInversa(lat: number, lng: number): Promise<string> {
  const { direccion } = await solicitar<{ direccion: string }>('/geocodificacion/inversa', { consulta: { lat, lng } });
  return direccion;
}

export type EventoUso =
  | 'mapa_abierto'
  | 'marcador_tocado'
  | 'reporte_iniciado'
  | 'reporte_paso_completado'
  | 'reporte_publicado'
  | 'reporte_seguido'
  | 'confirmacion_enviada'
  | 'mis_reportes_abierto'
  | 'alerta_abierta';

/** Registra un evento de uso. Nunca interrumpe la interfaz si falla. */
export function registrarEvento(evento: EventoUso, datos?: Record<string, unknown>): void {
  const origen = new URLSearchParams(window.location.search).get('utm_source') ?? undefined;
  const conOrigen = origen ? { ...(datos ?? {}), origen } : datos;
  solicitar('/eventos', { metodo: 'POST', cuerpo: { evento, datos: conOrigen } }).catch(() => undefined);
}

export async function estadoModoDemo(): Promise<boolean> {
  try {
    const { modoDemo } = await solicitar<{ modoDemo: boolean }>('/demo');
    return modoDemo;
  } catch {
    return false;
  }
}
