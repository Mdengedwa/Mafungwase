import React, { useState } from 'react';
import { Utensils, Sparkles, X, Check } from 'lucide-react';
import { SPOON_DENSITIES, calculateSpoonGrams } from '../utils/calculations';
import { SpoonInfo } from '../types';

interface SpoonDensityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (grams: number, info: SpoonInfo) => void;
  initialSpoonInfo?: SpoonInfo;
}

export const SpoonDensityModal: React.FC<SpoonDensityModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialSpoonInfo,
}) => {
  const [spoonType, setSpoonType] = useState<SpoonInfo['spoonType']>(
    initialSpoonInfo?.spoonType || 'rice_grain'
  );
  const [spoonCount, setSpoonCount] = useState<number>(
    initialSpoonInfo?.spoonCount || 3
  );

  if (!isOpen) return null;

  const estimatedGrams = calculateSpoonGrams(spoonType, spoonCount);

  const handleSave = () => {
    onApply(estimatedGrams, {
      spoonType,
      spoonCount,
      estimatedGrams,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">Spoon & Scoop Portion Converter</h3>
              <p className="text-xs text-stone-500">Estimate portion weight from spoon counts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Ingredient Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Select Ingredient Type / Consistency
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(SPOON_DENSITIES) as Array<SpoonInfo['spoonType']>).map((key) => {
                const item = SPOON_DENSITIES[key];
                const isSelected = spoonType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSpoonType(key)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-600 text-stone-900'
                        : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[11px] text-stone-500">{item.description}</div>
                    </div>
                    {isSelected && <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Spoons / Scoops */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Number of Spoons / Scoops per Portion
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSpoonCount(Math.max(0.5, spoonCount - 0.5))}
                className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-lg flex items-center justify-center transition-colors"
              >
                -
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={spoonCount}
                onChange={(e) => setSpoonCount(parseFloat(e.target.value) || 1)}
                className="flex-1 text-center py-2 text-lg font-bold border border-amber-300 bg-amber-50/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSpoonCount(spoonCount + 0.5)}
                className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-lg flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Calculated Output Preview */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider mb-1">
              Estimated Portion Weight
            </p>
            <div className="text-3xl font-extrabold text-emerald-950">
              {estimatedGrams} <span className="text-lg font-semibold text-emerald-700">grams</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Density estimate: {spoonCount} × {SPOON_DENSITIES[spoonType].gramsPerSpoon}g
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply {estimatedGrams}g
          </button>
        </div>
      </div>
    </div>
  );
};
