const icon = (art: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${art}</svg>`;

/** Single-attribute equipment, in the catalog's flat 48px illustration style. */
export const ATTRIBUTE_SVGS: Readonly<Record<string, string>> = {
  // Ловкость: кожа, зелёная ткань, серебро и перья.
  'c001-agility': icon(`
    <path d="M7 23V11h4v10h2V8h4v13h2V12h4v15l-5 7H9l-5-8 2-6z" fill="#A47A4B"/>
    <path d="M28 23V11h4v10h2V8h4v13h2V12h4v15l-5 7h-9l-5-8 2-6z" fill="#C29761"/>
    <path d="M9 32h11v9H9zM30 32h11v9H30z" fill="#4E7046"/>
    <path d="M12 35h5m16 0h5M12 25h5m16 0h5" stroke="#E3C99C" stroke-width="2"/>
  `),
  'c003-agility': icon(`
    <path d="M9 8h12v21l4 5v6H5v-8l5-3z" fill="#795739"/>
    <path d="M26 11h12v18l6 5v7H24v-8l4-4z" fill="#AC8050"/>
    <path d="M8 8h14v6H8zM25 11h14v6H25z" fill="#5F7847"/>
    <path d="M5 38h20v4H5zM24 39h20v4H24z" fill="#453C32"/>
    <path d="M12 20h6m12 3h6" stroke="#D8C39A" stroke-width="3"/>
  `),
  'c005-agility': icon(`
    <path d="M4 16q20-7 40 0v16q-20 7-40 0z" fill="#6E4E32"/>
    <path d="M5 19q19-6 38 0M5 29q19 6 38 0" fill="none" stroke="#A97E4F" stroke-width="2"/>
    <rect x="17" y="15" width="14" height="18" rx="3" fill="#CFAB61"/>
    <rect x="21" y="19" width="6" height="10" rx="1" fill="#445F3C"/>
    <path d="M24 24h10" stroke="#E9D396" stroke-width="2"/>
    <circle cx="10" cy="24" r="1.5" fill="#302A23"/><circle cx="39" cy="24" r="1.5" fill="#302A23"/>
  `),
  'c009-agility': icon(`
    <path d="M5 8l15 3-2 31-11-2z" fill="#937049"/>
    <path d="M28 11l15-3-2 32-11 2z" fill="#B08B59"/>
    <path d="M5 13l15 3M6 32l13 3M28 16l15-3M29 35l13-3" stroke="#425B38" stroke-width="5"/>
    <path d="M12 18v11m-3-8 3-3 3 3M36 18v11m-3-8 3-3 3 3" fill="none" stroke="#ECD6A8" stroke-width="2"/>
  `),
  'c012-agility': icon(`
    <path d="M20 7h16l-3 22 10 8v6H12v-9l8-8z" fill="#567B4C"/>
    <path d="M18 7h20v6H18zM12 40h31v4H12z" fill="#344B35"/>
    <path d="M23 28C9 26 7 15 5 9l13 7 8 2-5 3 5 3z" fill="#E4E9CC"/>
    <path d="m9 15 12 6m-9-1 9 4" stroke="#9DBA92" stroke-width="1.5"/>
    <path d="M28 17h6m-7 6h6" stroke="#D8C78F" stroke-width="2"/>
  `),
  'c015-agility': icon(`
    <path d="M13 24V8h5v13h2V5h5v16h2V8h5v14h2V12h5v17l-7 7H18L8 26l2-7z" fill="#70875A"/>
    <path d="M18 34h15v10H18z" fill="#A78049"/>
    <circle cx="25" cy="27" r="7" fill="#344D37" stroke="#D5D8A5" stroke-width="2"/>
    <circle cx="25" cy="27" r="2" fill="#D5D8A5"/>
    <path d="M25 17v5m0 10v4m-11-9h6m10 0h6" stroke="#E5D8AE" stroke-width="1.5"/>
  `),
  'c020-agility': icon(`
    <path d="M5 9l15 2-2 30-11-2zM28 11l15-2-2 30-11 2z" fill="#B8D8E0"/>
    <path d="m5 9 7 5 8-3-2 9-6 3-6-4zM28 11l8 3 7-5-1 10-6 4-6-3z" fill="#E4F6F2"/>
    <path d="m8 30 5 4 6-3M29 31l6 3 6-4" fill="none" stroke="#527F89" stroke-width="3"/>
    <path d="m13 21-3 5 3 4 3-4zM35 21l-3 5 3 4 3-4z" fill="#4BAF97"/>
    <path d="M24 3v8m-4-4h8" stroke="#E7FFFF" stroke-width="2"/>
  `),
  'r001-agility': icon(`
    <path d="M15 17 5 41q19 7 38 0L33 17z" fill="#315D47"/>
    <path d="M24 18 15 43l9-4 9 4z" fill="#487F59"/>
    <path d="M13 19C12 1 36 1 35 19l-11 7z" fill="#6B9463"/>
    <path d="M18 18q0-14 12 0l-6 5z" fill="#1B3431"/>
    <path d="M14 21 8 40m26-19 6 19" stroke="#C2B67D" stroke-width="2"/>
    <circle cx="24" cy="26" r="3" fill="#D6BC70"/>
  `),
  'r002-agility': icon(`
    <path d="M3 16q21-7 42 0v16q-21 7-42 0z" fill="#284D46"/>
    <path d="M5 19h10m18 0h10M5 29h10m18 0h10" stroke="#80AB85" stroke-width="2"/>
    <path d="m24 12 11 12-11 12-11-12z" fill="#D6B969"/>
    <path d="m24 17 7 7-7 7-7-7z" fill="#3F7757"/>
    <path d="m21 19 6 5-6 5m6-5H17" fill="none" stroke="#F2E2AD" stroke-width="2"/>
    <path d="M7 21v6m34-6v6" stroke="#C1A967" stroke-width="2"/>
  `),
  'r003-agility': icon(`
    <path d="M21 6h16l-4 21 10 10v5H13v-9l7-8z" fill="#3D9686"/>
    <path d="M20 6h18v5H20zM13 39h30v4H13z" fill="#255766"/>
    <path d="m22 26-9-1L6 12l11 7 11-3-6 6 7 2z" fill="#C6F2DB"/>
    <path d="M5 32h6M3 37h7M6 42h4" stroke="#8ADCC1" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M33 16q10-5 10 0t-7 4M32 3q-7 0-7 5" fill="none" stroke="#D0E6BA" stroke-width="2"/>
  `),
  'r004-agility': icon(`
    <path d="M14 23V9h5v12h2V5h5v16h2V8h5v14h2V13h5v16l-8 8H18L8 27l2-8z" fill="#C7D5CF"/>
    <path d="M18 35h15v10H18z" fill="#D0AA59"/>
    <path d="m25 18 8 9-8 9-8-9z" fill="#A38343"/>
    <path d="m25 21 5 6-5 6-5-6z" fill="#40AD7B"/>
    <path d="M13 31q-8-7-6-17m30 20q8-6 7-14M7 18l-3-3m3 9-4-2m39 4 4-3" fill="none" stroke="#D6C47A" stroke-width="2"/>
  `),
  'e001-agility': icon(`
    <path d="M6 26C1 10 19 2 33 8M42 22c6 17-17 23-27 15" fill="none" stroke="#509D9B" stroke-width="3"/>
    <path d="m24 6 13 13-4 17-9 8-10-8-4-17z" fill="#176763"/>
    <path d="m24 6 7 14-7 24-7-24z" fill="#59C4AA"/>
    <path d="m24 6 13 13-6 1-7-14-14 13 7 1z" fill="#B2EDCF"/>
    <path d="m28 13-13 15h9l-3 11 14-17h-9z" fill="#F4E9A2"/>
    <path d="M6 5v6m-3-3h6M41 35v6m-3-3h6" stroke="#BEF4DD" stroke-width="2"/>
  `),
  'e002-agility': icon(`
    <path d="M22 25C15 25 9 17 3 5l1 18 6-3-2 12 7-4-1 11 9-8z" fill="#BBD8D4"/>
    <path d="M26 25C33 25 39 17 45 5l-1 18-6-3 2 12-7-4 1 11-9-8z" fill="#E1EEE0"/>
    <path d="M8 13l12 14M12 23l8 5m-3 3 4-2M40 13 28 27m8-4-8 5m3 3-4-2" stroke="#6D9A93" stroke-width="2"/>
    <path d="m24 15 7 12-7 16-7-16z" fill="#CEA95C"/>
    <path d="m24 20 4 7-4 10-4-10z" fill="#3FAD8B"/>
    <circle cx="24" cy="9" r="2" fill="#E9E7B9"/>
  `),

  // Интеллект: пергамент, синие книги, серебро и фиолетовые кристаллы.
  'c001-intellect': icon(`
    <path d="M10 7h26v32H10z" fill="#E3D3A3"/>
    <path d="M9 6h27v6H9zM9 36h27v6H9z" fill="#B49A6F"/>
    <path d="M15 18h12m-12 6h9m-9 6h7" stroke="#627697" stroke-width="2"/>
    <path d="M24 36 38 10q7 8-2 16l-8 5z" fill="#94BEDC"/>
    <path d="m25 36 12-20" stroke="#3F638D" stroke-width="2"/>
  `),
  'c003-intellect': icon(`
    <path d="M10 6h27v36H10q-5-3-5-7V13q0-5 5-7z" fill="#3B5A8E"/>
    <path d="M11 9h23v29H11z" fill="#547BB0"/>
    <path d="M10 38h25v5H10q-4-2 0-5z" fill="#E3D9B6"/>
    <path d="m23 15 5 9-5 8-5-8z" fill="#C8DCF0"/>
    <path d="M9 10v25M14 12h17" stroke="#8DA7C5" stroke-width="1.5"/>
  `),
  'c005-intellect': icon(`
    <path d="M12 5q0 14 12 21Q36 19 36 5" fill="none" stroke="#ADB9C6" stroke-width="2.5"/>
    <path d="m24 19 13 10-13 15-13-15z" fill="#7790B2"/>
    <path d="m24 23 9 7-9 10-9-10z" fill="#4667A2"/>
    <path d="m24 25 4 5-4 7-4-7z" fill="#BDDFF2"/>
    <path d="M22 15h4v7h-4z" fill="#C4D3DA"/>
  `),
  'c009-intellect': icon(`
    <path d="m13 43 14-29" stroke="#836044" stroke-width="5" stroke-linecap="round"/>
    <path d="m15 37 4 2m-1-9 4 2m-1-9 4 2" stroke="#C9B47F" stroke-width="2"/>
    <path d="m29 4 8 7-7 10-8-9z" fill="#578BC5"/>
    <path d="m29 4 1 17-8-9z" fill="#A2CDEC"/>
    <path d="m20 10 2 9 9 5 8-8" fill="none" stroke="#B1BABD" stroke-width="3"/>
  `),
  'c012-intellect': icon(`
    <path d="m6 13 9 9 9-15 9 15 9-9-5 26H11z" fill="#899DB5"/>
    <path d="m10 17 7 10 7-13 7 13 7-10-3 16H13z" fill="#BDCFDC"/>
    <path d="M11 34h26v6H11z" fill="#607897"/>
    <path d="m24 22 5 7-5 6-5-6z" fill="#5676B8"/>
    <circle cx="14" cy="29" r="2" fill="#7495BF"/><circle cx="34" cy="29" r="2" fill="#7495BF"/>
  `),
  'c015-intellect': icon(`
    <path d="M4 11q10-5 20 1 10-6 20-1v29q-10-5-20 0-10-5-20 0z" fill="#465785"/>
    <path d="M7 10q9-3 17 3 8-6 17-3v25q-9-3-17 2-8-5-17-2z" fill="#DFD6B8"/>
    <path d="M24 13v24" stroke="#B5A685" stroke-width="2"/>
    <path d="m14 16 4 7-4 7-4-7zM29 18h8m-8 6h8m-8 6h5" fill="none" stroke="#6C7BB0" stroke-width="2"/>
    <path d="M25 37v8l4-3 3 2v-8" fill="#7289C2"/>
  `),
  'c020-intellect': icon(`
    <path d="m4 21 12 5 8-17 8 17 12-5-6 18H10z" fill="#AFCEDC"/>
    <path d="m7 22 10 9 7-16 7 16 10-9" fill="none" stroke="#E0F3F6" stroke-width="2"/>
    <path d="M10 35h28v5H10z" fill="#7195AF"/>
    <path d="m24 20 5 10-5 7-5-7z" fill="#717CD4"/>
    <path d="m24 20-1 10 1 7-5-7z" fill="#B8CFFB"/>
    <path d="M38 7v8m-4-4h8" stroke="#D2F3FF" stroke-width="2"/>
  `),
  'r001-intellect': icon(`
    <path d="M17 44 27 17" stroke="#6D6490" stroke-width="5" stroke-linecap="round"/>
    <path d="m19 35 5 2m-2-9 5 2" stroke="#CDB983" stroke-width="2"/>
    <path d="M19 9c2-9 19-8 21 2s-9 14-15 10" fill="none" stroke="#ADBADA" stroke-width="3"/>
    <circle cx="29" cy="12" r="7" fill="#667BCC"/>
    <path d="M23 12q6-8 12 0-6 8-12 0z" fill="#D4E7EF"/>
    <path d="M29 9v6" stroke="#455080" stroke-width="2"/>
    <circle cx="10" cy="15" r="2" fill="#A7B9ED"/>
  `),
  'r002-intellect': icon(`
    <path d="m5 12 10 8L24 3l9 17 10-8-5 28H10z" fill="#8272AC"/>
    <path d="m9 17 7 10 8-16 8 16 7-10-3 17H12z" fill="#B0A6D3"/>
    <path d="M10 34h28v6H10z" fill="#D7BD74"/>
    <path d="m24 19 6 9-6 9-6-9z" fill="#5B4CA0"/>
    <path d="m24 22 3 6-3 5-3-5z" fill="#C5B9FA"/>
    <circle cx="13" cy="27" r="2" fill="#E3D99B"/><circle cx="35" cy="27" r="2" fill="#E3D99B"/>
  `),
  'r003-intellect': icon(`
    <path d="M11 5h28v37H11q-6-2-6-7V12q0-5 5-7z" fill="#4F3F78"/>
    <path d="M12 8h24v30H12z" fill="#7161A2"/>
    <path d="M12 38h25v5H12q-5-2 0-5z" fill="#D9D4BB"/>
    <path d="M13 11h20M13 34h20M9 9v26" stroke="#CCB877" stroke-width="2"/>
    <path d="M15 23q9-12 18 0-9 12-18 0z" fill="#D0C2F1"/>
    <path d="m24 17 3 6-3 6-3-6z" fill="#43356F"/>
    <rect x="34" y="20" width="8" height="6" rx="1" fill="#D2BC74"/>
  `),
  'r004-intellect': icon(`
    <path d="M12 35h24l4 8H8z" fill="#A599C3"/>
    <path d="M17 31h14l3 7H14z" fill="#6B5F90"/>
    <circle cx="24" cy="19" r="15" fill="#6666B2"/>
    <circle cx="24" cy="18" r="11" fill="#8C91DA"/>
    <path d="M15 20q9-12 18 0-9 12-18 0z" fill="#E1DBF3"/>
    <circle cx="24" cy="20" r="4" fill="#554B86"/>
    <circle cx="18" cy="11" r="3" fill="#C3D9F3"/>
    <path d="M7 4v6m-3-3h6M41 28v6m-3-3h6" stroke="#B4BDE9" stroke-width="2"/>
  `),
  'e001-intellect': icon(`
    <ellipse cx="24" cy="39" rx="16" ry="6" fill="#4E3E86"/>
    <path d="M9 31q15 9 30 0l-4 10q-11 6-22 0z" fill="#9084C1"/>
    <path d="M13 32q11 5 22 0" stroke="#D3C9EC" stroke-width="2" fill="none"/>
    <path d="M24 32c-16-10-9-19-1-29-1 9 13 13 9 21-1 4-5 6-8 8z" fill="#829CE5"/>
    <path d="M24 30c-7-7-4-11 1-17-1 6 5 9-1 17z" fill="#D5EBFB"/>
    <path d="M8 12v6m-3-3h6M39 7v8m-4-4h8" stroke="#B7A1E8" stroke-width="2"/>
    <circle cx="38" cy="24" r="2" fill="#B5DDF7"/>
  `),
  'e002-intellect': icon(`
    <circle cx="24" cy="24" r="18" fill="none" stroke="#B29ADF" stroke-width="2"/>
    <path d="M3 24Q24 1 45 24 24 47 3 24z" fill="#67509A"/>
    <path d="M8 24Q24 9 40 24 24 39 8 24z" fill="#DED5EF"/>
    <circle cx="24" cy="24" r="10" fill="#8C84CA"/>
    <path d="m24 14 5 10-5 10-5-10z" fill="#33285D"/>
    <circle cx="21" cy="20" r="2.5" fill="#F0EDFF"/>
    <path d="M24 2v6m0 32v6M8 8l4 4m24 24 4 4M40 8l-4 4M12 36l-4 4" stroke="#D8C582" stroke-width="2"/>
  `),
};
