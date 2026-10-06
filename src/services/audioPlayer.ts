import { CallRecording } from '../types';
import { getDecryptedRecordingAudio } from './storage';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

class VaultAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private currentRecording: CallRecording | null = null;
  private playbackRate: number = 1.0;
  private isLooping: boolean = false;
  private listeners: Set<() => void> = new Set();
  private animFrameId: number | null = null;
  private freqData: Uint8Array = new Uint8Array(32);

  public state: PlayerState = 'idle';
  public currentTime: number = 0;
  public duration: number = 0;
  public errorMessage: string | null = null;

  constructor() {
    // Lazy init
  }

  private initAudio() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement) {
          this.currentTime = this.audioElement.currentTime;
          this.notify();
        }
      });

      this.audioElement.addEventListener('loadedmetadata', () => {
        if (this.audioElement) {
          this.duration = this.audioElement.duration || this.currentRecording?.duration || 0;
          this.notify();
        }
      });

      this.audioElement.addEventListener('play', () => {
        this.state = 'playing';
        this.startVisualizerLoop();
        this.notify();
      });

      this.audioElement.addEventListener('pause', () => {
        this.state = 'paused';
        this.notify();
      });

      this.audioElement.addEventListener('ended', () => {
        this.state = 'ended';
        this.currentTime = this.duration;
        this.notify();
      });

      this.audioElement.addEventListener('error', (e) => {
        this.state = 'error';
        this.errorMessage = 'Audio playback error';
        this.notify();
      });
    }

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

        try {
          this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioCtx.destination);
        } catch {
          // In case already connected
        }
      }
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getCurrentRecording(): CallRecording | null {
    return this.currentRecording;
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser && this.state === 'playing') {
      this.analyser.getByteFrequencyData(this.freqData as any);
    }
    return this.freqData;
  }

  private startVisualizerLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    const loop = () => {
      if (this.state === 'playing') {
        this.notify();
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public async loadAndPlay(recording: CallRecording, pin: string = '1234'): Promise<void> {
    this.initAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.currentRecording = recording;
    this.state = 'loading';
    this.currentTime = 0;
    this.duration = recording.duration;
    this.notify();

    try {
      // Decrypt recording ciphertext from vault
      const decryptedBytes = await getDecryptedRecordingAudio(recording.id, pin);
      if (!decryptedBytes) {
        throw new Error('Encrypted payload not found in vault');
      }

      // Revoke old URL
      if (this.currentObjectUrl) {
        URL.revokeObjectURL(this.currentObjectUrl);
      }

      // Create mime type blob
      const mime = recording.fileFormat === 'mp3' ? 'audio/mpeg' :
                   recording.fileFormat === 'wav' ? 'audio/wav' :
                   recording.fileFormat === 'm4a' ? 'audio/mp4' :
                   'audio/webm';

      const blob = new Blob([decryptedBytes], { type: mime });
      this.currentObjectUrl = URL.createObjectURL(blob);

      if (this.audioElement) {
        this.audioElement.src = this.currentObjectUrl;
        this.audioElement.playbackRate = this.playbackRate;
        this.audioElement.loop = this.isLooping;
        await this.audioElement.play();
        this.state = 'playing';

        // Update MediaSession API (Android Notification & lock screen controls)
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: recording.contactName || recording.phoneNumber,
            artist: `Secure Call Vault • ${recording.callType.toUpperCase()}`,
            album: 'Encrypted Vault Storage (AES-256 GCM)',
            artwork: [
              { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop', sizes: '256x256', type: 'image/jpeg' }
            ]
          });

          navigator.mediaSession.setActionHandler('play', () => this.play());
          navigator.mediaSession.setActionHandler('pause', () => this.pause());
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) this.seek(details.seekTime);
          });
        }
      }
    } catch (err: any) {
      console.error('Audio load error:', err);
      this.state = 'error';
      this.errorMessage = err.message || 'Failed to decrypt and play audio';
    }
    this.notify();
  }

  public async play(): Promise<void> {
    if (this.audioElement && this.state === 'paused') {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      await this.audioElement.play();
      this.state = 'playing';
      this.startVisualizerLoop();
      this.notify();
    }
  }

  public pause(): void {
    if (this.audioElement && this.state === 'playing') {
      this.audioElement.pause();
      this.state = 'paused';
      this.notify();
    }
  }

  public togglePlayPause(): void {
    if (this.state === 'playing') {
      this.pause();
    } else if (this.state === 'paused') {
      this.play();
    }
  }

  public seek(seconds: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.duration));
      this.currentTime = this.audioElement.currentTime;
      this.notify();
    }
  }

  public setSpeed(rate: number): void {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
    this.notify();
  }

  public getSpeed(): number {
    return this.playbackRate;
  }

  public toggleLoop(): boolean {
    this.isLooping = !this.isLooping;
    if (this.audioElement) {
      this.audioElement.loop = this.isLooping;
    }
    this.notify();
    return this.isLooping;
  }

  public getIsLooping(): boolean {
    return this.isLooping;
  }

  public close(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    this.state = 'idle';
    this.currentRecording = null;
    this.currentTime = 0;
    this.notify();
  }
}

export const vaultPlayer = new VaultAudioPlayer();
