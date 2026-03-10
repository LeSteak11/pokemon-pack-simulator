import { useState } from 'react';
import { Card } from '../types';
import { extractTextFromPDF, parseCards } from '../utils/pdfParser';

export function usePDFUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewCards, setPreviewCards] = useState<Card[]>([]);
  const [previewSetName, setPreviewSetName] = useState('');
  const [previewBaseSize, setPreviewBaseSize] = useState(203);

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
      
      // Show preview with parsed cards
      setPreviewCards(parsedCards);
      setPreviewSetName(setName.trim());
      setPreviewBaseSize(baseSize);
      setShowPreview(true);
      
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
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setPreviewCards([]);
    setPreviewSetName('');
    setPreviewBaseSize(203);
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
    },
    confirmPreview,
    cancelPreview,
    updatePreviewCard,
    deletePreviewCard,
  };
}
