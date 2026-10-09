/** Error de negocio con código y mensaje en español, convertido a `{ error: { codigo, mensaje } }`. */
export class ErrorApi extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly datos?: Record<string, unknown>,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

export const noEncontrado = (mensaje = 'El recurso solicitado no existe.') => new ErrorApi(404, 'NO_ENCONTRADO', mensaje);
export const noAutorizado = (mensaje = 'Debes iniciar sesión para continuar.') => new ErrorApi(401, 'NO_AUTENTICADO', mensaje);
export const prohibido = (mensaje = 'No tienes permiso para realizar esta acción.') => new ErrorApi(403, 'PROHIBIDO', mensaje);
export const conflicto = (codigo: string, mensaje: string, datos?: Record<string, unknown>) => new ErrorApi(409, codigo, mensaje, datos);
export const solicitudInvalida = (codigo: string, mensaje: string) => new ErrorApi(400, codigo, mensaje);
