/** Tanzania's 31 regions (mikoa) — used for the regional league. */
export interface Region {
  id: string;
  name: string;
  emoji: string;
}

export const REGIONS: Region[] = [
  { id: 'arusha', name: 'Arusha', emoji: '🌋' },
  { id: 'dar', name: 'Dar es Salaam', emoji: '🏙️' },
  { id: 'dodoma', name: 'Dodoma', emoji: '🏛️' },
  { id: 'geita', name: 'Geita', emoji: '⛏️' },
  { id: 'iringa', name: 'Iringa', emoji: '⛰️' },
  { id: 'kagera', name: 'Kagera', emoji: '🍌' },
  { id: 'katavi', name: 'Katavi', emoji: '🦬' },
  { id: 'kigoma', name: 'Kigoma', emoji: '🛶' },
  { id: 'kilimanjaro', name: 'Kilimanjaro', emoji: '🏔️' },
  { id: 'lindi', name: 'Lindi', emoji: '🏖️' },
  { id: 'manyara', name: 'Manyara', emoji: '🦒' },
  { id: 'mara', name: 'Mara', emoji: '🦓' },
  { id: 'mbeya', name: 'Mbeya', emoji: '🌾' },
  { id: 'morogoro', name: 'Morogoro', emoji: '🌄' },
  { id: 'mtwara', name: 'Mtwara', emoji: '🥜' },
  { id: 'mwanza', name: 'Mwanza', emoji: '🪨' },
  { id: 'njombe', name: 'Njombe', emoji: '🍵' },
  { id: 'pwani', name: 'Pwani', emoji: '🌊' },
  { id: 'rukwa', name: 'Rukwa', emoji: '🐟' },
  { id: 'ruvuma', name: 'Ruvuma', emoji: '🌽' },
  { id: 'shinyanga', name: 'Shinyanga', emoji: '💎' },
  { id: 'simiyu', name: 'Simiyu', emoji: '🐄' },
  { id: 'singida', name: 'Singida', emoji: '🌻' },
  { id: 'songwe', name: 'Songwe', emoji: '🌿' },
  { id: 'tabora', name: 'Tabora', emoji: '🍯' },
  { id: 'tanga', name: 'Tanga', emoji: '🚢' },
  { id: 'kaskazini-pemba', name: 'Kaskazini Pemba', emoji: '🌴' },
  { id: 'kusini-pemba', name: 'Kusini Pemba', emoji: '🥥' },
  { id: 'kaskazini-unguja', name: 'Kaskazini Unguja', emoji: '🏝️' },
  { id: 'kusini-unguja', name: 'Kusini Unguja', emoji: '🐠' },
  { id: 'mjini-magharibi', name: 'Mjini Magharibi', emoji: '🕌' },
];

export const getRegionById = (id: string): Region | undefined =>
  REGIONS.find((r) => r.id === id);
