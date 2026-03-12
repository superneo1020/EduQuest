
// 首先在文件頂部導入 AIService
// app/services/AIService.ts
import { Config } from '../config';

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

export type AIAnalysisResponse = {
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areas_to_improve: string[];
    estimated_level: string;
    recommended_next_steps: string[];
};

class AIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;

    constructor() {
        // 使用與 chatbot.tsx 相同的後端地址
        this.baseURL = 'http://127.0.0.1:8000';  // 或 Config.AI_BASE_URL
        this.modelName = Config.AI_MODEL_NAME || 'gemma';
        this.enabled = Config.AI_ENABLED !== false;
    }

    async analyzeGameResults(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        if (!this.enabled) {
            console.log('AI analysis function disabled');
            return this.getDefaultResponse();
        }

        try {
            console.log('Connecting to AI service:', this.baseURL);
            console.log('Using model:', this.modelName);

            // 使用與 chatbot.tsx 相同的請求格式
            const prompt = this.createAnalysisPrompt(request);

            // 根據 chatbot.tsx 的格式，使用 /chat 端點
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

            // 根據 chatbot.tsx 的響應格式解析
            const aiResponseText = data.response || data.choices?.[0]?.message?.content;

            if (!aiResponseText) {
                console.error('AI response format error:', data);
                throw new Error('AI response format incorrect');
            }

            console.log('AI response content:', aiResponseText);

            return this.parseAIResponse(aiResponseText);

        } catch (error: any) {
            console.error('AI analysis failed:', error);

            // 提供友好的錯誤信息
            let errorMessage = 'AI analysis service temporarily unavailable.';

            if (error.message.includes('Network request failed') ||
                error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to AI service. Please ensure:\n1. Backend server is running\n2. Service address is correct\n3. No firewall blocking connections';
            } else if (error.message.includes('404')) {
                errorMessage = 'AI service not found. Please check if backend is correctly started.';
            }

            // 返回默認響應而不是拋出錯誤
            console.log('Returning default response due to error');
            return this.getDefaultResponse();
        }
    }

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

    private parseAIResponse(response: string): AIAnalysisResponse {
        try {
            console.log('Attempting to parse AI response:', response);

            // 清理響應文本，移除可能的 markdown 代碼塊
            let cleanedResponse = response.trim();

            // 移除可能存在的 ```json 和 ``` 標記
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.substring(7);
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.substring(3);
            }
            if (cleanedResponse.endsWith('```')) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
            }

            cleanedResponse = cleanedResponse.trim();

            console.log('Cleaned response:', cleanedResponse);

            // 嘗試解析 JSON
            const parsed = JSON.parse(cleanedResponse);

            // 簡化響應內容
            const simplifyText = (text: string, maxWords: number = 15) => {
                if (!text) return "";
                const words = text.split(' ');
                if (words.length > maxWords) {
                    return words.slice(0, maxWords).join(' ') + '...';
                }
                return text;
            };

            // 簡化數組中的每個項目
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
            console.error('Failed to parse AI response:', error);
            console.error('Original response:', response);

            // 如果解析失敗，返回默認響應
            return this.getDefaultResponse();
        }
    }

    private getDefaultResponse(): AIAnalysisResponse {
        return {
            feedback: "AI analysis feature temporarily unavailable",
            suggestions: ["Continue practicing", "Listen to more English content", "Try different difficulty levels"],
            strengths: ["Active participation in learning"],
            areas_to_improve: ["Could use more focused practice"],
            estimated_level: "To be assessed",
            recommended_next_steps: ["Practice daily", "Review mistakes", "Set learning goals"]
        };
    }
}

export default new AIService();