import { CategoriaConfig, CategoriaReporte, EstadoConfig, EstadoReporte, SeveridadConfig, SeveridadReporte } from '../types';

export const CATEGORIAS: Record<CategoriaReporte, CategoriaConfig> = {
  hueco: {
    id: 'hueco',
    nombre: 'Hueco / Bache',
    descripcion: 'Hueco, bache profundo o hundimiento en la calzada',
    colorFondo: '#F6CFCF',
    colorIcono: '#D93B3B',
    colorBorde: '#F0A3A3',
  },
  via_deteriorada: {
    id: 'via_deteriorada',
    nombre: 'Vía deteriorada',
    descripcion: 'Piel de cocodrilo, grietas severas o asfalto desgastado',
    colorFondo: '#FCE7C0',
    colorIcono: '#D99A00',
    colorBorde: '#F5C97A',
  },
  inundacion: {
    id: 'inundacion',
    nombre: 'Inundación',
    descripcion: 'Acumulación de agua o alcantarillado colapsado',
    colorFondo: '#E1E3E5',
    colorIcono: '#2B2D31',
    colorBorde: '#B9BDC4',
    subtipos: ['Calle inundada', 'Alcantarilla desbordada', 'Zona encharcada'],
  },
  arbol_obstaculo: {
    id: 'arbol_obstaculo',
    nombre: 'Árbol / Obstáculo',
    descripcion: 'Árbol caído, ramas, escombros o elementos en la vía',
    colorFondo: '#CFE9F2',
    colorIcono: '#3BA3D0',
    colorBorde: '#9DD4E6',
    subtipos: ['Árbol caído', 'Escombros', 'Objeto en la vía'],
  },
  senalizacion: {
    id: 'senalizacion',
    nombre: 'Señalización dañada',
    descripcion: 'Semáforos apagados/dañados, señales caídas o borradas',
    colorFondo: '#D3EED9',
    colorIcono: '#1E9E4A',
    colorBorde: '#A2DCAC',
    subtipos: ['Semáforo dañado', 'Señal caída o dañada', 'Demarcación borrada'],
  },
  cierre_via: {
    id: 'cierre_via',
    nombre: 'Cierre de vía',
    descripcion: 'Vía cerrada temporalmente por obras, derrumbe o peligro',
    colorFondo: '#FFD1F2',
    colorIcono: '#D63AA8',
    colorBorde: '#F8A5E2',
  },
};

export const SEVERIDADES: Record<SeveridadReporte, SeveridadConfig> = {
  leve: {
    id: 'leve',
    nombre: 'Leve',
    colorTexto: '#1E7E34',
    colorFondo: '#E8F5E9',
    colorBorde: '#A5D6A7',
  },
  moderado: {
    id: 'moderado',
    nombre: 'Moderado',
    colorTexto: '#C05621',
    colorFondo: '#FEEBC8',
    colorBorde: '#FBD38D',
  },
  critico: {
    id: 'critico',
    nombre: 'Crítico',
    colorTexto: '#C53030',
    colorFondo: '#FED7D7',
    colorBorde: '#FEB2B2',
  },
};

export const ESTADOS: Record<EstadoReporte, EstadoConfig> = {
  reportado: {
    id: 'reportado',
    nombre: 'Reportado',
    colorFondo: '#ECEDEF',
    colorTexto: '#464B52',
    descripcion: 'Reporte publicado en el mapa por la comunidad',
  },
  en_revision: {
    id: 'en_revision',
    nombre: 'En revisión',
    colorFondo: '#FFEFD2',
    colorTexto: '#8A5300',
    descripcion: 'Revisión técnica o inspección preliminar programada',
  },
  en_proceso: {
    id: 'en_proceso',
    nombre: 'En proceso',
    colorFondo: '#DCEBFB',
    colorTexto: '#0B5CAD',
    descripcion: 'Intervención en curso o cuadrilla asignada',
  },
  solucionado: {
    id: 'solucionado',
    nombre: 'Solucionado',
    colorFondo: '#DDF3E4',
    colorTexto: '#1B6B3A',
    descripcion: 'Daño vial subsanado y verificado por la comunidad',
  },
};
