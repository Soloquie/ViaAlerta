import { z } from 'zod';

export const nombreUsuarioSchema = z
  .string()
  .trim()
  .transform((valor) => valor.replace(/^@/, '').toLowerCase())
  .pipe(
    z
      .string()
      .min(3, 'El usuario debe tener al menos 3 caracteres.')
      .max(50, 'El usuario puede tener máximo 50 caracteres.')
      .regex(/^[a-z0-9._]+$/, 'El usuario solo puede tener letras, números, puntos y guion bajo.'),
  );

export const registroSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  usuario: nombreUsuarioSchema,
  correo: z.string().trim().toLowerCase().email('Escribe un correo válido.').max(150),
  contrasena: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña puede tener máximo 72 caracteres.')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra.')
    .regex(/\d/, 'La contraseña debe incluir al menos un número.'),
  aceptoTratamientoDatos: z.literal(true, {
    errorMap: () => ({ message: 'Debes autorizar el tratamiento de tus datos personales para registrarte.' }),
  }),
});

export const loginSchema = z.object({
  identificador: z.string().trim().min(1, 'Escribe tu correo o usuario.').max(150),
  contrasena: z.string().min(1, 'Escribe tu contraseña.').max(72),
});

export const cambioContrasenaSchema = z.object({
  actual: z.string().min(1, 'Escribe tu contraseña actual.').max(72),
  nueva: registroSchema.shape.contrasena,
});
