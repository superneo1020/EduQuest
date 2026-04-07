// app/services/dialogueAIService.ts
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
    subTopic?: string;  // 子主題（如籃球、足球）
};

class DialogueAIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;
    private consecutiveFailures: number = 0;
    private readonly MAX_FAILURES = 2;

    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = 'gemma';
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

    // ========== 子主題選擇模式（新增） ==========

    /**
     * 生成主題選擇問題（讓用戶選擇具體的子主題）
     * @param topic 主主題
     * @param subTopics 子主題選項
     */
    async generateSubTopicQuestion(topic: Topic, subTopics: string[]): Promise<Question> {
        // 如果连续失败次数过多，直接使用 mock
        if (this.consecutiveFailures >= this.MAX_FAILURES) {
            console.warn('AI多次失败，降级使用mock子主题问题');
            return this.getFallbackSubTopicQuestion(topic, subTopics);
        }

        if (!this.enabled) {
            return this.getFallbackSubTopicQuestion(topic, subTopics);
        }

        try {
            const prompt = this.createSubTopicPrompt(topic, subTopics);

            console.log(`Generating sub-topic selection question for: ${topic.name}`);

            const response = await fetch(`${this.getAdaptedURL(this.baseURL)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model: this.modelName,
                    max_tokens: 800,
                    temperature: 0.7
                }),
            });

            if (!response.ok) {
                throw new Error(`AI service error: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data.response || data.choices?.[0]?.message?.content || data.result;

            if (!aiText) {
                throw new Error('Empty response from AI service');
            }

            let question = this.parseSingleQuestion(aiText, topic, 0);
            question = this.repairQuestion(question);
            question = this.normalizeQuestion(question);
            question.anyAnswerCorrect = true; // 子主题选择问题任何答案都正确

            const isValid = this.validateQuestion(question);

            if (isValid) {
                this.consecutiveFailures = 0;
                console.log(`Successfully generated sub-topic question`);
                return question;
            }

            console.warn(`AI生成子主题问题质量过低，使用mock`);
            this.consecutiveFailures++;
            return this.getFallbackSubTopicQuestion(topic, subTopics);

        } catch (error) {
            console.error(`AI sub-topic question generation failed:`, error);
            this.consecutiveFailures++;
            return this.getFallbackSubTopicQuestion(topic, subTopics);
        }
    }

    /**
     * 創建子主題選擇提示詞
     */
    private createSubTopicPrompt(topic: Topic, subTopics: string[]): string {
        return `You are a patient and caring English teacher, creating a multiple-choice question for children aged 8–12.
Topic: ${topic.name}.
The goal is to let the student choose which specific sub-topic they want to talk about.
Available options: ${subTopics.join(', ')}.

Important rules:
- The question must ask the student to choose what they want to discuss.
- Each option should be a clear, complete phrase like "I want to talk about Basketball" or "Let's discuss Football".
- The correctAnswer should be the student's choice (any answer is correct for this selection question).
- Set anyAnswerCorrect = true so the student gets full credit regardless of choice.
- The context should be a warm, inviting lead-in asking what they're interested in.

Output only a valid JSON object in this EXACT format (no extra text before or after):
{
  "context": "Hey there! I'm so excited to practice English with you! What sport would you like to talk about today? 🏀⚽",
  "text": "Which sport do you want to discuss?",
  "options": ["I want to talk about ${subTopics[0]}", "I want to talk about ${subTopics[1]}"],
  "correctAnswer": "I want to talk about ${subTopics[0]}",
  "explanation": "Great choice! Now let's talk about your favorite sport!"
}

Now generate the selection question for topic "${topic.name}" with options: ${subTopics.join(', ')}. Output only the JSON object.`;
    }

    /**
     * 生成基於子主題的具體問題
     * @param topic 主主題
     * @param subTopic 子主題（如 Basketball）
     * @param questionNumber 題目編號
     */
    async generateSubTopicQuestionContent(topic: Topic, subTopic: string, questionNumber: number): Promise<Question> {
        // 如果连续失败次数过多，直接使用 mock
        if (this.consecutiveFailures >= this.MAX_FAILURES) {
            console.warn('AI多次失败，降级使用mock子主题内容问题');
            return this.getFallbackSubTopicContentQuestion(topic, subTopic, questionNumber);
        }

        if (!this.enabled) {
            return this.getFallbackSubTopicContentQuestion(topic, subTopic, questionNumber);
        }

        try {
            const prompt = this.createSubTopicContentPrompt(topic, subTopic, questionNumber);

            console.log(`Generating question ${questionNumber + 1} for topic: ${topic.name} - ${subTopic}`);

            const response = await fetch(`${this.getAdaptedURL(this.baseURL)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model: this.modelName,
                    max_tokens: 800,
                    temperature: 0.7
                }),
            });

            if (!response.ok) {
                throw new Error(`AI service error: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data.response || data.choices?.[0]?.message?.content || data.result;

            if (!aiText) {
                throw new Error('Empty response from AI service');
            }

            let question = this.parseSingleQuestion(aiText, topic, questionNumber);
            question = this.repairQuestion(question);
            question = this.normalizeQuestion(question);
            question = this.markAmbiguousQuestions(question);
            question.subTopic = subTopic;

            const isValid = this.validateQuestion(question);

            if (isValid) {
                this.consecutiveFailures = 0;
                console.log(`Successfully generated question ${questionNumber + 1} for ${subTopic}`);
                return question;
            }

            console.warn(`AI生成质量过低 (question ${questionNumber + 1})，使用mock`);
            this.consecutiveFailures++;
            return this.getFallbackSubTopicContentQuestion(topic, subTopic, questionNumber);

        } catch (error) {
            console.error(`AI question generation failed for question ${questionNumber + 1}:`, error);
            this.consecutiveFailures++;
            return this.getFallbackSubTopicContentQuestion(topic, subTopic, questionNumber);
        }
    }

    /**
     * 創建基於子主題的內容提示詞
     */
    private createSubTopicContentPrompt(topic: Topic, subTopic: string, questionNumber: number): string {
        const questionTypes = [
            "rules of the game",
            "famous players",
            "how to play",
            "equipment needed",
            "scoring system",
            "positions in the game",
            "training tips",
            "fun facts about the sport"
        ];

        const questionType = questionTypes[questionNumber % questionTypes.length];

        return `You are a patient and caring English teacher, creating a multiple-choice question for children aged 8–12.
Main Topic: ${topic.name}
Specific Sub-topic: ${subTopic}
This is question #${questionNumber + 1} of 8 about ${subTopic}.
Question type: ${questionType}

Important rules:
- The question MUST be specifically about ${subTopic} (not sports in general).
- The question must have exactly two options (A and B) – one completely correct, one clearly incorrect.
- The correctAnswer must match one of the two options exactly (including punctuation).
- The two options must be clearly different in meaning.
- Your tone should be warm and encouraging, as if talking naturally to kids in class.
- The options must be complete sentences or natural phrases.
- Make the question unique and creative - avoid obvious or overused examples.
- The context should be a natural lead-in to the question about ${subTopic}.

Output only a valid JSON object in this EXACT format (no extra text before or after):
{
  "context": "A natural conversational lead-in sentence about ${subTopic}",
  "text": "What would you say in this situation about ${subTopic}?",
  "options": ["Correct option here about ${subTopic}", "Incorrect option here about ${subTopic}"],
  "correctAnswer": "Correct option here about ${subTopic}",
  "explanation": "Brief, positive explanation why this is correct (15-30 words)"
}

Now generate a unique question about ${subTopic} focusing on ${questionType}. Output only the JSON object.`;
    }

    /**
     * 獲取備用子主題問題（當 AI 失敗時使用）
     */
    private getFallbackSubTopicQuestion(topic: Topic, subTopics: string[]): Question {
        return {
            id: 0,
            text: "Which sport do you want to talk about today?",
            options: subTopics.map(st => `I want to talk about ${st}`),
            correctAnswer: `I want to talk about ${subTopics[0]}`,
            explanation: "Great choice! Let's have fun learning English together!",
            context: "Hi there! I'm Lingua the fox! 🦊 What sport are you excited to talk about today?",
            anyAnswerCorrect: true
        };
    }

    /**
     * 獲取備用子主題內容問題（當 AI 失敗時使用）
     */
    private getFallbackSubTopicContentQuestion(topic: Topic, subTopic: string, questionNumber: number): Question {
        // 籃球專用備用題庫
        const basketballQuestions: Question[] = [
            {
                id: 0,
                text: "What do you say when you want to pass the ball to your teammate?",
                options: ["Here, catch the ball!", "I'm keeping the ball for myself"],
                correctAnswer: "Here, catch the ball!",
                explanation: "Great! Passing to teammates shows good sportsmanship and teamwork!",
                context: "Your teammate is open near the basket and you have the ball.",
                anyAnswerCorrect: false
            },
            {
                id: 1,
                text: "What do you say when you make a three-point shot?",
                options: ["Three points! Great shot!", "I missed again"],
                correctAnswer: "Three points! Great shot!",
                explanation: "Awesome! Celebrating good shots makes basketball more fun and exciting!",
                context: "You just scored from far away in a basketball game.",
                anyAnswerCorrect: false
            },
            {
                id: 2,
                text: "How do you encourage your teammate after they miss a shot?",
                options: ["Nice try! You'll get it next time!", "You're terrible at this"],
                correctAnswer: "Nice try! You'll get it next time!",
                explanation: "Perfect! Encouraging friends makes everyone feel better and want to keep playing!",
                context: "Your teammate tried to score but the ball bounced off the rim.",
                anyAnswerCorrect: false
            },
            {
                id: 3,
                text: "What do you say when you want to start a basketball game?",
                options: ["Let's start the game! Who's first?", "I want to go home"],
                correctAnswer: "Let's start the game! Who's first?",
                explanation: "Great! Being excited to play makes the game more fun for everyone!",
                context: "You and your friends are ready to play basketball at the park.",
                anyAnswerCorrect: false
            },
            {
                id: 4,
                text: "What do you say when your teammate makes a great play?",
                options: ["Awesome play! You're so good!", "That was lucky"],
                correctAnswer: "Awesome play! You're so good!",
                explanation: "Wonderful! Complimenting teammates builds confidence and team spirit!",
                context: "Your teammate just made an amazing shot and everyone is cheering.",
                anyAnswerCorrect: false
            },
            {
                id: 5,
                text: "How do you ask to practice basketball with a friend?",
                options: ["Want to practice basketball together after school?", "I don't need to practice"],
                correctAnswer: "Want to practice basketball together after school?",
                explanation: "Great! Practicing with friends makes learning more fun and helps everyone improve!",
                context: "You want to get better at basketball and need someone to practice with.",
                anyAnswerCorrect: false
            },
            {
                id: 6,
                text: "What do you say when you dribble past a defender?",
                options: ["Nice dribble! I got past them!", "I lost the ball again"],
                correctAnswer: "Nice dribble! I got past them!",
                explanation: "Excellent! Celebrating small victories keeps you motivated to keep improving!",
                context: "You just successfully dribbled around someone guarding you.",
                anyAnswerCorrect: false
            },
            {
                id: 7,
                text: "How do you call for a timeout in basketball?",
                options: ["Timeout! Let's take a break and talk!", "Keep playing forever"],
                correctAnswer: "Timeout! Let's take a break and talk!",
                explanation: "Perfect! Knowing when to take a timeout shows good game awareness!",
                context: "Your team needs to discuss strategy and catch their breath.",
                anyAnswerCorrect: false
            }
        ];

        // 足球專用備用題庫
        const footballQuestions: Question[] = [
            {
                id: 0,
                text: "What do you say when you score a goal in soccer?",
                options: ["Goal! That's a point for our team!", "I lost the ball"],
                correctAnswer: "Goal! That's a point for our team!",
                explanation: "Excellent! Celebrating goals with enthusiasm makes soccer exciting!",
                context: "You just kicked the ball into the net during a soccer match.",
                anyAnswerCorrect: false
            },
            {
                id: 1,
                text: "How do you ask to join a soccer game?",
                options: ["Can I play with you guys?", "Go away, I'm busy"],
                correctAnswer: "Can I play with you guys?",
                explanation: "Perfect! Asking politely to join makes people happy to include you!",
                context: "You see some kids playing soccer in the field and want to join.",
                anyAnswerCorrect: false
            },
            {
                id: 2,
                text: "What do you say when you make a good save as a goalkeeper?",
                options: ["Great save! I caught the ball!", "The ball went past me"],
                correctAnswer: "Great save! I caught the ball!",
                explanation: "Nice! Being proud of good saves helps build confidence as a goalkeeper!",
                context: "You just stopped a hard shot from going into the goal.",
                anyAnswerCorrect: false
            },
            {
                id: 3,
                text: "How do you say good game after soccer?",
                options: ["Good game, everyone! That was fun!", "You all played badly"],
                correctAnswer: "Good game, everyone! That was fun!",
                explanation: "Wonderful! Being a good sport after the game shows great character!",
                context: "The soccer match just ended and everyone is tired but happy.",
                anyAnswerCorrect: false
            },
            {
                id: 4,
                text: "What do you say when you pass the ball to a teammate?",
                options: ["Here's the pass! Your turn!", "I'm keeping the ball"],
                correctAnswer: "Here's the pass! Your turn!",
                explanation: "Great! Good passing helps your team work together and score more goals!",
                context: "Your teammate is open and ready to receive the ball.",
                anyAnswerCorrect: false
            },
            {
                id: 5,
                text: "How do you encourage your team before a soccer match?",
                options: ["Let's do our best and have fun!", "We're going to lose anyway"],
                correctAnswer: "Let's do our best and have fun!",
                explanation: "Perfect! Positive encouragement helps everyone play better and enjoy the game!",
                context: "Your soccer team is about to start an important match.",
                anyAnswerCorrect: false
            },
            {
                id: 6,
                text: "What do you say when you kick the ball out of bounds?",
                options: ["Sorry, that was my mistake!", "It's someone else's fault"],
                correctAnswer: "Sorry, that was my mistake!",
                explanation: "Good job! Taking responsibility shows maturity and good sportsmanship!",
                context: "You accidentally kicked the soccer ball past the sideline.",
                anyAnswerCorrect: false
            },
            {
                id: 7,
                text: "How do you ask what the score is?",
                options: ["What's the score now?", "I don't care about the score"],
                correctAnswer: "What's the score now?",
                explanation: "Nice! Keeping track of the score helps you know how the game is going!",
                context: "You've been playing soccer for a while and lost track of points.",
                anyAnswerCorrect: false
            }
        ];

        // 網球專用備用題庫
        const tennisQuestions: Question[] = [
            {
                id: 0,
                text: "What do you say when you hit a good serve in tennis?",
                options: ["Great serve! Right into the box!", "I missed the serve"],
                correctAnswer: "Great serve! Right into the box!",
                explanation: "Awesome! A good serve gives you an advantage in the point!",
                context: "You just served the ball and it landed perfectly in the service box.",
                anyAnswerCorrect: false
            },
            {
                id: 1,
                text: "How do you call the score in tennis?",
                options: ["Love-15, 30-40, deuce, advantage!", "I don't know the score"],
                correctAnswer: "Love-15, 30-40, deuce, advantage!",
                explanation: "Excellent! Knowing tennis scoring makes you a real tennis player!",
                context: "You're keeping score during a friendly tennis match.",
                anyAnswerCorrect: false
            }
        ];

        // 游泳專用備用題庫
        const swimmingQuestions: Question[] = [
            {
                id: 0,
                text: "What do you say when you finish a lap in swimming?",
                options: ["I finished one lap! Time for another!", "I'm too tired to continue"],
                correctAnswer: "I finished one lap! Time for another!",
                explanation: "Great job! Completing laps builds endurance and strength in swimming!",
                context: "You just swam from one end of the pool to the other.",
                anyAnswerCorrect: false
            },
            {
                id: 1,
                text: "How do you ask about pool safety rules?",
                options: ["What are the safety rules for the pool?", "I don't need to know rules"],
                correctAnswer: "What are the safety rules for the pool?",
                explanation: "Smart! Knowing safety rules helps everyone stay safe while having fun!",
                context: "You're at a new swimming pool and want to be careful.",
                anyAnswerCorrect: false
            }
        ];

        // 根據子主題選擇備用題庫
        let subTopicLower = subTopic.toLowerCase();
        if (subTopicLower.includes('basketball') || subTopicLower.includes('籃球')) {
            const fallback = basketballQuestions[questionNumber % basketballQuestions.length];
            return { ...fallback, id: questionNumber, subTopic };
        } else if (subTopicLower.includes('football') || subTopicLower.includes('soccer') || subTopicLower.includes('足球')) {
            const fallback = footballQuestions[questionNumber % footballQuestions.length];
            return { ...fallback, id: questionNumber, subTopic };
        } else if (subTopicLower.includes('tennis') || subTopicLower.includes('網球')) {
            const fallback = tennisQuestions[questionNumber % tennisQuestions.length];
            return { ...fallback, id: questionNumber, subTopic };
        } else if (subTopicLower.includes('swimming') || subTopicLower.includes('游泳')) {
            const fallback = swimmingQuestions[questionNumber % swimmingQuestions.length];
            return { ...fallback, id: questionNumber, subTopic };
        }

        // 通用備用題目
        return {
            id: questionNumber,
            text: `What would you say when playing ${subTopic}?`,
            options: [`Let's play ${subTopic}! That sounds fun!`, "I don't want to play anything."],
            correctAnswer: `Let's play ${subTopic}! That sounds fun!`,
            explanation: `Great choice! Showing enthusiasm for ${subTopic} makes playing more enjoyable!`,
            context: `Your friend asks if you want to play ${subTopic} together.`,
            anyAnswerCorrect: false,
            subTopic
        };
    }

    // ========== 單題生成模式（主要使用） ==========

    /**
     * 生成單一題目（動態生成，每題獨立）
     * @param topic 主題
     * @param questionNumber 題目編號（用於多樣性）
     */
    async generateSingleQuestion(topic: Topic, questionNumber: number): Promise<Question> {
        // 如果连续失败次数过多，直接使用 mock
        if (this.consecutiveFailures >= this.MAX_FAILURES) {
            console.warn('AI多次失败，降级使用mock题库');
            return this.getFallbackQuestion(topic, questionNumber);
        }

        if (!this.enabled) {
            return this.getFallbackQuestion(topic, questionNumber);
        }

        try {
            const prompt = this.createSingleQuestionPrompt(topic, questionNumber);

            console.log(`Generating question ${questionNumber + 1} for topic: ${topic.name}`);

            const response = await fetch(`${this.getAdaptedURL(this.baseURL)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model: this.modelName,
                    max_tokens: 800,
                    temperature: 0.7
                }),
            });

            if (!response.ok) {
                throw new Error(`AI service error: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data.response || data.choices?.[0]?.message?.content || data.result;

            if (!aiText) {
                throw new Error('Empty response from AI service');
            }

            let question = this.parseSingleQuestion(aiText, topic, questionNumber);
            question = this.repairQuestion(question);
            question = this.normalizeQuestion(question);
            question = this.markAmbiguousQuestions(question);

            // 验证质量
            const isValid = this.validateQuestion(question);

            if (isValid) {
                this.consecutiveFailures = 0;
                console.log(`Successfully generated question ${questionNumber + 1}`);
                return question;
            }

            console.warn(`AI生成质量过低 (question ${questionNumber + 1})，使用mock`);
            this.consecutiveFailures++;
            return this.getFallbackQuestion(topic, questionNumber);

        } catch (error) {
            console.error(`AI question generation failed for question ${questionNumber + 1}:`, error);
            this.consecutiveFailures++;
            return this.getFallbackQuestion(topic, questionNumber);
        }
    }

    /**
     * 創建單題提示詞
     */
    private createSingleQuestionPrompt(topic: Topic, questionNumber: number): string {
        // 根據題目編號和主題生成不同的問題類型
        const questionTypes = [
            "asking for an opinion",
            "making a suggestion",
            "responding to an invitation",
            "expressing a preference",
            "asking for help",
            "giving directions",
            "talking about daily routine",
            "sharing feelings"
        ];

        const questionType = questionTypes[questionNumber % questionTypes.length];

        return `You are a patient and caring English teacher, creating a multiple-choice question for children aged 8–12.
Topic: ${topic.name} (Difficulty: ${topic.difficulty}).
This is question #${questionNumber + 1} of 8.
Question type: ${questionType}

Important rules:
- The question must have exactly two options (A and B) – one completely correct, one clearly incorrect.
- The correctAnswer must match one of the two options exactly (including punctuation).
- The two options must be clearly different in meaning.
- Your tone should be warm and encouraging, as if talking naturally to kids in class.
- The options must be complete sentences or natural phrases.
- Make the question unique and creative - avoid obvious or overused examples.
- The context should be a natural lead-in to the question.

Output only a valid JSON object in this EXACT format (no extra text before or after):
{
  "context": "A natural conversational lead-in sentence",
  "text": "What would you say in this situation?",
  "options": ["Correct option here", "Incorrect option here"],
  "correctAnswer": "Correct option here",
  "explanation": "Brief, positive explanation why this is correct (15-30 words)"
}

Now generate a unique question for topic "${topic.name}" about ${questionType}. Output only the JSON object.`;
    }

    /**
     * 解析單一題目
     */
    private parseSingleQuestion(raw: string, topic: Topic, questionNumber: number): Question {
        try {
            let jsonStr = raw.trim();

            // 提取 JSON 對象
            const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                jsonStr = objectMatch[0];
            }

            // 移除 markdown 标记
            jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            const parsed = JSON.parse(jsonStr);

            return {
                id: questionNumber,
                text: this.cleanString(parsed.text || parsed.question || `Question ${questionNumber + 1}`),
                options: this.cleanOptions(parsed.options),
                correctAnswer: this.cleanString(parsed.correctAnswer || ''),
                explanation: this.cleanString(parsed.explanation || 'Good job! Keep learning!'),
                context: this.cleanString(parsed.context || `Let's practice ${topic.name}!`),
                anyAnswerCorrect: false
            };
        } catch (e) {
            console.error('JSON parse failed for single question, using fallback');
            console.error('Raw response:', raw.substring(0, 300));
            return this.getFallbackQuestion(topic, questionNumber);
        }
    }

    /**
     * 驗證題目質量
     */
    private validateQuestion(question: Question): boolean {
        return (
            question.options.length === 2 &&
            question.options[0] !== question.options[1] &&
            question.options.includes(question.correctAnswer) &&
            question.explanation.length > 5 &&
            question.text.length > 10 &&
            question.context.length > 5
        );
    }

    /**
     * 獲取備用題目（當 AI 失敗時使用）
     */
    getFallbackQuestion(topic: Topic, questionNumber: number): Question {
        // Easy 主題備用題庫
        const easyMockMap: Record<string, Question[]> = {
            sports: [
                {
                    id: 0,
                    text: "What do you say when you want to play soccer with friends?",
                    options: ["Let's play soccer!", "I want to sleep."],
                    correctAnswer: "Let's play soccer!",
                    explanation: "Great! 'Let's play soccer' is a friendly invitation to have fun together.",
                    context: "The sun is shining and you see your friends in the park.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you ask someone to join your basketball game?",
                    options: ["Come play with us!", "Go away please"],
                    correctAnswer: "Come play with us!",
                    explanation: "Perfect! Inviting others politely makes them feel welcome and included.",
                    context: "Your team needs one more player for a fun match.",
                    anyAnswerCorrect: false
                },
                {
                    id: 2,
                    text: "What do you say after scoring a goal?",
                    options: ["Great shot!", "I'm tired"],
                    correctAnswer: "Great shot!",
                    explanation: "Awesome! Celebrating with positive words makes the game more enjoyable for everyone.",
                    context: "Your teammate just scored the winning goal!",
                    anyAnswerCorrect: false
                },
                {
                    id: 3,
                    text: "How do you ask about someone's favorite sport?",
                    options: ["What sport do you like?", "Give me water"],
                    correctAnswer: "What sport do you like?",
                    explanation: "Nice! Asking about favorites shows you care and starts a great conversation.",
                    context: "You want to get to know your new classmate better.",
                    anyAnswerCorrect: false
                },
                {
                    id: 4,
                    text: "What do you say when you win a game?",
                    options: ["Good game, everyone!", "You are losers"],
                    correctAnswer: "Good game, everyone!",
                    explanation: "Excellent! Being a good sport shows respect and kindness to all players.",
                    context: "Your team just won the championship match.",
                    anyAnswerCorrect: false
                }
            ],
            lunch: [
                {
                    id: 0,
                    text: "What do you say when you're hungry?",
                    options: ["I'm hungry. Let's eat!", "I'm sleepy"],
                    correctAnswer: "I'm hungry. Let's eat!",
                    explanation: "Yes! Telling someone you're hungry is a polite way to suggest having a meal together.",
                    context: "It's noon and you haven't eaten since breakfast.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you ask what's for lunch?",
                    options: ["What's for lunch today?", "Where is my phone?"],
                    correctAnswer: "What's for lunch today?",
                    explanation: "Great! That's a clear and polite question about today's meal.",
                    context: "You smell something delicious coming from the kitchen.",
                    anyAnswerCorrect: false
                },
                {
                    id: 2,
                    text: "How do you say you like the food?",
                    options: ["This is delicious! Thank you!", "I don't like this."],
                    correctAnswer: "This is delicious! Thank you!",
                    explanation: "Wonderful! Showing appreciation for food makes the cook feel happy.",
                    context: "Your mom just made your favorite dish.",
                    anyAnswerCorrect: false
                }
            ],
            hobbies: [
                {
                    id: 0,
                    text: "How do you ask about someone's hobby?",
                    options: ["What do you like to do in your free time?", "Give me money"],
                    correctAnswer: "What do you like to do in your free time?",
                    explanation: "Great! Asking about hobbies shows genuine interest in getting to know someone.",
                    context: "You want to find common interests with a new friend.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you share what you enjoy doing?",
                    options: ["I love playing the guitar in my free time.", "I hate everything."],
                    correctAnswer: "I love playing the guitar in my free time.",
                    explanation: "Nice! Sharing your hobbies helps others understand what makes you happy.",
                    context: "Someone just asked what you like to do after school.",
                    anyAnswerCorrect: false
                }
            ],
            selfIntro: [
                {
                    id: 0,
                    text: "How do you introduce yourself to a new classmate?",
                    options: ["Hi, my name is Alex. Nice to meet you!", "You are Alex."],
                    correctAnswer: "Hi, my name is Alex. Nice to meet you!",
                    explanation: "Great! Introducing yourself with your name and a friendly greeting is polite and warm.",
                    context: "A new student just joined your class.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you ask someone's name politely?",
                    options: ["What's your name?", "Give me your name now!"],
                    correctAnswer: "What's your name?",
                    explanation: "Perfect! Asking 'What's your name?' is a simple and polite way to learn someone's name.",
                    context: "You want to make a new friend at the playground.",
                    anyAnswerCorrect: false
                }
            ],
            interests: [
                {
                    id: 0,
                    text: "How do you say you like music?",
                    options: ["I love listening to music. It makes me happy!", "Music is bad."],
                    correctAnswer: "I love listening to music. It makes me happy!",
                    explanation: "Nice! Sharing your interests positively helps others understand what brings you joy.",
                    context: "Someone asks what you enjoy doing in your free time.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you ask what music someone likes?",
                    options: ["What kind of music do you enjoy?", "I don't care about music."],
                    correctAnswer: "What kind of music do you enjoy?",
                    explanation: "Great! Asking about music preferences shows interest in someone's tastes.",
                    context: "You want to share headphones with a friend.",
                    anyAnswerCorrect: false
                }
            ],
            commute: [
                {
                    id: 0,
                    text: "How do you ask how someone gets to school?",
                    options: ["How do you get to school every day?", "Where is your car?"],
                    correctAnswer: "How do you get to school every day?",
                    explanation: "Good question! It's a natural way to learn about someone's daily routine.",
                    context: "You're curious about your classmate's morning routine.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you say you take the bus?",
                    options: ["I usually take the bus to school.", "I fly to school."],
                    correctAnswer: "I usually take the bus to school.",
                    explanation: "Perfect! Sharing your transportation method is a normal part of conversation.",
                    context: "Someone just asked how you get to school.",
                    anyAnswerCorrect: false
                }
            ]
        };

        // Hard 主題備用題庫
        const hardMockMap: Record<string, Question[]> = {
            directions: [
                {
                    id: 0,
                    text: "How do you politely ask for directions to the museum?",
                    options: ["Excuse me, could you tell me how to get to the museum?", "Where is my house?"],
                    correctAnswer: "Excuse me, could you tell me how to get to the museum?",
                    explanation: "Excellent! Using 'Excuse me' and 'could you' makes your request very polite and respectful.",
                    context: "You're visiting a new city and want to see the art museum.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "What do you say if you don't understand the directions?",
                    options: ["Could you please repeat that more slowly?", "I don't care."],
                    correctAnswer: "Could you please repeat that more slowly?",
                    explanation: "Great! Asking for clarification politely is smart and shows you want to understand.",
                    context: "The person gave you complicated directions with many turns.",
                    anyAnswerCorrect: false
                },
                {
                    id: 2,
                    text: "How do you thank someone for giving you directions?",
                    options: ["Thank you so much for your help!", "Finally, you told me."],
                    correctAnswer: "Thank you so much for your help!",
                    explanation: "Perfect! Showing gratitude makes people happy to help you again in the future.",
                    context: "A kind stranger just helped you find your way.",
                    anyAnswerCorrect: false
                }
            ],
            travel: [
                {
                    id: 0,
                    text: "How do you ask about flight departure time at the airport?",
                    options: ["Excuse me, what time does my flight leave?", "Give me my ticket now"],
                    correctAnswer: "Excuse me, what time does my flight leave?",
                    explanation: "Perfect! Being polite with 'Excuse me' makes your question appropriate for service staff.",
                    context: "You're at the airport and need to check your flight schedule.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you ask where the baggage claim is?",
                    options: ["Could you tell me where the baggage claim is?", "Where are my bags?"],
                    correctAnswer: "Could you tell me where the baggage claim is?",
                    explanation: "Great! Using 'could you tell me' is a very polite way to ask for information.",
                    context: "You just got off your flight and need to collect your luggage.",
                    anyAnswerCorrect: false
                }
            ],
            culture: [
                {
                    id: 0,
                    text: "How do you politely ask about local customs?",
                    options: ["Could you tell me about your local traditions?", "Your customs are strange."],
                    correctAnswer: "Could you tell me about your local traditions?",
                    explanation: "Great! Showing genuine interest in local culture is respectful and opens up wonderful conversations.",
                    context: "You're visiting a new country and want to learn about their festivals.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you express interest in trying local food?",
                    options: ["I'd love to try your local dishes. What do you recommend?", "I only eat my own food."],
                    correctAnswer: "I'd love to try your local dishes. What do you recommend?",
                    explanation: "Wonderful! Being open to new foods shows respect for local culture and adventure!",
                    context: "A local friend invites you to dinner at a traditional restaurant.",
                    anyAnswerCorrect: false
                }
            ],
            help: [
                {
                    id: 0,
                    text: "How do you ask for help when you're lost in a new city?",
                    options: ["I'm lost. Could you please help me find my way?", "Leave me alone."],
                    correctAnswer: "I'm lost. Could you please help me find my way?",
                    explanation: "Perfect! Asking for help is brave and smart. Being polite makes people want to assist you.",
                    context: "You can't find your hotel and your phone battery is dead.",
                    anyAnswerCorrect: false
                },
                {
                    id: 1,
                    text: "How do you ask someone to call for emergency help?",
                    options: ["Please call an ambulance! There's an emergency!", "I don't need help."],
                    correctAnswer: "Please call an ambulance! There's an emergency!",
                    explanation: "Good! In emergencies, being clear and direct while saying 'please' is most effective.",
                    context: "You see someone who needs immediate medical attention.",
                    anyAnswerCorrect: false
                }
            ]
        };

        const source = topic.difficulty === 'easy' ? easyMockMap[topic.id] : hardMockMap[topic.id];

        if (source && source.length > 0) {
            const fallbackIndex = questionNumber % source.length;
            const fallback = source[fallbackIndex];
            return {
                ...fallback,
                id: questionNumber,
                anyAnswerCorrect: false
            };
        }

        // 默認備用題目
        return {
            id: questionNumber,
            text: topic.difficulty === 'easy'
                ? "What's the best way to respond in this situation?"
                : "Choose the most appropriate and polite response:",
            options: [
                "That's a great idea! Let's do that.",
                "I don't know what to say."
            ],
            correctAnswer: "That's a great idea! Let's do that.",
            explanation: "Great choice! Responding positively shows enthusiasm and keeps conversations friendly.",
            context: `Let's practice having a natural conversation about ${topic.name}!`,
            anyAnswerCorrect: false
        };
    }

    // ========== 輔助方法 ==========

    private cleanString(s: string): string {
        if (!s) return '';
        return s.replace(/^[A-Z]\s*[:.]\s*/, '').trim();
    }

    private cleanOptions(opts: any): string[] {
        if (!Array.isArray(opts) || opts.length < 2) {
            return ['Option A', 'Option B'];
        }
        let cleaned = opts.slice(0, 2).map(opt => this.cleanString(String(opt)));
        // 确保两个选项不同
        if (cleaned[0] === cleaned[1]) {
            cleaned[1] = cleaned[0] === "Yes" ? "No" : (cleaned[0] + " (different)");
        }
        return cleaned;
    }

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
            options[1] = options[0] === "Yes" ? "No" : "I'm not sure about that.";
        }

        // 确保解释简洁
        if (explanation.length < 10) {
            explanation = `Good job! "${correctAnswer}" is the right choice. Keep practicing!`;
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

    // ========== 批量生成（保留作為備用，但推薦使用單題模式） ==========

    async generateQuestions(topic: Topic, count: number = 8, startIndex: number = 0): Promise<Question[]> {
        // 如果只需要生成一題，使用單題方法
        if (count === 1) {
            const question = await this.generateSingleQuestion(topic, startIndex);
            return [question];
        }

        // 批量生成（原有邏輯，作為備用）
        if (this.consecutiveFailures >= this.MAX_FAILURES) {
            console.warn('AI多次失败，降级使用mock题库');
            return this.mockQuestionsBatch(topic, count);
        }

        if (!this.enabled) {
            return this.mockQuestionsBatch(topic, count);
        }

        try {
            const prompt = this.createBatchPrompt(topic, count);

            const response = await fetch(`${this.getAdaptedURL(this.baseURL)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model: this.modelName, max_tokens: 2000, temperature: 0.7 }),
            });

            if (!response.ok) throw new Error('Failed to generate questions');
            const data = await response.json();
            const aiText = data.response || data.choices?.[0]?.message?.content || data.result;

            let questions = this.parseQuestionsBatch(aiText, topic);
            questions = questions.map(q => this.repairQuestion(q));
            questions = questions.map(q => this.normalizeQuestion(q));
            questions = questions.map(q => this.markAmbiguousQuestions(q));

            const validCount = questions.filter(q => this.validateQuestion(q)).length;

            if (validCount < count * 0.6) {
                console.warn(`AI生成质量过低 (${validCount}/${count} 有效)，使用mock`);
                this.consecutiveFailures++;
                return this.mockQuestionsBatch(topic, count);
            }

            this.consecutiveFailures = 0;
            return questions.slice(0, count);
        } catch (error) {
            console.error('AI question generation failed:', error);
            this.consecutiveFailures++;
            return this.mockQuestionsBatch(topic, count);
        }
    }

    private createBatchPrompt(topic: Topic, count: number): string {
        return `You are a patient and caring English teacher, creating multiple-choice questions for children aged 8–12.
Topic: ${topic.name} (Difficulty: ${topic.difficulty}).
Please generate exactly ${count} questions.

Important rules:
1. Each question must have exactly two options (A and B).
2. One option must be completely correct.
3. The other option must be clearly incorrect (e.g., wrong fact, illogical situation, or opposite meaning).
4. The two options must be clearly different in structure and meaning — not just swapping a single word.
5. Your tone should be warm and encouraging.
6. Each option must be a complete sentence.
7. Make every question unique and creative.

Output only a valid JSON array in this format:
[
  {
    "context": "conversation lead-in",
    "text": "question text",
    "options": ["correct option", "incorrect option"],
    "correctAnswer": "correct option",
    "explanation": "brief explanation"
  }
]

Now generate ${count} questions for topic "${topic.name}". Output only the JSON array.`;
    }

    private parseQuestionsBatch(raw: string, topic: Topic): Question[] {
        try {
            let jsonStr = raw.trim();
            const arrayMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }
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
            console.error('JSON parse failed for batch, raw:', raw.substring(0, 200));
        }
        return this.mockQuestionsBatch(topic, 8);
    }

    private mockQuestionsBatch(topic: Topic, count: number): Question[] {
        const questions: Question[] = [];
        for (let i = 0; i < count; i++) {
            questions.push(this.getFallbackQuestion(topic, i));
        }
        return questions;
    }

    // ========== 答案評估 ==========

    evaluateAnswer(question: Question, selectedAnswer: string): { isCorrect: boolean; score: number; feedback: string } {
        if (question.anyAnswerCorrect) {
            return {
                isCorrect: true,
                score: 100,
                feedback: `✅ Great answer! Both choices work well here. ${question.explanation}`
            };
        }

        const isCorrect = selectedAnswer.trim() === question.correctAnswer.trim();

        if (isCorrect) {
            return {
                isCorrect: true,
                score: 100,
                feedback: `✅ ${question.explanation}`
            };
        } else {
            return {
                isCorrect: false,
                score: 0,
                feedback: `❌ Oops! The correct answer is: "${question.correctAnswer}". ${question.explanation}`
            };
        }
    }

    // ========== 對話總結 ==========

    async generateConversationSummary(history: ConversationTurn[], topic: Topic): Promise<ConversationAnalysis> {
        const userTurns = history.filter(t => t.role === 'user');
        const correctCount = userTurns.filter(t => t.isCorrect === true).length;
        const totalQuestions = userTurns.length;
        const totalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        if (!this.enabled || this.consecutiveFailures >= this.MAX_FAILURES) {
            return {
                totalScore,
                averageScore: totalScore,
                feedback: `Great job on ${topic.name}! You got ${correctCount} out of ${totalQuestions} correct! 🎉 Keep up the amazing work!`,
                suggestions: ["Practice speaking English every day", "Listen to English songs", "Watch cartoons in English"],
                strengths: ["You're making great progress!", "Good effort on all questions!"],
                weakPoints: ["Keep practicing new vocabulary", "Try to speak more confidently"],
                correctCount,
                totalQuestions
            };
        }

        try {
            const historyLog = history.map(turn =>
                `${turn.role === 'user' ? 'Student' : 'AI'}: ${turn.content}${turn.isCorrect !== undefined ? ` [${turn.isCorrect ? '✓' : '✗'}]` : ''}`
            ).join('\n');

            const prompt = `You are an encouraging English teacher. 
Topic: ${topic.name}. 
Score: ${correctCount}/${totalQuestions} (${totalScore}%). 
Conversation history:
${historyLog}

Provide a warm, encouraging analysis. Return ONLY valid JSON:
{
  "feedback": "Overall encouraging message (2-3 sentences)",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "strengths": ["strength 1", "strength 2"],
  "weakPoints": ["area to improve 1", "area to improve 2"]
}`;

            const response = await fetch(`${this.getAdaptedURL(this.baseURL)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, model: this.modelName, max_tokens: 500 })
            });

            if (!response.ok) throw new Error();

            const data = await response.json();
            const aiText = data.response || data.choices?.[0]?.message?.content || data.result;

            let parsed;
            try {
                let jsonStr = aiText.trim();
                const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (objectMatch) jsonStr = objectMatch[0];
                jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                parsed = JSON.parse(jsonStr);
            } catch (e) {
                throw new Error('Failed to parse AI response');
            }

            return {
                totalScore,
                averageScore: totalScore,
                feedback: parsed.feedback || `Wonderful job on ${topic.name}! You're doing great!`,
                suggestions: parsed.suggestions || ["Keep practicing daily!", "Read English books", "Talk with friends in English"],
                strengths: parsed.strengths || ["You're trying your best!", "Good participation!"],
                weakPoints: parsed.weakPoints || ["Keep expanding your vocabulary", "Practice makes perfect!"],
                correctCount,
                totalQuestions
            };
        } catch (error) {
            console.error('Summary generation failed:', error);
            return {
                totalScore,
                averageScore: totalScore,
                feedback: `Awesome work on ${topic.name}! You got ${correctCount} out of ${totalQuestions} correct! 🎉 Keep practicing and you'll become even better!`,
                suggestions: ["Practice a little every day", "Listen to English podcasts", "Watch English videos with subtitles"],
                strengths: ["Great effort!", "You're improving!"],
                weakPoints: ["Keep learning new words", "Practice your pronunciation"],
                correctCount,
                totalQuestions
            };
        }
    }
}

// 導出單例
export const writingAIService = new DialogueAIService();