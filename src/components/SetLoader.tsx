import React, { useState } from 'react';
import { Package, Upload, AlertCircle } from 'lucide-react';
import { getAvailableBuiltInSets, fetchBuiltInSet, parseUploadedJSON } from '../utils/jsonSetLoader';
import { JSONSetData } from '../types';

interface SetLoaderProps {
  onLoadSet: (jsonData: JSONSetData) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function SetLoader({
  onLoadSet,
  isLoading,
  error,
  onClearError
}: SetLoaderProps) {
  const [selectedBuiltIn, setSelectedBuiltIn] = useState<string>('');
  const builtInSets = getAvailableBuiltInSets();

  const handleBuiltInSetChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const filename = event.target.value;
    setSelectedBuiltIn(filename);
    
    if (!filename) return;
    
    onClearError();
    
    try {
      const jsonData = await fetchBuiltInSet(filename);
      onLoadSet(jsonData);
    } catch (err) {
      console.error('Failed to load built-in set:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onClearError();

    try {
      const text = await file.text();
      const jsonData = parseUploadedJSON(text);
      onLoadSet(jsonData);
    } catch (err) {
      console.error('Failed to parse JSON file:', err);
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">Load Set</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={onClearError}
              className="text-xs text-red-600 hover:text-red-800 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Built-in Sets Dropdown */}
      <div className="space-y-2">
        <label htmlFor="builtin-set-select" className="block text-sm font-medium text-slate-700">
          Built-in Sets
        </label>
        <select
          id="builtin-set-select"
          value={selectedBuiltIn}
          onChange={handleBuiltInSetChange}
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
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-slate-500">OR</span>
        </div>
      </div>

      {/* Custom JSON Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Upload Custom JSON
        </label>
        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer transition-colors text-sm text-slate-600">
          <Upload size={18} />
          <span>{isLoading ? 'Loading...' : 'Choose JSON file'}</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
          />
        </label>
        <p className="text-xs text-slate-500">
          Upload a custom set JSON file
        </p>
      </div>
    </div>
  );
}
