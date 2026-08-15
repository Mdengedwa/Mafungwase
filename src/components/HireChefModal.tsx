import React, { useState } from 'react';
import {
  X,
  Send,
  Calendar,
  Users,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChefHat,
  BadgeDollarSign,
} from 'lucide-react';
import { PresetSuggestion, ChefBookingInquiry } from '../data/defaultPresetSuggestions';

interface HireChefModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: PresetSuggestion | null;
  onInquirySubmitted: (inquiry: ChefBookingInquiry) => void;
}

export const HireChefModal: React.FC<HireChefModalProps> = ({
  isOpen,
  onClose,
  preset,
  onInquirySubmitted,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState<number | string>('50');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !preset) return null;

  const chefName = preset.preparedBy || 'Recipe Cook / Caterer';
  const dayRate = preset.dayRate || 'Negotiable per event';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !clientName.trim() ||
      !clientContact.trim() ||
      !eventType ||
      !eventDate ||
      !guestCount ||
      !location.trim() ||
      !message.trim()
    ) {
      return;
    }

    const newInquiry: ChefBookingInquiry = {
      id: `inquiry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      presetId: preset.id,
      dishTitle: preset.title,
      preparedBy: chefName,
      chefContact: preset.contactDetails || 'On File with Manager',
      dayRate: preset.dayRate,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      clientEmail: clientEmail.trim() || undefined,
      eventType,
      eventDate: eventDate,
      guestCount: Number(guestCount) || guestCount,
      location: location.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };

    onInquirySubmitted(newInquiry);
    setIsSuccess(true);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setClientName('');
    setClientContact('');
    setClientEmail('');
    setEventType('Wedding');
    setEventDate('');
    setGuestCount('50');
    setLocation('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#0B3B28] text-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border-2 border-emerald-900 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Hire Cook for Your Event
              </h3>
              <p className="text-xs font-semibold text-emerald-200">
                Send a direct catering inquiry to {chefName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-[#06261A] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-400/20 text-amber-300 rounded-full flex items-center justify-center mx-auto border-2 border-amber-400/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-white">
                Inquiry Sent Successfully!
              </h4>
              <p className="text-xs text-emerald-200 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-bold text-white">{clientName}</span>. Your event request for{' '}
                <span className="font-bold text-amber-300">{preset.title}</span> has been forwarded.
              </p>
              <div className="p-3 bg-[#06261A] rounded-2xl border border-emerald-800/80 text-left text-xs text-emerald-200 mt-4 space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  App Manager Booking Coordination
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  Our App Manager will review your contact details and connect you with {chefName} to finalize dates, menus, and logistics.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-6 py-2.5 text-xs font-black text-black bg-[#fbf304] hover:bg-yellow-300 border-2 border-black rounded-xl transition-all shadow-md cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Selected Dish & Chef Summary Banner */}
            <div className="p-3.5 bg-[#06261A] rounded-2xl border border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  Featured Menu / Dish
                </span>
                <h4 className="font-black text-white text-sm">{preset.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-200 font-semibold">
                  <span>Prepared by: <strong className="text-white">{chefName}</strong></span>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 bg-[#0B3B28] px-3 py-1.5 rounded-xl border border-emerald-700/80">
                <span className="text-[9px] font-bold text-emerald-300 block">Day Rate</span>
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <BadgeDollarSign className="w-3.5 h-3.5 text-amber-400" />
                  {dayRate}
                </span>
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nomsa Khumalo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white placeholder:text-emerald-400/50"
                />
              </div>

              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Your Contact Number / WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 082 123 4567"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    className="w-full p-2.5 pl-8 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white placeholder:text-emerald-400/50"
                  />
                  <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-3.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. nomsa@gmail.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 pl-8 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-medium text-white placeholder:text-emerald-400/50"
                  />
                  <Mail className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Event Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white cursor-pointer"
                >
                  <option value="Wedding" className="bg-[#06261A] text-white">Wedding Reception</option>
                  <option value="Birthday Party" className="bg-[#06261A] text-white">Birthday Celebration</option>
                  <option value="Traditional Ceremony (Umemulo / Lobola / Imbizo)" className="bg-[#06261A] text-white">Traditional Ceremony (Umemulo / Lobola)</option>
                  <option value="Private Dinner / Family Gathering" className="bg-[#06261A] text-white">Private Dinner / Family Gathering</option>
                  <option value="Corporate Event / Luncheon" className="bg-[#06261A] text-white">Corporate Event / Luncheon</option>
                  <option value="Weekend Cookout / Braai" className="bg-[#06261A] text-white">Weekend Cookout / Braai</option>
                  <option value="Funeral / Memorial Gathering" className="bg-[#06261A] text-white">Funeral / Memorial Gathering</option>
                  <option value="Other" className="bg-[#06261A] text-white">Other Special Occasion</option>
                </select>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Event Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 pl-8 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white"
                  />
                  <Calendar className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Est. Guests *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full p-2.5 pl-8 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-semibold text-white placeholder:text-emerald-400/50"
                  />
                  <Users className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-emerald-100 mb-1">
                  Location / Area *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Durban North"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 pl-8 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-medium text-white placeholder:text-emerald-400/50"
                  />
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Message / Inquiry Details */}
            <div>
              <label className="block font-extrabold text-emerald-100 mb-1">
                Message & Catering Requirements for {chefName} *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Hi! We love your recipe and would like to hire you for our upcoming wedding. We will need food prepared for approximately 80 guests on Saturday afternoon..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 bg-[#06261A] border border-emerald-800/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-medium text-white placeholder:text-emerald-400/50"
              />
            </div>

            {/* Privacy Note */}
            <div className="p-3 bg-[#06261A] rounded-2xl border border-emerald-800/80 flex items-start gap-2 text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <strong className="text-white">Privacy Guaranteed:</strong> Contact numbers are strictly confidential and routed to the <strong className="text-amber-300">App Manager</strong> to protect chefs and clients from unsolicited calls.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-emerald-900/80">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 font-bold text-emerald-200 hover:text-white hover:bg-[#06261A] rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 font-black text-black bg-[#fbf304] hover:bg-yellow-300 border-2 border-black rounded-xl shadow-md cursor-pointer transition-all transform active:scale-98 text-xs"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Send Inquiry to Cook</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
