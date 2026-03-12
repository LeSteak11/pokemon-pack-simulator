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
    if (total <= 20)  return 'text-[#B0B0B0] bg-[#3A3A3A] border-[#4A4A4A]';
    if (total <= 40)  return 'text-[#B0B0B0] bg-[#3A3A3A] border-[#4A4A4A]';
    if (total <= 60)  return 'text-green-400 bg-green-900/30 border-green-700';
    if (total <= 80)  return 'text-blue-400 bg-blue-900/30 border-blue-700';
    if (total <= 100) return 'text-purple-400 bg-purple-900/30 border-purple-700';
    if (total <= 120) return 'text-amber-400 bg-amber-900/30 border-amber-600';
    return 'text-yellow-300 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border-yellow-500';
  };

  const getScoreTier = (total: number) => {
    if (total <= 20)  return { emoji: '😔', label: 'Bulk Pack' };
    if (total <= 40)  return { emoji: '😐', label: 'Standard Pack' };
    if (total <= 60)  return { emoji: '😊', label: 'Good Pack' };
    if (total <= 80)  return { emoji: '😃', label: 'Great Pack' };
    if (total <= 100) return { emoji: '🤩', label: 'Amazing Pack' };
    if (total <= 120) return { emoji: '🔥', label: 'Fire Pack' };
    return { emoji: '⭐', label: 'GOD PACK' };
  };

  const tier = getScoreTier(score);

  return (
    <div className="bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A]">
      {/* Header with Score */}
      <div className="p-6 border-b border-[#3A3A3A]">
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
          <div className="h-32 flex items-center justify-center text-[#B0B0B0] border-2 border-dashed border-[#3A3A3A] rounded-xl">
            {activeSet ? 'Open a pack to see cards here.' : 'Upload a set to begin.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {pack.map((card, i) => {
              const isSFA   = card.rarity === 'Special Full Art';
              const isRR    = card.rarity === 'Rainbow Rare';
              const isSR    = card.rarity === 'Secret Rare';
              const isVMAX  = card.rarity === 'VMAX';
              const isV     = card.rarity === 'V';
              const isHit   = isSFA || isRR || isSR || isVMAX || isV;

              const badge = isSFA  ? { label: 'Special Art', cls: 'bg-fuchsia-700/60 text-fuchsia-200' }
                          : isRR   ? { label: 'Rainbow Rare', cls: 'bg-cyan-800/60 text-cyan-200' }
                          : isSR   ? { label: 'Secret Rare',  cls: 'bg-amber-800/60 text-amber-200' }
                          : isVMAX ? { label: 'VMAX',         cls: 'bg-purple-800/60 text-purple-200' }
                          : isV    ? { label: 'V',            cls: 'bg-blue-800/60 text-blue-200' }
                          : null;

              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-2 flex flex-col justify-between min-h-[140px] transition-shadow hover:shadow-md
                    ${isSFA  ? 'bg-gradient-to-br from-fuchsia-900/50 to-pink-900/50 border-fuchsia-500' :
                      isRR   ? 'bg-gradient-to-br from-cyan-900/40 via-purple-900/40 to-pink-900/40 border-cyan-400' :
                      isSR   ? 'bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-600' :
                      isVMAX ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-600' :
                      isV    ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-600' :
                      card.rarity === 'Rare' ? 'bg-[#333333] border-[#555555]' :
                      'bg-[#2A2A2A] border-[#3A3A3A]'
                    }
                  `}
                >
                  <div>
                    <span className="text-[10px] font-mono opacity-60">#{card.number}</span>
                    <div className="font-semibold text-xs mt-1 leading-tight">{card.name}</div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {badge && (
                      <div className={`text-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.cls}`}>
                        {badge.label}
                      </div>
                    )}
                    <div className={`text-right text-[8px] font-medium uppercase ${isHit ? 'opacity-60' : 'opacity-40'}`}>
                      {card.finish}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
