
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialAnalysis, Language } from "../types";
import { ProcessedFile } from "./excelService";

const languageMap: Record<Language, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch"
};

export const analyzeFinancialData = async (
  filesInput: ProcessedFile[], 
  language: Language = 'it',
  manualApiKey?: string
): Promise<FinancialAnalysis> => {
  
  // 1. Prioritize Manual Key
  let apiKey = manualApiKey;

  // 2. Check Environment Variables aggressively (with try-catch for bundlers)
  if (!apiKey) { try { apiKey = process.env.REACT_APP_API_KEY; } catch (e) {} }
  if (!apiKey) { try { apiKey = process.env.NEXT_PUBLIC_API_KEY; } catch (e) {} }
  if (!apiKey) { try { apiKey = process.env.VITE_API_KEY; } catch (e) {} }
  if (!apiKey) { try { apiKey = process.env.API_KEY; } catch (e) {} }

  // 3. Check Vite import.meta.env
  if (!apiKey) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
      }
    } catch (e) { /* ignore */ }
  }

  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const targetLang = languageMap[language];

  // Prompt Construction
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

  // Build the contents array
  const promptPart = { text: promptText };
  const fileParts: any[] = [];

  for (const file of filesInput) {
      if (file.mimeType === 'application/pdf') {
          // For PDFs, we add a text label then the inline data
          fileParts.push({ text: `\n\n--- START OF FILE: "${file.fileName}" (PDF) ---\n` });
          fileParts.push({ 
              inlineData: { 
                  mimeType: 'application/pdf', 
                  data: file.data 
              } 
          });
      } else {
          // For Text/Excel, we wrap the content in headers
          // Truncate individual text files if they are massive to save context, though 1M is large.
          const content = file.data.length > 500000 ? file.data.substring(0, 500000) + "...(truncated)" : file.data;
          fileParts.push({ 
              text: `\n\n--- START OF FILE: "${file.fileName}" (DATA) ---\n${content}\n--- END OF FILE ---\n` 
          });
      }
  }

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
