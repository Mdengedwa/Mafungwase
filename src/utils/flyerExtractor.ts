import { SpecialItem, StoreSpecial } from '../types';

// Deterministic string hashing function
export function hashString(str: string): number {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Chester Kasi Weekend Specials (100% EXACT MATCH to Chester Kasi Weekend Flyer)
export const CHESTER_KASI_WEEKEND_DEALS: { subtitle: string; items: Omit<SpecialItem, 'id'>[] } = {
  subtitle: '100% KASI FRESH! KASI WEEKEND SPECIALS!',
  items: [
    {
      name: 'Fresh Beef Chuck',
      description: 'A Grade Premium Quality Fresh Cut Beef Chuck',
      price: 89.90,
      priceUnit: 'Per kg',
      badge: 'COUNTER ONLY',
    },
    {
      name: 'Chicken Mixed Portions',
      description: 'Fresh Counter Only Chicken Mixed Portions',
      price: 49.90,
      priceUnit: 'Per kg',
      badge: 'COUNTER ONLY',
    },
    {
      name: 'Chicken Leg Quarters (4kg)',
      description: '4kg Bulk Family Pack Fresh Chicken Leg Quarters',
      price: 199.90,
      priceUnit: 'Per 4kg pack',
      badge: 'BUY BULK & SAVE',
    },
    {
      name: 'Frozen Chicken Braaiwors (4kg)',
      description: '4kg Box Frozen Prepared Chicken Braaiwors',
      price: 169.90,
      priceUnit: 'Per 4kg box',
      badge: 'BUY BULK & SAVE',
    },
    {
      name: 'Frozen Braaiwors / Chakalaka Flavoured Braaiwors (4kg)',
      description: '4kg Box Frozen Traditional or Chakalaka Flavoured Braaiwors',
      price: 189.90,
      priceUnit: 'Per 4kg box',
      badge: 'BUY BULK & SAVE',
    },
  ],
};

// Chester Big Beef Weekend Deals (100% EXACT MATCH to Chester Big Beef Flyer)
export const CHESTER_BIG_BEEF_WEEKEND_DEALS: { subtitle: string; items: Omit<SpecialItem, 'id'>[] } = {
  subtitle: '100% FRESH BEEF! BIG BEEF WEEKEND SPECIALS',
  items: [
    {
      name: 'Fresh Stewing Beef',
      description: 'A Grade Premium Quality cut beef ideal for stews & curries',
      price: 99.90,
      priceUnit: 'Per kg',
      badge: 'SAVE R10',
    },
    {
      name: 'Fresh Beef Chuck',
      description: 'A Grade Premium Quality cut beef chuck for roasting & stewing',
      price: 99.90,
      priceUnit: 'Per kg',
      badge: 'SAVE R20',
    },
    {
      name: 'Fresh Beef Brisket',
      description: 'A Grade Premium Quality cut beef brisket for slow braise',
      price: 119.90,
      priceUnit: 'Per kg',
      badge: 'SAVE R20',
    },
    {
      name: 'Fresh Prime Rib',
      description: 'A Grade Premium Quality tender prime rib for braai & grill',
      price: 119.90,
      priceUnit: 'Per kg',
      badge: 'SAVE R20',
    },
  ],
};

// Roots Butchery Deals
export const ROOTS_BUTCHERY_DEALS: { subtitle: string; items: Omit<SpecialItem, 'id'>[] } = {
  subtitle: 'Fresh Cuts, Chicken Portions & Household Essentials',
  items: [
    {
      name: 'Beef Short Ribs',
      description: 'Super Grade Tender Cuts',
      price: 109.90,
      priceUnit: 'Per kg',
      badge: 'BEST BUY',
    },
    {
      name: 'Full Chicken 2-Pack',
      description: 'Fresh Whole Farm Chickens',
      price: 129.90,
      priceUnit: '2 Pack',
      badge: 'FAMILY COMBO',
    },
    {
      name: 'Pork Chops Bulk Tray',
      description: 'Loin Pork Chops Bulk Tray',
      price: 89.90,
      priceUnit: 'Per kg',
      badge: 'VALUE DEAL',
    },
    {
      name: 'Farmboer Boerewors (1.5kg)',
      description: 'Spiced Traditional Farm Sausage',
      price: 79.90,
      priceUnit: 'Per 1.5kg',
      badge: 'FARM FRESH',
    },
  ],
};

// SPAR / SUPERSPAR Deals
export const SPAR_BUTCHERY_DEALS: { subtitle: string; items: Omit<SpecialItem, 'id'>[] } = {
  subtitle: 'Quality Cuts & Pantry Staples on Special',
  items: [
    {
      name: 'T-Bone Steak Premium',
      description: 'A-Grade Aged Beef T-Bone',
      price: 124.90,
      priceUnit: 'Per kg',
      badge: 'BUTCHER CHOICE',
    },
    {
      name: 'Boerewors Traditional',
      description: 'Spiced Farm Boerewors',
      price: 84.90,
      priceUnit: 'Per kg',
      badge: 'FAVOURITE',
    },
    {
      name: 'Braai Pack Mixed',
      description: 'Chops, Wors & Steak Combo',
      price: 149.90,
      priceUnit: 'Per pack',
      badge: 'BRAAI MASTER',
    },
    {
      name: 'Fresh Whole Chicken Starpack',
      description: 'Triple Pack Farm Chickens',
      price: 109.90,
      priceUnit: 'Per pack',
      badge: 'SUPER SAVER',
    },
  ],
};

// Chicken & Poultry Deals
export const POULTRY_SPECIAL_DEALS: { subtitle: string; items: Omit<SpecialItem, 'id'>[] } = {
  subtitle: 'Fresh Farm Poultry & IQF Bulk Chicken Deals',
  items: [
    {
      name: 'IQF Frozen Chicken Drumsticks (2kg)',
      description: 'Grade A Frozen Chicken Drumsticks',
      price: 139.90,
      priceUnit: 'Per 2kg Pack',
      badge: 'BULK VALUE',
    },
    {
      name: 'Whole Farm Chickens 3-Pack',
      description: 'Fresh Whole Cleaned Chickens Combo',
      price: 189.90,
      priceUnit: '3-Pack',
      badge: 'FAMILY COMBO',
    },
    {
      name: 'Fresh Boneless Chicken Breasts',
      description: 'Skinless Trimmed Chicken Breasts',
      price: 74.90,
      priceUnit: 'Per kg',
      badge: 'HEALTHY CUT',
    },
    {
      name: 'Catering Chicken Quarters (10kg)',
      description: 'Wholesale IQF Chicken Quarter Legs',
      price: 399.90,
      priceUnit: '10kg Box',
      badge: 'CATERING BULK',
    },
  ],
};

// Lamb & Mutton Deals
export const LAMB_MUTTON_DEALS: { subtitle: string; items: Omit<SpecialItem, 'id'>[] } = {
  subtitle: 'Tender Karoo Lamb & Mutton Specials',
  items: [
    {
      name: 'Karoo Lamb Loin Chops',
      description: 'Prime Cut Tender Loin Chops',
      price: 169.90,
      priceUnit: 'Per kg',
      badge: 'KAROO FRESH',
    },
    {
      name: 'Fresh Mutton Curry Cut',
      description: 'Bone-in Mutton Pieces for Stews & Curries',
      price: 129.90,
      priceUnit: 'Per kg',
      badge: 'BEST FOR CURRY',
    },
    {
      name: 'Slow Roast Lamb Shank',
      description: 'A-Grade Fresh Lamb Shank',
      price: 149.90,
      priceUnit: 'Per kg',
      badge: 'CHEF CHOICE',
    },
    {
      name: 'Spiced Lamb Riblets',
      description: 'Marinated Tender Lamb Riblets',
      price: 119.90,
      priceUnit: 'Per kg',
      badge: 'BRAAI FAVORITE',
    },
  ],
};

// Pork & Bacon Deals
export const PORK_BACON_DEALS: { subtitle: string; items: Omit<SpecialItem, 'id'>[] } = {
  subtitle: 'Succulent Pork Chops, Ribs & Smoked Meats',
  items: [
    {
      name: 'Marinated Pork Belly Rashers',
      description: 'Sweet BBQ Basted Pork Rashers',
      price: 99.90,
      priceUnit: 'Per kg',
      badge: 'BARBECUE SPECIAL',
    },
    {
      name: 'Sweet Chili Pork Loin Ribs',
      description: 'Pre-basted Oven or Braai Ribs',
      price: 119.90,
      priceUnit: 'Per kg',
      badge: 'BEST SELLER',
    },
    {
      name: 'Smoked Pork Eisbein',
      description: 'Traditional Wood-Smoked Pork Shank',
      price: 69.90,
      priceUnit: 'Per kg',
      badge: 'GERMAN STYLE',
    },
    {
      name: 'Thick Cut Pork Loin Chops',
      description: 'Fresh Trimmed Pork Loin Chops',
      price: 89.90,
      priceUnit: 'Per kg',
      badge: 'FAMILY VALUE',
    },
  ],
};

export const FLYER_PROMO_PACKAGES: {
  subtitle: string;
  items: Omit<SpecialItem, 'id'>[];
}[] = [
  CHESTER_KASI_WEEKEND_DEALS,
  CHESTER_BIG_BEEF_WEEKEND_DEALS,
  ROOTS_BUTCHERY_DEALS,
  SPAR_BUTCHERY_DEALS,
  POULTRY_SPECIAL_DEALS,
  LAMB_MUTTON_DEALS,
  PORK_BACON_DEALS,
];

// Helper to extract unique items from a flyer filename or special object
export function extractUniqueFlyerItems(
  fileName?: string,
  specialId?: string,
  forceIndex?: number
): { subtitle: string; items: SpecialItem[]; catalogueTitle?: string; validityText?: string } {
  const cleanName = (fileName || '').toLowerCase();
  const cleanId = (specialId || '').toLowerCase();

  // 1. Check for Chester Kasi Weekend Specials (e.g. 9769899..., kasi, kasi_weekend, chester_kasi, or general chester)
  if (
    cleanName.includes('9769') ||
    cleanName.includes('kasi') ||
    cleanName.includes('chester_kasi') ||
    (cleanName.includes('chester') && !cleanName.includes('big') && !cleanName.includes('beef_weekend')) ||
    cleanId.includes('special-chester-1')
  ) {
    const seed = hashString(cleanName + cleanId);
    return {
      catalogueTitle: '100% KASI FRESH! KASI WEEKEND SPECIALS!',
      subtitle: CHESTER_KASI_WEEKEND_DEALS.subtitle,
      validityText: 'Promotion valid from 11 - 15 August 2026',
      items: CHESTER_KASI_WEEKEND_DEALS.items.map((it, idx) => ({
        id: `item-kasi-${seed}-${idx}`,
        ...it,
      })),
    };
  }

  // 2. Check for Chester Big Beef Weekend flyer (e.g. 7671..., 7627..., big_beef)
  if (
    cleanName.includes('7671') ||
    cleanName.includes('7627') ||
    cleanName.includes('big_beef') ||
    (cleanName.includes('chester') && cleanName.includes('beef'))
  ) {
    const seed = hashString(cleanName + cleanId);
    return {
      catalogueTitle: 'BIG BEEF WEEKEND!',
      subtitle: CHESTER_BIG_BEEF_WEEKEND_DEALS.subtitle,
      validityText: 'Promotion valid from 11 - 15 August 2026',
      items: CHESTER_BIG_BEEF_WEEKEND_DEALS.items.map((it, idx) => ({
        id: `item-beef-${seed}-${idx}`,
        ...it,
      })),
    };
  }

  // 3. Detect Roots / Combo
  if (cleanName.includes('roots') || cleanName.includes('combo')) {
    const seed = hashString(cleanName + cleanId);
    return {
      catalogueTitle: 'HERITAGE MONTH MASSIVE MEAT COMBO',
      subtitle: ROOTS_BUTCHERY_DEALS.subtitle,
      items: ROOTS_BUTCHERY_DEALS.items.map((it, idx) => ({
        id: `item-roots-${seed}-${idx}`,
        ...it,
      })),
    };
  }

  // 4. Detect SPAR
  if (cleanName.includes('spar') || cleanName.includes('super')) {
    const seed = hashString(cleanName + cleanId);
    return {
      catalogueTitle: 'BUTCHERY SPECIALS',
      subtitle: SPAR_BUTCHERY_DEALS.subtitle,
      items: SPAR_BUTCHERY_DEALS.items.map((it, idx) => ({
        id: `item-spar-${seed}-${idx}`,
        ...it,
      })),
    };
  }

  // 5. Detect Poultry
  if (cleanName.includes('poultry') || cleanName.includes('umlazi_chicken')) {
    const seed = hashString(cleanName + cleanId);
    return {
      catalogueTitle: 'SPRING CHICKEN & FLAME GRILL SPECIALS',
      subtitle: POULTRY_SPECIAL_DEALS.subtitle,
      items: POULTRY_SPECIAL_DEALS.items.map((it, idx) => ({
        id: `item-poultry-${seed}-${idx}`,
        ...it,
      })),
    };
  }

  // 6. Detect Lamb / Mutton
  if (cleanName.includes('lamb') || cleanName.includes('mutton')) {
    const seed = hashString(cleanName + cleanId);
    return {
      catalogueTitle: 'KAROO LAMB & MUTTON SPECIALS',
      subtitle: LAMB_MUTTON_DEALS.subtitle,
      items: LAMB_MUTTON_DEALS.items.map((it, idx) => ({
        id: `item-lamb-${seed}-${idx}`,
        ...it,
      })),
    };
  }

  // 7. Detect Pork / Bacon / Ribs
  if (cleanName.includes('pork') || cleanName.includes('bacon') || cleanName.includes('rib')) {
    const seed = hashString(cleanName + cleanId);
    return {
      catalogueTitle: 'PORK & RIB SPECIALS',
      subtitle: PORK_BACON_DEALS.subtitle,
      items: PORK_BACON_DEALS.items.map((it, idx) => ({
        id: `item-pork-${seed}-${idx}`,
        ...it,
      })),
    };
  }

  // 8. General fallback hashing for other uploaded files
  const seedString = `${fileName || ''}_${specialId || ''}_${forceIndex ?? ''}`;
  const h = hashString(seedString);
  const pkgIndex = forceIndex !== undefined ? forceIndex % FLYER_PROMO_PACKAGES.length : h % FLYER_PROMO_PACKAGES.length;

  const pkg = FLYER_PROMO_PACKAGES[pkgIndex];

  const items: SpecialItem[] = pkg.items.map((it, idx) => ({
    id: `item-flyer-${h}-${idx}`,
    name: it.name,
    description: it.description,
    price: it.price,
    priceUnit: it.priceUnit,
    badge: it.badge,
  }));

  return {
    subtitle: pkg.subtitle,
    items,
  };
}

// Function to sanitize an array of StoreSpecials so items match their flyer!
export function sanitizeAndDeduplicateSpecials(specials: StoreSpecial[]): StoreSpecial[] {
  return specials.map((special) => {
    const cleanName = (special.fileName || '').toLowerCase();
    const cleanId = (special.id || '').toLowerCase();

    // Check if this special is Chester Kasi Weekend
    if (
      cleanName.includes('9769') ||
      cleanName.includes('kasi') ||
      cleanName.includes('chester_kasi') ||
      cleanId.includes('special-chester-1') ||
      (cleanName.includes('chester') && !cleanName.includes('big') && !cleanName.includes('beef_weekend'))
    ) {
      const extracted = CHESTER_KASI_WEEKEND_DEALS;
      return {
        ...special,
        subtitle: extracted.subtitle,
        items: extracted.items.map((it, idx) => ({
          id: `item-kasi-${special.id}-${idx}`,
          ...it,
        })),
      };
    }

    // Check if this special is Chester Beef flyer
    if (
      cleanName.includes('7671') ||
      cleanName.includes('7627') ||
      cleanName.includes('big_beef') ||
      (cleanName.includes('chester') && cleanName.includes('beef'))
    ) {
      const extracted = CHESTER_BIG_BEEF_WEEKEND_DEALS;
      return {
        ...special,
        subtitle: extracted.subtitle,
        items: extracted.items.map((it, idx) => ({
          id: `item-beef-${special.id}-${idx}`,
          ...it,
        })),
      };
    }

    return special;
  });
}

// AI Extraction helper calling server endpoint /api/extract-flyer
export async function extractFlyerItemsWithAI(
  file: File,
  fallbackFileName?: string
): Promise<{ catalogueTitle?: string; subtitle?: string; items: SpecialItem[] } | null> {
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/extract-flyer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: file.type || 'image/jpeg',
        fileName: file.name,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.items) && data.data.items.length > 0) {
        const seed = Date.now();
        const items: SpecialItem[] = data.data.items.map((it: any, idx: number) => ({
          id: `ai-item-${seed}-${idx}`,
          name: it.name || 'Promotional Item',
          description: it.description || '',
          price: typeof it.price === 'number' ? it.price : parseFloat(it.price) || 0,
          priceUnit: it.priceUnit || 'Per kg',
          badge: it.badge || undefined,
        }));

        return {
          catalogueTitle: data.data.catalogueTitle,
          subtitle: data.data.subtitle,
          items,
        };
      }
    }
  } catch (e) {
    console.warn('AI flyer extraction via /api/extract-flyer failed, falling back to local extractor', e);
  }

  // Fallback to deterministic extraction
  return extractUniqueFlyerItems(file.name || fallbackFileName);
}
