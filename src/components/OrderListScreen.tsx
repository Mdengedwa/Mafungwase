import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  X,
  Tag,
  ExternalLink,
  Globe,
  Calendar,
  MapPin,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Mail,
  UserCheck,
  Lock,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Layers,
  ChevronRight,
  CheckCheck,
  PackageCheck,
  FileSpreadsheet,
  Download,
  DollarSign,
  Heart,
  ShoppingCart,
} from 'lucide-react';
import {
  OrderItem,
  PackType,
  PackUnit,
  BaseUnit,
  OrderChangeProposal,
  OrderProposalActionType,
  OrderProposalStatus,
  RecipeBasketItem,
} from '../types';
import {
  formatCurrency,
  formatPercent,
  calculatePricePerUnit,
} from '../utils/calculations';
import { isDateExpiredOrInvalid, cleanupExpiredAndInvalidDates } from '../utils/dateCleanup';
import { RetailPackUnitsModal } from './RetailPackUnitsModal';
import { RetailPackGuideItem } from '../data/retailPackUnits';
import { BulkCsvImportModal } from './BulkCsvImportModal';
import { QuickPriceUpdateModal } from './QuickPriceUpdateModal';
import { RecipeBasketModal } from './RecipeBasketModal';
import { exportOrderListToCsv, downloadCsvFile } from '../utils/csvOrderList';
import { exportOrderListToExcel } from '../utils/excelOrderList';

const EXECUTIVE_EMAIL = 'biyelamduduzi10@gmail.com';
const PROPOSALS_STORAGE_KEY = 'mafungwase_order_proposals_v1';
const USER_EMAIL_STORAGE_KEY = 'mafungwase_user_email';
const USER_NAME_STORAGE_KEY = 'mafungwase_user_name';
const BASKET_STORAGE_KEY = 'food_costing_recipe_basket';

interface OrderListScreenProps {
  orderList: OrderItem[];
  setOrderList: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  onResetOrderList: () => void;
  basket?: RecipeBasketItem[];
  setBasket?: React.Dispatch<React.SetStateAction<RecipeBasketItem[]>>;
  onNavigateToDishBuilder?: () => void;
}

export const OrderListScreen: React.FC<OrderListScreenProps> = ({
  orderList,
  setOrderList,
  onResetOrderList,
  basket: propBasket,
  setBasket: propSetBasket,
  onNavigateToDishBuilder,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterPendingOnly, setFilterPendingOnly] = useState<boolean>(false);

  // User Identity & Verification State
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem(USER_EMAIL_STORAGE_KEY) || '';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem(USER_NAME_STORAGE_KEY) || '';
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [pendingActionAfterEmail, setPendingActionAfterEmail] = useState<(() => void) | null>(null);

  // Email form input state
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [emailFormError, setEmailFormError] = useState<string | null>(null);

  // Executive Verification Center Modal
  const [isExecCenterOpen, setIsExecCenterOpen] = useState(false);
  const [execTab, setExecTab] = useState<'pending' | 'history' | 'tools'>('pending');

  // Change Proposals State (Persisted)
  const [proposals, setProposals] = useState<OrderChangeProposal[]>(() => {
    const saved = localStorage.getItem(PROPOSALS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved order proposals', e);
      }
    }
    return [];
  });

  // Sync proposals to LocalStorage
  useEffect(() => {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
  }, [proposals]);

  // Is current user verified as executive?
  const isExecutive = userEmail.trim().toLowerCase() === EXECUTIVE_EMAIL.toLowerCase();
  const hasSubmittedEmail = userEmail.trim().length > 0;

  // Pending proposals count
  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const pendingCount = pendingProposals.length;

  // Modals & Item Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRetailModalOpen, setIsRetailModalOpen] = useState(false);
  const [isBulkCsvModalOpen, setIsBulkCsvModalOpen] = useState(false);
  const [isQuickPriceModalOpen, setIsQuickPriceModalOpen] = useState(false);
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<OrderItem | null>(null);

  // Recipe Basket State (Self-managed or prop-managed)
  const [internalBasket, setInternalBasket] = useState<RecipeBasketItem[]>(() => {
    const saved = localStorage.getItem(BASKET_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse basket items', e);
      }
    }
    return [];
  });

  const basket = propBasket !== undefined ? propBasket : internalBasket;
  const setBasket = propSetBasket !== undefined ? propSetBasket : setInternalBasket;

  // Persist basket to local storage
  useEffect(() => {
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket));
  }, [basket]);

  // Total calculations based strictly on pack prices
  const totalBasketPacks = basket.reduce((acc, item) => acc + item.quantity, 0);
  const totalBasketCost = basket.reduce((acc, item) => {
    const price = Number(item.orderItem.packPrice) || 0;
    return acc + price * item.quantity;
  }, 0);

  const handleToggleBasket = (item: OrderItem) => {
    const existingIndex = basket.findIndex((b) => b.orderItem.id === item.id);
    if (existingIndex >= 0) {
      // If already in basket, increment pack count by 1
      const updated = [...basket];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1,
      };
      setBasket(updated);
      showNotification(
        `Added +1 pack of "${item.itemDescription}" to Recipe Basket (Total: ${updated[existingIndex].quantity} packs • ${formatCurrency(updated[existingIndex].quantity * item.packPrice)})!`,
        'success'
      );
    } else {
      // Add new item to basket with 1 pack
      const newItem: RecipeBasketItem = {
        orderItem: item,
        quantity: 1,
        addedAt: new Date().toISOString(),
      };
      setBasket((prev) => [...prev, newItem]);
      showNotification(
        `Added "${item.itemDescription}" to Recipe Basket (${formatCurrency(item.packPrice)} / ${item.packType})!`,
        'success'
      );
    }
  };

  const handleUpdateBasketQuantity = (orderItemId: string, newQty: number) => {
    setBasket((prev) =>
      prev
        .map((item) => {
          if (item.orderItem.id === orderItemId) {
            return { ...item, quantity: Math.max(1, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveBasketItem = (orderItemId: string) => {
    setBasket((prev) => {
      const removed = prev.find((b) => b.orderItem.id === orderItemId);
      const filtered = prev.filter((item) => item.orderItem.id !== orderItemId);
      if (removed) {
        showNotification(
          `Removed "${removed.orderItem.itemDescription}" from Recipe Basket.`,
          'info'
        );
      }
      return filtered;
    });
  };

  const handleClearBasket = () => {
    if (basket.length === 0) return;
    setBasket([]);
    showNotification('Recipe Shopping Basket has been cleared.', 'info');
  };

  // Form State
  const [category, setCategory] = useState('Poultry');
  const [itemDescription, setItemDescription] = useState('');
  const [packType, setPackType] = useState<PackType>('Pack');
  const [packPrice, setPackPrice] = useState<number>(100);
  const [packWeight, setPackWeight] = useState<number>(1000);
  const [packUnit, setPackUnit] = useState<PackUnit>('g');
  const [baseUnit, setBaseUnit] = useState<BaseUnit>('kg');
  const [estYieldPercent, setEstYieldPercent] = useState<number>(0.85);
  const [yieldNote, setYieldNote] = useState('');
  const [source, setSource] = useState('Local Supplier');
  const [sourceUrl, setSourceUrl] = useState('');
  const [endingDate, setEndingDate] = useState('');
  const [location, setLocation] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSaveQuickPrices = (updatedItems: OrderItem[]) => {
    setOrderList(updatedItems);
    showNotification(`Successfully updated prices for ${updatedItems.length} items!`, 'success');
  };

  const zeroPriceItemsCount = orderList.filter((item) => item.packPrice <= 0 || item.pricePerUnit <= 0).length;
  const requireEmailAuth = (action: () => void) => {
    if (!hasSubmittedEmail) {
      setPendingActionAfterEmail(() => action);
      setInputEmail('');
      setInputName('');
      setEmailFormError(null);
      setIsEmailModalOpen(true);
      return false;
    }
    action();
    return true;
  };

  // Handle email submission
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputEmail.trim().toLowerCase();
    const cleanName = inputName.trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailFormError('Please enter a valid email address.');
      return;
    }

    setUserEmail(cleanEmail);
    setUserName(cleanName);
    localStorage.setItem(USER_EMAIL_STORAGE_KEY, cleanEmail);
    if (cleanName) {
      localStorage.setItem(USER_NAME_STORAGE_KEY, cleanName);
    } else {
      localStorage.removeItem(USER_NAME_STORAGE_KEY);
    }

    setIsEmailModalOpen(false);
    showNotification(
      cleanEmail === EXECUTIVE_EMAIL.toLowerCase()
        ? '👑 Executive Approver session verified.'
        : `Email verified (${cleanEmail}). You can now propose edits to the Order List!`,
      'success'
    );

    // Execute pending action if any
    if (pendingActionAfterEmail) {
      pendingActionAfterEmail();
      setPendingActionAfterEmail(null);
    }
  };

  // Quick switch to Executive Mode for the primary user
  const handleSwitchToExecutive = () => {
    setUserEmail(EXECUTIVE_EMAIL);
    setUserName('Executive Administrator');
    localStorage.setItem(USER_EMAIL_STORAGE_KEY, EXECUTIVE_EMAIL);
    localStorage.setItem(USER_NAME_STORAGE_KEY, 'Executive Administrator');
    showNotification('👑 Logged in as Executive Administrator (biyelamduduzi10@gmail.com)', 'success');
  };

  // Log out / clear email
  const handleClearEmail = () => {
    setUserEmail('');
    setUserName('');
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
    localStorage.removeItem(USER_NAME_STORAGE_KEY);
    showNotification('Logged out. You are now viewing in guest mode.', 'info');
  };

  const handleCleanExpiredDates = () => {
    requireEmailAuth(() => {
      const { cleanedOrderList, removedOrderDatesCount } = cleanupExpiredAndInvalidDates(
        orderList,
        []
      );
      if (isExecutive) {
        setOrderList(cleanedOrderList);
        if (removedOrderDatesCount > 0) {
          showNotification(`Cleaned up ${removedOrderDatesCount} invalid/expired promotion end dates.`);
        } else {
          showNotification(`All promotion end dates in your Order List are valid!`, 'info');
        }
      } else {
        showNotification(
          `Date cleanup request noted. Executive verification is required to execute batch modifications.`,
          'info'
        );
      }
    });
  };

  const handleResetData = () => {
    requireEmailAuth(() => {
      if (isExecutive) {
        onResetOrderList();
        showNotification('Order List cleared of all non-CSV items. Database is ready for CSV import.');
      } else {
        showNotification(
          'Resetting the database is restricted to the Executive Approver.',
          'warning'
        );
      }
    });
  };

  const handlePurgeNonCsvItems = () => {
    requireEmailAuth(() => {
      const csvOnly = orderList.filter((item) => item.isFromCsv === true || (item.id && item.id.startsWith('ord-csv-')));
      const removedCount = orderList.length - csvOnly.length;
      setOrderList(csvOnly);
      showNotification(`Removed ${removedCount} non-CSV items from Order List database!`, 'success');
    });
  };

  // Categories list
  const categories = [
    'All',
    'Poultry',
    'Meat & Beef',
    'Vegetables & Produce',
    'Dairy & Pantry',
    'Spices & Condiments',
    'Packaging',
  ];

  // Get pending proposal map for quick badge check
  const pendingByItemId = new Map<string, OrderChangeProposal>();
  pendingProposals.forEach((p) => {
    if (p.itemData?.id) {
      pendingByItemId.set(p.itemData.id, p);
    }
  });

  // Filter items
  const filteredItems = orderList.filter((item) => {
    const matchesSearch = item.itemDescription
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesPending = !filterPendingOnly || pendingByItemId.has(item.id);
    return matchesSearch && matchesCat && matchesPending;
  });

  const handleOpenAdd = () => {
    requireEmailAuth(() => {
      setEditingItem(null);
      setCategory('Poultry');
      setItemDescription('');
      setPackType('Pack');
      setPackPrice(100);
      setPackWeight(1000);
      setPackUnit('g');
      setBaseUnit('kg');
      setEstYieldPercent(0.85);
      setYieldNote('Trimmed loss');
      setSource('Local Supplier');
      setSourceUrl('');
      setEndingDate('');
      setLocation('');
      setIsModalOpen(true);
    });
  };

  const handleOpenEdit = (item: OrderItem) => {
    requireEmailAuth(() => {
      setEditingItem(item);
      setCategory(item.category);
      setItemDescription(item.itemDescription);
      setPackType(item.packType);
      setPackPrice(item.packPrice);
      setPackWeight(item.packWeight);
      setPackUnit(item.packUnit);
      setBaseUnit(item.baseUnit);
      setEstYieldPercent(item.estYieldPercent);
      setYieldNote(item.yieldNote);
      setSource(item.source);
      setSourceUrl(item.sourceUrl || '');
      setEndingDate(item.endingDate || '');
      setLocation(item.location || '');
      setIsModalOpen(true);
    });
  };

  const handleOpenDelete = (item: OrderItem) => {
    requireEmailAuth(() => {
      setDeleteConfirmItem(item);
    });
  };

  const handleOpenBulkImport = () => {
    requireEmailAuth(() => {
      setIsBulkCsvModalOpen(true);
    });
  };

  const handleExportCsv = () => {
    const csvData = exportOrderListToCsv(orderList);
    downloadCsvFile(
      `catchup_order_list_${new Date().toISOString().slice(0, 10)}.csv`,
      csvData
    );
    showNotification(`Exported ${orderList.length} Order List database items to CSV!`, 'success');
  };

  const handleExportExcel = () => {
    exportOrderListToExcel(
      orderList,
      `catchup_order_list_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    showNotification(`Exported ${orderList.length} Order List database items to Excel (.xlsx)!`, 'success');
  };

  const handleRemoveZeroPriceItems = () => {
    requireEmailAuth(() => {
      const pricedItems = orderList.filter(
        (item) => Number(item.packPrice) > 0 || Number(item.pricePerUnit) > 0
      );
      const removedCount = orderList.length - pricedItems.length;
      if (removedCount === 0) {
        showNotification('All items in your Order List already have a valid price listed!', 'info');
        return;
      }
      setOrderList(pricedItems);
      showNotification(`Removed ${removedCount} item${removedCount === 1 ? '' : 's'} with no price listed from Order List!`, 'success');
    });
  };

  const handleImportCsvItems = (
    items: OrderItem[],
    mode: 'append' | 'update_merge' | 'replace'
  ) => {
    if (items.length === 0) return;

    if (mode === 'replace') {
      setOrderList(items);
      showNotification(`Replaced database with ${items.length} imported items!`, 'success');
    } else if (mode === 'update_merge') {
      setOrderList((prev) => {
        const updated = [...prev];
        const newItems: OrderItem[] = [];

        items.forEach((imported) => {
          const idx = updated.findIndex(
            (curr) =>
              curr.itemDescription.trim().toLowerCase() ===
              imported.itemDescription.trim().toLowerCase()
          );
          if (idx >= 0) {
            updated[idx] = {
              ...imported,
              id: updated[idx].id,
            };
          } else {
            newItems.push(imported);
          }
        });

        return [...newItems, ...updated];
      });
      showNotification(`Updated & merged ${items.length} items in Order List database!`, 'success');
    } else {
      // append
      setOrderList((prev) => [...items, ...prev]);
      showNotification(`Successfully added ${items.length} items to Order List database!`, 'success');
    }
  };

  // Populate form with item selected from South African Retail Pack Units modal
  const handleSelectRetailUnitInOrderList = (retailItem: RetailPackGuideItem) => {
    setItemDescription(retailItem.unit);
    setCategory(
      retailItem.category.includes('Dairy') || retailItem.category.includes('Pantry')
        ? 'Dairy & Pantry'
        : retailItem.category.includes('Produce')
        ? 'Vegetables & Produce'
        : retailItem.category.includes('Bulk')
        ? 'Spices & Condiments'
        : 'Dairy & Pantry'
    );
    setPackType(retailItem.baseUnit === 'ea' ? 'Each' : 'Pack');
    setPackWeight(retailItem.standardGramsOrMl || retailItem.standardCount || 1000);
    setPackUnit(retailItem.baseUnit === 'ml' ? 'ml' : retailItem.baseUnit === 'ea' ? 'each' : 'g');
    setBaseUnit(retailItem.baseUnit === 'ml' ? 'L' : retailItem.baseUnit === 'ea' ? 'each' : 'kg');
    setEstYieldPercent(1.0);
    setYieldNote(retailItem.commonUse || '100% usable');
    setIsRetailModalOpen(false);
    setIsModalOpen(true);
  };

  // Save Item or Create Change Proposal
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedPricePerUnit = calculatePricePerUnit(
      packPrice,
      packWeight,
      packUnit,
      baseUnit
    );

    const cleanUrl = sourceUrl.trim();
    const cleanEndingDate = endingDate.trim();
    const cleanLocation = location.trim();

    const isEndingDateInvalid = cleanEndingDate ? isDateExpiredOrInvalid(cleanEndingDate) : false;
    const finalEndingDate = cleanEndingDate && !isEndingDateInvalid ? cleanEndingDate : undefined;

    const itemPayload: OrderItem = {
      id: editingItem ? editingItem.id : `ord-${Date.now()}`,
      category,
      itemDescription: itemDescription.trim(),
      packType,
      packPrice,
      packWeight,
      packUnit,
      baseUnit,
      pricePerUnit: calculatedPricePerUnit,
      estYieldPercent,
      yieldNote: yieldNote.trim(),
      source: source.trim() || 'Local Supplier',
      sourceUrl: cleanUrl || undefined,
      endingDate: finalEndingDate,
      location: cleanLocation || undefined,
    };

    if (isExecutive) {
      // Direct execution by verified executive
      if (editingItem) {
        setOrderList((prev) =>
          prev.map((i) => (i.id === editingItem.id ? itemPayload : i))
        );
        showNotification(`Updated "${itemPayload.itemDescription}" in Order List.`, 'success');
      } else {
        setOrderList((prev) => [itemPayload, ...prev]);
        showNotification(`Added "${itemPayload.itemDescription}" to Order List.`, 'success');
      }
    } else {
      // Create proposal for Executive Verification
      const actionType: OrderProposalActionType = editingItem ? 'edit' : 'add';
      const newProposal: OrderChangeProposal = {
        id: `prop-${Date.now()}`,
        type: actionType,
        status: 'pending',
        submittedByEmail: userEmail,
        submittedByName: userName || undefined,
        submittedAt: new Date().toLocaleString('en-ZA', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        itemData: itemPayload,
        previousData: editingItem || undefined,
      };

      setProposals((prev) => [newProposal, ...prev]);
      showNotification(
        `Proposal submitted for Executive Verification! It will be applied to the Order List once verified by ${EXECUTIVE_EMAIL}.`,
        'success'
      );
    }

    setIsModalOpen(false);
  };

  // Submit or Execute Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;

    if (isExecutive) {
      setOrderList((prev) => prev.filter((i) => i.id !== deleteConfirmItem.id));
      showNotification(`Deleted "${deleteConfirmItem.itemDescription}" from Order List.`, 'success');
    } else {
      const newProposal: OrderChangeProposal = {
        id: `prop-del-${Date.now()}`,
        type: 'delete',
        status: 'pending',
        submittedByEmail: userEmail,
        submittedByName: userName || undefined,
        submittedAt: new Date().toLocaleString('en-ZA', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        itemData: deleteConfirmItem,
        previousData: deleteConfirmItem,
      };

      setProposals((prev) => [newProposal, ...prev]);
      showNotification(
        `Deletion request for "${deleteConfirmItem.itemDescription}" submitted for Executive Verification.`,
        'success'
      );
    }

    setDeleteConfirmItem(null);
  };

  // Executive Action: Approve and Execute Change Proposal
  const handleExecuteProposal = (proposal: OrderChangeProposal) => {
    const verifiedTime = new Date().toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (proposal.type === 'add') {
      setOrderList((prev) => [proposal.itemData, ...prev.filter((i) => i.id !== proposal.itemData.id)]);
    } else if (proposal.type === 'edit') {
      setOrderList((prev) =>
        prev.map((i) => (i.id === proposal.itemData.id ? proposal.itemData : i))
      );
    } else if (proposal.type === 'delete') {
      setOrderList((prev) => prev.filter((i) => i.id !== proposal.itemData.id));
    }

    // Update proposal status
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposal.id
          ? {
              ...p,
              status: 'approved',
              verifiedAt: verifiedTime,
              verifiedBy: userEmail || EXECUTIVE_EMAIL,
            }
          : p
      )
    );

    showNotification(
      `Executed ${proposal.type.toUpperCase()} change for "${proposal.itemData.itemDescription}" into the active Order List!`,
      'success'
    );
  };

  // Executive Action: Reject Change Proposal
  const handleRejectProposal = (proposalId: string, reason?: string) => {
    const verifiedTime = new Date().toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: 'rejected',
              rejectionReason: reason || 'Declined by Executive Approver.',
              verifiedAt: verifiedTime,
              verifiedBy: userEmail || EXECUTIVE_EMAIL,
            }
          : p
      )
    );

    showNotification('Proposal rejected.', 'info');
  };

  // Executive Action: Batch Approve All Pending
  const handleExecuteAllPending = () => {
    if (pendingProposals.length === 0) return;

    let updatedList = [...orderList];
    const verifiedTime = new Date().toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    pendingProposals.forEach((p) => {
      if (p.type === 'add') {
        updatedList = [p.itemData, ...updatedList.filter((i) => i.id !== p.itemData.id)];
      } else if (p.type === 'edit') {
        updatedList = updatedList.map((i) => (i.id === p.itemData.id ? p.itemData : i));
      } else if (p.type === 'delete') {
        updatedList = updatedList.filter((i) => i.id !== p.itemData.id);
      }
    });

    setOrderList(updatedList);
    setProposals((prev) =>
      prev.map((p) =>
        p.status === 'pending'
          ? {
              ...p,
              status: 'approved',
              verifiedAt: verifiedTime,
              verifiedBy: userEmail || EXECUTIVE_EMAIL,
            }
          : p
      )
    );

    showNotification(`Executed all ${pendingProposals.length} pending proposals into the live Order List!`, 'success');
  };

  const renderSourceCell = (item: OrderItem) => {
    let targetUrl = item.sourceUrl?.trim();
    let label = item.source?.trim() || '';

    if (!targetUrl && label && (label.startsWith('http://') || label.startsWith('https://') || label.startsWith('www.'))) {
      targetUrl = label;
      label = label.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || label;
    }

    if (targetUrl) {
      const formattedHref = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
        ? targetUrl
        : `https://${targetUrl}`;

      return (
        <a
          href={formattedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300/80 rounded-lg font-extrabold text-xs transition-all hover:scale-[1.02] hover:shadow-2xs group"
          title={`Open product listing: ${formattedHref}`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="truncate max-w-[150px] underline decoration-emerald-400/80">{label || 'View Product'}</span>
          <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      );
    }

    return (
      <span className="text-stone-700 font-medium text-xs">
        {label || '-'}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Identity & Verification Status Banner */}
      <div
        className={`rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isExecutive
            ? 'bg-gradient-to-r from-emerald-900 via-[#0B3B28] to-emerald-950 text-white border-emerald-700 shadow-md'
            : hasSubmittedEmail
            ? 'bg-stone-900 text-stone-100 border-black'
            : 'bg-amber-50/90 text-stone-900 border-amber-300'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isExecutive
                ? 'bg-emerald-800/80 border-emerald-400 text-amber-300'
                : hasSubmittedEmail
                ? 'bg-stone-800 border-stone-700 text-emerald-400'
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}
          >
            {isExecutive ? (
              <ShieldCheck className="w-6 h-6" />
            ) : hasSubmittedEmail ? (
              <UserCheck className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base">
                {isExecutive
                  ? '👑 Executive Approver Verified'
                  : hasSubmittedEmail
                  ? 'Verified Contributor'
                  : 'Editing Restricted (Email Required)'}
              </span>
              {isExecutive && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 rounded-md">
                  Live Executive Authority
                </span>
              )}
            </div>
            <p
              className={`text-xs mt-0.5 truncate ${
                isExecutive
                  ? 'text-emerald-200'
                  : hasSubmittedEmail
                  ? 'text-stone-300'
                  : 'text-amber-800 font-medium'
              }`}
            >
              {isExecutive
                ? `Logged in as Executive Approver (${userEmail}). You can verify & execute submitted changes.`
                : hasSubmittedEmail
                ? `Active Session: ${userEmail} ${userName ? `(${userName})` : ''} • Changes require Executive verification by ${EXECUTIVE_EMAIL} before execution.`
                : 'Only users who have submitted their email can propose edits to the Order List. Changes are executed after executive verification.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-center shrink-0">
          {hasSubmittedEmail ? (
            <>
              {/* Executive Approvals Queue Button */}
              <button
                type="button"
                onClick={() => setIsExecCenterOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                  pendingCount > 0
                    ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-amber-500 shadow-md animate-pulse'
                    : isExecutive
                    ? 'bg-emerald-800/80 hover:bg-emerald-700 text-white border-emerald-500'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Executive Verification Center</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[11px] font-black bg-rose-600 text-white rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              {!isExecutive && (
                <button
                  type="button"
                  onClick={handleSwitchToExecutive}
                  className="px-3 py-2 text-xs font-bold text-emerald-300 hover:text-emerald-100 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 rounded-xl transition-colors cursor-pointer"
                  title="Switch session to Executive Approver (biyelamduduzi10@gmail.com)"
                >
                  Switch to Executive
                </button>
              )}

              <button
                type="button"
                onClick={handleClearEmail}
                className="px-3 py-2 text-xs font-bold text-stone-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              >
                Switch Email
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputEmail('');
                  setInputName('');
                  setEmailFormError(null);
                  setIsEmailModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs transition-transform active:scale-98 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Submit Email to Edit</span>
              </button>
              <button
                type="button"
                onClick={handleSwitchToExecutive}
                className="px-3 py-2.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer"
                title="Verify as executive: biyelamduduzi10@gmail.com"
              >
                Executive Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Database Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2.5">
              <Database className="w-6 h-6 text-amber-700" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                Order List Database
              </h2>
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsExecCenterOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>{pendingCount} Pending Executive Verification</span>
                </button>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Master supplier ingredient & packaging database with pack weights, price per kg, and yield factors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Recipe Shopping Basket Button (Always Visible to All Users) */}
            <button
              onClick={() => setIsBasketModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 border ${
                basket.length > 0
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400/40'
                  : 'bg-stone-100 hover:bg-rose-50 text-stone-800 hover:text-rose-700 border-stone-300'
              }`}
              title="Open Recipe Shopping Basket"
            >
              <Heart
                className={`w-4 h-4 ${
                  basket.length > 0 ? 'fill-white text-white' : 'text-rose-500'
                }`}
              />
              <span>Recipe Basket {basket.length > 0 ? `(${basket.length})` : ''}</span>
              {basket.length > 0 && (
                <span className="bg-rose-950 text-rose-100 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                  {formatCurrency(totalBasketCost)}
                </span>
              )}
            </button>

            {/* Manager / Executive Mode Only Database Management Tools */}
            {isExecutive && (
              <>
                {/* Quick Price Updater Button */}
                <button
                  onClick={() => setIsQuickPriceModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 border ${
                    zeroPriceItemsCount > 0
                      ? 'bg-amber-400 text-stone-950 border-amber-600 animate-pulse hover:bg-amber-300'
                      : 'bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200'
                  }`}
                  title="Quickly view and update item prices"
                >
                  <DollarSign className="w-4 h-4 text-amber-950" />
                  <span>
                    {zeroPriceItemsCount > 0
                      ? `Update Missing Prices (${zeroPriceItemsCount})`
                      : 'Quick Price Editor'}
                  </span>
                </button>

                {/* Bulk Excel & CSV Import Button */}
                <button
                  onClick={handleOpenBulkImport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-600 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Bulk import ingredients, packaging, suppliers and costs from an Excel (.xlsx, .xls) or CSV file"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                  <span>Import Excel / CSV</span>
                </button>

                {/* Export Excel (.xlsx) Button */}
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                  title="Export all database items to Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Export Excel</span>
                </button>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors cursor-pointer"
                  title="Export all database items to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {/* Remove No-Price Items Button */}
                {zeroPriceItemsCount > 0 && (
                  <button
                    onClick={handleRemoveZeroPriceItems}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-rose-950 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                    title="Remove all items with missing or zero prices from the database"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                    <span>Remove No-Price Items ({zeroPriceItemsCount})</span>
                  </button>
                )}

                <button
                  onClick={() => setIsRetailModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-500 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Open South African Retail Pack & Count Units Reference Guide"
                >
                  <PackageCheck className="w-4 h-4 text-amber-900" />
                  <span>🇿🇦 SA Retail Units Guide</span>
                </button>

                {orderList.some((item) => !item.isFromCsv && !item.id.startsWith('ord-csv-')) && (
                  <button
                    onClick={handlePurgeNonCsvItems}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl transition-colors cursor-pointer"
                    title="Remove any items that did not originate from a CSV import"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                    <span>Purge Non-CSV Items ({orderList.filter((item) => !item.isFromCsv && !item.id.startsWith('ord-csv-')).length})</span>
                  </button>
                )}

                <button
                  onClick={handleCleanExpiredDates}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300 rounded-xl transition-colors cursor-pointer"
                  title="Automatically remove invalid or expired promotion end dates"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Clean Expired Promo Dates
                </button>

                <button
                  onClick={handleResetData}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  title="Reset Order List to default starter dataset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Starter Data
                </button>

                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient/Item</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications Toast */}
        {notification && (
          <div
            className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between border animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : notification.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-stone-100 border-stone-300 text-stone-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:opacity-70 font-black text-sm cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Missing Prices Warning Banner */}
        {zeroPriceItemsCount > 0 && (
          <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-2 bg-amber-200 text-amber-950 rounded-xl shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-stone-900 block text-sm">
                  {zeroPriceItemsCount} {zeroPriceItemsCount === 1 ? 'item has' : 'items have'} missing prices (R 0.00)
                </span>
                <p className="text-stone-600 text-[11px] mt-0.5">
                  Update pack prices now to automatically calculate price per kg/litre for your food costing.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleRemoveZeroPriceItems}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-rose-950 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title="Remove all items that have zero or missing price"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                <span>Remove Unpriced Items</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickPriceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-600 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Update Prices Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ingredient or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 bg-stone-50/50 font-medium"
            />
          </div>

          {/* Category Filter Pills & Pending Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setFilterPendingOnly(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat && !filterPendingOnly
                    ? 'bg-amber-800 text-amber-50 shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {cat}
              </button>
            ))}

            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterPendingOnly(!filterPendingOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterPendingOnly
                    ? 'bg-amber-500 text-stone-950 shadow-xs border border-amber-600'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-800" />
                <span>Pending ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto border border-stone-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/90 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Item Description</th>
                <th className="p-3">Pack Details</th>
                <th className="p-3">Pack Price</th>
                <th className="p-3">Calculated Price/Unit</th>
                <th className="p-3">Est. Yield %</th>
                <th className="p-3">Ending Date</th>
                <th className="p-3">Location</th>
                <th className="p-3">Source / Supplier</th>
                <th className="p-3 w-32 text-center">{isExecutive ? 'Actions' : 'Recipe Basket'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {orderList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center bg-stone-50/50">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-stone-900 text-sm">
                        Order List Database Is Empty
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        All non-CSV placeholder items have been removed. You can now bulk import all your ingredients, packaging, suppliers, and prices from a CSV file.
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenBulkImport}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-600 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Bulk Import from CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Single Item</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-stone-400 bg-stone-50/50">
                    No items found matching search or filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const pendingProposal = pendingByItemId.get(item.id);
                  const basketItem = basket.find((b) => b.orderItem.id === item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        pendingProposal
                          ? 'bg-amber-50/60 hover:bg-amber-100/60'
                          : basketItem
                          ? 'bg-rose-50/25 hover:bg-rose-50/40'
                          : 'hover:bg-amber-50/30'
                      }`}
                    >
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 text-amber-950 border border-amber-200">
                          <Tag className="w-2.5 h-2.5 text-amber-700" />
                          {item.category}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5 flex-wrap">
                          <span>{item.itemDescription}</span>
                          {pendingProposal && (
                            <span
                              onClick={() => setIsExecCenterOpen(true)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 cursor-pointer hover:bg-amber-300"
                              title={`Proposal pending executive verification: ${pendingProposal.type.toUpperCase()}`}
                            >
                              <Clock className="w-3 h-3 text-amber-800 animate-spin" />
                              Pending Verification ({pendingProposal.type})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-stone-600">
                        {item.packType}: {item.packWeight} {item.packUnit}
                      </td>

                      <td className="p-3 font-semibold text-stone-800 whitespace-nowrap">
                        {item.packPrice > 0 ? (
                          <span>{formatCurrency(item.packPrice)}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black bg-amber-200 text-amber-950 border border-amber-400 hover:bg-amber-300 transition-all cursor-pointer shadow-2xs"
                            title="Pack Price is missing. Click to enter price"
                          >
                            <span>R 0.00</span>
                            <Edit2 className="w-3 h-3 text-amber-900" />
                            <span className="text-[10px] uppercase tracking-wider">(Set Price)</span>
                          </button>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {item.pricePerUnit > 0 ? (
                          <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 text-xs">
                            {formatCurrency(item.pricePerUnit)} / {item.baseUnit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 text-xs">
                            <span>R 0.00 / {item.baseUnit}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-stone-800">
                          {formatPercent(item.estYieldPercent)}
                        </div>
                        <span className="text-[10px] text-stone-400 block">{item.yieldNote}</span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {item.endingDate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            <Calendar className="w-3 h-3 text-amber-700 shrink-0" />
                            {item.endingDate}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-3">
                        {item.location ? (
                          <span className="inline-flex items-center gap-1 text-stone-700 font-medium text-xs">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate max-w-[130px]" title={item.location}>{item.location}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-3 font-medium">
                        {renderSourceCell(item)}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Heart icon for Add to Recipe Basket - Always Available */}
                          <button
                            type="button"
                            onClick={() => handleToggleBasket(item)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              basketItem
                                ? 'text-rose-600 bg-rose-100/80 hover:bg-rose-200 ring-1 ring-rose-300 shadow-2xs'
                                : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={
                              basketItem
                                ? `In Recipe Basket: ${basketItem.quantity} ${
                                    basketItem.quantity === 1 ? 'pack' : 'packs'
                                  } (${formatCurrency(
                                    basketItem.quantity * item.packPrice
                                  )}). Click to add +1 pack.`
                                : `Add to Recipe Basket (Pack Price: ${formatCurrency(
                                    item.packPrice
                                  )})`
                            }
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform active:scale-125 ${
                                basketItem ? 'fill-rose-500 text-rose-500' : ''
                              }`}
                            />
                          </button>

                          {/* Executive / Manager Only Row Actions */}
                          {isExecutive && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(item)}
                                className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Registration / Verification Required Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-black space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-base">
                  Submit Email to Edit Order List
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              To safeguard restaurant pricing data, <strong>only registered users who have submitted their email</strong> can propose additions, price modifications, or deletions to the Order List.
            </p>

            <form onSubmit={handleSaveEmail} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Your Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. chef.john@catering.co.za"
                  value={inputEmail}
                  onChange={(e) => {
                    setInputEmail(e.target.value);
                    setEmailFormError(null);
                  }}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-600 bg-stone-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Your Full Name or Kitchen Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chef John (Purchasing)"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-600 bg-stone-50 font-medium"
                />
              </div>

              {emailFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{emailFormError}</span>
                </div>
              )}

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-500 space-y-1">
                <div className="font-bold text-stone-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Executive Verification Workflow
                </div>
                <p>
                  Any edits you make will be held as pending and submitted for executive verification by <strong>{EXECUTIVE_EMAIL}</strong> before being applied to the live calculation system.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit & Verify</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-black space-y-4">
            <div className="flex items-center gap-3 text-rose-700 pb-2 border-b border-stone-100">
              <div className="p-2.5 bg-rose-100 rounded-2xl">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900">
                  {isExecutive ? 'Confirm Deletion' : 'Propose Item Deletion'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isExecutive ? 'Direct Executive Action' : `Submitted by ${userEmail}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              Are you sure you want to remove <strong>"{deleteConfirmItem.itemDescription}"</strong> ({deleteConfirmItem.category})?
            </p>

            {!isExecutive && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                This deletion will be queued as a proposal and executed only once verified by Executive <strong>{EXECUTIVE_EMAIL}</strong>.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-black text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs cursor-pointer"
              >
                {isExecutive ? 'Delete Immediately' : 'Submit Deletion Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-black my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-700" />
                  {editingItem ? 'Edit Ingredient/Item' : 'Add New Ingredient/Item'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isExecutive
                    ? '👑 Live executive editing mode'
                    : `Submitting as ${userEmail} (requires executive verification)`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-semibold"
                >
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-amber-700" />
                  Standard SA Retail Pack?
                </span>
                <button
                  type="button"
                  onClick={() => setIsRetailModalOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-extrabold text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-500 rounded-lg shadow-2xs cursor-pointer"
                >
                  🇿🇦 Fill from SA Retail Units Guide
                </button>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Item Description <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canola Cooking Oil or Large Eggs"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Pack Type</label>
                  <select
                    value={packType}
                    onChange={(e) => setPackType(e.target.value as PackType)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-medium"
                  >
                    <option value="Pack">Pack</option>
                    <option value="Loose">Loose</option>
                    <option value="Each">Each</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Pack Price (Rand) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={packPrice}
                    onChange={(e) => setPackPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-extrabold text-amber-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-stone-700 mb-1">
                    Pack Size / Qty <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={packWeight}
                    onChange={(e) => setPackWeight(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-medium"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-bold text-stone-700 mb-1">Pack Unit</label>
                  <select
                    value={packUnit}
                    onChange={(e) => {
                      const u = e.target.value as PackUnit;
                      setPackUnit(u);
                      if (u === 'ml' || u === 'L') {
                        setBaseUnit('L');
                      } else if (u === 'each' || u === 'tray' || u === 'punnet' || u === 'can' || u === 'bunch' || u === 'bottle' || u === 'box' || u === 'bag') {
                        setBaseUnit('each');
                      } else {
                        setBaseUnit('kg');
                      }
                    }}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-bold text-stone-900"
                  >
                    <optgroup label="Mass (Weight)">
                      <option value="g">grams (g)</option>
                      <option value="kg">kilograms (kg)</option>
                    </optgroup>
                    <optgroup label="Volume (Liquids & Oils)">
                      <option value="ml">milliliters (ml)</option>
                      <option value="L">litres (L)</option>
                    </optgroup>
                    <optgroup label="Count & Retail Packaging">
                      <option value="each">each (ea)</option>
                      <option value="tray">tray (e.g. 30 eggs)</option>
                      <option value="punnet">punnet (e.g. 250g)</option>
                      <option value="can">can / tin (410g)</option>
                      <option value="brick">brick (500g)</option>
                      <option value="bottle">bottle</option>
                      <option value="bunch">bunch / packet</option>
                      <option value="box">box</option>
                      <option value="bag">bag</option>
                    </optgroup>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-bold text-stone-700 mb-1">Base Price Unit</label>
                  <select
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value as BaseUnit)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-emerald-50 text-emerald-950 font-extrabold"
                  >
                    <option value="kg">Per Kilogram (R/kg)</option>
                    <option value="L">Per Litre (R/L)</option>
                    <option value="each">Per Each / Item (R/ea)</option>
                    <option value="g">Per Gram (R/g)</option>
                    <option value="ml">Per Millilitre (R/ml)</option>
                  </select>
                </div>
              </div>

              {/* Live Price Calculation Preview Card */}
              <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block">
                    Calculated Base Price
                  </span>
                  <span className="text-xs text-stone-600">
                    {formatCurrency(packPrice)} per {packWeight} {packUnit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-950 block">
                    {formatCurrency(calculatePricePerUnit(packPrice, packWeight, packUnit, baseUnit))} / {baseUnit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Est. Yield % (e.g. 0.85 = 85%) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    required
                    value={estYieldPercent}
                    onChange={(e) => setEstYieldPercent(parseFloat(e.target.value) || 1.0)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Yield Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Cooked loss / trimmed fat"
                    value={yieldNote}
                    onChange={(e) => setYieldNote(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Supplier / Source Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Makro or Checkers Hyper"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-700" />
                    Product URL / Listing Link
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://www.makro.co.za/product/123"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    Special Ending Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endingDate}
                    onChange={(e) => setEndingDate(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs bg-white ${
                      endingDate && isDateExpiredOrInvalid(endingDate)
                        ? 'border-red-500 bg-red-50/50 text-red-900'
                        : 'border-stone-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    Store Location / Branch (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Durban Central or All Stores"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {!isExecutive && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-[11px] text-amber-950 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black">Executive Verification Required:</span> When saved, this proposal will be queued for verification by <strong>{EXECUTIVE_EMAIL}</strong> before updating live meal costs.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-xs cursor-pointer"
                >
                  {isExecutive ? 'Save Item Immediately' : 'Submit Proposal for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Executive Verification & Approval Center Modal */}
      {isExecCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border-2 border-black my-8 space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-300">
                  <ShieldCheck className="w-6 h-6 text-emerald-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl flex items-center gap-2">
                    Executive Verification & Execution Center
                  </h3>
                  <p className="text-xs text-stone-500">
                    Executive: <strong>{EXECUTIVE_EMAIL}</strong> • Review and execute contributor submissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExecCenterOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs & Batch Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExecTab('pending')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    execTab === 'pending'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Proposals</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      execTab === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-300 text-stone-800'
                    }`}
                  >
                    {pendingCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExecTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    execTab === 'history'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>History & Audit Log</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExecTab('tools')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    execTab === 'tools'
                      ? 'bg-indigo-800 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Executive Database Tools</span>
                </button>
              </div>

              {execTab === 'pending' && pendingCount > 0 && isExecutive && (
                <button
                  type="button"
                  onClick={handleExecuteAllPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Approve & Execute All ({pendingCount})</span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {execTab === 'pending' ? (
                pendingCount === 0 ? (
                  <div className="p-10 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <div className="font-extrabold text-stone-800 text-sm">
                      All Caught Up!
                    </div>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      There are no pending ingredient change proposals waiting for verification.
                    </p>
                  </div>
                ) : (
                  pendingProposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-stone-50 border-2 border-stone-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              prop.type === 'add'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : prop.type === 'edit'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {prop.type === 'add' ? '➕ New Item Proposal' : prop.type === 'edit' ? '✏️ Edit Proposal' : '🗑️ Deletion Proposal'}
                          </span>
                          <span className="font-bold text-xs text-stone-900">
                            {prop.itemData.category}
                          </span>
                        </div>

                        <div className="text-[11px] text-stone-500 flex items-center gap-1.5 font-medium">
                          <Mail className="w-3 h-3 text-stone-400" />
                          <span>Submitted by <strong>{prop.submittedByEmail}</strong></span>
                          <span>•</span>
                          <span>{prop.submittedAt}</span>
                        </div>
                      </div>

                      {/* Proposal Details / Diff */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-stone-200">
                        <div>
                          <div className="text-[10px] font-extrabold uppercase text-stone-400 mb-1">
                            {prop.type === 'edit' ? 'Proposed Item Update' : 'Item Details'}
                          </div>
                          <div className="font-black text-stone-900 text-sm">
                            {prop.itemData.itemDescription}
                          </div>
                          <div className="text-stone-600 mt-1 space-y-0.5">
                            <div>Pack: <strong>{prop.itemData.packType} {prop.itemData.packWeight} {prop.itemData.packUnit}</strong></div>
                            <div>Price: <strong className="text-amber-900">{formatCurrency(prop.itemData.packPrice)}</strong> ({formatCurrency(prop.itemData.pricePerUnit)}/{prop.itemData.baseUnit})</div>
                            <div>Est. Yield: <strong>{formatPercent(prop.itemData.estYieldPercent)}</strong> {prop.itemData.yieldNote && `(${prop.itemData.yieldNote})`}</div>
                            <div>Source: <strong>{prop.itemData.source}</strong> {prop.itemData.location && `[${prop.itemData.location}]`}</div>
                          </div>
                        </div>

                        {prop.previousData && prop.type === 'edit' && (
                          <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-stone-500">
                            <div className="text-[10px] font-extrabold uppercase text-stone-400 mb-1">
                              Previous Active Values
                            </div>
                            <div className="line-through font-bold text-stone-600">
                              {prop.previousData.itemDescription}
                            </div>
                            <div className="mt-1 space-y-0.5 text-[11px]">
                              <div>Previous Pack: {prop.previousData.packType} {prop.previousData.packWeight} {prop.previousData.packUnit}</div>
                              <div>Previous Price: {formatCurrency(prop.previousData.packPrice)} ({formatCurrency(prop.previousData.pricePerUnit)}/{prop.previousData.baseUnit})</div>
                              <div>Previous Yield: {formatPercent(prop.previousData.estYieldPercent)}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRejectProposal(prop.id)}
                          className="px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExecuteProposal(prop)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Approve & Execute Change</span>
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : execTab === 'history' ? (
                /* History & Audit Log Tab */
                <div className="space-y-3">
                  {proposals.filter((p) => p.status !== 'pending').length === 0 ? (
                    <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                      No archived proposal history yet.
                    </div>
                  ) : (
                    proposals
                      .filter((p) => p.status !== 'pending')
                      .map((prop) => (
                        <div
                          key={prop.id}
                          className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  prop.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-rose-100 text-rose-900'
                                }`}
                              >
                                {prop.status}
                              </span>
                              <span className="font-extrabold text-stone-900">
                                {prop.itemData.itemDescription}
                              </span>
                              <span className="text-stone-400 text-[11px]">
                                ({prop.type})
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-500 mt-1">
                              Submitted by {prop.submittedByEmail} • Verified by {prop.verifiedBy || EXECUTIVE_EMAIL} at {prop.verifiedAt || prop.submittedAt}
                            </div>
                            {prop.rejectionReason && (
                              <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                                Reason: {prop.rejectionReason}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-stone-800">
                              {formatCurrency(prop.itemData.packPrice)}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              ) : (
                /* Executive Database Tools Tab */
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                    <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-indigo-700" />
                      Executive Database Control Suite
                    </h4>
                    <p className="text-[11px] text-indigo-800/80 mt-1">
                      Direct executive administrative tools to import, export, bulk-edit, and maintain the master ingredient and pricing catalog.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Bulk Excel/CSV Import */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                          Import Excel / CSV
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Bulk import items, pack sizes, yields, and prices from spreadsheets.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExecCenterOpen(false);
                          handleOpenBulkImport();
                        }}
                        className="px-3 py-1.5 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-600 rounded-xl cursor-pointer shrink-0"
                      >
                        Import
                      </button>
                    </div>

                    {/* Quick Price Editor */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-amber-700" />
                          Quick Price Editor
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Rapidly scan and update missing or zero prices ({zeroPriceItemsCount} missing).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExecCenterOpen(false);
                          setIsQuickPriceModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-600 rounded-xl cursor-pointer shrink-0"
                      >
                        Edit Prices
                      </button>
                    </div>

                    {/* Add Single Item */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-stone-700" />
                          Add Ingredient / Item
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Add a single new ingredient or packaging specification directly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExecCenterOpen(false);
                          handleOpenAdd();
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-xl cursor-pointer shrink-0"
                      >
                        Add Item
                      </button>
                    </div>

                    {/* SA Retail Units Guide */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <PackageCheck className="w-4 h-4 text-amber-700" />
                          SA Retail Units Guide
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Standard South African retail packaging units reference chart.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExecCenterOpen(false);
                          setIsRetailModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-400 rounded-xl cursor-pointer shrink-0"
                      >
                        Open Guide
                      </button>
                    </div>

                    {/* Export Excel (.xlsx) */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <Download className="w-4 h-4 text-emerald-800" />
                          Export Excel (.xlsx)
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Download full database as formatted Excel spreadsheet with calculated columns.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl cursor-pointer shrink-0"
                      >
                        Export .xlsx
                      </button>
                    </div>

                    {/* Export CSV */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <Download className="w-4 h-4 text-stone-700" />
                          Export CSV
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Download standard raw CSV format for backups or external tools.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl cursor-pointer shrink-0"
                      >
                        Export .csv
                      </button>
                    </div>

                    {/* Clean Expired Promo Dates */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-700" />
                          Clean Expired Promo Dates
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Scan and clear past promotion end dates from the database.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCleanExpiredDates}
                        className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl cursor-pointer shrink-0"
                      >
                        Clean Dates
                      </button>
                    </div>

                    {/* Remove Zero/No-Price Items */}
                    {zeroPriceItemsCount > 0 && (
                      <div className="p-3.5 bg-white border border-rose-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4 text-rose-700" />
                            Remove No-Price Items ({zeroPriceItemsCount})
                          </div>
                          <p className="text-[11px] text-stone-500 mt-1">
                            Purge items that have no price specified.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveZeroPriceItems}
                          className="px-3 py-1.5 text-xs font-black text-rose-950 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl cursor-pointer shrink-0"
                        >
                          Purge
                        </button>
                      </div>
                    )}

                    {/* Purge Non-CSV Items */}
                    {orderList.some((item) => !item.isFromCsv && !item.id.startsWith('ord-csv-')) && (
                      <div className="p-3.5 bg-white border border-rose-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4 text-rose-700" />
                            Purge Non-CSV Items
                          </div>
                          <p className="text-[11px] text-stone-500 mt-1">
                            Remove starter placeholder items that were not imported from CSV.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handlePurgeNonCsvItems}
                          className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl cursor-pointer shrink-0"
                        >
                          Purge
                        </button>
                      </div>
                    )}

                    {/* Reset Starter Dataset */}
                    <div className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-stone-700" />
                          Reset Starter Dataset
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Restore original default supplier catalog items.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetData}
                        className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl cursor-pointer shrink-0"
                      >
                        Reset Data
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200 shrink-0 text-xs">
              <span className="text-stone-500 font-medium">
                Verified Executive: <strong>{EXECUTIVE_EMAIL}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsExecCenterOpen(false)}
                className="px-4 py-2 font-bold text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* South African Retail Pack & Count Units Modal */}
      <RetailPackUnitsModal
        isOpen={isRetailModalOpen}
        onClose={() => setIsRetailModalOpen(false)}
        onSelectUnit={handleSelectRetailUnitInOrderList}
      />

      {/* Bulk CSV Import Modal */}
      <BulkCsvImportModal
        isOpen={isBulkCsvModalOpen}
        onClose={() => setIsBulkCsvModalOpen(false)}
        currentOrderList={orderList}
        isExecutive={isExecutive}
        userEmail={userEmail || 'Active User'}
        onImportItems={handleImportCsvItems}
      />

      {/* Quick Price Update Modal */}
      <QuickPriceUpdateModal
        isOpen={isQuickPriceModalOpen}
        onClose={() => setIsQuickPriceModalOpen(false)}
        orderList={orderList}
        onSavePrices={handleSaveQuickPrices}
        onRemoveUnpriced={handleRemoveZeroPriceItems}
      />

      {/* Floating Bottom-Right Recipe Basket Widget */}
      {basket.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5">
          <button
            type="button"
            onClick={() => setIsBasketModalOpen(true)}
            className="flex items-center gap-3 px-4 py-3 bg-stone-900 text-white rounded-2xl shadow-2xl border border-stone-700 hover:bg-stone-800 transition-all cursor-pointer group hover:scale-[1.02]"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
              <Heart className="w-5 h-5 fill-white stroke-white animate-pulse" />
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-bold text-stone-300">Recipe Basket</div>
              <div className="text-sm font-black text-amber-400">
                {formatCurrency(totalBasketCost)}{' '}
                <span className="text-[11px] font-normal text-stone-400">
                  ({basket.length} {basket.length === 1 ? 'item' : 'items'} • {totalBasketPacks} pk)
                </span>
              </div>
            </div>
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-colors">
              View Basket →
            </span>
          </button>
        </div>
      )}

      {/* Recipe Shopping Basket Modal */}
      <RecipeBasketModal
        isOpen={isBasketModalOpen}
        onClose={() => setIsBasketModalOpen(false)}
        basket={basket}
        onUpdateQuantity={handleUpdateBasketQuantity}
        onRemoveItem={handleRemoveBasketItem}
        onClearBasket={handleClearBasket}
        onNavigateToDishBuilder={onNavigateToDishBuilder}
      />
    </div>
  );
};
