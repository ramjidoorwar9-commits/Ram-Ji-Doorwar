import React, { useState } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  FileCode,
  Folder,
  X,
  Sparkles,
  FileText,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { ANDROID_FILES, downloadAndroidProjectZip } from '../services/androidProjectCode';
import confetti from 'canvas-confetti';

interface AndroidCodeExplorerModalProps {
  onClose: () => void;
  isDarkMode: boolean;
}

export const AndroidCodeExplorerModal: React.FC<AndroidCodeExplorerModalProps> = ({
  onClose,
  isDarkMode,
}) => {
  const [selectedFile, setSelectedFile] = useState(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAndroidProjectZip();
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e: any) {
      alert('Error creating zip: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-xl z-50 flex flex-col justify-between p-4 md:p-6 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Android Studio Kotlin Codebase</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Production Ready
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Clean Architecture • Hilt • Room • Media3 • Keystore AES-256 • WorkManager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Packing ZIP...' : 'Download ZIP'}</span>
          </button>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Split Layout: File Tree & Code Viewer */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 py-3 min-h-0">
        {/* Left: File Tree */}
        <div className="w-full md:w-64 bg-slate-950/80 rounded-2xl border border-slate-800 p-2 overflow-y-auto space-y-1 shrink-0 max-h-40 md:max-h-full">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
            Project Files ({ANDROID_FILES.length})
          </span>
          {ANDROID_FILES.map((file) => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {file.name.endsWith('.md') ? (
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Code Viewer */}
        <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden min-h-0">
          {/* File Tab Header */}
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs bg-slate-900/60">
            <div>
              <span className="font-mono font-bold text-indigo-300">{selectedFile.path}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Textarea / Viewer */}
          <pre className="flex-1 p-4 overflow-auto font-mono text-[11px] text-emerald-300/90 leading-relaxed select-text bg-[#070d14]">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
