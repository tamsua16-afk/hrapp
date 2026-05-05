import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

export interface ScreeningResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  interviewQuestions: string[];
  recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
}

export async function screenCV(jd: string, cvText: string): Promise<ScreeningResult> {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are an expert HR Specialist and Technical Recruiter. 
    Analyze the following CV against the Job Description (JD).
    
    JOB DESCRIPTION:
    ${jd}
    
    CANDIDATE CV:
    ${cvText}
    
    Provide a detailed screening result in JSON format with the following structure.
    IMPORTANT: All text content (summary, strengths, weaknesses, interviewQuestions) MUST be in Vietnamese.
    
    {
      "score": number (0-100),
      "summary": "Tóm tắt chuyên nghiệp về mức độ phù hợp của ứng viên",
      "strengths": ["ưu điểm 1", "ưu điểm 2", ...],
      "weaknesses": ["nhược điểm 1", "nhược điểm 2", ...],
      "interviewQuestions": ["câu hỏi 1", "câu hỏi 2", ...],
      "recommendation": "Strong Hire" | "Hire" | "Maybe" | "Reject"
    }
    
    Ensure the response is valid JSON.
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendation: { type: Type.STRING, enum: ['Strong Hire', 'Hire', 'Maybe', 'Reject'] }
        },
        required: ["score", "summary", "strengths", "weaknesses", "interviewQuestions", "recommendation"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as ScreeningResult;
}
