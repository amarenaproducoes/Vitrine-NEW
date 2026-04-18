import { GoogleGenAI } from "@google/genai";
import { logger } from "../lib/logger";

export class AgencyAssistant {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
      logger.error("Gemini Error:", error);
      return "Olá! Sou o assistente da 'Aparece aí por aqui'. Como posso ajudar você a dar mais visibilidade ao seu negócio hoje?";
    }
  }

  async generatePartnerDescription(name: string, category: string, activity: string, currentDescription: string, observations: string) {
    try {
      const prompt = `
O usuário quer gerar uma descrição chamativa e persuasiva para um parceiro comercial na plataforma "Aparece aí por aqui".
A descrição será usada na vitrine online para atrair clientes.

Nome: ${name}
Categoria: ${category}
Atividade (Nicho): ${activity}
Ideia inicial de descrição: ${currentDescription}
Observações Importantes: ${observations}

Diretrizes OBRIGATÓRIAS:
- A descrição DEVE ter no MÁXIMO 600 caracteres.
- NÃO inclua o endereço na descrição (frequentemente as pessoas tentam colocar cidade ou rua na descrição, ignore isso).
- Seja amigável, focado nos benefícios e de forma atraente para os clientes.
- Somente retorne o texto da descrição gerada, sem aspas extras, sem introduções.
`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });
      return response.text?.trim() || "";
    } catch (error) {
      logger.error("Gemini Error - generatePartnerDescription:", error);
      return "";
    }
  }
}

