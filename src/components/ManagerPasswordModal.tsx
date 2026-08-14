import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldAlert, KeyRound, Check } from 'lucide-react';

interface ManagerPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_MANAGER_PASSWORD = 'password123';
const PASSWORD_STORAGE_KEY = 'food_costing_manager_password_hash';

export const ManagerPasswordModal: React.FC<ManagerPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Optional password change mode for manager
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [confirmPwdInput, setConfirmPwdInput] = useState('');
  const [changeSuccessMessage, setChangeSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getStoredPassword = (): string => {
    try {
      const stored = localStorage.getItem(PASSWORD_STORAGE_KEY);
      if (stored) return stored;
    } catch (e) {
      console.error('Failed to get manager password', e);
    }
    return DEFAULT_MANAGER_PASSWORD;
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const actualPassword = getStoredPassword();

    if (passwordInput === actualPassword) {
      setPasswordInput('');
      setErrorMessage(null);
      onSuccess();
      onClose();
    } else {
      setErrorMessage('Incorrect manager password. Please try again.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setChangeSuccessMessage(null);

    const actualPassword = getStoredPassword();
    if (currentPwdInput !== actualPassword) {
      setErrorMessage('Current password is incorrect.');
      return;
    }

    if (!newPwdInput || newPwdInput.length < 4) {
      setErrorMessage('New password must be at least 4 characters long.');
      return;
    }

    if (newPwdInput !== confirmPwdInput) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    try {
      localStorage.setItem(PASSWORD_STORAGE_KEY, newPwdInput);
      setChangeSuccessMessage('Password updated successfully!');
      setCurrentPwdInput('');
      setNewPwdInput('');
      setConfirmPwdInput('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setChangeSuccessMessage(null);
      }, 1500);
    } catch (e) {
      setErrorMessage('Failed to save new password.');
    }
  };

  const handleModalClose = () => {
    setPasswordInput('');
    setErrorMessage(null);
    setIsChangingPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">
                {isChangingPassword ? 'Update Manager Password' : 'App Manager Authentication'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {isChangingPassword
                  ? 'Set a custom secret password for manager access'
                  : 'Enter password to access protected manager controls'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-semibold animate-in shake duration-200">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {changeSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{changeSuccessMessage}</span>
          </div>
        )}

        {!isChangingPassword ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-stone-800 mb-1.5">
                Manager Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter manager password..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 font-semibold text-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(true);
                  setErrorMessage(null);
                }}
                className="text-stone-500 hover:text-stone-800 font-bold flex items-center gap-1 cursor-pointer underline underline-offset-2"
              >
                <KeyRound className="w-3 h-3 text-stone-400" />
                <span>Change Password</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-black text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Manager Mode</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-black text-stone-800 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={currentPwdInput}
                onChange={(e) => setCurrentPwdInput(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-amber-500 focus:outline-none font-semibold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-black text-stone-800 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter new password"
                value={newPwdInput}
                onChange={(e) => setNewPwdInput(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-amber-500 focus:outline-none font-semibold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-black text-stone-800 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPwdInput}
                onChange={(e) => setConfirmPwdInput(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:border-amber-500 focus:outline-none font-semibold text-stone-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 font-black text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save New Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
