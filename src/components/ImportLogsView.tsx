import React from 'react';
import { History, CheckCircle2, CopyCheck, AlertCircle, Trash2, Shield, HardDrive } from 'lucide-react';
import { ImportLog } from '../types';

interface ImportLogsViewProps {
  logs: ImportLog[];
  onClearLogs: () => void;
  isDarkMode: boolean;
}

export const ImportLogsView: React.FC<ImportLogsViewProps> = ({
  logs,
  onClearLogs,
  isDarkMode,
}) => {
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="w-full flex-1 overflow-y-auto p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight">Vault Audit & Import Logs</h2>
          <p className="text-xs text-slate-400">Chronological cryptographic activity ledger</p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <History className="w-10 h-10 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No Logs Recorded</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            As calls are detected, encrypted, or deduplicated, security logs will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const isSuccess = log.status === 'success';
            const isDup = log.status === 'skipped_duplicate';

            return (
              <div
                key={log.id}
                className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isDup ? (
                      <CopyCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-slate-200 truncate">
                      {log.fileName}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${
                      isSuccess
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isDup
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isSuccess ? 'ENCRYPTED' : isDup ? 'DEDUPLICATED' : 'ERROR'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {log.detail}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  <span>{formatBytes(log.fileSizeBytes)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
