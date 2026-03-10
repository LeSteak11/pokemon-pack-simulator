import { useState, useEffect } from 'react';
import { SavedSet, Card, CollectionItem } from '../types';

export function useSetManager() {
  const [savedSets, setSavedSets] = useState<SavedSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pokemonPackSimulatorSets');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log(`✅ Loaded ${parsed.length} set(s) from localStorage`);
          setSavedSets(parsed);
          if (parsed.length > 0) {
            setActiveSetId(parsed[0].id);
          }
        }
      } catch (e) {
        console.error("❌ Failed to load sets from localStorage. Clearing corrupted data...", e);
        localStorage.removeItem('pokemonPackSimulatorSets');
      }
    } else {
      console.log('📦 No saved sets found - starting fresh');
    }
  }, []);

  // Save to LocalStorage whenever savedSets changes
  useEffect(() => {
    localStorage.setItem('pokemonPackSimulatorSets', JSON.stringify(savedSets));
  }, [savedSets]);

  const activeSet = savedSets.find(s => s.id === activeSetId) || null;

  const addSet = (setName: string, baseSetSize: number, cards: Card[]) => {
    const newSet: SavedSet = {
      id: Date.now().toString(),
      name: setName,
      baseSetSize: baseSetSize,
      cards: cards,
      collection: [],
      packsOpened: 0
    };
    
    setSavedSets(prev => [...prev, newSet]);
    setActiveSetId(newSet.id);
  };

  const deleteSet = (id: string) => {
    setSavedSets(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (activeSetId === id) {
        setActiveSetId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const updateSetCollection = (setId: string, pack: Card[]) => {
    setSavedSets(prev => prev.map(set => {
      if (set.id !== setId) return set;
      
      const newCollection = [...set.collection];
      pack.forEach(card => {
        const existing = newCollection.find(c => c.number === card.number && c.finish === card.finish);
        if (existing) {
          existing.count += 1;
        } else {
          newCollection.push({ ...card, count: 1 });
        }
      });
      // Sort collection by number
      newCollection.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
      
      return {
        ...set,
        collection: newCollection,
        packsOpened: set.packsOpened + 1
      };
    }));
  };

  return {
    savedSets,
    activeSet,
    activeSetId,
    setActiveSetId,
    addSet,
    deleteSet,
    updateSetCollection,
  };
}
