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

export interface RarityPools {
  commons: Card[];
  uncommons: Card[];
  rares: Card[];
  vs: Card[];
  vmaxs: Card[];
  secretRares: Card[];
}

export interface SavedSet {
  id: string;
  name: string;
  baseSetSize: number;
  cards: Card[];
  rarityPools?: RarityPools; // Built on load/import, not persisted
  collection: CollectionItem[];
  packsOpened: number;
}
