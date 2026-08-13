import React, { useState } from 'react';
import { Calculator, X, AlertTriangle, Users, Scale, ArrowRight, ArrowRightLeft, Sparkles, Utensils } from 'lucide-react';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDishSetup?: () => void;
}

type Unit = 'kg' | 'g' | 'L' | 'ml' | 'units';
type CalcMode = 'bulkToPortion' | 'portionToBulk';

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({
  isOpen,
  onClose,
  onNavigateToDishSetup,
}) => {
  const [calcMode, setCalcMode] = useState<CalcMode>('bulkToPortion');
  const [itemName, setItemName] = useState('');
  const [bulkQty, setBulkQty] = useState<string>('4');
  const [unit, setUnit] = useState<Unit>('kg');
  const [guests, setGuests] = useState<string>('11');
  const [targetPortion, setTargetPortion] = useState<string>('150');
  const [portionUnit, setPortionUnit] = useState<Unit>('g');

  if (!isOpen) return null;

  const numGuests = Math.max(1, parseFloat(guests) || 1);
  const numBulk = parseFloat(bulkQty) || 0;
  const numTargetPortion = parseFloat(targetPortion) || 0;

  // Calculation for Mode 1: Bulk / Guests -> Portion per Serving
  const rawPortion = numGuests > 0 ? numBulk / numGuests : 0;

  // Formatting for portion result
  const formatPortionResult = () => {
    if (numBulk <= 0) return { main: '0 ' + unit, secondary: '' };

    if (unit === 'kg') {
      const grams = (rawPortion * 1000);
      return {
        main: `${grams >= 100 ? grams.toFixed(1) : grams.toFixed(2)} g`,
        secondary: `${rawPortion.toFixed(3)} kg per guest`,
      };
    } else if (unit === 'g') {
      return {
        main: `${rawPortion.toFixed(1)} g`,
        secondary: rawPortion >= 1000 ? `${(rawPortion / 1000).toFixed(3)} kg per guest` : '',
      };
    } else if (unit === 'L') {
      const ml = rawPortion * 1000;
      return {
        main: `${ml >= 100 ? ml.toFixed(1) : ml.toFixed(2)} ml`,
        secondary: `${rawPortion.toFixed(3)} L per guest`,
      };
    } else if (unit === 'ml') {
      return {
        main: `${rawPortion.toFixed(1)} ml`,
        secondary: rawPortion >= 1000 ? `${(rawPortion / 1000).toFixed(3)} L per guest` : '',
      };
    } else {
      return {
        main: `${rawPortion.toFixed(1)} units`,
        secondary: `per guest`,
      };
    }
  };

  // Calculation for Mode 2: Target Portion * Guests -> Total Bulk to Buy
  const formatBulkResult = () => {
    if (numTargetPortion <= 0) return { main: '0 ' + portionUnit, secondary: '' };

    const totalRaw = numTargetPortion * numGuests;
    if (portionUnit === 'g') {
      const totalKg = totalRaw / 1000;
      return {
        main: `${totalKg.toFixed(2)} kg to buy`,
        secondary: `${totalRaw.toLocaleString()} g total for ${numGuests} guests`,
      };
    } else if (portionUnit === 'kg') {
      return {
        main: `${totalRaw.toFixed(2)} kg to buy`,
        secondary: `${(totalRaw * 1000).toLocaleString()} g total`,
      };
    } else if (portionUnit === 'ml') {
      const totalL = totalRaw / 1000;
      return {
        main: `${totalL.toFixed(2)} L to buy`,
        secondary: `${totalRaw.toLocaleString()} ml total for ${numGuests} guests`,
      };
    } else if (portionUnit === 'L') {
      return {
        main: `${totalRaw.toFixed(2)} L to buy`,
        secondary: `${(totalRaw * 1000).toLocaleString()} ml total`,
      };
    } else {
      return {
        main: `${Math.ceil(totalRaw)} units to buy`,
        secondary: `${numTargetPortion} units × ${numGuests} guests`,
      };
    }
  };

  const portionResult = formatPortionResult();
  const bulkResult = formatBulkResult();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-black overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0B3B28] px-6 py-4 flex items-center justify-between text-white border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/80 rounded-xl border border-emerald-500/50 shadow-xs">
              <Calculator className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Quick Purchasing Calculator
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Fast bulk item allocation per guest/serving
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200">
            <button
              onClick={() => setCalcMode('bulkToPortion')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                calcMode === 'bulkToPortion'
                  ? 'bg-[#0B3B28] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Bulk ÷ Guests = Portion
            </button>
            <button
              onClick={() => setCalcMode('portionToBulk')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                calcMode === 'portionToBulk'
                  ? 'bg-[#0B3B28] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Portion × Guests = Bulk to Buy
            </button>
          </div>

          {/* Optional Item Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Item Name <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Chicken Breasts, Basmati Rice, Beef Mince"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {calcMode === 'bulkToPortion' ? (
            /* Mode 1: Bulk / Guests -> Portion */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Bulk Purchase Quantity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bulkQty}
                    onChange={(e) => setBulkQty(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Unit)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-extrabold text-stone-800 outline-hidden"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Number of Guests / Servings
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="e.g. 11"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <Users className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Portion * Guests -> Bulk to Buy */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Target Portion per Guest
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={targetPortion}
                    onChange={(e) => setTargetPortion(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <select
                    value={portionUnit}
                    onChange={(e) => setPortionUnit(e.target.value as Unit)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-extrabold text-stone-800 outline-hidden"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Number of Guests
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="e.g. 11"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <Users className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-stone-500 mr-1">Quick Guests:</span>
            {[5, 10, 11, 20, 25, 50, 100].map((g) => (
              <button
                key={g}
                onClick={() => setGuests(g.toString())}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                  guests === g.toString()
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Calculation Result Card */}
          <div className="bg-emerald-950 text-white p-5 rounded-2xl border-2 border-emerald-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-bold mb-1">
              <span>{calcMode === 'bulkToPortion' ? 'Portion Per Guest / Serving' : 'Total Bulk Purchase Needed'}</span>
              <span className="text-[11px] bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-700/50">
                {itemName ? itemName : 'Calculated'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                {calcMode === 'bulkToPortion' ? portionResult.main : bulkResult.main}
              </span>
              {calcMode === 'bulkToPortion' && portionResult.secondary && (
                <span className="text-xs text-emerald-200 font-semibold">
                  ({portionResult.secondary})
                </span>
              )}
            </div>

            {calcMode === 'portionToBulk' && bulkResult.secondary && (
              <p className="text-xs text-emerald-200/90 font-medium mt-1">
                {bulkResult.secondary}
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-emerald-300/90">
              <span>Formula:</span>
              <span className="font-mono font-bold text-white">
                {calcMode === 'bulkToPortion'
                  ? `${bulkQty} ${unit} ÷ ${guests} guests = ${portionResult.main} / guest`
                  : `${targetPortion} ${portionUnit} × ${guests} guests = ${bulkResult.main}`}
              </span>
            </div>
          </div>

          {/* Important Yield & Accuracy Advisory Message */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-amber-900">
              <p className="font-extrabold text-amber-950">
                ⚠️ Raw Purchase Estimator (No Yields / Shrinkage Accounted)
              </p>
              <p className="leading-relaxed text-amber-800">
                This tool provides a <strong>quick mathematical division</strong> to assist with raw grocery buying and packing. It does <strong>not</strong> account for trimming waste, skin/bone removal, or cooking shrinkage.
              </p>
              <p className="text-[11px] text-amber-950 font-semibold pt-1">
                👉 For accurate portion costing, cooked yield adjustments, and recipe batch accounting, please configure your meal in the <strong>Dish Setup</strong> section.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {onNavigateToDishSetup ? (
            <button
              onClick={() => {
                onClose();
                onNavigateToDishSetup();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-200 px-3.5 py-2 rounded-xl border border-emerald-300 transition-all cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Go to Dish Setup</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-extrabold shadow-xs transition-all"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
