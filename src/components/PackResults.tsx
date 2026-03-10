import React from 'react';
import { Card, PackScoreBreakdown } from '../types';
import { PackageOpen, TrendingUp, Sparkles } from 'lucide-react';

interface PackResultsProps {
  pack: Card[];
  score: PackScoreBreakdown;
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

  const tier = getScoreTier(score.total);

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
            <div className="flex items-center gap-3">
              {/* Pack Value */}
              {score.packValue > 0 && (
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm flex items-center gap-1.5">
                  <TrendingUp size={16} />
                  ${score.packValue.toFixed(2)}
                </div>
              )}
              
              {/* Score */}
              <div className={`px-4 py-1.5 rounded-full border font-bold text-lg flex items-center gap-2 ${getScoreColor(score.total)}`}>
                <span className="text-2xl">{tier.emoji}</span>
                <div className="text-right">
                  <div className="text-xs font-medium opacity-75">{tier.label}</div>
                  <div>{score.total} pts</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        {pack.length > 0 && (score.marketValue > 0 || score.hpBonus > 0 || score.specialCards > 0) && (
          <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5">
            <div className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles size={14} />
              Score Breakdown
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
              {score.baseCards > 0 && (
                <div className="flex justify-between">
                  <span>Base Cards:</span>
                  <span className="font-medium">{score.baseCards} pts</span>
                </div>
              )}
              {score.marketValue > 0 && (
                <div className="flex justify-between">
                  <span>Market Value:</span>
                  <span className="font-medium text-emerald-600">{score.marketValue} pts</span>
                </div>
              )}
              {score.hpBonus > 0 && (
                <div className="flex justify-between">
                  <span>HP Power:</span>
                  <span className="font-medium">{score.hpBonus} pts</span>
                </div>
              )}
              {score.typeSynergy > 0 && (
                <div className="flex justify-between">
                  <span>Type Synergy:</span>
                  <span className="font-medium">{score.typeSynergy} pts</span>
                </div>
              )}
              {score.specialCards > 0 && (
                <div className="flex justify-between">
                  <span>Special Cards:</span>
                  <span className="font-medium">{score.specialCards} pts</span>
                </div>
              )}
              {score.varietyBonus > 0 && (
                <div className="flex justify-between">
                  <span>Variety:</span>
                  <span className="font-medium">{score.varietyBonus} pts</span>
                </div>
              )}
              {score.comboBonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-purple-600">Combo Bonus:</span>
                  <span className="font-bold text-purple-600">{score.comboBonus} pts</span>
                </div>
              )}
            </div>
          </div>
        )}
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
                className="group relative"
              >
                {/* Card Image */}
                {card.apiData?.imageUrl ? (
                  <div className="relative">
                    <img
                      src={card.apiData.imageUrl}
                      alt={card.name}
                      className="w-full rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                    />
                    {/* Market Price Overlay */}
                    {card.apiData?.tcgplayer?.prices && (() => {
                      const prices = card.apiData.tcgplayer.prices;
                      const price = (card.finish === 'Holo' && prices.holofoil?.market) ||
                                  (card.finish === 'Reverse Holo' && prices.reverseHolofoil?.market) ||
                                  prices.normal?.market ||
                                  prices.holofoil?.market ||
                                  0;
                      if (price >= 1) {
                        return (
                          <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                            ${price >= 10 ? Math.round(price) : price.toFixed(2)}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* HP Badge */}
                    {card.apiData?.hp && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                        {card.apiData.hp} HP
                      </div>
                    )}
                  </div>
                ) : (
                  // Fallback text display
                  <div 
                    className={`p-3 rounded-lg border-2 flex flex-col justify-between min-h-[140px]
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
