import React, { useState, useEffect } from 'react';
import { Card, JSONSetData } from './types';
import { simulatePack, calculatePackScore, DEFAULT_PACK_CONFIG } from './utils/packSimulator';
import { useSetManager } from './hooks/useSetManager';
import { fetchBuiltInSet } from './utils/jsonSetLoader';
import SetSelector from './components/SetSelector';
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
  const [isLoadingSet, setIsLoadingSet] = useState(false);
  const [setLoadError, setSetLoadError] = useState<string | null>(null);

  // Auto-load Evolving Skies on first visit if no sets exist
  useEffect(() => {
    const autoLoadEvolvingSkies = async () => {
      if (setManager.savedSets.length === 0) {
        console.log('📦 No sets found - auto-loading Evolving Skies...');
        setIsLoadingSet(true);
        try {
          const jsonData = await fetchBuiltInSet('evolving-skies.json');
          setManager.addSetFromJSON(jsonData);
          console.log('✅ Evolving Skies loaded successfully!');
        } catch (error) {
          console.error('❌ Failed to auto-load Evolving Skies:', error);
          setSetLoadError('Failed to load default set. Please load a set manually.');
        } finally {
          setIsLoadingSet(false);
        }
      }
    };
    
    autoLoadEvolvingSkies();
  }, []); // Only run once on mount

  // Debug logging
  useEffect(() => {
    console.log('🎮 Pokémon Pack Simulator loaded!');
    console.log('📊 Stats:', {
      savedSets: setManager.savedSets.length,
      activeSet: setManager.activeSet?.name || 'none',
      currentPack: currentPack.length
    });
  }, [setManager.savedSets.length, setManager.activeSet, currentPack.length]);

  const handleClearAllData = () => {
    if (confirm('⚠️ This will delete all saved sets and collections. Are you sure?')) {
      localStorage.removeItem('pokemonPackSimulatorSets');
      window.location.reload();
    }
  };

  const handleOpenPack = () => {
    if (!setManager.activeSet || !setManager.activeSet.rarityPools || setManager.activeSet.cards.length === 0) return;
    
    // Check if saving to inventory but no active profile exists
    if (saveToInventory && setManager.activeSetId) {
      if (!setManager.activeProfile) {
        // No profile exists - prompt user to create one
        const profileName = prompt('Create a new inventory profile (e.g., "My Collection"):');
        if (!profileName || profileName.trim() === '') {
          alert('Profile creation cancelled. Uncheck "Save to Collection Inventory" to open packs without saving.');
          return;
        }
        setManager.createProfile(setManager.activeSetId, profileName.trim());
      }
    }
    
    const config = setManager.activeSet.packConfig || DEFAULT_PACK_CONFIG;
    const pack = simulatePack(setManager.activeSet.rarityPools, config);
    setCurrentPack(pack);
    
    if (saveToInventory && setManager.activeSetId && setManager.activeProfile) {
      setManager.updateProfileCollection(setManager.activeSetId, setManager.activeProfile.id, pack);
    }
  };

  const handleLoadSet = async (jsonData: JSONSetData) => {
    setIsLoadingSet(true);
    setSetLoadError(null);
    
    try {
      setManager.addSetFromJSON(jsonData);
      setCurrentPack([]);
      console.log('✅ Set loaded successfully!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load set';
      setSetLoadError(errorMsg);
      console.error('❌ Failed to load set:', error);
    } finally {
      setIsLoadingSet(false);
    }
  };

  const handleSetChange = (setId: string) => {
    setManager.setActiveSetId(setId);
    setCurrentPack([]);
  };

  const handleCreateProfile = () => {
    if (!setManager.activeSetId) return;
    
    const profileName = prompt('Enter a name for the new profile:');
    if (!profileName || profileName.trim() === '') return;
    
    setManager.createProfile(setManager.activeSetId, profileName.trim());
  };

  const handleSelectProfile = (profileId: string) => {
    if (!setManager.activeSetId) return;
    setManager.setActiveProfile(setManager.activeSetId, profileId);
  };

  const handleResetProfile = () => {
    if (!setManager.activeSetId || !setManager.activeProfile) return;
    
    if (confirm(`⚠️ Reset "${setManager.activeProfile.name}"? This will delete all cards and reset the pack counter.`)) {
      setManager.resetProfile(setManager.activeSetId, setManager.activeProfile.id);
    }
  };

  const handleDeleteProfile = () => {
    if (!setManager.activeSetId || !setManager.activeProfile) return;
    
    if (confirm(`⚠️ Permanently delete "${setManager.activeProfile.name}"?`)) {
      setManager.deleteProfile(setManager.activeSetId, setManager.activeProfile.id);
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
          <p className="text-slate-500">Load a set to start opening packs and building your collection.</p>
          {/* Debug Info */}
          <div className="text-xs text-slate-400 mt-2">
            {setManager.savedSets.length > 0 ? (
              <span>{setManager.savedSets.length} set(s) loaded</span>
            ) : (
              <span>Loading Evolving Skies...</span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar / Controls */}
          <div className="space-y-6">
            <SetSelector
              savedSets={setManager.savedSets}
              activeSetId={setManager.activeSetId}
              onSetChange={handleSetChange}
              onDeleteSet={setManager.deleteSet}
            />

            <SetLoader
              onLoadSet={handleLoadSet}
              isLoading={isLoadingSet}
              error={setLoadError}
              onClearError={() => setSetLoadError(null)}
            />

            <PackOpener
              activeSet={setManager.activeSet}
              activeProfile={setManager.activeProfile}
              onOpenPack={handleOpenPack}
              saveToInventory={saveToInventory}
              onToggleSaveInventory={setSaveToInventory}
            />

            <ProfileManager
              activeSet={setManager.activeSet}
              activeProfile={setManager.activeProfile}
              onCreateProfile={handleCreateProfile}
              onSelectProfile={handleSelectProfile}
              onResetProfile={handleResetProfile}
              onDeleteProfile={handleDeleteProfile}
            />

            {/* Clear Data Button */}
            {setManager.savedSets.length > 0 && (
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
            )}
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
