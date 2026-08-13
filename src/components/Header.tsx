import React from 'react';
import {
  Utensils,
  Calculator,
  Layers,
  FileSpreadsheet,
  Database,
  Tag,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

export type ActiveTab = 'home' | 'accompaniments' | 'meals' | 'quotes' | 'orderList' | 'specials';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  logoUrl: string;
  onOpenLogoModal: () => void;
  accompanimentsCount: number;
  mealsCount: number;
  quotesCount: number;
  specialsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  logoUrl,
  onOpenLogoModal,
  accompanimentsCount,
  mealsCount,
  quotesCount,
  specialsCount = 0,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'Dish Setup', icon: Utensils },
    { id: 'accompaniments', label: 'Accompaniments', icon: Calculator, badge: accompanimentsCount },
    { id: 'meals', label: 'Meal Assembly', icon: Layers, badge: mealsCount },
    { id: 'quotes', label: 'Quotes', icon: FileSpreadsheet, badge: quotesCount },
    { id: 'orderList', label: 'Order List', icon: Database },
    { id: 'specials', label: 'Specials', icon: Tag, badge: specialsCount },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B3B28] text-white shadow-md border-b border-emerald-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogoModal}
              title="Click to customize brand logo"
              className="relative group flex items-center justify-center p-1 bg-[#06261A] rounded-2xl border border-emerald-800/80 hover:border-emerald-400 transition-all cursor-pointer overflow-hidden shadow-xs"
            >
              <img
                src={logoUrl}
                alt="Logo"
                className="h-9 w-9 object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                <ImageIcon className="w-4 h-4 text-emerald-300" />
              </div>
            </button>
          </div>

          {/* Nav Items - Desktop / Tablet */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-100/80 hover:text-white hover:bg-emerald-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-0.5 px-2 py-0.2 text-[10px] rounded-full font-extrabold ${
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

          {/* Quick Actions / Mobile Menu Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLogoModal}
              className="text-xs font-bold text-emerald-200 hover:text-white bg-emerald-900/70 hover:bg-emerald-800/80 border border-emerald-700/60 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Change Logo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden border-t border-emerald-900/80 bg-[#0B3B28] overflow-x-auto">
        <div className="flex items-center space-x-1 px-2 py-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
