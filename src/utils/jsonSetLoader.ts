import { Card, Rarity, JSONSetData, JSONCard } from '../types';

/**
 * Maps JSON rarity strings to our internal Rarity type.
 * Uses the variant field to distinguish V and VMAX cards.
 */
function mapJSONRarityToRarity(jsonRarity: string, variant: string | null): Rarity {
  // V and VMAX are determined by variant field, not rarity
  if (variant === 'V') return 'V';
  if (variant === 'VMAX') return 'VMAX';
  
  // Map JSON rarities to internal types
  switch (jsonRarity) {
    case 'Common':
      return 'Common';
    
    case 'Uncommon':
      return 'Uncommon';
    
    case 'Rare':
    case 'Holo Rare':
      return 'Rare';
    
    case 'Rainbow Rare':
    case 'Special Full Art':
    case 'Secret Rare':
      return 'Secret Rare';
    
    default:
      console.warn(`Unknown rarity: ${jsonRarity}, defaulting to Common`);
      return 'Common';
  }
}

/**
 * Converts a JSON card to our internal Card format.
 * Always sets finish to 'Standard' - finish is determined during pack generation.
 */
function convertJSONCard(jsonCard: JSONCard): Card {
  return {
    number: jsonCard.number,
    name: jsonCard.name,
    rarity: mapJSONRarityToRarity(jsonCard.rarity, jsonCard.variant),
    finish: 'Standard' // Finish is assigned during pack simulation
  };
}

/**
 * Loads and parses a JSON set file into our internal Card array.
 * Validates the JSON structure and converts all cards.
 */
export function loadSetFromJSON(jsonData: JSONSetData): {
  name: string;
  code: string;
  baseSetSize: number;
  cards: Card[];
} {
  // Validate required fields
  if (!jsonData.setName || !jsonData.setCode || !jsonData.baseSetSize || !jsonData.cards) {
    throw new Error('Invalid JSON set data: missing required fields (setName, setCode, baseSetSize, or cards)');
  }
  
  if (!Array.isArray(jsonData.cards)) {
    throw new Error('Invalid JSON set data: cards must be an array');
  }
  
  if (jsonData.cards.length === 0) {
    throw new Error('Invalid JSON set data: cards array is empty');
  }
  
  // Convert all JSON cards to internal Card format
  const cards = jsonData.cards.map(convertJSONCard);
  
  console.log(`📦 Loaded ${jsonData.setName} (${jsonData.setCode})`);
  console.log(`   - ${cards.length} cards`);
  console.log(`   - Base set size: ${jsonData.baseSetSize}`);
  
  // Log rarity breakdown
  const rarityCount = cards.reduce((acc, card) => {
    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`   - Rarity breakdown:`, rarityCount);
  
  return {
    name: jsonData.setName,
    code: jsonData.setCode,
    baseSetSize: jsonData.baseSetSize,
    cards
  };
}

/**
 * Fetches a built-in JSON set file from /data/sets/
 */
export async function fetchBuiltInSet(filename: string): Promise<JSONSetData> {
  const response = await fetch(`/data/sets/${filename}`);
  
  if (!response.ok) {
    throw new Error(`Failed to load set: ${filename} (${response.status} ${response.statusText})`);
  }
  
  const jsonData = await response.json();
  return jsonData as JSONSetData;
}

/**
 * Parses a JSON set file from uploaded file content
 */
export function parseUploadedJSON(fileContent: string): JSONSetData {
  try {
    const jsonData = JSON.parse(fileContent);
    return jsonData as JSONSetData;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Lists all available built-in sets.
 * In production, this would be a static list or fetched from a manifest.
 */
export function getAvailableBuiltInSets(): Array<{ filename: string; displayName: string }> {
  return [
    { filename: 'evolving-skies.json', displayName: 'Evolving Skies (EVS)' }
    // Add more sets as JSON files are created
  ];
}
