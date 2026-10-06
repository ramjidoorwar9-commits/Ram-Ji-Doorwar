import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Fingerprint,
  EyeOff,
  Clock,
  Palette,
  Download,
  Upload,
  KeyRound,
  Bell,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { VaultSettings, ThemePalette } from '../types';
import { exportEncryptedBackupPackage } from '../services/storage';

interface SettingsViewProps {
  settings: VaultSettings;
  onUpdateSettings: (newSettings: VaultSettings) => void;
  onOpenCode: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenCode,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [pinInput, setPinInput] = useState(settings.pinCode);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);
  const [backupPass, setBackupPass] = useState('MySecurePass123');
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      onUpdateSettings({ ...settings, pinCode: pinInput });
      setIsChangingPin(false);
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2500);
    }
  };

  const handleExportBackup = async () => {
    try {
      const blob = await exportEncryptedBackupPackage(backupPass);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SecureCallVault_Backup_${Date.now()}.scvbackup`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e: any) {
      alert('Error exporting backup: ' + e.message);
    }
  };

  return (
    <div className="w-full flex-1 overflow-y-auto p-4 space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold tracking-tight">Security & App Settings</h2>
        <p className="text-xs text-slate-400">Configure encryption parameters and hardware protections</p>
      </div>

      {pinSaved && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>New 4-Digit Security PIN successfully armed.</span>
        </div>
      )}

      {/* Security Section */}
      <div className={`p-4 rounded-3xl border space-y-3.5 ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Shield className="w-4 h-4" />
          <span>Hardware & Vault Security</span>
        </div>

        {/* Biometrics Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Biometric Authentication</span>
            <span className="text-[11px] text-slate-400">Use fingerprint sensor or Face Unlock</span>
          </div>
          <input
            type="checkbox"
            checked={settings.biometricsEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, biometricsEnabled: e.target.checked })}
            className="w-5 h-5 accent-emerald-500 rounded"
          />
        </div>

        {/* FLAG_SECURE Prevention */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Anti-Leak Screen Shield</span>
            <span className="text-[11px] text-slate-400">Enforce FLAG_SECURE against screenshots & Recents preview</span>
          </div>
          <input
            type="checkbox"
            checked={settings.disableScreenshots}
            onChange={(e) => onUpdateSettings({ ...settings, disableScreenshots: e.target.checked })}
            className="w-5 h-5 accent-emerald-500 rounded"
          />
        </div>

        {/* Change PIN row */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">4-Digit Security PIN</span>
            <span className="text-[11px] font-mono text-emerald-400">Currently: ••••</span>
          </div>
          {!isChangingPin ? (
            <button
              onClick={() => setIsChangingPin(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Change PIN
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-16 px-2 py-1 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono font-bold text-xs"
              />
              <button
                onClick={handleSavePin}
                className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:brightness-110"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Master Recovery Key display */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Hardware Recovery Key
            </span>
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <code className="text-xs font-mono font-bold text-amber-300 block tracking-wider">
            {settings.recoveryKey}
          </code>
        </div>
      </div>

      {/* Auto-Import & Delayed Scan Engine */}
      <div className={`p-4 rounded-3xl border space-y-3.5 ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
          <Clock className="w-4 h-4" />
          <span>Call-End Auto-Import Engine</span>
        </div>

        {/* Delay seconds slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Post Call-End Scan Delay</span>
            <span className="font-mono font-bold text-emerald-400">{settings.scanDelaySeconds}s</span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={settings.scanDelaySeconds}
            onChange={(e) => onUpdateSettings({ ...settings, scanDelaySeconds: Number(e.target.value) })}
            className="w-full accent-emerald-500"
          />
          <p className="text-[10px] text-slate-400">
            Allows the phone dialer engine sufficient time to finalize and close the audio file on disk before vault ingestion.
          </p>
        </div>

        {/* Notifications toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Import Notifications</span>
            <span className="text-[11px] text-slate-400">Alert only after successful AES encryption</span>
          </div>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => onUpdateSettings({ ...settings, notificationsEnabled: e.target.checked })}
            className="w-5 h-5 accent-emerald-500 rounded"
          />
        </div>
      </div>

      {/* Encrypted Backup & Restore */}
      <div className={`p-4 rounded-3xl border space-y-3 ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <Download className="w-4 h-4" />
          <span>Encrypted Backup & Portability</span>
        </div>

        <p className="text-xs text-slate-400">
          Export an encrypted archive (.scvbackup) protected with AES-256 GCM passphrase.
        </p>

        {exportSuccess && (
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Encrypted backup package generated and downloaded!</span>
          </div>
        )}

        <button
          onClick={handleExportBackup}
          className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-600/20"
        >
          <Download className="w-4 h-4" />
          <span>Download Encrypted Backup (.scvbackup)</span>
        </button>
      </div>

      {/* App Architecture & Kotlin Source Inspection */}
      <div className={`p-4 rounded-3xl border space-y-3 ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Android Production Architecture</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Built with Clean Architecture, Hilt DI, Jetpack Compose Material 3, Room, Media3 ExoPlayer,
          and WorkManager.
        </p>

        <button
          onClick={onOpenCode}
          className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <span>Inspect Kotlin Source & Download Project</span>
        </button>
      </div>
    </div>
  );
};
