import React from 'react';
import { Card, CollectionItem, Rarity } from '../types';
import { CheckSquare } from 'lucide-react';

interface CollectionTableProps {
  allCards: Card[] | undefined;
  collection: CollectionItem[] | undefined;
  activeProfileName: string | null;
  packsOpened: number;
  uniqueCount: number;
  totalCount: number;
}

const RARITY_LABEL: Record<Rarity, string> = {
  Common:       'C',
  Uncommon:     'U',
  Rare:         'R',
  V:            'V',
  VMAX:         'VM',
  'Secret Rare':'SR',
};

const RARITY_COLOR: Record<Rarity, string> = {
  Common:       'text-[#888888]',
  Uncommon:     'text-green-500',
  Rare:         'text-blue-400',
  V:            'text-orange-400',
  VMAX:         'text-red-400',
  'Secret Rare':'text-amber-400',
};

export default function CollectionTable({
  allCards,
  collection,
  activeProfileName,
  packsOpened,
  uniqueCount,
  totalCount,
}: CollectionTableProps) {
  // Build number → total copies map from collection
  const copiesMap = new Map<string, number>();
  (collection || []).forEach(item => {
    copiesMap.set(item.number, (copiesMap.get(item.number) || 0) + item.count);
  });

  const cards = allCards ?? [];
  const collectedCount = cards.filter(c => (copiesMap.get(c.number) || 0) > 0).length;
  const progressPct = cards.length > 0 ? Math.round((collectedCount / cards.length) * 100) : 0;

  return (
    <div className="bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#3A3A3A] space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Set Checklist
          </h2>
          {activeProfileName && (
            <span className="text-xs text-[#B0B0B0]">
              <span className="text-[#E5E5E5] font-medium">{activeProfileName}</span>
              {' · '}
              <span className="text-indigo-400 font-medium">{packsOpened}</span> pack{packsOpened !== 1 ? 's' : ''} opened
            </span>
          )}
        </div>

        {cards.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#B0B0B0]">
              <span>{collectedCount} / {cards.length} cards collected</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Checklist */}
      {cards.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-[#B0B0B0] text-sm">
          Select a set to see the checklist.
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[480px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#2A2A2A] z-10">
              <tr className="border-b border-[#3A3A3A] text-[#888888] text-xs uppercase tracking-wider">
                <th className="py-1.5 pl-3 font-medium w-14">#</th>
                <th className="py-1.5 font-medium">Name</th>
                <th className="py-1.5 font-medium w-10 text-center">Rarity</th>
                <th className="py-1.5 pr-3 font-medium w-12 text-right">Copies</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const copies = copiesMap.get(card.number) || 0;
                const collected = copies > 0;
                return (
                  <tr
                    key={card.number}
                    className={`border-b border-[#333333] text-xs transition-colors ${
                      collected
                        ? 'hover:bg-[#303030]'
                        : 'opacity-40 hover:opacity-60 hover:bg-[#2E2E2E]'
                    }`}
                  >
                    <td className="py-1 pl-3 font-mono text-[#888888]">
                      {card.number.padStart(3, '0')}
                    </td>
                    <td className={`py-1 font-medium ${collected ? 'text-[#E5E5E5]' : 'text-[#B0B0B0]'}`}>
                      {card.name}
                    </td>
                    <td className="py-1 text-center">
                      <span className={`font-bold text-[10px] ${RARITY_COLOR[card.rarity]}`}>
                        {RARITY_LABEL[card.rarity]}
                      </span>
                    </td>
                    <td className="py-1 pr-3 text-right font-semibold">
                      {collected
                        ? <span className="text-indigo-400">×{copies}</span>
                        : <span className="text-[#555555]">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
