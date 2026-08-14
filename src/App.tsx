import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { AccompanimentScreen } from './components/AccompanimentScreen';
import { MealScreen } from './components/MealScreen';
import { QuoteScreen } from './components/QuoteScreen';
import { OrderListScreen } from './components/OrderListScreen';
import { CommunityRecipesScreen } from './components/CommunityRecipesScreen';
import { LogoUploadModal } from './components/LogoUploadModal';
import { QuickCalculatorModal } from './components/QuickCalculatorModal';

import { OrderItem, Accompaniment, Meal, Quote, StoreSpecial } from './types';
import { INITIAL_ORDER_LIST } from './data/initialOrderList';
import { INITIAL_STORE_SPECIALS } from './data/initialSpecials';
import { cleanupExpiredAndInvalidDates } from './utils/dateCleanup';
import { sanitizeAndDeduplicateSpecials } from './utils/flyerExtractor';
import {
  recalculateAccompaniment,
  recalculateMeal,
  recalculateQuote,
  calculateIngredientRow,
} from './utils/calculations';

import defaultLogoImg from './assets/images/food_costing_logo_1786443360654.jpg';

// Default Logo processed via Vite asset bundler for production/Vercel support
export const DEFAULT_LOGO = defaultLogoImg;

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isQuickCalcOpen, setIsQuickCalcOpen] = useState(false);

  // Unlocked navigation tabs - orderList and communityRecipes are always accessible
  const [unlockedTabs, setUnlockedTabs] = useState<ActiveTab[]>([
    'home',
    'orderList',
    'communityRecipes',
  ]);

  // Logo State (stored in localStorage if modified, ensuring stale /src/ dev paths are cleared)
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    const saved = localStorage.getItem('food_costing_app_logo');
    if (!saved || saved.startsWith('/src/') || saved === '/logo.png') {
      return DEFAULT_LOGO;
    }
    return saved;
  });

  // Order List State
  const [orderList, setOrderList] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('food_costing_order_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved order list', e);
      }
    }
    return INITIAL_ORDER_LIST;
  });

  // Home Screen Dish State
  const [dishName, setDishName] = useState<string>('Traditional Durban Curry Platter');
  const [accompanimentNames, setAccompanimentNames] = useState<string[]>([
    'Steamed Basmati Rice',
    'Butter Bean Curry',
    'Chicken Tikka Fillet',
    'Tomato & Onion Sambal',
    'Mint Yoghurt Sauce',
  ]);

  // Accompaniments State
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>([]);

  // Current Meal State
  const [currentMeal, setCurrentMeal] = useState<Meal>({
    id: 'meal-1',
    name: 'Traditional Durban Curry Platter',
    accompanimentIds: [],
    fees: [],
    totalPlateCost: 0,
    desiredCostPercent: 0.40,
    preliminarySellingPrice: 0,
    actualCostPercent: 0,
  });

  // Quote State
  const [quote, setQuote] = useState<Quote>({
    id: 'quote-1',
    clientEventName: 'Smith Wedding Reception',
    defaultHeadcount: 50,
    meals: [],
    eventFoodCost: 0,
    markupPercent: 0.30,
    totalQuotedPrice: 0,
    pricePerHead: 0,
    clientBudgetPerHead: 150,
    dateCreated: new Date().toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  });

  // Store Specials State
  const [specials, setSpecials] = useState<StoreSpecial[]>(() => {
    const saved = localStorage.getItem('food_costing_store_specials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeAndDeduplicateSpecials(parsed);
      } catch (e) {
        console.error('Failed to parse saved store specials', e);
      }
    }
    return sanitizeAndDeduplicateSpecials(INITIAL_STORE_SPECIALS);
  });

  // Synchronize Order List with LocalStorage
  useEffect(() => {
    localStorage.setItem('food_costing_order_list', JSON.stringify(orderList));
  }, [orderList]);

  // Synchronize Store Specials with LocalStorage
  useEffect(() => {
    localStorage.setItem('food_costing_store_specials', JSON.stringify(specials));
  }, [specials]);

  // Automatically remove invalid & expired promotion end dates & deduplicate on mount
  useEffect(() => {
    const {
      cleanedOrderList,
      cleanedSpecials,
      removedOrderDatesCount,
      expiredSpecialsCount,
    } = cleanupExpiredAndInvalidDates(orderList, specials);

    const deduplicated = sanitizeAndDeduplicateSpecials(cleanedSpecials);

    if (removedOrderDatesCount > 0) {
      setOrderList(cleanedOrderList);
    }
    setSpecials(deduplicated);
  }, []);

  // Synchronize Logo with LocalStorage
  useEffect(() => {
    localStorage.setItem('food_costing_app_logo', logoUrl);
  }, [logoUrl]);

  // Build Accompaniments from accompanimentNames when navigating from Home
  const handleBuildAccompanimentsFromHome = (shouldNavigate: boolean = true) => {
    const newAccs: Accompaniment[] = accompanimentNames.map((name, index) => {
      // Find existing accompaniment if name matches
      const existing = accompaniments.find(
        (a) => a.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) return existing;

      // Smart ingredient matching based on name keywords
      let initialIngredients = [];
      const lower = name.toLowerCase();

      if (lower.includes('rice')) {
        const riceItem = orderList.find((i) => i.itemDescription.includes('Rice'));
        if (riceItem) {
          initialIngredients.push(
            calculateIngredientRow({
              orderItemId: riceItem.id,
              name: riceItem.itemDescription,
              quantityUsed: 150,
              eyPercent: riceItem.estYieldPercent,
              costPerUnit: riceItem.pricePerUnit,
            })
          );
        }
      } else if (lower.includes('curry') || lower.includes('bean')) {
        const beanItem = orderList.find((i) => i.itemDescription.includes('Beans'));
        const spiceItem = orderList.find((i) => i.itemDescription.includes('Curry'));
        if (beanItem) {
          initialIngredients.push(
            calculateIngredientRow({
              orderItemId: beanItem.id,
              name: beanItem.itemDescription,
              quantityUsed: 180,
              eyPercent: beanItem.estYieldPercent,
              costPerUnit: beanItem.pricePerUnit,
            })
          );
        }
        if (spiceItem) {
          initialIngredients.push(
            calculateIngredientRow({
              orderItemId: spiceItem.id,
              name: spiceItem.itemDescription,
              quantityUsed: 15,
              eyPercent: spiceItem.estYieldPercent,
              costPerUnit: spiceItem.pricePerUnit,
            })
          );
        }
      } else if (lower.includes('chicken') || lower.includes('fillet')) {
        const chkItem = orderList.find((i) => i.itemDescription.includes('Chicken Fillet'));
        if (chkItem) {
          initialIngredients.push(
            calculateIngredientRow({
              orderItemId: chkItem.id,
              name: chkItem.itemDescription,
              quantityUsed: 220,
              eyPercent: chkItem.estYieldPercent,
              costPerUnit: chkItem.pricePerUnit,
            })
          );
        }
      } else if (lower.includes('salad') || lower.includes('sambal')) {
        const vegItem = orderList.find((i) => i.itemDescription.includes('Tomatoes')) || orderList[5];
        if (vegItem) {
          initialIngredients.push(
            calculateIngredientRow({
              orderItemId: vegItem.id,
              name: vegItem.itemDescription,
              quantityUsed: 100,
              eyPercent: vegItem.estYieldPercent,
              costPerUnit: vegItem.pricePerUnit,
            })
          );
        }
      } else if (lower.includes('sauce') || lower.includes('mint') || lower.includes('yoghurt')) {
        const yogItem = orderList.find((i) => i.itemDescription.includes('Yoghurt'));
        if (yogItem) {
          initialIngredients.push(
            calculateIngredientRow({
              orderItemId: yogItem.id,
              name: yogItem.itemDescription,
              quantityUsed: 60,
              eyPercent: yogItem.estYieldPercent,
              costPerUnit: yogItem.pricePerUnit,
            })
          );
        }
      }

      // Default fallback if no match found
      if (initialIngredients.length === 0 && orderList.length > 0) {
        const sampleItem = orderList[index % orderList.length];
        initialIngredients.push(
          calculateIngredientRow({
            orderItemId: sampleItem.id,
            name: sampleItem.itemDescription,
            quantityUsed: 200,
            eyPercent: sampleItem.estYieldPercent,
            costPerUnit: sampleItem.pricePerUnit,
          })
        );
      }

      const defaultPrepGuide: Record<string, string> = {
        'Steamed Basmati Rice': '1. Rinse basmati rice thoroughly under cold water until clear.\n2. Bring 2L salted water to a rolling boil.\n3. Add rice, 2 cloves, and 1 cinnamon stick; simmer covered on low heat for 12 minutes.\n4. Fluff with a fork and rest for 5 minutes before portioning.',
        'Butter Bean Curry': '1. Heat oil in a heavy-bottomed pot and sauté onions with curry leaves and mustard seeds until golden.\n2. Stir in curry powder, turmeric, ginger and garlic paste; cook for 1 minute.\n3. Add diced tomatoes, cooked butter beans, and simmer gently for 25 minutes until gravy thickens.\n4. Garnish with fresh chopped coriander.',
        'Chicken Tikka Fillet': '1. Marinate chicken breast fillets in yoghurt, tikka spices, lemon juice, and crushed garlic.\n2. Sear on high heat for 4-5 minutes per side until charred and cooked through (internal temp 75°C).\n3. Rest for 5 minutes and slice across the grain.',
        'Tomato & Onion Sambal': '1. Finely dice ripe salad tomatoes and red onion.\n2. Toss with chopped green chillies, coriander, pinch of sea salt, and lemon juice.\n3. Chill in refrigerator for 30 minutes before serving.',
        'Mint Yoghurt Sauce': '1. Whisk plain yoghurt with finely chopped mint, roasted cumin, and lime.\n2. Season with fine salt and chill until plated.',
      };

      const acc: Accompaniment = {
        id: `acc-${Date.now()}-${index}`,
        name,
        batchQuantity: 1000, // 1kg batch
        ingredients: initialIngredients,
        qFactorPercent: 0.10, // 10% spoilage factor
        totalIngredientCost: 0,
        recipeCost: 0,
        portionSizeGrams: 150, // standard portion
        numberOfPortions: 1,
        portionCost: 0,
        desiredCostPercent: 0.40,
        preliminarySellingPrice: 0,
        actualCostPercent: 0,
        preparingInstructions: defaultPrepGuide[name] || '',
      };

      return recalculateAccompaniment(acc);
    });

    setAccompaniments(newAccs);

    // Initialize meal with these accompaniments
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      name: dishName || 'Custom Platter',
      accompanimentIds: newAccs.map((a) => a.id),
      fees: [
        {
          id: 'fee-init-1',
          category: 'Packaging',
          description: 'Biodegradable Meal Container & Lid',
          isFromOrderList: true,
          orderItemId: 'ord-pack-1',
          packSize: 50,
          packPrice: 175.00,
          unitCost: 3.50,
          quantity: 1,
          totalCost: 3.50,
        },
        {
          id: 'fee-init-2',
          category: 'Packaging',
          description: 'Wooden Cutlery Set',
          isFromOrderList: true,
          orderItemId: 'ord-pack-2',
          packSize: 100,
          packPrice: 120.00,
          unitCost: 1.20,
          quantity: 1,
          totalCost: 1.20,
        },
      ],
      totalPlateCost: 0,
      desiredCostPercent: 0.40,
      preliminarySellingPrice: 0,
      actualCostPercent: 0,
    };

    const recalculatedMeal = recalculateMeal(newMeal, newAccs);
    setCurrentMeal(recalculatedMeal);

    // Initialize Quote
    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      clientEventName: 'Smith Wedding Reception',
      defaultHeadcount: 50,
      meals: [{ mealId: recalculatedMeal.id, subtotal: recalculatedMeal.totalPlateCost * 50 }],
      eventFoodCost: 0,
      markupPercent: 0.30,
      totalQuotedPrice: 0,
      pricePerHead: 0,
      clientBudgetPerHead: 150,
      dateCreated: new Date().toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    };

    const recalculatedQuote = recalculateQuote(newQuote, [recalculatedMeal]);
    setQuote(recalculatedQuote);

    // Proceed to Accompaniments Calculator if requested
    if (shouldNavigate) {
      setUnlockedTabs((prev) => Array.from(new Set([...prev, 'accompaniments'])));
      setActiveTab('accompaniments');
    }
  };

  // Build initial data on first mount if empty without changing landing page tab
  useEffect(() => {
    if (accompaniments.length === 0) {
      handleBuildAccompanimentsFromHome(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unlockedTabs={unlockedTabs}
        logoUrl={logoUrl}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
        onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
        accompanimentsCount={accompaniments.length}
        mealsCount={currentMeal.accompanimentIds.length > 0 ? 1 : 0}
        quotesCount={quote.meals.length > 0 ? 1 : 0}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <HomeScreen
            dishName={dishName}
            setDishName={setDishName}
            accompanimentNames={accompanimentNames}
            setAccompanimentNames={setAccompanimentNames}
            onContinue={handleBuildAccompanimentsFromHome}
            logoUrl={logoUrl}
          />
        )}

        {activeTab === 'accompaniments' && (
          <AccompanimentScreen
            accompaniments={accompaniments}
            setAccompaniments={setAccompaniments}
            orderList={orderList}
            onContinueToMeal={() => {
              // Update meal plate cost calculation with current accompaniments
              const updatedMeal = recalculateMeal(currentMeal, accompaniments);
              setCurrentMeal(updatedMeal);
              setUnlockedTabs((prev) => Array.from(new Set([...prev, 'meals'])));
              setActiveTab('meals');
            }}
          />
        )}

        {activeTab === 'meals' && (
          <MealScreen
            currentMeal={currentMeal}
            setCurrentMeal={setCurrentMeal}
            accompaniments={accompaniments}
            orderList={orderList}
            onContinueToQuote={() => {
              // Update quote calculation with current meal
              const updatedQuote = recalculateQuote(quote, [currentMeal]);
              setQuote(updatedQuote);
              setUnlockedTabs((prev) => Array.from(new Set([...prev, 'quotes'])));
              setActiveTab('quotes');
            }}
          />
        )}

        {activeTab === 'quotes' && (
          <QuoteScreen
            quote={quote}
            setQuote={setQuote}
            meals={[currentMeal]}
            logoUrl={logoUrl}
          />
        )}

        {activeTab === 'orderList' && (
          <OrderListScreen
            orderList={orderList}
            setOrderList={setOrderList}
            onResetOrderList={() => setOrderList(INITIAL_ORDER_LIST)}
          />
        )}

        {activeTab === 'communityRecipes' && (
          <CommunityRecipesScreen
            dishName={dishName}
            setDishName={setDishName}
            accompanimentNames={accompanimentNames}
            setAccompanimentNames={setAccompanimentNames}
            onNavigateToDishSetup={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            logoUrl={logoUrl}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 py-6 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src={logoUrl || DEFAULT_LOGO}
              alt="Logo"
              className="w-5 h-5 object-contain rounded"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src !== DEFAULT_LOGO) {
                  target.src = DEFAULT_LOGO;
                }
              }}
            />
            <span className="font-semibold text-stone-200">SOUS - FOR PROFITABLE KITCHENS</span>
            <span>— Professional Catering Cost Accounting</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Pre-calculated in South African Rand (R) • Standalone Client-Side Application
          </p>
        </div>
      </footer>

      {/* Custom Logo Upload Modal */}
      <LogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogoUrl={logoUrl}
        onUpdateLogo={(url) => setLogoUrl(url)}
        onResetLogo={() => setLogoUrl(DEFAULT_LOGO)}
      />

      {/* Quick Portion / Purchasing Calculator Modal */}
      <QuickCalculatorModal
        isOpen={isQuickCalcOpen}
        onClose={() => setIsQuickCalcOpen(false)}
        onNavigateToDishSetup={() => setActiveTab('home')}
      />
    </div>
  );
}
