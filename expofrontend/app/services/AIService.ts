// services/AIService.ts
import { Config } from '../config';

// ============ 类型定义 ============

// AI 游戏结果分析请求类型
export type AIAnalysisRequest = {
    score: number;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
    maxStreak: number;
    difficulty: string;
    gameType: string;
    timestamp: string;
};

// AI 游戏结果分析响应类型
export type AIAnalysisResponse = {
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areas_to_improve: string[];
    estimated_level: string;
    recommended_next_steps: string[];
};

// 题目类型定义
export type Question = {
    id: string;
    audioText: string;
    options: {
        id: string;
        text: string;
        correct: boolean;
    }[];
    hint: string;
    level: 'easy' | 'medium' | 'hard';
};

// ============ 主服务类 ============

class AIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;

    constructor() {
        // 使用与 chatbot.tsx 相同的后端地址
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = Config.AI_MODEL_NAME || 'gemma';
        this.enabled = Config.AI_ENABLED !== false;
    }

    // ============ 通用方法 ============

    /**
     * 发送请求到 AI 服务
     */
    private async sendRequest(prompt: string): Promise<string> {
        if (!this.enabled) {
            throw new Error('AI service is disabled');
        }

        try {
            console.log('Connecting to AI service:', this.baseURL);
            console.log('Using model:', this.modelName);

            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt
                }),
            });

            console.log('AI service response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI service error details:', errorText);
                throw new Error(`AI service error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('AI raw response:', data);

            const aiResponseText = data.response || data.choices?.[0]?.message?.content;

            if (!aiResponseText) {
                console.error('AI response format error:', data);
                throw new Error('AI response format incorrect');
            }

            return aiResponseText;
        } catch (error: any) {
            console.error('AI service request failed:', error);
            throw error;
        }
    }

    /**
     * 清理 AI 响应文本
     */
    private cleanResponseText(response: string): string {
        let cleanedResponse = response.trim();

        // 移除可能存在的 ```json 和 ``` 标记
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.substring(7);
        }
        if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.substring(3);
        }
        if (cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
        }

        return cleanedResponse.trim();
    }

    // ============ 游戏结果分析功能 ============

    /**
     * 分析游戏结果
     */
    async analyzeGameResults(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        if (!this.enabled) {
            console.log('AI analysis function disabled');
            return this.getDefaultAnalysisResponse();
        }

        try {
            const prompt = this.createAnalysisPrompt(request);
            const aiResponseText = await this.sendRequest(prompt);
            return this.parseAnalysisResponse(aiResponseText);
        } catch (error: any) {
            console.error('AI analysis failed:', error);
            return this.getDefaultAnalysisResponse();
        }
    }

    /**
     * 创建分析提示词
     */
    private createAnalysisPrompt(request: AIAnalysisRequest): string {
        return `You are an English language learning expert. Analyze this listening game performance and provide feedback in JSON format.

Performance Data:
- Difficulty Level: ${request.difficulty}
- Total Score: ${request.score}
- Accuracy: ${request.accuracy}%
- Correct Answers: ${request.correctAnswers}/${request.totalQuestions}
- Max Streak: ${request.maxStreak}
- Game Type: ${request.gameType}

Please provide analysis in this JSON format:
{
    "feedback": "Brief performance summary (max 15 words)",
    "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
    "strengths": ["Strength 1", "Strength 2"],
    "areas_to_improve": ["Area 1", "Area 2"],
    "estimated_level": "e.g., Beginner/Intermediate/Advanced",
    "recommended_next_steps": ["Step 1", "Step 2"]
}

Make sure to return ONLY valid JSON, no other text.`;
    }

    /**
     * 解析分析响应
     */
    private parseAnalysisResponse(response: string): AIAnalysisResponse {
        try {
            console.log('Attempting to parse AI analysis response:', response);
            const cleanedResponse = this.cleanResponseText(response);
            console.log('Cleaned response:', cleanedResponse);

            const parsed = JSON.parse(cleanedResponse);

            // 简化文本内容
            const simplifyText = (text: string, maxWords: number = 15) => {
                if (!text) return "";
                const words = text.split(' ');
                if (words.length > maxWords) {
                    return words.slice(0, maxWords).join(' ') + '...';
                }
                return text;
            };

            const simplifyArray = (arr: string[], maxWords: number = 8) => {
                if (!Array.isArray(arr)) return [];
                return arr.map(item => simplifyText(item, maxWords));
            };

            return {
                feedback: parsed.feedback ? simplifyText(parsed.feedback, 15) : "Good performance! Keep practicing.",
                suggestions: Array.isArray(parsed.suggestions) ? simplifyArray(parsed.suggestions, 8) : [],
                strengths: Array.isArray(parsed.strengths) ? simplifyArray(parsed.strengths, 8) : [],
                areas_to_improve: Array.isArray(parsed.areas_to_improve) ? simplifyArray(parsed.areas_to_improve, 8) : [],
                estimated_level: parsed.estimated_level || "To be assessed",
                recommended_next_steps: Array.isArray(parsed.recommended_next_steps) ? simplifyArray(parsed.recommended_next_steps, 8) : []
            };
        } catch (error) {
            console.error('Failed to parse AI analysis response:', error);
            return this.getDefaultAnalysisResponse();
        }
    }

    /**
     * 获取默认分析响应
     */
    getDefaultAnalysisResponse(): AIAnalysisResponse {
        return {
            feedback: "AI analysis feature temporarily unavailable",
            suggestions: ["Continue practicing", "Listen to more English content", "Try different difficulty levels"],
            strengths: ["Active participation in learning"],
            areas_to_improve: ["Could use more focused practice"],
            estimated_level: "To be assessed",
            recommended_next_steps: ["Practice daily", "Review mistakes", "Set learning goals"]
        };
    }

    // ============ 题目生成功能 ============

    /**
     * 生成单道题目 - 每次生成全新的题目
     */
    async generateSingleQuestion(level: 'easy' | 'medium' | 'hard', index: number): Promise<Question | null> {
        if (!this.enabled) {
            console.log('AI question generation disabled, using fallback question');
            return this.getSingleFallbackQuestion(level, index);
        }

        try {
            console.log(`Generating question ${index + 1} for ${level} level...`);

            // 添加随机种子，确保每次生成不同的题目
            const randomSeed = Math.floor(Math.random() * 10000);
            const prompt = this.createSingleQuestionPrompt(level, index, randomSeed);

            const aiResponseText = await this.sendRequest(prompt);
            const question = this.parseSingleQuestionResponse(aiResponseText, level, index);

            if (question) {
                return question;
            } else {
                console.log(`Failed to parse AI question ${index + 1}, using fallback`);
                return this.getSingleFallbackQuestion(level, index);
            }
        } catch (error: any) {
            console.error(`AI question generation failed for question ${index + 1}:`, error);
            return this.getSingleFallbackQuestion(level, index);
        }
    }

    /**
     * 创建单题生成提示词 - 添加随机种子确保多样性
     */
    private createSingleQuestionPrompt(level: 'easy' | 'medium' | 'hard', index: number, randomSeed: number): string {
        const levelDescriptions = {
            easy: "Beginner level - simple words and basic vocabulary. Use single words",
            medium: "Intermediate level - short phrases and common sentences. Use 3-4 word sentences.",
            hard: "Advanced level - complete sentences.Use 5 word sentences"
        };

        // 更丰富的题目类型
        const questionTypes = {
            easy: [
                "animals (pets, farm animals, wild animals)",
                "food and drinks (meals, fruits, vegetables)",
                "household objects (furniture, electronics, tools)",
                "colors and shapes",
                "family members and people",
                "clothing and accessories",
                "weather and nature",
                "transportation vehicles",
                "school supplies",
                "sports and activities",
                "body parts",
                "emotions and feelings"
            ],
            medium: [
                "daily routines and activities",
                "weather descriptions",
                "feelings and emotions",
                "places in town (restaurant, library, hospital)",
                "making simple requests",
                "common social phrases",
                "describing people and objects",
                "talking about time and dates",
                "shopping and prices",
                "food and restaurant orders",
                "travel and directions",
                "hobbies and interests"
            ],
            hard: [
                "complex questions and requests",
                "situational dialogues (restaurant, hotel, airport)",
                "idioms and expressions",
                "detailed scene descriptions",
                "abstract concepts and opinions",
                "professional and workplace scenarios",
                "news and current events",
                "cultural references",
                "problem-solving situations",
                "giving detailed instructions",
                "expressing preferences and reasons",
                "making plans and arrangements"
            ]
        };

        // 根据索引和随机种子选择题目类型
        const typeIndex = (index + randomSeed) % questionTypes[level].length;
        const questionType = questionTypes[level][typeIndex];

        // 添加示例来引导 AI 生成不同的题目
        const examples = {
            easy: [
                'Example: "dog" (options: cat, dog, bird, fish)',
                'Example: "red" (options: blue, red, green, yellow)',
                'Example: "subway" (options: bus, taxi, subway, car)',
                'Example: "sofa" (options: coffee table, tv, sofa, bed)',
                'Example: "tomato" (options: tomato, eggplant, potatoes, lettuce)'
            ],
            medium: [
                'Example: "I am hungry" (options: I am tired, I am hungry, I am happy, I am sad)',
                'Example: "Where is the bathroom?" (options: Asking for time, Asking for location, Asking for price, Asking for help)',
                'Example: "She is reading a book" (options: She is cooking, She is reading, She is sleeping, She is running)',
                'Example: "It is raining outside" (options: It is sunny, It is raining, It is windy, It is snowing)',
                'Example: "I like coffee" (options: I like tea, I like coffee, I like juice, I like milk)'
            ],
            hard: [
                'Example: "Could you recommend a good restaurant nearby?" (options: Asking for directions, Asking for recommendation, Asking for price, Asking for time)',
                'Example: "The meeting has been rescheduled to 3 PM" (options: Meeting is cancelled, Meeting is delayed, Meeting is confirmed, Meeting is moved)',
                'Example: "I would like to book a flight to London" (options: Booking a hotel, Booking a flight, Renting a car, Buying tickets)',
                'Example: "The train to Paris departs from platform 5" (options: Airport announcement, Train announcement, Bus announcement, Hotel announcement)',
                'Example: "Could you please speak more slowly?" (options: Asking for directions, Asking for clarification, Asking for help, Asking for time)'
            ]
        };

        // 随机选择一个示例
        const exampleIndex = randomSeed % examples[level].length;
        const example = examples[level][exampleIndex];

        return `You are an English language learning expert. Generate EXACTLY ONE NEW listening comprehension question for ${levelDescriptions[level]}

Topic for this question: ${questionType}
Reference example (for format only, DO NOT copy): ${example}

For this single question, provide:
1. Audio text (what the speaker would say) - related to "${questionType}"
2. Four answer options with only ONE correct answer
3. A helpful hint

The question should be appropriate for ${level} level learners and related to "${questionType}".

IMPORTANT REQUIREMENTS:
- DO NOT copy the example question - create a completely NEW one
- Make it unique and different from typical examples
- Be creative and use different vocabulary
- Ensure the question is appropriate for ${level} level
 
Return the response in this EXACT JSON format with no additional text:
{
    "audioText": "text to be spoken",
    "options": [
        {"text": "option 1", "correct": false},
        {"text": "option 2", "correct": false},
        {"text": "option 3", "correct": true},
        {"text": "option 4", "correct": false}
    ],
    "hint": "helpful hint for this question"
}

Requirements:
- For EASY level: use simple words, 1 words per audio text
- For MEDIUM level: use short phrases, 3-4 words per audio text
- For HARD level: use complete sentences, Use 5 word sentences
- The question must be related to "${questionType}"
- Exactly 4 options, only one correct
- The answer choices must be in different positions for each question, for example: 1a, 2d, 3b, 4c.
- Make options plausible but clearly distinguishable
- Return ONLY valid JSON, no other text.`;
    }

    /**
     * 解析单题响应
     */
    private parseSingleQuestionResponse(response: string, level: 'easy' | 'medium' | 'hard', index: number): Question | null {
        try {
            const cleanedResponse = this.cleanResponseText(response);
            console.log(`Cleaned question ${index + 1} response:`, cleanedResponse);

            const parsed = JSON.parse(cleanedResponse);

            if (!parsed.audioText || !parsed.options || !Array.isArray(parsed.options) || parsed.options.length !== 4) {
                throw new Error('Invalid response format');
            }

            // 验证是否有正确的答案
            const hasCorrect = parsed.options.some((opt: any) => opt.correct === true);
            if (!hasCorrect) {
                throw new Error('No correct answer found');
            }

            // 验证是否只有一个正确答案
            const correctCount = parsed.options.filter((opt: any) => opt.correct === true).length;
            if (correctCount !== 1) {
                throw new Error('More than one correct answer');
            }

            // 转换为 Question 格式
            return {
                id: `${level}-${index + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                audioText: parsed.audioText,
                options: parsed.options.map((opt: any, optIndex: number) => ({
                    id: `${level}-${index}-opt-${optIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    text: opt.text || '',
                    correct: opt.correct === true
                })),
                hint: parsed.hint || 'Listen carefully!',
                level: level
            };

        } catch (error) {
            console.error(`Failed to parse AI question ${index + 1}:`, error);
            return null;
        }
    }

    /**
     * 获取单道备用题目
     */
    private getSingleFallbackQuestion(level: 'easy' | 'medium' | 'hard', index: number): Question | null {
        const fallbacks = {
            easy: [
                {
                    audioText: "apple",
                    options: [
                        { text: "apple", correct: true },
                        { text: "banana", correct: false },
                        { text: "orange", correct: false },
                        { text: "grape", correct: false }
                    ],
                    hint: "This is a common red or green fruit."
                },
                {
                    audioText: "cat",
                    options: [
                        { text: "dog", correct: false },
                        { text: "cat", correct: true },
                        { text: "bird", correct: false },
                        { text: "fish", correct: false }
                    ],
                    hint: "This animal says 'meow'."
                },
                {
                    audioText: "book",
                    options: [
                        { text: "pen", correct: false },
                        { text: "book", correct: true },
                        { text: "desk", correct: false },
                        { text: "chair", correct: false }
                    ],
                    hint: "You read this."
                },
                {
                    audioText: "car",
                    options: [
                        { text: "bus", correct: false },
                        { text: "car", correct: true },
                        { text: "train", correct: false },
                        { text: "bike", correct: false }
                    ],
                    hint: "A vehicle with four wheels."
                },
                {
                    audioText: "sun",
                    options: [
                        { text: "moon", correct: false },
                        { text: "sun", correct: true },
                        { text: "star", correct: false },
                        { text: "cloud", correct: false }
                    ],
                    hint: "It gives us light during the day."
                },
                {
                    audioText: "water",
                    options: [
                        { text: "milk", correct: false },
                        { text: "juice", correct: false },
                        { text: "water", correct: true },
                        { text: "tea", correct: false }
                    ],
                    hint: "You drink this to stay hydrated."
                }
            ],
            medium: [
                {
                    audioText: "I like coffee",
                    options: [
                        { text: "I like tea", correct: false },
                        { text: "I like coffee", correct: true },
                        { text: "I like juice", correct: false },
                        { text: "I like milk", correct: false }
                    ],
                    hint: "A popular morning beverage."
                },
                {
                    audioText: "It's raining outside",
                    options: [
                        { text: "It's sunny", correct: false },
                        { text: "It's raining", correct: true },
                        { text: "It's windy", correct: false },
                        { text: "It's snowing", correct: false }
                    ],
                    hint: "Water is falling from the sky."
                },
                {
                    audioText: "Where is the station?",
                    options: [
                        { text: "Asking for directions", correct: true },
                        { text: "Asking about time", correct: false },
                        { text: "Asking for food", correct: false },
                        { text: "Asking for help", correct: false }
                    ],
                    hint: "You need to find a place to catch a train."
                },
                {
                    audioText: "I'm hungry",
                    options: [
                        { text: "I want to sleep", correct: false },
                        { text: "I want to eat", correct: true },
                        { text: "I want to drink", correct: false },
                        { text: "I want to play", correct: false }
                    ],
                    hint: "You need food."
                },
                {
                    audioText: "She is a doctor",
                    options: [
                        { text: "She works in a school", correct: false },
                        { text: "She works in a hospital", correct: true },
                        { text: "She works in a office", correct: false },
                        { text: "She works in a store", correct: false }
                    ],
                    hint: "She helps sick people."
                },
                {
                    audioText: "What time is it?",
                    options: [
                        { text: "Asking for location", correct: false },
                        { text: "Asking for time", correct: true },
                        { text: "Asking for price", correct: false },
                        { text: "Asking for name", correct: false }
                    ],
                    hint: "You want to know the current hour."
                }
            ],
            hard: [
                {
                    audioText: "Could you tell me where the nearest library is?",
                    options: [
                        { text: "Asking for book location", correct: true },
                        { text: "Asking for restaurant", correct: false },
                        { text: "Asking for hospital", correct: false },
                        { text: "Asking for school", correct: false }
                    ],
                    hint: "You want to find a place with books."
                },
                {
                    audioText: "I would like to order a pizza with extra cheese",
                    options: [
                        { text: "Ordering food", correct: true },
                        { text: "Buying clothes", correct: false },
                        { text: "Booking a hotel", correct: false },
                        { text: "Renting a car", correct: false }
                    ],
                    hint: "You are in a restaurant."
                },
                {
                    audioText: "The meeting has been postponed until next week",
                    options: [
                        { text: "Meeting is cancelled", correct: false },
                        { text: "Meeting is delayed", correct: true },
                        { text: "Meeting is confirmed", correct: false },
                        { text: "Meeting is moved earlier", correct: false }
                    ],
                    hint: "The event will happen later than planned."
                },
                {
                    audioText: "I'm looking for something in a medium size",
                    options: [
                        { text: "Shopping for clothes", correct: true },
                        { text: "Buying groceries", correct: false },
                        { text: "Ordering coffee", correct: false },
                        { text: "Booking tickets", correct: false }
                    ],
                    hint: "You are in a clothing store."
                },
                {
                    audioText: "The flight to New York has been delayed by two hours",
                    options: [
                        { text: "Train station announcement", correct: false },
                        { text: "Airport announcement", correct: true },
                        { text: "Bus station announcement", correct: false },
                        { text: "Hotel announcement", correct: false }
                    ],
                    hint: "You are at an airport."
                },
                {
                    audioText: "Could you please speak more slowly? I'm still learning English",
                    options: [
                        { text: "Asking for directions", correct: false },
                        { text: "Asking for clarification", correct: true },
                        { text: "Asking for help", correct: false },
                        { text: "Asking for time", correct: false }
                    ],
                    hint: "You don't understand the speaker's speed."
                }
            ]
        };

        // 确保索引在范围内
        const safeIndex = index % fallbacks[level].length;
        const q = fallbacks[level][safeIndex];

        return {
            id: `${level}-fallback-${index + 1}-${Date.now()}`,
            audioText: q.audioText,
            options: q.options.map((opt, optIndex) => ({
                id: `${level}-fallback-${index}-opt-${optIndex}-${Date.now()}`,
                text: opt.text,
                correct: opt.correct
            })),
            hint: q.hint,
            level: level
        };
    }
}

// 导出单例
export default new AIService();