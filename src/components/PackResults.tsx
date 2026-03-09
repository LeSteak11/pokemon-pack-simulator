import React from 'react';
import { Card } from '../types';
import { PackageOpen } from 'lucide-react';

interface PackResultsProps {
  pack: Card[];
  score: number;
  activeSet: boolean;
}

export default function PackResults({ pack, score, activeSet }: PackResultsProps) {
  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-red-700 bg-red-50 border-red-200';
    if (score <= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (score <= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    return 'text-purple-700 bg-purple-50 border-purple-200';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[200px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PackageOpen className="w-6 h-6 text-indigo-500" />
          Pack Results
        </h2>
        
        {pack.length > 0 && (
          <div className={`px-4 py-1.5 rounded-full border font-bold text-sm flex items-center gap-2 ${getScoreColor(score)}`}>
            <span>Pack Score:</span>
            <span className="text-lg">{score} / 100</span>
          </div>
        )}
      </div>
      
      {pack.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          {activeSet ? 'Open a pack to see cards here.' : 'Upload a set to begin.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pack.map((card, i) => (
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
  );
}
