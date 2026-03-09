import { Card, FinishType } from '../types';

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
    if (c) pack.push({ ...c, finish: 'Standard' });
  }
  
  // 3 Uncommons
  for (let i = 0; i < 3; i++) {
    const c = getRandom(uncommons) || getRandom(cards);
    if (c) pack.push({ ...c, finish: 'Standard' });
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
  if (revCard) pack.push({ ...revCard, finish: 'Reverse Holo' });
  
  // 1 Rare Slot
  const rand = Math.random();
  let rareCard: Card | null = null;
  let finish: FinishType = 'Standard';
  
  if (rand < 0.01) {
    if (secretRares.length > 0) { rareCard = getRandom(secretRares); finish = 'Secret Rare'; }
    else if (vmaxs.length > 0) { rareCard = getRandom(vmaxs); finish = 'Ultra Rare'; }
    else if (vs.length > 0) { rareCard = getRandom(vs); finish = 'Ultra Rare'; }
    else if (rares.length > 0) { rareCard = getRandom(rares); finish = 'Holo'; }
  } else if (rand < 0.11) {
    if (vmaxs.length > 0) { rareCard = getRandom(vmaxs); finish = 'Ultra Rare'; }
    else if (vs.length > 0) { rareCard = getRandom(vs); finish = 'Ultra Rare'; }
    else if (rares.length > 0) { rareCard = getRandom(rares); finish = 'Holo'; }
  } else if (rand < 0.29) {
    if (vs.length > 0) { rareCard = getRandom(vs); finish = 'Ultra Rare'; }
    else if (rares.length > 0) { rareCard = getRandom(rares); finish = 'Holo'; }
  } else if (rand < 0.50) {
    if (rares.length > 0) { rareCard = getRandom(rares); finish = 'Holo'; }
  } else {
    if (rares.length > 0) { rareCard = getRandom(rares); finish = 'Standard'; }
  }
  
  // Fallbacks
  if (!rareCard) {
    rareCard = getRandom(rares) || getRandom(cards);
    finish = 'Standard';
  }
  
  if (rareCard) pack.push({ ...rareCard, finish });
  
  return pack;
}

export function calculatePackScore(pack: Card[]): number {
  if (pack.length < 10) return 0;
  
  let score = 10; // Baseline score
  
  const reverseCard = pack[8]; // 9th card is reverse holo
  const rareCard = pack[9];    // 10th card is the rare slot
  
  // Reverse slot scoring
  if (reverseCard.rarity === 'Common') score += 2;
  else if (reverseCard.rarity === 'Uncommon') score += 4;
  else if (reverseCard.rarity === 'Rare') score += 8;
  else score += 10; // Fallback if a higher rarity somehow ends up here
  
  // Rare slot scoring
  if (rareCard.rarity === 'Rare') {
    if (rareCard.finish === 'Holo') score += 10;
    else score += 5; // Standard rare
  }
  else if (rareCard.rarity === 'V') score += 30;
  else if (rareCard.rarity === 'VMAX') score += 50;
  else if (rareCard.rarity === 'Secret Rare') score += 85;
  
  // Cap score at 100
  return Math.min(score, 100);
}
