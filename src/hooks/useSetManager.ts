import { useState } from 'react';
import { ActiveSet, Card, CollectionItem, InventoryProfile, ProfileStorage } from '../types';
import { buildRarityPools } from '../utils/packSimulator';
import { fetchBuiltInSet, loadSetFromJSON } from '../utils/jsonSetLoader';

const ACTIVE_SET_KEY = 'pokemonPackSimulator_activeSet';
const PROFILES_KEY = 'pokemonPackSimulator_profiles';

// Save/load active set filename
const saveActiveSetFilename = (filename: string) => {
  localStorage.setItem(ACTIVE_SET_KEY, filename);
};

const loadActiveSetFilename = (): string | null => {
  return localStorage.getItem(ACTIVE_SET_KEY);
};

// Save/load profiles
const saveProfiles = (profiles: ProfileStorage) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

const loadProfiles = (): ProfileStorage => {
  try {
    const stored = localStorage.getItem(PROFILES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('❌ Failed to load profiles:', e);
  }
  return {};
};

export function useSetManager() {
  const [activeSet, setActiveSet] = useState<ActiveSet | null>(null);
  const [profiles, setProfiles] = useState<ProfileStorage>(() => loadProfiles());
  const [isLoading, setIsLoading] = useState(false);

  // Get profiles for current set
  const currentSetProfiles = activeSet ? profiles[activeSet.filename] || [] : [];
  
  // Get active profile
  const activeProfile = activeSet && activeSet.activeProfileId
    ? currentSetProfiles.find(p => p.id === activeSet.activeProfileId) || null
    : null;

  // Load a set by filename
  const loadSet = async (filename: string) => {
    setIsLoading(true);
    try {
      console.log(`📦 Loading set: ${filename}`);
      const jsonData = await fetchBuiltInSet(filename);
      const { name, code, baseSetSize, cards } = loadSetFromJSON(jsonData);
      
      const newActiveSet: ActiveSet = {
        filename,
        name: `${name} (${code})`,
        code,
        baseSetSize,
        cards,
        rarityPools: buildRarityPools(cards),
        activeProfileId: null
      };
      
      // If this set has profiles, set the first one as active
      const setProfiles = profiles[filename] || [];
      if (setProfiles.length > 0) {
        newActiveSet.activeProfileId = setProfiles[0].id;
      }
      
      setActiveSet(newActiveSet);
      saveActiveSetFilename(filename);
      console.log(`✅ Set loaded: ${newActiveSet.name}`);
    } catch (error) {
      console.error('❌ Failed to load set:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new profile for the current set
  const createProfile = (profileName: string) => {
    if (!activeSet) return;
    
    const newProfile: InventoryProfile = {
      id: Date.now().toString(),
      name: profileName,
      collection: [],
      packsOpened: 0,
      packsBySet: {}
    };
    
    const updatedProfiles = {
      ...profiles,
      [activeSet.filename]: [...currentSetProfiles, newProfile]
    };
    
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    
    // Set as active profile
    setActiveSet({
      ...activeSet,
      activeProfileId: newProfile.id
    });
    
    console.log(`✨ Created profile "${profileName}" for ${activeSet.name}`);
  };

  // Set active profile
  const setActiveProfile = (profileId: string) => {
    if (!activeSet) return;
    
    setActiveSet({
      ...activeSet,
      activeProfileId: profileId
    });
  };

  // Update profile collection (after opening a pack)
  const updateProfileCollection = (pack: Card[]) => {
    if (!activeSet || !activeProfile) return;
    
    const updatedProfile = { ...activeProfile };
    const newCollection = [...updatedProfile.collection];
    
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
    
    updatedProfile.collection = newCollection;
    updatedProfile.packsOpened += 1;
    const packsBySet = { ...(updatedProfile.packsBySet || {}) };
    packsBySet[activeSet.filename] = (packsBySet[activeSet.filename] || 0) + 1;
    updatedProfile.packsBySet = packsBySet;
    
    // Update profiles storage
    const updatedProfiles = {
      ...profiles,
      [activeSet.filename]: currentSetProfiles.map(p => 
        p.id === activeProfile.id ? updatedProfile : p
      )
    };
    
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    
    console.log(`📦 Updated profile "${activeProfile.name}": ${newCollection.length} unique cards, ${updatedProfile.packsOpened} packs opened`);
  };

  // Reset a profile
  const resetProfile = (profileId: string) => {
    if (!activeSet) return;
    
    const updatedProfiles = {
      ...profiles,
      [activeSet.filename]: currentSetProfiles.map(p =>
        p.id === profileId
          ? { ...p, collection: [], packsOpened: 0, packsBySet: {} }
          : p
      )
    };
    
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    
    console.log(`🔄 Reset profile`);
  };

  // Delete a profile
  const deleteProfile = (profileId: string) => {
    if (!activeSet) return;
    
    const updatedSetProfiles = currentSetProfiles.filter(p => p.id !== profileId);
    const updatedProfiles = {
      ...profiles,
      [activeSet.filename]: updatedSetProfiles
    };
    
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    
    // If deleted profile was active, select another or set to null
    if (activeSet.activeProfileId === profileId) {
      setActiveSet({
        ...activeSet,
        activeProfileId: updatedSetProfiles.length > 0 ? updatedSetProfiles[0].id : null
      });
    }
    
    console.log(`🗑️ Deleted profile`);
  };

  return {
    activeSet,
    activeProfile,
    profiles: currentSetProfiles,
    isLoading,
    loadSet,
    createProfile,
    setActiveProfile,
    updateProfileCollection,
    resetProfile,
    deleteProfile
  };
}
