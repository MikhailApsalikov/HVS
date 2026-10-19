const frame = (art: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><radialGradient id="stormGem"><stop stop-color="#b4faff"/><stop offset="1" stop-color="#244d9a"/></radialGradient></defs><circle cx="24" cy="24" r="21" fill="#142643" stroke="#d7ad60" stroke-width="2"/>${art}</svg>`;
export const MAGIC_LEGENDARY_SVGS: Readonly<Record<string, string>> = {
  l028: frame('<path d="M24 5Q25 17 35 20Q44 37 27 42Q8 44 9 28Q17 29 17 18Q23 22 24 5Z" fill="#ef7833" stroke="#ffd076" stroke-width="2"/><path d="M25 23Q34 34 25 38Q16 37 20 30Z" fill="#fff1a5"/>'),
  l029: frame('<path d="M13 17L18 42L32 38L34 13Z" fill="#466a99" stroke="#e4c77b" stroke-width="2"/><path d="M17 5L14 24H21L18 34L29 16H22L27 5M31 4L28 17H34L31 28L40 13H34L38 4" fill="#c8faff" stroke="#58c6ed"/>'),
  l030: frame('<path d="M24 6L39 24L24 42L9 24Z" fill="url(#stormGem)" stroke="#e9d087" stroke-width="2"/><path d="M24 6V42M9 24H39" stroke="#d7faff"/><path d="M7 9L4 18L11 17M37 31L44 30L41 40" fill="none" stroke="#94e9ff" stroke-width="2"/>'),
  l031: frame('<circle cx="24" cy="24" r="14" fill="url(#stormGem)" stroke="#e8d298" stroke-width="3"/><path d="M24 13V25L32 30M13 8L7 14M35 8L41 14M13 40L7 34M35 40L41 34" stroke="#efffff" stroke-width="2" fill="none"/><path d="M10 24H38M24 10V38" stroke="#aff3ff" stroke-dasharray="2 7"/>'),
  l032: frame('<path d="M24 7L38 13L35 31Q31 38 24 42Q17 38 13 31L10 13Z" fill="url(#stormGem)" stroke="#e9d087" stroke-width="2"/><path d="M27 13L18 27H25L21 37L32 22H25Z" fill="#eeffff"/>'),
  l033: frame('<path d="M8 17L16 25L24 9L32 25L40 17L36 38H12Z" fill="#9e762e" stroke="#efd294" stroke-width="2"/><path d="M12 32H36M14 37H34" stroke="#f8e2a6" stroke-width="2"/><path d="M26 15L19 27H25L21 35L31 23H25Z" fill="#b9f8ff" stroke="#6bc9ff"/>'),
};
