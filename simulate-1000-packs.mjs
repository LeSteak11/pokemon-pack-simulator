// 1000 Pack Simulation with CSV Output
// Loads Evolving Skies JSON and simulates 1000 packs using exact simulator logic

import fs from 'fs';

// Load Evolving Skies JSON
const evolvingSkiesData = JSON.parse(
  fs.readFileSync('./data/sets/evolving-skies.json', 'utf-8')
);

console.log('📦 Loaded:', evolvingSkiesData.setName);
console.log('   Cards:', evolvingSkiesData.cards.length);
console.log('   Base Set Size:', evolvingSkiesData.baseSetSize);

// Map JSON rarity to internal rarity
function mapJSONRarityToRarity(jsonRarity, variant) {
  if (variant === 'V') return 'V';
  if (variant === 'VMAX') return 'VMAX';
  
  switch (jsonRarity) {
    case 'Common': return 'Common';
    case 'Uncommon': return 'Uncommon';
    case 'Rare':
    case 'Holo Rare': return 'Rare';
    case 'Rainbow Rare':
    case 'Special Full Art':
    case 'Secret Rare': return 'Secret Rare';
    default: return 'Common';
  }
}

// Convert JSON cards to internal format
const cards = evolvingSkiesData.cards.map(jsonCard => ({
  number: jsonCard.number,
  name: jsonCard.name,
  rarity: mapJSONRarityToRarity(jsonCard.rarity, jsonCard.variant),
  finish: 'Standard',
  variant: jsonCard.variant,
  category: jsonCard.category
}));

// Build rarity pools
const pools = {
  commons: cards.filter(c => c.rarity === 'Common'),
  uncommons: cards.filter(c => c.rarity === 'Uncommon'),
  rares: cards.filter(c => c.rarity === 'Rare'),
  vs: cards.filter(c => c.rarity === 'V'),
  vmaxs: cards.filter(c => c.rarity === 'VMAX'),
  secretRares: cards.filter(c => c.rarity === 'Secret Rare')
};

console.log('\n📊 Rarity Pools:');
console.log('   Commons:', pools.commons.length);
console.log('   Uncommons:', pools.uncommons.length);
console.log('   Rares:', pools.rares.length);
console.log('   V:', pools.vs.length);
console.log('   VMAX:', pools.vmaxs.length);
console.log('   Secret Rares:', pools.secretRares.length);

// Pack configuration
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

// Finish validation functions (from CHANGE 07)
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

// Simulate pack with slot tracking
function simulatePack(pools, config = DEFAULT_PACK_CONFIG) {
  const pack = [];
  const usedCardNumbers = new Set();
  
  const getRandomExcluding = (arr) => {
    const available = arr.filter(c => !usedCardNumbers.has(c.number));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };
  
  const allCards = [...pools.commons, ...pools.uncommons, ...pools.rares, ...pools.vs, ...pools.vmaxs, ...pools.secretRares];
  const reverseEligibleCards = [...pools.commons, ...pools.uncommons, ...pools.rares];
  
  // Commons (slots 1-5)
  for (let i = 0; i < config.slots.commons; i++) {
    const c = getRandomExcluding(pools.commons) || getRandomExcluding(allCards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish, slot: `common${i + 1}` });
      usedCardNumbers.add(c.number);
    }
  }
  
  // Uncommons (slots 6-8)
  for (let i = 0; i < config.slots.uncommons; i++) {
    const c = getRandomExcluding(pools.uncommons) || getRandomExcluding(allCards);
    if (c) {
      const finish = determineFinish(c, 'standard');
      pack.push({ ...c, finish, slot: `uncommon${i + 1}` });
      usedCardNumbers.add(c.number);
    }
  }
  
  // Reverse Holo Slot (slot 9)
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
      const finish = determineFinish(revCard, 'reverse');
      pack.push({ ...revCard, finish, slot: 'reverse' });
      usedCardNumbers.add(revCard.number);
    }
  }
  
  // Rare Slot (slot 10)
  if (config.slots.rare) {
    const rand = Math.random();
    let rareCard = null;
    
    if (rand < config.rareSlotOdds.secretRare) {
      if (pools.secretRares.length > 0) { rareCard = getRandomExcluding(pools.secretRares); }
      else if (pools.vmaxs.length > 0) { rareCard = getRandomExcluding(pools.vmaxs); }
      else if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
      else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else if (rand < config.rareSlotOdds.secretRare + config.rareSlotOdds.vmax) {
      if (pools.vmaxs.length > 0) { rareCard = getRandomExcluding(pools.vmaxs); }
      else if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
      else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else if (rand < config.rareSlotOdds.secretRare + config.rareSlotOdds.vmax + config.rareSlotOdds.v) {
      if (pools.vs.length > 0) { rareCard = getRandomExcluding(pools.vs); }
      else if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else if (rand < config.rareSlotOdds.secretRare + config.rareSlotOdds.vmax + config.rareSlotOdds.v + config.rareSlotOdds.holo) {
      if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    } else {
      if (pools.rares.length > 0) { rareCard = getRandomExcluding(pools.rares); }
    }
    
    if (!rareCard) {
      rareCard = getRandomExcluding(pools.rares) || getRandomExcluding(allCards);
    }
    
    if (rareCard) {
      const finish = determineFinish(rareCard, 'rare');
      pack.push({ ...rareCard, finish, slot: 'rare' });
      usedCardNumbers.add(rareCard.number);
    }
  }
  
  return pack;
}

// Run simulation
console.log('\n🎲 Running 1000 pack simulation...\n');

const allPulls = [];
const rarityCount = {
  'Common': 0,
  'Uncommon': 0,
  'Rare': 0,
  'V': 0,
  'VMAX': 0,
  'Secret Rare': 0
};

for (let packNum = 1; packNum <= 1000; packNum++) {
  const pack = simulatePack(pools);
  
  pack.forEach(card => {
    allPulls.push({
      packNumber: packNum,
      slot: card.slot,
      cardNumber: card.number,
      cardName: card.name,
      rarity: card.rarity,
      variant: card.variant || 'null',
      category: card.category
    });
    
    rarityCount[card.rarity]++;
  });
  
  if (packNum % 100 === 0) {
    console.log(`   Progress: ${packNum}/1000 packs`);
  }
}

console.log('\n✅ Simulation complete!');
console.log(`   Total cards pulled: ${allPulls.length}`);

// Generate detailed CSV
const detailedCsvHeader = 'packNumber,slot,cardNumber,cardName,rarity,variant,category\n';
const detailedCsvRows = allPulls.map(pull => 
  `${pull.packNumber},${pull.slot},${pull.cardNumber},"${pull.cardName}",${pull.rarity},${pull.variant},${pull.category}`
).join('\n');
const detailedCsv = detailedCsvHeader + detailedCsvRows;

fs.writeFileSync('simulation_1000_packs.csv', detailedCsv, 'utf-8');
console.log('\n📊 Detailed CSV saved: simulation_1000_packs.csv');

// Generate summary CSV
const totalCards = allPulls.length;
const summaryCsvHeader = 'rarity,count,percentage\n';
const summaryCsvRows = Object.entries(rarityCount)
  .map(([rarity, count]) => `${rarity},${count},${(count / totalCards * 100).toFixed(2)}`)
  .join('\n');
const summaryCsv = summaryCsvHeader + summaryCsvRows;

fs.writeFileSync('simulation_summary_1000_packs.csv', summaryCsv, 'utf-8');
console.log('📊 Summary CSV saved: simulation_summary_1000_packs.csv');

// Display summary
console.log('\n' + '='.repeat(60));
console.log('RARITY DISTRIBUTION (1000 Packs)');
console.log('='.repeat(60));
console.log('Rarity          | Count  | Percentage');
console.log('-'.repeat(60));
Object.entries(rarityCount).forEach(([rarity, count]) => {
  const percentage = (count / totalCards * 100).toFixed(2);
  console.log(`${rarity.padEnd(15)} | ${String(count).padStart(6)} | ${percentage.padStart(6)}%`);
});
console.log('='.repeat(60));
console.log(`Total Cards     | ${String(totalCards).padStart(6)} | 100.00%`);
console.log('='.repeat(60));
