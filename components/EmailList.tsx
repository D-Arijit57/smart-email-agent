
import React, { useState, useMemo } from 'react';
import { Email, EmailCategory } from '../types';
import { Search, Loader2 } from 'lucide-react';

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onSelectEmail: (email: Email) => void;
  onIngest: () => void;
  isProcessing: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({ 
  emails, 
  selectedEmailId, 
  onSelectEmail, 
  onIngest,
  isProcessing
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case EmailCategory.IMPORTANT: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case EmailCategory.TODO: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case EmailCategory.SPAM: return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case EmailCategory.NEWSLETTER: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case EmailCategory.OTHERS: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      case EmailCategory.TRASH: return 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400 line-through';
      case 'Sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    const query = searchQuery.toLowerCase();
    return emails.filter(email => 
      email.subject.toLowerCase().includes(query) ||
      email.sender.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query)
    );
  }, [emails, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 w-96 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 transition-colors duration-200">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Inbox</h1>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search sender, subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>
        <button 
          onClick={onIngest}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null}
          {isProcessing ? 'Smart Ingesting...' : 'Smart Ingest & Process'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            {searchQuery ? 'No emails match your search.' : 'No emails found.'}
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                selectedEmailId === email.id 
                ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-l-4 border-l-blue-500' 
                : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-semibold text-sm ${selectedEmailId === email.id ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-slate-200'}`}>
                  {email.sender}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(email.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                {email.subject}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 truncate mb-2">
                {email.body}
              </div>
              <div className="flex gap-2">
                {email.category && email.category !== 'Uncategorized' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(email.category)}`}>
                    {email.category}
                  </span>
                )}
                {email.processingStatus === 'processing' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 animate-pulse">
                    AI Processing...
                  </span>
                )}
                {email.processingStatus === 'failed' && (
                   <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1">
                    Failed
                   </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};