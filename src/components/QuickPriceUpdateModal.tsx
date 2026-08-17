import React, { useState } from 'react';
import {
  DollarSign,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';
import { OrderItem } from '../types';
import { calculatePricePerUnit, formatCurrency } from '../utils/calculations';

interface QuickPriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderList: OrderItem[];
  onSavePrices: (updatedItems: OrderItem[]) => void;
  onRemoveUnpriced?: () => void;
}

export const QuickPriceUpdateModal: React.FC<QuickPriceUpdateModalProps> = ({
  isOpen,
  onClose,
  orderList,
  onSavePrices,
  onRemoveUnpriced,
}) => {
  const [filterMode, setFilterMode] = useState<'zero_only' | 'all'>('zero_only');
  const [searchTerm, setSearchTerm] = useState('');
  // Local state map of item ID -> packPrice string
  const [priceMap, setPriceMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    orderList.forEach((item) => {
      map[item.id] = item.packPrice;
    });
    return map;
  });

  // Sync state if orderList changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      const map: Record<string, number> = {};
      orderList.forEach((item) => {
        map[item.id] = item.packPrice;
      });
      setPriceMap(map);
      // If no zero-price items exist, default filter to all
      const hasZero = orderList.some((i) => i.packPrice <= 0 || i.pricePerUnit <= 0);
      setFilterMode(hasZero ? 'zero_only' : 'all');
    }
  }, [isOpen, orderList]);

  if (!isOpen) return null;

  const handlePriceChange = (id: string, value: string) => {
    const num = parseFloat(value) || 0;
    setPriceMap((prev) => ({
      ...prev,
      [id]: Math.max(0, num),
    }));
  };

  const zeroPriceItemsCount = orderList.filter(
    (i) => (priceMap[i.id] ?? i.packPrice) <= 0 || i.pricePerUnit <= 0
  ).length;

  const filteredItems = orderList.filter((item) => {
    const currentPrice = priceMap[item.id] ?? item.packPrice;
    if (filterMode === 'zero_only' && currentPrice > 0 && item.pricePerUnit > 0) {
      return false;
    }
    if (
      searchTerm &&
      !item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = orderList.map((item) => {
      const newPackPrice = priceMap[item.id] ?? item.packPrice;
      const newPricePerUnit = calculatePricePerUnit(
        newPackPrice,
        item.packWeight,
        item.packUnit,
        item.baseUnit
      );
      return {
        ...item,
        packPrice: newPackPrice,
        pricePerUnit: newPricePerUnit,
      };
    });

    onSavePrices(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border-2 border-black flex flex-col max-h-[92vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl border border-amber-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                Update Missing Prices (Pack Price & Price/Unit)
              </h3>
              <p className="text-xs text-stone-500">
                Enter the pack prices below. The price per base unit (R/kg, R/L, R/ea) is calculated live.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Card */}
        {zeroPriceItemsCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black">
                {zeroPriceItemsCount} items currently have R 0.00 price:
              </span>
              <p className="text-[11px] text-amber-900">
                Fill in the Pack Price (in South African Rands) for each item below and click &quot;Save Prices&quot; to update your database.
              </p>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-300 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('zero_only')}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'zero_only'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Missing Prices Only ({orderList.filter((i) => (priceMap[i.id] ?? i.packPrice) <= 0).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Items ({orderList.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-xl bg-white focus:outline-none focus:border-amber-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Scrollable Price Update Table */}
        <form onSubmit={handleSaveAll} className="flex flex-col flex-1 min-h-0 space-y-4">
          <div className="border-2 border-stone-200 rounded-2xl overflow-hidden overflow-y-auto flex-1 max-h-[50vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0B3B28] text-white font-black sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Pack Size</th>
                  <th className="p-3 w-40 text-center">Pack Price (R)</th>
                  <th className="p-3 text-right">Calculated Price / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium bg-white">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-400 bg-stone-50">
                      No matching items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const currentPackPrice = priceMap[item.id] ?? item.packPrice;
                    const calculatedPerUnit = calculatePricePerUnit(
                      currentPackPrice,
                      item.packWeight,
                      item.packUnit,
                      item.baseUnit
                    );
                    const isZero = currentPackPrice <= 0;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isZero ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-stone-50'
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-extrabold text-stone-900">
                            {item.itemDescription}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-3 text-stone-700 whitespace-nowrap">
                          {item.packWeight} {item.packUnit} ({item.packType})
                        </td>

                        <td className="p-3 text-center">
                          <div className="relative inline-flex items-center">
                            <span className="absolute left-2.5 text-stone-500 font-bold text-xs">
                              R
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentPackPrice === 0 ? '' : currentPackPrice}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                              placeholder="0.00"
                              className={`w-32 pl-7 pr-2.5 py-1.5 text-xs font-black rounded-xl border-2 transition-all focus:outline-none ${
                                isZero
                                  ? 'border-amber-400 bg-amber-50/80 text-amber-950 focus:border-amber-600 focus:bg-white'
                                  : 'border-stone-300 bg-white text-stone-900 focus:border-emerald-500'
                              }`}
                            />
                          </div>
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-xs font-black ${
                              calculatedPerUnit > 0
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {formatCurrency(calculatedPerUnit)} / {item.baseUnit}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-200 shrink-0">
            <span className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Calculated automatically using South African conversion ratios (g→kg, ml→L).
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {onRemoveUnpriced && zeroPriceItemsCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveUnpriced();
                    onClose();
                  }}
                  className="px-3.5 py-2 text-xs font-black text-rose-950 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl cursor-pointer transition-colors"
                >
                  Remove All Unpriced Items ({zeroPriceItemsCount})
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-[#0B3B28] hover:bg-[#12583d] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save All Prices</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
