/**
 * Cliente HTTP de la API de Reporte Vías.
 * El único dato que se guarda en localStorage es el token de sesión (JWT).
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:4000/api';
const CLAVE_TOKEN = 'reportevias_token';

export class ErrorApi extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly datos: Record<string, unknown> = {},
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

export function obtenerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function guardarToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Navegación privada o almacenamiento bloqueado: la sesión dura lo que dure la pestaña.
  }
}

type Escucha = () => void;
let alExpirarSesion: Escucha | null = null;

/** Permite a la app reaccionar cuando el backend responde 401 (token vencido o inválido). */
export function alCerrarSesionPorExpiracion(escucha: Escucha | null): void {
  alExpirarSesion = escucha;
}

export interface OpcionesSolicitud {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
  formulario?: FormData;
  consulta?: Record<string, string | number | undefined>;
}

export async function solicitar<T>(ruta: string, opciones: OpcionesSolicitud = {}): Promise<T> {
  const url = new URL(`${API_URL}${ruta}`);
  for (const [clave, valor] of Object.entries(opciones.consulta ?? {})) {
    if (valor !== undefined) url.searchParams.set(clave, String(valor));
  }

  const cabeceras: Record<string, string> = {};
  const token = obtenerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  let cuerpo: BodyInit | undefined;
  if (opciones.formulario) {
    cuerpo = opciones.formulario;
  } else if (opciones.cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(opciones.cuerpo);
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(url, { method: opciones.metodo ?? 'GET', headers: cabeceras, body: cuerpo });
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', 'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = datos?.error ?? {};
    if (respuesta.status === 401 && token && error.codigo !== 'CREDENCIALES_INVALIDAS') {
      guardarToken(null);
      alExpirarSesion?.();
    }
    const { codigo, mensaje, ...resto } = error;
    throw new ErrorApi(respuesta.status, codigo ?? 'ERROR', mensaje ?? 'Ocurrió un error inesperado.', resto);
  }
  return datos as T;
}

/** Mensaje legible para mostrar en la interfaz a partir de cualquier error. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}
