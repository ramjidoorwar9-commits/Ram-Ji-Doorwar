/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  seedInitialVaultData,
  getAllRecordings,
  getAllFolders,
  getVaultSettings,
  saveVaultSettings,
  getAllLogs,
  clearAllLogs,
  getVaultStats,
  saveFolder,
  deleteFolder,
  toggleRecordingFavorite,
  secureDeleteRecording,
  updateRecordingMeta,
} from './services/storage';
import { vaultPlayer } from './services/audioPlayer';
import { vaultAutoImporter } from './services/callSimulation';
import { CallRecording, VaultFolder, VaultSettings, ImportLog, VaultStats } from './types';
import { AndroidFrame } from './components/AndroidFrame';
import { LockScreen } from './components/LockScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { VaultView } from './components/VaultView';
import { FolderManagerModal } from './components/FolderManagerModal';
import { CallSimulatorModal } from './components/CallSimulatorModal';
import { SpotifyPlayerView } from './components/SpotifyPlayerView';
import { AIInsightsModal } from './components/AIInsightsModal';
import { SettingsView } from './components/SettingsView';
import { ImportLogsView } from './components/ImportLogsView';
import { AndroidCodeExplorerModal } from './components/AndroidCodeExplorerModal';
import { ApkBuildModal } from './components/ApkBuildModal';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Vault data state
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [settings, setSettings] = useState<VaultSettings>({
    authType: 'pin',
    pinCode: '1234',
    biometricsEnabled: true,
    faceUnlockEnabled: false,
    recoveryKey: 'SCV-9K42-B88X-7J1P',
    autoLockTimeoutSeconds: 60,
    disableScreenshots: true,
    clipboardProtection: true,
    themeColor: 'emerald',
    isDarkMode: true,
    scanDelaySeconds: 5,
    notificationsEnabled: true,
    rootDetectionWarning: false,
    onboardingCompleted: false,
  });
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [stats, setStats] = useState<VaultStats>({
    totalRecordings: 0,
    totalEncryptedBytes: 0,
    todayRecordingsCount: 0,
    todayBytes: 0,
    favoritesCount: 0,
    lastScanTimestamp: null,
    storageQuotaBytes: 1024 * 1024 * 1024 * 64,
  });

  // UI state
  const [isScanning, setIsScanning] = useState(false);
  const [activePlayingRecording, setActivePlayingRecording] = useState<CallRecording | null>(null);
  const [analyzingRecording, setAnalyzingRecording] = useState<CallRecording | null>(null);
  const [showCallSim, setShowCallSim] = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [showCodeExplorer, setShowCodeExplorer] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Auto-lock timer ref
  const lastActivityRef = useRef<number>(Date.now());

  // Load and refresh vault
  const refreshVault = useCallback(async () => {
    try {
      const [recs, flds, sets, lgs, st] = await Promise.all([
        getAllRecordings(),
        getAllFolders(),
        getVaultSettings(),
        getAllLogs(),
        getVaultStats(),
      ]);
      setRecordings(recs);
      setFolders(flds);
      setSettings(sets);
      setLogs(lgs);
      setStats(st);

      if (!sets.onboardingCompleted) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load vault data:', err);
    }
  }, []);

  // Initialization
  useEffect(() => {
    const init = async () => {
      await seedInitialVaultData();
      await refreshVault();
      setIsInitialized(true);
    };
    init();
  }, [refreshVault]);

  // Subscribe to auto-import notifications
  useEffect(() => {
    const unsub = vaultAutoImporter.subscribe((scanState) => {
      if (scanState.status === 'completed' && scanState.importedRecording) {
        setNotificationBanner({
          title: 'Encrypted Vault Import',
          message: `New recording from ${scanState.importedRecording.contactName} secured with AES-256 GCM.`,
        });
        refreshVault();
      }
    });

    return () => unsub();
  }, [refreshVault]);

  // Auto-lock inactivity handler
  useEffect(() => {
    const handleUserInteraction = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousedown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    const interval = setInterval(() => {
      if (!isLocked && settings.autoLockTimeoutSeconds > 0) {
        const elapsed = (Date.now() - lastActivityRef.current) / 1000;
        if (elapsed >= settings.autoLockTimeoutSeconds) {
          setIsLocked(true);
          vaultPlayer.pause();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      clearInterval(interval);
    };
  }, [isLocked, settings.autoLockTimeoutSeconds]);

  // Audio player synchronization
  useEffect(() => {
    const unsub = vaultPlayer.subscribe(() => {
      const rec = vaultPlayer.getCurrentRecording();
      setActivePlayingRecording(rec);
    });
    return () => unsub();
  }, []);

  // Actions
  const handleUnlock = () => {
    setIsLocked(false);
    lastActivityRef.current = Date.now();
  };

  const handleLockNow = () => {
    setIsLocked(true);
    vaultPlayer.pause();
  };

  const handleCompleteOnboarding = async () => {
    const updated = { ...settings, onboardingCompleted: true };
    await saveVaultSettings(updated);
    setSettings(updated);
    setShowOnboarding(false);
  };

  const handleQuickScan = async () => {
    setIsScanning(true);
    try {
      await vaultAutoImporter.executeScanAndImport();
      await refreshVault();
      setNotificationBanner({
        title: 'SAF Scan Finished',
        message: 'All monitored Storage Access Framework folders checked. Vault up to date.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlayRecording = async (recording: CallRecording) => {
    try {
      await vaultPlayer.loadAndPlay(recording, settings.pinCode);
    } catch (e: any) {
      alert('Decryption failure: ' + e.message);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleRecordingFavorite(id);
    await refreshVault();
  };

  const handleDeleteRecording = async (id: string) => {
    if (confirm('Permanently shred and delete this encrypted call recording? Memory bytes will be zeroed out.')) {
      await secureDeleteRecording(id);
      if (activePlayingRecording?.id === id) {
        vaultPlayer.close();
      }
      await refreshVault();
    }
  };

  const handleUpdateMeta = async (id: string, tags: string[], notes: string) => {
    await updateRecordingMeta(id, tags, notes);
    await refreshVault();
  };

  const handleAddFolder = async (folder: VaultFolder) => {
    await saveFolder(folder);
    await refreshVault();
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
    await refreshVault();
  };

  const handleClearLogs = async () => {
    await clearAllLogs();
    await refreshVault();
  };

  const handleUpdateSettings = async (newSettings: VaultSettings) => {
    await saveVaultSettings(newSettings);
    setSettings(newSettings);
  };

  const handleToggleDarkMode = () => {
    const nextMode = !settings.isDarkMode;
    handleUpdateSettings({ ...settings, isDarkMode: nextMode });
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-spin">
          <div className="w-4 h-4 bg-emerald-400 rounded-sm" />
        </div>
        <p className="text-xs font-semibold mt-3 text-slate-400">Loading Secure Call Vault...</p>
      </div>
    );
  }

  return (
    <AndroidFrame
      isLocked={isLocked}
      onLock={handleLockNow}
      onOpenCode={() => setShowCodeExplorer(true)}
      onOpenCallSim={() => setShowCallSim(true)}
      onOpenFolderManager={() => setShowFolderManager(true)}
      onOpenApkModal={() => setShowApkModal(true)}
      notificationBanner={notificationBanner}
      onDismissNotification={() => setNotificationBanner(null)}
      isDarkMode={settings.isDarkMode}
      onToggleDarkMode={handleToggleDarkMode}
    >
      {/* Onboarding Overlay */}
      {showOnboarding ? (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          isDarkMode={settings.isDarkMode}
        />
      ) : isLocked ? (
        /* Lock Screen */
        <LockScreen
          correctPin={settings.pinCode}
          recoveryKey={settings.recoveryKey}
          biometricsEnabled={settings.biometricsEnabled}
          onUnlock={handleUnlock}
          isDarkMode={settings.isDarkMode}
        />
      ) : (
        /* Authenticated Main App Container */
        <div className="w-full h-full flex flex-col overflow-hidden relative">
          {/* Top App Bar */}
          <TopAppBar
            title="Secure Call Vault"
            onOpenSearch={() => setCurrentTab('vault')}
            onQuickScan={handleQuickScan}
            isScanning={isScanning}
            onOpenCallSim={() => setShowCallSim(true)}
            onLock={handleLockNow}
            isDarkMode={settings.isDarkMode}
          />

          {/* Active Navigation View */}
          <main className="flex-1 overflow-hidden flex flex-col min-h-0">
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                recordings={recordings}
                folders={folders}
                onPlayRecording={handlePlayRecording}
                onToggleFavorite={handleToggleFavorite}
                onQuickScan={handleQuickScan}
                isScanning={isScanning}
                onNavigateToVault={() => setCurrentTab('vault')}
                onNavigateToFolders={() => setShowFolderManager(true)}
                onOpenCallSim={() => setShowCallSim(true)}
                onOpenApkModal={() => setShowApkModal(true)}
                onAIAnalyze={(rec) => setAnalyzingRecording(rec)}
                isDarkMode={settings.isDarkMode}
              />
            )}

            {currentTab === 'vault' && (
              <VaultView
                recordings={recordings}
                onPlayRecording={handlePlayRecording}
                onToggleFavorite={handleToggleFavorite}
                onDeleteRecording={handleDeleteRecording}
                onAIAnalyze={(rec) => setAnalyzingRecording(rec)}
                onUpdateMeta={handleUpdateMeta}
                onOpenCallSim={() => setShowCallSim(true)}
                isDarkMode={settings.isDarkMode}
              />
            )}

            {currentTab === 'folders' && (
              <div className="flex-1 flex flex-col">
                <FolderManagerModal
                  folders={folders}
                  onAddFolder={handleAddFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onRefreshRecordings={refreshVault}
                  onClose={() => setCurrentTab('dashboard')}
                  isDarkMode={settings.isDarkMode}
                />
              </div>
            )}

            {currentTab === 'logs' && (
              <ImportLogsView
                logs={logs}
                onClearLogs={handleClearLogs}
                isDarkMode={settings.isDarkMode}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onOpenCode={() => setShowCodeExplorer(true)}
                isDarkMode={settings.isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
              />
            )}
          </main>

          {/* Spotify Audio Player Bar / Sheet */}
          {activePlayingRecording && (
            <SpotifyPlayerView
              currentRecording={activePlayingRecording}
              onClose={() => vaultPlayer.close()}
              onAIAnalyze={(rec) => setAnalyzingRecording(rec)}
              isDarkMode={settings.isDarkMode}
            />
          )}

          {/* Bottom Navigation Bar */}
          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            recordingsCount={recordings.length}
            isDarkMode={settings.isDarkMode}
          />

          {/* Modals */}
          {showCallSim && (
            <CallSimulatorModal
              onClose={() => setShowCallSim(false)}
              onRefreshRecordings={refreshVault}
              isDarkMode={settings.isDarkMode}
            />
          )}

          {showFolderManager && currentTab !== 'folders' && (
            <FolderManagerModal
              folders={folders}
              onAddFolder={handleAddFolder}
              onDeleteFolder={handleDeleteFolder}
              onRefreshRecordings={refreshVault}
              onClose={() => setShowFolderManager(false)}
              isDarkMode={settings.isDarkMode}
            />
          )}

          {analyzingRecording && (
            <AIInsightsModal
              recording={analyzingRecording}
              onClose={() => setAnalyzingRecording(null)}
              isDarkMode={settings.isDarkMode}
            />
          )}

          {showCodeExplorer && (
            <AndroidCodeExplorerModal
              onClose={() => setShowCodeExplorer(false)}
              isDarkMode={settings.isDarkMode}
            />
          )}

          {showApkModal && (
            <ApkBuildModal
              onClose={() => setShowApkModal(false)}
              isDarkMode={settings.isDarkMode}
            />
          )}
        </div>
      )}
    </AndroidFrame>
  );
}
