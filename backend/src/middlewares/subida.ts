import multer from 'multer';
import { TAMANO_MAXIMO_IMAGEN } from '../services/archivos.service.js';
import { solicitudInvalida } from '../utils/errores.js';

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Recibe una imagen en memoria (campo `foto`). El contenido real se valida después por firma
 * en `archivos.service`, antes de escribirse en `uploads/`.
 */
export const subirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_IMAGEN, files: 1, fields: 20 },
  fileFilter: (_request, archivo, aceptar) => {
    if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
      aceptar(solicitudInvalida('FORMATO_IMAGEN_INVALIDO', 'Solo se aceptan imágenes JPG, PNG o WebP.'));
      return;
    }
    aceptar(null, true);
  },
}).single('foto');
