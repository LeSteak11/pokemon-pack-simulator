// Pokémon TCG API Integration Layer
// API Documentation: https://docs.pokemontcg.io/

const BASE_URL = 'https://api.pokemontcg.io/v2';

export interface APICard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rarity: string;
  number: string;
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    releaseDate: string;
  };
  images?: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    prices?: any;
  };
}

export interface APISet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  images: {
    symbol: string;
    logo: string;
  };
}

// Cache to avoid repeated API calls
const cache = {
  sets: new Map<string, APISet>(),
  cards: new Map<string, APICard[]>(),
};

/**
 * Search for sets by name
 */
export async function searchSets(query: string): Promise<APISet[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/sets?q=name:"*${query}*"&orderBy=-releaseDate`
    );
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching sets:', error);
    return [];
  }
}

/**
 * Get all cards for a specific set
 */
export async function fetchCardsForSet(setId: string): Promise<APICard[]> {
  // Check cache first
  if (cache.cards.has(setId)) {
    return cache.cards.get(setId)!;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/cards?q=set.id:${setId}&pageSize=250&orderBy=number`
    );
    const data = await response.json();
    const cards = data.data || [];
    
    // Cache the results
    cache.cards.set(setId, cards);
    return cards;
  } catch (error) {
    console.error('Error fetching cards for set:', error);
    return [];
  }
}

/**
 * Match a parsed card (from PDF) to API data
 */
export async function matchCardToAPI(
  setId: string,
  cardNumber: string,
  cardName: string
): Promise<APICard | null> {
  try {
    // Try exact number match first
    const response = await fetch(
      `${BASE_URL}/cards?q=set.id:${setId} number:${cardNumber}`
    );
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      // If multiple matches, try to match by name too
      const exactMatch = data.data.find((card: APICard) => 
        card.name.toLowerCase() === cardName.toLowerCase()
      );
      return exactMatch || data.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error matching card:', error);
    return null;
  }
}

/**
 * Enrich parsed cards with API metadata
 */
export async function enrichCardsWithAPI(
  setId: string,
  parsedCards: Array<{ number: string; name: string }>
): Promise<APICard[]> {
  try {
    // Fetch all cards for the set at once (more efficient)
    const allSetCards = await fetchCardsForSet(setId);
    
    // Create a map for quick lookup
    const cardMap = new Map<string, APICard>();
    allSetCards.forEach(card => {
      cardMap.set(card.number, card);
    });
    
    // Match parsed cards to API cards
    const enrichedCards: APICard[] = [];
    for (const parsed of parsedCards) {
      const apiCard = cardMap.get(parsed.number);
      if (apiCard) {
        enrichedCards.push(apiCard);
      }
    }
    
    return enrichedCards;
  } catch (error) {
    console.error('Error enriching cards:', error);
    return [];
  }
}

/**
 * Map API rarity to our internal rarity system
 */
export function mapAPIRarityToInternal(apiRarity: string): string {
  const rarityMap: Record<string, string> = {
    'Common': 'Common',
    'Uncommon': 'Uncommon',
    'Rare': 'Rare',
    'Rare Holo': 'Rare',
    'Rare Holo EX': 'V',
    'Rare Holo GX': 'VMAX',
    'Rare Holo V': 'V',
    'Rare Holo VMAX': 'VMAX',
    'Rare Holo VSTAR': 'VMAX',
    'Rare Ultra': 'V',
    'Rare Secret': 'Secret Rare',
    'Rare Rainbow': 'Secret Rare',
    'Rare Shiny': 'Secret Rare',
    'Rare Shiny GX': 'Secret Rare',
    'Amazing Rare': 'Secret Rare',
    'Radiant Rare': 'V',
  };
  
  return rarityMap[apiRarity] || 'Common';
}

/**
 * Determine allowed finishes based on API rarity
 */
export function determineAllowedFinishes(apiRarity: string): string[] {
  if (apiRarity === 'Common' || apiRarity === 'Uncommon') {
    return ['Standard', 'Reverse Holo'];
  }
  
  if (apiRarity === 'Rare') {
    return ['Standard', 'Reverse Holo'];
  }
  
  if (apiRarity === 'Rare Holo') {
    return ['Holo', 'Reverse Holo'];
  }
  
  if (apiRarity.includes('Ultra') || apiRarity.includes('EX') || 
      apiRarity.includes('GX') || apiRarity.includes('V')) {
    return ['Ultra Rare'];
  }
  
  if (apiRarity.includes('Secret') || apiRarity.includes('Rainbow') || 
      apiRarity.includes('Shiny')) {
    return ['Secret Rare'];
  }
  
  return ['Standard', 'Reverse Holo'];
}

/**
 * Check if a rare card is holo-only
 */
export function isHoloOnly(apiRarity: string): boolean {
  return apiRarity === 'Rare Holo' || 
         apiRarity.includes('Ultra') || 
         apiRarity.includes('Secret');
}
