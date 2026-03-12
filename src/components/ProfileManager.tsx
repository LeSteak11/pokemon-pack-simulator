import React, { useState } from 'react';
import { InventoryProfile } from '../types';
import { User, Plus, RotateCcw, Trash2, Info, X } from 'lucide-react';

const formatSetName = (filename: string) =>
  filename.replace('.json', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

interface ProfileManagerProps {
  profiles: InventoryProfile[];
  activeProfile: InventoryProfile | null;
  onCreateProfile: () => void;
  onSelectProfile: (profileId: string) => void;
  onResetProfile: () => void;
  onDeleteProfile: () => void;
}

export default function ProfileManager({
  profiles,
  activeProfile,
  onCreateProfile,
  onSelectProfile,
  onResetProfile,
  onDeleteProfile,
}: ProfileManagerProps) {
  const [showInfo, setShowInfo] = useState(false);
  const canDelete = profiles.length > 1;

  const packsBySet = activeProfile?.packsBySet || {};
  const setEntries = Object.entries(packsBySet).filter(([, count]) => count > 0);
  const totalPacks = activeProfile?.packsOpened ?? 0;

  return (
    <div className="bg-[#2A2A2A] p-6 rounded-2xl border border-[#3A3A3A] space-y-4 relative">

      {/* Info Panel Overlay */}
      {showInfo && activeProfile && (
        <div className="absolute inset-0 bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#E5E5E5]">{activeProfile.name} — Stats</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-[#B0B0B0] hover:text-[#E5E5E5] transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-[#3A3A3A] pb-3">
              <span className="text-[#B0B0B0]">Total Packs Opened</span>
              <span className="text-[#E5E5E5] font-bold text-base">{totalPacks}</span>
            </div>

            {setEntries.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-[#B0B0B0] uppercase tracking-wider font-medium">By Set</p>
                {setEntries.map(([filename, count]) => (
                  <div key={filename} className="flex justify-between items-center text-sm">
                    <span className="text-[#B0B0B0]">{formatSetName(filename)}</span>
                    <span className="text-[#E5E5E5] font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : totalPacks > 0 ? (
              <p className="text-xs text-[#B0B0B0]">Per-set breakdown will appear for future packs.</p>
            ) : (
              <p className="text-xs text-[#B0B0B0]">No packs opened yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-purple-500" />
          Profile
        </h2>
        {activeProfile && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#4A4A4A] bg-[#1E1E1E] text-[#B0B0B0] hover:text-purple-400 hover:border-purple-600 transition-colors text-xs"
              title="View profile stats"
            >
              <Info size={12} />
              Stats
            </button>
            <span className="px-2.5 py-1 bg-purple-900/40 text-purple-300 rounded-md text-xs font-bold">
              {activeProfile.name}
            </span>
          </div>
        )}
      </div>

      {/* Profile Selector */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="profile-select" className="text-sm font-medium text-[#E5E5E5] block">
            Active Profile
          </label>
          <select
            id="profile-select"
            value={activeProfile?.id || ''}
            onChange={(e) => onSelectProfile(e.target.value)}
            className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg text-sm text-[#E5E5E5] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.packsOpened} packs)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCreateProfile}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New
        </button>

        {activeProfile && (
          <button
            onClick={onResetProfile}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
      </div>

      {/* Delete Profile Button */}
      {activeProfile && canDelete && (
        <button
          onClick={onDeleteProfile}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-800"
        >
          <Trash2 size={16} />
          Delete Profile
        </button>
      )}

      {profiles.length === 0 && (
        <p className="text-xs text-center text-[#B0B0B0]">
          Create a profile to start tracking your collection.
        </p>
      )}
    </div>
  );
}
