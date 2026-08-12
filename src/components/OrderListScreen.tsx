import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  X,
  Tag,
  ExternalLink,
  Globe,
  Calendar,
  MapPin,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { OrderItem, PackType, PackUnit, BaseUnit } from '../types';
import {
  formatCurrency,
  formatPercent,
  calculatePricePerUnit,
} from '../utils/calculations';
import { isDateExpiredOrInvalid, cleanupExpiredAndInvalidDates } from '../utils/dateCleanup';

interface OrderListScreenProps {
  orderList: OrderItem[];
  setOrderList: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  onResetOrderList: () => void;
}

export const OrderListScreen: React.FC<OrderListScreenProps> = ({
  orderList,
  setOrderList,
  onResetOrderList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  // Form State
  const [category, setCategory] = useState('Poultry');
  const [itemDescription, setItemDescription] = useState('');
  const [packType, setPackType] = useState<PackType>('Pack');
  const [packPrice, setPackPrice] = useState<number>(100);
  const [packWeight, setPackWeight] = useState<number>(1000);
  const [packUnit, setPackUnit] = useState<PackUnit>('g');
  const [baseUnit, setBaseUnit] = useState<BaseUnit>('kg');
  const [estYieldPercent, setEstYieldPercent] = useState<number>(0.85);
  const [yieldNote, setYieldNote] = useState('');
  const [source, setSource] = useState('Local Supplier');
  const [sourceUrl, setSourceUrl] = useState('');
  const [endingDate, setEndingDate] = useState('');
  const [location, setLocation] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const handleCleanExpiredDates = () => {
    const { cleanedOrderList, removedOrderDatesCount } = cleanupExpiredAndInvalidDates(
      orderList,
      []
    );
    setOrderList(cleanedOrderList);
    if (removedOrderDatesCount > 0) {
      setNotification(`Cleaned up ${removedOrderDatesCount} invalid/expired promotion end dates.`);
    } else {
      setNotification(`All promotion end dates in your Order List are valid!`);
    }
    setTimeout(() => setNotification(null), 4000);
  };

  // Categories list
  const categories = [
    'All',
    'Poultry',
    'Meat & Beef',
    'Vegetables & Produce',
    'Dairy & Pantry',
    'Spices & Condiments',
    'Packaging',
  ];

  // Filter items
  const filteredItems = orderList.filter((item) => {
    const matchesSearch = item.itemDescription
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCategory('Poultry');
    setItemDescription('');
    setPackType('Pack');
    setPackPrice(100);
    setPackWeight(1000);
    setPackUnit('g');
    setBaseUnit('kg');
    setEstYieldPercent(0.85);
    setYieldNote('Trimmed loss');
    setSource('Local Supplier');
    setSourceUrl('');
    setEndingDate('');
    setLocation('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: OrderItem) => {
    setEditingItem(item);
    setCategory(item.category);
    setItemDescription(item.itemDescription);
    setPackType(item.packType);
    setPackPrice(item.packPrice);
    setPackWeight(item.packWeight);
    setPackUnit(item.packUnit);
    setBaseUnit(item.baseUnit);
    setEstYieldPercent(item.estYieldPercent);
    setYieldNote(item.yieldNote);
    setSource(item.source);
    setSourceUrl(item.sourceUrl || '');
    setEndingDate(item.endingDate || '');
    setLocation(item.location || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedPricePerUnit = calculatePricePerUnit(
      packPrice,
      packWeight,
      packUnit
    );

    const cleanUrl = sourceUrl.trim();
    const cleanEndingDate = endingDate.trim();
    const cleanLocation = location.trim();

    const isEndingDateInvalid = cleanEndingDate ? isDateExpiredOrInvalid(cleanEndingDate) : false;
    const finalEndingDate = cleanEndingDate && !isEndingDateInvalid ? cleanEndingDate : undefined;

    if (cleanEndingDate && isEndingDateInvalid) {
      setNotification('The promotion end date entered was invalid or in the past and has been automatically cleared.');
      setTimeout(() => setNotification(null), 5000);
    }

    if (editingItem) {
      setOrderList((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                category,
                itemDescription,
                packType,
                packPrice,
                packWeight,
                packUnit,
                baseUnit,
                pricePerUnit: calculatedPricePerUnit,
                estYieldPercent,
                yieldNote,
                source,
                sourceUrl: cleanUrl || undefined,
                endingDate: finalEndingDate,
                location: cleanLocation || undefined,
              }
            : i
        )
      );
    } else {
      const newItem: OrderItem = {
        id: `ord-${Date.now()}`,
        category,
        itemDescription,
        packType,
        packPrice,
        packWeight,
        packUnit,
        baseUnit,
        pricePerUnit: calculatedPricePerUnit,
        estYieldPercent,
        yieldNote,
        source,
        sourceUrl: cleanUrl || undefined,
        endingDate: finalEndingDate,
        location: cleanLocation || undefined,
      };
      setOrderList((prev) => [newItem, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setOrderList((prev) => prev.filter((i) => i.id !== id));
  };

  const renderSourceCell = (item: OrderItem) => {
    let targetUrl = item.sourceUrl?.trim();
    let label = item.source?.trim() || '';

    // If sourceUrl is missing but source itself starts with http, https, or www.
    if (!targetUrl && label && (label.startsWith('http://') || label.startsWith('https://') || label.startsWith('www.'))) {
      targetUrl = label;
      label = label.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || label;
    }

    if (targetUrl) {
      const formattedHref = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
        ? targetUrl
        : `https://${targetUrl}`;

      return (
        <a
          href={formattedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300/80 rounded-lg font-extrabold text-xs transition-all hover:scale-[1.02] hover:shadow-2xs group"
          title={`Open product listing: ${formattedHref}`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="truncate max-w-[160px] underline decoration-emerald-400/80">{label || 'View Product'}</span>
          <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      );
    }

    return (
      <span className="text-stone-700 font-medium text-xs">
        {label || '-'}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border-2 border-black space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-700" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                Order List Database
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Master supplier ingredient & packaging database with pack weights, price per kg, and yield factors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCleanExpiredDates}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300 rounded-xl transition-colors"
              title="Automatically remove invalid or expired promotion end dates"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Clean Expired Promo Dates
            </button>

            <button
              onClick={onResetOrderList}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              title="Reset Order List to default starter dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Starter Data
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Ingredient/Item
            </button>
          </div>
        </div>

        {notification && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-950 font-black">
              ×
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ingredient or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-stone-50/50"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-800 text-amber-50 shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/90 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Item Description</th>
                <th className="p-3">Pack Details</th>
                <th className="p-3">Pack Price</th>
                <th className="p-3">Calculated Price/Unit</th>
                <th className="p-3">Est. Yield %</th>
                <th className="p-3">Ending Date</th>
                <th className="p-3">Location</th>
                <th className="p-3">Source / Supplier</th>
                <th className="p-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-stone-400 bg-stone-50/50">
                    No items found matching filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 text-amber-950 border border-amber-200">
                        <Tag className="w-2.5 h-2.5 text-amber-700" />
                        {item.category}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-stone-900 text-sm">
                      {item.itemDescription}
                    </td>

                    <td className="p-3 text-stone-600">
                      {item.packType}: {item.packWeight} {item.packUnit}
                    </td>

                    <td className="p-3 font-semibold text-stone-800">
                      {formatCurrency(item.packPrice)}
                    </td>

                    <td className="p-3">
                      <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        {formatCurrency(item.pricePerUnit)} / {item.baseUnit}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-stone-800">
                        {formatPercent(item.estYieldPercent)}
                      </div>
                      <span className="text-[10px] text-stone-400 block">{item.yieldNote}</span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {item.endingDate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <Calendar className="w-3 h-3 text-amber-700 shrink-0" />
                          {item.endingDate}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="p-3">
                      {item.location ? (
                        <span className="inline-flex items-center gap-1 text-stone-700 font-medium text-xs">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="truncate max-w-[130px]" title={item.location}>{item.location}</span>
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="p-3 font-medium">
                      {renderSourceCell(item)}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-400 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-lg">
                {editingItem ? 'Edit Order List Item' : 'Add New Order List Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-xl bg-white font-medium"
                >
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken Fillet (Skinless)"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pack Type</label>
                  <select
                    value={packType}
                    onChange={(e) => setPackType(e.target.value as PackType)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="Pack">Pack</option>
                    <option value="Loose">Loose</option>
                    <option value="Each">Each</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Pack Price (Rand)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={packPrice}
                    onChange={(e) => setPackPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Pack Weight / Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={packWeight}
                    onChange={(e) => setPackWeight(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit</label>
                  <select
                    value={packUnit}
                    onChange={(e) => {
                      const u = e.target.value as PackUnit;
                      setPackUnit(u);
                      setBaseUnit(u === 'each' ? 'each' : 'kg');
                    }}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="g">grams (g)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="each">each / count</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Est. Yield % (e.g. 0.85 = 85%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    required
                    value={estYieldPercent}
                    onChange={(e) => setEstYieldPercent(parseFloat(e.target.value) || 1.0)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Yield Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Cooked loss / trimmed fat"
                    value={yieldNote}
                    onChange={(e) => setYieldNote(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Supplier / Source Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Makro or Checkers Hyper"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-700" />
                    Product URL / Listing Link
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://www.makro.co.za/product/123"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    Special Ending Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endingDate}
                    onChange={(e) => setEndingDate(e.target.value)}
                    className={`w-full p-2 border rounded-xl text-xs bg-white ${
                      endingDate && isDateExpiredOrInvalid(endingDate)
                        ? 'border-red-500 bg-red-50/50 text-red-900'
                        : 'border-stone-300'
                    }`}
                  />
                  {endingDate && isDateExpiredOrInvalid(endingDate) && (
                    <div className="text-[11px] font-semibold text-red-600 mt-1 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                        Expired or invalid date. It will be removed on save.
                      </span>
                      <button
                        type="button"
                        onClick={() => setEndingDate('')}
                        className="text-red-800 underline text-[10px] hover:text-red-950 font-bold"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    Store Location / Branch (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Durban Central or All Stores"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
