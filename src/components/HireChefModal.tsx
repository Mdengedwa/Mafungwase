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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border-2 border-black shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">
                Hire Cook for Your Event
              </h3>
              <p className="text-xs font-semibold text-emerald-800">
                Send a direct catering inquiry to {chefName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-stone-900">
                Inquiry Sent Successfully!
              </h4>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-bold text-stone-900">{clientName}</span>. Your event request for{' '}
                <span className="font-bold text-emerald-800">{preset.title}</span> has been forwarded.
              </p>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs text-emerald-950 mt-4 space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  App Manager Booking Coordination
                </div>
                <p className="text-[11px] text-emerald-800">
                  Our App Manager will review your contact details and connect you with {chefName} to finalize dates, menus, and logistics.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-6 py-2.5 text-xs font-black text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-sm"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Selected Dish & Chef Summary Banner */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-stone-50 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Featured Menu / Dish
                </span>
                <h4 className="font-black text-stone-900 text-sm">{preset.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-600 font-semibold">
                  <span>Prepared by: <strong className="text-emerald-950">{chefName}</strong></span>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-300">
                <span className="text-[9px] font-bold text-stone-500 block">Day Rate</span>
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1">
                  <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  {dayRate}
                </span>
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nomsa Khumalo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Your Contact Number / WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 082 123 4567"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    className="w-full p-2.5 pl-8 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                  />
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. nomsa@gmail.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 pl-8 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-medium text-stone-900"
                  />
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Event Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900 bg-white cursor-pointer"
                >
                  <option value="Wedding">Wedding Reception</option>
                  <option value="Birthday Party">Birthday Celebration</option>
                  <option value="Traditional Ceremony (Umemulo / Lobola / Imbizo)">Traditional Ceremony (Umemulo / Lobola)</option>
                  <option value="Private Dinner / Family Gathering">Private Dinner / Family Gathering</option>
                  <option value="Corporate Event / Luncheon">Corporate Event / Luncheon</option>
                  <option value="Weekend Cookout / Braai">Weekend Cookout / Braai</option>
                  <option value="Funeral / Memorial Gathering">Funeral / Memorial Gathering</option>
                  <option value="Other">Other Special Occasion</option>
                </select>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Event Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 pl-8 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                  />
                  <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
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
                    className="w-full p-2.5 pl-8 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-semibold text-stone-900"
                  />
                  <Users className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-stone-800 mb-1">
                  Location / Area *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Durban North"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 pl-8 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-medium text-stone-900"
                  />
                  <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Message / Inquiry Details */}
            <div>
              <label className="block font-extrabold text-stone-800 mb-1">
                Message & Catering Requirements for {chefName} *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Hi! We love your recipe and would like to hire you for our upcoming wedding. We will need food prepared for approximately 80 guests on Saturday afternoon..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-emerald-700 focus:outline-none font-medium text-stone-900"
              />
            </div>

            {/* Privacy Note */}
            <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200 flex items-start gap-2 text-stone-600">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <strong>Privacy Guaranteed:</strong> Contact numbers are strictly confidential and routed to the <strong>App Manager</strong> to protect chefs and clients from unsolicited calls.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 font-extrabold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md cursor-pointer transition-all transform active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                Send Inquiry to Cook
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
