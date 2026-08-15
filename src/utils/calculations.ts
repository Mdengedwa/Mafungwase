import {
  OrderItem,
  AccompanimentIngredient,
  Accompaniment,
  FeeLine,
  Meal,
  Quote,
  SpoonInfo,
} from '../types';

/**
 * Format currency in South African Rand (R)
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || !isFinite(value)) return 'R 0.00';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace('ZAR', 'R');
}

/**
 * Format decimal as percentage (e.g., 0.4 -> "40.0%")
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Calculate Price per Base Unit (kg, L, each, etc.) from pack parameters
 */
export function calculatePricePerUnit(
  packPrice: number,
  packWeight: number,
  packUnit: string,
  baseUnit?: string
): number {
  if (!packWeight || packWeight <= 0 || !packPrice || packPrice < 0) return 0;

  const pUnit = (packUnit || 'g').toLowerCase();
  const bUnit = (baseUnit || '').toLowerCase();

  // If discrete count / each
  if (pUnit === 'each' || pUnit === 'ea' || bUnit === 'each' || bUnit === 'ea') {
    return packPrice / packWeight;
  }

  // Liquid volume calculation (ml -> L or L -> L or ml -> ml)
  if (pUnit === 'ml') {
    if (bUnit === 'ml') {
      return packPrice / packWeight;
    }
    // Standard liquid base unit is Litres (L)
    return (packPrice / packWeight) * 1000;
  }
  if (pUnit === 'l' || pUnit === 'litre' || pUnit === 'litres') {
    if (bUnit === 'ml') {
      return packPrice / (packWeight * 1000);
    }
    return packPrice / packWeight;
  }

  // Mass / Weight calculation (g -> kg or kg -> kg or g -> g)
  if (pUnit === 'g' || pUnit === 'grams') {
    if (bUnit === 'g') {
      return packPrice / packWeight;
    }
    // Standard mass base unit is Kilograms (kg)
    return (packPrice / packWeight) * 1000;
  }
  if (pUnit === 'kg' || pUnit === 'kilograms') {
    if (bUnit === 'g') {
      return packPrice / (packWeight * 1000);
    }
    return packPrice / packWeight;
  }

  // Fallback for custom retail units (bunch, tray, can, etc.)
  return packPrice / packWeight;
}

/**
 * Spoon type density estimation helper table (grams per tablespoon / standard scoop)
 */
export const SPOON_DENSITIES: Record<
  SpoonInfo['spoonType'],
  { label: string; gramsPerSpoon: number; description: string }
> = {
  liquid: {
    label: 'Liquid / Oil / Broth',
    gramsPerSpoon: 15,
    description: '~15g per tablespoon',
  },
  rice_grain: {
    label: 'Rice / Grains / Couscous',
    gramsPerSpoon: 45, // approx 1 standard serving scoop / 3 tablespoons
    description: '~45g per standard spoon scoop',
  },
  chopped_veg: {
    label: 'Chopped Veggies / Salad',
    gramsPerSpoon: 35,
    description: '~35g per salad spoon',
  },
  sauce: {
    label: 'Thick Sauce / Mayo / Mint Yoghurt',
    gramsPerSpoon: 20,
    description: '~20g per tablespoon',
  },
  meat_stew: {
    label: 'Meat Stew / Chicken Pieces',
    gramsPerSpoon: 65,
    description: '~65g per ladle / serving spoon',
  },
  other: {
    label: 'Other / General Food',
    gramsPerSpoon: 25,
    description: '~25g per general spoon',
  },
};

export function calculateSpoonGrams(
  spoonType: SpoonInfo['spoonType'],
  spoonCount: number
): number {
  const density = SPOON_DENSITIES[spoonType]?.gramsPerSpoon || 25;
  return Math.round(spoonCount * density);
}

/**
 * Calculate single ingredient row metrics with full support for liquids (ml, L), weight (g, kg), and counts (each)
 */
export function calculateIngredientRow(
  ingredient: Partial<AccompanimentIngredient>,
  overrideUnit?: 'g' | 'kg' | 'ml' | 'L' | 'each'
): AccompanimentIngredient {
  const quantityUsed = ingredient.quantityUsed || 0;
  const eyPercent =
    ingredient.eyPercent !== undefined && ingredient.eyPercent > 0
      ? ingredient.eyPercent
      : 1.0;
  const costPerUnit = ingredient.costPerUnit || 0;

  // Determine explicit unit and baseUnit
  const unit = overrideUnit || ingredient.unit || 'g';
  const baseUnit = ingredient.baseUnit || (unit === 'ml' || unit === 'L' ? 'L' : unit === 'each' ? 'each' : 'kg');

  // As-Purchased Quantity = Quantity used * EY%
  const asPurchasedQty = quantityUsed * eyPercent;

  // Cost calculation based on measurement unit and pricing base unit
  let individualCost = 0;

  if (unit === 'each') {
    individualCost = asPurchasedQty * costPerUnit;
  } else if (unit === 'g') {
    if (baseUnit === 'g') {
      individualCost = asPurchasedQty * costPerUnit;
    } else {
      // Base unit is kg (R/kg) -> divide grams by 1000
      individualCost = (asPurchasedQty / 1000) * costPerUnit;
    }
  } else if (unit === 'kg') {
    if (baseUnit === 'g') {
      individualCost = (asPurchasedQty * 1000) * costPerUnit;
    } else {
      individualCost = asPurchasedQty * costPerUnit;
    }
  } else if (unit === 'ml') {
    if (baseUnit === 'ml') {
      individualCost = asPurchasedQty * costPerUnit;
    } else {
      // Base unit is L (R/L) -> divide ml by 1000
      individualCost = (asPurchasedQty / 1000) * costPerUnit;
    }
  } else if (unit === 'L') {
    if (baseUnit === 'ml') {
      individualCost = (asPurchasedQty * 1000) * costPerUnit;
    } else {
      individualCost = asPurchasedQty * costPerUnit;
    }
  } else {
    individualCost = asPurchasedQty * costPerUnit;
  }

  return {
    id: ingredient.id || `ing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderItemId: ingredient.orderItemId,
    name: ingredient.name || 'Unnamed Ingredient',
    isManual: ingredient.isManual ?? false,
    quantityUsed,
    unit,
    baseUnit,
    eyPercent,
    asPurchasedQty,
    costPerUnit,
    individualCost,
  };
}

/**
 * Calculate complete Accompaniment metrics
 */
export function recalculateAccompaniment(acc: Accompaniment): Accompaniment {
  // 1. Recalculate each ingredient
  const updatedIngredients = acc.ingredients.map((ing) => {
    return calculateIngredientRow(ing);
  });

  // 2. Sum Total Ingredient Cost
  const totalIngredientCost = updatedIngredients.reduce(
    (sum, ing) => sum + (ing.individualCost || 0),
    0
  );

  // 3. Recipe Cost = Total Ingredient Cost * (1 + Q Factor %)
  const qFactorPercent =
    acc.qFactorPercent !== undefined ? acc.qFactorPercent : 0.10;
  const recipeCost = totalIngredientCost * (1 + qFactorPercent);

  // 4. Recipe Batch Quantity (grams/ml) = Tally (sum) of As-Purchased Qty column
  const totalAsPurchasedQty = updatedIngredients.reduce((sum, ing) => {
    const qty = ing.asPurchasedQty || 0;
    if (ing.unit === 'kg' || ing.unit === 'L') {
      return sum + qty * 1000;
    }
    return sum + qty;
  }, 0);
  const batchQuantity = totalAsPurchasedQty > 0 ? totalAsPurchasedQty : (acc.batchQuantity > 0 ? acc.batchQuantity : 1000);

  // 5. Number of Portions = Batch Quantity / Standard Portion Size
  const portionSizeGrams = acc.portionSizeGrams > 0 ? acc.portionSizeGrams : 150;
  const numberOfPortions = portionSizeGrams > 0 ? batchQuantity / portionSizeGrams : 1;

  // 5. Portion Cost = Recipe Cost / Number of Portions
  const portionCost = numberOfPortions > 0 ? recipeCost / numberOfPortions : recipeCost;

  // 6. Desired Cost % & Selling Prices
  const desiredCostPercent =
    acc.desiredCostPercent && acc.desiredCostPercent > 0 ? acc.desiredCostPercent : 0.40;
  const preliminarySellingPrice = portionCost / desiredCostPercent;
  const actualSellingPrice =
    acc.actualSellingPriceOverride !== undefined && acc.actualSellingPriceOverride > 0
      ? acc.actualSellingPriceOverride
      : preliminarySellingPrice;
  const actualCostPercent = actualSellingPrice > 0 ? portionCost / actualSellingPrice : 0;

  return {
    ...acc,
    ingredients: updatedIngredients,
    qFactorPercent,
    totalIngredientCost,
    recipeCost,
    portionSizeGrams,
    batchQuantity,
    numberOfPortions,
    portionCost,
    desiredCostPercent,
    preliminarySellingPrice,
    actualCostPercent,
  };
}

/**
 * Recalculate Meal calculations
 */
export function recalculateMeal(
  meal: Meal,
  accompaniments: Accompaniment[]
): Meal {
  // Sum Portion Costs of included accompaniments
  const includedAccompaniments = accompaniments.filter((a) =>
    meal.accompanimentIds.includes(a.id)
  );
  const accompanimentPortionCostsSum = includedAccompaniments.reduce(
    (sum, acc) => sum + (acc.portionCost || 0),
    0
  );

  // Recalculate fee lines (unitCost = packPrice / packSize if packSize > 0, totalCost = unitCost * quantity)
  const updatedFees = meal.fees.map((fee) => {
    let unitCost = fee.unitCost || 0;
    if (fee.packSize && fee.packSize > 0 && fee.packPrice !== undefined && fee.packPrice >= 0) {
      unitCost = fee.packPrice / fee.packSize;
    }
    const quantity = fee.quantity !== undefined ? fee.quantity : 1;
    const totalCost = unitCost * quantity;
    return {
      ...fee,
      unitCost,
      quantity,
      totalCost,
    };
  });

  // Sum fee lines
  const feesTotal = updatedFees.reduce((sum, fee) => sum + (fee.totalCost || 0), 0);

  // Total Plate Cost
  const totalPlateCost = accompanimentPortionCostsSum + feesTotal;

  // Desired Cost % & Selling Price
  const desiredCostPercent =
    meal.desiredCostPercent && meal.desiredCostPercent > 0
      ? meal.desiredCostPercent
      : 0.40;
  const preliminarySellingPrice =
    desiredCostPercent > 0 ? totalPlateCost / desiredCostPercent : 0;
  const actualSellingPrice =
    meal.actualSellingPriceOverride !== undefined && meal.actualSellingPriceOverride > 0
      ? meal.actualSellingPriceOverride
      : preliminarySellingPrice;
  const actualCostPercent = actualSellingPrice > 0 ? totalPlateCost / actualSellingPrice : 0;

  return {
    ...meal,
    fees: updatedFees,
    totalPlateCost,
    desiredCostPercent,
    preliminarySellingPrice,
    actualCostPercent,
  };
}

/**
 * Recalculate Quote totals
 */
export function recalculateQuote(quote: Quote, meals: Meal[]): Quote {
  const defaultHeadcount = quote.defaultHeadcount > 0 ? quote.defaultHeadcount : 1;

  const updatedMeals = quote.meals.map((item) => {
    const mealObj = meals.find((m) => m.id === item.mealId);
    const plateCost = mealObj ? mealObj.totalPlateCost : 0;
    const headcount = item.headcountOverride !== undefined ? item.headcountOverride : defaultHeadcount;
    const subtotal = plateCost * headcount;

    return {
      ...item,
      subtotal,
    };
  });

  const eventFoodCost = updatedMeals.reduce((sum, item) => sum + item.subtotal, 0);
  const markupPercent = quote.markupPercent !== undefined ? quote.markupPercent : 0.30;
  const totalQuotedPrice = eventFoodCost * (1 + markupPercent);

  // Total headcount calculation (sum of headcounts or default head count if single meal)
  const totalHeadcount = updatedMeals.reduce((acc, curr) => {
    return curr.headcountOverride !== undefined ? Math.max(acc, curr.headcountOverride) : Math.max(acc, defaultHeadcount);
  }, defaultHeadcount);

  const pricePerHead = totalHeadcount > 0 ? totalQuotedPrice / totalHeadcount : 0;

  return {
    ...quote,
    defaultHeadcount,
    meals: updatedMeals,
    eventFoodCost,
    markupPercent,
    totalQuotedPrice,
    pricePerHead,
  };
}
