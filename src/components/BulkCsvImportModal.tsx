import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import { OrderItem } from '../types';
import {
  parseOrderListCsv,
  CsvParseResult,
  generateSampleCsvTemplate,
  exportOrderListToCsv,
  downloadCsvFile,
} from '../utils/csvOrderList';
import {
  parseExcelWorkbook,
  parseGridToOrderItems,
  ExcelWorkbookInfo,
  ColumnMappingConfig,
  exportOrderListToExcel,
  downloadSampleExcelTemplate,
} from '../utils/excelOrderList';
import { formatCurrency } from '../utils/calculations';

interface BulkCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrderList: OrderItem[];
  isExecutive: boolean;
  userEmail: string;
  onImportItems: (
    items: OrderItem[],
    mode: 'append' | 'update_merge' | 'replace'
  ) => void;
}

export const BulkCsvImportModal: React.FC<BulkCsvImportModalProps> = ({
  isOpen,
  onClose,
  currentOrderList,
  isExecutive,
  userEmail,
  onImportItems,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'append' | 'update_merge' | 'replace'>('append');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showColumnMapping, setShowColumnMapping] = useState<boolean>(false);

  // Paste mode text
  const [csvText, setCsvText] = useState<string>('');

  // Excel workbook state
  const [workbookInfo, setWorkbookInfo] = useState<ExcelWorkbookInfo | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (!isOpen) {
      handleClear();
    }
  }, [isOpen]);

  // Read uploaded file (Excel .xlsx / .xls or CSV / text)
  const handleFileRead = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.xlsm') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const wb = parseExcelWorkbook(buffer);
          setWorkbookInfo(wb);
          const firstSheet = wb.sheetNames[0] || '';
          setActiveSheetName(firstSheet);
          if (firstSheet && wb.sheets[firstSheet]) {
            setColumnMapping(wb.sheets[firstSheet].suggestedMapping);
          }
          setCsvText('');
        } catch (err) {
          console.error('Error reading Excel file:', err);
          alert('Could not parse this Excel file. Please ensure it is a valid .xlsx or .xls document.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV or plain text
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        setCsvText(text);
        setWorkbookInfo(null);
        setColumnMapping(null);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setCsvText('');
    setFileName('');
    setWorkbookInfo(null);
    setActiveSheetName('');
    setColumnMapping(null);
    setSelectedRowIds(new Set());
    setShowColumnMapping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Change active Excel sheet
  const handleSheetChange = (sheetName: string) => {
    setActiveSheetName(sheetName);
    if (workbookInfo && workbookInfo.sheets[sheetName]) {
      setColumnMapping(workbookInfo.sheets[sheetName].suggestedMapping);
    }
  };

  // Update a specific column mapping field
  const handleMappingFieldChange = (field: keyof ColumnMappingConfig, value: any) => {
    if (!columnMapping) return;
    setColumnMapping((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Compute parsed items based on active mode (Excel grid vs CSV text)
  const currentSheetData = workbookInfo && activeSheetName ? workbookInfo.sheets[activeSheetName] : null;

  const excelParseResult = useMemo(() => {
    if (!currentSheetData || !columnMapping) return null;
    return parseGridToOrderItems(currentSheetData.rawGrid, columnMapping, currentSheetData.headers);
  }, [currentSheetData, columnMapping]);

  const csvParseResult: CsvParseResult | null = useMemo(() => {
    if (workbookInfo || !csvText.trim()) return null;
    return parseOrderListCsv(csvText);
  }, [workbookInfo, csvText]);

  // Unified items list
  const unifiedParsedRows = useMemo(() => {
    if (excelParseResult) {
      return excelParseResult.rows;
    }
    if (csvParseResult) {
      return csvParseResult.rows.map((r, idx) => ({
        rowIndex: idx + 1,
        isValid: r.isValid,
        item: r.item,
        errors: r.errors,
        warnings: r.warnings,
        rawValues: {},
      }));
    }
    return [];
  }, [excelParseResult, csvParseResult]);

  const totalDetectedCount = unifiedParsedRows.length;
  const validItemsCount = unifiedParsedRows.filter((r) => r.isValid).length;
  const invalidItemsCount = unifiedParsedRows.filter((r) => !r.isValid).length;
  const zeroPriceItemsCount = unifiedParsedRows.filter((r) => r.item.packPrice <= 0 && r.item.pricePerUnit <= 0).length;

  // Auto-select valid rows when parsed
  const prevItemsRef = useRef(unifiedParsedRows);
  useEffect(() => {
    if (unifiedParsedRows !== prevItemsRef.current) {
      prevItemsRef.current = unifiedParsedRows;
      const validIds = new Set(unifiedParsedRows.filter((r) => r.isValid).map((r) => r.item.id));
      setSelectedRowIds(validIds);
    }
  }, [unifiedParsedRows]);

  if (!isOpen) return null;

  // Downloads
  const handleDownloadSampleExcel = () => {
    downloadSampleExcelTemplate();
  };

  const handleDownloadSampleCsv = () => {
    const template = generateSampleCsvTemplate();
    downloadCsvFile('catchup_order_list_sample_template.csv', template);
  };

  const handleExportCurrentExcel = () => {
    exportOrderListToExcel(
      currentOrderList,
      `catchup_order_list_export_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleExportCurrentCsv = () => {
    const exported = exportOrderListToCsv(currentOrderList);
    downloadCsvFile(
      `catchup_order_list_export_${new Date().toISOString().slice(0, 10)}.csv`,
      exported
    );
  };

  // Selection
  const handleToggleRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const validRows = unifiedParsedRows.filter((r) => r.isValid);
    if (selectedRowIds.size === validRows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(validRows.map((r) => r.item.id)));
    }
  };

  const handleSelectOnlyPriced = () => {
    const pricedValidRows = unifiedParsedRows.filter(
      (r) => r.isValid && (Number(r.item.packPrice) > 0 || Number(r.item.pricePerUnit) > 0)
    );
    setSelectedRowIds(new Set(pricedValidRows.map((r) => r.item.id)));
  };

  // Filtered rows for preview table
  const filteredRows = unifiedParsedRows.filter((row) => {
    const matchesSearch =
      row.item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.item.location && row.item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' || row.item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedItemsToImport = unifiedParsedRows
    .filter((r) => selectedRowIds.has(r.item.id) && r.isValid)
    .map((r) => r.item);

  const handleConfirmImport = () => {
    if (selectedItemsToImport.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      onImportItems(selectedItemsToImport, importMode);
      setIsProcessing(false);
      onClose();
    }, 150);
  };

  const categories = [
    'All',
    'Protein',
    'Poultry',
    'Meat & Beef',
    'Produce',
    'Dairy',
    'Dry Goods',
    'Oils & Fats',
    'Spices & Condiments',
    'Packaging',
    'Bakery & Pastry',
    'Beverages',
  ];

  const detectedHeaders = currentSheetData?.headers || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full my-auto overflow-hidden shadow-2xl border-2 border-stone-900 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B3B28] px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-white border-b-2 border-emerald-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-xl text-white">
                  Bulk Excel & CSV Import
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950">
                  .XLSX • .XLS • .CSV
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium">
                Add ingredients, pack sizes, supplier prices & yields directly from your spreadsheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSampleExcel}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 hover:text-white text-xs font-bold rounded-xl border border-emerald-700/80 transition-colors cursor-pointer"
              title="Download pre-formatted Excel template"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Sample Excel (.xlsx)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Actions: Tabs & Templates */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            {/* Input Method Tabs */}
            <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-stone-950 shadow-xs border border-stone-300'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Upload Excel / CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-white text-stone-950 shadow-xs border border-stone-300'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Paste Data / CSV</span>
              </button>
            </div>

            {/* Quick Helper Links */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                title="Download Excel spreadsheet template (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-800" />
                <span>Excel Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV Template</span>
              </button>

              <button
                type="button"
                onClick={handleExportCurrentExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer"
                title="Export current database to Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-amber-900" />
                <span>Export DB (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Upload Drop Zone / Paste Area */}
          {activeTab === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.xlsm,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileRead(e.target.files[0]);
                  }
                }}
              />

              {!fileName ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50 scale-[1.01]'
                      : 'border-stone-300 bg-stone-50/70 hover:bg-emerald-50/40 hover:border-emerald-500'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-extrabold text-stone-900">
                      Click to choose Excel (.xlsx, .xls) or CSV file
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-md">
                      Drag & drop your supplier price sheets, kitchen inventory, or food costing spreadsheets here.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs">
                      Browse Excel / CSV File
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm sm:text-base text-emerald-950 truncate">
                        {fileName}
                      </h4>
                      <p className="text-xs text-emerald-800 font-medium">
                        {workbookInfo ? (
                          <>
                            Excel Workbook • Sheet: <strong>{activeSheetName}</strong> • {totalDetectedCount} rows detected
                          </>
                        ) : (
                          <>{totalDetectedCount} items detected from CSV</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Sheet selector if Excel with multiple sheets */}
                    {workbookInfo && workbookInfo.sheetNames.length > 1 && (
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-950">
                        <span>Sheet:</span>
                        <select
                          value={activeSheetName}
                          onChange={(e) => handleSheetChange(e.target.value)}
                          className="bg-transparent font-black focus:outline-none cursor-pointer"
                        >
                          {workbookInfo.sheetNames.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-2 text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                      title="Clear file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Paste CSV or Tab-Delimited text from Excel below
                </label>
                {csvText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`Item Description	Category	Pack Type	Pack Price	Pack Weight	Pack Unit	Supplier
Chicken Fillets Fresh 5kg	Protein	Pack	385.00	5	kg	County Fair
Cheddar Cheese Mature 2.5kg	Dairy	Block	345.00	2500	g	Clover
Brown Onions 10kg Pocket	Produce	Bag	149.90	10	kg	Wholesale Market
Sunflower Cooking Oil 20L	Oils & Fats	Drum	620.00	20	L	Sunfoil`}
                rows={6}
                className="w-full p-4 font-mono text-xs text-stone-900 bg-stone-50 border-2 border-stone-300 rounded-2xl focus:bg-white focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Interactive Column Mapping Accordion (For Excel & multi-column CSV) */}
          {workbookInfo && columnMapping && detectedHeaders.length > 0 && (
            <div className="border-2 border-amber-300 bg-amber-50/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-800" />
                  <h4 className="font-black text-xs sm:text-sm text-stone-900">
                    Match Excel Columns to Database Fields
                  </h4>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                    Auto-Matched
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowColumnMapping(!showColumnMapping)}
                  className="text-xs font-black text-amber-950 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <span>{showColumnMapping ? 'Hide Matcher' : 'Adjust Mapping / Headers'}</span>
                  {showColumnMapping ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Quick Summary of Active Mappings */}
              {!showColumnMapping && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-stone-700 bg-white/90 p-2.5 rounded-xl border border-amber-200">
                  <span>
                    <strong>Item Name:</strong> {columnMapping.descriptionCol || 'Not Selected'}
                  </span>
                  <span className="text-stone-300">•</span>
                  <span>
                    <strong className="text-amber-950 font-black">Pack Price (R):</strong>{' '}
                    <span className="font-extrabold text-emerald-900">
                      {columnMapping.packPriceCol || columnMapping.unitPriceCol || 'Not Selected'}
                    </span>
                  </span>
                  <span className="text-stone-300">•</span>
                  <span>
                    <strong>Pack Size:</strong> {columnMapping.packWeightCol || 'Not Selected'}
                  </span>
                  <span className="text-stone-300">•</span>
                  <span>
                    <strong>Unit:</strong> {columnMapping.packUnitCol || 'Default (kg/g)'}
                  </span>
                  <span className="text-stone-300">•</span>
                  <span>
                    <strong>Category:</strong> {columnMapping.categoryCol || 'Auto'}
                  </span>
                </div>
              )}

              {/* Expanded Mapping Controls */}
              {showColumnMapping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">
                      Item Description / Name *
                    </label>
                    <select
                      value={columnMapping.descriptionCol}
                      onChange={(e) => handleMappingFieldChange('descriptionCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pack Price */}
                  <div className="space-y-1 bg-amber-100/70 p-2 rounded-xl border border-amber-300">
                    <label className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-amber-900" />
                      <span>Pack Price (R) *</span>
                    </label>
                    <select
                      value={columnMapping.packPriceCol}
                      onChange={(e) => handleMappingFieldChange('packPriceCol', e.target.value)}
                      className="w-full text-xs font-black p-2 bg-white border-2 border-amber-500 text-stone-900 rounded-xl focus:outline-none"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pack Weight / Size */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">
                      Pack Weight / Size
                    </label>
                    <select
                      value={columnMapping.packWeightCol}
                      onChange={(e) => handleMappingFieldChange('packWeightCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pack Unit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">
                      Pack Unit (g, kg, ml, L, each)
                    </label>
                    <select
                      value={columnMapping.packUnitCol}
                      onChange={(e) => handleMappingFieldChange('packUnitCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit Price (Alternative) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">
                      Price per Base Unit (R/kg, R/L)
                    </label>
                    <select
                      value={columnMapping.unitPriceCol}
                      onChange={(e) => handleMappingFieldChange('unitPriceCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Optional / Auto --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">Category</label>
                    <select
                      value={columnMapping.categoryCol}
                      onChange={(e) => handleMappingFieldChange('categoryCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Optional / Auto-detected --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier / Source */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">
                      Supplier / Source
                    </label>
                    <select
                      value={columnMapping.sourceCol}
                      onChange={(e) => handleMappingFieldChange('sourceCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Optional / Supplier Direct --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Yield % */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">Est. Yield %</label>
                    <select
                      value={columnMapping.yieldPercentCol}
                      onChange={(e) => handleMappingFieldChange('yieldPercentCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Optional / Default 100% --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-800">
                      Store Location / Branch
                    </label>
                    <select
                      value={columnMapping.locationCol}
                      onChange={(e) => handleMappingFieldChange('locationCol', e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl focus:border-amber-500"
                    >
                      <option value="">-- Optional --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Results Overview & Import Settings */}
          {totalDetectedCount > 0 && (
            <div className="space-y-4 pt-1">
              {/* Stats Card & Import Mode */}
              <div className="bg-stone-50 border-2 border-stone-300 rounded-3xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold text-xs rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>{validItemsCount} Valid Items</span>
                    </div>

                    {zeroPriceItemsCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-950 font-extrabold text-xs rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>{zeroPriceItemsCount} items have R 0.00 price</span>
                      </div>
                    )}

                    {invalidItemsCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-900 font-extrabold text-xs rounded-xl">
                        <XCircle className="w-4 h-4 text-rose-700" />
                        <span>{invalidItemsCount} Invalid Rows</span>
                      </div>
                    )}

                    <div className="text-xs text-stone-600 font-semibold">
                      Selected: <strong className="text-stone-950 font-black">{selectedItemsToImport.length}</strong> of {validItemsCount}
                    </div>
                  </div>

                  {/* Destination Mode Selector */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-stone-700 uppercase tracking-wider">
                      Import Mode:
                    </span>
                    <div className="flex items-center bg-white p-1 rounded-xl border border-stone-300 text-xs">
                      <button
                        type="button"
                        onClick={() => setImportMode('append')}
                        className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                          importMode === 'append'
                            ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="Add items to existing Order List without deleting current items"
                      >
                        Append & Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('update_merge')}
                        className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                          importMode === 'update_merge'
                            ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="Update existing items with matching description, and add new ones"
                      >
                        Update & Merge
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                          importMode === 'replace'
                            ? 'bg-rose-600 text-white font-black shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="Replace entire existing Order List with imported items"
                      >
                        Replace All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notice on Prices */}
                {zeroPriceItemsCount > 0 && (
                  <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-xs text-amber-950 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        If prices show as R 0.00, check the <strong>Match Excel Columns</strong> dropdown above to ensure your price column (e.g. &ldquo;Pack Price&rdquo;, &ldquo;Cost&rdquo;, or &ldquo;Price&rdquo;) is selected.
                      </span>
                    </div>
                    {!showColumnMapping && (
                      <button
                        type="button"
                        onClick={() => setShowColumnMapping(true)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-lg text-xs cursor-pointer shrink-0"
                      >
                        Open Column Matcher
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Preview Table Header & Search Filter */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-stone-900">
                      Spreadsheet Items Preview ({filteredRows.length})
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        {selectedRowIds.size === validItemsCount ? 'Deselect All' : 'Select All'}
                      </button>
                      {zeroPriceItemsCount > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectOnlyPriced}
                          className="font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md cursor-pointer border border-amber-300"
                          title="Select only rows that have a price listed"
                        >
                          Select Only Priced ({validItemsCount - zeroPriceItemsCount})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Filter preview items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-bold bg-white border border-stone-300 rounded-xl focus:outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border-2 border-stone-300 rounded-2xl overflow-hidden shadow-xs max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0B3B28] text-white font-black sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={validItemsCount > 0 && selectedRowIds.size === validItemsCount}
                            onChange={handleToggleSelectAll}
                            className="rounded accent-amber-400 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Pack Price</th>
                        <th className="p-3 text-right">Pack Size</th>
                        <th className="p-3 text-right">Calculated / Base Unit</th>
                        <th className="p-3 text-right">Yield %</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-medium bg-white">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-stone-400">
                            No matching items found.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isSelected = selectedRowIds.has(row.item.id);
                          const isZeroPrice = row.item.packPrice <= 0 && row.item.pricePerUnit <= 0;
                          return (
                            <tr
                              key={row.item.id}
                              onClick={() => row.isValid && handleToggleRow(row.item.id)}
                              className={`transition-colors cursor-pointer ${
                                !row.isValid
                                  ? 'bg-rose-50/70 text-rose-900'
                                  : isSelected
                                  ? 'bg-amber-50/60 hover:bg-amber-100/50'
                                  : 'bg-white hover:bg-stone-50'
                              }`}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  disabled={!row.isValid}
                                  checked={isSelected}
                                  onChange={() => handleToggleRow(row.item.id)}
                                  className="rounded accent-amber-500 cursor-pointer disabled:opacity-30"
                                />
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-stone-100 text-stone-800 border border-stone-200 whitespace-nowrap">
                                  {row.item.category}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-extrabold text-stone-900">
                                  {row.item.itemDescription}
                                </div>
                                {row.errors.length > 0 && (
                                  <div className="text-[10px] text-rose-700 font-bold">
                                    {row.errors.join(', ')}
                                  </div>
                                )}
                                {row.warnings.length > 0 && (
                                  <div className="text-[10px] text-amber-700">
                                    {row.warnings.join(', ')}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                {row.item.packPrice > 0 ? (
                                  <span className="font-black text-stone-900">
                                    {formatCurrency(row.item.packPrice)}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-950 font-black rounded text-[11px]">
                                    R 0.00
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap text-stone-700">
                                {row.item.packWeight} {row.item.packUnit} ({row.item.packType})
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                {row.item.pricePerUnit > 0 ? (
                                  <span className="font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {formatCurrency(row.item.pricePerUnit)} / {row.item.baseUnit}
                                  </span>
                                ) : (
                                  <span className="font-bold text-stone-400">
                                    R 0.00 / {row.item.baseUnit}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-bold whitespace-nowrap text-stone-700">
                                {Math.round(row.item.estYieldPercent * 100)}%
                              </td>
                              <td className="p-3 text-stone-600 truncate max-w-[120px]">
                                {row.item.source}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                    <X className="w-3 h-3 stroke-[3]" />
                                    Error
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-100 px-5 sm:px-6 py-4 border-t-2 border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            {isExecutive ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Executive Verified ({userEmail}) — will update live database instantly
              </span>
            ) : (
              <span className="text-stone-600 font-medium">
                Active Session ({userEmail}) — imported items will be loaded directly into your Order List
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedItemsToImport.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black text-emerald-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-amber-500 rounded-xl shadow-md transition-all transform active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>
                {isProcessing
                  ? 'Importing...'
                  : `Import ${selectedItemsToImport.length} Selected Item${
                      selectedItemsToImport.length === 1 ? '' : 's'
                    }`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
