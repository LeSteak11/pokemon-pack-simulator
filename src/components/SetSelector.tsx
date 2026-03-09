import React from 'react';
import { SavedSet } from '../types';
import { List, Trash2, ChevronDown } from 'lucide-react';

interface SetSelectorProps {
  savedSets: SavedSet[];
  activeSetId: string | null;
  onSetChange: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
}

export default function SetSelector({
  savedSets,
  activeSetId,
  onSetChange,
  onDeleteSet,
}: SetSelectorProps) {
  const activeSet = savedSets.find(s => s.id === activeSetId) || null;

  if (savedSets.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <List className="w-5 h-5 text-indigo-500" />
        Active Set
      </h2>
      <div className="relative">
        <select 
          value={activeSetId || ''}
          onChange={(e) => onSetChange(e.target.value)}
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
          onClick={() => onDeleteSet(activeSet.id)}
          className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete this Set
        </button>
      )}
    </div>
  );
}
