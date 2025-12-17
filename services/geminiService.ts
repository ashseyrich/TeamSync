import { GoogleGenAI, Type } from "@google/genai";
import type { TeamMember, Role, MemberDebrief, VideoAnalysis, TrainingScenarioItem, SuggestedAssignment, VideoAnalysisResult, VideoAnalysisTrends, DebriefAnalysisSummary, GrowthResource, PrayerPoint, View, ServiceEvent, Briefing, Skill, TeamFeatures, Scripture, Achievement } from '../types.ts';

const parseJsonResponse = <T>(text: string, schemaType: string): T => {
  try {
    const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error(`Failed to parse ${schemaType} JSON:`, e);
    throw new Error(`The model returned an invalid ${schemaType} format.`);
  }
};

export const analyzeVideo = async (videoUrl: string): Promise<VideoAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this church service video: ${videoUrl}. Provide a summary, 3-5 positive points, 3-5 areas for improvement, a "bestShot" description, and a "shotForImprovement" description.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          positiveFeedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
          bestShot: { type: Type.STRING },
          shotForImprovement: { type: Type.STRING },
        },
        required: ['summary', 'positiveFeedback', 'areasForImprovement', 'bestShot', 'shotForImprovement'],
      }
    }
  });
  return parseJsonResponse<VideoAnalysisResult>(response.text, "video analysis");
};

export const analyzeVideoHistory = async (history: VideoAnalysis[]): Promise<VideoAnalysisTrends> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const historySummary = history.map(h => ({
    summary: h.result.summary,
    strengths: h.result.positiveFeedback,
    weaknesses: h.result.areasForImprovement,
  }));
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze these trends: ${JSON.stringify(historySummary)}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallSummary: { type: Type.STRING },
          recurringStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          recurringImprovementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['overallSummary', 'recurringStrengths', 'recurringImprovementAreas'],
      }
    }
  });
  return parseJsonResponse<VideoAnalysisTrends>(response.text, "video trend analysis");
};

export const generateAttireImage = async (theme: string, description: string, gender: 'male' | 'female'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A full-body photo of a ${gender} person wearing an outfit for church: "${theme} - ${description}". Photorealistic, neutral background.` }
      ]
    },
    config: {
      imageConfig: { aspectRatio: "3:4" }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return part.inlineData.data;
  }
  throw new Error("No image was returned.");
};

export const suggestSchedule = async (prompt: string, members: TeamMember[], roles: Role[]): Promise<SuggestedAssignment[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Suggest a schedule for these members: ${JSON.stringify(members.map(m => ({ id: m.id, name: m.name, skills: m.skills, availability: m.availability })))} for these roles: ${JSON.stringify(roles)}. User request: ${prompt}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        roleId: { type: Type.STRING },
                        memberId: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ['roleId', 'memberId', 'reasoning'],
                }
            }
        }
    });
    return parseJsonResponse<SuggestedAssignment[]>(response.text, "schedule suggestion");
};

export const generateEncouragementVideo = async (): Promise<{ script: string, videoUrl: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const scriptResponse = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: "Write a short, encouraging 100-word script for a church media team about excellence." 
  });
  const script = scriptResponse.text;
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: "An inspiring, abstract motion graphics video with gold and blue light flares. Cinematic.",
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed.");
  return { script, videoUrl: `${downloadLink}&key=${process.env.API_KEY}` };
};

export const generateTrainingScenario = async (skill: string, teamType: string, teamDescription?: string): Promise<TrainingScenarioItem> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a training scenario for a church ${teamType} team focusing on ${skill}. ${teamDescription || ''}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scenario: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                isCorrect: { type: Type.BOOLEAN },
                                feedback: { type: Type.STRING }
                            },
                             required: ['text', 'isCorrect', 'feedback'],
                        }
                    }
                },
                required: ['scenario', 'question', 'options'],
            }
        }
    });
    return parseJsonResponse<TrainingScenarioItem>(response.text, "training scenario");
};

export const analyzeDebriefs = async (debriefs: MemberDebrief[]): Promise<DebriefAnalysisSummary> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze these team debriefs: ${JSON.stringify(debriefs)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    overallSummary: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
                    growthOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['overallSummary', 'strengths', 'areasForImprovement', 'growthOpportunities'],
            }
        }
    });
    return parseJsonResponse<DebriefAnalysisSummary>(response.text, "debrief analysis");
};

export const generateDailyPrayerPoints = async (teamType: string, teamDescription?: string): Promise<Omit<PrayerPoint, 'id'>[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 3 prayer points for a church ${teamType} team. ${teamDescription || ''}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { text: { type: Type.STRING } },
                    required: ['text'],
                }
            }
        }
    });
    return parseJsonResponse<Omit<PrayerPoint, 'id'>[]>(response.text, "prayer points");
};

export const generateVerseOfTheDay = async (teamType: string, teamDescription?: string): Promise<Scripture> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Select a relevant Bible verse for a ${teamType} team.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    reference: { type: Type.STRING },
                    text: { type: Type.STRING }
                },
                required: ['reference', 'text'],
            }
        }
    });
    return parseJsonResponse<Scripture>(response.text, "verse of the day");
};

export const generatePerformanceFeedback = async (alertType: 'lateness' | 'no-shows'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: `Provide one short, encouraging tip for a volunteer struggling with ${alertType}.` 
    });
    return response.text;
};

export const generateGrowthPlan = async (growthAreas: string[]): Promise<GrowthResource[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Suggest 3-4 resources for growth in: ${growthAreas.join(', ')}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        url: { type: Type.STRING },
                    },
                     required: ['type', 'title', 'description'],
                }
            }
        }
    });
    return parseJsonResponse<GrowthResource[]>(response.text, "growth plan");
};

export const generateRoleBriefing = async (event: ServiceEvent, role: Role): Promise<Briefing> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a role briefing for ${role.name} at ${event.name}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyFocusPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
                    communicationCues: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['keyFocusPoints', 'potentialChallenges', 'communicationCues'],
            }
        }
    });
    return parseJsonResponse<Briefing>(response.text, "role briefing");
};

export const generateTeamTemplate = async (description: string, focusAreas: string[] = []): Promise<{ roles: Role[]; skills: Skill[]; features: TeamFeatures; achievements: Achievement[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a team template for: ${description}. Focus areas: ${focusAreas.join(', ')}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    roles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, requiredSkillId: { type: Type.STRING } }, required: ['id', 'name'] } },
                    skills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING } }, required: ['id', 'name'] } },
                    features: { type: Type.OBJECT, properties: { videoAnalysis: { type: Type.BOOLEAN }, attire: { type: Type.BOOLEAN }, training: { type: Type.BOOLEAN } }, required: ['videoAnalysis', 'attire', 'training'] },
                    achievements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, icon: { type: Type.STRING } }, required: ['id', 'name', 'description', 'icon'] } }
                },
                required: ['roles', 'skills', 'features', 'achievements'],
            }
        }
    });
    return parseJsonResponse(response.text, "team template");
};