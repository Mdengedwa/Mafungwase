import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Users,
  MapPin,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronDown,
  UserCheck,
  BadgeDollarSign,
  ChefHat,
  Share2,
} from 'lucide-react';
import { ChefBookingInquiry } from '../data/defaultPresetSuggestions';

interface ManagerInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiries: ChefBookingInquiry[];
  onUpdateInquiryStatus: (id: string, newStatus: 'Pending' | 'Contacted' | 'Booked' | 'Declined') => void;
  onDeleteInquiry: (id: string) => void;
  onClearAllInquiries?: () => void;
}

export const ManagerInquiryModal: React.FC<ManagerInquiryModalProps> = ({
  isOpen,
  onClose,
  inquiries,
  onUpdateInquiryStatus,
  onDeleteInquiry,
  onClearAllInquiries,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus = filterStatus === 'All' || inq.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      inq.clientName.toLowerCase().includes(query) ||
      inq.dishTitle.toLowerCase().includes(query) ||
      inq.preparedBy.toLowerCase().includes(query) ||
      (inq.clientContact && inq.clientContact.includes(query)) ||
      (inq.eventType && inq.eventType.toLowerCase().includes(query)) ||
      (inq.location && inq.location.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Booked':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Contacted':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Declined':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  const formatCleanPhone = (phoneStr: string) => {
    return phoneStr.replace(/[^\d+]/g, '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-4xl w-full border-2 border-black shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900">
                  App Manager • Booking Inquiries Inbox
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Manager Mode
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Full unmasked contact numbers and event booking coordination
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-stone-100 rounded-xl">
            {['All', 'Pending', 'Contacted', 'Booked', 'Declined'].map((st) => {
              const count =
                st === 'All'
                  ? inquiries.length
                  : inquiries.filter((i) => i.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === st
                      ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search client, chef, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-medium text-stone-900"
            />
          </div>
        </div>

        {/* Inquiry List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredInquiries.length === 0 ? (
            <div className="py-12 text-center text-stone-400 border border-dashed border-stone-200 rounded-2xl bg-stone-50">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-bold text-stone-600">No booking inquiries found</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Client inquiries sent via "Hire Cook for Event" will appear here with complete contact numbers.
              </p>
            </div>
          ) : (
            filteredInquiries.map((inq) => {
              const isExpanded = selectedInquiryId === inq.id;
              return (
                <div
                  key={inq.id}
                  className={`p-4 rounded-2xl border transition-all text-xs ${
                    inq.status === 'Pending'
                      ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                      : 'bg-white border-stone-300 shadow-2xs'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-stone-900 text-sm">
                          {inq.clientName}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${getStatusBadgeClass(
                            inq.status
                          )}`}
                        >
                          {inq.status}
                        </span>
                        <span className="text-[10px] text-stone-400 font-semibold">
                          {new Date(inq.createdAt).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] font-extrabold text-emerald-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>Dish: <strong>{inq.dishTitle}</strong></span>
                        <span>•</span>
                        <span>Chef: <strong>{inq.preparedBy}</strong></span>
                        {inq.dayRate && <span>({inq.dayRate})</span>}
                      </div>
                    </div>

                    {/* Status Select & Quick Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={inq.status}
                        onChange={(e) =>
                          onUpdateInquiryStatus(
                            inq.id,
                            e.target.value as 'Pending' | 'Contacted' | 'Booked' | 'Declined'
                          )
                        }
                        className="px-2.5 py-1 text-[11px] font-bold border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value="Pending">⏳ Pending</option>
                        <option value="Contacted">📞 Contacted</option>
                        <option value="Booked">✓ Booked</option>
                        <option value="Declined">✕ Declined</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onDeleteInquiry(inq.id)}
                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Event Details Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px]">
                    <div>
                      <span className="text-stone-400 block text-[9px] font-bold uppercase">Event Type</span>
                      <span className="font-bold text-stone-800">{inq.eventType}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[9px] font-bold uppercase">Event Date</span>
                      <span className="font-bold text-stone-800">{inq.eventDate || 'TBD'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[9px] font-bold uppercase">Guests</span>
                      <span className="font-bold text-stone-800">{inq.guestCount}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[9px] font-bold uppercase">Location</span>
                      <span className="font-bold text-stone-800">{inq.location || 'Not specified'}</span>
                    </div>
                  </div>

                  {/* Client Message */}
                  <div className="p-2.5 bg-stone-100/70 rounded-xl text-stone-800 font-medium leading-relaxed my-2 text-[11px]">
                    <strong className="text-stone-900 block mb-0.5 text-[10px] uppercase font-bold text-stone-500">
                      Client Message:
                    </strong>
                    "{inq.message}"
                  </div>

                  {/* Direct Contact Action Bar (Manager Only) */}
                  <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Client Direct Contacts */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-extrabold text-stone-700">Client Contact:</span>
                      <a
                        href={`tel:${formatCleanPhone(inq.clientContact)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-colors shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call {inq.clientContact}</span>
                      </a>
                      <a
                        href={`https://wa.me/${formatCleanPhone(inq.clientContact)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366] text-white font-bold rounded-lg hover:bg-[#1EBE5D] transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                      {inq.clientEmail && (
                        <a
                          href={`mailto:${inq.clientEmail}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-stone-200 text-stone-800 font-semibold rounded-lg hover:bg-stone-300 transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{inq.clientEmail}</span>
                        </a>
                      )}
                    </div>

                    {/* Cook Direct Contacts */}
                    {inq.chefContact && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-extrabold text-stone-600">Cook Contact:</span>
                        <a
                          href={`tel:${formatCleanPhone(inq.chefContact)}`}
                          className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{inq.chefContact}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-200 shrink-0 text-xs">
          <div className="text-stone-500 font-semibold text-[11px]">
            Total Inquiries: <strong className="text-stone-900">{inquiries.length}</strong> • Pending Action:{' '}
            <strong className="text-amber-700">
              {inquiries.filter((i) => i.status === 'Pending').length}
            </strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 font-extrabold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
          >
            Close Inbox
          </button>
        </div>
      </div>
    </div>
  );
};
