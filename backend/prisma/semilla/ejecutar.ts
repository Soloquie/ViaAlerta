import bcrypt from 'bcrypt';
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '../../generated/client/index.js';
import { ALERTAS, CATEGORIAS, CONTRASENA_DEMO, NOTIFICACIONES, REPORTES, SEGUIMIENTOS_USUARIO, USUARIO_DEMO_ID, USUARIOS } from './datos.js';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
const DIRECTORIO_IMAGENES = path.join(directorioActual, 'imagenes');

export interface OpcionesSemilla {
  /** Directorio de subida de archivos (por defecto `uploads`, relativo al backend). */
  directorioUploads?: string;
  /**
   * Modo "restablecer datos de prueba": además de restaurar los registros semilla,
   * elimina los reportes creados después de la semilla y reinicia notificaciones,
   * preferencias y seguimientos de los usuarios de demostración.
   */
  restablecerTodo?: boolean;
}

const usuariosConfirmacion = Array.from({ length: 12 }, (_, indice) => ({
  id: `usr_semilla_${indice + 1}`,
  nombre: `Ciudadano semilla ${indice + 1}`,
  usuario: `ciudadano.semilla.${indice + 1}`,
  correo: `ciudadano.semilla.${indice + 1}@ejemplo.edu.co`,
  telefono: null as string | null,
  foto: null as string | null,
  ciudad: 'Armenia, Quindío',
  biografia: 'Usuario de demostración para confirmaciones ciudadanas.',
}));

async function copiarImagenesSemilla(directorioUploads: string) {
  const destino = path.join(directorioUploads, 'seed');
  await mkdir(destino, { recursive: true });
  for (const archivo of await readdir(DIRECTORIO_IMAGENES)) {
    await copyFile(path.join(DIRECTORIO_IMAGENES, archivo), path.join(destino, archivo));
  }
}

/** Fecha relativa a "ahora" en hora de Colombia (UTC-5), convertida a UTC. */
function fechaRelativa(diasAntes: number, horaLocal: number, minutoLocal: number): Date {
  const ahora = new Date();
  const fecha = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), horaLocal + 5, minutoLocal));
  fecha.setUTCDate(fecha.getUTCDate() - diasAntes);
  // Si la hora local aún no ha llegado hoy, se usa la hora actual para no crear fechas futuras.
  return fecha > ahora ? new Date(ahora.getTime() - 60_000) : fecha;
}

export async function ejecutarSemilla(prisma: PrismaClient, opciones: OpcionesSemilla = {}): Promise<void> {
  const directorioUploads = opciones.directorioUploads ?? 'uploads';
  await copiarImagenesSemilla(directorioUploads);

  const contrasenaHash = await bcrypt.hash(CONTRASENA_DEMO, 10);
  const fechaAceptacion = new Date(Date.UTC(2026, 8, 1, 15, 0, 0));
  const todosLosUsuarios = [...USUARIOS, ...usuariosConfirmacion];

  for (const usuario of todosLosUsuarios) {
    const datos = {
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      correo: usuario.correo,
      telefono: usuario.telefono || null,
      fotoUrl: usuario.foto || null,
      ciudad: usuario.ciudad,
      biografia: usuario.biografia,
    };
    await prisma.usuario.upsert({
      where: { id: usuario.id },
      update: opciones.restablecerTodo ? datos : {},
      create: { id: usuario.id, ...datos, contrasenaHash, aceptoTratamientoDatos: true, fechaAceptacionDatos: fechaAceptacion },
    });
    await prisma.preferenciaNotificacion.upsert({
      where: { usuarioId: usuario.id },
      update: opciones.restablecerTodo
        ? { nuevoComentario: true, actualizacionEstado: true, reporteSolucionado: true, reportesCerca: true, respuestasComentarios: true }
        : {},
      create: { usuarioId: usuario.id },
    });
  }

  for (const categoria of CATEGORIAS) {
    const { subtipos, ...datos } = categoria;
    await prisma.categoria.upsert({ where: { id: categoria.id }, update: datos, create: datos });
    for (const [indice, nombre] of subtipos.entries()) {
      const id = `${categoria.id}_${indice + 1}`;
      await prisma.subtipo.upsert({ where: { id }, update: { nombre }, create: { id, categoriaId: categoria.id, nombre } });
    }
  }

  const idsReportes = REPORTES.map((reporte) => reporte.id);
  if (opciones.restablecerTodo) {
    await prisma.reporte.deleteMany({ where: { id: { notIn: [...idsReportes] } } });
  }
  await prisma.historialEstado.deleteMany({ where: { reporteId: { in: [...idsReportes] } } });
  await prisma.confirmacion.deleteMany({ where: { reporteId: { in: [...idsReportes] } } });
  await prisma.seguimientoReporte.deleteMany({ where: { reporteId: { in: [...idsReportes] } } });
  await prisma.aporte.deleteMany({ where: { reporteId: { in: [...idsReportes] } } });

  for (const reporte of REPORTES) {
    const subtipo = reporte.subtipo
      ? await prisma.subtipo.findFirst({ where: { categoriaId: reporte.categoria, nombre: reporte.subtipo } })
      : null;
    const fechaReporte = new Date(reporte.fechaReporte);
    const datos = {
      autorId: reporte.autorId,
      categoriaId: reporte.categoria,
      subtipoId: subtipo?.id ?? null,
      severidad: reporte.severidad,
      descripcion: reporte.descripcion,
      fotoUrl: `/uploads/seed/${reporte.foto}`,
      latitud: reporte.lat,
      longitud: reporte.lng,
      direccion: reporte.direccion,
      estado: reporte.estado,
      fechaReporte,
    };
    await prisma.reporte.upsert({ where: { id: reporte.id }, update: datos, create: { id: reporte.id, ...datos } });

    for (const [indice, entrada] of reporte.historial.entries()) {
      await prisma.historialEstado.create({
        data: { id: `${reporte.id}_hist_${indice + 1}`, reporteId: reporte.id, estado: entrada.estado, mensaje: entrada.mensaje, fecha: new Date(entrada.fecha), cambiadoPorId: null },
      });
    }

    for (const seguidorId of reporte.seguidores) {
      await prisma.seguimientoReporte.create({ data: { usuarioId: seguidorId, reporteId: reporte.id, fecha: fechaReporte } });
    }

    // Confirmaciones: si el usuario de demostración había confirmado, su voto es uno de los contados.
    const votantes: { usuarioId: string; tipo: 'sigue' | 'reparado' }[] = [];
    let restantesSigue: number = reporte.confirmacionesSigue;
    let restantesReparado: number = reporte.confirmacionesReparado;
    if (reporte.usuarioActualConfirmo === 'sigue' && restantesSigue > 0) {
      votantes.push({ usuarioId: USUARIO_DEMO_ID, tipo: 'sigue' });
      restantesSigue -= 1;
    } else if (reporte.usuarioActualConfirmo === 'reparado' && restantesReparado > 0) {
      votantes.push({ usuarioId: USUARIO_DEMO_ID, tipo: 'reparado' });
      restantesReparado -= 1;
    }
    const tipos = [
      ...Array.from({ length: restantesSigue }, () => 'sigue' as const),
      ...Array.from({ length: restantesReparado }, () => 'reparado' as const),
    ];
    tipos.forEach((tipo, indice) => votantes.push({ usuarioId: usuariosConfirmacion[indice].id, tipo }));
    for (const [indice, voto] of votantes.entries()) {
      await prisma.confirmacion.create({
        data: { id: `${reporte.id}_conf_${indice + 1}`, reporteId: reporte.id, usuarioId: voto.usuarioId, tipo: voto.tipo, fecha: fechaReporte },
      });
    }

    for (const aporte of reporte.aportes) {
      const fecha = new Date(fechaReporte.getTime() + aporte.diasDespues * 86_400_000);
      await prisma.aporte.create({ data: { id: aporte.id, reporteId: reporte.id, autorId: aporte.autorId, texto: aporte.texto, fotoUrl: null, fecha } });
    }
  }

  if (opciones.restablecerTodo) {
    const idsDemo = todosLosUsuarios.map((usuario) => usuario.id);
    await prisma.seguimientoUsuario.deleteMany({ where: { seguidorId: { in: idsDemo } } });
    await prisma.notificacion.deleteMany({ where: { usuarioId: { in: idsDemo } } });
  }
  for (const seguimiento of SEGUIMIENTOS_USUARIO) {
    await prisma.seguimientoUsuario.upsert({
      where: { seguidorId_seguidoId: seguimiento },
      update: {},
      create: { ...seguimiento, fecha: fechaRelativa(5, 10, 0) },
    });
  }

  for (const alerta of ALERTAS) {
    const datos = {
      titulo: alerta.titulo,
      descripcion: alerta.descripcion,
      sector: alerta.sector,
      municipio: alerta.municipio,
      latitud: alerta.lat,
      longitud: alerta.lng,
      rutaAlterna: alerta.rutaAlterna,
      lineaEmergencias: alerta.lineaEmergencias,
      hashtag: alerta.hashtag,
      fecha: fechaRelativa(alerta.diasAntes, 8, 42),
    };
    await prisma.alertaVial.upsert({ where: { id: alerta.id }, update: datos, create: { id: alerta.id, ...datos } });
  }

  for (const notificacion of NOTIFICACIONES) {
    const datos = {
      usuarioId: USUARIO_DEMO_ID,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      reporteId: notificacion.reporteId,
      leida: notificacion.leida,
      fecha: fechaRelativa(notificacion.diasAntes, notificacion.horaLocal, notificacion.minutoLocal),
    };
    await prisma.notificacion.upsert({ where: { id: notificacion.id }, update: datos, create: { id: notificacion.id, ...datos } });
  }
}
