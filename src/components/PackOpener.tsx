import React from 'react';
import { ActiveSet, InventoryProfile } from '../types';
import { PackageOpen } from 'lucide-react';

interface PackOpenerProps {
  activeSet: ActiveSet | null;
  activeProfile: InventoryProfile | null;
  onOpenPack: () => void;
  saveToInventory: boolean;
  onToggleSaveInventory: (value: boolean) => void;
}

export default function PackOpener({
  activeSet,
  activeProfile,
  onOpenPack,
  saveToInventory,
  onToggleSaveInventory,
}: PackOpenerProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-indigo-500" />
          Open Packs
        </h2>
        {activeProfile && (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
            {activeProfile.packsOpened} Opened
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id="saveToInventory"
          checked={saveToInventory}
          onChange={(e) => onToggleSaveInventory(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="saveToInventory" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
          Save to Collection Inventory
        </label>
      </div>

      <button 
        onClick={onOpenPack}
        disabled={!activeSet || activeSet.cards.length === 0}
        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
      >
        Open Pack
      </button>
      <p className="text-xs text-center text-slate-500">
        {!activeSet ? 'Load a checklist first.' : 'Simulates realistic pull rates.'}
      </p>
    </div>
  );
}
