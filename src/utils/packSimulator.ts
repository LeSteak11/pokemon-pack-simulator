import { Card, FinishType, RarityPools, PackConfig } from '../types';

/**
 * Default pack configuration matching standard Pokémon TCG pack structure
 * (e.g., Sword & Shield era sets like Evolving Skies)
 */
export const DEFAULT_PACK_CONFIG: PackConfig = {
  slots: {
    commons: 5,
    uncommons: 3,
    reverse: true,
    rare: true,
    energy: false
  },
  reverseSlotOdds: {
    common: 0.60,
    uncommon: 0.30,
    rare: 0.10
  },
  rareSlotOdds: {
    secretRare: 0.01,
    vmax: 0.10,
    v: 0.18,
    holo: 0.21,
    standard: 0.50
  }
};

/**
 * Build rarity-based card pools from a card list
 * These pools are used for efficient pack generation
 */
export function buildRarityPools(cards: Card[]): RarityPools {
  return {
    commons: cards.filter(c => c.rarity === 'Common'),
    uncommons: cards.filter(c => c.rarity === 'Uncommon'),
    rares: cards.filter(c => c.rarity === 'Rare'),
    vs: cards.filter(c => c.rarity === 'V'),
    vmaxs: cards.filter(c => c.rarity === 'VMAX'),
    secretRares: cards.filter(c => c.rarity === 'Secret Rare')
  };
}

/**
 * Returns all valid finish types for a card based on its rarity.
 * This enforces real TCG print variant rules.
 */
function getValidFinishes(card: Card): FinishType[] {
  switch (card.rarity) {
    case 'Common':
    case 'Uncommon':
      // Commons and Uncommons can only be Standard or Reverse Holo
      return ['Standard', 'Reverse Holo'];
    
    case 'Rare':
      // Rare cards can be Standard, Reverse Holo, or Holo
      return ['Standard', 'Reverse Holo', 'Holo'];
    
    case 'V':
    case 'VMAX':
      // V and VMAX cards only exist as Ultra Rare
      return ['Ultra Rare'];
    
    case 'Secret Rare':
      // Secret Rares only exist with Secret Rare finish
      return ['Secret Rare'];
    
    default:
      // Fallback to Standard for unknown rarities
      return ['Standard'];
  }
}

/**
 * Selects a valid finish for a card, using the preferred finish if legal,
 * otherwise falling back to a valid alternative.
 */
function selectValidFinish(card: Card, preferredFinish: FinishType): FinishType {
  const validFinishes = getValidFinishes(card);
  
  // If preferred finish is valid, use it
  if (validFinishes.includes(preferredFinish)) {
    return preferredFinish;
  }
  
  // Fallback priority: Standard (if valid) > first available valid finish
  if (validFinishes.includes('Standard')) {
    return 'Standard';
  }
  
  // Return first valid finish (guaranteed to exist)
  return validFinishes[0];
}

/**
 * Determine the appropriate finish for a card based on rarity and slot context.
 * Now includes validation to ensure only real card + finish combinations are produced.
 */
function determineFinish(card: Card, slotType: 'standard' | 'reverse' | 'rare'): FinishType {
  let preferredFinish: FinishType;
  
  if (slotType === 'reverse') {
    preferredFinish = 'Reverse Holo';
  } else if (slotType === 'rare') {
    if (card.rarity === 'Secret Rare') preferredFinish = 'Secret Rare';
    else if (card.rarity === 'VMAX' || card.rarity === 'V') preferredFinish = 'Ultra Rare';
    else if (card.rarity === 'Rare') preferredFinish = 'Holo';
    else preferredFinish = 'Standard';
  } else {
    preferredFinish = 'Standard';
  }
  
  // Validate and return legal finish
  return selectValidFinish(card, preferredFinish);
}

export function simulatePack(pools: RarityPools, config: PackConfig = DEFAULT_PACK_CONFIG): Card[] {
  const pack: Card[] = [];
  const usedCardNumbers = new Set<string>();
  
  // Helper to get random card from array, excluding already-used card numbers
  const getRandomExcluding = (arr: Card[]) => {
    const available = arr.filter(c => !usedCardNumbers.has(c.number));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };
  
  // Fallback to any available cards if pools are empty
  const allCards = [...pools.commons, ...pools.uncommons, ...pools.rares, ...pools.vs, ...pools.vmaxs, ...pools.secretRares];
  
  // Reverse slot can only pull from common/uncommon/rare pools (never ultra-rares)
  const reverseEligibleCards = [...pools.commons, ...pools.uncommons, ...pools.rares];
  
  // Commons (configurable count)
  for (let i = 0; i < config.slots.commons; i++) {
    const c = getRandomExcluding(pools.commons) || getRandomExcluding(allCards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish });
      usedCardNumbers.add(c.number);
    }
  }
  
  // Uncommons (configurable count)
  for (let i = 0; i < config.slots.uncommons; i++) {
    const c = getRandomExcluding(pools.uncommons) || getRandomExcluding(allCards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish });
      usedCardNumbers.add(c.number);
    }
  }
  
  // Reverse Holo Slot (if enabled, uses configured odds)
  if (config.slots.reverse) {
    const revRand = Math.random();
    let revCard: Card | null = null;
    if (revRand < config.reverseSlotOdds.common && pools.commons.length > 0) {
      revCard = getRandomExcluding(pools.commons);
    } else if (revRand < config.reverseSlotOdds.common + config.reverseSlotOdds.uncommon && pools.uncommons.length > 0) {
      revCard = getRandomExcluding(pools.uncommons);
    } else if (pools.rares.length > 0) {
      revCard = getRandomExcluding(pools.rares);
    }
    if (!revCard) revCard = getRandomExcluding(reverseEligibleCards);
    if (revCard) {
      const finish = determineFinish(revCard, 'reverse');
      pack.push({ ...revCard, finish });
      usedCardNumbers.add(revCard.number);
    }
  }
  
  // Rare Slot (if enabled, uses configured odds)
  if (config.slots.rare) {
    const rand = Math.random();
    let rareCard: Card | null = null;
    
    if (rand < config.rareSlotOdds.secretRare) {
      // Secret Rare
      if (pools.secretRares.length > 0) { rareCard = getRandomExcluding(pools.secretRares); }
      else if (pools.vmaxs.length > 0) { rareCard = getRandomExcluding(pools.vmaxs); }
      else if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
      else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else if (rand < config.rareSlotOdds.secretRare + config.rareSlotOdds.vmax) {
      // VMAX/Ultra Rare
      if (pools.vmaxs.length > 0) { rareCard = getRandomExcluding(pools.vmaxs); }
      else if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
      else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else if (rand < config.rareSlotOdds.secretRare + config.rareSlotOdds.vmax + config.rareSlotOdds.v) {
      // V
      if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
      else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else if (rand < config.rareSlotOdds.secretRare + config.rareSlotOdds.vmax + config.rareSlotOdds.v + config.rareSlotOdds.holo) {
      // Holo Rare
      if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else {
      // Standard Rare
      if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    }
    
    // Fallbacks
    if (!rareCard) {
      rareCard = getRandomExcluding(pools.rares) || getRandomExcluding(allCards);
    }
    
    if (rareCard) {
      const finish = determineFinish(rareCard, 'rare');
      pack.push({ ...rareCard, finish });
      usedCardNumbers.add(rareCard.number);
    }
  }
  
  return pack;
}

/**
 * Calculate simple pack score based on rarity and finish only
 */
export function calculatePackScore(pack: Card[]): number {
  if (pack.length < 10) return 0;
  
  let score = 10; // Baseline score
  
  pack.forEach(card => {
    // Rarity scoring
    if (card.rarity === 'Secret Rare') {
      score += 85;
    } else if (card.rarity === 'VMAX') {
      score += 50;
    } else if (card.rarity === 'V') {
      score += 30;
    } else if (card.rarity === 'Rare') {
      score += card.finish === 'Holo' ? 10 : 5;
    } else if (card.rarity === 'Uncommon') {
      score += card.finish === 'Reverse Holo' ? 4 : 1;
    } else {
      // Common
      score += card.finish === 'Reverse Holo' ? 2 : 0;
    }
  });
  
  // Cap score at 100
  return Math.min(score, 100);
}

/**
 * Get a simple numeric score (for backwards compatibility)
 */
export function getPackScore(pack: Card[]): number {
  return calculatePackScore(pack);
}
