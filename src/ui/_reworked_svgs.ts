const icon = (art: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${art}</svg>`;

/** New illustrations in the existing 48px equipment style. */
export const REWORKED_SVGS: Readonly<Record<string, string>> = {
  c088: icon(`
    <path d="M10 39L33 16" stroke="#9D784E" stroke-width="5"/>
    <path d="M23 15L41 7L33 26L31 17Z" fill="#D8E5D9" stroke="#587464" stroke-width="2"/>
    <path d="M6 31L13 31L17 35L17 42L11 38Z" fill="#75A96A"/>
    <path d="M22 8V3M40 30H45M8 16H3" stroke="#C6D893" stroke-width="2"/>
  `),
  r018: icon(`
    <path d="M8 36L35 9" stroke="#628B9C" stroke-width="6"/>
    <circle cx="25" cy="22" r="14" fill="#344D60" stroke="#C4D7E1" stroke-width="3"/>
    <circle cx="25" cy="22" r="9" fill="#62BCD3"/>
    <path d="M25 8V17M25 27V36M11 22H20M30 22H39" stroke="#E7F7F7" stroke-width="2"/>
    <circle cx="25" cy="22" r="2" fill="#FFFFFF"/>
  `),
  e008: icon(`
    <path d="M5 11L18 16L24 8L30 16L43 11L38 31L24 42L10 31Z" fill="#665089" stroke="#BFA2D8" stroke-width="2"/>
    <path d="M10 24Q24 9 38 24Q24 37 10 24Z" fill="#EADDB6"/>
    <circle cx="24" cy="24" r="8" fill="#8A62C2"/>
    <path d="M24 17L27 24L24 31L21 24Z" fill="#2E2546"/>
    <circle cx="27" cy="21" r="2" fill="#FFFFFF"/>
  `),
  r037: icon(`
    <path d="M12 5Q12 17 24 21Q36 17 36 5" fill="none" stroke="#9AABB0" stroke-width="3"/>
    <path d="M24 17L37 28L24 43L11 28Z" fill="#42675F" stroke="#C9D3BB" stroke-width="2"/>
    <path d="M17 32L31 22M22 22H31V31" fill="none" stroke="#D4EBB7" stroke-width="3"/>
  `),
  r038: icon(`
    <path d="M12 4L18 15M36 4L30 15" stroke="#AAB2C8" stroke-width="3"/>
    <circle cx="24" cy="27" r="16" fill="#3E536E" stroke="#CCD5E5" stroke-width="3"/>
    <circle cx="24" cy="27" r="10" fill="#6EACBD"/>
    <circle cx="24" cy="27" r="4" fill="#F1E5AE"/>
    <path d="M24 9V19M24 35V44M6 27H16M32 27H42" stroke="#F0EBCB" stroke-width="2"/>
  `),
  'r-coins': icon(`
    <path d="M13 8L24 11L35 8L30 19Q43 31 38 39Q24 46 10 39Q5 31 18 19Z" fill="#846247" stroke="#473F39" stroke-width="2"/>
    <path d="M16 18H32M16 21H32" stroke="#76AAC0" stroke-width="3"/>
    <circle cx="24" cy="32" r="8" fill="#DDB965" stroke="#F3D995" stroke-width="2"/>
    <path d="M24 27V37M20 30H27L21 34H28" stroke="#966C36" stroke-width="2"/>
  `),
};
