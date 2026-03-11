// Pack Simulation Test - 100 Pack Analysis
// This script simulates 100 packs and outputs detailed results

// Default pack configuration (matching DEFAULT_PACK_CONFIG from packSimulator.ts)
const DEFAULT_PACK_CONFIG = {
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

// Mock card data structure
const mockCards = [];

// Generate mock Evolving Skies-like set (233 cards)
// Commons: 60%, Uncommons: 25%, Rares: 10%, V: 3%, VMAX: 1.5%, Secret: 0.5%
for (let i = 1; i <= 140; i++) {
  mockCards.push({ number: String(i), name: `Common ${i}`, rarity: 'Common', finish: 'Standard' });
}
for (let i = 141; i <= 199; i++) {
  mockCards.push({ number: String(i), name: `Uncommon ${i}`, rarity: 'Uncommon', finish: 'Standard' });
}
for (let i = 200; i <= 222; i++) {
  mockCards.push({ number: String(i), name: `Rare ${i}`, rarity: 'Rare', finish: 'Standard' });
}
for (let i = 223; i <= 229; i++) {
  mockCards.push({ number: String(i), name: `V ${i}`, rarity: 'V', finish: 'Standard' });
}
for (let i = 230; i <= 232; i++) {
  mockCards.push({ number: String(i), name: `VMAX ${i}`, rarity: 'VMAX', finish: 'Standard' });
}
mockCards.push({ number: '233', name: 'Secret Rare 233', rarity: 'Secret Rare', finish: 'Standard' });

// Build rarity pools
const pools = {
  commons: mockCards.filter(c => c.rarity === 'Common'),
  uncommons: mockCards.filter(c => c.rarity === 'Uncommon'),
  rares: mockCards.filter(c => c.rarity === 'Rare'),
  vs: mockCards.filter(c => c.rarity === 'V'),
  vmaxs: mockCards.filter(c => c.rarity === 'VMAX'),
  secretRares: mockCards.filter(c => c.rarity === 'Secret Rare')
};

// Returns all valid finish types for a card based on its rarity
function getValidFinishes(card) {
  switch (card.rarity) {
    case 'Common':
    case 'Uncommon':
      return ['Standard', 'Reverse Holo'];
    case 'Rare':
      return ['Standard', 'Reverse Holo', 'Holo'];
    case 'V':
    case 'VMAX':
      return ['Ultra Rare'];
    case 'Secret Rare':
      return ['Secret Rare'];
    default:
      return ['Standard'];
  }
}

// Selects a valid finish for a card, using preferred finish if legal
function selectValidFinish(card, preferredFinish) {
  const validFinishes = getValidFinishes(card);
  
  if (validFinishes.includes(preferredFinish)) {
    return preferredFinish;
  }
  
  if (validFinishes.includes('Standard')) {
    return 'Standard';
  }
  
  return validFinishes[0];
}

// Determine finish based on slot type with validation
function determineFinish(card, slotType) {
  let preferredFinish;
  
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
  
  return selectValidFinish(card, preferredFinish);
}

// Simulate pack with configuration
function simulatePack(pools, config = DEFAULT_PACK_CONFIG) {
  const pack = [];
  const usedCardNumbers = new Set();
  const getRandomExcluding = (arr) => {
    const available = arr.filter(c => !usedCardNumbers.has(c.number));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };
  const allCards = [...pools.commons, ...pools.uncommons, ...pools.rares, ...pools.vs, ...pools.vmaxs, ...pools.secretRares];
  
  // Reverse slot can only pull from common/uncommon/rare pools (never ultra-rares)
  const reverseEligibleCards = [...pools.commons, ...pools.uncommons, ...pools.rares];
  
  // Commons (configurable count)
  for (let i = 0; i < config.slots.commons; i++) {
    const c = getRandomExcluding(pools.commons) || getRandomExcluding(allCards);
    if (c) {
      pack.push({ ...c, finish: determineFinish(c, 'standard') });
      usedCardNumbers.add(c.number);
    }
  }
  
  // Uncommons (configurable count)
  for (let i = 0; i < config.slots.uncommons; i++) {
    const c = getRandomExcluding(pools.uncommons) || getRandomExcluding(allCards);
    if (c) {
      pack.push({ ...c, finish: determineFinish(c, 'standard') });
      usedCardNumbers.add(c.number);
    }
  }
  
  // Reverse Holo Slot (if enabled, uses configured odds)
  if (config.slots.reverse) {
    const revRand = Math.random();
    let revCard = null;
    if (revRand < config.reverseSlotOdds.common && pools.commons.length > 0) {
      revCard = getRandomExcluding(pools.commons);
    } else if (revRand < config.reverseSlotOdds.common + config.reverseSlotOdds.uncommon && pools.uncommons.length > 0) {
      revCard = getRandomExcluding(pools.uncommons);
    } else if (pools.rares.length > 0) {
      revCard = getRandomExcluding(pools.rares);
    }
    if (!revCard) revCard = getRandomExcluding(reverseEligibleCards);
    if (revCard) {
      pack.push({ ...revCard, finish: determineFinish(revCard, 'reverse') });
      usedCardNumbers.add(revCard.number);
    }
  }
  
  // Rare Slot (if enabled, uses configured odds)
  if (config.slots.rare) {
    const rand = Math.random();
    let rareCard = null;
    
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
    
    if (!rareCard) rareCard = getRandomExcluding(pools.rares) || getRandomExcluding(allCards);
    if (rareCard) {
      pack.push({ ...rareCard, finish: determineFinish(rareCard, 'rare') });
      usedCardNumbers.add(rareCard.number);
    }
  }
  
  return pack;
}

// Calculate pack score
function calculatePackScore(pack) {
  if (pack.length < 10) return 0;
  let score = 10;
  
  pack.forEach(card => {
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
      score += card.finish === 'Reverse Holo' ? 2 : 0;
    }
  });
  
  return Math.min(score, 100);
}

// Run 100 simulations
console.log('Running 100 pack simulations...\n');

let output = '='.repeat(80) + '\n';
output += 'PACK SIMULATION ANALYSIS - 100 PACKS\n';
output += '='.repeat(80) + '\n\n';
output += `Set Size: ${mockCards.length} cards\n`;
output += `Pools: ${pools.commons.length} Commons, ${pools.uncommons.length} Uncommons, ${pools.rares.length} Rares, ${pools.vs.length} V, ${pools.vmaxs.length} VMAX, ${pools.secretRares.length} Secret\n\n`;

const scores = [];
const rarityDistribution = { 'Secret Rare': 0, 'VMAX': 0, 'V': 0, 'Rare': 0, 'Uncommon': 0, 'Common': 0 };

for (let i = 1; i <= 100; i++) {
  const pack = simulatePack(pools);
  const score = calculatePackScore(pack);
  scores.push(score);
  
  output += `${'='.repeat(80)}\n`;
  output += `PACK #${i} - Score: ${score} pts\n`;
  output += `${'-'.repeat(80)}\n`;
  
  pack.forEach((card, idx) => {
    output += `  ${idx + 1}. ${card.name.padEnd(20)} | ${card.rarity.padEnd(12)} | ${card.finish}\n`;
    rarityDistribution[card.rarity]++;
  });
  
  output += `\n`;
}

// Summary statistics
output += '\n' + '='.repeat(80) + '\n';
output += 'SUMMARY STATISTICS\n';
output += '='.repeat(80) + '\n\n';

const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
const minScore = Math.min(...scores);
const maxScore = Math.max(...scores);

output += `Score Statistics:\n`;
output += `  Average: ${avgScore} pts\n`;
output += `  Minimum: ${minScore} pts\n`;
output += `  Maximum: ${maxScore} pts\n\n`;

output += `Score Distribution:\n`;
const scoreRanges = {
  '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
};
scores.forEach(s => {
  if (s <= 20) scoreRanges['0-20']++;
  else if (s <= 40) scoreRanges['21-40']++;
  else if (s <= 60) scoreRanges['41-60']++;
  else if (s <= 80) scoreRanges['61-80']++;
  else scoreRanges['81-100']++;
});

Object.entries(scoreRanges).forEach(([range, count]) => {
  output += `  ${range}: ${count} packs (${(count / 100 * 100).toFixed(1)}%)\n`;
});

output += `\nRarity Distribution (1100 total cards from 100 packs):\n`;
Object.entries(rarityDistribution).forEach(([rarity, count]) => {
  output += `  ${rarity}: ${count} cards (${(count / 1100 * 100).toFixed(2)}%)\n`;
});

output += '\n' + '='.repeat(80) + '\n';
output += 'END OF REPORT\n';
output += '='.repeat(80) + '\n';

// Write to file
import { writeFileSync } from 'fs';
writeFileSync('pack-simulation-report.txt', output, 'utf8');

console.log('✅ Simulation complete!');
console.log('📄 Report saved to: pack-simulation-report.txt');
console.log(`\n📊 Quick Stats:`);
console.log(`   Average Score: ${avgScore} pts`);
console.log(`   Score Range: ${minScore} - ${maxScore} pts`);
console.log(`   Total Packs: 100`);
