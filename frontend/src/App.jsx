import React, { useState, useEffect } from 'react';
import api from './services/api';
import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import ExceptionQueue from './components/ExceptionQueue';
import ExceptionDetail from './components/ExceptionDetail';
import ChatAssistant from './components/ChatAssistant';
import AnalyticsModal from './components/AnalyticsModal';

export default function App() {
  const [exceptions, setExceptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [metrics, setMetrics] = useState(null);
  
  // Filters
  const [activeSeverity, setActiveSeverity] = useState('ALL');
  const [activeStatus, setActiveStatus] = useState('ALL');

  // AI cache state maps per exception
  const [explanations, setExplanations] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [chatHistories, setChatHistories] = useState({});

  // Loading & Error States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isThinkingChat, setIsThinkingChat] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load exceptions and metrics on initial mount
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [exData, metData] = await Promise.all([
        api.getExceptions(),
        api.getMetrics()
      ]);
      setExceptions(exData);
      setMetrics(metData);

      // Select first exception if none selected
      if (exData.length > 0 && !selectedId) {
        setSelectedId(exData[0].id);
      }
    } catch (err) {
      console.error("Failed to load initial workbench data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedException = exceptions.find((item) => item.id === selectedId) || null;

  // Handle Reset Dataset
  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.resetDataset();
      setExplanations({});
      setSuggestions({});
      setChatHistories({});
      setActionError(null);
      await loadData();
    } catch (err) {
      console.error("Failed to reset dataset:", err);
    } finally {
      setIsResetting(false);
    }
  };

  // Trigger AI Explanation
  const handleExplain = async (id) => {
    setIsLoadingAI(true);
    setActionError(null);
    try {
      const res = await api.explainException(id);
      setExplanations((prev) => ({ ...prev, [id]: res }));
    } catch (err) {
      console.error("Failed to generate AI explanation:", err);
      setActionError("Failed to fetch AI explanation. Please check backend connection.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Trigger AI Resolution Suggestion
  const handleSuggestResolution = async (id) => {
    setIsLoadingAI(true);
    setActionError(null);
    try {
      const res = await api.suggestResolution(id);
      setSuggestions((prev) => ({ ...prev, [id]: res }));
    } catch (err) {
      console.error("Failed to suggest resolution:", err);
      setActionError("Failed to fetch resolution recommendation.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Execute Auto-Resolution (Policy Enforced)
  const handleAutoResolve = async (id) => {
    setActionError(null);
    try {
      const updatedItem = await api.autoResolveException(id);
      
      // Update local state
      setExceptions((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );

      // Refresh metrics
      const newMetrics = await api.getMetrics();
      setMetrics(newMetrics);
    } catch (err) {
      const detailMsg = err.response?.data?.detail || "Auto-resolution failed.";
      setActionError(detailMsg);
    }
  };

  // Execute Human Manual Approval Resolution
  const handleResolve = async (id, notes) => {
    setActionError(null);
    try {
      const updatedItem = await api.resolveException(id, notes);

      // Update local state
      setExceptions((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );

      // Refresh metrics
      const newMetrics = await api.getMetrics();
      setMetrics(newMetrics);
    } catch (err) {
      console.error("Failed to resolve exception:", err);
      setActionError("Manual resolution failed.");
    }
  };

  // Handle Contextual Chat Submission
  const handleSendChat = async (message) => {
    if (!selectedId) return;
    setIsThinkingChat(true);

    // Append user message immediately
    const userMsgObj = { sender: 'user', text: message };
    setChatHistories((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), userMsgObj]
    }));

    try {
      const chatRes = await api.chatException(selectedId, message);
      const aiMsgObj = {
        sender: 'ai',
        text: chatRes.reply,
        suggestedActions: chatRes.suggested_actions,
        evidence: chatRes.evidence_highlights
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), aiMsgObj]
      }));
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsgObj = {
        sender: 'ai',
        text: "I encountered an issue retrieving context for this exception."
      };
      setChatHistories((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), errorMsgObj]
      }));
    } finally {
      setIsThinkingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Fixed Header */}
      <Header
        onReset={handleReset}
        onRefresh={loadData}
        onOpenAnalytics={() => setShowAnalytics(true)}
        isResetting={isResetting}
        isRefreshing={isRefreshing}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-8 space-y-6">
        
        {/* KPI Metrics Dashboard Bar */}
        <MetricsBar metrics={metrics} />

        {/* 3-Column Workbench Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Queue (3 Cols) */}
          <div className="lg:col-span-3">
            <ExceptionQueue
              exceptions={exceptions}
              selectedId={selectedId}
              onSelectException={(id) => {
                setSelectedId(id);
                setActionError(null);
              }}
              activeSeverity={activeSeverity}
              onChangeSeverity={setActiveSeverity}
              activeStatus={activeStatus}
              onChangeStatus={setActiveStatus}
            />
          </div>

          {/* Column 2: Detailed Exception Inspector (6 Cols) */}
          <div className="lg:col-span-6">
            <ExceptionDetail
              exception={selectedException}
              onExplain={handleExplain}
              onSuggestResolution={handleSuggestResolution}
              onAutoResolve={handleAutoResolve}
              onResolve={handleResolve}
              explanationData={selectedId ? explanations[selectedId] : null}
              suggestionData={selectedId ? suggestions[selectedId] : null}
              isLoadingAI={isLoadingAI}
              actionError={actionError}
              clearActionError={() => setActionError(null)}
            />
          </div>

          {/* Column 3: Contextual AI Assistant Chat Sidebar (3 Cols) */}
          <div className="lg:col-span-3">
            <ChatAssistant
              exception={selectedException}
              onSendChat={handleSendChat}
              chatHistory={selectedId ? (chatHistories[selectedId] || []) : []}
              isThinking={isThinkingChat}
            />
          </div>

        </div>

      </main>

      {/* Analytics Recharts Modal */}
      {showAnalytics && (
        <AnalyticsModal
          metrics={metrics}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        Supervity AI Employee • Exception Resolution Workbench • Policy Guardrails & Human-in-the-Loop Governance
      </footer>

    </div>
  );
}
