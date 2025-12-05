
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialAnalysis, Language, ChatResponse, ChatMessage } from "../types";
import { ProcessedFile } from "./excelService";

const languageMap: Record<Language, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch"
};

// Helper to get API Key (reused logic)
const getApiKey = (manualApiKey?: string) => {
  let apiKey = manualApiKey;
  if (!apiKey) { try { apiKey = process.env.REACT_APP_API_KEY; } catch (e) {} }
  if (!apiKey) { try { apiKey = process.env.NEXT_PUBLIC_API_KEY; } catch (e) {} }
  if (!apiKey) { try { apiKey = process.env.VITE_API_KEY; } catch (e) {} }
  if (!apiKey) { try { apiKey = process.env.API_KEY; } catch (e) {} }

  if (!apiKey) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
      }
    } catch (e) { /* ignore */ }
  }
  return apiKey;
};

// Helper to build file parts for prompt
const buildFileParts = (filesInput: ProcessedFile[]) => {
  const fileParts: any[] = [];
  for (const file of filesInput) {
      if (file.mimeType === 'application/pdf') {
          fileParts.push({ text: `\n\n--- START OF FILE: "${file.fileName}" (PDF) ---\n` });
          fileParts.push({ 
              inlineData: { 
                  mimeType: 'application/pdf', 
                  data: file.data 
              } 
          });
      } else {
          const content = file.data.length > 500000 ? file.data.substring(0, 500000) + "...(truncated)" : file.data;
          fileParts.push({ 
              text: `\n\n--- START OF FILE: "${file.fileName}" (DATA) ---\n${content}\n--- END OF FILE ---\n` 
          });
      }
  }
  return fileParts;
};

export const analyzeFinancialData = async (
  filesInput: ProcessedFile[], 
  language: Language = 'it',
  manualApiKey?: string
): Promise<FinancialAnalysis> => {
  
  const apiKey = getApiKey(manualApiKey);
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  const targetLang = languageMap[language];

  let promptText = `
    Role: You are "FinSight CFO", a world-class Virtual CFO.
    
    TARGET LANGUAGE: ${targetLang}
    CRITICAL: All textual output (summaries, insights, labels, titles) MUST be written in ${targetLang}.
    
    TASK:
    Perform a "Deep Dive Financial Analysis" on the provided documents.
    
    MULTI-FILE CONTEXT:
    You have been provided with ${filesInput.length} file(s). 
    - You must synthesize information across ALL files. 
    - If files represent different years (e.g., "Balance 2022", "Balance 2023"), use them to build the trend analysis.
    - If files represent different sections (e.g., "P&L", "Balance Sheet"), combine them to calculate ratios like ROE/ROI.
    
    CRITICAL - ENTITY EXTRACTION:
    1. **FIND THE COMPANY NAME**: Scan the headers/filenames. Find the exact Legal Entity Name.
    
    CRITICAL - DEPTH OF ANALYSIS:
    1. Do not be generic. Use technical terms (EBITDA, NFP, ROE, ROS, Financial Leverage).
    2. The text sections must be LONG and DETAILED (min 150 words per section).
    3. Explain the "Why" behind the numbers.
    
    OUTPUT:
    Generate a strict JSON following the schema.
    
    Calculations required for Radar Chart (0-100):
    - Profitability (Translate to ${targetLang})
    - Liquidity (Translate to ${targetLang})
    - Solvency (Translate to ${targetLang})
    - Efficiency (Translate to ${targetLang})
    - Growth (Translate to ${targetLang})
  `;

  const promptPart = { text: promptText };
  const fileParts = buildFileParts(filesInput);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
        {
            parts: [promptPart, ...fileParts]
        }
    ],
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING, description: "The exact company name found in the document." },
          reportDate: { type: Type.STRING, description: "Reference date (e.g., 'FY 2023')." },
          methodology: { type: Type.STRING, description: "Brief note on which files were analyzed and how data was aggregated." },
          executiveSummary: { type: Type.STRING, description: "Very detailed discursive analysis (min 200 words)." },
          financialHealthScore: { type: Type.NUMBER, description: "General score 0-100." },
          
          healthRadar: {
            type: Type.ARRAY,
            description: "5 dimensions for radar chart.",
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING, description: `Dimension name in ${targetLang}` },
                A: { type: Type.NUMBER, description: "Value 0-100" },
                fullMark: { type: Type.NUMBER, description: "Always 100" }
              }
            }
          },

          kpis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: `KPI Name in ${targetLang}` },
                value: { type: Type.STRING },
                unit: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "neutral"] },
                color: { type: Type.STRING, enum: ["green", "red", "blue", "yellow"] },
                insight: { type: Type.STRING, description: `Brief insight in ${targetLang}` }
              }
            }
          },
          historicalData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                period: { type: Type.STRING },
                revenue: { type: Type.NUMBER },
                profit: { type: Type.NUMBER },
                costs: { type: Type.NUMBER },
                ebitdaMargin: { type: Type.NUMBER, description: "Percentage (0-100)" },
                cashFlow: { type: Type.NUMBER }
              }
            }
          },
          
          swotAnalysis: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },

          profitabilityAnalysis: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING, description: "Very long and detailed analysis." }
            }
          },
          liquidityAnalysis: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING, description: "Very long and detailed analysis." }
            }
          },
          growthAnalysis: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING, description: "Analysis of growth trends." }
            }
          },

          strategicInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["companyName", "executiveSummary", "financialHealthScore", "healthRadar", "kpis", "historicalData", "swotAnalysis", "strategicInsights", "recommendations", "profitabilityAnalysis", "liquidityAnalysis", "growthAnalysis"]
      }
    }
  });

  if (!response.text) {
    throw new Error("AI did not generate a valid response.");
  }

  try {
    return JSON.parse(response.text) as FinancialAnalysis;
  } catch (e) {
    console.error("JSON Parsing Error", response.text);
    throw new Error("Error in AI response format.");
  }
};

// --- MODIFIED FUNCTION: CHAT WITH AGENT (MODIFIES REPORT) ---

export const queryFinancialAgent = async (
    filesInput: ProcessedFile[], 
    currentAnalysis: FinancialAnalysis,
    history: ChatMessage[],
    userQuestion: string,
    language: Language = 'it',
    manualApiKey?: string
): Promise<ChatResponse> => {

    const apiKey = getApiKey(manualApiKey);
    if (!apiKey) throw new Error("MISSING_API_KEY");
  
    const ai = new GoogleGenAI({ apiKey });
    const targetLang = languageMap[language];

    // Build context from history
    const historyText = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n");

    const promptText = `
        Role: You are "FinSight CFO", the editor of the financial report.
        
        GOAL:
        The user wants to either ask a question OR MODIFY the report structure/content.
        
        CONTEXT:
        Current Analysis JSON: ${JSON.stringify(currentAnalysis).substring(0, 10000)}... (truncated context)
        
        USER REQUEST:
        "${userQuestion}"
        
        INSTRUCTIONS:
        1. If the user asks a question, answer in 'answer'.
        2. IF the user asks to CHANGE something (e.g., "Add a chart about X", "Rewrite the summary", "Add a section about Risk"), you MUST return the 'updatedAnalysis' object.
        3. 'updatedAnalysis' should be a partial JSON of 'FinancialAnalysis'. I will merge it into the main state.
        
        EXAMPLES OF MODIFICATIONS:
        - "Add a chart regarding labor costs":
          updatedAnalysis: { 
            customSections: [ ...currentAnalysis.customSections, { id: "new_1", title: "Labor Cost Analysis", content: "...", chart: { ... } } ] 
          }
        - "Rewrite Executive Summary to be shorter":
          updatedAnalysis: { executiveSummary: "New shorter text..." }
        - "Add a strategic insight":
          updatedAnalysis: { strategicInsights: [...current, "New Insight"] }
        
        CHART DATA STRUCTURE (inside customSections):
        "chart": {
             "title": "Title",
             "type": "bar" | "line" | "area" | "composed",
             "xAxisKey": "period", 
             "data": [{ "period": "2023", "value": 100 }],
             "dataKeys": [{ "key": "value", "color": "#2563eb", "name": "Label" }]
        }

        OUTPUT JSON FORMAT:
        {
          "answer": "Text reply to user (e.g., 'I have updated the report with a new section regarding...')",
          "updatedAnalysis": { ...partial fields to update... }
        }
    `;

    const promptPart = { text: promptText };
    const fileParts = buildFileParts(filesInput);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                parts: [promptPart, ...fileParts]
            }
        ],
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
        }
    });

    if (!response.text) throw new Error("No response from AI agent");

    try {
      return JSON.parse(response.text) as ChatResponse;
    } catch (e) {
      console.error("Chat JSON Error", response.text);
      throw new Error("Invalid response format from Chat Agent");
    }
}
