import React, { useEffect, useRef, useState } from 'react';
import { CircleHelp, History, Menu } from 'lucide-react';

export default function Navbar({
  activeTabTitle,
  setActiveTab,
  setMobileOpen,
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef(null);

  useEffect(() => {
    if (!helpOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!helpRef.current?.contains(event.target)) {
        setHelpOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setHelpOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [helpOpen]);

  return (
    <header className="sticky top-0 z-20 h-16 bg-charcoal-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            {activeTabTitle}
          </h2>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          aria-label="Recent Documents"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-700/60 bg-charcoal-800 px-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-teal-500/30 hover:bg-charcoal-700/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:px-3"
        >
          <History className="h-4 w-4 text-teal-300" aria-hidden="true" />
          <span className="hidden sm:inline">Recent Documents</span>
        </button>

        <div className="group relative" ref={helpRef}>
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            aria-label="Help"
            aria-expanded={helpOpen}
            aria-controls="header-help-popover"
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-700/60 bg-charcoal-800 px-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-teal-500/30 hover:bg-charcoal-700/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:px-3"
          >
            <CircleHelp className="h-4 w-4 text-teal-300" aria-hidden="true" />
            <span className="hidden sm:inline">Help</span>
          </button>
          {helpOpen && (
            <div
              id="header-help-popover"
              className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-700/80 bg-charcoal-900 p-4 shadow-2xl shadow-black/40"
            >
              <h3 className="text-sm font-semibold text-white">How it works</h3>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
                <li><span className="font-medium text-teal-300">1.</span> Upload Document</li>
                <li><span className="font-medium text-teal-300">2.</span> Select Analysis Options</li>
                <li><span className="font-medium text-teal-300">3.</span> Analyze with AI</li>
                <li><span className="font-medium text-teal-300">4.</span> Review Results</li>
              </ol>
              <p className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-400">
                Ready to begin?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false);
                    setActiveTab('upload');
                  }}
                  className="font-semibold text-teal-300 underline decoration-teal-500/40 underline-offset-2 hover:text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                >
                  Go to Upload &amp; Analyze
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
