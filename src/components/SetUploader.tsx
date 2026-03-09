import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface SetUploaderProps {
  onUpload: (file: File, setName: string, baseSize: number) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function SetUploader({
  onUpload,
  isLoading,
  error,
  onClearError,
}: SetUploaderProps) {
  const [newSetName, setNewSetName] = useState('');
  const [newSetBaseSize, setNewSetBaseSize] = useState<number>(203);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await onUpload(file, newSetName, newSetBaseSize);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear form if successful
    if (success) {
      setNewSetName('');
    }
  };

  return (
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
            onChange={(e) => {
              setNewSetName(e.target.value);
              if (error) onClearError();
            }}
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
  );
}
