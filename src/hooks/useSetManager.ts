import { useState, useEffect } from 'react';
import { SavedSet, Card, CollectionItem, InventoryProfile, JSONSetData } from '../types';
import { buildRarityPools } from '../utils/packSimulator';
import { loadSetFromJSON } from '../utils/jsonSetLoader';

const STORAGE_KEY = 'pokemonPackSimulatorSets';

// Helper to save to localStorage
const saveToStorage = (sets: SavedSet[]) => {
  console.log(`💾 Saving ${sets.length} set(s) to localStorage`);
  // Strip out rarityPools and legacy fields before saving (they're rebuilt on load)
  const setsToSave = sets.map(({ rarityPools, collection, packsOpened, ...set }) => set);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(setsToSave));
};

// Helper to migrate old format to new profiles format
const migrateToProfiles = (set: any): SavedSet => {
  // If already has profiles, return as-is
  if (set.profiles && Array.isArray(set.profiles)) {
    return {
      ...set,
      rarityPools: buildRarityPools(set.cards)
    };
  }
  
  // Migrate old format: collection + packsOpened → Default profile
  const hasLegacyData = set.collection || set.packsOpened;
  const defaultProfile: InventoryProfile = {
    id: 'default',
    name: 'Default',
    collection: set.collection || [],
    packsOpened: set.packsOpened || 0
  };
  
  console.log(`🔄 Migrating set "${set.name}" to profiles format`);
  
  return {
    ...set,
    profiles: hasLegacyData ? [defaultProfile] : [],
    activeProfileId: hasLegacyData ? 'default' : null,
    rarityPools: buildRarityPools(set.cards),
    collection: undefined,
    packsOpened: undefined
  };
};

// Helper to load from localStorage
const loadFromStorage = (): SavedSet[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        console.log(`✅ Loaded ${parsed.length} set(s) from localStorage`);
        // Migrate and build rarity pools for each loaded set
        return parsed.map(set => migrateToProfiles(set));
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
  const activeProfile = activeSet && activeSet.activeProfileId
    ? activeSet.profiles.find(p => p.id === activeSet.activeProfileId) || null
    : null;

  const addSet = (setName: string, baseSetSize: number, cards: Card[]) => {
    const newSet: SavedSet = {
      id: Date.now().toString(),
      name: setName,
      baseSetSize: baseSetSize,
      cards: cards,
      rarityPools: buildRarityPools(cards),
      profiles: [],
      activeProfileId: null
    };
    
    const updatedSets = [...savedSets, newSet];
    setSavedSets(updatedSets);
    setActiveSetId(newSet.id);
    saveToStorage(updatedSets);
  };

  const addSetFromJSON = (jsonData: JSONSetData) => {
    const { name, code, baseSetSize, cards } = loadSetFromJSON(jsonData);
    
    const newSet: SavedSet = {
      id: Date.now().toString(),
      name: `${name} (${code})`,
      baseSetSize: baseSetSize,
      cards: cards,
      rarityPools: buildRarityPools(cards),
      profiles: [],
      activeProfileId: null
    };
    
    const updatedSets = [...savedSets, newSet];
    setSavedSets(updatedSets);
    setActiveSetId(newSet.id);
    saveToStorage(updatedSets);
    
    console.log(`✅ Added set: ${newSet.name}`);
  };

  const deleteSet = (id: string) => {
    const updated = savedSets.filter(s => s.id !== id);
    setSavedSets(updated);
    if (activeSetId === id) {
      setActiveSetId(updated.length > 0 ? updated[0].id : null);
    }
    saveToStorage(updated);
  };

  const createProfile = (setId: string, profileName: string) => {
    const updated = savedSets.map(set => {
      if (set.id !== setId) return set;
      
      const newProfile: InventoryProfile = {
        id: Date.now().toString(),
        name: profileName,
        collection: [],
        packsOpened: 0
      };
      
      console.log(`✨ Created profile "${profileName}" for set "${set.name}"`);
      
      return {
        ...set,
        profiles: [...set.profiles, newProfile],
        activeProfileId: newProfile.id
      };
    });
    
    setSavedSets(updated);
    saveToStorage(updated);
  };

  const setActiveProfile = (setId: string, profileId: string) => {
    const updated = savedSets.map(set => {
      if (set.id !== setId) return set;
      return { ...set, activeProfileId: profileId };
    });
    
    setSavedSets(updated);
    saveToStorage(updated);
  };

  const updateProfileCollection = (setId: string, profileId: string, pack: Card[]) => {
    const updated = savedSets.map(set => {
      if (set.id !== setId) return set;
      
      const updatedProfiles = set.profiles.map(profile => {
        if (profile.id !== profileId) return profile;
        
        const newCollection = [...profile.collection];
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
        
        console.log(`📦 Updated profile "${profile.name}": ${newCollection.length} unique cards, ${profile.packsOpened + 1} packs opened`);
        
        return {
          ...profile,
          collection: newCollection,
          packsOpened: profile.packsOpened + 1
        };
      });
      
      return { ...set, profiles: updatedProfiles };
    });
    
    setSavedSets(updated);
    saveToStorage(updated);
  };

  const resetProfile = (setId: string, profileId: string) => {
    const updated = savedSets.map(set => {
      if (set.id !== setId) return set;
      
      const updatedProfiles = set.profiles.map(profile => {
        if (profile.id !== profileId) return profile;
        
        console.log(`🔄 Reset profile "${profile.name}"`);
        
        return {
          ...profile,
          collection: [],
          packsOpened: 0
        };
      });
      
      return { ...set, profiles: updatedProfiles };
    });
    
    setSavedSets(updated);
    saveToStorage(updated);
  };

  const deleteProfile = (setId: string, profileId: string) => {
    const updated = savedSets.map(set => {
      if (set.id !== setId) return set;
      
      const updatedProfiles = set.profiles.filter(p => p.id !== profileId);
      const newActiveProfileId = set.activeProfileId === profileId
        ? (updatedProfiles.length > 0 ? updatedProfiles[0].id : null)
        : set.activeProfileId;
      
      console.log(`🗑️ Deleted profile from set "${set.name}"`);
      
      return {
        ...set,
        profiles: updatedProfiles,
        activeProfileId: newActiveProfileId
      };
    });
    
    setSavedSets(updated);
    saveToStorage(updated);
  };

  return {
    savedSets,
    activeSet,
    activeSetId,
    activeProfile,
    setActiveSetId,
    addSet,
    addSetFromJSON,
    deleteSet,
    createProfile,
    setActiveProfile,
    updateProfileCollection,
    resetProfile,
    deleteProfile,
  };
}
