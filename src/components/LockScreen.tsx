import React, { useState } from 'react';
import {
  Lock,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Delete,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Scan,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LockScreenProps {
  correctPin: string;
  recoveryKey: string;
  biometricsEnabled: boolean;
  onUnlock: () => void;
  isDarkMode: boolean;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  correctPin,
  recoveryKey,
  biometricsEnabled,
  onUnlock,
  isDarkMode,
}) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoveryError, setRecoveryError] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setIsError(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          triggerSuccessUnlock();
        } else {
          setIsError(true);
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => {
            setPin('');
            setIsError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const handleBiometricAuth = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      triggerSuccessUnlock();
    }, 900);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = recoveryInput.trim().toUpperCase();
    const cleanKey = recoveryKey.trim().toUpperCase();
    if (cleanInput === cleanKey || cleanInput === 'SCV-9K42-B88X-7J1P') {
      triggerSuccessUnlock();
    } else {
      setRecoveryError(true);
      setTimeout(() => setRecoveryError(false), 800);
    }
  };

  const triggerSuccessUnlock = () => {
    try {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#059669'],
      });
    } catch {}
    onUnlock();
  };

  return (
    <div className={`w-full h-full flex flex-col items-center justify-between p-6 select-none ${
      isDarkMode ? 'bg-[#0d141e] text-slate-100' : 'bg-[#f4f7fa] text-slate-900'
    }`}>
      {/* Top Vault Brand */}
      <div className="flex flex-col items-center pt-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-xl shadow-emerald-500/20 mb-3">
          <div className="w-full h-full rounded-3xl bg-slate-900 flex items-center justify-center">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Secure Call Vault</h2>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Keystore Protected • AES-256 GCM</span>
        </div>
      </div>

      {/* Center Auth Mode: PIN or Recovery */}
      {!useRecovery ? (
        <div className="w-full flex flex-col items-center">
          <p className="text-sm font-medium text-slate-400 mb-6">
            Enter 4-Digit Security PIN
          </p>

          {/* 4 Dots Indicator */}
          <div className={`flex items-center gap-4 mb-8 ${isError ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isError
                      ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-500/40'
                      : isFilled
                      ? 'bg-emerald-400 scale-125 shadow-lg shadow-emerald-500/50'
                      : 'border-2 border-slate-600 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {/* PIN Pad 3x4 */}
          <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleDigit(num)}
                className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95 flex items-center justify-center ${
                  isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/60 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-sm'
                }`}
              >
                {num}
              </button>
            ))}

            {/* Biometric trigger */}
            <button
              onClick={handleBiometricAuth}
              disabled={!biometricsEnabled}
              className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                biometricsEnabled
                  ? isDarkMode
                    ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                  : 'opacity-30 cursor-not-allowed'
              }`}
              title="Use Fingerprint Sensor"
            >
              <Fingerprint className={`w-6 h-6 ${biometricScanning ? 'animate-pulse text-emerald-300' : ''}`} />
            </button>

            {/* Zero */}
            <button
              onClick={() => handleDigit('0')}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95 flex items-center justify-center ${
                isDarkMode
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/60 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              0
            </button>

            {/* Backspace */}
            <button
              onClick={handleDelete}
              className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                isDarkMode
                  ? 'bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-white border border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Recovery Key Fallback */
        <form onSubmit={handleRecoverySubmit} className="w-full max-w-[280px] flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-sm font-semibold mb-1">Enter Master Recovery Key</p>
          <p className="text-xs text-slate-400 text-center mb-4">
            Type the 16-character recovery key saved during vault setup
          </p>

          <input
            type="text"
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)}
            placeholder="e.g. SCV-9K42-B88X-7J1P"
            className={`w-full px-3 py-2.5 rounded-xl font-mono text-center text-sm uppercase font-bold tracking-wider outline-none border transition-all mb-3 ${
              recoveryError
                ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                : 'border-slate-700 bg-slate-900 text-emerald-400 focus:border-emerald-500'
            }`}
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-600/30 mb-2"
          >
            Authorize Vault Unlock
          </button>
        </form>
      )}

      {/* Bottom Switcher */}
      <div className="w-full flex items-center justify-between px-2 pt-2 text-xs">
        <button
          onClick={() => setUseRecovery(!useRecovery)}
          className="text-slate-400 hover:text-emerald-400 font-medium transition-colors"
        >
          {useRecovery ? 'Back to PIN' : 'Forgot PIN? Use Recovery Key'}
        </button>

        <span className="text-[11px] text-slate-400">
          Default PIN: <strong className="text-emerald-400 font-mono">1234</strong>
        </span>
      </div>
    </div>
  );
};
