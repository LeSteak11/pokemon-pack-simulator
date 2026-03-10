import React, { useState } from 'react';
import { Search, X, Download } from 'lucide-react';
import { searchSets, fetchCardsForSet, mapAPIRarityToInternal, determineAllowedFinishes, type APISet } from '../utils/pokemonAPI';
import type { Card } from '../types';

interface SetSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSet: (setName: string, setId: string, cards: Card[]) => void;
}

export default function SetSearchModal({ isOpen, onClose, onSelectSet }: SetSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<APISet[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    console.log(`🔍 Searching for sets with query: "${query}"`);
    setLoading(true);
    setResults([]); // Clear previous results
    setHasSearched(true);
    
    try {
      const sets = await searchSets(query);
      console.log(`✅ Search complete, found ${sets.length} sets`);
      setResults(sets);
      
      if (sets.length === 0) {
        console.log('⚠️ No sets found. Try a different search term.');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSet = async (set: APISet) => {
    setImporting(set.id);
    try {
      // Fetch all cards for this set
      const apiCards = await fetchCardsForSet(set.id);
      
      // Convert API cards to our internal format
      const cards: Card[] = apiCards.map(apiCard => ({
        number: apiCard.number,
        name: apiCard.name,
        rarity: mapAPIRarityToInternal(apiCard.rarity),
        finish: 'Standard', // Default, will be determined dynamically during pack opening
        apiData: {
          cardId: apiCard.id,
          supertype: apiCard.supertype,
          subtypes: apiCard.subtypes,
          types: apiCard.types,
          hp: apiCard.hp,
          apiRarity: apiCard.rarity,
          allowedFinishes: determineAllowedFinishes(apiCard.rarity),
          imageUrl: apiCard.images?.small,
          tcgplayer: apiCard.tcgplayer,
          setInfo: {
            id: set.id,
            name: set.name,
            series: set.series,
            releaseDate: set.releaseDate,
          },
        },
      }));
      
      // Pass to parent with API set ID
      onSelectSet(set.name, set.id, cards);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import set. Please try again.');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Search Pokémon TCG Sets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter set name (e.g., Base Set, Sword & Shield)"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"
            >
              <Search size={20} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasSearched && results.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-12">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Search for a Pokémon TCG set to import</p>
              <p className="text-sm mb-4">Try these popular sets:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Base Set', 'Crown Zenith', 'Scarlet Violet', 'Paldea Evolved', 'Obsidian Flames'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={async () => {
                      setQuery(suggestion);
                      setHasSearched(true);
                      setLoading(true);
                      try {
                        const sets = await searchSets(suggestion);
                        setResults(sets);
                      } catch (error) {
                        console.error('Search error:', error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {hasSearched && results.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-12">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No sets found for "{query}"</p>
              <p className="text-sm">Try a different search term or check your spelling</p>
            </div>
          )}

          <div className="grid gap-4">
            {results.map((set) => (
              <div
                key={set.id}
                className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Set Logo */}
                  {set.images?.logo && (
                    <img
                      src={set.images.logo}
                      alt={set.name}
                      className="w-24 h-24 object-contain"
                    />
                  )}
                  
                  {/* Set Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{set.name}</h3>
                    <p className="text-gray-600">{set.series}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>{set.printedTotal} cards</span>
                      <span>Released: {set.releaseDate}</span>
                    </div>
                  </div>

                  {/* Import Button */}
                  <button
                    onClick={() => handleImportSet(set)}
                    disabled={importing === set.id}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 flex items-center gap-2"
                  >
                    <Download size={20} />
                    {importing === set.id ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
