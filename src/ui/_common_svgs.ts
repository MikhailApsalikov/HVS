export const COMMON_SVGS: Record<string, string> = {

  // ═══ +макс. HP (armor/protection — reds, browns, grays) ═══

  c001: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M10 16l6-6 22 22-6 6Z" fill="#F0E6D0"/><path d="M32 10l6 6-22 22-6-6Z" fill="#E8DCC6"/><rect x="19" y="19" width="10" height="10" rx="2" fill="#D44040"/></svg>',

  c003: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><polygon points="24,8 40,24 24,40 8,24" fill="#8B6B42"/><path d="M13 17l4-4M31 13l4 4M35 31l-4 4M17 35l-4-4" stroke="#5A4020" stroke-width="2" fill="none"/></svg>',

  c005: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><polygon points="14,10 20,6 24,10 28,6 34,10 36,40 30,42 24,38 18,42 12,40" fill="#9B7930"/><line x1="24" y1="10" x2="24" y2="38" stroke="#7A5A1A" stroke-width="1.5"/></svg>',

  c009: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><polygon points="14,8 22,6 24,10 26,6 34,8 38,40 28,42 24,40 20,42 10,40" fill="#556B44"/><circle cx="24" cy="18" r="1.5" fill="#333"/><circle cx="24" cy="26" r="1.5" fill="#333"/><circle cx="24" cy="34" r="1.5" fill="#333"/></svg>',

  c012: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><ellipse cx="15" cy="26" rx="11" ry="8" fill="#7A6040"/><ellipse cx="33" cy="26" rx="11" ry="8" fill="#7A6040"/><path d="M36 18c1-5 3-12 5-14c1 4-1 12-3 16Z" fill="#3A8030"/></svg>',

  c015: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M2 20Q2 10 14 10h8v18h-8Q2 28 2 20Z" fill="#C8D0DC"/><path d="M26 10h8Q46 10 46 20Q46 28 34 28h-8Z" fill="#C8D0DC"/><path d="M10 16h8M30 16h8" stroke="#A8B0BC" stroke-width="2" fill="none"/></svg>',

  c020: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M10 10h28l4 8v14l-6 8h-24l-6-8V18Z" fill="#E8F0FF"/><path d="M6 24h4M38 24h4M24 4v6" stroke="#FFF" stroke-width="2.5" fill="none"/><line x1="24" y1="10" x2="24" y2="40" stroke="#C8D8F0" stroke-width="1"/></svg>',

  // ═══ +реген HP/сек (healing/nature — greens, purples, browns) ═══

  c021: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><ellipse cx="18" cy="18" rx="8" ry="12" fill="#4A8B3F" transform="rotate(-15 18 18)"/><ellipse cx="30" cy="18" rx="8" ry="12" fill="#3D7A33" transform="rotate(15 30 18)"/><ellipse cx="24" cy="16" rx="6" ry="10" fill="#55A048"/><rect x="21" y="28" width="6" height="14" rx="2" fill="#8B6B42"/></svg>',

  c022: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="20" y="4" width="8" height="8" rx="2" fill="#777"/><path d="M16 12h16v26Q32 44 24 44Q16 44 16 38Z" fill="#7A3FA0"/><rect x="20" y="4" width="8" height="4" rx="2" fill="#555"/></svg>',

  c023: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M20 4h8v8l6 8v14Q34 44 24 44Q14 44 14 34V20l6-8Z" fill="#2E9B35"/><rect x="20" y="2" width="8" height="4" rx="1" fill="#666"/><circle cx="20" cy="30" r="2.5" fill="#60DD65"/><circle cx="27" cy="36" r="2" fill="#60DD65"/></svg>',

  c025: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="18" y="4" width="12" height="6" rx="2" fill="#777"/><path d="M14 10h20v28Q34 44 24 44Q14 44 14 38Z" fill="#A0C840"/><circle cx="24" cy="28" r="3" fill="#333"/><path d="M21 26l-4-4M27 26l4-4M21 30l-4 4M27 30l4 4" stroke="#333" stroke-width="1.5" fill="none"/></svg>',

  c027: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M18 14h12l4 8v14Q34 44 24 44Q14 44 14 36V22Z" fill="#E09030"/><rect x="19" y="6" width="10" height="8" rx="2" fill="#888"/><ellipse cx="24" cy="14" rx="8" ry="2" fill="#AA7020"/></svg>',

  c030: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="10" y="16" width="28" height="24" rx="4" fill="#4A8040"/><rect x="8" y="12" width="32" height="6" rx="3" fill="#8B7355"/><ellipse cx="24" cy="28" rx="6" ry="4" fill="#60AA50"/></svg>',

  c035: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="12" y="18" width="24" height="22" rx="4" fill="#DAA520"/><rect x="10" y="14" width="28" height="6" rx="3" fill="#C89418"/><path d="M24 6v6M16 8l3 5M32 8l-3 5" stroke="#FFD700" stroke-width="2" fill="none"/></svg>',

  // ═══ % снижение урона (defensive — grays, silvers, blues) ═══

  c040: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M14 14h20v12l-4 4v14h-12v-14l-4-4Z" fill="#909090"/><rect x="22" y="6" width="4" height="8" fill="#909090"/><circle cx="20" cy="20" r="2" fill="none" stroke="#666" stroke-width="1.5"/><circle cx="28" cy="20" r="2" fill="none" stroke="#666" stroke-width="1.5"/><circle cx="24" cy="26" r="2" fill="none" stroke="#666" stroke-width="1.5"/></svg>',

  c046: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 4L42 14v14Q42 42 24 46Q6 42 6 28V14Z" fill="#7888A0"/><path d="M20 16v16M28 16v16M16 24h16" stroke="#A0D0FF" stroke-width="2" fill="none"/></svg>',

  c050: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M12 8h24l4 8v16l-6 10h-20l-6-10V16Z" fill="#6A7078"/><rect x="16" y="14" width="16" height="8" rx="1" fill="#808890"/><rect x="16" y="26" width="16" height="8" rx="1" fill="#808890"/></svg>',

  c052: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="8" y="8" width="12" height="34" rx="3" fill="#808890"/><rect x="28" y="8" width="12" height="34" rx="3" fill="#808890"/><circle cx="14" cy="18" r="5" fill="#A0A8B0"/><circle cx="34" cy="18" r="5" fill="#A0A8B0"/></svg>',

  c055: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 2L44 12v16Q44 42 24 46Q4 42 4 28V12Z" fill="#60A8E0"/><path d="M24 10L36 16v10Q36 36 24 40Q12 36 12 26V16Z" fill="#80C0F0"/><path d="M4 24h6M38 24h6M24 2v6" stroke="#A0E0FF" stroke-width="2" fill="none"/></svg>',

  // ═══ +макс. энергия (magic/energy — blues, cyans) ═══

  c056: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="28" r="14" fill="#3070C0"/><rect x="20" y="6" width="8" height="12" rx="2" fill="#888"/><rect x="20" y="6" width="8" height="4" rx="2" fill="#666"/></svg>',

  c058: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><polygon points="24,2 32,16 28,44 20,44 16,16" fill="#4080D0"/><polygon points="24,2 32,16 24,14" fill="#60A0F0"/><polygon points="20,44 16,16 24,14" fill="#2060A0"/></svg>',

  c060: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M16 4Q16 18 24 22Q32 18 32 4" stroke="#999" stroke-width="2" fill="none"/><circle cx="24" cy="30" r="12" fill="#4070B0"/><rect x="20" y="24" width="8" height="12" rx="1" fill="#E0D8C0"/><path d="M20 27h8M20 31h8" stroke="#4070B0" stroke-width="1.5" fill="none"/></svg>',

  c062: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M18 4Q18 16 24 20Q30 16 30 4" stroke="#AA8830" stroke-width="2" fill="none"/><circle cx="24" cy="30" r="12" fill="#DAA520"/><circle cx="24" cy="30" r="7" fill="#2050C0"/></svg>',

  c064: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="#2858A8"/><circle cx="24" cy="24" r="10" fill="#3868C0"/><ellipse cx="20" cy="18" rx="4" ry="3" fill="#5088E0"/></svg>',

  c066: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="8" y="18" width="32" height="22" rx="3" fill="#6A5A40"/><path d="M6 16h36l-2 4H8Z" fill="#8A7A60"/><rect x="20" y="24" width="8" height="10" rx="2" fill="#3070D0"/><circle cx="24" cy="29" r="2" fill="#60B0FF"/></svg>',

  // ═══ +реген энергии/сек (electricity — yellows, oranges) ═══

  c068: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="20" y="6" width="8" height="28" rx="2" fill="#B0B8A0"/><rect x="22" y="14" width="4" height="16" fill="#A0C840"/><rect x="18" y="34" width="12" height="4" rx="1" fill="#888"/><line x1="24" y1="38" x2="24" y2="44" stroke="#888" stroke-width="2"/></svg>',

  c076: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="18" y="4" width="6" height="28" rx="2" fill="#B0B8A0" transform="rotate(-15 21 18)"/><rect x="24" y="4" width="6" height="28" rx="2" fill="#B0B8A0" transform="rotate(15 27 18)"/><rect x="19" y="10" width="4" height="16" fill="#A0C840" transform="rotate(-15 21 18)"/><rect x="25" y="10" width="4" height="16" fill="#A0C840" transform="rotate(15 27 18)"/><rect x="14" y="36" width="20" height="4" rx="1" fill="#888"/></svg>',

  // ═══ +энергия за убийство (combat reward — reds, purples) ═══

  c078: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="20" y="6" width="8" height="28" rx="2" fill="#C0A0A0"/><rect x="22" y="14" width="4" height="16" fill="#D03030"/><rect x="18" y="34" width="12" height="4" rx="1" fill="#888"/><line x1="24" y1="38" x2="24" y2="44" stroke="#888" stroke-width="2"/><circle cx="24" cy="10" r="3" fill="#444"/></svg>',

  c086: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="18" y="4" width="6" height="28" rx="2" fill="#C0A0A0" transform="rotate(-15 21 18)"/><rect x="24" y="4" width="6" height="28" rx="2" fill="#C0A0A0" transform="rotate(15 27 18)"/><rect x="19" y="10" width="4" height="16" fill="#D03030" transform="rotate(-15 21 18)"/><rect x="25" y="10" width="4" height="16" fill="#D03030" transform="rotate(15 27 18)"/><rect x="14" y="36" width="20" height="4" rx="1" fill="#888"/></svg>',

  // ═══ +энергия при прорыве (fortress/guardian — browns, stone) ═══

  c088: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 10L38 18v12Q38 38 24 42Q10 38 10 30V18Z" fill="#8B6B42"/><path d="M24 8l-6-6-2 4M24 8l6-6 2 4" stroke="#AA9060" stroke-width="2.5" fill="none"/><circle cx="24" cy="26" r="4" fill="#AA9060"/></svg>',

  c094: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M16 4Q16 18 24 22Q32 18 32 4" stroke="#8A7A60" stroke-width="2" fill="none"/><circle cx="24" cy="30" r="12" fill="#A09880"/><ellipse cx="24" cy="30" rx="8" ry="5" fill="#F0E8D0"/><circle cx="24" cy="30" r="3" fill="#4A6020"/></svg>',

  // ═══ +монетки за убийство (wealth — golds) ═══

  c096: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M10 18Q10 10 24 10Q38 10 38 18v20Q38 42 24 42Q10 42 10 38Z" fill="#8B6B42"/><path d="M10 18Q10 14 24 14Q38 14 38 18" stroke="#6B4B22" stroke-width="2" fill="none"/><circle cx="20" cy="12" r="4" fill="#DAA520"/><circle cx="28" cy="10" r="4" fill="#FFD700"/></svg>',

};
