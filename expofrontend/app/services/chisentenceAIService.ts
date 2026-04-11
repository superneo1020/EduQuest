// app/services/chisentenceAIService.ts
import { Config } from '../config';

export type ChineseSentenceRequest = {
    previousAnswers?: {
        sentence: string;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        feedback?: string;
    }[];
    currentQuestionIndex: number;
    difficulty?: string; // 'easy', 'medium'
};

export type ChineseSentenceResponse = {
    sentence: string;
    correctAnswer: string;
    hint?: string;
    translation?: string;
    alternatives?: string[];
    explanation?: string;
};

export type ChineseSentenceCheckRequest = {
    sentence: string;
    userAnswer: string;
    correctAnswer: string;
    alternatives?: string[];
    context?: string;
};

export type ChineseSentenceCheckResponse = {
    isCorrect: boolean;
    score: number;
    feedback: string;
    detailedFeedback: {
        grammar: string;
        vocabulary: string;
        suggestion: string;
    };
    correctAnswer: string;
    examples?: string[];
};

class ChineseSentenceAIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;

    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = Config.AI_MODEL_NAME || 'gemma';
        this.enabled = Config.AI_ENABLED !== false;
    }

    async generateSentence(request: ChineseSentenceRequest): Promise<ChineseSentenceResponse> {
        if (!this.enabled) {
            return this.getDefaultSentence(request.currentQuestionIndex, request.difficulty);
        }

        try {
            const prompt = this.createSentencePrompt(request);

            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt
                }),
            });

            if (!response.ok) {
                throw new Error(`AI service error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponseText = data.response || data.choices?.[0]?.message?.content;

            if (!aiResponseText) {
                throw new Error('AI response format incorrect');
            }

            return this.parseSentenceResponse(aiResponseText, request.currentQuestionIndex, request.difficulty);

        } catch (error) {
            console.error('Failed to generate sentence:', error);
            return this.getDefaultSentence(request.currentQuestionIndex, request.difficulty);
        }
    }

    async checkAnswer(request: ChineseSentenceCheckRequest): Promise<ChineseSentenceCheckResponse> {
        if (!this.enabled) {
            const isCorrect = this.simpleCheck(request.userAnswer, request.correctAnswer, request.alternatives);
            return {
                isCorrect,
                score: isCorrect ? 100 : 0,
                feedback: isCorrect ? "正确！" : `不对，正确答案是：${request.correctAnswer}`,
                detailedFeedback: {
                    grammar: isCorrect ? "语法正确" : "答案不正确",
                    vocabulary: isCorrect ? "词汇使用恰当" : "词汇选择有误",
                    suggestion: isCorrect ? "继续保持" : "建议多练习这个词汇"
                },
                correctAnswer: request.correctAnswer,
                examples: isCorrect ? [] : [`正确用法：${request.sentence.replace('__', request.correctAnswer)}`]
            };
        }

        try {
            const prompt = this.createCheckPrompt(request);

            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`AI service error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponseText = data.response || data.choices?.[0]?.message?.content;

            if (!aiResponseText) {
                throw new Error('AI response format incorrect');
            }

            return this.parseCheckResponse(aiResponseText, request);

        } catch (error) {
            console.error('Failed to check answer:', error);
            const isCorrect = this.simpleCheck(request.userAnswer, request.correctAnswer, request.alternatives);
            return {
                isCorrect,
                score: isCorrect ? 100 : 0,
                feedback: isCorrect ? "正确！" : `不对，正确答案是：${request.correctAnswer}`,
                detailedFeedback: {
                    grammar: "无法评估",
                    vocabulary: "无法评估",
                    suggestion: isCorrect ? "继续加油" : "再试一次"
                },
                correctAnswer: request.correctAnswer
            };
        }
    }

    private simpleCheck(userAnswer: string, correctAnswer: string, alternatives?: string[]): boolean {
        const normalizedUser = userAnswer.trim().toLowerCase();
        const normalizedCorrect = correctAnswer.trim().toLowerCase();

        if (normalizedUser === normalizedCorrect) return true;

        if (alternatives) {
            return alternatives.some(alt => alt.trim().toLowerCase() === normalizedUser);
        }

        return false;
    }

    private createSentencePrompt(request: ChineseSentenceRequest): string {
        const difficulty = request.difficulty || 'medium';

        const difficultyPrompt = this.getDifficultyPrompt(difficulty);

        const previousContext = request.previousAnswers && request.previousAnswers.length > 0
            ? `之前的题目和表现：\n${request.previousAnswers.map(a =>
                `- 句子：${a.sentence}，答案：${a.correctAnswer}，用户${a.isCorrect ? '答对' : '答错'}，反馈：${a.feedback || '无'}`
            ).join('\n')}`
            : '这是第一题。';

        return `你是一个专业的中文老师。请生成一个适合中文学习者的填空句子。

重要规则：
- 填空部分只能有 "一个" 空位，用 "__" 表示（两个底线）
- 绝对不能生成两个或多个空位的句子
- 句子中只能出现一次 "__"
- 请生成内容快点

${difficultyPrompt}
这是第 ${request.currentQuestionIndex + 1} 题，总共 3 题
句子要自然、实用、有教育意义
答案应该是常用词汇，但要有一定的挑战性

${previousContext}

请以JSON格式回复：
{
    "sentence": "完整的句子，只能用一個__表示填空",
    "correctAnswer": "正确答案",
    "alternatives": ["替代答案1", "替代答案2"],
    "hint": "简短提示（最多10个字）",
    "translation": "英文翻译",
    "explanation": "这个词语的简单解释"
}

只返回JSON，不要有其他文字。`;
    }

    private getDifficultyPrompt(difficulty: string): string {
        switch (difficulty) {
            case 'easy':
                return `难度：初级（简单）
要求：
- 使用最基础的词汇（如：好、大、小、多、少、去、来、吃、喝、看、听等）
- 句子结构简单，主谓宾或主谓结构
- 答案通常是单字词或双字词
- 适合初学者练习
- 例句格式："今天天气很__。" 只有一个空位`;

            case 'medium':
                return `难度：中级（中等）
重要规则：
1. 填空处（__）只能代表「名词、动词、形容词」这三类实词，绝对不能代表副词、程度副词（如「很、非常、终于、突然、也、都」）或补语（如「得很快」）。
2. 填空处必须是句子的「核心成分」，例如：
   - 动词：主语 + __ + 宾语（例：他 __ 一本书 → 正确答案：买、看、找到）
   - 名词：主语 + 是 + __（例：他是我的 __ → 正确答案：哥哥、朋友）
   - 形容词：主语 + 很 + __（例：今天天气很 __ → 正确答案：好、热）
3. 绝对禁止的填空范例（太难）：
   - 他 __ 找到一本书（ 需要填副词，想）
   - 他跑得 __（ 需要填补语，很快）
   - 他 __ 喜欢吃苹果（ 需要填「很、非常」，）
4. 句子结构应简单明了，填空后不改变句子基本语法。
5. 可选句型：叙事句（主+动+宾）、有无句（主+有+宾）、表态句（主+形）、判断句（主+是+宾）。

请从以下正例中随机参考：
- 昨晚，小明在书店__ 一本新书。
- 妈妈在厨房__ 早餐。
- 他__ 一个妹妹。
- 这朵花颜色很 __。
- 那位先生是我的 __。

只输出 JSON，不要解释。`;
        }
    }

    private createCheckPrompt(request: ChineseSentenceCheckRequest): string {
        const alternatives = request.alternatives ?
            `可接受的替代答案：${request.alternatives.join('、')}` : '';

        return `你是一个亲切、鼓励学生的中文老师。请评估学生的答案，标准要「宽松、实用、鼓励学习」。

句子：${request.sentence}
参考答案：${request.correctAnswer}
${alternatives}
学生答案：${request.userAnswer}

评估原则（请严格遵守）：
1. 如果学生答案在语义上合理、符合句子情境（即使不是参考答案），应视为「部分正确」或「可接受」，给予 60-85 分。
2. 如果学生答案与参考答案意思相近、是同义词、常见变体（如「好食」对应「好吃」），应视为正确，给予 85-100 分。
3. 如果学生答案明显不合理或语法严重错误，才给低分（0-50 分）。
4. 反馈必须正面、鼓励，先肯定学生的尝试，再温和提供建议。
5. 对于词汇选择，允许口语、方言或轻微错别字，只要不影响理解。
重要规则：
- 填空部分只能有 "一个" 空位，用 "__" 表示（两个底线）
- 绝对不能生成两个或多个空位的句子
- 句子中只能出现一次 "__"
- **填空处的答案不能与句子中已有的任何词语相同**（例如：不能写「他很喜欢__学习」然后答案是「喜欢」）

请以JSON回复：
{
    "isCorrect": true/false,
    "score": 0-100,
    "feedback": "简短正面反馈（最多15字）",
    "detailedFeedback": {
        "grammar": "语法评价（宽容）",
        "vocabulary": "词汇评价（接受合理表达）",
        "suggestion": "温和建议（若需要，否则给正面鼓励）"
    },
    "correctAnswer": "${request.correctAnswer}",
    "examples": ["相关例句1", "相关例句2"]
}

只返回JSON，不要有其他文字。`;
    }

    private parseSentenceResponse(response: string, index: number, difficulty?: string): ChineseSentenceResponse {
        try {
            let cleanedResponse = response.trim();

            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.substring(7);
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.substring(3);
            }
            if (cleanedResponse.endsWith('```')) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
            }

            const parsed = JSON.parse(cleanedResponse.trim());

            let sentence = parsed.sentence || this.getDefaultSentence(index, difficulty).sentence;
            const underscoreCount = (sentence.match(/__/g) || []).length;

            if (underscoreCount !== 1) {
                console.warn('Generated sentence has multiple blanks, using default');
                sentence = this.getDefaultSentence(index, difficulty).sentence;
            }

            return {
                sentence: sentence,
                correctAnswer: parsed.correctAnswer || this.getDefaultSentence(index, difficulty).correctAnswer,
                hint: parsed.hint || '',
                translation: parsed.translation || '',
                alternatives: parsed.alternatives || [],
                explanation: parsed.explanation || ''
            };
        } catch (error) {
            console.error('Failed to parse sentence response:', error);
            return this.getDefaultSentence(index, difficulty);
        }
    }

    private parseCheckResponse(response: string, request: ChineseSentenceCheckRequest): ChineseSentenceCheckResponse {
        try {
            let cleanedResponse = response.trim();

            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.substring(7);
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.substring(3);
            }
            if (cleanedResponse.endsWith('```')) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
            }

            const parsed = JSON.parse(cleanedResponse.trim());

            return {
                isCorrect: parsed.isCorrect || false,
                score: parsed.score || 0,
                feedback: parsed.feedback || (parsed.isCorrect ? "正确！" : "再试试看"),
                detailedFeedback: {
                    grammar: parsed.detailedFeedback?.grammar || "无法评估",
                    vocabulary: parsed.detailedFeedback?.vocabulary || "无法评估",
                    suggestion: parsed.detailedFeedback?.suggestion || (parsed.isCorrect ? "继续保持" : "再试一次")
                },
                correctAnswer: request.correctAnswer,
                examples: parsed.examples || []
            };
        } catch (error) {
            console.error('Failed to parse check response:', error);

            const isCorrect = this.simpleCheck(request.userAnswer, request.correctAnswer, request.alternatives);
            return {
                isCorrect,
                score: isCorrect ? 100 : 0,
                feedback: isCorrect ? "正确！" : `不对，正确答案是：${request.correctAnswer}`,
                detailedFeedback: {
                    grammar: "无法评估",
                    vocabulary: "无法评估",
                    suggestion: isCorrect ? "继续加油" : "再试一次"
                },
                correctAnswer: request.correctAnswer
            };
        }
    }

    // 修改：默认句子数量改为 3 题
    private getDefaultSentence(index: number, difficulty?: string): ChineseSentenceResponse {
        const easySentences = [
            {
                sentence: "今天天气很__。",
                correctAnswer: "好",
                alternatives: ["不错", "晴朗"],
                hint: "weather (good)",
                translation: "The weather is good today.",
                explanation: "形容天气状况的形容词"
            },
            {
                sentence: "我__喜欢吃苹果。",
                correctAnswer: "很",
                alternatives: ["非常", "特别"],
                hint: "very",
                translation: "I really like eating apples.",
                explanation: "表示程度的副词"
            },
            {
                sentence: "他__一本书。",
                correctAnswer: "有",
                alternatives: ["拿着", "带着"],
                hint: "have",
                translation: "He has a book.",
                explanation: "表示拥有的动词"
            }
        ];

        const mediumSentences = [
            {
                sentence: "他因为努力，终于__了成功。",
                correctAnswer: "获得",
                alternatives: ["得到", "取得"],
                hint: "obtain",
                translation: "Because of his hard work, he finally achieved success.",
                explanation: "表示得到某种结果"
            },
            {
                sentence: "我们应该__环境保护的重要性。",
                correctAnswer: "重视",
                alternatives: ["关注", "注意"],
                hint: "value",
                translation: "We should value the importance of environmental protection.",
                explanation: "表示认为重要"
            },
            {
                sentence: "这个问题很__，需要仔细思考。",
                correctAnswer: "复杂",
                alternatives: ["困难", "麻烦"],
                hint: "complex",
                translation: "This problem is very complex and requires careful thought.",
                explanation: "形容事情不简单"
            }
        ];

        let sentences;
        if (difficulty === 'easy') {
            sentences = easySentences;
        } else {
            sentences = mediumSentences;
        }

        return sentences[index] || sentences[0];
    }
}

export default new ChineseSentenceAIService();