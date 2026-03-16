(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();const I=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="archerTunic" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4a6b3a"/>
      <stop offset="50%" style="stop-color:#3d5a2e"/>
      <stop offset="100%" style="stop-color:#2d4422"/>
    </linearGradient>
    <linearGradient id="archerBow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b6914"/>
      <stop offset="50%" style="stop-color:#6b4a0a"/>
      <stop offset="100%" style="stop-color:#4a3008"/>
    </linearGradient>
    <linearGradient id="archerSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8c4a0"/>
      <stop offset="100%" style="stop-color:#c9a67a"/>
    </linearGradient>
    <linearGradient id="archerHood" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#5c4033"/>
      <stop offset="100%" style="stop-color:#3d2818"/>
    </linearGradient>
  </defs>
  <!-- Legs -->
  <rect x="22" y="48" width="6" height="14" rx="2" fill="url(#archerTunic)"/>
  <rect x="36" y="48" width="6" height="14" rx="2" fill="url(#archerTunic)"/>
  <!-- Tunic/body -->
  <path d="M20 28 L44 28 L42 52 L22 52 Z" fill="url(#archerTunic)"/>
  <path d="M22 28 L26 52 M42 28 L38 52" stroke="#2d4422" stroke-width="1" fill="none"/>
  <!-- Belt -->
  <rect x="20" y="40" width="24" height="4" fill="#4a3008"/>
  <!-- Arms - drawing bow -->
  <path d="M44 24 Q52 20 56 28 Q52 36 44 32" stroke="url(#archerBow)" stroke-width="3" fill="none"/>
  <path d="M20 24 Q12 20 8 28 Q12 36 20 32" stroke="url(#archerBow)" stroke-width="3" fill="none"/>
  <!-- Bow string -->
  <line x1="8" y1="28" x2="56" y2="28" stroke="#ddd" stroke-width="0.5"/>
  <!-- Arrow nocked -->
  <line x1="32" y1="52" x2="32" y2="12" stroke="#8b6914" stroke-width="1.5"/>
  <!-- Head/hood -->
  <ellipse cx="32" cy="18" rx="10" ry="12" fill="url(#archerHood)"/>
  <ellipse cx="32" cy="16" rx="6" ry="7" fill="url(#archerSkin)"/>
  <!-- Face -->
  <ellipse cx="30" cy="15" rx="1" ry="1.5" fill="#2a1810"/>
  <ellipse cx="34" cy="15" rx="1" ry="1.5" fill="#2a1810"/>
  <!-- Quiver -->
  <path d="M18 20 L22 20 L24 50 L16 50 Z" fill="url(#archerTunic)" opacity="0.8"/>
  <line x1="18" y1="28" x2="22" y2="28" stroke="#2d4422" stroke-width="0.5"/>
  <line x1="18" y1="36" x2="22" y2="36" stroke="#2d4422" stroke-width="0.5"/>
</svg>
`,H=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="arrowShaft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8b6914"/>
      <stop offset="30%" style="stop-color:#a08020"/>
      <stop offset="70%" style="stop-color:#6b4a0a"/>
      <stop offset="100%" style="stop-color:#4a3008"/>
    </linearGradient>
    <linearGradient id="arrowHead" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" style="stop-color:#c0c0c0"/>
      <stop offset="50%" style="stop-color:#e8e8e8"/>
      <stop offset="100%" style="stop-color:#808080"/>
    </linearGradient>
    <linearGradient id="arrowFeather" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#8b4513"/>
      <stop offset="30%" style="stop-color:#a0522d"/>
      <stop offset="70%" style="stop-color:#654321"/>
      <stop offset="100%" style="stop-color:#3d2817"/>
    </linearGradient>
  </defs>
  <!-- Shaft -->
  <rect x="8" y="30" width="44" height="4" rx="1" fill="url(#arrowShaft)"/>
  <!-- Arrowhead -->
  <path d="M52 32 L64 24 L64 40 Z" fill="url(#arrowHead)"/>
  <path d="M52 32 L64 24 L64 40 Z" fill="none" stroke="#606060" stroke-width="0.5"/>
  <!-- Fletching - feathers -->
  <path d="M8 32 L0 24 Q4 32 0 40 Z" fill="url(#arrowFeather)"/>
  <path d="M8 32 L0 28 Q2 32 0 36 Z" fill="url(#arrowFeather)" opacity="0.9"/>
  <path d="M8 32 L0 26 Q3 32 0 38 Z" fill="url(#arrowFeather)" opacity="0.85"/>
</svg>
`,O=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="castleStone" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8a8a8a"/>
      <stop offset="30%" style="stop-color:#6a6a6a"/>
      <stop offset="70%" style="stop-color:#5a5a5a"/>
      <stop offset="100%" style="stop-color:#4a4a4a"/>
    </linearGradient>
    <linearGradient id="castleStoneDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6a6a6a"/>
      <stop offset="100%" style="stop-color:#3a3a3a"/>
    </linearGradient>
    <linearGradient id="castleMortar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#9a8a7a"/>
      <stop offset="100%" style="stop-color:#6a5a4a"/>
    </linearGradient>
    <pattern id="brickPattern" width="8" height="4" patternUnits="userSpaceOnUse">
      <rect width="8" height="4" fill="none"/>
      <line x1="0" y1="4" x2="8" y2="4" stroke="#5a4a3a" stroke-width="0.5"/>
      <line x1="4" y1="0" x2="4" y2="4" stroke="#5a4a3a" stroke-width="0.5"/>
    </pattern>
  </defs>
  <!-- Ground/base -->
  <rect x="0" y="56" width="64" height="8" fill="url(#castleStoneDark)"/>
  <!-- Main wall - battlement at bottom -->
  <rect x="0" y="20" width="64" height="36" fill="url(#castleStone)"/>
  <!-- Stone blocks pattern -->
  <rect x="2" y="22" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="16" y="22" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="36" y="22" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="50" y="22" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="2" y="32" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="16" y="32" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="36" y="32" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="50" y="32" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="2" y="42" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="16" y="42" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="36" y="42" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <rect x="50" y="42" width="12" height="8" rx="1" fill="url(#castleStoneDark)"/>
  <!-- Mortar lines -->
  <rect x="14" y="20" width="2" height="36" fill="url(#castleMortar)"/>
  <rect x="34" y="20" width="2" height="36" fill="url(#castleMortar)"/>
  <rect x="48" y="20" width="2" height="36" fill="url(#castleMortar)"/>
  <!-- Crenellations -->
  <rect x="0" y="56" width="64" height="4" fill="url(#castleStone)"/>
  <rect x="4" y="52" width="8" height="8" fill="url(#castleStone)"/>
  <rect x="4" y="52" width="8" height="4" fill="url(#castleStoneDark)"/>
  <rect x="20" y="52" width="8" height="8" fill="url(#castleStone)"/>
  <rect x="20" y="52" width="8" height="4" fill="url(#castleStoneDark)"/>
  <rect x="36" y="52" width="8" height="8" fill="url(#castleStone)"/>
  <rect x="36" y="52" width="8" height="4" fill="url(#castleStoneDark)"/>
  <rect x="52" y="52" width="8" height="8" fill="url(#castleStone)"/>
  <rect x="52" y="52" width="8" height="4" fill="url(#castleStoneDark)"/>
  <!-- Arrow slits -->
  <rect x="6" y="36" width="2" height="12" fill="#1a1a1a"/>
  <rect x="30" y="36" width="2" height="12" fill="#1a1a1a"/>
  <rect x="56" y="36" width="2" height="12" fill="#1a1a1a"/>
</svg>
`,U=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <radialGradient id="armageddonCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="30%" style="stop-color:#ffaa00"/>
      <stop offset="60%" style="stop-color:#ff4400"/>
      <stop offset="100%" style="stop-color:#880000"/>
    </radialGradient>
    <radialGradient id="armageddonFlame" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ff6600;stop-opacity:0.9"/>
      <stop offset="50%" style="stop-color:#cc3300;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#660000;stop-opacity:0"/>
    </radialGradient>
    <linearGradient id="armageddonTrail" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#440000;stop-opacity:0"/>
      <stop offset="50%" style="stop-color:#ff4400;stop-opacity:0.5"/>
      <stop offset="100%" style="stop-color:#ffaa00;stop-opacity:0.8"/>
    </linearGradient>
  </defs>
  <!-- Meteor trail -->
  <ellipse cx="24" cy="38" rx="12" ry="6" fill="url(#armageddonTrail)"/>
  <!-- Fireball body -->
  <circle cx="24" cy="24" r="18" fill="url(#armageddonCore)"/>
  <!-- Flame wisps -->
  <path d="M12 20 Q8 24 14 28 Q10 26 12 20" fill="url(#armageddonFlame)"/>
  <path d="M36 20 Q40 24 34 28 Q38 26 36 20" fill="url(#armageddonFlame)"/>
  <path d="M20 10 Q24 6 28 10 Q24 12 20 10" fill="url(#armageddonFlame)"/>
  <path d="M24 32 Q20 38 26 40 Q24 36 24 32" fill="url(#armageddonFlame)"/>
  <!-- Inner glow -->
  <circle cx="24" cy="24" r="8" fill="#ffffff" opacity="0.5"/>
</svg>
`,Z=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="blizzardWind" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" style="stop-color:#aaddff;stop-opacity:0.3"/>
      <stop offset="50%" style="stop-color:#66bbff;stop-opacity:0.7"/>
      <stop offset="100%" style="stop-color:#2288cc;stop-opacity:0.3"/>
    </linearGradient>
    <radialGradient id="blizzardCenter" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:#66bbff;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <!-- Swirling wind arcs -->
  <path d="M8 24 Q24 8 40 24 Q24 40 8 24" fill="none" stroke="url(#blizzardWind)" stroke-width="4"/>
  <path d="M12 24 Q24 12 36 24 Q24 36 12 24" fill="none" stroke="url(#blizzardWind)" stroke-width="3"/>
  <path d="M16 24 Q24 16 32 24 Q24 32 16 24" fill="none" stroke="#88ccff" stroke-width="2" opacity="0.8"/>
  <!-- Center glow -->
  <circle cx="24" cy="24" r="6" fill="url(#blizzardCenter)"/>
  <!-- Snowflakes -->
  <path d="M10 12 L10 16 M8 14 L12 14 M9 11 L11 15 M11 11 L9 15" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M38 14 L38 18 M36 16 L40 16 M37 13 L39 17 M39 13 L37 17" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M14 36 L14 40 M12 38 L16 38 M13 35 L15 39 M15 35 L13 39" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M34 38 L34 42 M32 40 L36 40 M33 37 L35 41 M35 37 L33 41" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M24 6 L24 10 M22 8 L26 8" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M24 40 L24 44 M22 42 L26 42" stroke="#ffffff" stroke-width="0.8"/>
</svg>
`,j=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="freezeIce" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#aaddff"/>
      <stop offset="50%" style="stop-color:#66bbff"/>
      <stop offset="100%" style="stop-color:#2288cc"/>
    </linearGradient>
    <linearGradient id="freezeCrystal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="40%" style="stop-color:#88ccff"/>
      <stop offset="100%" style="stop-color:#4488bb"/>
    </linearGradient>
  </defs>
  <!-- Snowflake - 6 main branches -->
  <path d="M24 2 L24 14 M24 34 L24 46" stroke="url(#freezeIce)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M14 8 L22 16 M26 20 L34 28" stroke="url(#freezeIce)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M34 8 L26 16 M22 20 L14 28" stroke="url(#freezeIce)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M8 14 L16 22 M20 26 L28 34" stroke="url(#freezeIce)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M40 14 L32 22 M28 26 L20 34" stroke="url(#freezeIce)" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Side branches -->
  <path d="M18 10 L20 12 M28 12 L30 10" stroke="url(#freezeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M18 38 L20 36 M28 36 L30 38" stroke="url(#freezeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M10 18 L12 20 M12 28 L10 30" stroke="url(#freezeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M38 18 L36 20 M36 28 L38 30" stroke="url(#freezeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Center crystal -->
  <polygon points="24,18 28,26 24,30 20,26" fill="url(#freezeCrystal)"/>
</svg>
`,q=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="healGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#88dd88"/>
      <stop offset="50%" style="stop-color:#44aa44"/>
      <stop offset="100%" style="stop-color:#228822"/>
    </linearGradient>
    <linearGradient id="healCross" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#aaffaa"/>
      <stop offset="100%" style="stop-color:#44aa44"/>
    </linearGradient>
  </defs>
  <!-- Heart shape -->
  <path d="M24 40 C24 40 8 28 8 18 C8 12 12 8 18 8 C22 8 24 12 24 12 C24 12 26 8 30 8 C36 8 40 12 40 18 C40 28 24 40 24 40 Z" fill="url(#healGreen)"/>
  <!-- Cross overlay -->
  <rect x="21" y="14" width="6" height="20" rx="2" fill="url(#healCross)"/>
  <rect x="14" y="21" width="20" height="6" rx="2" fill="url(#healCross)"/>
  <!-- Plus sign highlight -->
  <rect x="22" y="16" width="4" height="16" fill="#ccffcc" opacity="0.5"/>
  <rect x="16" y="22" width="16" height="4" fill="#ccffcc" opacity="0.5"/>
</svg>
`,V=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="prepLightning" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffff88"/>
      <stop offset="50%" style="stop-color:#ffdd00"/>
      <stop offset="100%" style="stop-color:#ffaa00"/>
    </linearGradient>
    <linearGradient id="prepGlow" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffcc;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#ffcc00;stop-opacity:0"/>
    </linearGradient>
  </defs>
  <!-- Energy glow -->
  <ellipse cx="24" cy="24" rx="20" ry="20" fill="url(#prepGlow)"/>
  <!-- Lightning bolt -->
  <path d="M28 4 L18 24 L24 24 L16 44 L30 22 L24 22 Z" fill="url(#prepLightning)"/>
  <path d="M28 4 L18 24 L24 24 L16 44 L30 22 L24 22 Z" fill="none" stroke="#cc8800" stroke-width="0.5"/>
</svg>
`,$=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="standShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffdd66"/>
      <stop offset="30%" style="stop-color:#ffcc00"/>
      <stop offset="70%" style="stop-color:#cc9900"/>
      <stop offset="100%" style="stop-color:#996600"/>
    </linearGradient>
    <linearGradient id="standStar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="50%" style="stop-color:#ffdd00"/>
      <stop offset="100%" style="stop-color:#ffaa00"/>
    </linearGradient>
    <filter id="standGlow">
      <feGaussianBlur stdDeviation="1" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Shield shape -->
  <path d="M24 4 L44 12 L44 24 Q44 36 24 44 Q4 36 4 24 L4 12 Z" fill="url(#standShield)" filter="url(#standGlow)"/>
  <path d="M24 4 L44 12 L44 24 Q44 36 24 44 Q4 36 4 24 L4 12 Z" fill="none" stroke="#996600" stroke-width="1"/>
  <!-- Star -->
  <polygon points="24,14 26,22 34,22 28,28 30,36 24,32 18,36 20,28 14,22 22,22" fill="url(#standStar)"/>
</svg>
`,J=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="volleyArrow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8b6914"/>
      <stop offset="100%" style="stop-color:#4a3008"/>
    </linearGradient>
    <linearGradient id="volleyHead" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" style="stop-color:#c0c0c0"/>
      <stop offset="100%" style="stop-color:#808080"/>
    </linearGradient>
  </defs>
  <!-- Center arrow (vertical) -->
  <rect x="22" y="8" width="4" height="20" rx="1" fill="url(#volleyArrow)"/>
  <path d="M24 28 L28 36 L24 32 L20 36 Z" fill="url(#volleyHead)"/>
  <!-- Left arrows - fan pattern -->
  <g transform="rotate(-25 24 24)">
    <rect x="10" y="18" width="3" height="14" rx="1" fill="url(#volleyArrow)"/>
    <path d="M11.5 32 L14 38 L11.5 35 L9 38 Z" fill="url(#volleyHead)"/>
  </g>
  <g transform="rotate(-45 24 24)">
    <rect x="6" y="20" width="3" height="12" rx="1" fill="url(#volleyArrow)"/>
    <path d="M7.5 32 L10 36 L7.5 34 L5 36 Z" fill="url(#volleyHead)"/>
  </g>
  <!-- Right arrows - fan pattern -->
  <g transform="rotate(25 24 24)">
    <rect x="35" y="18" width="3" height="14" rx="1" fill="url(#volleyArrow)"/>
    <path d="M36.5 32 L34 38 L36.5 35 L39 38 Z" fill="url(#volleyHead)"/>
  </g>
  <g transform="rotate(45 24 24)">
    <rect x="39" y="20" width="3" height="12" rx="1" fill="url(#volleyArrow)"/>
    <path d="M40.5 32 L38 36 L40.5 34 L43 36 Z" fill="url(#volleyHead)"/>
  </g>
</svg>
`,K=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="spiderBurnerBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6633"/>
      <stop offset="50%" style="stop-color:#cc3300"/>
      <stop offset="100%" style="stop-color:#991a00"/>
    </linearGradient>
    <linearGradient id="spiderBurnerLeg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff8844"/>
      <stop offset="100%" style="stop-color:#cc3300"/>
    </linearGradient>
    <radialGradient id="spiderBurnerEye" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ffff00"/>
      <stop offset="50%" style="stop-color:#ff8800"/>
      <stop offset="100%" style="stop-color:#cc4400"/>
    </radialGradient>
    <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ffaa00;stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:#ff3300;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <!-- Fire glow -->
  <ellipse cx="32" cy="32" rx="28" ry="28" fill="url(#fireGlow)"/>
  <!-- Back legs -->
  <path d="M18 28 Q8 20 4 12" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M46 28 Q56 20 60 12" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M14 32 Q2 30 0 24" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M50 32 Q62 30 64 24" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Front legs -->
  <path d="M22 36 Q12 44 8 52" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M42 36 Q52 44 56 52" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M26 38 Q18 48 16 58" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M38 38 Q46 48 48 58" stroke="url(#spiderBurnerLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Abdomen with glowing marks -->
  <ellipse cx="32" cy="36" rx="14" ry="16" fill="url(#spiderBurnerBody)"/>
  <path d="M24 32 Q32 28 40 32 Q32 36 24 32" fill="none" stroke="#ffcc00" stroke-width="1.5" opacity="0.9"/>
  <path d="M26 40 Q32 36 38 40 Q32 44 26 40" fill="none" stroke="#ffaa00" stroke-width="1" opacity="0.7"/>
  <!-- Cephalothorax -->
  <ellipse cx="32" cy="22" rx="10" ry="9" fill="url(#spiderBurnerBody)"/>
  <!-- Eyes - fiery -->
  <ellipse cx="28" cy="18" rx="4" ry="5" fill="url(#spiderBurnerEye)"/>
  <ellipse cx="36" cy="18" rx="4" ry="5" fill="url(#spiderBurnerEye)"/>
  <ellipse cx="24" cy="22" rx="2" ry="2.5" fill="#ffff66"/>
  <ellipse cx="40" cy="22" rx="2" ry="2.5" fill="#ffff66"/>
  <ellipse cx="32" cy="24" rx="2" ry="2" fill="#ffff66"/>
</svg>
`,W=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="spiderFastBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a6b3a"/>
      <stop offset="50%" style="stop-color:#2d4a22"/>
      <stop offset="100%" style="stop-color:#1a3015"/>
    </linearGradient>
    <linearGradient id="spiderFastLeg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#5a7a48"/>
      <stop offset="100%" style="stop-color:#2d4a22"/>
    </linearGradient>
    <radialGradient id="spiderFastEye" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#88ff88"/>
      <stop offset="70%" style="stop-color:#228822"/>
      <stop offset="100%" style="stop-color:#0d330d"/>
    </radialGradient>
  </defs>
  <!-- Long sleek legs - extended for speed -->
  <path d="M20 26 Q4 12 -4 0" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M44 26 Q60 12 68 0" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M16 30 Q-2 28 -6 20" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M48 30 Q66 28 70 20" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M24 38 Q8 50 2 62" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M40 38 Q56 50 62 62" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M28 40 Q14 54 10 64" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M36 40 Q50 54 54 64" stroke="url(#spiderFastLeg)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Streamlined abdomen -->
  <ellipse cx="32" cy="36" rx="10" ry="14" fill="url(#spiderFastBody)"/>
  <!-- Sleek cephalothorax -->
  <ellipse cx="32" cy="22" rx="8" ry="7" fill="url(#spiderFastBody)"/>
  <!-- Eyes -->
  <ellipse cx="29" cy="18" rx="3" ry="4" fill="url(#spiderFastEye)"/>
  <ellipse cx="35" cy="18" rx="3" ry="4" fill="url(#spiderFastEye)"/>
  <ellipse cx="26" cy="22" rx="1.5" ry="2" fill="#aaffaa"/>
  <ellipse cx="38" cy="22" rx="1.5" ry="2" fill="#aaffaa"/>
  <ellipse cx="32" cy="23" rx="1.5" ry="1.5" fill="#aaffaa"/>
</svg>
`,Y=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="spiderFatBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3d2818"/>
      <stop offset="50%" style="stop-color:#2a1810"/>
      <stop offset="100%" style="stop-color:#1a0d08"/>
    </linearGradient>
    <linearGradient id="spiderFatLeg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4a3520"/>
      <stop offset="100%" style="stop-color:#2a1810"/>
    </linearGradient>
    <radialGradient id="spiderFatEye" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ff3333"/>
      <stop offset="70%" style="stop-color:#990000"/>
      <stop offset="100%" style="stop-color:#330000"/>
    </radialGradient>
  </defs>
  <!-- Back legs - shorter, thicker -->
  <path d="M16 30 Q6 24 2 16" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M48 30 Q58 24 62 16" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M12 34 Q0 34 -2 28" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M52 34 Q64 34 66 28" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Front legs -->
  <path d="M20 38 Q10 46 6 54" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M44 38 Q54 46 58 54" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M24 40 Q16 50 14 60" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M40 40 Q48 50 50 60" stroke="url(#spiderFatLeg)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Large abdomen -->
  <ellipse cx="32" cy="38" rx="18" ry="20" fill="url(#spiderFatBody)"/>
  <!-- Cephalothorax - bulkier -->
  <ellipse cx="32" cy="20" rx="12" ry="11" fill="url(#spiderFatBody)"/>
  <!-- Eyes -->
  <ellipse cx="27" cy="15" rx="5" ry="6" fill="url(#spiderFatEye)"/>
  <ellipse cx="37" cy="15" rx="5" ry="6" fill="url(#spiderFatEye)"/>
  <ellipse cx="22" cy="20" rx="2.5" ry="3" fill="#ff6666"/>
  <ellipse cx="42" cy="20" rx="2.5" ry="3" fill="#ff6666"/>
  <ellipse cx="32" cy="22" rx="2.5" ry="2.5" fill="#ff6666"/>
</svg>
`,X=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="spiderNinjaBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a1a3a"/>
      <stop offset="50%" style="stop-color:#1a0d28"/>
      <stop offset="100%" style="stop-color:#0d0518"/>
    </linearGradient>
    <linearGradient id="spiderNinjaLeg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3d2848"/>
      <stop offset="100%" style="stop-color:#1a0d28"/>
    </linearGradient>
    <radialGradient id="spiderNinjaEye" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#aa66ff"/>
      <stop offset="70%" style="stop-color:#5522aa"/>
      <stop offset="100%" style="stop-color:#220844"/>
    </radialGradient>
    <linearGradient id="ninjaHeadband" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#cc0000"/>
      <stop offset="50%" style="stop-color:#990000"/>
      <stop offset="100%" style="stop-color:#660000"/>
    </linearGradient>
  </defs>
  <!-- Back legs -->
  <path d="M18 28 Q8 20 4 12" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M46 28 Q56 20 60 12" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M14 32 Q2 30 0 24" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M50 32 Q62 30 64 24" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Front legs -->
  <path d="M22 36 Q12 44 8 52" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M42 36 Q52 44 56 52" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M26 38 Q18 48 16 58" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M38 38 Q46 48 48 58" stroke="url(#spiderNinjaLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Abdomen -->
  <ellipse cx="32" cy="36" rx="14" ry="16" fill="url(#spiderNinjaBody)"/>
  <!-- Cephalothorax -->
  <ellipse cx="32" cy="22" rx="10" ry="9" fill="url(#spiderNinjaBody)"/>
  <!-- Ninja headband -->
  <rect x="14" y="10" width="36" height="6" rx="2" fill="url(#ninjaHeadband)"/>
  <circle cx="20" cy="13" r="3" fill="#ffcc00"/>
  <circle cx="32" cy="13" r="3" fill="#ffcc00"/>
  <circle cx="44" cy="13" r="3" fill="#ffcc00"/>
  <!-- Eyes -->
  <ellipse cx="28" cy="20" rx="4" ry="5" fill="url(#spiderNinjaEye)"/>
  <ellipse cx="36" cy="20" rx="4" ry="5" fill="url(#spiderNinjaEye)"/>
  <ellipse cx="24" cy="24" rx="2" ry="2.5" fill="#cc88ff"/>
  <ellipse cx="40" cy="24" rx="2" ry="2.5" fill="#cc88ff"/>
  <ellipse cx="32" cy="26" rx="2" ry="2" fill="#cc88ff"/>
</svg>
`,ee=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="spiderNormalBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a1810"/>
      <stop offset="50%" style="stop-color:#1a0d08"/>
      <stop offset="100%" style="stop-color:#0d0505"/>
    </linearGradient>
    <linearGradient id="spiderNormalLeg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3d2818"/>
      <stop offset="100%" style="stop-color:#1a0d08"/>
    </linearGradient>
    <radialGradient id="spiderNormalEye" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ff3333"/>
      <stop offset="70%" style="stop-color:#990000"/>
      <stop offset="100%" style="stop-color:#330000"/>
    </radialGradient>
  </defs>
  <!-- Back legs -->
  <path d="M18 28 Q8 20 4 12" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M46 28 Q56 20 60 12" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M14 32 Q2 30 0 24" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M50 32 Q62 30 64 24" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Front legs -->
  <path d="M22 36 Q12 44 8 52" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M42 36 Q52 44 56 52" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M26 38 Q18 48 16 58" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M38 38 Q46 48 48 58" stroke="url(#spiderNormalLeg)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Abdomen -->
  <ellipse cx="32" cy="36" rx="14" ry="16" fill="url(#spiderNormalBody)"/>
  <!-- Cephalothorax -->
  <ellipse cx="32" cy="22" rx="10" ry="9" fill="url(#spiderNormalBody)"/>
  <!-- Eyes -->
  <ellipse cx="28" cy="18" rx="4" ry="5" fill="url(#spiderNormalEye)"/>
  <ellipse cx="36" cy="18" rx="4" ry="5" fill="url(#spiderNormalEye)"/>
  <ellipse cx="24" cy="22" rx="2" ry="2.5" fill="#ff6666"/>
  <ellipse cx="40" cy="22" rx="2" ry="2.5" fill="#ff6666"/>
  <ellipse cx="32" cy="24" rx="2" ry="2" fill="#ff6666"/>
</svg>
`,te=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="agilityLightning" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffff88"/>
      <stop offset="50%" style="stop-color:#ffdd00"/>
      <stop offset="100%" style="stop-color:#ff8800"/>
    </linearGradient>
    <linearGradient id="agilityBar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#44ff44"/>
      <stop offset="50%" style="stop-color:#22cc22"/>
      <stop offset="100%" style="stop-color:#008800"/>
    </linearGradient>
  </defs>
  <!-- Lightning bolt -->
  <path d="M28 4 L16 22 L22 22 L12 44 L26 26 L20 26 Z" fill="url(#agilityLightning)"/>
  <!-- Energy bar -->
  <rect x="32" y="8" width="8" height="36" rx="2" fill="#333"/>
  <rect x="34" y="12" width="4" height="28" rx="1" fill="url(#agilityBar)"/>
  <rect x="34" y="12" width="4" height="20" rx="1" fill="#66ff66" opacity="0.6"/>
</svg>
`,ne=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="armorShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8a8a8a"/>
      <stop offset="50%" style="stop-color:#5a5a5a"/>
      <stop offset="100%" style="stop-color:#3a3a3a"/>
    </linearGradient>
    <linearGradient id="armorSpider" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2a1810"/>
      <stop offset="100%" style="stop-color:#0d0505"/>
    </linearGradient>
  </defs>
  <!-- Shield -->
  <path d="M24 4 L42 12 L42 24 Q42 36 24 44 Q6 36 6 24 L6 12 Z" fill="url(#armorShield)"/>
  <path d="M24 4 L42 12 L42 24 Q42 36 24 44 Q6 36 6 24 L6 12 Z" fill="none" stroke="#2a2a2a" stroke-width="1"/>
  <!-- Spider silhouette -->
  <ellipse cx="24" cy="26" rx="8" ry="10" fill="url(#armorSpider)"/>
  <ellipse cx="24" cy="18" rx="5" ry="5" fill="url(#armorSpider)"/>
  <path d="M16 22 Q8 18 4 12" stroke="url(#armorSpider)" stroke-width="2" fill="none"/>
  <path d="M32 22 Q40 18 44 12" stroke="url(#armorSpider)" stroke-width="2" fill="none"/>
  <path d="M18 28 Q10 30 6 36" stroke="url(#armorSpider)" stroke-width="2" fill="none"/>
  <path d="M30 28 Q38 30 42 36" stroke="url(#armorSpider)" stroke-width="2" fill="none"/>
  <path d="M20 30 Q14 38 12 44" stroke="url(#armorSpider)" stroke-width="2" fill="none"/>
  <path d="M28 30 Q34 38 36 44" stroke="url(#armorSpider)" stroke-width="2" fill="none"/>
</svg>
`,se=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="blizzardMasterySnow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#aaddff"/>
      <stop offset="50%" style="stop-color:#66bbff"/>
      <stop offset="100%" style="stop-color:#2288cc"/>
    </linearGradient>
    <linearGradient id="blizzardMasteryPower" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffff88"/>
      <stop offset="100%" style="stop-color:#ffaa00"/>
    </linearGradient>
  </defs>
  <!-- Snowstorm swirl -->
  <path d="M8 24 Q24 8 40 24 Q24 40 8 24" fill="none" stroke="url(#blizzardMasterySnow)" stroke-width="3"/>
  <path d="M12 24 Q24 12 36 24 Q24 36 12 24" fill="none" stroke="url(#blizzardMasterySnow)" stroke-width="2" opacity="0.8"/>
  <!-- Snowflakes -->
  <path d="M14 10 L14 14 M12 12 L16 12" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M34 12 L34 16 M32 14 L36 14" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M12 34 L12 38 M10 36 L14 36" stroke="#ffffff" stroke-width="0.8"/>
  <path d="M36 34 L36 38 M34 36 L38 36" stroke="#ffffff" stroke-width="0.8"/>
  <!-- Power symbol - lightning bolt -->
  <path d="M28 14 L20 24 L26 24 L18 34 L28 26 L22 26 Z" fill="url(#blizzardMasteryPower)"/>
</svg>
`,re=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="dutyShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffdd66"/>
      <stop offset="50%" style="stop-color:#cc9900"/>
      <stop offset="100%" style="stop-color:#996600"/>
    </linearGradient>
    <linearGradient id="dutyFist" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8c4a0"/>
      <stop offset="100%" style="stop-color:#c9a67a"/>
    </linearGradient>
  </defs>
  <!-- Shield -->
  <path d="M24 4 L42 12 L42 24 Q42 36 24 44 Q6 36 6 24 L6 12 Z" fill="url(#dutyShield)"/>
  <path d="M24 4 L42 12 L42 24 Q42 36 24 44 Q6 36 6 24 L6 12 Z" fill="none" stroke="#996600" stroke-width="1"/>
  <!-- Fist -->
  <ellipse cx="24" cy="28" rx="8" ry="10" fill="url(#dutyFist)"/>
  <path d="M18 24 Q16 20 18 16 Q20 14 22 16" fill="url(#dutyFist)"/>
  <path d="M24 22 Q24 18 26 16 Q28 14 30 16" fill="url(#dutyFist)"/>
  <path d="M30 24 Q32 20 30 18 Q28 16 26 18" fill="url(#dutyFist)"/>
  <path d="M20 30 Q18 34 20 36 Q22 38 24 36" fill="url(#dutyFist)"/>
</svg>
`,ie=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="enduranceHeart" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6666"/>
      <stop offset="50%" style="stop-color:#cc3333"/>
      <stop offset="100%" style="stop-color:#990000"/>
    </linearGradient>
    <linearGradient id="endurancePlus" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#ffcccc"/>
    </linearGradient>
  </defs>
  <!-- Heart -->
  <path d="M24 40 C24 40 8 28 8 18 C8 12 12 8 18 8 C22 8 24 12 24 12 C24 12 26 8 30 8 C36 8 40 12 40 18 C40 28 24 40 24 40 Z" fill="url(#enduranceHeart)"/>
  <!-- Plus sign -->
  <rect x="21" y="16" width="6" height="16" rx="1" fill="url(#endurancePlus)"/>
  <rect x="14" y="23" width="20" height="6" rx="1" fill="url(#endurancePlus)"/>
</svg>
`,oe=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="healBoostCross" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#aaffaa"/>
      <stop offset="50%" style="stop-color:#66dd66"/>
      <stop offset="100%" style="stop-color:#228822"/>
    </linearGradient>
    <radialGradient id="healBoostSparkle" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:#88ff88;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <!-- Big cross -->
  <rect x="18" y="6" width="12" height="36" rx="3" fill="url(#healBoostCross)"/>
  <rect x="6" y="18" width="36" height="12" rx="3" fill="url(#healBoostCross)"/>
  <!-- Sparkles -->
  <circle cx="12" cy="12" r="3" fill="url(#healBoostSparkle)"/>
  <circle cx="36" cy="12" r="3" fill="url(#healBoostSparkle)"/>
  <circle cx="12" cy="36" r="3" fill="url(#healBoostSparkle)"/>
  <circle cx="36" cy="36" r="3" fill="url(#healBoostSparkle)"/>
  <circle cx="24" cy="24" r="2" fill="#ffffff"/>
</svg>
`,le=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="hunterBow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b6914"/>
      <stop offset="100%" style="stop-color:#4a3008"/>
    </linearGradient>
    <linearGradient id="hunterTarget" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff4444"/>
      <stop offset="50%" style="stop-color:#cc0000"/>
      <stop offset="100%" style="stop-color:#880000"/>
    </linearGradient>
  </defs>
  <!-- Bow -->
  <path d="M8 12 Q24 4 40 12 Q24 20 8 12" fill="none" stroke="url(#hunterBow)" stroke-width="4"/>
  <line x1="8" y1="12" x2="40" y2="12" stroke="#ccc" stroke-width="0.5"/>
  <!-- Arrow -->
  <line x1="24" y1="44" x2="24" y2="8" stroke="#8b6914" stroke-width="2"/>
  <!-- Target/crosshair -->
  <circle cx="24" cy="24" r="12" fill="none" stroke="url(#hunterTarget)" stroke-width="3"/>
  <circle cx="24" cy="24" r="8" fill="none" stroke="#ffffff" stroke-width="2"/>
  <circle cx="24" cy="24" r="4" fill="url(#hunterTarget)"/>
  <line x1="24" y1="8" x2="24" y2="16" stroke="#ffffff" stroke-width="1"/>
  <line x1="24" y1="32" x2="24" y2="40" stroke="#ffffff" stroke-width="1"/>
  <line x1="8" y1="24" x2="16" y2="24" stroke="#ffffff" stroke-width="1"/>
  <line x1="32" y1="24" x2="40" y2="24" stroke="#ffffff" stroke-width="1"/>
</svg>
`,ae=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="prepTalentHourglass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#c9a67a"/>
      <stop offset="50%" style="stop-color:#8b6914"/>
      <stop offset="100%" style="stop-color:#4a3008"/>
    </linearGradient>
    <linearGradient id="prepTalentSand" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffdd88"/>
      <stop offset="100%" style="stop-color:#ccaa44"/>
    </linearGradient>
    <linearGradient id="prepTalentLightning" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffff88"/>
      <stop offset="100%" style="stop-color:#ffaa00"/>
    </linearGradient>
  </defs>
  <!-- Hourglass frame -->
  <path d="M14 4 L34 4 L28 22 L34 40 L14 40 L20 22 Z" fill="none" stroke="url(#prepTalentHourglass)" stroke-width="2"/>
  <!-- Sand -->
  <polygon points="20,20 28,20 26,24 22,24" fill="url(#prepTalentSand)"/>
  <polygon points="22,26 26,26 24,36 24,36" fill="url(#prepTalentSand)"/>
  <!-- Lightning through hourglass -->
  <path d="M26 8 L22 20 L26 20 L22 40 L28 22 L24 22 Z" fill="url(#prepTalentLightning)" opacity="0.9"/>
</svg>
`,de=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="rapidArrow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8b6914"/>
      <stop offset="100%" style="stop-color:#4a3008"/>
    </linearGradient>
    <linearGradient id="rapidHead" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" style="stop-color:#c0c0c0"/>
      <stop offset="100%" style="stop-color:#808080"/>
    </linearGradient>
  </defs>
  <!-- Main arrow -->
  <rect x="8" y="22" width="32" height="4" rx="1" fill="url(#rapidArrow)"/>
  <path d="M40 24 L48 20 L48 28 Z" fill="url(#rapidHead)"/>
  <!-- Speed lines -->
  <path d="M4 12 L8 16 M4 18 L10 20 M4 24 L8 24 M4 30 L10 28 M4 36 L8 32" stroke="#ff8800" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
  <path d="M2 14 L6 16 M2 22 L8 22 M2 30 L6 28" stroke="#ffaa00" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
</svg>
`,ce=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="tirelessEnergy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffff88"/>
      <stop offset="50%" style="stop-color:#ffdd00"/>
      <stop offset="100%" style="stop-color:#ccaa00"/>
    </linearGradient>
    <linearGradient id="tirelessSpiral" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" style="stop-color:#ffcc00;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#ff8800;stop-opacity:0.5"/>
    </linearGradient>
  </defs>
  <!-- Spiral energy symbol - continuous running motion -->
  <path d="M24 8 Q32 8 36 16 Q36 24 28 28 Q20 32 16 28 Q12 24 16 20 Q20 16 28 16 Q32 20 32 24 Q32 28 28 32 Q24 36 20 32 Q16 28 20 24 Q24 20 28 24" fill="none" stroke="url(#tirelessEnergy)" stroke-width="3"/>
  <!-- Center dot - energy core -->
  <circle cx="24" cy="24" r="5" fill="url(#tirelessEnergy)"/>
</svg>
`,he=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="volleyMasteryArrow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8b6914"/>
      <stop offset="100%" style="stop-color:#4a3008"/>
    </linearGradient>
    <linearGradient id="volleyMasteryStar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffdd00"/>
      <stop offset="100%" style="stop-color:#ff8800"/>
    </linearGradient>
  </defs>
  <!-- Multiple arrows -->
  <g transform="rotate(-30 24 24)">
    <rect x="20" y="6" width="3" height="16" rx="1" fill="url(#volleyMasteryArrow)"/>
    <path d="M21.5 22 L23 28 L21.5 25 L20 28 Z" fill="#808080"/>
  </g>
  <g transform="rotate(-10 24 24)">
    <rect x="21" y="4" width="3" height="18" rx="1" fill="url(#volleyMasteryArrow)"/>
    <path d="M22.5 22 L24 30 L22.5 26 L21 30 Z" fill="#808080"/>
  </g>
  <g transform="rotate(10 24 24)">
    <rect x="21" y="4" width="3" height="18" rx="1" fill="url(#volleyMasteryArrow)"/>
    <path d="M22.5 22 L24 30 L22.5 26 L21 30 Z" fill="#808080"/>
  </g>
  <g transform="rotate(30 24 24)">
    <rect x="20" y="6" width="3" height="16" rx="1" fill="url(#volleyMasteryArrow)"/>
    <path d="M21.5 22 L23 28 L21.5 25 L20 28 Z" fill="#808080"/>
  </g>
  <!-- Star -->
  <polygon points="24,28 26,34 32,34 28,38 30,44 24,40 18,44 20,38 16,34 22,34" fill="url(#volleyMasteryStar)"/>
</svg>
`,pe=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="lockBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8a8a8a"/>
      <stop offset="30%" style="stop-color:#6a6a6a"/>
      <stop offset="70%" style="stop-color:#5a5a5a"/>
      <stop offset="100%" style="stop-color:#4a4a4a"/>
    </linearGradient>
    <linearGradient id="lockShackle" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6a6a6a"/>
      <stop offset="50%" style="stop-color:#8a8a8a"/>
      <stop offset="100%" style="stop-color:#5a5a5a"/>
    </linearGradient>
  </defs>
  <!-- Shackle -->
  <path d="M14 20 L14 16 Q14 8 24 8 Q34 8 34 16 L34 20" fill="none" stroke="url(#lockShackle)" stroke-width="4"/>
  <!-- Body -->
  <rect x="12" y="20" width="24" height="20" rx="3" fill="url(#lockBody)"/>
  <rect x="12" y="20" width="24" height="20" rx="3" fill="none" stroke="#3a3a3a" stroke-width="1"/>
  <!-- Keyhole -->
  <circle cx="24" cy="28" r="4" fill="#2a2a2a"/>
  <rect x="22" y="28" width="4" height="10" rx="1" fill="#2a2a2a"/>
</svg>
`,fe=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="shieldGolden" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffdd66"/>
      <stop offset="30%" style="stop-color:#ffcc00"/>
      <stop offset="70%" style="stop-color:#cc9900"/>
      <stop offset="100%" style="stop-color:#996600"/>
    </linearGradient>
    <radialGradient id="shieldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ffffaa;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#ffcc00;stop-opacity:0"/>
    </radialGradient>
    <filter id="shieldGlowFilter">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Glow -->
  <ellipse cx="24" cy="24" rx="22" ry="22" fill="url(#shieldGlow)"/>
  <!-- Shield -->
  <path d="M24 4 L44 12 L44 24 Q44 36 24 44 Q4 36 4 24 L4 12 Z" fill="url(#shieldGolden)" filter="url(#shieldGlowFilter)"/>
  <path d="M24 4 L44 12 L44 24 Q44 36 24 44 Q4 36 4 24 L4 12 Z" fill="none" stroke="#cc9900" stroke-width="1"/>
  <!-- Inner highlight -->
  <path d="M24 8 L38 14 L38 24 Q38 32 24 38 Q10 32 10 24 L10 14 Z" fill="none" stroke="#ffdd66" stroke-width="0.5" opacity="0.5"/>
</svg>
`,ye=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="snowflakeIce" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="40%" style="stop-color:#aaddff"/>
      <stop offset="100%" style="stop-color:#66bbff"/>
    </linearGradient>
    <linearGradient id="snowflakeCrystal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ddffff"/>
      <stop offset="100%" style="stop-color:#88ccff"/>
    </linearGradient>
  </defs>
  <!-- Main branches -->
  <path d="M24 2 L24 18 M24 30 L24 46" stroke="url(#snowflakeIce)" stroke-width="3" stroke-linecap="round"/>
  <path d="M8 10 L18 18 M30 18 L40 10" stroke="url(#snowflakeIce)" stroke-width="3" stroke-linecap="round"/>
  <path d="M8 38 L18 30 M30 30 L40 38" stroke="url(#snowflakeIce)" stroke-width="3" stroke-linecap="round"/>
  <path d="M10 8 L18 18 M18 30 L10 40" stroke="url(#snowflakeIce)" stroke-width="3" stroke-linecap="round"/>
  <path d="M38 8 L30 18 M30 30 L38 40" stroke="url(#snowflakeIce)" stroke-width="3" stroke-linecap="round"/>
  <!-- Secondary branches -->
  <path d="M16 6 L18 10 M30 10 L32 6" stroke="url(#snowflakeCrystal)" stroke-width="2" stroke-linecap="round"/>
  <path d="M16 42 L18 38 M30 38 L32 42" stroke="url(#snowflakeCrystal)" stroke-width="2" stroke-linecap="round"/>
  <path d="M6 16 L10 18 M10 30 L6 32" stroke="url(#snowflakeCrystal)" stroke-width="2" stroke-linecap="round"/>
  <path d="M42 16 L38 18 M38 30 L42 32" stroke="url(#snowflakeCrystal)" stroke-width="2" stroke-linecap="round"/>
  <!-- Tertiary branches -->
  <path d="M20 12 L22 14 M26 14 L28 12" stroke="url(#snowflakeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M20 36 L22 34 M26 34 L28 36" stroke="url(#snowflakeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M12 20 L14 22 M14 26 L12 28" stroke="url(#snowflakeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M36 20 L34 22 M34 26 L36 28" stroke="url(#snowflakeCrystal)" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Center -->
  <circle cx="24" cy="24" r="4" fill="url(#snowflakeCrystal)"/>
</svg>
`;class ue{_sprites=new Map;loadAll(){const e=Object.assign({"../sprites/Archer.svg":I,"../sprites/Arrow.svg":H,"../sprites/Castle.svg":O,"../sprites/abilities/AbilityArmageddon.svg":U,"../sprites/abilities/AbilityBlizzard.svg":Z,"../sprites/abilities/AbilityFreeze.svg":j,"../sprites/abilities/AbilityHeal.svg":q,"../sprites/abilities/AbilityPrep.svg":V,"../sprites/abilities/AbilityStand.svg":$,"../sprites/abilities/AbilityVolley.svg":J,"../sprites/spiders/SpiderBurner.svg":K,"../sprites/spiders/SpiderFast.svg":W,"../sprites/spiders/SpiderFat.svg":Y,"../sprites/spiders/SpiderNinja.svg":X,"../sprites/spiders/SpiderNormal.svg":ee,"../sprites/talents/TalentAgility.svg":te,"../sprites/talents/TalentArmor.svg":ne,"../sprites/talents/TalentBlizzardMastery.svg":se,"../sprites/talents/TalentDuty.svg":re,"../sprites/talents/TalentEndurance.svg":ie,"../sprites/talents/TalentHealBoost.svg":oe,"../sprites/talents/TalentHunter.svg":le,"../sprites/talents/TalentPrep.svg":ae,"../sprites/talents/TalentRapidFire.svg":de,"../sprites/talents/TalentTireless.svg":ce,"../sprites/talents/TalentVolleyMastery.svg":he,"../sprites/ui/Lock.svg":pe,"../sprites/ui/Shield.svg":fe,"../sprites/ui/Snowflake.svg":ye});for(const[t,n]of Object.entries(e)){const s=t.split("/").pop().replace(".svg","");this._sprites.set(s,n)}}get(e){return this._sprites.get(e)??""}}class _e{_container;_loadButton;_onStartGame;_onLoadGame;constructor(e,t,n){this._container=e,this._onStartGame=t,this._onLoadGame=n,this._loadButton=document.createElement("button"),this._build()}_build(){this._container.className="main-menu-screen",this._container.dataset.screen="main-menu";const e=document.createElement("h1");e.className="main-menu__title",e.textContent="ЗАЩИТА ЗАМКА",this._container.appendChild(e);const t=document.createElement("p");t.className="main-menu__subtitle",t.textContent="Лучники против пауков",this._container.appendChild(t);const n=document.createElement("div");n.className="main-menu__buttons",this._loadButton.className="main-menu__btn main-menu__btn--load",this._loadButton.textContent="Загрузить игру",this._loadButton.dataset.action="load",this._loadButton.addEventListener("click",()=>this._onLoadGame()),n.appendChild(this._loadButton);const s=[{key:"easy",label:"Лёгкий"},{key:"normal",label:"Средний"},{key:"hard",label:"Сложный"}];for(const{key:r,label:i}of s){const o=document.createElement("button");o.className="main-menu__btn main-menu__btn--difficulty",o.type="button",o.textContent=i,o.dataset.difficulty=r,o.dataset.action="start",o.addEventListener("click",()=>this._onStartGame(r)),n.appendChild(o)}this._container.appendChild(n)}render(e){this._loadButton.classList.toggle("main-menu__btn--hidden",!e),this._loadButton.hidden=!e}getContainer(){return this._container}}const ge={normal:"SpiderNormal",fat:"SpiderFat",fast:"SpiderFast",ninja:"SpiderNinja",burner:"SpiderBurner"};class me{_container;_lanes=[];_spiderElements=new Map;_arrowElements=new Map;_spriteRegistry;constructor(e,t){this._container=e,this._spriteRegistry=t,this._buildLanes()}_buildLanes(){this._container.className="game-field",this._container.dataset.component="game-field";for(let e=0;e<9;e++){const t=document.createElement("div");t.className="lane",t.dataset.lane=String(e),this._container.appendChild(t),this._lanes.push(t)}}render(e){this._renderSpiders(e),this._renderArrows(e)}_renderSpiders(e){const t=new Set;for(const n of e.spiders.values()){t.add(n.id);let s=this._spiderElements.get(n.id);if(!s){s=this._createSpiderElement(n),this._spiderElements.set(n.id,s);const i=this._lanes[n.lane];i&&i.appendChild(s)}if(parseInt(s.dataset.lane??"-1",10)!==n.lane){s.dataset.lane=String(n.lane);const i=this._lanes[n.lane];i&&i.appendChild(s)}s.style.setProperty("--y",String(n.y)),s.classList.toggle("spider--slowed",n.slowFactor<1),s.classList.toggle("spider--dying",n.dying)}for(const[n,s]of this._spiderElements)t.has(n)||(s.remove(),this._spiderElements.delete(n))}_createSpiderElement(e){const t=document.createElement("div");t.className="spider spider--walk",t.dataset.spiderId=e.id,t.dataset.lane=String(e.lane);const n=ge[e.type]??"SpiderNormal";return t.innerHTML=this._spriteRegistry.get(n),t}_renderArrows(e){const t=new Set;for(const n of e.arrows.values()){t.add(n.id);let s=this._arrowElements.get(n.id);if(!s){s=this._createArrowElement(),this._arrowElements.set(n.id,s);const r=this._lanes[n.lane];r&&r.appendChild(s)}s.style.setProperty("--y",String(n.y))}for(const[n,s]of this._arrowElements)t.has(n)||(s.remove(),this._arrowElements.delete(n))}_createArrowElement(){const e=document.createElement("div");return e.className="arrow",e.innerHTML=this._spriteRegistry.get("Arrow"),e}getContainer(){return this._container}}const S=["freeze","blizzard","prep","heal","volley","stand","armageddon"],we={freeze:"AbilityFreeze",blizzard:"AbilityBlizzard",prep:"AbilityPrep",heal:"AbilityHeal",volley:"AbilityVolley",stand:"AbilityStand",armageddon:"AbilityArmageddon"};class ve{_container;_hpFill=null;_hpText=null;_energyFill=null;_energyText=null;_coinsDisplay=null;_levelTimerDisplay=null;_levelNumberDisplay=null;_archerButtons=[];_abilityButtons=[];_spriteRegistry;constructor(e,t){this._container=e,this._spriteRegistry=t,this._build()}_build(){this._container.className="hud",this._container.dataset.component="hud";const e=document.createElement("div");e.id="resource-bars",e.className="resource-bars";const t=this._createResourceBar("hp-bar","HP");this._hpFill=t.querySelector(".resource-bar__fill"),this._hpText=t.querySelector(".resource-bar__text"),e.appendChild(t);const n=this._createResourceBar("energy-bar","Энергия");this._energyFill=n.querySelector(".resource-bar__fill"),this._energyText=n.querySelector(".resource-bar__text"),e.appendChild(n),this._container.appendChild(e),this._coinsDisplay=document.createElement("div"),this._coinsDisplay.id="coins-display",this._coinsDisplay.className="coins-display",this._container.appendChild(this._coinsDisplay),this._levelTimerDisplay=document.createElement("div"),this._levelTimerDisplay.id="level-timer",this._levelTimerDisplay.className="level-timer",this._container.appendChild(this._levelTimerDisplay),this._levelNumberDisplay=document.createElement("div"),this._levelNumberDisplay.id="level-number",this._levelNumberDisplay.className="level-number",this._container.appendChild(this._levelNumberDisplay);const s=document.createElement("div");s.id="archer-buttons",s.className="archer-buttons";for(let i=0;i<9;i++){const o=this._createArcherButton(i);this._archerButtons.push(o),s.appendChild(o)}this._container.appendChild(s);const r=document.createElement("div");r.id="ability-buttons",r.className="ability-buttons";for(const i of S){const o=this._createAbilityButton(i);this._abilityButtons.push(o),r.appendChild(o)}this._container.appendChild(r)}_createResourceBar(e,t){const n=document.createElement("div");return n.id=e,n.className="resource-bar",n.innerHTML=`
      <div class="resource-bar__fill" style="--fill: 100%"></div>
      <div class="resource-bar__text">0 / 0</div>
    `,n}_createArcherButton(e){const t=document.createElement("button");return t.className="archer-btn",t.dataset.lane=String(e),t.type="button",t.innerHTML=this._spriteRegistry.get("Archer"),t}_createAbilityButton(e){const t=document.createElement("button");return t.className="ability-btn",t.dataset.ability=e,t.type="button",t.innerHTML=this._spriteRegistry.get(we[e]),t}render(e){const t=e.maxHp>0?e.hp/e.maxHp*100:0;this._hpFill&&this._hpFill.style.setProperty("--fill",`${t}%`),this._hpText&&(this._hpText.textContent=`${Math.floor(e.hp)} / ${Math.floor(e.maxHp)}`);const n=e.maxEnergy>0?e.energy/e.maxEnergy*100:0;this._energyFill&&this._energyFill.style.setProperty("--fill",`${n}%`),this._energyText&&(this._energyText.textContent=`${Math.floor(e.energy)} / ${Math.floor(e.maxEnergy)}`),this._coinsDisplay&&(this._coinsDisplay.textContent=`Монетки: ${e.coins}`),this._levelTimerDisplay&&(this._levelTimerDisplay.textContent=`Таймер: ${Math.ceil(e.levelTimer)}с`),this._levelNumberDisplay&&(this._levelNumberDisplay.textContent=`Уровень ${e.level}`);const s=e.archers;for(let r=0;r<this._archerButtons.length;r++){const i=s[r],o=this._archerButtons[r];if(i&&o){const d=i.cooldownFraction*100;o.style.setProperty("--cd-pct",`${d}%`),o.classList.toggle("archer-btn--cooldown",!i.isReady)}}for(let r=0;r<S.length;r++){const i=S[r],o=e.getAbility(i),d=this._abilityButtons[r];if(o&&d){const c=o.isAvailableAt(e.level);d.classList.toggle("ability-btn--locked",!c),d.style.setProperty("--cd-pct",`${o.cooldownFraction*100}%`),d.classList.toggle("ability-btn--cooldown",o.isOnCooldown);let f=d.querySelector(".ability-btn__lock");if(!c&&!f){const y=document.createElement("span");y.className="ability-btn__lock",y.innerHTML=this._spriteRegistry.get("Lock"),d.appendChild(y)}else c&&f&&f.remove()}}}getContainer(){return this._container}getArcherButtonsContainer(){return this._container.querySelector("#archer-buttons")??this._container}getAbilityButtonsContainer(){return this._container.querySelector("#ability-buttons")??this._container}}class xe{_container;_gameField;_hud;constructor(e,t){this._container=e,this._gameField=new me(this._createGameFieldContainer(),t),this._hud=new ve(this._createHudContainer(),t),this._build()}_createGameFieldContainer(){const e=document.createElement("div");return e.id="game-field",e.className="game-field-wrapper",e}_createHudContainer(){const e=document.createElement("div");return e.id="hud",e.className="hud-wrapper",e}_build(){this._container.className="game-screen",this._container.dataset.screen="game";const e=this._gameField.getContainer();this._container.appendChild(e);const t=this._hud.getContainer();this._container.appendChild(t)}render(e){this._gameField.render(e),this._hud.render(e)}getContainer(){return this._container}getGameField(){return this._gameField}getHud(){return this._hud}}class ke{_container;_titleEl;_levelEl;_recordEl;_onReturnToMenu;constructor(e,t){this._container=e,this._onReturnToMenu=t,this._titleEl=document.createElement("h1"),this._levelEl=document.createElement("p"),this._recordEl=document.createElement("p"),this._build()}_build(){this._container.className="game-over-screen",this._container.dataset.screen="game-over",this._titleEl.className="game-over__title",this._container.appendChild(this._titleEl),this._levelEl.className="game-over__level",this._container.appendChild(this._levelEl),this._recordEl.className="game-over__record",this._container.appendChild(this._recordEl);const e=document.createElement("button");e.className="game-over__btn",e.type="button",e.textContent="В меню",e.dataset.action="menu",e.addEventListener("click",()=>this._onReturnToMenu()),this._container.appendChild(e)}render(e,t,n){this._titleEl.textContent=n?"НОВЫЙ РЕКОРД!":"ПОРАЖЕНИЕ",this._titleEl.classList.toggle("game-over__title--victory",n),this._titleEl.classList.toggle("game-over__title--defeat",!n),this._levelEl.textContent=`Вы пали на уровне ${e}`,this._recordEl.textContent=`Рекорд: ${t}`}getContainer(){return this._container}}const be={endurance:"Выносливость",spiderArmor:"Защита от пауков",tireless:"Неутомимость",agility:"Ловкость",healBoost:"Усиленное лечение",hunterMastery:"Мастерство охотника",improvedPrep:"Улучшенная подготовка",volleyMastery:"Искусный залп",rapidFire:"Скорострельность",dutyBound:"Чувство долга",blizzardMastery:"Беспощадная вьюга"},Se={endurance:"+425 макс. HP",spiderArmor:"-7% получаемого урона",tireless:"+10% регенерации энергии",agility:"+120 макс. энергии",healBoost:"+150 HP от Лечения, +2 HP/сек",hunterMastery:"-2 стоимость выстрела",improvedPrep:"-6 сек кулдаун Подготовки",volleyMastery:"+1 орудие в Залпе",rapidFire:"-10% кулдаун выстрела/залпа, +10% скорость стрел",dutyBound:"+1с длительность и -12с кулдаун Ни шагу назад!",blizzardMastery:"+7% замедление и +1с длительность Вьюги"},Le={endurance:"TalentEndurance",spiderArmor:"TalentArmor",tireless:"TalentTireless",agility:"TalentAgility",healBoost:"TalentHealBoost",hunterMastery:"TalentHunter",improvedPrep:"TalentPrep",volleyMastery:"TalentVolleyMastery",rapidFire:"TalentRapidFire",dutyBound:"TalentDuty",blizzardMastery:"TalentBlizzardMastery"};class Me{_container;_levelEl;_talentsGrid;_confirmBtn;_onConfirm=null;_onTalentUpgrade=null;_pendingPoints=0;_talentSystem=null;_playerLevel=1;_spriteRegistry;constructor(e,t){this._container=e,this._spriteRegistry=t,this._levelEl=document.createElement("h2"),this._talentsGrid=document.createElement("div"),this._confirmBtn=document.createElement("button"),this._build()}_build(){this._container.className="level-up-screen",this._container.dataset.screen="level-up",this._levelEl.className="level-up__title",this._container.appendChild(this._levelEl),this._talentsGrid.className="level-up__talents",this._talentsGrid.dataset.component="talents-grid",this._container.appendChild(this._talentsGrid),this._confirmBtn.className="level-up__confirm",this._confirmBtn.textContent="Продолжить",this._confirmBtn.dataset.action="confirm",this._confirmBtn.addEventListener("click",()=>this._handleConfirm()),this._container.appendChild(this._confirmBtn)}show(e,t,n,s,r){this._onTalentUpgrade=r??null,this._playerLevel=e,this._talentSystem=t,this._pendingPoints=n,this._onConfirm=s,this._levelEl.textContent=`Уровень ${e} пройден!`,this._renderTalents(),this._updateConfirmState(),this._container.classList.add("level-up-screen--visible")}hide(){this._container.classList.remove("level-up-screen--visible"),this._onConfirm=null,this._talentSystem=null}_renderTalents(){this._talentsGrid.innerHTML="";const e=this._talentSystem;if(e)for(const t of e.talents){const n=this._createTalentCard(t.id,t.rank,t.maxRanks,t.unlocksAtLevel);this._talentsGrid.appendChild(n)}}_createTalentCard(e,t,n,s){const r=document.createElement("div");r.className="talent-card",r.dataset.talentId=e;const o=this._talentSystem.canUpgrade(e,this._playerLevel),d=this._pendingPoints>0,c=document.createElement("div");c.className="talent-card__icon",c.innerHTML=this._spriteRegistry.get(Le[e]),r.appendChild(c);const f=document.createElement("div");f.className="talent-card__name",f.textContent=be[e],r.appendChild(f);const y=document.createElement("div");y.className="talent-card__desc",y.textContent=Se[e],r.appendChild(y);const a=document.createElement("div");a.className="talent-card__rank",a.textContent=`${t} / ${n}`,r.appendChild(a);const p=document.createElement("button");return p.className="talent-card__upgrade",p.type="button",p.textContent="Улучшить",p.dataset.talentId=e,p.disabled=!o||!d,p.addEventListener("click",()=>this._handleUpgrade(e)),r.appendChild(p),this._playerLevel<s&&(r.classList.add("talent-card--locked"),p.textContent=`Разблокируется на ${s} ур.`),r}_handleUpgrade(e){const t=this._talentSystem;!t||this._pendingPoints<=0||t.canUpgrade(e,this._playerLevel)&&(t.upgrade(e),this._pendingPoints-=1,this._onTalentUpgrade?.(e),this._renderTalents(),this._updateConfirmState())}_handleConfirm(){this._canConfirm()&&this._onConfirm?.()}_canConfirm(){if(this._pendingPoints<=0)return!0;const e=this._talentSystem;return e?!e.hasAvailableUpgrades(this._playerLevel):!0}_updateConfirmState(){this._confirmBtn.disabled=!this._canConfirm()}getContainer(){return this._container}}class Ce{_root;_menuScreen;_gameScreen;_gameOverScreen;_levelUpScreen;_engine=null;_saveSystem=null;constructor(e,t){this._root=e;const n=document.createElement("div");this._menuScreen=new _e(n,o=>this.startNewGame(o),()=>this.loadGame());const s=document.createElement("div");this._gameScreen=new xe(s,t);const r=document.createElement("div");this._gameOverScreen=new ke(r,()=>this._showScreen("menu"));const i=document.createElement("div");this._levelUpScreen=new Me(i,t)}setEngine(e){this._engine=e}setSaveSystem(e){this._saveSystem=e}init(){this._root.innerHTML="",this._root.className="app";const e=document.createElement("div");e.className="app__screens",e.appendChild(this._menuScreen.getContainer()),e.appendChild(this._gameScreen.getContainer()),e.appendChild(this._gameOverScreen.getContainer()),this._root.appendChild(e),this._root.appendChild(this._levelUpScreen.getContainer()),this._menuScreen.render(this._saveSystem?.hasSave()??!1),this._showScreen("menu")}_showScreen(e){this._root.querySelectorAll("[data-screen]").forEach(r=>r.classList.remove("screen--active"));const n={menu:"main-menu",game:"game",gameover:"game-over"};this._root.querySelector(`[data-screen="${n[e]}"]`)?.classList.add("screen--active")}startNewGame(e){this._engine?.startNewGame(e),this._menuScreen.render(this._saveSystem?.hasSave()??!1),this._showScreen("game")}loadGame(){this._engine?.loadGame(),this._menuScreen.render(this._saveSystem?.hasSave()??!1),this._showScreen("game")}showGameOver(e,t,n){this._gameOverScreen.render(e,t,n),this._showScreen("gameover")}showLevelUp(e,t,n,s,r){this._levelUpScreen.show(e,t,n,s,r)}renderGameState(e){this._gameScreen.render(e)}getGameScreen(){return this._gameScreen}getLevelUpScreen(){return this._levelUpScreen}}class Be{id;unlockedAtLevel;_cooldown;_maxCooldown;constructor(e,t,n){this.id=e,this.unlockedAtLevel=t,this._cooldown=0,this._maxCooldown=n}get isOnCooldown(){return this._cooldown>0}get cooldownFraction(){return Math.min(Math.max(this._cooldown/this._maxCooldown,0),1)}get remainingCooldown(){return this._cooldown}get maxCooldown(){return this._maxCooldown}activate(e){this._cooldown=e}tick(e){this._cooldown-=e,this._cooldown<0&&(this._cooldown=0)}isAvailableAt(e){return e>=this.unlockedAtLevel}updateMaxCooldown(e){this._maxCooldown=e}}class Te{_lane;_cooldown;_maxCooldown;constructor(e,t){this._lane=e,this._cooldown=0,this._maxCooldown=t}get lane(){return this._lane}get cooldown(){return this._cooldown}get maxCooldown(){return this._maxCooldown}get isReady(){return this._cooldown<=0}get cooldownFraction(){return Math.min(Math.max(this._cooldown/this._maxCooldown,0),1)}get remainingCooldown(){return this._cooldown}startCooldown(e){this._cooldown=e}tick(e){this._cooldown-=e,this._cooldown<0&&(this._cooldown=0)}updateMaxCooldown(e){this._maxCooldown=e}}const Ge={freeze:4,blizzard:8,prep:12,heal:16,volley:20,stand:24,armageddon:28};class v{_phase;_difficulty;_level;_levelTimer;_hp;_maxHp;_energy;_maxEnergy;_coins;_pendingTalentPoints;_archers;_spiders;_arrows;_abilities;_isInvulnerable;_invulnerableTimer;_freezeActive;_blizzardActive;_blizzardTimer;_armageddonPhase;_armageddonTimer;_record;_config;constructor(e,t,n,s){this._phase="menu",this._difficulty=e,this._level=1,this._levelTimer=t.levelTimerBase+t.levelTimerStep*1,this._hp=t.baseHp,this._maxHp=t.baseHp,this._energy=t.baseEnergy,this._maxEnergy=t.baseEnergy,this._coins=0,this._pendingTalentPoints=0,this._archers=n,this._spiders=new Map,this._arrows=new Map,this._abilities=s,this._isInvulnerable=!1,this._invulnerableTimer=0,this._freezeActive=!1,this._blizzardActive=!1,this._blizzardTimer=0,this._armageddonPhase="none",this._armageddonTimer=0,this._record=1,this._config=t}static createNew(e,t){const n=[];for(let i=0;i<9;i++)n.push(new Te(i,t.shootCooldown));const s=new Map,r=["freeze","blizzard","prep","heal","volley","stand","armageddon"];for(const i of r){const o=t.abilities[i];s.set(i,new Be(i,Ge[i],o.cooldown))}return new v(e,t,n,s)}get phase(){return this._phase}get difficulty(){return this._difficulty}get level(){return this._level}get levelTimer(){return this._levelTimer}get hp(){return this._hp}get maxHp(){return this._maxHp}get energy(){return this._energy}get maxEnergy(){return this._maxEnergy}get coins(){return this._coins}get pendingTalentPoints(){return this._pendingTalentPoints}get archers(){return this._archers}get spiders(){return this._spiders}get arrows(){return this._arrows}get abilities(){return this._abilities}get isInvulnerable(){return this._isInvulnerable}get invulnerableTimer(){return this._invulnerableTimer}get freezeActive(){return this._freezeActive}get blizzardActive(){return this._blizzardActive}get blizzardTimer(){return this._blizzardTimer}get armageddonPhase(){return this._armageddonPhase}get armageddonTimer(){return this._armageddonTimer}get record(){return this._record}get config(){return this._config}addSpider(e){this._spiders.set(e.id,e)}removeSpider(e){this._spiders.delete(e)}addArrow(e){this._arrows.set(e.id,e)}removeArrow(e){this._arrows.delete(e)}modifyHp(e){this._hp=Math.max(0,Math.min(this._maxHp,this._hp+e))}modifyEnergy(e){this._energy=Math.max(0,Math.min(this._maxEnergy,this._energy+e))}setPhase(e){this._phase=e}advanceLevel(){this._level+=1,this._levelTimer=this._config.levelTimerBase+this._config.levelTimerStep*this._level}addCoins(e){this._coins+=e}awardTalentPoint(){this._pendingTalentPoints+=1}spendTalentPoint(){this._pendingTalentPoints>0&&(this._pendingTalentPoints-=1)}updateRecord(){this._record=Math.max(this._record,this._level)}setInvulnerable(e){this._isInvulnerable=!0,this._invulnerableTimer=e}tickInvulnerable(e){this._isInvulnerable&&(this._invulnerableTimer-=e,this._invulnerableTimer<=0&&(this._invulnerableTimer=0,this._isInvulnerable=!1))}setBlizzard(e){this._blizzardActive=!0,this._blizzardTimer=e}tickBlizzard(e){this._blizzardActive&&(this._blizzardTimer-=e,this._blizzardTimer<=0&&(this._blizzardTimer=0,this._blizzardActive=!1))}setArmageddon(e,t){this._armageddonPhase=e,this._armageddonTimer=t??0}tickArmageddon(e){this._armageddonPhase!=="none"&&(this._armageddonTimer-=e,this._armageddonTimer<0&&(this._armageddonTimer=0))}setFreezeActive(e){this._freezeActive=e}getAbility(e){const t=this._abilities.get(e);if(!t)throw new Error(`Ability ${e} not found`);return t}setMaxHp(e){this._maxHp=e}setMaxEnergy(e){this._maxEnergy=e}setLevelTimer(e){this._levelTimer=e}setRecord(e){this._record=e}tickLevelTimer(e){this._levelTimer=Math.max(0,this._levelTimer-e)}}const L={baseHp:500,baseEnergy:100,hpRegen:1,energyRegen:10,coinsPerSec:2,shootCost:35,shootCooldown:1.5,arrowTravelTime:1.5,abilities:{freeze:{cost:50,cooldown:0},blizzard:{cost:40,cooldown:15},prep:{cost:0,cooldown:60},heal:{cost:100,cooldown:10},volley:{cost:100,cooldown:12},stand:{cost:15,cooldown:120},armageddon:{cost:100,cooldown:120}},levelTimerBase:15,levelTimerStep:2,spawnTickInterval:.02,spawnP0:.004,spawnDP:2e-4,spiderSpeedBase:.08,spiderSpeedStep:.004,spiderDamageBase:15,spiderDamageStep:2,spiderVariance:.3,spiderChanceFat:.05,spiderChanceFast:.03,spiderChanceNinja:.02,spiderChanceBurner:.01,talents:{endurance:{maxRanks:7,unlocksAtLevel:1},spiderArmor:{maxRanks:10,unlocksAtLevel:10},tireless:{maxRanks:5,unlocksAtLevel:1},agility:{maxRanks:5,unlocksAtLevel:10},healBoost:{maxRanks:15,unlocksAtLevel:30},hunterMastery:{maxRanks:10,unlocksAtLevel:1},improvedPrep:{maxRanks:5,unlocksAtLevel:20},volleyMastery:{maxRanks:5,unlocksAtLevel:20},rapidFire:{maxRanks:7,unlocksAtLevel:10},dutyBound:{maxRanks:5,unlocksAtLevel:20},blizzardMastery:{maxRanks:6,unlocksAtLevel:30}}},Ee={...L,baseHp:600,coinsPerSec:1,spiderSpeedBase:.07,spiderSpeedStep:.003,spiderDamageBase:12,spiderDamageStep:1.5,spawnP0:.003,spawnDP:15e-5},Ae={...L,baseHp:400,coinsPerSec:3,spiderSpeedBase:.09,spiderSpeedStep:.005,spiderDamageBase:18,spiderDamageStep:2.5,spawnP0:.005,spawnDP:25e-5};class E{getConfig(e){switch(e){case"easy":return Ee;case"normal":return L;case"hard":return Ae}}}class A{_config;constructor(e){this._config=e}levelDuration(e){return this._config.levelTimerBase+this._config.levelTimerStep*e}spiderBaseSpeed(e){return this._config.spiderSpeedBase+this._config.spiderSpeedStep*(e-1)}spiderBaseDamage(e){return this._config.spiderDamageBase+this._config.spiderDamageStep*(e-1)}spawnProbability(e){return this._config.spawnP0+this._config.spawnDP*(e-1)}randomVariance(){const e=this._config.spiderVariance;return 1-e+Math.random()*2*e}randomInt(e,t){const n=Math.ceil(e),s=Math.floor(t);return Math.floor(Math.random()*(s-n+1))+n}}class h{_id=crypto.randomUUID();get id(){return this._id}_lane;_y;_speed;_damage;_slowFactor;_slowTimer;_dying;_dyingTimer;_armageddonDelay;constructor(e,t=0,n,s){this._lane=e,this._y=t,this._speed=n,this._damage=s,this._slowFactor=1,this._slowTimer=0,this._dying=!1,this._dyingTimer=0,this._armageddonDelay=null}get lane(){return this._lane}get y(){return this._y}get speed(){return this._speed}get damage(){return this._damage}get slowFactor(){return this._slowFactor}get slowTimer(){return this._slowTimer}get dying(){return this._dying}get dyingTimer(){return this._dyingTimer}get armageddonDelay(){return this._armageddonDelay}get isAlive(){return!this._dying}get effectiveSpeed(){return this._speed*this._slowFactor}move(e){this._y+=this.effectiveSpeed*e}applySlow(e,t){this._slowFactor=e,this._slowTimer=t}tickSlow(e){this._slowTimer-=e,this._slowTimer<=0&&(this._slowTimer=0,this._slowFactor=1)}startDying(e=.3){this._dying=!0,this._dyingTimer=e}tickDying(e){this._dyingTimer-=e}changeLane(e){this._lane=e}scheduleArmageddon(e){this._armageddonDelay=e}tickArmageddon(e){return this._armageddonDelay===null?!1:(this._armageddonDelay-=e,this._armageddonDelay<=0?(this._armageddonDelay=null,!0):!1)}static computeBaseSpeed(e,t){return(e.spiderSpeedBase+e.spiderSpeedStep*(t-1))*(.7+Math.random()*.6)}static computeBaseDamage(e,t){return(e.spiderDamageBase+e.spiderDamageStep*(t-1))*(.7+Math.random()*.6)}}class M extends h{type="normal";static create(e,t,n){const s=h.computeBaseSpeed(n,t),r=h.computeBaseDamage(n,t);return new M(e,0,s,r)}}class C extends h{type="fat";static create(e,t,n){const s=h.computeBaseSpeed(n,t),r=h.computeBaseDamage(n,t);return new C(e,0,s,r)}}class B extends h{type="fast";static create(e,t,n){const s=h.computeBaseSpeed(n,t),r=h.computeBaseDamage(n,t),i=s*2,o=r*.5;return new B(e,0,i,o)}}class T extends h{type="burner";static create(e,t,n){const s=h.computeBaseSpeed(n,t),i=h.computeBaseDamage(n,t)*.1;return new T(e,0,s,i)}}class k extends h{type="ninja";_hasJumped=!1;_jumpThreshold;constructor(e,t,n,s,r){super(e,t,n,s),this._jumpThreshold=r}get hasJumped(){return this._hasJumped}get jumpThreshold(){return this._jumpThreshold}markJumped(){this._hasJumped=!0}static create(e,t,n){const s=h.computeBaseSpeed(n,t),r=h.computeBaseDamage(n,t),i=.1+Math.random()*.4;return new k(e,0,s,r,i)}}class x{_formula;_config;_spawnAccumulator=0;constructor(e,t){this._formula=e,this._config=t}tick(e,t){this._spawnAccumulator+=e;const n=this._config.spawnTickInterval,s=t.level;for(;this._spawnAccumulator>=n;){this._spawnAccumulator-=n;for(let r=0;r<9;r++){const i=this._formula.spawnProbability(s);if(Math.random()>=i)continue;const o=x.createSpider(r,s,this._config);t.addSpider(o)}}}reset(){this._spawnAccumulator=0}static createSpider(e,t,n){return t>=35&&Math.random()<.02?k.create(e,t,n):t>=20&&Math.random()<.03?B.create(e,t,n):t>=10&&Math.random()<.05?C.create(e,t,n):t>=5&&Math.random()<.01?T.create(e,t,n):M.create(e,t,n)}}const ze=.05;class z{constructor(){}tick(e,t){const n=[];for(const[s,r]of t.arrows){if(r.move(e),r.hasLeft){n.push(s);continue}const i=this.findHitSpider(r,t);i!==null&&(i.startDying(),n.push(s))}for(const s of n)t.removeArrow(s)}checkCollisions(e){const t=[];for(const[n,s]of e.arrows){if(s.hasLeft)continue;const r=this.findHitSpider(s,e);r!==null&&(r.startDying(),t.push(n))}for(const n of t)e.removeArrow(n)}findHitSpider(e,t){let n=null;for(const[,s]of t.spiders)s.dying||s.lane!==e.lane||Math.abs(e.y-s.y)>=ze||(n===null||s.y>n.y)&&(n=s);return n}}class b{_id=crypto.randomUUID();_lane;_y;_speed;_fromVolley;constructor(e,t,n=!1){this._lane=e,this._y=1,this._speed=t,this._fromVolley=n}get id(){return this._id}get lane(){return this._lane}get y(){return this._y}get fromVolley(){return this._fromVolley}get hasLeft(){return this._y<0}move(e){this._y-=this._speed*e}static create(e,t,n=1,s=!1){const r=1/t.arrowTravelTime*n;return new b(e,r,s)}}const Ne=50,Fe=.4,Pe=4,Re=300,De=150,Qe=4,Ie=7,He=1.7;class N{_config;_formulaCalculator;_talentSystem;_armageddonPendingIds=new Set;constructor(e,t,n){this._config=e,this._formulaCalculator=t,this._talentSystem=n}tick(e,t){const n=["freeze","blizzard","prep","heal","volley","stand","armageddon"];for(const s of n)t.getAbility(s).tick(e);t.tickInvulnerable(e),t.tickBlizzard(e),this._tickArmageddon(e,t),this._handleBlizzardSlowExpiration(e,t)}_tickArmageddon(e,t){if(t.armageddonPhase==="charging"){if(t.tickArmageddon(e),t.armageddonTimer<=0){t.setArmageddon("firing"),this._armageddonPendingIds.clear();for(const n of t.spiders.values())n.scheduleArmageddon(Math.random()*2),this._armageddonPendingIds.add(n.id)}return}if(t.armageddonPhase==="firing"){for(const s of t.spiders.values())this._armageddonPendingIds.has(s.id)&&s.tickArmageddon(e)&&(this._armageddonPendingIds.delete(s.id),s.startDying());const n=[];for(const s of this._armageddonPendingIds)t.spiders.has(s)||n.push(s);for(const s of n)this._armageddonPendingIds.delete(s);this._armageddonPendingIds.size===0&&t.setArmageddon("none")}}_handleBlizzardSlowExpiration(e,t){for(const n of t.spiders.values())n.tickSlow(e)}activateFreeze(e){if(e.freezeActive)return this.deactivateFreeze(e),!0;const t=Ne;return e.energy<t?!1:(e.modifyEnergy(-t),e.setPhase("paused"),e.setFreezeActive(!0),!0)}deactivateFreeze(e){e.setFreezeActive(!1),e.setPhase("playing")}activateBlizzard(e){if(e.level<8)return!1;const n=e.getAbility("blizzard");if(n.isOnCooldown)return!1;const s=this._config.abilities.blizzard.cost;if(e.energy<s)return!1;e.modifyEnergy(-s),n.activate(this._config.abilities.blizzard.cooldown);const r=this._talentSystem.getBlizzardSlowBonus(),i=1-Fe-r,o=this._talentSystem.getBlizzardDurationBonus(),d=Pe+o;for(const c of e.spiders.values())c.applySlow(i,d);return e.setBlizzard(d),!0}activatePrep(e){if(e.level<12)return!1;const n=e.getAbility("prep");if(n.isOnCooldown)return!1;const s=this._config.abilities.prep.cooldown,r=this._talentSystem.getPrepCooldownReduction(),i=Math.max(0,s-r);return n.activate(i),e.modifyEnergy(Re),!0}activateHeal(e){if(e.level<16)return!1;const n=e.getAbility("heal");if(n.isOnCooldown)return!1;const s=this._config.abilities.heal.cost;if(e.energy<s)return!1;e.modifyEnergy(-s),n.activate(this._config.abilities.heal.cooldown);const r=this._talentSystem.getHealBonus(),i=De+r;return e.modifyHp(i),!0}activateVolley(e){if(e.level<20)return!1;const n=e.getAbility("volley");if(n.isOnCooldown)return!1;const s=this._config.abilities.volley.cost;if(e.energy<s)return!1;const r=this._config.abilities.volley.cooldown,i=this._talentSystem.getShootCooldownMultiplier(),o=r*i;e.modifyEnergy(-s),n.activate(o);const d=this._talentSystem.getVolleyExtraLanes(),c=Qe+d,f=this._talentSystem.getArrowSpeedMultiplier(),y=this._pickRandomLanes(Math.min(c,9),9),a=e.config;for(const p of y){const Q=b.create(p,a,f,!0);e.addArrow(Q)}return!0}activateStand(e){if(e.level<24)return!1;const n=e.getAbility("stand");if(n.isOnCooldown)return!1;const s=this._config.abilities.stand.cost;if(e.energy<s)return!1;const r=this._config.abilities.stand.cooldown,i=this._talentSystem.getStandCooldownReduction(),o=Math.max(0,r-i);e.modifyEnergy(-s),n.activate(o);const d=this._talentSystem.getStandDurationBonus(),c=Ie+d;return e.setInvulnerable(c),!0}activateArmageddon(e){if(e.level<28)return!1;const n=e.getAbility("armageddon");if(n.isOnCooldown)return!1;const s=this._config.abilities.armageddon.cost;return e.energy<s?!1:(e.modifyEnergy(-s),n.activate(this._config.abilities.armageddon.cooldown),e.setArmageddon("charging",He),!0)}_pickRandomLanes(e,t){const n=Array.from({length:t},(r,i)=>i),s=[];for(let r=0;r<e&&n.length>0;r++){const i=this._formulaCalculator.randomInt(0,n.length-1);s.push(n[i]),n.splice(i,1)}return s}}class F{_talents;constructor(e){this._talents=new Map;const t=["endurance","spiderArmor","tireless","agility","healBoost","hunterMastery","improvedPrep","volleyMastery","rapidFire","dutyBound","blizzardMastery"];for(const n of t){const s=e.talents[n];this._talents.set(n,{id:n,rank:0,maxRanks:s.maxRanks,unlocksAtLevel:s.unlocksAtLevel})}}get talents(){return[...this._talents.values()]}getTalent(e){const t=this._talents.get(e);if(!t)throw new Error(`Talent ${e} not found`);return t}canUpgrade(e,t){const n=this.getTalent(e);return n.rank<n.maxRanks&&t>=n.unlocksAtLevel}upgrade(e){const t=this.getTalent(e);this._talents.set(e,{...t,rank:t.rank+1})}hasAvailableUpgrades(e){return this.talents.some(t=>this.canUpgrade(t.id,e))}getRank(e){return this.getTalent(e).rank}getMaxHpBonus(){return this.getRank("endurance")*425}getDamageReduction(){return this.getRank("spiderArmor")*.07}getEnergyRegenMultiplier(){return 1+this.getRank("tireless")*.1}getMaxEnergyBonus(){return this.getRank("agility")*120}getHealBonus(){return this.getRank("healBoost")*150}getHpRegenBonus(){return this.getRank("healBoost")*2}getShootCostReduction(){return this.getRank("hunterMastery")*2}getPrepCooldownReduction(){return this.getRank("improvedPrep")*6}getVolleyExtraLanes(){return this.getRank("volleyMastery")*1}getShootCooldownMultiplier(){return Math.max(.3,1-this.getRank("rapidFire")*.1)}getArrowSpeedMultiplier(){return 1+this.getRank("rapidFire")*.1}getStandDurationBonus(){return this.getRank("dutyBound")*1}getStandCooldownReduction(){return this.getRank("dutyBound")*12}getBlizzardSlowBonus(){return this.getRank("blizzardMastery")*.07}getBlizzardDurationBonus(){return this.getRank("blizzardMastery")*1}loadFromSave(e){for(const t of e){const n=t.id,s=this._talents.get(n);if(s){const r=Math.min(Math.max(0,t.rank),s.maxRanks);this._talents.set(n,{...s,rank:r})}}}toSaveData(){return this.talents.map(e=>({id:e.id,rank:e.rank}))}}const w="hvs_save",P=1;class Oe{save(e,t){const n={version:P,difficulty:e.difficulty,level:e.level,hp:e.hp,energy:e.energy,coins:e.coins,pendingTalentPoints:e.pendingTalentPoints,talents:t.toSaveData(),record:e.record},s=JSON.stringify(n);localStorage.setItem(w,s)}load(){const e=localStorage.getItem(w);if(e===null)return null;let t;try{t=JSON.parse(e)}catch{return this.clear(),null}return t.version!==P?(this.clear(),null):t}hasSave(){return localStorage.getItem(w)!==null}clear(){localStorage.removeItem(w)}getRecord(){const e=this.load();return e===null?0:e.record??0}}const Ue=.1,Ze=1,je=3;class qe{_state=null;_config=null;_formula=null;_spawner=null;_arrowSystem=null;_abilitySystem=null;_talentSystem=null;_saveSystem;_renderCallback;_phaseChangeCallback=null;_lastTimestamp=-1;_animFrameId=0;_reachedCastleSpiderIds=new Set;_prevPhase="menu";_coinAccumulator=0;constructor(e){this._saveSystem=new Oe,this._renderCallback=e}setPhaseChangeCallback(e){this._phaseChangeCallback=e}startNewGame(e){const t=new E;this._config=t.getConfig(e),this._saveSystem.clear(),this._formula=new A(this._config),this._spawner=new x(this._formula,this._config),this._arrowSystem=new z,this._talentSystem=new F(this._config),this._abilitySystem=new N(this._config,this._formula,this._talentSystem),this._state=v.createNew(e,this._config),this._applyTalentBonuses(),this._state.setPhase("playing"),this._state.setLevelTimer(this._config.levelTimerBase+this._config.levelTimerStep*this._state.level),this._lastTimestamp=-1,this._coinAccumulator=0,this._reachedCastleSpiderIds.clear(),this._prevPhase="playing",this._startLoop()}loadGame(){const e=this._saveSystem.load();if(e===null)return!1;const t=new E,n=e.difficulty;this._config=t.getConfig(n),this._formula=new A(this._config),this._spawner=new x(this._formula,this._config),this._arrowSystem=new z,this._talentSystem=new F(this._config),this._abilitySystem=new N(this._config,this._formula,this._talentSystem),this._talentSystem.loadFromSave([...e.talents]),this._state=v.createNew(n,this._config);for(let s=0;s<e.level-1;s++)this._state.advanceLevel();this._applyTalentBonuses(),this._state.modifyHp(e.hp-this._state.hp),this._state.modifyEnergy(e.energy-this._state.energy),this._state.addCoins(e.coins);for(let s=0;s<e.pendingTalentPoints;s++)this._state.awardTalentPoint();return this._state.setRecord(e.record),this._state.setPhase("playing"),this._lastTimestamp=-1,this._coinAccumulator=0,this._reachedCastleSpiderIds.clear(),this._prevPhase="playing",this._startLoop(),!0}shootLane(e){const t=this._state;if(t===null||this._config===null||this._talentSystem===null||t.phase!=="playing")return;const n=t.archers[e];if(n===void 0||!n.isReady)return;const s=this._config.shootCost-this._talentSystem.getShootCostReduction();if(t.energy<s)return;t.modifyEnergy(-s);const r=this._config.shootCooldown*this._talentSystem.getShootCooldownMultiplier();n.startCooldown(r);const i=this._talentSystem.getArrowSpeedMultiplier(),o=b.create(e,this._config,i,!1);t.addArrow(o)}activateAbility(e){const t=this._state;if(t===null||this._abilitySystem===null)return!1;if(e==="freeze")return t.phase!=="playing"&&t.phase!=="paused"?!1:this._abilitySystem.activateFreeze(t);if(t.phase!=="playing")return!1;switch(e){case"blizzard":return this._abilitySystem.activateBlizzard(t);case"prep":return this._abilitySystem.activatePrep(t);case"heal":return this._abilitySystem.activateHeal(t);case"volley":return this._abilitySystem.activateVolley(t);case"stand":return this._abilitySystem.activateStand(t);case"armageddon":return this._abilitySystem.activateArmageddon(t);default:return!1}}confirmLevelUp(){const e=this._state;e===null||this._config===null||this._talentSystem===null||e.phase!=="levelUp"||(e.advanceLevel(),e.setLevelTimer(this._config.levelTimerBase+this._config.levelTimerStep*e.level),this._applyTalentBonuses(),this._saveSystem.save(e,this._talentSystem),e.setPhase("playing"))}getState(){return this._state}getTalentSystem(){return this._talentSystem}getSaveSystem(){return this._saveSystem}_gameLoop(e){const t=this._state;if(t===null)return;let n;this._lastTimestamp<0?(n=0,this._lastTimestamp=e):(n=Math.min((e-this._lastTimestamp)/1e3,.1),this._lastTimestamp=e),t.phase==="playing"&&this._tick(n),this._renderCallback(t),this._detectPhaseChange(t),t.phase!=="gameOver"&&(this._animFrameId=requestAnimationFrame(s=>this._gameLoop(s)))}_detectPhaseChange(e){if(e.phase!==this._prevPhase){const t=e.phase;this._prevPhase=t,this._phaseChangeCallback?.(t,e)}}_tick(e){const t=this._state,n=this._config,s=this._spawner,r=this._arrowSystem,i=this._abilitySystem,o=this._talentSystem,d=this._formula;if(t===null||n===null||s===null||r===null||i===null||o===null||d===null)return;s.tick(e,t);for(const[,a]of t.spiders)a.dying||(this._handleNinjaJump(a,t),a.move(e));r.tick(e,t),i.tick(e,t);const c=n.hpRegen+o.getHpRegenBonus();t.modifyHp(c*e);const f=n.energyRegen*o.getEnergyRegenMultiplier();if(t.modifyEnergy(f*e),this._coinAccumulator+=n.coinsPerSec*e,this._coinAccumulator>=1){const a=Math.floor(this._coinAccumulator);t.addCoins(a),this._coinAccumulator-=a}for(const a of t.archers)a.tick(e);const y=o.getDamageReduction();for(const[,a]of t.spiders)if(!(a.dying||a.y<1)){if(this._reachedCastleSpiderIds.add(a.id),!t.isInvulnerable){const p=a.damage*(1-y);a.type==="burner"?(t.modifyHp(-p*Ue),t.modifyEnergy(-90)):t.modifyHp(-p)}a.startDying()}this._processDyingSpiders(t,d,e),t.tickLevelTimer(e),t.levelTimer<=0&&(t.setPhase("levelUp"),t.awardTalentPoint(),t.updateRecord(),this._saveSystem.save(t,o)),t.hp<=0&&t.setPhase("gameOver")}_handleNinjaJump(e,t){if(!(e instanceof k))return;const n=e;if(n.hasJumped||n.y<n.jumpThreshold)return;let s;n.lane===0?s=1:n.lane===8?s=7:s=n.lane+(Math.random()<.5?-1:1),n.changeLane(s),n.markJumped()}_processDyingSpiders(e,t,n){const s=[];for(const[r,i]of e.spiders)if(i.dying&&(i.tickDying(n),i.dyingTimer<=0)){if(s.push(r),!this._reachedCastleSpiderIds.has(r)){const o=t.randomInt(Ze,je);e.addCoins(o)}this._reachedCastleSpiderIds.delete(r)}for(const r of s)e.removeSpider(r)}_applyTalentBonuses(){const e=this._state,t=this._config,n=this._talentSystem;e===null||t===null||n===null||(e.setMaxHp(t.baseHp+n.getMaxHpBonus()),e.setMaxEnergy(t.baseEnergy+n.getMaxEnergyBonus()))}stopLoop(){cancelAnimationFrame(this._animFrameId)}_startLoop(){this._animFrameId=requestAnimationFrame(e=>this._gameLoop(e))}}class Ve{_onShoot;_onAbility;_enabled;_boundKeydown;constructor(e,t){this._onShoot=e,this._onAbility=t,this._enabled=!0,this._boundKeydown=this._handleKeydown.bind(this),window.addEventListener("keydown",this._boundKeydown)}_handleKeydown(e){if(!this._enabled)return;const t=e.key.toLowerCase();if(t>="1"&&t<="9"){this._onShoot(parseInt(t,10)-1);return}const s={q:"freeze",w:"blizzard",e:"prep",r:"heal",t:"volley",y:"stand",u:"armageddon"}[t];s&&this._onAbility(s)}setEnabled(e){this._enabled=e}destroy(){window.removeEventListener("keydown",this._boundKeydown)}}class $e{_container;_visible=!1;constructor(e,t){this._container=this._createDOM(e,t)}_createDOM(e,t){const n=document.createElement("div");n.className="freeze-overlay";const s=document.createElement("div");s.className="freeze-overlay__snowflake",s.innerHTML=t.get("Snowflake");const r=document.createElement("div");r.className="freeze-overlay__text",r.textContent="ЗАМОРОЗКА";const i=document.createElement("div");return i.className="freeze-overlay__hint",i.textContent="Нажмите Q чтобы продолжить",n.appendChild(s),n.appendChild(r),n.appendChild(i),e.appendChild(n),n}show(){this._container.style.display="flex",this._container.classList.add("active"),this._visible=!0}hide(){this._container.style.display="none",this._container.classList.remove("active"),this._visible=!1}isVisible(){return this._visible}}class Je{_container;_visible=!1;constructor(e){this._container=this._createDOM(e)}_createDOM(e){const t=document.createElement("div");t.className="armageddon-overlay";const n=document.createElement("div");n.className="armageddon-overlay__fire";const s=document.createElement("div");return s.className="armageddon-overlay__text",s.textContent="АРМАГЕДДОН",t.appendChild(n),t.appendChild(s),e.appendChild(t),t}show(){this._container.style.display="flex",this._container.classList.add("active"),this._visible=!0}hide(){this._container.style.display="none",this._container.classList.remove("active"),this._visible=!1}isVisible(){return this._visible}}const D=document.getElementById("app");if(!D)throw new Error("Root element #app not found");const G=new ue;G.loadAll();const _=new Ce(D,G);let g=null,m=null;const u=new qe(l=>{_.renderGameState(l),g&&(l.freezeActive?g.show():g.hide()),m&&(l.armageddonPhase==="firing"?m.show():m.hide())});u.setPhaseChangeCallback((l,e)=>{if(l==="gameOver"){const t=Math.max(e.record,e.level),n=e.level>=e.record;_.showGameOver(e.level,t,n)}else if(l==="levelUp"){const t=u.getTalentSystem(),n=u.getState();t&&n&&_.showLevelUp(e.level,t,e.pendingTalentPoints,()=>{u.confirmLevelUp(),_.getLevelUpScreen().hide()},()=>{n.spendTalentPoint()})}});_.setEngine({startNewGame:l=>{u.startNewGame(l),R()},loadGame:()=>{u.loadGame(),R()}});_.setSaveSystem(u.getSaveSystem());_.init();new Ve(l=>u.shootLane(l),l=>u.activateAbility(l));function R(){const l=_.getGameScreen().getGameField().getContainer();g||(g=new $e(l,G)),m||(m=new Je(l))}const Ke=_.getGameScreen().getHud().getArcherButtonsContainer();Ke.addEventListener("click",l=>{const e=l.target.closest(".archer-btn");if(!e)return;const t=parseInt(e.dataset.lane??"",10);isNaN(t)||u.shootLane(t)});const We=_.getGameScreen().getHud().getAbilityButtonsContainer();We.addEventListener("click",l=>{const e=l.target.closest(".ability-btn");if(!e)return;const t=e.dataset.ability;t&&u.activateAbility(t)});
