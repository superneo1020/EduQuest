// services/ClawAIService.ts

// ============ 類型定義 ============

export interface AnimalFact {
    animalName: string;
    funFact: string;
    habitat: string;
    diet: string;
    specialFeature: string;
    conservationStatus: 'safe' | 'vulnerable' | 'endangered';
}

export interface AIQuestion {
    id: string;
    description: string;
    hint: string;
    targetAnimal: string;
    targetIcon: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'habitat' | 'feature' | 'diet' | 'appearance';
}

export interface AIFeedback {
    isCorrect: boolean;
    message: string;
    funFact: string;
    encouragement: string;
    nextHint: string;
    scoreChange: number;
}

export interface LearningProgress {
    animalsLearned: string[];
    correctAnswers: number;
    totalQuestions: number;
    currentStreak: number;
    bestStreak: number;
    level: number;
}

// ============ 動物知識庫 (恐龍已替換為袋鼠) ============

const ANIMAL_KNOWLEDGE_BASE: Record<string, AnimalFact> = {
    'Bear': {
        animalName: '熊',
        funFact: '🐻 熊可以跑得比奧運選手還快，時速可達40公里！而且牠們是非常厲害的游泳健將。',
        habitat: '森林、山區和北極地區',
        diet: '雜食性動物，愛吃漿果、魚類、昆蟲和蜂蜜',
        specialFeature: '熊的嗅覺比人類靈敏100倍，可以聞到20公里外的食物！',
        conservationStatus: 'vulnerable'
    },
    'Bunny': {
        animalName: '兔子',
        funFact: '🐰 兔子的牙齒永遠不會停止生長，每年長約7.5公分！所以牠們需要一直啃東西來磨牙。',
        habitat: '草原、草地和森林',
        diet: '草食性動物，愛吃草、樹葉和蔬菜',
        specialFeature: '兔子可以跳高1公尺、跳遠3公尺，而且後腿非常有力！',
        conservationStatus: 'safe'
    },
    'Penguin': {
        animalName: '企鵝',
        funFact: '🐧 企鵝是一夫一妻制的動物，牠們會輪流照顧蛋和寶寶。在水裡可以憋氣20分鐘！',
        habitat: '南半球，特別是南極洲',
        diet: '肉食性動物，愛吃魚、磷蝦和魷魚',
        specialFeature: '企鵝有特殊的腺體可以過濾海水中的鹽分！',
        conservationStatus: 'vulnerable'
    },
    'Kangaroo': {  // 原 Dinosaur 替換為 Kangaroo
        animalName: '袋鼠',
        funFact: '🦘 袋鼠是跳躍高手，一次可以跳遠9公尺、跳高3公尺！牠們的育兒袋用來照顧小寶寶。',
        habitat: '澳洲的草原和沙漠',
        diet: '草食性動物，愛吃草和樹葉',
        specialFeature: '袋鼠不會倒退走路，國徽上也有牠們的身影！',
        conservationStatus: 'safe'
    },
    'Fox': {
        animalName: '狐狸',
        funFact: '🦊 狐狸會利用地球磁場來獵食，就像內建了GPS導航系統！牠們可以發出40多種不同的聲音。',
        habitat: '森林、沙漠、山區，甚至城市裡',
        diet: '雜食性動物，吃小型動物、水果和昆蟲',
        specialFeature: '狐狸的聽力超級好，可以聽到100公尺外老鼠走路的聲音！',
        conservationStatus: 'safe'
    },
    'Panda': {
        animalName: '熊貓',
        funFact: '🐼 熊貓每天要花14個小時吃竹子，一天可以吃掉12-38公斤！新生熊貓寶寶比一條奶油還小。',
        habitat: '中國的竹林',
        diet: '草食性動物，99%的食物是竹子',
        specialFeature: '熊貓有「第六根手指」，其實是特化的腕骨，用來幫助抓握竹子！',
        conservationStatus: 'vulnerable'
    },
    'Koala': {
        animalName: '無尾熊',
        funFact: '🐨 無尾熊每天睡20個小時，因為尤加利葉的能量很低。牠們的指紋和人類幾乎一模一樣！',
        habitat: '澳洲的尤加利樹林',
        diet: '草食性動物，只吃尤加利葉',
        specialFeature: '小無尾熊會吃媽媽的糞便來獲取消化尤加利葉的細菌！',
        conservationStatus: 'vulnerable'
    },
    'Monkey': {
        animalName: '猴子',
        funFact: '🐒 猴子和人類一樣有對生拇指，可以抓握樹枝和工具。牠們會用石頭敲開堅果！',
        habitat: '熱帶雨林和草原',
        diet: '雜食性動物，愛吃水果、堅果、昆蟲和小動物',
        specialFeature: '猴子會互相理毛不只是為了清潔，更是增進感情的方式！',
        conservationStatus: 'vulnerable'
    },
    'Elephant': {
        animalName: '大象',
        funFact: '🐘 大象是唯一不會跳躍的哺乳動物，但是牠們非常擅長游泳！象鼻有超過4萬條肌肉。',
        habitat: '草原、森林和草地',
        diet: '草食性動物，每天吃150公斤的植物',
        specialFeature: '大象可以在鏡子中認出自己，擁有高度的自我認知能力！',
        conservationStatus: 'endangered'
    },
    'Giraffe': {
        animalName: '長頸鹿',
        funFact: '🦒 長頸鹿和人類一樣只有7節頸椎，只是每一節都很長！牠們的舌頭有45公分長，而且是紫色的。',
        habitat: '非洲草原',
        diet: '草食性動物，愛吃金合歡樹葉',
        specialFeature: '長頸鹿每天只需要睡30分鐘！',
        conservationStatus: 'vulnerable'
    }
};

// ============ AI 題庫 (無須修改，因為原本沒有恐龍題目) ============

const QUESTION_BANK: AIQuestion[] = [
    { id: 'habitat-1', description: '🌊 哪種動物會游泳，而且生活在南極的冰天雪地裡？', hint: '牠穿著黑色的燕尾服，走路搖搖擺擺', targetAnimal: 'Penguin', targetIcon: '🐧', difficulty: 'easy', category: 'habitat' },
    { id: 'habitat-2', description: '🌴 哪種動物最愛吃竹子，住在中國的竹林裡？', hint: '牠是黑白色的，被稱為中國的國寶', targetAnimal: 'Panda', targetIcon: '🐼', difficulty: 'easy', category: 'habitat' },
    { id: 'habitat-3', description: '🦒 哪種動物脖子特別長，住在非洲的大草原上？', hint: '牠可以吃到樹頂的葉子', targetAnimal: 'Giraffe', targetIcon: '🦒', difficulty: 'easy', category: 'habitat' },
    { id: 'habitat-4', description: '🐨 哪種動物最愛睡覺，住在澳洲的尤加利樹林裡？', hint: '牠每天睡20個小時，只吃尤加利葉', targetAnimal: 'Koala', targetIcon: '🐨', difficulty: 'medium', category: 'habitat' },
    { id: 'habitat-5', description: '🐘 哪種動物體型最大，喜歡在非洲的河裡玩水？', hint: '牠有長長的鼻子和大耳朵', targetAnimal: 'Elephant', targetIcon: '🐘', difficulty: 'easy', category: 'habitat' },
    { id: 'feature-1', description: '🐰 哪種動物有長長的耳朵，喜歡跳來跳去？', hint: '牠愛吃紅蘿蔔，毛茸茸的很可愛', targetAnimal: 'Bunny', targetIcon: '🐰', difficulty: 'easy', category: 'feature' },
    { id: 'feature-2', description: '🦊 哪種動物有一條蓬鬆的大尾巴，毛色是橘紅色的？', hint: '牠非常聰明，常出現在童話故事裡', targetAnimal: 'Fox', targetIcon: '🦊', difficulty: 'medium', category: 'feature' },
    { id: 'feature-3', description: '🐒 哪種動物會爬樹，還有一條長長的尾巴？', hint: '牠最喜歡吃香蕉，很會模仿人類的動作', targetAnimal: 'Monkey', targetIcon: '🐒', difficulty: 'easy', category: 'feature' },
    { id: 'feature-4', description: '🐻 哪種動物體型龐大，全身覆蓋著厚厚的棕色毛髮？', hint: '牠最愛吃蜂蜜和魚，冬天會冬眠', targetAnimal: 'Bear', targetIcon: '🐻', difficulty: 'medium', category: 'feature' },
    { id: 'diet-1', description: '🍌 哪種動物最喜歡吃香蕉？', hint: '牠很會爬樹，喜歡在樹林間盪來盪去', targetAnimal: 'Monkey', targetIcon: '🐒', difficulty: 'easy', category: 'diet' },
    { id: 'diet-2', description: '🍯 哪種動物最愛吃蜂蜜？', hint: '牠會去搗毀蜂窩，不害怕被蜜蜂叮', targetAnimal: 'Bear', targetIcon: '🐻', difficulty: 'medium', category: 'diet' },
    { id: 'diet-3', description: '🐟 哪種動物最擅長抓魚吃？', hint: '牠住在南極，雖然是鳥但不會飛', targetAnimal: 'Penguin', targetIcon: '🐧', difficulty: 'medium', category: 'diet' },
    { id: 'diet-4', description: '🎋 哪種動物每天要吃14小時的竹子？', hint: '牠的毛色是黑白相間的', targetAnimal: 'Panda', targetIcon: '🐼', difficulty: 'easy', category: 'diet' },
    { id: 'ability-1', description: '🏃 哪種動物跑得最快，時速可達100公里？', hint: '牠是橘紅色的，很會躲避獵人', targetAnimal: 'Fox', targetIcon: '🦊', difficulty: 'hard', category: 'feature' },
    { id: 'ability-2', description: '🏊 哪種動物雖然體型龐大，但是非常擅長游泳？', hint: '牠用長鼻子當作通氣管在水裡呼吸', targetAnimal: 'Elephant', targetIcon: '🐘', difficulty: 'medium', category: 'feature' },
    { id: 'ability-3', description: '🦘 哪種動物跳得最高最遠？', hint: '牠有強壯的後腿和一個育兒袋', targetAnimal: 'Kangaroo', targetIcon: '🦘', difficulty: 'easy', category: 'feature' },
    { id: 'ability-4', description: '🌳 哪種動物能夠輕鬆爬到最高的樹上吃樹葉？', hint: '牠是全世界最高的陸地動物', targetAnimal: 'Giraffe', targetIcon: '🦒', difficulty: 'medium', category: 'feature' }
];

class ClawAIService {
    private learningProgress: LearningProgress;
    private currentQuestion: AIQuestion | null;
    private usedQuestionIds: Set<string>;

    constructor() {
        this.learningProgress = {
            animalsLearned: [],
            correctAnswers: 0,
            totalQuestions: 0,
            currentStreak: 0,
            bestStreak: 0,
            level: 1
        };
        this.currentQuestion = null;
        this.usedQuestionIds = new Set();
    }

    public resetGame(): void {
        this.learningProgress = {
            animalsLearned: [],
            correctAnswers: 0,
            totalQuestions: 0,
            currentStreak: 0,
            bestStreak: 0,
            level: 1
        };
        this.usedQuestionIds.clear();
        this.currentQuestion = null;
    }

    public generateQuestionWithAvailableAnimals(availableAnimalNames: string[]): AIQuestion {
        let availableQuestions = QUESTION_BANK.filter(q =>
            availableAnimalNames.includes(q.targetAnimal)
        );

        if (availableQuestions.length === 0) {
            console.warn('No matching question for available animals, using full bank');
            availableQuestions = [...QUESTION_BANK];
        }

        if (this.learningProgress.level <= 2) {
            availableQuestions = availableQuestions.filter(q => q.difficulty === 'easy');
        } else if (this.learningProgress.level <= 4) {
            availableQuestions = availableQuestions.filter(q => q.difficulty !== 'hard');
        }

        const recentQuestions = Array.from(this.usedQuestionIds).slice(-5);
        let filtered = availableQuestions.filter(q => !recentQuestions.includes(q.id));
        if (filtered.length === 0) {
            this.usedQuestionIds.clear();
            filtered = availableQuestions;
        }

        const randomIndex = Math.floor(Math.random() * filtered.length);
        const newQuestion = { ...filtered[randomIndex] };
        this.usedQuestionIds.add(newQuestion.id);
        this.currentQuestion = newQuestion;
        return newQuestion;
    }

    public generateQuestion(): AIQuestion {
        const allAnimals = Object.keys(ANIMAL_KNOWLEDGE_BASE);
        return this.generateQuestionWithAvailableAnimals(allAnimals);
    }

    public getCurrentQuestion(): AIQuestion | null {
        return this.currentQuestion;
    }

    public async checkAnswer(caughtAnimalName: string): Promise<AIFeedback> {
        if (!this.currentQuestion) {
            this.currentQuestion = this.generateQuestion();
        }

        const isCorrect = caughtAnimalName === this.currentQuestion.targetAnimal;
        this.learningProgress.totalQuestions++;

        let scoreChange = 0;
        let message = '';
        let funFact = '';
        let encouragement = '';
        let nextHint = '';

        if (isCorrect) {
            this.learningProgress.correctAnswers++;
            this.learningProgress.currentStreak++;
            if (this.learningProgress.currentStreak > this.learningProgress.bestStreak) {
                this.learningProgress.bestStreak = this.learningProgress.currentStreak;
            }

            const difficultyMultiplier =
                this.currentQuestion.difficulty === 'easy' ? 1 :
                    this.currentQuestion.difficulty === 'medium' ? 1.5 : 2;
            const streakBonus = Math.min(10, Math.floor(this.learningProgress.currentStreak / 2));
            scoreChange = Math.floor(15 * difficultyMultiplier) + streakBonus;

            if (!this.learningProgress.animalsLearned.includes(caughtAnimalName)) {
                this.learningProgress.animalsLearned.push(caughtAnimalName);
            }

            const newLevel = Math.floor(this.learningProgress.correctAnswers / 5) + 1;
            if (newLevel > this.learningProgress.level) this.learningProgress.level = newLevel;

            const animalFact = ANIMAL_KNOWLEDGE_BASE[caughtAnimalName];
            funFact = animalFact?.funFact || `🎉 恭喜！${this.currentQuestion.targetIcon} ${this.currentQuestion.targetAnimal} 是正確答案！`;
            message = `✅ 答對了！ +${scoreChange} 分！`;
            encouragement = this.getRandomEncouragement(true, this.learningProgress.currentStreak);
            nextHint = this.getNextHint();
        } else {
            this.learningProgress.currentStreak = 0;

            const difficultyPenalty =
                this.currentQuestion.difficulty === 'easy' ? 8 :
                    this.currentQuestion.difficulty === 'medium' ? 10 : 12;
            scoreChange = -difficultyPenalty;

            const targetFact = ANIMAL_KNOWLEDGE_BASE[this.currentQuestion.targetAnimal];
            funFact = targetFact?.funFact || `${this.currentQuestion.targetIcon} 正確答案是 ${this.currentQuestion.targetAnimal}！`;
            message = `❌ 答錯了！ ${scoreChange} 分`;
            encouragement = this.getRandomEncouragement(false, 0);
            nextHint = `💡 提示：${this.currentQuestion.hint}。目標是 ${this.currentQuestion.targetIcon} ${this.currentQuestion.targetAnimal}`;
        }

        return { isCorrect, message, funFact, encouragement, nextHint, scoreChange };
    }

    public getLearningStats() {
        const accuracy = this.learningProgress.totalQuestions > 0
            ? Math.round((this.learningProgress.correctAnswers / this.learningProgress.totalQuestions) * 100)
            : 0;
        return {
            animalsLearned: this.learningProgress.animalsLearned,
            learnedCount: this.learningProgress.animalsLearned.length,
            accuracy,
            currentStreak: this.learningProgress.currentStreak,
            bestStreak: this.learningProgress.bestStreak,
            level: this.learningProgress.level,
            totalQuestions: this.learningProgress.totalQuestions,
            correctAnswers: this.learningProgress.correctAnswers,
            totalAnimals: Object.keys(ANIMAL_KNOWLEDGE_BASE).length,
            completionPercentage: Math.round((this.learningProgress.animalsLearned.length / Object.keys(ANIMAL_KNOWLEDGE_BASE).length) * 100)
        };
    }

    private getRandomEncouragement(isCorrect: boolean, streak: number): string {
        if (isCorrect) {
            const msgs = ["🌟 太棒了！", "🎉 完美！", "📚 你真是個小小動物學家！", "⭐ 厲害！", "🏆 好表現！"];
            if (streak >= 3) return `🔥 連對 ${streak} 題！你已經是動物達人了！`;
            return msgs[Math.floor(Math.random() * msgs.length)];
        } else {
            const msgs = ["💪 沒關係！再試一次！", "🤔 仔細看提示！", "📖 每個錯誤都是學習的機會！", "🎯 加油！", "✨ 別放棄！"];
            return msgs[Math.floor(Math.random() * msgs.length)];
        }
    }

    private getNextHint(): string {
        if (this.learningProgress.currentStreak >= 5) return "🎖️ 你已經很厲害了！試試挑戰更難的題目吧！";
        if (this.learningProgress.currentStreak >= 3) return "🔥 保持專注，繼續答對可以獲得更多分數！";
        return "💡 仔細閱讀題目描述，抓住關鍵特徵！";
    }
}

export default new ClawAIService();