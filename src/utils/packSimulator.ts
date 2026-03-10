import { Card, FinishType } from '../types';

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

export function simulatePack(cards: Card[]): Card[] {
  const pack: Card[] = [];
  
  const commons = cards.filter(c => c.rarity === 'Common');
  const uncommons = cards.filter(c => c.rarity === 'Uncommon');
  const rares = cards.filter(c => c.rarity === 'Rare');
  const vs = cards.filter(c => c.rarity === 'V');
  const vmaxs = cards.filter(c => c.rarity === 'VMAX');
  const secretRares = cards.filter(c => c.rarity === 'Secret Rare');
  
  // Helper to get random card from array
  const getRandom = (arr: Card[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
  
  // 5 Commons
  for (let i = 0; i < 5; i++) {
    const c = getRandom(commons) || getRandom(cards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish });
    }
  }
  
  // 3 Uncommons
  for (let i = 0; i < 3; i++) {
    const c = getRandom(uncommons) || getRandom(cards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish });
    }
  }
  
  // 1 Reverse Holo Slot (60% Common, 30% Uncommon, 10% Rare)
  const revRand = Math.random();
  let revCard: Card | null = null;
  if (revRand < 0.60 && commons.length > 0) {
    revCard = getRandom(commons);
  } else if (revRand < 0.90 && uncommons.length > 0) {
    revCard = getRandom(uncommons);
  } else if (rares.length > 0) {
    revCard = getRandom(rares);
  }
  if (!revCard) revCard = getRandom(cards);
  if (revCard) {
    const finish = determineFinish(revCard, 'reverse');
    pack.push({ ...revCard, finish });
  }
  
  // 1 Rare Slot
  const rand = Math.random();
  let rareCard: Card | null = null;
  
  if (rand < 0.01) {
    // 1% Secret Rare
    if (secretRares.length > 0) { rareCard = getRandom(secretRares); }
    else if (vmaxs.length > 0) { rareCard = getRandom(vmaxs); }
    else if (vs.length > 0) { rareCard = getRandom(vs); }
    else if (rares.length > 0) { rareCard = getRandom(rares); }
  } else if (rand < 0.11) {
    // 10% VMAX/Ultra Rare
    if (vmaxs.length > 0) { rareCard = getRandom(vmaxs); }
    else if (vs.length > 0) { rareCard = getRandom(vs); }
    else if (rares.length > 0) { rareCard = getRandom(rares); }
  } else if (rand < 0.29) {
    // 18% V
    if (vs.length > 0) { rareCard = getRandom(vs); }
    else if (rares.length > 0) { rareCard = getRandom(rares); }
  } else if (rand < 0.50) {
    // 21% Holo Rare
    if (rares.length > 0) { rareCard = getRandom(rares); }
  } else {
    // 50% Standard Rare
    if (rares.length > 0) { rareCard = getRandom(rares); }
  }
  
  // Fallbacks
  if (!rareCard) {
    rareCard = getRandom(rares) || getRandom(cards);
  }
  
  if (rareCard) {
    const finish = determineFinish(rareCard, 'rare');
    pack.push({ ...rareCard, finish });
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
