import React from 'react';
import { Package } from 'lucide-react';
import { getAvailableBuiltInSets } from '../utils/jsonSetLoader';

interface SetLoaderProps {
  currentSet: string | null;  // Current filename (e.g., "evolving-skies.json")
  onSelectSet: (filename: string) => void;
  isLoading: boolean;
}

export default function SetLoader({
  currentSet,
  onSelectSet,
  isLoading
}: SetLoaderProps) {
  const builtInSets = getAvailableBuiltInSets();

  const handleSetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const filename = event.target.value;
    if (filename && filename !== currentSet) {
      onSelectSet(filename);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">Active Set</h2>
      </div>

      <div className="space-y-2">
        <select
          value={currentSet || ''}
          onChange={handleSetChange}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a set...</option>
          {builtInSets.map((set) => (
            <option key={set.filename} value={set.filename}>
              {set.displayName}
            </option>
          ))}
        </select>
        
        {isLoading && (
          <p className="text-xs text-slate-500">Loading set...</p>
        )}
      </div>
    </div>
  );
}
