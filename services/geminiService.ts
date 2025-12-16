
import { GoogleGenAI, Type, Schema } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Robust JSON parser to handle LLM output variations (Markdown wrapping, text preambles)
const cleanAndParseJSON = (text: string | undefined, defaultValue: any = {}) => {
  if (!text) return defaultValue;
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    try {
      // 2. Try extracting from markdown block
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) return JSON.parse(match[1]);
      
      // 3. Brute force extract { ... } or [ ... ]
      const firstOpenBrace = text.indexOf('{');
      const firstOpenBracket = text.indexOf('[');
      let start = -1;
      let end = -1;

      // Determine if we are looking for an object or array
      if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
        start = firstOpenBrace;
        end = text.lastIndexOf('}') + 1;
      } else if (firstOpenBracket !== -1) {
        start = firstOpenBracket;
        end = text.lastIndexOf(']') + 1;
      }

      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end));
      }
    } catch (e2) {
      console.warn("JSON parse failed even after cleaning:", text);
    }
  }
  return defaultValue;
};

export const GeminiService = {
  // --- NEW FEATURES ---

  async getQuoteOfTheDay() {
    const ai = getClient();
    // Randomize topics for variety
    const topics = ["Science", "History", "Innovation", "Art", "Philosophy", "Space", "Literature", "Mathematics"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const prompt = `Generate a unique, inspiring, and thought-provoking quote for a student from a famous figure in the field of ${randomTopic}.
    Avoid extremely common clichés. 
    Return JSON:
    {
      "quote": "The quote text",
      "author": "Author Name",
      "role": "Short role or title (e.g. Theoretical Physicist)"
    }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quote: { type: Type.STRING },
              author: { type: Type.STRING },
              role: { type: Type.STRING }
            }
          }
        }
      });
      return cleanAndParseJSON(response.text);
    } catch (error) {
      return {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        role: "Visionary Entrepreneur"
      };
    }
  },

  async analyzeImage(base64Image: string, promptText: string) {
    const ai = getClient();
    try {
      const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      const mimeType = base64Image.includes('image/png') ? 'image/png' : 'image/jpeg'; // Basic detection

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            },
            { text: promptText || "Analyze this image in detail." }
          ]
        }
      });
      return response.text;
    } catch (error) {
      console.error("Image analysis error:", error);
      throw error;
    }
  },

  async reasoningChat(history: { role: string, parts: { text: string }[] }[], newMessage: string) {
    const ai = getClient();
    try {
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
        }
      });
      const result = await chat.sendMessage({ message: newMessage });
      return result.text;
    } catch (error) {
      console.error("Reasoning chat error:", error);
      throw error;
    }
  },

  // --- SUMMARIZER & CHAT ---

  async summarizeChapter(className: string, subject: string, chapter: string) {
    const ai = getClient();
    // Using flash-lite for speed as requested
    const prompt = `
      Act as an expert academic tutor. Provide a comprehensive, paragraph-wise explanation of Chapter: "${chapter}" for Class ${className} Subject: ${subject}.
      
      Structure the response as follows:
      1. A catchy, relevant Title for the summary.
      2. An engaging Introduction paragraph that sets the context.
      3. A series of detailed sections explaining the key concepts paragraph-wise. Each section must have a descriptive heading and a substantial explanatory paragraph.
      4. A concluding summary paragraph.
      5. 3-5 Key Takeaways (bullet points).
      
      Return JSON format:
      {
        "title": "string",
        "introduction": "string",
        "sections": [
          { "heading": "string", "paragraph": "string", "visualCue": "short description for an icon/image" }
        ],
        "conclusion": "string",
        "keyPoints": ["string", "string"]
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite', // Optimized for speed
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              introduction: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    paragraph: { type: Type.STRING },
                    visualCue: { type: Type.STRING }
                  }
                }
              },
              conclusion: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return cleanAndParseJSON(response.text);
    } catch (error) {
      console.error("Summarization error:", error);
      throw error;
    }
  },

  async summarizerChat(history: { role: string, parts: { text: string }[] }[], newMessage: string, contextSummary: any) {
      const ai = getClient();
      
      // Convert summary object to a string context if it's not already
      const summaryContext = typeof contextSummary === 'string' 
          ? contextSummary 
          : JSON.stringify(contextSummary);

      const systemPrompt = `You are a helpful tutor assistant. 
      The user is reading a summary about: ${contextSummary?.title || 'a topic'}.
      
      Here is the summary context:
      ${summaryContext}
      
      Answer the user's questions based on this context. 
      If the answer isn't in the summary, use your general knowledge but mention that it goes beyond the summary.
      Keep answers concise and helpful.`;

      try {
          const chat = ai.chats.create({
              model: 'gemini-3-pro-preview', // High quality for Q&A
              history: history,
              config: {
                  systemInstruction: systemPrompt
              }
          });
          
          const result = await chat.sendMessage({ message: newMessage });
          return result.text;
      } catch (error) {
          console.error("Summarizer chat error", error);
          throw error;
      }
  },

  async generateMindMap(topic: string) {
    const ai = getClient();
    const prompt = `Create a hierarchical mind map for the topic: "${topic}".
    Return a JSON object representing the tree structure.
    Example format:
    {
      "name": "${topic}",
      "children": [
        { "name": "Subtopic 1", "children": [...] },
        { "name": "Subtopic 2", "children": [...] }
      ]
    }
    Keep it to about 3-4 levels deep max.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      return cleanAndParseJSON(response.text);
    } catch (error) {
      console.error("Mind map error:", error);
      throw error;
    }
  },

  async generateMindMapImage(className: string, subject: string, chapter: string) {
    const ai = getClient();
    const prompt = `Create a colorful, detailed, and educational mind map pictograph for Class ${className} ${subject}, Chapter: "${chapter}". Visual style: High quality, white background, clear text labels, structured branches, vibrant icons.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Mind map image error:", error);
      throw error;
    }
  },

  async editMindMapImage(imageDataUrl: string, editPrompt: string) {
    const ai = getClient();
    try {
      const matches = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid image data");
      }
      const mimeType = matches[1];
      const base64Data = matches[2];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: editPrompt,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Edit mind map image error:", error);
      throw error;
    }
  },

  async getWordMeaning(word: string) {
    const ai = getClient();
    const prompt = `Define the word "${word}" for a student.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meaning: { type: Type.STRING },
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              sentence: { type: Type.STRING },
              hindiTranslation: { type: Type.STRING }
            }
          }
        }
      });
      return cleanAndParseJSON(response.text);
    } catch (error) {
      console.error("Word meaning error:", error);
      throw error;
    }
  },

  async getDailyWord() {
    const ai = getClient();
    const prompt = `Provide a unique, sophisticated "Word of the Day" for a student to learn.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    pronunciation: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    example: { type: Type.STRING },
                    origin: { type: Type.STRING }
                }
            }
        }
      });
      return cleanAndParseJSON(response.text);
    } catch (error) {
      return { word: 'Resilience', meaning: 'The capacity to recover quickly from difficulties.', example: 'Her resilience helped her succeed.', pronunciation: '/rəˈzilyəns/', origin: 'Latin' };
    }
  },

  async getDailyWordBatch() {
      const ai = getClient();
      const prompt = `Generate a list of 20 distinct, sophisticated English vocabulary words for a student to learn today. 
      Includes a mix of academic, literary, and useful descriptive words.
      Return a JSON array.`;

      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              word: { type: Type.STRING },
                              pronunciation: { type: Type.STRING },
                              meaning: { type: Type.STRING },
                              example: { type: Type.STRING },
                              origin: { type: Type.STRING }
                          }
                      }
                  }
              }
          });
          return cleanAndParseJSON(response.text, []);
      } catch (error) {
          console.error("Batch word error", error);
          return [];
      }
  },

  async getMentorResponse(history: { role: string, parts: { text: string }[] }[], newMessage: string) {
    const ai = getClient();
    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
            config: {
                systemInstruction: "You are a helpful, motivating, and knowledgeable academic mentor for a student. Keep answers concise, encouraging, and easy to understand.",
            }
        });
        const result = await chat.sendMessage({ message: newMessage });
        return result.text;
    } catch (error) {
        console.error("Mentor chat error", error);
        throw error;
    }
  },

  async generateSmartSchedule(
      timeRange: { start: string, end: string },
      tasks: string,
      energyLevel: string,
      style: string
  ) {
      const ai = getClient();
      const prompt = `
        Create a detailed, realistic study schedule for a student.
        Timeframe: ${timeRange.start} to ${timeRange.end}.
        Tasks to cover: ${tasks}.
        Student's current energy level: ${energyLevel}.
        Preferred Style: ${style} (e.g. Pomodoro, Deep Work).
        CRITICAL RULES:
        1. Break the time into realistic slots.
        2. Insert health/well-being breaks (e.g., "Hydration Break", "Eye Rest", "Stretch") based on energy level.
        3. Prioritize difficult tasks when energy is usually higher or at start.
        4. Include a 'reason' for why this task is placed here.
        5. Return JSON only.
      `;

      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        strategyNote: { type: Type.STRING },
                        schedule: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    time: { type: Type.STRING },
                                    activity: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    reason: { type: Type.STRING },
                                    durationMin: { type: Type.INTEGER }
                                }
                            }
                        }
                    }
                }
            }
        });
        return cleanAndParseJSON(response.text);
      } catch (error) {
        console.error("Study plan error:", error);
        throw error;
      }
  },
  
  async getStudyPlan(goals: string) {
      const ai = getClient();
      const prompt = `Create a study routine for a student with these goals: ${goals}. Return a short, bulleted list of advice.`;
       try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Study plan error:", error);
        throw error;
    }
  },

  async generateQuiz(subject: string, count: number, difficulty: string) {
    const ai = getClient();
    const prompt = `Create a ${count}-question multiple choice quiz on the topic: "${subject}".
    Difficulty Level: ${difficulty}.
    The questions should be engaging, educational, and accurate.
    If the subject is 'Mixed', generate diverse questions from Science, History, Geography, and Math.
    
    Return JSON format only.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.NUMBER },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                }
            }
          }
        }
      });
      return cleanAndParseJSON(response.text, []);
    } catch (error) {
      console.error("Quiz generation error:", error);
      throw error;
    }
  },

  async getLabTutorResponse(chemicals: string[], lastAction: string, experimentContext?: string) {
    const ai = getClient();
    const prompt = `
      You are "Dr. Nova", a friendly chemistry lab mentor.
      Context: ${experimentContext || 'Free Exploration'}
      Beaker: ${chemicals.join(', ') || 'Empty'}.
      Action: ${lastAction}.
      Provide a short, safe, educational comment (max 2 sentences).
      If dangerous, warn immediately.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Lab tutor error:", error);
      return "Observe the reaction carefully.";
    }
  },

  async getCurrentAffairs(topic: string = "latest world news") {
    const ai = getClient();
    const prompt = `Act as a high-speed, real-time news engine. Use Google Search to find the latest and most accurate news about: "${topic}".
    CRITICAL RULES:
    1. Focus on major events from the last 12-24 hours.
    2. Ensure accuracy and reliability.
    3. Provide highly descriptive "imageKeyword" fields that describes the event visually in detail (e.g. "photo of electric car charging station in futuristic city, realistic, 4k").
    4. Return a valid JSON ARRAY.
    
    JSON Schema:
    [
      {
        "headline": "Concise, punchy headline",
        "summary": "2-3 sentence engaging summary of the event.",
        "category": "Technology, World, Science, etc.",
        "time": "e.g. '2h ago'",
        "impact": "High/Medium/Low",
        "sourceName": "Publisher Name",
        "url": "Direct URL to article",
        "imageKeyword": "Highly detailed visual description for AI image generation"
      }
    ]`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      
      return {
        text: cleanAndParseJSON(response.text, []), 
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (error) {
      console.error("News error:", error);
      throw error;
    }
  },

  async getElementDeepDive(element: string) {
    const ai = getClient();
    const prompt = `Provide detailed scientific data for the chemical element: "${element}". Return a valid JSON object.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
           responseMimeType: 'application/json'
        }
      });
      return cleanAndParseJSON(response.text);
    } catch (error) {
      return null;
    }
  },

  async manageCalendar(events: any[]) {
      const ai = getClient();
      const prompt = `You are a super-smart student assistant manager. Here are the user's upcoming calendar events: ${JSON.stringify(events)}. Task: 1. Check for conflicts. 2. Give 1-sentence advice. 3. Identify critical upcoming deadline. Return JSON.`;
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  responseMimeType: 'application/json',
              }
          });
          return cleanAndParseJSON(response.text);
      } catch (error) {
          return { advice: "Organize your time well!", upcomingReminders: [] };
      }
  },

  async transcribeAudio(audioBase64: string, mimeType: string = 'audio/wav') {
      const ai = getClient();
      try {
          const base64Data = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                  parts: [
                      { inlineData: { mimeType: mimeType, data: base64Data } },
                      { text: "Generate a detailed transcript of this audio. Format it clearly with speaker labels if possible." }
                  ]
              }
          });
          return response.text;
      } catch (e) {
          console.error("Transcription error", e);
          return null;
      }
  },

  async processDocument(base64: string, mimeType: string) {
      const ai = getClient();
      try {
          const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
          const prompt = `Analyze this document/file. 
          Provide:
          1. A concise title.
          2. A comprehensive summary.
          3. The full or representative text content for context.
          
          Return as JSON: { "title": string, "summary": string, "content": string }`;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                  parts: [
                      { inlineData: { mimeType: mimeType, data: cleanBase64 } },
                      { text: prompt }
                  ]
              },
              config: {
                  responseMimeType: 'application/json'
              }
          });
          
          return cleanAndParseJSON(response.text);
      } catch (e) {
          console.error("Document processing error", e);
          return null;
      }
  },

  async processLink(url: string) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const result = await this.analyzeVideoContent(url);
          return {
              title: "Video Analysis",
              summary: result.text,
              content: result.text,
              type: 'video'
          };
      } else {
          const result = await this.searchWebForSource(url); 
          return {
              title: "Web Source",
              summary: result.text.slice(0, 500) + "...",
              content: result.text,
              type: 'web',
              metadata: result.metadata
          };
      }
  },

  async analyzeVideoContent(url: string, model: string = 'gemini-2.5-flash') {
    const ai = getClient();
    const prompt = `Search for a detailed summary, key takeaways, and transcript-like overview of the video at this URL: "${url}". 
    If the URL is not accessible, search for the video title or topic inferred from the URL.
    Return a structured report in Markdown format.`;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      return {
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (error) {
      console.error("Video analysis error:", error);
      throw error;
    }
  },

  async searchWebForSource(query: string, mode: 'fast' | 'reasoning' = 'fast') {
      const ai = getClient();
      const modelName = 'gemini-2.5-flash';
      
      const prompt = `
      You are an elite academic researcher.
      Topic: "${query}".
      
      Generate a professional, encyclopedic report on this topic using Google Search.
      
      CRITICAL INSTRUCTIONS:
      1.  **Strictly Fact-Based:** No conversational filler ("Here is the report", "I found this").
      2.  **Citation Enforced:** Use inline citations [1], [2] for every major fact.
      3.  **Depth & Detail:** Cover history, mechanism, data, and global impact.
      4.  **Formatting:** Use clean Markdown with headers (#, ##), bullet points, and bold text for key terms.
      
      REPORT STRUCTURE:
      # ${query}
      
      ## 🔍 Executive Summary
      (A high-density overview of the topic)
      
      ## 📊 Key Findings & Data
      (Specific stats, dates, and figures)
      
      ## 🧠 In-Depth Analysis
      (Complex nuances, underlying principles, and mechanisms)
      
      ## 🌐 Global Perspectives / Implications
      (Impact on society, future trends, or opposing views)
      `;

      try {
          const config: any = {
              tools: [{ googleSearch: {} }]
          };

          const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: config
          });
          
          return {
              text: response.text,
              groundingMetadata: response.candidates?.[0]?.groundingMetadata
          };
      } catch (e) {
          console.error("Search error", e);
          throw e;
      }
  },

  async chatWithSources(
      history: { role: string, parts: { text: string }[] }[], 
      question: string, 
      contextSources: string[], 
      useThinking: boolean = false,
      useWebSearch: boolean = false
  ) {
      const ai = getClient();
      const contextBlock = contextSources.join("\n\n---\n\n");
      let systemPrompt = `You are a helpful research assistant. 
      Answer the user's question based ONLY on the provided sources below. 
      If the answer is not in the sources, say so.`;
      
      if (useWebSearch) {
          systemPrompt = `You are a helpful research assistant.
          Answer the user's question. Use the provided sources as primary context, but you MAY use Google Search to find up-to-date information if the sources are insufficient.
          
          STRUCTURE:
          - Provide a direct answer.
          - If a complex concept is discussed, you may optionally suggest a visual by outputting: <DIAGRAM_REQUEST>visual description</DIAGRAM_REQUEST> on a new line.
          - Suggest 1 relevant follow-up question.
          `;
      }

      const fullContext = `SOURCES:\n${contextBlock}`;

      try {
          const chatConfig: any = {
              systemInstruction: systemPrompt,
          };
          
          let modelName = 'gemini-2.5-flash';
          
          if (useThinking) {
              modelName = 'gemini-3-pro-preview';
              chatConfig.thinkingConfig = { thinkingBudget: 32768 }; 
          }
          
          if (useWebSearch) {
              chatConfig.tools = [{ googleSearch: {} }];
          }

          const chat = ai.chats.create({
              model: modelName,
              history: history,
              config: chatConfig
          });
          
          const messageToSend = contextSources.length > 0 ? `${fullContext}\n\nUser Question: ${question}` : question;

          const result = await chat.sendMessage({ message: messageToSend });
          return result.text;
      } catch (error) {
          console.error("Chat with sources error", error);
          throw error;
      }
  },

  async generateArtifact(type: 'flashcards' | 'quiz' | 'mindmap' | 'infographic' | 'qa', context: string) {
    const ai = getClient();
    let prompt = '';
    let schema: Schema | undefined = undefined;
    let model = 'gemini-2.5-flash'; 

    switch(type) {
        case 'flashcards':
            prompt = `Create 5 study flashcards from the provided context. Return a JSON array. Each card should have a 'front' (question/term) and 'back' (answer/definition).`;
            schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { front: { type: Type.STRING }, back: { type: Type.STRING } } } };
            break;
        case 'quiz':
            prompt = `Create a 3-question multiple choice quiz from the context. Return a JSON array.`;
            schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } } } };
            break;
        case 'mindmap':
            prompt = `Create a hierarchical text-based mind map structure representing the key concepts. Use markdown bullets (- Level 1, -- Level 2).`;
            break;
        case 'infographic':
            model = 'gemini-2.5-flash-image'; 
            prompt = `Create a detailed, high-quality, professional infographic summarizing this text. 
            Focus on key statistics, timelines, or structural breakdowns. 
            Visual style: Modern, Clean, Educational, Dark Mode optimized.`;
            break;
        case 'qa':
            prompt = `Generate a list of 10 important questions and detailed answers based on the provided context. Format as a JSON array of objects with 'question' and 'answer' fields. The questions should test deep understanding.`;
            schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } } } };
            break;
    }

    try {
        const truncatedContext = context.substring(0, 30000); 

        if (model === 'gemini-2.5-flash-image') {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: `${prompt}\n\nBased on this context:\n${truncatedContext}` }]
                }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            return null;
        } else {
            const response = await ai.models.generateContent({
                model: model,
                contents: `${prompt}\n\nContext:\n${truncatedContext}`,
                config: schema ? { responseMimeType: 'application/json', responseSchema: schema } : undefined
            });
            return schema ? cleanAndParseJSON(response.text, []) : response.text;
        }
    } catch(e) {
        console.error("Artifact generation error", e);
        return null;
    }
  },

  async generatePodcastAudio(script: {speaker: string, text: string}[]) {
    const ai = getClient();
    const dialogue = script.map(s => `${s.speaker}: ${s.text}`).join('\n');
    const prompt = `Read this dialogue naturally.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: prompt + '\n\n' + dialogue }] },
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: 'Host A', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                { speaker: 'Host B', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
              ]
            }
          }
        }
      });
      
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("Podcast Audio Error:", error);
      return null;
    }
  },

  async explainText(text: string) {
    const ai = getClient();
    const prompt = `Explain the following text simply and concisely for a student:\n\n"${text}"`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Explain text error:", error);
      return "I couldn't explain this text right now.";
    }
  },

  async generateNoteSummary(text: string) {
    const ai = getClient();
    const prompt = `Summarize these notes into key bullet points:\n\n"${text}"`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Note summary error:", error);
      return "Could not summarize notes.";
    }
  },

  async generateNoteQuiz(text: string) {
    const ai = getClient();
    const prompt = `Generate 3 multiple choice questions based on these notes. Return JSON array.
    Notes: "${text}"`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER }
              }
            }
          }
        }
      });
      return cleanAndParseJSON(response.text, []);
    } catch (error) {
      console.error("Note quiz error:", error);
      return [];
    }
  },

  async aiFixGrammar(text: string) {
    const ai = getClient();
    const prompt = `Fix grammar, spelling, and improve clarity of the following text. Return the corrected text only.
    
    Text: "${text}"`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Grammar fix error:", error);
      return text;
    }
  },

  async analyzeStudyProgress(data: { day: string, hours: number }[]) {
    const ai = getClient();
    const prompt = `Analyze this study data: ${JSON.stringify(data)}.
    Provide a concise, encouraging 1-sentence insight or tip to improve consistency.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Study analysis error:", error);
      return "Keep up the good work!";
    }
  },
  
  async getBioTutorExplanation(part: string, modelName: string) {
      const ai = getClient();
      const prompt = `Explain the biological function of the "${part}" in the context of a "${modelName}". 
      Keep it short, engaging, and educational (max 2 sentences).`;
      
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
          });
          return response.text || `Here is the ${part}.`;
      } catch (e) {
          console.error(e);
          return `This is the ${part}.`;
      }
  },

  async generateBioModel(query: string) {
      const ai = getClient();
      const prompt = `Generate a configuration for a 3D biology model of: "${query}".
      Return JSON with:
      - name: Title
      - category: Broad category (e.g. Anatomy, Botany)
      - description: 1 sentence description
      - imagePrompt: A highly detailed prompt to generate a realistic, educational 3D render of this subject on a white background.
      - hotspots: Array of 3-4 key parts to label (id, label, x, y). x/y are percentages (0-100) for approximate placement on a 2D image.
      `;
      
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          return cleanAndParseJSON(response.text);
      } catch (e) {
          throw e;
      }
  },

  async generateBioImage(prompt: string) {
      const ai = getClient();
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: prompt }] }
          });
          for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                  return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
          }
          return null;
      } catch (e) {
          console.error(e);
          return null;
      }
  },
  
  async generateBioVideo(subject: string, imageBase64: string) {
      const ai = getClient();
      
      // Clean base64
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';

      try {
          let operation = await ai.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt: `A cinematic, educational 3D rotation and breakdown animation of ${subject}. High quality, 4k, photorealistic biology visualization.`,
              image: {
                  imageBytes: cleanBase64,
                  mimeType: mimeType,
              },
              config: {
                  numberOfVideos: 1,
                  resolution: '720p',
                  aspectRatio: '16:9'
              }
          });

          // Poll for completion
          while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
              operation = await ai.operations.getVideosOperation({operation: operation});
          }

          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (videoUri) {
              // Fetch the actual video bytes using the key
              const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
              const videoBlob = await videoResponse.blob();
              return URL.createObjectURL(videoBlob);
          }
          return null;
      } catch (e) {
          console.error("Veo generation error", e);
          return null;
      }
  },

  async analyzeSleepPatterns(data: any) {
      const ai = getClient();
      const prompt = `Analyze this sleep data for a student: ${JSON.stringify(data)}.
      Provide:
      1. Actionable advice to improve sleep quality.
      2. Analysis of the sleep score.
      Return JSON: { "advice": string, "scoreAnalysis": string }`;

      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        advice: { type: Type.STRING },
                        scoreAnalysis: { type: Type.STRING }
                    }
                }
            }
        });
        return cleanAndParseJSON(response.text);
      } catch (error) {
        console.error("Sleep analysis error:", error);
        return { advice: "Maintain a consistent sleep schedule for better focus.", scoreAnalysis: "Your sleep score indicates good recovery." };
      }
  }
};
