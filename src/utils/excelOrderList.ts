import * as XLSX from 'xlsx';
import { OrderItem, PackType, PackUnit, BaseUnit } from '../types';
import { calculatePricePerUnit } from './calculations';
import { isDateExpiredOrInvalid } from './dateCleanup';

/**
 * Standardize known categories
 */
export function normalizeCategory(cat: string): string {
  const c = (cat || '').trim().toLowerCase();
  if (c.includes('poultr') || c.includes('chicken') || c.includes('turkey') || c.includes('duck')) {
    return 'Poultry';
  }
  if (
    c.includes('meat') ||
    c.includes('beef') ||
    c.includes('pork') ||
    c.includes('lamb') ||
    c.includes('mutton') ||
    c.includes('steak') ||
    c.includes('mince') ||
    c.includes('wors')
  ) {
    return 'Meat & Beef';
  }
  if (
    c.includes('veg') ||
    c.includes('produce') ||
    c.includes('fruit') ||
    c.includes('onion') ||
    c.includes('potato') ||
    c.includes('salad') ||
    c.includes('spinach') ||
    c.includes('herb')
  ) {
    return 'Vegetables & Produce';
  }
  if (
    c.includes('spice') ||
    c.includes('condiment') ||
    c.includes('sauce') ||
    c.includes('season') ||
    c.includes('curry') ||
    c.includes('salt') ||
    c.includes('pepper') ||
    c.includes('chakalaka') ||
    c.includes('stock')
  ) {
    return 'Spices & Condiments';
  }
  if (
    c.includes('packag') ||
    c.includes('container') ||
    c.includes('foil') ||
    c.includes('box') ||
    c.includes('tub') ||
    c.includes('lid') ||
    c.includes('cup') ||
    c.includes('bag') ||
    c.includes('cutlery') ||
    c.includes('napkin')
  ) {
    return 'Packaging';
  }
  if (
    c.includes('dairy') ||
    c.includes('pantry') ||
    c.includes('milk') ||
    c.includes('cheese') ||
    c.includes('butter') ||
    c.includes('cream') ||
    c.includes('flour') ||
    c.includes('sugar') ||
    c.includes('oil') ||
    c.includes('rice') ||
    c.includes('maize') ||
    c.includes('pap')
  ) {
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
 * Handles South African formats: "R 185.00", "R185,00", "1 250.50", "1,250.00", "45,99", etc.
 */
export function parseNumber(val: string | number | undefined, defaultVal = 0): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const str = val.toString().trim();
  if (str === '' || str === '-' || str === 'N/A' || str === 'n/a' || str === 'nil') return defaultVal;

  let cleaned = str
    .replace(/^(ZAR|R|\$|€|£)\s*/i, '')
    .replace(/\s*(ZAR|R|\$|€|£)$/i, '')
    .replace(/[^\d.,\-+]/g, '')
    .trim();

  if (!cleaned) return defaultVal;

  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
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

export interface ColumnMappingConfig {
  headerRowIndex: number;
  descriptionCol: string;
  packPriceCol: string;
  unitPriceCol: string;
  packWeightCol: string;
  packUnitCol: string;
  baseUnitCol: string;
  categoryCol: string;
  packTypeCol: string;
  yieldPercentCol: string;
  yieldNoteCol: string;
  sourceCol: string;
  endingDateCol: string;
  locationCol: string;
}

export interface ExcelParsedSheet {
  sheetName: string;
  rawGrid: any[][];
  headers: string[];
  suggestedMapping: ColumnMappingConfig;
}

export interface ExcelWorkbookInfo {
  sheetNames: string[];
  activeSheet: string;
  sheets: Record<string, ExcelParsedSheet>;
}

export interface ExcelRowParseResult {
  rowIndex: number;
  isValid: boolean;
  item: OrderItem;
  errors: string[];
  warnings: string[];
  rawValues: Record<string, any>;
}

export interface ExcelImportResult {
  rows: ExcelRowParseResult[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  invalidCount: number;
}

/**
 * Suggest best column match based on header name
 */
function findBestColumnMatch(headers: string[], keywords: string[]): string {
  if (!headers || headers.length === 0) return '';
  for (const h of headers) {
    const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const kw of keywords) {
      const cleanKw = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanH === cleanKw) return h;
    }
  }
  for (const h of headers) {
    const cleanH = h.toLowerCase();
    for (const kw of keywords) {
      if (cleanH.includes(kw.toLowerCase())) return h;
    }
  }
  return '';
}

/**
 * Detect header row and initial column mappings from 2D array
 */
export function analyzeGridHeaders(grid: any[][]): {
  headerRowIndex: number;
  headers: string[];
  mapping: ColumnMappingConfig;
} {
  if (!grid || grid.length === 0) {
    return {
      headerRowIndex: 0,
      headers: [],
      mapping: {
        headerRowIndex: 0,
        descriptionCol: '',
        packPriceCol: '',
        unitPriceCol: '',
        packWeightCol: '',
        packUnitCol: '',
        baseUnitCol: '',
        categoryCol: '',
        packTypeCol: '',
        yieldPercentCol: '',
        yieldNoteCol: '',
        sourceCol: '',
        endingDateCol: '',
        locationCol: '',
      },
    };
  }

  let bestHeaderRowIndex = 0;
  let maxScore = -1;

  for (let r = 0; r < Math.min(grid.length, 6); r++) {
    const row = grid[r] || [];
    let score = 0;
    row.forEach((cell) => {
      if (typeof cell === 'string') {
        const lower = cell.toLowerCase().trim();
        if (
          lower.includes('desc') ||
          lower.includes('item') ||
          lower.includes('price') ||
          lower.includes('cost') ||
          lower.includes('weight') ||
          lower.includes('size') ||
          lower.includes('unit') ||
          lower.includes('cat') ||
          lower.includes('supplier') ||
          lower.includes('rand')
        ) {
          score += 4;
        } else if (cell.trim().length > 1) {
          score += 1;
        }
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestHeaderRowIndex = r;
    }
  }

  const rawHeaderRow = grid[bestHeaderRowIndex] || [];
  const headers: string[] = rawHeaderRow.map((val, idx) => {
    if (val !== undefined && val !== null && String(val).trim()) {
      return String(val).trim();
    }
    return `Column ${idx + 1}`;
  });

  const descriptionCol = findBestColumnMatch(headers, [
    'item description',
    'description',
    'item',
    'product',
    'ingredient',
    'name',
    'item name',
    'desc',
  ]);

  const packPriceCol = findBestColumnMatch(headers, [
    'pack price',
    'pack price (r)',
    'pack price(r)',
    'price (r)',
    'price(r)',
    'cost (r)',
    'cost(r)',
    'pack cost',
    'purchase price',
    'price',
    'cost',
    'rand',
    'amount',
    'rate',
    'buying price',
  ]);

  const unitPriceCol = findBestColumnMatch(headers, [
    'price per unit',
    'calculated price/unit',
    'unit price',
    'price / kg',
    'price/kg',
    'price/l',
    'cost/unit',
    'price per base unit',
    'r/kg',
    'r/l',
  ]);

  const packWeightCol = findBestColumnMatch(headers, [
    'pack weight',
    'pack size',
    'weight',
    'size',
    'pack weight / size',
    'quantity',
    'qty',
    'mass',
    'volume',
  ]);

  const packUnitCol = findBestColumnMatch(headers, [
    'pack unit',
    'unit',
    'uom',
    'measure',
    'package unit',
  ]);

  const baseUnitCol = findBestColumnMatch(headers, [
    'base unit',
    'cost unit',
    'pricing unit',
    'base_unit',
  ]);

  const categoryCol = findBestColumnMatch(headers, [
    'category',
    'dept',
    'department',
    'group',
    'type',
    'classification',
    'section',
  ]);

  const packTypeCol = findBestColumnMatch(headers, [
    'pack type',
    'pack_type',
    'packaging',
  ]);

  const yieldPercentCol = findBestColumnMatch(headers, [
    'est yield %',
    'yield %',
    'yield',
    'usable yield',
    'yield percent',
  ]);

  const yieldNoteCol = findBestColumnMatch(headers, [
    'yield note',
    'notes',
    'trim note',
    'comment',
  ]);

  const sourceCol = findBestColumnMatch(headers, [
    'source',
    'supplier',
    'vendor',
    'store',
    'shop',
    'wholesaler',
  ]);

  const endingDateCol = findBestColumnMatch(headers, [
    'ending date',
    'expiry date',
    'promo end',
    'valid until',
    'end date',
  ]);

  const locationCol = findBestColumnMatch(headers, [
    'location',
    'branch',
    'store location',
    'city',
    'area',
  ]);

  return {
    headerRowIndex: bestHeaderRowIndex,
    headers,
    mapping: {
      headerRowIndex: bestHeaderRowIndex,
      descriptionCol,
      packPriceCol,
      unitPriceCol,
      packWeightCol,
      packUnitCol,
      baseUnitCol,
      categoryCol,
      packTypeCol,
      yieldPercentCol,
      yieldNoteCol,
      sourceCol,
      endingDateCol,
      locationCol,
    },
  };
}

/**
 * Read Excel workbook from ArrayBuffer or binary array
 */
export function parseExcelWorkbook(data: ArrayBuffer | Uint8Array): ExcelWorkbookInfo {
  const workbook = XLSX.read(data, {
    type: 'array',
    cellFormula: true,
    cellDates: true,
    cellNF: true,
    cellText: true,
  });

  const sheetNames = workbook.SheetNames || [];
  const sheets: Record<string, ExcelParsedSheet> = {};

  sheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    const rawGrid = XLSX.utils.sheet_to_json<any[]>(ws, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    });

    const { headers, mapping } = analyzeGridHeaders(rawGrid);

    sheets[sheetName] = {
      sheetName,
      rawGrid,
      headers,
      suggestedMapping: mapping,
    };
  });

  return {
    sheetNames,
    activeSheet: sheetNames[0] || 'Sheet1',
    sheets,
  };
}

/**
 * Parse raw text pasted from Excel clipboard (tab-separated cells / lines) into grid format
 */
export function parsePastedExcelText(text: string): {
  grid: any[][];
  workbookInfo: ExcelWorkbookInfo;
} {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const grid: any[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // Tab-delimited (standard Excel clipboard copy) or comma-delimited fallback
    const cells = line.includes('\t') ? line.split('\t') : line.split(',');
    grid.push(cells.map((c) => c.trim()));
  }

  const { headers, mapping } = analyzeGridHeaders(grid);
  const sheetName = 'Pasted Excel Data';

  const sheets: Record<string, ExcelParsedSheet> = {
    [sheetName]: {
      sheetName,
      rawGrid: grid,
      headers,
      suggestedMapping: mapping,
    },
  };

  return {
    grid,
    workbookInfo: {
      sheetNames: [sheetName],
      activeSheet: sheetName,
      sheets,
    },
  };
}

/**
 * Parse grid data into OrderItems using column mapping
 */
export function parseGridToOrderItems(
  grid: any[][],
  mapping: ColumnMappingConfig,
  headers: string[]
): ExcelImportResult {
  if (!grid || grid.length <= mapping.headerRowIndex + 1) {
    return {
      rows: [],
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      invalidCount: 0,
    };
  }

  const headerMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerMap[h] = idx;
    headerMap[h.toLowerCase()] = idx;
    headerMap[h.toLowerCase().replace(/[^a-z0-9]/g, '')] = idx;
  });

  const getCellValue = (row: any[], colNameOrAlias: string): any => {
    if (!colNameOrAlias) return '';
    if (headerMap[colNameOrAlias] !== undefined) {
      return row[headerMap[colNameOrAlias]];
    }
    const clean = colNameOrAlias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (headerMap[clean] !== undefined) {
      return row[headerMap[clean]];
    }
    const match = colNameOrAlias.match(/Column\s+(\d+)/i);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      return row[idx];
    }
    return '';
  };

  const parsedRows: ExcelRowParseResult[] = [];
  const startRow = mapping.headerRowIndex + 1;

  for (let r = startRow; r < grid.length; r++) {
    const row = grid[r];
    if (!row || row.length === 0) continue;

    const hasAnyContent = row.some((c) => c !== undefined && c !== null && String(c).trim() !== '');
    if (!hasAnyContent) continue;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Description
    const rawDesc = String(getCellValue(row, mapping.descriptionCol) || '').trim();
    if (!rawDesc) {
      errors.push('Missing item description or name');
    }

    // Category
    const rawCategory = String(getCellValue(row, mapping.categoryCol) || '').trim();
    const category = normalizeCategory(rawCategory);

    // Pack Type
    const rawPackType = String(getCellValue(row, mapping.packTypeCol) || '').trim();
    const packType = normalizePackType(rawPackType);

    // Pack Weight / Size
    const rawWeight = getCellValue(row, mapping.packWeightCol);
    let packWeight = parseNumber(rawWeight, 1000);
    if (packWeight <= 0) packWeight = 1000;

    // Pack Unit
    const rawUnit = String(getCellValue(row, mapping.packUnitCol) || '').trim();
    const packUnit = normalizePackUnit(rawUnit || (packType === 'Each' ? 'each' : 'g'));

    // Base Unit
    const rawBaseUnit = String(getCellValue(row, mapping.baseUnitCol) || '').trim();
    const baseUnit = inferBaseUnit(packUnit, rawBaseUnit);

    // Pack Price
    const rawPackPrice = getCellValue(row, mapping.packPriceCol);
    let packPrice = parseNumber(rawPackPrice, 0);

    // Explicit Unit Price
    const rawUnitPrice = getCellValue(row, mapping.unitPriceCol);
    const explicitUnitPrice = parseNumber(rawUnitPrice, 0);

    if (packPrice <= 0 && explicitUnitPrice > 0) {
      packPrice = calculatePackPriceFromUnitPrice(explicitUnitPrice, packWeight, packUnit, baseUnit);
    }

    // Calculated price per base unit
    let pricePerUnit = calculatePricePerUnit(packPrice, packWeight, packUnit, baseUnit);
    if (pricePerUnit <= 0 && explicitUnitPrice > 0) {
      pricePerUnit = explicitUnitPrice;
    }

    if (packPrice <= 0 && pricePerUnit <= 0) {
      warnings.push('Price is R 0.00 — please specify Pack Price');
    }

    // Yield
    const rawYield = getCellValue(row, mapping.yieldPercentCol);
    const estYieldPercent = parseYieldPercent(rawYield || '100%');

    // Yield Note
    const rawYieldNote = String(getCellValue(row, mapping.yieldNoteCol) || '').trim();
    const yieldNote = rawYieldNote || (estYieldPercent === 1.0 ? '100% usable' : 'Trimmed loss');

    // Supplier / Source
    const rawSource = String(getCellValue(row, mapping.sourceCol) || '').trim();
    const source = rawSource || 'Supplier Direct';

    // Ending Date
    const rawDate = String(getCellValue(row, mapping.endingDateCol) || '').trim();
    let endingDate: string | undefined = rawDate || undefined;
    if (endingDate && isDateExpiredOrInvalid(endingDate)) {
      warnings.push(`Ending date "${endingDate}" is expired/invalid format`);
      endingDate = undefined;
    }

    // Location
    const rawLocation = String(getCellValue(row, mapping.locationCol) || '').trim();
    const location = rawLocation || undefined;

    const item: OrderItem = {
      id: `ord-xls-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      itemDescription: rawDesc,
      packType,
      packPrice,
      packWeight,
      packUnit,
      baseUnit,
      pricePerUnit,
      estYieldPercent,
      yieldNote,
      source,
      endingDate,
      location,
    };

    const rawValues: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rawValues[h] = row[idx];
    });

    parsedRows.push({
      rowIndex: r + 1,
      isValid: errors.length === 0,
      item,
      errors,
      warnings,
      rawValues,
    });
  }

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const warningCount = parsedRows.filter((r) => r.warnings.length > 0).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return {
    rows: parsedRows,
    totalRows: parsedRows.length,
    validCount,
    warningCount,
    invalidCount,
  };
}

/**
 * Generate Excel (.xlsx) workbook and trigger browser download
 */
export function exportOrderListToExcel(orderList: OrderItem[], filename: string = 'CatchUp_OrderList_Database.xlsx') {
  const headers = [
    'Item Description',
    'Category',
    'Pack Type',
    'Pack Price (R)',
    'Pack Weight / Size',
    'Pack Unit',
    'Base Unit',
    'Price per Base Unit (R)',
    'Est. Yield %',
    'Yield Note',
    'Supplier / Source',
    'Ending Date (YYYY-MM-DD)',
    'Location / Branch',
  ];

  const dataRows = orderList.map((item) => [
    item.itemDescription,
    item.category,
    item.packType,
    item.packPrice,
    item.packWeight,
    item.packUnit,
    item.baseUnit,
    item.pricePerUnit,
    `${Math.round(item.estYieldPercent * 100)}%`,
    item.yieldNote || '',
    item.source || '',
    item.endingDate || '',
    item.location || '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  ws['!cols'] = [
    { wch: 32 }, // Item Description
    { wch: 16 }, // Category
    { wch: 12 }, // Pack Type
    { wch: 14 }, // Pack Price
    { wch: 18 }, // Pack Weight
    { wch: 12 }, // Pack Unit
    { wch: 12 }, // Base Unit
    { wch: 22 }, // Price per Base Unit
    { wch: 12 }, // Est Yield %
    { wch: 20 }, // Yield Note
    { wch: 22 }, // Supplier
    { wch: 24 }, // Ending Date
    { wch: 18 }, // Location
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Order List');

  XLSX.writeFile(wb, filename);
}

/**
 * Generate sample template Excel (.xlsx) file with pre-filled South African food industry examples
 */
export function downloadSampleExcelTemplate() {
  const sampleItems: OrderItem[] = [
    {
      id: 'sample-1',
      category: 'Poultry',
      itemDescription: 'Chicken Breast Fillets Fresh (5kg Box)',
      packType: 'Pack',
      packPrice: 385.0,
      packWeight: 5,
      packUnit: 'kg',
      baseUnit: 'kg',
      pricePerUnit: 77.0,
      estYieldPercent: 0.95,
      yieldNote: 'Trimmed fat loss 5%',
      source: 'County Fair / Daybreak',
      location: 'Durban Cold Storage',
    },
    {
      id: 'sample-2',
      category: 'Dairy & Pantry',
      itemDescription: 'Cheddar Cheese Block 2.5kg Mature',
      packType: 'Pack',
      packPrice: 345.0,
      packWeight: 2500,
      packUnit: 'g',
      baseUnit: 'kg',
      pricePerUnit: 138.0,
      estYieldPercent: 1.0,
      yieldNote: '100% usable grated',
      source: 'Clover / Lancewood',
      location: 'Main Kitchen Fridge',
    },
    {
      id: 'sample-3',
      category: 'Vegetables & Produce',
      itemDescription: 'Fresh Red Onions 10kg Pocket',
      packType: 'Pack',
      packPrice: 149.99,
      packWeight: 10,
      packUnit: 'kg',
      baseUnit: 'kg',
      pricePerUnit: 15.0,
      estYieldPercent: 0.88,
      yieldNote: 'Peeled outer skins & root',
      source: 'Clairwood Wholesale Market',
      location: 'Dry Store Bay 3',
    },
    {
      id: 'sample-4',
      category: 'Dairy & Pantry',
      itemDescription: 'Long Grain Parboiled White Rice 10kg',
      packType: 'Pack',
      packPrice: 199.5,
      packWeight: 10,
      packUnit: 'kg',
      baseUnit: 'kg',
      pricePerUnit: 19.95,
      estYieldPercent: 2.4,
      yieldNote: 'Cooked expansion 2.4x yield',
      source: 'Tastic / Tiger Brands',
      location: 'Dry Store Bin 1',
    },
    {
      id: 'sample-5',
      category: 'Dairy & Pantry',
      itemDescription: 'Pure Sunflower Cooking Oil 20L Drum',
      packType: 'Pack',
      packPrice: 620.0,
      packWeight: 20,
      packUnit: 'L',
      baseUnit: 'L',
      pricePerUnit: 31.0,
      estYieldPercent: 0.98,
      yieldNote: 'Deep frying filtration loss',
      source: 'Sunfoil Wholesale',
      location: 'Bulk Oil Storage',
    },
    {
      id: 'sample-6',
      category: 'Packaging',
      itemDescription: 'Kraft Burger Boxes 2-Compartment (100 Pack)',
      packType: 'Pack',
      packPrice: 185.0,
      packWeight: 100,
      packUnit: 'each',
      baseUnit: 'each',
      pricePerUnit: 1.85,
      estYieldPercent: 1.0,
      yieldNote: '100% usable packaging unit',
      source: 'Detpak / GreenHome',
      location: 'Packaging Bay',
    },
  ];

  exportOrderListToExcel(sampleItems, 'CatchUp_OrderList_Excel_Template.xlsx');
}
