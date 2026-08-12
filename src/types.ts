export type PackType = 'Pack' | 'Loose' | 'Each';
export type PackUnit = 'g' | 'ml' | 'each';
export type BaseUnit = 'kg' | 'each';

export interface OrderItem {
  id: string;
  category: string;
  itemDescription: string;
  packType: PackType;
  packPrice: number; // in Rand
  packWeight: number; // grams or count
  packUnit: PackUnit;
  baseUnit: BaseUnit;
  pricePerUnit: number; // calculated price per kg (for g/ml) or per each (for count)
  estYieldPercent: number; // decimal e.g. 0.85 = 85%
  yieldNote: string;
  source: string;
  sourceUrl?: string;
  endingDate?: string;
  location?: string;
}

export interface AccompanimentIngredient {
  id: string;
  orderItemId?: string; // linked to order list
  name: string;
  isManual: boolean;
  quantityUsed: number; // g or ml or each
  eyPercent: number; // 0.0 to 1.0
  asPurchasedQty: number; // quantityUsed * eyPercent
  costPerUnit: number; // R/kg or R/each
  individualCost: number; // As-Purchased Qty * costPerUnit (scaled)
}

export interface SpoonInfo {
  spoonType: 'liquid' | 'rice_grain' | 'chopped_veg' | 'sauce' | 'meat_stew' | 'other';
  spoonCount: number;
  estimatedGrams: number;
}

export interface Accompaniment {
  id: string;
  name: string;
  batchQuantity: number; // total batch size in grams/ml
  ingredients: AccompanimentIngredient[];
  qFactorPercent: number; // default 0.10 (10%)
  totalIngredientCost: number; // sum of individual ingredient costs
  recipeCost: number; // totalIngredientCost * (1 + qFactorPercent)
  portionSizeGrams: number; // standard portion per plate
  spoonInfo?: SpoonInfo;
  numberOfPortions: number; // batchQuantity / portionSizeGrams
  portionCost: number; // recipeCost / numberOfPortions
  desiredCostPercent: number; // default 0.40 (40%)
  preliminarySellingPrice: number; // portionCost / desiredCostPercent
  actualSellingPriceOverride?: number; // optional manual override
  actualCostPercent: number; // portionCost / actualSellingPrice
}

export interface FeeLine {
  id: string;
  category: 'Packaging' | 'Utensils' | 'Paper' | 'Delivery' | 'Catering' | 'Other';
  description: string;
  isFromOrderList: boolean;
  orderItemId?: string;
  packSize?: number; // count/units in a pack (e.g., 50 or 100)
  packPrice?: number; // total price paid for the pack (e.g., R 175.00)
  unitCost: number; // calculated cost per item/unit (packPrice / packSize)
  quantity: number; // quantity per plate
  totalCost: number; // unitCost * quantity
}

export interface Meal {
  id: string;
  name: string;
  accompanimentIds: string[];
  fees: FeeLine[];
  totalPlateCost: number; // sum of portion costs + fee totals
  desiredCostPercent: number; // e.g. 0.40
  preliminarySellingPrice: number;
  actualSellingPriceOverride?: number;
  actualCostPercent: number;
}

export interface QuoteMealItem {
  mealId: string;
  headcountOverride?: number;
  subtotal: number; // plateCost * headcount
}

export interface Quote {
  id: string;
  clientEventName: string;
  defaultHeadcount: number;
  meals: QuoteMealItem[];
  eventFoodCost: number; // sum of meal subtotals
  markupPercent: number; // e.g. 0.30 (30%)
  totalQuotedPrice: number; // eventFoodCost * (1 + markupPercent)
  pricePerHead: number; // totalQuotedPrice / headcount
  clientBudgetPerHead?: number;
  notes?: string;
  dateCreated: string;
}

export interface SpecialItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceUnit: string; // e.g. "Per kg", "Per 2kg box", "BUY 2 FOR"
  badge?: string; // e.g. "100% EKASI FRESH!", "A GRADE PREMIUM QUALITY", "SPECIAL BULK BUY PRICE"
  imageUrl?: string;
}

export type SpecialStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface StoreSpecial {
  id: string;
  storeName: string;
  catalogueTitle: string;
  subtitle?: string;
  validFrom: string; // e.g. "2026-07-31"
  validUntil: string; // e.g. "2026-08-01"
  validityText?: string; // e.g. "Promotion valid from 11 - 15 August 2026"
  fileUrl?: string; // Data URL or Image/PDF object URL
  fileType?: 'image' | 'pdf';
  fileName?: string;
  fileSize?: string;
  status: SpecialStatus;
  rejectionReason?: string;
  uploadedBy: string;
  dateUploaded: string;
  items: SpecialItem[];
  termsAndConditions?: string;
  contactNumber?: string;
  location?: string;
}

