
import { GoogleGenAI, Type } from "@google/genai";
import type { TeamMember, Role, MemberDebrief, VideoAnalysis, TrainingScenarioItem, SuggestedAssignment, VideoAnalysisResult, VideoAnalysisTrends, DebriefAnalysisSummary, GrowthResource, PrayerPoint, View, ServiceEvent, Briefing, Skill, TeamFeatures, Scripture, Achievement } from '../types.ts';

// Helper to handle potential JSON parsing errors
const parseJsonResponse = <T>(text: string, schemaType: string): T => {
  try {
    // The Gemini API might sometimes wrap the JSON in markdown backticks.
    const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error(`Failed to parse ${schemaType} JSON:`, e);
    console.error("Raw response text:", text);
    throw new Error(`The model returned an invalid ${schemaType} format.`);
  }
};


export const analyzeVideo = async (videoUrl: string): Promise<VideoAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const model = 'gemini-2.5-pro';
  const prompt = `
    Analyze the following church service video from this URL: ${videoUrl}.
    Focus on the production quality from a broadcast perspective.
    Provide a summary, 3-5 points of positive feedback, and 3-5 areas for improvement.
    Also, identify the single "bestShot" of the service (e.g., a well-composed frame, a smooth camera move) and describe it, and one "shotForImprovement" that could have been better, describing why.
    Format the response as a JSON object with keys: "summary", "positiveFeedback", "areasForImprovement", "bestShot", and "shotForImprovement".
    Example: { "summary": "...", "positiveFeedback": ["..."], "areasForImprovement": ["..."], "bestShot": "...", "shotForImprovement": "..." }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
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
  const model = 'gemini-2.5-pro';
  const historySummary = history.map(h => ({
    summary: h.result.summary,
    strengths: h.result.positiveFeedback,
    weaknesses: h.result.areasForImprovement,
  }));

  const prompt = `
    Analyze this history of church service video analyses: ${JSON.stringify(historySummary)}.
    Identify recurring themes and trends.
    Provide an overall summary of improvement over time, a list of recurring strengths, and a list of recurring areas for improvement.
    Format the response as a JSON object with keys: "overallSummary", "recurringStrengths", and "recurringImprovementAreas".
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
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
  const model = 'imagen-4.0-generate-001';
  const prompt = `A full-body photo of a ${gender} person wearing an outfit suitable for a church service. The style should reflect: "${theme} - ${description}". The person should be standing against a plain, neutral background. Photorealistic.`;

  const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '3:4',
      },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("Image generation failed.");
  }
  
  return response.generatedImages[0].image.imageBytes;
};


export const suggestSchedule = async (prompt: string, members: TeamMember[], roles: Role[]): Promise<SuggestedAssignment[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const model = 'gemini-2.5-pro';
    const context = `
        You are an AI scheduling assistant for a church media team.
        Your task is to suggest a schedule for an upcoming service based on a user's request.
        
        Available Team Members: ${JSON.stringify(members.map(m => ({ id: m.id, name: m.name, skills: m.skills, availability: m.availability, status: m.status })))}
        Roles to be filled: ${JSON.stringify(roles.map(r => ({ id: r.id, name: r.name, requiredSkillId: r.requiredSkillId })))}
        User's Request: "${prompt}"

        Please provide a list of suggested assignments. For each role, provide the memberId and a brief reasoning for your choice.
        Prioritize members with the required skills and 'active' status.
        Consider availability if provided (a date string key means they are unavailable).
        Return a JSON array of objects with keys: "roleId", "memberId", "reasoning".
    `;

    const response = await ai.models.generateContent({
        model,
        contents: context,
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
  const model = 'gemini-2.5-pro';
  const scriptPrompt = "Write a short, encouraging 100-word script for a church media team. Focus on a practical skill like 'paying attention to detail' or 'clear communication'. The tone should be uplifting and practical.";
  
  const scriptResponse = await ai.models.generateContent({ model, contents: scriptPrompt });
  const script = scriptResponse.text;

  const videoPrompt = `An inspiring, abstract motion graphics video with uplifting music. Use colors like gold, white, and blue. The feeling should be professional, encouraging, and focused. Cinematic. Abstract patterns and light flares.`;
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: videoPrompt,
    config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation failed to return a URL.");
  }
  
  const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
  
  return { script, videoUrl };
};

export const generateTrainingScenario = async (skill: string, teamType: string, teamDescription?: string): Promise<TrainingScenarioItem> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const model = 'gemini-2.5-pro';

    let roleContext = 'church media volunteer';
    if (teamType === 'worship') roleContext = 'church worship team member';
    else if (teamType === 'ushering') roleContext = 'church usher or greeter';
    else if (teamType === 'custom' && teamDescription) roleContext = `member of a church team described as "${teamDescription}"`;

    const prompt = `
        Create a training scenario for a ${roleContext} focusing on the skill: "${skill}".
        Provide a realistic scenario, a multiple-choice question with 4 options, and feedback for each option. One option must be correct.
        Format the response as a JSON object with keys: "scenario", "question", and "options".
        The "options" key should be an array of objects, each with "text", "isCorrect" (boolean), and "feedback" keys.
    `;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
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
    const model = 'gemini-2.5-flash';
    const prompt = `
        Analyze the following debriefs from a church media team.
        Debriefs: ${JSON.stringify(debriefs)}
        Provide an overall summary, a list of 3-5 recurring strengths, 3-5 common areas for improvement, and 2-3 potential growth opportunities for the team.
        Format the response as a JSON object with keys: "overallSummary", "strengths", "areasForImprovement", "growthOpportunities".
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
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
    const model = 'gemini-2.5-flash';
    
    let context = `a church ${teamType} team.`;
    if (teamType === 'custom' && teamDescription) {
        context = `a church team described as: "${teamDescription}".`;
    } else if (teamType === 'worship') {
        context = "a church worship and music team.";
    } else if (teamType === 'ushering') {
        context = "a church ushering and hospitality team.";
    }

    const prompt = `
        Generate 3 short, specific prayer points for ${context} for today.
        Focus on topics relevant to their specific roles (e.g., for media: technology/focus; for worship: sensitivity/heart; for ushers: welcoming/service).
        Return a JSON array of objects, where each object has a "text" key.
        Example: [{ "text": "Pray for clear minds and focus during the service." }]
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING }
                    },
                    required: ['text'],
                }
            }
        }
    });

    return parseJsonResponse<Omit<PrayerPoint, 'id'>[]>(response.text, "prayer points");
};

export const generateVerseOfTheDay = async (teamType: string, teamDescription?: string): Promise<Scripture> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const model = 'gemini-2.5-flash';

    let context = `a church ${teamType} team.`;
    if (teamType === 'custom' && teamDescription) {
        context = `a church team described as: "${teamDescription}".`;
    }

    const prompt = `
        Select a Bible verse that is encouraging and specifically relevant for ${context}.
        For example, if it's a media team, a verse about excellence or unseen service. If it's a worship team, a verse about praise.
        Return a JSON object with "reference" and "text".
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
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
    const model = 'gemini-2.5-flash';
    const prompt = `
        A team member has an alert for recurring "${alertType}".
        Provide one short, encouraging, and practical tip to help them improve in this area.
        Frame it as helpful advice. Don't be accusatory. Max 2 sentences.
        Return only the string of the tip, not JSON.
    `;
    
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateGrowthPlan = async (growthAreas: string[]): Promise<GrowthResource[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const model = 'gemini-2.5-pro';
    const prompt = `
        A church media volunteer wants to improve in these areas: ${growthAreas.join(', ')}.
        Suggest 3-4 practical resources to help them grow. Resources can be a YouTube video, a book, a web article, or a practical tip.
        For each resource, provide a type, title, a brief description, and a URL if applicable.
        Format the response as a JSON array of objects with keys: "type", "title", "description", and optionally "url".
        Valid types are: "YouTube Video", "Book", "Article", "Tip".
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
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
    const model = 'gemini-2.5-pro';
    const prompt = `
        You are an expert production manager for a church media team.
        A team member needs a pre-service briefing for their assigned role.
        Provide concise, actionable advice based on the following details.

        Event Details:
        - Event: ${event.name}
        - Date: ${event.date.toLocaleDateString()}
        - Team Member's Role: ${role.name}
        - Special Notes for this Service: ${event.serviceNotes || "No special notes provided."}

        Your task is to generate a JSON object with three keys:
        1. "keyFocusPoints": An array of 2-3 strings. These are the most critical things for someone in this role to focus on during THIS specific service.
        2. "potentialChallenges": An array of 1-2 strings. These are potential issues or tricky parts to be aware of for this service, given the role and service notes.
        3. "communicationCues": An array of 1-2 strings. These are examples of key phrases to listen for on the comms system relevant to this role.

        Keep the points short and direct.
    `;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
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
    const model = 'gemini-2.5-flash';
    
    let prompt = `
        Create a church volunteer team template based on this description: "${description}".
        
        1. Generate a list of 3-6 suitable "roles" (e.g., Camera Op, Greeter).
        2. Generate a list of 3-5 necessary "skills" (e.g., Hospitality, Audio Mixing).
        3. Determine boolean flags for features: 
           - "videoAnalysis": true if the team does video/broadcast work.
           - "attire": true if the team has a dress code (e.g., Ushers, Worship).
           - "training": true (always enabled).
        4. Generate a list of 4-6 gamified "achievements" for this team. 
           - For the icon, choose ONLY from: ['trophy', 'star', 'sound', 'camera', 'presentation', 'video']. Use 'trophy' or 'star' if unsure.
    `;

    if (focusAreas.length > 0) {
        prompt += `
        IMPORTANT: The admin has specifically requested that the following areas/features be included/enabled in the template: ${focusAreas.join(', ')}.
        Ensure the "features" flags reflect these requests (e.g., if "Attire" is requested, set "attire": true).
        Also ensure the generated roles and skills align with these requested areas.
        `;
    }

    prompt += `
        Map "requiredSkillId" in roles to the corresponding "id" in the skills array if applicable.
        The "id" fields should be simple strings like "role_1", "skill_1", "ach_1".
        
        Format the response as a JSON object with keys: "roles", "skills", "features", "achievements".
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
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
                            },
                            required: ['id', 'name']
                        }
                    },
                    skills: {
                         type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING },
                            },
                            required: ['id', 'name']
                        }
                    },
                    features: {
                        type: Type.OBJECT,
                        properties: {
                            videoAnalysis: { type: Type.BOOLEAN },
                            attire: { type: Type.BOOLEAN },
                            training: { type: Type.BOOLEAN },
                        },
                        required: ['videoAnalysis', 'attire', 'training']
                    },
                    achievements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                icon: { type: Type.STRING }
                            },
                            required: ['id', 'name', 'description', 'icon']
                        }
                    }
                },
                required: ['roles', 'skills', 'features', 'achievements'],
            }
        }
    });

    return parseJsonResponse<{ roles: Role[]; skills: Skill[]; features: TeamFeatures; achievements: Achievement[] }>(response.text, "team template");
};