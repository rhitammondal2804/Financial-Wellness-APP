import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, AIAnalysisResult, StressLevel } from './types.ts';

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJsonString = (text: string) => {
    if (!text) return "[]";
    let clean = text.trim();
    // Remove markdown code blocks if present
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
};

// Helper to fix JSON truncated due to token limits
const repairTruncatedJSON = (jsonStr: string): string => {
    const trimmed = jsonStr.trim();
    try {
        JSON.parse(trimmed);
        return trimmed;
    } catch (e) {
        // If parsing fails, try to cut off at the last complete object and close the array
        if (trimmed.startsWith('[')) {
            const lastBrace = trimmed.lastIndexOf('}');
            if (lastBrace !== -1) {
                // Construct a new string ending at the last } and adding ]
                const candidate = trimmed.substring(0, lastBrace + 1) + ']';
                try {
                    JSON.parse(candidate);
                    return candidate;
                } catch (e2) {
                    console.warn("JSON repair failed even after truncation fix.");
                }
            }
        }
        // If it looks like an object (Analysis result), try to close the braces
        if (trimmed.startsWith('{')) {
             const lastQuote = trimmed.lastIndexOf('"');
             if (lastQuote !== -1) {
                 // Very rough heuristic to close a truncated JSON object
                 // This is risky but better than crashing for the specific AI Analysis schema
                 const candidate = trimmed + '"}'; 
                 try { return JSON.parse(candidate) ? candidate : "{}"; } catch (e3) {}
             }
        }
        return "{}";
    }
};

// --- Transaction Extraction from Files ---

export const extractTransactionsFromFile = async (fileData: string, mimeType: string): Promise<Transaction[]> => {
  const ai = getAI();
  const base64Data = fileData.split(',')[1]; // Remove data URL header

  const extractionSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD" },
        amount: { type: Type.NUMBER, description: "Transaction amount (positive number)" },
        category: { type: Type.STRING, description: "Best guess category" },
        merchant: { type: Type.STRING, description: "Merchant name" }
      },
      required: ["date", "amount", "category"]
    }
  };

  try {
    // Using gemini-2.0-flash-exp for robust multimodal JSON extraction
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', 
      contents: [
        {
            parts: [
            { inlineData: { mimeType: mimeType, data: base64Data } },
            { text: "Extract financial transactions from this document into a JSON array. Use YYYY-MM-DD format for dates. Ignore running balances. IMPORTANT: Limit to the first 50 transactions to ensure the JSON response is complete and valid. Do not truncate the JSON output." }
            ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        maxOutputTokens: 8192, 
      }
    });

    let text = cleanJsonString(response.text || "");
    
    // Robust parsing with repair fallback
    let rawData;
    try {
        rawData = JSON.parse(text);
    } catch (e) {
        console.warn("Initial JSON parse failed, attempting repair...");
        text = repairTruncatedJSON(text);
        try {
             rawData = JSON.parse(text);
        } catch (e2) {
             throw new Error("Extracted data was incomplete or malformed. Please try a clearer image.");
        }
    }

    if (!Array.isArray(rawData)) {
        // Fallback for empty or malformed extraction
        return [];
    }
    
    // Post-process to add IDs and heuristic discretionary tags
    return rawData.map((t: any, idx: number) => {
        const DISCRETIONARY_KEYWORDS = ['coffee', 'starbucks', 'amazon', 'restaurant', 'dining', 'uber', 'entertainment', 'clothing', 'retail', 'bar', 'movie', 'apple', 'netflix', 'swiggy', 'zomato', 'blinkit', 'ola'];
        const ESSENTIAL_KEYWORDS = ['rent', 'mortgage', 'utility', 'grocery', 'groceries', 'insurance', 'medical', 'bill', 'gas', 'fuel', 'internet', 'phone', 'tuition', 'electricity'];
        
        const lowerCat = (t.category || '').toLowerCase();
        const lowerMerch = (t.merchant || '').toLowerCase();
        const combined = lowerCat + ' ' + lowerMerch;

        const isDiscretionary = DISCRETIONARY_KEYWORDS.some(k => combined.includes(k)) && !ESSENTIAL_KEYWORDS.some(k => combined.includes(k));

        return {
            id: `extracted-${idx}`,
            date: t.date,
            amount: Math.abs(t.amount),
            category: t.category || 'Uncategorized',
            merchant: t.merchant,
            isDiscretionary: isDiscretionary
        };
    });

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error((error as Error).message || "Failed to extract transactions.");
  }
};

// --- Analysis Logic ---

export const analyzeSpendingHabits = async (transactions: Transaction[]): Promise<AIAnalysisResult> => {
  const ai = getAI();
  
  // 1. Calculate Hard Metrics to feed the AI (Grounding the analysis)
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const discretionaryTx = transactions.filter(t => t.isDiscretionary);
  const discretionarySpent = discretionaryTx.reduce((sum, t) => sum + t.amount, 0);
  const essentialSpent = totalSpent - discretionarySpent;
  const discretionaryRatio = totalSpent > 0 ? (discretionarySpent / totalSpent) * 100 : 0;
  const totalTx = transactions.length;
  
  // Sort by date descending
  const recentTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Create a compact string representation of the last 40 transactions for the AI
  const txListString = recentTx.slice(0, 40).map(t => 
    `${t.date}: ${t.merchant || t.category} (₹${t.amount.toFixed(2)})`
  ).join('\n');

  const summaryContext = `
    HARD METRICS:
    - Total Spent: ₹${totalSpent.toFixed(2)}
    - Essential Expenses: ₹${essentialSpent.toFixed(2)}
    - Discretionary Expenses: ₹${discretionarySpent.toFixed(2)} (${discretionaryRatio.toFixed(1)}%)
    - Transaction Count: ${totalTx}
    
    TRANSACTION LOG (Last 40):
    ${txListString}
  `;

  const systemInstruction = `
    You are a Forensic Financial Analyst and Behavioral Economist.
    Analyze the provided transaction log and metrics to calculate a "Financial Stress Score".

    REQUIREMENTS:
    1. **Be Factual**: specific amounts, dates, and merchants in your observations. Do not just say "spending increased", say "Spending increased due to ₹2000 at Amazon on 10/12".
    2. **Detect Patterns**: Look for "doom spending" (small, frequent discretionary purchases), large impulse buys, or late-night spending clusters.
    3. **Tone**: Professional, objective, direct, yet constructive.

    SCORING RUBRIC (0-100):
    - 0-30 (Stable): <30% discretionary, consistent essential payments.
    - 31-60 (Mild): 30-50% discretionary, occasional spikes.
    - 61-80 (High): 50-70% discretionary, frequent impulse buys, irregular frequency.
    - 81-100 (Critical): >70% discretionary, rapid depletion, gambling/high-risk merchants.

    OUTPUT SCHEMA:
    Return strictly JSON.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: "Stress score 0-100 based on the rubric" },
      level: { type: Type.STRING, enum: Object.values(StressLevel), description: "Stress level category" },
      observations: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "3 specific observations citing dates and amounts." 
      },
      recentChanges: { type: Type.STRING, description: "Factual comparison of recent vs older transactions in the list." },
      importance: { type: Type.STRING, description: "The single most critical financial habit identifying in this dataset." },
      recommendations: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "3 actionable, specific steps to reduce the score."
      }
    },
    required: ["score", "level", "observations", "recentChanges", "importance", "recommendations"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: `Perform forensic analysis on this financial data:\n${summaryContext}` }
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    // Use the robust cleaning and repair logic
    const text = cleanJsonString(response.text || "");
    if (!text) throw new Error("No response from AI");
    
    // Parse
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        console.warn("Analysis JSON parse failed, attempting repair...");
        const repaired = repairTruncatedJSON(text);
        result = JSON.parse(repaired);
    }
    
    return result as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback if AI fails
    return {
      score: 50,
      level: StressLevel.Mild,
      observations: ["AI service is momentarily overloaded.", "Manual review of the transaction log is recommended."],
      recentChanges: "Analysis unavailable.",
      importance: "Please retry the analysis in a few moments.",
      recommendations: ["Check internet connection.", "Ensure file is readable."]
    };
  }
};
