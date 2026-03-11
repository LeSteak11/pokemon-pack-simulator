import React from 'react';
import { SavedSet, InventoryProfile } from '../types';
import { User, Plus, RotateCcw, Trash2 } from 'lucide-react';

interface ProfileManagerProps {
  activeSet: SavedSet | null;
  activeProfile: InventoryProfile | null;
  onCreateProfile: () => void;
  onSelectProfile: (profileId: string) => void;
  onResetProfile: () => void;
  onDeleteProfile: () => void;
}

export default function ProfileManager({
  activeSet,
  activeProfile,
  onCreateProfile,
  onSelectProfile,
  onResetProfile,
  onDeleteProfile,
}: ProfileManagerProps) {
  if (!activeSet) return null;

  const profiles = activeSet.profiles || [];
  const canDelete = profiles.length > 1;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-purple-500" />
          Profile
        </h2>
        {activeProfile && (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">
            {activeProfile.name}
          </span>
        )}
      </div>

      {/* Profile Selector */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="profile-select" className="text-sm font-medium text-slate-700 block">
            Active Profile
          </label>
          <select
            id="profile-select"
            value={activeProfile?.id || ''}
            onChange={(e) => onSelectProfile(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors border border-red-200"
        >
          <Trash2 size={16} />
          Delete Profile
        </button>
      )}

      {profiles.length === 0 && (
        <p className="text-xs text-center text-slate-500">
          Create a profile to start tracking your collection.
        </p>
      )}
    </div>
  );
}
