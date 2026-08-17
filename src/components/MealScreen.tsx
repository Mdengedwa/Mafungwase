import React, { useState } from 'react';
import {
  Layers,
  CheckSquare,
  Square,
  Package,
  Truck,
  Plus,
  Trash2,
  ArrowRight,
  Info,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
  BookmarkPlus,
  Check,
  AlertTriangle,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { Accompaniment, FeeLine, Meal, OrderItem } from '../types';
import {
  formatCurrency,
  formatPercent,
  recalculateMeal,
} from '../utils/calculations';
import {
  DEFAULT_PRESET_SUGGESTIONS,
  PresetSuggestion,
} from '../data/defaultPresetSuggestions';

const LOCAL_STORAGE_KEY = 'mafungwase_dish_presets_v3';

interface MealScreenProps {
  currentMeal: Meal;
  setCurrentMeal: React.Dispatch<React.SetStateAction<Meal>>;
  accompaniments: Accompaniment[];
  orderList: OrderItem[];
  onContinueToQuote: () => void;
  onNavigateToOrderList?: (orderItemId: string) => void;
}

export const MealScreen: React.FC<MealScreenProps> = ({
  currentMeal,
  setCurrentMeal,
  accompaniments,
  orderList,
  onContinueToQuote,
  onNavigateToOrderList,
}) => {
  // Filter Order List items in Packaging / Disposables category
  const packagingOptions = orderList.filter((i) => i.category === 'Packaging');

  // Controlled select state for packaging
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>('');

  // Saved state and Margin Alert state for Recipe Library
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const [isMarginAlertOpen, setIsMarginAlertOpen] = useState(false);

  // Recalculate helper
  const updateMeal = (updated: Meal) => {
    const recalculated = recalculateMeal(updated, accompaniments);
    setCurrentMeal(recalculated);
  };

  // Cost & Margin calculations
  const costPercent = currentMeal.actualCostPercent || 0;
  const actualPct = Math.round(costPercent * 1000) / 10;
  const desiredPct = Math.round((currentMeal.desiredCostPercent || 0.4) * 1000) / 10;
  const profitMarginPct = Math.max(0, Math.round((1 - costPercent) * 1000) / 10);
  const desiredProfitMarginPct = Math.max(0, Math.round((1 - (currentMeal.desiredCostPercent || 0.4)) * 1000) / 10);
  const isOnTarget = costPercent <= (currentMeal.desiredCostPercent || 0.4);
  const variance = Math.round(((currentMeal.desiredCostPercent || 0.4) - costPercent) * 1000) / 10;

  // 40% Food Cost Margin Rule: Actual Food Cost must be <= 40.0% (and recipe must have accompaniments & cost)
  const isFinishedCostedRecipe = currentMeal.accompanimentIds.length > 0 && currentMeal.totalPlateCost > 0;
  const achieves40PercentMargin = isFinishedCostedRecipe && costPercent > 0 && costPercent <= 0.4001;

  // Selling price required to achieve exact 40% food cost margin
  const targetPriceFor40Margin = currentMeal.totalPlateCost > 0 ? currentMeal.totalPlateCost / 0.40 : 0;

  // Add current finished costed meal to the Recipe Library (LocalStorage)
  const handleAddToRecipeLibrary = () => {
    if (!isFinishedCostedRecipe) return;

    // Strict validation: Only allow recipes that achieve a 40% food cost margin
    if (!achieves40PercentMargin) {
      setIsMarginAlertOpen(true);
      return;
    }

    const selectedAccNames = accompaniments
      .filter((a) => currentMeal.accompanimentIds.includes(a.id))
      .map((a) => a.name);

    const mealTitle = currentMeal.name.trim() || 'Costed Meal Recipe';

    // Keep all 50 default presets, and preserve any custom recipes previously added
    let customPresets: PresetSuggestion[] = [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultIds = new Set(DEFAULT_PRESET_SUGGESTIONS.map((d) => d.id));
          // Filter out existing preset with the same name to update it, but keep all other custom ones
          customPresets = parsed.filter(
            (p) => !defaultIds.has(p.id) && p.title.toLowerCase() !== mealTitle.toLowerCase()
          );
        }
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }

    const newPreset: PresetSuggestion = {
      id: `preset-costed-${Date.now()}`,
      title: mealTitle,
      category: 'Costed Recipes',
      accompaniments: selectedAccNames,
      isCustom: true,
    };

    // New recipe is added, all 50 defaults are always kept intact
    const updatedPresets = [newPreset, ...customPresets, ...DEFAULT_PRESET_SUGGESTIONS];

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPresets));
      window.dispatchEvent(new Event('recipes_updated'));
      setIsSavedToLibrary(true);
      setTimeout(() => setIsSavedToLibrary(false), 3500);
    } catch (e) {
      console.error('Failed to save to recipe library:', e);
    }
  };

  // Toggle accompaniment on/off plate
  const toggleAccompaniment = (accId: string) => {
    const exists = currentMeal.accompanimentIds.includes(accId);
    const updatedIds = exists
      ? currentMeal.accompanimentIds.filter((id) => id !== accId)
      : [...currentMeal.accompanimentIds, accId];

    updateMeal({ ...currentMeal, accompanimentIds: updatedIds });
  };

  // One-click helper to auto-adjust price to meet the 40% margin
  const handleAutoAdjustTo40Margin = () => {
    const adjustedSellingPrice = Math.ceil(targetPriceFor40Margin);
    updateMeal({
      ...currentMeal,
      desiredCostPercent: 0.40,
      actualSellingPriceOverride: adjustedSellingPrice,
    });
    setIsMarginAlertOpen(false);
  };

  // Add Packaging Fee row from Order List
  const handleAddPackagingFee = (orderItemId?: string) => {
    let newFee: FeeLine;
    if (orderItemId) {
      const pItem = orderList.find((i) => i.id === orderItemId);
      if (pItem) {
        const packSize = pItem.packWeight && pItem.packWeight > 0 ? pItem.packWeight : 1;
        const packPrice = pItem.packPrice && pItem.packPrice > 0 ? pItem.packPrice : pItem.pricePerUnit * packSize;
        const unitCost = packSize > 0 ? packPrice / packSize : pItem.pricePerUnit;
        newFee = {
          id: `fee-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          category: 'Packaging',
          description: pItem.itemDescription,
          isFromOrderList: true,
          orderItemId: pItem.id,
          packSize,
          packPrice,
          unitCost,
          quantity: 1,
          totalCost: unitCost * 1,
        };
      } else {
        newFee = {
          id: `fee-${Date.now()}`,
          category: 'Packaging',
          description: 'Custom Packaging Box',
          isFromOrderList: false,
          packSize: 100,
          packPrice: 350,
          unitCost: 3.5,
          quantity: 1,
          totalCost: 3.5,
        };
      }
    } else {
      newFee = {
        id: `fee-${Date.now()}`,
        category: 'Packaging',
        description: 'Biodegradable Meal Container',
        isFromOrderList: false,
        packSize: 100,
        packPrice: 350,
        unitCost: 3.5,
        quantity: 1,
        totalCost: 3.5,
      };
    }

    updateMeal({ ...currentMeal, fees: [...currentMeal.fees, newFee] });
    setSelectedPackagingId('');
  };

  // Update fee line
  const handleFeeChange = (
    feeId: string,
    field: keyof FeeLine,
    value: any
  ) => {
    const updatedFees = currentMeal.fees.map((f) => {
      if (f.id !== feeId) return f;
      const next = { ...f, [field]: value };

      if (field === 'packSize' || field === 'packPrice') {
        const size = field === 'packSize' ? (parseFloat(value) || 0) : (next.packSize || 1);
        const price = field === 'packPrice' ? (parseFloat(value) || 0) : (next.packPrice || 0);
        if (size > 0) {
          next.unitCost = price / size;
        }
      } else if (field === 'unitCost') {
        const unit = parseFloat(value) || 0;
        if (next.packSize && next.packSize > 0) {
          next.packPrice = unit * next.packSize;
        }
      }

      next.totalCost = (next.unitCost || 0) * (next.quantity || 0);
      return next;
    });

    updateMeal({ ...currentMeal, fees: updatedFees });
  };

  // Delete fee line
  const handleDeleteFee = (feeId: string) => {
    const updatedFees = currentMeal.fees.filter((f) => f.id !== feeId);
    updateMeal({ ...currentMeal, fees: updatedFees });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Card 1: Header Banner & Meal Name Input */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Layers className="w-6 h-6 text-emerald-700" />
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              Meal Assembly & Plate Costing
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Select costed accompaniments to assemble a complete meal plate and add packaging or logistics fees.
            </p>
          </div>
        </div>

        {/* Meal Name Input */}
        <div>
          <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
            Meal / Plate Name
          </label>
          <input
            type="text"
            value={currentMeal.name}
            onChange={(e) => updateMeal({ ...currentMeal, name: e.target.value })}
            placeholder="e.g. Durban Curry Full Platter"
            className="w-full px-4 py-3 text-base font-extrabold border-2 border-emerald-300 bg-emerald-50/60 rounded-2xl focus:outline-none focus:border-emerald-600 focus:bg-white text-stone-900"
            title="Editable Meal Name"
          />
        </div>
      </div>

      {/* Card 2: Accompaniments Selection Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-3">
        <h3 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
          <span>1. Select Accompaniments Included on Plate</span>
          <span className="text-xs font-bold text-stone-500">
            {currentMeal.accompanimentIds.length} of {accompaniments.length} selected
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accompaniments.map((acc) => {
            const isIncluded = currentMeal.accompanimentIds.includes(acc.id);

            return (
              <div
                key={acc.id}
                onClick={() => toggleAccompaniment(acc.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isIncluded
                    ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-stone-50/80 hover:bg-emerald-50/30 border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-emerald-800 focus:outline-none"
                  >
                    {isIncluded ? (
                      <CheckSquare className="w-5 h-5 text-emerald-700 fill-emerald-100" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400" />
                    )}
                  </button>
                  <div>
                    <div className="text-xs font-extrabold text-stone-900">{acc.name}</div>
                    <div className="text-[11px] text-stone-500 font-medium">
                      {acc.portionSizeGrams}g standard portion
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-emerald-950">
                    {formatCurrency(acc.portionCost)}
                  </div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">
                    Portion Cost
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Fees & Packaging Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-700" />
            2. Packaging, Utensils & Service Fee Lines
          </h3>

          <div className="flex items-center gap-2">
            <select
              value={selectedPackagingId}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  handleAddPackagingFee(val);
                }
              }}
              className="max-w-[240px] sm:max-w-xs px-3 py-1.5 text-xs font-bold bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-950 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 focus:outline-none cursor-pointer transition-all truncate"
            >
              <option value="" disabled>
                + Add Packaging from Order List...
              </option>
              {packagingOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemDescription} ({formatCurrency(item.pricePerUnit)}/each)
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleAddPackagingFee()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-800" />
              Custom Fee
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-emerald-100 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50/90 text-emerald-950 font-extrabold border-b border-emerald-100 uppercase tracking-wider">
              <tr>
                <th className="p-3">Fee Item / Packaging Description</th>
                <th className="p-3 w-24">Category</th>
                <th className="p-3 w-24">Pack Size</th>
                <th className="p-3 w-28">Pack Price (R)</th>
                <th className="p-3 w-28">Unit Cost</th>
                <th className="p-3 w-24 text-center">Qty / Plate</th>
                <th className="p-3 w-28 text-right">Subtotal</th>
                <th className="p-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 bg-white">
              {currentMeal.fees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-stone-400 bg-emerald-50/20">
                    No packaging or logistics fees added. Click above to add containers or utensils.
                  </td>
                </tr>
              ) : (
                currentMeal.fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-3">
                      <input
                        type="text"
                        value={fee.description}
                        onChange={(e) =>
                          handleFeeChange(fee.id, 'description', e.target.value)
                        }
                        className="w-full text-xs font-semibold px-2 py-1 border border-stone-300 rounded-lg focus:outline-none text-stone-900"
                      />
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {fee.category}
                      </span>
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={fee.packSize ?? 1}
                        onChange={(e) =>
                          handleFeeChange(fee.id, 'packSize', parseFloat(e.target.value) || 1)
                        }
                        className="w-full p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/80 rounded-lg focus:outline-none text-center text-stone-900"
                        title="Units/Count in pack (e.g. 50, 100)"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={fee.packPrice ?? 0}
                        onChange={(e) =>
                          handleFeeChange(fee.id, 'packPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-full p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/80 rounded-lg focus:outline-none text-right text-stone-900"
                        title="Total Pack Price paid"
                      />
                    </td>

                    <td className="p-3">
                      <div
                        className="px-2 py-1 bg-stone-100 border border-stone-200 rounded-lg text-stone-800 font-extrabold text-xs text-right cursor-help"
                        title={`Unit Cost = Pack Price (${formatCurrency(fee.packPrice || 0)}) / Pack Size (${fee.packSize || 1})`}
                      >
                        {formatCurrency(fee.unitCost)}
                        <span className="text-[9px] text-stone-500 font-normal block">/ each</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={fee.quantity}
                        onChange={(e) =>
                          handleFeeChange(fee.id, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className="w-full p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/80 rounded-lg focus:outline-none text-center text-stone-900"
                        title="Quantity used per plate"
                      />
                    </td>

                    <td className="p-3 text-right font-black text-stone-900">
                      {formatCurrency(fee.totalCost)}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {fee.orderItemId && onNavigateToOrderList && (
                          <button
                            type="button"
                            onClick={() => onNavigateToOrderList(fee.orderItemId!)}
                            className="p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                            title={`More Information: View & Edit "${fee.description}" in Order List (Manager Mode)`}
                            aria-label="More information / Edit item in Order List"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteFee(fee.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete fee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {currentMeal.fees.length > 0 && (
              <tfoot className="bg-emerald-50/60 font-bold text-emerald-950 border-t-2 border-emerald-200">
                <tr>
                  <td colSpan={6} className="p-3 text-emerald-950 font-extrabold uppercase tracking-wider text-[11px] text-right">
                    Total Packaging & Fee Cost per Plate:
                  </td>
                  <td className="p-3 text-right font-black text-emerald-950 text-sm">
                    {formatCurrency(currentMeal.fees.reduce((sum, f) => sum + (f.totalCost || 0), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Card 4: Plate Accounting Summary */}
      <div className="bg-[#0B3B28] text-white p-6 sm:p-8 rounded-3xl space-y-6 shadow-md border-2 border-black">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Plate Cost */}
          <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider">
              Total Plate Cost
            </span>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {formatCurrency(currentMeal.totalPlateCost)}
            </div>
            <span className="text-[10px] text-emerald-200/70 mt-1 block">
              Portion Costs + Packaging Fees
            </span>
          </div>

          {/* Desired Cost % */}
          <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
            <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
              Desired Food Cost %
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="1"
                min="10"
                max="90"
                value={Math.round(currentMeal.desiredCostPercent * 100)}
                onChange={(e) =>
                  updateMeal({
                    ...currentMeal,
                    desiredCostPercent: (parseFloat(e.target.value) || 40) / 100,
                  })
                }
                className="w-20 px-2 py-1 text-sm font-extrabold bg-[#06261A] text-emerald-200 border border-emerald-700 rounded-lg focus:outline-none"
              />
              <span className="text-xs text-emerald-200">%</span>
            </div>
            <span className="text-[10px] text-emerald-200/70 mt-1 block">
              Target ratio (e.g. 40%)
            </span>
          </div>

          {/* Preliminary Selling Price */}
          <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider">
              Preliminary Selling Price
            </span>
            <div className="text-xl font-extrabold text-white mt-1">
              {formatCurrency(currentMeal.preliminarySellingPrice)}
            </div>
            <span className="text-[10px] text-emerald-200/70 mt-1 block">
              Calculated base price per plate
            </span>
          </div>

          {/* Actual Selling Price Override */}
          <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
            <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
              Actual Selling Price (Override)
            </label>
            <input
              type="number"
              step="5"
              value={currentMeal.actualSellingPriceOverride || ''}
              placeholder={currentMeal.preliminarySellingPrice.toFixed(2)}
              onChange={(e) =>
                updateMeal({
                  ...currentMeal,
                  actualSellingPriceOverride: parseFloat(e.target.value) || undefined,
                })
              }
              className="w-full px-2 py-1 text-sm font-extrabold bg-[#06261A] text-emerald-200 border border-emerald-700 rounded-lg focus:outline-none"
            />
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <span className="text-emerald-200/80">Actual Cost %:</span>
              <span
                className={`font-black ${
                  currentMeal.actualCostPercent <= currentMeal.desiredCostPercent
                    ? 'text-emerald-300'
                    : 'text-rose-300'
                }`}
              >
                {formatPercent(currentMeal.actualCostPercent)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar & Profit Margin Gauge */}
        <div className="pt-4 border-t border-emerald-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                Food Cost % vs Profit Margin Gauge
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-200/90 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 inline-block shadow-2xs"></span>
                Desired Target: <strong className="text-white">{desiredPct}%</strong>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-200/90 font-medium">
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block ${
                    isOnTarget ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></span>
                Actual Cost:{' '}
                <strong className={isOnTarget ? 'text-emerald-300' : 'text-rose-300'}>
                  {actualPct}%
                </strong>
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="relative w-full h-6 bg-[#06261A] rounded-full p-0.5 border border-emerald-700/80 shadow-inner overflow-hidden">
            {/* Target Threshold Marker Needle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-300 z-20 shadow-xs"
              style={{ left: `${Math.min(98, Math.max(2, desiredPct))}%` }}
              title={`Desired Cost Target: ${desiredPct}%`}
            />

            {/* Actual Food Cost Fill Bar */}
            <div
              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black tracking-tight ${
                isOnTarget
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 text-emerald-950'
                  : 'bg-gradient-to-r from-amber-600 via-rose-500 to-rose-600 text-white'
              }`}
              style={{ width: `${Math.min(100, Math.max(6, actualPct))}%` }}
            >
              {actualPct >= 10 && <span>{actualPct}%</span>}
            </div>
          </div>

          {/* Quick Stats Pill Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-[#072B1D] rounded-xl border border-emerald-800/80 flex items-center justify-between">
              <span className="text-[11px] text-emerald-200/80 font-semibold">Gross Profit Margin</span>
              <span className="text-xs font-black text-emerald-300">
                {profitMarginPct}%
              </span>
            </div>

            <div className="p-3 bg-[#072B1D] rounded-xl border border-emerald-800/80 flex items-center justify-between">
              <span className="text-[11px] text-emerald-200/80 font-semibold">Target Profit Margin</span>
              <span className="text-xs font-bold text-white">
                {desiredProfitMarginPct}%
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isOnTarget
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-800 text-rose-200'
              }`}
            >
              <span className="text-[11px] font-semibold">Margin Status</span>
              <span
                className={`text-xs font-black flex items-center gap-1 ${
                  isOnTarget ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {isOnTarget ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    +{Math.abs(variance)}% Buffer
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    -{Math.abs(variance)}% Over Target
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 5: Action Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-black shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-stone-500">
          {currentMeal.accompanimentIds.length > 0 ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Plate cost calculated
            </span>
          ) : (
            <span>Select at least one accompaniment above to build meal.</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleAddToRecipeLibrary}
            disabled={!isFinishedCostedRecipe}
            className={`inline-flex items-center gap-2 px-5 py-3.5 text-sm font-extrabold rounded-2xl border-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isSavedToLibrary
                ? 'bg-emerald-50 text-emerald-800 border-emerald-600 shadow-xs'
                : achieves40PercentMargin
                ? 'bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 border-emerald-400/80 shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
            }`}
            title={
              achieves40PercentMargin
                ? 'Save finished costed recipe (achieves ≤40% food cost margin)'
                : 'Food cost is currently above 40%. Click to review margin adjustment options.'
            }
          >
            {isSavedToLibrary ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-800">Added to Recipe Library!</span>
              </>
            ) : achieves40PercentMargin ? (
              <>
                <BookmarkPlus className="w-4 h-4 text-emerald-700" />
                <span>Add To Recipe Library</span>
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-200/80 text-emerald-900 font-black rounded-md">
                  {actualPct}% Cost
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Add To Recipe Library</span>
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-200 text-amber-900 font-bold rounded-md">
                  {actualPct}% (Target ≤40%)
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onContinueToQuote}
            disabled={currentMeal.accompanimentIds.length === 0}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-md transition-all transform active:scale-98"
          >
            <span>Proceed to Event Quotation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 40% Food Cost Margin Requirement Alert Modal */}
      {isMarginAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border-2 border-black shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                40% Food Cost Margin Required
              </h3>
              <button
                type="button"
                onClick={() => setIsMarginAlertOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <p className="font-medium">
                To protect profitability and caterer standards, the <strong>Recipe Library</strong> only accepts costed recipes that achieve a <strong>40% food cost margin or lower</strong> (≥60% gross profit margin).
              </p>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Current Food Cost:</span>
                  <span className="font-black text-rose-600 text-sm">{actualPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Target Food Cost:</span>
                  <span className="font-extrabold text-emerald-800">≤ 40.0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Total Plate Cost:</span>
                  <span className="font-bold text-stone-900">{formatCurrency(currentMeal.totalPlateCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Current Selling Price:</span>
                  <span className="font-bold text-stone-900">
                    {formatCurrency(currentMeal.actualSellingPriceOverride || currentMeal.preliminarySellingPrice)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Recommended Adjustment:
                </div>
                <p className="text-[11px] text-emerald-800">
                  Raise the selling price to <strong>{formatCurrency(Math.ceil(targetPriceFor40Margin))}</strong> (or reduce component costs) to achieve a 40.0% food cost margin.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsMarginAlertOpen(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Close & Adjust Manually
              </button>
              <button
                type="button"
                onClick={handleAutoAdjustTo40Margin}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Set to 40% Margin ({formatCurrency(Math.ceil(targetPriceFor40Margin))})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
