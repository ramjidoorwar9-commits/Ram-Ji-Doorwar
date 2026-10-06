import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Volume2,
  ChevronDown,
  Sparkles,
  Download,
  Share2,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  Maximize2,
} from 'lucide-react';
import { CallRecording } from '../types';
import { vaultPlayer } from '../services/audioPlayer';

interface SpotifyPlayerViewProps {
  currentRecording: CallRecording | null;
  onClose: () => void;
  onAIAnalyze: (recording: CallRecording) => void;
  isDarkMode: boolean;
}

export const SpotifyPlayerView: React.FC<SpotifyPlayerViewProps> = ({
  currentRecording,
  onClose,
  onAIAnalyze,
  isDarkMode,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [freqBars, setFreqBars] = useState<number[]>(new Array(16).fill(20));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsub = vaultPlayer.subscribe(() => {
      setIsPlaying(vaultPlayer.state === 'playing');
      setCurrentTime(vaultPlayer.currentTime);
      setDuration(vaultPlayer.duration || currentRecording?.duration || 0);
      setSpeed(vaultPlayer.getSpeed());
      setIsLooping(vaultPlayer.getIsLooping());

      // Get real audio frequency data
      const freqs = vaultPlayer.getFrequencyData();
      if (freqs && freqs.length > 0) {
        const step = Math.floor(freqs.length / 16);
        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = freqs[i * step] || 0;
          bars.push(Math.max(15, Math.floor((val / 255) * 100)));
        }
        setFreqBars(bars);
      }
    });

    return () => unsub();
  }, [currentRecording]);

  if (!currentRecording) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = pos * (duration || 1);
    vaultPlayer.seek(target);
  };

  const toggleSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    vaultPlayer.setSpeed(nextSpeed);
    setSpeed(nextSpeed);
  };

  const toggleLoop = () => {
    const loop = vaultPlayer.toggleLoop();
    setIsLooping(loop);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mini Player Bar View
  if (!isExpanded) {
    return (
      <div className={`w-full px-3 py-2 border-t flex items-center justify-between gap-3 select-none z-30 transition-all ${
        isDarkMode
          ? 'bg-slate-900/95 border-emerald-500/30 backdrop-blur-xl'
          : 'bg-white/95 border-emerald-500/30 backdrop-blur-xl shadow-lg'
      }`}>
        {/* Progress Line on top */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-slate-800">
          <div
            className="h-full bg-emerald-400 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Caller Avatar & Name (Click to expand) */}
        <div
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
        >
          <div className="relative shrink-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-xs text-slate-950 shadow-md ${
              isPlaying ? 'animate-pulse' : ''
            }`}>
              {currentRecording.contactName ? currentRecording.contactName.slice(0, 2).toUpperCase() : 'CO'}
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold truncate text-slate-100">
              {currentRecording.contactName || currentRecording.phoneNumber}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold uppercase">{currentRecording.fileFormat}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAIAnalyze(currentRecording)}
            className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
            title="AI Call Insights"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={() => vaultPlayer.togglePlayPause()}
            className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/30 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 text-slate-400 hover:text-white"
            title="Expand Full Spotify Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full-Screen Spotify Style Player Sheet
  return (
    <div className="absolute inset-0 bg-[#09101a] text-slate-100 z-50 flex flex-col justify-between p-5 select-none animate-in slide-in-from-bottom duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase block">
            AES-256 Hardware Stream
          </span>
          <span className="text-xs font-semibold text-slate-300">
            Secure Call Vault
          </span>
        </div>

        <button
          onClick={() => onAIAnalyze(currentRecording)}
          className="p-2 rounded-full hover:bg-slate-800 text-emerald-400 transition-colors"
          title="AI Intelligence"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Center Artwork / Caller Hologram & Equalizer */}
      <div className="flex flex-col items-center my-auto py-2">
        {/* Glowing Vinyl / Hologram disc */}
        <div className="relative w-48 h-48 rounded-full p-2 bg-gradient-to-tr from-slate-800 via-slate-900 to-emerald-950 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex items-center justify-center">
          <div className={`w-40 h-40 rounded-full bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-extrabold text-2xl text-slate-950 shadow-lg">
              {currentRecording.contactName ? currentRecording.contactName.slice(0, 2).toUpperCase() : 'CO'}
            </div>
            <div className="absolute inset-0 border-4 border-dashed border-emerald-500/20 rounded-full pointer-events-none" />
          </div>
        </div>

        {/* Live Equalizer Frequencies */}
        <div className="h-8 flex items-end gap-1 mt-6">
          {freqBars.map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-emerald-600 to-teal-300 transition-all duration-75"
              style={{ height: isPlaying ? `${h}%` : '20%' }}
            />
          ))}
        </div>

        {/* Caller Details */}
        <div className="text-center mt-4">
          <h2 className="text-lg font-bold tracking-tight text-white">
            {currentRecording.contactName || currentRecording.phoneNumber}
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            {currentRecording.phoneNumber}
          </p>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currentRecording.callType.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
              {currentRecording.fileFormat}
            </span>
          </div>
        </div>
      </div>

      {/* Waveform Scrubber Section */}
      <div className="space-y-2 px-1">
        {/* Interactive Waveform Bars */}
        <div
          onClick={handleSeek}
          className="h-10 w-full flex items-center gap-[2px] cursor-pointer group py-1"
        >
          {currentRecording.waveform.slice(0, 50).map((v, i) => {
            const barPosPercent = (i / 50) * 100;
            const isPassed = barPosPercent <= progressPercent;

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isPassed
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : 'bg-slate-700/60 group-hover:bg-slate-600'
                }`}
                style={{ height: `${Math.max(20, v * 100)}%` }}
              />
            );
          })}
        </div>

        {/* Timers */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Spotify Player Controls */}
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center justify-between px-2">
          {/* Speed Button */}
          <button
            onClick={toggleSpeed}
            className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold border border-slate-700 transition-all active:scale-95"
            title="Playback Speed"
          >
            {speed}x
          </button>

          {/* Skip -10s */}
          <button
            onClick={() => vaultPlayer.seek(currentTime - 10)}
            className="p-2 text-slate-300 hover:text-white transition-colors"
            title="Rewind 10 seconds"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Main Play/Pause Button */}
          <button
            onClick={() => vaultPlayer.togglePlayPause()}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-slate-950" />
            ) : (
              <Play className="w-7 h-7 fill-slate-950 ml-1" />
            )}
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => vaultPlayer.seek(currentTime + 10)}
            className="p-2 text-slate-300 hover:text-white transition-colors"
            title="Forward 10 seconds"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          {/* Repeat Button */}
          <button
            onClick={toggleLoop}
            className={`p-2 transition-colors ${
              isLooping ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Loop Playback"
          >
            {isLooping ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-around pt-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => onAIAnalyze(currentRecording)}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Call Summary</span>
          </button>

          <button
            onClick={() => {
              alert('Decrypted audio copy can be exported securely with PIN authorization.');
            }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export Decrypted</span>
          </button>
        </div>
      </div>
    </div>
  );
};
