import React, { useState } from 'react';
import { Image, Upload, RotateCcw, X, Check } from 'lucide-react';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string;
  onUpdateLogo: (newLogoUrl: string) => void;
  onResetLogo: () => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onUpdateLogo,
  onResetLogo,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (selectedFilePreview) {
      onUpdateLogo(selectedFilePreview);
    } else if (inputUrl.trim()) {
      onUpdateLogo(inputUrl.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-amber-700" />
            <h3 className="font-semibold text-stone-900 text-lg">Custom Brand Logo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Current Logo Display */}
          <div className="text-center bg-stone-50 p-4 rounded-xl border border-stone-200">
            <p className="text-xs font-medium text-stone-500 mb-3 uppercase tracking-wider">
              Current Logo Preview
            </p>
            <div className="flex justify-center items-center h-24">
              <img
                src={selectedFilePreview || currentLogoUrl}
                alt="Brand Logo"
                className="max-h-20 max-w-full object-contain rounded-lg shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Upload Local Image */}
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">
              Upload New Logo File
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl cursor-pointer bg-stone-50/50 hover:bg-amber-50/30 transition-all text-stone-600">
              <Upload className="w-6 h-6 mb-1.5 text-amber-600" />
              <span className="text-xs font-medium">Click to select image file (PNG, JPG, SVG)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-stone-400 text-xs">OR</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* Image URL Input */}
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">
              Image Web URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setSelectedFilePreview(null);
              }}
              className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={() => {
              onResetLogo();
              setSelectedFilePreview(null);
              setInputUrl('');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
