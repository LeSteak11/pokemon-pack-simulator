import React from 'react';
import { CollectionItem } from '../types';
import { List } from 'lucide-react';

interface CollectionTableProps {
  collection: CollectionItem[] | undefined;
  uniqueCount: number;
  totalCount: number;
}

export default function CollectionTable({
  collection,
  uniqueCount,
  totalCount,
}: CollectionTableProps) {
  return (
    <div className="bg-[#2A2A2A] p-6 rounded-2xl border border-[#3A3A3A]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <List className="w-6 h-6 text-indigo-500" />
          Collection Inventory
        </h2>
        {collection && collection.length > 0 && (
          <span className="px-3 py-1 bg-indigo-900/40 text-indigo-300 rounded-full text-sm font-medium">
            {uniqueCount} Unique / {totalCount} Total
          </span>
        )}
      </div>

      {!collection || collection.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-[#B0B0B0] border-2 border-dashed border-[#3A3A3A] rounded-xl">
          Your collection is empty.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#3A3A3A] text-[#B0B0B0] text-sm">
                <th className="pb-3 font-medium pl-2">Number</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Rarity</th>
                <th className="pb-3 font-medium">Finish</th>
                <th className="pb-3 font-medium text-right pr-2">Copies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A3A3A]">
              {collection.map((card) => (
                <tr key={`${card.number}-${card.finish}`} className="hover:bg-[#333333] transition-colors">
                  <td className="py-3 pl-2 text-sm font-mono text-[#B0B0B0]">#{card.number}</td>
                  <td className="py-3 font-medium">{card.name}</td>
                  <td className="py-3 text-sm text-[#B0B0B0]">{card.rarity}</td>
                  <td className="py-3 text-sm text-[#B0B0B0]">{card.finish}</td>
                  <td className="py-3 pr-2 text-right font-semibold text-indigo-400">{card.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
