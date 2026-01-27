
import { GoogleGenAI, Type } from "@google/genai";
import { Proficiency } from '../types.ts';
import type { TeamMember, Role, MemberDebrief, VideoAnalysis, TrainingScenarioItem, SuggestedAssignment, VideoAnalysisResult, VideoAnalysisTrends, DebriefAnalysisSummary, GrowthResource, PrayerPoint, View, ServiceEvent, Briefing, Skill, TeamFeatures, Scripture, Achievement, MasteryGuidance, TeamMission } from '../types.ts';

const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key || key === '' || key === 'undefined') {
    console.warn("⚠️ Gemini API Key is missing. AI features will be disabled. To fix this on Netlify: Add 'API_KEY' to your environment variables.");
    return '';
  }
  return key;
};

const parseJsonResponse = <T>(text: string, schemaType: string): T => {
  try {
    // 1. First attempt: Standard clean
    const cleanText = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    // 2. Second attempt: Find the first { and last } to bypass conversational filler
    try {
      const firstBracket = text.indexOf('{');
      const lastBracket = text.lastIndexOf('}');
      if (firstBracket !== -1 && lastBracket !== -1) {
        const jsonOnly = text.substring(firstBracket, lastBracket + 1);
        return JSON.parse(jsonOnly) as T;
      }
    } catch (innerE) {
      console.error(`Gemini Parsing Error (${schemaType}):`, innerE);
    }
    
    console.error(`Failed to parse ${schemaType} response. Raw text:`, text);
    throw new Error(`The model returned an unexpected format for ${schemaType}. Please try again.`);
  }
};

const checkApiKey = () => {
    const key = getApiKey();
    if (!key) throw new Error("AI Configuration Missing: Please add your Gemini API Key to the environment variables (API_KEY).");
    return key;
}

export const analyzeVideo = async (videoUrl: string): Promise<VideoAnalysisResult> => {
  const apiKey = checkApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this church service video for technical production quality: ${videoUrl}. 
    Focus on audio mix (levels, clarity), camera framing (rule of thirds, stability), and software transitions (timing, aesthetics).
    Provide a professional summary, 3-5 positive points, 3-5 areas for improvement, 
    a "howToFix" list of specific, step-by-step actionable solutions for the identified improvement areas,
    a "bestShot" description, and a "shotForImprovement" description.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          positiveFeedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
          howToFix: { type: Type.ARRAY, items: { type: Type.STRING } },
          bestShot: { type: Type.STRING },
          shotForImprovement: { type: Type.STRING },
        },
        required: ['summary', 'positiveFeedback', 'areasForImprovement', 'howToFix', 'bestShot', 'shotForImprovement'],
      }
    }
  });
  return parseJsonResponse<VideoAnalysisResult>(response.text, "video analysis");
};

export const generateTeamMission = async (recentAnalyses: VideoAnalysis[]): Promise<TeamMission> => {
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const context = recentAnalyses.slice(-3).map(a => ({
        strengths: a.result.positiveFeedback,
        weaknesses: a.result.areasForImprovement
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on these recent technical reviews: ${JSON.stringify(context)}, generate a single, highly focused "Team Mission" for the upcoming church service. 
        It should be one specific technical goal the whole media team can unite around.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                },
                required: ['title', 'objective', 'reasoning']
            }
        }
    });
    return parseJsonResponse<TeamMission>(response.text, "team mission");
};

export const generateMasteryGuidance = async (skillName: string, currentLevel: Proficiency): Promise<MasteryGuidance> => {
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const levels = Object.values(Proficiency);
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentIndex + 1] || Proficiency.MASTER_TRAINER;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I am currently a "${currentLevel}" in "${skillName}". Provide a structured mastery pathway to reach the "${nextLevel}" level. 
        Include 3 specific, highly technical tasks I should master or perform in a live church environment.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    currentLevel: { type: Type.STRING },
                    nextLevel: { type: Type.STRING },
                    steps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                task: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ['task', 'description']
                        }
                    }
                },
                required: ['currentLevel', 'nextLevel', 'steps']
            }
        }
    });
    return parseJsonResponse<MasteryGuidance>(response.text, "mastery guidance");
};

export const analyzeVideoHistory = async (history: VideoAnalysis[]): Promise<VideoAnalysisTrends> => {
  const apiKey = checkApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const historySummary = history.map(h => ({
    summary: h.result.summary,
    strengths: h.result.positiveFeedback,
    weaknesses: h.result.areasForImprovement,
  }));
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze these recurring technical trends from past church service reviews: ${JSON.stringify(historySummary)}`,
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

export const generateAttireImage = async (theme: string, description: string, colors: string[], gender: 'male' | 'female'): Promise<string> => {
  const apiKey = checkApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const colorDesc = colors.length > 0 ? ` with a color palette of ${colors.join(', ')}` : '';
  const prompt = `A professional, full-body photo of a ${gender} church media team member wearing an outfit matching the theme: "${theme}". Description: "${description}"${colorDesc}. High-quality, cinematic lighting, modern church background.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: prompt }
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
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
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
  const apiKey = checkApiKey();
  const ai = new GoogleGenAI({ apiKey });
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
  return { script, videoUrl: `${downloadLink}&key=${apiKey}` };
};

export const generateTrainingScenario = async (skill: string, teamType: string, teamDescription?: string): Promise<TrainingScenarioItem> => {
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
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

export const analyzeDebriefs = async (debriefs: MemberDebrief[], preparednessData: any[]): Promise<DebriefAnalysisSummary> => {
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Perform a Comprehensive Team Health Audit. 
        QUALITATIVE FEEDBACK (Member Debriefs): ${JSON.stringify(debriefs)}
        QUANTITATIVE AUDIT (Preparedness Checklists): ${JSON.stringify(preparednessData)}
        
        Analyze how preparedness levels correlate with the team's feedback. 
        Identify if technical failures mentioned in debriefs align with incomplete checklist steps. 
        Provide a summary, recurring strengths, areas for improvement, and growth opportunities.`,
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
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
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
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
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
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: `Provide one short, encouraging tip for a volunteer struggling with ${alertType}.` 
    });
    return response.text;
};

export const generateGrowthPlan = async (growthAreas: string[]): Promise<GrowthResource[]> => {
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
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
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
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

export const generateTeamTemplate = async (description: string, focusAreas: string[] = []): Promise<{ roles: Role[]; skills: Skill[]; features: TeamFeatures; achievements: Achievement[]; corporateChecklist: string[] }> => {
    const apiKey = checkApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a team template for: ${description}. Focus areas: ${focusAreas.join(', ')}. 
        Generate relevant roles with specific "defaultChecklist" items (at least 3 technical tasks per role).
        Generate a "corporateChecklist" of at least 3 tasks shared by the whole team (collective mission).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    roles: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                id: { type: Type.STRING }, 
                                name: { type: Type.STRING }, 
                                requiredSkillId: { type: Type.STRING },
                                defaultChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }, 
                            required: ['id', 'name', 'defaultChecklist'] 
                        } 
                    },
                    skills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING } }, required: ['id', 'name'] } },
                    features: { type: Type.OBJECT, properties: { videoAnalysis: { type: Type.BOOLEAN }, attire: { type: Type.BOOLEAN }, training: { type: Type.BOOLEAN } }, required: ['videoAnalysis', 'attire', 'training'] },
                    achievements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, icon: { type: Type.STRING } }, required: ['id', 'name', 'description', 'icon'] } },
                    corporateChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['roles', 'skills', 'features', 'achievements', 'corporateChecklist'],
            }
        }
    });
    return parseJsonResponse(response.text, "team template");
};
