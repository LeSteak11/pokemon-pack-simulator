export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'V' | 'VMAX' | 'Secret Rare';
export type FinishType = 'Standard' | 'Reverse Holo' | 'Holo' | 'Ultra Rare' | 'Secret Rare';

export interface Card {
  number: string;
  name: string;
  rarity: Rarity;
  finish: FinishType;
}

export interface CollectionItem extends Card {
  count: number;
}

export interface InventoryProfile {
  id: string;
  name: string;
  collection: CollectionItem[];
  packsOpened: number;
}

export interface RarityPools {
  commons: Card[];
  uncommons: Card[];
  rares: Card[];
  vs: Card[];
  vmaxs: Card[];
  secretRares: Card[];
}

export interface PackConfig {
  slots: {
    commons: number;
    uncommons: number;
    reverse: boolean;
    rare: boolean;
    energy: boolean;
  };
  reverseSlotOdds: {
    common: number;      // 0.60 = 60%
    uncommon: number;    // 0.30 = 30%
    rare: number;        // 0.10 = 10%
  };
  rareSlotOdds: {
    secretRare: number;  // 0.01 = 1%
    vmax: number;        // 0.10 = 10%
    v: number;           // 0.18 = 18%
    holo: number;        // 0.21 = 21%
    standard: number;    // 0.50 = 50%
  };
}

export interface SavedSet {
  id: string;
  name: string;
  baseSetSize: number;
  cards: Card[];
  rarityPools?: RarityPools; // Built on load/import, not persisted
  packConfig?: PackConfig;   // Pack structure configuration, uses default if not specified
  profiles: InventoryProfile[];
  activeProfileId: string | null;
  // Legacy fields for migration
  collection?: CollectionItem[];
  packsOpened?: number;
}

// JSON Set Data Types
export interface JSONCard {
  number: string;
  name: string;
  rarity: string;  // JSON rarities: "Common", "Uncommon", "Rare", "Holo Rare", "Rainbow Rare", "Special Full Art", "Secret Rare"
  category: string; // "Pokemon", "Trainer", "Energy"
  variant: string | null; // "V", "VMAX", or null
}

export interface JSONSetData {
  setName: string;
  setCode: string;
  baseSetSize: number;
  cards: JSONCard[];
}
