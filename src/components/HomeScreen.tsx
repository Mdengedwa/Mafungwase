import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  ArrowRight,
  Plus,
  X,
  Sparkles,
  UtensilsCrossed,
  Search,
  FolderPlus,
  Trash2,
  Edit2,
  RotateCcw,
  Upload,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  DEFAULT_PRESET_SUGGESTIONS,
  PresetSuggestion,
} from '../data/defaultPresetSuggestions';

interface HomeScreenProps {
  dishName: string;
  setDishName: (name: string) => void;
  accompanimentNames: string[];
  setAccompanimentNames: (names: string[]) => void;
  onContinue: () => void;
  logoUrl: string;
}

const LOCAL_STORAGE_KEY = 'mafungwase_dish_presets_v2';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  dishName,
  setDishName,
  accompanimentNames,
  setAccompanimentNames,
  onContinue,
  logoUrl,
}) => {
  const [newAccInput, setNewAccInput] = useState('');

  // Presets State
  const [presets, setPresets] = useState<PresetSuggestion[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved presets:', e);
    }
    return DEFAULT_PRESET_SUGGESTIONS;
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [displayLimit, setDisplayLimit] = useState<number>(12);

  // Selected Preset Highlight State
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetSuggestion | null>(null);

  // Form State for Add / Edit Preset
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formAccompaniments, setFormAccompaniments] = useState('');

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');

  // Save presets to LocalStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  }, [presets]);

  // Extract unique categories
  const categories = [
    'All',
    ...Array.from(new Set(presets.map((p) => p.category || 'General'))),
  ];

  // Filtered Presets
  const filteredPresets = presets.filter((p) => {
    const matchesCat =
      selectedCategory === 'All' || p.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.accompaniments.some((acc) => acc.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  const handleAddAccompaniment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newAccInput.trim();
    if (trimmed && !accompanimentNames.includes(trimmed)) {
      setAccompanimentNames([...accompanimentNames, trimmed]);
      setNewAccInput('');
    }
  };

  const handleRemoveAccompaniment = (index: number) => {
    setAccompanimentNames(accompanimentNames.filter((_, i) => i !== index));
  };

  const handleLoadPreset = (preset: PresetSuggestion) => {
    setDishName(preset.title);
    setAccompanimentNames([...preset.accompaniments]);
    setSelectedPresetId(preset.id);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingPreset(null);
    setFormTitle('');
    setFormCategory('Custom Suggestions');
    setFormAccompaniments('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (preset: PresetSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setFormTitle(preset.title);
    setFormCategory(preset.category || 'Custom Suggestions');
    setFormAccompaniments(preset.accompaniments.join(', '));
    setIsAddModalOpen(true);
  };

  // Save Add or Edit Preset
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedAccs = formAccompaniments
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedAccs.length === 0) return;

    if (editingPreset) {
      setPresets((prev) =>
        prev.map((p) =>
          p.id === editingPreset.id
            ? {
                ...p,
                title: formTitle.trim(),
                category: formCategory.trim() || 'Custom Suggestions',
                accompaniments: parsedAccs,
              }
            : p
        )
      );
    } else {
      const newPreset: PresetSuggestion = {
        id: `custom-preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim(),
        category: formCategory.trim() || 'Custom Suggestions',
        accompaniments: parsedAccs,
        isCustom: true,
      };
      setPresets((prev) => [newPreset, ...prev]);
    }

    setIsAddModalOpen(false);
  };

  // Delete Preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this dish suggestion?')) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Reset to Default Suggestions
  const handleResetDefaults = () => {
    if (
      confirm(
        'Reset preset suggestions back to the default 50 catering menu suggestions?'
      )
    ) {
      setPresets(DEFAULT_PRESET_SUGGESTIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Bulk Import Suggestions
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const imported: PresetSuggestion[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/[:|-]/);
      if (parts.length >= 2) {
        const title = parts[0].trim();
        const accsStr = parts.slice(1).join(' ');
        const accompaniments = accsStr
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a.length > 0);

        if (title && accompaniments.length > 0) {
          imported.push({
            id: `bulk-${Date.now()}-${idx}`,
            title,
            category: 'My Custom Suggestions',
            accompaniments,
            isCustom: true,
          });
        }
      } else {
        const title = line.trim();
        imported.push({
          id: `bulk-${Date.now()}-${idx}`,
          title,
          category: 'My Custom Suggestions',
          accompaniments: [title],
          isCustom: true,
        });
      }
    });

    if (imported.length > 0) {
      setPresets((prev) => [...imported, ...prev]);
      setBulkText('');
      setIsBulkModalOpen(false);
      alert(`Successfully added ${imported.length} new dish suggestions!`);
    } else {
      alert(
        'Could not parse suggestions. Please ensure lines are formatted as: "Dish Title: item1, item2, item3"'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Warm Greeting & Splash Branding Card */}
      <div className="bg-gradient-to-br from-[#0B3B28] via-[#0F5132] to-[#07291C] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border-2 border-black">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <ChefHat className="w-64 h-64 text-emerald-200" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-800/50 rounded-2xl border border-emerald-600/40 backdrop-blur-xs shadow-inner">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-xs font-extrabold text-emerald-300 tracking-wider">
                Cell: +27 60 362 8760
              </span>
              <p className="text-xs text-emerald-100/80">
                Professional Costing & Quote Generator
              </p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Selling Food For Profit
          </h2>
          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed font-normal">
            Cost each recipe accompaniment, assemble balanced plated meals with waste/yield factors, and generate instant client quotations.
          </p>
        </div>
      </div>

      {/* Step 1 Card: Dish Identification */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-3">
        <label className="block text-stone-900 text-base sm:text-lg font-extrabold flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs shadow-2xs">
            1
          </span>
          What dish or plated meal are we preparing today?
        </label>
        <p className="text-xs text-stone-500 ml-9">
          Enter the overall dish or catering menu name (e.g., "Buffet Lunch Platter", "Sunday Roast", "Chicken & Curry Meal")
        </p>
        <div className="ml-9">
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="e.g. Durban Curry & Rice Platter"
            className="w-full px-4 py-3.5 text-base font-semibold border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-emerald-50/20 text-stone-900"
          />
        </div>
      </div>

      {/* Step 2 Card: Accompaniment List */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-4">
        <label className="block text-stone-900 text-base sm:text-lg font-extrabold flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs shadow-2xs">
            2
          </span>
          List your meal accompaniments
        </label>
        <p className="text-xs text-stone-500 ml-9">
          Type each accompaniment or side dish that makes up this meal (e.g., rice, curry, salad, sauce, packaging)
        </p>

        <div className="ml-9 space-y-4">
          {/* Input Row */}
          <form onSubmit={handleAddAccompaniment} className="flex gap-2.5">
            <input
              type="text"
              value={newAccInput}
              onChange={(e) => setNewAccInput(e.target.value)}
              placeholder="Type accompaniment name (e.g. Butter Bean Curry)..."
              className="flex-1 px-4 py-3 text-sm border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 bg-white font-medium"
            />
            <button
              type="submit"
              disabled={!newAccInput.trim()}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Accompaniment
            </button>
          </form>

          {/* Added Accompaniment Tags */}
          {accompanimentNames.length > 0 ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-xs ${
                selectedPresetId
                  ? 'bg-gradient-to-r from-[#07291C] via-[#0D442C] to-[#07291C] text-white border-black ring-2 ring-emerald-500/30'
                  : 'bg-emerald-50/90 border-emerald-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-200/20">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider ${
                      selectedPresetId ? 'text-emerald-300' : 'text-emerald-950'
                    }`}
                  >
                    {accompanimentNames.length} Accompaniment
                    {accompanimentNames.length > 1 ? 's' : ''} Listed
                  </span>
                  {selectedPresetId && (
                    <span className="px-2.5 py-0.5 text-[10px] font-black text-emerald-950 bg-emerald-400 border border-emerald-300 rounded-full flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3 text-emerald-950 fill-emerald-950" />
                      Loaded From Preset
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAccompanimentNames([]);
                    setSelectedPresetId(null);
                  }}
                  className={`text-[11px] font-bold transition-colors ${
                    selectedPresetId
                      ? 'text-emerald-300 hover:text-red-300'
                      : 'text-stone-500 hover:text-red-600'
                  }`}
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {accompanimentNames.map((name, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 font-black text-xs sm:text-sm rounded-xl border-2 shadow-xs group transition-all ${
                      selectedPresetId
                        ? 'bg-emerald-400 text-emerald-950 border-black font-black'
                        : 'bg-emerald-800 text-white border-emerald-950 font-bold'
                    }`}
                  >
                    <UtensilsCrossed
                      className={`w-3.5 h-3.5 ${
                        selectedPresetId ? 'text-emerald-950' : 'text-emerald-200'
                      }`}
                    />
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAccompaniment(idx)}
                      className={`p-0.5 rounded-lg transition-colors ${
                        selectedPresetId
                          ? 'text-emerald-950 hover:text-red-900 hover:bg-emerald-300'
                          : 'text-emerald-200 hover:text-white hover:bg-emerald-700'
                      }`}
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-stone-50/80 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500">
              <p className="text-xs font-semibold">No accompaniments added yet.</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Type an item above or select a preset menu below.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Catering Presets Card - Custom Suggestions Enabled */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-4">
        {/* Presets Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Dish Suggestion Library ({presets.length})
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 border border-emerald-200 rounded-full">
                {presets.length} Presets Available
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Select any dish suggestion to load its accompaniments or add your own custom menus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Suggestion
            </button>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-all"
              title="Bulk import or paste dish suggestions"
            >
              <Upload className="w-3.5 h-3.5 text-stone-600" />
              Import
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
              title="Reset suggestions to default 50 catering menus"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 50+ dish suggestions by title or ingredient (e.g. Curry, Roast, Samp, Burger)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-stone-50/50 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? presets.length
                  : presets.filter((p) => p.category === cat).length;
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setDisplayLimit(12);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] flex items-center gap-1 ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-100/80 hover:bg-stone-200/80 text-stone-600 border border-stone-200/60'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-100'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Presets Grid */}
        {filteredPresets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPresets.slice(0, displayLimit).map((p) => {
                const isSelected =
                  selectedPresetId === p.id ||
                  (dishName === p.title &&
                    accompanimentNames.length > 0 &&
                    accompanimentNames.every((acc) =>
                      p.accompaniments.includes(acc)
                    ));

                return (
                  <div
                    key={p.id}
                    onClick={() => handleLoadPreset(p)}
                    className={`group relative text-left p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between border-2 ${
                      isSelected
                        ? 'bg-emerald-100/90 border-emerald-800 ring-4 ring-emerald-500/20 shadow-md scale-[1.01]'
                        : 'bg-white hover:bg-emerald-50/80 border-black shadow-2xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div
                          className={`text-xs font-extrabold transition-colors line-clamp-2 pr-6 ${
                            isSelected
                              ? 'text-emerald-950 font-black'
                              : 'text-stone-900 group-hover:text-emerald-950'
                          }`}
                        >
                          {p.title}
                        </div>
                        {isSelected && (
                          <span className="absolute right-2.5 top-2.5 px-2 py-0.5 text-[9px] font-black text-white bg-emerald-800 border border-emerald-900 rounded-full flex items-center gap-1 shadow-2xs">
                            <Check className="w-3 h-3 text-white" /> ACTIVE
                          </span>
                        )}
                        <div
                          className={`absolute ${
                            isSelected ? 'right-16' : 'right-3'
                          } top-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          <button
                            type="button"
                            onClick={(e) => openEditModal(p, e)}
                            className="p-1 text-stone-500 hover:text-emerald-800 hover:bg-emerald-200/60 rounded-md transition-colors"
                            title="Edit Suggestion"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePreset(p.id, e)}
                            className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-100/60 rounded-md transition-colors"
                            title="Delete Suggestion"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wider mb-2">
                        {p.category}
                      </div>
                      <p className="text-[11px] text-stone-600 font-medium line-clamp-3 leading-snug">
                        {p.accompaniments.join(', ')}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] text-emerald-800 font-extrabold">
                      <span>{p.accompaniments.length} Accompaniments</span>
                      <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-emerald-700 font-extrabold">
                        {isSelected ? 'Loaded ✓' : 'Load Menu \u2192'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {filteredPresets.length > displayLimit && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 12)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-emerald-900 bg-emerald-100/60 hover:bg-emerald-100 border border-emerald-300/80 rounded-2xl transition-all shadow-2xs"
                >
                  <span>Show More Dish Suggestions ({filteredPresets.length - displayLimit} remaining)</span>
                  <ChevronDown className="w-4 h-4 text-emerald-800" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-stone-500">
            <p className="text-xs font-bold text-stone-700">No dish suggestions found.</p>
            <p className="text-[11px] text-stone-400 mt-1 mb-3">
              Try adjusting your search query or add a new custom suggestion!
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Suggestion
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-black shadow-2xs flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={!dishName.trim() || accompanimentNames.length === 0}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-md transition-all transform active:scale-98"
        >
          <span>Proceed to Accompaniment Calculators</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add / Edit Dish Suggestion Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border-2 border-black shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-700" />
                {editingPreset ? 'Edit Dish Suggestion' : 'Add Custom Dish Suggestion'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Dish / Menu Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Sunday Roast Platter"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Curries & Stews, Roasts, Braai, Platters"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none font-medium text-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Accompaniments (comma or new-line separated) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Steamed Basmati Rice, Butter Bean Curry, Sambal, Naan Bread, Yoghurt Sauce"
                  value={formAccompaniments}
                  onChange={(e) => setFormAccompaniments(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-600 focus:outline-none font-medium text-stone-800"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Type each side dish or accompaniment separated by a comma or on a new line.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Save Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border-2 border-black shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-700" />
                Bulk Import Dish Suggestions
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              <p className="text-stone-600 leading-relaxed">
                Paste 10, 30, or 60+ of your own meal suggestions below. Format each line as:
                <br />
                <code className="text-[11px] bg-stone-100 px-2 py-1 rounded text-emerald-900 font-mono block my-1">
                  Dish Title: Accompaniment 1, Accompaniment 2, Accompaniment 3
                </code>
              </p>

              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`e.g.\nCape Malay Bobotie Platter: Yellow Rice, Baked Bobotie, Chutney, Sambal\nGreek Gyros Plate: Pita Bread, Grilled Chicken, Tzatziki, Greek Salad, Fries`}
                className="w-full p-3 border border-stone-300 rounded-2xl focus:border-emerald-600 focus:outline-none font-mono text-xs text-stone-800"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bulkText.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Import Suggestions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
