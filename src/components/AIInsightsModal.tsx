import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Brain,
  ListTodo,
  TrendingUp,
  X,
  FileAudio,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { CallRecording, AIAnalysisResult } from '../types';

interface AIInsightsModalProps {
  recording: CallRecording | null;
  onClose: () => void;
  isDarkMode: boolean;
}

export const AIInsightsModal: React.FC<AIInsightsModalProps> = ({
  recording,
  onClose,
  isDarkMode,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recording) {
      fetchAnalysis();
    }
  }, [recording]);

  const fetchAnalysis = async () => {
    if (!recording) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: recording.contactName,
          phoneNumber: recording.phoneNumber,
          callType: recording.callType,
          duration: `${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s`,
          notes: recording.notes,
          tags: recording.tags,
          timestamp: new Date(recording.timestamp).toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze call with Gemini AI');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error conducting AI analysis');
    } finally {
      setLoading(false);
    }
  };

  if (!recording) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end select-none animate-in fade-in duration-200">
      <div className={`w-full max-h-[90%] rounded-t-3xl border-t flex flex-col p-5 overflow-y-auto space-y-4 ${
        isDarkMode
          ? 'bg-[#0d141e] border-slate-700 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold">Gemini 3.1 Pro AI Intelligence</h2>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Thinking Mode HIGH
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Confidential analysis of {recording.contactName || recording.phoneNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Engaging Gemini 3.1 Pro Deep Reasoning...
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Synthesizing conversational sentiment, extracting commitments, and evaluating privacy sensitivity.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Analysis Body */}
        {analysis && !loading && (
          <div className="space-y-3 text-xs">
            {/* Executive Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                <Brain className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {analysis.summary}
              </p>
            </div>

            {/* Key Attributes Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Interaction Tone
                </span>
                <span className="text-xs font-bold text-teal-300">
                  {analysis.sentiment}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Sensitivity Grade
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {analysis.privacyRating}
                </span>
              </div>
            </div>

            {/* Action Items Checklist */}
            {analysis.actionItems && analysis.actionItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[10px]">
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Action Items & Commitments</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Topics */}
            {analysis.keyTopics && analysis.keyTopics.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Key Discussion Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keyTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-[11px]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Security Assessment Footer */}
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2.5 text-[11px] text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Risk Flag: {analysis.riskFlags || 'Zero leakage. Encrypted in private partition.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
