import React, { useState } from 'react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  Store,
  Tag,
  ArrowRight,
  Package,
  Layers,
  ChefHat,
} from 'lucide-react';
import { RecipeBasketItem, OrderItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';

interface RecipeBasketModalProps {
  isOpen: boolean;
  onClose: () => void;
  basket: RecipeBasketItem[];
  onUpdateQuantity: (orderItemId: string, newQty: number) => void;
  onRemoveItem: (orderItemId: string) => void;
  onClearBasket: () => void;
  onNavigateToDishBuilder?: () => void;
}

export const RecipeBasketModal: React.FC<RecipeBasketModalProps> = ({
  isOpen,
  onClose,
  basket,
  onUpdateQuantity,
  onRemoveItem,
  onClearBasket,
  onNavigateToDishBuilder,
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'items' | 'breakdown'>('items');

  if (!isOpen) return null;

  // Calculate totals based strictly on pack price
  const totalPacks = basket.reduce((acc, item) => acc + item.quantity, 0);
  const totalBasketCost = basket.reduce((acc, item) => {
    const packPrice = Number(item.orderItem.packPrice) || 0;
    return acc + packPrice * item.quantity;
  }, 0);

  // Group by supplier
  const suppliers = Array.from(
    new Set(basket.map((item) => item.orderItem.source || 'General Supplier'))
  ).sort();

  const filteredBasket =
    selectedSupplier === 'all'
      ? basket
      : basket.filter(
          (item) => (item.orderItem.source || 'General Supplier') === selectedSupplier
        );

  // Calculate category breakdowns
  const categoryTotals: Record<string, { count: number; cost: number; packs: number }> = {};
  basket.forEach((item) => {
    const cat = item.orderItem.category || 'Other';
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { count: 0, cost: 0, packs: 0 };
    }
    categoryTotals[cat].count += 1;
    categoryTotals[cat].packs += item.quantity;
    categoryTotals[cat].cost += (Number(item.orderItem.packPrice) || 0) * item.quantity;
  });

  const handleCopyShoppingList = () => {
    let text = `🛒 RECIPE SHOPPING BASKET (${new Date().toLocaleDateString('en-ZA')})\n`;
    text += `Total Items: ${basket.length} | Total Packs: ${totalPacks} | Estimated Total: ${formatCurrency(totalBasketCost)}\n`;
    text += `--------------------------------------------------\n\n`;

    if (selectedSupplier !== 'all') {
      text += `📍 SUPPLIER: ${selectedSupplier}\n\n`;
    }

    filteredBasket.forEach((item, idx) => {
      const lineCost = (Number(item.orderItem.packPrice) || 0) * item.quantity;
      text += `${idx + 1}. ${item.orderItem.itemDescription}\n`;
      text += `   • Quantity: ${item.quantity} x ${item.orderItem.packType} (${item.orderItem.packWeight} ${item.orderItem.packUnit})\n`;
      text += `   • Pack Price: ${formatCurrency(item.orderItem.packPrice)} | Line Total: ${formatCurrency(lineCost)}\n`;
      if (item.orderItem.source) {
        text += `   • Supplier: ${item.orderItem.source}\n`;
      }
      text += `\n`;
    });

    text += `--------------------------------------------------\n`;
    text += `💰 GRAND TOTAL: ${formatCurrency(totalBasketCost)} (Calculated on Pack Prices)\n`;
    text += `Generated via MAFUNGWASWE`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-radial from-rose-50/70 via-white to-amber-50/40 border-b border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <Heart className="w-6 h-6 fill-white stroke-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                  Recipe Shopping Basket
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                  {basket.length} {basket.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Shopping list of saved recipe ingredients with totals calculated from supplier pack prices.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close basket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grand Total Highlights Bar */}
        {basket.length > 0 && (
          <div className="bg-stone-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 shadow-inner">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Total Basket Cost (Pack Prices)
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {formatCurrency(totalBasketCost)}
                </span>
              </div>

              <div className="h-8 w-px bg-stone-700 hidden sm:block" />

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Total Packs Required
                </span>
                <span className="text-base sm:text-lg font-extrabold text-stone-200">
                  {totalPacks} {totalPacks === 1 ? 'Pack' : 'Packs'}
                </span>
              </div>

              <div className="h-8 w-px bg-stone-700 hidden sm:block" />

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Unique Ingredients
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                  {basket.length} Products
                </span>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyShoppingList}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-stone-900 bg-white hover:bg-stone-100 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                title="Copy formatted text shopping list for WhatsApp or SMS"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-700" />
                    <span>Copy Text List</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl transition-all cursor-pointer"
                title="Print shopping list"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClearBasket}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer border border-rose-800/40"
                title="Remove all items from basket"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {basket.length === 0 ? (
            <div className="text-center py-12 px-4 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
                <Heart className="w-8 h-8 stroke-[1.5] text-rose-400" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-stone-900">
                  Your Recipe Basket Is Empty
                </h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Click the <span className="inline-flex items-center text-rose-600 font-bold"><Heart className="w-3 h-3 fill-rose-500 inline mx-0.5" /> heart icon</span> next to any ingredient in the Order List to add it to your recipe shopping basket.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-600 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Browse Order List Ingredients</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Supplier & View Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-stone-500 mr-1 flex items-center gap-1 shrink-0">
                    <Store className="w-3.5 h-3.5 text-stone-400" />
                    Supplier:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSupplier('all')}
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-colors cursor-pointer shrink-0 ${
                      selectedSupplier === 'all'
                        ? 'bg-amber-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    All Suppliers ({basket.length})
                  </button>
                  {suppliers.map((sup) => {
                    const count = basket.filter(
                      (item) => (item.orderItem.source || 'General Supplier') === sup
                    ).length;
                    return (
                      <button
                        key={sup}
                        type="button"
                        onClick={() => setSelectedSupplier(sup)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${
                          selectedSupplier === sup
                            ? 'bg-amber-800 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {sup} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('items')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      activeTab === 'items'
                        ? 'bg-stone-800 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Items ({filteredBasket.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('breakdown')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      activeTab === 'breakdown'
                        ? 'bg-stone-800 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Category Summary
                  </button>
                </div>
              </div>

              {activeTab === 'breakdown' ? (
                /* Category Breakdown View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(categoryTotals).map(([cat, stats]) => (
                    <div
                      key={cat}
                      className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-700" />
                          {cat}
                        </span>
                        <span className="text-xs font-bold text-stone-500">
                          {stats.count} {stats.count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xs text-stone-500">
                          {stats.packs} {stats.packs === 1 ? 'pack' : 'packs'}
                        </span>
                        <span className="text-base font-black text-stone-900">
                          {formatCurrency(stats.cost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Shopping List Table */
                <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/90 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3">Category / Supplier</th>
                        <th className="p-3">Pack Details</th>
                        <th className="p-3">Pack Price</th>
                        <th className="p-3 text-center w-36">Pack Qty</th>
                        <th className="p-3 text-right">Line Total</th>
                        <th className="p-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {filteredBasket.map((item) => {
                        const packPrice = Number(item.orderItem.packPrice) || 0;
                        const lineTotal = packPrice * item.quantity;
                        return (
                          <tr
                            key={item.orderItem.id}
                            className="hover:bg-rose-50/20 transition-colors"
                          >
                            <td className="p-3">
                              <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                                <span>{item.orderItem.itemDescription}</span>
                              </div>
                              {item.orderItem.pricePerUnit > 0 && (
                                <span className="text-[11px] text-stone-500 block mt-0.5">
                                  Unit rate: {formatCurrency(item.orderItem.pricePerUnit)} /{' '}
                                  {item.orderItem.baseUnit}
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  {item.orderItem.category}
                                </span>
                                {item.orderItem.source && (
                                  <div className="text-[11px] text-stone-600 font-medium flex items-center gap-1">
                                    <Store className="w-3 h-3 text-stone-400" />
                                    <span>{item.orderItem.source}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-stone-700">
                              <span className="font-semibold">
                                {item.orderItem.packType}: {item.orderItem.packWeight}{' '}
                                {item.orderItem.packUnit}
                              </span>
                              {item.orderItem.estYieldPercent > 0 && (
                                <span className="text-[10px] text-stone-400 block">
                                  Yield: {formatPercent(item.orderItem.estYieldPercent)}
                                </span>
                              )}
                            </td>

                            <td className="p-3 font-bold text-stone-800 whitespace-nowrap">
                              {formatCurrency(packPrice)}
                              <span className="text-[10px] text-stone-400 font-normal block">
                                per {item.orderItem.packType}
                              </span>
                            </td>

                            {/* Quantity Adjustment Controls */}
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 w-fit mx-auto">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateQuantity(
                                      item.orderItem.id,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  className="w-7 h-7 flex items-center justify-center bg-white hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer shadow-2xs active:scale-95"
                                  title="Decrease pack quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    onUpdateQuantity(
                                      item.orderItem.id,
                                      isNaN(val) || val < 1 ? 1 : val
                                    );
                                  }}
                                  className="w-10 text-center font-black text-sm bg-transparent border-0 focus:outline-hidden focus:ring-0"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateQuantity(item.orderItem.id, item.quantity + 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center bg-white hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer shadow-2xs active:scale-95"
                                  title="Increase pack quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Line Total */}
                            <td className="p-3 text-right font-black text-stone-900 text-sm whitespace-nowrap">
                              {formatCurrency(lineTotal)}
                              <span className="text-[10px] text-stone-400 font-normal block">
                                ({item.quantity} x {formatCurrency(packPrice)})
                              </span>
                            </td>

                            {/* Remove Item */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.orderItem.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove from basket"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500 text-center sm:text-left">
            <span>
              Totals are calculated strictly by multiplying each item's supplier pack price by the required pack quantity.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl cursor-pointer transition-colors"
            >
              Continue Browsing
            </button>

            {basket.length > 0 && onNavigateToDishBuilder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDishBuilder();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-600 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <ChefHat className="w-4 h-4" />
                <span>Go to Dish Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
