// english/sentencereordergame.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Alert
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

const { width } = Dimensions.get('window');

// --- 💥 浮動文字元件 (HIT / GREAT / OUCH) ---
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

// 難度級別配置 - 每題20分，Easy 4題共80分，Medium 4題共80分（但顯示為120滿分？）
// 根據需求：Easy滿分100分，Medium滿分120分
// 所以 Easy: 每題25分 (25*4=100)，Medium: 每題30分 (30*4=120)
const DIFFICULTY_LEVELS = {
    easy: {
        label: 'Easy',
        badgeText: 'Beginner',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        icon: '🌱',
        questionsPerGame: 4,
        pointsPerQuestion: 25,  // 25 * 4 = 100
        maxScore: 100,
        desc: 'Simple 3-4 word sentences. Focus on basic structure.',
        features: ['Short sentences', 'Basic word order', '4 Questions']
    },
    medium: {
        label: 'Medium',
        badgeText: 'Intermediate',
        color: '#FF9800',
        bgColor: '#FFF3E0',
        icon: '🌳',
        questionsPerGame: 4,
        pointsPerQuestion: 30,  // 30 * 4 = 120
        maxScore: 120,
        desc: 'Common 4-5 word phrases. Natural daily expressions.',
        features: ['Moderate length', 'Common phrases', '4 Questions']
    }
};

type Difficulty = 'easy' | 'medium';

interface WordItem {
    id: string;
    text: string;
    originalIndex: number;
    currentIndex: number;
}

interface GameState {
    currentQuestionIndex: number;      // 當前第幾題 (0-based)
    totalQuestions: number;             // 總題數
    score: number;
    words: WordItem[];
    feedback: string;
    isChecking: boolean;
    correctAnswers: number;
    wrongAnswers: number;
    currentQuestion: ReorderQuestion | null;  // 當前題目
    isLoading: boolean;                 // 正在生成題目
    isLoadingNext: boolean;             // 正在加載下一題
    difficulty: Difficulty | null;
    gameStarted: boolean;
    gameFinished: boolean;
}

export default function SentenceReorderScreen() {
    const [isSaving, setIsSaving] = useState(false);
    const { token } = useAuth();

    // 倒數計時狀態
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useSharedValue(0);

    // 遊戲進行中標誌（倒數完成後才可操作）
    const [gameActive, setGameActive] = useState(false);

    // 特效狀態
    const [floatingText, setFloatingText] = useState<{ id: number, text: string, color: string } | null>(null);
    const screenShake = useSharedValue(0);

    // 遊戲狀態
    const [gameState, setGameState] = useState<GameState>({
        currentQuestionIndex: 0,
        totalQuestions: 4,
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

    // 螢幕震動動畫樣式
    const animatedScreenStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: screenShake.value }]
    }));

    const animatedPrepStyle = useAnimatedStyle(() => ({
        transform: [{ scale: prepScale.value }],
        opacity: withTiming(prepText ? 1 : 0)
    }));

    // 倒數準備序列
    const startPrepSequence = useCallback(() => {
        setGameActive(false);

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
        }, 1000);

        setTimeout(() => {
            setPrepText(null);
            setGameActive(true);
        }, 1600);
    }, []);

    // 生成單一題目（使用AI或備用）
    const generateQuestion = useCallback(async (difficulty: Difficulty, questionNumber: number): Promise<ReorderQuestion> => {
        const aiAvailable = await ReorderService.isAIAvailable();
        console.log(`Generating question ${questionNumber + 1}, AI available:`, aiAvailable);

        if (aiAvailable) {
            const question = await ReorderService.generateSingleQuestion(difficulty, questionNumber);
            if (question) {
                return question;
            }
        }
        // 使用備用題目
        return ReorderService.getFallbackQuestion(difficulty, questionNumber);
    }, []);

    // 初始化當前題目的單詞順序
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
    };

    // 加載第一題並開始遊戲
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

        try {
            const firstQuestion = await generateQuestion(difficulty, 0);

            setGameState(prev => ({
                ...prev,
                currentQuestion: firstQuestion,
                isLoading: false
            }));

            initializeQuestionWords(firstQuestion);
            startPrepSequence();

        } catch (error) {
            console.error('Failed to generate first question:', error);
            // 使用備用題目
            const fallbackQuestion = ReorderService.getFallbackQuestion(difficulty, 0);
            setGameState(prev => ({
                ...prev,
                currentQuestion: fallbackQuestion,
                isLoading: false
            }));
            initializeQuestionWords(fallbackQuestion);
            startPrepSequence();
        }
    }, [generateQuestion, startPrepSequence]);

    // 初始化遊戲（選擇難度後調用）
    const initializeGame = useCallback(async (difficulty: Difficulty) => {
        const questionsCount = DIFFICULTY_LEVELS[difficulty].questionsPerGame;

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
    }, [loadFirstQuestion]);

    // 加載下一題
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
            startPrepSequence();

        } catch (error) {
            console.error('Failed to generate next question:', error);
            // 使用備用題目
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
            startPrepSequence();
        }
    }, [gameState.currentQuestionIndex, gameState.difficulty, generateQuestion, startPrepSequence]);

    // 向左移動單詞
    const moveLeft = (wordId: string) => {
        if (gameState.isChecking || !gameActive) return;

        const currentWords = [...gameState.words];
        const index = currentWords.findIndex(w => w.id === wordId);

        if (index > 0) {
            const temp = currentWords[index];
            currentWords[index] = currentWords[index - 1];
            currentWords[index - 1] = temp;

            const updatedWords = currentWords.map((word, idx) => ({
                ...word,
                currentIndex: idx
            }));

            setGameState(prev => ({
                ...prev,
                words: updatedWords
            }));
        }
    };

    // 觸發螢幕震動效果
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

    // 檢查答案
    const checkAnswer = () => {
        if (gameState.isChecking || !gameActive || !gameState.currentQuestion) return;

        setGameState(prev => ({ ...prev, isChecking: true }));

        const currentOrder = [...gameState.words]
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map(word => word.originalIndex);

        const isCorrect = ReorderService.checkAnswer(currentOrder);
        const originalSentence = gameState.currentQuestion.sentence;

        if (isCorrect) {
            // ✅ 正確 - 根據難度獲取不同的每題分數
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setFloatingText({ id: Date.now(), text: 'HIT!', color: '#FFD700' });

            const difficulty = gameState.difficulty!;
            const pointsPerQuestion = DIFFICULTY_LEVELS[difficulty].pointsPerQuestion;
            const pointsEarned = pointsPerQuestion;
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
            // ❌ 錯誤
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

        setTimeout(() => {
            setFloatingText(null);
        }, 800);
    };

    // 下一題
    const nextQuestion = () => {
        if (!gameActive) return;

        // 檢查是否還有下一題
        if (gameState.currentQuestionIndex + 1 < gameState.totalQuestions) {
            // 加載下一題
            loadNextQuestion();
        } else {
            // 遊戲完成
            setGameActive(false);
            setGameState(prev => ({
                ...prev,
                gameFinished: true
            }));
            saveScore();
        }
    };

    // 重來當前題目
    const retryQuestion = () => {
        if (!gameActive || !gameState.currentQuestion) return;
        initializeQuestionWords(gameState.currentQuestion);
        startPrepSequence();
    };

    // 重新開始遊戲
    const restartGame = () => {
        if (gameState.difficulty) {
            initializeGame(gameState.difficulty);
        } else {
            setGameState({
                currentQuestionIndex: 0,
                totalQuestions: 4,
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

    // 返回上一頁
    const backToDifficulty = () => {
        setGameState(prev => ({
            ...prev,
            gameStarted: false,
            gameFinished: false,
            difficulty: null,
            currentQuestion: null
        }));
    };

    // 返回主頁
    const goToHome = () => {
        router.back();
    };

    // 計算正確率
    const getAccuracy = () => {
        const totalAnswered = gameState.correctAnswers + gameState.wrongAnswers;
        if (totalAnswered === 0) return 0;
        return Math.round((gameState.correctAnswers / totalAnswered) * 100);
    };

    // 計算滿分百分比 - 根據難度使用不同的滿分
    const getScorePercentage = () => {
        if (!gameState.difficulty) return 0;
        const maxScore = DIFFICULTY_LEVELS[gameState.difficulty].maxScore;
        return Math.round((gameState.score / maxScore) * 100);
    };

    // 獲取當前難度的滿分
    const getMaxScore = () => {
        if (!gameState.difficulty) return 100;
        return DIFFICULTY_LEVELS[gameState.difficulty].maxScore;
    };

    // 獲取得分顏色
    const getScoreColor = () => {
        const percentage = getScorePercentage();
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 60) return '#FF9800';
        return '#F44336';
    };

    // 獲取進度百分比
    const getProgress = () => {
        if (gameState.totalQuestions === 0) return 0;
        return ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100;
    };

    const getLevelLabel = (difficulty: Difficulty): string => {
        return DIFFICULTY_LEVELS[difficulty].label;
    };

    const saveScore = async () => {
        if (!token || !gameState.difficulty) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "Sentence Reorder",
                scores: gameState.score,
                difficulty: getLevelLabel(gameState.difficulty).toUpperCase()
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Score synced to server!");
        } catch (e) {
            console.error("Failed to sync score:", e);
        } finally {
            setIsSaving(false);
        }
    };

    // 渲染單詞卡片
    const renderWordCard = (word: WordItem, index: number) => {
        return (
            <TouchableOpacity
                key={word.id}
                style={[styles.wordCard, (!gameActive || gameState.isChecking) && styles.disabledCard]}
                onPress={() => moveLeft(word.id)}
                activeOpacity={0.7}
                disabled={!gameActive || gameState.isChecking}
            >
                <Text style={styles.wordText}>{word.text}</Text>
                {index > 0 && (
                    <View style={styles.moveHint}>
                        <Ionicons name="arrow-back" size={12} color="rgba(255,255,255,0.7)" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // 難度選擇頁面
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
                                                🎯 {config.questionsPerGame} questions • Max score: {config.maxScore}
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

    // 遊戲完成頁面
    const renderCompletionScreen = () => {
        const maxScore = getMaxScore();
        const scorePercentage = getScorePercentage();

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

    // 加載下一題的提示界面
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

    // 遊戲主界面
    const renderGameScreen = () => {
        if (!gameState.currentQuestion) return null;

        // 如果正在加載下一題，顯示加載界面
        if (gameState.isLoadingNext) {
            return renderLoadingNext();
        }

        const maxScore = getMaxScore();

        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />

                <Animated.View style={[{ flex: 1 }, animatedScreenStyle]}>
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* 遊戲標題 */}
                        <LinearGradient
                            colors={['#4b6cb7', '#182848']}
                            style={styles.header}
                        >
                            <Text style={styles.headerTitle}>🔤 Sentence Reorder</Text>
                            <Text style={styles.headerSubtitle}>Arrange the words to form correct sentences</Text>
                        </LinearGradient>

                        {/* 倒數覆蓋層 */}
                        {prepText && (
                            <Animated.View style={[styles.prepOverlay, animatedPrepStyle]}>
                                <Text style={styles.prepText}>{prepText}</Text>
                            </Animated.View>
                        )}

                        {/* 浮動文字特效 */}
                        {floatingText && (
                            <FloatingText
                                key={floatingText.id}
                                text={floatingText.text}
                                color={floatingText.color}
                                onComplete={() => setFloatingText(null)}
                            />
                        )}

                        {/* 進度條 */}
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
                        </View>

                        {/* 統計 */}
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

                        {/* 題目區域 */}
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
                                        .map((word, idx) => renderWordCard(word, idx))
                                ) : (
                                    <Text style={styles.loadingText}>Loading...</Text>
                                )}
                            </View>

                            <Text style={styles.instructionHint}>
                                💡 Tap a word to move it left
                            </Text>
                        </View>

                        {/* 反饋 */}
                        {gameState.feedback !== '' && (
                            <View style={[
                                styles.feedbackBox,
                                gameState.feedback.includes('✅') ? styles.feedbackCorrect :
                                    gameState.feedback.includes('❌') ? styles.feedbackIncorrect : {}
                            ]}>
                                <Text style={styles.feedbackText}>{gameState.feedback}</Text>
                            </View>
                        )}

                        {/* 控制按鈕 */}
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

                            <TouchableOpacity
                                style={[styles.button, styles.nextButton, !gameActive && styles.disabledButton]}
                                onPress={nextQuestion}
                                disabled={!gameActive}
                            >
                                <Text style={styles.buttonText}>
                                    {gameState.currentQuestionIndex === gameState.totalQuestions - 1 ? 'Finish' : 'Next'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Animated.View>
            </View>
        );
    };

    // 初始加載界面
    if (gameState.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4b6cb7" />
                <Text style={styles.loadingText}>Generating first question with AI...</Text>
                <Text style={styles.loadingSubText}>This may take a few seconds ✨</Text>
            </View>
        );
    }

    // 遊戲完成顯示完成頁面
    if (gameState.gameFinished) {
        return renderCompletionScreen();
    }

    // 未開始遊戲顯示難度選擇
    if (!gameState.gameStarted) {
        return renderDifficultySelector();
    }

    // 顯示遊戲主界面
    return renderGameScreen();
}

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
    // 加載下一題的覆蓋層
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
    // 倒數覆蓋層
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
    // 浮動文字
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
    // 難度選擇頁面樣式
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
    // 遊戲主界面樣式
    header: {
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
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
        backgroundColor: '#4b6cb7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    disabledCard: {
        opacity: 0.6,
    },
    wordText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    moveHint: {
        position: 'absolute',
        bottom: -8,
        left: '50%',
        transform: [{ translateX: -8 }],
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
    // 完成頁面樣式
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