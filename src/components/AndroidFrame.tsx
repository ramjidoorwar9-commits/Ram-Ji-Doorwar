import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Shield,
  Smartphone,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Lock,
  Code2,
  Sparkles,
  PhoneCall,
  FolderOpen,
} from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isLocked: boolean;
  onLock: () => void;
  onOpenCode: () => void;
  onOpenCallSim: () => void;
  onOpenFolderManager: () => void;
  onOpenApkModal: () => void;
  notificationBanner?: {
    title: string;
    message: string;
    icon?: React.ReactNode;
  } | null;
  onDismissNotification?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isLocked,
  onLock,
  onOpenCode,
  onOpenCallSim,
  onOpenFolderManager,
  onOpenApkModal,
  notificationBanner,
  onDismissNotification,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 transition-colors">
      {/* Top Desktop Controls Toolbar */}
      <header className="w-full max-w-5xl mb-3 flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Secure Call Vault</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                AES-256 GCM
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                SAF Native
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Android 15+ Keystore Protected Audio Vault</p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApkModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Download APK / Install on Phone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install APK</span>
          </button>

          <button
            onClick={onOpenCallSim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            title="Simulate Call-End Trigger & Auto-Import"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Simulate Call</span>
          </button>

          <button
            onClick={onOpenFolderManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-semibold border border-sky-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Manage Storage Access Framework Folders"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>SAF Folders</span>
          </button>

          <button
            onClick={onOpenCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Inspect & Download Kotlin Android Studio Project"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Android Source (.ZIP)</span>
            <span className="sm:hidden">Code</span>
          </button>

          <button
            onClick={onLock}
            disabled={isLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isLocked
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 hover:scale-[1.02]'
            }`}
            title="Lock Vault Now"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Vault</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-300" />}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isFullscreen ? 'Switch to Phone View' : 'Switch to Fullscreen Canvas'}
          >
            {isFullscreen ? <Smartphone className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container: Device Bezel or Fullscreen Mode */}
      <div
        className={`w-full transition-all duration-300 ease-in-out flex justify-center items-center ${
          isFullscreen
            ? 'max-w-5xl h-[88vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden'
            : 'max-w-[430px] h-[870px] rounded-[52px] p-3.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-[0_25px_70px_rgba(0,0,0,0.85)] border-[4px] border-slate-700/70 relative ring-1 ring-white/10'
        }`}
      >
        {/* Physical Device Shell Details (only when not fullscreen) */}
        {!isFullscreen && (
          <>
            {/* Left Volume / Power Button simulation notches */}
            <div className="absolute -left-[6px] top-28 w-[3px] h-12 bg-slate-600 rounded-l-sm" />
            <div className="absolute -left-[6px] top-44 w-[3px] h-12 bg-slate-600 rounded-l-sm" />
            <div className="absolute -right-[6px] top-36 w-[3px] h-16 bg-slate-600 rounded-r-sm" />
          </>
        )}

        {/* Screen Area */}
        <div
          className={`w-full h-full relative overflow-hidden flex flex-col ${
            isFullscreen ? 'rounded-3xl' : 'rounded-[42px]'
          } ${isDarkMode ? 'bg-[#0d141e] text-slate-100' : 'bg-[#f4f7fa] text-slate-900'}`}
        >
          {/* Android Status Bar */}
          <div className="w-full h-11 px-6 flex items-center justify-between text-xs font-semibold z-30 select-none shrink-0">
            {/* Clock */}
            <span className="font-mono text-[13px] tracking-tight">{currentTime || '12:00'}</span>

            {/* Camera Punch Hole */}
            <div className="w-3.5 h-3.5 rounded-full bg-black/90 border border-slate-800 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ring-1 ring-emerald-500/40" />
            </div>

            {/* System Status Icons */}
            <div className="flex items-center gap-2 opacity-90 text-[11px]">
              <span className="text-[10px] font-bold tracking-tighter text-emerald-400">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-medium">88%</span>
                <Battery className="w-4 h-4 fill-emerald-400 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Android Heads-Up Notification Banner */}
          {notificationBanner && (
            <div className="absolute top-12 inset-x-3 z-40 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-slate-900/95 text-slate-100 border border-emerald-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  {notificationBanner.icon || <Shield className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-300 truncate">
                      {notificationBanner.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">now</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                    {notificationBanner.message}
                  </p>
                </div>
                {onDismissNotification && (
                  <button
                    onClick={onDismissNotification}
                    className="text-slate-400 hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Screen Content */}
          <div className="flex-1 overflow-y-auto relative flex flex-col min-h-0">
            {children}
          </div>

          {/* Android Gesture Bar */}
          <div className="w-full h-5 flex items-center justify-center shrink-0 z-30 select-none pb-1">
            <div className="w-32 h-1 rounded-full bg-slate-400/40 hover:bg-slate-400/60 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};
