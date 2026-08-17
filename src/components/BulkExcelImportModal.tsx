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
  RefreshCw,
  Search,
  Check,
  X,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import { OrderItem } from '../types';
import {
  parseExcelWorkbook,
  parsePastedExcelText,
  parseGridToOrderItems,
  ExcelWorkbookInfo,
  ColumnMappingConfig,
  exportOrderListToExcel,
  downloadSampleExcelTemplate,
} from '../utils/excelOrderList';
import { formatCurrency } from '../utils/calculations';

interface BulkExcelImportModalProps {
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

export const BulkExcelImportModal: React.FC<BulkExcelImportModalProps> = ({
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

  // Paste mode text (copied from Excel spreadsheet)
  const [pastedText, setPastedText] = useState<string>('');

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

  // Read uploaded Excel file (.xlsx / .xls / .xlsm)
  const handleFileRead = (file: File) => {
    if (!file) return;
    setFileName(file.name);

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
        setPastedText('');
      } catch (err) {
        console.error('Error reading Excel file:', err);
        alert('Could not parse this file. Please ensure it is a valid Excel spreadsheet (.xlsx or .xls).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle text pasted from Excel
  const handlePastedTextChange = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setWorkbookInfo(null);
      setColumnMapping(null);
      return;
    }
    const { workbookInfo: parsedWb } = parsePastedExcelText(text);
    setWorkbookInfo(parsedWb);
    const firstSheet = parsedWb.sheetNames[0] || '';
    setActiveSheetName(firstSheet);
    if (firstSheet && parsedWb.sheets[firstSheet]) {
      setColumnMapping(parsedWb.sheets[firstSheet].suggestedMapping);
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
    setPastedText('');
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

  // Compute parsed items based on active Excel grid and column mapping
  const currentSheetData = workbookInfo && activeSheetName ? workbookInfo.sheets[activeSheetName] : null;

  const excelParseResult = useMemo(() => {
    if (!currentSheetData || !columnMapping) return null;
    return parseGridToOrderItems(currentSheetData.rawGrid, columnMapping, currentSheetData.headers);
  }, [currentSheetData, columnMapping]);

  const unifiedParsedRows = useMemo(() => {
    return excelParseResult ? excelParseResult.rows : [];
  }, [excelParseResult]);

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

  const handleExportCurrentExcel = () => {
    exportOrderListToExcel(
      currentOrderList,
      `CatchUp_OrderList_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
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
    'Vegetables & Produce',
    'Dairy & Pantry',
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
                  Bulk Excel Database Import
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950">
                  .XLSX • .XLS
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium">
                Add ingredients, pack sizes, supplier prices & yields directly from your Excel spreadsheets
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
                <span>Upload Excel File (.xlsx, .xls)</span>
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
                <span>Paste Excel Table Data</span>
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
                accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileRead(e.target.files[0]);
                  }
                }}
              />

              {!workbookInfo ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50 scale-[1.005]'
                      : 'border-stone-300 bg-stone-50/70 hover:bg-stone-50 hover:border-emerald-500'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-stone-900 text-base mb-1">
                    Drag & Drop your Excel spreadsheet here
                  </h4>
                  <p className="text-xs text-stone-500 mb-4 max-w-md mx-auto">
                    Supports Microsoft Excel <strong>.xlsx</strong> and <strong>.xls</strong> files. Auto-detects column headers, pack sizes, and prices.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Browse Excel File</span>
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                        <span>{fileName || 'Excel Document'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                          {workbookInfo.sheetNames.length} sheet{workbookInfo.sheetNames.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-900 font-medium">
                        Active Sheet: <strong>{activeSheetName}</strong> • {totalDetectedCount} rows detected
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowColumnMapping(!showColumnMapping)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        showColumnMapping
                          ? 'bg-amber-400 text-stone-950 border-amber-500'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{showColumnMapping ? 'Hide Mapping' : 'Adjust Columns'}</span>
                      {showColumnMapping ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Clear and upload a different file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="relative">
                <textarea
                  rows={5}
                  value={pastedText}
                  onChange={(e) => handlePastedTextChange(e.target.value)}
                  placeholder={`Paste table cells directly from your Excel spreadsheet...\nExample:\nItem Description\tCategory\tPack Price\tPack Weight\tPack Unit\nChicken Breast Fillets\tPoultry\t385.00\t5\tkg\nCheddar Cheese Block\tDairy & Pantry\t345.00\t2500\tg`}
                  className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-mono text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
                {pastedText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white text-stone-500 hover:text-rose-600 border border-stone-200 rounded-lg text-[10px] font-bold shadow-2xs cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5">
                Tip: In Excel, highlight your table cells, press <strong>Ctrl+C</strong> (or Cmd+C), and paste directly into this box.
              </p>
            </div>
          )}

          {/* Excel Workbook Sheet Tabs */}
          {workbookInfo && workbookInfo.sheetNames.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Select Worksheet to Import:</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {workbookInfo.sheetNames.map((sheetName) => (
                  <button
                    key={sheetName}
                    type="button"
                    onClick={() => handleSheetChange(sheetName)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      activeSheetName === sheetName
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {sheetName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart Column Mapping Editor */}
          {workbookInfo && columnMapping && (showColumnMapping || !columnMapping.descriptionCol || !columnMapping.packPriceCol) && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-800" />
                  <h4 className="font-extrabold text-amber-950 text-xs">
                    Excel Column Mapping & Auto-Match
                  </h4>
                </div>
                <span className="text-[11px] text-amber-900 font-medium">
                  Ensure header columns match your Excel sheet
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {/* Description Column */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Item Description <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={columnMapping.descriptionCol}
                    onChange={(e) => handleMappingFieldChange('descriptionCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Pack Price (R) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={columnMapping.packPriceCol}
                    onChange={(e) => handleMappingFieldChange('packPriceCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- None / Calculate --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Price */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Price per Base Unit (R/kg or R/L)
                  </label>
                  <select
                    value={columnMapping.unitPriceCol}
                    onChange={(e) => handleMappingFieldChange('unitPriceCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- Auto-calculate --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pack Weight / Size */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Pack Size / Weight</label>
                  <select
                    value={columnMapping.packWeightCol}
                    onChange={(e) => handleMappingFieldChange('packWeightCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- Default (1000g / 1ea) --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pack Unit */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Pack Unit (g, kg, ml, L, each)</label>
                  <select
                    value={columnMapping.packUnitCol}
                    onChange={(e) => handleMappingFieldChange('packUnitCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- Auto-infer --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Category</label>
                  <select
                    value={columnMapping.categoryCol}
                    onChange={(e) => handleMappingFieldChange('categoryCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- Default Category --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Yield % */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Yield % (EY)</label>
                  <select
                    value={columnMapping.yieldPercentCol}
                    onChange={(e) => handleMappingFieldChange('yieldPercentCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- Default 100% --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier / Source */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Supplier / Source</label>
                  <select
                    value={columnMapping.sourceCol}
                    onChange={(e) => handleMappingFieldChange('sourceCol', e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">-- Supplier Direct --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Validation Metrics & Filtering Toolbar */}
          {unifiedParsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-stone-100 rounded-2xl border border-stone-200">
                {/* Stats */}
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="font-extrabold text-stone-900">
                    {totalDetectedCount} Items Detected:
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {validItemsCount} Ready
                  </span>
                  {invalidItemsCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-lg">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      {invalidItemsCount} Invalid (Missing Name)
                    </span>
                  )}
                  {zeroPriceItemsCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      {zeroPriceItemsCount} Missing Price
                    </span>
                  )}
                </div>

                {/* Selection Helpers */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg cursor-pointer"
                  >
                    {selectedRowIds.size === validItemsCount ? 'Deselect All' : 'Select All'}
                  </button>
                  {zeroPriceItemsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectOnlyPriced}
                      className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer"
                    >
                      Select Only Priced
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search parsed Excel rows..."
                    className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100 text-stone-700 font-bold sticky top-0 z-10 border-b border-stone-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.size > 0 && selectedRowIds.size === validItemsCount}
                          onChange={handleToggleSelectAll}
                          className="rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Pack Size</th>
                      <th className="p-2.5 text-right">Pack Price</th>
                      <th className="p-2.5 text-right">Price / Base Unit</th>
                      <th className="p-2.5 text-center">Yield %</th>
                      <th className="p-2.5">Supplier</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-medium">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-stone-400">
                          No matching rows found in this sheet.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const isSelected = selectedRowIds.has(row.item.id);
                        return (
                          <tr
                            key={row.item.id}
                            className={`transition-colors ${
                              !row.isValid
                                ? 'bg-rose-50/50 text-stone-500'
                                : isSelected
                                ? 'bg-emerald-50/60'
                                : 'hover:bg-stone-50'
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                disabled={!row.isValid}
                                checked={isSelected}
                                onChange={() => handleToggleRow(row.item.id)}
                                className="rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer disabled:opacity-30"
                              />
                            </td>
                            <td className="p-2.5 font-bold text-stone-900">
                              {row.item.itemDescription || (
                                <span className="text-rose-500 italic">Empty Name</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-200 text-stone-800">
                                {row.item.category}
                              </span>
                            </td>
                            <td className="p-2.5">
                              {row.item.packWeight} {row.item.packUnit}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-stone-900">
                              {row.item.packPrice > 0 ? (
                                formatCurrency(row.item.packPrice)
                              ) : (
                                <span className="text-amber-700 font-normal">R 0.00</span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono text-stone-700">
                              {formatCurrency(row.item.pricePerUnit)}/{row.item.baseUnit}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="font-bold text-stone-800">
                                {Math.round(row.item.estYieldPercent * 100)}%
                              </span>
                            </td>
                            <td className="p-2.5 text-stone-600 truncate max-w-[140px]">
                              {row.item.source}
                            </td>
                            <td className="p-2.5 text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <Check className="w-3 h-3" /> Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                  <X className="w-3 h-3" /> Invalid
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
          )}

          {/* Import Mode Settings */}
          {unifiedParsedRows.length > 0 && (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
              <label className="font-extrabold text-stone-900 text-xs block">
                Database Update Strategy:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'append'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="font-black text-xs mb-0.5">Append New Items</div>
                  <div className="text-[11px] text-stone-500 leading-tight">
                    Add selected items to the current database without altering existing ones.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('update_merge')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'update_merge'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="font-black text-xs mb-0.5">Update / Merge Prices</div>
                  <div className="text-[11px] text-stone-500 leading-tight">
                    Match existing items by name and update pack sizes and prices.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-rose-50 border-rose-600 text-rose-950 ring-1 ring-rose-600'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="font-black text-xs mb-0.5">Replace Entire Database</div>
                  <div className="text-[11px] text-stone-500 leading-tight">
                    Overwrite database completely with this new Excel sheet.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-5 sm:px-6 py-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600 font-medium">
            {selectedItemsToImport.length > 0 ? (
              <span className="font-bold text-stone-900">
                {selectedItemsToImport.length} ingredient{selectedItemsToImport.length > 1 ? 's' : ''} selected to import into Order List database.
              </span>
            ) : (
              <span>Select valid items from the Excel preview above to import.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedItemsToImport.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import {selectedItemsToImport.length} Items to Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
