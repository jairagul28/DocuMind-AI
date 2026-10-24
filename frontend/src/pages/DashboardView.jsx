import React, { useState, useEffect } from 'react';
import {
  FileText,
  ArrowRight,
  BookOpen,
  BarChart2,
  CheckCircle2,
  Percent,
  Upload,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { fetchDocuments, loadSampleDocument, fetchDocumentById } from '../services/api';

/* ─────────────────────────────────────────────
   Small inline metric card — no external dep
───────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accent = 'teal', isEmpty = false }) {
  const accents = {
    teal: 'text-teal-400 bg-teal-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    indigo: 'text-indigo-400 bg-indigo-500/10',
  };
  const ring = accents[accent] ?? accents.teal;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl shrink-0 ${ring}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
          {label}
        </p>
        <p className={`text-2xl font-extrabold ${isEmpty ? 'text-slate-500' : 'text-white'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────── */
export default function DashboardView({ systemStatus, onNavigate, onSelectDocument }) {
  const [recentDocs, setRecentDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  /* Fetch up to 10 recent docs for metrics + preview list */
  useEffect(() => {
    async function loadRecent() {
      setLoadingDocs(true);
      const res = await fetchDocuments();
      if (res.success) {
        setRecentDocs(res.data.slice(0, 10));
      }
      setLoadingDocs(false);
    }
    loadRecent();
  }, []);

  /* ── Derived metrics from real API data ── */
  const totalDocs = recentDocs.length;

  const analyzedDocs = recentDocs.filter(
    (d) => d.processing_status === 'analyzed' || d.analysis
  );
  const analyzedCount = analyzedDocs.length;

  const completenessValues = analyzedDocs
    .map((d) => d.analysis?.completeness?.completeness_percentage)
    .filter((v) => typeof v === 'number');

  const avgCompleteness =
    completenessValues.length > 0
      ? Math.round(
          completenessValues.reduce((sum, v) => sum + v, 0) / completenessValues.length
        )
      : null;

  /* ── Handlers ── */
  const handleQuickLoadSample = async () => {
    setLoadingSample(true);
    const res = await loadSampleDocument('complete');
    setLoadingSample(false);
    if (res.success) onNavigate('upload');
  };

  const handleOpenDoc = async (docId) => {
    const res = await fetchDocumentById(docId);
    if (res.success && onSelectDocument) onSelectDocument(res.data);
  };

  /* ── Small backend health badge for the welcome card ── */
  const isBackendUp = systemStatus?.backendOnline;

  return (
    <div className="space-y-6">

      {/* ── Welcome / Hero ── */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 md:p-8 border border-slate-800">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            {/* Live status pill */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border ${
                isBackendUp
                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendUp ? 'bg-teal-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {isBackendUp ? 'DocuMind AI — Ready' : 'Backend Offline'}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              AI-Powered Document Intelligence
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Upload your PDF or TXT documents and let DocuMind AI extract structured data,
              generate smart summaries, score completeness, and visualise key insights — all in
              seconds.
            </p>

            {/* Feature chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {['PDF & TXT Upload', 'Groq AI Summaries', 'Field Extraction', 'Completeness Score', 'Visual Charts'].map(
                (f) => (
                  <span
                    key={f}
                    className="px-2.5 py-0.5 rounded-full bg-charcoal-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium"
                  >
                    {f}
                  </span>
                )
              )}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-charcoal-950 bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 transition-all shadow-lg shadow-teal-500/20"
            >
              <Upload className="w-4 h-4" />
              Upload &amp; Analyze
            </button>
            <button
              onClick={handleQuickLoadSample}
              disabled={loadingSample}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-200 bg-charcoal-800/80 hover:bg-charcoal-700 border border-slate-700/60 transition-colors disabled:opacity-60"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              {loadingSample ? 'Loading…' : 'Try Sample Resume'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={loadingDocs ? '—' : String(totalDocs)}
          sub={totalDocs === 0 ? 'Upload your first document to start' : `${totalDocs} document${totalDocs !== 1 ? 's' : ''} stored`}
          accent="teal"
          isEmpty={totalDocs === 0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed Analyses"
          value={loadingDocs ? '—' : String(analyzedCount)}
          sub={
            analyzedCount === 0
              ? 'No analyses yet — upload and analyse a document'
              : `${analyzedCount} of ${totalDocs} analysed by Groq AI`
          }
          accent="cyan"
          isEmpty={analyzedCount === 0}
        />
        <StatCard
          icon={Percent}
          label="Avg. Completeness"
          value={loadingDocs ? '—' : avgCompleteness !== null ? `${avgCompleteness}%` : '—'}
          sub={
            avgCompleteness === null
              ? 'Based on name, email, skills, education & experience'
              : `Across ${completenessValues.length} analysed document${completenessValues.length !== 1 ? 's' : ''}`
          }
          accent="indigo"
          isEmpty={avgCompleteness === null}
        />
      </div>

      {/* ── Recent Documents ── */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            Recent Documents
          </h3>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingDocs ? (
          /* Skeleton rows */
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-charcoal-900/60 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No documents yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click <span className="text-teal-400 font-medium">Upload &amp; Analyze</span> or{' '}
              <span className="text-cyan-400 font-medium">Try Sample Resume</span> above to get
              started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDocs.slice(0, 5).map((doc) => {
              const isAnalyzed = doc.processing_status === 'analyzed' || doc.analysis;
              const completeness = doc.analysis?.completeness?.completeness_percentage;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleOpenDoc(doc.id)}
                  className="p-3 rounded-xl bg-charcoal-900/60 border border-slate-800 hover:border-teal-500/30 hover:bg-charcoal-900/80 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  {/* Left: icon + name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-teal-300 transition-colors">
                        {doc.filename}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {doc.file_size_bytes
                          ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB`
                          : doc.word_count
                          ? `${doc.word_count} words`
                          : ''}{' '}
                        • {doc.file_type?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Right: completeness + status badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isAnalyzed && completeness != null && (
                      <div className="hidden sm:flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-mono text-slate-400">
                          {Math.round(completeness)}%
                        </span>
                      </div>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isAnalyzed
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                          : 'bg-charcoal-850 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isAnalyzed ? 'Analysed' : 'Uploaded'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
