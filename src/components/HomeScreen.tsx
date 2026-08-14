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
  ShieldCheck,
  Shield,
  Lock,
  Phone,
  MessageSquare,
  BadgeDollarSign,
  UserCheck,
} from 'lucide-react';
import {
  DEFAULT_PRESET_SUGGESTIONS,
  PresetSuggestion,
  ChefBookingInquiry,
} from '../data/defaultPresetSuggestions';
import { HireChefModal } from './HireChefModal';
import { ManagerInquiryModal } from './ManagerInquiryModal';
import { ManagerPasswordModal } from './ManagerPasswordModal';
import feastBg from '../assets/images/delicious_feast_bg_1786711697332.jpg';

interface HomeScreenProps {
  dishName: string;
  setDishName: (name: string) => void;
  accompanimentNames: string[];
  setAccompanimentNames: (names: string[]) => void;
  onContinue: () => void;
  logoUrl: string;
}

const LOCAL_STORAGE_KEY = 'mafungwase_dish_presets_v3';
const INQUIRIES_STORAGE_KEY = 'mafungwase_chef_inquiries_v1';
const MANAGER_MODE_STORAGE_KEY = 'food_costing_manager_mode';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  dishName,
  setDishName,
  accompanimentNames,
  setAccompanimentNames,
  onContinue,
}) => {
  const [newAccInput, setNewAccInput] = useState('');

  // App Manager Mode State (persisted)
  const [isManagerMode, setIsManagerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MANAGER_MODE_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const toggleManagerMode = () => {
    if (isManagerMode) {
      // Turn off directly
      setIsManagerMode(false);
      try {
        localStorage.setItem(MANAGER_MODE_STORAGE_KEY, 'false');
      } catch (e) {
        console.error('Failed to save manager mode', e);
      }
      setToastMessage('App Manager Mode deactivated.');
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
    setToastMessage('✓ App Manager Mode activated successfully!');
  };

  // Booking Inquiries State
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
    // Default sample inquiries for instant manager testing
    return [
      {
        id: 'inq-sample-1',
        dishTitle: 'Inyama Yenhloko & Ujeqe Feast',
        preparedBy: 'Mama Gugu (Durban Central)',
        chefContact: '+27 82 459 8120',
        dayRate: 'R1,400 / day',
        clientName: 'Siphamandla Dube',
        clientContact: '083 711 9022',
        clientEmail: 'sdube@gmail.com',
        eventType: 'Wedding Reception',
        eventDate: '2026-11-14',
        guestCount: 150,
        location: 'Durban North, KZN',
        message:
          'Sanibona Mama Gugu, we are having our traditional wedding ceremony and reception in November and would love you to prepare the Ujeqe & Inyama Yenhloko feast for 150 guests.',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        status: 'Pending',
      },
      {
        id: 'inq-sample-2',
        dishTitle: 'Cape Malay Bobotie & Fragrant Geelrys',
        preparedBy: 'Auntie Fatima (Bo-Kaap)',
        chefContact: '+27 83 234 5678',
        dayRate: 'R1,800 / day',
        clientName: 'Claire Van Der Merwe',
        clientContact: '072 445 8891',
        clientEmail: 'claire.vdm@outlook.com',
        eventType: 'Birthday Celebration',
        eventDate: '2026-09-05',
        guestCount: 40,
        location: 'Camps Bay, Cape Town',
        message:
          'Hi Auntie Fatima, hosting a 50th birthday dinner with authentic Cape Malay flavours. Looking for full dinner catering for 40 guests.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'Contacted',
      },
    ];
  };

  const [inquiries, setInquiries] = useState<ChefBookingInquiry[]>(loadInquiries);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [hirePreset, setHirePreset] = useState<PresetSuggestion | null>(null);
  const [isManagerInboxOpen, setIsManagerInboxOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Save inquiries whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
    } catch (e) {
      console.error('Failed to save inquiries:', e);
    }
  }, [inquiries]);

  // Presets State
  const loadPresets = (): PresetSuggestion[] => {
    try {
      const saved =
        localStorage.getItem(LOCAL_STORAGE_KEY) ||
        localStorage.getItem('mafungwase_dish_presets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved presets:', e);
    }
    return DEFAULT_PRESET_SUGGESTIONS;
  };

  const [presets, setPresets] = useState<PresetSuggestion[]>(loadPresets);

  // Listen for storage and recipe updates across screens
  useEffect(() => {
    const handleSync = () => {
      setPresets(loadPresets());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('recipes_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('recipes_updated', handleSync);
    };
  }, []);

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

  // Form State for Add / Edit Preset (including 4 requested fields)
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Zulu');
  const [formAccompaniments, setFormAccompaniments] = useState('');
  const [formPreparedBy, setFormPreparedBy] = useState('');
  const [formAvailableToCook, setFormAvailableToCook] = useState<'Yes' | 'No'>('Yes');
  const [formContactDetails, setFormContactDetails] = useState('');
  const [formDayRate, setFormDayRate] = useState('');

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

  // Extract unique categories in clear prioritized order
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
    const matchesCat =
      selectedCategory === 'All' || p.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.preparedBy && p.preparedBy.toLowerCase().includes(query)) ||
      (p.dayRate && p.dayRate.toLowerCase().includes(query)) ||
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
    setFormPreparedBy('');
    setFormAvailableToCook('Yes');
    setFormContactDetails('');
    setFormDayRate('R1,500 / day');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (preset: PresetSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setFormTitle(preset.title);
    setFormCategory(preset.category || 'Custom Suggestions');
    setFormAccompaniments(preset.accompaniments.join(', '));
    setFormPreparedBy(preset.preparedBy || '');
    setFormAvailableToCook(preset.availableToCook || 'Yes');
    setFormContactDetails(preset.contactDetails || '');
    setFormDayRate(preset.dayRate || '');
    setIsAddModalOpen(true);
  };

  // Open Hire / Leave Message Modal
  const openHireModal = (preset: PresetSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setHirePreset(preset);
    setIsHireModalOpen(true);
  };

  // Inquiry Submission Handler
  const handleInquirySubmitted = (newInquiry: ChefBookingInquiry) => {
    setInquiries((prev) => [newInquiry, ...prev]);
    setToastMessage(`✓ Inquiry sent for ${newInquiry.preparedBy}! Our App Manager will coordinate your booking.`);
  };

  // Inquiry Status Handler
  const handleUpdateInquiryStatus = (
    id: string,
    newStatus: 'Pending' | 'Contacted' | 'Booked' | 'Declined'
  ) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
    );
  };

  // Delete Inquiry
  const handleDeleteInquiry = (id: string) => {
    if (confirm('Delete this booking inquiry record?')) {
      setInquiries((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Save Add or Edit Preset
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // If available for hire, contact details and day rate are required
    if (formAvailableToCook === 'Yes') {
      if (!formContactDetails.trim() || !formDayRate.trim()) {
        return;
      }
    }

    const parsedAccs = formAccompaniments
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

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
        isCustom: true,
      };
      setPresets((prev) => [newPreset, ...prev]);
    }

    // Populate Dish Name & Accompaniments on the Dish Setup page
    setDishName(formTitle.trim());
    setAccompanimentNames(parsedAccs);
    setSelectedPresetId(targetPresetId);
    setIsAddModalOpen(false);
    setToastMessage(`✓ Dish "${formTitle.trim()}" loaded into Dish Setup with ${parsedAccs.length} accompaniments!`);

    // Smooth scroll down to the Dish Setup section so the user sees it populated
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
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
        'Reset preset suggestions back to the default catering menu suggestions?'
      )
    ) {
      setPresets(DEFAULT_PRESET_SUGGESTIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setToastMessage('Reset to default catering recipes.');
    }
  };

  // Bulk Import Suggestions
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const imported: PresetSuggestion[] = [];

    lines.forEach((line, idx) => {
      if (line.includes(':')) {
        const [titlePart, accPart] = line.split(':');
        if (titlePart && accPart) {
          const accs = accPart
            .split(',')
            .map((a) => a.trim())
            .filter((a) => a.length > 0);
          if (accs.length > 0) {
            imported.push({
              id: `imported-${Date.now()}-${idx}`,
              title: titlePart.trim(),
              category: 'Imported Menus',
              accompaniments: accs,
              isCustom: true,
              availableToCook: 'Yes',
              dayRate: 'R1,500 / day',
            });
          }
        }
      }
    });

    if (imported.length > 0) {
      setPresets((prev) => [...imported, ...prev]);
      setIsBulkModalOpen(false);
      setBulkText('');
      setToastMessage(`✓ Imported ${imported.length} recipes!`);
    } else {
      alert('Could not detect any valid recipes in the format "Dish Name: Accompaniment 1, Accompaniment 2"');
    }
  };

  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'Pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Dish Setup Banner */}
      <div
        style={{
          backgroundColor: '#fbf304',
          fontFamily: "'Futura', 'Futura PT', 'Futura-Medium', 'Futura-Bold', 'Jost', 'Century Gothic', -apple-system, sans-serif",
        }}
        className="font-futura rounded-3xl p-6 sm:p-8 border-2 border-black shadow-md space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-black/15">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-black text-[#fbf304] border border-black shadow-xs">
              <ChefHat className="w-3.5 h-3.5 text-[#fbf304]" />
              Step 1 of 4 • Recipe & Menu Setup
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight drop-shadow-xs">
              Catering Dish & Accompaniment Builder
            </h1>
            <p className="text-xs sm:text-sm text-stone-900 font-bold">
              Cost individual accompaniments, hire authentic local cooks for events, and assemble precise client quotes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* App Manager Mode Switch */}
            <button
              type="button"
              onClick={toggleManagerMode}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border-2 ${
                isManagerMode
                  ? 'bg-black text-[#fbf304] border-black shadow-md ring-2 ring-black/20'
                  : 'bg-white text-stone-950 hover:bg-stone-100 border-black shadow-xs'
              }`}
              title="Toggle App Manager mode to view full contact numbers and manage booking inquiries"
            >
              {isManagerMode ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#fbf304]" />
                  <span>App Manager Mode: ON</span>
                  <span className="w-2 h-2 rounded-full bg-[#fbf304] animate-ping"></span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-stone-700" />
                  <span>Manager Mode (Off)</span>
                </>
              )}
            </button>

            {/* Manager Inquiries Inbox Button (Visible when Manager mode is active or inquiries exist) */}
            {isManagerMode && (
              <button
                type="button"
                onClick={() => setIsManagerInboxOpen(true)}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-stone-900 text-white hover:bg-black transition-all shadow-md cursor-pointer border border-stone-700"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Booking Inquiries</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-stone-950">
                  {inquiries.length}
                </span>
                {pendingInquiriesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce shadow-xs">
                    {pendingInquiriesCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Manager Mode Banner */}
        {isManagerMode && (
          <div className="p-3.5 bg-black/90 text-white rounded-2xl border-2 border-black flex items-center justify-between gap-3 text-xs shadow-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#fbf304] shrink-0" />
              <div>
                <span className="font-black text-[#fbf304] block">
                  🛡️ App Manager Mode Active
                </span>
                <span className="text-[11px] text-stone-200 font-medium">
                  Full unmasked phone numbers, email details, and client booking requests are unlocked.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsManagerInboxOpen(true)}
              className="px-3 py-1 text-[11px] font-black text-black bg-[#fbf304] hover:bg-yellow-300 border border-black rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Open Inbox ({inquiries.length})
            </button>
          </div>
        )}

        {/* Main Dish Name Input */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-black uppercase tracking-wider">
            Main Dish / Event Menu Title
          </label>
          <div className="relative">
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g. Traditional Durban Curry Platter or Inyama Yenhloko Feast"
              className="w-full text-base sm:text-lg font-black text-black bg-white border-2 border-black rounded-2xl px-4 py-3.5 focus:border-black focus:ring-4 focus:ring-black/15 focus:outline-none shadow-md transition-all placeholder:text-stone-400"
            />
            {dishName && (
              <button
                type="button"
                onClick={() => setDishName('')}
                className="absolute right-3.5 top-4 text-stone-500 hover:text-black cursor-pointer p-1"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>

        {/* Accompaniments Setup Section */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block text-xs font-black text-black uppercase tracking-wider">
              Selected Accompaniments & Side Dishes ({accompanimentNames.length})
            </label>
            <span className="text-[11px] font-bold text-stone-900">
              Each side dish receives its own dedicated costing calculator in Step 2
            </span>
          </div>

          {/* Add Accompaniment Form */}
          <form onSubmit={handleAddAccompaniment} className="flex gap-2">
            <input
              type="text"
              value={newAccInput}
              onChange={(e) => setNewAccInput(e.target.value)}
              placeholder="Add accompaniment (e.g. Steamed Dombolo, Spicy Chakalaka, Yellow Rice)..."
              className="flex-1 text-xs font-bold text-black bg-white border-2 border-black rounded-xl px-3.5 py-2.5 focus:border-black focus:ring-2 focus:ring-black/15 focus:outline-none placeholder:text-stone-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={!newAccInput.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-white bg-black hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Item</span>
            </button>
          </form>

          {/* Selected Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {accompanimentNames.map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-white text-stone-950 border-2 border-black rounded-xl shadow-xs"
              >
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAccompaniment(index)}
                  className="p-0.5 text-stone-500 hover:text-red-600 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe Suggestions Library with Delicious Feast Image Background */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border-2 border-black shadow-xl space-y-6">
        {/* Delicious Meal Background Image */}
        <img
          src={feastBg}
          alt="Delicious catering meal spread"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-105 filter brightness-[0.92] contrast-[1.05]"
        />

        {/* Sophisticated Rich Contrast Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-900/80 to-stone-950/92 backdrop-blur-[2px] pointer-events-none" />

        {/* Inner Content Layer */}
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-700/70">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  Recipe Library & Catering Menus
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-black rounded-full bg-amber-400 text-stone-950 shadow-md border border-amber-300">
                  {presets.length} Menus
                </span>
              </div>
              <p className="text-xs text-stone-200 font-medium mt-1 drop-shadow-sm">
                Select any dish suggestion to load its accompaniments, or hire experienced local cooks for weddings and parties.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Add Recipe
              </button>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-100 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md rounded-xl transition-all cursor-pointer shadow-sm"
                title="Bulk import or paste recipes"
              >
                <Upload className="w-3.5 h-3.5 text-stone-200" />
                Import
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="p-2 text-stone-300 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/20"
                title="Reset to default catering recipes"
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
                placeholder="Search recipes, Zulu cuisine, chefs, or ingredients (e.g. Inyama, Dombolo, Curry, Bobotie)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/95 text-stone-900 placeholder:text-stone-500 font-semibold shadow-md backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
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
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-stone-950 font-black shadow-md border border-amber-300'
                        : 'bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 backdrop-blur-sm shadow-xs'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive
                          ? 'bg-stone-950 text-amber-300'
                          : 'bg-stone-800 text-stone-300'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredPresets.slice(0, displayLimit).map((p) => {
                  const isSelected =
                    selectedPresetId === p.id ||
                    (dishName === p.title &&
                      accompanimentNames.length > 0 &&
                      accompanimentNames.every((acc) =>
                        p.accompaniments.includes(acc)
                      ));

                  const isAvailable = p.availableToCook === 'Yes' || p.availableToCook === undefined;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleLoadPreset(p)}
                      className={`group relative text-left p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between border-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-800 ring-4 ring-emerald-400/40 shadow-xl scale-[1.01]'
                          : 'bg-white hover:bg-emerald-50/40 border-stone-800/80 shadow-md hover:shadow-2xl'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`text-xs font-black transition-colors line-clamp-2 pr-6 ${
                              isSelected
                                ? 'text-emerald-950'
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
                            } top-3 flex items-center gap-1 ${
                              isManagerMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            } transition-opacity`}
                          >
                            <button
                              type="button"
                              onClick={(e) => openEditModal(p, e)}
                              className="p-1 text-stone-500 hover:text-emerald-800 hover:bg-emerald-200/60 rounded-md transition-colors cursor-pointer"
                              title="Edit Recipe"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeletePreset(p.id, e)}
                              className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-100/60 rounded-md transition-colors cursor-pointer"
                              title={isManagerMode ? 'Delete Recipe (Manager)' : 'Delete Recipe'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Category & Chef Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                            {p.category}
                          </span>

                          {p.preparedBy && (
                            <span className="inline-flex items-center gap-1 font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                              <ChefHat className="w-3 h-3 text-emerald-700" />
                              <span>{p.preparedBy}</span>
                            </span>
                          )}
                        </div>

                        {/* Availability & Day Rate Pill */}
                        <div className="flex items-center justify-between gap-1.5 text-[10px] pt-0.5">
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300">
                              <UserCheck className="w-3 h-3 text-emerald-700" />
                              <span>Available for Hire</span>
                              {p.dayRate && (
                                <span className="font-black text-emerald-950">• {p.dayRate}</span>
                              )}
                            </span>
                          ) : (
                            <span className="font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                              Recipe Shared Only
                            </span>
                          )}
                        </div>

                        {/* Contact Details (Visible to App Manager Mode ONLY) */}
                        {p.contactDetails && (
                          <div className="text-[10px] font-semibold">
                            {isManagerMode ? (
                              <div className="flex items-center justify-between gap-1 p-1.5 bg-amber-50 rounded-lg border border-amber-300 text-amber-950 font-bold">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-amber-700" />
                                  <span>{p.contactDetails}</span>
                                </span>
                                <span className="text-[9px] text-amber-800 uppercase font-extrabold">
                                  [Manager View]
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-stone-400 text-[10px] italic">
                                <Lock className="w-2.5 h-2.5 text-stone-400" />
                                <span>Contact details visible to Admin only</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Accompaniments List */}
                        <p className="text-[11px] text-stone-600 font-medium line-clamp-3 leading-snug pt-1">
                          {p.accompaniments.join(', ')}
                        </p>
                      </div>

                      {/* Bottom Action Section */}
                      <div className="mt-3.5 pt-2.5 border-t border-stone-200 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-emerald-800 font-extrabold">
                          <span>{p.accompaniments.length} Accompaniments</span>
                          <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-emerald-800 font-black">
                            {isSelected ? 'Loaded ✓' : 'Load Menu \u2192'}
                          </span>
                        </div>

                        {/* Hire / Leave Message Button */}
                        <button
                          type="button"
                          onClick={(e) => openHireModal(p, e)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[11px] font-black text-emerald-950 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300/90 transition-all shadow-2xs cursor-pointer group-hover:border-emerald-500"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-800" />
                          <span>Hire Cook / Leave Message</span>
                        </button>
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
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-black text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 rounded-2xl transition-all shadow-md cursor-pointer"
                  >
                    <span>Show More Recipes ({filteredPresets.length - displayLimit} remaining)</span>
                    <ChevronDown className="w-4 h-4 text-stone-950" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center bg-stone-900/85 backdrop-blur-md border border-stone-700 rounded-2xl text-stone-300">
              <p className="text-xs font-bold text-stone-200">No recipes found.</p>
              <p className="text-[11px] text-stone-400 mt-1 mb-3">
                Try adjusting your search query or add a new custom recipe!
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Add Custom Recipe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar Card - Always visible throughout scrolling */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border-2 border-black shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-all">
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300/80 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-stone-900 text-sm sm:text-base truncate">
              {dishName.trim() || 'Custom Platter'}
            </div>
            <div className="text-xs text-stone-500 font-semibold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>{accompanimentNames.length} Accompaniments Listed</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={!dishName.trim() || accompanimentNames.length === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-md transition-all transform active:scale-98 cursor-pointer shrink-0"
        >
          <span>Proceed to Accompaniment Calculators</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Add / Edit Recipe Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border-2 border-black shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-700" />
                {editingPreset ? 'Edit Recipe' : 'Add Custom Recipe'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-4 text-xs">
              {/* Dish Title */}
              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Dish / Menu Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Sunday Roast Platter or Inyama Yenhloko Feast"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zulu, Traditional South African, Curries & Stews"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-medium text-stone-800"
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
                  ].map((suggestedCat) => (
                    <button
                      key={suggestedCat}
                      type="button"
                      onClick={() => setFormCategory(suggestedCat)}
                      className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                        formCategory === suggestedCat
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {suggestedCat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accompaniments (Shifted Up) */}
              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Accompaniments (comma or new-line separated) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Steamed Basmati Rice, Butter Bean Curry, Sambal, Naan Bread, Yoghurt Sauce"
                  value={formAccompaniments}
                  onChange={(e) => setFormAccompaniments(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-medium text-stone-800"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Type each side dish or accompaniment separated by a comma or on a new line.
                </p>
              </div>

              {/* Shield / Admin Privacy Banner placed below Category & Accompaniments */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between gap-2.5 text-xs text-amber-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-amber-800" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-stone-900 text-xs">
                      Cook & Catering Details
                    </span>
                    <span className="text-[11px] text-amber-900 font-medium">
                      Contact details are strictly protected and visible to Admin only.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0">
                  Visible to Admin Only
                </span>
              </div>

              {/* Personal Details Fields Below Shield */}
              {/* Questions 1 & 2: Prepared By & Available to Cook */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                <div>
                  <label className="block font-extrabold text-stone-800 mb-1">
                    Prepared by (Nickname)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chef Sis Gugu, Mama Dlamini"
                    value={formPreparedBy}
                    onChange={(e) => setFormPreparedBy(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400 font-medium">
                    Display name for recipe and catering inquiries
                  </span>
                </div>

                <div>
                  <label className="block font-extrabold text-stone-800 mb-1">
                    Available To Cook For You
                  </label>
                  <select
                    value={formAvailableToCook}
                    onChange={(e) =>
                      setFormAvailableToCook(e.target.value as 'Yes' | 'No')
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900 bg-white cursor-pointer"
                  >
                    <option value="Yes">Yes (Available for Hire / Events)</option>
                    <option value="No">No (Recipe Only / Not for Hire)</option>
                  </select>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Allow clients to send hiring requests
                  </span>
                </div>
              </div>

              {/* Questions 3 & 4: Contact Details & Day Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-stone-800 mb-1 flex items-center justify-between">
                    <span>
                      Contact Details {formAvailableToCook === 'Yes' ? <span className="text-emerald-700 font-black">*</span> : <span className="text-stone-400 font-normal text-xs">(Optional)</span>}
                    </span>
                    <span className="text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded-md">
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
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1 mt-0.5">
                    <Lock className="w-2.5 h-2.5 text-stone-400" />
                    Strictly protected & visible only to Admin
                  </span>
                </div>

                <div>
                  <label className="block font-extrabold text-stone-800 mb-1">
                    Day Rate {formAvailableToCook === 'Yes' ? <span className="text-emerald-700 font-black">*</span> : <span className="text-stone-400 font-normal text-xs">(Optional)</span>}
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
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400 font-medium">
                    {formAvailableToCook === 'Yes'
                      ? 'Required for caterer profile (events, weddings, parties)'
                      : 'Not required when not available for hire'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                >
                  <span>Continue To Costing</span>
                  <ArrowRight className="w-4 h-4" />
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
                Bulk Import Recipes
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              <p className="text-stone-600 leading-relaxed">
                Paste your custom menus below. Format each line as:
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
                  className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bulkText.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Import Suggestions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hire Chef / Leave Message Modal */}
      <HireChefModal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        preset={hirePreset}
        onInquirySubmitted={handleInquirySubmitted}
      />

      {/* App Manager Booking Inquiries Modal */}
      <ManagerInquiryModal
        isOpen={isManagerInboxOpen}
        onClose={() => setIsManagerInboxOpen(false)}
        inquiries={inquiries}
        onUpdateInquiryStatus={handleUpdateInquiryStatus}
        onDeleteInquiry={handleDeleteInquiry}
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
