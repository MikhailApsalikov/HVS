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
  'c-regen-flow': icon(`
    <path d="M19 5H29V17Q40 23 38 35Q37 43 24 44Q11 43 10 35Q8 23 19 17Z" fill="#446B57" stroke="#A9B896" stroke-width="2"/>
    <path d="M13 29Q24 33 35 29V35Q33 40 24 41Q15 40 13 35Z" fill="#85C885"/>
    <path d="M18 5H30V11H18Z" fill="#AD8B5C"/>
    <path d="M26 20L20 29H25L22 36L29 27H24Z" fill="#E0EDAC"/>
    <path d="M16 21L13 25" stroke="#DFE8CE" stroke-width="2" stroke-linecap="round"/>
  `),
  'r-regen-potion': icon(`
    <path d="M17 7H31V16Q42 23 40 35Q38 44 24 45Q10 44 8 35Q6 23 17 16Z" fill="#344E70" stroke="#9FCAD8" stroke-width="2"/>
    <path d="M12 29Q24 24 36 29V35Q33 41 24 42Q15 41 12 35Z" fill="#63B3CD"/>
    <path d="M16 3H32V10H16Z" fill="#9E9BB4" stroke="#D3D8E1" stroke-width="1.5"/>
    <path d="M24 17L28 26L24 35L20 26Z" fill="#E5F5D3"/>
    <circle cx="33" cy="35" r="2" fill="#CDEDE9"/><circle cx="16" cy="33" r="1.5" fill="#CDEDE9"/>
  `),
  'c-crit-focus': icon(`
    <path d="M9 38L34 13" stroke="#92724E" stroke-width="5"/>
    <circle cx="25" cy="23" r="16" fill="#3E5541" stroke="#AAB79A" stroke-width="3"/>
    <circle cx="25" cy="23" r="10" fill="#6A9271"/>
    <path d="M25 7V18M25 28V39M9 23H20M30 23H41" stroke="#DFE7B9" stroke-width="2"/>
    <circle cx="25" cy="23" r="3" fill="#F3E5A4"/>
  `),
  'c-block-charm': icon(`
    <path d="M11 4Q11 19 24 22Q37 19 37 4" fill="none" stroke="#A49163" stroke-width="3"/>
    <path d="M13 19L24 16L35 19V30Q33 39 24 44Q15 39 13 30Z" fill="#52694B" stroke="#B3BD97" stroke-width="2"/>
    <path d="M24 22L29 30L24 38L19 30Z" fill="#D6DEA7"/>
    <circle cx="24" cy="16" r="2" fill="#E2D6A6"/>
  `),
  'c-block-bracelet': icon(`
    <ellipse cx="24" cy="26" rx="19" ry="14" fill="#71825B" stroke="#BDC397" stroke-width="3"/>
    <ellipse cx="24" cy="26" rx="11" ry="7" fill="#334B39" stroke="#9BAC7B" stroke-width="2"/>
    <path d="M16 8L24 5L32 8V19Q31 25 24 29Q17 25 16 19Z" fill="#65764D" stroke="#CFD7A1" stroke-width="2"/>
    <path d="M24 11V23M19 17H29" stroke="#E8E2BB" stroke-width="2"/>
    <circle cx="8" cy="25" r="2" fill="#E2D2A0"/><circle cx="40" cy="25" r="2" fill="#E2D2A0"/>
  `),
  'r-block-sigil': icon(`
    <path d="M13 5L24 8L35 5L31 17L17 17Z" fill="#8EABC3" stroke="#D1DBDC" stroke-width="2"/>
    <circle cx="24" cy="30" r="15" fill="#344E70" stroke="#A6C9D6" stroke-width="3"/>
    <path d="M17 23L24 20L31 23V31Q29 37 24 40Q19 37 17 31Z" fill="#77B3C2" stroke="#D3E9E5" stroke-width="1.5"/>
    <path d="M24 24V35M20 29H28" stroke="#F0E8BD" stroke-width="2"/>
  `),
  'r-block-rune': icon(`
    <path d="M15 4L34 8L42 25L31 44L11 38L5 21Z" fill="#354F6D" stroke="#95B9CF" stroke-width="3"/>
    <path d="M14 15L24 10L34 15V28L24 37L14 28Z" fill="none" stroke="#C8ECEA" stroke-width="3"/>
    <path d="M24 11V36M15 22H33M17 28L24 22L31 28" fill="none" stroke="#76C7D3" stroke-width="2"/>
  `),
  'r-block-vest': icon(`
    <path d="M14 5L20 9H28L34 5L43 15L35 21V43H13V21L5 15Z" fill="#4F6C82" stroke="#B2CAD7" stroke-width="2"/>
    <path d="M14 6Q24 22 34 6M14 35H34" fill="none" stroke="#D8DDBC" stroke-width="2"/>
    <path d="M18 20L24 18L30 20V29Q28 34 24 37Q20 34 18 29Z" fill="#35536B" stroke="#86BCCC" stroke-width="2"/>
    <path d="M24 22V32" stroke="#ECEDCC" stroke-width="2"/>
  `),
  'r-block-gauntlets': icon(`
    <path d="M5 22V12H10V21L13 7H18L17 23L22 15L27 19L22 31L17 36H7Z" fill="#446C83" stroke="#B3CED8" stroke-width="2"/>
    <path d="M7 34H18V43H7Z" fill="#2D4C64" stroke="#B3CED8" stroke-width="2"/>
    <path d="M26 24V14H31V23L34 9H39L38 25L43 17L47 21L42 33L37 38H27Z" fill="#618C9E" stroke="#D1E1E1" stroke-width="2"/>
    <path d="M27 36H38V45H27Z" fill="#3E6077" stroke="#D1E1E1" stroke-width="2"/>
    <path d="M10 25L13 23L16 25V29L13 32L10 29ZM30 27L33 25L36 27V31L33 34L30 31Z" fill="#DEEAC5"/>
  `),
  'e-block-heart': icon(`
    <path d="M8 9L24 3L40 9V27Q37 39 24 45Q11 39 8 27Z" fill="#5C3E7B" stroke="#C3A0D7" stroke-width="3"/>
    <path d="M24 35Q9 24 14 18Q18 13 24 20Q30 13 34 18Q39 24 24 35Z" fill="#D879A3" stroke="#E4C1CB" stroke-width="1.5"/>
    <path d="M16 25H21L23 21L26 30L28 25H32" fill="none" stroke="#F8EBBD" stroke-width="2"/>
  `),
  'e-block-warden': icon(`
    <path d="M10 7L18 3L24 9L30 3L38 7L44 19L36 24L34 43H14L12 24L4 19Z" fill="#5B487A" stroke="#C1A7D3" stroke-width="2"/>
    <path d="M14 13L24 8L34 13V28Q31 37 24 41Q17 37 14 28Z" fill="#393451" stroke="#D0B58E" stroke-width="2"/>
    <path d="M24 12L28 23L32 26L28 29L24 38L20 29L16 26L20 23Z" fill="#AD8CC2"/>
    <path d="M24 14V35" stroke="#EDE1B6" stroke-width="1.5"/>
  `),
  'e-block-medic': icon(`
    <path d="M9 6L24 12L39 6L44 19L36 25L35 42H13L12 25L4 19Z" fill="#6A547E" stroke="#C4A6D3" stroke-width="2"/>
    <path d="M17 17L24 14L31 17V29L24 37L17 29Z" fill="#4B375F" stroke="#D6BCD8" stroke-width="2"/>
    <path d="M21 19H27V23H31V29H27V33H21V29H17V23H21Z" fill="#C5E0C0"/>
    <path d="M14 38H34" stroke="#E3D4B3" stroke-width="2"/>
  `),
  'e-block-income': icon(`
    <path d="M13 4L24 13L35 4M16 3L24 8L32 3" fill="none" stroke="#BA99CD" stroke-width="3"/>
    <path d="M8 18L24 11L40 18L36 34L24 44L12 34Z" fill="#584573" stroke="#CCB28C" stroke-width="3"/>
    <circle cx="24" cy="27" r="10" fill="#D5B46E" stroke="#EEE0AA" stroke-width="2"/>
    <path d="M19 21L24 19L29 21V28L24 33L19 28Z" fill="#786346"/>
    <path d="M24 22V29M21 25H27" stroke="#F9E3A3" stroke-width="1.5"/>
  `),
};
