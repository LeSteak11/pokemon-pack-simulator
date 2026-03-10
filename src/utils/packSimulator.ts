import { Card, FinishType, PackScoreBreakdown } from '../types';

/**
 * Determine the appropriate finish for a card based on API data and slot context
 */
function determineFinish(card: Card, slotType: 'standard' | 'reverse' | 'rare'): FinishType {
  // If we have API data, use allowed finishes
  if (card.apiData?.allowedFinishes) {
    const allowed = card.apiData.allowedFinishes;
    
    if (slotType === 'reverse') {
      // Reverse holo slot - prefer Reverse Holo if allowed
      if (allowed.includes('Reverse Holo')) return 'Reverse Holo';
      // Ultra rares can't be reverse holo
      if (allowed.includes('Ultra Rare')) return 'Ultra Rare';
      if (allowed.includes('Holo')) return 'Holo';
      if (allowed.includes('Standard')) return 'Standard';
    } else if (slotType === 'rare') {
      // Rare slot - follow card's natural finish
      if (allowed.includes('Secret Rare')) return 'Secret Rare';
      if (allowed.includes('Ultra Rare')) return 'Ultra Rare';
      if (allowed.includes('Holo')) return 'Holo';
      if (allowed.includes('Standard')) return 'Standard';
    } else {
      // Standard slot - use standard finish
      if (allowed.includes('Standard')) return 'Standard';
      // Fallback to first allowed
      return allowed[0] as FinishType;
    }
  }
  
  // Fallback to old logic if no API data
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
 * Get market price for a card based on its finish
 */
function getMarketPrice(card: Card): number {
  if (!card.apiData?.tcgplayer?.prices) return 0;
  
  const prices = card.apiData.tcgplayer.prices;
  let marketPrice = 0;
  
  // Get price for the specific finish
  if (card.finish === 'Holo' && prices.holofoil?.market) {
    marketPrice = prices.holofoil.market;
  } else if (card.finish === 'Reverse Holo' && prices.reverseHolofoil?.market) {
    marketPrice = prices.reverseHolofoil.market;
  } else if (prices.normal?.market) {
    marketPrice = prices.normal.market;
  } else if (prices.holofoil?.market) {
    // Fallback to holofoil if no match
    marketPrice = prices.holofoil.market;
  }
  
  return marketPrice || 0;
}

/**
 * Convert market price to score points (exponential scale)
 */
function getMarketValueScore(card: Card): number {
  const price = getMarketPrice(card);
  
  if (price >= 100) return 50;      // $100+ cards = 50pts
  if (price >= 50) return 35;       // $50-$99 = 35pts
  if (price >= 20) return 25;       // $20-$49 = 25pts
  if (price >= 10) return 15;       // $10-$19 = 15pts
  if (price >= 5) return 10;        // $5-$9 = 10pts
  if (price >= 2) return 5;         // $2-$4 = 5pts
  if (price >= 1) return 3;         // $1-$1.99 = 3pts
  return Math.floor(price * 2);     // <$1 = 2x value
}

/**
 * HP-based power bonus
 */
function getHPBonus(card: Card): number {
  if (!card.apiData?.hp) return 0;
  
  const hp = parseInt(card.apiData.hp);
  if (isNaN(hp)) return 0;
  
  if (hp >= 340) return 10;    // God-tier HP
  if (hp >= 300) return 7;     // Legendary tier
  if (hp >= 250) return 5;     // High tier
  if (hp >= 200) return 3;     // Above average
  if (hp >= 150) return 1;     // Average
  return 0;
}

/**
 * Special card detection bonuses
 */
function getSpecialCardBonus(card: Card): number {
  const subtypes = card.apiData?.subtypes || [];
  let bonus = 0;
  
  // Special mechanics
  if (subtypes.includes('VMAX')) bonus += 10;
  if (subtypes.includes('VSTAR')) bonus += 12;
  if (subtypes.includes('V')) bonus += 7;
  if (subtypes.includes('GX')) bonus += 8;
  if (subtypes.includes('EX')) bonus += 6;
  if (subtypes.includes('ex')) bonus += 9;
  
  // Special types
  if (subtypes.includes('Radiant')) bonus += 8;
  if (subtypes.includes('Amazing')) bonus += 10;
  if (subtypes.includes('Shining')) bonus += 12;
  if (subtypes.includes('Prime')) bonus += 10;
  
  // Evolution stages
  if (subtypes.includes('Stage 2')) bonus += 3;
  if (subtypes.includes('Stage 1')) bonus += 2;
  
  // Trainer cards
  if (card.apiData?.supertype === 'Trainer') {
    if (subtypes.includes('Supporter')) bonus += 3;
    if (subtypes.includes('Item') && card.rarity !== 'Common') bonus += 2;
  }
  
  // Special patterns in name (for sets without proper subtypes)
  const name = card.name.toLowerCase();
  if (name.includes('full art')) bonus += 8;
  if (name.includes('alternate art') || name.includes('alt art')) bonus += 15;
  if (name.includes('rainbow')) bonus += 12;
  if (name.includes('gold') || name.includes('golden')) bonus += 10;
  
  return bonus;
}

/**
 * Type synergy bonus for pack
 */
function getTypeSynergy(pack: Card[]): number {
  const pokemonCards = pack.filter(c => c.apiData?.supertype === 'Pokémon');
  if (pokemonCards.length === 0) return 0;
  
  // Count type distribution
  const typeCount = new Map<string, number>();
  pokemonCards.forEach(card => {
    card.apiData?.types?.forEach(type => {
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });
  });
  
  const maxTypeCount = Math.max(...Array.from(typeCount.values()));
  
  // Bonuses for type concentration (good for deck building)
  if (maxTypeCount >= 7) return 20;  // Nearly mono-type
  if (maxTypeCount >= 5) return 10;  // Strong synergy
  if (maxTypeCount >= 4) return 5;   // Decent synergy
  return 0;
}

/**
 * Check for evolution line in pack
 */
function hasEvolutionLine(pack: Card[]): boolean {
  const pokemonCards = pack.filter(c => c.apiData?.supertype === 'Pokémon');
  
  const hasBasic = pokemonCards.some(c => 
    c.apiData?.subtypes?.includes('Basic') && 
    !c.apiData?.subtypes?.some(st => ['V', 'VMAX', 'GX', 'EX'].includes(st))
  );
  const hasStage1 = pokemonCards.some(c => c.apiData?.subtypes?.includes('Stage 1'));
  const hasStage2 = pokemonCards.some(c => c.apiData?.subtypes?.includes('Stage 2'));
  
  // Check for evolution chains
  if (hasBasic && hasStage1) return true;
  if (hasBasic && hasStage2) return true;
  if (hasStage1 && hasStage2) return true;
  
  return false;
}

/**
 * Calculate comprehensive pack score
 */
export function calculatePackScore(pack: Card[]): PackScoreBreakdown {
  const breakdown: PackScoreBreakdown = {
    baseCards: 0,
    marketValue: 0,
    hpBonus: 0,
    typeSynergy: 0,
    specialCards: 0,
    varietyBonus: 0,
    comboBonus: 0,
    total: 0,
    packValue: 0
  };
  
  if (pack.length === 0) return breakdown;
  
  // Calculate total pack value and score each card
  pack.forEach(card => {
    const price = getMarketPrice(card);
    breakdown.packValue += price;
    
    const marketScore = getMarketValueScore(card);
    const hpScore = getHPBonus(card);
    const specialScore = getSpecialCardBonus(card);
    
    // Base value (capped at 5 per card)
    breakdown.baseCards += Math.min(marketScore, 5);
    // Market value bonus (anything above base 5)
    breakdown.marketValue += Math.max(0, marketScore - 5);
    // Other bonuses
    breakdown.hpBonus += hpScore;
    breakdown.specialCards += specialScore;
  });
  
  // Pack-wide bonuses
  breakdown.typeSynergy = getTypeSynergy(pack);
  
  // Variety bonus (balanced pack)
  const hasTrainer = pack.some(c => c.apiData?.supertype === 'Trainer');
  const hasEnergy = pack.some(c => c.apiData?.supertype === 'Energy');
  const hasPokemon = pack.some(c => c.apiData?.supertype === 'Pokémon');
  const varietyCount = [hasTrainer, hasEnergy, hasPokemon].filter(Boolean).length;
  if (varietyCount === 3) breakdown.varietyBonus = 5;
  
  // Combo bonuses
  const ultraRares = pack.filter(c => ['V', 'VMAX', 'Secret Rare'].includes(c.rarity));
  if (ultraRares.length >= 2) breakdown.comboBonus += 25;  // Double hit
  if (ultraRares.length >= 3) breakdown.comboBonus += 35;  // God pack! (total 60)
  
  if (hasEvolutionLine(pack)) breakdown.comboBonus += 10;  // Evolution bonus
  
  // Calculate total
  breakdown.total = 
    breakdown.baseCards +
    breakdown.marketValue +
    breakdown.hpBonus +
    breakdown.typeSynergy +
    breakdown.specialCards +
    breakdown.varietyBonus +
    breakdown.comboBonus;
  
  return breakdown;
}

/**
 * Get a simple numeric score (for backwards compatibility)
 */
export function getPackScore(pack: Card[]): number {
  return calculatePackScore(pack).total;
}
