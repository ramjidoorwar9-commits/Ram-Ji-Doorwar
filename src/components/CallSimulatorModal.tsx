import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  X,
  Clock,
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { vaultAutoImporter, SimulatedCall } from '../services/callSimulation';

interface CallSimulatorModalProps {
  onClose: () => void;
  onRefreshRecordings: () => void;
  isDarkMode: boolean;
}

type CallPhase = 'dialing' | 'ringing' | 'active' | 'ended' | 'scanning' | 'done';

export const CallSimulatorModal: React.FC<CallSimulatorModalProps> = ({
  onClose,
  onRefreshRecordings,
  isDarkMode,
}) => {
  const [phase, setPhase] = useState<CallPhase>('ringing');
  const [contactName, setContactName] = useState('Sarah Jenkins');
  const [phoneNumber, setPhoneNumber] = useState('+1 (415) 890-2341');
  const [callType, setCallType] = useState<'incoming' | 'outgoing'>('incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [statusMessage, setStatusMessage] = useState('');

  // Call timer during active call
  useEffect(() => {
    let interval: any = null;
    if (phase === 'active') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerCall = () => {
    setPhase('active');
  };

  const handleEndCall = async () => {
    setPhase('ended');
    const finalDuration = Math.max(8, callDuration);

    const simulatedCall: SimulatedCall = {
      contactName,
      phoneNumber,
      callType,
      duration: finalDuration,
      fileName: `Call_${contactName.replace(/\s+/g, '')}_${Date.now()}.m4a`,
    };

    setPhase('scanning');
    setStatusMessage('TelephonyManager detected call-end. Enqueueing WorkManager delayed scan...');

    // Trigger auto importer
    await vaultAutoImporter.handleCallEndTrigger(simulatedCall);

    // Watch auto importer progress
    const unsub = vaultAutoImporter.subscribe((state) => {
      setStatusMessage(state.currentStepMessage);
      setCountdown(state.delayRemaining);

      if (state.status === 'completed') {
        setPhase('done');
        onRefreshRecordings();
        unsub();
      }
    });
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col justify-between p-6 select-none animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Android Telephony Simulator
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Phone Display */}
      {phase === 'ringing' && (
        <div className="flex flex-col items-center my-auto text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-500/50 flex items-center justify-center text-3xl font-bold text-white shadow-2xl animate-pulse">
              {contactName.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-30" />
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">{contactName}</h3>
            <p className="text-sm font-mono text-slate-400 mt-0.5">{phoneNumber}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Incoming Call...
            </span>
          </div>
        </div>
      )}

      {phase === 'active' && (
        <div className="flex flex-col items-center my-auto text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-emerald-950 border-2 border-emerald-400/50 flex items-center justify-center text-3xl font-bold text-emerald-300 shadow-2xl">
            {contactName.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">{contactName}</h3>
            <p className="text-sm font-mono text-slate-400 mt-0.5">{phoneNumber}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-base font-bold text-emerald-400">
                {formatTimer(callDuration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-2xl border transition-all ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="p-3 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {(phase === 'scanning' || phase === 'done') && (
        <div className="flex flex-col items-center my-auto text-center space-y-4 p-4 max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center relative">
            {phase === 'scanning' ? (
              <Shield className="w-10 h-10 text-emerald-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              {phase === 'scanning' ? 'Processing Call Recording' : 'Recording Secured in Vault!'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {statusMessage || 'Analyzing SAF directory & applying AES-256 GCM encryption.'}
            </p>
          </div>

          {phase === 'done' && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all"
            >
              View in Vault
            </button>
          )}
        </div>
      )}

      {/* Bottom Call Action Buttons */}
      {phase === 'ringing' && (
        <div className="flex items-center justify-around pb-4">
          <button
            onClick={() => {
              setPhase('ended');
              setTimeout(onClose, 500);
            }}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
            title="Decline"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button
            onClick={handleAnswerCall}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
            title="Answer"
          >
            <PhoneCall className="w-7 h-7" />
          </button>
        </div>
      )}

      {phase === 'active' && (
        <div className="flex items-center justify-center pb-4">
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      )}

      {phase !== 'ringing' && phase !== 'active' && <div />}
    </div>
  );
};
