export type CallType = 'incoming' | 'outgoing' | 'missed';

export type AudioFormat = 'mp3' | 'aac' | 'm4a' | 'amr' | 'wav' | 'ogg' | 'flac' | '3gp';

export interface CallRecording {
  id: string;
  contactName: string;
  phoneNumber: string;
  callType: CallType;
  timestamp: number;
  duration: number; // in seconds
  fileFormat: AudioFormat;
  fileSizeBytes: number;
  encryptedFilePath: string;
  originalFileName: string;
  ivHex: string; // 12-byte initialization vector in hex
  isFavorite: boolean;
  tags: string[];
  notes: string;
  waveform: number[]; // 40-60 points between 0.05 and 1.0
  contentHash: string; // SHA-256 for strict deduplication
  sourceUri: string; // Android Storage Access Framework content:// URI
  folderId: string;
  audioBlob?: Blob; // In-memory audio for playback
  audioUrl?: string; // Decrypted playback URL
}

export interface VaultFolder {
  id: string;
  name: string;
  safTreeUri: string;
  persistedAt: number;
  recordingsCount: number;
  autoScanEnabled: boolean;
  lastScannedAt: number | null;
  pathDisplay: string;
}

export interface VaultStats {
  totalRecordings: number;
  totalEncryptedBytes: number;
  todayRecordingsCount: number;
  todayBytes: number;
  favoritesCount: number;
  lastScanTimestamp: number | null;
  storageQuotaBytes: number;
}

export type ThemePalette = 'emerald' | 'sapphire' | 'amethyst' | 'amber' | 'ruby';

export interface VaultSettings {
  authType: 'pin' | 'biometric' | 'password';
  pinCode: string;
  biometricsEnabled: boolean;
  faceUnlockEnabled: boolean;
  recoveryKey: string;
  autoLockTimeoutSeconds: number; // e.g. 30, 60, 300, 0 (immediate)
  disableScreenshots: boolean; // Android Window FLAG_SECURE
  clipboardProtection: boolean;
  themeColor: ThemePalette;
  isDarkMode: boolean;
  scanDelaySeconds: number; // Wait X seconds after call-end before scan
  notificationsEnabled: boolean;
  rootDetectionWarning: boolean;
  onboardingCompleted: boolean;
}

export interface ImportLog {
  id: string;
  timestamp: number;
  status: 'success' | 'skipped_duplicate' | 'error' | 'pending';
  fileName: string;
  detail: string;
  fileSizeBytes: number;
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: string;
  actionItems: string[];
  privacyRating: string;
  keyTopics: string[];
  riskFlags: string;
  isSimulated?: boolean;
}

export interface AndroidSourceFile {
  path: string;
  name: string;
  category: 'manifest' | 'gradle' | 'security' | 'database' | 'worker' | 'receiver' | 'player' | 'ui' | 'di';
  language: 'kotlin' | 'xml' | 'groovy';
  description: string;
  content: string;
}
