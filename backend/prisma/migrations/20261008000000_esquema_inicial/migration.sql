-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `usuario` VARCHAR(50) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(30) NULL,
    `contrasena_hash` VARCHAR(255) NOT NULL,
    `foto_url` VARCHAR(500) NULL,
    `ciudad` VARCHAR(120) NULL,
    `biografia` VARCHAR(500) NULL,
    `rol` ENUM('ciudadano', 'admin') NOT NULL DEFAULT 'ciudadano',
    `acepto_tratamiento_datos` BOOLEAN NOT NULL,
    `fecha_aceptacion_datos` DATETIME(0) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `color_fondo` VARCHAR(10) NOT NULL,
    `color_icono` VARCHAR(10) NOT NULL,
    `color_borde` VARCHAR(10) NOT NULL,
    `orden` INTEGER NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subtipos` (
    `id` VARCHAR(80) NOT NULL,
    `categoria_id` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    UNIQUE INDEX `subtipos_categoria_id_nombre_key`(`categoria_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reportes` (
    `id` VARCHAR(36) NOT NULL,
    `autor_id` VARCHAR(36) NOT NULL,
    `categoria_id` VARCHAR(50) NOT NULL,
    `subtipo_id` VARCHAR(80) NULL,
    `severidad` ENUM('leve', 'moderado', 'critico') NOT NULL,
    `descripcion` VARCHAR(200) NOT NULL,
    `foto_url` VARCHAR(500) NOT NULL,
    `latitud` DECIMAL(9, 6) NOT NULL,
    `longitud` DECIMAL(9, 6) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `estado` ENUM('reportado', 'en_revision', 'en_proceso', 'solucionado') NOT NULL DEFAULT 'reportado',
    `fecha_reporte` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    INDEX `reportes_categoria_id_estado_idx`(`categoria_id`, `estado`),
    INDEX `reportes_latitud_longitud_idx`(`latitud`, `longitud`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_estados` (
    `id` VARCHAR(36) NOT NULL,
    `reporte_id` VARCHAR(36) NOT NULL,
    `estado` ENUM('reportado', 'en_revision', 'en_proceso', 'solucionado') NOT NULL,
    `mensaje` VARCHAR(255) NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `cambiado_por_id` VARCHAR(36) NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `confirmaciones` (
    `id` VARCHAR(36) NOT NULL,
    `reporte_id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `tipo` ENUM('sigue', 'reparado') NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    UNIQUE INDEX `confirmaciones_reporte_id_usuario_id_key`(`reporte_id`, `usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seguimientos_reporte` (
    `usuario_id` VARCHAR(36) NOT NULL,
    `reporte_id` VARCHAR(36) NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`usuario_id`, `reporte_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seguimientos_usuario` (
    `seguidor_id` VARCHAR(36) NOT NULL,
    `seguido_id` VARCHAR(36) NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`seguidor_id`, `seguido_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- CreateTable
CREATE TABLE `aportes` (
    `id` VARCHAR(36) NOT NULL,
    `reporte_id` VARCHAR(36) NOT NULL,
    `autor_id` VARCHAR(36) NOT NULL,
    `texto` VARCHAR(500) NOT NULL,
    `foto_url` VARCHAR(500) NULL,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificaciones` (
    `id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NOT NULL,
    `tipo` ENUM('alerta', 'comentario', 'verificacion', 'estado', 'seguidor') NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `mensaje` VARCHAR(500) NOT NULL,
    `reporte_id` VARCHAR(36) NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    INDEX `notificaciones_usuario_id_leida_fecha_idx`(`usuario_id`, `leida`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preferencias_notificacion` (
    `usuario_id` VARCHAR(36) NOT NULL,
    `nuevo_comentario` BOOLEAN NOT NULL DEFAULT true,
    `actualizacion_estado` BOOLEAN NOT NULL DEFAULT true,
    `reporte_solucionado` BOOLEAN NOT NULL DEFAULT true,
    `reportes_cerca` BOOLEAN NOT NULL DEFAULT true,
    `respuestas_comentarios` BOOLEAN NOT NULL DEFAULT true,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alertas_viales` (
    `id` VARCHAR(36) NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(1000) NOT NULL,
    `sector` VARCHAR(150) NOT NULL,
    `municipio` VARCHAR(150) NOT NULL,
    `latitud` DECIMAL(9, 6) NOT NULL,
    `longitud` DECIMAL(9, 6) NOT NULL,
    `ruta_alterna` VARCHAR(255) NULL,
    `linea_emergencias` VARCHAR(100) NULL,
    `hashtag` VARCHAR(80) NULL,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache_geocodificacion` (
    `clave` VARCHAR(30) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eventos_uso` (
    `id` VARCHAR(36) NOT NULL,
    `usuario_id` VARCHAR(36) NULL,
    `evento` ENUM('mapa_abierto', 'marcador_tocado', 'reporte_iniciado', 'reporte_paso_completado', 'reporte_publicado', 'reporte_seguido', 'confirmacion_enviada', 'mis_reportes_abierto', 'alerta_abierta') NOT NULL,
    `datos` JSON NULL,
    `fecha` DATETIME(0) NOT NULL,
    `creado_en` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `actualizado_en` DATETIME(0) NOT NULL,

    INDEX `eventos_uso_evento_fecha_idx`(`evento`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subtipos` ADD CONSTRAINT `subtipos_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportes` ADD CONSTRAINT `reportes_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportes` ADD CONSTRAINT `reportes_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportes` ADD CONSTRAINT `reportes_subtipo_id_fkey` FOREIGN KEY (`subtipo_id`) REFERENCES `subtipos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estados` ADD CONSTRAINT `historial_estados_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reportes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estados` ADD CONSTRAINT `historial_estados_cambiado_por_id_fkey` FOREIGN KEY (`cambiado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `confirmaciones` ADD CONSTRAINT `confirmaciones_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reportes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `confirmaciones` ADD CONSTRAINT `confirmaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimientos_reporte` ADD CONSTRAINT `seguimientos_reporte_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimientos_reporte` ADD CONSTRAINT `seguimientos_reporte_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reportes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimientos_usuario` ADD CONSTRAINT `seguimientos_usuario_seguidor_id_fkey` FOREIGN KEY (`seguidor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimientos_usuario` ADD CONSTRAINT `seguimientos_usuario_seguido_id_fkey` FOREIGN KEY (`seguido_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aportes` ADD CONSTRAINT `aportes_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reportes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aportes` ADD CONSTRAINT `aportes_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_reporte_id_fkey` FOREIGN KEY (`reporte_id`) REFERENCES `reportes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preferencias_notificacion` ADD CONSTRAINT `preferencias_notificacion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eventos_uso` ADD CONSTRAINT `eventos_uso_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
