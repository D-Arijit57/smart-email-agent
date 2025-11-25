
import React from 'react';
import { Mail, Settings, FileText, Inbox, ShieldAlert, Star, CheckSquare, Bot, Moon, Sun, Archive, Send, Trash2 } from 'lucide-react';
import { EmailCategory } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  emailCounts: Record<string, number>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, emailCounts, theme, toggleTheme }) => {
  const navItemClass = (view: string) => `
    flex items-center w-full px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors
    ${currentView === view 
      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
  `;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col h-full transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl">
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-sm">
            <Mail size={18} />
          </div>
          <span>MailAgent</span>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="mb-2">
            <button 
                onClick={() => onChangeView('inbox_agent')} 
                className={`flex items-center w-full px-4 py-3 mb-4 text-sm font-bold rounded-lg transition-all shadow-sm
                    ${currentView === 'inbox_agent' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200 dark:shadow-none' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'}
                `}
            >
                <Bot size={20} className="mr-3" />
                <span>Inbox Assistant</span>
            </button>
        </div>

        <div className="mb-6">
          <p className="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Folders
          </p>
          <button onClick={() => onChangeView('inbox')} className={navItemClass('inbox')}>
            <Inbox size={18} className="mr-3" />
            <span className="flex-1 text-left">Inbox</span>
            {emailCounts.all > 0 && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts.all}
              </span>
            )}
          </button>
          <button onClick={() => onChangeView('drafts')} className={navItemClass('drafts')}>
            <FileText size={18} className="mr-3" />
            <span className="flex-1 text-left">Drafts</span>
            {emailCounts.drafts > 0 && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts.drafts}
              </span>
            )}
          </button>
          <button onClick={() => onChangeView('sent')} className={navItemClass('sent')}>
            <Send size={18} className="mr-3" />
            <span className="flex-1 text-left">Sent</span>
            {emailCounts.sent > 0 && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts.sent}
              </span>
            )}
          </button>
           <button onClick={() => onChangeView(EmailCategory.TRASH)} className={navItemClass(EmailCategory.TRASH)}>
            <Trash2 size={18} className="mr-3" />
            <span className="flex-1 text-left">Trash</span>
            {emailCounts[EmailCategory.TRASH] > 0 && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts[EmailCategory.TRASH]}
              </span>
            )}
          </button>
        </div>

        <div className="mb-6">
          <p className="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Categories
          </p>
          <button onClick={() => onChangeView(EmailCategory.IMPORTANT)} className={navItemClass(EmailCategory.IMPORTANT)}>
            <Star size={18} className="mr-3 text-amber-500" />
            <span>Important</span>
             {emailCounts[EmailCategory.IMPORTANT] > 0 && (
              <span className="ml-auto bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts[EmailCategory.IMPORTANT]}
              </span>
            )}
          </button>
          <button onClick={() => onChangeView(EmailCategory.TODO)} className={navItemClass(EmailCategory.TODO)}>
            <CheckSquare size={18} className="mr-3 text-emerald-500" />
            <span>To-Do</span>
            {emailCounts[EmailCategory.TODO] > 0 && (
              <span className="ml-auto bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts[EmailCategory.TODO]}
              </span>
            )}
          </button>
          <button onClick={() => onChangeView(EmailCategory.SPAM)} className={navItemClass(EmailCategory.SPAM)}>
            <ShieldAlert size={18} className="mr-3 text-red-500" />
            <span>Spam</span>
             {emailCounts[EmailCategory.SPAM] > 0 && (
              <span className="ml-auto bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts[EmailCategory.SPAM]}
              </span>
            )}
          </button>
           <button onClick={() => onChangeView(EmailCategory.NEWSLETTER)} className={navItemClass(EmailCategory.NEWSLETTER)}>
            <Mail size={18} className="mr-3 text-purple-500" />
            <span>Newsletter</span>
             {emailCounts[EmailCategory.NEWSLETTER] > 0 && (
              <span className="ml-auto bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts[EmailCategory.NEWSLETTER]}
              </span>
            )}
          </button>
          <button onClick={() => onChangeView(EmailCategory.OTHERS)} className={navItemClass(EmailCategory.OTHERS)}>
            <Archive size={18} className="mr-3 text-slate-500" />
            <span>Others</span>
             {emailCounts[EmailCategory.OTHERS] > 0 && (
              <span className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {emailCounts[EmailCategory.OTHERS]}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
         <button 
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-3 mb-1 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            {theme === 'light' ? <Moon size={18} className="mr-3" /> : <Sun size={18} className="mr-3 text-amber-400" />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        <button onClick={() => onChangeView('prompts')} className={navItemClass('prompts')}>
          <Settings size={18} className="mr-3" />
          <span>Agent Brain</span>
        </button>
      </div>
    </aside>
  );
};