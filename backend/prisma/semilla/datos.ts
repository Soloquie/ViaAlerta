// Datos de demostración migrados desde frontend/src/data/mockData.ts (fase 2).
// Las fechas están en UTC. Los mensajes del historial son simulados: el prototipo no está integrado con entidades públicas.

export const USUARIO_DEMO_ID = 'usr_martin';
export const CONTRASENA_DEMO = 'ReporteVias2026!';

export const USUARIOS = [
  {
    "id": "usr_martin",
    "nombre": "Martín Martínez",
    "usuario": "martin.m",
    "correo": "martin.martinez@email.com",
    "telefono": "+57 612 345 678",
    "foto": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    "ciudad": "Armenia, Quindío",
    "biografia": "Amante de las motos y comprometido con mantener las vías seguras para todos."
  },
  {
    "id": "usr_curtis",
    "nombre": "Curtis Fairhurst",
    "usuario": "CFair",
    "correo": "curtis.fair@email.com",
    "telefono": "+57 311 892 4410",
    "foto": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    "ciudad": "Filandia, Quindío",
    "biografia": "Ciudadano activo que reporta vías dañadas, incidentes urbanos y eventualidades para mejorar la movilidad segura en Quindío."
  },
  {
    "id": "usr_michelle",
    "nombre": "Michelle Bowers",
    "usuario": "bowers",
    "correo": "michelle.b@email.com",
    "telefono": "+57 320 445 9912",
    "foto": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80",
    "ciudad": "Salento, Quindío",
    "biografia": "Ciclista y defensora del espacio vial en el Eje Cafetero. Promoviendo vías sin baches."
  },
  {
    "id": "usr_valentina",
    "nombre": "Valentina Ramos",
    "usuario": "valeramos",
    "correo": "valentina.ramos@email.com",
    "telefono": "+57 315 782 1209",
    "foto": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
    "ciudad": "Calarcá, Quindío",
    "biografia": "Conductora diaria entre Armenia y Calarcá. Reporto obstáculos y semáforos para prevenir accidentes."
  }
];

export const CATEGORIAS = [
  {
    "id": "hueco",
    "nombre": "Hueco / Bache",
    "descripcion": "Hueco, bache profundo o hundimiento en la calzada",
    "colorFondo": "#F6CFCF",
    "colorIcono": "#D93B3B",
    "colorBorde": "#F0A3A3",
    "orden": 1,
    "subtipos": []
  },
  {
    "id": "via_deteriorada",
    "nombre": "Vía deteriorada",
    "descripcion": "Piel de cocodrilo, grietas severas o asfalto desgastado",
    "colorFondo": "#FCE7C0",
    "colorIcono": "#D99A00",
    "colorBorde": "#F5C97A",
    "orden": 2,
    "subtipos": []
  },
  {
    "id": "inundacion",
    "nombre": "Inundación",
    "descripcion": "Acumulación de agua o alcantarillado colapsado",
    "colorFondo": "#E1E3E5",
    "colorIcono": "#2B2D31",
    "colorBorde": "#B9BDC4",
    "orden": 3,
    "subtipos": [
      "Calle inundada",
      "Alcantarilla desbordada",
      "Zona encharcada"
    ]
  },
  {
    "id": "arbol_obstaculo",
    "nombre": "Árbol / Obstáculo",
    "descripcion": "Árbol caído, ramas, escombros o elementos en la vía",
    "colorFondo": "#CFE9F2",
    "colorIcono": "#3BA3D0",
    "colorBorde": "#9DD4E6",
    "orden": 4,
    "subtipos": [
      "Árbol caído",
      "Escombros",
      "Objeto en la vía"
    ]
  },
  {
    "id": "senalizacion",
    "nombre": "Señalización dañada",
    "descripcion": "Semáforos apagados/dañados, señales caídas o borradas",
    "colorFondo": "#D3EED9",
    "colorIcono": "#1E9E4A",
    "colorBorde": "#A2DCAC",
    "orden": 5,
    "subtipos": [
      "Semáforo dañado",
      "Señal caída o dañada",
      "Demarcación borrada"
    ]
  },
  {
    "id": "cierre_via",
    "nombre": "Cierre de vía",
    "descripcion": "Vía cerrada temporalmente por obras, derrumbe o peligro",
    "colorFondo": "#FFD1F2",
    "colorIcono": "#D63AA8",
    "colorBorde": "#F8A5E2",
    "orden": 6,
    "subtipos": []
  }
];

export const REPORTES = [
  {
    "id": "rep_1",
    "autorId": "usr_martin",
    "categoria": "hueco",
    "subtipo": null,
    "severidad": "moderado",
    "descripcion": "Hueco grande en el carril derecho, frente al semáforo. Cuando llueve se llena de agua y no se ve.",
    "foto": "bache.svg",
    "lat": 4.5362,
    "lng": -75.6795,
    "direccion": "Carrera 15 con Calle 4 Norte, Armenia",
    "estado": "en_proceso",
    "fechaReporte": "2026-09-22T22:42:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-22T22:42:00.000Z",
        "mensaje": "Tu reporte se publicó en el mapa."
      },
      {
        "estado": "en_revision",
        "fecha": "2026-09-24T15:15:00.000Z",
        "mensaje": "Revisión simulada: el reporte quedó en cola de inspección."
      },
      {
        "estado": "en_proceso",
        "fecha": "2026-09-28T19:30:00.000Z",
        "mensaje": "Reparación programada para esta semana."
      }
    ],
    "confirmacionesSigue": 12,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_martin",
      "usr_curtis",
      "usr_valentina"
    ],
    "aportes": [
      {
        "id": "ap_1",
        "autorId": "usr_curtis",
        "texto": "Puse señalización reflectiva temporal anoche porque un motociclista casi se cae.",
        "diasDespues": 4
      },
      {
        "id": "ap_2",
        "autorId": "usr_michelle",
        "texto": "La cuadrilla municipal estuvo midiendo la zona esta mañana.",
        "diasDespues": 5
      }
    ],
    "usuarioActualConfirmo": "sigue"
  },
  {
    "id": "rep_2",
    "autorId": "usr_martin",
    "categoria": "inundacion",
    "subtipo": "Alcantarilla desbordada",
    "severidad": "moderado",
    "descripcion": "Rejilla de alcantarilla tapada con sedimentos, el agua cubre toda la esquina en horas de lluvia.",
    "foto": "alcantarilla.svg",
    "lat": 4.5328,
    "lng": -75.6845,
    "direccion": "Calle 21 con Carrera 18, Armenia",
    "estado": "en_revision",
    "fechaReporte": "2026-09-20T21:10:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-20T21:10:00.000Z",
        "mensaje": "Reporte registrado por ciudadano."
      },
      {
        "estado": "en_revision",
        "fecha": "2026-09-23T16:00:00.000Z",
        "mensaje": "Revisión simulada: se programó una inspección de la alcantarilla."
      }
    ],
    "confirmacionesSigue": 4,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_martin",
      "usr_michelle"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_3",
    "autorId": "usr_martin",
    "categoria": "senalizacion",
    "subtipo": "Semáforo dañado",
    "severidad": "leve",
    "descripcion": "Semáforo peatonal parpadea en amarillo intermitente y no cambia de fase.",
    "foto": "semaforo.svg",
    "lat": 4.5412,
    "lng": -75.6741,
    "direccion": "Avenida Bolívar con Calle 10 Norte, Armenia",
    "estado": "reportado",
    "fechaReporte": "2026-09-25T13:15:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-25T13:15:00.000Z",
        "mensaje": "Reporte registrado y visible en la comunidad."
      }
    ],
    "confirmacionesSigue": 1,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_martin"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_4",
    "autorId": "usr_martin",
    "categoria": "via_deteriorada",
    "subtipo": null,
    "severidad": "critico",
    "descripcion": "Tramos enteros con piel de cocodrilo y hundimiento en el carril vehicular derecho.",
    "foto": "asfalto.svg",
    "lat": 4.5468,
    "lng": -75.671,
    "direccion": "Avenida Bolívar frente al Parque Fundadores, Armenia",
    "estado": "solucionado",
    "fechaReporte": "2026-09-15T16:20:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-15T16:20:00.000Z",
        "mensaje": "Reporte creado en la plataforma."
      },
      {
        "estado": "en_revision",
        "fecha": "2026-09-16T14:00:00.000Z",
        "mensaje": "Inspección de vías urbanas realizada."
      },
      {
        "estado": "en_proceso",
        "fecha": "2026-09-18T13:00:00.000Z",
        "mensaje": "Cuadrilla de bacheo y repavimentación en sitio."
      },
      {
        "estado": "solucionado",
        "fecha": "2026-09-19T23:00:00.000Z",
        "mensaje": "Repavimentado con asfalto nuevo terminado y verificado."
      }
    ],
    "confirmacionesSigue": 0,
    "confirmacionesReparado": 8,
    "seguidores": [
      "usr_martin",
      "usr_curtis"
    ],
    "aportes": [
      {
        "id": "ap_sol_1",
        "autorId": "usr_curtis",
        "texto": "El asfalto quedó completamente liso y bien señalizado. ¡Excelente!",
        "diasDespues": 4
      }
    ],
    "usuarioActualConfirmo": "reparado"
  },
  {
    "id": "rep_5",
    "autorId": "usr_curtis",
    "categoria": "arbol_obstaculo",
    "subtipo": "Árbol caído",
    "severidad": "critico",
    "descripcion": "Ramas gruesas de guayacán se desprendieron y obstaculizan el carril lento.",
    "foto": "arbol.svg",
    "lat": 4.5385,
    "lng": -75.677,
    "direccion": "Carrera 14 con Calle 9 Norte, Armenia",
    "estado": "en_proceso",
    "fechaReporte": "2026-09-27T11:51:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-27T11:51:00.000Z",
        "mensaje": "Reporte registrado con prioridad alta."
      },
      {
        "estado": "en_revision",
        "fecha": "2026-09-27T12:30:00.000Z",
        "mensaje": "Cuerpo de Bomberos de Armenia notificado."
      },
      {
        "estado": "en_proceso",
        "fecha": "2026-09-27T13:15:00.000Z",
        "mensaje": "Cuadrilla de poda y remoción en el punto."
      }
    ],
    "confirmacionesSigue": 7,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_curtis",
      "usr_martin"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_6",
    "autorId": "usr_michelle",
    "categoria": "cierre_via",
    "subtipo": null,
    "severidad": "moderado",
    "descripcion": "Cierre preventivo de vía por reparación de tubería madre de acueducto.",
    "foto": "cierre.svg",
    "lat": 4.5295,
    "lng": -75.688,
    "direccion": "Carrera 19 con Calle 26, Armenia",
    "estado": "en_revision",
    "fechaReporte": "2026-09-26T18:40:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-26T18:40:00.000Z",
        "mensaje": "Reportado por comunidad."
      },
      {
        "estado": "en_revision",
        "fecha": "2026-09-26T20:00:00.000Z",
        "mensaje": "Revisión con reguladores de tránsito."
      }
    ],
    "confirmacionesSigue": 5,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_michelle"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_7",
    "autorId": "usr_valentina",
    "categoria": "hueco",
    "subtipo": null,
    "severidad": "critico",
    "descripcion": "Crater en medio del carril de subida. Peligro inminente para motocicletas en la noche.",
    "foto": "bache.svg",
    "lat": 4.5342,
    "lng": -75.6765,
    "direccion": "Calle 2 Norte con Carrera 15, Armenia",
    "estado": "reportado",
    "fechaReporte": "2026-09-25T00:10:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-25T00:10:00.000Z",
        "mensaje": "Reporte registrado y georreferenciado."
      }
    ],
    "confirmacionesSigue": 9,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_valentina"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_8",
    "autorId": "usr_curtis",
    "categoria": "inundacion",
    "subtipo": "Zona encharcada",
    "severidad": "leve",
    "descripcion": "Charco constante por falta de pendiente hacia el sumidero cercano.",
    "foto": "alcantarilla.svg",
    "lat": 4.542,
    "lng": -75.669,
    "direccion": "Avenida Centenario con Calle 2 Norte, Armenia",
    "estado": "en_revision",
    "fechaReporte": "2026-09-23T19:50:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-23T19:50:00.000Z",
        "mensaje": "Reporte registrado."
      },
      {
        "estado": "en_revision",
        "fecha": "2026-09-25T16:30:00.000Z",
        "mensaje": "Programada nivelación de bordillo."
      }
    ],
    "confirmacionesSigue": 3,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_curtis"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_9",
    "autorId": "usr_michelle",
    "categoria": "arbol_obstaculo",
    "subtipo": "Escombros",
    "severidad": "moderado",
    "descripcion": "Montículo de escombros de construcción dejado sobre la berma y parte de la calzada.",
    "foto": "arbol.svg",
    "lat": 4.531,
    "lng": -75.6815,
    "direccion": "Carrera 13 con Calle 19, Armenia",
    "estado": "en_proceso",
    "fechaReporte": "2026-09-21T14:15:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-21T14:15:00.000Z",
        "mensaje": "Reporte publicado."
      },
      {
        "estado": "en_revision",
        "fecha": "2026-09-22T15:00:00.000Z",
        "mensaje": "Control de espacio público notificado."
      },
      {
        "estado": "en_proceso",
        "fecha": "2026-09-24T13:40:00.000Z",
        "mensaje": "Volqueta municipal en camino para recolección."
      }
    ],
    "confirmacionesSigue": 6,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_michelle",
      "usr_martin"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_10",
    "autorId": "usr_valentina",
    "categoria": "senalizacion",
    "subtipo": "Señal caída o dañada",
    "severidad": "leve",
    "descripcion": "Señal de Pare derribada en la esquina luego de choque de vehículo menor.",
    "foto": "semaforo.svg",
    "lat": 4.537,
    "lng": -75.686,
    "direccion": "Carrera 18 con Calle 12, Armenia",
    "estado": "solucionado",
    "fechaReporte": "2026-09-19T20:30:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-19T20:30:00.000Z",
        "mensaje": "Reporte creado."
      },
      {
        "estado": "en_proceso",
        "fecha": "2026-09-20T16:00:00.000Z",
        "mensaje": "Instalación de nueva señal y poste."
      },
      {
        "estado": "solucionado",
        "fecha": "2026-09-21T21:00:00.000Z",
        "mensaje": "Señal de Pare anclada nuevamente."
      }
    ],
    "confirmacionesSigue": 0,
    "confirmacionesReparado": 5,
    "seguidores": [
      "usr_valentina"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  },
  {
    "id": "rep_11",
    "autorId": "usr_curtis",
    "categoria": "via_deteriorada",
    "subtipo": null,
    "severidad": "moderado",
    "descripcion": "Ondulaciones en el asfalto por frenado constante de buses cerca a paradero.",
    "foto": "asfalto.svg",
    "lat": 4.533,
    "lng": -75.678,
    "direccion": "Avenida Ancízar López con Calle 22, Armenia",
    "estado": "reportado",
    "fechaReporte": "2026-09-28T15:05:00.000Z",
    "historial": [
      {
        "estado": "reportado",
        "fecha": "2026-09-28T15:05:00.000Z",
        "mensaje": "Reporte registrado recientemente."
      }
    ],
    "confirmacionesSigue": 2,
    "confirmacionesReparado": 0,
    "seguidores": [
      "usr_curtis"
    ],
    "aportes": [],
    "usuarioActualConfirmo": null
  }
] as const;

export const ALERTAS = [
  {
    "id": "alerta_1",
    "titulo": "Alerta vial en Salento",
    "descripcion": "Un deslizamiento de tierra bloquea parcialmente la vía El Bosque al norte de Circasia. Las autoridades recomiendan transitar con precaución y tomar rutas alternas por Boquía.",
    "sector": "Vía El Bosque, km 4",
    "municipio": "Circasia - Salento, Quindío",
    "lat": 4.618,
    "lng": -75.632,
    "rutaAlterna": "Variante Boquía - Autopista del Café",
    "lineaEmergencias": "123 / Bomberos Quindío",
    "hashtag": "#CircasiaVial",
    "diasAntes": 0
  },
  {
    "id": "alerta_2",
    "titulo": "Paso restringido en Variante Calarcá",
    "descripcion": "Trabajos de estabilización de talud entre el puente Chagualá y la glorieta Versalles. Tráfico a un solo carril con pare y siga continuo de 15 minutos.",
    "sector": "Sector La María - Chagualá",
    "municipio": "Calarcá, Quindío",
    "lat": 4.529,
    "lng": -75.642,
    "rutaAlterna": "Avenida Centenario por Armenia",
    "lineaEmergencias": "#767 Invías",
    "hashtag": "#ArmeniaCalarcá",
    "diasAntes": 1
  }
];

export const NOTIFICACIONES = [
  {
    "id": "notif_1",
    "tipo": "alerta",
    "titulo": "Alerta cerca de tu zona",
    "mensaje": "Se reportó material sobre la vía a 1,2 km de tu ubicación habitual. Transita con precaución.",
    "reporteId": null,
    "leida": false,
    "diasAntes": 0,
    "horaLocal": 8,
    "minutoLocal": 42
  },
  {
    "id": "notif_2",
    "tipo": "comentario",
    "titulo": "Michelle comentó tu reporte",
    "mensaje": "“La cuadrilla municipal estuvo midiendo la zona esta mañana.”",
    "reporteId": "rep_1",
    "leida": false,
    "diasAntes": 0,
    "horaLocal": 7,
    "minutoLocal": 18
  },
  {
    "id": "notif_3",
    "tipo": "verificacion",
    "titulo": "Tu contribución fue verificada",
    "mensaje": "El reporte de bache en Cra 15 pasó a estado \"En proceso\" con trabajos asignados.",
    "reporteId": "rep_1",
    "leida": false,
    "diasAntes": 0,
    "horaLocal": 6,
    "minutoLocal": 51
  },
  {
    "id": "notif_4",
    "tipo": "seguidor",
    "titulo": "Erin empezó a seguirte",
    "mensaje": "Ahora recibirá las actualizaciones de los daños viales que compartas en Armenia.",
    "reporteId": null,
    "leida": true,
    "diasAntes": 1,
    "horaLocal": 18,
    "minutoLocal": 26
  },
  {
    "id": "notif_5",
    "tipo": "estado",
    "titulo": "Reporte solucionado",
    "mensaje": "El tramo en Avenida Bolívar que reportaste fue verificado como solucionado por la comunidad.",
    "reporteId": "rep_4",
    "leida": true,
    "diasAntes": 1,
    "horaLocal": 14,
    "minutoLocal": 10
  },
  {
    "id": "notif_6",
    "tipo": "verificacion",
    "titulo": "Resumen de tu comunidad",
    "mensaje": "4 reportes resueltos y 18 nuevas confirmaciones ciudadanas en Armenia esta semana.",
    "reporteId": null,
    "leida": true,
    "diasAntes": 3,
    "horaLocal": 9,
    "minutoLocal": 0
  }
] as const;

export const SEGUIMIENTOS_USUARIO = [{ seguidorId: 'usr_martin', seguidoId: 'usr_curtis' }];
