
import React, { useState, useEffect, useRef } from 'react';
import { Email, AgentPrompts, ChatMessage, Draft, EmailCategory } from '../types';
import { User, Sparkles, Send, Clock, PlayCircle, Loader2, Save, FileEdit, RefreshCw, Pencil, X, Trash2 } from 'lucide-react';
import { chatWithEmailAgent, generateDraft } from '../services/geminiService';

interface EmailDetailProps {
  email: Email;
  prompts: AgentPrompts;
  onSaveDraft: (draft: Draft) => void;
  onSendDraft: (draft: Draft) => void;
  onDelete: (id: string) => void;
  initialDraft?: string;
  initialTab?: 'content' | 'agent' | 'draft';
}

export const EmailDetail: React.FC<EmailDetailProps> = ({ 
  email, 
  prompts, 
  onSaveDraft,
  onSendDraft, 
  onDelete,
  initialDraft, 
  initialTab = 'content' 
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'agent' | 'draft'>(initialTab);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<string>('');

  // Regeneration state
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, activeTab]);

  // Reset state when email changes
  useEffect(() => {
    setChatHistory([{
      id: 'welcome',
      role: 'model',
      text: `Hello! I've analyzed this email from ${email.sender}. I can help you summarize it, find tasks, or draft a reply. What would you like to do?`,
      timestamp: new Date()
    }]);
    
    setActiveTab(initialTab);
    setShowRegenInput(false);
    setRegenInstruction('');
  }, [email.id]);

  // Sync draft from props when email or initialDraft changes
  useEffect(() => {
    setCurrentDraft(initialDraft || '');
  }, [email.id, initialDraft]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    // Prepare history for API
    const apiHistory = chatHistory.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithEmailAgent(email, apiHistory, userMsg.text, prompts.autoReply);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText || "I'm having trouble connecting right now.",
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, modelMsg]);
    setIsChatLoading(false);
  };

  
  const triggerQuickAction = async (text: string) => {
      const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);
     const apiHistory = chatHistory.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    const responseText = await chatWithEmailAgent(email, apiHistory, text, prompts.autoReply);
    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText || "Error.",
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, modelMsg]);
    setIsChatLoading(false);
    setActiveTab('agent');
  }


  const handleDraftReply = async (instruction?: string) => {
    setIsDrafting(true);
    setActiveTab('draft');
    setShowRegenInput(false); // Close panel
    
    // Validate instruction to ensure it's a string (avoiding event objects)
    const validInstruction = typeof instruction === 'string' ? instruction : undefined;

    const draft = await generateDraft(email, prompts.autoReply, validInstruction);
    setCurrentDraft(draft);
    setIsDrafting(false);
  };
  
  const saveCurrentDraft = () => {
      onSaveDraft({
          id: Date.now().toString(),
          emailId: email.id,
          subject: `Re: ${email.subject}`,
          body: currentDraft,
          createdAt: new Date()
      });
      alert("Draft saved!");
  }

  const handleSend = async () => {
    setIsSending(true);
    // Simulate network delay for animation effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onSendDraft({
        id: Date.now().toString(),
        emailId: email.id,
        subject: `Re: ${email.subject}`,
        body: currentDraft,
        createdAt: new Date()
    });
    
    setIsSending(false);
    setCurrentDraft('');
    setActiveTab('content');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative transition-colors duration-200">
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start transition-colors duration-200">
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{email.subject}</h2>
                {email.category && (
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-md font-medium uppercase tracking-wide">
                        {email.category}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    {email.sender.charAt(0)}
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-200">{email.sender}</span>
                    <span className="text-xs">{email.senderEmail}</span>
                </div>
                <span className="mx-2">•</span>
                <span>{new Date(email.timestamp).toLocaleString()}</span>
            </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex gap-2">
            {email.category !== EmailCategory.TRASH && (
                <button 
                    onClick={() => onDelete(email.id)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Move to Trash"
                >
                    <Trash2 size={18} />
                </button>
            )}
            <button 
                onClick={() => handleDraftReply()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                <FileEdit size={16} />
                Draft Reply
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Email Body */}
        <div className={`flex-1 overflow-y-auto p-8 transition-all ${activeTab !== 'content' ? 'hidden md:block md:w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'}`}>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-slate-800 dark:text-slate-300 leading-relaxed">{email.body}</p>
          </div>
          
          {email.actionItems && email.actionItems.length > 0 && (
            <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <h4 className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-400 mb-3">
                <CheckSquareIcon /> Detected Action Items
              </h4>
              <ul className="space-y-2">
                {email.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-emerald-900 dark:text-emerald-200">
                    <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600" />
                    <div>
                        <span className="block">{item.task}</span>
                        {item.deadline && item.deadline !== 'None' && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                <Clock size={12} /> Due: {item.deadline}
                            </span>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: AI Agent / Draft Panel */}
        <div className={`flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 w-full md:w-[450px] transition-all ${activeTab === 'content' ? 'hidden md:flex' : 'flex'}`}>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button 
                    onClick={() => setActiveTab('agent')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'agent' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <Sparkles size={16} />
                    AI Agent
                </button>
                 <button 
                    onClick={() => setActiveTab('draft')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'draft' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <FileEdit size={16} />
                    Draft
                </button>
            </div>

            {activeTab === 'agent' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                        {chatHistory.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <div className="flex gap-2">
                            <button onClick={() => triggerQuickAction("Summarize this email in 3 bullet points.")} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                Summarize
                            </button>
                             <button onClick={() => triggerQuickAction("What are the key deadlines here?")} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                Key Deadlines
                            </button>
                             <button onClick={() => triggerQuickAction("What tone is this email written in?")} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                Tone Analysis
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex gap-2 items-center">
                            <input 
                                type="text" 
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask the agent..."
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isChatLoading}
                                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'draft' && (
                <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6">
                    {isDrafting ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                            <Loader2 className="animate-spin mb-3 text-blue-600 dark:text-blue-500" size={32} />
                            <p className="font-medium text-sm animate-pulse">Drafting reply based on your persona...</p>
                        </div>
                    ) : currentDraft ? (
                        <div className="flex flex-col h-full relative">
                            <div className="relative flex-1 mb-4 group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 rounded-xl opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                                <textarea 
                                    className="relative w-full h-full p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm leading-relaxed resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 outline-none transition-all shadow-sm placeholder-slate-400 dark:placeholder-slate-500"
                                    value={currentDraft}
                                    onChange={(e) => setCurrentDraft(e.target.value)}
                                    placeholder="Type your email reply here..."
                                    spellCheck={false}
                                />
                            </div>

                            {/* Regeneration Custom Prompt Panel */}
                            {showRegenInput && (
                                <div className="mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-100 dark:border-slate-700 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1">
                                            <Sparkles size={12} /> Refine Draft with AI
                                        </label>
                                        <button onClick={() => setShowRegenInput(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={regenInstruction}
                                            onChange={(e) => setRegenInstruction(e.target.value)}
                                            placeholder="E.g., Make it more formal, add a deadline..."
                                            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                            onKeyDown={(e) => e.key === 'Enter' && handleDraftReply(regenInstruction)}
                                        />
                                        <button
                                            onClick={() => handleDraftReply(regenInstruction)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                                        >
                                            Go
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 z-10">
                                <button 
                                    onClick={() => {
                                        setRegenInstruction('');
                                        setShowRegenInput(!showRegenInput);
                                    }} 
                                    className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-all shadow-sm hover:shadow rounded-lg
                                        ${showRegenInput 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                                    `}
                                >
                                    <RefreshCw size={14} className={showRegenInput ? "rotate-180 transition-transform" : ""} />
                                    {showRegenInput ? 'Cancel' : 'Regenerate AI'}
                                </button>
                                <button 
                                    onClick={saveCurrentDraft}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <Save size={16} />
                                    Save Draft
                                </button>
                                 <button 
                                    onClick={handleSend}
                                    disabled={isSending}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait"
                                >
                                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    {isSending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                            <div className="p-6 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
                                <FileEdit size={32} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">No draft active</p>
                            <p className="text-sm mb-6 max-w-xs text-center mt-2">Generate a reply using the AI agent or start writing from scratch.</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setCurrentDraft(" ")} 
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <Pencil size={14} />
                                    Start Blank
                                </button>
                                <button 
                                    onClick={() => handleDraftReply()} 
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <Sparkles size={14} />
                                    Generate with AI
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const CheckSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
)