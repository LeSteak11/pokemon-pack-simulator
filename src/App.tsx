import React, { useState, useEffect } from 'react';
import { Card } from './types';
import { simulatePack, calculatePackScore, DEFAULT_PACK_CONFIG } from './utils/packSimulator';
import { useSetManager } from './hooks/useSetManager';
import { getAvailableBuiltInSets } from './utils/jsonSetLoader';
import SetLoader from './components/SetLoader';
import PackOpener from './components/PackOpener';
import PackResults from './components/PackResults';
import CollectionTable from './components/CollectionTable';
import ProfileManager from './components/ProfileManager';
import { Trash } from 'lucide-react';

export default function App() {
  const setManager = useSetManager();
  
  const [currentPack, setCurrentPack] = useState<Card[]>([]);
  const [saveToInventory, setSaveToInventory] = useState(true);

  // Auto-load first available set on mount if no active set
  useEffect(() => {
    const autoLoadFirstSet = async () => {
      if (!setManager.activeSet && !setManager.isLoading) {
        const availableSets = await getAvailableBuiltInSets();
        if (availableSets.length > 0) {
          console.log('📦 No active set - auto-loading first available set...');
          try {
            await setManager.loadSet(availableSets[0].filename);
            console.log('✅ Set loaded successfully!');
          } catch (error) {
            console.error('❌ Failed to auto-load set:', error);
          }
        }
      }
    };
    
    autoLoadFirstSet();
  }, []); // Only run once on mount

  // Debug logging
  useEffect(() => {
    console.log('🎮 Pokémon Pack Simulator loaded!');
    console.log('📊 Stats:', {
      activeSet: setManager.activeSet?.name || 'none',
      currentPack: currentPack.length
    });
  }, [setManager.activeSet, currentPack.length]);

  const handleClearAllData = () => {
    if (confirm('⚠️ This will delete all profiles and reload the app. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleOpenPack = () => {
    if (!setManager.activeSet || !setManager.activeSet.rarityPools || setManager.activeSet.cards.length === 0) return;
    
    // Check if saving to inventory but no active profile exists
    if (saveToInventory) {
      if (!setManager.activeProfile) {
        // No profile exists - prompt user to create one
        const profileName = prompt('Create a new inventory profile (e.g., "My Collection"):');
        if (!profileName || profileName.trim() === '') {
          alert('Profile creation cancelled. Uncheck "Save to Collection Inventory" to open packs without saving.');
          return;
        }
        setManager.createProfile(profileName.trim());
      }
    }
    
    const config = setManager.activeSet.packConfig || DEFAULT_PACK_CONFIG;
    const pack = simulatePack(setManager.activeSet.rarityPools, config);
    setCurrentPack(pack);
    
    if (saveToInventory && setManager.activeProfile) {
      setManager.updateProfileCollection(pack);
    }
  };

  const handleSetChange = async (filename: string) => {
    try {
      await setManager.loadSet(filename);
      setCurrentPack([]);
    } catch (error) {
      console.error('Failed to load set:', error);
    }
  };

  const handleCreateProfile = () => {
    const profileName = prompt('Enter a name for the new profile:');
    if (!profileName || profileName.trim() === '') return;
    
    setManager.createProfile(profileName.trim());
  };

  const handleSelectProfile = (profileId: string) => {
    setManager.setActiveProfile(profileId);
  };

  const handleResetProfile = () => {
    if (!setManager.activeProfile) return;
    
    if (confirm(`⚠️ Reset "${setManager.activeProfile.name}"? This will delete all cards and reset the pack counter.`)) {
      setManager.resetProfile(setManager.activeProfile.id);
    }
  };

  const handleDeleteProfile = () => {
    if (!setManager.activeProfile) return;
    
    if (confirm(`⚠️ Permanently delete "${setManager.activeProfile.name}"?`)) {
      setManager.deleteProfile(setManager.activeProfile.id);
    }
  };

  const currentScore = currentPack.length > 0 ? calculatePackScore(currentPack) : 0;
  const collectionStats = setManager.activeProfile ? {
    unique: setManager.activeProfile.collection.length,
    total: setManager.activeProfile.collection.reduce((acc, c) => acc + c.count, 0)
  } : { unique: 0, total: 0 };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-indigo-900">Pokémon Pack Simulator</h1>
          <p className="text-slate-500">
            {setManager.activeSet 
              ? `Opening packs from ${setManager.activeSet.name}`
              : 'Select a set to start opening packs'
            }
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar / Controls */}
          <div className="space-y-6">
            <SetLoader
              currentSet={setManager.activeSet?.filename || null}
              onSelectSet={handleSetChange}
              isLoading={setManager.isLoading}
            />

            <PackOpener
              activeSet={setManager.activeSet}
              activeProfile={setManager.activeProfile}
              onOpenPack={handleOpenPack}
              saveToInventory={saveToInventory}
              onToggleSaveInventory={setSaveToInventory}
            />

            <ProfileManager
              profiles={setManager.profiles}
              activeProfile={setManager.activeProfile}
              onCreateProfile={handleCreateProfile}
              onSelectProfile={handleSelectProfile}
              onResetProfile={handleResetProfile}
              onDeleteProfile={handleDeleteProfile}
            />

            {/* Clear Data Button */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <button
                onClick={handleClearAllData}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 text-sm"
              >
                <Trash size={16} />
                Clear All Data
              </button>
              <p className="text-xs text-red-600 mt-2 text-center">
                Use if experiencing issues
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            <PackResults
              pack={currentPack}
              score={currentScore}
              activeSet={!!setManager.activeSet}
            />

            <CollectionTable
              collection={setManager.activeProfile?.collection}
              uniqueCount={collectionStats.unique}
              totalCount={collectionStats.total}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
