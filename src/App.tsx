import React, { useState } from 'react';
import { Card } from './types';
import { simulatePack, calculatePackScore } from './utils/packSimulator';
import { useSetManager } from './hooks/useSetManager';
import { usePDFUpload } from './hooks/usePDFUpload';
import PreviewModal from './components/PreviewModal';
import SetSelector from './components/SetSelector';
import SetUploader from './components/SetUploader';
import PackOpener from './components/PackOpener';
import PackResults from './components/PackResults';
import CollectionTable from './components/CollectionTable';
import SetSearchModal from './components/SetSearchModal';
import { Database } from 'lucide-react';

export default function App() {
  const setManager = useSetManager();
  const pdfUpload = usePDFUpload();
  
  const [currentPack, setCurrentPack] = useState<Card[]>([]);
  const [saveToInventory, setSaveToInventory] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleOpenPack = () => {
    if (!setManager.activeSet || setManager.activeSet.cards.length === 0) return;
    
    const pack = simulatePack(setManager.activeSet.cards);
    setCurrentPack(pack);
    
    if (saveToInventory && setManager.activeSetId) {
      setManager.updateSetCollection(setManager.activeSetId, pack);
    }
  };

  const handleConfirmPreview = () => {
    setManager.addSet(
      pdfUpload.previewState.setName,
      pdfUpload.previewState.baseSize,
      pdfUpload.previewState.cards,
      pdfUpload.previewState.apiSetId || undefined
    );
    setCurrentPack([]);
    pdfUpload.confirmPreview();
  };

  const handleSelectSetFromSearch = (setName: string, apiSetId: string, cards: Card[]) => {
    setManager.addSet(setName, cards.length, cards, apiSetId);
    setCurrentPack([]);
    setShowSearchModal(false);
  };

  const handleSetChange = (setId: string) => {
    setManager.setActiveSetId(setId);
    setCurrentPack([]);
  };

  const currentScore = currentPack.length > 0 ? calculatePackScore(currentPack) : 0;
  const collectionStats = setManager.activeSet ? {
    unique: setManager.activeSet.collection.length,
    total: setManager.activeSet.collection.reduce((acc, c) => acc + c.count, 0)
  } : { unique: 0, total: 0 };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-indigo-900">Pokémon Pack Simulator</h1>
          <p className="text-slate-500">Upload a set checklist PDF or search for an official set from the Pokémon TCG API.</p>
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

            <SetUploader
              onUpload={pdfUpload.uploadPDF}
              isLoading={pdfUpload.isLoading}
              error={pdfUpload.error}
              onClearError={() => pdfUpload.setError(null)}
            />

            {/* API Set Search Button */}
            <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
              <h2 className="text-lg font-semibold mb-3">Or Search API</h2>
              <button
                onClick={() => setShowSearchModal(true)}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center justify-center gap-2"
              >
                <Database size={20} />
                Search Sets
              </button>
            </div>

            <PackOpener
              activeSet={setManager.activeSet}
              onOpenPack={handleOpenPack}
              saveToInventory={saveToInventory}
              onToggleSaveInventory={setSaveToInventory}
            />
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            <PackResults
              pack={currentPack}
              score={currentScore}
              activeSet={!!setManager.activeSet}
            />

            <CollectionTable
              collection={setManager.activeSet?.collection}
              uniqueCount={collectionStats.unique}
              totalCount={collectionStats.total}
            />
          </div>
        </div>

        <PreviewModal
          isOpen={pdfUpload.previewState.isOpen}
          cards={pdfUpload.previewState.cards}
          setName={pdfUpload.previewState.setName}
          baseSize={pdfUpload.previewState.baseSize}
          onConfirm={handleConfirmPreview}
          onCancel={pdfUpload.cancelPreview}
          onUpdateCard={pdfUpload.updatePreviewCard}
          onDeleteCard={pdfUpload.deletePreviewCard}
        />

        <SetSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelectSet={handleSelectSetFromSearch}
        />
      </div>
    </div>
  );
}
