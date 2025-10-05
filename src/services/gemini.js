import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import Constants from "expo-constants";
const apiKey = Constants.expoConfig?.extra?.apiKey ;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 0.9,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// System prompt to define Quotie AI's personality and capabilities
const QUOTIE_SYSTEM_PROMPT = `You are Quotie AI, a friendly and knowledgeable AI assistant designed specifically for freelancers. You have two main roles:

1. QUOTATION EXPERT: Help freelancers create professional project quotations with accurate pricing, timelines, and task breakdowns.

2. FREELANCER BUDDY: Provide general advice, motivation, and support for freelancers on their journey.

When users ask for quotations or project estimates, analyze their project description and provide:
- A clear project title
- Realistic budget breakdown
- Task-by-task timeline and pricing
- Professional recommendations

For general conversations, be supportive, motivational, and share practical freelancing wisdom.

Always maintain a friendly, encouraging tone while being professional. Remember - you're both a tool and a companion for freelancers!`;

async function run(prompt) {
  const chat = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [{ text: QUOTIE_SYSTEM_PROMPT }]
      },
      {
        role: "model",
        parts: [{ text: "Hello! I'm Quotie AI, your freelancing companion! 🚀\n\nI'm here to help you create professional project quotations and be your freelancing buddy. Whether you need help pricing a project, breaking down tasks, or just want some advice and motivation, I've got your back!\n\nWhat can I help you with today? Are you working on a new project that needs a quotation, or would you like to chat about freelancing?" }]
      }
    ]
  });

  try {
    const res = await chat.sendMessage(prompt);
    const response = res.response.text();
    console.log("Quotie AI:", response);
    return response;
  } catch (error) {
    console.error("Error with Quotie AI:", error);
    return "I apologize, but I'm having trouble responding right now. Please try again in a moment!";
  }
}

// Additional helper function specifically for quotation generation
async function generateQuotation(projectDescription) {
  const chat = model.startChat({
    generationConfig: {
      ...generationConfig,
      temperature: 0.7, // Lower temperature for more consistent quotations
    },
    history: []
  });

  const quotationPrompt = `Please analyze this project description and create a professional quotation. Provide your response in a clear, structured format with:

PROJECT TITLE: [Creative and descriptive title]

PROJECT OVERVIEW: [Brief 2-3 sentence summary]

BUDGET BREAKDOWN:
• Total Estimated Budget: [Amount] [Currency]
• Timeline: [X weeks/days]

TASK BREAKDOWN:
1. [Task Name] - [X hours] hours at [Rate]/hour = [Subtotal]
2. [Task Name] - [X hours] hours at [Rate]/hour = [Subtotal]
...

RECOMMENDATIONS:
• [Professional advice or considerations]

Project Description: ${projectDescription}

Please make the quotation realistic and industry-appropriate.`;

  try {
    const res = await chat.sendMessage(quotationPrompt);
    const quotation = res.response.text();
    console.log("Generated Quotation:", quotation);
    return quotation;
  } catch (error) {
    console.error("Error generating quotation:", error);
    return "I apologize, but I'm having trouble generating the quotation right now. Please try again with a more detailed project description!";
  }
}

export default run;
export { generateQuotation };