import React from 'react';
import {
  BarChart3,
  Brain,
  FileText,
  ListChecks,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

const features = [
  {
    icon: UploadCloud,
    title: 'Smart Document Upload',
    description: 'Upload PDF and TXT documents for text extraction.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Summarization',
    description: 'Generate brief, detailed and bullet-point summaries.',
  },
  {
    icon: ListChecks,
    title: 'Structured Data Extraction',
    description: 'Identify names, emails, skills, education, experience and more.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Adaptive AI Analysis',
    description: 'Choose Basic, Standard or Detailed analysis and select specific fields.',
  },
  {
    icon: BarChart3,
    title: 'Visual Insights',
    description: 'Explore extracted information through data-driven charts.',
  },
  {
    icon: ShieldCheck,
    title: 'Completeness Analysis',
    description: 'Find missing or uncertain fields and view document completeness scores.',
  },
];

const steps = [
  {
    icon: UploadCloud,
    title: 'Upload Document',
    description: 'Select or drag and drop a PDF or TXT document.',
  },
  {
    icon: FileText,
    title: 'Extract Text',
    description: 'The platform extracts readable document content.',
  },
  {
    icon: Brain,
    title: 'Analyze with AI',
    description: 'AI generates summaries and extracts structured information.',
  },
  {
    icon: BarChart3,
    title: 'Explore Insights',
    description: 'Review extracted fields, completeness scores and visual insights.',
  },
];

export default function AboutView({ onNavigate }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          About DocuMind AI
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
          Transforming documents into meaningful insights with artificial intelligence.
        </p>
      </header>

      <section aria-labelledby="about-intro-heading" className="glass-panel rounded-2xl border border-slate-800 p-5 md:p-7">
        <h2 id="about-intro-heading" className="text-lg font-bold text-white md:text-xl">
          What is DocuMind AI?
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          DocuMind AI is an AI-powered document intelligence platform that transforms PDF and
          text documents into structured, actionable information. It combines document
          extraction, AI-generated summaries, intelligent field identification and visual
          insights in one intuitive workspace.
        </p>
      </section>

      <section aria-labelledby="core-features-heading">
        <div className="mb-4">
          <h2 id="core-features-heading" className="text-lg font-bold text-white md:text-xl">
            Core Features
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="glass-panel flex min-w-0 items-start gap-4 rounded-2xl border border-slate-800 p-5"
            >
              <div className="shrink-0 rounded-xl bg-teal-500/10 p-2.5 text-teal-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading">
        <div className="mb-4">
          <h2 id="how-it-works-heading" className="text-lg font-bold text-white md:text-xl">
            How It Works
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              className="glass-panel min-w-0 rounded-2xl border border-slate-800 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="get-started-heading"
        className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-charcoal-900 to-charcoal-900 p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative">
          <h2 id="get-started-heading" className="text-lg font-bold text-white md:text-xl">
            Ready to analyze your documents?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Upload a document and discover meaningful insights in seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="relative mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 to-cyan-300 px-5 py-2.5 text-sm font-bold text-charcoal-950 shadow-lg shadow-teal-500/15 transition-colors hover:from-teal-300 hover:to-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-900 md:mt-0"
        >
          Upload &amp; Analyze
        </button>
      </section>
    </div>
  );
}
