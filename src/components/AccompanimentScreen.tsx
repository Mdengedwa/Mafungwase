import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Utensils,
  Calculator,
  Sliders,
  Sparkles,
  Link2,
  AlertCircle,
  ArrowRight,
  Info,
  CheckCircle2,
  PieChart as PieChartIcon,
  Camera,
  Copy,
  Check,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Accompaniment,
  AccompanimentIngredient,
  OrderItem,
  SpoonInfo,
} from '../types';
import {
  formatCurrency,
  formatPercent,
  recalculateAccompaniment,
  calculateIngredientRow,
} from '../utils/calculations';
import { SpoonDensityModal } from './SpoonDensityModal';
import platedMealPieChartImg from '../assets/images/plated_meal_pie_chart_1786617201280.jpg';

interface AccompanimentScreenProps {
  accompaniments: Accompaniment[];
  setAccompaniments: React.Dispatch<React.SetStateAction<Accompaniment[]>>;
  orderList: OrderItem[];
  onContinueToMeal: () => void;
}

export const AccompanimentScreen: React.FC<AccompanimentScreenProps> = ({
  accompaniments,
  setAccompaniments,
  orderList,
  onContinueToMeal,
}) => {
  const [activeAccIndex, setActiveAccIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [isSpoonModalOpen, setIsSpoonModalOpen] = useState<boolean>(false);

  // Plated Meal Pie Chart Section States
  const [activeVisualTab, setActiveVisualTab] = useState<'pie' | 'photo' | 'prompt'>('pie');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);
  const [isPieSectionCollapsed, setIsPieSectionCollapsed] = useState<boolean>(false);

  const activeAcc = accompaniments[activeAccIndex] || accompaniments[0];

  // Total meal portion grams
  const totalMealGrams = Math.max(
    1,
    accompaniments.reduce((sum, a) => sum + (a.portionSizeGrams || 150), 0)
  );

  // Color palette for pie chart wedges
  const sliceColors = [
    { bg: 'bg-amber-500', fill: '#F59E0B', border: '#D97706', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300', name: 'Fluffy White Rice' },
    { bg: 'bg-red-700', fill: '#B91C1C', border: '#991B1B', badgeBg: 'bg-red-100 text-red-900 border-red-300', name: 'Tikka Chicken Fillet' },
    { bg: 'bg-amber-800', fill: '#92400E', border: '#78350F', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300', name: 'Butter Bean Curry' },
    { bg: 'bg-emerald-600', fill: '#059669', border: '#047857', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300', name: 'Fresh Garden Sambal' },
    { bg: 'bg-teal-500', fill: '#14B8A6', border: '#0D9488', badgeBg: 'bg-teal-100 text-teal-900 border-teal-300', name: 'Mint Sauce' },
    { bg: 'bg-stone-300', fill: '#D6D3D1', border: '#A8A29E', badgeBg: 'bg-stone-200 text-stone-900 border-stone-400', name: 'Garlic Mayo' },
    { bg: 'bg-orange-600', fill: '#EA580C', border: '#C2410C', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300', name: 'Chakalaka / Gravy' },
  ];

  // Pie chart slices dataset
  const pieData = accompaniments.map((acc, idx) => {
    const grams = acc.portionSizeGrams || 150;
    const pct = Math.round((grams / totalMealGrams) * 100);
    const color = sliceColors[idx % sliceColors.length];
    return {
      acc,
      idx,
      grams,
      pct,
      color,
    };
  });

  // Dynamic AI prompt string generated from actual accompaniments and calculated portion percentages
  const dynamicPromptText = `Hyper-realistic top-down overhead shot of a round white ceramic dinner plate. The plate is divided into distinct, precise wedge-shaped slices like a pie chart (slice are determined by the number of accompaniments in the meal). The percentage is determined by the standard portion grams. The physical surface area of each food strictly matches its percentage of the whole plate: ${pieData
    .map((d) => `${d.pct}% of ${d.acc.name}`)
    .join(', ')}. Each food is neatly contained within its triangular slice with clean, visible dividing lines (like chart borders) between each wedge. Studio food photography, diffused soft lighting, shallow depth of field, 8k, highly detailed, appetizing, culinary magazine style, pure white background.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(dynamicPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  if (!activeAcc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">
        No accompaniments available. Please return to Dish Setup to list your meal accompaniments.
      </div>
    );
  }

  // Check if at least 1 accompaniment has a calculated Portion Cost > 0
  const hasAtLeastOneCosted = accompaniments.some(
    (a) => a.portionCost > 0 && a.ingredients.length > 0
  );

  // Helper to update active accompaniment state
  const updateActiveAcc = (updated: Accompaniment) => {
    const recalculated = recalculateAccompaniment(updated);
    setAccompaniments((prev) =>
      prev.map((acc, idx) => (idx === activeAccIndex ? recalculated : acc))
    );
  };

  // Add ingredient row (from Order List item OR manual)
  const handleAddIngredient = (orderItemId?: string) => {
    let newIng: AccompanimentIngredient;

    if (orderItemId) {
      const selectedItem = orderList.find((i) => i.id === orderItemId);
      if (selectedItem) {
        newIng = calculateIngredientRow({
          orderItemId: selectedItem.id,
          name: selectedItem.itemDescription,
          isManual: false,
          quantityUsed: 250, // default 250g
          eyPercent: selectedItem.estYieldPercent,
          costPerUnit: selectedItem.pricePerUnit,
        });
      } else {
        newIng = calculateIngredientRow({
          name: 'Custom Ingredient',
          isManual: true,
          quantityUsed: 0,
          eyPercent: 1.0,
          costPerUnit: 0,
        });
      }
    } else {
      newIng = calculateIngredientRow({
        name: 'New Custom Ingredient',
        isManual: true,
        quantityUsed: 0,
        eyPercent: 1.0,
        costPerUnit: 0,
      });
    }

    const updatedAcc = {
      ...activeAcc,
      ingredients: [...activeAcc.ingredients, newIng],
    };
    updateActiveAcc(updatedAcc);
  };

  // Update single ingredient row in active accompaniment
  const handleIngredientChange = (
    ingId: string,
    field: keyof AccompanimentIngredient,
    value: any
  ) => {
    const updatedIngredients = activeAcc.ingredients.map((ing) => {
      if (ing.id !== ingId) return ing;

      let next = { ...ing, [field]: value };

      // If linking to an Order List item
      if (field === 'orderItemId') {
        const linkedItem = orderList.find((item) => item.id === value);
        if (linkedItem) {
          next.name = linkedItem.itemDescription;
          next.isManual = false;
          next.eyPercent = linkedItem.estYieldPercent;
          next.costPerUnit = linkedItem.pricePerUnit;
        } else {
          next.isManual = true;
          next.quantityUsed = 0;
          next.costPerUnit = 0;
        }
      }

      return calculateIngredientRow(next);
    });

    updateActiveAcc({ ...activeAcc, ingredients: updatedIngredients });
  };

  // Delete ingredient row
  const handleDeleteIngredient = (ingId: string) => {
    const updatedIngredients = activeAcc.ingredients.filter((ing) => ing.id !== ingId);
    updateActiveAcc({ ...activeAcc, ingredients: updatedIngredients });
  };

  // Apply Spoon Density result to Standard Portion
  const handleApplySpoonGrams = (grams: number, info: SpoonInfo) => {
    updateActiveAcc({
      ...activeAcc,
      portionSizeGrams: grams,
      spoonInfo: info,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Tabs: Accompaniment Selector */}
      <div className="bg-white rounded-3xl p-3 shadow-xs border-2 border-black overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider px-2 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-emerald-700" />
            Accompaniments:
          </span>
          {accompaniments.map((acc, idx) => {
            const isActive = idx === activeAccIndex;
            const isCosted = acc.portionCost > 0 && acc.ingredients.length > 0;
            const color = sliceColors[idx % sliceColors.length];
            return (
              <button
                key={acc.id}
                onClick={() => setActiveAccIndex(idx)}
                style={{
                  backgroundColor: isActive ? color.fill : `${color.fill}1A`,
                  borderColor: isActive ? color.border : `${color.fill}60`,
                  color: isActive ? '#FFFFFF' : '#1C1917',
                }}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold border-2 transition-all cursor-pointer ${
                  isActive ? 'shadow-md scale-[1.02] ring-2 ring-black/10' : 'hover:brightness-95'
                }`}
              >
                {/* Color Dot matching Pie Slice */}
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/60 shadow-xs"
                  style={{ backgroundColor: color.fill }}
                ></span>
                <span>{acc.name}</span>
                {isCosted ? (
                  <span
                    style={{
                      backgroundColor: isActive ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.85)',
                      color: isActive ? '#FFFFFF' : '#111827',
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-black border border-black/10"
                  >
                    {formatCurrency(acc.portionCost)}
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Side-by-Side Grid Layout: Left = Plate Visualizer, Right = Recipe Costing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Plated Meal Round Ceramic Plate Visualizer */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-xs border-2 border-black flex flex-col items-center justify-center">
            {/* Header */}
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 uppercase tracking-wider">
                <PieChartIcon className="w-3.5 h-3.5 text-emerald-800" />
                Plate Breakdown
              </span>
              <p className="text-xs text-stone-500 font-semibold mt-1">
                Total Weight: <strong className="text-stone-900 font-extrabold">{totalMealGrams}g</strong> • Click slice to select
              </p>
            </div>

            {/* Ceramic Plate */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-72 lg:h-72 xl:w-80 xl:h-80 flex items-center justify-center my-1">
              <div className="absolute inset-0 rounded-full bg-white shadow-xl border-8 border-stone-100 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 280 280" className="w-full h-full transform -rotate-90">
                  {/* Plate Inner Circle Background */}
                  <circle cx="140" cy="140" r="125" fill="#FAFAF9" stroke="#E7E5E4" strokeWidth="4" />

                  {/* Pie Wedges */}
                  {(() => {
                    let cumulativePct = 0;
                    return pieData.map((item, i) => {
                      const startAngle = cumulativePct * 2 * Math.PI;
                      cumulativePct += item.pct / 100;
                      const endAngle = cumulativePct * 2 * Math.PI;
                      const midAngle = startAngle + (endAngle - startAngle) / 2;

                      const cx = 140;
                      const cy = 140;
                      const r = 120;

                      const x1 = cx + r * Math.cos(startAngle);
                      const y1 = cy + r * Math.sin(startAngle);
                      const x2 = cx + r * Math.cos(endAngle);
                      const y2 = cy + r * Math.sin(endAngle);

                      // Label coordinates (positioned inside the wedge)
                      const labelR = r * 0.58;
                      const lx = cx + labelR * Math.cos(midAngle);
                      const ly = cy + labelR * Math.sin(midAngle);

                      const largeArcFlag = item.pct > 50 ? 1 : 0;

                      const pathData =
                        pieData.length === 1
                          ? `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`
                          : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                      const isHovered = hoveredSliceIndex === i;
                      const isActive = activeAccIndex === i;

                      // Box dimensions tailored to display full name neatly
                      const fullName = item.acc.name || 'Item';
                      const boxWidth = Math.max(76, Math.min(94, Math.round(item.pct * 3.6)));
                      const boxHeight = 44;

                      return (
                        <g
                          key={item.acc.id}
                          className="cursor-pointer group"
                          onClick={() => setActiveAccIndex(i)}
                          onMouseEnter={() => setHoveredSliceIndex(i)}
                          onMouseLeave={() => setHoveredSliceIndex(null)}
                        >
                          {/* Wedge Path */}
                          <path
                            d={pathData}
                            fill={item.color.fill}
                            stroke="#FFFFFF"
                            strokeWidth="3.5"
                            className={`transition-all duration-200 hover:opacity-95 ${
                              isHovered || isActive ? 'brightness-110 drop-shadow-md' : ''
                            }`}
                          />

                          {/* Slice Label Overlay (Counter-rotated by +90deg to sit horizontal & upright) */}
                          <g transform={`rotate(90 ${lx} ${ly})`}>
                            <foreignObject
                              x={lx - boxWidth / 2}
                              y={ly - boxHeight / 2}
                              width={boxWidth}
                              height={boxHeight}
                              className="pointer-events-none overflow-visible"
                            >
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                className={`w-full h-full flex flex-col items-center justify-center text-center rounded-lg px-1 py-0.5 transition-all shadow-xs ${
                                  isActive
                                    ? 'bg-slate-900/90 border-1.5 border-amber-400 text-white ring-2 ring-amber-400/30'
                                    : 'bg-slate-900/80 border border-white/40 text-white'
                                }`}
                                style={{ boxSizing: 'border-box' }}
                              >
                                {/* Full multiline title without truncation */}
                                <span
                                  className="font-extrabold leading-tight text-white break-words w-full px-0.5"
                                  style={{
                                    fontSize: fullName.length > 20 ? '7px' : fullName.length > 14 ? '7.5px' : '8.5px',
                                    lineHeight: '1.15',
                                  }}
                                >
                                  {fullName}
                                </span>
                                {/* Percentage & Grams */}
                                <span className="text-[7.5px] font-black text-amber-300 leading-none mt-0.5 whitespace-nowrap">
                                  {item.pct}% ({item.grams}g)
                                </span>
                              </div>
                            </foreignObject>
                          </g>
                        </g>
                      );
                    });
                  })()}

                  {/* Plate Center Cap */}
                  <circle cx="140" cy="140" r="16" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Selected Accompaniment Indicator */}
            <div className="mt-3 text-center">
              {(() => {
                const activeItem = pieData[activeAccIndex];
                const activeColor = activeItem?.color;
                return (
                  <span
                    style={{
                      backgroundColor: activeColor ? activeColor.fill : '#E7E5E4',
                      borderColor: activeColor ? activeColor.border : '#D6D3D1',
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-white px-4 py-1.5 rounded-full border-2 shadow-xs transition-all"
                  >
                    <span>🍽️</span>
                    <span>{activeItem?.acc.name || 'Accompaniment'}</span>
                    <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px] text-amber-200">
                      {activeItem?.pct}% • {activeItem?.grams}g
                    </span>
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Column 2: Accompaniment Recipe Costing Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Header Banner */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                  {activeAcc.name}
                </h2>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Recipe Costing
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Cost individual ingredients, yields, and calculate standard portion costs.
              </p>
            </div>

            {/* Simple vs Detailed Toggle */}
            <div className="flex items-center gap-1.5 bg-emerald-50/80 p-1.5 rounded-2xl self-start sm:self-auto border border-emerald-100">
              <button
                onClick={() => setViewMode('simple')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  viewMode === 'simple'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                Simple View
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Detailed View (Yield Accounting)
              </button>
            </div>
          </div>

      {/* Card 2: Batch & Portion Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border-2 border-black space-y-3">
        <h3 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
          Batch Yield & Serving Portion Controls
        </h3>

        {/* Recipe Batch & Portion Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
          {/* Batch Size (Auto-Tallied from As-Purchased Qty Column) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Recipe Batch Quantity (grams)
              </label>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-md border border-emerald-200">
                Auto-Tallied
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={`${(activeAcc.batchQuantity || 0).toFixed(1)} g`}
                className="w-full px-3 py-2 text-sm font-extrabold border border-stone-200 bg-stone-100 text-stone-800 rounded-xl cursor-not-allowed focus:outline-none shadow-2xs"
                title="Read-Only: Tallies total As-Purchased Quantity of all ingredients"
              />
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">
              Auto-tallied sum from As-Purchased Qty column
            </span>
          </div>

          {/* Portion Size */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Standard Portion (grams)
              </label>
              <button
                type="button"
                onClick={() => setIsSpoonModalOpen(true)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-100/90 hover:bg-emerald-200 px-2 py-0.5 rounded-lg transition-colors border border-emerald-200"
              >
                <Sparkles className="w-3 h-3 text-emerald-700" />
                Spoons Helper
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={activeAcc.portionSizeGrams}
                onChange={(e) =>
                  updateActiveAcc({
                    ...activeAcc,
                    portionSizeGrams: parseFloat(e.target.value) || 0,
                    spoonInfo: undefined, // clear spoon estimate tag if typed manually
                  })
                }
                className="w-full px-3 py-2 text-sm font-bold border-2 border-emerald-300 bg-emerald-50/80 focus:bg-white focus:border-emerald-600 focus:outline-none rounded-xl transition-colors text-stone-900"
                title="Editable Input: Standard portion weight"
              />
              {activeAcc.spoonInfo && (
                <span className="absolute right-2 top-2 text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
                  estimated
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">
              Weight served per plate
            </span>
          </div>

          {/* Number of Portions Result */}
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 flex flex-col justify-center shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Batch Yield Portions
            </span>
            <div className="text-xl font-black text-stone-900 mt-0.5">
              {activeAcc.numberOfPortions.toFixed(1)}{' '}
              <span className="text-xs font-semibold text-stone-500">portions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Ingredients Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border-2 border-black space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-700" />
              Ingredient Cost Breakdown
            </h3>

            {/* Add Ingredient Button */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddIngredient(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 rounded-xl focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>
                  + Add from Order List...
                </option>
                {orderList.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.category}] {item.itemDescription} ({formatCurrency(item.pricePerUnit)}/
                    {item.baseUnit})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleAddIngredient()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-800" />
                Custom
              </button>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="overflow-x-auto border border-emerald-100 rounded-2xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/90 text-emerald-950 font-extrabold border-b border-emerald-100 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Ingredient Description</th>
                  <th className="p-3 w-28">Quantity Used</th>

                  {viewMode === 'detailed' && (
                    <>
                      <th className="p-3 w-28">Est. Yield %</th>
                      <th className="p-3 w-28" title="As-Purchased Qty = Quantity Used × Est. Yield %">As-Purchased Qty</th>
                    </>
                  )}

                  <th className="p-3 w-36">Unit Price (R/kg)</th>
                  <th className="p-3 w-32 text-right">Cost</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 bg-white">
                {activeAcc.ingredients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={viewMode === 'detailed' ? 7 : 5}
                      className="p-8 text-center text-stone-400 bg-emerald-50/20"
                    >
                      No ingredients added yet. Select an ingredient from the dropdown above or add custom ingredients.
                    </td>
                  </tr>
                ) : (
                  activeAcc.ingredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* Ingredient Name / Picker */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={ing.orderItemId || 'manual'}
                              onChange={(e) =>
                                handleIngredientChange(
                                  ing.id,
                                  'orderItemId',
                                  e.target.value === 'manual' ? undefined : e.target.value
                                )
                              }
                              className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-lg p-1.5 focus:border-emerald-600 focus:outline-none text-stone-900"
                            >
                              <option value="manual">-- Manual Custom Ingredient --</option>
                              {orderList.map((item) => (
                                <option key={item.id} value={item.id}>
                                  [{item.category}] {item.itemDescription}
                                </option>
                              ))}
                            </select>
                          </div>

                          {ing.isManual ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input
                                type="text"
                                value={ing.name}
                                onChange={(e) =>
                                  handleIngredientChange(ing.id, 'name', e.target.value)
                                }
                                placeholder="Ingredient name..."
                                className="w-full text-xs px-2 py-1 border border-emerald-300 bg-emerald-50/60 rounded-md font-semibold text-stone-900"
                              />
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 shrink-0 border border-emerald-200">
                                <AlertCircle className="w-3 h-3 text-emerald-700" />
                                Assumed 100% EY
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-stone-500 pl-1">
                              <Link2 className="w-3 h-3 text-emerald-700" />
                              <span className="font-semibold text-emerald-900">
                                Linked to Order List
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quantity Used (Editable Cell) */}
                      <td className="p-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={ing.quantityUsed}
                            onChange={(e) =>
                              handleIngredientChange(
                                ing.id,
                                'quantityUsed',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/80 rounded-lg focus:outline-none focus:border-emerald-600 text-stone-900"
                            title="Quantity used in recipe (grams or each)"
                          />
                          <span className="text-[10px] text-stone-400 block mt-0.5 text-right">
                            grams
                          </span>
                        </div>
                      </td>

                      {/* Detailed View Columns */}
                      {viewMode === 'detailed' && (
                        <>
                          {/* Est Yield % */}
                          <td className="p-3">
                            <div className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-1.5 rounded-lg border border-stone-200">
                              {formatPercent(ing.eyPercent)}
                            </div>
                          </td>

                          {/* As-Purchased Quantity */}
                          <td className="p-3">
                            <div className="text-xs font-bold text-stone-800 bg-stone-100 px-2 py-1.5 rounded-lg border border-stone-200" title={`As-Purchased Qty = ${ing.quantityUsed}g × ${formatPercent(ing.eyPercent)} = ${ing.asPurchasedQty.toFixed(1)}g`}>
                              {ing.asPurchasedQty.toFixed(1)} g
                            </div>
                          </td>
                        </>
                      )}

                      {/* Price Per Unit */}
                      <td className="p-3">
                        {ing.isManual ? (
                          <div className="relative flex items-center">
                            <span className="absolute left-2 text-stone-500 font-bold text-xs pointer-events-none">R</span>
                            <input
                              type="number"
                              min="0"
                              step="0.50"
                              value={ing.costPerUnit || ''}
                              onChange={(e) =>
                                handleIngredientChange(
                                  ing.id,
                                  'costPerUnit',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0.00"
                              className="w-full pl-6 pr-8 p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/80 rounded-lg focus:outline-none focus:border-emerald-600 text-stone-900"
                              title="Enter unit price per kg in Rands (R/kg)"
                            />
                            <span className="absolute right-2 text-[10px] text-emerald-800 font-extrabold pointer-events-none select-none">
                              /kg
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-1.5 rounded-lg border border-stone-200">
                            {formatCurrency(ing.costPerUnit)} / kg
                          </div>
                        )}
                      </td>

                      {/* Individual Cost (Calculated) */}
                      <td className="p-3 text-right">
                        <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                          {formatCurrency(ing.individualCost)}
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(ing.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Ingredient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeAcc.ingredients.length > 0 && (
                <tfoot className="bg-emerald-50/60 font-bold text-emerald-950 border-t-2 border-emerald-200">
                  <tr>
                    <td className="p-3 text-emerald-950 font-extrabold uppercase tracking-wider text-[11px]">
                      Total Tally
                    </td>
                    <td className="p-3 font-extrabold text-stone-900">
                      {activeAcc.ingredients.reduce((sum, i) => sum + (i.quantityUsed || 0), 0).toFixed(1)} g
                    </td>
                    {viewMode === 'detailed' && (
                      <>
                        <td className="p-3 text-stone-400 font-normal text-[11px]">--</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-950 font-black rounded-md border border-emerald-300">
                            {activeAcc.batchQuantity.toFixed(1)} g
                          </span>
                        </td>
                      </>
                    )}
                    <td className="p-3 text-stone-400 font-normal text-[11px]">--</td>
                    <td className="p-3 text-right font-black text-emerald-950 text-xs sm:text-sm">
                      {formatCurrency(activeAcc.totalIngredientCost)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Card 4: Cost Accounting Summary Box */}
      <div className="bg-[#0B3B28] text-white p-6 sm:p-8 rounded-3xl space-y-6 shadow-md border-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-emerald-800/80">
            {/* Total Ingredient Cost */}
            <div>
              <span className="text-xs font-bold text-emerald-200/80 uppercase tracking-wider">
                Total Ingredient Cost
              </span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {formatCurrency(activeAcc.totalIngredientCost)}
              </div>
            </div>

            {/* Q Factor % Buffer */}
            <div>
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                Q Factor % (Spoilage Buffer)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="50"
                  value={Math.round(activeAcc.qFactorPercent * 100)}
                  onChange={(e) =>
                    updateActiveAcc({
                      ...activeAcc,
                      qFactorPercent: (parseFloat(e.target.value) || 0) / 100,
                    })
                  }
                  className="w-24 px-3 py-1.5 text-sm font-extrabold bg-[#06261A] text-emerald-200 border border-emerald-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <span className="text-xs text-emerald-200">%</span>
              </div>
              <span className="text-[10px] text-emerald-200/70 mt-1 block">
                Standard buffer for herbs, spices & waste
              </span>
            </div>

            {/* Total Recipe Cost */}
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Total Recipe Cost (With Q-Factor)
              </span>
              <div className="text-2xl font-black text-emerald-300 mt-1">
                {formatCurrency(activeAcc.recipeCost)}
              </div>
            </div>
          </div>

          {/* Portion Cost & Target Selling Price Calculations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Portion Cost */}
            <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider">
                Portion Cost per Plate
              </span>
              <div className="text-2xl font-black text-emerald-300 mt-1">
                {formatCurrency(activeAcc.portionCost)}
              </div>
              <span className="text-[10px] text-emerald-200/70 mt-1 block">
                {activeAcc.portionSizeGrams}g portion size
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
                  value={Math.round(activeAcc.desiredCostPercent * 100)}
                  onChange={(e) =>
                    updateActiveAcc({
                      ...activeAcc,
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
                {formatCurrency(activeAcc.preliminarySellingPrice)}
              </div>
              <span className="text-[10px] text-emerald-200/70 mt-1 block">
                Portion Cost ÷ Target Cost %
              </span>
            </div>

            {/* Actual Cost % */}
            <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider">
                Actual Cost %
              </span>
              <div
                className={`text-xl font-black mt-1 ${
                  activeAcc.actualCostPercent <= activeAcc.desiredCostPercent
                    ? 'text-emerald-300'
                    : 'text-rose-300'
                }`}
              >
                {formatPercent(activeAcc.actualCostPercent)}
              </div>
              <span className="text-[10px] text-emerald-200/70 mt-1 block">
                Cost ratio at target price
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Card 5: Navigation / Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-black shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          {hasAtLeastOneCosted ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ready to assemble plate
            </span>
          ) : (
            <span>Add ingredients and set portion size to unlock Meal Assembly.</span>
          )}
        </div>

        <button
          type="button"
          onClick={onContinueToMeal}
          disabled={!hasAtLeastOneCosted}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-md transition-all transform active:scale-98"
        >
          <span>Continue to Meal Assembly</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Spoon Density Converter Modal */}
      <SpoonDensityModal
        isOpen={isSpoonModalOpen}
        onClose={() => setIsSpoonModalOpen(false)}
        onApply={handleApplySpoonGrams}
        initialSpoonInfo={activeAcc.spoonInfo}
      />
    </div>
  );
};
