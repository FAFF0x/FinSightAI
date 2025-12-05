
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
  fileInput: ProcessedFile, 
  language: Language = 'it',
  manualApiKey?: string
): Promise<FinancialAnalysis> => {
  
  // 1. Prioritize Manual Key (if user entered one in UI)
  let apiKey = manualApiKey;

  // 2. If no manual key, check Environment Variables explicitly.
  // CRITICAL: We must access these properties STATICALLY (e.g., process.env.API_KEY) 
  // and NOT dynamically (e.g., process.env[key]) so that bundlers (Vite, Webpack, Vercel) 
  // can detect and replace them with the actual values during build time.
  
  if (!apiKey) {
    try {
      // Check standard React/Node env var
      if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env.REACT_APP_API_KEY || 
                 process.env.NEXT_PUBLIC_API_KEY || 
                 process.env.API_KEY;
      }
    } catch (e) {
      // Ignore errors if process is not defined
    }
  }

  if (!apiKey) {
    try {
      // Check Vite specific env var
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
      }
    } catch (e) {
      // Ignore errors if import.meta is not defined
    }
  }

  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const targetLang = languageMap[language];

  // Increased complexity prompt for deeper analysis
  let promptText = `
    Role: You are "FinSight CFO", a world-class Virtual CFO.
    
    TARGET LANGUAGE: ${targetLang}
    CRITICAL: All textual output (summaries, insights, labels, titles) MUST be written in ${targetLang}.
    
    TASK:
    Perform a "Deep Dive Financial Analysis" on the provided document.
    
    IMPORTANTE - MULTI-SHEET:
    The input file may contain DATA FROM MULTIPLE SHEETS (identified as --- SHEET: "Name" ---).
    You must analyze ALL sheets to find the necessary information (e.g., P&L in one sheet, Balance Sheet in another). Combine the data consistently.
    
    CRITICAL - ENTITY EXTRACTION:
    1. **FIND THE COMPANY NAME**: Scan the header, the first page, or the first rows of the Excel file. You must find the exact Legal Entity Name (e.g., "Rossi S.r.l.", "Mario Rossi SpA"). If missing, infer the sector.
    
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

  const contents = [];
  
  if (fileInput.mimeType === 'application/pdf') {
    contents.push({
      parts: [
        { text: promptText },
        { inlineData: { mimeType: 'application/pdf', data: fileInput.data } }
      ]
    });
  } else {
    // Truncate to avoid token limits if extremely large, but maximize context
    const dataContext = fileInput.data.length > 900000 ? fileInput.data.substring(0, 900000) : fileInput.data;
    contents.push({
      parts: [
        { text: promptText + "\n\nDATI INPUT (Raw Data):\n" + dataContext }
      ]
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      temperature: 0.2, // Low temp for precision
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING, description: "The exact company name found in the document." },
          reportDate: { type: Type.STRING, description: "Reference date (e.g., 'FY 2023')." },
          methodology: { type: Type.STRING, description: "Brief note on how data was read and interpreted." },
          executiveSummary: { type: Type.STRING, description: "Very detailed discursive analysis (min 200 words)." },
          financialHealthScore: { type: Type.NUMBER, description: "General score 0-100." },
          
          healthRadar: {
            type: Type.ARRAY,
            description: "5 dimensions for radar chart.",
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING, description: `Dimension name in ${targetLang} (e.g., Profitability, Liquidity)` },
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
