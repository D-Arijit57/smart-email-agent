import React, { useState, useRef, useEffect } from 'react';
import { Email, ChatMessage } from '../types';
import { Bot, Send, Sparkles } from 'lucide-react';
import { chatWithInboxAgent } from '../services/geminiService';

interface InboxAgentProps {
  emails: Email[];
}

export const InboxAgent: React.FC<InboxAgentProps> = ({ emails }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    text: `Hello! I'm your Inbox Assistant. I have access to all ${emails.length} emails in your inbox. \n\nYou can ask me things like:\n• "What are my most urgent tasks?"\n• "Summarize the latest newsletters"\n• "Did I get any emails from Mom?"`,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

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

    const apiHistory = chatHistory.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithInboxAgent(emails, apiHistory, userMsg.text);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText || "I'm having trouble analyzing the inbox right now.",
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, modelMsg]);
    setIsChatLoading(false);
  };

  const triggerQuickAction = (text: string) => {
    setInputMessage(text);
    // Optional: Auto-send
    // handleSendMessage(); 
    // Usually better to let user confirm or edit before sending
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <Bot size={24} />
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Inbox Assistant</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chat with your entire inbox using AI</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8" ref={chatContainerRef}>
        <div className="max-w-3xl mx-auto space-y-6">
            {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {msg.role === 'user' ? <div className="w-4 h-4 bg-slate-500 dark:bg-slate-400 rounded-full" /> : <Bot size={16} />}
                        </div>
                        <div className={`px-5 py-4 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                </div>
            ))}
            
            {isChatLoading && (
                <div className="flex justify-start">
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mr-2">Analyzing inbox</span>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="p-4 md:p-8 pt-0">
         <div className="max-w-3xl mx-auto">
            {/* Suggestions */}
            {chatHistory.length < 3 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mask-fade-r">
                    <button onClick={() => triggerQuickAction("Summarize unread emails")} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm rounded-full text-sm text-slate-600 dark:text-slate-300 transition-all whitespace-nowrap">
                        <Sparkles size={14} className="text-amber-500" /> Summarize unread
                    </button>
                    <button onClick={() => triggerQuickAction("Show me urgent action items")} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm rounded-full text-sm text-slate-600 dark:text-slate-300 transition-all whitespace-nowrap">
                        <Sparkles size={14} className="text-emerald-500" /> Find urgent tasks
                    </button>
                    <button onClick={() => triggerQuickAction("List emails from Alice")} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm rounded-full text-sm text-slate-600 dark:text-slate-300 transition-all whitespace-nowrap">
                         <Sparkles size={14} className="text-purple-500" /> Emails from Alice
                    </button>
                </div>
            )}

            <div className="relative">
                 <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your inbox..."
                    className="w-full pl-6 pr-14 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isChatLoading}
                    className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={20} />
                </button>
            </div>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
                AI Agent can make mistakes. Verify important information.
            </p>
         </div>
      </div>
    </div>
  );
};