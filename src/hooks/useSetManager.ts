import { useState, useEffect } from 'react';
import { SavedSet, Card, CollectionItem } from '../types';

const STORAGE_KEY = 'pokemonPackSimulatorSets';

// Helper to save to localStorage
const saveToStorage = (sets: SavedSet[]) => {
  console.log(`💾 Saving ${sets.length} set(s) to localStorage`);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
};

// Helper to load from localStorage
const loadFromStorage = (): SavedSet[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        console.log(`✅ Loaded ${parsed.length} set(s) from localStorage`);
        return parsed;
      }
    }
  } catch (e) {
    console.error("❌ Failed to load from localStorage:", e);
  }
  console.log('📦 No saved sets found - starting fresh');
  return [];
};

export function useSetManager() {
  // Initialize with lazy initialization to load from storage immediately
  const [savedSets, setSavedSets] = useState<SavedSet[]>(() => loadFromStorage());
  const [activeSetId, setActiveSetId] = useState<string | null>(() => {
    const loaded = loadFromStorage();
    return loaded.length > 0 ? loaded[0].id : null;
  });

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
    
    const updatedSets = [...savedSets, newSet];
    setSavedSets(updatedSets);
    setActiveSetId(newSet.id);
    saveToStorage(updatedSets);
  };

  const deleteSet = (id: string) => {
    const updated = savedSets.filter(s => s.id !== id);
    setSavedSets(updated);
    if (activeSetId === id) {
      setActiveSetId(updated.length > 0 ? updated[0].id : null);
    }
    saveToStorage(updated);
  };

  const updateSetCollection = (setId: string, pack: Card[]) => {
    const updated = savedSets.map(set => {
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
    });
    
    setSavedSets(updated);
    saveToStorage(updated);
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
