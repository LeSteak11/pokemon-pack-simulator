import { useState } from 'react';
import { Card } from '../types';
import { extractTextFromPDF, parseCards } from '../utils/pdfParser';
import { searchSets, enrichCardsWithAPI, mapAPIRarityToInternal, determineAllowedFinishes } from '../utils/pokemonAPI';

export function usePDFUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewCards, setPreviewCards] = useState<Card[]>([]);
  const [previewSetName, setPreviewSetName] = useState('');
  const [previewBaseSize, setPreviewBaseSize] = useState(203);
  const [apiSetId, setApiSetId] = useState<string | null>(null);

  const uploadPDF = async (file: File, setName: string, baseSize: number) => {
    if (!setName.trim()) {
      setError("Please enter a Set Name before uploading.");
      return false;
    }

    console.log(`📄 Starting PDF upload: ${file.name}`);
    setIsLoading(true);
    setError(null);
    
    try {
      const lines = await extractTextFromPDF(file);
      console.log(`📝 Extracted ${lines.length} lines from PDF`);
      
      const parsedCards = parseCards(lines, baseSize);
      console.log(`🎴 Parsed ${parsedCards.length} cards`);
      
      if (parsedCards.length === 0) {
        setError("Could not find any cards in the PDF. Please ensure it's a valid checklist.");
        return false;
      }
      
      // Show preview immediately, enrich with API in background
      setPreviewCards(parsedCards);
      setPreviewSetName(setName.trim());
      setPreviewBaseSize(baseSize);
      setShowPreview(true);
      
      // Try to enrich with API data in background
      let enrichedCards = parsedCards;
      let foundSetId: string | null = null;
      
      console.log(`🔍 Starting background API enrichment for: "${setName}"`);
      
      // Do API enrichment asynchronously without blocking
      (async () => {
        try {
          console.log(`🔍 Searching API for set: "${setName}"`);
          const sets = await searchSets(setName);
        
        if (sets.length > 0) {
          // Use the first match (most recent if multiple)
          const apiSet = sets[0];
          foundSetId = apiSet.id;
          console.log(`✅ Found API set: ${apiSet.name} (${apiSet.id})`);
          
          // Fetch API cards for this set
          const apiCards = await enrichCardsWithAPI(
            apiSet.id,
            parsedCards.map(card => ({ number: card.number, name: card.name }))
          );
          
          console.log(`🔗 Matched ${apiCards.length}/${parsedCards.length} cards to API data`);
          
          // Merge API data into parsed cards
          enrichedCards = parsedCards.map((card, index) => {
            const apiCard = apiCards.find(ac => ac.number === card.number);
            
            if (apiCard) {
              return {
                ...card,
                rarity: mapAPIRarityToInternal(apiCard.rarity),
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
                    id: apiSet.id,
                    name: apiSet.name,
                    series: apiSet.series,
                    releaseDate: apiSet.releaseDate,
                  },
                },
              };
            }
            
            return card; // Keep original if no API match
          });
          
          // Update preview with enriched data
          console.log(`✅ API enrichment complete, updating preview...`);
          setPreviewCards(enrichedCards);
          setApiSetId(foundSetId);
        } else {
          console.log('⚠️ No API match found, using heuristic rarity detection');
        }
      } catch (apiError) {
        console.warn('⚠️ API enrichment failed, falling back to heuristics:', apiError);
      }
      })();
      
      return true;
      
    } catch (err) {
      console.error('❌ PDF upload failed:', err);
      setError("Failed to parse PDF. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPreview = () => {
    setShowPreview(false);
    setPreviewCards([]);
    setPreviewSetName('');
    setPreviewBaseSize(203);
    setApiSetId(null);
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setPreviewCards([]);
    setPreviewSetName('');
    setPreviewBaseSize(203);
    setApiSetId(null);
  };

  const updatePreviewCard = (index: number, updates: Partial<Card>) => {
    setPreviewCards(prev => prev.map((card, i) => 
      i === index ? { ...card, ...updates } : card
    ));
  };

  const deletePreviewCard = (index: number) => {
    setPreviewCards(prev => prev.filter((_, i) => i !== index));
  };

  return {
    isLoading,
    error,
    setError,
    uploadPDF,
    previewState: {
      isOpen: showPreview,
      cards: previewCards,
      setName: previewSetName,
      baseSize: previewBaseSize,
      apiSetId: apiSetId,
    },
    confirmPreview,
    cancelPreview,
    updatePreviewCard,
    deletePreviewCard,
  };
}
