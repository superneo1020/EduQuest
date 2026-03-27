// services/reorderService.ts
// 移除 Config 导入，因为可能不存在
// import { Config } from '../config';

// ============ 类型定义 ============

export interface ReorderQuestion {
    id: string;
    sentence: string;
    words: string[];
    translation: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface ReorderGameResult {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    score: number;
    accuracy: number;
    difficulty: string;
    timestamp: string;
}

export interface ReorderAnalysisResponse {
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areas_to_improve: string[];
    estimated_level: string;
    recommended_next_steps: string[];
}

// ============ 服务类 ============

class ReorderService {
    private baseURL: string;
    private enabled: boolean;

    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        this.enabled = true;
    }

    /**
     * 检查 AI 服务是否可用
     * 使用 /chat 端点而不是 /health，因为很多后端没有 /health 路由
     */
    async isAIAvailable(): Promise<boolean> {
        if (!this.enabled) return false;

        try {
            // 尝试发送一个简单的测试请求到 /chat 端点
            // 使用一个非常简单的 prompt 来测试连接
            const testPrompt = "Hello, please respond with 'OK'";
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: testPrompt }),
                signal: AbortSignal.timeout(5000) // 5秒超时
            });

            // 如果响应成功，说明 AI 服务可用
            const isAvailable = response.ok;
            console.log('AI service available:', isAvailable);
            return isAvailable;
        } catch (error) {
            console.log('AI service not available:', error);
            return false;
        }
    }

    /**
     * 生成单个句子重排题目
     * @param level 难度级别
     * @param index 题目索引（用于多样性）
     * @param topic 可选的主题
     */
    async generateSingleQuestion(
        level: 'easy' | 'medium' | 'hard',
        index: number,
        topic?: string
    ): Promise<ReorderQuestion | null> {
        try {
            console.log(`Generating reorder question ${index + 1} for ${level} level...`);

            const randomSeed = Math.floor(Math.random() * 10000);
            const prompt = this.createReorderPrompt(level, index, randomSeed, topic);

            const aiResponse = await this.sendAIRequest(prompt);
            const question = this.parseReorderResponse(aiResponse, level, index);

            if (question) {
                console.log(`Generated question: "${question.sentence}"`);
                return question;
            } else {
                console.log(`Failed to parse AI question ${index + 1}, using fallback`);
                return this.getFallbackQuestion(level, index);
            }
        } catch (error: any) {
            console.error(`AI question generation failed for question ${index + 1}:`, error);
            return this.getFallbackQuestion(level, index);
        }
    }

    /**
     * 批量生成题目
     */
    async generateQuestions(
        level: 'easy' | 'medium' | 'hard',
        count: number,
        topics?: string[]
    ): Promise<ReorderQuestion[]> {
        const questions: ReorderQuestion[] = [];

        for (let i = 0; i < count; i++) {
            const topic = topics?.[i % (topics?.length || 1)];
            const question = await this.generateSingleQuestion(level, i, topic);
            if (question) {
                questions.push(question);
            } else {
                // 使用备用题目
                questions.push(this.getFallbackQuestion(level, i));
            }

            // 添加延迟避免请求过快
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return questions;
    }

    /**
     * 发送请求到 AI 服务
     */
    private async sendAIRequest(prompt: string): Promise<string> {
        if (!this.enabled) {
            throw new Error('AI service is disabled');
        }

        console.log('Sending request to AI service...');
        console.log('Prompt length:', prompt.length);

        try {
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    // 添加一些额外的参数，根据你的后端 API 调整
                    model: 'gemma', // 如果后端需要模型参数
                    max_tokens: 500
                }),
                signal: AbortSignal.timeout(30000) // 30秒超时
            });

            console.log('AI service response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI service error response:', errorText);
                throw new Error(`AI service error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('AI raw response received');

            // 根据后端返回格式提取响应文本
            let aiResponseText = '';

            // 尝试多种可能的响应格式
            if (data.response) {
                aiResponseText = data.response;
            } else if (data.choices && data.choices[0] && data.choices[0].message) {
                aiResponseText = data.choices[0].message.content;
            } else if (data.content) {
                aiResponseText = data.content;
            } else if (data.text) {
                aiResponseText = data.text;
            } else if (typeof data === 'string') {
                aiResponseText = data;
            } else {
                console.error('Unknown response format:', data);
                throw new Error('Unknown response format from AI service');
            }

            if (!aiResponseText) {
                throw new Error('Empty response from AI service');
            }

            return aiResponseText;
        } catch (error: any) {
            console.error('AI request failed:', error.message);
            throw error;
        }
    }

    /**
     * 创建 AI 提示词
     */
    private createReorderPrompt(
        level: 'easy' | 'medium' | 'hard',
        index: number,
        randomSeed: number,
        topic?: string
    ): string {
        const levelDescriptions = {
            easy: "Very simple sentences. Use 3-4 words per sentence. Examples: 'I like cats', 'She is happy', 'The dog runs'",
            medium: "Simple sentences with common phrases. Use 4-5 words per sentence. Examples: 'I go to school', 'She reads a book', 'They are playing football'",
            hard: "Complex sentences with clauses or questions. Use 5-6 words per sentence. Examples: 'Do you like to eat pizza?', 'She is going to the market', 'The cat sleeps on the sofa'"
        };

        const topicsList = {
            easy: [
                "daily objects", "animals", "food", "family", "colors",
                "actions", "feelings", "weather", "transportation", "clothing"
            ],
            medium: [
                "daily routines", "school activities", "shopping", "travel", "hobbies",
                "work", "health", "entertainment", "social interactions", "technology"
            ],
            hard: [
                "opinions and preferences", "future plans", "past experiences",
                "hypothetical situations", "professional scenarios", "cultural topics",
                "problem solving", "complex descriptions", "comparisons", "explanations"
            ]
        };

        // 根据随机种子选择主题
        const availableTopics = topicsList[level];
        const selectedTopic = topic || availableTopics[(index + randomSeed) % availableTopics.length];

        // 添加多样性示例
        const exampleSentence = this.getExampleSentence(level, randomSeed);

        return `You are an English language learning expert. Generate a sentence reordering exercise.

Level: ${level.toUpperCase()} - ${levelDescriptions[level]}
Topic: ${selectedTopic}

Reference example (for format only): ${exampleSentence}

Generate a sentence that can be split into individual words for a reordering game.
The sentence should be:
- Appropriate for ${level} level learners
- Related to "${selectedTopic}"
- Contain 3-6 meaningful words (for easy: 3-4, medium: 4-5, hard: 5-6)
- Include punctuation if needed (?, !, etc.)

IMPORTANT: The sentence must be different from the example. Be creative!

Return the response in this EXACT JSON format with no additional text:
{
    "sentence": "the complete original sentence",
    "words": ["word1", "word2", "word3", "word4"],
    "translation": "translation in Chinese/learner's language"
}

Requirements:
- The "words" array must contain each word/particle as a separate element
- For questions, include "?" as a separate word element
- For contractions, keep them as single words (e.g., "don't", "I'm")
- The translation should help learners understand the meaning
- Make the sentence unique and different from common examples
- Return ONLY valid JSON, no other text.`;
    }

    /**
     * 获取示例句子
     */
    private getExampleSentence(level: string, seed: number): string {
        const examples = {
            easy: [
                '{"sentence": "I like dogs", "words": ["I", "like", "dogs"], "translation": "我喜欢狗"}',
                '{"sentence": "She is happy", "words": ["She", "is", "happy"], "translation": "她很快乐"}',
                '{"sentence": "The cat sleeps", "words": ["The", "cat", "sleeps"], "translation": "猫在睡觉"}'
            ],
            medium: [
                '{"sentence": "I go to school", "words": ["I", "go", "to", "school"], "translation": "我去上学"}',
                '{"sentence": "She reads a book", "words": ["She", "reads", "a", "book"], "translation": "她在读书"}',
                '{"sentence": "They are playing football", "words": ["They", "are", "playing", "football"], "translation": "他们在踢足球"}'
            ],
            hard: [
                '{"sentence": "Do you like coffee?", "words": ["Do", "you", "like", "coffee", "?"], "translation": "你喜欢咖啡吗？"}',
                '{"sentence": "She is going to the market", "words": ["She", "is", "going", "to", "the", "market"], "translation": "她要去市场"}',
                '{"sentence": "The cat sleeps on the sofa", "words": ["The", "cat", "sleeps", "on", "the", "sofa"], "translation": "猫在沙发上睡觉"}'
            ]
        };

        const levelExamples = examples[level as keyof typeof examples] || examples.medium;
        return levelExamples[seed % levelExamples.length];
    }

    /**
     * 解析 AI 响应
     */
    private parseReorderResponse(
        response: string,
        level: 'easy' | 'medium' | 'hard',
        index: number
    ): ReorderQuestion | null {
        try {
            // 清理响应文本
            let cleanedResponse = response.trim();

            // 移除可能存在的 markdown 代码块标记
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

            // 尝试找到 JSON 对象
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }

            console.log(`Parsing reorder question ${index + 1}:`, cleanedResponse.substring(0, 200));

            const parsed = JSON.parse(cleanedResponse);

            if (!parsed.sentence || !parsed.words || !Array.isArray(parsed.words) || parsed.words.length < 2) {
                console.error('Invalid response structure:', parsed);
                throw new Error('Invalid response format');
            }

            return {
                id: `reorder-${level}-${index + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                sentence: parsed.sentence,
                words: parsed.words,
                translation: parsed.translation || this.generateDefaultTranslation(parsed.sentence),
                difficulty: level
            };
        } catch (error) {
            console.error('Failed to parse reorder response:', error);
            console.error('Raw response:', response);
            return null;
        }
    }

    /**
     * 生成默认翻译（简单处理）
     */
    private generateDefaultTranslation(sentence: string): string {
        // 简单的默认翻译
        const translations: Record<string, string> = {
            'I like dogs': '我喜欢狗',
            'She is happy': '她很快乐',
            'The cat sleeps': '猫在睡觉',
            'I go to school': '我去上学',
            'She reads a book': '她在读书',
            'They are playing football': '他们在踢足球',
            'Do you like coffee?': '你喜欢咖啡吗？',
            'She is going to the market': '她要去市场',
            'The cat sleeps on the sofa': '猫在沙发上睡觉'
        };

        return translations[sentence] || '请练习这个句子';
    }

    /**
     * 获取备用题目
     */
    getFallbackQuestion(level: 'easy' | 'medium' | 'hard', index: number): ReorderQuestion {
        const fallbackQuestions: Record<string, ReorderQuestion[]> = {
            easy: [
                { id: 'easy-1', sentence: 'I like dogs', words: ['I', 'like', 'dogs'], translation: '我喜欢狗', difficulty: 'easy' },
                { id: 'easy-2', sentence: 'She is happy', words: ['She', 'is', 'happy'], translation: '她很快乐', difficulty: 'easy' },
                { id: 'easy-3', sentence: 'The cat sleeps', words: ['The', 'cat', 'sleeps'], translation: '猫在睡觉', difficulty: 'easy' },
                { id: 'easy-4', sentence: 'We are friends', words: ['We', 'are', 'friends'], translation: '我们是朋友', difficulty: 'easy' },
                { id: 'easy-5', sentence: 'He runs fast', words: ['He', 'runs', 'fast'], translation: '他跑得快', difficulty: 'easy' }
            ],
            medium: [
                { id: 'medium-1', sentence: 'I go to school', words: ['I', 'go', 'to', 'school'], translation: '我去上学', difficulty: 'medium' },
                { id: 'medium-2', sentence: 'She reads a book', words: ['She', 'reads', 'a', 'book'], translation: '她在读书', difficulty: 'medium' },
                { id: 'medium-3', sentence: 'They are playing football', words: ['They', 'are', 'playing', 'football'], translation: '他们在踢足球', difficulty: 'medium' },
                { id: 'medium-4', sentence: 'We eat lunch at noon', words: ['We', 'eat', 'lunch', 'at', 'noon'], translation: '我们中午吃午饭', difficulty: 'medium' },
                { id: 'medium-5', sentence: 'He works in an office', words: ['He', 'works', 'in', 'an', 'office'], translation: '他在办公室工作', difficulty: 'medium' }
            ],
            hard: [
                { id: 'hard-1', sentence: 'Do you like coffee?', words: ['Do', 'you', 'like', 'coffee', '?'], translation: '你喜欢咖啡吗？', difficulty: 'hard' },
                { id: 'hard-2', sentence: 'She is going to the market', words: ['She', 'is', 'going', 'to', 'the', 'market'], translation: '她要去市场', difficulty: 'hard' },
                { id: 'hard-3', sentence: 'The cat sleeps on the sofa', words: ['The', 'cat', 'sleeps', 'on', 'the', 'sofa'], translation: '猫在沙发上睡觉', difficulty: 'hard' }
            ]
        };

        const questions = fallbackQuestions[level] || fallbackQuestions.medium;
        const safeIndex = index % questions.length;
        const q = questions[safeIndex];

        return {
            ...q,
            id: `${level}-fallback-${index + 1}-${Date.now()}`
        };
    }

    /**
     * 分析游戏结果
     */
    async analyzeGameResults(result: ReorderGameResult): Promise<ReorderAnalysisResponse> {
        try {
            const prompt = this.createAnalysisPrompt(result);
            const aiResponse = await this.sendAIRequest(prompt);
            return this.parseAnalysisResponse(aiResponse);
        } catch (error) {
            console.error('Game analysis failed:', error);
            return this.getDefaultAnalysisResponse();
        }
    }

    private createAnalysisPrompt(result: ReorderGameResult): string {
        return `You are an English language learning expert. Analyze this sentence reordering game performance.

Performance Data:
- Difficulty Level: ${result.difficulty}
- Total Score: ${result.score}
- Accuracy: ${result.accuracy}%
- Correct Answers: ${result.correctAnswers}/${result.totalQuestions}
- Wrong Answers: ${result.wrongAnswers}

Provide analysis in JSON format:
{
    "feedback": "Brief performance summary (max 15 words)",
    "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
    "strengths": ["Strength 1", "Strength 2"],
    "areas_to_improve": ["Area 1", "Area 2"],
    "estimated_level": "Beginner/Intermediate/Advanced",
    "recommended_next_steps": ["Step 1", "Step 2"]
}

Return ONLY valid JSON.`;
    }

    private parseAnalysisResponse(response: string): ReorderAnalysisResponse {
        try {
            let cleanedResponse = response.trim();
            if (cleanedResponse.startsWith('```json')) cleanedResponse = cleanedResponse.substring(7);
            if (cleanedResponse.startsWith('```')) cleanedResponse = cleanedResponse.substring(3);
            if (cleanedResponse.endsWith('```')) cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);

            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }

            const parsed = JSON.parse(cleanedResponse.trim());

            return {
                feedback: parsed.feedback || "Good effort!",
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 2) : [],
                areas_to_improve: Array.isArray(parsed.areas_to_improve) ? parsed.areas_to_improve.slice(0, 2) : [],
                estimated_level: parsed.estimated_level || "To be assessed",
                recommended_next_steps: Array.isArray(parsed.recommended_next_steps) ? parsed.recommended_next_steps.slice(0, 2) : []
            };
        } catch (error) {
            console.error('Failed to parse analysis response:', error);
            return this.getDefaultAnalysisResponse();
        }
    }

    getDefaultAnalysisResponse(): ReorderAnalysisResponse {
        return {
            feedback: "Keep practicing to improve your sentence structure!",
            suggestions: ["Practice daily", "Review word order rules", "Listen to English sentences"],
            strengths: ["Active participation"],
            areas_to_improve: ["Word order consistency"],
            estimated_level: "In progress",
            recommended_next_steps: ["Continue practicing", "Try harder levels"]
        };
    }

    /**
     * 随机打乱单词数组（用于游戏显示）
     */
    shuffleWords(words: string[]): { word: string; originalIndex: number }[] {
        const shuffled = words.map((word, index) => ({
            word,
            originalIndex: index
        }));

        // Fisher-Yates 洗牌算法
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    /**
     * 检查答案是否正确
     */
    checkAnswer(currentOrder: number[]): boolean {
        // 检查是否按顺序排列（0,1,2,3...）
        for (let i = 0; i < currentOrder.length; i++) {
            if (currentOrder[i] !== i) {
                return false;
            }
        }
        return true;
    }
}

// 导出单例
export default new ReorderService();