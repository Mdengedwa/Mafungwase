import React, { useState } from 'react';
import {
  FileText,
  Users,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { Meal, Quote, QuoteMealItem } from '../types';
import defaultLogoImg from '../assets/images/mafungwaswe_logo_1787055278742.jpg';
import {
  formatCurrency,
  formatPercent,
  recalculateQuote,
} from '../utils/calculations';

interface QuoteScreenProps {
  quote: Quote;
  setQuote: React.Dispatch<React.SetStateAction<Quote>>;
  meals: Meal[];
  logoUrl: string;
}

export const QuoteScreen: React.FC<QuoteScreenProps> = ({
  quote,
  setQuote,
  meals,
  logoUrl,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  // Recalculate helper
  const updateQuote = (updated: Quote) => {
    const recalculated = recalculateQuote(updated, meals);
    setQuote(recalculated);
  };

  // Add meal line to quote
  const handleAddMealToQuote = (mealId: string) => {
    const existing = quote.meals.find((m) => m.mealId === mealId);
    if (existing) return; // already added

    const newMeals: QuoteMealItem[] = [
      ...quote.meals,
      {
        mealId,
        subtotal: 0,
      },
    ];

    updateQuote({ ...quote, meals: newMeals });
  };

  // Update meal headcount override
  const handleMealHeadcountChange = (
    mealId: string,
    headcountOverride?: number
  ) => {
    const updatedMeals = quote.meals.map((m) =>
      m.mealId === mealId ? { ...m, headcountOverride } : m
    );
    updateQuote({ ...quote, meals: updatedMeals });
  };

  // Delete meal from quote
  const handleDeleteMealFromQuote = (mealId: string) => {
    const updatedMeals = quote.meals.filter((m) => m.mealId !== mealId);
    updateQuote({ ...quote, meals: updatedMeals });
  };

  // Copy quote summary text
  const handleCopySummary = () => {
    const summaryText = `
CATERING PRICE QUOTATION
Client/Event: ${quote.clientEventName || 'Valued Client'}
Date: ${quote.dateCreated}

----------------------------------------
EVENT BREAKDOWN:
Total Headcount: ${quote.defaultHeadcount} Guests
Event Food Cost Base: ${formatCurrency(quote.eventFoodCost)}
Markup (%): ${formatPercent(quote.markupPercent)}
----------------------------------------
TOTAL QUOTED PRICE: ${formatCurrency(quote.totalQuotedPrice)}
PRICE PER HEAD: ${formatCurrency(quote.pricePerHead)} / guest
${
  quote.clientBudgetPerHead
    ? `Client Stated Budget: ${formatCurrency(quote.clientBudgetPerHead)} / guest`
    : ''
}
----------------------------------------
Thank you for choosing our catering service!
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Budget comparison indicator
  const budgetDiff = quote.clientBudgetPerHead
    ? quote.clientBudgetPerHead - quote.pricePerHead
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Card 1: Header Banner & Client / Event Setup */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-700" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                Client Event Quotation
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Apply caterer markup, calculate per-head costs, and compare against client budget targets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              {copied ? 'Copied Quote' : 'Copy Text'}
            </button>

            <button
              onClick={() => setShowPrintPreview(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Printable Quote Invoice
            </button>
          </div>
        </div>

        {/* Client / Event Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
              Client / Event Name
            </label>
            <input
              type="text"
              value={quote.clientEventName}
              onChange={(e) => updateQuote({ ...quote, clientEventName: e.target.value })}
              placeholder="e.g. Smith Wedding Reception / Corporate Gala"
              className="w-full px-4 py-2.5 text-sm font-extrabold border-2 border-emerald-300 bg-emerald-50/60 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white text-stone-900"
              title="Client/Event Name"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
              Default Event Headcount (Guests)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={quote.defaultHeadcount}
                onChange={(e) =>
                  updateQuote({
                    ...quote,
                    defaultHeadcount: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2.5 text-sm font-extrabold border-2 border-emerald-300 bg-emerald-50/60 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white text-stone-900"
                title="Default Guest Headcount"
              />
              <Users className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Meals Included in Quote */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border-2 border-black space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            Selected Meals & Guest Allocation
          </h3>

          {/* Select Meal dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddMealToQuote(e.target.value);
                e.target.value = '';
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 rounded-xl focus:outline-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>
              + Add Meal to Quote...
            </option>
            {meals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (Plate Cost: {formatCurrency(m.totalPlateCost)})
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto border border-emerald-100 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50/90 text-emerald-950 font-extrabold border-b border-emerald-100 uppercase tracking-wider">
              <tr>
                <th className="p-3">Meal Name</th>
                <th className="p-3 w-32">Plate Cost</th>
                <th className="p-3 w-36">Headcount (Guests)</th>
                <th className="p-3 w-36 text-right">Subtotal</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 bg-white">
              {quote.meals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400 bg-emerald-50/20">
                    No meals added to quote yet. Select a meal from the dropdown above.
                  </td>
                </tr>
              ) : (
                quote.meals.map((item) => {
                  const mealObj = meals.find((m) => m.id === item.mealId);
                  const mealName = mealObj ? mealObj.name : 'Unknown Meal';
                  const plateCost = mealObj ? mealObj.totalPlateCost : 0;
                  const headcount =
                    item.headcountOverride !== undefined
                      ? item.headcountOverride
                      : quote.defaultHeadcount;

                  return (
                    <tr key={item.mealId} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-3 font-extrabold text-stone-900 text-sm">
                        {mealName}
                      </td>

                      <td className="p-3 font-semibold text-stone-700">
                        {formatCurrency(plateCost)}
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          value={headcount}
                          onChange={(e) =>
                            handleMealHeadcountChange(
                              item.mealId,
                              parseInt(e.target.value) || undefined
                            )
                          }
                          className="w-full p-1.5 text-xs font-bold border-2 border-emerald-300 bg-emerald-50/90 rounded-lg text-center focus:outline-none text-stone-900"
                          title="Override headcount for this meal"
                        />
                      </td>

                      <td className="p-3 text-right font-black text-stone-900 text-sm">
                        {formatCurrency(item.subtotal)}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteMealFromQuote(item.mealId)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 3: Pricing & Financial Calculation Engine */}
      <div className="bg-[#0B3B28] text-white p-6 sm:p-8 rounded-3xl space-y-6 shadow-md border-2 border-black">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-6 border-b border-emerald-800/80">
          {/* Event Food Cost Base */}
          <div>
            <span className="text-xs font-bold text-emerald-200/80 uppercase tracking-wider">
              Event Food Cost (Base Cost)
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatCurrency(quote.eventFoodCost)}
            </div>
            <span className="text-[10px] text-emerald-200/70 mt-1 block">
              Sum of meal subtotals across guests
            </span>
          </div>

          {/* Caterer Markup % */}
          <div>
            <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
              Caterer Markup % (Profit Margin)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="5"
                min="0"
                max="300"
                value={Math.round(quote.markupPercent * 100)}
                onChange={(e) =>
                  updateQuote({
                    ...quote,
                    markupPercent: (parseFloat(e.target.value) || 0) / 100,
                  })
                }
                className="w-28 px-3 py-1.5 text-base font-extrabold bg-[#06261A] text-emerald-200 border border-emerald-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="Flat Markup Percentage"
              />
              <span className="text-sm font-bold text-emerald-300">%</span>
            </div>
            <span className="text-[10px] text-emerald-200/70 mt-1 block">
              Covers staff, overhead & profit
            </span>
          </div>

          {/* Total Quoted Price */}
          <div>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Total Quoted Event Price
            </span>
            <div className="text-3xl font-black text-emerald-300 mt-1">
              {formatCurrency(quote.totalQuotedPrice)}
            </div>
          </div>
        </div>

        {/* Per-Head Breakdown & Client Budget Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Price Per Head */}
          <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider">
              Calculated Price Per Head
            </span>
            <div className="text-2xl font-black text-emerald-200 mt-1">
              {formatCurrency(quote.pricePerHead)}{' '}
              <span className="text-xs font-normal text-emerald-200/70">/ guest</span>
            </div>
            <span className="text-[10px] text-emerald-200/70 mt-1 block">
              Total Quoted Price ÷ Headcount
            </span>
          </div>

          {/* Client Budget Per Head Input */}
          <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs">
            <label className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
              Client Stated Budget (Per Head)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-emerald-200/70">R</span>
              <input
                type="number"
                step="5"
                value={quote.clientBudgetPerHead || ''}
                placeholder="e.g. 150"
                onChange={(e) =>
                  updateQuote({
                    ...quote,
                    clientBudgetPerHead: parseFloat(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-1.5 text-sm font-extrabold bg-[#06261A] text-emerald-200 border border-emerald-700 rounded-lg focus:outline-none"
                title="Client Budget target per head"
              />
            </div>
            <span className="text-[10px] text-emerald-200/70 mt-1 block">
              Optional client target for comparison
            </span>
          </div>

          {/* Side-by-Side Budget Variance Indicator */}
          <div className="p-4 bg-[#072B1D] rounded-2xl border border-emerald-800/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider">
              Budget Variance Status
            </span>

            {quote.clientBudgetPerHead ? (
              budgetDiff !== null && budgetDiff >= 0 ? (
                <div className="mt-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-sm font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Within Client Budget!
                  </div>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    {formatCurrency(budgetDiff)} under target per head.
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <div className="flex items-center gap-1.5 text-rose-300 text-sm font-extrabold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Exceeds Budget
                  </div>
                  <p className="text-[11px] text-rose-200/90 mt-0.5">
                    {formatCurrency(Math.abs(budgetDiff || 0))} over target per head.
                  </p>
                </div>
              )
            ) : (
              <div className="text-xs text-emerald-200/60 mt-2">
                Enter client budget per head to check feasibility.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal / Card overlay */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-6 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <img
                  src={logoUrl || defaultLogoImg}
                  alt="MAFUNGWASWE Logo"
                  className="h-12 w-12 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== defaultLogoImg) {
                      target.src = defaultLogoImg;
                    }
                  }}
                />
                <div>
                  <h3 className="font-extrabold text-stone-900 text-xl">Catering Price Quote</h3>
                  <p className="text-xs text-stone-500">Official Client Proposal</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-stone-400 uppercase">Date</div>
                <div className="text-xs font-semibold text-stone-800">{quote.dateCreated}</div>
              </div>
            </div>

            <div className="py-6 space-y-6 text-sm text-stone-800">
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <div className="text-xs font-bold text-emerald-900/70 uppercase">Client / Event</div>
                <div className="text-base font-extrabold text-stone-900 mt-0.5">
                  {quote.clientEventName || 'Valued Client Event'}
                </div>
                <div className="text-xs text-stone-600 mt-1">
                  Expected Guests: <strong className="text-stone-900">{quote.defaultHeadcount}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-2">
                  Menu & Meal Breakdown
                </h4>
                <div className="border border-emerald-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-emerald-50/80 text-emerald-950 font-bold">
                      <tr>
                        <th className="p-3">Item / Menu</th>
                        <th className="p-3 text-center">Headcount</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {quote.meals.map((item) => {
                        const m = meals.find((x) => x.id === item.mealId);
                        const hc =
                          item.headcountOverride !== undefined
                            ? item.headcountOverride
                            : quote.defaultHeadcount;
                        return (
                          <tr key={item.mealId}>
                            <td className="p-3 font-semibold">{m?.name || 'Meal'}</td>
                            <td className="p-3 text-center">{hc} guests</td>
                            <td className="p-3 text-right font-bold text-stone-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex justify-between items-center text-xs text-stone-600">
                  <span>Base Food & Packaging Cost:</span>
                  <span className="font-bold">{formatCurrency(quote.eventFoodCost)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-stone-600">
                  <span>Service & Catering Markup:</span>
                  <span className="font-bold">{formatPercent(quote.markupPercent)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-base sm:text-lg font-black text-emerald-950">
                  <span>TOTAL QUOTED PRICE:</span>
                  <span className="text-emerald-900">{formatCurrency(quote.totalQuotedPrice)}</span>
                </div>
                <div className="text-right text-xs font-extrabold text-emerald-800">
                  {formatCurrency(quote.pricePerHead)} per guest
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>

              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
