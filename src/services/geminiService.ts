import { GoogleGenAI } from "@google/genai";

export class AgencyAssistant {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getAdvice(userInput: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userInput,
        config: {
          systemInstruction: "Você é o assistente virtual da agência 'Aparece aí por aqui'. Sua função é explicar como os anúncios em TVs de estabelecimentos funcionam, os benefícios de anunciar e incentivar o usuário a preencher o formulário de contato. Seja amigável, profissional e direto.",
          temperature: 0.7,
        },
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Olá! Sou o assistente da 'Aparece aí por aqui'. Como posso ajudar você a dar mais visibilidade ao seu negócio hoje?";
    }
  }
}
