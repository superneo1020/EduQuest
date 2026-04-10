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
    alternatives?: string[]; // 可能的替代答案
    explanation?: string; // 該詞語的解釋
};

export type ChineseSentenceCheckRequest = {
    sentence: string;
    userAnswer: string;
    correctAnswer: string;
    alternatives?: string[]; // 可能的替代答案
    context?: string; // 句子上下文
};

export type ChineseSentenceCheckResponse = {
    isCorrect: boolean;
    score: number; // 0-100 分
    feedback: string;
    detailedFeedback: {
        grammar: string; // 語法評價
        vocabulary: string; // 詞彙評價
        suggestion: string; // 改進建議
    };
    correctAnswer: string;
    examples?: string[]; // 相關例句
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
            // 簡單的比對邏輯
            const isCorrect = this.simpleCheck(request.userAnswer, request.correctAnswer, request.alternatives);
            return {
                isCorrect,
                score: isCorrect ? 100 : 0,
                feedback: isCorrect ? "正確！" : `不對，正確答案是：${request.correctAnswer}`,
                detailedFeedback: {
                    grammar: isCorrect ? "語法正確" : "答案不正確",
                    vocabulary: isCorrect ? "詞彙使用恰當" : "詞彙選擇有誤",
                    suggestion: isCorrect ? "繼續保持" : "建議多練習這個詞彙"
                },
                correctAnswer: request.correctAnswer,
                examples: isCorrect ? [] : [`正確用法：${request.sentence.replace('__', request.correctAnswer)}`]
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
            // 如果 AI 檢查失敗，使用簡單的字符串比對
            const isCorrect = this.simpleCheck(request.userAnswer, request.correctAnswer, request.alternatives);
            return {
                isCorrect,
                score: isCorrect ? 100 : 0,
                feedback: isCorrect ? "正確！" : `不對，正確答案是：${request.correctAnswer}`,
                detailedFeedback: {
                    grammar: "無法評估",
                    vocabulary: "無法評估",
                    suggestion: isCorrect ? "繼續加油" : "再試一次"
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

        // 根據難度設定不同的提示
        const difficultyPrompt = this.getDifficultyPrompt(difficulty);

        const previousContext = request.previousAnswers && request.previousAnswers.length > 0
            ? `之前的題目和表現：\n${request.previousAnswers.map(a =>
                `- 句子：${a.sentence}，答案：${a.correctAnswer}，用戶${a.isCorrect ? '答對' : '答錯'}，反饋：${a.feedback || '無'}`
            ).join('\n')}`
            : '這是第一題。';

        return `你是一個專業的中文老師。請生成一個適合中文學習者的填空句子。

重要規則：
- 填空部分只能有 "一個" 空位，用 "__" 表示（兩個底線）
- 絕對不能生成兩個或多個空位的句子
- 句子中只能出現一次 "__"
- 請生成內容快點

${difficultyPrompt}
這是第 ${request.currentQuestionIndex + 1} 題，總共 4 題
句子要自然、實用、有教育意義
答案應該是常用詞彙，但要有一定的挑戰性

${previousContext}

請以JSON格式回覆：
{
    "sentence": "完整的句子，只能用一個__表示填空",
    "correctAnswer": "正確答案",
    "alternatives": ["替代答案1", "替代答案2"],
    "hint": "簡短提示（最多10個字）",
    "translation": "英文翻譯",
    "explanation": "這個詞語的簡單解釋"
}

只返回JSON，不要有其他文字。`;
    }

    private getDifficultyPrompt(difficulty: string): string {
        switch (difficulty) {
            case 'easy':
                return `難度：初級（簡單）
要求：
- 使用最基礎的詞彙（如：好、大、小、多、少、去、來、吃、喝、看、聽等）
- 句子結構簡單，主謂賓或主謂結構
- 答案通常是單字詞或雙字詞
- 適合初學者練習
- 例句格式："今天天氣很__。" 只有一個空位`;

            case 'medium':
                return `難度：中級（中等）
重要規則：
1. 填空處（__）只能代表「名詞、動詞、形容詞」這三類實詞，絕對不能代表副詞、程度副詞（如「很、非常、終於、突然、也、都」）或補語（如「得很快」）。
2. 填空處必須是句子的「核心成分」，例如：
   - 動詞：主語 + __ + 賓語（例：他 __ 一本書 → 正確答案：買、看、找到）
   - 名詞：主語 + 是 + __（例：他是我的 __ → 正確答案：哥哥、朋友）
   - 形容詞：主語 + 很 + __（例：今天天氣很 __ → 正確答案：好、熱）
3. 絕對禁止的填空範例（太難）：
   - 他 __ 找到一本書（ 需要填副詞，想）
   - 他跑得 __（ 需要填補語，很快）
   - 他 __ 喜歡吃蘋果（ 需要填「很、非常」，）
4. 句子結構應簡單明瞭，填空後不改變句子基本語法。
5. 可選句型：敘事句（主+動+賓）、有無句（主+有+賓）、表態句（主+形）、判斷句（主+是+賓）。

請從以下正例中隨機參考：
- 昨晚，小明在書店__ 一本新書。
- 媽媽在廚房__ 早餐。
- 他__ 一個妹妹。
- 這朵花顏色很 __。
- 那位先生是我的 __。

只輸出 JSON，不要解釋。`;
        }
    }

    private createCheckPrompt(request: ChineseSentenceCheckRequest): string {
        const alternatives = request.alternatives ?
            `可接受的替代答案：${request.alternatives.join('、')}` : '';

        return `你是一個親切、鼓勵學生的中文老師。請評估學生的答案，標準要「寬鬆、實用、鼓勵學習」。

句子：${request.sentence}
參考答案：${request.correctAnswer}
${alternatives}
學生答案：${request.userAnswer}

評估原則（請嚴格遵守）：
1. 如果學生答案在語義上合理、符合句子情境（即使不是參考答案），應視為「部分正確」或「可接受」，給予 60-85 分。
2. 如果學生答案與參考答案意思相近、是同義詞、常見變體（如「好食」對應「好吃」），應視為正確，給予 85-100 分。
3. 如果學生答案明顯不合理或語法嚴重錯誤，才給低分（0-50 分）。
4. 反饋必須正面、鼓勵，先肯定學生的嘗試，再溫和提供建議。
5. 對於詞彙選擇，允許口語、方言或輕微錯別字，只要不影響理解。
重要規則：
- 填空部分只能有 "一個" 空位，用 "__" 表示（兩個底線）
- 絕對不能生成兩個或多個空位的句子
- 句子中只能出現一次 "__"
- **填空處的答案不能與句子中已有的任何詞語相同**（例如：不能寫「他很喜歡__學習」然後答案是「喜歡」）

請以JSON回覆：
{
    "isCorrect": true/false,
    "score": 0-100,
    "feedback": "簡短正面回饋（最多15字）",
    "detailedFeedback": {
        "grammar": "語法評價（寬容）",
        "vocabulary": "詞彙評價（接受合理表達）",
        "suggestion": "溫和建議（若需要，否則給正面鼓勵）"
    },
    "correctAnswer": "${request.correctAnswer}",
    "examples": ["相關例句1", "相關例句2"]
}

只返回JSON，不要有其他文字。`;
    }

    private parseSentenceResponse(response: string, index: number, difficulty?: string): ChineseSentenceResponse {
        try {
            let cleanedResponse = response.trim();

            // 移除 markdown 程式碼塊
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.substring(7);
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.substring(3);
            }
            if (cleanedResponse.endsWith('```')) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
            }

            const parsed = JSON.parse(cleanedResponse.trim());

            // 確保句子只有一個空位
            let sentence = parsed.sentence || this.getDefaultSentence(index, difficulty).sentence;
            const underscoreCount = (sentence.match(/__/g) || []).length;

            // 如果有多個空位，使用默認句子
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
                feedback: parsed.feedback || (parsed.isCorrect ? "正確！" : "再試試看"),
                detailedFeedback: {
                    grammar: parsed.detailedFeedback?.grammar || "無法評估",
                    vocabulary: parsed.detailedFeedback?.vocabulary || "無法評估",
                    suggestion: parsed.detailedFeedback?.suggestion || (parsed.isCorrect ? "繼續保持" : "再試一次")
                },
                correctAnswer: request.correctAnswer,
                examples: parsed.examples || []
            };
        } catch (error) {
            console.error('Failed to parse check response:', error);

            // 使用簡單比對作為備用
            const isCorrect = this.simpleCheck(request.userAnswer, request.correctAnswer, request.alternatives);
            return {
                isCorrect,
                score: isCorrect ? 100 : 0,
                feedback: isCorrect ? "正確！" : `不對，正確答案是：${request.correctAnswer}`,
                detailedFeedback: {
                    grammar: "無法評估",
                    vocabulary: "無法評估",
                    suggestion: isCorrect ? "繼續加油" : "再試一次"
                },
                correctAnswer: request.correctAnswer
            };
        }
    }

    // 修改：默認句子數量改為 4 題
    private getDefaultSentence(index: number, difficulty?: string): ChineseSentenceResponse {
        // 根據難度分類的默認句子（全部只有一個空位）
        const easySentences = [
            {
                sentence: "今天天氣很__。",
                correctAnswer: "好",
                alternatives: ["不錯", "晴朗"],
                hint: "weather (good)",
                translation: "The weather is good today.",
                explanation: "形容天氣狀況的形容詞"
            },
            {
                sentence: "我__喜歡吃蘋果。",
                correctAnswer: "很",
                alternatives: ["非常", "特別"],
                hint: "very",
                translation: "I really like eating apples.",
                explanation: "表示程度的副詞"
            },
            {
                sentence: "他__一本書。",
                correctAnswer: "有",
                alternatives: ["拿著", "帶著"],
                hint: "have",
                translation: "He has a book.",
                explanation: "表示擁有的動詞"
            },
            {
                sentence: "我們一起去__吧。",
                correctAnswer: "吃飯",
                alternatives: ["用餐", "喫飯"],
                hint: "eat",
                translation: "Let's go eat together.",
                explanation: "表示進食的動詞"
            }
        ];

        const mediumSentences = [
            {
                sentence: "他因為努力，終於__了成功。",
                correctAnswer: "獲得",
                alternatives: ["得到", "取得"],
                hint: "obtain",
                translation: "Because of his hard work, he finally achieved success.",
                explanation: "表示得到某種結果"
            },
            {
                sentence: "我們應該__環境保護的重要性。",
                correctAnswer: "重視",
                alternatives: ["關注", "注意"],
                hint: "value",
                translation: "We should value the importance of environmental protection.",
                explanation: "表示認為重要"
            },
            {
                sentence: "這個問題很__，需要仔細思考。",
                correctAnswer: "複雜",
                alternatives: ["困難", "麻煩"],
                hint: "complex",
                translation: "This problem is very complex and requires careful thought.",
                explanation: "形容事情不簡單"
            },
            {
                sentence: "他的演講__了全場觀眾。",
                correctAnswer: "感動",
                alternatives: ["打動", "感染"],
                hint: "touch",
                translation: "His speech touched all the audience.",
                explanation: "使人心有共鳴"
            }
        ];

        // 根據難度選擇默認句子集
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