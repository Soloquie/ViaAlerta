import React from 'react';
import { CategoriaReporte } from '../types';
import { CATEGORIAS } from '../data/categories';

interface CategoryIconProps {
  categoria: CategoriaReporte;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoria,
  className = '',
  size = 24,
}) => {
  const cat = CATEGORIAS[categoria] || CATEGORIAS.hueco;
  const color = cat.colorIcono;

  switch (categoria) {
    case 'hueco':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Oval cavity shape representing a pothole */}
          <ellipse cx="12" cy="12" rx="9" ry="5.5" />
          <path d="M7 12c1.5 1.5 4 2 6 1.5" opacity="0.6" strokeWidth="1.8" />
        </svg>
      );

    case 'via_deteriorada':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Broken cracked road lines */}
          <path d="M5 4l3 16" />
          <path d="M19 4l-3 16" />
          <path d="M11 6l2 4-3 4 3 4" strokeWidth="2" />
        </svg>
      );

    case 'inundacion':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Water drop over waves */}
          <path d="M12 2.5a4.5 4.5 0 0 0-4.5 5.5c.8 2.5 4.5 6 4.5 6s3.7-3.5 4.5-6a4.5 4.5 0 0 0-4.5-5.5z" />
          <path d="M4 18c2-1 4-1 6 0s4 1 6 0 3-.7 4 0" />
          <path d="M4 21c2-1 4-1 6 0s4 1 6 0 3-.7 4 0" opacity="0.6" />
        </svg>
      );

    case 'arbol_obstaculo':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Tree / branch obstacle */}
          <path d="M12 21v-7" />
          <path d="M12 14c-3.5 0-6-2.5-6-5.5a5.5 5.5 0 0 1 9.5-3.6A5.5 5.5 0 0 1 18 8.5c0 3-2.5 5.5-6 5.5z" />
        </svg>
      );

    case 'senalizacion':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Traffic sign post / traffic signal */}
          <rect x="7" y="3" width="10" height="13" rx="2" />
          <circle cx="12" cy="6.5" r="1.5" />
          <circle cx="12" cy="11.5" r="1.5" />
          <path d="M12 16v5" />
          <path d="M8 21h8" />
        </svg>
      );

    case 'cierre_via':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Road closure barrier / gate */}
          <rect x="3" y="6" width="18" height="7" rx="1.5" />
          <path d="M6 6l4 7" />
          <path d="M14 6l4 7" />
          <path d="M6 13v7" />
          <path d="M18 13v7" />
        </svg>
      );

    default:
      return null;
  }
};

/**
 * Returns raw SVG string for Leaflet DivIcon HTML
 */
export function getCategorySvgHtml(categoria: CategoriaReporte): string {
  const cat = CATEGORIAS[categoria] || CATEGORIAS.hueco;
  const color = cat.colorIcono;

  switch (categoria) {
    case 'hueco':
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><ellipse cx="12" cy="12" rx="9" ry="5.5"/><path d="M7 12c1.5 1.5 4 2 6 1.5" opacity="0.6"/></svg>`;
    case 'via_deteriorada':
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><path d="M5 4l3 16"/><path d="M19 4l-3 16"/><path d="M11 6l2 4-3 4 3 4"/></svg>`;
    case 'inundacion':
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><path d="M12 3a4 4 0 0 0-4 5c.7 2 4 5.5 4 5.5s3.3-3.5 4-5.5a4 4 0 0 0-4-5z"/><path d="M4 17c2-1 4-1 6 0s4 1 6 0 3-.7 4 0"/><path d="M4 20c2-1 4-1 6 0s4 1 6 0 3-.7 4 0" opacity="0.6"/></svg>`;
    case 'arbol_obstaculo':
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><path d="M12 21v-7"/><path d="M12 14c-3.5 0-6-2.5-6-5.5a5.5 5.5 0 0 1 9.5-3.6A5.5 5.5 0 0 1 18 8.5c0 3-2.5 5.5-6 5.5z"/></svg>`;
    case 'senalizacion':
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><rect x="7" y="3" width="10" height="13" rx="2"/><circle cx="12" cy="6.5" r="1.5"/><circle cx="12" cy="11.5" r="1.5"/><path d="M12 16v5"/><path d="M8 21h8"/></svg>`;
    case 'cierre_via':
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="6" width="18" height="7" rx="1.5"/><path d="M6 6l4 7"/><path d="M14 6l4 7"/><path d="M6 13v7"/><path d="M18 13v7"/></svg>`;
  }
}
