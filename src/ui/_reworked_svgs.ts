const icon = (art: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${art}</svg>`;

/** New illustrations in the existing 48px equipment style. */
export const REWORKED_SVGS: Readonly<Record<string, string>> = {
  l021: icon(`
    <path d="M6 9L24 3L42 9V25Q40 37 24 45Q8 37 6 25Z" fill="#354971" stroke="#EBC979" stroke-width="3"/>
    <path d="M24 9L28 20L38 23L28 27L24 39L20 27L10 23L20 20Z" fill="#F8DE93"/>
    <circle cx="24" cy="23" r="5" fill="#91DEEA" stroke="#FFF3CC" stroke-width="2"/>
  `),
  l022: icon(`
    <path d="M9 7L24 17L39 7M10 3L24 12L38 3" fill="none" stroke="#E2BE67" stroke-width="3"/>
    <path d="M24 43Q2 29 9 19Q16 12 24 21Q32 12 39 19Q46 29 24 43Z" fill="#AA3F44" stroke="#FFD685" stroke-width="3"/>
    <path d="M12 28H19L22 22L26 34L29 27H37" fill="none" stroke="#FFF0BB" stroke-width="2"/>
  `),
  l023: icon(`
    <path d="M14 19L25 44L38 38L29 13Z" fill="#84533E" stroke="#E8BC69" stroke-width="3"/>
    <path d="M18 23L9 4M23 21L18 2M28 19L27 3" stroke="#EDE0AE" stroke-width="2"/>
    <path d="M7 4L11 12L14 4M16 2L19 10L22 3M25 3L27 11L31 5" fill="#DF6860"/>
    <path d="M21 29L29 25M24 36L32 32" stroke="#F6D17C" stroke-width="3"/>
  `),
  l024: icon(`
    <path d="M4 18L16 12L24 5L32 12L44 18L37 35L24 44L11 35Z" fill="#615039" stroke="#EFD07C" stroke-width="2"/>
    <path d="M8 24Q24 7 40 24Q24 39 8 24Z" fill="#E6E8CA"/>
    <circle cx="24" cy="24" r="9" fill="#79B8AA"/><circle cx="24" cy="24" r="5" fill="#173E47"/>
    <circle cx="27" cy="21" r="2" fill="#FFFFFF"/>
  `),
  l025: icon(`
    <path d="M10 4L17 16M38 4L31 16" stroke="#DFC379" stroke-width="3"/>
    <path d="M24 11L41 22L35 39L24 45L13 39L7 22Z" fill="#3A655D" stroke="#F0CE7D" stroke-width="3"/>
    <path d="M15 22L24 30L33 22M15 29L24 37L33 29" fill="none" stroke="#F4DC95" stroke-width="3"/>
    <circle cx="24" cy="18" r="3" fill="#D2F1D0"/>
  `),
  l026: icon(`
    <path d="M13 4Q44 24 13 44" fill="none" stroke="#E8BF6B" stroke-width="5"/>
    <path d="M13 4L19 24L13 44" fill="none" stroke="#F7E9BB" stroke-width="1.5"/>
    <path d="M3 24H40M34 18L43 24L34 30" fill="none" stroke="#ABDEE3" stroke-width="3"/>
    <path d="M26 9L33 11M29 15L36 17M29 33L36 31M26 39L33 37" stroke="#A3D1BC" stroke-width="2"/>
  `),
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
