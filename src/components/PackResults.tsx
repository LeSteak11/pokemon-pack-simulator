import React from 'react';
import { Card } from '../types';
import { PackageOpen } from 'lucide-react';

interface PackResultsProps {
  pack: Card[];
  score: number;
  activeSet: boolean;
}

export default function PackResults({ pack, score, activeSet }: PackResultsProps) {
  const getScoreColor = (total: number) => {
    if (total <= 30) return 'text-slate-700 bg-slate-100 border-slate-300';
    if (total <= 50) return 'text-green-700 bg-green-50 border-green-200';
    if (total <= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (total <= 90) return 'text-purple-700 bg-purple-50 border-purple-200';
    return 'text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300';
  };

  const getScoreTier = (total: number) => {
    if (total <= 20) return { emoji: '😔', label: 'Bulk Pack' };
    if (total <= 40) return { emoji: '😐', label: 'Standard Pack' };
    if (total <= 60) return { emoji: '😊', label: 'Good Pack' };
    if (total <= 80) return { emoji: '😃', label: 'Great Pack' };
    if (total <= 90) return { emoji: '🤩', label: 'Amazing Pack' };
    if (total <= 100) return { emoji: '🔥', label: 'Fire Pack' };
    return { emoji: '⭐', label: 'GOD PACK' };
  };

  const tier = getScoreTier(score);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header with Score */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-indigo-500" />
            Pack Results
          </h2>
          
          {pack.length > 0 && (
            <div className={`px-4 py-1.5 rounded-full border font-bold text-lg flex items-center gap-2 ${getScoreColor(score)}`}>
              <span className="text-2xl">{tier.emoji}</span>
              <div className="text-right">
                <div className="text-xs font-medium opacity-75">{tier.label}</div>
                <div>{score} pts</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Cards Display */}
      <div className="p-6">
        {pack.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            {activeSet ? 'Open a pack to see cards here.' : 'Upload a set to begin.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {pack.map((card, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border-2 flex flex-col justify-between min-h-[140px] transition-shadow hover:shadow-md
                  ${card.rarity === 'Secret Rare' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300' :
                    card.rarity === 'VMAX' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300' :
                    card.rarity === 'V' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300' :
                    card.rarity === 'Rare' ? 'bg-slate-100 border-slate-300' :
                    'bg-white border-slate-200'
                  }
                `}
              >
                <div>
                  <span className="text-[10px] font-mono opacity-60">#{card.number}</span>
                  <div className="font-semibold text-xs mt-1 leading-tight">{card.name}</div>
                </div>
                <div className="text-right mt-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {card.rarity}
                  </div>
                  <div className="text-[8px] font-medium uppercase opacity-50">
                    {card.finish}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
