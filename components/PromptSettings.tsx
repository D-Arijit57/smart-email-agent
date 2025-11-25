import React, { useState } from 'react';
import { AgentPrompts } from '../types';
import { Save, RefreshCw, Zap, ListChecks, MessageSquare, BrainCircuit } from 'lucide-react';
import { DEFAULT_PROMPTS } from '../constants';

interface PromptSettingsProps {
  prompts: AgentPrompts;
  onSave: (prompts: AgentPrompts) => void;
}

export const PromptSettings: React.FC<PromptSettingsProps> = ({ prompts, onSave }) => {
  const [localPrompts, setLocalPrompts] = useState<AgentPrompts>(prompts);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (key: keyof AgentPrompts, value: string) => {
    setLocalPrompts(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(localPrompts);
    setIsDirty(false);
  };

  const handleReset = () => {
    setLocalPrompts(DEFAULT_PROMPTS);
    setIsDirty(true);
  };

  return (
    <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 h-full overflow-hidden flex flex-col transition-colors duration-200">
      <header className="bg-white border-b border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm/50 backdrop-blur-sm transition-colors duration-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BrainCircuit className="text-blue-600 dark:text-blue-500" size={28} />
            Agent Brain
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure the instructions that guide the AI agent.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          >
            <RefreshCw size={16} />
            Reset Defaults
          </button>
          <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                isDirty 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none translate-y-0' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-5xl mx-auto grid grid-cols-1 gap-8 pb-20">
          
          {/* Categorization Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                    <Zap size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Categorization Logic</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Define how the agent should classify incoming emails (e.g., Important, Spam, Newsletter).
                    </p>
                </div>
            </div>
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                <textarea 
                  value={localPrompts.categorization}
                  onChange={(e) => handleChange('categorization', e.target.value)}
                  className="relative block w-full h-56 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed resize-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 outline-none transition-all shadow-inner placeholder-slate-400 dark:placeholder-slate-600"
                  spellCheck="false"
                  placeholder="Enter prompt instructions here..."
                />
            </div>
          </div>

          {/* Action Extraction Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
             <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    <ListChecks size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Action Item Extraction</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Instruct the agent on how to identify tasks and deadlines from the email body.
                    </p>
                </div>
            </div>
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                <textarea 
                  value={localPrompts.actionExtraction}
                  onChange={(e) => handleChange('actionExtraction', e.target.value)}
                  className="relative block w-full h-56 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed resize-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20 outline-none transition-all shadow-inner placeholder-slate-400 dark:placeholder-slate-600"
                  spellCheck="false"
                  placeholder="Enter JSON extraction rules here..."
                />
            </div>
          </div>

          {/* Auto-Reply Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
             <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                    <MessageSquare size={24} />
                </div>
                <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Auto-Reply Persona</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Set the tone, style, and rules for generating automated draft replies.
                    </p>
                </div>
            </div>
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>
                <textarea 
                  value={localPrompts.autoReply}
                  onChange={(e) => handleChange('autoReply', e.target.value)}
                  className="relative block w-full h-56 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed resize-none focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-500/20 outline-none transition-all shadow-inner placeholder-slate-400 dark:placeholder-slate-600"
                  spellCheck="false"
                  placeholder="Enter persona instructions here..."
                />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};