// app/services/WritingAIService.ts
import { Platform } from 'react-native';

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
    challengeBonus?: number;
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

export type GrammarChallengeCard = {
    grammarName: string;
    exampleSentence: string;
    bonusPoints: number;
};

class WritingAIService {
    private baseURL: string;
    private modelName: string;
    private enabled: boolean;

    // 預定義的文法類型清單（小四程度）
    private readonly grammarTypes: string[] = [
        'to be (is/am/are) 肯定句',
        'to have (has/have) 表示擁有',
        '一般現在式 (Simple Present) 習慣/事實',
        '現在進行式 (Present Continuous) 正在做',
        '一般過去式 (Simple Past) 常見動詞',
        '將來式 (Future: will / going to)',
        '比較級 (Comparatives)',
        'There is / There are',
        '連接詞 (and / but / so / because)'
    ];

    constructor() {
        this.baseURL = 'http://127.0.0.1:8000';
        this.modelName = 'gemma';
        this.enabled = true;
        console.log('📝 WritingAIService initialized:', { baseURL: this.baseURL, modelName: this.modelName, enabled: this.enabled });
    }

    private getAdaptedURL(url: string): string {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            if (url.includes('localhost') || url.includes('127.0.0.1')) {
                if (Platform.OS === 'android') {
                    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
                }
            }
        }
        return url;
    }

    async analyzeWriting(
        studentWriting: string,
        prompt: string,
        promptInfo: WritingPrompt
    ): Promise<WritingAnalysis> {
        console.log('🚀 Starting AI analysis...');
        if (!this.enabled) {
            return this.mockAnalysis(studentWriting, prompt, promptInfo);
        }

        try {
            const fullPrompt = this.buildWritingPrompt(studentWriting, prompt, promptInfo);
            const adaptedURL = this.getAdaptedURL(this.baseURL);
            const response = await fetch(`${adaptedURL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: fullPrompt }),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const aiResponse = data.response || data.choices?.[0]?.message?.content || data.result;
            if (!aiResponse) throw new Error('No AI response');
            return this.parseAIResponse(aiResponse, studentWriting, promptInfo);
        } catch (error) {
            console.error('❌ AI analysis failed, using mock', error);
            return this.mockAnalysis(studentWriting, prompt, promptInfo);
        }
    }

    private buildWritingPrompt(studentWriting: string, prompt: string, promptInfo: WritingPrompt): string {
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

    private parseAIResponse(aiResponse: string, originalWriting: string, promptInfo: WritingPrompt): WritingAnalysis {
        try {
            let cleaned = aiResponse.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
            if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
            if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
            const parsed = JSON.parse(cleaned.trim());
            return {
                score: Math.min(100, Math.max(0, parsed.score || 70)),
                feedback: parsed.feedback || "Good effort! Keep practicing your English writing.",
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : this.getDefaultSuggestions(originalWriting),
                correctedSentence: parsed.correctedSentence || this.generateDefaultCorrection(originalWriting),
                grammarErrors: Array.isArray(parsed.grammarErrors) ? parsed.grammarErrors.slice(0, 2) : [],
                vocabularyScore: Math.min(10, Math.max(1, parsed.vocabularyScore || 7)),
                structureScore: Math.min(10, Math.max(1, parsed.structureScore || 7)),
            };
        } catch (error) {
            console.error('JSON parse failed', error);
            return this.parseTextResponse(aiResponse, originalWriting, promptInfo);
        }
    }

    private parseTextResponse(response: string, originalWriting: string, promptInfo: WritingPrompt): WritingAnalysis {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return this.parseAIResponse(jsonMatch[0], originalWriting, promptInfo);
            } catch (e) { /* fallback */ }
        }
        return this.mockAnalysis(originalWriting, "", promptInfo);
    }

    async testConnection(): Promise<boolean> {
        try {
            const adaptedURL = this.getAdaptedURL(this.baseURL);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`${adaptedURL}/health`, { method: 'GET', signal: controller.signal });
            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    }

    private getDefaultSuggestions(writing: string): string[] {
        const wordCount = writing.trim().split(/\s+/).filter(w => w.length > 0).length;
        const suggestions = [
            "Try to use more descriptive words like 'beautiful', 'colorful', or 'exciting'.",
            "Remember to start sentences with capital letters.",
            "Add periods at the end of your sentences.",
        ];
        if (wordCount < 15) suggestions.push("Try to write a bit more to describe the scene better.");
        return suggestions.slice(0, 3);
    }

    private generateDefaultCorrection(writing: string): string {
        if (!writing || !writing.trim()) return "";
        let corrected = writing.trim();
        if (corrected.length > 0) corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
        if (!/[.!?]$/.test(corrected)) corrected += ".";
        return corrected;
    }

    private mockAnalysis(studentWriting: string, prompt: string, promptInfo: WritingPrompt): WritingAnalysis {
        const wordCount = studentWriting.trim().split(/\s+/).filter(w => w.length > 0).length;
        const sentences = studentWriting.split(/[.!?]+/).filter(s => s.trim().length > 0);
        let score = 70;
        if (wordCount >= 25 && wordCount <= promptInfo.wordLimit) score += 15;
        else if (wordCount >= 15) score += 10;
        else if (wordCount < 10) score -= 10;
        else if (wordCount < 5) score -= 20;
        if (sentences.length >= 2) score += 5;
        if (sentences.length >= 3) score += 5;

        const hasCapital = /[A-Z]/.test(studentWriting[0] || '');
        const hasPeriod = /[.!?]$/.test(studentWriting.trim());
        const hasDescriptive = /(beautiful|colorful|big|small|happy|fun|nice|good|sunny|cloudy)/i.test(studentWriting);

        if (hasCapital) score += 5;
        if (hasPeriod) score += 5;
        if (hasDescriptive) score += 10;
        score = Math.min(95, Math.max(30, score));

        let feedback = '';
        if (score >= 90) feedback = 'Excellent writing! You described the scene beautifully with great vocabulary and structure.';
        else if (score >= 70) feedback = 'Good effort! Your writing is clear and shows understanding of the scene.';
        else if (score >= 50) feedback = 'Nice try! You have good ideas. With a little more practice, your writing will improve.';
        else feedback = 'Keep practicing! Remember to write complete sentences and describe what you see.';

        const suggestions = [];
        if (!hasCapital) suggestions.push('Start sentences with capital letters.');
        if (!hasPeriod) suggestions.push('Add periods at the end of sentences.');
        if (!hasDescriptive) suggestions.push('Use descriptive words like "beautiful", "colorful", or "exciting".');
        if (wordCount < 15) suggestions.push('Try to write a bit more to describe the scene.');
        while (suggestions.length < 3) suggestions.push('Keep practicing your English writing every day.');

        const correctedSentence = this.generateDefaultCorrection(studentWriting);
        return {
            score,
            feedback,
            suggestions: suggestions.slice(0, 3),
            correctedSentence,
            grammarErrors: (!hasCapital || !hasPeriod) ? [{
                type: !hasCapital ? 'Capitalization' : 'Punctuation',
                original: studentWriting,
                corrected: correctedSentence,
                explanation: !hasCapital ? 'Sentences should begin with a capital letter.' : 'Sentences should end with proper punctuation like a period.'
            }] : [],
            vocabularyScore: hasDescriptive ? 8 : 6,
            structureScore: sentences.length >= 2 ? 8 : 6,
            confidence: 0.3,
        };
    }

    /**
     * 生成文法挑戰卡牌（保證多樣性，避免重複）
     * @param previousGrammar 上一次使用的文法名稱（可選），用於避免重複
     */
    async generateGrammarCard(previousGrammar?: string): Promise<GrammarChallengeCard> {
        console.log('🎴 Generating grammar challenge card, previous:', previousGrammar);

        // 從預定義清單中選擇一個不重複的文法類型
        let availableTypes = [...this.grammarTypes];
        if (previousGrammar && availableTypes.includes(previousGrammar)) {
            availableTypes = availableTypes.filter(t => t !== previousGrammar);
        }
        // 如果所有類型都用過了（理論上不會，因為有9種），則重置清單
        if (availableTypes.length === 0) {
            availableTypes = [...this.grammarTypes];
        }
        const selectedGrammar = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        console.log('Selected grammar type:', selectedGrammar);

        // 呼叫 AI 為這個文法類型生成一個簡單例句
        const examplePrompt = `You are an English teacher for 4th grade students.
Please generate ONE simple example sentence that demonstrates the grammar pattern: "${selectedGrammar}".
The sentence should be very easy to understand, suitable for a 9-10 year old child.
Return ONLY the sentence as plain text, no extra explanation.`;

        let exampleSentence = '';
        try {
            const adaptedURL = this.getAdaptedURL(this.baseURL);
            const response = await fetch(`${adaptedURL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: examplePrompt }),
            });
            if (response.ok) {
                const data = await response.json();
                exampleSentence = (data.response || data.choices?.[0]?.message?.content || data.result || '').trim();
                // 清理可能的引號或標記
                exampleSentence = exampleSentence.replace(/^["']|["']$/g, '');
            }
        } catch (error) {
            console.warn('AI example generation failed, using fallback example', error);
        }

        // 如果 AI 沒有返回有效例句，使用備用例句
        if (!exampleSentence) {
            const fallbackExamples: Record<string, string> = {
                'to be (is/am/are) 肯定句': 'I am a student.',
                'to have (has/have) 表示擁有': 'I have a pencil.',
                '一般現在式 (Simple Present) 習慣/事實': 'I go to school by bus.',
                '現在進行式 (Present Continuous) 正在做': 'I am reading a book now.',
                '一般過去式 (Simple Past) 常見動詞': 'I watched TV yesterday.',
                '將來式 (Future: will / going to)': 'I will call you later.',
                '比較級 (Comparatives)': 'Tom is taller than John.',
                'There is / There are': 'There is a book on the desk.',
                '連接詞 (and / but / so / because)': 'I like apples and oranges.'
            };
            exampleSentence = fallbackExamples[selectedGrammar] || 'She is happy.';
        }

        return {
            grammarName: selectedGrammar,
            exampleSentence: exampleSentence,
            bonusPoints: 10,
        };
    }
}

export const writingAIService = new WritingAIService();

export const formatGrammarErrors = (errors: GrammarError[]): string => {
    if (!errors || errors.length === 0) return '';
    return errors.map(e => `• ${e.type}: "${e.original}" → "${e.corrected}"\n  ${e.explanation}`).join('\n\n');
};

export const calculateOverallScore = (analysis: WritingAnalysis): number => {
    const weights = { mainScore: 0.6, vocabulary: 0.2, structure: 0.2 };
    const vocabScore = (analysis.vocabularyScore || 7) * 10;
    const structScore = (analysis.structureScore || 7) * 10;
    return Math.round(analysis.score * weights.mainScore + vocabScore * weights.vocabulary + structScore * weights.structure);
};