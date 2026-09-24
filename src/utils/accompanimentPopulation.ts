import { OrderItem, AccompanimentIngredient } from '../types';
import { calculateIngredientRow } from './calculations';

/**
 * Common culinary stop-words that should not independently trigger a match
 */
const DESCRIPTIVE_STOPWORDS = new Set([
  'fresh', 'white', 'brown', 'sweet', 'green', 'red', 'yellow', 'black',
  'spicy', 'hot', 'mild', 'fluffy', 'steamed', 'slow', 'braised', 'traditional',
  'style', 'catering', 'pack', 'cooked', 'grade', 'pure', 'crispy', 'homemade',
  'choice', 'whole', 'prime', 'commercial', 'fine', 'coarse', 'quality', 'selected'
]);

/**
 * Common South African culinary direct term mappings for lookup
 */
const SA_CULINARY_MAPPINGS: Record<string, string[]> = {
  chakalaka: ['chakalaka'],
  boerewors: ['boerewors'],
  wors: ['boerewors'],
  mogodu: ['tripe', 'mogodu'],
  ulusu: ['tripe', 'mogodu'],
  tripe: ['tripe', 'mogodu'],
  snoek: ['snoek'],
  hake: ['hake'],
  prawns: ['prawn'],
  calamari: ['calamari', 'squid'],
  salmon: ['salmon'],
  samp: ['samp'],
  'sugar beans': ['sugar beans'],
  pap: ['maize meal'],
  phutu: ['maize meal'],
  putu: ['maize meal'],
  imfino: ['spinach', 'swiss chard'],
  morogo: ['spinach', 'swiss chard'],
  spinach: ['spinach'],
  cabbage: ['cabbage'],
  butternut: ['butternut'],
  potatoes: ['potatoes'],
  mash: ['potatoes'],
  chips: ['potatoes'],
  fries: ['potatoes'],
  onions: ['onions'],
  tomatoes: ['tomatoes'],
  carrots: ['carrots'],
  chillies: ['chillies'],
  chilli: ['chillies'],
  gravy: ['onion soup', 'soup powder', 'basting', 'jus'],
  curry: ['curry powder', 'masala'],
  masala: ['masala'],
  aromat: ['aromat'],
  bacon: ['bacon'],
  cheddar: ['cheddar'],
  cheese: ['cheddar', 'cheese'],
  rice: ['parboiled', 'basmati', 'jasmine', 'long grain rice'],
  basmati: ['basmati'],
  jasmine: ['jasmine'],
  flour: ['wheat flour', 'bread flour', 'cake wheat flour'],
  yeast: ['baking yeast', 'yeast'],
  sugar: ['granulated sugar', 'sugar'],
  salt: ['table salt', 'sea salt'],
  butter: ['butter'],
  cream: ['fresh cream', 'cream'],
  milk: ['fresh milk', 'milk'],
  yoghurt: ['yoghurt'],
  rolls: ['bread rolls', 'cocktail rolls', 'rolls'],
  buns: ['hamburger buns', 'buns'],
  wrap: ['tortilla wraps', 'wrap'],
  wraps: ['tortilla wraps', 'wrap'],
  trotters: ['trotters'],
  amanqina: ['trotters'],
  oxtail: ['oxtail'],
  brisket: ['brisket'],
  rump: ['rump'],
  sirloin: ['sirloin'],
  't-bone': ['t-bone'],
  ribs: ['spare ribs', 'ribs'],
  'chicken breast': ['chicken breast'],
  'chicken leg': ['chicken leg quarters', 'drumsticks'],
  'chicken wings': ['chicken wings'],
  'chicken thighs': ['chicken thighs'],
  mutton: ['mutton'],
  lamb: ['lamb']
};

/**
 * Traditional South African Recipe Ingredient Breakdowns
 * Used when expanding an accompaniment into its constituent ingredients
 */
export const TRADITIONAL_RECIPE_EXPANSIONS: Record<string, string[]> = {
  'steamed dumpling': ['Cake Wheat Flour All Purpose', 'Instant Dry Active Baking Yeast', 'White Granulated Sugar', 'Fine Table Salt', 'Salted Butter Real Dairy'],
  'ujeqe': ['Cake Wheat Flour All Purpose', 'Instant Dry Active Baking Yeast', 'White Granulated Sugar', 'Fine Table Salt', 'Salted Butter Real Dairy'],
  'dombolo': ['White Bread Flour Commercial', 'Instant Dry Active Baking Yeast', 'White Granulated Sugar', 'Fine Table Salt'],
  'steamed bread': ['White Bread Flour Commercial', 'Instant Dry Active Baking Yeast', 'White Granulated Sugar', 'Fine Table Salt'],
  'phutu pap': ['Super Maize Meal', 'Fine Table Salt', 'Salted Butter Real Dairy'],
  'phutu': ['Super Maize Meal', 'Fine Table Salt', 'Salted Butter Real Dairy'],
  'stiff pap': ['Super Maize Meal', 'Fine Table Salt', 'Salted Butter Real Dairy'],
  'white pap': ['Super Maize Meal', 'Fine Table Salt'],
  'samp & sugar beans': ['Samp Quality White', 'Sugar Beans Grade A', 'Salted Butter Real Dairy', 'Knorrox Beef Stock Cubes'],
  'umngqusho': ['Samp Quality White', 'Sugar Beans Grade A', 'Salted Butter Real Dairy', 'Knorrox Beef Stock Cubes'],
  'chilli & onion gravy': ['Fresh Green Chillies Birdseye', 'Brown Onions First Grade', 'Royco Brown Onion Soup Powder'],
  'tomato & onion sambal': ['Round Tomatoes Jam / Salad Grade', 'Red Onions Premium', 'Fresh Green Chillies', 'Fresh Coriander / Dhania'],
  'tomato & onion sheba': ['Round Tomatoes Jam / Salad Grade', 'Brown Onions First Grade', 'Sunflower Cooking Oil Commercial', 'Fine Table Salt'],
  'creamy braised spinach': ['Fresh Green Spinach / Swiss Chard', 'Fresh Fresh Cream UHT', 'Brown Onions First Grade', 'Salted Butter Real Dairy'],
  'potato salad': ['Potatoes Medium Washed', 'Crosse & Blackwell Tangy Mayonnaise', 'Fresh Spring Onions', 'Fresh Large Eggs'],
  'coleslaw': ['Green Cabbage Large Head', 'Carrots Washed Grade 1', 'Crosse & Blackwell Tangy Mayonnaise', 'White Granulated Sugar']
};

/**
 * Cleans an ingredient / accompaniment name by removing bracketed phrases and punctuation
 */
export function cleanName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches the active Order List for a match based on the given query
 */
export function findMatchingOrderItem(query: string, orderList: OrderItem[]): OrderItem | null {
  if (!query || !orderList || orderList.length === 0) return null;

  const rawLower = query.toLowerCase().trim();
  const cleaned = cleanName(query).toLowerCase();

  // 1. Direct exact match against itemDescription
  const exact = orderList.find((i) => i.itemDescription.toLowerCase() === rawLower);
  if (exact) return exact;

  const cleanExact = orderList.find((i) => cleanName(i.itemDescription).toLowerCase() === cleaned);
  if (cleanExact) return cleanExact;

  // 2. Direct inclusion (the order item contains the query or vice-versa)
  if (cleaned.length >= 4) {
    const included = orderList.find((i) => {
      const desc = i.itemDescription.toLowerCase();
      return desc.includes(cleaned) || (desc.length >= 4 && cleaned.includes(desc));
    });
    if (included) return included;
  }

  // 3. Domain mappings check
  for (const [key, searchTerms] of Object.entries(SA_CULINARY_MAPPINGS)) {
    if (cleaned.includes(key) || rawLower.includes(key)) {
      for (const term of searchTerms) {
        const found = orderList.find((i) => i.itemDescription.toLowerCase().includes(term));
        if (found) return found;
      }
    }
  }

  // 4. Token-based matching (excluding stop-words)
  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !DESCRIPTIVE_STOPWORDS.has(t));

  if (tokens.length > 0) {
    // Try finding an item that contains all distinctive tokens
    const allTokensMatch = orderList.find((i) => {
      const desc = i.itemDescription.toLowerCase();
      return tokens.every((tok) => desc.includes(tok));
    });
    if (allTokensMatch) return allTokensMatch;

    // Try longest distinctive token first
    const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);
    for (const tok of sortedTokens) {
      if (tok.length >= 4) {
        const tokenMatch = orderList.find((i) => i.itemDescription.toLowerCase().includes(tok));
        if (tokenMatch) return tokenMatch;
      }
    }
  }

  return null;
}

/**
 * Automatically populates the "ingredient cost breakdown" for a meal accompaniment.
 * 
 * Rules:
 * 1. Checks if the accompaniment matches a compound ingredient list (e.g. "Samp & Sugar Beans", "Green Beans & Bacon").
 * 2. If compound: looks up each ingredient in the Order List.
 *    - If found: links to the Order List item.
 *    - If not found: creates a custom entry with that ingredient name.
 * 3. If single / non-compound: looks up the accompaniment in the Order List.
 *    - If found: links to the Order List item.
 *    - If not found: creates a custom entry with that accompaniment name.
 */
export function populateAccompanimentIngredients(
  accompanimentName: string,
  orderList: OrderItem[],
  options?: {
    portionGrams?: number;
    preferRecipeExpansion?: boolean;
  }
): AccompanimentIngredient[] {
  const name = accompanimentName.trim();
  const portionGrams = options?.portionGrams || 150;
  const ingredients: AccompanimentIngredient[] = [];

  // Check if expansion into scratch recipe ingredients was explicitly requested
  if (options?.preferRecipeExpansion) {
    const lowerName = name.toLowerCase();
    for (const [recipeKey, ingredientList] of Object.entries(TRADITIONAL_RECIPE_EXPANSIONS)) {
      if (lowerName.includes(recipeKey)) {
        return ingredientList.map((ingName, idx) => {
          const matched = findMatchingOrderItem(ingName, orderList);
          if (matched) {
            const isLiquid = matched.baseUnit === 'L' || matched.packUnit === 'ml';
            const isEach = matched.baseUnit === 'each' || matched.packUnit === 'each';
            return calculateIngredientRow({
              id: `ing-ord-${Date.now()}-${idx}`,
              orderItemId: matched.id,
              name: matched.itemDescription,
              isManual: false,
              quantityUsed: isEach ? 1 : (isLiquid ? Math.round(portionGrams * 0.2) : Math.round(portionGrams * 0.3)),
              unit: isEach ? 'each' : (isLiquid ? 'ml' : 'g'),
              baseUnit: matched.baseUnit,
              eyPercent: matched.estYieldPercent,
              costPerUnit: matched.pricePerUnit,
            });
          }
          return calculateIngredientRow({
            id: `ing-custom-${Date.now()}-${idx}`,
            name: ingName,
            isManual: true,
            orderItemId: undefined,
            quantityUsed: Math.round(portionGrams * 0.3),
            unit: 'g',
            baseUnit: 'kg',
            eyPercent: 1.0,
            costPerUnit: 0,
          });
        });
      }
    }
  }

  // Check if compound accompaniment with multiple ingredients joined by '&', '+', or ' and '
  // e.g. "Samp & Sugar Beans", "Chilli & Onion Gravy", "Tomato & Onion Sambal", "Green Beans & Bacon"
  const hasAnd = name.includes(' & ') || name.includes(' + ') || name.includes(' and ');
  if (hasAnd) {
    const rawParts = name.split(/\s*(?:&|\+| and )\s*/i).map((p) => p.trim()).filter(Boolean);
    if (rawParts.length > 1) {
      const partGrams = Math.max(50, Math.round(portionGrams / rawParts.length));
      rawParts.forEach((part, idx) => {
        const matched = findMatchingOrderItem(part, orderList);
        if (matched) {
          const isLiquid = matched.baseUnit === 'L' || matched.packUnit === 'ml';
          const isEach = matched.baseUnit === 'each' || matched.packUnit === 'each';
          ingredients.push(
            calculateIngredientRow({
              id: `ing-ord-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
              orderItemId: matched.id,
              name: matched.itemDescription,
              isManual: false,
              quantityUsed: isEach ? 1 : (isLiquid ? partGrams : partGrams),
              unit: isEach ? 'each' : (isLiquid ? 'ml' : 'g'),
              baseUnit: matched.baseUnit,
              eyPercent: matched.estYieldPercent,
              costPerUnit: matched.pricePerUnit,
            })
          );
        } else {
          // If not found in the order list, create a custom entry with that ingredient name
          ingredients.push(
            calculateIngredientRow({
              id: `ing-custom-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
              name: part,
              isManual: true,
              orderItemId: undefined,
              quantityUsed: partGrams,
              unit: 'g',
              baseUnit: 'kg',
              eyPercent: 1.0,
              costPerUnit: 0,
            })
          );
        }
      });
      return ingredients;
    }
  }

  // Look up the single accompaniment in the Order List
  const matched = findMatchingOrderItem(name, orderList);

  if (matched) {
    // Found in Order List: populate with matched item
    const isLiquid = matched.baseUnit === 'L' || matched.packUnit === 'ml';
    const isEach = matched.baseUnit === 'each' || matched.packUnit === 'each';
    ingredients.push(
      calculateIngredientRow({
        id: `ing-ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderItemId: matched.id,
        name: matched.itemDescription,
        isManual: false,
        quantityUsed: isEach ? 1 : (isLiquid ? portionGrams : portionGrams),
        unit: isEach ? 'each' : (isLiquid ? 'ml' : 'g'),
        baseUnit: matched.baseUnit,
        eyPercent: matched.estYieldPercent,
        costPerUnit: matched.pricePerUnit,
      })
    );
  } else {
    // NOT found in Order List: create a custom entry with that ingredient name
    ingredients.push(
      calculateIngredientRow({
        id: `ing-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name,
        isManual: true,
        orderItemId: undefined,
        quantityUsed: portionGrams,
        unit: 'g',
        baseUnit: 'kg',
        eyPercent: 1.0,
        costPerUnit: 0,
      })
    );
  }

  return ingredients;
}

/**
 * Checks if an accompaniment is currently using the old bogus single-chicken fallback
 * from previous versions (e.g. Chicken Fillets assigned to Steamed Dumpling or Chakalaka).
 */
export function isOldBogusFallback(acc: { name: string; ingredients: AccompanimentIngredient[] }): boolean {
  if (!acc.ingredients || acc.ingredients.length === 0) return true;
  if (acc.ingredients.length === 1) {
    const ing = acc.ingredients[0];
    const nameLower = acc.name.toLowerCase();
    const ingLower = ing.name.toLowerCase();
    if (!nameLower.includes('chicken') && !nameLower.includes('poultry') && ingLower.includes('chicken')) {
      return true;
    }
  }
  return false;
}
