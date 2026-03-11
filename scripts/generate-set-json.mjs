// Set JSON Generation Script
// Converts raw card list TXT files into simulator JSON format
// Usage: node scripts/generate-set-json.mjs <input-txt-file> [output-filename]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Validate arguments
const inputPath = process.argv[2];
if (!inputPath) {
  console.error('❌ Usage: node generate-set-json.mjs <input-txt-file> [output-filename]');
  console.error('   Example: node generate-set-json.mjs evolving-skies.txt');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Input file not found: ${inputPath}`);
  process.exit(1);
}

console.log('📄 Reading input file...');
const content = fs.readFileSync(inputPath, 'utf-8');
const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

// Extract set info from header
let setName = 'Unknown Set';
let setCode = 'UNK';
let baseSetSize = 0;

// Find "Evolving Skies:" or similar pattern in first few lines
for (let i = 0; i < Math.min(5, lines.length); i++) {
  if (lines[i].includes('Evolving Skies')) {
    setName = 'Evolving Skies';
    setCode = 'EVS';
    baseSetSize = 203;
    break;
  }
}

console.log(`📦 Parsing: ${setName} (${setCode})`);

// Parse cards
const cards = [];
let i = 0;

// Skip to first set code marker
while (i < lines.length && !lines[i].match(/^[A-Z]{2,4}$/)) {
  i++;
}

// Parse each card block
while (i < lines.length) {
  // Verify this is a set code line
  if (!lines[i].match(/^[A-Z]{2,4}$/)) {
    i++;
    continue;
  }
  
  const blockSetCode = lines[i++];
  if (i >= lines.length) break;
  
  // Card number (ensure 3 digits with leading zeros)
  const number = lines[i++].padStart(3, '0');
  if (i >= lines.length) break;
  
  // Card name
  const cardName = lines[i++];
  if (i >= lines.length) break;
  
  // Type/Stage info (determines category)
  const typeInfo = lines[i++];
  let category;
  if (typeInfo.includes('Pkmn')) category = 'Pokemon';
  else if (typeInfo.includes('Trainer')) category = 'Trainer';
  else if (typeInfo.includes('Energy')) category = 'Energy';
  else category = 'Pokemon'; // Default
  
  if (i >= lines.length) break;
  
  // Check if next line is energy type (only for Pokemon cards)
  // Energy types are formatted like: {G}, {R}, {W}, {L}, {P}, {F}, {D}, {N}, {C}
  if (category === 'Pokemon' && i < lines.length && lines[i].match(/^\{[A-Z]\}$/)) {
    i++; // Skip energy type line
  }
  
  if (i >= lines.length) break;
  
  // Rarity
  const rarity = lines[i++];
  if (i >= lines.length) break;
  
  // Price (skip but consume)
  i++; // Skip price line
  
  // Extract variant from card name
  let variant = null;
  if (cardName.endsWith(' VMAX')) {
    variant = 'VMAX';
  } else if (cardName.match(/ V$/)) {
    variant = 'V';
  }
  
  // Clean rarity string by removing variant suffix if present
  let cleanRarity = rarity;
  if (variant) {
    // Remove " V" or " VMAX" from end of rarity string
    cleanRarity = rarity.replace(new RegExp(` ${variant}$`), '').trim();
  }
  
  // Map common rarity variations to standard format
  if (cleanRarity === 'Rare Holo') {
    cleanRarity = 'Rare Holo';
  } else if (cleanRarity === 'Holo Rare') {
    cleanRarity = 'Holo Rare';
  }
  
  cards.push({
    number,
    name: cardName,
    rarity: cleanRarity,
    category,
    variant
  });
}

console.log(`✅ Parsed ${cards.length} cards\n`);

// Count by internal rarity (for validation)
const internalRarityCounts = {
  'Common': 0,
  'Uncommon': 0,
  'Rare': 0,
  'V': 0,
  'VMAX': 0,
  'Secret Rare': 0
};

cards.forEach(card => {
  // Map to internal rarity
  if (card.variant === 'V') {
    internalRarityCounts['V']++;
  } else if (card.variant === 'VMAX') {
    internalRarityCounts['VMAX']++;
  } else if (card.rarity === 'Common') {
    internalRarityCounts['Common']++;
  } else if (card.rarity === 'Uncommon') {
    internalRarityCounts['Uncommon']++;
  } else if (card.rarity.includes('Rare') && !card.rarity.includes('Ultra') && !card.rarity.includes('Rainbow') && !card.rarity.includes('Secret')) {
    internalRarityCounts['Rare']++;
  } else if (card.rarity.includes('Ultra') || card.rarity.includes('Rainbow') || card.rarity.includes('Secret') || card.rarity.includes('Special Full Art')) {
    internalRarityCounts['Secret Rare']++;
  }
});

// Generate output JSON
const output = {
  setName,
  setCode,
  baseSetSize,
  cards
};

// Determine output filename
let outputFilename = process.argv[3] || `${setName.toLowerCase().replace(/\s+/g, '-')}.json`;
if (!outputFilename.endsWith('.json')) {
  outputFilename += '.json';
}

const outputPath = path.join(__dirname, '..', 'data', 'sets', outputFilename);

// Ensure directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Write JSON file
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log('📊 Internal Rarity Distribution (for simulator):');
console.log(`   Commons:      ${internalRarityCounts['Common']}`);
console.log(`   Uncommons:    ${internalRarityCounts['Uncommon']}`);
console.log(`   Rares:        ${internalRarityCounts['Rare']}`);
console.log(`   V:            ${internalRarityCounts['V']}`);
console.log(`   VMAX:         ${internalRarityCounts['VMAX']}`);
console.log(`   Secret Rares: ${internalRarityCounts['Secret Rare']}`);

console.log(`\n✅ Set JSON written to: ${outputPath}`);
console.log(`   Total cards: ${cards.length}`);
console.log(`   Base set size: ${baseSetSize}`);

// Update manifest file
const manifestPath = path.join(__dirname, '..', 'data', 'sets', 'sets-manifest.json');
let manifest = [];

try {
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
  }
} catch (e) {
  console.warn('⚠️ Could not read existing manifest, creating new one');
}

// Add or update this set in the manifest
const manifestEntry = {
  filename: outputFilename,
  setName: setName,
  setCode: setCode
};

const existingIndex = manifest.findIndex(entry => entry.filename === outputFilename);
if (existingIndex >= 0) {
  manifest[existingIndex] = manifestEntry;
  console.log(`\n📝 Updated manifest entry for ${outputFilename}`);
} else {
  manifest.push(manifestEntry);
  console.log(`\n📝 Added ${outputFilename} to manifest`);
}

// Sort manifest by filename
manifest.sort((a, b) => a.filename.localeCompare(b.filename));

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`✅ Manifest updated: ${manifestPath}`);
console.log(`   Total sets in manifest: ${manifest.length}`);
