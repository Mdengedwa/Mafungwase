import React, { useState } from 'react';
import { X, Search, PackageCheck, Layers, Sparkles, Scale, Check } from 'lucide-react';
import { SA_RETAIL_PACK_UNITS, RetailPackGuideItem } from '../data/retailPackUnits';

interface RetailPackUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUnit?: (item: RetailPackGuideItem) => void;
}

export const RetailPackUnitsModal: React.FC<RetailPackUnitsModalProps> = ({
  isOpen,
  onClose,
  onSelectUnit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Produce & Loose',
    'Eggs & Dairy',
    'Cans, Tins & Jars',
    'Baking & Pantry',
    'Oils & Liquids',
    'Bulk Grains & Bags',
  ];

  const filtered = SA_RETAIL_PACK_UNITS.filter((item) => {
    const matchesSearch =
      item.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.commonUse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.typicalQuantity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (item: RetailPackGuideItem) => {
    if (onSelectUnit) {
      onSelectUnit(item);
      onClose();
    } else {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-black overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0B3B28] px-6 py-4 flex items-center justify-between text-white border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-stone-950 rounded-2xl border border-amber-300 shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight">
                  South African Retail Pack & Count Units
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-800 text-amber-300 border border-emerald-700">
                  Standard Guide
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Typical pack sizes used to cost purchases bought by pack, bottle, or count rather than simple weight
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subheader Controls */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search e.g. oil, tin, egg tray, bunch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-stone-950 shadow-xs border border-amber-500'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0B3B28] text-white font-bold tracking-wider uppercase">
                <tr>
                  <th className="p-3">Unit</th>
                  <th className="p-3 w-24">Base Unit</th>
                  <th className="p-3 w-32">Typical Quantity</th>
                  <th className="p-3">Common Use / Examples</th>
                  {onSelectUnit && <th className="p-3 w-24 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white font-medium text-stone-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={onSelectUnit ? 5 : 4} className="p-8 text-center text-stone-400">
                      No matching retail pack units found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onSelectUnit && handleItemClick(item)}
                      className={`hover:bg-amber-50/60 transition-colors ${
                        onSelectUnit ? 'cursor-pointer' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                        <span>{item.unit}</span>
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-stone-100 text-stone-900 border border-stone-300">
                          {item.baseUnit}
                        </span>
                      </td>

                      <td className="p-3 font-extrabold text-amber-900 whitespace-nowrap">
                        {item.typicalQuantity}
                      </td>

                      <td className="p-3 text-stone-600">
                        {item.commonUse}
                      </td>

                      {onSelectUnit && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                            className="px-3 py-1.5 text-[11px] font-black text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            Apply
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Costing Tip:</strong> Liquid oils & sauces are priced per Litre (L) and measured in millilitres (ml). Discrete count items (eggs, buns, containers) are priced and portioned per Each (ea).
              </span>
            </div>
            {copiedId && (
              <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-1 rounded-md border border-emerald-300 animate-in fade-in">
                ✓ Copied to clipboard!
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-extrabold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
