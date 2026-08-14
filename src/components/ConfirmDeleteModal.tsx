import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  itemCategory?: string;
  description?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemCategory,
  description,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border-2 border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">{title}</h3>
              <p className="text-[11px] text-stone-500 font-medium">Admin Deletion Action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Are you sure you want to permanently delete this entry?</span>
          </div>

          {itemName && (
            <div className="mt-2 p-2.5 bg-white rounded-xl border border-rose-200/80 text-xs font-bold text-stone-900">
              <span className="block text-stone-900 font-black text-sm">{itemName}</span>
              {itemCategory && (
                <span className="inline-block mt-1 text-[10px] uppercase font-extrabold px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                  {itemCategory}
                </span>
              )}
            </div>
          )}

          <p className="text-[11px] text-rose-800/90 font-medium leading-relaxed">
            {description || 'This entry will be removed from the recipe catalog, community hub, and local database.'}
          </p>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span>Delete Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
