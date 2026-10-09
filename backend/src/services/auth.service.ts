import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ErrorApi, conflicto, noAutorizado, solicitudInvalida } from '../utils/errores.js';
import { obtenerPerfil, type UsuarioDto } from './usuarios.service.js';

const RONDAS_BCRYPT = 10;

export interface DatosRegistro {
  nombre: string;
  usuario: string;
  correo: string;
  contrasena: string;
  aceptoTratamientoDatos: boolean;
}

export interface Sesion {
  token: string;
  usuario: UsuarioDto;
}

function firmarToken(usuarioId: string): string {
  return jwt.sign({ sub: usuarioId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRA_EN as jwt.SignOptions['expiresIn'] });
}

/** Devuelve el id del usuario contenido en un token válido o lanza 401. */
export function verificarToken(token: string): string {
  try {
    const carga = jwt.verify(token, env.JWT_SECRET);
    if (typeof carga === 'string' || typeof carga.sub !== 'string') throw new Error('Token sin sujeto');
    return carga.sub;
  } catch {
    throw noAutorizado('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
  }
}

/**
 * Registro de ciudadanos. Exige la autorización de tratamiento de datos (Ley 1581 de 2012)
 * y garantiza que el usuario y el correo sean únicos.
 */
export async function registrar(datos: DatosRegistro): Promise<Sesion> {
  if (!datos.aceptoTratamientoDatos) {
    throw solicitudInvalida('TRATAMIENTO_DATOS_REQUERIDO', 'Debes autorizar el tratamiento de tus datos personales para registrarte.');
  }
  const usuario = datos.usuario.replace(/^@/, '').trim().toLowerCase();
  const correo = datos.correo.trim().toLowerCase();

  const existente = await prisma.usuario.findFirst({ where: { OR: [{ correo }, { usuario }] } });
  if (existente?.correo === correo) throw conflicto('CORREO_EN_USO', 'Ese correo ya está registrado.');
  if (existente) throw conflicto('USUARIO_EN_USO', 'Ese nombre de usuario ya está en uso.');

  const id = randomUUID();
  const ahora = new Date();
  await prisma.usuario.create({
    data: {
      id,
      nombre: datos.nombre.trim(),
      usuario,
      correo,
      contrasenaHash: await bcrypt.hash(datos.contrasena, RONDAS_BCRYPT),
      ciudad: 'Armenia, Quindío',
      aceptoTratamientoDatos: true,
      fechaAceptacionDatos: ahora,
      preferenciasNotificacion: { create: {} },
    },
  });
  return { token: firmarToken(id), usuario: await obtenerPerfil(id) };
}

/** Inicio de sesión con correo o nombre de usuario. */
export async function iniciarSesion(identificador: string, contrasena: string): Promise<Sesion> {
  const valor = identificador.trim().toLowerCase().replace(/^@/, '');
  const usuario = await prisma.usuario.findFirst({ where: { OR: [{ correo: valor }, { usuario: valor }] } });
  const valida = usuario ? await bcrypt.compare(contrasena, usuario.contrasenaHash) : false;
  if (!usuario || !valida) {
    throw new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'El correo/usuario o la contraseña no son correctos.');
  }
  return { token: firmarToken(usuario.id), usuario: await obtenerPerfil(usuario.id) };
}

export async function cambiarContrasena(usuarioId: string, actual: string, nueva: string): Promise<void> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !(await bcrypt.compare(actual, usuario.contrasenaHash))) {
    throw new ErrorApi(400, 'CONTRASENA_ACTUAL_INCORRECTA', 'La contraseña actual no es correcta.');
  }
  await prisma.usuario.update({ where: { id: usuarioId }, data: { contrasenaHash: await bcrypt.hash(nueva, RONDAS_BCRYPT) } });
}
