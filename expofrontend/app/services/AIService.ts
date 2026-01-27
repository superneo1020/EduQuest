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
        this.baseURL = Config.AI_BASE_URL;
        this.modelName = Config.AI_MODEL_NAME;
        this.enabled = Config.AI_ENABLED;
    }

    async analyzeGameResults(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        if (!this.enabled) {
            console.log('AI 分析功能已禁用');
            return this.getDefaultResponse();
        }

        try {
            console.log('正在連接到 AI 服務:', this.baseURL);
            console.log('使用的模型:', this.modelName);

            const prompt = this.createAnalysisPrompt(request);
            console.log('生成的提示詞:', prompt);

            // 根據 LM Studio 的 API 格式調整請求
            // 在 analyzeGameResults 方法中修改 system prompt
            const requestBody = {
                model: this.modelName,
                messages: [
                    {
                        role: "system",
                        content: "You are a language learning expert specializing in analyzing English listening game performance. Please ensure all feedback is concise and brief (maximum 10 words per item). Return analysis results in JSON format."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 400,
                stream: false
            };
            console.log('發送請求體:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('AI 服務響應狀態:', response.status);
            console.log('AI 服務響應頭:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI 服務錯誤詳情:', errorText);
                throw new Error(`AI服務錯誤: ${response.status} ${response.statusText}\n${errorText}`);
            }

            const data = await response.json();
            console.log('AI 原始響應:', data);

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('AI 響應格式錯誤:', data);
                throw new Error('AI 響應格式不正確');
            }

            const aiResponse = data.choices[0].message.content;
            console.log('AI 響應內容:', aiResponse);

            return this.parseAIResponse(aiResponse, request);
        } catch (error: any) {
            console.error('AI分析失敗:', error);

            // 提供友好的錯誤信息
            let errorMessage = 'AI analysis service temporarily unavailable.';

            if (error.message.includes('Network request failed') ||
                error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to AI service. Please ensure:\n1. LM Studio is running\n2. Service address is correct\n3. No firewall blocking connections';
            } else if (error.message.includes('404')) {
                errorMessage = 'AI service not found. Please check if LM Studio is correctly started and API service is configured.';
            }

            throw new Error(errorMessage);
        }
    }

    private createAnalysisPrompt(request: AIAnalysisRequest): string {
        return `You are analyzing English listening game performance.

Performance Data:
- Difficulty: ${request.difficulty}
- Score: ${request.score}
- Accuracy: ${request.accuracy}%
- Correct: ${request.correctAnswers}/${request.totalQuestions}
- Max Streak: ${request.maxStreak}

Return ONLY this JSON structure, no other text:
{
  "feedback": "Brief performance feedback (max 15 words)",
  "suggestions": ["First learning tip", "Second learning tip"]
}`;
    }

    private parseAIResponse(response: string, request?: AIAnalysisRequest): AIAnalysisResponse {
        try {
            console.log('嘗試解析 AI 響應:', response);

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

            console.log('清理後的響應:', cleanedResponse);

            // 嘗試解析 JSON
            const parsed = JSON.parse(cleanedResponse);

            // 簡化響應內容
            const simplifyText = (text: string) => {
                if (text.split(' ').length > 10) {
                    // 如果超過10個單字，截斷並添加...
                    return text.split(' ').slice(0, 10).join(' ') + '...';
                }
                return text;
            };

            // 簡化數組中的每個項目
            const simplifyArray = (arr: string[]) => {
                return arr.map(item => simplifyText(item));
            };

            return {
                feedback: parsed.feedback ? simplifyText(parsed.feedback) : "表現良好",
                suggestions: Array.isArray(parsed.suggestions) ? simplifyArray(parsed.suggestions) : [],
                strengths: Array.isArray(parsed.strengths) ? simplifyArray(parsed.strengths) : [],
                areas_to_improve: Array.isArray(parsed.areas_to_improve) ? simplifyArray(parsed.areas_to_improve) : [],
                estimated_level: parsed.estimated_level || "待評估",
                recommended_next_steps: Array.isArray(parsed.recommended_next_steps) ? simplifyArray(parsed.recommended_next_steps) : []
            };
        } catch (error) {
            console.error('解析AI響應失敗:', error);
            console.error('原始響應:', response);

            // 如果解析失敗，創建一個簡短的默認響應
            return this.getDefaultResponse();
        }
    }

    private getDefaultResponse(): AIAnalysisResponse {
        return {
            feedback: "AI analysis feature temporarily unavailable",
            suggestions: ["Continue practicing", "Listen to more English", "Try new difficulty"],
            strengths: ["Active participation"],
            areas_to_improve: ["Need more practice"],
            estimated_level: "To be assessed",
            recommended_next_steps: ["Daily practice"]
        };
    }
}

export default new AIService();