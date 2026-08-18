import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Plus,
  Search,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  Shield,
  Phone,
  MessageSquare,
  MessageCircle,
  BadgeDollarSign,
  Trash2,
  Edit2,
  X,
  Lock,
  Sparkles,
  UserCheck,
  Check,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  DEFAULT_PRESET_SUGGESTIONS,
  PresetSuggestion,
  ChefBookingInquiry,
  filterOutIncoherentRecipes,
} from '../data/defaultPresetSuggestions';
import { HireChefModal } from './HireChefModal';
import { ManagerInquiryModal } from './ManagerInquiryModal';
import { ManagerPasswordModal } from './ManagerPasswordModal';

interface CommunityRecipesScreenProps {
  dishName: string;
  setDishName: (name: string) => void;
  accompanimentNames: string[];
  setAccompanimentNames: (names: string[]) => void;
  onNavigateToDishSetup: () => void;
  logoUrl: string;
}

const LOCAL_STORAGE_KEY = 'mafungwase_dish_presets_v3';
const INQUIRIES_STORAGE_KEY = 'mafungwase_chef_inquiries_v1';
const MANAGER_MODE_STORAGE_KEY = 'food_costing_manager_mode';

export const CommunityRecipesScreen: React.FC<CommunityRecipesScreenProps> = ({
  setDishName,
  setAccompanimentNames,
  onNavigateToDishSetup,
}) => {
  // Load Presets
  const loadPresets = (): PresetSuggestion[] => {
    try {
      const saved =
        localStorage.getItem(LOCAL_STORAGE_KEY) ||
        localStorage.getItem('mafungwase_dish_presets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = filterOutIncoherentRecipes(parsed);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
          } catch (e) {
            console.error('Failed to update cleaned presets', e);
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved presets:', e);
    }
    return DEFAULT_PRESET_SUGGESTIONS;
  };

  const [presets, setPresets] = useState<PresetSuggestion[]>(loadPresets);

  // Sync across tabs & storage without triggering loops
  useEffect(() => {
    const handleSync = () => {
      const loaded = loadPresets();
      setPresets((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(loaded)) return prev;
        return loaded;
      });
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('recipes_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('recipes_updated', handleSync);
    };
  }, []);

  // Save presets to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  }, [presets]);

  // Manager Mode
  const [isManagerMode, setIsManagerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MANAGER_MODE_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const toggleManagerMode = () => {
    if (isManagerMode) {
      // Deactivate immediately
      setIsManagerMode(false);
      try {
        localStorage.setItem(MANAGER_MODE_STORAGE_KEY, 'false');
      } catch (e) {
        console.error('Failed to save manager mode', e);
      }
      setToastMessage('Admin Mode deactivated.');
    } else {
      // Require password before enabling
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSuccess = () => {
    setIsManagerMode(true);
    try {
      localStorage.setItem(MANAGER_MODE_STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Failed to save manager mode', e);
    }
    setToastMessage('✓ Admin Mode activated successfully!');
  };

  // Inquiries State
  const loadInquiries = (): ChefBookingInquiry[] => {
    try {
      const saved = localStorage.getItem(INQUIRIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse inquiries:', e);
    }
    return [];
  };

  const [inquiries, setInquiries] = useState<ChefBookingInquiry[]>(loadInquiries);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [hirePreset, setHirePreset] = useState<PresetSuggestion | null>(null);
  const [isManagerInboxOpen, setIsManagerInboxOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Save inquiries
  useEffect(() => {
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
    } catch (e) {
      console.error('Failed to save inquiries:', e);
    }
  }, [inquiries]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterHireOnly, setFilterHireOnly] = useState<boolean>(false);

  // Modal State for Add / Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetSuggestion | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Zulu');
  const [formAccompaniments, setFormAccompaniments] = useState('');
  const [formPreparedBy, setFormPreparedBy] = useState('');
  const [formAvailableToCook, setFormAvailableToCook] = useState<'Yes' | 'No'>('Yes');
  const [formContactDetails, setFormContactDetails] = useState('');
  const [formDayRate, setFormDayRate] = useState('');

  // Categories
  const preferredCategoryOrder = [
    'All',
    'Zulu',
    'Traditional South African',
    'Curries & Stews',
    'Roasts & Grills',
    'Braai & South African',
    'Platters & Finger Food',
    'Street Food & Fast Casual',
    'Seafood Specials',
    'Pasta & Italian',
    'Breakfast & Brunch',
    'Salads & Healthy Bowls',
    'Desserts & Sweet Platters',
  ];

  const presentCategories: string[] = Array.from(
    new Set<string>(presets.map((p) => p.category || 'General'))
  );

  const categories: string[] = [
    'All',
    ...preferredCategoryOrder.filter(
      (cat) => cat !== 'All' && presentCategories.includes(cat)
    ),
    ...presentCategories.filter((cat) => !preferredCategoryOrder.includes(cat)),
  ];

  // Filtered Presets
  const filteredPresets = presets.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.preparedBy && p.preparedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.accompaniments.some((acc) =>
        acc.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;

    const matchesHire = !filterHireOnly || p.availableToCook === 'Yes';

    return matchesSearch && matchesCategory && matchesHire;
  });

  // Open Modal to Add
  const handleOpenAddModal = () => {
    setEditingPreset(null);
    setFormTitle('');
    setFormCategory('Zulu');
    setFormAccompaniments('');
    setFormPreparedBy('');
    setFormAvailableToCook('Yes');
    setFormContactDetails('');
    setFormDayRate('');
    setIsAddModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEditModal = (preset: PresetSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormAccompaniments(preset.accompaniments.join(', '));
    setFormPreparedBy(preset.preparedBy || '');
    setFormAvailableToCook(preset.availableToCook || 'No');
    setFormContactDetails(preset.contactDetails || '');
    setFormDayRate(preset.dayRate || '');
    setIsAddModalOpen(true);
  };

  // Handle Save Recipe & Continue to Costing
  const handleSaveRecipeAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Validate Contact Details & Day Rate if Available For Hire
    if (formAvailableToCook === 'Yes') {
      if (!formContactDetails.trim() || !formDayRate.trim()) {
        return;
      }
    }

    const parsedAccs = formAccompaniments
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedAccs.length === 0) return;

    let targetPresetId = '';

    if (editingPreset) {
      targetPresetId = editingPreset.id;
      setPresets((prev) =>
        prev.map((p) =>
          p.id === editingPreset.id
            ? {
                ...p,
                title: formTitle.trim(),
                category: formCategory.trim() || 'Custom Suggestions',
                accompaniments: parsedAccs,
                preparedBy: formPreparedBy.trim() || undefined,
                availableToCook: formAvailableToCook,
                contactDetails: formContactDetails.trim() || undefined,
                dayRate: formDayRate.trim() || undefined,
              }
            : p
        )
      );
    } else {
      targetPresetId = `custom-preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newPreset: PresetSuggestion = {
        id: targetPresetId,
        title: formTitle.trim(),
        category: formCategory.trim() || 'Custom Suggestions',
        accompaniments: parsedAccs,
        preparedBy: formPreparedBy.trim() || undefined,
        availableToCook: formAvailableToCook,
        contactDetails: formContactDetails.trim() || undefined,
        dayRate: formDayRate.trim() || undefined,
      };
      setPresets((prev) => [newPreset, ...prev]);
    }

    // Populate Dish Name & Accompaniments on Dish Setup page
    setDishName(formTitle.trim());
    setAccompanimentNames(parsedAccs);
    setIsAddModalOpen(false);
    onNavigateToDishSetup();
  };

  // Delete Preset
  const handleDeletePreset = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the recipe "${title}"?`)) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
      setToastMessage(`✓ Recipe "${title}" removed successfully.`);
    }
  };

  // Reset to Defaults (Manager only option)
  const handleResetDefaults = () => {
    if (confirm('Reset all recipe suggestions back to default recipes?')) {
      setPresets(DEFAULT_PRESET_SUGGESTIONS);
      setToastMessage('✓ Reset to default recipes.');
    }
  };

  // Use preset directly in Dish Setup
  const handleSelectPreset = (preset: PresetSuggestion) => {
    setDishName(preset.title);
    setAccompanimentNames(preset.accompaniments);
    onNavigateToDishSetup();
  };

  // Open Hire modal
  const handleOpenHireModal = (preset: PresetSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setHirePreset(preset);
    setIsHireModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-bounce text-sm font-bold">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner with CTA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B3B28] via-[#0E4933] to-[#06261A] text-white px-6 py-5 sm:px-8 sm:py-6 shadow-xl border border-emerald-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left / Heading Info */}
          <div className="max-w-2xl space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Our Community Recipes
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              A place where first borns share delicious recipes and profitable food business ideas.
            </p>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm sm:text-base whitespace-nowrap"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                <span>Add And Cost Your Own Recipe</span>
              </button>
              <a
                href="https://wa.me/0603628760"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
                title="Chat with us on WhatsApp (+27 60 362 8760)"
                aria-label="WhatsApp Contact"
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleManagerMode}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border cursor-pointer ${
                  isManagerMode
                    ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md'
                    : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 border-emerald-700/60'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>{isManagerMode ? '✓ Admin Mode: ON (Viewing Contacts)' : 'Admin Mode (Protected)'}</span>
              </button>

              {isManagerMode && (
                <button
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 shadow-md cursor-pointer transition-all"
                  title="Restore default recipe presets"
                >
                  <RotateCcw className="w-3 h-3 text-stone-400" />
                  <span>Reset Defaults</span>
                </button>
              )}

              {isManagerMode && inquiries.length > 0 && (
                <button
                  onClick={() => setIsManagerInboxOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-stone-900 text-amber-300 border border-amber-500/50 shadow-md cursor-pointer hover:bg-black"
                >
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  <span>Client Inquiries ({inquiries.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <UtensilsCrossed className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search recipes, cooks, or accompaniments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setFilterHireOnly(!filterHireOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border cursor-pointer ${
                filterHireOnly
                  ? 'bg-emerald-800 text-white border-emerald-700 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Available for Hire Only</span>
            </button>

            <span className="text-xs font-bold text-stone-500">
              Showing {filteredPresets.length} recipes
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredPresets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300 space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-stone-800">No community recipes found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto font-medium">
            We couldn't find any recipes matching your search criteria. Try a different query or add your own custom recipe.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Recipe</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPresets.map((preset) => {
            const isCustom = !preset.id.startsWith('preset-');
            return (
              <div
                key={preset.id}
                className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3.5">
                  {/* Header Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-lg text-[10px] font-bold tracking-wide">
                      {preset.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {preset.availableToCook === 'Yes' && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-700" />
                          <span>For Hire</span>
                        </span>
                      )}

                      {/* Edit & Delete Actions: Always available to Manager, or for custom recipes */}
                      {(isCustom || isManagerMode) && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEditModal(preset, e)}
                            title="Edit recipe"
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePreset(preset.id, preset.title, e)}
                            title={isManagerMode ? "Delete recipe (Manager)" : "Delete recipe"}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dish Title */}
                  <h3 className="text-base font-black text-stone-900 leading-snug group-hover:text-emerald-900 transition-colors">
                    {preset.title}
                  </h3>

                  {/* Cook & Rate Information */}
                  {preset.preparedBy && (
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-extrabold text-stone-800">
                        <span className="flex items-center gap-1.5">
                          <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{preset.preparedBy}</span>
                        </span>
                        {preset.dayRate && (
                          <span className="text-emerald-800 font-black text-[11px] bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            {preset.dayRate}
                          </span>
                        )}
                      </div>

                      {/* Admin Contact Details (Only visible in Manager Mode) */}
                      {isManagerMode ? (
                        <div className="pt-1.5 border-t border-stone-200/60 text-[11px] flex items-center justify-between text-amber-900 bg-amber-50/80 p-1.5 rounded-lg">
                          <span className="font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-700" />
                            {preset.contactDetails || 'No contact provided'}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase bg-amber-200 px-1.5 py-0.5 rounded text-amber-950">
                            Admin View
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium pt-0.5">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-600" />
                            Contact protected
                          </span>
                          <span className="text-amber-800/80 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                            Admin Only
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accompaniments List */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">
                      Accompaniments ({preset.accompaniments.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {preset.accompaniments.map((acc, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-stone-100 text-stone-700 text-[11px] font-medium rounded-lg"
                        >
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center gap-2">
                  <button
                    onClick={() => handleSelectPreset(preset)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <span>Use In Dish Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {preset.availableToCook === 'Yes' && (
                    <button
                      onClick={(e) => handleOpenHireModal(preset, e)}
                      title="Hire this cook for your event"
                      className="px-3 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black rounded-xl transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                      <span>Hire Cook</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Recipe Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B3B28] text-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto border-2 border-emerald-900">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/80">
              <div className="flex items-center gap-2 text-white">
                <div className="w-7 h-7 bg-amber-400/20 border border-amber-400/30 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-white">
                  {editingPreset ? 'Edit Recipe' : 'Add Custom Recipe'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-[#06261A] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipeAndContinue} className="space-y-4 text-xs">
              {/* Dish / Menu Title */}
              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Dish / Menu Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Sunday Roast Platter or Inyama Yenhloko Feast"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-bold text-white placeholder:text-emerald-400/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="Custom Suggestions"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white placeholder:text-emerald-400/50"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Zulu',
                    'Traditional South African',
                    'Curries & Stews',
                    'Roasts & Grills',
                    'Braai & South African',
                    'Platters & Finger Food',
                    'Street Food & Fast Casual',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        formCategory === cat
                          ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold shadow-xs'
                          : 'bg-[#06261A] text-emerald-200 border border-emerald-800/80 hover:bg-emerald-900/80'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accompaniments */}
              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Accompaniments (comma or new-line separated) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Steamed Basmati Rice, Butter Bean Curry, Sambal, Naan Bread, Yoghurt Sauce"
                  value={formAccompaniments}
                  onChange={(e) => setFormAccompaniments(e.target.value)}
                  className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-medium text-white placeholder:text-emerald-400/50"
                />
                <p className="text-[11px] text-emerald-300/80 mt-1 font-medium">
                  Type each side dish or accompaniment separated by a comma or on a new line.
                </p>
              </div>

              {/* Shield / Admin Privacy Banner */}
              <div className="p-3 bg-[#06261A] rounded-2xl border border-amber-500/50 flex items-center justify-between gap-2.5 text-xs text-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-white text-xs">
                      Cook & Catering Details
                    </span>
                    <span className="text-[11px] text-amber-200/90 font-medium">
                      Contact details are strictly protected and visible to Admin only.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-amber-200 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/40 shrink-0">
                  Visible to Admin Only
                </span>
              </div>

              {/* Prepared By & Available to Cook */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                <div>
                  <label className="block font-extrabold text-emerald-100 mb-1">
                    Prepared by (Nickname)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chef Sis Gugu, Mama Dlamini"
                    value={formPreparedBy}
                    onChange={(e) => setFormPreparedBy(e.target.value)}
                    className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white placeholder:text-emerald-400/50"
                  />
                  <span className="text-[10px] text-emerald-300/80 font-medium">
                    Display name for recipe and catering inquiries
                  </span>
                </div>

                <div>
                  <label className="block font-extrabold text-emerald-100 mb-1">
                    Available To Cook For You
                  </label>
                  <select
                    value={formAvailableToCook}
                    onChange={(e) =>
                      setFormAvailableToCook(e.target.value as 'Yes' | 'No')
                    }
                    className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-bold text-white cursor-pointer"
                  >
                    <option value="Yes" className="bg-[#06261A] text-white">Yes (Available for Hire / Events)</option>
                    <option value="No" className="bg-[#06261A] text-white">No (Recipe Only / Not for Hire)</option>
                  </select>
                  <span className="text-[10px] text-emerald-300/80 font-medium">
                    Allow clients to send hiring requests
                  </span>
                </div>
              </div>

              {/* Contact Details & Day Rate (Conditional Mandatory) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-emerald-100 mb-1 flex items-center justify-between">
                    <span>
                      Contact Details {formAvailableToCook === 'Yes' ? <span className="text-amber-300 font-black">*</span> : <span className="text-emerald-300/60 font-normal text-xs">(Optional)</span>}
                    </span>
                    <span className="text-[9px] text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded-md">
                      Visible to Admin Only
                    </span>
                  </label>
                  <input
                    type="text"
                    required={formAvailableToCook === 'Yes'}
                    placeholder={
                      formAvailableToCook === 'Yes'
                        ? 'e.g. +27 82 123 4567 / cook@email.com *'
                        : 'Optional (Not for hire)'
                    }
                    value={formContactDetails}
                    onChange={(e) => setFormContactDetails(e.target.value)}
                    className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white placeholder:text-emerald-400/50"
                  />
                  <span className="text-[10px] text-emerald-300/80 font-medium flex items-center gap-1 mt-0.5">
                    <Lock className="w-2.5 h-2.5 text-amber-300" />
                    Strictly protected & visible only to Admin
                  </span>
                </div>

                <div>
                  <label className="block font-extrabold text-emerald-100 mb-1">
                    Day Rate {formAvailableToCook === 'Yes' ? <span className="text-amber-300 font-black">*</span> : <span className="text-emerald-300/60 font-normal text-xs">(Optional)</span>}
                  </label>
                  <input
                    type="text"
                    required={formAvailableToCook === 'Yes'}
                    placeholder={
                      formAvailableToCook === 'Yes'
                        ? 'e.g. R1,500 / day (or Negotiable) *'
                        : 'Optional (Not for hire)'
                    }
                    value={formDayRate}
                    onChange={(e) => setFormDayRate(e.target.value)}
                    className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white placeholder:text-emerald-400/50"
                  />
                  <span className="text-[10px] text-emerald-300/80 font-medium">
                    {formAvailableToCook === 'Yes'
                      ? 'Required for caterer profile (events, weddings, parties)'
                      : 'Not required when not available for hire'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-900/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-emerald-200 hover:text-white hover:bg-[#06261A] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 font-black text-black bg-[#fbf304] hover:bg-yellow-300 border-2 border-black rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  <span>Continue To Costing</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hire Cook / Inquiry Modal */}
      {hirePreset && (
        <HireChefModal
          isOpen={isHireModalOpen}
          onClose={() => setIsHireModalOpen(false)}
          preset={hirePreset}
          onSubmitInquiry={(inquiryData) => {
            const newInq: ChefBookingInquiry = {
              id: `inq-${Date.now()}`,
              dishTitle: hirePreset.title,
              preparedBy: hirePreset.preparedBy || 'Community Cook',
              chefContact: hirePreset.contactDetails || 'Protected Admin Contact',
              dayRate: hirePreset.dayRate,
              clientName: inquiryData.clientName,
              clientContact: inquiryData.clientContact,
              clientEmail: inquiryData.clientEmail,
              eventType: inquiryData.eventType,
              eventDate: inquiryData.eventDate,
              guestCount: inquiryData.guestCount,
              location: inquiryData.location,
              message: inquiryData.message,
              createdAt: new Date().toISOString(),
              status: 'Pending',
            };
            setInquiries((prev) => [newInq, ...prev]);
            setToastMessage(`✓ Booking inquiry sent for ${hirePreset.preparedBy}!`);
          }}
        />
      )}

      {/* Manager Inquiries Inbox Modal */}
      <ManagerInquiryModal
        isOpen={isManagerInboxOpen}
        onClose={() => setIsManagerInboxOpen(false)}
        inquiries={inquiries}
        onUpdateStatus={(id, status) => {
          setInquiries((prev) =>
            prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
          );
        }}
        onDeleteInquiry={(id) => {
          setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        }}
      />

      {/* App Manager Password Authentication Modal */}
      <ManagerPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};
