import React, { useState } from 'react';
import { Card } from '../types';
import { X, Check, Edit2, AlertTriangle, Trash2 } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  cards: Card[];
  setName: string;
  baseSize: number;
  onConfirm: () => void;
  onCancel: () => void;
  onUpdateCard: (index: number, updates: Partial<Card>) => void;
  onDeleteCard: (index: number) => void;
}

export default function PreviewModal({
  isOpen,
  cards,
  setName,
  baseSize,
  onConfirm,
  onCancel,
  onUpdateCard,
  onDeleteCard,
}: PreviewModalProps) {
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const validateCards = () => {
    const warnings: string[] = [];
    
    // Check for duplicate numbers
    const numbers = cards.map(c => c.number);
    const duplicates = numbers.filter((num, idx) => numbers.indexOf(num) !== idx);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate card numbers found: ${[...new Set(duplicates)].join(', ')}`);
    }
    
    // Check for suspiciously short names
    const shortNames = cards.filter(c => c.name.length < 2);
    if (shortNames.length > 0) {
      warnings.push(`${shortNames.length} card(s) have suspiciously short names`);
    }
    
    // Check if card count seems reasonable
    if (cards.length < 50) {
      warnings.push(`Only ${cards.length} cards found - this seems low for a Pokémon set`);
    }
    
    // Check rarity distribution
    const rarityCount = {
      'Common': cards.filter(c => c.rarity === 'Common').length,
      'Uncommon': cards.filter(c => c.rarity === 'Uncommon').length,
      'Rare': cards.filter(c => c.rarity === 'Rare').length,
      'V': cards.filter(c => c.rarity === 'V').length,
      'VMAX': cards.filter(c => c.rarity === 'VMAX').length,
      'Secret Rare': cards.filter(c => c.rarity === 'Secret Rare').length,
    };
    
    if (rarityCount['Common'] === 0 && rarityCount['Uncommon'] === 0) {
      warnings.push('No common or uncommon cards found - rarity detection may have failed');
    }
    
    return warnings;
  };

  const warnings = validateCards();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Preview Parsed Cards</h2>
            <p className="text-slate-500 text-sm mt-1">
              Review the {cards.length} cards parsed from "{setName}"
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Warnings */}
        {warnings.length > 0 && (
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
        )}

        {/* Card List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-2">
            {cards.map((card, index) => (
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
                      onChange={(e) => onUpdateCard(index, { number: e.target.value })}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm font-mono"
                      placeholder="###"
                    />
                    <input
                      type="text"
                      value={card.name}
                      onChange={(e) => onUpdateCard(index, { name: e.target.value })}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-medium"
                      placeholder="Card Name"
                    />
                    <select
                      value={card.rarity}
                      onChange={(e) => onUpdateCard(index, { rarity: e.target.value as any })}
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
                      onClick={() => onDeleteCard(index)}
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
            <span className="font-semibold">{cards.length}</span> cards ready to import
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirm & Create Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
