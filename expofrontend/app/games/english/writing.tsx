// app/english/writing.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createGameMetadata, GameMetadata } from '../../../types/GameMetadata';
import { convertToBackendMetadata } from '../../utils/metadataConverter';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
    StatusBar,
    ImageSourcePropType,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';
import { writingAIService, calculateOverallScore, WritingAnalysis, GrammarChallengeCard } from '../../services/WritingAIService';

const { width: screenWidth } = Dimensions.get('window');

// ==================== 本地圖片 Import ====================
import hikingImg from '../../../assets/images/writing/hiking.jpg';
import cityImg from '../../../assets/images/writing/city.jpg';
import basketballImg from '../../../assets/images/writing/basketball.webp';
import shoppingMallImg from '../../../assets/images/writing/shopping_mall.webp';
import restaurantImg from '../../../assets/images/writing/restaurant.jpeg';
import playgroundImg from '../../../assets/images/writing/playground.webp';

// ==================== 類型定義 ====================
type Difficulty = 'easy' | 'hard';
type Scene = {
    id: string;
    title: string;
    image: ImageSourcePropType;
    description: string;
    prompt: string;
    category: string;
    wordLimit: number;
    difficulty: string;
    keywords: string[];
};

type DifficultyConfig = {
    label: string;
    wordLimit: number;
    description: string;
    color: string;
    bgColor: string;
    icon: string;
    badgeText: string;
    maxScore: number;
};

// ==================== 難度配置 ====================
const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    easy: {
        label: 'Easy',
        wordLimit: 40,
        description: 'Write a simple description with basic vocabulary',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        icon: '📝',
        badgeText: 'Basic',
        maxScore: 100
    },
    hard: {
        label: 'Hard',
        wordLimit: 60,
        description: 'Write a complex description with rich vocabulary',
        color: '#F44336',
        bgColor: '#FFEBEE',
        icon: '🚀',
        badgeText: 'Challenge',
        maxScore: 120
    }
};

// ==================== 本地場景資料庫 ====================
const imageScenes: Scene[] = [
    {
        id: '1',
        title: 'Mountain Hiking',
        image: hikingImg,
        description: 'People hiking on a beautiful mountain trail with breathtaking views',
        prompt: 'Describe this mountain hiking scene. What do you see? How do the hikers feel?',
        category: 'Outdoor',
        wordLimit: 30,
        difficulty: 'Easy',
        keywords: ['mountain', 'hiking', 'nature', 'trail', 'adventure', 'scenery']
    },
    {
        id: '2',
        title: 'City Street',
        image: cityImg,
        description: 'A bustling city street with tall buildings and busy traffic',
        prompt: 'Describe the busy city scene. What is happening around? What can you hear?',
        category: 'Urban',
        wordLimit: 30,
        difficulty: 'Medium',
        keywords: ['city', 'buildings', 'traffic', 'busy', 'urban', 'street']
    },
    {
        id: '3',
        title: 'Basketball Game',
        image: basketballImg,
        description: 'Exciting basketball game with players competing on the court',
        prompt: 'Describe the basketball game. What is happening? How do the players feel?',
        category: 'Sports',
        wordLimit: 30,
        difficulty: 'Medium',
        keywords: ['basketball', 'sports', 'game', 'players', 'court', 'competition']
    },
    {
        id: '4',
        title: 'Shopping Mall',
        image: shoppingMallImg,
        description: 'A modern shopping mall with many stores and shoppers',
        prompt: 'Describe the shopping mall scene. What can you see and buy?',
        category: 'Shopping',
        wordLimit: 30,
        difficulty: 'Easy',
        keywords: ['mall', 'shopping', 'stores', 'shoppers', 'modern', 'busy']
    },
    {
        id: '5',
        title: 'Cozy Restaurant',
        image: restaurantImg,
        description: 'A warm and cozy restaurant with people enjoying their meals',
        prompt: 'Describe the restaurant atmosphere. What do you see and smell?',
        category: 'Food',
        wordLimit: 30,
        difficulty: 'Easy',
        keywords: ['restaurant', 'food', 'dining', 'cozy', 'atmosphere', 'meal']
    },
    {
        id: '6',
        title: 'Children\'s Playground',
        image: playgroundImg,
        description: 'Kids playing happily at a colorful playground with slides and swings',
        prompt: 'Describe the playground scene. What are the children doing?',
        category: 'Playground',
        wordLimit: 30,
        difficulty: 'Medium',
        keywords: ['playground', 'children', 'playing', 'slides', 'swings', 'fun']
    }
];

// ==================== 輔助函數：格式化時間 ====================
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ==================== 主元件 ====================
export default function WritingScreen() {
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    // 防重複提交鎖
    const isCompletingRef = useRef(false);

    // 狀態管理
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [writing, setWriting] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [history, setHistory] = useState<Array<{
        sceneTitle: string;
        writing: string;
        score: number;
        date: string;
    }>>([]);
    const [showSceneSelector, setShowSceneSelector] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [sessionHistory, setSessionHistory] = useState<Array<{
        sceneTitle: string;
        writing: string;
        score: number;
        date: string;
    }>>([]);

    // 文法挑戰卡牌相關狀態
    const [challengeCard, setChallengeCard] = useState<GrammarChallengeCard | null>(null);
    const [challengeCompleted, setChallengeCompleted] = useState(false);
    const [isDrawingCard, setIsDrawingCard] = useState(false);
    const [bonusEarned, setBonusEarned] = useState(false);
    const [lastGrammarName, setLastGrammarName] = useState<string>('');

    // ==================== 計時器相關狀態 ====================
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [finalElapsedSeconds, setFinalElapsedSeconds] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    // 紀錄最終時間的 ref（確保儲存時不會因 React 狀態異步而遺失）
    const finalTimeRef = useRef<number>(0);

    // ✅ 新增：專門給總結頁面顯示的最終時間（同步設定）
    const [summaryTime, setSummaryTime] = useState(0);

    const textInputRef = useRef<TextInput>(null);

    // ==================== 計時器控制函數 ====================
    const startTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setElapsedSeconds(0);
        finalTimeRef.current = 0;
        startTimeRef.current = Date.now();
        timerIntervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
                const now = Date.now();
                const seconds = Math.floor((now - startTimeRef.current) / 1000);
                setElapsedSeconds(seconds);
            }
        }, 1000);
    };

    const stopTimer = (): number => {
        let finalSeconds = 0;
        if (startTimeRef.current) {
            finalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        startTimeRef.current = null;
        setFinalElapsedSeconds(finalSeconds);
        setElapsedSeconds(finalSeconds);
        finalTimeRef.current = finalSeconds;
        return finalSeconds;
    };

    const resetAndStartTimer = () => {
        stopTimer();
        startTimer();
    };

    // 清理計時器
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    // 當進入寫作界面時開始計時，離開時停止
    useEffect(() => {
        if (difficulty && currentScene && !isFinished) {
            resetAndStartTimer();
        } else if (isFinished) {
            stopTimer();
        } else {
            stopTimer();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [difficulty, currentScene, isFinished]);

    // ==================== 輔助函數 ====================
    const saveScore = async (score: number, totalSeconds: number) => {
        if (!token || !difficulty) return;
        if (isCompletingRef.current) {
            console.log("saveScore already in progress, skip");
            return;
        }
        isCompletingRef.current = true;
        setIsSaving(true);
        try {
            const gameData = {
                gameName: "Writing Game",
                scores: score,
                gameType: "ENGLISH",
                gameDifficulty: difficulty === 'easy' ? 'EASY' : 'HARD'
            };

            const questionsData = [{
                id: 1,
                question: currentScene?.prompt || 'Write about the scene',
                correctAnswer: 'User writing response',
                userAnswer: writing,
                isCorrect: score > 0,
                questionType: 'writing',
                timeSpent: totalSeconds,   // ✅ 修复：使用实际总用时
            }];

            const totalTimeSeconds = totalSeconds;
            const totalTimeFormatted = formatTime(totalTimeSeconds);

            const metadata: GameMetadata = createGameMetadata(
                gameData.gameType,
                gameData.gameDifficulty,
                score,
                {
                    totalWords: wordCount,
                    correctWords: score,
                    totalTimeSeconds: totalTimeSeconds,
                    totalTimeFormatted: totalTimeFormatted,
                },
                questionsData
            );

            const backendRequest = {
                gameName: gameData.gameName,
                scores: gameData.scores,
                metadata: convertToBackendMetadata(metadata)
            };

            await axios.post('http://localhost:8080/api/user/game/score', backendRequest, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Score synced to server!");
        } catch (e) {
            console.error("Failed to sync score:", e);
        } finally {
            setIsSaving(false);
            setTimeout(() => {
                isCompletingRef.current = false;
            }, 500);
        }
    };

    const getScenesByDifficulty = (diff: Difficulty): Scene[] => {
        return imageScenes.filter(scene => {
            if (diff === 'easy') return scene.difficulty.toLowerCase() === 'easy';
            if (diff === 'hard') return scene.difficulty.toLowerCase() === 'medium' || scene.difficulty.toLowerCase() === 'hard';
            return false;
        });
    };

    const handleDrawChallengeCard = async () => {
        if (isDrawingCard) return;
        setIsDrawingCard(true);
        try {
            const card = await writingAIService.generateGrammarCard(lastGrammarName);
            setChallengeCard(card);
            setChallengeCompleted(false);
            setLastGrammarName(card.grammarName);
        } catch (error) {
            console.warn('AI card generation failed, using fallback', error);
            const fallbackCard: GrammarChallengeCard = {
                grammarName: 'to be (is/am/are) 肯定句',
                exampleSentence: 'I am a student.',
                bonusPoints: 10,
            };
            setChallengeCard(fallbackCard);
            setChallengeCompleted(false);
            setLastGrammarName(fallbackCard.grammarName);
        } finally {
            setIsDrawingCard(false);
        }
    };

    const handleRegenerateCard = () => {
        if (isDrawingCard) return;
        handleDrawChallengeCard();
    };

    const handleSkipChallenge = () => {
        setChallengeCard(null);
        setChallengeCompleted(false);
        setBonusEarned(false);
    };

    const checkGrammarUsage = (writingText: string, card: GrammarChallengeCard): boolean => {
        const grammarLower = card.grammarName.toLowerCase();
        const example = card.exampleSentence.toLowerCase();

        if (grammarLower.includes('to be') && grammarLower.includes('肯定')) {
            return /\b(am|is|are)\b/.test(writingText);
        }
        if (grammarLower.includes('to have') || grammarLower.includes('has/have')) {
            return /\b(have|has)\b/.test(writingText);
        }
        if (grammarLower.includes('一般現在式') || grammarLower.includes('simple present')) {
            return /\b(go|like|play|eat|run|sleep|read|write|watch)\b/i.test(writingText);
        }
        if (grammarLower.includes('現在進行式') || grammarLower.includes('present continuous')) {
            return /\b(am|is|are)\s+\w+ing\b/.test(writingText);
        }
        if (grammarLower.includes('過去式') || grammarLower.includes('simple past')) {
            return /\b(watched|went|ate|played|ran|slept|read|wrote|did|had)\b/i.test(writingText);
        }
        if (grammarLower.includes('將來式') || grammarLower.includes('future')) {
            return /\b(will|going to)\b/.test(writingText);
        }
        if (grammarLower.includes('比較級') || grammarLower.includes('comparatives')) {
            return /\b(taller|bigger|smaller|faster|slower|more beautiful)\b/.test(writingText);
        }
        if (grammarLower.includes('there is') || grammarLower.includes('there are')) {
            return /\bthere (is|are)\b/.test(writingText);
        }
        if (grammarLower.includes('連接詞') || grammarLower.includes('conjunction')) {
            return /\b(and|but|so|because)\b/.test(writingText);
        }
        const keywords = example.split(/\s+/).filter(w => w.length > 3);
        for (let kw of keywords) {
            if (writingText.toLowerCase().includes(kw.toLowerCase())) return true;
        }
        return false;
    };

    const selectDifficulty = (diff: Difficulty) => {
        setDifficulty(diff);
        const scenes = getScenesByDifficulty(diff);
        if (scenes.length > 0) setCurrentScene(scenes[0]);
        setWriting('');
        setWordCount(0);
        setAnalysis(null);
        setShowAnalysis(false);
        setChallengeCard(null);
        setChallengeCompleted(false);
        setIsDrawingCard(false);
        setBonusEarned(false);
        setLastGrammarName('');
        stopTimer();
        setElapsedSeconds(0);
        setFinalElapsedSeconds(0);
        setSummaryTime(0); // ✅ 重置總結時間
        setTimeout(() => textInputRef.current?.focus(), 100);
    };

    const handleTextChange = (text: string) => {
        setWriting(text);
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    };

    const selectScene = (scene: Scene) => {
        setCurrentScene(scene);
        setWriting('');
        setWordCount(0);
        setAnalysis(null);
        setShowAnalysis(false);
        setShowSceneSelector(false);
        setChallengeCard(null);
        setChallengeCompleted(false);
        setIsDrawingCard(false);
        setBonusEarned(false);
        stopTimer();
        setElapsedSeconds(0);
        setFinalElapsedSeconds(0);
        startTimer();
        textInputRef.current?.focus();
    };

    const handleAnalyze = async () => {
        if (!currentScene || !difficulty) return;
        if (writing.trim().length === 0) {
            Alert.alert('Empty Writing', 'Please write something before analyzing.');
            return;
        }
        const wordLimit = DIFFICULTY_CONFIG[difficulty].wordLimit;
        if (wordCount < 5) {
            Alert.alert('Too Short', 'Please write at least 5 words for meaningful analysis.');
            return;
        }
        if (wordCount > wordLimit) {
            Alert.alert('Exceeded Limit', `You wrote ${wordCount} words, but the limit for ${difficulty} level is ${wordLimit}. Try to make it shorter.`);
            return;
        }

        setIsAnalyzing(true);
        try {
            const result = await writingAIService.analyzeWriting(
                writing,
                currentScene.prompt,
                {
                    imageDescription: currentScene.description,
                    category: currentScene.category,
                    wordLimit: wordLimit
                }
            );

            let finalOverallScore = result.score;
            let grammarUsed = false;

            if (challengeCard && !challengeCompleted) {
                grammarUsed = checkGrammarUsage(writing, challengeCard);
                if (grammarUsed) {
                    finalOverallScore = result.score + challengeCard.bonusPoints;
                    setChallengeCompleted(true);
                    setBonusEarned(true);
                    result.feedback += `\n\n🎉 Grammar Challenge completed! You earned +${challengeCard.bonusPoints} points. 🎉`;
                } else {
                    setBonusEarned(false);
                    result.feedback += `\n\n💡 Tip: Try to use the grammar pattern "${challengeCard.grammarName}" in your writing next time to earn bonus points!`;
                }
            }

            const maxScore = DIFFICULTY_CONFIG[difficulty].maxScore;
            finalOverallScore = Math.min(maxScore, finalOverallScore);
            const finalResult = { ...result, score: finalOverallScore };
            setAnalysis(finalResult);
            const overallScore = calculateOverallScore(finalResult);
            setShowAnalysis(true);

            const newHistoryItem = {
                sceneTitle: currentScene.title,
                writing: writing,
                score: overallScore,
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setSessionHistory(prev => [...prev, newHistoryItem]);
            setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
            setFinalScore(overallScore);

            // ✅ 用 stopTimer 回傳值，並傳給 saveScore 作為題目耗時
            const finalTime = stopTimer();
            setSummaryTime(finalTime);
            setIsFinished(true);
            await saveScore(overallScore, finalTime);

        } catch (error) {
            Alert.alert('Analysis Failed', 'Unable to analyze your writing. Please try again.');
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClear = () => {
        setWriting('');
        setWordCount(0);
        setShowAnalysis(false);
        textInputRef.current?.focus();
    };

    const handlePlayAgain = () => {
        setIsFinished(false);
        setWriting('');
        setWordCount(0);
        setAnalysis(null);
        setShowAnalysis(false);
        setFinalScore(0);
        setSessionHistory([]);
        setChallengeCard(null);
        setChallengeCompleted(false);
        setIsDrawingCard(false);
        setBonusEarned(false);
        setLastGrammarName('');
        setSummaryTime(0); // ✅ 重置
        resetAndStartTimer();
        setTimeout(() => textInputRef.current?.focus(), 100);
    };

    const handleChangeDifficulty = async () => {
        if (analysis && finalScore > 0 && difficulty) {
            const savedTime = timerIntervalRef.current ? stopTimer() : finalTimeRef.current;
            await saveScore(finalScore, savedTime);
        }
        setIsFinished(false);
        setDifficulty(null);
        setCurrentScene(null);
        setWriting('');
        setWordCount(0);
        setAnalysis(null);
        setShowAnalysis(false);
        setFinalScore(0);
        setSessionHistory([]);
        setHistory([]);
        setChallengeCard(null);
        setChallengeCompleted(false);
        setIsDrawingCard(false);
        setBonusEarned(false);
        setLastGrammarName('');
        setSummaryTime(0); // ✅ 重置
        stopTimer();
        setElapsedSeconds(0);
        setFinalElapsedSeconds(0);
    };

    const handleBackToGames = async () => {
        if (analysis && finalScore > 0 && difficulty) {
            const savedTime = timerIntervalRef.current ? stopTimer() : finalTimeRef.current;
            await saveScore(finalScore, savedTime);
        }
        router.back();
    };

    const getScoreColor = (score: number): string => {
        if (score >= 90) return '#4CAF50';
        if (score >= 70) return '#2196F3';
        if (score >= 50) return '#FF9800';
        return '#F44336';
    };

    const getScoreFeedback = (score: number): string => {
        if (score >= 90) return 'Excellent! 🌟';
        if (score >= 70) return 'Good job! 👍';
        if (score >= 50) return 'Not bad! 😊';
        return 'Keep practicing! 💪';
    };

    // 渲染單字計數器
    const renderWordCount = () => {
        if (!currentScene || !difficulty) return null;
        const wordLimit = DIFFICULTY_CONFIG[difficulty].wordLimit;
        const isWithinLimit = wordCount <= wordLimit;
        const percentage = Math.min((wordCount / wordLimit) * 100, 100);
        return (
            <View style={styles.wordCountContainer}>
                <View style={styles.wordCountHeader}>
                    <Text style={styles.wordCountLabel}>Word Count</Text>
                    <Text style={[styles.wordCountText, { color: isWithinLimit ? '#4CAF50' : '#F44336' }]}>
                        {wordCount}/{wordLimit}
                    </Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: isWithinLimit ? '#4CAF50' : '#F44336' }]} />
                </View>
                {!isWithinLimit && <Text style={styles.limitWarning}>⚠️ Exceeded word limit</Text>}
            </View>
        );
    };

    // 渲染分析結果
    const renderAnalysis = () => {
        if (!analysis || !showAnalysis) return null;
        return (
            <View style={styles.analysisContainer}>
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreTitle}>Your Score</Text>
                    <View style={[styles.scoreCircle, { borderColor: getScoreColor(analysis.score) }]}>
                        <Text style={[styles.scoreNumber, { color: getScoreColor(analysis.score) }]}>{analysis.score}</Text>
                    </View>
                    <Text style={[styles.scoreFeedback, { color: getScoreColor(analysis.score) }]}>{getScoreFeedback(analysis.score)}</Text>
                </View>
                <View style={styles.feedbackSection}>
                    <Text style={styles.sectionTitle}>📋 Feedback</Text>
                    <View style={styles.feedbackBox}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4CAF50" />
                        <Text style={styles.feedbackText}>{analysis.feedback}</Text>
                    </View>
                </View>
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <View style={styles.suggestionsSection}>
                        <Text style={styles.sectionTitle}>💡 Suggestions</Text>
                        {analysis.suggestions.map((suggestion, index) => (
                            <View key={index} style={styles.suggestionItem}>
                                <Ionicons name="bulb-outline" size={18} color="#FFC107" />
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </View>
                        ))}
                    </View>
                )}
                {analysis.correctedSentence && analysis.correctedSentence !== writing && (
                    <View style={styles.correctionSection}>
                        <Text style={styles.sectionTitle}>✨ Improved Version</Text>
                        <View style={styles.correctionBox}>
                            <Ionicons name="create-outline" size={20} color="#2196F3" />
                            <Text style={styles.correctedText}>{analysis.correctedSentence}</Text>
                        </View>
                    </View>
                )}
                {analysis.grammarErrors && analysis.grammarErrors.length > 0 && (
                    <View style={styles.grammarSection}>
                        <Text style={styles.sectionTitle}>🔧 Grammar Corrections</Text>
                        {analysis.grammarErrors.map((error, index) => (
                            <View key={index} style={styles.grammarItem}>
                                <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
                                <View style={styles.grammarDetails}>
                                    <Text style={styles.errorType}>{error.type}</Text>
                                    <Text style={styles.errorText}>
                                        <Text style={styles.originalText}>"{error.original}"</Text>
                                        <Text> → </Text>
                                        <Text style={styles.correctedText}>"{error.corrected}"</Text>
                                    </Text>
                                    <Text style={styles.errorExplanation}>{error.explanation}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    // 渲染難度選擇畫面
    const renderDifficultySelector = () => (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <View style={styles.iconCircle}><Ionicons name="pencil-sharp" size={60} color="#4b6cb7" /></View>
                    <Text style={styles.mainTitle}>English Writing</Text>
                    <Text style={styles.subTitle}>Improve your English writing skills with AI-powered instant feedback!</Text>
                </View>
                <View style={styles.menuGrid}>
                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => {
                        const config = DIFFICULTY_CONFIG[level];
                        return (
                            <TouchableOpacity key={level} style={[styles.diffCard, { backgroundColor: config.bgColor, borderColor: config.color }]} onPress={() => selectDifficulty(level)} activeOpacity={0.8}>
                                <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>{config.icon}</Text></View>
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.diffBtnText, { color: config.color }]}>{config.label}</Text>
                                        <View style={[styles.levelBadge, { backgroundColor: config.color }]}><Text style={styles.levelBadgeText}>{config.badgeText}</Text></View>
                                    </View>
                                    <Text style={styles.diffDesc}>{config.description}</Text>
                                    <Text style={styles.wordLimitText}>Target: {config.wordLimit} words</Text>
                                    <Text style={styles.wordLimitText}>Max Score: {config.maxScore}</Text>
                                    <View style={styles.startButtonContainer}><View style={[styles.startButton, { backgroundColor: config.color }]}><Text style={styles.startButtonText}>Start Writing →</Text></View></View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <TouchableOpacity style={styles.backLink} onPress={handleBackToGames}><Text style={styles.backLinkText}>← Back to Game Library</Text></TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );

    // 渲染總結畫面（時間顯示改用 summaryTime）
    const renderSummaryPage = () => {
        const maxScore = difficulty ? DIFFICULTY_CONFIG[difficulty].maxScore : 100;
        return (
            <View style={styles.summaryContainer}>
                <StatusBar hidden />
                <ScrollView style={styles.summaryScroll} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.totalScoreCard}>
                        <Text style={styles.totalScoreLabel}>Final Score</Text>
                        <View style={[styles.totalScoreCircle, { borderColor: getScoreColor(finalScore) }]}>
                            <Text style={[styles.totalScoreNumber, { color: getScoreColor(finalScore) }]}>{finalScore}</Text>
                            <Text style={styles.totalScoreMax}>/{maxScore}</Text>
                        </View>
                        <Text style={[styles.totalScoreFeedback, { color: getScoreColor(finalScore) }]}>{getScoreFeedback(finalScore)}</Text>
                        <View style={styles.timeSpentContainer}>
                            <Ionicons name="timer-outline" size={20} color="#4b6cb7" />
                            <Text style={styles.timeSpentText}>Total Time: {formatTime(summaryTime)}</Text>
                        </View>
                        {bonusEarned && (
                            <View style={styles.bonusBadge}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.bonusText}>Bonus Earned! +10 pts</Text>
                            </View>
                        )}
                        {isSaving && (
                            <View style={styles.savingIndicator}>
                                <ActivityIndicator size="small" color="#4CAF50" />
                                <Text style={styles.savingText}>Syncing score...</Text>
                            </View>
                        )}
                    </View>
                    {sessionHistory.length > 0 && (
                        <View style={styles.summaryDetailCard}>
                            <Text style={styles.summarySectionTitle}>✍️ Your Writing</Text>
                            <View style={styles.summaryWritingBox}><Text style={styles.summaryWritingText}>{sessionHistory[0].writing}</Text></View>
                            {currentScene && (
                                <>
                                    <Text style={[styles.summarySectionTitle, { marginTop: 16 }]}>🎨 Scene</Text>
                                    <View style={styles.summarySceneInfo}>
                                        <Text style={styles.summarySceneTitle}>{currentScene.title}</Text>
                                        <Text style={styles.summarySceneCategory}>{currentScene.category}</Text>
                                    </View>
                                    <Text style={styles.summarySceneDesc}>{currentScene.description}</Text>
                                </>
                            )}
                            {difficulty && (
                                <>
                                    <Text style={[styles.summarySectionTitle, { marginTop: 16 }]}>⚙️ Difficulty</Text>
                                    <View style={styles.summaryDifficultyBadge}><Text style={[styles.summaryDifficultyText, { color: DIFFICULTY_CONFIG[difficulty].color }]}>{DIFFICULTY_CONFIG[difficulty].label}</Text></View>
                                </>
                            )}
                        </View>
                    )}
                    {analysis && (
                        <View style={styles.summaryDetailCard}>
                            <Text style={styles.summarySectionTitle}>🤖 AI Feedback Summary</Text>
                            <Text style={styles.summaryFeedbackText}>{analysis.feedback}</Text>
                            {analysis.suggestions && analysis.suggestions.length > 0 && (
                                <>
                                    <Text style={styles.summarySubSectionTitle}>💡 Improvement Tips:</Text>
                                    {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                                        <View key={index} style={styles.summaryTipItem}><Ionicons name="bulb-outline" size={16} color="#FFC107" /><Text style={styles.summaryTipText}>{suggestion}</Text></View>
                                    ))}
                                </>
                            )}
                        </View>
                    )}
                    <View style={styles.summaryButtons}>
                        <TouchableOpacity style={[styles.summaryButton, styles.playAgainButton]} onPress={handlePlayAgain}><Ionicons name="refresh" size={20} color="white" /><Text style={styles.summaryButtonText}>Play Again</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.summaryButton, styles.changeDifficultyButton]} onPress={handleChangeDifficulty}><Ionicons name="options" size={20} color="white" /><Text style={styles.summaryButtonText}>Change Difficulty</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.summaryButton, styles.backToGamesButton]} onPress={handleBackToGames}><Ionicons name="home" size={20} color="white" /><Text style={styles.summaryButtonText}>Back to Games</Text></TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    };

    // 渲染場景選擇器
    const renderSceneSelector = () => {
        if (!difficulty) return null;
        const availableScenes = getScenesByDifficulty(difficulty);
        return (
            <Modal animationType="slide" transparent={true} visible={showSceneSelector} onRequestClose={() => setShowSceneSelector(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>Choose a Scene</Text><TouchableOpacity onPress={() => setShowSceneSelector(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity></View>
                        <ScrollView style={styles.sceneGrid}>
                            {availableScenes.map((scene) => (
                                <TouchableOpacity key={scene.id} style={[styles.sceneCard, currentScene?.id === scene.id && styles.sceneCardActive]} onPress={() => selectScene(scene)}>
                                    <Image source={scene.image} style={styles.sceneImage} resizeMode="cover" />
                                    <View style={styles.sceneInfo}>
                                        <Text style={styles.sceneTitle}>{scene.title}</Text>
                                        <Text style={styles.sceneCategory}>{scene.category}</Text>
                                        <View style={styles.sceneMeta}><Text style={styles.sceneDifficulty}>{scene.difficulty}</Text><Text style={styles.sceneWords}>{scene.wordLimit} words</Text></View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    // 條件渲染
    if (isFinished) return renderSummaryPage();
    if (!difficulty || !currentScene) {
        return (
            <View style={styles.container}>
                <StatusBar hidden />
                <Stack.Screen options={{ title: 'Writing Game', headerStyle: { backgroundColor: '#4b6cb7' }, headerTintColor: '#fff', headerLeft: () => null }} />
                <ScrollView style={styles.difficultyScroll} contentContainerStyle={styles.difficultyScrollContent} showsVerticalScrollIndicator={false}>{renderDifficultySelector()}</ScrollView>
            </View>
        );
    }

    // 主寫作介面（右上角顯示計時器，隱藏返回按鈕）
    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <Stack.Screen
                options={{
                    title: 'Writing',
                    headerStyle: { backgroundColor: '#4b6cb7' },
                    headerTintColor: '#fff',
                    headerLeft: () => null,
                    headerRight: () => (
                        <View style={styles.timerContainer}>
                            <Ionicons name="timer-outline" size={20} color="#fff" />
                            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
                        </View>
                    ),
                }}
            />
            <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.difficultyHeader}>
                        <View style={[styles.difficultyTag, { backgroundColor: DIFFICULTY_CONFIG[difficulty].color }]}><Text style={styles.difficultyTagText}>{DIFFICULTY_CONFIG[difficulty].label} Level</Text></View>
                        <Text style={styles.wordLimitHint}>Limit: {DIFFICULTY_CONFIG[difficulty].wordLimit} words</Text>
                    </View>
                    <View style={styles.mainContentRow}>
                        <View style={styles.imageColumn}>
                            <TouchableOpacity activeOpacity={0.9} onPress={() => setShowSceneSelector(true)}>
                                <Image source={currentScene.image} style={styles.sideImage} resizeMode="cover" />
                                <View style={styles.imageOverlaySide}><Text style={styles.imageTitle}>{currentScene.title}</Text><Text style={styles.imageCategory}>{currentScene.category}</Text></View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.changeSceneButtonSide} onPress={() => setShowSceneSelector(true)}><Ionicons name="swap-horizontal" size={14} color="#4b6cb7" /><Text style={styles.changeSceneTextSide}>Change Scene</Text></TouchableOpacity>
                        </View>
                        <View style={styles.writingColumn}>
                            <View style={styles.writingColumnHeader}><Text style={styles.writingColumnTitle}>Your Writing</Text>{renderWordCount()}</View>
                            <TextInput ref={textInputRef} style={styles.sideTextInput} multiline numberOfLines={12} placeholder="Start writing your description here..." placeholderTextColor="#999" value={writing} onChangeText={handleTextChange} textAlignVertical="top" />
                        </View>
                    </View>
                    {/* 文法挑戰卡牌區域 */}
                    {!isFinished && (
                        <>
                            {isDrawingCard ? (
                                <View style={styles.loadingCard}>
                                    <ActivityIndicator size="large" color="#FF9800" />
                                    <Text style={styles.loadingCardText}>Generating grammar challenge...</Text>
                                </View>
                            ) : challengeCard && !challengeCompleted ? (
                                <View style={styles.activeChallengeCard}>
                                    <View style={styles.challengeHeader}>
                                        <Ionicons name="flag" size={20} color="#FF9800" />
                                        <Text style={styles.challengeTitle}>✨ Grammar Challenge ✨</Text>
                                        <TouchableOpacity
                                            style={styles.regenerateButton}
                                            onPress={handleRegenerateCard}
                                            disabled={isDrawingCard}
                                        >
                                            <Ionicons name="refresh-outline" size={18} color="#FF9800" />
                                            <Text style={styles.regenerateText}>New</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.challengeRule}>
                                        📖 Use this grammar: <Text style={styles.challengeWord}>{challengeCard.grammarName}</Text>
                                    </Text>
                                    <Text style={styles.challengeExample}>
                                        💡 Example: "{challengeCard.exampleSentence}"
                                    </Text>
                                    <Text style={styles.challengeBonus}>
                                        🎁 Bonus: +{challengeCard.bonusPoints} points if you use it correctly!
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.skipChallengeButton}
                                        onPress={handleSkipChallenge}
                                    >
                                        <Text style={styles.skipChallengeText}>Skip this challenge</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.challengeCardContainer}>
                                    <TouchableOpacity
                                        style={styles.drawCardButton}
                                        onPress={handleDrawChallengeCard}
                                        disabled={isDrawingCard}
                                    >
                                        <Ionicons name="card-outline" size={20} color="#fff" />
                                        <Text style={styles.drawCardText}>Draw a Grammar Challenge</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
                    <View style={styles.promptContainer}>
                        <View style={styles.promptHeader}><Ionicons name="megaphone-outline" size={20} color="#4b6cb7" /><Text style={styles.promptLabel}>Writing Prompt</Text></View>
                        <Text style={styles.promptText}>{currentScene.prompt}</Text>
                        <View style={styles.keywordsContainer}>{currentScene.keywords.map((keyword, index) => (<View key={index} style={styles.keywordTag}><Text style={styles.keywordText}>{keyword}</Text></View>))}</View>
                    </View>
                    {renderAnalysis()}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={[styles.analyzeButton, (writing.trim().length === 0 || isAnalyzing) && styles.analyzeButtonDisabled]} onPress={handleAnalyze} disabled={writing.trim().length === 0 || isAnalyzing}>
                            {isAnalyzing ? <ActivityIndicator color="white" size="small" /> : <><Ionicons name="sparkles" size={22} color="white" /><Text style={styles.analyzeButtonText}>AI Analysis</Text></>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.clearButton} onPress={handleClear}><Ionicons name="trash-outline" size={22} color="#666" /><Text style={styles.clearButtonText}>Clear</Text></TouchableOpacity>
                    </View>
                    {history.length > 0 && (
                        <View style={styles.historyContainer}>
                            <View style={styles.historyHeader}><Ionicons name="time-outline" size={20} color="#666" /><Text style={styles.historyTitle}>Recent Attempts</Text></View>
                            {history.map((item, index) => (
                                <View key={index} style={styles.historyItem}>
                                    <View style={styles.historyItemHeader}><Text style={styles.historyScene} numberOfLines={1}>{item.sceneTitle}</Text><Text style={[styles.historyScore, { color: getScoreColor(item.score) }]}>{item.score}</Text></View>
                                    <Text style={styles.historyWriting} numberOfLines={2}>"{item.writing}"</Text>
                                    <View style={styles.historyFooter}><Text style={styles.historyDate}>{item.date}</Text></View>
                                </View>
                            ))}
                        </View>
                    )}
                    <View style={styles.tipsContainer}><Ionicons name="information-circle-outline" size={18} color="#4b6cb7" /><Text style={styles.tipsText}>💡 Tip: Write in complete sentences and use descriptive words!</Text></View>
                </ScrollView>
                {renderSceneSelector()}
            </KeyboardAvoidingView>
        </View>
    );
}

// ==================== 樣式定義 ====================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    timerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 6,
        fontVariant: ['tabular-nums'],
    },
    timeSpentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F0FE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        gap: 8,
    },
    timeSpentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4b6cb7',
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: '#f5f5f5',
    },
    iconCircle: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bonusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        gap: 8,
    },
    bonusText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#F57F17',
    },
    loadingCard: {
        backgroundColor: '#FFF3E0',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFB74D',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
    },
    loadingCardText: {
        fontSize: 14,
        color: '#E65100',
        fontWeight: '500',
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 10,
    },
    menuGrid: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 20,
    },
    diffCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        gap: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardIcon: {
        fontSize: 32,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    diffBtnText: {
        fontSize: 20,
        fontWeight: '700',
    },
    levelBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    diffDesc: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
        lineHeight: 20,
    },
    wordLimitText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        fontStyle: 'italic',
    },
    startButtonContainer: {
        alignItems: 'flex-end',
        marginTop: 12,
    },
    startButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 140,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    backLink: {
        marginTop: 20,
        alignItems: 'center',
        paddingBottom: 40,
    },
    backLinkText: {
        fontSize: 16,
        color: '#4b6cb7',
        fontWeight: '600',
    },
    difficultyScroll: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    difficultyScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    difficultyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#f5f5f5',
    },
    difficultyTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    difficultyTagText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    wordLimitHint: {
        fontSize: 12,
        color: '#999',
    },
    mainContentRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 16,
    },
    imageColumn: {
        width: screenWidth * 0.35,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sideImage: {
        width: '100%',
        height: 180,
    },
    imageOverlaySide: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
    },
    imageTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    imageCategory: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    changeSceneButtonSide: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        gap: 6,
    },
    changeSceneTextSide: {
        fontSize: 12,
        color: '#4b6cb7',
        fontWeight: '500',
    },
    writingColumn: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    writingColumnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    writingColumnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    sideTextInput: {
        fontSize: 15,
        color: '#333',
        minHeight: 180,
        textAlignVertical: 'top',
        lineHeight: 22,
        padding: 0,
    },
    challengeCardContainer: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    drawCardButton: {
        backgroundColor: '#FF9800',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    drawCardText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activeChallengeCard: {
        backgroundColor: '#FFF3E0',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFB74D',
    },
    challengeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E65100',
        flex: 1,
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        gap: 4,
    },
    regenerateText: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: '600',
    },
    challengeRule: {
        fontSize: 14,
        color: '#5D4037',
        marginBottom: 8,
        lineHeight: 20,
    },
    challengeWord: {
        fontWeight: 'bold',
        color: '#D84315',
    },
    challengeExample: {
        fontSize: 13,
        color: '#795548',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    challengeBonus: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2E7D32',
        marginTop: 4,
        marginBottom: 12,
    },
    skipChallengeButton: {
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#EFEBE9',
        borderRadius: 20,
    },
    skipChallengeText: {
        fontSize: 12,
        color: '#8D6E63',
        fontWeight: '500',
    },
    promptContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    promptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    promptLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    promptText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        marginBottom: 16,
    },
    keywordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    keywordTag: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    keywordText: {
        fontSize: 12,
        color: '#0369a1',
        fontWeight: '500',
    },
    wordCountContainer: {
        flex: 1,
        marginLeft: 12,
    },
    wordCountHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    wordCountLabel: {
        fontSize: 10,
        color: '#999',
    },
    wordCountText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    limitWarning: {
        fontSize: 10,
        color: '#F44336',
        marginTop: 2,
        textAlign: 'right',
    },
    analysisContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scoreCard: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    scoreTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    scoreNumber: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    scoreFeedback: {
        fontSize: 18,
        fontWeight: '600',
    },
    feedbackSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f9ff',
        padding: 16,
        borderRadius: 12,
    },
    feedbackText: {
        flex: 1,
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        marginLeft: 12,
    },
    suggestionsSection: {
        marginBottom: 20,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 8,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#92400e',
        lineHeight: 20,
        marginLeft: 8,
    },
    correctionSection: {
        marginBottom: 20,
    },
    correctionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4b6cb7',
    },
    correctedText: {
        flex: 1,
        fontSize: 15,
        color: '#1d4ed8',
        lineHeight: 22,
        marginLeft: 12,
        fontWeight: '500',
    },
    grammarSection: {
        marginBottom: 10,
    },
    grammarItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
    },
    grammarDetails: {
        flex: 1,
        marginLeft: 8,
    },
    errorType: {
        fontSize: 12,
        color: '#dc2626',
        fontWeight: '600',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    originalText: {
        color: '#dc2626',
        textDecorationLine: 'line-through',
    },
    errorExplanation: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginHorizontal: 20,
        marginBottom: 30,
    },
    analyzeButton: {
        flex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4b6cb7',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#4b6cb7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    analyzeButtonDisabled: {
        backgroundColor: '#93c5fd',
        opacity: 0.7,
    },
    analyzeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    clearButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        gap: 8,
    },
    clearButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    historyContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    historyItem: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    historyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyScene: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    historyScore: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    historyWriting: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    historyFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    historyDate: {
        fontSize: 12,
        color: '#999',
    },
    tipsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f9ff',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    tipsText: {
        flex: 1,
        fontSize: 14,
        color: '#0369a1',
        lineHeight: 20,
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    sceneGrid: {
        padding: 20,
    },
    sceneCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: 'white',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sceneCardActive: {
        borderColor: '#4b6cb7',
    },
    sceneImage: {
        width: '100%',
        height: 120,
    },
    sceneInfo: {
        padding: 12,
    },
    sceneTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    sceneCategory: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    sceneMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sceneDifficulty: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '500',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sceneWords: {
        fontSize: 12,
        color: '#999',
    },
    summaryContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    summaryScroll: {
        flex: 1,
    },
    summaryContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    totalScoreCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginTop: -30,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    totalScoreLabel: {
        fontSize: 18,
        color: '#666',
        marginBottom: 16,
    },
    totalScoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    totalScoreNumber: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    totalScoreMax: {
        fontSize: 18,
        color: '#999',
        position: 'absolute',
        bottom: 20,
        right: 25,
    },
    totalScoreFeedback: {
        fontSize: 20,
        fontWeight: '600',
    },
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
    },
    savingText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    summaryDetailCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    summarySectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    summarySubSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
        marginTop: 12,
        marginBottom: 8,
    },
    summaryWritingBox: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryWritingText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
    },
    summarySceneInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summarySceneTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    summarySceneCategory: {
        fontSize: 14,
        color: '#4b6cb7',
        fontWeight: '500',
    },
    summarySceneDesc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    summaryDifficultyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
    },
    summaryDifficultyText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    summaryFeedbackText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        backgroundColor: '#f0f9ff',
        padding: 16,
        borderRadius: 12,
    },
    summaryTipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        paddingHorizontal: 8,
        gap: 8,
    },
    summaryTipText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    summaryButtons: {
        gap: 12,
        marginTop: 10,
    },
    summaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    playAgainButton: {
        backgroundColor: '#4b6cb7',
    },
    changeDifficultyButton: {
        backgroundColor: '#FF9800',
    },
    backToGamesButton: {
        backgroundColor: '#FF5722',
    },
    summaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});