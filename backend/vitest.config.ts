import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/preparar-bd.ts'],
    setupFiles: ['tests/entorno.ts'],
    // Todas las pruebas comparten la base de datos de pruebas: se ejecutan en serie.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
