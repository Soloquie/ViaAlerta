-- Se ejecuta automáticamente la primera vez que Docker crea el volumen de MySQL.
-- Si tu contenedor ya existía, ejecútalo una vez a mano (ver README, sección "Pruebas").
CREATE DATABASE IF NOT EXISTS reporte_vias_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON reporte_vias_test.* TO 'reportevias'@'%';
FLUSH PRIVILEGES;
