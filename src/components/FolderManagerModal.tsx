import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Upload,
  X,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { VaultFolder } from '../types';
import { vaultAutoImporter } from '../services/callSimulation';

interface FolderManagerModalProps {
  folders: VaultFolder[];
  onAddFolder: (folder: VaultFolder) => void;
  onDeleteFolder: (id: string) => void;
  onRefreshRecordings: () => void;
  onClose: () => void;
  isDarkMode: boolean;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  folders,
  onAddFolder,
  onDeleteFolder,
  onRefreshRecordings,
  onClose,
  isDarkMode,
}) => {
  const [isPicking, setIsPicking] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const supportedFormats = ['MP3', 'AAC', 'M4A', 'AMR', 'WAV', 'OGG', 'FLAC', '3GP'];

  // Handle picking directory with File System Access API or simulated SAF
  const handlePickDirectory = async () => {
    setIsPicking(true);
    try {
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker();
          const folderName = dirHandle.name || 'Selected_Call_Recordings';
          const newFolder: VaultFolder = {
            id: `folder_${Date.now()}`,
            name: folderName,
            safTreeUri: `content://com.android.externalstorage.documents/tree/primary%3A${encodeURIComponent(
              folderName
            )}`,
            pathDisplay: `/storage/emulated/0/${folderName}`,
            persistedAt: Date.now(),
            recordingsCount: 0,
            autoScanEnabled: true,
            lastScannedAt: Date.now(),
          };
          onAddFolder(newFolder);
          setIsPicking(false);
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') {
            setIsPicking(false);
            return;
          }
        }
      }

      // Fallback: pick standard Android preset
      const presets = [
        { name: 'MIUI Sound Recorder', path: '/storage/emulated/0/MIUI/sound_recorder/call_rec' },
        { name: 'Samsung Voice Calls', path: '/storage/emulated/0/Recordings/Call' },
        { name: 'Pixel Call Recordings', path: '/storage/emulated/0/Music/Recordings' },
      ];
      const selected = presets[Math.floor(Math.random() * presets.length)];
      const newFolder: VaultFolder = {
        id: `folder_${Date.now()}`,
        name: selected.name,
        safTreeUri: `content://com.android.externalstorage.documents/tree/primary%3A${encodeURIComponent(
          selected.name
        )}`,
        pathDisplay: selected.path,
        persistedAt: Date.now(),
        recordingsCount: 0,
        autoScanEnabled: true,
        lastScannedAt: Date.now(),
      };
      onAddFolder(newFolder);
    } finally {
      setIsPicking(false);
    }
  };

  // Upload custom audio file directly into vault
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const imported = await vaultAutoImporter.importUserAudioFile(
        file,
        file.name.replace(/\.[^/.]+$/, ''),
        'Manual Upload',
        'incoming'
      );
      setUploadSuccess(`Encrypted & stored: ${imported.originalFileName}`);
      onRefreshRecordings();
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      alert('Error importing audio file: ' + err.message);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end select-none animate-in fade-in duration-200">
      <div className={`w-full max-h-[90%] rounded-t-3xl border-t flex flex-col p-5 overflow-y-auto space-y-4 ${
        isDarkMode
          ? 'bg-[#0d141e] border-slate-700 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Storage Access Framework (SAF)</h2>
              <p className="text-[11px] text-slate-400">Monitored Call Recording Directories</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload banner */}
        {uploadSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Supported formats pills */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Supported Audio Encodings
          </span>
          <div className="flex flex-wrap gap-1.5">
            {supportedFormats.map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-emerald-300 border border-slate-700"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Active Folders List */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Monitored Folders ({folders.length})
          </span>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{folder.name}</h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Persisted URI
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                  {folder.pathDisplay}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Last Scanned: {folder.lastScannedAt ? new Date(folder.lastScannedAt).toLocaleTimeString() : 'Never'}
                </p>
              </div>

              {folders.length > 1 && (
                <button
                  onClick={() => onDeleteFolder(folder.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions: Add Folder & Import File */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handlePickDirectory}
            disabled={isPicking}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Select SAF Folder</span>
          </button>

          <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95">
            <Upload className="w-4 h-4" />
            <span>Import Audio File</span>
            <input
              type="file"
              accept=".mp3,.m4a,.wav,.aac,.amr,.ogg,.flac,.3gp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
