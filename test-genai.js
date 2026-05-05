import { GoogleGenAI, Type } from '@google/genai';
const genAI = new GoogleGenAI({ apiKey: "fake-key" });

async function run() {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: "tell me a joke" }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
          },
          required: ["score"]
        }
      }
    });
    console.log(response);
  } catch (e) {
    console.error("ERROR TYPE:", e.name);
    console.error("ERROR MESSAGE:", e.message);
  }
}
run();
