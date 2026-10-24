import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Download,
  ArrowLeft,
  Sparkles,
  Cpu,
  Clock,
  BookOpen,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Tag,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DocumentResultsView({
  document,
  onBack,
  onReanalyze,
  isAnalyzing,
}) {
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [selectedViewTab, setSelectedViewTab] = useState('insights'); // 'insights', 'entities', 'json'

  if (!document) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <p>No document selected.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-charcoal-800 text-white rounded-xl text-xs font-semibold"
        >
          Back to List
        </button>
      </div>
    );
  }

  const analysis = document.analysis;
  const structuredData = analysis?.structured_data || {};
  const completeness = analysis?.completeness || {
    completeness_percentage: 0,
    present_required_fields: [],
    missing_required_fields: [],
    uncertain_fields: [],
  };

  const copyJSONToClipboard = () => {
    if (!analysis) return;
    const jsonStr = JSON.stringify(structuredData, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const downloadJSONFile = () => {
    if (!analysis) return;
    const jsonStr = JSON.stringify(structuredData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.filename.replace(/\.[^/.]+$/, '')}_documind_extracted.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Prepare Chart Data from Actual Extracted Information
  // 1. Available vs Missing Fields Pie Data
  const presentCount = completeness.present_required_fields?.length || 0;
  const missingCount = completeness.missing_required_fields?.length || 0;
  const fieldPresenceData = [
    { name: 'Present Required', value: presentCount, color: '#14b8a6' },
    { name: 'Missing Required', value: missingCount, color: '#f43f5e' },
  ];

  // 2. Skills Categorization Breakdown (Derived from real extracted skills)
  const skillsList = structuredData.skills || [];
  const categorizedSkills = {
    'Languages & Core': 0,
    'Frameworks & Web': 0,
    'Cloud & DevOps': 0,
    'AI, ML & Data': 0,
    'Databases & Storage': 0,
    'Other Tools': 0,
  };

  const langKeywords = ['python', 'javascript', 'typescript', 'go', 'golang', 'c++', 'c#', 'java', 'rust', 'ruby', 'sql', 'bash', 'r', 'html', 'css'];
  const webKeywords = ['react', 'fastapi', 'next', 'node', 'express', 'tailwind', 'vue', 'angular', 'django', 'flask'];
  const cloudKeywords = ['aws', 'kubernetes', 'docker', 'terraform', 'cloud', 'ci/cd', 'git', 'linux', 'eks', 'lambda', 's3'];
  const aiKeywords = ['llm', 'groq', 'nlp', 'pytorch', 'tensorflow', 'machine learning', 'ai', 'transformers', 'hugging face', 'langchain', 'rag', 'deep learning'];
  const dbKeywords = ['mongodb', 'postgres', 'postgresql', 'redis', 'elasticsearch', 'mysql', 'sqlite', 'kafka'];

  skillsList.forEach((skill) => {
    const s = skill.toLowerCase();
    if (aiKeywords.some((k) => s.includes(k))) categorizedSkills['AI, ML & Data'] += 1;
    else if (cloudKeywords.some((k) => s.includes(k))) categorizedSkills['Cloud & DevOps'] += 1;
    else if (dbKeywords.some((k) => s.includes(k))) categorizedSkills['Databases & Storage'] += 1;
    else if (webKeywords.some((k) => s.includes(k))) categorizedSkills['Frameworks & Web'] += 1;
    else if (langKeywords.some((k) => s.includes(k))) categorizedSkills['Languages & Core'] += 1;
    else categorizedSkills['Other Tools'] += 1;
  });

  const skillsChartData = Object.keys(categorizedSkills)
    .filter((cat) => categorizedSkills[cat] > 0)
    .map((cat) => ({
      category: cat,
      count: categorizedSkills[cat],
    }));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyJSONToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
          >
            {copiedJSON ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedJSON ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={downloadJSONFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={() => onReanalyze(document.id)}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-charcoal-950 text-xs font-semibold shadow-md shadow-teal-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Re-run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Document Hero Overview Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mt-1">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {document.filename}
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded uppercase bg-charcoal-850 text-teal-300 border border-teal-500/30">
                  {document.file_type}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {document.processing_status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span>Size: {(document.file_size_bytes / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>Pages: {document.page_count}</span>
                <span>•</span>
                <span>Words: {document.word_count}</span>
                <span>•</span>
                <span>Uploaded: {new Date(document.upload_timestamp).toLocaleDateString()}</span>
                {analysis?.execution_time_ms && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-teal-400">
                      <Clock className="w-3 h-3" />
                      Inference: {analysis.execution_time_ms}ms
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Model Badge */}
          <div className="flex md:flex-col items-end gap-1 text-right">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-charcoal-850 border border-slate-800 text-xs font-mono text-slate-300">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>{analysis?.model_used || 'Groq Engine'}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Style: <span className="text-slate-300 font-medium capitalize">{analysis?.summary_style || 'Detailed'}</span> • Level: <span className="text-slate-300 font-medium capitalize">{analysis?.analysis_level || 'Standard'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Completeness Scoring Banner (Phase 4.B) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-charcoal-900/90 via-charcoal-900/60 to-charcoal-850/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Deterministic Completeness Scoring
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                Formula: (Present / 5) × 100
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {completeness.explanation ||
                'Measures the presence of standard required resume fields (Name, Email, Skills, Education, and Work Experience).'}
            </p>

            {/* Field Presence Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {['Name', 'Email', 'Skills', 'Education', 'Work Experience'].map((field) => {
                const isPresent = completeness.present_required_fields?.includes(field);
                return (
                  <span
                    key={field}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                      isPresent
                        ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {isPresent ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>{field}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Completeness Gauge */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-charcoal-950/80 border border-slate-800 min-w-[160px]">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {completeness.completeness_percentage}%
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-1">
              Document Completeness
            </span>
            <div className="w-full bg-charcoal-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-cyan-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${completeness.completeness_percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Section (Phase 3.A) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          AI Executive Summary ({analysis?.summary_style || 'Detailed'})
        </h3>

        <div className="bg-charcoal-900/60 rounded-xl p-4 border border-slate-800/80 text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
          {analysis?.ai_summary || 'No AI summary generated.'}
        </div>
      </div>

      {/* Section View Selector: Insights / Entities / JSON */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'insights', label: 'Visual Insights & Charts', icon: BarChart3 },
          { id: 'entities', label: 'Extracted Entity Cards', icon: BookOpen },
          { id: 'json', label: 'Structured JSON', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedViewTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedViewTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-charcoal-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Visual Insights (Phase 4.A Recharts) */}
      {selectedViewTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Skills Breakdown Chart */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              Extracted Skills Categorization
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Real count of extracted technical skills categorized across development domains ({skillsList.length} total).
            </p>

            {skillsChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="category"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0d1117',
                        borderColor: '#30363d',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f0f6fc',
                      }}
                    />
                    <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No specific skills list extracted for charting.
              </div>
            )}
          </div>

          {/* Required Fields Presence Pie Chart */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              Required Fields Completeness
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Standard 5-section checklist representation.
            </p>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fieldPresenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fieldPresenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1117',
                      borderColor: '#30363d',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f0f6fc',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Extracted Entity Cards (Phase 3.B) */}
      {selectedViewTab === 'entities' && (
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Candidate Name</span>
              <p className="text-sm font-bold text-white mt-1">
                {structuredData.name || <span className="text-rose-400 italic font-normal">Not detected</span>}
              </p>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</span>
              <p className="text-sm font-bold text-white mt-1">
                {structuredData.email || <span className="text-rose-400 italic font-normal">Not detected</span>}
              </p>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</span>
              <p className="text-sm font-bold text-white mt-1">
                {structuredData.phone || <span className="text-slate-500 italic font-normal">Not detected</span>}
              </p>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-400" />
              Technical & Professional Skills ({skillsList.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-charcoal-850 text-slate-200 border border-slate-700/80 hover:border-teal-500/40 transition-colors"
                >
                  {skill}
                </span>
              ))}
              {skillsList.length === 0 && (
                <p className="text-xs text-slate-500 italic">No technical skills detected.</p>
              )}
            </div>
          </div>

          {/* Work Experience */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              Work Experience ({structuredData.work_experience?.length || 0})
            </h4>

            <div className="space-y-4">
              {(structuredData.work_experience || []).map((exp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-charcoal-900/60 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h5 className="text-sm font-bold text-white">{exp.title || 'Role'}</h5>
                    <span className="text-xs text-teal-400 font-mono">
                      {exp.start_date || ''} {exp.end_date ? `– ${exp.end_date}` : ''}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">
                    {exp.company} {exp.location ? `• ${exp.location}` : ''}
                  </p>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="mt-2.5 space-y-1 text-xs text-slate-400 list-disc list-inside">
                      {exp.responsibilities.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {(!structuredData.work_experience || structuredData.work_experience.length === 0) && (
                <p className="text-xs text-slate-500 italic">No work experience entries detected.</p>
              )}
            </div>
          </div>

          {/* Education & Projects Two-Col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-400" />
                Education History
              </h4>
              <div className="space-y-3">
                {(structuredData.education || []).map((edu, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-charcoal-900/60 border border-slate-800">
                    <h5 className="text-xs font-bold text-white">{edu.institution}</h5>
                    <p className="text-xs text-teal-300 mt-0.5">
                      {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Graduation: {edu.graduation_year || 'N/A'} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}
                    </p>
                  </div>
                ))}
                {(!structuredData.education || structuredData.education.length === 0) && (
                  <p className="text-xs text-slate-500 italic">No education entries detected.</p>
                )}
              </div>
            </div>

            {/* Certifications & Key Findings */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Certifications & Key Findings
              </h4>

              <div className="space-y-3">
                {structuredData.certifications && structuredData.certifications.length > 0 && (
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-1.5">
                      Certifications
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {structuredData.certifications.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {structuredData.key_findings && structuredData.key_findings.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-1.5">
                      Key Findings & Insights
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {structuredData.key_findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {structuredData.uncertain_fields && structuredData.uncertain_fields.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-300">
                      <HelpCircle className="w-3.5 h-3.5" /> Uncertain / Ambiguous Details
                    </span>
                    <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside text-amber-200/90">
                      {structuredData.uncertain_fields.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Structured JSON Viewer (Phase 3.B) */}
      {selectedViewTab === 'json' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-teal-400" />
              Validated Pydantic JSON Schema
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={copyJSONToClipboard}
                className="px-3 py-1 rounded-lg bg-charcoal-800 text-xs font-medium text-slate-300 hover:text-white"
              >
                {copiedJSON ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <pre className="bg-charcoal-950 rounded-xl p-4 font-mono text-xs text-teal-300 overflow-x-auto border border-slate-800 max-h-[500px]">
            {JSON.stringify(structuredData, null, 2)}
          </pre>
        </div>
      )}

      {/* Raw Extracted Text Drawer / Toggle */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800">
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Raw Extracted Document Buffer ({document.char_count} characters)</span>
          </div>
          {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRawText && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <pre className="bg-charcoal-950 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 whitespace-pre-wrap max-h-96">
              {document.extracted_text || 'No text extracted.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

