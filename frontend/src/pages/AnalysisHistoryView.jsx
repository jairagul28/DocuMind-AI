import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RefreshCw,
  FileText,
  Calendar,
  AlertCircle,
  Inbox,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { fetchDocuments, deleteDocumentById, fetchDocumentById } from '../services/api';

export default function AnalysisHistoryView({
  onNavigate,
  onSelectDocument,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchDocuments();
    if (result.success) {
      setDocuments(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document from your session?')) {
      return;
    }

    setDeletingId(docId);
    const res = await deleteDocumentById(docId);
    setDeletingId(null);

    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } else {
      alert(`Delete failed: ${res.error}`);
    }
  };

  const handleOpenDoc = async (docId) => {
    const res = await fetchDocumentById(docId);
    if (res.success && onSelectDocument) {
      onSelectDocument(res.data);
    } else {
      alert(`Could not load document: ${res.error}`);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = doc.filename?.toLowerCase().includes(query);
    const idMatch = doc.id?.toLowerCase().includes(query);
    const statusMatch = doc.processing_status?.toLowerCase().includes(query);
    return nameMatch || idMatch || statusMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Document Intelligence History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Private to this browser session. Temporary documents may be cleared when the service restarts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-charcoal-800 hover:bg-charcoal-700/80 border border-slate-700/60 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by file name, ID, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-charcoal-900/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto font-mono">
          <span>Total Records:</span>
          <span className="font-semibold text-white px-2 py-0.5 rounded bg-charcoal-850 border border-slate-800">
            {documents.length}
          </span>
        </div>
      </div>

      {/* 1. Loading State */}
      {loading && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center">
          <div className="w-10 h-10 border-3 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-200">
            Loading your private document history...
          </p>
        </div>
      )}

      {/* 2. Error State */}
      {!loading && error && (
        <div className="glass-panel rounded-2xl p-8 border border-rose-500/30 bg-rose-500/5 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-rose-300">
            Failed to Retrieve Documents
          </h3>
          <p className="text-xs text-rose-200/80 mt-1 max-w-md mx-auto">
            {error}.
          </p>
          <button
            onClick={loadDocuments}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-charcoal-800 hover:bg-charcoal-700 border border-slate-700"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && !error && filteredDocs.length === 0 && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-charcoal-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Inbox className="w-8 h-8 text-teal-400/70" />
          </div>

          <h3 className="text-base font-semibold text-white">
            {searchQuery ? 'No Matching Documents Found' : 'No Documents Uploaded Yet'}
          </h3>

          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `No records match query "${searchQuery}".`
              : 'Upload a PDF or TXT resume to extract text, run Groq LLM intelligence analysis, and generate interactive visual insights.'}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-charcoal-950 bg-teal-400 hover:bg-teal-300 transition-colors shadow-md shadow-teal-500/20"
            >
              <span>Upload Document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Populated Document List */}
      {!loading && !error && filteredDocs.length > 0 && (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isAnalyzed = doc.processing_status === 'analyzed' || Boolean(doc.analysis);
            const completenessPercent = doc.analysis?.completeness?.completeness_percentage;

            return (
              <div
                key={doc.id}
                onClick={() => handleOpenDoc(doc.id)}
                className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:translate-y-[-1px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 flex-shrink-0 group-hover:bg-teal-500/20 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                        {doc.filename}
                      </h4>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-charcoal-850 text-slate-400 border border-slate-700">
                        {doc.file_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-1">
                      <span className="font-mono text-[11px]">ID: {doc.id.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{doc.word_count || 0} words</span>
                      <span>•</span>
                      <span>{new Date(doc.upload_timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  {/* Completeness Pill if analyzed */}
                  {isAnalyzed && completenessPercent !== undefined && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono font-semibold">
                      {completenessPercent}% Complete
                    </span>
                  )}

                  {/* Status Pill */}
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      isAnalyzed
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                        : 'bg-charcoal-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isAnalyzed ? 'Analyzed' : 'Uploaded'}
                  </span>

                  {/* Action buttons */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDoc(doc.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800"
                    title="View Results"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-charcoal-800 disabled:opacity-50"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
