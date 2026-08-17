import { OrderItem, PackType, PackUnit, BaseUnit } from '../types';
import { calculatePricePerUnit } from './calculations';
import { isDateExpiredOrInvalid } from './dateCleanup';

export interface ParsedCsvRow {
  rowIndex: number;
  raw: Record<string, string>;
  item: OrderItem;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface CsvParseResult {
  rows: ParsedCsvRow[];
  totalRowsCount: number;
  validCount: number;
  invalidCount: number;
  headersDetected: string[];
}

/**
 * Robust RFC 4180 compliant CSV line tokenizer
 * Handles commas, double-quotes, and multi-line quoted fields.
 */
export function tokenizeCsv(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  // Normalize line endings
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        cell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
        i++;
        continue;
      } else if (char === '\n') {
        row.push(cell.trim());
        cell = '';
        if (row.length > 0 && row.some((c) => c.length > 0)) {
          result.push(row);
        }
        row = [];
        i++;
        continue;
      } else {
        cell += char;
        i++;
        continue;
      }
    }
  }

  // Final cell & row if file doesn't end with newline
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) {
      result.push(row);
    }
  }

  return result;
}

/**
 * Standardize known categories
 */
export function normalizeCategory(cat: string): string {
  const c = (cat || '').trim().toLowerCase();
  if (c.includes('poultr') || c.includes('chicken') || c.includes('turkey') || c.includes('duck')) {
    return 'Poultry';
  }
  if (c.includes('meat') || c.includes('beef') || c.includes('pork') || c.includes('lamb') || c.includes('mutton') || c.includes('steak') || c.includes('mince') || c.includes('wors')) {
    return 'Meat & Beef';
  }
  if (c.includes('veg') || c.includes('produce') || c.includes('fruit') || c.includes('onion') || c.includes('potato') || c.includes('salad') || c.includes('spinach') || c.includes('herb')) {
    return 'Vegetables & Produce';
  }
  if (c.includes('spice') || c.includes('condiment') || c.includes('sauce') || c.includes('season') || c.includes('curry') || c.includes('salt') || c.includes('pepper') || c.includes('chakalaka') || c.includes('stock')) {
    return 'Spices & Condiments';
  }
  if (c.includes('packag') || c.includes('container') || c.includes('foil') || c.includes('box') || c.includes('tub') || c.includes('lid') || c.includes('cup') || c.includes('bag') || c.includes('cutlery') || c.includes('napkin')) {
    return 'Packaging';
  }
  if (c.includes('dairy') || c.includes('pantry') || c.includes('milk') || c.includes('cheese') || c.includes('butter') || c.includes('cream') || c.includes('flour') || c.includes('sugar') || c.includes('oil') || c.includes('rice') || c.includes('maize') || c.includes('pap')) {
    return 'Dairy & Pantry';
  }
  return cat.trim() || 'Dairy & Pantry';
}

/**
 * Normalize Pack Type
 */
export function normalizePackType(type: string): PackType {
  const t = (type || '').trim().toLowerCase();
  if (t === 'each' || t === 'ea' || t === 'unit') return 'Each';
  if (t === 'loose' || t === 'bulk' || t === 'kg' || t === 'per kg') return 'Loose';
  return 'Pack';
}

/**
 * Normalize Pack Unit
 */
export function normalizePackUnit(unit: string): PackUnit {
  const u = (unit || '').trim().toLowerCase();
  const validUnits: PackUnit[] = [
    'g', 'kg', 'ml', 'L', 'each', 'bunch', 'punnet', 'tray',
    'can', 'brick', 'slab', 'sachet', 'loaf', 'bottle', 'box', 'bag'
  ];
  if (u === 'gram' || u === 'grams') return 'g';
  if (u === 'kilo' || u === 'kilos' || u === 'kgs') return 'kg';
  if (u === 'litre' || u === 'litres' || u === 'liter' || u === 'liters' || u === 'l') return 'L';
  if (u === 'millilitre' || u === 'millilitres' || u === 'mls') return 'ml';
  if (u === 'ea' || u === 'unit' || u === 'pcs' || u === 'piece' || u === 'pieces') return 'each';
  if (validUnits.includes(u as PackUnit)) return u as PackUnit;
  return 'g';
}

/**
 * Infer Base Unit from Pack Unit if not provided
 */
export function inferBaseUnit(packUnit: PackUnit, explicitBaseUnit?: string): BaseUnit {
  if (explicitBaseUnit) {
    const b = explicitBaseUnit.trim().toLowerCase();
    if (b === 'kg' || b === 'kilo' || b === 'g') return b === 'g' ? 'g' : 'kg';
    if (b === 'l' || b === 'litre' || b === 'liter' || b === 'ml') return b === 'ml' ? 'ml' : 'L';
    if (b === 'each' || b === 'ea' || b === 'unit') return 'each';
  }

  if (packUnit === 'ml' || packUnit === 'L') {
    return 'L';
  }
  if (['each', 'bunch', 'punnet', 'tray', 'can', 'brick', 'slab', 'sachet', 'loaf', 'bottle', 'box', 'bag'].includes(packUnit)) {
    return 'each';
  }
  return 'kg';
}

/**
 * Clean and parse currency/number
 */
/**
 * Clean and parse currency/number
 * Handles South African formats: "R 185.00", "R185,00", "1 250.50", "1,250.00", "45,99", etc.
 */
export function parseNumber(val: string | number | undefined, defaultVal = 0): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const str = val.toString().trim();
  if (str === '' || str === '-' || str === 'N/A' || str === 'n/a' || str === 'nil') return defaultVal;

  // Extract raw numeric string with decimal points / commas
  let cleaned = str
    .replace(/^(ZAR|R|\$|€|£)\s*/i, '')
    .replace(/\s*(ZAR|R|\$|€|£)$/i, '')
    .replace(/[^\d.,\-+]/g, '')
    .trim();

  if (!cleaned) return defaultVal;

  // Handle both comma and dot present: e.g. "1,250.50" or "1.250,50" or "1 250,50"
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      // European format: 1.250,50 -> 1250.50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Standard format: 1,250.50 -> 1250.50
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Single comma: e.g., "45,99" (decimal) vs "1,000" (thousands)
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultVal : parsed;
}

/**
 * Calculate Pack Price from Base Unit Price
 */
export function calculatePackPriceFromUnitPrice(
  unitPrice: number,
  packWeight: number,
  packUnit: string,
  baseUnit?: string
): number {
  if (!unitPrice || unitPrice <= 0 || !packWeight || packWeight <= 0) return 0;
  const pUnit = (packUnit || 'g').toLowerCase();
  const bUnit = (baseUnit || '').toLowerCase();

  if (pUnit === 'each' || pUnit === 'ea' || bUnit === 'each' || bUnit === 'ea') {
    return unitPrice * packWeight;
  }
  if (pUnit === 'g' || pUnit === 'grams') {
    if (bUnit === 'g') return unitPrice * packWeight;
    return unitPrice * (packWeight / 1000);
  }
  if (pUnit === 'kg' || pUnit === 'kilograms') {
    if (bUnit === 'g') return unitPrice * (packWeight * 1000);
    return unitPrice * packWeight;
  }
  if (pUnit === 'ml' || pUnit === 'millilitre') {
    if (bUnit === 'ml') return unitPrice * packWeight;
    return unitPrice * (packWeight / 1000);
  }
  if (pUnit === 'l' || pUnit === 'litre' || pUnit === 'litres') {
    if (bUnit === 'ml') return unitPrice * (packWeight * 1000);
    return unitPrice * packWeight;
  }
  return unitPrice * packWeight;
}

/**
 * Clean and parse yield percentage (e.g., "85%", "0.85", "85")
 */
export function parseYieldPercent(val: string | number | undefined): number {
  if (val === undefined || val === null) return 1.0;
  if (typeof val === 'number') {
    if (val > 1.0) return Math.min(val / 100, 1.0);
    return Math.max(0.01, Math.min(val, 1.0));
  }
  const clean = val.toString().replace('%', '').trim();
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return 1.0;
  if (num > 1.0) return Math.min(num / 100, 1.0);
  return Math.max(0.01, Math.min(num, 1.0));
}

/**
 * Main CSV Parser for Order List
 */
export function parseOrderListCsv(csvText: string): CsvParseResult {
  const tokenized = tokenizeCsv(csvText);

  if (tokenized.length === 0) {
    return {
      rows: [],
      totalRowsCount: 0,
      validCount: 0,
      invalidCount: 0,
      headersDetected: [],
    };
  }

  // Header detection
  const rawHeaders = tokenized[0];
  const headerMap: Record<string, number> = {};

  rawHeaders.forEach((h, colIndex) => {
    const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    headerMap[cleanH] = colIndex;
  });

  // Flexible column finder with exact, prefix, suffix, and contains matching
  const getCol = (row: string[], aliases: string[], matcher?: (headerName: string) => boolean): string => {
    // 1. Try exact cleaned alias match
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (headerMap[cleanAlias] !== undefined) {
        return row[headerMap[cleanAlias]] || '';
      }
    }

    // 2. Try prefix/contains on aliases
    for (const [headerClean, colIdx] of Object.entries(headerMap)) {
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (headerClean.includes(cleanAlias) || cleanAlias.includes(headerClean)) {
          return row[colIdx] || '';
        }
      }
    }

    // 3. Optional custom matcher against raw header names
    if (matcher) {
      for (let i = 0; i < rawHeaders.length; i++) {
        if (matcher(rawHeaders[i].toLowerCase())) {
          return row[i] || '';
        }
      }
    }

    return '';
  };

  const parsedRows: ParsedCsvRow[] = [];

  for (let r = 1; r < tokenized.length; r++) {
    const row = tokenized[r];
    if (row.length === 0 || row.every((c) => c.trim() === '')) {
      continue;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Description / Item Name
    const rawDesc = getCol(
      row,
      ['itemdescription', 'description', 'item', 'name', 'product', 'ingredient', 'itemname', 'productname', 'desc'],
      (h) => h.includes('desc') || h.includes('item') || h.includes('product') || h.includes('ingredient')
    );
    if (!rawDesc) {
      errors.push('Missing item description or name');
    }

    // Category
    const rawCategory = getCol(
      row,
      ['category', 'group', 'type', 'section', 'department', 'dept', 'classification'],
      (h) => h.includes('cat') || h.includes('group') || h.includes('dept')
    );
    const category = normalizeCategory(rawCategory);

    // Pack Type
    const rawPackType = getCol(
      row,
      ['packtype', 'type', 'pack_type', 'packagingtype'],
      (h) => h.includes('packtype') || h === 'type'
    );
    const packType = normalizePackType(rawPackType);

    // Pack Weight / Size
    const rawWeight = getCol(
      row,
      ['packweight', 'weight', 'size', 'packsize', 'pack_weight', 'pack_size', 'quantity', 'qty', 'volume', 'mass', 'packweightsize', 'packsizesize', 'packweightsizegml'],
      (h) => (h.includes('weight') || h.includes('size') || h.includes('qty') || h.includes('volume') || h.includes('mass')) && !h.includes('yield')
    );
    let packWeight = parseNumber(rawWeight, 1000);
    if (packWeight <= 0) {
      packWeight = 1000;
      warnings.push('Pack weight defaulted to 1000');
    }

    // Pack Unit
    const rawUnit = getCol(
      row,
      ['packunit', 'unit', 'uom', 'pack_unit', 'unitofmeasure', 'packageunit'],
      (h) => (h.includes('unit') || h.includes('uom') || h.includes('measure')) && !h.includes('price') && !h.includes('cost') && !h.includes('base')
    );
    const packUnit = normalizePackUnit(rawUnit || (packType === 'Each' ? 'each' : 'g'));

    // Base Unit
    const rawBaseUnit = getCol(
      row,
      ['baseunit', 'base_unit', 'costunit', 'cost_unit', 'pricingunit', 'priceunit'],
      (h) => h.includes('base') || h.includes('costunit')
    );
    const baseUnit = inferBaseUnit(packUnit, rawBaseUnit);

    // Pack Price (Matches "Pack Price", "Pack Price (R)", "Price", "Cost (R)", "Price (ZAR)", "Amount", "Amount (R)", "Total", "Price/Pack", etc.)
    const rawPackPrice = getCol(
      row,
      [
        'packprice', 'packpricer', 'packpricezar', 'price', 'pricer', 'pricezar',
        'cost', 'costr', 'costzar', 'rand', 'packcost', 'packcostr',
        'amount', 'amountr', 'amountzar', 'costprice', 'buyingprice', 'purchaseprice',
        'rate', 'packrate', 'retailprice', 'priceperpack', 'pricepack',
        'priceinclvat', 'priceexclvat', 'priceincvat', 'priceexvat', 'r', 'zar'
      ],
      (h) => (h.includes('pack price') || h.includes('packprice') || h.includes('pack cost') || h.includes('price (r)') || h.includes('price(r)') || h.includes('cost (r)') || h.includes('cost(r)') || (h.includes('price') && !h.includes('unit') && !h.includes('base') && !h.includes('calculated')))
    );
    let packPrice = parseNumber(rawPackPrice, 0);

    // Unit Price / Calculated Price column if provided directly
    const rawUnitPrice = getCol(
      row,
      [
        'priceperunit', 'priceunit', 'calculatedpriceunit', 'calculatedprice', 'unitprice',
        'unitpricer', 'unitcost', 'costperunit', 'priceperkg', 'pricel', 'priceperlitre',
        'unitpricezar', 'calculatedpriceperunit', 'calculatedpriceperunitr'
      ],
      (h) => h.includes('calculated') || h.includes('unit price') || h.includes('price/unit') || h.includes('price / unit') || h.includes('per unit') || h.includes('cost/unit') || h.includes('price per base unit')
    );
    const explicitUnitPrice = parseNumber(rawUnitPrice, 0);

    // If Pack Price was missing or 0 but Unit Price was supplied, compute Pack Price
    if (packPrice <= 0 && explicitUnitPrice > 0) {
      packPrice = calculatePackPriceFromUnitPrice(explicitUnitPrice, packWeight, packUnit, baseUnit);
    }

    // Calculated price per base unit
    let pricePerUnit = calculatePricePerUnit(packPrice, packWeight, packUnit, baseUnit);
    if (pricePerUnit <= 0 && explicitUnitPrice > 0) {
      pricePerUnit = explicitUnitPrice;
    }

    if (packPrice <= 0 && pricePerUnit <= 0) {
      warnings.push('Price is R 0.00 (verify cost/price column)');
    }

    // Yield Percent
    const rawYield = getCol(
      row,
      ['estyieldpercent', 'yield', 'yieldpercent', 'yield_percent', 'est_yield', 'yield%', 'estyield', 'usableyield', 'recovery'],
      (h) => h.includes('yield') || h.includes('recovery') || h.includes('usable')
    );
    const estYieldPercent = parseYieldPercent(rawYield || '100%');

    // Yield Note
    const rawYieldNote = getCol(
      row,
      ['yieldnote', 'yield_note', 'notes', 'trimnote', 'note', 'comment', 'remarks'],
      (h) => h.includes('note') || h.includes('comment') || h.includes('remark') || h.includes('trim')
    );
    const yieldNote = rawYieldNote.trim() || (estYieldPercent === 1.0 ? '100% usable' : 'Trimmed loss');

    // Source / Supplier
    const rawSource = getCol(
      row,
      ['source', 'supplier', 'vendor', 'store', 'shop', 'wholesaler', 'merchant', 'brand', 'suppliersource'],
      (h) => h.includes('source') || h.includes('supplier') || h.includes('vendor') || h.includes('store') || h.includes('shop')
    );
    const source = rawSource.trim() || 'Supplier Direct';

    // Source URL
    const rawSourceUrl = getCol(
      row,
      ['sourceurl', 'source_url', 'url', 'link', 'website', 'producturl', 'itemurl'],
      (h) => h.includes('url') || h.includes('link') || h.includes('web') || h.includes('http')
    );
    const sourceUrl = rawSourceUrl.trim() || undefined;

    // Ending Date / Promo End
    const rawEndingDate = getCol(
      row,
      ['endingdate', 'ending_date', 'expirydate', 'expiry_date', 'enddate', 'promoend', 'promotionendingdate', 'validuntil', 'validto'],
      (h) => h.includes('ending') || h.includes('expiry') || h.includes('promo') || h.includes('valid')
    );
    let endingDate: string | undefined = rawEndingDate.trim() || undefined;
    if (endingDate && isDateExpiredOrInvalid(endingDate)) {
      warnings.push(`Ending date "${endingDate}" is expired or invalid format`);
      endingDate = undefined;
    }

    // Location
    const rawLocation = getCol(
      row,
      ['location', 'branch', 'store_location', 'city', 'storelocation', 'area', 'address'],
      (h) => h.includes('location') || h.includes('branch') || h.includes('city') || h.includes('area')
    );
    const location = rawLocation.trim() || undefined;

    const itemPayload: OrderItem = {
      id: `ord-csv-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      itemDescription: rawDesc.trim() || `Imported Item ${r}`,
      packType,
      packPrice,
      packWeight,
      packUnit,
      baseUnit,
      pricePerUnit,
      estYieldPercent,
      yieldNote,
      source,
      sourceUrl,
      endingDate,
      location,
      isFromCsv: true,
    };

    const rawRecord: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      rawRecord[h] = row[idx] || '';
    });

    parsedRows.push({
      rowIndex: r,
      raw: rawRecord,
      item: itemPayload,
      errors,
      warnings,
      isValid: errors.length === 0,
    });
  }

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return {
    rows: parsedRows,
    totalRowsCount: parsedRows.length,
    validCount,
    invalidCount,
    headersDetected: rawHeaders,
  };
}

/**
 * Convert Order List items to RFC 4180 CSV string
 */
export function exportOrderListToCsv(orderList: OrderItem[]): string {
  const headers = [
    'Category',
    'Item Description',
    'Pack Type',
    'Pack Price (R)',
    'Pack Weight/Size',
    'Pack Unit',
    'Base Unit',
    'Price Per Base Unit (R)',
    'Est Yield %',
    'Yield Note',
    'Supplier / Source',
    'Product URL',
    'Promotion Ending Date',
    'Store Location',
  ];

  const escapeCsvCell = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return '""';
    const str = val.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const rows = orderList.map((item) => [
    escapeCsvCell(item.category),
    escapeCsvCell(item.itemDescription),
    escapeCsvCell(item.packType),
    escapeCsvCell(item.packPrice.toFixed(2)),
    escapeCsvCell(item.packWeight),
    escapeCsvCell(item.packUnit),
    escapeCsvCell(item.baseUnit),
    escapeCsvCell(item.pricePerUnit.toFixed(2)),
    escapeCsvCell(`${Math.round(item.estYieldPercent * 100)}%`),
    escapeCsvCell(item.yieldNote),
    escapeCsvCell(item.source),
    escapeCsvCell(item.sourceUrl || ''),
    escapeCsvCell(item.endingDate || ''),
    escapeCsvCell(item.location || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate a ready-to-use Sample CSV Template
 */
export function generateSampleCsvTemplate(): string {
  const sampleData: Array<Record<string, string | number>> = [
    {
      Category: 'Poultry',
      'Item Description': 'Chicken Breast Fillets (Bulk Pack)',
      'Pack Type': 'Pack',
      'Pack Price (R)': 195.00,
      'Pack Weight/Size': 2000,
      'Pack Unit': 'g',
      'Base Unit': 'kg',
      'Est Yield %': '88%',
      'Yield Note': 'Skinless, trimmed fat loss',
      'Supplier / Source': 'Makro Wholesale',
      'Product URL': 'https://www.makro.co.za',
      'Promotion Ending Date': '2026-10-31',
      'Store Location': 'Nationwide',
    },
    {
      Category: 'Meat & Beef',
      'Item Description': 'Beef Chuck Stewing Meat',
      'Pack Type': 'Pack',
      'Pack Price (R)': 320.00,
      'Pack Weight/Size': 3000,
      'Pack Unit': 'g',
      'Base Unit': 'kg',
      'Est Yield %': '78%',
      'Yield Note': 'Bone & fat trim in stew prep',
      'Supplier / Source': 'Local Abattoir Butchery',
      'Product URL': '',
      'Promotion Ending Date': '',
      'Store Location': 'Durban North',
    },
    {
      Category: 'Vegetables & Produce',
      'Item Description': 'Brown Onions (10kg Pocket)',
      'Pack Type': 'Pack',
      'Pack Price (R)': 89.90,
      'Pack Weight/Size': 10000,
      'Pack Unit': 'g',
      'Base Unit': 'kg',
      'Est Yield %': '90%',
      'Yield Note': 'Peeled skin & root loss',
      'Supplier / Source': 'Fresh Produce Market',
      'Product URL': '',
      'Promotion Ending Date': '',
      'Store Location': 'City Market Hall 2',
    },
    {
      Category: 'Dairy & Pantry',
      'Item Description': 'Sunflower Cooking Oil (5L Can)',
      'Pack Type': 'Pack',
      'Pack Price (R)': 165.00,
      'Pack Weight/Size': 5000,
      'Pack Unit': 'ml',
      'Base Unit': 'L',
      'Est Yield %': '100%',
      'Yield Note': '100% usable oil',
      'Supplier / Source': 'Bidfood Wholesale',
      'Product URL': 'https://www.bidfood.co.za',
      'Promotion Ending Date': '2026-12-15',
      'Store Location': 'Wholesale Depot',
    },
    {
      Category: 'Spices & Condiments',
      'Item Description': 'Rajah Mild & Spicy Curry Powder',
      'Pack Type': 'Pack',
      'Pack Price (R)': 45.00,
      'Pack Weight/Size': 800,
      'Pack Unit': 'g',
      'Base Unit': 'kg',
      'Est Yield %': '100%',
      'Yield Note': 'Dry spice powder',
      'Supplier / Source': 'Checkers Hyper',
      'Product URL': 'https://www.checkers.co.za',
      'Promotion Ending Date': '',
      'Store Location': 'Branches Nationwide',
    },
    {
      Category: 'Packaging',
      'Item Description': 'Heavy Duty 3-Division Foil Trays (50pk)',
      'Pack Type': 'Pack',
      'Pack Price (R)': 135.00,
      'Pack Weight/Size': 50,
      'Pack Unit': 'each',
      'Base Unit': 'each',
      'Est Yield %': '100%',
      'Yield Note': '50 takeout containers per pack',
      'Supplier / Source': 'Catering Packaging Direct',
      'Product URL': '',
      'Promotion Ending Date': '',
      'Store Location': 'Industrial Park',
    },
  ];

  const headers = Object.keys(sampleData[0]);
  const rows = sampleData.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (typeof val === 'number') return `"${val.toFixed(2)}"`;
        return `"${val}"`;
      })
      .join(',')
  );

  return [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
}

/**
 * Download a string payload as a CSV file in browser
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
