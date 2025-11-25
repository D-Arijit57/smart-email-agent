import { AgentPrompts, Email, EmailCategory } from './types';

export const DEFAULT_PROMPTS: AgentPrompts = {
  categorization: `Categorize emails into one of the following categories: Important, Newsletter, Spam, To-Do, Others.

Definitions:
- Important: High priority business communication, project management updates (Roadmaps, Standups), system alerts (DevOps), HR announcements, and Invoices.
- Newsletter: Marketing digests, weekly updates from services, general news feeds.
- Spam: Unsolicited offers, suspicious links, phishing attempts, "Urgent Business Proposals".
- To-Do: Emails containing a direct request requiring specific user action (e.g., "submit report", "reply by", "make updates").
- Others: Personal emails (family/friends, e.g., "Mom", "Dinner"), promotional offers (coupons, rewards, "Free Drink"), and low-priority notifications.

Rules of Thumb:
1. If sender is "DevOps" or "Project Manager" -> Important.
2. If sender is "Mom" or related to "Rewards/Coffee" -> Others.
3. If email asks for a file or confirmation by a date -> To-Do.

Return ONLY the category name.`,
  
  actionExtraction: `Extract actionable tasks from the email. 
Respond ONLY in JSON format with a list of objects under the key "tasks".
Each object should have:
- "task": The description of the task.
- "deadline": The deadline mentioned (or "None" if not specified).

Example:
{
  "tasks": [
    { "task": "Submit report", "deadline": "Friday" }
  ]
}`,

  autoReply: `You are a professional email assistant. Draft a polite, concise reply based on the email content.
- If it's a meeting request, ask for an agenda if missing, or confirm availability.
- If it's a task, acknowledge receipt and estimate completion.
- Maintain a professional and helpful tone.
`
};

export const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    sender: 'Alice Johnson',
    senderEmail: 'alice@company.com',
    subject: 'Q3 Project Roadmap Review',
    body: `Hi Team,

I'd like to schedule a meeting to review the Q3 roadmap. We need to align on the deliverables before next Monday.
Can everyone share their availability for this Thursday afternoon?

Also, please send me your preliminary status reports by Wednesday EOD.

Thanks,
Alice`,
    timestamp: '2023-10-23T09:30:00Z',
    isRead: false,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '2',
    sender: 'Tech Weekly',
    senderEmail: 'newsletter@techweekly.io',
    subject: 'The Future of AI Agents',
    body: `Welcome to this week's edition of Tech Weekly!

In this issue:
- How AI agents are transforming productivity.
- New frameworks for LLM integration.
- Community spotlight.

Read the full article on our website.`,
    timestamp: '2023-10-23T08:15:00Z',
    isRead: true,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '3',
    sender: 'Prince of Zamunda',
    senderEmail: 'wealth@legacy.com',
    subject: 'URGENT BUSINESS PROPOSAL',
    body: `Dear Sir/Madam,

I have a business proposal that will benefit us both immensely. I need your assistance to transfer a large sum of money.

Please reply with your bank details immediately.`,
    timestamp: '2023-10-22T23:45:00Z',
    isRead: false,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '4',
    sender: 'Bob Smith',
    senderEmail: 'bob@client.com',
    subject: 'Feedback on Design Mockups',
    body: `Hi,

I've reviewed the latest designs. They look great overall, but we need to change the primary button color to blue.
Also, the logo looks a bit small on mobile. 
Can you make these updates and send a new version by tomorrow noon?

Best,
Bob`,
    timestamp: '2023-10-22T14:20:00Z',
    isRead: false,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '5',
    sender: 'HR Department',
    senderEmail: 'hr@company.com',
    subject: 'Open Enrollment Begins Soon',
    body: `Team,

This is a reminder that open enrollment for health benefits begins on November 1st.
Please review the attached guide to see what's changing this year.
No action is needed if you wish to keep your current plan.

Regards,
HR`,
    timestamp: '2023-10-21T10:00:00Z',
    isRead: true,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '6',
    sender: 'Sarah Lee',
    senderEmail: 'sarah@vendor.com',
    subject: 'Invoice #4023 Overdue',
    body: `Hello,

Just following up on Invoice #4023. It was due last week. 
Please let me know if there's an issue with payment processing.

Thanks,
Sarah`,
    timestamp: '2023-10-21T09:00:00Z',
    isRead: false,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '7',
    sender: 'DevOps Alerts',
    senderEmail: 'alerts@monitoring.com',
    subject: '[ALERT] High CPU Usage on Server-01',
    body: `CPU usage on Server-01 has exceeded 90% for the last 15 minutes.
Please investigate immediately.`,
    timestamp: '2023-10-24T02:00:00Z',
    isRead: false,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '8',
    sender: 'Coffee Shop',
    senderEmail: 'rewards@coffee.com',
    subject: 'Your Free Drink is Waiting!',
    body: `Hey there!
    
You've earned enough points for a free drink. Come in anytime this week to claim it.`,
    timestamp: '2023-10-20T16:00:00Z',
    isRead: true,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
   {
    id: '9',
    sender: 'Project Manager',
    senderEmail: 'pm@company.com',
    subject: 'Standup Cancelled',
    body: `Hi all,
    
I'm out sick today, so we're cancelling the daily standup. 
Please post your updates in the Slack channel instead.`,
    timestamp: '2023-10-24T08:00:00Z',
    isRead: false,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  },
  {
    id: '10',
    sender: 'Mom',
    senderEmail: 'mom@family.com',
    subject: 'Sunday Dinner',
    body: `Hi sweetie,
    
Are you coming over for dinner this Sunday? I'm making lasagna.
Let me know by Friday so I can buy groceries.`,
    timestamp: '2023-10-19T18:00:00Z',
    isRead: false,
    category: EmailCategory.UNCATEGORIZED,
    processingStatus: 'pending'
  }
];