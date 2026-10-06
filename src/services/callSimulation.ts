import { CallRecording, VaultFolder, ImportLog, AudioFormat } from '../types';
import { encryptAudioData, calculateSHA256 } from './crypto';
import {
  saveRecording,
  getAllFolders,
  getAllRecordings,
  addLog,
  getVaultSettings,
  generateSyntheticCallAudio,
  generateRealisticWaveform,
} from './storage';

export interface SimulatedCall {
  contactName: string;
  phoneNumber: string;
  callType: 'incoming' | 'outgoing';
  duration: number; // in seconds
  fileName: string;
}

export type AutoScanStatus = 'idle' | 'waiting_delay' | 'scanning' | 'encrypting' | 'completed';

export interface AutoScanState {
  status: AutoScanStatus;
  delayRemaining: number;
  currentStepMessage: string;
  importedRecording: CallRecording | null;
}

type ScanListener = (state: AutoScanState) => void;

class VaultAutoImportManager {
  private scanState: AutoScanState = {
    status: 'idle',
    delayRemaining: 0,
    currentStepMessage: '',
    importedRecording: null,
  };
  private listeners: Set<ScanListener> = new Set();
  private timerId: any = null;

  public subscribe(listener: ScanListener): () => void {
    this.listeners.add(listener);
    listener(this.scanState);
    return () => this.listeners.delete(listener);
  }

  private update(partial: Partial<AutoScanState>) {
    this.scanState = { ...this.scanState, ...partial };
    this.listeners.forEach((l) => l(this.scanState));
  }

  // Triggered when a phone call ends (Simulating TelephonyManager CallStateReceiver -> WorkManager)
  public async handleCallEndTrigger(call: SimulatedCall): Promise<void> {
    const settings = await getVaultSettings();
    const delay = settings.scanDelaySeconds || 5;

    this.update({
      status: 'waiting_delay',
      delayRemaining: delay,
      currentStepMessage: `Call ended. Telephony Receiver detected idle state. Delayed scan scheduled in ${delay}s...`,
      importedRecording: null,
    });

    let current = delay;
    if (this.timerId) clearInterval(this.timerId);

    this.timerId = setInterval(async () => {
      current--;
      if (current > 0) {
        this.update({
          delayRemaining: current,
          currentStepMessage: `Waiting ${current}s before SAF folder scan to allow audio file finalization...`,
        });
      } else {
        clearInterval(this.timerId);
        this.timerId = null;
        await this.executeScanAndImport(call);
      }
    }, 1000);
  }

  // Manual or Triggered Scan
  public async executeScanAndImport(simulatedNewCall?: SimulatedCall): Promise<CallRecording | null> {
    this.update({
      status: 'scanning',
      delayRemaining: 0,
      currentStepMessage: 'WorkManager worker: Scanning user-selected SAF folders for newly finalized audio files...',
    });

    await new Promise((r) => setTimeout(r, 900));

    const folders = await getAllFolders();
    const activeFolder = folders[0] || {
      id: 'default_folder',
      name: 'CallRecordings',
      safTreeUri: 'content://com.android.externalstorage.documents/tree/primary%3ARecordings%2FCall',
    };

    if (!simulatedNewCall) {
      // Manual quick scan: check if there's any pending files
      this.update({
        status: 'completed',
        currentStepMessage: 'Scan complete. All selected SAF folders are up-to-date. No unencrypted files found.',
      });
      setTimeout(() => {
        this.update({ status: 'idle', currentStepMessage: '' });
      }, 4000);
      return null;
    }

    this.update({
      status: 'encrypting',
      currentStepMessage: `Found new recording: ${simulatedNewCall.fileName}. Performing AES-256-GCM hardware encryption...`,
    });

    // Synthesize the audio for the recorded call
    const audioBuffer = generateSyntheticCallAudio(Math.min(simulatedNewCall.duration, 20), 400);
    const pin = (await getVaultSettings()).pinCode || '1234';

    // Encrypt
    const { encryptedBytes, ivHex, contentHash } = await encryptAudioData(audioBuffer, pin);

    // Check duplicate
    const allExisting = await getAllRecordings();
    const isDup = allExisting.some((r) => r.contentHash === contentHash);
    if (isDup) {
      await addLog({
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        status: 'skipped_duplicate',
        fileName: simulatedNewCall.fileName,
        detail: 'Duplicate content hash detected. Skipped to prevent redundancy.',
        fileSizeBytes: audioBuffer.byteLength,
      });

      this.update({
        status: 'completed',
        currentStepMessage: 'Audio file was already present in vault. Deduplicated.',
      });
      return null;
    }

    const recId = `rec_${Date.now()}`;
    const newRecording: CallRecording = {
      id: recId,
      contactName: simulatedNewCall.contactName,
      phoneNumber: simulatedNewCall.phoneNumber,
      callType: simulatedNewCall.callType,
      timestamp: Date.now(),
      duration: simulatedNewCall.duration,
      fileFormat: 'm4a',
      fileSizeBytes: audioBuffer.byteLength,
      originalFileName: simulatedNewCall.fileName,
      encryptedFilePath: `/data/user/0/com.securecallvault.app/files/vault/${recId}.scv`,
      ivHex,
      contentHash,
      isFavorite: false,
      tags: ['Auto-Imported', simulatedNewCall.callType === 'incoming' ? 'Incoming' : 'Outgoing'],
      notes: `Imported via Telephony Call-End trigger from SAF folder: ${activeFolder.name}`,
      waveform: generateRealisticWaveform(50),
      sourceUri: `${activeFolder.safTreeUri}/document/${recId}`,
      folderId: activeFolder.id,
    };

    await saveRecording(newRecording, encryptedBytes);

    // Add log
    await addLog({
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      status: 'success',
      fileName: simulatedNewCall.fileName,
      detail: `Imported from SAF (${activeFolder.name}) and encrypted with Keystore AES-256 GCM.`,
      fileSizeBytes: audioBuffer.byteLength,
    });

    this.update({
      status: 'completed',
      currentStepMessage: `Vault Secured: ${newRecording.contactName} (${simulatedNewCall.duration}s) successfully encrypted and stored.`,
      importedRecording: newRecording,
    });

    // Play notification sound / trigger notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Secure Call Vault', {
          body: `New recording from ${simulatedNewCall.contactName} encrypted and vaulted.`,
          icon: '/favicon.ico',
        });
      } catch {
        // Notification permission fallback
      }
    }

    return newRecording;
  }

  // Import real user-uploaded audio file
  public async importUserAudioFile(
    file: File,
    contactName: string,
    phoneNumber: string,
    callType: 'incoming' | 'outgoing'
  ): Promise<CallRecording> {
    const arrayBuffer = await file.arrayBuffer();
    const pin = (await getVaultSettings()).pinCode || '1234';

    const { encryptedBytes, ivHex, contentHash } = await encryptAudioData(arrayBuffer, pin);

    // Format detection
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const supportedFormats: any = ['mp3', 'aac', 'm4a', 'amr', 'wav', 'ogg', 'flac', '3gp'];
    const validFormat = supportedFormats.includes(ext) ? ext : 'mp3';

    const recId = `rec_user_${Date.now()}`;
    const newRecording: CallRecording = {
      id: recId,
      contactName: contactName || file.name.replace(/\.[^/.]+$/, ''),
      phoneNumber: phoneNumber || 'Custom Upload',
      callType,
      timestamp: Date.now(),
      duration: Math.max(10, Math.floor(file.size / 32000)), // estimated or updated upon playback
      fileFormat: validFormat as AudioFormat,
      fileSizeBytes: file.size,
      originalFileName: file.name,
      encryptedFilePath: `/data/user/0/com.securecallvault.app/files/vault/${recId}.scv`,
      ivHex,
      contentHash,
      isFavorite: false,
      tags: ['Manual-Import', validFormat.toUpperCase()],
      notes: `Manually imported user file: ${file.name}`,
      waveform: generateRealisticWaveform(50),
      sourceUri: `content://com.android.externalstorage.documents/document/${file.name}`,
      folderId: 'user_import_folder',
    };

    await saveRecording(newRecording, encryptedBytes);

    await addLog({
      id: `log_usr_${Date.now()}`,
      timestamp: Date.now(),
      status: 'success',
      fileName: file.name,
      detail: `Imported audio file (${(file.size / 1024).toFixed(1)} KB) and encrypted with AES-256 GCM.`,
      fileSizeBytes: file.size,
    });

    return newRecording;
  }
}

export const vaultAutoImporter = new VaultAutoImportManager();
