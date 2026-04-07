// services/AIService.ts
import { Config } from '../config';

// ============ 类型定义 ============
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

export type Question = {
    id: string;
    audioText: string;
    options: { id: string; text: string; correct: boolean }[];
    hint: string;
    level: 'easy' | 'medium' | 'hard';
};

// 编辑距离（Levenshtein）用于相似度去重
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

class AIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;
    // 游戏会话去重记录
    private usedAnswers: Set<string> = new Set();
    private usedFallbackIndices: Set<number> = new Set();
    private currentLevel: 'easy' | 'medium' | 'hard' | null = null;

    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = Config.AI_MODEL_NAME || 'gemma';
        this.enabled = Config.AI_ENABLED !== false;
    }

    /** 新游戏开始时调用，清空去重记录 */
    public resetGameSession(level: 'easy' | 'medium' | 'hard'): void {
        this.usedAnswers.clear();
        this.usedFallbackIndices.clear();
        this.currentLevel = level;
    }

    /**
     * 难度映射：将外部请求的难度转换为内部实际使用的难度
     * 新规则：
     * - 外部 easy -> 内部 medium（原 medium 题目变成 easy）
     * - 外部 medium -> 内部 hard（原 hard 题目变成 medium）
     * - 外部 hard -> 内部 easy（原 easy 题目变成 hard）
     */
    private mapLevel(level: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' {
        switch (level) {
            case 'easy': return 'easy';
            case 'medium': return 'medium';
            case 'hard': return 'hard';
            default: return level;
        }
    }

    // ============ 通用方法 ============
    private async sendRequest(prompt: string): Promise<string> {
        if (!this.enabled) {
            throw new Error('AI service is disabled');
        }

        try {
            console.log(`Connecting to AI service: ${this.baseURL}, model: ${this.modelName}`);
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    model: this.modelName
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI service error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            const aiResponseText = data.response || data.choices?.[0]?.message?.content || data.result;
            if (!aiResponseText) throw new Error('AI response format incorrect');
            return aiResponseText;
        } catch (error: any) {
            console.error('AI service request failed:', error);
            throw error;
        }
    }

    private cleanResponseText(response: string): string {
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        return cleaned.trim();
    }

    // ============ 游戏结果分析 ============
    async analyzeGameResults(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        if (!this.enabled) return this.getDefaultAnalysisResponse();
        try {
            const prompt = this.createAnalysisPrompt(request);
            const aiResponseText = await this.sendRequest(prompt);
            return this.parseAnalysisResponse(aiResponseText);
        } catch (error) {
            console.error('Analysis failed:', error);
            return this.getDefaultAnalysisResponse();
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
    "feedback": "Brief summary (max 15 words)",
    "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
    "strengths": ["Strength 1", "Strength 2"],
    "areas_to_improve": ["Area 1", "Area 2"],
    "estimated_level": "Beginner/Intermediate/Advanced",
    "recommended_next_steps": ["Step 1", "Step 2"]
}
Return ONLY valid JSON, no other text.`;
    }

    private parseAnalysisResponse(response: string): AIAnalysisResponse {
        try {
            const cleaned = this.cleanResponseText(response);
            const parsed = JSON.parse(cleaned);
            const simplifyText = (text: string, maxWords: number = 15) => {
                if (!text) return "";
                const words = text.split(' ');
                return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : text;
            };
            const simplifyArray = (arr: string[], maxWords: number = 8) =>
                Array.isArray(arr) ? arr.map(item => simplifyText(item, maxWords)) : [];
            return {
                feedback: parsed.feedback ? simplifyText(parsed.feedback, 15) : "Good performance! Keep practicing.",
                suggestions: simplifyArray(parsed.suggestions, 8),
                strengths: simplifyArray(parsed.strengths, 8),
                areas_to_improve: simplifyArray(parsed.areas_to_improve, 8),
                estimated_level: parsed.estimated_level || "To be assessed",
                recommended_next_steps: simplifyArray(parsed.recommended_next_steps, 8)
            };
        } catch (error) {
            return this.getDefaultAnalysisResponse();
        }
    }

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

    // ============ 题目生成（核心） ============
    async generateSingleQuestion(level: 'easy' | 'medium' | 'hard', index: number): Promise<Question | null> {
        // 外部级别变化时重置会话（保持原有逻辑）
        if (this.currentLevel !== level) {
            this.resetGameSession(level);
        }

        // 难度映射：将外部请求的难度转换为内部实际难度
        const internalLevel = this.mapLevel(level);

        if (!this.enabled) {
            return this.getUniqueFallbackQuestion(internalLevel, index, level);
        }

        const maxRetries = 3;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Generating ${level} question (internal ${internalLevel}) ${index + 1} (attempt ${attempt + 1})...`);
                const randomSeed = Math.floor(Math.random() * 10000) + Date.now() + attempt;
                const prompt = this.createSingleQuestionPrompt(internalLevel, index, randomSeed);
                const aiResponseText = await this.sendRequest(prompt);
                const question = this.parseSingleQuestionResponse(aiResponseText, internalLevel, index);

                if (question) {
                    // 注意：去重时使用外部级别作为标识的一部分，避免不同难度互相干扰
                    const answerKey = this.normalizeAnswer(question, internalLevel);
                    let isDuplicate = false;
                    for (const used of this.usedAnswers) {
                        if (used === answerKey) {
                            isDuplicate = true;
                            break;
                        }
                        if (internalLevel !== 'easy' && levenshteinDistance(used, answerKey) <= 2) {
                            console.warn(`Similar answer: "${used}" vs "${answerKey}"`);
                            isDuplicate = true;
                            break;
                        }
                    }
                    if (!isDuplicate) {
                        this.usedAnswers.add(answerKey);
                        // 返回的 Question 中 level 字段应该使用外部级别（用户看到的难度）
                        return {
                            ...question,
                            level: level
                        };
                    } else {
                        console.warn(`Duplicate rejected: "${answerKey}"`);
                        if (attempt === maxRetries) break;
                        continue;
                    }
                }
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
            }
        }

        console.log('Using fallback due to duplicate or failure');
        return this.getUniqueFallbackQuestion(internalLevel, index, level);
    }

    private normalizeAnswer(question: Question, internalLevel: string): string {
        const correctOpt = question.options.find(opt => opt.correct);
        if (!correctOpt) return '';
        let text = correctOpt.text.trim().toLowerCase();
        text = text.replace(/[^\w\s]/g, '');
        if (internalLevel === 'easy') {
            text = text.split(/\s+/)[0];
        }
        return text;
    }

    /**
     * 获取一个未使用过的 fallback 题目
     * @param internalLevel 内部难度（决定使用哪个题库）
     * @param index 题目索引
     * @param externalLevel 外部难度（用于设置返回的 Question.level 字段）
     */
    private getUniqueFallbackQuestion(internalLevel: 'easy' | 'medium' | 'hard', index: number, externalLevel?: 'easy' | 'medium' | 'hard'): Question | null {
        const fallbackList = this.getFallbackList(internalLevel);
        const total = fallbackList.length;
        if (this.usedFallbackIndices.size >= total) {
            console.warn('All fallbacks used, resetting');
            this.usedFallbackIndices.clear();
        }
        const availableIndices: number[] = [];
        for (let i = 0; i < total; i++) {
            if (!this.usedFallbackIndices.has(i)) availableIndices.push(i);
        }
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        this.usedFallbackIndices.add(randomIndex);
        const q = fallbackList[randomIndex];

        let options = q.options.map((optText, i) => ({
            id: `${internalLevel}-fallback-${index}-opt-${i}-${Date.now()}`,
            text: optText,
            correct: optText === q.correct
        }));
        // 确保 medium/hard 的正确选项与 audioText 一致
        if (internalLevel !== 'easy' && options.find(opt => opt.correct)?.text !== q.audioText) {
            options = options.map(opt => ({
                ...opt,
                correct: opt.text === q.audioText
            }));
        }

        const finalLevel = externalLevel !== undefined ? externalLevel : internalLevel;
        return {
            id: `${finalLevel}-fallback-${index + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            audioText: q.audioText,
            options,
            hint: q.hint,
            level: finalLevel
        };
    }

    private getFallbackList(level: 'easy' | 'medium' | 'hard') {
        // 以下题库保持不变，分别对应原 easy / medium / hard 的内容
        const easyList = [
            { audioText: "it is fish, live in ocean", correct: "fish", options: ["fish", "cat", "bird", "dog"], hint: "Lives in water" },
            { audioText: "this animal has a long neck", correct: "giraffe", options: ["giraffe", "zebra", "lion", "elephant"], hint: "Tall African animal" },
            { audioText: "yellow fruit monkeys love", correct: "banana", options: ["banana", "apple", "orange", "grape"], hint: "Curved and sweet" },
            { audioText: "used to write on paper", correct: "pen", options: ["pen", "ruler", "eraser", "sharpener"], hint: "Writing tool with ink" },
            { audioText: "you sit on this furniture", correct: "chair", options: ["chair", "table", "sofa", "bed"], hint: "Has legs and a back" },
            { audioText: "vehicle that flies in sky", correct: "airplane", options: ["airplane", "car", "train", "boat"], hint: "Has wings and engines" },
            { audioText: "red fruit often in pies", correct: "apple", options: ["apple", "pear", "peach", "plum"], hint: "Keeps doctor away" },
            { audioText: "big animal with trunk", correct: "elephant", options: ["elephant", "rhino", "hippo", "buffalo"], hint: "Has large ears" },
            { audioText: "you wear it on feet", correct: "shoes", options: ["shoes", "socks", "pants", "hat"], hint: "Protects your soles" },
            { audioText: "hot drink made from beans", correct: "coffee", options: ["coffee", "tea", "milk", "juice"], hint: "Often drunk in morning" },
            { audioText: "king of the jungle", correct: "lion", options: ["lion", "tiger", "leopard", "cheetah"], hint: "Has a mane" },
            { audioText: "frozen water from sky", correct: "snow", options: ["snow", "rain", "hail", "ice"], hint: "White and cold" },
            { audioText: "you read it for stories", correct: "book", options: ["book", "magazine", "newspaper", "comic"], hint: "Has pages and a cover" },
            { audioText: "used to cut paper", correct: "scissors", options: ["scissors", "knife", "blade", "cutter"], hint: "Two blades crossing" },
            { audioText: "round object in the sky at night", correct: "moon", options: ["moon", "sun", "star", "planet"], hint: "Glows but not hot" },
            { audioText: "you use it to tell time", correct: "clock", options: ["clock", "watch", "timer", "calendar"], hint: "Has hands or digits" }
        ];
        const mediumList = [
            { audioText: "I want to soup, it is hot", correct: "I want to soup", options: ["I want to soup", "I want to eat", "I want to drink", "I want to cook"], hint: "Desire for soup" },
            { audioText: "She forgot her keys at home", correct: "She forgot her keys", options: ["She forgot her keys", "She lost her phone", "She missed the bus", "She broke her glasses"], hint: "Keys left behind" },
            { audioText: "The movie starts at eight", correct: "The movie starts at eight", options: ["The movie starts at eight", "The show begins at nine", "The concert is at seven", "The play ends at ten"], hint: "Film timing" },
            { audioText: "I need to buy some milk", correct: "I need to buy milk", options: ["I need to buy milk", "I want to drink milk", "I like cold milk", "Milk is healthy"], hint: "Grocery shopping" },
            { audioText: "Where can I find a taxi", correct: "Where can I find a taxi", options: ["Where can I find a taxi", "How much is the fare", "Call me a cab", "Is this bus going downtown"], hint: "Looking for a cab" },
            { audioText: "He is going to the gym", correct: "He is going to the gym", options: ["He is going to the gym", "He likes to exercise", "He works out daily", "He runs every morning"], hint: "Exercise place" },
            { audioText: "Please turn off the light", correct: "Please turn off the light", options: ["Turn on the lamp", "Please turn off the light", "Switch off the fan", "Close the curtain"], hint: "Darken the room" },
            { audioText: "I love eating pizza", correct: "I love eating pizza", options: ["I love eating pasta", "I enjoy burgers", "I like pizza", "Pizza is my favorite"], hint: "Italian dish" },
            { audioText: "She is wearing a red dress", correct: "She is wearing a red dress", options: ["Red dress on her", "She wears red", "Her dress is red", "She has a red outfit"], hint: "Color and clothing" },
            { audioText: "We need to catch the train", correct: "We need to catch the train", options: ["We must board the train", "Let's hurry to the station", "The train is leaving", "We have a train to take"], hint: "Railway travel" },
            { audioText: "Can you help me move this table", correct: "Can you help me move this table", options: ["Help with the desk", "Move this chair please", "Assist me with the table", "Lift the table together"], hint: "Furniture relocation" },
            { audioText: "The baby is sleeping peacefully", correct: "The baby is sleeping peacefully", options: ["Baby sleeps well", "Infant resting quietly", "Child is napping", "Little one in dreamland"], hint: "No noise please" },
            { audioText: "I will call you tomorrow", correct: "I will call you tomorrow", options: ["Phone you next day", "Give you a ring later", "Contact you soon", "Reach out tomorrow"], hint: "Future communication" }
        ];
        const hardList = [
            { audioText: "Adjusting the minute hand position is crucial", correct: "Adjusting the minute hand position is crucial", options: ["Setting the hour hand is important", "The clock needs new batteries", "Time is measured in seconds", "Winding the clock is necessary"], hint: "Clock precision" },
            { audioText: "The conference has been postponed until next month", correct: "The conference has been postponed until next month", options: ["The meeting is cancelled", "The event is rescheduled", "The workshop is moved forward", "The seminar is delayed"], hint: "Event later than planned" },
            { audioText: "Could you please turn down the volume?", correct: "Could you please turn down the volume", options: ["Please increase the volume", "Lower the sound please", "Mute the television", "Make it quieter"], hint: "Noise too high" },
            { audioText: "I am looking for a gift for my mother", correct: "I am looking for a gift for my mother", options: ["Shopping for a present", "I need a birthday card", "Where is the toy section", "Do you sell flowers"], hint: "Buying a present" },
            { audioText: "The train to London departs from platform nine", correct: "The train to London departs from platform nine", options: ["Platform for Paris", "Departure time changed", "Ticket required for boarding", "London train at gate nine"], hint: "Railway announcement" },
            { audioText: "After the rain stopped we saw a rainbow", correct: "After the rain stopped we saw a rainbow", options: ["Rainbow appeared after rain", "We saw colors in the sky", "The storm cleared quickly", "Sun came out after shower"], hint: "Colorful arc" },
            { audioText: "Could you explain the main idea again please", correct: "Could you explain the main idea again please", options: ["Repeat the concept", "Clarify the summary once more", "Please reiterate the point", "Say the key point again"], hint: "Request for repetition" },
            { audioText: "I have never visited such a beautiful place", correct: "I have never visited such a beautiful place", options: ["This place is the best", "Never seen this beauty", "Most beautiful location ever", "What a gorgeous spot"], hint: "Expressing amazement" },
            { audioText: "Make sure to save your work before closing", correct: "Make sure to save your work before closing", options: ["Don't forget to backup", "Save document then exit", "Preserve data prior to shut", "Store file before quitting"], hint: "Computer tip" },
            { audioText: "The recipe requires two cups of flour", correct: "The recipe requires two cups of flour", options: ["Need 500g of flour", "Add flour double cup", "Two cups flour needed", "Flour amount is two cups"], hint: "Baking ingredient" }
        ];
        if (level === 'easy') return easyList;
        if (level === 'medium') return mediumList;
        return hardList;
    }

    private createSingleQuestionPrompt(internalLevel: 'easy' | 'medium' | 'hard', index: number, randomSeed: number): string {
        const levelRules = {
            easy: "EASY: audioText is a short description (3-6 words). Correct answer is the single noun described. Example: 'it is fish, live in ocean' -> answer 'fish'.",
            medium: "MEDIUM: audioText is a short phrase (4-6 words). Correct answer is the exact same phrase. Example: 'I want to soup, it is hot' -> answer 'I want to soup'.",
            hard: "HARD: audioText is a complete sentence (5-8 words). Correct answer is the exact same sentence. Example: 'Adjusting the minute hand position is crucial' -> same."
        };
        const usedList = Array.from(this.usedAnswers).slice(-5).join(', ');
        return `You are an English language learning expert. Generate ONE listening question.
${levelRules[internalLevel]}
IMPORTANT: Do NOT repeat any of these recently used answers: ${usedList || 'none yet'}.
Be creative and diverse. Use different topics and vocabulary.
Return ONLY valid JSON, no markdown, no extra text:
{
    "audioText": "...",
    "options": [
        {"text": "CORRECT ANSWER", "correct": true},
        {"text": "distractor1", "correct": false},
        {"text": "distractor2", "correct": false},
        {"text": "distractor3", "correct": false}
    ],
    "hint": "short hint (max 10 words)"
}`;
    }

    private parseSingleQuestionResponse(response: string, internalLevel: 'easy' | 'medium' | 'hard', index: number): Question | null {
        try {
            const cleaned = this.cleanResponseText(response);
            const parsed = JSON.parse(cleaned);
            if (!parsed.audioText || !parsed.options || parsed.options.length !== 4) return null;
            const correctOpt = parsed.options.find((opt: any) => opt.correct === true);
            if (!correctOpt) return null;
            // 根据内部难度进行规则校验
            if (internalLevel === 'easy') {
                if (correctOpt.text.includes(' ') || correctOpt.text.length < 2) return null;
                if (parsed.audioText.split(' ').length < 2) return null;
            } else {
                if (correctOpt.text !== parsed.audioText) return null;
            }
            // 注意：这里返回的 Question.level 暂时设为 internalLevel，后续会在 generateSingleQuestion 中覆盖为外部级别
            return {
                id: `${internalLevel}-${index + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                audioText: parsed.audioText,
                options: parsed.options.map((opt: any, i: number) => ({
                    id: `${internalLevel}-${index}-opt-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    text: opt.text,
                    correct: opt.correct === true
                })),
                hint: parsed.hint || 'Listen carefully!',
                level: internalLevel  // 临时值，外部会覆盖
            };
        } catch (e) {
            console.error('Parse error:', e);
            return null;
        }
    }
}

export default new AIService();