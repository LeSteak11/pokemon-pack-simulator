export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'V' | 'VMAX' | 'Secret Rare';
export type FinishType = 'Standard' | 'Reverse Holo' | 'Holo' | 'Ultra Rare' | 'Secret Rare';

// API-enriched card metadata
export interface APICardData {
  cardId: string;
  supertype: string;
  subtypes?: string[];
  types?: string[];
  hp?: string;
  apiRarity: string; // Original API rarity (e.g., "Rare Holo")
  allowedFinishes: string[]; // Which finishes are possible for this card
  imageUrl?: string;
  tcgplayer?: {
    prices?: {
      holofoil?: { market?: number; low?: number; mid?: number; high?: number };
      reverseHolofoil?: { market?: number; low?: number; mid?: number; high?: number };
      normal?: { market?: number; low?: number; mid?: number; high?: number };
      '1stEditionHolofoil'?: { market?: number; low?: number; mid?: number; high?: number };
      unlimitedHolofoil?: { market?: number; low?: number; mid?: number; high?: number };
    };
  };
  setInfo: {
    id: string;
    name: string;
    series: string;
    releaseDate: string;
  };
}

export interface PackScoreBreakdown {
  baseCards: number;
  marketValue: number;
  hpBonus: number;
  typeSynergy: number;
  specialCards: number;
  varietyBonus: number;
  comboBonus: number;
  total: number;
  packValue: number; // Total dollar value
}

export interface Card {
  number: string;
  name: string;
  rarity: Rarity;
  finish: FinishType;
  apiData?: APICardData; // Optional API enrichment
}

export interface CollectionItem extends Card {
  count: number;
}

export interface SavedSet {
  id: string;
  name: string;
  baseSetSize: number;
  cards: Card[];
  collection: CollectionItem[];
  packsOpened: number;
  apiSetId?: string; // Optional API set ID for enrichment
}
