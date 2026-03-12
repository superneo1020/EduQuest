// app/services/WritingAIService.ts
import { Platform } from 'react-native';

// 定義 __DEV__ 如果不存在
declare const __DEV__: boolean | undefined;

export type WritingAnalysis = {
    score: number;
    feedback: string;
    suggestions: string[];
    correctedSentence?: string;
    grammarErrors?: GrammarError[];
    vocabularyScore?: number;
    structureScore?: number;
    confidence?: number;
};

export type GrammarError = {
    type: string;
    original: string;
    corrected: string;
    explanation: string;
};

export type WritingPrompt = {
    imageDescription: string;
    category: string;
    wordLimit: number;
};

class WritingAIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;

    constructor() {
        // 使用與 chatbot.tsx 相同的後端地址
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = 'gemma'; // 簡化模型名稱
        this.enabled = true;

        console.log('📝 WritingAIService initialized:', {
            baseURL: this.baseURL,
            modelName: this.modelName,
            enabled: this.enabled
        });
    }

    /**
     * 獲取適配當前平台的 URL
     */
    private getAdaptedURL(url: string): string {
        // 如果是開發環境且在模擬器中，需要特殊處理 localhost
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('🏗️ DEV mode detected, adapting URL for platform:', Platform.OS);

            if (url.includes('localhost') || url.includes('127.0.0.1')) {
                if (Platform.OS === 'android') {
                    // Android 模擬器使用特殊地址
                    const adapted = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
                    console.log('🤖 Android emulator detected, adapted URL:', adapted);
                    return adapted;
                } else if (Platform.OS === 'ios') {
                    console.log('🍎 iOS simulator detected, using localhost directly');
                }
            }
        }
        return url;
    }

    /**
     * 分析學生的寫作
     */
    async analyzeWriting(
        studentWriting: string,
        prompt: string,
        promptInfo: WritingPrompt
    ): Promise<WritingAnalysis> {
        console.log('🚀 Starting AI analysis...');
        console.log('📝 Student writing:', studentWriting);
        console.log('🎯 Prompt:', prompt);
        console.log('📊 Prompt info:', promptInfo);

        if (!this.enabled) {
            console.log('⚠️ AI service disabled, returning mock analysis');
            return this.mockAnalysis(studentWriting, prompt, promptInfo);
        }

        try {
            console.log('🤖 Attempting AI analysis...');

            // 構建提示詞
            const fullPrompt = this.buildWritingPrompt(studentWriting, prompt, promptInfo);

            console.log('📤 Sending request to AI service...');
            console.log('🔗 Base URL:', this.baseURL);
            console.log('🤖 Model:', this.modelName);

            // 使用與 chatbot.tsx 相同的請求格式
            const requestBody = {
                prompt: fullPrompt
            };

            const adaptedURL = this.getAdaptedURL(this.baseURL);
            console.log('🌐 Adapted URL:', adaptedURL);

            const startTime = Date.now();

            // 使用 /chat 端點，與 chatbot.tsx 保持一致
            const response = await fetch(`${adaptedURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const endTime = Date.now();

            console.log('📥 AI service response received in', endTime - startTime, 'ms');
            console.log('🔢 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ AI service error:', errorText);

                // 降級到模擬分析
                return this.mockAnalysis(studentWriting, prompt, promptInfo);
            }

            const data = await response.json();
            console.log('✅ AI response received:', data);

            // 根據 chatbot.tsx 的響應格式解析
            const aiResponse = data.response || data.choices?.[0]?.message?.content || data.result;

            if (!aiResponse) {
                console.error('❌ AI response format error:', data);
                return this.mockAnalysis(studentWriting, prompt, promptInfo);
            }

            console.log('📄 AI response content:', aiResponse);

            // 解析 AI 回應
            const analysis = this.parseAIResponse(aiResponse, studentWriting, promptInfo);

            return {
                ...analysis,
                confidence: 0.8,
            };

        } catch (error: any) {
            console.error('❌ AI analysis failed:', error.message || error);
            console.log('🔄 Falling back to mock analysis');

            // 降級到模擬分析
            return this.mockAnalysis(studentWriting, prompt, promptInfo);
        }
    }

    /**
     * 構建寫作提示詞
     */
    private buildWritingPrompt(
        studentWriting: string,
        prompt: string,
        promptInfo: WritingPrompt
    ): string {
        const wordCount = studentWriting.trim().split(/\s+/).filter(w => w.length > 0).length;

        return `You are an English writing teacher for young students (age 8-12).

TASK: Analyze the student's writing based on the prompt.

WRITING PROMPT: "${prompt}"
PICTURE DESCRIPTION: ${promptInfo.imageDescription}
CATEGORY: ${promptInfo.category}
WORD LIMIT: ${promptInfo.wordLimit}

STUDENT'S WRITING: "${studentWriting}"
WORD COUNT: ${wordCount}

Please analyze this writing and provide feedback in the following JSON format:
{
    "score": [number from 0-100],
    "feedback": "Brief, encouraging feedback for the student",
    "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "correctedSentence": "Corrected version if needed, otherwise same as original",
    "grammarErrors": [
        {
            "type": "error type",
            "original": "incorrect text",
            "corrected": "corrected text",
            "explanation": "brief explanation"
        }
    ],
    "vocabularyScore": [number from 1-10],
    "structureScore": [number from 1-10]
}

Guidelines:
1. Score based on vocabulary, grammar, creativity, and relevance to prompt
2. Feedback should be positive and encouraging
3. Suggestions should be specific and helpful
4. Correct obvious grammar and spelling errors
5. Keep language simple for young learners`;
    }

    /**
     * 解析 AI 回應
     */
    private parseAIResponse(aiResponse: string, originalWriting: string, promptInfo: WritingPrompt): WritingAnalysis {
        console.log('🔍 Parsing AI response...');

        try {
            // 清理響應文本，移除可能的 markdown 代碼塊
            let cleanedResponse = aiResponse.trim();

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

            console.log('📄 Cleaned response:', cleanedResponse);

            // 嘗試解析 JSON
            const parsed = JSON.parse(cleanedResponse);

            // 驗證並返回結果
            return {
                score: Math.min(100, Math.max(0, parsed.score || 70)),
                feedback: parsed.feedback || "Good effort! Keep practicing your English writing.",
                suggestions: Array.isArray(parsed.suggestions) ?
                    parsed.suggestions.slice(0, 3) :
                    this.getDefaultSuggestions(originalWriting),
                correctedSentence: parsed.correctedSentence || this.generateDefaultCorrection(originalWriting),
                grammarErrors: Array.isArray(parsed.grammarErrors) ?
                    parsed.grammarErrors.slice(0, 2) : [],
                vocabularyScore: Math.min(10, Math.max(1, parsed.vocabularyScore || 7)),
                structureScore: Math.min(10, Math.max(1, parsed.structureScore || 7)),
            };

        } catch (error) {
            console.error('❌ Failed to parse AI response as JSON:', error);
            console.log('📄 Response that failed:', aiResponse);

            // 嘗試從文本格式解析
            return this.parseTextResponse(aiResponse, originalWriting, promptInfo);
        }
    }

    /**
     * 解析文本格式的回應
     */
    private parseTextResponse(response: string, originalWriting: string, promptInfo: WritingPrompt): WritingAnalysis {
        console.log('📝 Attempting to parse as text response...');

        try {
            // 嘗試從文本中找到 JSON 部分
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                console.log('🎯 Found JSON in response:', jsonStr);
                return this.parseAIResponse(jsonStr, originalWriting, promptInfo);
            }
        } catch (error) {
            console.error('❌ Failed to extract JSON from text:', error);
        }

        // 如果都失敗，返回模擬分析
        return this.mockAnalysis(originalWriting, "", promptInfo);
    }

    /**
     * 測試連接
     */
    async testConnection(): Promise<boolean> {
        console.log('🔌 Testing backend connection...');

        try {
            const adaptedURL = this.getAdaptedURL(this.baseURL);
            console.log('🌐 Testing connection to:', adaptedURL);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${adaptedURL}/health` || adaptedURL, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const isConnected = response.ok;
            console.log('📊 Connection test result:', isConnected ? '✅ SUCCESS' : '❌ FAILED');

            return isConnected;

        } catch (error: any) {
            console.error('❌ Connection test failed:', error.message || error);
            return false;
        }
    }

    /**
     * 獲取默認建議
     */
    private getDefaultSuggestions(writing: string): string[] {
        const wordCount = writing.trim().split(/\s+/).filter(w => w.length > 0).length;

        const suggestions = [
            "Try to use more descriptive words like 'beautiful', 'colorful', or 'exciting'.",
            "Remember to start sentences with capital letters.",
            "Add periods at the end of your sentences.",
        ];

        if (wordCount < 15) {
            suggestions.push("Try to write a bit more to describe the scene better.");
        }

        return suggestions.slice(0, 3);
    }

    /**
     * 生成默認修正句子
     */
    private generateDefaultCorrection(writing: string): string {
        if (!writing || writing.trim().length === 0) {
            return "";
        }

        let corrected = writing.trim();

        // 確保首字母大寫
        if (corrected.length > 0) {
            corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
        }

        // 確保有句號
        if (!corrected.endsWith('.') && !corrected.endsWith('!') && !corrected.endsWith('?')) {
            corrected += '.';
        }

        return corrected;
    }

    /**
     * 模擬分析（備用方案）
     */
    private mockAnalysis(
        studentWriting: string,
        prompt: string,
        promptInfo: WritingPrompt
    ): WritingAnalysis {
        console.log('🎭 Generating mock analysis');

        const wordCount = studentWriting.trim().split(/\s+/).filter(w => w.length > 0).length;
        const sentences = studentWriting.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // 基礎分數
        let score = 70;

        // 基於字數評分
        if (wordCount >= 25 && wordCount <= promptInfo.wordLimit) {
            score += 15;
        } else if (wordCount >= 15) {
            score += 10;
        } else if (wordCount < 10) {
            score -= 10;
        } else if (wordCount < 5) {
            score -= 20;
        }

        // 基於句子結構評分
        if (sentences.length >= 2) {
            score += 5;
        }
        if (sentences.length >= 3) {
            score += 5;
        }

        // 檢查基本語法
        const hasCapital = /[A-Z]/.test(studentWriting[0] || '');
        const hasPeriod = studentWriting.trim().endsWith('.');
        const hasDescriptive = /(beautiful|colorful|big|small|happy|fun|nice|good|sunny|cloudy)/i.test(studentWriting);

        if (hasCapital) {
            score += 5;
        }
        if (hasPeriod) {
            score += 5;
        }
        if (hasDescriptive) {
            score += 10;
        }

        // 最終分數限制
        score = Math.min(95, Math.max(30, score));

        // 生成反饋
        let feedback = '';
        if (score >= 90) {
            feedback = 'Excellent writing! You described the scene beautifully with great vocabulary and structure.';
        } else if (score >= 70) {
            feedback = 'Good effort! Your writing is clear and shows understanding of the scene.';
        } else if (score >= 50) {
            feedback = 'Nice try! You have good ideas. With a little more practice, your writing will improve.';
        } else {
            feedback = 'Keep practicing! Remember to write complete sentences and describe what you see.';
        }

        // 生成建議
        const suggestions = [];
        if (!hasCapital) {
            suggestions.push('Start sentences with capital letters.');
        }
        if (!hasPeriod) {
            suggestions.push('Add periods at the end of sentences.');
        }
        if (!hasDescriptive) {
            suggestions.push('Use descriptive words like "beautiful", "colorful", or "exciting".');
        }
        if (wordCount < 15) {
            suggestions.push('Try to write a bit more to describe the scene.');
        }

        // 確保有足夠的建議
        while (suggestions.length < 3) {
            suggestions.push('Keep practicing your English writing every day.');
        }

        const correctedSentence = this.generateDefaultCorrection(studentWriting);

        return {
            score,
            feedback,
            suggestions: suggestions.slice(0, 3),
            correctedSentence,
            grammarErrors: !hasCapital || !hasPeriod ? [
                {
                    type: !hasCapital ? 'Capitalization' : 'Punctuation',
                    original: studentWriting,
                    corrected: correctedSentence,
                    explanation: !hasCapital
                        ? 'Sentences should begin with a capital letter.'
                        : 'Sentences should end with proper punctuation like a period.'
                }
            ] : [],
            vocabularyScore: hasDescriptive ? 8 : 6,
            structureScore: sentences.length >= 2 ? 8 : 6,
            confidence: 0.3, // 模擬分析的置信度較低
        };
    }
}

// 導出默認實例
export const writingAIService = new WritingAIService();

// 導出工具函數
export const formatGrammarErrors = (errors: GrammarError[]): string => {
    if (!errors || errors.length === 0) return '';

    return errors.map(error =>
        `• ${error.type}: "${error.original}" → "${error.corrected}"\n  ${error.explanation}`
    ).join('\n\n');
};

export const calculateOverallScore = (analysis: WritingAnalysis): number => {
    const weights = {
        mainScore: 0.6,
        vocabulary: 0.2,
        structure: 0.2
    };

    const vocabScore = (analysis.vocabularyScore || 7) * 10;
    const structScore = (analysis.structureScore || 7) * 10;

    const weightedScore =
        analysis.score * weights.mainScore +
        vocabScore * weights.vocabulary +
        structScore * weights.structure;

    return Math.round(weightedScore);
};