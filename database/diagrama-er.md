# Diagrama entidad-relación

```mermaid
erDiagram
  USUARIOS ||--o{ REPORTES : crea
  CATEGORIAS ||--o{ SUBTIPOS : contiene
  CATEGORIAS ||--o{ REPORTES : clasifica
  SUBTIPOS o|--o{ REPORTES : especifica
  REPORTES ||--o{ HISTORIAL_ESTADOS : tiene
  USUARIOS o|--o{ HISTORIAL_ESTADOS : cambia
  REPORTES ||--o{ CONFIRMACIONES : recibe
  USUARIOS ||--o{ CONFIRMACIONES : emite
  REPORTES ||--o{ SEGUIMIENTOS_REPORTE : es_seguido
  USUARIOS ||--o{ SEGUIMIENTOS_REPORTE : sigue
  USUARIOS ||--o{ SEGUIMIENTOS_USUARIO : seguidor
  USUARIOS ||--o{ SEGUIMIENTOS_USUARIO : seguido
  REPORTES ||--o{ APORTES : recibe
  USUARIOS ||--o{ APORTES : publica
  USUARIOS ||--o{ NOTIFICACIONES : recibe
  REPORTES o|--o{ NOTIFICACIONES : referencia
  USUARIOS ||--|| PREFERENCIAS_NOTIFICACION : configura
  USUARIOS o|--o{ EVENTOS_USO : genera
```

`cache_geocodificacion` y `alertas_viales` son entidades independientes: la primera evita repetir consultas a Nominatim y la segunda conserva avisos viales publicados. La regla de no-autoseguimiento se valida en el servicio de seguimiento; MySQL 8 no permite esa comprobación `CHECK` junto con las dos claves foráneas autorreferentes.
