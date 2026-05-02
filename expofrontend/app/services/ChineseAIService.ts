// app/services/ChineseAIService.ts

import { Config } from '../config';

export type ChineseQuestion = {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number; // 0-based index
    explanation?: string;
};

export type ChineseQuestionRequest = {
    difficulty: 'beginner' | 'advanced';
    topic?: string;
    count?: number;
};

class ChineseAIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;

    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = Config.AI_MODEL_NAME || 'gemma';
        this.enabled = Config.AI_ENABLED !== false;
    }

    async generateQuestions(request: ChineseQuestionRequest): Promise<ChineseQuestion[]> {
        const targetCount = request.count || 3; // 改為 3 題
        if (!this.enabled) {
            return this.getDefaultQuestions(request.difficulty).slice(0, targetCount);
        }

        try {
            const prompt = this.createQuestionPrompt({
                ...request,
                count: targetCount
            });

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

            const allQuestions = this.parseQuestions(aiResponseText, request.difficulty);
            const uniqueQuestions = this.deduplicateQuestions(allQuestions);

            if (uniqueQuestions.length < targetCount) {
                console.log('Not enough unique questions, adding defaults');
                const defaults = this.getDefaultQuestions(request.difficulty);
                const combined = [...uniqueQuestions, ...defaults];
                // 去重後取前 targetCount 題
                const final = this.deduplicateQuestions(combined).slice(0, targetCount);
                return final.map((q, index) => ({ ...q, id: index + 1 }));
            }

            const shuffled = uniqueQuestions.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, targetCount);

            return selected.map((q, index) => ({
                ...q,
                id: index + 1
            }));

        } catch (error) {
            console.error('Failed to generate questions:', error);
            return this.getDefaultQuestions(request.difficulty).slice(0, targetCount);
        }
    }

    private createQuestionPrompt(request: ChineseQuestionRequest): string {
        const count = request.count || 3;
        const topic = request.topic || 'daily life, greetings, family, food, animals, colors, numbers, occupations';

        const difficultyGuidelines = {
            beginner: `
FORMAT: Questions in CHINESE, Options in ENGLISH
- Question: Ask about the meaning of a Chinese word/phrase
- Options: All options must be in ENGLISH
- Example: "What does "爸爸"  mean in English?"   //"..."must be Chinese!!!!!
- Options: ["Father", "Mother", "Brother", "Sister"] //because "爸爸" means father,so "father is answer
- Focus on basic vocabulary (HSK 1-3)`,

            advanced: `
FORMAT: Questions in ENGLISH, Options in CHINESE
- Question: Ask for the Chinese translation of an English word/phrase
- Options: All options must be in CHINESE characters
- Example: "What is the Chinese word for 'father'?"   //sentence must be English!!!!!
- Options: ["爸爸", "妈妈", "哥哥", "姐姐"] //because father means "爸爸",so "爸爸" is answer
- Focus on intermediate vocabulary (HSK 4-6) and common phrases`
        };

        return `You are a professional Chinese language teacher. Create EXACTLY ${count} UNIQUE multiple-choice questions for ${request.difficulty} level learners.

${difficultyGuidelines[request.difficulty]}

Topics to cover: ${topic}

IMPORTANT RULES:
1. ${request.difficulty === 'beginner'
            ? 'Questions must be in CHINESE (with pinyin), options must be in ENGLISH'
            : 'Questions must be in ENGLISH, options must be in CHINESE characters'}
2. Each question must test a DIFFERENT vocabulary word or concept
3. ONE clear correct answer per question
4. Incorrect options should be plausible but wrong
5. NEVER include the answer in the question itself
6. Make every question unique and creative

Format your response as a JSON array with EXACTLY ${count} objects:
[
    {
        "question": "${request.difficulty === 'beginner' ? 'Chinese question (e.g., "What does 爸爸 mean?")' : 'English question (e.g., "What is the Chinese word for father?")'}",
        "options": ["${request.difficulty === 'beginner' ? 'English option 1' : 'Chinese option 1'}", "${request.difficulty === 'beginner' ? 'English option 2' : 'Chinese option 2'}", "${request.difficulty === 'beginner' ? 'English option 3' : 'Chinese option 3'}", "${request.difficulty === 'beginner' ? 'English option 4' : 'Chinese option 4'}"],
        "correctAnswer": 0,
        "explanation": "English explanation why this is correct"
    }
]

EXAMPLES for BEGINNER level (題目中文，選項英文): "..."must be Chinese
[
    {
       "question": "What does "校長" mean?",
        "options": ["Principal", "Teacher", "Student", "Parent"],
        "correctAnswer": 0,
        "explanation": "「校長」 refers to the head of a school.",
    },
    {
        "question": "What does "新鮮" mean?",
        "options": ["Fresh", "Delicious", "Expensive", "Old"],
        "correctAnswer": 0,
        "explanation": "「新鮮」 is often used for food (like fruit) or air.",
    }
]

EXAMPLES for ADVANCED level (題目英文，選項中文):
[
    {
        "question": "What is the Chinese word for 'father'?",
        "options": ["爸爸", "妈妈", "哥哥", "姐姐"],
        "correctAnswer": 0,
        "explanation": "爸爸 (bàba) means father."
    },
    {
        "question": "How do you say 'teacher' in Chinese?",
        "options": ["老师", "医生", "学生", "律师"],
        "correctAnswer": 0,
        "explanation": "老师 (lǎoshī) means teacher."
    },
    {
        "question": "What is the Chinese word for 'delicious'?",
        "options": ["好吃", "好看", "好听", "好玩"],
        "correctAnswer": 0,
        "explanation": "好吃  means delicious."
    }
]

Make sure ALL ${count} questions cover DIFFERENT topics and vocabulary words.
Return ONLY the JSON array, no other text.`;
    }

    private deduplicateQuestions(questions: ChineseQuestion[]): ChineseQuestion[] {
        const seen = new Set();
        const unique: ChineseQuestion[] = [];

        for (const q of questions) {
            const key = q.question.trim().toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(q);
            }
        }

        return unique;
    }

    private parseQuestions(response: string, difficulty: string): ChineseQuestion[] {
        try {
            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
            if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
            if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
            cleaned = cleaned.trim();

            const questions = JSON.parse(cleaned);

            return questions.map((q: any, index: number) => ({
                id: index + 1,
                question: q.question || '',
                options: Array.isArray(q.options) ? q.options : [],
                correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
                explanation: q.explanation || '',
            }));

        } catch (error) {
            console.error('Failed to parse questions:', error);
            return this.getDefaultQuestions(difficulty);
        }
    }

    private getDefaultQuestions(difficulty: string): ChineseQuestion[] {
        const beginnerQuestions: ChineseQuestion[] = [
            {
                id: 1,
                question: "已經 (yǐjīng) 的意思是什麼？",
                options: ["已經／已經發生", "還沒有／仍然", "可能／也許", "將要／即將"],
                correctAnswer: 0,
                explanation: "已經 表示某事在過去或之前已發生，意思是 'already'。",
            },
            {
                id: 2,
                question: "決定 (juédìng) 的意思是什麼？",
                options: ["決定；作出選擇", "建議；提議", "討論；商量", "拒絕；不接受"],
                correctAnswer: 0,
                explanation: "決定 表示做出選擇或判斷，意思是 'decide' 或 'decision'，為 HSK3 常用詞。",
            },
            {
                id: 3,
                question: "影響 (yǐngxiǎng) 的意思是什麼？",
                options: ["影響；對...有作用", "休息；放鬆", "改變；轉變", "修理；修補"],
                correctAnswer: 0,
                explanation: "影響 表示對人或事物產生作用或改變，意思是 'influence; affect'。",
            }
        ];

        const advancedQuestions: ChineseQuestion[] = [
            {
                id: 1,
                question: "在家庭關係中，「父親」的正式稱呼通常是什麼？",
                options: ["父親", "母親", "兄弟", "姊妹"],
                correctAnswer: 0,
                explanation: "「父親」是較為正式的書面語，對應口語中的「爸爸」。",
            },
            {
                id: 2,
                question: "下列哪一個詞彙常用於形容教書育人的專業人士？",
                options: ["教師", "醫師", "律師", "工程師"],
                correctAnswer: 0,
                explanation: "「教師」比「老師」更具職業色彩，常用於正式場合。",
            },
            {
                id: 3,
                question: "當你覺得食物味道極佳，除了「好吃」，還可以用哪個詞形容？",
                options: ["美味", "美觀", "美妙", "美感"],
                correctAnswer: 0,
                explanation: "「美味」常用於形容食物味道鮮美，層次高於「好吃」。",
            }
        ];

        return difficulty === 'beginner' ? beginnerQuestions : advancedQuestions;
    }
}

export default new ChineseAIService();