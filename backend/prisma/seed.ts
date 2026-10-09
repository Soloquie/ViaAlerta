import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import { ejecutarSemilla } from './semilla/ejecutar.js';

async function main() {
  await ejecutarSemilla(prisma, { directorioUploads: env.DIRECTORIO_UPLOADS });
  console.info('Seed completado: usuarios, catálogos, 11 reportes, alertas y notificaciones.');
  console.info('Usuario de demostración: martin.martinez@email.com / ReporteVias2026!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
