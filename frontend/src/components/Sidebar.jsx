import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  History,
  Info,
  ChevronRight,
  X,
  BarChart3,
  ScanText,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  hasActiveDocument,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'upload',
      label: 'Upload & Analyze',
      icon: UploadCloud,
    },
    ...(hasActiveDocument
      ? [
          {
            id: 'results',
            label: 'Analysis Results',
            icon: BarChart3,
          },
        ]
      : []),
    {
      id: 'history',
      label: 'Analysis History',
      icon: History,
    },
    {
      id: 'about',
      label: 'About Platform',
      icon: Info,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-charcoal-900 border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-1 ring-white/20">
            <svg
              className="w-6 h-6 text-charcoal-950"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              DocuMind <span className="text-teal-400 text-xs px-1.5 py-0.5 rounded bg-teal-500/10 font-semibold border border-teal-500/20">AI</span>
            </h1>
            <p className="text-xs text-slate-400">Document Intelligence</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Platform Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-charcoal-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span className="text-left font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-400" />}
            </button>
          );
        })}
      </div>

      {/* Product branding */}
      <div className="p-4 m-4 rounded-xl glass-panel-subtle border border-teal-500/15">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-300">
            <ScanText className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-white">DocuMind AI</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Intelligent Document Analysis
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-teal-300/90">
          Upload. Understand. Extract. Visualize.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-full h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
