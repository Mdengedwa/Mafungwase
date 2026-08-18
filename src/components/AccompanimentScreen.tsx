import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ExternalLink,
  CheckCircle2,
  PieChart as PieChartIcon,
  Camera,
  Copy,
  Check,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Search,
  X,
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
import { PreparingInstructionsSection } from './PreparingInstructionsSection';
import { RetailPackUnitsModal } from './RetailPackUnitsModal';
import { RetailPackGuideItem } from '../data/retailPackUnits';
import { INITIAL_ORDER_LIST } from '../data/initialOrderList';
import platedMealPieChartImg from '../assets/images/plated_meal_pie_chart_1786617201280.jpg';

const MANAGER_MODE_STORAGE_KEY = 'food_costing_manager_mode';

interface AccompanimentScreenProps {
  accompaniments: Accompaniment[];
  setAccompaniments: React.Dispatch<React.SetStateAction<Accompaniment[]>>;
  orderList: OrderItem[];
  onContinueToMeal: () => void;
  onNavigateToOrderList?: (orderItemId: string) => void;
}

export const AccompanimentScreen: React.FC<AccompanimentScreenProps> = ({
  accompaniments,
  setAccompaniments,
  orderList,
  onContinueToMeal,
  onNavigateToOrderList,
}) => {
  const [activeAccIndex, setActiveAccIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [isSpoonModalOpen, setIsSpoonModalOpen] = useState<boolean>(false);
  const [isRetailModalOpen, setIsRetailModalOpen] = useState<boolean>(false);

  // Controlled dropdown and quick ingredient searcher states
  const [selectedOrderListId, setSelectedOrderListId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState<string>('');
  const [dropdownCategory, setDropdownCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Guaranteed effective Order List (falls back to INITIAL_ORDER_LIST if orderList is empty)
  const effectiveOrderList = useMemo<OrderItem[]>(() => {
    if (orderList && orderList.length > 0) {
      return orderList;
    }
    return INITIAL_ORDER_LIST;
  }, [orderList]);

  // Group and sort Order List items by category for high performance and clean navigation
  const groupedOrderList = useMemo<Record<string, OrderItem[]>>(() => {
    const groups: Record<string, OrderItem[]> = {};
    effectiveOrderList.forEach((item) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    // Sort items alphabetically inside each category
    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));
    });
    return groups;
  }, [effectiveOrderList]);

  // Categories list for filter
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(effectiveOrderList.map((i) => i.category || 'General'))).sort();
    return cats;
  }, [effectiveOrderList]);

  // Filtered order items for search modal
  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return effectiveOrderList.filter((item) => {
      const matchesCategory = searchCategory === 'all' || item.category === searchCategory;
      const matchesText =
        !q ||
        item.itemDescription.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q));
      return matchesCategory && matchesText;
    });
  }, [effectiveOrderList, searchQuery, searchCategory]);

  // Filtered order items for top dropdown picker
  const dropdownFilteredItems = useMemo(() => {
    const q = dropdownSearchQuery.toLowerCase().trim();
    return effectiveOrderList.filter((item) => {
      const matchesCategory = dropdownCategory === 'all' || item.category === dropdownCategory;
      const matchesText =
        !q ||
        item.itemDescription.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q));
      return matchesCategory && matchesText;
    });
  }, [effectiveOrderList, dropdownSearchQuery, dropdownCategory]);

  // Grouped filtered items for top dropdown picker
  const dropdownGroupedItems = useMemo<Record<string, OrderItem[]>>(() => {
    const groups: Record<string, OrderItem[]> = {};
    dropdownFilteredItems.forEach((item) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    // Sort keys alphabetically
    return groups;
  }, [dropdownFilteredItems]);

  // App Manager Mode State (persisted)
  const [isManagerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MANAGER_MODE_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

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

  const handleUpdateInstructions = (instructions: string) => {
    setAccompaniments((prev) =>
      prev.map((acc, idx) =>
        idx === activeAccIndex ? { ...acc, preparingInstructions: instructions } : acc
      )
    );
  };

  const handleUpdateVoiceNote = (voiceUrl?: string, duration?: number) => {
    setAccompaniments((prev) =>
      prev.map((acc, idx) =>
        idx === activeAccIndex
          ? { ...acc, voiceNoteUrl: voiceUrl, voiceNoteDuration: duration }
          : acc
      )
    );
  };

  // Add ingredient row (from Order List item OR manual)
  const handleAddIngredient = (orderItemId?: string) => {
    let newIng: AccompanimentIngredient;

    if (orderItemId) {
      const selectedItem = effectiveOrderList.find((i) => i.id === orderItemId);
      if (selectedItem) {
        const isLiquid = selectedItem.baseUnit === 'L' || selectedItem.packUnit === 'ml';
        const isEach = selectedItem.baseUnit === 'each' || selectedItem.packUnit === 'each';
        newIng = calculateIngredientRow({
          orderItemId: selectedItem.id,
          name: selectedItem.itemDescription,
          isManual: false,
          quantityUsed: isEach ? 1 : (isLiquid ? 100 : 250),
          unit: isEach ? 'each' : (isLiquid ? 'ml' : 'g'),
          baseUnit: selectedItem.baseUnit,
          eyPercent: selectedItem.estYieldPercent,
          costPerUnit: selectedItem.pricePerUnit,
        });
        showToast(`Added "${selectedItem.itemDescription}" (${formatCurrency(selectedItem.pricePerUnit)}/${selectedItem.baseUnit})`);
      } else {
        newIng = calculateIngredientRow({
          name: 'Custom Ingredient',
          isManual: true,
          quantityUsed: 0,
          unit: 'g',
          baseUnit: 'kg',
          eyPercent: 1.0,
          costPerUnit: 0,
        });
        showToast('Added custom ingredient row');
      }
    } else {
      newIng = calculateIngredientRow({
        name: 'New Custom Ingredient',
        isManual: true,
        quantityUsed: 0,
        unit: 'g',
        baseUnit: 'kg',
        eyPercent: 1.0,
        costPerUnit: 0,
      });
      showToast('Added new custom ingredient row');
    }

    const updatedAcc = {
      ...activeAcc,
      ingredients: [...activeAcc.ingredients, newIng],
    };
    updateActiveAcc(updatedAcc);
    setSelectedOrderListId('');
  };

  // Add ingredient selected from South African Retail Pack Units Guide
  const handleSelectRetailUnit = (item: RetailPackGuideItem) => {
    const defaultUnit = item.baseUnit === 'ml' ? 'ml' : item.baseUnit === 'ea' ? 'each' : item.baseUnit === 'kg' ? 'kg' : 'g';
    const defaultBaseUnit = item.baseUnit === 'ml' ? 'L' : item.baseUnit === 'ea' ? 'each' : 'kg';
    const qty = item.standardGramsOrMl || item.standardCount || 100;

    const newIng = calculateIngredientRow({
      name: `${item.unit} (${item.category})`,
      isManual: true,
      quantityUsed: qty,
      unit: defaultUnit,
      baseUnit: defaultBaseUnit,
      eyPercent: 1.0,
      costPerUnit: 0,
    });

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
          next.baseUnit = linkedItem.baseUnit;
          if (linkedItem.baseUnit === 'L' || linkedItem.packUnit === 'ml') {
            next.unit = 'ml';
            next.baseUnit = 'L';
            if (!next.quantityUsed || next.quantityUsed === 0) next.quantityUsed = 100;
          } else if (linkedItem.baseUnit === 'each' || linkedItem.packUnit === 'each') {
            next.unit = 'each';
            next.baseUnit = 'each';
            if (!next.quantityUsed || next.quantityUsed === 0) next.quantityUsed = 1;
          } else {
            next.unit = 'g';
            next.baseUnit = 'kg';
            if (!next.quantityUsed || next.quantityUsed === 0) next.quantityUsed = 250;
          }
        } else {
          next.isManual = true;
          next.costPerUnit = 0;
        }
      }

      // If unit changed
      if (field === 'unit') {
        if (value === 'ml' || value === 'L') {
          next.baseUnit = 'L';
        } else if (value === 'each') {
          next.baseUnit = 'each';
        } else if (value === 'g' || value === 'kg') {
          next.baseUnit = 'kg';
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

          {/* Preparing Instructions Section (Typed & Voice Record) */}
          <PreparingInstructionsSection
            activeAccompaniment={activeAcc}
            accompaniments={accompaniments}
            activeAccIndex={activeAccIndex}
            onSelectAccompaniment={(idx) => setActiveAccIndex(idx)}
            onUpdateInstructions={handleUpdateInstructions}
            onUpdateVoiceNote={handleUpdateVoiceNote}
          />
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

            {/* Add Ingredient Button & Quick Units */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Quick Search Ingredients Button */}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchCategory('all');
                  setIsSearchModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Search and select ingredients with instant filter"
              >
                <Search className="w-3.5 h-3.5 text-emerald-700" />
                <span>Search Ingredients</span>
              </button>

              {/* Responsive Interactive Dropdown Popover */}
              <div className="relative inline-block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen((prev) => !prev);
                    if (!isDropdownOpen) {
                      setDropdownSearchQuery('');
                      setDropdownCategory('all');
                    }
                  }}
                  className="inline-flex items-center justify-between gap-2 px-3.5 py-1.5 text-xs font-black bg-emerald-100/80 hover:bg-emerald-100 border-2 border-emerald-500/90 text-emerald-950 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer transition-all shadow-2xs active:scale-95"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="listbox"
                  title="Click to browse and add ingredients from the Order List database"
                >
                  <span className="truncate">+ Add from Order List...</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-emerald-800 transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-[310px] sm:w-[380px] max-w-[92vw] bg-white border-2 border-emerald-600 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header with Search and Category Filter */}
                    <div className="p-2.5 bg-emerald-50/90 border-b border-emerald-200 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          value={dropdownSearchQuery}
                          onChange={(e) => setDropdownSearchQuery(e.target.value)}
                          placeholder="Search ingredients, meat, spice..."
                          className="w-full pl-8 pr-7 py-1.5 text-xs font-bold bg-white border border-emerald-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        {dropdownSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDropdownSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Category Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          type="button"
                          onClick={() => setDropdownCategory('all')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                            dropdownCategory === 'all'
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          All ({effectiveOrderList.length})
                        </button>
                        {availableCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setDropdownCategory(cat)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                              dropdownCategory === cat
                                ? 'bg-emerald-800 text-white shadow-xs'
                                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable Item List */}
                    <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-emerald-50">
                      {Object.keys(dropdownGroupedItems).length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-500 font-medium">
                          No ingredients found matching &quot;{dropdownSearchQuery}&quot;
                        </div>
                      ) : (
                        (Object.entries(dropdownGroupedItems) as [string, OrderItem[]][]).map(([category, items]) => (
                          <div key={category} className="py-1">
                            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-50/70 sticky top-0 border-y border-emerald-100/50">
                              📂 {category} ({items.length})
                            </div>
                            {items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  handleAddIngredient(item.id);
                                  setIsDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-emerald-50/90 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-stone-900 group-hover:text-emerald-950 truncate">
                                    {item.itemDescription}
                                  </div>
                                  {item.source && (
                                    <div className="text-[10px] text-stone-400 font-medium truncate">
                                      {item.source} {item.location ? `• ${item.location}` : ''}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-200 group-hover:bg-emerald-200 transition-colors">
                                    {formatCurrency(item.pricePerUnit)} / {item.baseUnit}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-2 bg-stone-50 border-t border-emerald-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-stone-500">
                        {dropdownFilteredItems.length} items available
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddIngredient();
                          setIsDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 hover:text-emerald-950 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Custom Ingredient</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isManagerMode && (
                <button
                  type="button"
                  onClick={() => setIsRetailModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-500 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Open South African Retail Pack & Count Units Reference Guide"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-amber-900" />
                  <span>🇿🇦 SA Retail Units</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleAddIngredient()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors shadow-2xs cursor-pointer active:scale-95"
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
                  <th className="p-3 w-36">Quantity & Unit</th>

                  {viewMode === 'detailed' && (
                    <>
                      <th className="p-3 w-24">Est. Yield %</th>
                      <th className="p-3 w-28" title="As-Purchased Qty = Quantity Used × Est. Yield %">As-Purchased Qty</th>
                    </>
                  )}

                  <th className="p-3 w-40">Unit Price (R/Unit)</th>
                  <th className="p-3 w-28 text-right">Cost</th>
                  <th className="p-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 bg-white">
                {activeAcc.ingredients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={viewMode === 'detailed' ? 7 : 5}
                      className="p-8 text-center text-stone-400 bg-emerald-50/20"
                    >
                      {isManagerMode
                        ? 'No ingredients added yet. Select an ingredient from the dropdown above, choose from 🇿🇦 SA Retail Units, or add custom items.'
                        : 'No ingredients added yet. Select an ingredient from the dropdown above or add custom items.'}
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
                              <option value="manual">-- Manual / Custom Ingredient --</option>
                              {Object.entries(groupedOrderList).map(([category, items]: [string, OrderItem[]]) => (
                                <optgroup key={category} label={`📂 ${category}`}>
                                  {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.itemDescription} ({formatCurrency(item.pricePerUnit)}/{item.baseUnit})
                                    </option>
                                  ))}
                                </optgroup>
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
                                placeholder="Ingredient name (e.g. Canola Oil, Large Eggs)..."
                                className="w-full text-xs px-2 py-1 border border-emerald-300 bg-emerald-50/60 rounded-md font-semibold text-stone-900"
                              />
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 shrink-0 border border-emerald-200">
                                <AlertCircle className="w-3 h-3 text-emerald-700" />
                                100% EY
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-stone-500 pl-1">
                              {ing.orderItemId && onNavigateToOrderList ? (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToOrderList(ing.orderItemId!)}
                                  className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 hover:underline decoration-emerald-500/70 underline-offset-2 transition-colors cursor-pointer group text-left"
                                  title={`View/Edit "${ing.name}" in Order List database (Manager Mode)`}
                                >
                                  <Link2 className="w-3 h-3 text-emerald-700 group-hover:text-emerald-950 transition-colors shrink-0" />
                                  <span>
                                    Linked to Order List ({ing.baseUnit ? `R/${ing.baseUnit}` : 'R/kg'})
                                  </span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Link2 className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span className="font-semibold text-emerald-900">
                                    Linked to Order List ({ing.baseUnit ? `R/${ing.baseUnit}` : 'R/kg'})
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quantity Used with Unit Selector */}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step={ing.unit === 'each' ? '1' : ing.unit === 'L' || ing.unit === 'kg' ? '0.1' : '5'}
                            value={ing.quantityUsed}
                            onChange={(e) =>
                              handleIngredientChange(
                                ing.id,
                                'quantityUsed',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/80 rounded-lg focus:outline-none focus:border-emerald-600 text-stone-900"
                            title="Quantity used in recipe"
                          />
                          <select
                            value={ing.unit || 'g'}
                            onChange={(e) =>
                              handleIngredientChange(
                                ing.id,
                                'unit',
                                e.target.value as any
                              )
                            }
                            className="text-xs font-extrabold border border-emerald-300 bg-emerald-100 text-emerald-950 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                            title="Measurement unit"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="each">ea</option>
                          </select>
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
                            <div className="text-xs font-bold text-stone-800 bg-stone-100 px-2 py-1.5 rounded-lg border border-stone-200" title={`As-Purchased Qty = ${ing.quantityUsed} ${ing.unit || 'g'} × ${formatPercent(ing.eyPercent)} = ${ing.asPurchasedQty.toFixed(1)} ${ing.unit || 'g'}`}>
                              {ing.asPurchasedQty.toFixed(1)} {ing.unit || 'g'}
                            </div>
                          </td>
                        </>
                      )}

                      {/* Price Per Unit */}
                      <td className="p-3">
                        {ing.isManual ? (
                          <div className="flex items-center gap-1">
                            <div className="relative flex items-center flex-1">
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
                                className="w-full pl-5 pr-1 p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/80 rounded-lg focus:outline-none focus:border-emerald-600 text-stone-900"
                                title="Enter unit price in Rands"
                              />
                            </div>
                            <select
                              value={ing.baseUnit || (ing.unit === 'ml' || ing.unit === 'L' ? 'L' : ing.unit === 'each' ? 'each' : 'kg')}
                              onChange={(e) =>
                                handleIngredientChange(
                                  ing.id,
                                  'baseUnit',
                                  e.target.value as any
                                )
                              }
                              className="text-[11px] font-extrabold border border-emerald-300 bg-emerald-100 text-emerald-950 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                              title="Base pricing unit"
                            >
                              <option value="kg">/kg</option>
                              <option value="L">/L</option>
                              <option value="each">/ea</option>
                              <option value="g">/g</option>
                              <option value="ml">/ml</option>
                            </select>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-1.5 rounded-lg border border-stone-200">
                            {formatCurrency(ing.costPerUnit)} / {ing.baseUnit || (ing.unit === 'ml' || ing.unit === 'L' ? 'L' : ing.unit === 'each' ? 'each' : 'kg')}
                          </div>
                        )}
                      </td>

                      {/* Individual Cost (Calculated) */}
                      <td className="p-3 text-right">
                        <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                          {formatCurrency(ing.individualCost)}
                        </span>
                      </td>

                      {/* Actions: Info & Delete */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {ing.orderItemId && onNavigateToOrderList && (
                            <button
                              type="button"
                              onClick={() => onNavigateToOrderList(ing.orderItemId!)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              title={`More Information: View & Edit "${ing.name}" in Order List (Manager Mode)`}
                              aria-label="More information / Edit item in Order List"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteIngredient(ing.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Ingredient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                      {activeAcc.ingredients.length} items
                    </td>
                    {viewMode === 'detailed' && (
                      <>
                        <td className="p-3 text-stone-400 font-normal text-[11px]">--</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-950 font-black rounded-md border border-emerald-300">
                            {activeAcc.batchQuantity.toFixed(1)} g/ml
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

      {/* South African Retail Pack & Count Units Modal */}
      <RetailPackUnitsModal
        isOpen={isRetailModalOpen}
        onClose={() => setIsRetailModalOpen(false)}
        onSelectUnit={handleSelectRetailUnit}
      />

      {/* Quick Search & Pick Ingredients Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border-2 border-emerald-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-300" />
                  Add Ingredients to {activeAcc.name}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Browse {orderList.length} master ingredients or search by name / category
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-emerald-700/60 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar & Category Filters */}
            <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search e.g. Chicken, Onion, Rice, Oil, Cheese..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-emerald-300 rounded-xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSearchCategory('all')}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    searchCategory === 'all'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-emerald-50'
                  }`}
                >
                  All Categories ({orderList.length})
                </button>
                {availableCategories.map((cat) => {
                  const count = orderList.filter((i) => (i.category || 'General') === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSearchCategory(cat)}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        searchCategory === cat
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-emerald-50'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-emerald-50 space-y-1">
              {filteredSearchItems.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <p className="text-sm font-bold text-stone-600">No matching ingredients found</p>
                  <p className="text-xs mt-1">Try adjusting your search query or selected category filter.</p>
                </div>
              ) : (
                filteredSearchItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 px-3 rounded-xl hover:bg-emerald-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded-md border border-emerald-200 shrink-0">
                          {item.category || 'General'}
                        </span>
                        <span className="font-extrabold text-xs text-stone-900 truncate">
                          {item.itemDescription}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                        <span>
                          Pack: <strong className="text-stone-700">{item.packWeight} {item.packUnit}</strong> @ {formatCurrency(item.packPrice)}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-emerald-800">
                          {formatCurrency(item.pricePerUnit)} / {item.baseUnit}
                        </span>
                        {item.source && (
                          <>
                            <span>•</span>
                            <span className="text-stone-400 truncate max-w-[120px]">{item.source}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddIngredient(item.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <span>Showing {filteredSearchItems.length} of {orderList.length} items</span>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="px-4 py-2 font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white border-2 border-emerald-400 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-extrabold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
