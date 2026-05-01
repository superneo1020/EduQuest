// english/sentencereordergame.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createGameMetadata, GameMetadata } from '../../../types/GameMetadata';
import { convertToBackendMetadata } from '../../utils/metadataConverter';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LayoutList } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    runOnJS
} from 'react-native-reanimated';
import ReorderService, { ReorderQuestion } from '../../services/reorderService';
import axios from "axios";
import { useAuth } from "@/src/auth/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// --- 💥 浮动文字组件 (HIT / GREAT / OUCH) ---
const FloatingText = ({ text, color, onComplete }: { text: string, color: string, onComplete: () => void }) => {
    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withTiming(-80, { duration: 800 });
        opacity.value = withTiming(0, { duration: 800 }, () => runOnJS(onComplete)());
    }, []);
    return (
        <Animated.View style={[styles.floatingLayer, useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }))]}>
            <Text style={[styles.hitText, { color }]}>{text}</Text>
        </Animated.View>
    );
};

// 根據難度和題目索引獲取每題滿分 (共3題)
const getPointsForQuestion = (difficulty: Difficulty, index: number): number => {
    if (difficulty === 'easy') {
        if (index === 0) return 30;
        if (index === 1) return 30;
        return 40;
    } else {
        return 40;
    }
};

// 獲取總滿分
const getTotalMaxScore = (difficulty: Difficulty): number => {
    if (difficulty === 'easy') return 100;
    return 120;
};

// 難度級別配置
const DIFFICULTY_LEVELS = {
    easy: {
        label: 'Easy',
        badgeText: 'Beginner',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        icon: '🌱',
        questionsPerGame: 3,
        desc: 'Simple 3-4 word sentences. Focus on basic structure.',
        features: ['Short sentences', 'Basic word order', '3 Questions', 'Points: 30/30/40 (Total 100)']
    },
    hard: {
        label: 'Hard',
        badgeText: 'Advanced',
        color: '#F44336',
        bgColor: '#FFEBEE',
        icon: '🔥',
        questionsPerGame: 3,
        desc: 'Complex sentences and advanced vocabulary.',
        features: ['Longer sentences', 'Complex grammar', '3 Questions', 'Points: 40/40/40 (Total 120)']
    }
};

type Difficulty = 'easy' | 'hard';

interface WordItem {
    id: string;
    text: string;
    originalIndex: number;
    currentIndex: number;
}

interface QuestionRecord {
    id: number;
    question: string;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    questionType: string;
    options: any[];
    earnedPoints: number;
    timeSpent: number; // 新增：本题耗时（秒）
}

interface GameState {
    currentQuestionIndex: number;
    totalQuestions: number;
    score: number;
    words: WordItem[];
    feedback: string;
    isChecking: boolean;
    correctAnswers: number;
    wrongAnswers: number;
    currentQuestion: ReorderQuestion | null;
    isLoading: boolean;
    isLoadingNext: boolean;
    difficulty: Difficulty | null;
    gameStarted: boolean;
    gameFinished: boolean;
}

export default function SentenceReorderScreen() {
    const [isSaving, setIsSaving] = useState(false);
    // 防重複提交鎖
    const isCompletingRef = useRef(false);
    const { token } = useAuth();

    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useSharedValue(0);
    const [gameActive, setGameActive] = useState(false);

    const [floatingText, setFloatingText] = useState<{ id: number, text: string, color: string } | null>(null);
    const screenShake = useSharedValue(0);

    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerStartedRef = useRef<boolean>(false);

    // ✅ 新增：记录当前题目开始时的 elapsedSeconds
    const questionStartTimeRef = useRef<number>(0);
    const hasStartedQuestionRef = useRef<boolean>(false);

    const [highScore, setHighScore] = useState(0);

    // ✅ 當前題目是否已作答（用於鎖定操作並只顯示 "Next"）
    const [isAnswered, setIsAnswered] = useState(false);

    // ========== 状态定义（必须放在使用它的函数之前）==========
    const [gameState, setGameState] = useState<GameState>({
        currentQuestionIndex: 0,
        totalQuestions: 3,
        score: 0,
        words: [],
        feedback: '',
        isChecking: false,
        correctAnswers: 0,
        wrongAnswers: 0,
        currentQuestion: null,
        isLoading: false,
        isLoadingNext: false,
        difficulty: null,
        gameStarted: false,
        gameFinished: false
    });

    const [questionsHistory, setQuestionsHistory] = useState<QuestionRecord[]>([]);

    // ========== 动画样式 ==========
    const animatedScreenStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: screenShake.value }]
    }));

    const animatedPrepStyle = useAnimatedStyle(() => ({
        transform: [{ scale: prepScale.value }],
        opacity: withTiming(prepText ? 1 : 0)
    }));

    // ========== 辅助函数 ==========
    const formatTime = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const stopTimer = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }, []);

    const startTimerOnce = useCallback(() => {
        if (timerStartedRef.current) return;
        timerStartedRef.current = true;
        setElapsedSeconds(0);
        timerIntervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    }, []);

    // ✅ 记录当前题目开始时间（应在题目可见时调用）
    const recordCurrentQuestionStart = useCallback(() => {
        if (!hasStartedQuestionRef.current && gameActive && !isAnswered && !gameState.gameFinished) {
            questionStartTimeRef.current = elapsedSeconds;
            hasStartedQuestionRef.current = true;
            console.log(`[Time] Question ${gameState.currentQuestionIndex + 1} started at ${elapsedSeconds}s`);
        }
    }, [gameActive, isAnswered, gameState.gameFinished, gameState.currentQuestionIndex, elapsedSeconds]);

    // 当游戏活跃且未作答时，尝试记录开始时间（每道题只记录一次）
    useEffect(() => {
        if (gameActive && !isAnswered && !gameState.gameFinished && gameState.currentQuestion) {
            recordCurrentQuestionStart();
        }
    }, [gameActive, isAnswered, gameState.gameFinished, gameState.currentQuestion, recordCurrentQuestionStart]);

    // ========== 核心游戏逻辑 ==========
    const loadHighScore = async (difficulty: Difficulty) => {
        try {
            const saved = await AsyncStorage.getItem(`sentence_reorder_high_score_${difficulty}`);
            if (saved) setHighScore(parseInt(saved));
        } catch (error) {
            console.error('Failed to load highest score:', error);
        }
    };

    const saveHighScore = async (newScore: number, difficulty: Difficulty) => {
        try {
            if (newScore > highScore) {
                setHighScore(newScore);
                await AsyncStorage.setItem(`sentence_reorder_high_score_${difficulty}`, newScore.toString());
            }
        } catch (error) {
            console.error('Failed to save highest score:', error);
        }
    };

    const startPrepSequence = useCallback((isFirstTime: boolean = true) => {
        setGameActive(false);
        // 重置题目开始标记，等待新题目出现后重新记录
        hasStartedQuestionRef.current = false;
        setTimeout(() => {
            setPrepText('READY');
            prepScale.value = 0;
            prepScale.value = withSpring(1.2);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 100);
        setTimeout(() => {
            setPrepText('GO!');
            prepScale.value = 0;
            prepScale.value = withSpring(1.5);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (isFirstTime) {
                startTimerOnce();
            }
        }, 1000);
        setTimeout(() => {
            setPrepText(null);
            setGameActive(true);
            setIsAnswered(false);
            // gameActive 变为 true 后，recordCurrentQuestionStart 会被 useEffect 触发
        }, 1600);
    }, [startTimerOnce]);

    const generateQuestion = useCallback(async (difficulty: Difficulty, questionNumber: number): Promise<ReorderQuestion> => {
        const aiAvailable = await ReorderService.isAIAvailable();
        console.log(`Generating question ${questionNumber + 1}, AI available:`, aiAvailable);
        if (aiAvailable) {
            const question = await ReorderService.generateSingleQuestion(difficulty, questionNumber);
            if (question) {
                return question;
            }
        }
        return ReorderService.getFallbackQuestion(difficulty, questionNumber);
    }, []);

    const initializeQuestionWords = (question: ReorderQuestion) => {
        const shuffled = ReorderService.shuffleWords(question.words);
        const words: WordItem[] = shuffled.map((item, newIndex) => ({
            id: `${item.originalIndex}-${Date.now()}-${Math.random()}`,
            text: item.word,
            originalIndex: item.originalIndex,
            currentIndex: newIndex
        }));
        setGameState(prev => ({
            ...prev,
            words: words,
            feedback: '',
            isChecking: false
        }));
        setIsAnswered(false);
        // 重置题目开始标记，等待 gameActive 变为 true 后重新记录
        hasStartedQuestionRef.current = false;
    };

    const loadFirstQuestion = useCallback(async (difficulty: Difficulty) => {
        setGameState(prev => ({
            ...prev,
            isLoading: true,
            difficulty: difficulty,
            gameStarted: true,
            gameFinished: false,
            currentQuestionIndex: 0,
            score: 0,
            correctAnswers: 0,
            wrongAnswers: 0
        }));
        setQuestionsHistory([]);
        await loadHighScore(difficulty);
        try {
            const firstQuestion = await generateQuestion(difficulty, 0);
            setGameState(prev => ({
                ...prev,
                currentQuestion: firstQuestion,
                isLoading: false
            }));
            initializeQuestionWords(firstQuestion);
            startPrepSequence(true);
        } catch (error) {
            console.error('Failed to generate first question:', error);
            const fallbackQuestion = ReorderService.getFallbackQuestion(difficulty, 0);
            setGameState(prev => ({
                ...prev,
                currentQuestion: fallbackQuestion,
                isLoading: false
            }));
            initializeQuestionWords(fallbackQuestion);
            startPrepSequence(true);
        }
    }, [generateQuestion, startPrepSequence]);

    const initializeGame = useCallback(async (difficulty: Difficulty) => {
        const questionsCount = DIFFICULTY_LEVELS[difficulty].questionsPerGame;
        // 重置計時器和完成鎖
        isCompletingRef.current = false;
        timerStartedRef.current = false;
        setElapsedSeconds(0);
        hasStartedQuestionRef.current = false;
        stopTimer();
        setGameState(prev => ({
            ...prev,
            totalQuestions: questionsCount,
            difficulty: difficulty,
            gameStarted: true,
            gameFinished: false,
            currentQuestionIndex: 0,
            score: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            currentQuestion: null,
            isLoading: true
        }));
        await loadFirstQuestion(difficulty);
    }, [loadFirstQuestion, stopTimer]);

    const loadNextQuestion = useCallback(async () => {
        const nextIndex = gameState.currentQuestionIndex + 1;
        const difficulty = gameState.difficulty!;
        setGameState(prev => ({
            ...prev,
            isLoadingNext: true
        }));
        try {
            const nextQuestion = await generateQuestion(difficulty, nextIndex);
            setGameState(prev => ({
                ...prev,
                currentQuestion: nextQuestion,
                currentQuestionIndex: nextIndex,
                isLoadingNext: false,
                feedback: '',
                isChecking: false
            }));
            initializeQuestionWords(nextQuestion);
            startPrepSequence(false);
        } catch (error) {
            console.error('Failed to generate next question:', error);
            const fallbackQuestion = ReorderService.getFallbackQuestion(difficulty, nextIndex);
            setGameState(prev => ({
                ...prev,
                currentQuestion: fallbackQuestion,
                currentQuestionIndex: nextIndex,
                isLoadingNext: false,
                feedback: '',
                isChecking: false
            }));
            initializeQuestionWords(fallbackQuestion);
            startPrepSequence(false);
        }
    }, [gameState.currentQuestionIndex, gameState.difficulty, generateQuestion, startPrepSequence]);

    const moveWord = (wordId: string, direction: 'left' | 'right') => {
        if (gameState.isChecking || !gameActive || isAnswered) return;
        const currentWords = [...gameState.words];
        const index = currentWords.findIndex(w => w.id === wordId);
        if (index === -1) return;
        if (direction === 'left' && index > 0) {
            const temp = currentWords[index];
            currentWords[index] = currentWords[index - 1];
            currentWords[index - 1] = temp;
        } else if (direction === 'right' && index < currentWords.length - 1) {
            const temp = currentWords[index];
            currentWords[index] = currentWords[index + 1];
            currentWords[index + 1] = temp;
        } else {
            return;
        }
        const updatedWords = currentWords.map((word, idx) => ({
            ...word,
            currentIndex: idx
        }));
        setGameState(prev => ({
            ...prev,
            words: updatedWords
        }));
    };

    const triggerScreenShake = () => {
        screenShake.value = withSequence(
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(8, { duration: 50 }),
            withTiming(-8, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
    };

    const getUserSentence = (words: WordItem[]): string => {
        return words
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map(w => w.text)
            .join(' ');
    };

    const checkAnswer = () => {
        if (gameState.isChecking || !gameActive || !gameState.currentQuestion) return;

        // 计算本题耗时
        const timeSpentForThis = Math.max(0, elapsedSeconds - questionStartTimeRef.current);
        console.log(`[Time] Question ${gameState.currentQuestionIndex + 1} answered, spent ${timeSpentForThis}s`);

        setGameState(prev => ({ ...prev, isChecking: true }));
        const currentOrder = [...gameState.words]
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map(word => word.originalIndex);
        const isCorrect = ReorderService.checkAnswer(currentOrder);
        const originalSentence = gameState.currentQuestion.sentence;
        const userSentence = getUserSentence(gameState.words);
        const difficulty = gameState.difficulty!;
        const pointsEarned = isCorrect ? getPointsForQuestion(difficulty, gameState.currentQuestionIndex) : 0;
        const newRecord: QuestionRecord = {
            id: gameState.currentQuestionIndex + 1,
            question: originalSentence,
            correctAnswer: originalSentence,
            userAnswer: userSentence,
            isCorrect: isCorrect,
            questionType: 'sentence-reorder',
            options: [],
            earnedPoints: pointsEarned,
            timeSpent: timeSpentForThis,
        };
        setQuestionsHistory(prev => {
            const existingIndex = prev.findIndex(r => r.id === gameState.currentQuestionIndex + 1);
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = newRecord;
                return updated;
            } else {
                return [...prev, newRecord];
            }
        });
        if (isCorrect) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setFloatingText({ id: Date.now(), text: 'HIT!', color: '#FFD700' });
            const newScore = gameState.score + pointsEarned;
            const newCorrectAnswers = gameState.correctAnswers + 1;
            setGameState(prev => ({
                ...prev,
                score: newScore,
                correctAnswers: newCorrectAnswers,
                feedback: `✅ Correct! +${pointsEarned} points`,
                isChecking: false
            }));
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            triggerScreenShake();
            setFloatingText({ id: Date.now(), text: 'OUCH!', color: '#FF4757' });
            setGameState(prev => ({
                ...prev,
                wrongAnswers: prev.wrongAnswers + 1,
                isChecking: false,
                feedback: `❌ Incorrect\nCorrect: "${originalSentence}"`
            }));
        }
        setIsAnswered(true);
        setTimeout(() => {
            setFloatingText(null);
        }, 800);
    };

    const retryQuestion = () => {
        if (!gameActive || !gameState.currentQuestion) return;
        setQuestionsHistory(prev => prev.filter(r => r.id !== gameState.currentQuestionIndex + 1));
        initializeQuestionWords(gameState.currentQuestion);
        startPrepSequence(false);
    };

    const saveScore = async () => {
        if (!token || !gameState.difficulty) return;
        if (isCompletingRef.current) {
            console.log("saveScore already in progress, skip");
            return;
        }
        isCompletingRef.current = true;
        setIsSaving(true);
        try {
            const gameData = {
                gameName: "Sentence Reorder",
                scores: gameState.score,
                gameType: "ENGLISH",
                gameDifficulty: DIFFICULTY_LEVELS[gameState.difficulty].label.toUpperCase()
            };
            const questionsData = questionsHistory.map(q => ({
                id: q.id,
                question: q.question,
                correctAnswer: q.correctAnswer,
                userAnswer: q.userAnswer,
                isCorrect: q.isCorrect,
                questionType: q.questionType,
                options: q.options,
                earnedPoints: q.earnedPoints,
                timeSpent: q.timeSpent !== undefined ? q.timeSpent : 0
            }));
            const totalTimeSeconds = elapsedSeconds;
            const totalTimeFormatted = formatTime(totalTimeSeconds);
            const metadata: GameMetadata = createGameMetadata(
                gameData.gameType,
                gameData.gameDifficulty,
                gameData.scores,
                {
                    totalSentences: gameState.totalQuestions,
                    correctSentences: gameState.correctAnswers,
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

    const nextQuestion = () => {
        if (!gameActive) return;
        if (gameState.currentQuestionIndex + 1 < gameState.totalQuestions) {
            loadNextQuestion();
        } else {
            setGameActive(false);
            stopTimer();
            setGameState(prev => ({
                ...prev,
                gameFinished: true
            }));
            if (gameState.difficulty) {
                saveHighScore(gameState.score, gameState.difficulty);
                saveScore();
            }
        }
    };

    const restartGame = () => {
        hasStartedQuestionRef.current = false;
        if (gameState.difficulty) {
            initializeGame(gameState.difficulty);
        } else {
            setGameState({
                currentQuestionIndex: 0,
                totalQuestions: 3,
                score: 0,
                words: [],
                feedback: '',
                isChecking: false,
                correctAnswers: 0,
                wrongAnswers: 0,
                currentQuestion: null,
                isLoading: false,
                isLoadingNext: false,
                difficulty: null,
                gameStarted: false,
                gameFinished: false
            });
        }
    };

    const backToDifficulty = () => {
        stopTimer();
        timerStartedRef.current = false;
        setElapsedSeconds(0);
        hasStartedQuestionRef.current = false;
        setGameState(prev => ({
            ...prev,
            gameStarted: false,
            gameFinished: false,
            difficulty: null,
            currentQuestion: null
        }));
    };

    const goToHome = () => {
        stopTimer();
        timerStartedRef.current = false;
        router.back();
    };

    const getAccuracy = () => {
        const totalAnswered = gameState.correctAnswers + gameState.wrongAnswers;
        if (totalAnswered === 0) return 0;
        return Math.round((gameState.correctAnswers / totalAnswered) * 100);
    };

    const getScorePercentage = () => {
        if (!gameState.difficulty) return 0;
        const maxScore = getTotalMaxScore(gameState.difficulty);
        return Math.round((gameState.score / maxScore) * 100);
    };

    const getMaxScore = () => {
        if (!gameState.difficulty) return 100;
        return getTotalMaxScore(gameState.difficulty);
    };

    const getScoreColor = () => {
        const percentage = getScorePercentage();
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 60) return '#FF9800';
        return '#F44336';
    };

    const getProgress = () => {
        if (gameState.totalQuestions === 0) return 0;
        return ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100;
    };

    const getLevelLabel = (difficulty: Difficulty): string => {
        return DIFFICULTY_LEVELS[difficulty].label;
    };

    // ========== 渲染函数 ==========
    const renderWordCard = (word: WordItem, index: number, total: number) => {
        const canMoveLeft = index > 0;
        const canMoveRight = index < total - 1;
        const disabled = !gameActive || gameState.isChecking || isAnswered;
        return (
            <View key={word.id} style={[styles.wordCard, disabled && styles.disabledCard]}>
                <TouchableOpacity
                    onPress={() => moveWord(word.id, 'left')}
                    disabled={!canMoveLeft || disabled}
                    style={[styles.arrowButton, !canMoveLeft && styles.arrowDisabled]}
                    activeOpacity={0.6}
                >
                    <Ionicons
                        name="arrow-back"
                        size={18}
                        color={canMoveLeft && !disabled ? 'white' : 'rgba(255,255,255,0.3)'}
                    />
                </TouchableOpacity>
                <Text style={styles.wordText}>{word.text}</Text>
                <TouchableOpacity
                    onPress={() => moveWord(word.id, 'right')}
                    disabled={!canMoveRight || disabled}
                    style={[styles.arrowButton, !canMoveRight && styles.arrowDisabled]}
                    activeOpacity={0.6}
                >
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={canMoveRight && !disabled ? 'white' : 'rgba(255,255,255,0.3)'}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    const renderDifficultySelector = () => {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerSection}>
                        <LayoutList size={60} color="#4A90E2" style={{ marginBottom: 20 }} />
                        <Text style={styles.mainTitle}>Sentence Reorder</Text>
                        <Text style={styles.subTitle}>
                            Tap words to build perfect English sentences!
                        </Text>
                    </View>
                    <View style={styles.menuGrid}>
                        {(Object.keys(DIFFICULTY_LEVELS) as Difficulty[]).map((level) => {
                            const config = DIFFICULTY_LEVELS[level];
                            const maxScore = getTotalMaxScore(level);
                            return (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.diffCard,
                                        { backgroundColor: config.bgColor, borderColor: config.color }
                                    ]}
                                    onPress={() => initializeGame(level)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardIconContainer}>
                                        <Text style={styles.cardIcon}>{config.icon}</Text>
                                    </View>
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <Text style={[styles.diffBtnText, { color: config.color }]}>
                                                {config.label}
                                            </Text>
                                            <View style={[styles.levelBadge, { backgroundColor: config.color }]}>
                                                <Text style={styles.levelBadgeText}>{config.badgeText}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.diffDesc}>{config.desc}</Text>
                                        <View style={styles.scoreInfoRow}>
                                            <Text style={styles.scoreInfoText}>
                                                🎯 {config.questionsPerGame} questions • Max score: {maxScore}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    };

    const renderCompletionScreen = () => {
        const maxScore = getMaxScore();
        const scorePercentage = getScorePercentage();
        const totalTimeFormatted = formatTime(elapsedSeconds);
        let performanceMessage = '';
        if (scorePercentage >= 80) performanceMessage = 'Excellent! 🎉';
        else if (scorePercentage >= 60) performanceMessage = 'Good job! 👍';
        else if (scorePercentage >= 40) performanceMessage = 'Keep practicing! 💪';
        else performanceMessage = 'Try again! You can do it! 🌟';
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.completionContainer}>
                <LinearGradient
                    colors={['#4b6cb7', '#182848']}
                    style={styles.completionHeader}
                >
                    <Text style={styles.completionTitle}>Game Completed! 🎉</Text>
                    <Text style={styles.completionSubtitle}>{performanceMessage}</Text>
                </LinearGradient>
                <View style={styles.scoreCircle}>
                    <Text style={[styles.scoreNumber, { color: getScoreColor() }]}>
                        {gameState.score}
                    </Text>
                    <Text style={styles.scoreMax}>/ {maxScore}</Text>
                    <Text style={styles.scoreLabel}>Final Score</Text>
                </View>
                <View style={styles.reportTimeBox}>
                    <Text style={styles.reportScoreLabel}>⏱️ Total Time</Text>
                    <Text style={styles.reportTimeValue}>{totalTimeFormatted}</Text>
                </View>
                {isSaving && (
                    <View style={styles.savingIndicator}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.savingText}>Synchronizing scores...</Text>
                    </View>
                )}
                <View style={styles.statsCard}>
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                            <Text style={styles.statNumber}>{gameState.correctAnswers}</Text>
                            <Text style={styles.statLabel}>Correct</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="close-circle" size={32} color="#F44336" />
                            <Text style={styles.statNumber}>{gameState.wrongAnswers}</Text>
                            <Text style={styles.statLabel}>Incorrect</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="stats-chart" size={32} color="#4b6cb7" />
                            <Text style={styles.statNumber}>{getAccuracy()}%</Text>
                            <Text style={styles.statLabel}>Accuracy</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.completionButtons}>
                    <TouchableOpacity style={[styles.completionButton, styles.playAgainButton]} onPress={restartGame}>
                        <Ionicons name="refresh" size={20} color="white" />
                        <Text style={styles.completionButtonText}>Play Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.completionButton, styles.backDifficultyButton]} onPress={backToDifficulty}>
                        <Ionicons name="options" size={20} color="white" />
                        <Text style={styles.completionButtonText}>Change Difficulty</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.completionButton, styles.homeButton]} onPress={goToHome}>
                        <Ionicons name="home" size={20} color="white" />
                        <Text style={styles.completionButtonText}>Back to game</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderLoadingNext = () => {
        return (
            <View style={styles.loadingOverlay}>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color="#4b6cb7" />
                    <Text style={styles.loadingNextText}>Generating next question...</Text>
                    <Text style={styles.loadingNextSubText}>AI is creating a new sentence for you ✨</Text>
                </View>
            </View>
        );
    };

    const renderGameScreen = () => {
        if (!gameState.currentQuestion) return null;
        if (gameState.isLoadingNext) {
            return renderLoadingNext();
        }
        const isLastQuestion = gameState.currentQuestionIndex === gameState.totalQuestions - 1;

        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <Animated.View style={[{ flex: 1 }, animatedScreenStyle]}>
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <LinearGradient
                            colors={['#4b6cb7', '#182848']}
                            style={styles.headerWithTimer}
                        >
                            <Text style={styles.headerTitle}>🔤 Sentence Reorder</Text>
                            <View style={styles.timerContainer}>
                                <Text style={styles.timerIcon}>⏱️</Text>
                                <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
                            </View>
                        </LinearGradient>
                        <Text style={styles.headerSubtitle}>Arrange the words to form correct sentences</Text>
                        {prepText && (
                            <Animated.View style={[styles.prepOverlay, animatedPrepStyle]}>
                                <Text style={styles.prepText}>{prepText}</Text>
                            </Animated.View>
                        )}
                        {floatingText && (
                            <FloatingText
                                key={floatingText.id}
                                text={floatingText.text}
                                color={floatingText.color}
                                onComplete={() => setFloatingText(null)}
                            />
                        )}
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
                        </View>
                        <View style={styles.statsBar}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{gameState.score}</Text>
                                <Text style={styles.statLabel}>Score</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{gameState.correctAnswers}</Text>
                                <Text style={styles.statLabel}>Correct</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{gameState.wrongAnswers}</Text>
                                <Text style={styles.statLabel}>Incorrect</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>
                                    {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
                                </Text>
                                <Text style={styles.statLabel}>Question</Text>
                            </View>
                        </View>
                        <View style={[styles.questionCard, !gameActive && styles.inactiveCard]}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionTitle}>Question {gameState.currentQuestionIndex + 1}</Text>
                                <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_LEVELS[gameState.difficulty as Difficulty]?.color }]}>
                                    <Text style={styles.difficultyBadgeText}>
                                        {DIFFICULTY_LEVELS[gameState.difficulty as Difficulty]?.label}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.translation}>{gameState.currentQuestion.translation}</Text>
                            <View style={styles.wordsContainer}>
                                {gameState.words.length > 0 ? (
                                    gameState.words
                                        .sort((a, b) => a.currentIndex - b.currentIndex)
                                        .map((word, idx) => renderWordCard(word, idx, gameState.words.length))
                                ) : (
                                    <Text style={styles.loadingText}>Loading...</Text>
                                )}
                            </View>
                            <Text style={styles.instructionHint}>
                                💡 Tap arrows to move words left or right
                            </Text>
                        </View>
                        {gameState.feedback !== '' && (
                            <View style={[
                                styles.feedbackBox,
                                gameState.feedback.includes('✅') ? styles.feedbackCorrect :
                                    gameState.feedback.includes('❌') ? styles.feedbackIncorrect : {}
                            ]}>
                                <Text style={styles.feedbackText}>{gameState.feedback}</Text>
                            </View>
                        )}
                        {!isAnswered ? (
                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[styles.button, styles.checkButton, (!gameActive || gameState.isChecking) && styles.disabledButton]}
                                    onPress={checkAnswer}
                                    disabled={!gameActive || gameState.isChecking}
                                >
                                    <Text style={styles.buttonText}>
                                        {gameState.isChecking ? 'Checking...' : 'Check'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.retryButton, !gameActive && styles.disabledButton]}
                                    onPress={retryQuestion}
                                    disabled={!gameActive}
                                >
                                    <Text style={styles.buttonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[styles.button, styles.nextButton, (!gameActive) && styles.disabledButton]}
                                    onPress={nextQuestion}
                                    disabled={!gameActive}
                                >
                                    <Text style={styles.buttonText}>
                                        {isLastQuestion ? 'Finish' : 'Next'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        );
    };

    // ========== 条件渲染 ==========
    if (gameState.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4b6cb7" />
                <Text style={styles.loadingText}>Generating first question with AI...</Text>
                <Text style={styles.loadingSubText}>This may take a few seconds ✨</Text>
            </View>
        );
    }
    if (gameState.gameFinished) {
        return renderCompletionScreen();
    }
    if (!gameState.gameStarted) {
        return renderDifficultySelector();
    }
    return renderGameScreen();
}

// ========== 样式 ==========
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#4b6cb7',
        fontWeight: '500',
    },
    loadingSubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    loadingCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: width * 0.8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingNextText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#4b6cb7',
    },
    loadingNextSubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    headerBackButton: {
        marginLeft: 10,
        padding: 5,
    },
    prepOverlay: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
        backgroundColor: 'transparent',
    },
    prepText: {
        fontSize: 72,
        fontWeight: '900',
        color: '#4b6cb7',
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 60,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    floatingLayer: {
        position: 'absolute',
        top: '35%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 200,
        backgroundColor: 'transparent',
    },
    hitText: {
        fontSize: 48,
        fontWeight: '900',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: '#fff',
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
        marginBottom: 8,
        lineHeight: 20,
    },
    scoreInfoRow: {
        marginTop: 4,
    },
    scoreInfoText: {
        fontSize: 12,
        color: '#4b6cb7',
        fontWeight: '500',
    },
    headerWithTimer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerIcon: {
        fontSize: 16,
        marginRight: 6,
        color: '#fff',
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4b6cb7',
        borderRadius: 2,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inactiveCard: {
        opacity: 0.7,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyBadgeText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '600',
    },
    translation: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    wordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        minHeight: 80,
        marginBottom: 16,
    },
    wordCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4b6cb7',
        paddingHorizontal: 6,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    disabledCard: {
        opacity: 0.6,
    },
    arrowButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowDisabled: {
        opacity: 0.4,
    },
    wordText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginHorizontal: 6,
    },
    instructionHint: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    feedbackBox: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#4b6cb7',
    },
    feedbackCorrect: {
        borderLeftColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    feedbackIncorrect: {
        borderLeftColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    feedbackText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    controls: {
        flexDirection: 'row',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    checkButton: {
        backgroundColor: '#4b6cb7',
    },
    retryButton: {
        backgroundColor: '#F44336',
    },
    nextButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    completionContainer: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    completionHeader: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        marginBottom: 30,
    },
    completionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    completionSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    scoreCircle: {
        alignItems: 'center',
        marginBottom: 30,
    },
    scoreNumber: {
        fontSize: 72,
        fontWeight: 'bold',
    },
    scoreMax: {
        fontSize: 24,
        color: '#999',
        marginTop: -10,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    reportTimeBox: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        width: '90%',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reportScoreLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    reportTimeValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
        alignSelf: 'center',
    },
    savingText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    statsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    completionButtons: {
        paddingHorizontal: 20,
        gap: 12,
    },
    completionButton: {
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
    backDifficultyButton: {
        backgroundColor: '#FF9800',
    },
    homeButton: {
        backgroundColor: '#FF5722',
    },
    completionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});