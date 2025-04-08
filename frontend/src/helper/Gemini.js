import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY });

async function askGemini(code, question) {
  const prompt = `
  You are a helpful coding assistant.
  
  Below is some code:
  
  \`\`\`js
  ${code}
  \`\`\`
  
  And here's a question/request about modifying the code:
  
  "${question}"
  
  Please provide the updated code only, properly formatted with correct indentation, spacing, and new lines.
  Wrap the result in a single \`\`\`js block.
  `;

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text =
    result.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

  return text;
}

export default askGemini;
