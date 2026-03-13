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
      
      {/* Legend */}
      <div className="px-6 pt-4 pb-0">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
          <span className="text-[9px] uppercase tracking-widest text-[#666] font-semibold mr-1">Rarity</span>
          {[
            { label: 'Common',       cls: 'bg-[#3a3a3a] text-[#999] border border-[#555]/40' },
            { label: 'Uncommon',     cls: 'bg-green-900/60 text-green-300 border border-green-600/40' },
            { label: 'Rare',         cls: 'bg-yellow-900/60 text-yellow-200 border border-yellow-600/50' },
            { label: 'Holo Rare',    cls: 'bg-gradient-to-r from-yellow-800/70 to-amber-700/60 text-yellow-100 border border-yellow-400/60' },
            { label: 'V',            cls: 'bg-blue-800/70 text-blue-100 border border-blue-500/50' },
            { label: 'VMAX',         cls: 'bg-purple-800/70 text-purple-100 border border-purple-500/50' },
            { label: 'Secret Rare',  cls: 'bg-amber-800/70 text-amber-100 border border-amber-600/50' },
            { label: 'Rainbow Rare', cls: 'bg-gradient-to-r from-cyan-800/70 to-purple-800/70 text-cyan-100 border border-cyan-400/50' },
            { label: 'Special Art',  cls: 'bg-fuchsia-700/70 text-fuchsia-100 border border-fuchsia-500/50' },
          ].map(({ label, cls }) => (
            <span key={label} className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cls}`}>
              {label}
            </span>
          ))}
          <span className="text-[9px] text-[#555] mx-1">·</span>
          <span className="text-[8px] text-[#666] italic">Reverse Holo / Holo shown below badge when applicable</span>
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
              const isSFA      = card.rarity === 'Special Full Art';
              const isRR       = card.rarity === 'Rainbow Rare';
              const isSR       = card.rarity === 'Secret Rare';
              const isVMAX     = card.rarity === 'VMAX';
              const isV        = card.rarity === 'V';
              const isHoloRare = card.rarity === 'Holo Rare';
              const isRare     = card.rarity === 'Rare';

              // Rarity badge shown on every card
              const rarityBadge =
                isSFA      ? { label: 'Special Art',  cls: 'bg-fuchsia-700/70 text-fuchsia-100 border border-fuchsia-500/50' } :
                isRR       ? { label: 'Rainbow Rare', cls: 'bg-gradient-to-r from-cyan-800/70 to-purple-800/70 text-cyan-100 border border-cyan-400/50' } :
                isSR       ? { label: 'Secret Rare',  cls: 'bg-amber-800/70 text-amber-100 border border-amber-600/50' } :
                isVMAX     ? { label: 'VMAX',         cls: 'bg-purple-800/70 text-purple-100 border border-purple-500/50' } :
                isV        ? { label: 'V',            cls: 'bg-blue-800/70 text-blue-100 border border-blue-500/50' } :
                isHoloRare ? { label: 'Holo Rare',    cls: 'bg-gradient-to-r from-yellow-800/70 to-amber-700/60 text-yellow-100 border border-yellow-400/60' } :
                isRare     ? { label: 'Rare',         cls: 'bg-yellow-900/60 text-yellow-200 border border-yellow-600/50' } :
                card.rarity === 'Uncommon' ? { label: 'Uncommon', cls: 'bg-green-900/60 text-green-300 border border-green-600/40' } :
                { label: 'Common', cls: 'bg-[#3a3a3a] text-[#999] border border-[#555]/40' };

              // Only show finish label when it adds info (not already implied by rarity badge)
              const showFinish = card.finish === 'Reverse Holo' || card.finish === 'Holo';

              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-2 flex flex-col justify-between min-h-[140px] transition-shadow hover:shadow-md
                    ${isSFA  ? 'bg-gradient-to-br from-fuchsia-900/50 to-pink-900/50 border-fuchsia-500' :
                      isRR   ? 'bg-gradient-to-br from-cyan-900/40 via-purple-900/40 to-pink-900/40 border-cyan-400' :
                      isSR   ? 'bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-600' :
                      isVMAX     ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-600' :
                      isV        ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-600' :
                      isHoloRare ? 'bg-gradient-to-br from-yellow-800/40 to-amber-900/30 border-yellow-500' :
                      isRare     ? 'bg-gradient-to-br from-yellow-900/20 to-[#333] border-yellow-700/60' :
                      card.rarity === 'Uncommon' ? 'bg-[#2E2E2E] border-[#3D483D]' :
                      'bg-[#2A2A2A] border-[#3A3A3A]'
                    }
                  `}
                >
                  {/* Top: number + name */}
                  <div>
                    <span className="text-[10px] font-mono opacity-50">#{card.number}</span>
                    <div className="font-semibold text-xs mt-1 leading-tight">{card.name}</div>
                  </div>

                  {/* Bottom: rarity + optional finish */}
                  <div className="mt-2 space-y-1">
                    <div className={`text-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${rarityBadge.cls}`}>
                      {rarityBadge.label}
                    </div>
                    {showFinish && (
                      <div className="text-center text-[8px] font-medium uppercase tracking-wide opacity-60 text-white">
                        {card.finish}
                      </div>
                    )}
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
