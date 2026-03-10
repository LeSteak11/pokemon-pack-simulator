import { Card, FinishType, RarityPools } from '../types';

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
 * Determine the appropriate finish for a card based on rarity and slot context
 */
function determineFinish(card: Card, slotType: 'standard' | 'reverse' | 'rare'): FinishType {
  if (slotType === 'reverse') return 'Reverse Holo';
  
  if (slotType === 'rare') {
    if (card.rarity === 'Secret Rare') return 'Secret Rare';
    if (card.rarity === 'VMAX' || card.rarity === 'V') return 'Ultra Rare';
    if (card.rarity === 'Rare') return 'Holo';
  }
  
  return 'Standard';
}

export function simulatePack(pools: RarityPools): Card[] {
  const pack: Card[] = [];
  const usedCardNumbers = new Set<number>();
  
  // Helper to get random card from array, excluding already-used card numbers
  const getRandomExcluding = (arr: Card[]) => {
    const available = arr.filter(c => !usedCardNumbers.has(c.number));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };
  
  // Fallback to any available cards if pools are empty
  const allCards = [...pools.commons, ...pools.uncommons, ...pools.rares, ...pools.vs, ...pools.vmaxs, ...pools.secretRares];
  
  // 5 Commons
  for (let i = 0; i < 5; i++) {
    const c = getRandomExcluding(pools.commons) || getRandomExcluding(allCards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish });
      usedCardNumbers.add(c.number);
    }
  }
  
  // 3 Uncommons
  for (let i = 0; i < 3; i++) {
    const c = getRandomExcluding(pools.uncommons) || getRandomExcluding(allCards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish });
      usedCardNumbers.add(c.number);
    }
  }
  
  // 1 Reverse Holo Slot (60% Common, 30% Uncommon, 10% Rare)
  const revRand = Math.random();
  let revCard: Card | null = null;
  if (revRand < 0.60 && pools.commons.length > 0) {
    revCard = getRandomExcluding(pools.commons);
  } else if (revRand < 0.90 && pools.uncommons.length > 0) {
    revCard = getRandomExcluding(pools.uncommons);
  } else if (pools.rares.length > 0) {
    revCard = getRandomExcluding(pools.rares);
  }
  if (!revCard) revCard = getRandomExcluding(allCards);
  if (revCard) {
    const finish = determineFinish(revCard, 'reverse');
    pack.push({ ...revCard, finish });
    usedCardNumbers.add(revCard.number);
  }
  
  // 1 Rare Slot
  const rand = Math.random();
  let rareCard: Card | null = null;
  
  if (rand < 0.01) {
    // 1% Secret Rare
    if (pools.secretRares.length > 0) { rareCard = getRandomExcluding(pools.secretRares); }
    else if (pools.vmaxs.length > 0) { rareCard = getRandomExcluding(pools.vmaxs); }
    else if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
    else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
  } else if (rand < 0.11) {
    // 10% VMAX/Ultra Rare
    if (pools.vmaxs.length > 0) { rareCard = getRandomExcluding(pools.vmaxs); }
    else if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
    else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
  } else if (rand < 0.29) {
    // 18% V
    if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
    else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
  } else if (rand < 0.50) {
    // 21% Holo Rare
    if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
  } else {
    // 50% Standard Rare
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
