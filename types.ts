
export enum EmailCategory {
  IMPORTANT = 'Important',
  NEWSLETTER = 'Newsletter',
  SPAM = 'Spam',
  TODO = 'To-Do',
  OTHERS = 'Others',
  UNCATEGORIZED = 'Uncategorized',
  TRASH = 'Trash'
}

export interface ActionItem {
  task: string;
  deadline?: string;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  category: EmailCategory | string;
  actionItems?: ActionItem[];
  processingStatus: 'pending' | 'processing' | 'processed' | 'failed';
}

export interface SentEmail {
  id: string;
  originalEmailId: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
}

export interface AgentPrompts {
  categorization: string;
  actionExtraction: string;
  autoReply: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Draft {
  id: string;
  emailId: string;
  subject: string;
  body: string;
  createdAt: Date;
}