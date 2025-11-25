import { GoogleGenAI, Type } from "@google/genai";
import { Email, ActionItem, EmailCategory } from "../types";

// Helper to get client safely
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Retry utility
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for Quota Exceeded / Rate Limit errors (429)
    const errorMsg = (error?.message || JSON.stringify(error)).toLowerCase();
    const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted") || errorMsg.includes("resource has been exhausted");

    if (isQuotaError) {
      console.warn("Quota exceeded detected in retry logic.");
      throw new Error("QUOTA_EXCEEDED");
    }

    if (retries <= 0) throw error;
    
    console.warn(`API call failed, retrying... (${retries} attempts left)`);
    await wait(delay);
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Phase 1: High-Speed Pre-Triage
 * Classifies emails locally using heuristics to save API calls and reduce latency.
 */
export const heuristicCategorize = (email: Email): { category?: string; confidence: number } => {
  const content = (email.subject + " " + email.body).toLowerCase();
  const sender = email.senderEmail.toLowerCase();
  const fromName = email.sender.toLowerCase();

  // Rules for Spam
  if (
    content.includes("lottery") || 
    content.includes("wire transfer") || 
    content.includes("inheritance") || 
    content.includes("urgent business proposal") ||
    content.includes("verify your account") ||
    content.includes("bank details") ||
    sender.includes("wealth")
  ) {
    return { category: EmailCategory.SPAM, confidence: 0.95 };
  }

  // Rules for Newsletter
  if (
    content.includes("unsubscribe") || 
    content.includes("view in browser") || 
    sender.includes("newsletter") || 
    sender.includes("no-reply") || 
    sender.includes("info@") ||
    fromName.includes("weekly")
  ) {
    return { category: EmailCategory.NEWSLETTER, confidence: 0.9 };
  }

  // Rules for Important (DevOps / PM / System Alerts / HR / Invoices)
  if (
    sender.includes('alert') ||
    sender.includes('monitoring') ||
    fromName.includes('devops') ||
    fromName.includes('project manager') ||
    content.includes('cpu usage') ||
    content.includes('server down') ||
    content.includes('incident') ||
    content.includes('roadmap') || // Alice's Roadmap
    content.includes('invoice') || // Sarah's Invoice
    sender.includes('hr@') ||      // HR
    content.includes('open enrollment')
  ) {
    return { category: EmailCategory.IMPORTANT, confidence: 0.95 };
  }

  // Rules for Others (Personal / Rewards / Promo)
  if (
    fromName.includes('mom') ||
    fromName.includes('dad') ||
    sender.includes('family') ||
    sender.includes('rewards') ||
    content.includes('free drink') ||
    content.includes('points balance') ||
    (content.includes('dinner') && content.includes('sweetie')) ||
    fromName.includes('coffee')
  ) {
     return { category: EmailCategory.OTHERS, confidence: 0.99 };
  }

  // General Business Important (Lower confidence fallback)
  // This helps catch things that might be important but not explicitly defined above
  if (
    content.includes("contract") ||
    content.includes("agreement")
  ) {
    return { category: EmailCategory.IMPORTANT, confidence: 0.7 };
  }

  return { confidence: 0 };
};

/**
 * Phase 2: Vectorized Batch Processing
 * Processes multiple emails in a single API call using structured output.
 */
export const analyzeBatch = async (
    emails: Email[],
    catPrompt: string,
    actionPrompt: string
  ): Promise<Record<string, { category: string; actionItems: ActionItem[] }>> => {
    if (emails.length === 0) return {};

    try {
      return await withRetry(async () => {
        const client = getClient();
        
        // Minimize token usage by sending only necessary data
        const emailData = emails.map(e => ({
          id: e.id,
          subject: e.subject,
          body: e.body.substring(0, 1000) // Truncate very long emails to fit in batch
        }));
        
        const systemPrompt = `
        You are a high-performance email triage engine.
        
        Reference Definitions:
        Categorization: ${catPrompt}
        Action Extraction: ${actionPrompt}
        
        Task:
        Analyze the provided list of emails. Return a JSON array where each object corresponds to an email ID.
        For each email, assign a category and extract action items (if any).
        
        Strictly follow the JSON schema.
        `;
  
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
              { role: 'user', parts: [{ text: systemPrompt + "\n\nEmails to Process:\n" + JSON.stringify(emailData) }] }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        task: { type: Type.STRING },
                        deadline: { type: Type.STRING }
                      }
                    }
                  }
                },
                required: ["id", "category"]
              }
            }
          }
        });
  
        // Parse result
        const rawResults = JSON.parse(response.text || "[]");
        
        // Transform array back to map for O(1) lookup
        const resultsMap: Record<string, { category: string; actionItems: ActionItem[] }> = {};
        
        rawResults.forEach((res: any) => {
            let category = res.category || "Others";
            // Normalize category
            const validCategories = ['Important', 'Newsletter', 'Spam', 'To-Do', 'Others'];
            const match = validCategories.find(c => c.toLowerCase() === category.toLowerCase());
            category = match || "Others";

            resultsMap[res.id] = {
                category,
                actionItems: res.tasks || []
            };
        });

        return resultsMap;
      }, 3, 2000); // 2s initial delay for retries
    } catch (error: any) {
      if (error.message === 'QUOTA_EXCEEDED') {
          throw error;
      }
      console.error("Error analyzing batch:", error);
      return {};
    }
  };

export const generateDraft = async (
  email: Email, 
  promptTemplate: string, 
  userInstructions?: string
): Promise<string> => {
  try {
    const client = getClient();
    let finalPrompt = `${promptTemplate}\n\nOriginal Email:\nFrom: ${email.sender}\nSubject: ${email.subject}\nBody: ${email.body}\n`;
    
    if (userInstructions) {
      finalPrompt += `\nAdditional User Instructions: ${userInstructions}`;
    }

    finalPrompt += `\n\nGenerate the email reply body now. Do not include subject lines or placeholders unless necessary.`;

    const response = await withRetry(async () => client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
    }));

    return response.text || "";
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
        return "Error: API Quota Exceeded. Please try again later.";
    }
    console.error("Error generating draft:", error);
    return "Failed to generate draft. Please try again.";
  }
};

export const chatWithEmailAgent = async (
  email: Email, 
  history: { role: string, parts: { text: string }[] }[], 
  userMessage: string,
  systemInstruction?: string
) => {
  try {
    const client = getClient();
    
    // Construct context
    const context = `Current Email Context:\nFrom: ${email.sender}\nSubject: ${email.subject}\nBody: ${email.body}\n\n`;
    
    const fullSystemInstruction = (systemInstruction || "You are a helpful email productivity assistant.") + "\n" + context;

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: fullSystemInstruction,
      },
      history: history.map(h => ({
          role: h.role,
          parts: h.parts
      }))
    });

    const response = await withRetry(async () => chat.sendMessage({ message: userMessage }));
    return response.text;
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
        return "I can't answer right now because the API quota has been exceeded. Please wait a moment.";
    }
    console.error("Error in chat:", error);
    return "I encountered an error processing your request.";
  }
};

export const chatWithInboxAgent = async (
    emails: Email[],
    history: { role: string, parts: { text: string }[] }[],
    userMessage: string
  ) => {
    try {
      const client = getClient();
      
      const inboxContext = emails.map(e => ({
          id: e.id,
          from: e.sender,
          subject: e.subject,
          category: e.category,
          isRead: e.isRead,
          snippet: e.body.substring(0, 300) + (e.body.length > 300 ? "..." : "")
      }));
  
      const systemInstruction = `You are an Inbox Assistant. You have access to the user's email inbox.
  
      Current Inbox Data:
      ${JSON.stringify(inboxContext, null, 2)}
  
      Capabilities:
      - Summarize unread emails.
      - Find specific information (e.g., "When is the meeting?").
      - List urgent items or tasks.
      - Count emails by category.
  
      If the user asks to see specific emails, mention their Sender and Subject clearly.
      Keep answers concise and helpful.`;
  
      const chat = client.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
        },
        history: history.map(h => ({
            role: h.role,
            parts: h.parts
        }))
      });
  
      const response = await withRetry(async () => chat.sendMessage({ message: userMessage }));
      return response.text;
    } catch (error: any) {
      if (error.message === 'QUOTA_EXCEEDED') {
        return "I can't access your inbox right now due to an API quota limit. Please try again in a minute.";
      }
      console.error("Error in inbox chat:", error);
      return "I encountered an error processing your inbox data.";
    }
  };