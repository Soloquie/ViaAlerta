import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/client/index.js';
import { ALERTAS_INICIALES, NOTIFICACIONES_INICIALES, OTROS_USUARIOS, REPORTES_INICIALES, USUARIO_ACTUAL } from '../../frontend/src/data/mockData.js';
import { CATEGORIAS } from '../../frontend/src/data/categories.js';

const prisma = new PrismaClient();
const fechaBase = new Date(Date.UTC(2026, 8, 28, 15, 0, 0));
const fecha = (diasAntes = 0, minutos = 0) => new Date(fechaBase.getTime() - diasAntes * 86_400_000 + minutos * 60_000);
const fotoSemilla = '/uploads/seed/reporte-vial.svg';

async function main() {
  const contrasenaHash = await bcrypt.hash('ReporteVias2026!', 10);
  const usuariosBase = [USUARIO_ACTUAL, ...OTROS_USUARIOS];
  const usuariosConfirmacion = Array.from({ length: 12 }, (_, indice) => ({
    id: `usr_semilla_${indice + 1}`,
    nombre: `Ciudadano semilla ${indice + 1}`,
    usuario: `ciudadano.semilla.${indice + 1}`,
    correo: `ciudadano.semilla.${indice + 1}@ejemplo.edu.co`,
    telefono: null,
    foto: null,
    ciudad: 'Armenia, Quindío',
    biografia: 'Usuario de demostración para confirmaciones ciudadanas.',
  }));

  for (const usuario of [...usuariosBase, ...usuariosConfirmacion]) {
    await prisma.usuario.upsert({
      where: { id: usuario.id },
      update: {},
      create: {
        id: usuario.id,
        nombre: usuario.nombre,
        usuario: usuario.usuario.replace(/^@/, ''),
        correo: usuario.correo,
        telefono: usuario.telefono || null,
        fotoUrl: usuario.foto || null,
        ciudad: usuario.ciudad,
        biografia: usuario.biografia,
        contrasenaHash,
        aceptoTratamientoDatos: true,
        fechaAceptacionDatos: fecha(30),
      },
    });
    await prisma.preferenciaNotificacion.upsert({
      where: { usuarioId: usuario.id },
      update: {},
      create: { usuarioId: usuario.id },
    });
  }

  for (const [orden, categoria] of Object.values(CATEGORIAS).entries()) {
    await prisma.categoria.upsert({
      where: { id: categoria.id },
      update: { nombre: categoria.nombre, descripcion: categoria.descripcion, colorFondo: categoria.colorFondo, colorIcono: categoria.colorIcono, colorBorde: categoria.colorBorde, orden: orden + 1 },
      create: { id: categoria.id, nombre: categoria.nombre, descripcion: categoria.descripcion, colorFondo: categoria.colorFondo, colorIcono: categoria.colorIcono, colorBorde: categoria.colorBorde, orden: orden + 1 },
    });
    for (const [indice, nombre] of (categoria.subtipos || []).entries()) {
      const id = `${categoria.id}_${indice + 1}`;
      await prisma.subtipo.upsert({ where: { id }, update: { nombre }, create: { id, categoriaId: categoria.id, nombre } });
    }
  }

  const idsReportes = REPORTES_INICIALES.map((reporte) => reporte.id);
  await prisma.historialEstado.deleteMany({ where: { reporteId: { in: idsReportes } } });
  await prisma.confirmacion.deleteMany({ where: { reporteId: { in: idsReportes } } });
  await prisma.seguimientoReporte.deleteMany({ where: { reporteId: { in: idsReportes } } });
  await prisma.aporte.deleteMany({ where: { reporteId: { in: idsReportes } } });

  for (const [indiceReporte, reporte] of REPORTES_INICIALES.entries()) {
    const subtipo = reporte.subtipo
      ? await prisma.subtipo.findFirst({ where: { categoriaId: reporte.categoria, nombre: reporte.subtipo } })
      : null;
    const fechaReporte = fecha(16 - indiceReporte, indiceReporte * 11);
    await prisma.reporte.upsert({
      where: { id: reporte.id },
      update: { autorId: reporte.autorId, categoriaId: reporte.categoria, subtipoId: subtipo?.id, severidad: reporte.severidad, descripcion: reporte.descripcion, fotoUrl: fotoSemilla, latitud: reporte.ubicacion.lat, longitud: reporte.ubicacion.lng, direccion: reporte.ubicacion.direccion, estado: reporte.estado, fechaReporte },
      create: { id: reporte.id, autorId: reporte.autorId, categoriaId: reporte.categoria, subtipoId: subtipo?.id, severidad: reporte.severidad, descripcion: reporte.descripcion, fotoUrl: fotoSemilla, latitud: reporte.ubicacion.lat, longitud: reporte.ubicacion.lng, direccion: reporte.ubicacion.direccion, estado: reporte.estado, fechaReporte },
    });
    for (const [indiceHistorial, entrada] of reporte.historial.entries()) {
      await prisma.historialEstado.create({ data: { id: `${reporte.id}_hist_${indiceHistorial + 1}`, reporteId: reporte.id, estado: entrada.estado, mensaje: entrada.mensaje, fecha: fecha(16 - indiceReporte, indiceHistorial * 60), cambiadoPorId: reporte.autorId } });
    }
    for (const seguidorId of reporte.seguidores) {
      await prisma.seguimientoReporte.upsert({ where: { usuarioId_reporteId: { usuarioId: seguidorId, reporteId: reporte.id } }, update: {}, create: { usuarioId: seguidorId, reporteId: reporte.id, fecha: fechaReporte } });
    }
    const tipos = [
      ...Array.from({ length: reporte.confirmacionesSigue }, () => 'sigue' as const),
      ...Array.from({ length: reporte.confirmacionesReparado }, () => 'reparado' as const),
    ];
    for (const [indiceConfirmacion, tipo] of tipos.entries()) {
      const usuarioId = usuariosConfirmacion[indiceConfirmacion].id;
      await prisma.confirmacion.create({ data: { id: `${reporte.id}_conf_${indiceConfirmacion + 1}`, reporteId: reporte.id, usuarioId, tipo, fecha: fechaReporte } });
    }
    for (const [indiceAporte, aporte] of reporte.aportes.entries()) {
      const autor = usuariosBase.find((usuario) => usuario.nombre === aporte.autor) || USUARIO_ACTUAL;
      await prisma.aporte.create({ data: { id: aporte.id, reporteId: reporte.id, autorId: autor.id, texto: aporte.texto, fotoUrl: null, fecha: fecha(8, indiceAporte * 15) } });
    }
  }

  await prisma.seguimientoUsuario.upsert({ where: { seguidorId_seguidoId: { seguidorId: USUARIO_ACTUAL.id, seguidoId: 'usr_curtis' } }, update: {}, create: { seguidorId: USUARIO_ACTUAL.id, seguidoId: 'usr_curtis', fecha: fecha(5) } });

  for (const [indice, alerta] of ALERTAS_INICIALES.entries()) {
    await prisma.alertaVial.upsert({ where: { id: alerta.id }, update: {}, create: { id: alerta.id, titulo: alerta.titulo, descripcion: alerta.descripcion, sector: alerta.sector, municipio: alerta.municipio, latitud: alerta.ubicacion.lat, longitud: alerta.ubicacion.lng, rutaAlterna: alerta.rutaAlterna || null, lineaEmergencias: alerta.lineaEmergencias || null, hashtag: alerta.hashtag || null, fecha: fecha(indice) } });
  }
  for (const [indice, notificacion] of NOTIFICACIONES_INICIALES.entries()) {
    await prisma.notificacion.upsert({ where: { id: notificacion.id }, update: {}, create: { id: notificacion.id, usuarioId: USUARIO_ACTUAL.id, tipo: notificacion.tipo, titulo: notificacion.titulo, mensaje: notificacion.mensaje, reporteId: notificacion.reporteId || null, leida: notificacion.leida, fecha: fecha(indice) } });
  }
  console.info('Seed completado: usuarios, catálogos, 11 reportes, alertas y notificaciones.');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
