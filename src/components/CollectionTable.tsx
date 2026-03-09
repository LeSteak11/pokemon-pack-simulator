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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <List className="w-6 h-6 text-indigo-500" />
          Collection Inventory
        </h2>
        {collection && collection.length > 0 && (
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
            {uniqueCount} Unique / {totalCount} Total
          </span>
        )}
      </div>

      {!collection || collection.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          Your collection is empty.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-slate-500 text-sm">
                <th className="pb-3 font-medium pl-2">Number</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Rarity</th>
                <th className="pb-3 font-medium">Finish</th>
                <th className="pb-3 font-medium text-right pr-2">Copies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collection.map((card) => (
                <tr key={`${card.number}-${card.finish}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pl-2 text-sm font-mono text-slate-500">#{card.number}</td>
                  <td className="py-3 font-medium">{card.name}</td>
                  <td className="py-3 text-sm text-slate-500">{card.rarity}</td>
                  <td className="py-3 text-sm text-slate-500">{card.finish}</td>
                  <td className="py-3 pr-2 text-right font-semibold text-indigo-600">{card.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
