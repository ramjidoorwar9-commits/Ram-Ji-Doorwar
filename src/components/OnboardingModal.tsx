import React, { useState } from 'react';
import {
  Shield,
  Lock,
  FolderOpen,
  PhoneCall,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  KeyRound,
  FileAudio,
  HardDrive,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  onComplete: () => void;
  isDarkMode: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, isDarkMode }) => {
  const [step, setStep] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState({
    telephony: true,
    notifications: true,
    safFolder: true,
  });

  const steps = [
    {
      title: 'Welcome to Secure Call Vault',
      subtitle: 'The gold standard in Android call recording privacy',
      icon: <Shield className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Secure Call Vault is an engineered vault designed to protect your sensitive conversational recordings
            with military-grade AES-256 encryption.
          </p>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero-Cloud, Pure On-Device Storage</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Your audio recordings never leave this device. All processing occurs locally within the hardware security enclave.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Hardware Keystore Security',
      subtitle: 'Hardware-backed protection',
      icon: <Cpu className="w-12 h-12 text-teal-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Unlike regular file lockers that hide files behind a password, Secure Call Vault binds its cryptographic master key directly to the <strong>Android KeyStore</strong> hardware module.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">TEE / StrongBox</span>
              Keys cannot be extracted even with root privilege.
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-teal-400 block mb-1">Biometric Unlock</span>
              Cryptographic keys unlock only on valid fingerprint or PIN.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'How Encryption Works',
      subtitle: 'AES-256-GCM + Unique 12-Byte IVs',
      icon: <Lock className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">1</div>
            <div>
              <p className="font-semibold text-white">Detection & Import</p>
              <p className="text-[11px] text-slate-400">SAF Folder receives audio from phone dialer.</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">2</div>
            <div>
              <p className="font-semibold text-white">Streaming Encryption</p>
              <p className="text-[11px] text-slate-400">Audio stream is encrypted on-the-fly with AES-256-GCM.</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">3</div>
            <div>
              <p className="font-semibold text-white">Zero Plain Files</p>
              <p className="text-[11px] text-slate-400">Stored exclusively inside app-private internal directory.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Storage Access Framework (SAF)',
      subtitle: 'Google Play compliant folder selection',
      icon: <FolderOpen className="w-12 h-12 text-sky-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Modern Android (Android 11 through 15+) restricts broad storage access. Secure Call Vault strictly follows Android design guidelines:
          </p>
          <div className="p-3 rounded-2xl bg-sky-950/30 border border-sky-800/40 text-[11px] space-y-1.5">
            <p className="font-semibold text-sky-300">You choose the directory to monitor:</p>
            <p className="text-slate-400">
              e.g., <code className="text-emerald-400">/Recordings/Call</code> or <code className="text-emerald-400">/Music/Recordings</code>.
            </p>
            <p className="text-slate-400">
              The app retains persistable URI permissions and automatically monitors this folder in the background.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Privacy & Anti-Leak Shield',
      subtitle: 'Engineered against espionage & accidental leaks',
      icon: <EyeOff className="w-12 h-12 text-indigo-400" />,
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-bold text-white block">FLAG_SECURE Active</span>
              <span className="text-[11px] text-slate-400">Prevents screenshots and hides app in Recent Apps preview.</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-bold text-white block">Cryptographic Deduplication</span>
              <span className="text-[11px] text-slate-400">SHA-256 fingerprinting prevents duplicate imports.</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-bold text-white block">Secure Shredding</span>
              <span className="text-[11px] text-slate-400">Overwrites memory buffers and files with zeroes upon deletion.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Android Permissions',
      subtitle: 'Authorize core background services',
      icon: <HardDrive className="w-12 h-12 text-teal-400" />,
      content: (
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Call State Event Listener</span>
              <span className="text-[11px] text-slate-400">Detects call-end to trigger delayed background scan.</span>
            </div>
            <input
              type="checkbox"
              checked={permissionsGranted.telephony}
              onChange={(e) => setPermissionsGranted({ ...permissionsGranted, telephony: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Import Notifications</span>
              <span className="text-[11px] text-slate-400">Alerts you only after an encrypted import completes.</span>
            </div>
            <input
              type="checkbox"
              checked={permissionsGranted.notifications}
              onChange={(e) => setPermissionsGranted({ ...permissionsGranted, notifications: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">SAF Folder Granted</span>
              <span className="text-[11px] text-slate-400">Monitors /Recordings/Call with permanent URI.</span>
            </div>
            <input
              type="checkbox"
              checked={permissionsGranted.safFolder}
              onChange={(e) => setPermissionsGranted({ ...permissionsGranted, safFolder: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Vault Armed & Ready',
      subtitle: 'Your default PIN is 1234',
      icon: <Sparkles className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300 text-center">
          <p>
            Setup complete! Your vault has pre-loaded initial encrypted call recordings, sample contacts, and background scan workers.
          </p>
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
            <span className="text-xs font-semibold text-emerald-300 block mb-1">Master Recovery Key</span>
            <code className="text-sm font-mono font-bold text-emerald-400 tracking-wider">
              SCV-9K42-B88X-7J1P
            </code>
            <p className="text-[10px] text-slate-400 mt-1">Keep this key safe in case you ever forget your PIN.</p>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className={`w-full h-full flex flex-col justify-between p-6 select-none ${
      isDarkMode ? 'bg-[#0d141e] text-slate-100' : 'bg-[#f4f7fa] text-slate-900'
    }`}>
      {/* Header with Step Dots */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>
        <button
          onClick={onComplete}
          className="text-xs font-semibold text-slate-400 hover:text-white"
        >
          Skip
        </button>
      </div>

      {/* Center Body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-4 max-w-sm mx-auto w-full">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-4 animate-in zoom-in-95 duration-300">
          {current.icon}
        </div>
        <h2 className="text-lg font-bold tracking-tight mb-1">{current.title}</h2>
        <p className="text-xs text-slate-400 mb-5">{current.subtitle}</p>

        <div className="w-full text-left">{current.content}</div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-3">
        {step > 0 ? (
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleNext}
          className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all ml-auto"
        >
          <span>{step === steps.length - 1 ? 'Enter Vault' : 'Next'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
