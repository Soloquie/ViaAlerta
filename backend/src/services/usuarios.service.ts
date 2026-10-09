import { prisma } from '../config/prisma.js';
import { conflicto, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { claveZona } from '../utils/geo.js';
import { urlPublica } from '../utils/urls.js';
import { aUsuarioPublico } from './mapeadores.js';
import { crearNotificacion } from './notificaciones.service.js';

type UsuarioBase = {
  id: string; nombre: string; usuario: string; correo: string; telefono: string | null;
  fotoUrl: string | null; ciudad: string | null; biografia: string | null; rol: 'ciudadano' | 'admin';
};

/**
 * Estadísticas del perfil:
 * - alertas: confirmaciones ciudadanas enviadas ("sigue ahí" / "ya fue reparado").
 * - zonas: celdas de ~1 km distintas donde el usuario ha reportado.
 * - incidentes: reportes creados.
 * - actualizaciones: aportes publicados en reportes.
 */
async function estadisticas(usuarioIds: string[]) {
  const [confirmaciones, reportes, aportes] = await Promise.all([
    prisma.confirmacion.groupBy({ by: ['usuarioId'], where: { usuarioId: { in: usuarioIds } }, _count: { _all: true } }),
    prisma.reporte.findMany({ where: { autorId: { in: usuarioIds } }, select: { autorId: true, latitud: true, longitud: true } }),
    prisma.aporte.groupBy({ by: ['autorId'], where: { autorId: { in: usuarioIds } }, _count: { _all: true } }),
  ]);
  const resultado = new Map<string, { alertasCount: number; zonasCount: number; incidentesCount: number; actualizacionesCount: number }>();
  for (const id of usuarioIds) {
    const propios = reportes.filter((r) => r.autorId === id);
    resultado.set(id, {
      alertasCount: confirmaciones.find((c) => c.usuarioId === id)?._count._all ?? 0,
      zonasCount: new Set(propios.map((r) => claveZona(Number(r.latitud), Number(r.longitud)))).size,
      incidentesCount: propios.length,
      actualizacionesCount: aportes.find((a) => a.autorId === id)?._count._all ?? 0,
    });
  }
  return resultado;
}

async function aUsuariosDto(usuarios: UsuarioBase[], usuarioActualId?: string) {
  const ids = usuarios.map((u) => u.id);
  const [stats, seguidos] = await Promise.all([
    estadisticas(ids),
    prisma.seguimientoReporte.findMany({ where: { usuarioId: { in: ids } }, select: { usuarioId: true, reporteId: true } }),
  ]);
  return usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    usuario: aUsuarioPublico(u),
    correo: u.id === usuarioActualId ? u.correo : '',
    telefono: u.id === usuarioActualId ? u.telefono ?? '' : '',
    foto: urlPublica(u.fotoUrl),
    ciudad: u.ciudad ?? '',
    biografia: u.biografia ?? '',
    reportesSeguidos: seguidos.filter((s) => s.usuarioId === u.id).map((s) => s.reporteId),
    ...stats.get(u.id)!,
    esUsuarioActual: u.id === usuarioActualId,
    // El rol solo se informa al propio usuario (habilita el modo demostración en la interfaz).
    rol: u.id === usuarioActualId ? u.rol : undefined,
  }));
}

export type UsuarioDto = Awaited<ReturnType<typeof aUsuariosDto>>[number];

export async function obtenerPerfil(usuarioId: string): Promise<UsuarioDto> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw noEncontrado('El usuario no existe.');
  const [dto] = await aUsuariosDto([usuario], usuarioId);
  return dto;
}

export interface CambiosPerfil {
  nombre?: string;
  usuario?: string;
  correo?: string;
  telefono?: string;
  ciudad?: string;
  biografia?: string;
  fotoUrl?: string;
}

export async function actualizarPerfil(usuarioId: string, cambios: CambiosPerfil): Promise<UsuarioDto> {
  const actual = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!actual) throw noEncontrado('El usuario no existe.');

  const usuario = cambios.usuario?.replace(/^@/, '').trim().toLowerCase();
  const correo = cambios.correo?.trim().toLowerCase();
  if (usuario && usuario !== actual.usuario) {
    const ocupado = await prisma.usuario.findFirst({ where: { usuario, NOT: { id: usuarioId } } });
    if (ocupado) throw conflicto('USUARIO_EN_USO', 'Ese nombre de usuario ya está en uso.');
  }
  if (correo && correo !== actual.correo) {
    const ocupado = await prisma.usuario.findFirst({ where: { correo, NOT: { id: usuarioId } } });
    if (ocupado) throw conflicto('CORREO_EN_USO', 'Ese correo ya está registrado.');
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      nombre: cambios.nombre?.trim(),
      usuario,
      correo,
      telefono: cambios.telefono === undefined ? undefined : cambios.telefono.trim() || null,
      ciudad: cambios.ciudad === undefined ? undefined : cambios.ciudad.trim() || null,
      biografia: cambios.biografia === undefined ? undefined : cambios.biografia.trim() || null,
      fotoUrl: cambios.fotoUrl,
    },
  });
  return obtenerPerfil(usuarioId);
}

/** Ciudadanos para la vista Social: usuarios con al menos un reporte, excluyendo al usuario actual. */
export async function listarComunidad(usuarioActualId: string): Promise<UsuarioDto[]> {
  const usuarios = await prisma.usuario.findMany({
    where: { id: { not: usuarioActualId }, reportes: { some: {} } },
    orderBy: { nombre: 'asc' },
    take: 30,
  });
  const dtos = await aUsuariosDto(usuarios, usuarioActualId);
  return dtos.sort((a, b) => b.incidentesCount - a.incidentesCount);
}

export async function listarSeguidos(usuarioId: string): Promise<string[]> {
  const seguidos = await prisma.seguimientoUsuario.findMany({ where: { seguidorId: usuarioId }, select: { seguidoId: true } });
  return seguidos.map((s) => s.seguidoId);
}

/** Seguir a otro ciudadano. Es idempotente y notifica al usuario seguido la primera vez. */
export async function seguirUsuario(seguidorId: string, seguidoId: string): Promise<string[]> {
  if (seguidorId === seguidoId) throw solicitudInvalida('NO_PUEDE_SEGUIRSE', 'No puedes seguirte a ti mismo.');
  const seguido = await prisma.usuario.findUnique({ where: { id: seguidoId } });
  if (!seguido) throw noEncontrado('El usuario no existe.');
  const existente = await prisma.seguimientoUsuario.findUnique({ where: { seguidorId_seguidoId: { seguidorId, seguidoId } } });
  if (!existente) {
    await prisma.seguimientoUsuario.create({ data: { seguidorId, seguidoId, fecha: new Date() } });
    const seguidor = await prisma.usuario.findUniqueOrThrow({ where: { id: seguidorId } });
    await crearNotificacion({
      usuarioId: seguidoId,
      tipo: 'seguidor',
      titulo: `${seguidor.nombre.split(' ')[0]} empezó a seguirte`,
      mensaje: 'Ahora recibirá las actualizaciones de los daños viales que compartas.',
    });
  }
  return listarSeguidos(seguidorId);
}

export async function dejarDeSeguirUsuario(seguidorId: string, seguidoId: string): Promise<string[]> {
  await prisma.seguimientoUsuario.deleteMany({ where: { seguidorId, seguidoId } });
  return listarSeguidos(seguidorId);
}
