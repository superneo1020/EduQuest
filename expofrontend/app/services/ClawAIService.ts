// services/ClawAIService.ts

import { Config } from '../config';

// ============ 类型定义 ============

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

// ============ 动物知识库（完整版） ============

const ANIMAL_KNOWLEDGE_BASE: Record<string, AnimalFact> = {
    'Bear': {
        animalName: 'Bear',
        funFact: '🐻 Bears can run faster than Olympic sprinters, reaching speeds of 40 km/h! They are also very strong swimmers.',
        habitat: 'Forests, mountains, and the Arctic',
        diet: 'Omnivore, loves berries, fish, insects, and honey',
        specialFeature: 'A bear\'s sense of smell is 100 times better than a human\'s and can detect food from 20 km away!',
        conservationStatus: 'vulnerable'
    },
    'Bunny': {
        animalName: 'Rabbit',
        funFact: '🐰 A rabbit\'s teeth never stop growing, growing about 7.5 cm every year! That\'s why they need to constantly chew on things.',
        habitat: 'Grasslands, meadows, and forests',
        diet: 'Herbivore, loves grass, leaves, and vegetables',
        specialFeature: 'Rabbits can jump 1 meter high and 3 meters far, thanks to their powerful hind legs!',
        conservationStatus: 'safe'
    },
    'Penguin': {
        animalName: 'Penguin',
        funFact: '🐧 Penguins are mostly monogamous and take turns caring for their eggs and chicks. They can hold their breath underwater for 20 minutes!',
        habitat: 'The Southern Hemisphere, especially Antarctica',
        diet: 'Carnivore, loves fish, krill, and squid',
        specialFeature: 'Penguins have a special gland that filters salt out of seawater!',
        conservationStatus: 'vulnerable'
    },
    'Kangaroo': {
        animalName: 'Kangaroo',
        funFact: '🦘 Kangaroos are champion jumpers, covering up to 9 meters in one leap and jumping 3 meters high! Their pouch is used to carry their young.',
        habitat: 'Australian grasslands and deserts',
        diet: 'Herbivore, loves grass and leaves',
        specialFeature: 'Kangaroos cannot walk backwards and even appear on Australia\'s coat of arms!',
        conservationStatus: 'safe'
    },
    'Fox': {
        animalName: 'Fox',
        funFact: '🦊 Foxes use the Earth\'s magnetic field to hunt, like having a built-in GPS! They can make over 40 different sounds.',
        habitat: 'Forests, deserts, mountains, and even cities',
        diet: 'Omnivore, eats small animals, fruit, and insects',
        specialFeature: 'Foxes have incredible hearing and can hear a mouse walking from 100 meters away!',
        conservationStatus: 'safe'
    },
    'Panda': {
        animalName: 'Panda',
        funFact: '🐼 Pandas spend 14 hours a day eating bamboo, consuming 12-38 kg daily! A newborn panda is smaller than a stick of butter.',
        habitat: 'Bamboo forests in China',
        diet: 'Herbivore, 99% of its diet is bamboo',
        specialFeature: 'Pandas have a "sixth finger" (a modified wrist bone) to help them grip bamboo!',
        conservationStatus: 'vulnerable'
    },
    'Koala': {
        animalName: 'Koala',
        funFact: '🐨 Koalas sleep 20 hours a day because eucalyptus leaves are low in energy. Their fingerprints are almost identical to humans\'!',
        habitat: 'Eucalyptus forests in Australia',
        diet: 'Herbivore, eats only eucalyptus leaves',
        specialFeature: 'Baby koalas eat their mother\'s droppings to get the bacteria needed to digest eucalyptus leaves!',
        conservationStatus: 'vulnerable'
    },
    'Monkey': {
        animalName: 'Monkey',
        funFact: '🐒 Monkeys, like humans, have opposable thumbs for gripping branches and tools. They use stones to crack nuts!',
        habitat: 'Rainforests and grasslands',
        diet: 'Omnivore, loves fruit, nuts, insects, and small animals',
        specialFeature: 'Monkeys groom each other not just for cleanliness, but to strengthen social bonds!',
        conservationStatus: 'vulnerable'
    },
    'Elephant': {
        animalName: 'Elephant',
        funFact: '🐘 Elephants are the only mammals that cannot jump, but they are excellent swimmers! A trunk has over 40,000 muscles.',
        habitat: 'Savannas, forests, and grasslands',
        diet: 'Herbivore, eats 150 kg of plants per day',
        specialFeature: 'Elephants can recognize themselves in a mirror, showing high self-awareness!',
        conservationStatus: 'endangered'
    },
    'Giraffe': {
        animalName: 'Giraffe',
        funFact: '🦒 Giraffes have only 7 neck vertebrae like humans, but each one is very long! Their tongue is 45 cm long and purple.',
        habitat: 'African savannas',
        diet: 'Herbivore, loves acacia leaves',
        specialFeature: 'Giraffes only need 30 minutes of sleep per day!',
        conservationStatus: 'vulnerable'
    },
    'Dog': {
        animalName: 'Dog',
        funFact: '🐶 A dog\'s nose print is unique, like a human fingerprint! They can understand over 100 words.',
        habitat: 'Human homes, farms, grasslands',
        diet: 'Omnivore, loves meat, vegetables, and dog food',
        specialFeature: 'Dogs can hear high-frequency sounds that humans cannot, and their sense of smell is 10,000 times better!',
        conservationStatus: 'safe'
    },
    'Cat': {
        animalName: 'Cat',
        funFact: '🐱 Cats sleep 70% of their lives. They purr to heal their own bones and muscles.',
        habitat: 'Human homes, city alleys',
        diet: 'Carnivore, loves fish, mice, and cat food',
        specialFeature: 'A cat\'s whiskers can measure hole widths to see if they can fit through.',
        conservationStatus: 'safe'
    },
    'Lion': {
        animalName: 'Lion',
        funFact: '🦁 A lion\'s roar can be heard 8 km away! In a pride, females do the hunting while males protect the territory.',
        habitat: 'African savannas, sparse woodlands',
        diet: 'Carnivore, hunts zebras, wildebeest, and other large animals',
        specialFeature: 'The darker and fuller a male lion\'s mane, the more attractive he is to females.',
        conservationStatus: 'vulnerable'
    },
    'Tiger': {
        animalName: 'Tiger',
        funFact: '🐯 Every tiger has a unique stripe pattern, like a human fingerprint. Tigers are also strong swimmers!',
        habitat: 'Rainforests, swamps, grasslands',
        diet: 'Carnivore, hunts deer, wild boar',
        specialFeature: 'Tigers can see 6 times better than humans at night.',
        conservationStatus: 'endangered'
    },
    'Goldfish': {
        animalName: 'Goldfish',
        funFact: '🐠 A goldfish\'s memory is longer than 7 seconds; they can remember things from months ago and even recognize their owners!',
        habitat: 'Freshwater aquariums, ponds',
        diet: 'Omnivore, eats algae, small insects, and fish food',
        specialFeature: 'Goldfish can see ultraviolet and infrared light, giving them a wider visual range than humans.',
        conservationStatus: 'safe'
    },
    'Fish': {
        animalName: 'Fish',
        funFact: '🐟 Fish are the oldest vertebrates on Earth. Their scales help reduce water resistance. Some fish can glow!',
        habitat: 'Oceans, rivers, lakes',
        diet: 'Varied: herbivorous, carnivorous, and omnivorous species exist',
        specialFeature: 'Boxfish are shaped like a box, swim slowly, but have almost no natural predators.',
        conservationStatus: 'safe'
    },
    'Whale': {
        animalName: 'Whale',
        funFact: '🐳 A blue whale\'s heart is the size of a small car, and its calls can travel across entire oceans.',
        habitat: 'Deep seas, polar waters',
        diet: 'Carnivore, eats krill and small fish',
        specialFeature: 'Whales are mammals and must surface to breathe air.',
        conservationStatus: 'endangered'
    },
    'Dolphin': {
        animalName: 'Dolphin',
        funFact: '🐬 Dolphins give themselves names, using unique whistles to call each other. They sleep with only half their brain at a time.',
        habitat: 'Warm oceans, estuaries',
        diet: 'Carnivore, eats fish, squid',
        specialFeature: 'A dolphin\'s echolocation system is more precise than any human-made sonar.',
        conservationStatus: 'vulnerable'
    },
    'Butterfly': {
        animalName: 'Butterfly',
        funFact: '🦋 Butterflies taste with their feet! Their wings are actually transparent; colors come from light reflecting off scales.',
        habitat: 'Gardens, forests, fields',
        diet: 'Herbivore: larvae eat leaves, adults drink nectar',
        specialFeature: 'Monarch butterflies can migrate 4,000 km.',
        conservationStatus: 'safe'
    },
    'Bird': {
        animalName: 'Bird',
        funFact: '🐦 Birds have hollow bones to help them fly more easily. Some birds use tools to get food.',
        habitat: 'Forests, cities, wetlands',
        diet: 'Omnivore, eats seeds, insects, fruit',
        specialFeature: 'Hummingbirds are the only birds that can fly backwards.',
        conservationStatus: 'safe'
    },
    'Eagle': {
        animalName: 'Eagle',
        funFact: '🦅 Eagles have 8 times better vision than humans and can spot prey from 3 km away. Their nests can weigh up to one ton!',
        habitat: 'Mountains, cliffs, open plains',
        diet: 'Carnivore, hunts rabbits, snakes, fish',
        specialFeature: 'An eagle\'s grip strength is 10 times stronger than a human\'s.',
        conservationStatus: 'vulnerable'
    },
    'Frog': {
        animalName: 'Frog',
        funFact: '🐸 Frogs can drink through their skin and don\'t need to use their mouths! Some frogs are highly toxic; the brighter the color, the more dangerous.',
        habitat: 'Ponds, swamps, rainforests',
        diet: 'Carnivore, eats insects, spiders',
        specialFeature: 'Frogs can retract their eyes into their heads to help swallow food.',
        conservationStatus: 'vulnerable'
    }
};

// ============ 静态题库（备用，确保始终有效） ============

const QUESTION_BANK: AIQuestion[] = [
    { id: 'habitat-1', description: '🌊 Which animal can swim and lives in the icy lands of Antarctica?', hint: 'It wears a black tuxedo and waddles when it walks', targetAnimal: 'Penguin', targetIcon: '🐧', difficulty: 'easy', category: 'habitat' },
    { id: 'habitat-2', description: '🌴 Which animal loves eating bamboo the most and lives in China\'s bamboo forests?', hint: 'It is black and white and is China\'s national treasure', targetAnimal: 'Panda', targetIcon: '🐼', difficulty: 'easy', category: 'habitat' },
    { id: 'habitat-3', description: '🦒 Which animal has a very long neck and lives on the African savanna?', hint: 'It can reach leaves at the top of trees', targetAnimal: 'Giraffe', targetIcon: '🦒', difficulty: 'easy', category: 'habitat' },
    { id: 'habitat-4', description: '🐨 Which animal loves to sleep the most and lives in Australia\'s eucalyptus forests?', hint: 'It sleeps 20 hours a day and only eats eucalyptus leaves', targetAnimal: 'Koala', targetIcon: '🐨', difficulty: 'medium', category: 'habitat' },
    { id: 'habitat-5', description: '🐘 Which animal is the largest and likes to play in African rivers?', hint: 'It has a long trunk and big ears', targetAnimal: 'Elephant', targetIcon: '🐘', difficulty: 'easy', category: 'habitat' },
    { id: 'feature-1', description: '🐰 Which animal has long ears and likes to hop around?', hint: 'It loves eating carrots and is very fluffy and cute', targetAnimal: 'Bunny', targetIcon: '🐰', difficulty: 'easy', category: 'feature' },
    { id: 'feature-2', description: '🦊 Which animal has a big bushy tail and reddish-orange fur?', hint: 'It is very clever and often appears in fairy tales', targetAnimal: 'Fox', targetIcon: '🦊', difficulty: 'medium', category: 'feature' },
    { id: 'feature-3', description: '🐒 Which animal can climb trees and has a long tail?', hint: 'It loves bananas the most and is good at imitating human actions', targetAnimal: 'Monkey', targetIcon: '🐒', difficulty: 'easy', category: 'feature' },
    { id: 'feature-4', description: '🐻 Which animal is huge and covered in thick brown fur?', hint: 'It loves honey and fish the most and hibernates in winter', targetAnimal: 'Bear', targetIcon: '🐻', difficulty: 'medium', category: 'feature' },
    { id: 'diet-1', description: '🍌 Which animal likes to eat bananas the most?', hint: 'It is very good at climbing trees and loves to swing through the forest', targetAnimal: 'Monkey', targetIcon: '🐒', difficulty: 'easy', category: 'diet' },
    { id: 'diet-2', description: '🍯 Which animal loves honey the most?', hint: 'It will break into beehives and isn\'t afraid of getting stung', targetAnimal: 'Bear', targetIcon: '🐻', difficulty: 'medium', category: 'diet' },
    { id: 'diet-3', description: '🐟 Which animal is best at catching and eating fish?', hint: 'It lives in Antarctica and is a bird that cannot fly', targetAnimal: 'Penguin', targetIcon: '🐧', difficulty: 'medium', category: 'diet' },
    { id: 'diet-4', description: '🎋 Which animal spends 14 hours a day eating bamboo?', hint: 'Its fur is black and white', targetAnimal: 'Panda', targetIcon: '🐼', difficulty: 'easy', category: 'diet' },
    { id: 'ability-1', description: '🏃 Which animal runs the fastest, reaching speeds of 100 km/h?', hint: 'It is reddish-orange and very good at avoiding hunters', targetAnimal: 'Fox', targetIcon: '🦊', difficulty: 'hard', category: 'feature' },
    { id: 'ability-2', description: '🏊 Which animal is huge but very good at swimming?', hint: 'It uses its long trunk as a snorkel to breathe underwater', targetAnimal: 'Elephant', targetIcon: '🐘', difficulty: 'medium', category: 'feature' },
    { id: 'ability-3', description: '🦘 Which animal can jump the highest and farthest?', hint: 'It has strong hind legs and a pouch', targetAnimal: 'Kangaroo', targetIcon: '🦘', difficulty: 'easy', category: 'feature' },
    { id: 'ability-4', description: '🌳 Which animal can easily climb the tallest trees to eat leaves?', hint: 'It is the tallest land animal in the world', targetAnimal: 'Giraffe', targetIcon: '🦒', difficulty: 'medium', category: 'feature' },
    { id: 'new-1', description: '🐶 Which animal is human\'s best friend and goes "woof woof"?', hint: 'It likes to wag its tail and guard the house', targetAnimal: 'Dog', targetIcon: '🐶', difficulty: 'easy', category: 'feature' },
    { id: 'new-2', description: '🐱 Which animal likes to catch mice and goes "meow"?', hint: 'It is very clean and often licks its fur', targetAnimal: 'Cat', targetIcon: '🐱', difficulty: 'easy', category: 'feature' },
    { id: 'new-3', description: '🦁 Which animal is the king of the savanna, with males having a thick mane?', hint: 'Its roar can be heard from far away', targetAnimal: 'Lion', targetIcon: '🦁', difficulty: 'medium', category: 'feature' },
    { id: 'new-4', description: '🐯 Which animal has black stripes on its body and is an excellent swimmer?', hint: 'It is the top predator of the forest', targetAnimal: 'Tiger', targetIcon: '🐯', difficulty: 'medium', category: 'feature' },
    { id: 'new-5', description: '🐠 Which animal lives in an aquarium and has a golden body?', hint: 'Its memory is longer than 7 seconds', targetAnimal: 'Goldfish', targetIcon: '🐠', difficulty: 'easy', category: 'habitat' },
    { id: 'new-6', description: '🐳 Which giant sea creature sprays water and is the largest animal on Earth?', hint: 'It eats krill and has a very large mouth', targetAnimal: 'Whale', targetIcon: '🐳', difficulty: 'medium', category: 'habitat' },
    { id: 'new-7', description: '🐬 Which sea animal is very smart and can jump through hoops?', hint: 'They use whistles to call each other', targetAnimal: 'Dolphin', targetIcon: '🐬', difficulty: 'medium', category: 'feature' },
    { id: 'new-8', description: '🦋 Which insect has beautiful wings and starts life as a caterpillar?', hint: 'It uses its feet to taste nectar', targetAnimal: 'Butterfly', targetIcon: '🦋', difficulty: 'easy', category: 'feature' },
    { id: 'new-9', description: '🐦 Which animal can fly in the sky and builds nests?', hint: 'Its bones are hollow', targetAnimal: 'Bird', targetIcon: '🐦', difficulty: 'easy', category: 'feature' },
    { id: 'new-10', description: '🦅 Which bird of prey has excellent vision and can catch prey from high above?', hint: 'It is the national bird of the United States', targetAnimal: 'Eagle', targetIcon: '🦅', difficulty: 'hard', category: 'feature' },
    { id: 'new-11', description: '🐸 Which amphibian goes "ribbit" and catches pests?', hint: 'It can drink water through its skin', targetAnimal: 'Frog', targetIcon: '🐸', difficulty: 'easy', category: 'feature' }
];

// ============ 本地 AI 服务配置 ============
const LOCAL_AI_BASE_URL = Config.AI_BASE_URL || 'http://127.0.0.1:8000';
const LOCAL_AI_MODEL = Config.AI_MODEL_NAME || 'gemma';
const AI_ENABLED = Config.AI_ENABLED !== false;

/**
 * 调用本地 AI 服务生成题目（增强版，自动修复不完整 JSON）
 */
async function callLocalAIForQuestion(availableAnimals: string[]): Promise<{ description: string; hint: string; targetAnimal: string; targetIcon: string } | null> {
    if (!AI_ENABLED) {
        console.log('AI service disabled, using fallback');
        return null;
    }

    const prompt = `You are a children's animal science expert. Please randomly select one animal from the following list: ${availableAnimals.join(', ')}.
Generate a fun question suitable for children ages 6–10, with the following requirements:
- description: A question description with a 🎯 or 🐾 emoji, without directly naming the animal. (completed sentence)
- hint: A short clue that hints at the animal's characteristics (e.g., appearance, food, habitat).
- targetAnimal: The animal's English name (capitalized first letter), e.g., "Dog".
- targetIcon: The corresponding emoji for that animal (e.g., 🐶).

Output must be in JSON format:
{
  "description": "...",
  "hint": "...",
  "targetAnimal": "...",
  "targetIcon": "..."
}`;

    try {
        const response = await fetch(`${LOCAL_AI_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                model: LOCAL_AI_MODEL
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Local AI error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const aiResponseText = data.response || data.choices?.[0]?.message?.content || data.result;
        if (!aiResponseText) throw new Error('Invalid response format');

        // 清理可能的 markdown 标记，并提取 JSON
        let cleaned = aiResponseText.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) cleaned = cleaned.slice(1, -1);
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        } else {
            throw new Error('No JSON object found in response');
        }

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            // 尝试修复常见问题：补全缺失的引号或括号
            let repaired = cleaned;
            if (!repaired.endsWith('}')) repaired += '}';
            if (!repaired.includes('"description"')) repaired = repaired.replace('{', '{"description": "Guess the animal!",');
            if (!repaired.includes('"hint"')) repaired = repaired.replace('}', ',"hint": "It\'s an animal."}');
            parsed = JSON.parse(repaired);
        }

        // 验证并补全缺失字段
        const targetAnimal = parsed.targetAnimal || (availableAnimals.length > 0 ? availableAnimals[0] : 'Dog');
        if (!ANIMAL_KNOWLEDGE_BASE[targetAnimal] && availableAnimals.length > 0) {
            // 如果返回的动物不在知识库中，使用第一个可用动物
            const fallbackAnimal = availableAnimals[0];
            return {
                description: parsed.description || `🐾 Which animal is this?`,
                hint: parsed.hint || `It's a ${fallbackAnimal.toLowerCase()}.`,
                targetAnimal: fallbackAnimal,
                targetIcon: parsed.targetIcon || ALL_ANIMAL_TYPES.find(a => a.name === fallbackAnimal)?.icon || '🐾'
            };
        }

        return {
            description: parsed.description || `🐾 Which animal is this?`,
            hint: parsed.hint || `It's a ${targetAnimal.toLowerCase()}.`,
            targetAnimal: targetAnimal,
            targetIcon: parsed.targetIcon || ANIMAL_KNOWLEDGE_BASE[targetAnimal]?.specialFeature?.charAt(0) || '🐾'
        };
    } catch (error) {
        console.error('Local AI call failed:', error);
        return null;
    }
}

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

    // 同步方法：从静态题库根据可用动物和难度生成题目（备用）
    public generateQuestionWithAvailableAnimals(availableAnimalNames: string[]): AIQuestion {
        let availableQuestions = QUESTION_BANK.filter(q =>
            availableAnimalNames.includes(q.targetAnimal)
        );

        if (availableQuestions.length === 0) {
            console.warn('No matching question for available animals, using full bank');
            availableQuestions = [...QUESTION_BANK];
        }

        // 根据学习等级过滤难度
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

    // 原有的同步生成（全部动物）
    public generateQuestion(): AIQuestion {
        const allAnimals = Object.keys(ANIMAL_KNOWLEDGE_BASE);
        return this.generateQuestionWithAvailableAnimals(allAnimals);
    }

    // 🧠 异步 AI 出题（优先使用本地 AI，失败则降级为静态）
    public async generateQuestionAsync(availableAnimalNames: string[]): Promise<AIQuestion> {
        // 尝试调用本地 AI
        const aiResult = await callLocalAIForQuestion(availableAnimalNames);
        if (aiResult && aiResult.targetAnimal && aiResult.description && aiResult.hint) {
            const newQuestion: AIQuestion = {
                id: `localai-${Date.now()}-${Math.random()}`,
                description: aiResult.description,
                hint: aiResult.hint,
                targetAnimal: aiResult.targetAnimal,
                targetIcon: aiResult.targetIcon,
                difficulty: 'medium',
                category: 'feature',
            };
            this.currentQuestion = newQuestion;
            this.usedQuestionIds.add(newQuestion.id);
            return newQuestion;
        }
        // 降级到静态题库
        return this.generateQuestionWithAvailableAnimals(availableAnimalNames);
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
            funFact = animalFact?.funFact || `🎉 Congratulations!${this.currentQuestion.targetIcon} ${this.currentQuestion.targetAnimal} 是正确答案！`;
            message = `✅ You got it right! +${scoreChange} point!`;
            encouragement = this.getRandomEncouragement(true, this.learningProgress.currentStreak);
            nextHint = this.getNextHint();
        } else {
            this.learningProgress.currentStreak = 0;

            const difficultyPenalty =
                this.currentQuestion.difficulty === 'easy' ? 8 :
                    this.currentQuestion.difficulty === 'medium' ? 10 : 12;
            scoreChange = -difficultyPenalty;

            const targetFact = ANIMAL_KNOWLEDGE_BASE[this.currentQuestion.targetAnimal];
            funFact = targetFact?.funFact || `${this.currentQuestion.targetIcon} The correct answer is ${this.currentQuestion.targetAnimal}！`;
            message = `❌ Wrong answer! ${scoreChange} score`;
            encouragement = this.getRandomEncouragement(false, 0);
            nextHint = `💡hint：${this.currentQuestion.hint}.The goal is ${this.currentQuestion.targetIcon} ${this.currentQuestion.targetAnimal}`;
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
            const msgs = ["🌟 marvelous!", "🎉 Perfect！", "📚 You're such a little zoologist!！", "⭐ sharp！", "🏆 Good performance！"];
            if (streak >= 3) return `🔥  ${streak} question！You're already an animal expert！`;
            return msgs[Math.floor(Math.random() * msgs.length)];
        } else {
            const msgs = ["💪 It's okay! Try again!", "🤔 Read the instructions carefully!", "📖 Every mistake is a learning opportunity.！", "🎯 Keep going!", "✨ Don't give up!"];
            return msgs[Math.floor(Math.random() * msgs.length)];
        }
    }

    private getNextHint(): string {
        if (this.learningProgress.currentStreak >= 5) return "🎖️ You're already amazing! Try some harder questions!";
        if (this.learningProgress.currentStreak >= 3) return "🔥 Stay focused, and you can earn more points by answering correctly!";
        return "💡 Read the question description carefully and grasp the key features!";
    }
}

export default new ClawAIService();