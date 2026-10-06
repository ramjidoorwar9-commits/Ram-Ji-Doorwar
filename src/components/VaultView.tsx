import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Play,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Trash2,
  Download,
  Tag,
  Mic,
  MoreVertical,
  X,
  FileAudio,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { CallRecording } from '../types';

interface VaultViewProps {
  recordings: CallRecording[];
  onPlayRecording: (recording: CallRecording) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteRecording: (id: string) => void;
  onAIAnalyze: (recording: CallRecording) => void;
  onUpdateMeta: (id: string, tags: string[], notes: string) => void;
  onOpenCallSim: () => void;
  isDarkMode: boolean;
}

type TimeFilter = 'all' | 'favorites' | 'today' | 'yesterday' | 'week' | 'month' | 'incoming' | 'outgoing';

export const VaultView: React.FC<VaultViewProps> = ({
  recordings,
  onPlayRecording,
  onToggleFavorite,
  onDeleteRecording,
  onAIAnalyze,
  onUpdateMeta,
  onOpenCallSim,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingRecording, setEditingRecording] = useState<CallRecording | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTagsStr, setEditTagsStr] = useState('');

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    recordings.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [recordings]);

  // Filtered recordings
  const filteredRecordings = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfWeek = startOfToday - 86400000 * 7;
    const startOfMonth = startOfToday - 86400000 * 30;

    return recordings.filter((rec) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = rec.contactName.toLowerCase().includes(query);
        const matchesPhone = rec.phoneNumber.toLowerCase().includes(query);
        const matchesNotes = rec.notes.toLowerCase().includes(query);
        const matchesTags = rec.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesPhone && !matchesNotes && !matchesTags) return false;
      }

      // Filter category
      if (activeFilter === 'favorites' && !rec.isFavorite) return false;
      if (activeFilter === 'today' && rec.timestamp < startOfToday) return false;
      if (activeFilter === 'yesterday' && (rec.timestamp < startOfYesterday || rec.timestamp >= startOfToday)) return false;
      if (activeFilter === 'week' && rec.timestamp < startOfWeek) return false;
      if (activeFilter === 'month' && rec.timestamp < startOfMonth) return false;
      if (activeFilter === 'incoming' && rec.callType !== 'incoming') return false;
      if (activeFilter === 'outgoing' && rec.callType !== 'outgoing') return false;

      // Tag match
      if (selectedTag && !rec.tags.includes(selectedTag)) return false;

      return true;
    });
  }, [recordings, searchQuery, activeFilter, selectedTag]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleStartEdit = (rec: CallRecording) => {
    setEditingRecording(rec);
    setEditNotes(rec.notes || '');
    setEditTagsStr(rec.tags.join(', '));
  };

  const handleSaveEdit = () => {
    if (editingRecording) {
      const parsedTags = editTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      onUpdateMeta(editingRecording.id, parsedTags, editNotes);
      setEditingRecording(null);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      {/* Search Header */}
      <div className="p-3 pb-2 space-y-2.5 shrink-0 border-b border-slate-800/60">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts, numbers, notes, tags..."
            className={`w-full pl-9 pr-9 py-2 rounded-2xl text-xs outline-none border transition-all ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 focus:border-emerald-500 text-white placeholder-slate-500'
                : 'bg-white border-slate-200 focus:border-emerald-500 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Past Week' },
            { id: 'incoming', label: 'Incoming' },
            { id: 'outgoing', label: 'Outgoing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as TimeFilter)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tags Row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
            <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium mr-1">
              <Tag className="w-3 h-3 text-emerald-400" />
              Tags:
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all shrink-0 ${
                  selectedTag === tag
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700/60'
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-slate-400 hover:text-white px-1 underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recordings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredRecordings.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <FileAudio className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">No Recordings Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                {searchQuery || activeFilter !== 'all' || selectedTag
                  ? 'No call recordings match your current filters.'
                  : 'Your encrypted vault is currently empty.'}
              </p>
            </div>
            <button
              onClick={onOpenCallSim}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Simulate & Import A Call
            </button>
          </div>
        ) : (
          filteredRecordings.map((rec) => (
            <div
              key={rec.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 space-y-2.5 ${
                isDarkMode
                  ? 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
              }`}
            >
              {/* Top Row: Avatar, Caller Name, Duration, Star */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-emerald-300 border border-slate-700/80 shadow-inner">
                      {rec.contactName ? rec.contactName.slice(0, 2).toUpperCase() : 'CO'}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border ${
                        isDarkMode ? 'border-slate-900' : 'border-white'
                      } ${
                        rec.callType === 'incoming'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-sky-500 text-slate-950'
                      }`}
                    >
                      {rec.callType === 'incoming' ? (
                        <ArrowDownLeft className="w-2.5 h-2.5 stroke-[3]" />
                      ) : (
                        <ArrowUpRight className="w-2.5 h-2.5 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">
                      {rec.contactName || rec.phoneNumber}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {rec.phoneNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {formatDuration(rec.duration)}
                  </span>
                  <button
                    onClick={() => onToggleFavorite(rec.id)}
                    className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        rec.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Waveform Visualization Preview */}
              <div
                onClick={() => onPlayRecording(rec)}
                className="h-7 w-full bg-slate-950/50 rounded-xl px-2 flex items-center gap-[2px] cursor-pointer hover:bg-slate-950 transition-colors"
                title="Click to play recording"
              >
                {rec.waveform.slice(0, 48).map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-full bg-emerald-500/60 hover:bg-emerald-400 transition-colors"
                    style={{ height: `${Math.max(15, val * 100)}%` }}
                  />
                ))}
              </div>

              {/* Tags & Note snippet */}
              {(rec.tags.length > 0 || rec.notes) && (
                <div className="space-y-1 text-[11px]">
                  {rec.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {rec.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.2 rounded bg-slate-800 text-emerald-300 border border-slate-700 text-[10px]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  {rec.notes && (
                    <p className="text-slate-400 line-clamp-1 italic text-[10px]">
                      "{rec.notes}"
                    </p>
                  )}
                </div>
              )}

              {/* Card Bottom Meta & Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>{new Date(rec.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  <span>•</span>
                  <span className="font-mono">{formatBytes(rec.fileSizeBytes)}</span>
                  <span>•</span>
                  <span className="uppercase font-bold text-slate-400">{rec.fileFormat}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(rec)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Edit Notes & Tags"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onAIAnalyze(rec)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400"
                    title="Analyze with Gemini AI"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteRecording(rec.id)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                    title="Secure Shred & Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onPlayRecording(rec)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all ml-1 shadow-sm shadow-emerald-500/20"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Tags & Notes Modal Sheet */}
      {editingRecording && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end">
          <div className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-4 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit Recording Metadata</h3>
              <button
                onClick={() => setEditingRecording(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={editTagsStr}
                onChange={(e) => setEditTagsStr(e.target.value)}
                placeholder="e.g. Legal, Contract, Follow-up"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Vault Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                placeholder="Add confidential discussion notes..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRecording(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:brightness-110"
              >
                Save Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
