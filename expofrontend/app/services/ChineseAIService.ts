// app/services/ChineseAIService.ts

import { Config } from '../config';

export type ChineseQuestion = {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number; // 0-based index
    explanation?: string;
    pinyin?: string;
};

export type ChineseQuestionRequest = {
    difficulty: 'beginner' | 'advanced'; // 只有 beginner 和 advanced
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
        if (!this.enabled) {
            return this.getDefaultQuestions(request.difficulty);
        }

        try {
            const prompt = this.createQuestionPrompt({
                ...request,
                count: 15
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

            if (uniqueQuestions.length < 8) {
                console.log('Not enough unique questions, adding defaults');
                const defaults = this.getDefaultQuestions(request.difficulty);
                return [...uniqueQuestions, ...defaults].slice(0, 8);
            }

            const shuffled = uniqueQuestions.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 8);

            return selected.map((q, index) => ({
                ...q,
                id: index + 1
            }));

        } catch (error) {
            console.error('Failed to generate questions:', error);
            return this.getDefaultQuestions(request.difficulty);
        }
    }

    private createQuestionPrompt(request: ChineseQuestionRequest): string {
        const count = request.count || 15;
        const topic = request.topic || 'daily life, greetings, family, food, animals, colors, numbers, occupations';

        // Beginner: 題目是中文，答案是英文
        // Advanced: 題目是英文，答案是中文
        const difficultyGuidelines = {
            beginner: `
FORMAT: Questions in CHINESE, Options in ENGLISH
- Question: Ask about the meaning of a Chinese word/phrase
- Options: All options must be in ENGLISH
- Example: "What does "爸爸"  mean in English?"   //"..."must be Chinese!!!!!
- Options: ["Father", "Mother", "Brother", "Sister"]
- Focus on basic vocabulary (HSK 1-3)`,

            advanced: `
FORMAT: Questions in ENGLISH, Options in CHINESE
- Question: Ask for the Chinese translation of an English word/phrase
- Options: All options must be in CHINESE characters
- Example: "What is the Chinese word for 'father'?"
- Options: ["爸爸", "妈妈", "哥哥", "姐姐"]
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
5. Include pinyin for the correct answer
6. NEVER include the answer in the question itself
7. Make every question unique and creative

Format your response as a JSON array with EXACTLY ${count} objects:
[
    {
        "question": "${request.difficulty === 'beginner' ? 'Chinese question (e.g., "What does 爸爸 mean?")' : 'English question (e.g., "What is the Chinese word for father?")'}",
        "options": ["${request.difficulty === 'beginner' ? 'English option 1' : 'Chinese option 1'}", "${request.difficulty === 'beginner' ? 'English option 2' : 'Chinese option 2'}", "${request.difficulty === 'beginner' ? 'English option 3' : 'Chinese option 3'}", "${request.difficulty === 'beginner' ? 'English option 4' : 'Chinese option 4'}"],
        "correctAnswer": 0,
        "explanation": "English explanation why this is correct",
        "pinyin": "pinyin for the correct answer"
    }
]

// EXAMPLES for BEGINNER level (題目中文，選項英文): "..."must be Chinese
// [
//     {
//         "question": "What does "爸爸"  mean?",
//         "options": ["Father", "Mother", "Brother", "Sister"],
//         "correctAnswer": 0,
//         "explanation": "爸爸 (bàba) means father in Chinese.",
//         "pinyin": "bàba"
//     },
//     {
//         "question": "What does "老师"  mean?",
//         "options": ["Teacher", "Doctor", "Student", "Lawyer"],
//         "correctAnswer": 0,
//         "explanation": "老师 (lǎoshī) means teacher.",
//         "pinyin": "lǎoshī"
//     }
// ]
//
// EXAMPLES for ADVANCED level (題目英文，選項中文):
// [
//     {
//         "question": "What is the Chinese word for 'father'?",
//         "options": ["爸爸", "妈妈", "哥哥", "姐姐"],
//         "correctAnswer": 0,
//         "explanation": "爸爸 (bàba) means father.",
//         "pinyin": "bàba"
//     },
//     {
//         "question": "How do you say 'teacher' in Chinese?",
//         "options": ["老师", "医生", "学生", "律师"],
//         "correctAnswer": 0,
//         "explanation": "老师 (lǎoshī) means teacher.",
//         "pinyin": "lǎoshī"
//     },
//     {
//         "question": "What is the Chinese word for 'delicious'?",
//         "options": ["好吃", "好看", "好听", "好玩"],
//         "correctAnswer": 0,
//         "explanation": "好吃 (hǎochī) means delicious.",
//         "pinyin": "hǎochī"
//     }
// ]

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
                pinyin: q.pinyin || ''
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
                question: "What does 爸爸 (bàba) mean?",
                options: ["Father", "Mother", "Brother", "Sister"],
                correctAnswer: 0,
                explanation: "爸爸 (bàba) means father in Chinese.",
                pinyin: "bàba"
            },
            {
                id: 2,
                question: "What does 妈妈 (māma) mean?",
                options: ["Mother", "Father", "Grandma", "Aunt"],
                correctAnswer: 0,
                explanation: "妈妈 (māma) means mother.",
                pinyin: "māma"
            },
            {
                id: 3,
                question: "What does 老师 (lǎoshī) mean?",
                options: ["Teacher", "Doctor", "Student", "Lawyer"],
                correctAnswer: 0,
                explanation: "老师 (lǎoshī) means teacher.",
                pinyin: "lǎoshī"
            },
            {
                id: 4,
                question: "What does 你好 (nǐ hǎo) mean?",
                options: ["Hello", "Goodbye", "Thank you", "Sorry"],
                correctAnswer: 0,
                explanation: "你好 (nǐ hǎo) is the standard greeting meaning 'hello'.",
                pinyin: "nǐ hǎo"
            },
            {
                id: 5,
                question: "What does 苹果 (píngguǒ) mean?",
                options: ["Apple", "Banana", "Orange", "Strawberry"],
                correctAnswer: 0,
                explanation: "苹果 (píngguǒ) means apple.",
                pinyin: "píngguǒ"
            },
            {
                id: 6,
                question: "What does 蓝色 (lán sè) mean?",
                options: ["Blue", "Red", "Green", "Yellow"],
                correctAnswer: 0,
                explanation: "蓝色 (lán sè) means blue.",
                pinyin: "lán sè"
            },
            {
                id: 7,
                question: "What does 谢谢 (xièxie) mean?",
                options: ["Thank you", "You're welcome", "Sorry", "Please"],
                correctAnswer: 0,
                explanation: "谢谢 (xièxie) means thank you.",
                pinyin: "xièxie"
            },
            {
                id: 8,
                question: "What does 水 (shuǐ) mean?",
                options: ["Water", "Fire", "Earth", "Air"],
                correctAnswer: 0,
                explanation: "水 (shuǐ) means water.",
                pinyin: "shuǐ"
            }
        ];

        const advancedQuestions: ChineseQuestion[] = [
            {
                id: 1,
                question: "What is the Chinese word for 'father'?",
                options: ["爸爸", "妈妈", "哥哥", "弟弟"],
                correctAnswer: 0,
                explanation: "爸爸 (bàba) means father.",
                pinyin: "bàba"
            },
            {
                id: 2,
                question: "How do you say 'teacher' in Chinese?",
                options: ["老师", "医生", "律师", "工程师"],
                correctAnswer: 0,
                explanation: "老师 (lǎoshī) means teacher.",
                pinyin: "lǎoshī"
            },
            {
                id: 3,
                question: "What is the Chinese word for 'delicious'?",
                options: ["好吃", "好看", "好听", "好玩"],
                correctAnswer: 0,
                explanation: "好吃 (hǎochī) means delicious.",
                pinyin: "hǎochī"
            },
            {
                id: 4,
                question: "How do you say 'I love you' in Chinese?",
                options: ["我爱你", "我喜欢你", "我恨你", "我想你"],
                correctAnswer: 0,
                explanation: "我爱你 (wǒ ài nǐ) means I love you.",
                pinyin: "wǒ ài nǐ"
            },
            {
                id: 5,
                question: "What is the Chinese word for 'yesterday'?",
                options: ["昨天", "今天", "明天", "后天"],
                correctAnswer: 0,
                explanation: "昨天 (zuótiān) means yesterday.",
                pinyin: "zuótiān"
            },
            {
                id: 6,
                question: "How do you say 'expensive' in Chinese?",
                options: ["贵", "便宜", "多", "少"],
                correctAnswer: 0,
                explanation: "贵 (guì) means expensive.",
                pinyin: "guì"
            },
            {
                id: 7,
                question: "What is the Chinese word for 'tired'?",
                options: ["累", "高兴", "难过", "兴奋"],
                correctAnswer: 0,
                explanation: "累 (lèi) means tired.",
                pinyin: "lèi"
            },
            {
                id: 8,
                question: "How do you say 'water' in Chinese?",
                options: ["水", "火", "土", "木"],
                correctAnswer: 0,
                explanation: "水 (shuǐ) means water.",
                pinyin: "shuǐ"
            }
        ];

        return difficulty === 'beginner' ? beginnerQuestions : advancedQuestions;
    }
}

export default new ChineseAIService();