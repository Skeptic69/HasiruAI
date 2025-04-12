import { GoogleGenerativeAI } from '@google/generative-ai';

export class VertexAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chatSession: any;

  constructor() {
    console.log('Available env vars:', Object.keys(process.env));
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
    
    const apiKey = 'AIzaSyDF322wMDlK6cMiiUSz5JBLGXAXWUNHgUE';
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'only give answers related to farmers and or farming.',
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseModalities: [],
      responseMimeType: 'text/plain',
    };

    this.chatSession = this.model.startChat({
      generationConfig,
      history: [],
    });
  }

  async generateResponse(prompt: string, context: string = ''): Promise<string> {
    try {
      const fullPrompt = context ? `${context}\n${prompt}` : prompt;
      const result = await this.chatSession.sendMessage(fullPrompt);
      
      // Process any inline data (images, etc.)
      const candidates = result.response.candidates;
      if (candidates) {
        for (const candidate of candidates) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              // For now, we'll just log that we received inline data
              // In a real implementation, you might want to handle this data differently
              console.log('Received inline data:', part.inlineData.mimeType);
            }
          }
        }
      }

      return result.response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }
}

export default new VertexAIService();
