import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';

export default function ChatAssistant({ exception, onSendChat, chatHistory, isThinking }) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Why was this flagged?',
    'What resolution is suggested?',
    'Show the evidence',
    'Can this be auto-resolved?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !exception) return;
    onSendChat(inputMessage);
    setInputMessage('');
  };

  const handleQuickPromptClick = (promptText) => {
    if (!exception) return;
    onSendChat(promptText);
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[calc(100vh-210px)] min-h-[600px] overflow-hidden shadow-xl">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>Contextual AI Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
              {exception ? `Auditing ${exception.id}` : 'Select an exception to chat'}
            </p>
          </div>
        </div>

        {exception && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
            {Math.round(exception.confidence_score * 100)}% Conf
          </span>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!exception ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-600 mb-1" />
            <div className="text-xs font-semibold text-slate-400">Context Assistant Ready</div>
            <p className="text-[11px] text-slate-500 max-w-[200px]">
              Select any exception from the queue to start a context-grounded conversation.
            </p>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Governance Employee Connected</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              I am grounded in line items and PO rules for <span className="font-mono text-white font-bold">{exception.id}</span>. Ask any question or select a quick prompt below.
            </p>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col space-y-1 ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                {msg.sender === 'user' ? (
                  <>
                    <span>Human Reviewer</span>
                    <User className="w-3 h-3 text-slate-400" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-indigo-400" />
                    <span>AI Employee</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-sans'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Render Suggested Action Buttons if present */}
                {msg.suggestedActions?.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Suggested Questions:</span>
                    <div className="flex flex-wrap gap-1">
                      {msg.suggestedActions.map((action, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleQuickPromptClick(action)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isThinking && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 w-max text-xs text-indigo-400">
            <Bot className="w-4 h-4 animate-spin" />
            <span>Analyzing exception facts...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      {exception && (
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-[10px]">
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPromptClick(promptText)}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 transition-all shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>{promptText}</span>
              <ChevronRight className="w-2.5 h-2.5 opacity-50" />
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
        <input
          type="text"
          placeholder={exception ? "Ask AI Employee about this exception..." : "Select an exception..."}
          disabled={!exception || isThinking}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!exception || !inputMessage.trim() || isThinking}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-lg shadow-indigo-600/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
