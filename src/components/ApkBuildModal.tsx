import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { downloadAndroidProjectZip } from '../services/androidProjectCode';
import confetti from 'canvas-confetti';

interface ApkBuildModalProps {
  onClose: () => void;
  isDarkMode: boolean;
}

export const ApkBuildModal: React.FC<ApkBuildModalProps> = ({ onClose, isDarkMode }) => {
  const [downloading, setDownloading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      await downloadAndroidProjectZip();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e: any) {
      alert('Error downloading: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyGradleCmd = () => {
    navigator.clipboard.writeText('./gradlew assembleDebug');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        confetti();
      }
      setDeferredPrompt(null);
      setCanInstallPwa(false);
    } else {
      alert(
        'Phone me install krne ke liye:\n1. Apne Android phone me Chrome browser open krein\n2. Top-right me 3 dots (⋮) par tap krein\n3. "Install App" ya "Add to Home screen" par click krein!'
      );
    }
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-xl z-50 flex flex-col justify-end select-none animate-in fade-in duration-200">
      <div
        className={`w-full max-h-[92%] rounded-t-3xl border-t flex flex-col p-5 overflow-y-auto space-y-4 ${
          isDarkMode
            ? 'bg-[#0d141e] border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold">APK Download & Install Guide</h2>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android 15+
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Apne phone me app install krne ke 2 aasan tareeqe:
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method 1: Instant Phone Install (PWA / WebAPK) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Direct Phone Install (Bina PC ke)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              Sabse Aasan ⚡
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Aapko PC ya laptop ki zarurat nahi hai! Apne Android mobile par is app ko directly standalone application ki tarah install kar sakte hain:
          </p>

          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
            <li>Apne phone ke <strong>Google Chrome</strong> me ye page kholein.</li>
            <li>Browser ke top-right me <strong>3 dots (⋮)</strong> menu par tap karein.</li>
            <li>
              <strong>"Install App"</strong> ya <strong>"Add to Home Screen"</strong> par tap karein.
            </li>
            <li>App aapke phone ke app drawer me icon ke saath install ho jayegi!</li>
          </ol>

          <button
            onClick={handlePwaInstall}
            className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install Secure Call Vault on Phone Now</span>
          </button>
        </div>

        {/* Method 2: Native Android Studio APK Build (.apk file) */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Build Native .APK (Kotlin + Gradle)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
              Pure Android Studio
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Agar aapko actual <strong>.apk file</strong> chahiye jise kisi bhi phone par transfer karke install kar sakein:
          </p>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Step 1: Download Complete Project</span>
                <span className="text-[11px] text-slate-400">
                  Neeche diye button se pura Android Studio project ZIP download karein.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Step 2: Open in Android Studio</span>
                <span className="text-[11px] text-slate-400">
                  ZIP extract karke Android Studio me "Open" karein.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Step 3: 1-Click APK Generate</span>
                <span className="text-[11px] text-slate-400">
                  Top menu me <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> par click karein!
                </span>
                <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <code className="text-[10px] font-mono text-emerald-300">./gradlew assembleDebug</code>
                  <button
                    onClick={handleCopyGradleCmd}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Preparing Source Package...' : 'Download Android Studio Project (.ZIP)'}</span>
          </button>
        </div>

        {/* Info footer */}
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Project includes: Hilt DI, Jetpack Compose M3, Room Database, Media3 ExoPlayer & Android Keystore AES-256 GCM.
          </span>
        </div>
      </div>
    </div>
  );
};
