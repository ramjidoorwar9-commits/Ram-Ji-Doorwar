import React from 'react';
import {
  Shield,
  Search,
  RefreshCw,
  Menu,
  Lock,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

interface TopAppBarProps {
  title: string;
  onOpenSearch: () => void;
  onQuickScan: () => void;
  isScanning: boolean;
  onOpenCallSim: () => void;
  onLock: () => void;
  isDarkMode: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  onOpenSearch,
  onQuickScan,
  isScanning,
  onOpenCallSim,
  onLock,
  isDarkMode,
}) => {
  return (
    <header className={`w-full px-4 py-2.5 flex items-center justify-between border-b select-none z-20 shrink-0 ${
      isDarkMode
        ? 'bg-[#0d141e]/90 border-slate-800/80 backdrop-blur-md'
        : 'bg-white/90 border-slate-200/80 backdrop-blur-md'
    }`}>
      {/* Left: Brand Icon + Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight leading-tight">{title}</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-medium">Vault Armed • AES-256</span>
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onQuickScan}
          disabled={isScanning}
          className={`p-2 rounded-xl text-slate-300 hover:text-white transition-all ${
            isScanning ? 'animate-spin text-emerald-400' : 'hover:bg-slate-800/60'
          }`}
          title="Scan Monitored SAF Folders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Search Vault"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenCallSim}
          className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          title="Simulate Phone Call"
        >
          <PhoneCall className="w-4 h-4" />
        </button>

        <button
          onClick={onLock}
          className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Lock Vault"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
