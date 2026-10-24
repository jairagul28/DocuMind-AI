import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  X,
  Sliders,
  Settings2,
  FileCheck,
  Info,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  uploadDocument,
  analyzeDocument,
  fetchSampleList,
  loadSampleDocument,
} from '../services/api';

export default function UploadDocumentView({
  onAnalysisComplete,
}) {
  // Configuration options
  const [summaryStyle, setSummaryStyle] = useState('detailed'); // brief, detailed, bullet_points
  const [analysisLevel, setAnalysisLevel] = useState('standard'); // basic, standard, detailed
  const [fields, setFields] = useState({
    name: true,
    email: true,
    phone: true,
    skills: true,
    education: true,
    work_experience: true,
    projects: true,
    certifications: true,
  });

  // Upload & Document state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Sample documents
  const [samples, setSamples] = useState([]);
  const [loadingSampleKey, setLoadingSampleKey] = useState(null);

  const fileInputRef = useRef(null);
  const allowedExtensions = ['.pdf', '.txt'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

  useEffect(() => {
    async function loadSamples() {
      const res = await fetchSampleList();
      if (res.success) {
        setSamples(res.samples);
      }
    }
    loadSamples();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setFileError(null);
    setAnalysisError(null);
    setUploadedDoc(null);

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setFileError(`Unsupported format "${ext}". Supported formats are PDF (.pdf) and TXT (.txt).`);
      return;
    }

    if (file.size > maxSizeBytes) {
      setFileError(`File exceeds maximum permitted size of 10 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setSelectedFile(file);

    // Auto-upload and parse with PyMuPDF / text parser
    setIsUploading(true);
    const res = await uploadDocument(file);
    setIsUploading(false);

    if (res.success) {
      setUploadedDoc(res.data);
    } else {
      setFileError(res.error);
      setSelectedFile(null);
    }
  };

  const handleSelectSample = async (sampleKey) => {
    setFileError(null);
    setAnalysisError(null);
    setLoadingSampleKey(sampleKey);

    const res = await loadSampleDocument(sampleKey);
    setLoadingSampleKey(null);

    if (res.success) {
      setSelectedFile({ name: res.data.filename, size: res.data.file_size_bytes });
      setUploadedDoc(res.data);
    } else {
      setFileError(res.error);
    }
  };

  const toggleField = (key) => {
    setFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAllFields = (val) => {
    setFields({
      name: val,
      email: val,
      phone: val,
      skills: val,
      education: val,
      work_experience: val,
      projects: val,
      certifications: val,
    });
  };

  const handleRunAnalysis = async () => {
    if (!uploadedDoc) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    const activeFieldsList = Object.keys(fields).filter((k) => fields[k]);
    const config = {
      summary_style: summaryStyle,
      analysis_level: analysisLevel,
      selected_fields: activeFieldsList,
    };

    const res = await analyzeDocument(uploadedDoc.id, config);
    setIsAnalyzing(false);

    if (res.success) {
      // Pass full document with analysis to parent to view results
      const fullDoc = {
        ...uploadedDoc,
        analysis: res.data,
        processing_status: 'analyzed',
      };
      if (onAnalysisComplete) {
        onAnalysisComplete(fullDoc);
      }
    } else {
      setAnalysisError(res.error);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Info */}
      <div className="max-w-3xl">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Document Ingestion & Intelligence Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload PDF or TXT resumes for PyMuPDF text extraction, custom entity targets, and Groq LLM inference.
          </p>
        </div>
      </div>

      {/* Sample Resumes Fast Selector Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Quick Test with Fictional Sample Resumes
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Pre-built test cases</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'complete',
              name: 'Priya Sharma (Complete 100%)',
              desc: 'Senior Architect. All 5 required sections present.',
              badge: '100% Expected',
              color: 'border-teal-500/30 text-teal-300 bg-teal-500/5',
            },
            {
              id: 'missing_contact',
              name: 'David Chen (Missing Email 80%)',
              desc: 'ML Researcher. Intentionally missing Email & Phone.',
              badge: '80% Expected',
              color: 'border-amber-500/30 text-amber-300 bg-amber-500/5',
            },
            {
              id: 'limited_experience',
              name: 'Aisha Patel (Junior Developer)',
              desc: 'Fresh graduate. Strong projects, 1 summer internship.',
              badge: 'Entry-Level',
              color: 'border-sky-500/30 text-sky-300 bg-sky-500/5',
            },
          ].map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample.id)}
              disabled={loadingSampleKey === sample.id || isUploading || isAnalyzing}
              className={`p-3 rounded-xl text-left border transition-all hover:scale-[1.01] ${sample.color} disabled:opacity-50`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{sample.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-charcoal-900 border border-slate-700">
                  {loadingSampleKey === sample.id ? 'Loading...' : sample.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{sample.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Upload Dropzone (7 Cols) + Configuration Options (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone & Document Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-teal-400" />
              Upload Source Document
            </h3>

            {/* Drop area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-teal-400 bg-teal-500/10 scale-[0.99]'
                  : 'border-slate-700/80 hover:border-slate-600 bg-charcoal-900/40 hover:bg-charcoal-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />

              <div className="w-14 h-14 rounded-2xl bg-charcoal-800 border border-slate-700/80 flex items-center justify-center mb-3 shadow-inner text-teal-400 group-hover:scale-105 transition-transform">
                {isUploading ? (
                  <RefreshCw className="w-7 h-7 animate-spin text-teal-400" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>

              <p className="text-sm font-semibold text-slate-200">
                {isUploading ? 'Extracting text with PyMuPDF...' : 'Drag and drop your file here, or browse files'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: PDF, TXT • Maximum file size: 10 MB
              </p>
            </div>

            {/* File Error Notification */}
            {fileError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Analysis Error Notification */}
            {analysisError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Uploaded / Extracted Document State Card */}
            {uploadedDoc && !fileError && (
              <div className="mt-4 p-4 rounded-xl bg-charcoal-800/90 border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white break-all">
                        {uploadedDoc.filename}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(uploadedDoc.file_size_bytes / 1024).toFixed(1)} KB • {uploadedDoc.page_count} page(s) • {uploadedDoc.word_count} words
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUploadedDoc(null);
                      setSelectedFile(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-700 transition-colors"
                    title="Remove document"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scanned / OCR Warning Banner if detected */}
                {uploadedDoc.is_scanned && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadedDoc.warning_message}</span>
                  </div>
                )}

                {/* Extracted Text Snippet Preview */}
                <div className="pt-2 border-t border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Extracted Text Preview (First {uploadedDoc.preview?.length || 0} characters)
                  </span>
                  <div className="p-2.5 rounded-lg bg-charcoal-950/80 font-mono text-xs text-slate-300 max-h-32 overflow-y-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
                    {uploadedDoc.preview || 'No readable text in buffer.'}
                  </div>
                </div>
              </div>
            )}

            {/* Action Button: Run Groq AI Analysis */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {uploadedDoc ? (
                  <span className="text-teal-300 font-medium">Ready for Groq LLM inference</span>
                ) : (
                  <span>Select or upload a document to begin</span>
                )}
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={!uploadedDoc || isAnalyzing}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  uploadedDoc && !isAnalyzing
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-300 hover:from-teal-300 hover:to-cyan-200 text-charcoal-950 shadow-teal-500/20'
                    : 'bg-charcoal-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Groq LLM Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Document with Groq</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Summary Style Selector (Phase 3.A) */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Summary Style
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Configures LLM summary depth and format.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'brief', label: 'Brief', desc: '1-2 concise paragraphs' },
                { id: 'detailed', label: 'Detailed', desc: 'Comprehensive report' },
                { id: 'bullet_points', label: 'Bullet Points', desc: 'Organized bullets' },
              ].map((style) => {
                const isSelected = summaryStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSummaryStyle(style.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-sm shadow-teal-500/10'
                        : 'bg-charcoal-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-charcoal-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{style.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {style.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adaptive Analysis Level (Phase 3.C) */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-teal-400" />
              Adaptive Analysis Level
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Directly modifies Groq prompt depth, entity sensitivity, and uncertainty detection.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'basic', label: 'Basic', desc: 'Essential fields only' },
                { id: 'standard', label: 'Standard', desc: 'Core resume sections' },
                { id: 'detailed', label: 'Detailed', desc: 'Deep insights & uncertainty' },
              ].map((lvl) => {
                const isSelected = analysisLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setAnalysisLevel(lvl.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 shadow-sm shadow-sky-500/10'
                        : 'bg-charcoal-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-charcoal-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{lvl.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {lvl.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Field Selection (Phase 3.D) */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Target Entity Selection
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => selectAllFields(true)}
                  className="text-teal-400 hover:underline text-[11px]"
                >
                  All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => selectAllFields(false)}
                  className="text-slate-400 hover:underline text-[11px]"
                >
                  Clear
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Only selected fields will be extracted into structured JSON:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'name', label: 'Full Name' },
                { id: 'email', label: 'Email Address' },
                { id: 'phone', label: 'Phone Number' },
                { id: 'skills', label: 'Technical Skills' },
                { id: 'education', label: 'Education' },
                { id: 'work_experience', label: 'Work Experience' },
                { id: 'projects', label: 'Projects' },
                { id: 'certifications', label: 'Certifications' },
              ].map((f) => {
                const checked = fields[f.id];
                return (
                  <label
                    key={f.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-charcoal-850 border-teal-500/30 text-slate-100'
                        : 'bg-charcoal-900/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleField(f.id)}
                      className="rounded border-slate-700 bg-charcoal-900 text-teal-500 focus:ring-teal-500/40 w-3.5 h-3.5"
                    />
                    <span className="text-xs font-medium">{f.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
