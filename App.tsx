
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { PromptSettings } from './components/PromptSettings';
import { InboxAgent } from './components/InboxAgent';
import { Email, AgentPrompts, Draft, EmailCategory, SentEmail } from './types';
import { MOCK_EMAILS, DEFAULT_PROMPTS } from './constants';
import { analyzeBatch, heuristicCategorize } from './services/geminiService';
import { AlertCircle, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('inbox');
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [prompts, setPrompts] = useState<AgentPrompts>(DEFAULT_PROMPTS);
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000); // Extended time for errors
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Derived state for filtering
  const filteredEmails = useMemo(() => {
    if (currentView === EmailCategory.TRASH) {
        return emails.filter(e => e.category === EmailCategory.TRASH);
    }

    if (currentView === 'inbox' || currentView === 'inbox_agent') {
        // Exclude Trash from inbox
        return emails.filter(e => e.category !== EmailCategory.TRASH);
    }
    
    if (currentView === 'drafts') {
        // Filter emails that have at least one saved draft and are NOT in trash
        const draftEmailIds = new Set(drafts.map(d => d.emailId));
        return emails.filter(e => draftEmailIds.has(e.id) && e.category !== EmailCategory.TRASH);
    }
    
    if (currentView === 'sent') {
        // Convert SentEmail objects to Email interface for compatibility with EmailList
        return sentEmails.map(s => ({
            id: s.id,
            sender: `To: ${s.recipient}`,
            senderEmail: '', // Hidden in list view logic usually
            subject: s.subject,
            body: s.body,
            timestamp: s.timestamp,
            isRead: true,
            category: 'Sent',
            processingStatus: 'processed'
        } as Email)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    // Filter by category (Important, To-Do, etc.) but exclude Trash
    return emails.filter(e => e.category === currentView && e.category !== EmailCategory.TRASH);
  }, [emails, currentView, drafts, sentEmails]);

  const emailCounts = useMemo(() => {
    const counts: Record<string, number> = { 
        all: emails.filter(e => e.category !== EmailCategory.TRASH).length, 
        drafts: drafts.filter(d => {
             const email = emails.find(e => e.id === d.emailId);
             return email && email.category !== EmailCategory.TRASH;
        }).length,
        sent: sentEmails.length 
    };
    Object.values(EmailCategory).forEach(cat => {
        counts[cat] = emails.filter(e => e.category === cat).length;
    });
    return counts;
  }, [emails, drafts, sentEmails]);

  const selectedEmail = useMemo(() => {
      // If viewing sent emails, finding in 'emails' won't work because they are generated on fly in filteredEmails
      if (currentView === 'sent') {
          return filteredEmails.find(e => e.id === selectedEmailId);
      }
      return emails.find(e => e.id === selectedEmailId);
  }, [emails, filteredEmails, selectedEmailId, currentView]);

  // Find existing draft for the selected email
  const selectedDraft = useMemo(() => {
    if (!selectedEmailId) return undefined;
    const emailDrafts = drafts.filter(d => d.emailId === selectedEmailId);
    if (emailDrafts.length === 0) return undefined;
    // Return the most recent draft
    return emailDrafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [selectedEmailId, drafts]);

  // High-Speed Ingestion Pipeline
  const handleIngest = async () => {
    setIsProcessing(true);
    setNotification(null);
    
    // Create a working copy
    const currentEmails = [...emails];
    
    // Identify indices that need processing
    const toProcessIndices = currentEmails
      .map((e, i) => (e.processingStatus === 'pending' || e.processingStatus === 'failed') ? i : -1)
      .filter(i => i !== -1);

    if (toProcessIndices.length === 0) {
        setIsProcessing(false);
        setNotification({ message: "All emails are already processed!", type: 'success' });
        return;
    }

    // --- Phase 1: Heuristic Pre-Triage (Local) ---
    // Fast path: Identify obvious Spam or Newsletters instantly without API calls.
    const indicesForLLM: number[] = [];
    
    toProcessIndices.forEach(index => {
        const email = currentEmails[index];
        const triage = heuristicCategorize(email);
        
        // If confidence is high (> 0.8), use the heuristic result
        if (triage.confidence > 0.8 && triage.category) {
            currentEmails[index] = {
                ...email,
                category: triage.category,
                processingStatus: 'processed',
                actionItems: [] // Usually newsletters/spam don't have tasks
            };
        } else {
            // Otherwise, mark for LLM processing
            currentEmails[index] = { ...email, processingStatus: 'processing' };
            indicesForLLM.push(index);
        }
    });

    // Update UI immediately with pre-triage results
    setEmails([...currentEmails]);
    
    if (indicesForLLM.length === 0) {
        setIsProcessing(false);
        return;
    }

    // --- Phase 2: Vectorized Batch Processing (API) ---
    // Process remaining emails in small batches to respect Rate Limits (15 RPM).
    // Batch size 3 + 2s delay = ~20-30 emails/min, which is safe for free tier bursts.
    const BATCH_SIZE = 3; 
    
    for (let i = 0; i < indicesForLLM.length; i += BATCH_SIZE) {
        const batchIndices = indicesForLLM.slice(i, i + BATCH_SIZE);
        const batchEmails = batchIndices.map(idx => currentEmails[idx]);
        
        try {
            // Single API call for the entire batch
            const results = await analyzeBatch(
                batchEmails, 
                prompts.categorization, 
                prompts.actionExtraction
            );
            
            // Map results back to the original array
            batchIndices.forEach(index => {
                const emailId = currentEmails[index].id;
                const analysis = results[emailId];
                
                if (analysis) {
                    currentEmails[index] = {
                        ...currentEmails[index],
                        category: analysis.category,
                        actionItems: analysis.actionItems,
                        processingStatus: 'processed'
                    };
                } else {
                    // Fallback if ID not found in response
                    currentEmails[index] = {
                        ...currentEmails[index],
                        category: EmailCategory.OTHERS,
                        processingStatus: 'processed'
                    };
                }
            });

        } catch (err: any) {
            console.error(`Error processing batch starting at ${i}`, err);
            
            if (err.message === 'QUOTA_EXCEEDED') {
                setNotification({ 
                    message: "API Limit Reached. Pausing for 5 seconds...", 
                    type: 'error' 
                });
                // Wait longer if quota exceeded, then continue loop
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Mark this batch as failed so user can retry specifically these
            batchIndices.forEach(index => {
                currentEmails[index] = { 
                    ...currentEmails[index], 
                    processingStatus: 'failed' 
                };
            });
        }

        // Update UI state after each batch
        setEmails([...currentEmails]);
        
        // Delay to prevent rate limit triggers (2 seconds)
        if (i + BATCH_SIZE < indicesForLLM.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    setIsProcessing(false);
    // Final check for successes
    const failedCount = currentEmails.filter(e => e.processingStatus === 'failed').length;
    if (failedCount > 0) {
        setNotification({ message: `Done, but ${failedCount} emails failed due to limits. Click Ingest to retry them.`, type: 'error' });
    } else {
        setNotification({ message: "Ingestion Complete!", type: 'success' });
    }
  };

  const handleSavePrompts = (newPrompts: AgentPrompts) => {
    setPrompts(newPrompts);
  };

  const handleSaveDraft = (draft: Draft) => {
      setDrafts(prev => {
          // Replace existing draft for this email to avoid duplicates/confusion in this version
          const others = prev.filter(d => d.emailId !== draft.emailId);
          return [...others, draft];
      });
  };

  const handleSendEmail = (draft: Draft) => {
    // Determine recipient from the original email logic
    // Since draft.emailId points to the original email
    const originalEmail = emails.find(e => e.id === draft.emailId);
    const recipient = originalEmail ? originalEmail.sender : "Unknown";

    const sentEmail: SentEmail = {
        id: Date.now().toString(),
        originalEmailId: draft.emailId,
        recipient: recipient,
        subject: draft.subject,
        body: draft.body,
        timestamp: new Date().toISOString()
    };

    setSentEmails(prev => [sentEmail, ...prev]);
    
    // Remove the draft since it is sent
    setDrafts(prev => prev.filter(d => d.emailId !== draft.emailId));

    setNotification({ message: "Email Sent Successfully!", type: 'success' });
  };
  
  const handleDeleteEmail = (id: string) => {
      setEmails(prev => prev.map(e => {
          if (e.id === id) {
              return { ...e, category: EmailCategory.TRASH };
          }
          return e;
      }));
      setNotification({ message: "Email moved to Trash", type: 'success' });
      setSelectedEmailId(undefined);
  };

  // Render logic based on view
  const renderContent = () => {
      if (currentView === 'prompts') {
          return <PromptSettings prompts={prompts} onSave={handleSavePrompts} />;
      }
      if (currentView === 'inbox_agent') {
          return <InboxAgent emails={emails.filter(e => e.category !== EmailCategory.TRASH)} />;
      }
      
      return (
        <>
          <EmailList 
            emails={filteredEmails} 
            selectedEmailId={selectedEmailId}
            onSelectEmail={(e) => setSelectedEmailId(e.id)}
            onIngest={handleIngest}
            isProcessing={isProcessing}
          />
          
          {selectedEmail ? (
            <EmailDetail 
                email={selectedEmail} 
                prompts={prompts}
                onSaveDraft={handleSaveDraft}
                onSendDraft={handleSendEmail}
                onDelete={handleDeleteEmail}
                initialDraft={selectedDraft?.body}
                initialTab={currentView === 'drafts' ? 'draft' : 'content'}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 transition-colors duration-200">
               <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
               </div>
               <p className="font-medium">Select an email to view details</p>
               <p className="text-sm mt-2 opacity-75">or configure the Agent Brain in settings</p>
            </div>
          )}
        </>
      );
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 transition-colors duration-200 overflow-hidden relative">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => {
            setCurrentView(view);
            if (view === 'inbox_agent' || view === 'prompts') {
                setSelectedEmailId(undefined);
            }
        }}
        emailCounts={emailCounts}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-5 duration-300 ${
            notification.type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-emerald-500 text-white'
        }`}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs">✓</div>}
            <span className="font-medium text-sm">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 opacity-80 hover:opacity-100">
                <X size={16} />
            </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default App;