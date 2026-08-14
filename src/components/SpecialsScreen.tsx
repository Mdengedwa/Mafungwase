import React, { useState } from 'react';
import { StoreSpecial, OrderItem } from '../types';
import {
  Upload,
  MapPin,
  Calendar,
  Clock,
  Search,
  X,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Filter,
  Megaphone,
  Plus,
} from 'lucide-react';

interface SpecialsScreenProps {
  specials: StoreSpecial[];
  setSpecials: React.Dispatch<React.SetStateAction<StoreSpecial[]>>;
  orderList: OrderItem[];
  setOrderList: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  logoUrl: string;
}

export const SpecialsScreen: React.FC<SpecialsScreenProps> = ({
  specials,
  setSpecials,
}) => {
  // Filters & Search
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'active' | 'expired'>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modal States
  const [viewingFlyerSpecial, setViewingFlyerSpecial] = useState<StoreSpecial | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [deletingSpecialId, setDeletingSpecialId] = useState<string | null>(null);

  // Upload Form State
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    type: 'image' | 'pdf';
    name: string;
    size: string;
  } | null>(null);
  const [formStoreName, setFormStoreName] = useState<string>('Chester Butcheries');
  const [formCatalogueTitle, setFormCatalogueTitle] = useState<string>('Promotional Flyer');
  const [formLocation, setFormLocation] = useState<string>('All Chester Butcheries Stores');
  const [formExpiryDate, setFormExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [formContactNumber, setFormContactNumber] = useState<string>('(+27) 60 362 8760');

  // Extract all unique locations for the location filter
  const availableLocations: string[] = Array.from(
    new Set(
      specials
        .map((s) => s.location?.trim())
        .filter((loc): loc is string => Boolean(loc && loc.length > 0))
    )
  );

  // Expiry check helper
  const isExpired = (expiryDateStr?: string): boolean => {
    if (!expiryDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);
    return exp < today;
  };

  // Format date nicely
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'No Date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered Specials
  const filteredSpecials = specials.filter((special) => {
    // 1. Location filter
    if (
      selectedLocation !== 'all' &&
      (!special.location || !special.location.toLowerCase().includes(selectedLocation.toLowerCase()))
    ) {
      return false;
    }

    // 2. Expiry status filter
    const expired = isExpired(special.validUntil);
    if (expiryFilter === 'active' && expired) return false;
    if (expiryFilter === 'expired' && !expired) return false;

    // 3. Search Query (Location, Store Name, Catalogue Title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const locMatch = special.location?.toLowerCase().includes(q);
      const storeMatch = special.storeName?.toLowerCase().includes(q);
      const titleMatch = special.catalogueTitle?.toLowerCase().includes(q);
      if (!locMatch && !storeMatch && !titleMatch) return false;
    }

    return true;
  });

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFile({
        url: event.target?.result as string,
        type: fileType,
        name: file.name,
        size: sizeMb,
      });
      showToast(`Selected flyer file "${file.name}"`);
    };
    reader.readAsDataURL(file);
  };

  // Save Uploaded Special
  const handleSaveSpecial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      alert('Please upload a flyer file (image or PDF) first.');
      return;
    }

    const newSpecial: StoreSpecial = {
      id: `special-${Date.now()}`,
      storeName: formStoreName.trim() || 'Store Special',
      catalogueTitle: formCatalogueTitle.trim() || 'Promotional Flyer',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: formExpiryDate,
      location: formLocation.trim() || 'All Branches',
      contactNumber: formContactNumber.trim() || undefined,
      fileUrl: uploadedFile.url,
      fileType: uploadedFile.type,
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      status: 'approved',
      uploadedBy: 'Store Manager',
      dateUploaded: new Date().toISOString().split('T')[0],
      items: [],
    };

    setSpecials((prev) => [newSpecial, ...prev]);
    setIsUploadModalOpen(false);
    setUploadedFile(null);
    showToast('Published new promotional flyer successfully!');
  };

  // Handle Delete Special
  const handleDeleteSpecial = (id: string) => {
    setSpecials((prev) => prev.filter((s) => s.id !== id));
    setDeletingSpecialId(null);
    showToast('Flyer removed successfully.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900 text-amber-400 border border-amber-500/30 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-stone-100">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 rounded-3xl p-6 md:p-8 border-2 border-stone-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Store Promotional Flyers</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Promotional Flyers & Expiry Directory
          </h1>
          <p className="text-stone-400 text-xs md:text-sm max-w-2xl">
            Browse original promotional flyer documents, filter by store location, and track promotional expiry dates.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Flyer</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, store name or flyer title..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Location Selector Dropdown */}
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-stone-600 shrink-0">Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Locations ({specials.length})</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiry Filter Pills */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setExpiryFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  expiryFilter === 'active'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setExpiryFilter('expired')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  expiryFilter === 'expired'
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Expired
              </button>
              <button
                onClick={() => setExpiryFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  expiryFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Location Quick Selection Chips */}
        {availableLocations.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100 pb-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick Locations:
            </span>
            <button
              onClick={() => setSelectedLocation('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                selectedLocation === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Locations
            </button>
            {availableLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  selectedLocation === loc
                    ? 'bg-amber-400 text-stone-950'
                    : 'bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-900'
                }`}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{loc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Flyer Cards Grid */}
      {filteredSpecials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200 space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-stone-900">No Promotional Flyers Found</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              There are no promotional flyers matching your current location filter ({selectedLocation}) or expiry status.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setSelectedLocation('all');
                setExpiryFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black cursor-pointer"
            >
              Upload New Flyer
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecials.map((special) => {
            const expired = isExpired(special.validUntil);

            return (
              <div
                key={special.id}
                className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header info */}
                  <div className="p-4 bg-stone-900 text-white flex items-center justify-between gap-2 border-b border-stone-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-amber-400/20 rounded-lg text-amber-400 shrink-0">
                        {special.fileType === 'pdf' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-white truncate">
                          {special.storeName}
                        </h3>
                        <p className="text-[10px] text-stone-400 truncate">
                          {special.catalogueTitle}
                        </p>
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 flex items-center gap-1 ${
                        expired
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{expired ? 'Expired' : 'Active'}</span>
                    </div>
                  </div>

                  {/* Location Banner */}
                  <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-center gap-2 text-stone-800">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {special.location || 'All Stores'}
                    </span>
                  </div>

                  {/* Expiry Date Display Box */}
                  <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="font-semibold text-[11px]">Valid Until:</span>
                    </div>
                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        expired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {formatDate(special.validUntil)}
                    </span>
                  </div>

                  {/* Flyer Document Preview Container */}
                  <div className="p-4 bg-stone-950 flex flex-col items-center justify-center min-h-[280px] relative group overflow-hidden">
                    {special.fileUrl ? (
                      special.fileType === 'pdf' ? (
                        <div className="w-full h-[280px] relative rounded-xl overflow-hidden bg-stone-900 border border-stone-800">
                          <iframe
                            src={special.fileUrl}
                            className="w-full h-full pointer-events-none"
                            title="Flyer Document"
                          />
                        </div>
                      ) : (
                        <img
                          src={special.fileUrl}
                          alt={special.fileName || 'Flyer'}
                          className="max-h-[280px] w-auto object-contain rounded-xl border border-stone-800 transition-transform duration-300 group-hover:scale-105"
                        />
                      )
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <ImageIcon className="w-12 h-12 text-amber-400 mx-auto" />
                        <p className="text-xs font-bold text-white">Original Flyer Attached</p>
                        <p className="text-[10px] text-stone-400">{special.fileName || 'document.pdf'}</p>
                      </div>
                    )}

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                      <button
                        onClick={() => setViewingFlyerSpecial(special)}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Full Flyer</span>
                      </button>

                      {special.fileUrl && (
                        <a
                          href={special.fileUrl}
                          download={special.fileName || 'flyer.jpg'}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Original</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                  <div className="text-[10px] text-stone-500 font-medium">
                    Uploaded: {formatDate(special.dateUploaded)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingFlyerSpecial(special)}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Flyer</span>
                    </button>

                    <button
                      onClick={() => setDeletingSpecialId(special.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete flyer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Screen Original Flyer Viewing Modal */}
      {viewingFlyerSpecial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-stone-900 rounded-3xl border-2 border-stone-700 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-white">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {viewingFlyerSpecial.location || 'All Stores'}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white">
                  {viewingFlyerSpecial.storeName} — {viewingFlyerSpecial.catalogueTitle}
                </h3>
              </div>

              <button
                onClick={() => setViewingFlyerSpecial(null)}
                className="p-2 text-stone-400 hover:text-white bg-stone-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expiry Banner in Modal */}
            <div className="bg-amber-400 text-stone-950 px-4 py-2 flex items-center justify-between font-black text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>EXPIRY DATE: {formatDate(viewingFlyerSpecial.validUntil)}</span>
              </div>
              <span className="uppercase tracking-wider text-[10px] bg-stone-950 text-white px-2 py-0.5 rounded-md">
                {isExpired(viewingFlyerSpecial.validUntil) ? 'EXPIRED' : 'ACTIVE PROMOTION'}
              </span>
            </div>

            {/* Flyer File Main Viewer Container */}
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-stone-950 min-h-[350px]">
              {viewingFlyerSpecial.fileUrl ? (
                viewingFlyerSpecial.fileType === 'pdf' ? (
                  <iframe
                    src={viewingFlyerSpecial.fileUrl}
                    className="w-full h-[600px] rounded-xl border-none"
                    title="Original Flyer PDF"
                  />
                ) : (
                  <img
                    src={viewingFlyerSpecial.fileUrl}
                    alt="Original Promotional Flyer"
                    className="max-h-[70vh] object-contain rounded-xl border border-stone-800 shadow-2xl"
                  />
                )
              ) : (
                <div className="text-center p-12 text-stone-400 space-y-3">
                  <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Original Flyer File</p>
                  <p className="text-xs text-stone-400">{viewingFlyerSpecial.fileName || 'flyer_document.pdf'}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
              <div className="text-xs text-stone-400">
                Contact: <span className="text-white font-bold">{viewingFlyerSpecial.contactNumber || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-3">
                {viewingFlyerSpecial.fileUrl && (
                  <a
                    href={viewingFlyerSpecial.fileUrl}
                    download={viewingFlyerSpecial.fileName || 'flyer.jpg'}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Flyer</span>
                  </a>
                )}
                <button
                  onClick={() => setViewingFlyerSpecial(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Flyer Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border-2 border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900">
                <Upload className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black">Upload Promotional Flyer</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpecial} className="space-y-4">
              {/* File Attachment Dropzone */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-800 uppercase tracking-wider">
                  Flyer Document File (JPG, PNG or PDF) *
                </label>
                <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-4 text-center bg-stone-50 transition-colors">
                  {uploadedFile ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-stone-900">{uploadedFile.name}</p>
                          <p className="text-[10px] text-stone-500">{uploadedFile.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="text-stone-400 hover:text-red-600 text-xs font-bold cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-2 block">
                      <Upload className="w-8 h-8 text-amber-500 mx-auto" />
                      <div className="text-xs font-bold text-stone-800">
                        Click to upload original flyer document
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Supports high-resolution PNG, JPG images or PDF files
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Store Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Store Name</label>
                  <input
                    type="text"
                    value={formStoreName}
                    onChange={(e) => setFormStoreName(e.target.value)}
                    required
                    placeholder="e.g. Chester Butcheries"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Catalogue Title</label>
                  <input
                    type="text"
                    value={formCatalogueTitle}
                    onChange={(e) => setFormCatalogueTitle(e.target.value)}
                    required
                    placeholder="e.g. KASI WEEKEND SPECIALS!"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Location & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Location / Branch *
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    required
                    placeholder="e.g. Umlazi Mega City Branch"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Expiry Date (Valid Until) *
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Contact Number (Optional)</label>
                <input
                  type="text"
                  value={formContactNumber}
                  onChange={(e) => setFormContactNumber(e.target.value)}
                  placeholder="e.g. +27 60 362 8760"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black rounded-xl shadow-xs cursor-pointer"
                >
                  Publish Flyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSpecialId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-stone-200 shadow-2xl space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-stone-900">Remove Flyer?</h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to remove this promotional flyer document from the directory?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingSpecialId(null)}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSpecial(deletingSpecialId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
              >
                Delete Flyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
