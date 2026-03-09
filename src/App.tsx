import React, { useState, useRef, useEffect } from 'react';
import { Card, CollectionItem, SavedSet } from './types';
import { extractTextFromPDF, parseCards } from './utils/pdfParser';
import { simulatePack, calculatePackScore } from './utils/packSimulator';
import { Upload, PackageOpen, List, AlertCircle, Trash2, ChevronDown, X, Check, Edit2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [savedSets, setSavedSets] = useState<SavedSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentPack, setCurrentPack] = useState<Card[]>([]);
  const [saveToInventory, setSaveToInventory] = useState(true);
  
  const [newSetName, setNewSetName] = useState('');
  const [newSetBaseSize, setNewSetBaseSize] = useState<number>(203);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewCards, setPreviewCards] = useState<Card[]>([]);
  const [previewSetName, setPreviewSetName] = useState('');
  const [previewBaseSize, setPreviewBaseSize] = useState(203);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pokemonPackSimulatorSets');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedSets(parsed);
          if (parsed.length > 0) {
            setActiveSetId(parsed[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load sets from local storage", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever savedSets changes
  useEffect(() => {
    localStorage.setItem('pokemonPackSimulatorSets', JSON.stringify(savedSets));
  }, [savedSets]);

  const activeSet = savedSets.find(s => s.id === activeSetId) || null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!newSetName.trim()) {
      setError("Please enter a Set Name before uploading.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const lines = await extractTextFromPDF(file);
      const parsedCards = parseCards(lines, newSetBaseSize);
      
      if (parsedCards.length === 0) {
        setError("Could not find any cards in the PDF. Please ensure it's a valid checklist.");
      } else {
        // Show preview modal instead of directly creating set
        setPreviewCards(parsedCards);
        setPreviewSetName(newSetName.trim());
        setPreviewBaseSize(newSetBaseSize);
        setShowPreview(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse PDF. Please try again.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmPreview = () => {
    const newSet: SavedSet = {
      id: Date.now().toString(),
      name: previewSetName,
      baseSetSize: previewBaseSize,
      cards: previewCards,
      collection: [],
      packsOpened: 0
    };
    
    setSavedSets(prev => [...prev, newSet]);
    setActiveSetId(newSet.id);
    setCurrentPack([]);
    setNewSetName(''); // Reset input
    setShowPreview(false);
    setPreviewCards([]);
    setEditingCardIndex(null);
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewCards([]);
    setEditingCardIndex(null);
  };

  const updatePreviewCard = (index: number, updates: Partial<Card>) => {
    setPreviewCards(prev => prev.map((card, i) => 
      i === index ? { ...card, ...updates } : card
    ));
  };

  const deletePreviewCard = (index: number) => {
    setPreviewCards(prev => prev.filter((_, i) => i !== index));
  };

  const validatePreviewCards = () => {
    const warnings: string[] = [];
    
    // Check for duplicate numbers
    const numbers = previewCards.map(c => c.number);
    const duplicates = numbers.filter((num, idx) => numbers.indexOf(num) !== idx);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate card numbers found: ${[...new Set(duplicates)].join(', ')}`);
    }
    
    // Check for suspiciously short names
    const shortNames = previewCards.filter(c => c.name.length < 2);
    if (shortNames.length > 0) {
      warnings.push(`${shortNames.length} card(s) have suspiciously short names`);
    }
    
    // Check if card count seems reasonable
    if (previewCards.length < 50) {
      warnings.push(`Only ${previewCards.length} cards found - this seems low for a Pokémon set`);
    }
    
    // Check rarity distribution
    const rarityCount = {
      'Common': previewCards.filter(c => c.rarity === 'Common').length,
      'Uncommon': previewCards.filter(c => c.rarity === 'Uncommon').length,
      'Rare': previewCards.filter(c => c.rarity === 'Rare').length,
      'V': previewCards.filter(c => c.rarity === 'V').length,
      'VMAX': previewCards.filter(c => c.rarity === 'VMAX').length,
      'Secret Rare': previewCards.filter(c => c.rarity === 'Secret Rare').length,
    };
    
    if (rarityCount['Common'] === 0 && rarityCount['Uncommon'] === 0) {
      warnings.push('No common or uncommon cards found - rarity detection may have failed');
    }
    
    return warnings;
  };

  const handleOpenPack = () => {
    if (!activeSet || activeSet.cards.length === 0) return;
    
    const pack = simulatePack(activeSet.cards);
    setCurrentPack(pack);
    
    if (saveToInventory) {
      setSavedSets(prev => prev.map(set => {
        if (set.id !== activeSetId) return set;
        
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
    }
  };

  const handleDeleteSet = (id: string) => {
    setSavedSets(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (activeSetId === id) {
        setActiveSetId(updated.length > 0 ? updated[0].id : null);
        setCurrentPack([]);
      }
      return updated;
    });
  };

  const currentScore = currentPack.length > 0 ? calculatePackScore(currentPack) : 0;

  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-red-700 bg-red-50 border-red-200';
    if (score <= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (score <= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    return 'text-purple-700 bg-purple-50 border-purple-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-indigo-900">Pokémon Pack Simulator</h1>
          <p className="text-slate-500">Upload a set checklist PDF to start opening packs and building your collection.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar / Controls */}
          <div className="space-y-6">
            
            {/* Set Selector */}
            {savedSets.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-500" />
                  Active Set
                </h2>
                <div className="relative">
                  <select 
                    value={activeSetId || ''}
                    onChange={(e) => {
                      setActiveSetId(e.target.value);
                      setCurrentPack([]);
                    }}
                    className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10"
                  >
                    {savedSets.map(set => (
                      <option key={set.id} value={set.id}>
                        {set.name} ({set.cards.length} cards)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                
                {activeSet && (
                  <button 
                    onClick={() => handleDeleteSet(activeSet.id)}
                    className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete this Set
                  </button>
                )}
              </div>
            )}

            {/* Upload New Set */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Load New Checklist
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Set Name</label>
                  <input 
                    type="text" 
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Evolving Skies"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Base Set Size</label>
                  <input 
                    type="number" 
                    value={newSetBaseSize}
                    onChange={(e) => setNewSetBaseSize(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. 203"
                  />
                  <p className="text-xs text-slate-500">Used to determine Secret Rares (cards numbered above this).</p>
                </div>
              </div>

              <div>
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Parsing PDF...' : 'Upload PDF Checklist'}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Open Packs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PackageOpen className="w-5 h-5 text-indigo-500" />
                  Open Packs
                </h2>
                {activeSet && (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                    {activeSet.packsOpened} Opened
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="saveToInventory"
                  checked={saveToInventory}
                  onChange={(e) => setSaveToInventory(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="saveToInventory" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                  Save to Collection Inventory
                </label>
              </div>

              <button 
                onClick={handleOpenPack}
                disabled={!activeSet || activeSet.cards.length === 0}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
              >
                Open Pack
              </button>
              <p className="text-xs text-center text-slate-500">
                {!activeSet ? 'Load a checklist first.' : 'Simulates realistic pull rates.'}
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Current Pack */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[200px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <PackageOpen className="w-6 h-6 text-indigo-500" />
                  Pack Results
                </h2>
                
                {currentPack.length > 0 && (
                  <div className={`px-4 py-1.5 rounded-full border font-bold text-sm flex items-center gap-2 ${getScoreColor(currentScore)}`}>
                    <span>Pack Score:</span>
                    <span className="text-lg">{currentScore} / 100</span>
                  </div>
                )}
              </div>
              
              {currentPack.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  {activeSet ? 'Open a pack to see cards here.' : 'Upload a set to begin.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentPack.map((card, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl border flex items-center justify-between
                        ${card.rarity === 'Secret Rare' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                          card.rarity === 'VMAX' ? 'bg-purple-50 border-purple-200 text-purple-900' :
                          card.rarity === 'V' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                          card.rarity === 'Rare' ? 'bg-slate-100 border-slate-300 font-medium' :
                          'bg-white border-slate-200'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono opacity-60">#{card.number}</span>
                        <span className="font-semibold">{card.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                          {card.rarity}
                        </div>
                        <div className="text-[10px] font-medium uppercase opacity-50">
                          {card.finish}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <List className="w-6 h-6 text-indigo-500" />
                  Collection Inventory
                </h2>
                {activeSet && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {activeSet.collection.length} Unique / {activeSet.collection.reduce((acc, c) => acc + c.count, 0)} Total
                  </span>
                )}
              </div>

              {!activeSet || activeSet.collection.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  Your collection is empty.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-slate-500 text-sm">
                        <th className="pb-3 font-medium pl-2">Number</th>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Rarity</th>
                        <th className="pb-3 font-medium">Finish</th>
                        <th className="pb-3 font-medium text-right pr-2">Copies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSet.collection.map((card) => (
                        <tr key={`${card.number}-${card.finish}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pl-2 text-sm font-mono text-slate-500">#{card.number}</td>
                          <td className="py-3 font-medium">{card.name}</td>
                          <td className="py-3 text-sm text-slate-500">{card.rarity}</td>
                          <td className="py-3 text-sm text-slate-500">{card.finish}</td>
                          <td className="py-3 pr-2 text-right font-semibold text-indigo-600">{card.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Preview Parsed Cards</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Review the {previewCards.length} cards parsed from "{previewSetName}"
                  </p>
                </div>
                <button
                  onClick={handleCancelPreview}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Validation Warnings */}
              {(() => {
                const warnings = validatePreviewCards();
                return warnings.length > 0 && (
                  <div className="p-4 bg-amber-50 border-b border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 mb-1">Validation Warnings</h3>
                        <ul className="text-sm text-amber-800 space-y-1">
                          {warnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Card List */}
              <div className="flex-1 overflow-auto p-6">
                <div className="space-y-2">
                  {previewCards.map((card, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {editingCardIndex === index ? (
                        // Edit Mode
                        <>
                          <input
                            type="text"
                            value={card.number}
                            onChange={(e) => updatePreviewCard(index, { number: e.target.value })}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm font-mono"
                            placeholder="###"
                          />
                          <input
                            type="text"
                            value={card.name}
                            onChange={(e) => updatePreviewCard(index, { name: e.target.value })}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-medium"
                            placeholder="Card Name"
                          />
                          <select
                            value={card.rarity}
                            onChange={(e) => updatePreviewCard(index, { rarity: e.target.value as any })}
                            className="px-2 py-1 border border-slate-300 rounded text-sm"
                          >
                            <option value="Common">Common</option>
                            <option value="Uncommon">Uncommon</option>
                            <option value="Rare">Rare</option>
                            <option value="V">V</option>
                            <option value="VMAX">VMAX</option>
                            <option value="Secret Rare">Secret Rare</option>
                          </select>
                          <button
                            onClick={() => setEditingCardIndex(null)}
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePreviewCard(index)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        // View Mode
                        <>
                          <span className="w-20 text-sm font-mono text-slate-600">#{card.number}</span>
                          <span className="flex-1 font-medium text-slate-900">{card.name}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${card.rarity === 'Secret Rare' ? 'bg-amber-100 text-amber-800' :
                              card.rarity === 'VMAX' ? 'bg-purple-100 text-purple-800' :
                              card.rarity === 'V' ? 'bg-blue-100 text-blue-800' :
                              card.rarity === 'Rare' ? 'bg-slate-200 text-slate-700' :
                              card.rarity === 'Uncommon' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {card.rarity}
                          </span>
                          <button
                            onClick={() => setEditingCardIndex(index)}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 flex items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold">{previewCards.length}</span> cards ready to import
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelPreview}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPreview}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Create Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

