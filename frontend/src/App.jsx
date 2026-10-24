import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './pages/DashboardView';
import UploadDocumentView from './pages/UploadDocumentView';
import DocumentResultsView from './pages/DocumentResultsView';
import AnalysisHistoryView from './pages/AnalysisHistoryView';
import AboutView from './pages/AboutView';
import { fetchHealth, fetchDocuments, analyzeDocument } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const [systemStatus, setSystemStatus] = useState({
    backendOnline: false,
    mongoOnline: false,
    status: 'checking',
    latencyMs: 0,
    details: null,
    error: null,
  });

  const checkSystemHealth = useCallback(async () => {
    const result = await fetchHealth();

    if (result.success) {
      const data = result.data;
      const isMongoConnected = data?.database?.connected === true;
      setSystemStatus({
        backendOnline: true,
        mongoOnline: isMongoConnected,
        status: data.status,
        latencyMs: result.latencyMs,
        details: data,
        error: null,
      });
    } else {
      setSystemStatus({
        backendOnline: false,
        mongoOnline: false,
        status: 'offline',
        latencyMs: result.latencyMs,
        details: null,
        error: result.error,
      });
    }

  }, []);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 15000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  const handleAnalysisComplete = (doc) => {
    setActiveDocument(doc);
    setActiveTab('results');
  };

  const handleSelectDocument = (doc) => {
    setActiveDocument(doc);
    setActiveTab('results');
  };

  const handleReanalyze = async (docId) => {
    if (!docId) return;
    setIsReanalyzing(true);
    const config = {
      summary_style: activeDocument?.analysis?.summary_style || 'detailed',
      analysis_level: activeDocument?.analysis?.analysis_level || 'standard',
      selected_fields: activeDocument?.analysis?.selected_fields || [
        'name',
        'email',
        'phone',
        'skills',
        'education',
        'work_experience',
        'projects',
        'certifications',
      ],
    };

    const res = await analyzeDocument(docId, config);
    setIsReanalyzing(false);

    if (res.success) {
      setActiveDocument((prev) => ({
        ...prev,
        analysis: res.data,
        processing_status: 'analyzed',
      }));
    } else {
      alert(`Re-analysis error: ${res.error}`);
    }
  };

  const tabTitles = {
    dashboard: 'Dashboard',
    upload: 'Upload & Analyze',
    results: 'Analysis Results',
    history: 'Analysis History',
    about: 'About DocuMind AI',
  };

  return (
    <div className="flex min-h-screen bg-charcoal-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        hasActiveDocument={Boolean(activeDocument)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTabTitle={tabTitles[activeTab]}
          setActiveTab={setActiveTab}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* Page Routing */}
          {activeTab === 'dashboard' && (
            <DashboardView
              systemStatus={systemStatus}
              onNavigate={setActiveTab}
              onSelectDocument={handleSelectDocument}
            />
          )}

          {activeTab === 'upload' && (
            <UploadDocumentView
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          {activeTab === 'results' && (
            <DocumentResultsView
              document={activeDocument}
              onBack={() => setActiveTab('history')}
              onReanalyze={handleReanalyze}
              isAnalyzing={isReanalyzing}
            />
          )}

          {activeTab === 'history' && (
            <AnalysisHistoryView
              onNavigate={setActiveTab}
              onSelectDocument={handleSelectDocument}
            />
          )}

          {activeTab === 'about' && <AboutView onNavigate={setActiveTab} />}
        </main>
      </div>
    </div>
  );
}
