
import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in the environment.");
      return null;
    }
    try {
      aiInstance = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  }
  return aiInstance;
};

export const getSmartInsights = async (data: unknown, type: 'DIRECTOR' | 'CPE') => {
  const prompt = type === 'DIRECTOR' 
    ? `Analyse ces données scolaires : ${JSON.stringify(data)}. Donne 3 points clés de gestion financière et disciplinaire.`
    : `Analyse ces alertes d'absentéisme : ${JSON.stringify(data)}. Identifie les cas critiques.`;

  try {
    const ai = getAI();
    if (!ai) return "Configuration IA manquante.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Aucune analyse générée.";
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini Error Details:", err);
    if (err.message?.includes('Rpc failed')) {
      return "Erreur de connexion aux serveurs Google AI. Vérifiez votre connexion internet.";
    }
    return `Analyse indisponible: ${err.message || 'Erreur inconnue'}`;
  }
};

export const getRevisionHelp = async (subject: string, topic: string) => {
  const prompt = `Tu es un tuteur IA pour un élève de lycée. Pour le sujet "${topic}" en "${subject}", fournis : 
  1. Un résumé flash (5 points clés).
  2. 3 questions de quiz (QCM) avec les réponses à la fin.
  Sois encourageant et concis.`;

  try {
    const ai = getAI();
    if (!ai) return "Configuration IA manquante.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Aucun contenu généré.";
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini Error Details:", err);
    if (err.message?.includes('Rpc failed')) {
      return "Le tuteur IA a un problème de connexion. Réessaie plus tard.";
    }
    return `Le tuteur IA se repose: ${err.message || 'Erreur inconnue'}`;
  }
};
