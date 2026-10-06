import React from 'react';
import {
  ShieldCheck,
  HardDrive,
  FileAudio,
  Star,
  Clock,
  RefreshCw,
  FolderOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Play,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  Lock,
  Smartphone,
  Download,
} from 'lucide-react';
import { CallRecording, VaultFolder, VaultStats } from '../types';

interface DashboardViewProps {
  stats: VaultStats;
  recordings: CallRecording[];
  folders: VaultFolder[];
  onPlayRecording: (recording: CallRecording) => void;
  onToggleFavorite: (id: string) => void;
  onQuickScan: () => void;
  isScanning: boolean;
  onNavigateToVault: () => void;
  onNavigateToFolders: () => void;
  onOpenCallSim: () => void;
  onOpenApkModal?: () => void;
  onAIAnalyze: (recording: CallRecording) => void;
  isDarkMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recordings,
  folders,
  onPlayRecording,
  onToggleFavorite,
  onQuickScan,
  isScanning,
  onNavigateToVault,
  onNavigateToFolders,
  onOpenCallSim,
  onOpenApkModal,
  onAIAnalyze,
  isDarkMode,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const recentRecordings = recordings.slice(0, 4);

  return (
    <div className="w-full flex-1 overflow-y-auto p-4 space-y-4">
      {/* Animated Greeting & Security Status */}
      <div className={`p-4 rounded-3xl border relative overflow-hidden ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/30 border-slate-800'
          : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border-emerald-100 shadow-sm'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
                Hardware Enclave Armed
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">Protected Vault</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero unencrypted files. All call recordings AES-256 GCM encrypted.
            </p>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Quick Simulator CTA pill */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Test Android Telephony Hook:</span>
          <button
            onClick={onOpenCallSim}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Simulate Call Import</span>
          </button>
        </div>
      </div>

      {/* APK & Phone Install Card */}
      {onOpenApkModal && (
        <div className="p-3.5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/50 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md shadow-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Phone Me Install / APK Build</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                  Ready
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 truncate">
                Direct phone install ya 1-click Android Studio APK generate karein
              </p>
            </div>
          </div>

          <button
            onClick={onOpenApkModal}
            className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install APK</span>
          </button>
        </div>
      )}

      {/* Primary 4 Statistics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3.5 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Total Vaulted</span>
            <FileAudio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{stats.totalRecordings}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">100%</span> Encrypted
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Encrypted Size</span>
            <HardDrive className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{formatBytes(stats.totalEncryptedBytes)}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Saved in app partition
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Imported Today</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{stats.todayRecordingsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {formatBytes(stats.todayBytes)} ingested
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Starred</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{stats.favoritesCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Priority conversations
          </div>
        </div>
      </div>

      {/* Quick Scan Card with Progress */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between gap-4 ${
        isDarkMode
          ? 'bg-slate-900/80 border-slate-800'
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">SAF Scan Engine</h3>
            {isScanning && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 animate-pulse">
                SCANNING
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isScanning
              ? 'Analyzing Storage Access Framework folders...'
              : `Monitors ${folders.length} SAF folder(s) for call recordings`}
          </p>
        </div>

        <button
          onClick={onQuickScan}
          disabled={isScanning}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md ${
            isScanning
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-110 active:scale-95 shadow-emerald-500/20'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning' : 'Quick Scan'}</span>
        </button>
      </div>

      {/* Recent Recordings Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Recordings
          </h3>
          <button
            onClick={onNavigateToVault}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentRecordings.map((rec) => (
            <div
              key={rec.id}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                isDarkMode
                  ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                  : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-sm'
              }`}
            >
              {/* Direction Icon & Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-sm text-emerald-300 border border-slate-700/80 shadow-inner">
                  {rec.contactName ? rec.contactName.slice(0, 2).toUpperCase() : 'CO'}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border ${
                    isDarkMode ? 'border-slate-900' : 'border-white'
                  } ${
                    rec.callType === 'incoming'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-sky-500 text-slate-950'
                  }`}
                >
                  {rec.callType === 'incoming' ? (
                    <ArrowDownLeft className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <ArrowUpRight className="w-2.5 h-2.5 stroke-[3]" />
                  )}
                </div>
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-100 truncate">
                    {rec.contactName || rec.phoneNumber}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDuration(rec.duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                  <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span className="uppercase text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {rec.fileFormat}
                  </span>
                  <span>•</span>
                  <span>{formatBytes(rec.fileSizeBytes)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleFavorite(rec.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      rec.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => onAIAnalyze(rec)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors"
                  title="AI Intelligence Brief"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onPlayRecording(rec)}
                  className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                  title="Play Decrypted Audio"
                >
                  <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitored SAF Folders Overview Card */}
      <div className={`p-4 rounded-3xl border ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Storage Folders
            </h3>
          </div>
          <button
            onClick={onNavigateToFolders}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
          >
            Manage
          </button>
        </div>

        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="p-2.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-slate-200 truncate">{folder.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{folder.pathDisplay}</p>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Auto-Sync ON
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
