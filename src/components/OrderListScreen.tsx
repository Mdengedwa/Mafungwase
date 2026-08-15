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
} from 'lucide-react';
import {
  OrderItem,
  PackType,
  PackUnit,
  BaseUnit,
  OrderChangeProposal,
  OrderProposalActionType,
  OrderProposalStatus,
} from '../types';
import {
  formatCurrency,
  formatPercent,
  calculatePricePerUnit,
} from '../utils/calculations';
import { isDateExpiredOrInvalid, cleanupExpiredAndInvalidDates } from '../utils/dateCleanup';
import { RetailPackUnitsModal } from './RetailPackUnitsModal';
import { RetailPackGuideItem } from '../data/retailPackUnits';

const EXECUTIVE_EMAIL = 'biyelamduduzi10@gmail.com';
const PROPOSALS_STORAGE_KEY = 'mafungwase_order_proposals_v1';
const USER_EMAIL_STORAGE_KEY = 'mafungwase_user_email';
const USER_NAME_STORAGE_KEY = 'mafungwase_user_name';

interface OrderListScreenProps {
  orderList: OrderItem[];
  setOrderList: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  onResetOrderList: () => void;
}

export const OrderListScreen: React.FC<OrderListScreenProps> = ({
  orderList,
  setOrderList,
  onResetOrderList,
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
  const [execTab, setExecTab] = useState<'pending' | 'history'>('pending');

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
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<OrderItem | null>(null);

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

  // Helper to require email submission before proceeding
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
        showNotification('Order List has been reset to default starter dataset.');
      } else {
        showNotification(
          'Resetting the database is restricted to the Executive Approver.',
          'warning'
        );
      }
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
            <button
              onClick={() => setIsRetailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-500 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Open South African Retail Pack & Count Units Reference Guide"
            >
              <PackageCheck className="w-4 h-4 text-amber-900" />
              <span>🇿🇦 SA Retail Units Guide</span>
            </button>

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
              <span>{isExecutive ? 'Add Ingredient/Item' : 'Propose New Item'}</span>
            </button>
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
                <th className="p-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-stone-400 bg-stone-50/50">
                    No items found matching search or filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const pendingProposal = pendingByItemId.get(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        pendingProposal
                          ? 'bg-amber-50/60 hover:bg-amber-100/60'
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

                      <td className="p-3 font-semibold text-stone-800">
                        {formatCurrency(item.packPrice)}
                      </td>

                      <td className="p-3">
                        <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                          {formatCurrency(item.pricePerUnit)} / {item.baseUnit}
                        </span>
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
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            title={isExecutive ? 'Edit Item' : 'Propose Edit (Requires Email & Executive Verification)'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isExecutive ? 'Delete Item' : 'Propose Deletion (Requires Email & Executive Verification)'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
              ) : (
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
    </div>
  );
};
