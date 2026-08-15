import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  ArrowRight,
  Plus,
  X,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  Shield,
  MessageSquare,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import {
  ChefBookingInquiry,
} from '../data/defaultPresetSuggestions';
import { ManagerInquiryModal } from './ManagerInquiryModal';
import { ManagerPasswordModal } from './ManagerPasswordModal';

interface DishBuilderScreenProps {
  dishName: string;
  setDishName: (name: string) => void;
  accompanimentNames: string[];
  setAccompanimentNames: (names: string[]) => void;
  onContinueToAccompaniments: () => void;
  onBackToLibrary: () => void;
  logoUrl: string;
}

const INQUIRIES_STORAGE_KEY = 'mafungwase_chef_inquiries_v1';
const MANAGER_MODE_STORAGE_KEY = 'food_costing_manager_mode';

export const DishBuilderScreen: React.FC<DishBuilderScreenProps> = ({
  dishName,
  setDishName,
  accompanimentNames,
  setAccompanimentNames,
  onContinueToAccompaniments,
  onBackToLibrary,
}) => {
  const [newAccInput, setNewAccInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Manager Mode State (persisted)
  const [isManagerMode, setIsManagerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MANAGER_MODE_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isManagerInboxOpen, setIsManagerInboxOpen] = useState(false);

  // Inquiries State for Manager Inbox
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

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const toggleManagerMode = () => {
    if (isManagerMode) {
      setIsManagerMode(false);
      try {
        localStorage.setItem(MANAGER_MODE_STORAGE_KEY, 'false');
      } catch (e) {
        console.error('Failed to save manager mode', e);
      }
      setToastMessage('App Manager Mode deactivated.');
    } else {
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

  const handleAddAccompaniment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newAccInput.trim();
    if (trimmed && !accompanimentNames.includes(trimmed)) {
      setAccompanimentNames([...accompanimentNames, trimmed]);
      setNewAccInput('');
      setShowAddInput(false);
    }
  };

  const handleRemoveAccompaniment = (index: number) => {
    setAccompanimentNames(accompanimentNames.filter((_, i) => i !== index));
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

      {/* Navigation Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black text-stone-800 bg-white hover:bg-stone-50 border-2 border-black shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>← Back to Recipe Library</span>
        </button>

        <button
          type="button"
          onClick={onBackToLibrary}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse or Load Other Recipes</span>
        </button>
      </div>

      {/* Catering Dish & Accompaniment Builder (Dedicated Page) */}
      <div
        style={{
          backgroundColor: '#0B3B28',
          fontFamily: "'Futura', 'Futura PT', 'Futura-Medium', 'Futura-Bold', 'Jost', 'Century Gothic', -apple-system, sans-serif",
        }}
        className="font-futura rounded-3xl p-6 sm:p-8 border-2 border-emerald-900 shadow-2xl space-y-6 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-emerald-800/80">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-[#06261A] text-amber-300 border border-emerald-700/80 shadow-xs">
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              Step 1 of 4 • Recipe & Menu Setup
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
              Catering Dish & Accompaniment Builder
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed max-w-2xl">
              Cost individual accompaniments, hire authentic local cooks for events, and assemble precise client quotes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* App Manager Mode Switch */}
            <button
              type="button"
              onClick={toggleManagerMode}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                isManagerMode
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-lg ring-2 ring-amber-400/30'
                  : 'bg-[#06261A] text-white hover:bg-[#093826] border-emerald-700/80 shadow-xs'
              }`}
              title="Toggle App Manager mode to view full contact numbers and manage booking inquiries"
            >
              {isManagerMode ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-950" />
                  <span>App Manager Mode: ON</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping"></span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-emerald-300" />
                  <span>Manager Mode (Off)</span>
                </>
              )}
            </button>

            {/* Manager Inquiries Inbox Button */}
            {isManagerMode && (
              <button
                type="button"
                onClick={() => setIsManagerInboxOpen(true)}
                className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black bg-[#06261A] text-white hover:bg-black transition-all shadow-md cursor-pointer border border-emerald-700"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Booking Inquiries</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950">
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
          <div className="p-4 bg-[#06261A] text-white rounded-2xl border border-emerald-700/80 flex items-center justify-between gap-3 text-xs shadow-md animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-black text-amber-300 block">
                  🛡️ App Manager Mode Active
                </span>
                <span className="text-[11px] text-emerald-200 font-medium">
                  Full unmasked phone numbers, email details, and client booking requests are unlocked.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsManagerInboxOpen(true)}
              className="px-3.5 py-1.5 text-[11px] font-black text-emerald-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Open Inbox ({inquiries.length})
            </button>
          </div>
        )}

        {/* Main Dish Name Input */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-emerald-200 uppercase tracking-wider">
            Main Dish / Event Menu Title
          </label>
          <div className="relative">
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g. Traditional Durban Curry Platter or Inyama Yenhloko Feast"
              className="w-full text-base sm:text-lg font-black text-stone-950 bg-white border-2 border-emerald-950 rounded-2xl px-4 py-3.5 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 focus:outline-none shadow-md transition-all placeholder:text-stone-400"
            />
            {dishName && (
              <button
                type="button"
                onClick={() => setDishName('')}
                className="absolute right-3.5 top-4 text-stone-400 hover:text-stone-900 cursor-pointer p-1"
                title="Clear dish title"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>

        {/* Accompaniments Setup Section */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-black text-emerald-200 uppercase tracking-wider">
                Selected Accompaniments & Side Dishes ({accompanimentNames.length})
              </label>
              <span className="text-[11px] font-medium text-emerald-200/90">
                Each side dish receives its own dedicated costing calculator in Step 2
              </span>
            </div>

            {!showAddInput && (
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shrink-0 cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Add Item</span>
              </button>
            )}
          </div>

          {/* Add Accompaniment Form - Hidden by default, only shown if "Add Item" button is pressed */}
          {showAddInput && (
            <form onSubmit={handleAddAccompaniment} className="flex gap-2 items-center animate-in fade-in zoom-in-98 duration-150">
              <input
                type="text"
                autoFocus
                value={newAccInput}
                onChange={(e) => setNewAccInput(e.target.value)}
                placeholder="Add accompaniment (e.g. Steamed Dombolo, Spicy Chakalaka, Yellow Rice)..."
                className="flex-1 text-xs font-bold text-stone-950 bg-white border-2 border-emerald-950 rounded-xl px-3.5 py-2.5 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none placeholder:text-stone-500 shadow-sm"
              />
              <button
                type="submit"
                disabled={!newAccInput.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-emerald-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddInput(false);
                  setNewAccInput('');
                }}
                className="p-2.5 text-emerald-200 hover:text-white bg-[#06261A] hover:bg-[#093826] border border-emerald-700/80 rounded-xl transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          )}

          {/* Selected Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {accompanimentNames.map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-white text-stone-950 border-2 border-emerald-950 rounded-xl shadow-xs"
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
            {accompanimentNames.length === 0 && (
              <div className="p-3.5 bg-[#06261A]/90 border border-emerald-700/60 rounded-xl text-xs text-emerald-200 font-semibold">
                No accompaniments added yet. Type a side dish above or load a recipe from the library!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar at Bottom of Dish Builder Screen */}
      <div className="bg-white rounded-3xl p-5 border-2 border-black shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-black text-stone-900 text-base truncate">
              {dishName.trim() || 'Untitled Platter'}
            </div>
            <div className="text-xs text-stone-600 font-bold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>{accompanimentNames.length} Accompaniments configured for costing</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onBackToLibrary}
            className="px-5 py-3.5 text-xs font-black text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-all cursor-pointer"
          >
            ← Library
          </button>

          <button
            type="button"
            onClick={onContinueToAccompaniments}
            disabled={!dishName.trim() || accompanimentNames.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-xs sm:text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-lg transition-all transform active:scale-98 cursor-pointer"
          >
            <span>Proceed to Step 2: Accompaniment Calculators</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* App Manager Booking Inquiries Modal */}
      <ManagerInquiryModal
        isOpen={isManagerInboxOpen}
        onClose={() => setIsManagerInboxOpen(false)}
        inquiries={inquiries}
        onUpdateInquiryStatus={(id, status) => {
          setInquiries((prev) =>
            prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
          );
        }}
        onDeleteInquiry={(id) => {
          if (confirm('Delete this inquiry?')) {
            setInquiries((prev) => prev.filter((i) => i.id !== id));
          }
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
