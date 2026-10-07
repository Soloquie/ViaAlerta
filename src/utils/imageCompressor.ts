/**
 * Compresses an image file from camera/gallery into a base64 Data URL
 */
export async function compressImage(file: File, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen seleccionada'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}

/**
 * Creates clean, realistic SVG data URLs representing neutral Colombian road situations:
 * asphalt potholes, road cracks, fallen tree branch, traffic light, puddle/drain.
 * Strict safety: NEVER uses fire or disasters.
 */
export function getNeutralRoadPhoto(type: 'bache' | 'asfalto' | 'arbol' | 'semaforo' | 'alcantarilla' | 'cierre'): string {
  const svgs: Record<string, string> = {
    bache: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4a4d52"/>
          <stop offset="100%" stop-color="#2d3034"/>
        </linearGradient>
        <radialGradient id="hole" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#141518"/>
          <stop offset="70%" stop-color="#25272a"/>
          <stop offset="100%" stop-color="#3d4045"/>
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#bg)"/>
      <!-- Lane marker line -->
      <path d="M 30 130 L 110 130 M 290 130 L 370 130" stroke="#f6cfcf" stroke-dasharray="14 10" stroke-width="4" stroke-opacity="0.6"/>
      <!-- Road texture gravel -->
      <circle cx="80" cy="90" r="2.5" fill="#696c73"/>
      <circle cx="160" cy="50" r="2" fill="#696c73"/>
      <circle cx="320" cy="180" r="3" fill="#696c73"/>
      <circle cx="280" cy="70" r="2.5" fill="#696c73"/>
      <circle cx="90" cy="190" r="2" fill="#696c73"/>
      <!-- Pothole cavity -->
      <ellipse cx="200" cy="140" rx="90" ry="46" fill="url(#hole)" stroke="#1a1c1e" stroke-width="3"/>
      <!-- Pothole debris and deep spot -->
      <ellipse cx="195" cy="145" rx="55" ry="24" fill="#0d0e10"/>
      <path d="M 140 130 Q 180 155 240 138" stroke="#52565c" stroke-width="2" fill="none"/>
      <!-- Street label badge -->
      <rect x="16" y="16" width="130" height="24" rx="12" fill="#000000" fill-opacity="0.55"/>
      <text x="81" y="32" font-family="sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Armenia · Bache</text>
    </svg>`,

    asfalto: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">
      <defs>
        <linearGradient id="asf-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#55585f"/>
          <stop offset="100%" stop-color="#36393e"/>
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#asf-bg)"/>
      <!-- Yellow double center line -->
      <path d="M 0 80 L 400 80" stroke="#f6c343" stroke-width="3"/>
      <path d="M 0 92 L 400 92" stroke="#f6c343" stroke-width="3"/>
      <!-- Alligator cracking lines -->
      <path d="M 120 120 L 160 140 L 150 170 L 190 190 L 230 180 L 260 210 L 310 195" stroke="#1d1e22" stroke-width="3" fill="none"/>
      <path d="M 160 140 L 200 130 L 230 150 L 230 180" stroke="#1d1e22" stroke-width="2.5" fill="none"/>
      <path d="M 150 170 L 180 175 L 190 190" stroke="#1d1e22" stroke-width="2" fill="none"/>
      <path d="M 70 160 L 120 165 L 140 200" stroke="#2a2c31" stroke-width="2" fill="none"/>
      <!-- Label badge -->
      <rect x="16" y="16" width="160" height="24" rx="12" fill="#000000" fill-opacity="0.55"/>
      <text x="96" y="32" font-family="sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Vía con fisuras severas</text>
    </svg>`,

    arbol: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">
      <rect width="400" height="260" fill="#383b40"/>
      <!-- Sidewalk curb -->
      <rect x="0" y="0" width="400" height="70" fill="#7a7e85"/>
      <rect x="0" y="65" width="400" height="10" fill="#9da1a8"/>
      <!-- Fallen branch / foliage on lane -->
      <path d="M 60 150 Q 180 110 320 180" stroke="#5a3825" stroke-width="12" stroke-linecap="round"/>
      <path d="M 150 135 Q 210 160 270 140" stroke="#4a2e1e" stroke-width="8" stroke-linecap="round"/>
      <!-- Leaves -->
      <ellipse cx="140" cy="120" rx="40" ry="25" fill="#2d5a27" opacity="0.85"/>
      <ellipse cx="230" cy="145" rx="50" ry="30" fill="#3b7a33" opacity="0.85"/>
      <ellipse cx="280" cy="165" rx="35" ry="22" fill="#2d5a27" opacity="0.85"/>
      <ellipse cx="180" cy="140" rx="35" ry="20" fill="#4d9a43" opacity="0.85"/>
      <!-- Street line -->
      <line x1="0" y1="230" x2="400" y2="230" stroke="#f6cfcf" stroke-dasharray="16 12" stroke-width="4"/>
      <!-- Label -->
      <rect x="16" y="16" width="165" height="24" rx="12" fill="#000000" fill-opacity="0.55"/>
      <text x="98" y="32" font-family="sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Obstáculo / Rama en vía</text>
    </svg>`,

    semaforo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">
      <rect width="400" height="260" fill="#2d3035"/>
      <!-- Sky corner -->
      <rect x="0" y="0" width="400" height="100" fill="#606975"/>
      <!-- Road intersection -->
      <rect x="0" y="140" width="400" height="120" fill="#3a3d42"/>
      <line x1="0" y1="180" x2="400" y2="180" stroke="#ffffff" stroke-width="5" stroke-dasharray="20 15"/>
      <!-- Traffic light pole -->
      <rect x="230" y="30" width="14" height="170" fill="#8d929b"/>
      <rect x="215" y="40" width="44" height="100" rx="8" fill="#1b1c1e" stroke="#333" stroke-width="2"/>
      <!-- Lights (middle one off/damaged alert) -->
      <circle cx="237" cy="62" r="11" fill="#4a1818"/>
      <circle cx="237" cy="90" r="11" fill="#4a3a14"/>
      <circle cx="237" cy="118" r="11" fill="#14361e"/>
      <!-- Warning cross on signal -->
      <line x1="225" y1="50" x2="249" y2="130" stroke="#e02424" stroke-width="4"/>
      <line x1="249" y1="50" x2="225" y2="130" stroke="#e02424" stroke-width="4"/>
      <!-- Label -->
      <rect x="16" y="16" width="165" height="24" rx="12" fill="#000000" fill-opacity="0.55"/>
      <text x="98" y="32" font-family="sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Semáforo fuera de servicio</text>
    </svg>`,

    alcantarilla: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">
      <rect width="400" height="260" fill="#33363b"/>
      <!-- Water pool reflection -->
      <ellipse cx="200" cy="150" rx="160" ry="70" fill="#1a2e3b" opacity="0.9"/>
      <ellipse cx="190" cy="155" rx="120" ry="50" fill="#143247" opacity="0.8"/>
      <!-- Sewer grate submerged -->
      <rect x="140" y="130" width="100" height="40" rx="4" fill="#222" stroke="#555" stroke-width="2"/>
      <line x1="160" y1="130" x2="160" y2="170" stroke="#666" stroke-width="2"/>
      <line x1="180" y1="130" x2="180" y2="170" stroke="#666" stroke-width="2"/>
      <line x1="200" y1="130" x2="200" y2="170" stroke="#666" stroke-width="2"/>
      <line x1="220" y1="130" x2="220" y2="170" stroke="#666" stroke-width="2"/>
      <!-- Water ripples -->
      <ellipse cx="200" cy="150" rx="80" ry="30" stroke="#5bb0db" stroke-width="2" fill="none" opacity="0.6"/>
      <ellipse cx="200" cy="150" rx="140" ry="55" stroke="#5bb0db" stroke-width="1.5" fill="none" opacity="0.4"/>
      <!-- Label -->
      <rect x="16" y="16" width="165" height="24" rx="12" fill="#000000" fill-opacity="0.55"/>
      <text x="98" y="32" font-family="sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Alcantarilla / Encharcamiento</text>
    </svg>`,

    cierre: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260">
      <rect width="400" height="260" fill="#3a3d42"/>
      <rect x="0" y="0" width="400" height="90" fill="#58616d"/>
      <!-- Road divider -->
      <line x1="0" y1="160" x2="400" y2="160" stroke="#f6c343" stroke-width="4" stroke-dasharray="16 12"/>
      <!-- Barricade -->
      <rect x="80" y="100" width="240" height="30" rx="4" fill="#f43f5e"/>
      <path d="M 90 100 L 110 130 M 130 100 L 150 130 M 170 100 L 190 130 M 210 100 L 230 130 M 250 100 L 270 130 M 290 100 L 310 130" stroke="#ffffff" stroke-width="10"/>
      <!-- Barricade legs -->
      <rect x="100" y="130" width="10" height="70" fill="#444"/>
      <rect x="290" y="130" width="10" height="70" fill="#444"/>
      <!-- Label -->
      <rect x="16" y="16" width="165" height="24" rx="12" fill="#000000" fill-opacity="0.55"/>
      <text x="98" y="32" font-family="sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Cierre preventivo de carril</text>
    </svg>`,
  };

  const svgStr = svgs[type] || svgs.bache;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}
