/**
 * sim-assets.ts
 * Authentic SVG card backs and DON!! cards matching OPlayTCG and official One Piece TCG.
 */

export const OPCG_PURPLE_BACK_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#2d2952"/>
      <stop offset="60%" stop-color="#1e1a3d"/>
      <stop offset="100%" stop-color="#120f26"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <!-- Card Base -->
  <rect x="2" y="2" width="296" height="416" rx="16" fill="url(#bgGrad)" stroke="#383363" stroke-width="3"/>
  
  <!-- Outer Gold Border -->
  <rect x="10" y="10" width="280" height="400" rx="12" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.85"/>
  
  <!-- Subtle Nautical Grid Lines -->
  <line x1="150" y1="20" x2="150" y2="400" stroke="#3b3569" stroke-width="0.8" stroke-dasharray="4,4"/>
  <line x1="20" y1="210" x2="280" y2="210" stroke="#3b3569" stroke-width="0.8" stroke-dasharray="4,4"/>

  <!-- Compass Outer Ring -->
  <circle cx="150" cy="180" r="75" fill="none" stroke="url(#gold)" stroke-width="2"/>
  <circle cx="150" cy="180" r="70" fill="none" stroke="url(#gold)" stroke-width="0.8" stroke-dasharray="3,3"/>
  <circle cx="150" cy="180" r="54" fill="#181533" stroke="url(#gold)" stroke-width="1.5"/>

  <!-- Compass Star Points -->
  <!-- North Point (Long) -->
  <polygon points="150,110 156,176 150,180 144,176" fill="url(#gold)"/>
  <!-- South Point -->
  <polygon points="150,250 156,184 150,180 144,184" fill="#a16207"/>
  <!-- East Point -->
  <polygon points="220,180 154,186 150,180 154,174" fill="url(#gold)"/>
  <!-- West Point -->
  <polygon points="80,180 146,186 150,180 146,174" fill="#a16207"/>
  
  <!-- Diagonal Points -->
  <polygon points="199,131 154,177 150,180 148,175" fill="#ca8a04"/>
  <polygon points="101,229 146,183 150,180 152,185" fill="#ca8a04"/>
  <polygon points="101,131 147,175 150,180 146,177" fill="#ca8a04"/>
  <polygon points="199,229 153,185 150,180 154,183" fill="#ca8a04"/>

  <!-- Center Pivot -->
  <circle cx="150" cy="180" r="8" fill="#120f26" stroke="url(#gold)" stroke-width="2"/>

  <!-- Brand Typography -->
  <text x="150" y="290" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="19" text-anchor="middle" letter-spacing="3">ONE PIECE</text>
  <text x="150" y="310" fill="url(#gold)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11" text-anchor="middle" letter-spacing="4">CARD GAME</text>
  
  <!-- Subtle Bottom Brand -->
  <text x="150" y="390" fill="#635b99" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="8" text-anchor="middle" letter-spacing="2">LOG POSE TCG</text>
</svg>
`)}`;

export const OPCG_DON_DECK_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="100%" height="100%">
  <!-- White Card Base -->
  <rect x="2" y="2" width="296" height="416" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="10" y="10" width="280" height="400" rx="12" fill="none" stroke="#0d9488" stroke-width="1.5" opacity="0.6"/>

  <!-- Teal Nautical Compass -->
  <circle cx="150" cy="180" r="65" fill="#f0fdfa" stroke="#0d9488" stroke-width="2"/>
  <circle cx="150" cy="180" r="50" fill="none" stroke="#0d9488" stroke-width="1" stroke-dasharray="3,3"/>

  <!-- Compass Star Points -->
  <polygon points="150,125 155,176 150,180 145,176" fill="#0d9488"/>
  <polygon points="150,235 155,184 150,180 145,184" fill="#14b8a6"/>
  <polygon points="205,180 154,185 150,180 154,175" fill="#0d9488"/>
  <polygon points="95,180 146,185 150,180 146,175" fill="#14b8a6"/>
  <circle cx="150" cy="180" r="7" fill="#f8fafc" stroke="#0d9488" stroke-width="2"/>

  <!-- Typography -->
  <text x="150" y="285" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="18" text-anchor="middle" letter-spacing="2">ONE PIECE</text>
  <text x="150" y="305" fill="#0d9488" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="10" text-anchor="middle" letter-spacing="3">DON!! DECK</text>
</svg>
`)}`;

export const OPCG_DON_CARD_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="100%" height="100%">
  <!-- Card Base -->
  <rect x="2" y="2" width="296" height="416" rx="16" fill="#ffffff" stroke="#000000" stroke-width="4"/>

  <!-- Manga Speed / Explosion Lines -->
  <path d="M 0 0 L 120 160 M 300 0 L 180 160 M 0 420 L 120 260 M 300 420 L 180 260" stroke="#000000" stroke-width="2.5" opacity="0.15"/>
  <path d="M 150 0 L 150 120 M 150 420 L 150 300 M 0 210 L 100 210 M 300 210 L 200 210" stroke="#000000" stroke-width="2" opacity="0.15"/>

  <!-- Bold Black Japanese Katakana: ドン!! -->
  <!-- "ド" -->
  <g fill="#000000">
    <path d="M 85 130 L 110 130 L 110 270 L 85 270 Z"/>
    <path d="M 110 185 C 130 190 155 205 165 245 L 140 255 C 130 225 118 208 110 205 Z"/>
    <!-- Tenten dots -->
    <path d="M 145 135 L 165 145 L 155 165 L 135 155 Z"/>
    <path d="M 160 155 L 180 165 L 170 185 L 150 175 Z"/>
    <!-- "ン" -->
    <path d="M 175 190 L 195 205 L 185 225 L 165 210 Z"/>
    <path d="M 170 255 C 185 240 215 175 220 135 L 245 140 C 235 190 205 260 180 275 Z"/>
    <!-- "!!" -->
    <path d="M 235 135 L 250 135 L 246 220 L 239 220 Z"/>
    <circle cx="243" cy="245" r="7"/>
    <path d="M 255 135 L 270 135 L 266 220 L 259 220 Z"/>
    <circle cx="263" cy="245" r="7"/>
  </g>

  <!-- Gold/Black Bottom Banner -->
  <rect x="15" y="340" width="270" height="55" rx="10" fill="#000000"/>
  <text x="150" y="367" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="16" text-anchor="middle" letter-spacing="2">DON!! +1000</text>
  <text x="150" y="384" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="9" text-anchor="middle" letter-spacing="1">YOUR TURN: GIVE +1000 POWER</text>
</svg>
`)}`;
