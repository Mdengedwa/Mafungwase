import React, { useState, useEffect } from 'react';
import defaultLogoImg from '../assets/images/food_costing_logo_1786443360654.jpg';
import {
  Utensils,
  Calculator,
  Layers,
  FileSpreadsheet,
  Database,
  ChefHat,
  Image as ImageIcon,
  Scale,
  Code,
  Lock,
  BookOpen,
  Heart,
} from 'lucide-react';

export type ActiveTab =
  | 'communityRecipes'
  | 'dishBuilder'
  | 'accompaniments'
  | 'meals'
  | 'quotes'
  | 'orderList';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unlockedTabs: ActiveTab[];
  logoUrl: string;
  onOpenLogoModal: () => void;
  onOpenQuickCalc: () => void;
  isDevMode?: boolean;
  accompanimentsCount: number;
  mealsCount: number;
  quotesCount: number;
  recipesCount?: number;
  basketCount?: number;
  basketTotal?: number;
  onOpenBasket?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unlockedTabs,
  logoUrl,
  onOpenLogoModal,
  onOpenQuickCalc,
  isDevMode: propDevMode,
  accompanimentsCount,
  mealsCount,
  quotesCount,
  recipesCount = 0,
  basketCount = 0,
  basketTotal = 0,
  onOpenBasket,
}) => {
  // Check if developer mode is enabled via URL search param (?dev=true) or prop or localStorage
  const [isDev, setIsDev] = useState<boolean>(() => {
    if (propDevMode !== undefined) return propDevMode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === 'true' || params.get('developer') === 'true') return true;
      return localStorage.getItem('food_costing_dev_mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (propDevMode !== undefined) {
      setIsDev(propDevMode);
    }
  }, [propDevMode]);

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'communityRecipes', label: 'Our Community Recipes', icon: ChefHat, badge: recipesCount },
    { id: 'dishBuilder', label: 'Dish Builder', icon: Utensils },
    { id: 'accompaniments', label: 'Accompaniments', icon: Calculator, badge: accompanimentsCount },
    { id: 'meals', label: 'Meal Assembly', icon: Layers, badge: mealsCount },
    { id: 'quotes', label: 'Quotes', icon: FileSpreadsheet, badge: quotesCount },
    { id: 'orderList', label: 'Order List', icon: Database },
  ];

  // Our Community Recipes, Dish Builder, and Order List are always accessible
  const alwaysAccessibleTabs: ActiveTab[] = ['communityRecipes', 'dishBuilder', 'orderList'];

  const isTabAccessible = (tabId: ActiveTab) => {
    if (alwaysAccessibleTabs.includes(tabId)) return true;
    return unlockedTabs.includes(tabId);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B3B28] text-white shadow-md border-b border-emerald-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            {isDev ? (
              <button
                onClick={onOpenLogoModal}
                title="[Developer Mode] Click to customize brand logo"
                className="relative group flex items-center justify-center p-1 bg-[#06261A] rounded-2xl border border-amber-500/80 hover:border-amber-300 transition-all cursor-pointer overflow-hidden shadow-xs ring-2 ring-amber-500/30"
              >
                <img
                  src={logoUrl || defaultLogoImg}
                  alt="CATCHUP Logo"
                  className="h-9 w-9 object-contain rounded-xl"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== defaultLogoImg) {
                      target.src = defaultLogoImg;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <ImageIcon className="w-4 h-4 text-amber-300" />
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-center p-1 bg-[#06261A] rounded-2xl border border-emerald-800/80 overflow-hidden shadow-xs">
                <img
                  src={logoUrl || defaultLogoImg}
                  alt="CATCHUP Logo"
                  className="h-9 w-9 object-contain rounded-xl"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== defaultLogoImg) {
                      target.src = defaultLogoImg;
                    }
                  }}
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-futura font-black text-xl tracking-[0.18em] uppercase text-white select-none leading-tight font-['Jost','Futura','Futura_PT','Montserrat','Century_Gothic',sans-serif]">
                CATCHUP
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-emerald-200/90 leading-none mt-0.5 select-none whitespace-nowrap">
                Profitable Kitchens
              </span>
            </div>
          </div>

          {/* Nav Items - Desktop / Tablet */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAccessible = isTabAccessible(item.id);

              if (!isAccessible) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled
                    title="Locked: Please click the 'Proceed' button on the current page to progress through the recipe costing workflow."
                    className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-200/40 bg-transparent opacity-50 cursor-not-allowed select-none"
                  >
                    <Icon className="w-4 h-4 text-emerald-300/40" />
                    <span>{item.label}</span>
                    <Lock className="w-3 h-3 text-emerald-300/50" />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-100/80 hover:text-white hover:bg-emerald-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                        isActive
                          ? 'bg-emerald-950 text-emerald-200'
                          : 'bg-emerald-900/80 text-emerald-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Recipe Shopping Basket Button */}
            {onOpenBasket && (
              <button
                onClick={onOpenBasket}
                title="Open Recipe Shopping Basket"
                className={`text-xs font-black px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border ${
                  basketCount > 0
                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/40'
                    : 'text-rose-100 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    basketCount > 0 ? 'fill-white text-white animate-pulse' : 'text-rose-300'
                  }`}
                />
                <span className="hidden sm:inline">Recipe Basket</span>
                {basketCount > 0 && (
                  <span className="bg-rose-950 text-rose-100 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                    {basketCount}
                  </span>
                )}
              </button>
            )}

            {/* Buying Calculator Button (Always accessible) */}
            <button
              onClick={onOpenQuickCalc}
              title="Quickly calculate buying requirements and portions per guest"
              className="text-xs font-extrabold text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Scale className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Buying Calculator</span>
            </button>

            {/* Developer Mode Only: Change Logo Button */}
            {isDev && (
              <button
                onClick={onOpenLogoModal}
                title="Developer Mode: Customize brand logo"
                className="text-xs font-bold text-amber-200 hover:text-white bg-black/40 hover:bg-black/60 border border-amber-500/60 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Code className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px]">Logo (Dev)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden border-t border-emerald-900/80 bg-[#0B3B28] overflow-x-auto">
        <div className="flex items-center space-x-1 px-2 py-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAccessible = isTabAccessible(item.id);

            if (!isAccessible) {
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled
                  title="Locked: Please click the 'Proceed' button on the current page."
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-200/40 opacity-50 cursor-not-allowed whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-300/40" />
                  <span>{item.label}</span>
                  <Lock className="w-2.5 h-2.5 text-emerald-300/50" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-100/80 hover:bg-emerald-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.1 text-[9px] rounded-full bg-emerald-900 text-emerald-200 border border-emerald-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
