// app/services/DialoguAIService.ts
import { Platform } from 'react-native';

declare const __DEV__: boolean | undefined;

export type ConversationTurn = {
    role: 'user' | 'assistant';
    content: string;
    score?: number;
    feedback?: string;
    isCorrect?: boolean;
};

export type ConversationAnalysis = {
    totalScore: number;
    averageScore: number;
    feedback: string;
    suggestions: string[];
    strengths: string[];
    weakPoints: string[];
    correctCount: number;
    totalQuestions: number;
};

export type Topic = {
    id: string;
    name: string;
    icon: string;
    difficulty: 'easy' | 'hard';
    category: string;
    color: string;
};

export const TOPICS: Topic[] = [
    { id: 'sports', name: 'Sports', icon: '⚽', difficulty: 'easy', category: 'Daily Life', color: '#4CAF50' },
    { id: 'lunch', name: 'Lunch', icon: '🍕', difficulty: 'easy', category: 'Daily Life', color: '#4CAF50' },
    { id: 'commute', name: 'Commute', icon: '🚌', difficulty: 'easy', category: 'Daily Life', color: '#4CAF50' },
    { id: 'hobbies', name: 'Hobbies', icon: '🎨', difficulty: 'easy', category: 'Daily Life', color: '#4CAF50' },
    { id: 'selfIntro', name: 'Self Introduction', icon: '👋', difficulty: 'easy', category: 'Daily Life', color: '#4CAF50' },
    { id: 'interests', name: 'Interests', icon: '🎵', difficulty: 'easy', category: 'Daily Life', color: '#4CAF50' },
    { id: 'directions', name: 'Asking Directions', icon: '🗺️', difficulty: 'hard', category: 'Real World', color: '#F44336' },
    { id: 'travel', name: 'Travel', icon: '✈️', difficulty: 'hard', category: 'Real World', color: '#F44336' },
    { id: 'culture', name: 'Culture & Entertainment', icon: '🎭', difficulty: 'hard', category: 'Real World', color: '#F44336' },
    { id: 'help', name: 'Seeking Help', icon: '🆘', difficulty: 'hard', category: 'Real World', color: '#F44336' },
];

export type Question = {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    context: string;
    anyAnswerCorrect?: boolean;
};

class DialoguAIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;
    private consecutiveFailures: number = 0;
    private readonly MAX_FAILURES = 2;

    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = 'gemma4';
        this.enabled = true;
    }

    private getAdaptedURL(url: string): string {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            if ((url.includes('localhost') || url.includes('127.0.0.1')) && Platform.OS === 'android') {
                return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
            }
        }
        return url;
    }

    async generateQuestions(topic: Topic, count: number = 8): Promise<Question[]> {
        // 如果连续失败次数过多，直接使用 mock
        if (this.consecutiveFailures >= this.MAX_FAILURES) {
            console.warn('AI多次失败，降级使用mock题库');
            return this.mockQuestions(topic, count);
        }

        if (!this.enabled) {
            return this.mockQuestions(topic, count);
        }

        try {
            // 增强版 prompt，针对小模型优化：加入示例、明确输出格式、禁止额外解释
            const prompt = `You are a patient and caring English teacher, creating multiple-choice questions for children aged 8–12.
Topic: ${topic.name} (Difficulty: ${topic.difficulty}).
Please generate exactly ${count} questions.

Important rules:

-Each question must have exactly two options (A and B) – one completely correct, one clearly incorrect.

-The correctAnswer must match one of the two options exactly (including punctuation).

-The two options must be clearly different in meaning. Avoid pairs like "art" vs. "running" when asking "Which activity do you enjoy?" – both could be correct. Instead, ask something like "Which word means 'happy'?" with options "joyful" and "sad".

-Your tone should be warm and encouraging, as if talking naturally to kids in class.

-The options must be sentences.

-"What are your favorite hobbies in house?" "Let's think about things you enjoy learning about history." "Let's look at different types of sports by using your hands." Please provide more deeper details on these questions to ensure the user can select the correct answer.

-The explanation must be positive, and easy for a child to understand why the answer is right.

-Do not put "A:" or "B:" before the options or the correctAnswer. Output only a valid JSON array – no extra text before or after.

Example format (follow exactly):

json
[
  {
    "context": "Let's talk about sports!",
    "text": "What do you say to invite a friend to play soccer?",
    "options": ["Let's play soccer together!", "I don't like soccer."],
    "correctAnswer": "Let's play soccer together!",
    "explanation": "Inviting someone politely is friendly and fun."
  }
]
Make sure every question has a clearly right or clearly wrong answer – no "maybe yes, maybe no" situations.
Now generate ${count} questions for the topic: "${topic.name}". Output only the JSON array.`;

            const response = await fetch(`${this.getAdaptedURL(this.baseURL)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model: this.modelName, max_tokens: 2000, temperature: 0.7 }),
            });

            if (!response.ok) throw new Error('Failed to generate questions');
            const data = await response.json();
            const aiText = data.response || data.choices?.[0]?.message?.content || data.result;

            let questions = this.parseQuestionsRobust(aiText, topic);

            // 后处理：修正常见问题
            questions = questions.map(q => this.repairQuestion(q));
            questions = questions.map(q => this.normalizeQuestion(q));
            questions = questions.map(q => this.markAmbiguousQuestions(q));

            // 验证质量：如果大部分题目不合理，则降级
            const validCount = questions.filter(q =>
                q.options.length === 2 &&
                q.options[0] !== q.options[1] &&
                q.options.includes(q.correctAnswer) &&
                q.explanation.length > 5
            ).length;

            if (validCount < count * 0.6) {
                console.warn(`AI生成质量过低 (${validCount}/${count} 有效)，使用mock`);
                this.consecutiveFailures++;
                return this.mockQuestions(topic, count);
            }

            this.consecutiveFailures = 0;
            return questions.slice(0, count);
        } catch (error) {
            console.error('AI question generation failed:', error);
            this.consecutiveFailures++;
            return this.mockQuestions(topic, count);
        }
    }

    // 鲁棒解析：从杂乱的AI输出中提取JSON数组
    private parseQuestionsRobust(raw: string, topic: Topic): Question[] {
        try {
            // 尝试提取第一个 [ ... ] 数组
            let jsonStr = raw.trim();
            const arrayMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }
            // 移除 markdown 代码块标记
            jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((q, idx) => ({
                    id: idx,
                    text: this.cleanString(q.text || q.question || `Question ${idx + 1}`),
                    options: this.cleanOptions(q.options),
                    correctAnswer: this.cleanString(q.correctAnswer || ''),
                    explanation: this.cleanString(q.explanation || 'Good job!'),
                    context: this.cleanString(q.context || `Let's practice ${topic.name}!`),
                    anyAnswerCorrect: false
                }));
            }
        } catch (e) {
            console.error('JSON parse failed, raw:', raw.substring(0, 200));
        }
        return this.mockQuestions(topic, 8);
    }

    private cleanString(s: string): string {
        return s.replace(/^[A-Z]\s*[:.]\s*/, '').trim();
    }

    private cleanOptions(opts: any): string[] {
        if (!Array.isArray(opts) || opts.length < 2) return ['Option A', 'Option B'];
        let cleaned = opts.slice(0, 2).map(opt => this.cleanString(String(opt)));
        // 确保两个选项不同
        if (cleaned[0] === cleaned[1]) {
            cleaned[1] = cleaned[0] === "Yes" ? "No" : (cleaned[0] + " (other)");
        }
        return cleaned;
    }

    // 修复常见问题：根据解释推断正确选项、保证选项有意义
    private repairQuestion(question: Question): Question {
        let { text, options, correctAnswer, explanation } = question;

        // 如果正确答案不在选项中，尝试从解释中推断
        if (!options.includes(correctAnswer)) {
            const inferred = this.inferCorrectFromExplanation(explanation, options);
            if (inferred) {
                correctAnswer = inferred;
            } else {
                // 默认第一个选项
                correctAnswer = options[0];
            }
        }

        // 确保两个选项不相等
        if (options[0] === options[1]) {
            options[1] = options[0] === "Yes" ? "No" : "I'm not sure.";
        }

        // 确保解释简洁
        if (explanation.length < 10) {
            explanation = `Good job! ${correctAnswer} is the right choice.`;
        }

        return { ...question, options, correctAnswer, explanation };
    }

    private inferCorrectFromExplanation(explanation: string, options: string[]): string | null {
        const expLow = explanation.toLowerCase();
        for (const opt of options) {
            const optLow = opt.toLowerCase();
            // 如果解释中明确提到了选项的大部分词汇
            const words = optLow.split(/\s+/).filter(w => w.length > 3);
            const matchCount = words.filter(w => expLow.includes(w)).length;
            if (matchCount >= words.length * 0.6) {
                return opt;
            }
        }
        return null;
    }

    private normalizeQuestion(question: Question): Question {
        let trimmedOptions = question.options.map(opt => opt.trim());
        if (trimmedOptions[0] === trimmedOptions[1]) {
            trimmedOptions[1] = trimmedOptions[0] === "Yes" ? "No" : "I don't think so.";
        }
        let correct = question.correctAnswer.trim();
        if (!trimmedOptions.includes(correct)) {
            correct = trimmedOptions[0];
        }
        return { ...question, options: trimmedOptions, correctAnswer: correct };
    }

    private markAmbiguousQuestions(question: Question): Question {
        const text = question.text.toLowerCase();
        const optA = question.options[0].toLowerCase();
        const optB = question.options[1].toLowerCase();
        const isPreference = text.includes('do you like') || text.includes('prefer') || text.includes('favorite');
        const bothPositive = (optA.includes('like') || optA.includes('love')) && (optB.includes('like') || optB.includes('love'));
        if (isPreference && bothPositive) {
            return { ...question, anyAnswerCorrect: true, correctAnswer: question.options[0] };
        }
        return question;
    }

    // 扩充的 mock 题库（保证高质量 fallback）
    private mockQuestions(topic: Topic, count: number): Question[] {
        const easyMockMap: Record<string, Question[]> = {
            sports: [
                { id: 0, text: "What do you say when you want to play soccer with friends?", options: ["Let's play soccer!", "I want to sleep."], correctAnswer: "Let's play soccer!", explanation: "Great! 'Let's play soccer' is a friendly invitation.", context: "Do you want to play with me?" },
                { id: 1, text: "How do you ask someone to join your basketball game?", options: ["Come play with us!", "Go away please"], correctAnswer: "Come play with us!", explanation: "Perfect! Inviting others politely is important.", context: "We need one more player!" },
                { id: 2, text: "What do you say after scoring a goal?", options: ["Great shot!", "I'm tired"], correctAnswer: "Great shot!", explanation: "Awesome! Celebrating with positive words is fun.", context: "We won the game!" },
                { id: 3, text: "How do you ask about someone's favorite sport?", options: ["What sport do you like?", "Give me water"], correctAnswer: "What sport do you like?", explanation: "Nice! Asking about favorites starts a great conversation.", context: "I love playing soccer." }
            ],
            lunch: [
                { id: 0, text: "What do you say when you're hungry?", options: ["I'm hungry. Let's eat!", "I'm sleepy"], correctAnswer: "I'm hungry. Let's eat!", explanation: "Yes! Telling someone you're hungry is polite.", context: "What time is lunch?" },
                { id: 1, text: "How do you ask what's for lunch?", options: ["What's for lunch today?", "Where is my phone?"], correctAnswer: "What's for lunch today?", explanation: "Great! That's a clear question about food.", context: "My stomach is growling." }
            ],
            hobbies: [
                { id: 0, text: "How do you ask about someone's hobby?", options: ["What do you like to do?", "Give me money"], correctAnswer: "What do you like to do?", explanation: "Great! Asking about hobbies shows interest.", context: "I like drawing." }
            ],
            selfIntro: [
                { id: 0, text: "How do you introduce yourself?", options: ["Hi, my name is Alex.", "You are Alex."], correctAnswer: "Hi, my name is Alex.", explanation: "Great! Introducing yourself with your name is friendly.", context: "Let's get to know each other." }
            ],
            interests: [
                { id: 0, text: "How do you say you like music?", options: ["I love listening to music.", "Music is bad."], correctAnswer: "I love listening to music.", explanation: "Nice! Sharing your interests helps make friends.", context: "What do you do for fun?" }
            ],
            commute: [
                { id: 0, text: "How do you ask how someone gets to school?", options: ["How do you get to school?", "Where is your car?"], correctAnswer: "How do you get to school?", explanation: "Good question! It's polite to ask about transportation.", context: "I take the bus." }
            ]
        };
        const hardMockMap: Record<string, Question[]> = {
            directions: [
                { id: 0, text: "How do you ask for directions to the museum?", options: ["Excuse me, how do I get to the museum?", "Where is my house?"], correctAnswer: "Excuse me, how do I get to the museum?", explanation: "Excellent! Being polite with 'Excuse me' is very important.", context: "I'm looking for the museum." },
                { id: 1, text: "What do you say if you don't understand the directions?", options: ["Could you please repeat that?", "I don't care."], correctAnswer: "Could you please repeat that?", explanation: "Great! Asking for clarification is smart and polite.", context: "I didn't catch that." }
            ],
            travel: [
                { id: 0, text: "How do you ask about flight departure time?", options: ["What time does the flight leave?", "Give me ticket"], correctAnswer: "What time does the flight leave?", explanation: "Perfect! That's a clear and polite question.", context: "I need to know my flight time." }
            ],
            culture: [
                { id: 0, text: "How do you ask about a local festival?", options: ["What festivals do you celebrate here?", "Festivals are boring."], correctAnswer: "What festivals do you celebrate here?", explanation: "Great! Showing interest in local culture is respectful.", context: "I love learning about traditions." }
            ],
            help: [
                { id: 0, text: "How do you ask for help when you're lost?", options: ["I'm lost. Can you help me?", "Leave me alone."], correctAnswer: "I'm lost. Can you help me?", explanation: "Perfect! Asking for help is brave and smart.", context: "I don't know where I am." }
            ]
        };
        const source = topic.difficulty === 'easy' ? easyMockMap[topic.id] : hardMockMap[topic.id];
        if (source && source.length >= count) {
            return source.slice(0, count).map((q, idx) => ({ ...q, id: idx, anyAnswerCorrect: false }));
        }
        if (source) {
            const filled = [...source];
            while (filled.length < count) {
                filled.push({ ...source[source.length - 1], id: filled.length, anyAnswerCorrect: false });
            }
            return filled;
        }
        const defaultQuestions: Question[] = [];
        for (let i = 0; i < count; i++) {
            defaultQuestions.push({
                id: i,
                text: topic.difficulty === 'easy' ? "What's the best way to respond?" : "Choose the most appropriate response:",
                options: ["That's a great idea!", "I don't know."],
                correctAnswer: "That's a great idea!",
                explanation: "Great choice! Being positive is always good.",
                context: `Let's practice ${topic.name}!`,
                anyAnswerCorrect: false
            });
        }
        return defaultQuestions;
    }

    evaluateAnswer(question: Question, selectedAnswer: string): { isCorrect: boolean; score: number; feedback: string } {
        if (question.anyAnswerCorrect) {
            return {
                isCorrect: true,
                score: 100,
                feedback: `✅ Great answer! Both choices are fine. ${question.explanation}`
            };
        }
        const isCorrect = selectedAnswer.trim() === question.correctAnswer.trim();
        if (isCorrect) {
            return { isCorrect: true, score: 100, feedback: `✅ ${question.explanation}` };
        } else {
            return { isCorrect: false, score: 0, feedback: `❌ Oops! The correct answer is: "${question.correctAnswer}". ${question.explanation}` };
        }
    }

    async generateConversationSummary(history: ConversationTurn[], topic: Topic): Promise<ConversationAnalysis> {
        const userTurns = history.filter(t => t.role === 'user');
        const correctCount = userTurns.filter(t => t.isCorrect === true).length;
        const totalQuestions = userTurns.length;
        const totalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        if (!this.enabled) {
            return {
                totalScore, averageScore: totalScore,
                feedback: `Great job on ${topic.name}! You got ${correctCount}/${totalQuestions} correct. 🎉`,
                suggestions: ["Practice daily", "Listen to songs", "Watch cartoons"],
                strengths: ["Good effort!"], weakPoints: ["Keep practicing"],
                correctCount, totalQuestions
            };
        }
        try {
            const historyLog = history.map(turn => `${turn.role === 'user' ? 'Student' : 'AI'}: ${turn.content}${turn.isCorrect !== undefined ? ` [${turn.isCorrect ? '✓' : '✗'}]` : ''}`).join('\n');
            const prompt = `You are an encouraging teacher. Topic: ${topic.name}. Score: ${correctCount}/${totalQuestions} (${totalScore}%). Conversation:\n${historyLog}\n\nReturn JSON: { "feedback": "...", "suggestions": [...], "strengths": [...], "weakPoints": [...] }`;
            const response = await fetch(`${this.getAdaptedURL(this.baseURL)}/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model: this.modelName })
            });
            if (!response.ok) throw new Error();
            const data = await response.json();
            const aiText = data.response || data.choices?.[0]?.message?.content || data.result;
            const parsed = JSON.parse(aiText);
            return {
                totalScore, averageScore: totalScore,
                feedback: parsed.feedback || `Great job on ${topic.name}!`,
                suggestions: parsed.suggestions || ["Keep practicing!"],
                strengths: parsed.strengths || ["You tried your best!"],
                weakPoints: parsed.weakPoints || ["Keep learning new words"],
                correctCount, totalQuestions
            };
        } catch (error) {
            return {
                totalScore, averageScore: totalScore,
                feedback: `Awesome work on ${topic.name}! You got ${correctCount} right! 🎉`,
                suggestions: ["Keep practicing!"], strengths: ["Great effort!"], weakPoints: ["Keep going!"],
                correctCount, totalQuestions
            };
        }
    }
}

export const writingAIService = new DialoguAIService();