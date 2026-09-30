const icon = (art: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${art}</svg>`;

/** Single-attribute equipment, in the catalog's flat 48px illustration style. */
export const ATTRIBUTE_SVGS: Readonly<Record<string, string>> = {
  'c001-agility': icon(`
    <path d="M7 23V11h4v10h2V8h4v13h2V12h4v15l-5 7H9l-5-8 2-6z" fill="#A47A4B"/>
    <path d="M28 23V11h4v10h2V8h4v13h2V12h4v15l-5 7h-9l-5-8 2-6z" fill="#C29761"/>
    <path d="M9 32h11v9H9zM30 32h11v9H30z" fill="#4E7046"/>
    <path d="M12 35h5m16 0h5M12 25h5m16 0h5" stroke="#E3C99C" stroke-width="2"/>
  `),
  'c009-agility': icon(`
    <path d="M5 8l15 3-2 31-11-2z" fill="#937049"/>
    <path d="M28 11l15-3-2 32-11 2z" fill="#B08B59"/>
    <path d="M5 13l15 3M6 32l13 3M28 16l15-3M29 35l13-3" stroke="#425B38" stroke-width="5"/>
    <path d="M12 18v11m-3-8 3-3 3 3M36 18v11m-3-8 3-3 3 3" fill="none" stroke="#ECD6A8" stroke-width="2"/>
  `),
  'c015-agility': icon(`
    <path d="M13 24V8h5v13h2V5h5v16h2V8h5v14h2V12h5v17l-7 7H18L8 26l2-7z" fill="#70875A"/>
    <path d="M18 34h15v10H18z" fill="#A78049"/>
    <circle cx="25" cy="27" r="7" fill="#344D37" stroke="#D5D8A5" stroke-width="2"/>
    <circle cx="25" cy="27" r="2" fill="#D5D8A5"/>
    <path d="M25 17v5m0 10v4m-11-9h6m10 0h6" stroke="#E5D8AE" stroke-width="1.5"/>
  `),
  'r001-agility': icon(`
    <path d="M15 17 5 41q19 7 38 0L33 17z" fill="#315D47"/>
    <path d="M24 18 15 43l9-4 9 4z" fill="#487F59"/>
    <path d="M13 19C12 1 36 1 35 19l-11 7z" fill="#6B9463"/>
    <path d="M18 18q0-14 12 0l-6 5z" fill="#1B3431"/>
    <path d="M14 21 8 40m26-19 6 19" stroke="#C2B67D" stroke-width="2"/>
    <circle cx="24" cy="26" r="3" fill="#D6BC70"/>
  `),
  'r003-agility': icon(`
    <path d="M21 6h16l-4 21 10 10v5H13v-9l7-8z" fill="#3D9686"/>
    <path d="M20 6h18v5H20zM13 39h30v4H13z" fill="#255766"/>
    <path d="m22 26-9-1L6 12l11 7 11-3-6 6 7 2z" fill="#C6F2DB"/>
    <path d="M5 32h6M3 37h7M6 42h4" stroke="#8ADCC1" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M33 16q10-5 10 0t-7 4M32 3q-7 0-7 5" fill="none" stroke="#D0E6BA" stroke-width="2"/>
  `),
  'e002-agility': icon(`
    <path d="M22 25C15 25 9 17 3 5l1 18 6-3-2 12 7-4-1 11 9-8z" fill="#BBD8D4"/>
    <path d="M26 25C33 25 39 17 45 5l-1 18-6-3 2 12-7-4 1 11-9-8z" fill="#E1EEE0"/>
    <path d="M8 13l12 14M12 23l8 5m-3 3 4-2M40 13 28 27m8-4-8 5m3 3-4-2" stroke="#6D9A93" stroke-width="2"/>
    <path d="m24 15 7 12-7 16-7-16z" fill="#CEA95C"/>
    <path d="m24 20 4 7-4 10-4-10z" fill="#3FAD8B"/>
    <circle cx="24" cy="9" r="2" fill="#E9E7B9"/>
  `),
  'c001-intellect': icon(`
    <path d="M10 7h26v32H10z" fill="#E3D3A3"/>
    <path d="M9 6h27v6H9zM9 36h27v6H9z" fill="#B49A6F"/>
    <path d="M15 18h12m-12 6h9m-9 6h7" stroke="#627697" stroke-width="2"/>
    <path d="M24 36 38 10q7 8-2 16l-8 5z" fill="#94BEDC"/>
    <path d="m25 36 12-20" stroke="#3F638D" stroke-width="2"/>
  `),
  'c009-intellect': icon(`
    <path d="m13 43 14-29" stroke="#836044" stroke-width="5" stroke-linecap="round"/>
    <path d="m15 37 4 2m-1-9 4 2m-1-9 4 2" stroke="#C9B47F" stroke-width="2"/>
    <path d="m29 4 8 7-7 10-8-9z" fill="#578BC5"/>
    <path d="m29 4 1 17-8-9z" fill="#A2CDEC"/>
    <path d="m20 10 2 9 9 5 8-8" fill="none" stroke="#B1BABD" stroke-width="3"/>
  `),
  'c015-intellect': icon(`
    <path d="M4 11q10-5 20 1 10-6 20-1v29q-10-5-20 0-10-5-20 0z" fill="#465785"/>
    <path d="M7 10q9-3 17 3 8-6 17-3v25q-9-3-17 2-8-5-17-2z" fill="#DFD6B8"/>
    <path d="M24 13v24" stroke="#B5A685" stroke-width="2"/>
    <path d="m14 16 4 7-4 7-4-7zM29 18h8m-8 6h8m-8 6h5" fill="none" stroke="#6C7BB0" stroke-width="2"/>
    <path d="M25 37v8l4-3 3 2v-8" fill="#7289C2"/>
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
  'r003-intellect': icon(`
    <path d="M11 5h28v37H11q-6-2-6-7V12q0-5 5-7z" fill="#4F3F78"/>
    <path d="M12 8h24v30H12z" fill="#7161A2"/>
    <path d="M12 38h25v5H12q-5-2 0-5z" fill="#D9D4BB"/>
    <path d="M13 11h20M13 34h20M9 9v26" stroke="#CCB877" stroke-width="2"/>
    <path d="M15 23q9-12 18 0-9 12-18 0z" fill="#D0C2F1"/>
    <path d="m24 17 3 6-3 6-3-6z" fill="#43356F"/>
    <rect x="34" y="20" width="8" height="6" rx="1" fill="#D2BC74"/>
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
