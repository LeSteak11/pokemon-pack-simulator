import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Card, Rarity } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageItems = textContent.items.map((item: any) => item.str);
    lines.push(...pageItems);
  }

  return lines;
}

export function parseCards(lines: string[], baseSetSize: number): Card[] {
  const cards: Card[] = [];
  const usedLines = new Set<number>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^\d{3}$/.test(line)) {
      const numStr = line;
      
      let name = '';
      // Look backwards for the name
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();
        if (prevLine === '') continue;
        if (/^\d{3}$/.test(prevLine)) break; // Hit another number, stop
        if (usedLines.has(j)) break; // Already used by another card
        
        name = prevLine;
        usedLines.add(j);
        break;
      }
      
      if (name) {
        cards.push({ number: numStr, name, rarity: 'Common', finish: 'Standard' });
      }
    }
  }
  
  // Remove duplicates by number
  const uniqueCardsMap = new Map<string, Card>();
  cards.forEach(c => uniqueCardsMap.set(c.number, c));
  const uniqueCards = Array.from(uniqueCardsMap.values());
  
  // Sort cards by number
  uniqueCards.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
  
  return uniqueCards.map((card) => {
    const num = parseInt(card.number, 10);
    const nameUpper = card.name.toUpperCase();
    
    if (num > baseSetSize) {
      return { ...card, rarity: 'Secret Rare' };
    }
    
    if (nameUpper.includes(' VMAX') || nameUpper.includes(' VSTAR') || nameUpper.endsWith(' EX') || nameUpper.endsWith(' GX') || nameUpper.includes(' EX ') || nameUpper.includes(' GX ')) {
      return { ...card, rarity: 'VMAX' };
    }
    
    if (nameUpper.endsWith(' V') || nameUpper.includes(' V ')) {
      return { ...card, rarity: 'V' };
    }
    
    // Base cards
    const hash = num % 10;
    let rarity: Rarity = 'Common';
    if (hash < 5) rarity = 'Common';
    else if (hash < 8) rarity = 'Uncommon';
    else rarity = 'Rare';
    
    return { ...card, rarity };
  });
}
