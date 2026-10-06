import { CallRecording, VaultFolder, VaultSettings, ImportLog, VaultStats } from '../types';
import { encryptAudioData, decryptAudioData, calculateSHA256, generateRecoveryKey } from './crypto';

const DB_NAME = 'SecureCallVault_v1';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('recordings')) {
        const recStore = db.createObjectStore('recordings', { keyPath: 'id' });
        recStore.createIndex('timestamp', 'timestamp', { unique: false });
        recStore.createIndex('contentHash', 'contentHash', { unique: false });
        recStore.createIndex('isFavorite', 'isFavorite', { unique: false });
      }

      if (!db.objectStoreNames.contains('encryptedPayloads')) {
        db.createObjectStore('encryptedPayloads', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('importLogs')) {
        const logStore = db.createObjectStore('importLogs', { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Generate synthesized realistic audio data (WAV format) for sample calls
export function generateSyntheticCallAudio(durationSec: number = 30, toneFreq: number = 440): ArrayBuffer {
  const sampleRate = 22050;
  const numChannels = 1;
  const numSamples = Math.floor(sampleRate * durationSec);
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Modulated voice-like waveform with simulated conversational cadence
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Cadence: active speech bursts of 1.5 - 3 sec with pauses
    const cadence = (Math.sin(t * 1.5) > -0.2 ? 1 : 0.05);
    // Voice harmonic simulation (fundamental + 2nd + 3rd harmonic)
    const wave = (
      Math.sin(2 * Math.PI * toneFreq * t) * 0.45 +
      Math.sin(2 * Math.PI * (toneFreq * 1.8) * t) * 0.25 +
      Math.sin(2 * Math.PI * (toneFreq * 2.6) * t) * 0.15 +
      (Math.random() - 0.5) * 0.08 // mild realistic telephone line hiss
    ) * cadence;

    const sample = Math.max(-1, Math.min(1, wave)) * 32767;
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return buffer;
}

// Generate normalized random waveform points
export function generateRealisticWaveform(length = 50): number[] {
  const points: number[] = [];
  let prev = 0.3;
  for (let i = 0; i < length; i++) {
    const delta = (Math.random() - 0.48) * 0.3;
    prev = Math.max(0.08, Math.min(0.95, prev + delta));
    points.push(parseFloat(prev.toFixed(2)));
  }
  return points;
}

export const DEFAULT_SETTINGS: VaultSettings = {
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
};

// Seed default initial data if freshly installed
export async function seedInitialVaultData(): Promise<void> {
  const db = await getDB();

  // Check if recordings already exist
  const existingCount = await new Promise<number>((res) => {
    const tx = db.transaction('recordings', 'readonly');
    const countReq = tx.objectStore('recordings').count();
    countReq.onsuccess = () => res(countReq.result);
    countReq.onerror = () => res(0);
  });

  if (existingCount > 0) return;

  // Create default SAF folder
  const defaultFolder: VaultFolder = {
    id: 'folder_default_call_rec',
    name: 'CallRecordings',
    safTreeUri: 'content://com.android.externalstorage.documents/tree/primary%3ARecordings%2FCall',
    pathDisplay: '/storage/emulated/0/Recordings/Call',
    persistedAt: Date.now() - 86400000 * 7,
    recordingsCount: 5,
    autoScanEnabled: true,
    lastScannedAt: Date.now() - 3600000,
  };
  await saveFolder(defaultFolder);

  // Create default sample call recordings
  const sampleData: Array<Omit<CallRecording, 'id' | 'ivHex' | 'contentHash' | 'encryptedFilePath'>> = [
    {
      contactName: 'Sarah Jenkins',
      phoneNumber: '+1 (415) 890-2341',
      callType: 'incoming',
      timestamp: Date.now() - 1000 * 60 * 18, // 18 mins ago
      duration: 142, // 2m 22s
      fileFormat: 'm4a',
      fileSizeBytes: 1845200,
      originalFileName: 'Call_SarahJenkins_20261006_142211.m4a',
      isFavorite: true,
      tags: ['Legal', 'Urgent', 'Contract'],
      notes: 'Reviewed revised NDA paragraph 4.2. Agreed to exchange countersigned copies before Thursday.',
      waveform: generateRealisticWaveform(54),
      sourceUri: 'content://com.android.externalstorage.documents/tree/primary%3ARecordings%2FCall/document/rec_01',
      folderId: defaultFolder.id,
    },
    {
      contactName: 'Dr. Alexander Wright',
      phoneNumber: '+1 (212) 555-0199',
      callType: 'outgoing',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      duration: 88, // 1m 28s
      fileFormat: 'mp3',
      fileSizeBytes: 980400,
      originalFileName: 'Call_DrWright_20261006_120530.mp3',
      isFavorite: false,
      tags: ['Health', 'Consultation'],
      notes: 'Scheduled quarterly health screening for next month. Confirmed lab results received.',
      waveform: generateRealisticWaveform(48),
      sourceUri: 'content://com.android.externalstorage.documents/tree/primary%3ARecordings%2FCall/document/rec_02',
      folderId: defaultFolder.id,
    },
    {
      contactName: 'Marcus Vance',
      phoneNumber: '+1 (650) 412-9800',
      callType: 'incoming',
      timestamp: Date.now() - 1000 * 60 * 60 * 22, // Yesterday
      duration: 310, // 5m 10s
      fileFormat: 'wav',
      fileSizeBytes: 3950120,
      originalFileName: 'Call_MarcusVance_20261005_164019.wav',
      isFavorite: true,
      tags: ['Client', 'Architecture'],
      notes: 'Discussion on cloud security audit and Zero-Trust rollout timeline.',
      waveform: generateRealisticWaveform(60),
      sourceUri: 'content://com.android.externalstorage.documents/tree/primary%3ARecordings%2FCall/document/rec_03',
      folderId: defaultFolder.id,
    },
    {
      contactName: 'Bank Security Desk',
      phoneNumber: '1-800-432-1000',
      callType: 'incoming',
      timestamp: Date.now() - 86400000 * 3, // 3 days ago
      duration: 65,
      fileFormat: 'aac',
      fileSizeBytes: 712000,
      originalFileName: 'Call_BankVerification_20261003_101500.aac',
      isFavorite: false,
      tags: ['Finance', 'Verification'],
      notes: 'Confirmed authorization for international security wire transfer.',
      waveform: generateRealisticWaveform(42),
      sourceUri: 'content://com.android.externalstorage.documents/tree/primary%3ARecordings%2FCall/document/rec_04',
      folderId: defaultFolder.id,
    },
    {
      contactName: 'Elena Rostova',
      phoneNumber: '+44 20 7946 0912',
      callType: 'outgoing',
      timestamp: Date.now() - 86400000 * 5, // 5 days ago
      duration: 215,
      fileFormat: 'amr',
      fileSizeBytes: 1420500,
      originalFileName: 'Call_ElenaRostova_20261001_183300.amr',
      isFavorite: true,
      tags: ['Partnership', 'Executive'],
      notes: 'Annual partnership renegotiation outline. Retainer terms locked at 15% discount.',
      waveform: generateRealisticWaveform(50),
      sourceUri: 'content://com.android.externalstorage.documents/tree/primary%3ARecordings%2FCall/document/rec_05',
      folderId: defaultFolder.id,
    },
  ];

  for (let i = 0; i < sampleData.length; i++) {
    const raw = sampleData[i];
    const recId = `rec_${Date.now()}_${i + 1}`;
    // Synthesize real audible voice buffer
    const audioBuffer = generateSyntheticCallAudio(Math.min(raw.duration, 25), 320 + i * 40);
    const { encryptedBytes, ivHex, contentHash } = await encryptAudioData(audioBuffer, '1234');

    const recording: CallRecording = {
      ...raw,
      id: recId,
      ivHex,
      contentHash,
      encryptedFilePath: `/data/user/0/com.securecallvault.app/files/vault/${recId}.scv`,
    };

    await saveRecording(recording, encryptedBytes);
  }

  // Initial Import Log
  await addLog({
    id: `log_init_${Date.now()}`,
    timestamp: Date.now() - 3600000,
    status: 'success',
    fileName: 'AutoScan_Initial_SAF_Import',
    detail: 'Successfully detected 5 new recordings from CallRecordings SAF folder. Encrypted with Keystore AES-256.',
    fileSizeBytes: 8908220,
  });
}

// Save or Update Recording
export async function saveRecording(recording: CallRecording, encryptedBytes?: ArrayBuffer): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['recordings', 'encryptedPayloads'], 'readwrite');
    const recStore = tx.objectStore('recordings');
    const payloadStore = tx.objectStore('encryptedPayloads');

    // Remove heavy blob properties from metadata store
    const { audioBlob, audioUrl, ...meta } = recording;
    recStore.put(meta);

    if (encryptedBytes) {
      payloadStore.put({ id: recording.id, data: encryptedBytes });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get all recordings
export async function getAllRecordings(): Promise<CallRecording[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readonly');
    const store = tx.objectStore('recordings');
    const req = store.getAll();

    req.onsuccess = () => {
      const records = req.result as CallRecording[];
      records.sort((a, b) => b.timestamp - a.timestamp);
      resolve(records);
    };
    req.onerror = () => reject(req.error);
  });
}

// Get single recording metadata + decrypted audio data
export async function getDecryptedRecordingAudio(id: string, pin: string = '1234'): Promise<ArrayBuffer | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['recordings', 'encryptedPayloads'], 'readonly');
    const recStore = tx.objectStore('recordings');
    const payloadStore = tx.objectStore('encryptedPayloads');

    const recReq = recStore.get(id);
    recReq.onsuccess = async () => {
      const rec = recReq.result as CallRecording | undefined;
      if (!rec) {
        resolve(null);
        return;
      }
      const payReq = payloadStore.get(id);
      payReq.onsuccess = async () => {
        if (!payReq.result || !payReq.result.data) {
          resolve(null);
          return;
        }
        try {
          const decrypted = await decryptAudioData(payReq.result.data, rec.ivHex, pin);
          resolve(decrypted);
        } catch (e) {
          console.error('Decryption failed for recording:', id, e);
          reject(e);
        }
      };
      payReq.onerror = () => reject(payReq.error);
    };
    recReq.onerror = () => reject(recReq.error);
  });
}

// Secure Delete (Overwrites data bytes first, then removes record)
export async function secureDeleteRecording(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['recordings', 'encryptedPayloads'], 'readwrite');
    const recStore = tx.objectStore('recordings');
    const payloadStore = tx.objectStore('encryptedPayloads');

    const getReq = payloadStore.get(id);
    getReq.onsuccess = () => {
      if (getReq.result && getReq.result.data) {
        const dummy = new Uint8Array(getReq.result.data.byteLength);
        dummy.fill(0); // Zero-out shredding
        payloadStore.put({ id, data: dummy.buffer });
      }
      payloadStore.delete(id);
      recStore.delete(id);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Toggle Favorite
export async function toggleRecordingFavorite(id: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    const store = tx.objectStore('recordings');
    const req = store.get(id);
    req.onsuccess = () => {
      const rec = req.result as CallRecording;
      if (rec) {
        rec.isFavorite = !rec.isFavorite;
        store.put(rec);
        resolve(rec.isFavorite);
      } else {
        resolve(false);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Update Recording Tags & Notes
export async function updateRecordingMeta(id: string, tags: string[], notes: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    const store = tx.objectStore('recordings');
    const req = store.get(id);
    req.onsuccess = () => {
      const rec = req.result as CallRecording;
      if (rec) {
        rec.tags = tags;
        rec.notes = notes;
        store.put(rec);
        resolve();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Folders
export async function getAllFolders(): Promise<VaultFolder[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readonly');
    const store = tx.objectStore('folders');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFolder(folder: VaultFolder): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readwrite');
    const store = tx.objectStore('folders');
    store.put(folder);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readwrite');
    const store = tx.objectStore('folders');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Settings
export async function getVaultSettings(): Promise<VaultSettings> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('app_settings');
    req.onsuccess = () => {
      if (req.result && req.result.value) {
        resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    req.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveVaultSettings(settings: VaultSettings): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    store.put({ key: 'app_settings', value: settings });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Logs
export async function getAllLogs(): Promise<ImportLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('importLogs', 'readonly');
    const store = tx.objectStore('importLogs');
    const req = store.getAll();
    req.onsuccess = () => {
      const logs = req.result as ImportLog[];
      logs.sort((a, b) => b.timestamp - a.timestamp);
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function addLog(log: ImportLog): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('importLogs', 'readwrite');
    const store = tx.objectStore('importLogs');
    store.put(log);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllLogs(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('importLogs', 'readwrite');
    const store = tx.objectStore('importLogs');
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Vault Statistics
export async function getVaultStats(): Promise<VaultStats> {
  const recordings = await getAllRecordings();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let totalEncryptedBytes = 0;
  let todayRecordingsCount = 0;
  let todayBytes = 0;
  let favoritesCount = 0;

  for (const rec of recordings) {
    totalEncryptedBytes += rec.fileSizeBytes;
    if (rec.timestamp >= startOfToday) {
      todayRecordingsCount++;
      todayBytes += rec.fileSizeBytes;
    }
    if (rec.isFavorite) {
      favoritesCount++;
    }
  }

  const logs = await getAllLogs();
  const lastScan = logs.length > 0 ? logs[0].timestamp : null;

  return {
    totalRecordings: recordings.length,
    totalEncryptedBytes,
    todayRecordingsCount,
    todayBytes,
    favoritesCount,
    lastScanTimestamp: lastScan,
    storageQuotaBytes: 1024 * 1024 * 1024 * 64, // 64 GB simulated device internal storage
  };
}

// Encrypted Backup Export (.scvbackup)
export async function exportEncryptedBackupPackage(passphrase: string): Promise<Blob> {
  const recordings = await getAllRecordings();
  const settings = await getVaultSettings();
  const folders = await getAllFolders();

  const manifest = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    recordings,
    settings: { ...settings, pinCode: '****' },
    folders,
  };

  const jsonStr = JSON.stringify(manifest);
  const jsonBytes = new TextEncoder().encode(jsonStr);

  const { encryptedBytes, ivHex } = await encryptAudioData(jsonBytes.buffer, passphrase);

  const exportPackage = {
    signature: 'SECURE_CALL_VAULT_BACKUP',
    version: 1,
    ivHex,
    cipherBase64: btoa(String.fromCharCode(...new Uint8Array(encryptedBytes))),
  };

  return new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/octet-stream' });
}
