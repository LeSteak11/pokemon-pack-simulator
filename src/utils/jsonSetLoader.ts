import { Card, Rarity, JSONSetData, JSONCard } from '../types';
import { invoke } from '@tauri-apps/api/core';

// True when the app is running inside a Tauri native window
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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
    case 'Rare Holo':
      return 'Rare';
    
    case 'Rare Secret':
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
 * Fetches a built-in JSON set file.
 * In production Tauri builds, reads directly from the sets/ folder alongside
 * the .exe via a Rust command — no rebuild needed to add new sets.
 * In dev/browser, served by Vite from /data/sets/.
 */
export async function fetchBuiltInSet(filename: string): Promise<JSONSetData> {
  if (isTauri && !import.meta.env.DEV) {
    const content = await invoke<string>('read_set_file', { filename });
    return JSON.parse(content) as JSONSetData;
  }

  const response = await fetch(`/data/sets/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load set: ${filename} (${response.status} ${response.statusText})`);
  }
  return response.json() as Promise<JSONSetData>;
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
 * Lists all available built-in sets by reading the manifest file.
 * The manifest is automatically updated by the set generation script.
 */
export async function getAvailableBuiltInSets(): Promise<Array<{ filename: string; displayName: string }>> {
  try {
    let manifest: Array<{ filename: string; setName: string; setCode: string }>;

    if (isTauri && !import.meta.env.DEV) {
      const content = await invoke<string>('read_set_file', { filename: 'sets-manifest.json' });
      manifest = JSON.parse(content);
    } else {
      const response = await fetch('/data/sets/sets-manifest.json');
      if (!response.ok) {
        console.warn('Failed to load sets manifest, using fallback');
        return [{ filename: 'evolving-skies.json', displayName: 'Evolving Skies (EVS)' }];
      }
      manifest = await response.json() as Array<{ filename: string; setName: string; setCode: string }>;
    }

    return manifest.map(set => ({
      filename: set.filename,
      displayName: `${set.setName} (${set.setCode})`
    }));
  } catch (error) {
    console.error('Error loading sets manifest:', error);
    return [{ filename: 'evolving-skies.json', displayName: 'Evolving Skies (EVS)' }];
  }
}
