// Pack Simulation Test - 100 Pack Analysis
// This script simulates 100 packs and outputs detailed results

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

// Determine finish based on slot type
function determineFinish(card, slotType) {
  if (slotType === 'reverse') return 'Reverse Holo';
  
  if (slotType === 'rare') {
    if (card.rarity === 'Secret Rare') return 'Secret Rare';
    if (card.rarity === 'VMAX' || card.rarity === 'V') return 'Ultra Rare';
    if (card.rarity === 'Rare') return 'Holo';
  }
  
  return 'Standard';
}

// Simulate pack
function simulatePack(pools) {
  const pack = [];
  const usedCardNumbers = new Set();
  const getRandomExcluding = (arr) => {
    const available = arr.filter(c => !usedCardNumbers.has(c.number));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };
  const allCards = [...pools.commons, ...pools.uncommons, ...pools.rares, ...pools.vs, ...pools.vmaxs, ...pools.secretRares];
  
  // 5 Commons
  for (let i = 0; i < 5; i++) {
    const c = getRandomExcluding(pools.commons) || getRandomExcluding(allCards);
    if (c) {
      pack.push({ ...c, finish: determineFinish(c, 'standard') });
      usedCardNumbers.add(c.number);
    }
  }
  
  // 3 Uncommons
  for (let i = 0; i < 3; i++) {
    const c = getRandomExcluding(pools.uncommons) || getRandomExcluding(allCards);
    if (c) {
      pack.push({ ...c, finish: determineFinish(c, 'standard') });
      usedCardNumbers.add(c.number);
    }
  }
  
  // 1 Reverse Holo Slot (60% Common, 30% Uncommon, 10% Rare)
  const revRand = Math.random();
  let revCard = null;
  if (revRand < 0.60 && pools.commons.length > 0) {
    revCard = getRandomExcluding(pools.commons);
  } else if (revRand < 0.90 && pools.uncommons.length > 0) {
    revCard = getRandomExcluding(pools.uncommons);
  } else if (pools.rares.length > 0) {
    revCard = getRandomExcluding(pools.rares);
  }
  if (!revCard) revCard = getRandomExcluding(allCards);
  if (revCard) {
    pack.push({ ...revCard, finish: determineFinish(revCard, 'reverse') });
    usedCardNumbers.add(revCard.number);
  }
  
  // 1 Rare Slot
  const rand = Math.random();
  let rareCard = null;
  
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
  
  if (!rareCard) rareCard = getRandomExcluding(pools.rares) || getRandomExcluding(allCards);
  if (rareCard) {
    pack.push({ ...rareCard, finish: determineFinish(rareCard, 'rare') });
    usedCardNumbers.add(rareCard.number);
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
