// games/english/listeninggame.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    Modal,
    ScrollView,
    Dimensions,
    Vibration,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIService, { Question } from '../../services/AIService';

const { width } = Dimensions.get('window');

// 游戏数据类型
type Difficulty = 'easy' | 'medium' | 'hard';

type Option = {
    id: string;
    text: string;
    correct: boolean;
};

// AI 分析响应类型
type AIAnalysisResponse = {
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areas_to_improve: string[];
    estimated_level: string;
    recommended_next_steps: string[];
};

// 游戏状态类型
type GameState = {
    currentLevel: Difficulty;
    currentQuestionIndex: number;
    score: number;
    streak: number;
    maxStreak: number;
    correctAnswers: number;
    totalQuestions: number;
    isAnswered: boolean;
    isPlaying: boolean;
    gameCompleted: boolean;
    showHint: boolean;
    selectedOptionId: string | null;
    isAnalyzing: boolean;
    aiAnalysis: AIAnalysisResponse | null;
    showAIFeedback: boolean;
    isLoading: boolean;
    questions: Question[];
};

export default function ListeningScreen() {
    // 游戏状态
    const [gameState, setGameState] = useState<GameState>({
        currentLevel: 'easy',
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctAnswers: 0,
        totalQuestions: 6,
        isAnswered: false,
        isPlaying: false,
        gameCompleted: false,
        showHint: false,
        selectedOptionId: null,
        isAnalyzing: false,
        aiAnalysis: null,
        showAIFeedback: false,
        isLoading: true,
        questions: [],
    });

    const [highScore, setHighScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    // 动画引用
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // 加载最高分
    useEffect(() => {
        loadHighScore();
    }, [gameState.currentLevel]);

    // 首次加载时生成题目
    useEffect(() => {
        loadQuestions('easy');
    }, []);

    const loadHighScore = async () => {
        try {
            const saved = await AsyncStorage.getItem(`listening_game_high_score_${gameState.currentLevel}`);
            if (saved) setHighScore(parseInt(saved));
        } catch (error) {
            console.error('Failed to load highest score:', error);
        }
    };

    const saveHighScore = async (newScore: number) => {
        try {
            if (newScore > highScore) {
                setHighScore(newScore);
                await AsyncStorage.setItem(`listening_game_high_score_${gameState.currentLevel}`, newScore.toString());
            }
        } catch (error) {
            console.error('Failed to save highest score:', error);
        }
    };

    // 加载题目 - 每次都生成全新的题目
    const loadQuestions = async (level: Difficulty) => {
        setGameState(prev => ({ ...prev, isLoading: true, questions: [] }));

        try {
            const questions: Question[] = [];
            const totalNeeded = 6;

            // 逐题生成，每生成一题就更新状态
            for (let i = 0; i < totalNeeded; i++) {
                // 生成单道题目 - 每次都生成全新的
                const question = await AIService.generateSingleQuestion(level, i);

                if (question) {
                    questions.push(question);

                    // 每生成一题就更新一次状态，让用户看到进度
                    setGameState(prev => ({
                        ...prev,
                        questions: [...questions],
                        totalQuestions: questions.length,
                    }));

                    console.log(`Generated question ${i + 1}/${totalNeeded}:`, question.audioText);
                }

                // 添加一个小延迟，避免请求过快
                if (i < totalNeeded - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // 所有题目生成完成
            setGameState(prev => ({
                ...prev,
                isLoading: false,
                questions: questions,
                totalQuestions: questions.length,
                currentQuestionIndex: 0,
            }));

            console.log(`All ${questions.length} questions generated successfully`);

        } catch (error) {
            console.error('Failed to load questions:', error);
            setGameState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // 重新开始游戏（保留当前难度，重新生成题目）
    const restartGame = async () => {
        // 停止音频播放
        stopAudio();

        // 重置游戏状态
        setGameState(prev => ({
            ...prev,
            isLoading: true,
            questions: [],
            currentQuestionIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctAnswers: 0,
            isAnswered: false,
            isPlaying: false,
            gameCompleted: false,
            showHint: false,
            selectedOptionId: null,
            isAnalyzing: false,
            aiAnalysis: null,
            showAIFeedback: false
        }));

        progressAnim.setValue(0);
        setShowResult(false);

        // 重新生成题目（使用当前难度）
        await loadQuestions(gameState.currentLevel);
    };

    // 重试加载（当加载失败时使用）
    const retryLoadQuestions = async () => {
        setGameState(prev => ({ ...prev, isLoading: true }));
        await loadQuestions(gameState.currentLevel);
    };

    // 获取当前问题
    const getCurrentQuestion = (): Question | null => {
        if (gameState.questions.length === 0) return null;
        return gameState.questions[gameState.currentQuestionIndex];
    };

    // 播放语音
    const playAudio = async () => {
        if (gameState.isPlaying) {
            stopAudio();
            return;
        }

        const question = getCurrentQuestion();
        if (!question) return;

        setGameState(prev => ({ ...prev, isPlaying: true }));

        // 播放按钮动画
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            const rate = gameState.currentLevel === 'easy' ? 0.9 :
                gameState.currentLevel === 'medium' ? 1.0 : 1.1;

            await Speech.speak(question.audioText, {
                language: 'en-US',
                rate,
                pitch: 1.0,
                volume: 1.0,
                onDone: () => {
                    setGameState(prev => ({ ...prev, isPlaying: false }));
                },
                onError: () => {
                    setGameState(prev => ({ ...prev, isPlaying: false }));
                    Alert.alert('Playback failed', 'Unable to play audio, please check your device.');
                }
            });
        } catch (error) {
            setGameState(prev => ({ ...prev, isPlaying: false }));
            Alert.alert('Playback failed', 'Unable to play audio, please check your device.');
        }
    };

    const stopAudio = () => {
        Speech.stop();
        setGameState(prev => ({ ...prev, isPlaying: false }));
    };

    // 选择选项
    const handleOptionSelect = (option: Option) => {
        if (gameState.isAnswered || gameState.gameCompleted) return;

        stopAudio();

        const isCorrect = option.correct;
        setGameState(prev => ({
            ...prev,
            isAnswered: true,
            selectedOptionId: option.id
        }));

        if (isCorrect) {
            Vibration.vibrate(50);
            const newStreak = gameState.streak + 1;
            const newScore = gameState.score + 10 * newStreak;
            const newMaxStreak = Math.max(newStreak, gameState.maxStreak);

            setGameState(prev => ({
                ...prev,
                score: newScore,
                streak: newStreak,
                maxStreak: newMaxStreak,
                correctAnswers: prev.correctAnswers + 1
            }));
        } else {
            Vibration.vibrate([0, 50, 50, 50]);
            setGameState(prev => ({ ...prev, streak: 0 }));
        }

        // 更新进度条
        Animated.timing(progressAnim, {
            toValue: ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100,
            duration: 500,
            useNativeDriver: false,
        }).start();
    };

    // 下一题
    const nextQuestion = () => {
        if (gameState.currentQuestionIndex >= gameState.totalQuestions - 1) {
            endGame();
            return;
        }

        setGameState(prev => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
            isAnswered: false,
            showHint: false,
            selectedOptionId: null
        }));

        stopAudio();
    };

    // 切换难度
    const changeLevel = async (level: Difficulty) => {
        if (gameState.isPlaying) {
            Alert.alert('提示', '请先停止音频播放');
            return;
        }

        setGameState(prev => ({
            ...prev,
            isLoading: true,
            currentLevel: level,
            questions: [],
        }));

        // 加载新难度的题目
        await loadQuestions(level);

        setGameState(prev => ({
            ...prev,
            currentQuestionIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctAnswers: 0,
            isAnswered: false,
            isPlaying: false,
            gameCompleted: false,
            showHint: false,
            selectedOptionId: null,
            isAnalyzing: false,
            aiAnalysis: null,
            showAIFeedback: false
        }));

        progressAnim.setValue(0);
        loadHighScore();
        setShowResult(false);
    };

    // 结束游戏
    const endGame = () => {
        setGameState(prev => ({ ...prev, gameCompleted: true }));
        saveHighScore(gameState.score);
        setShowResult(true);
    };

    // 返回游戏列表
    const goBackToGames = () => {
        router.back();
    };

    // 显示提示
    const toggleHint = () => {
        setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
    };

    // 获取难度标签
    const getLevelLabel = (level: Difficulty): string => {
        switch (level) {
            case 'easy': return 'Beginner';
            case 'medium': return 'Intermediate';
            case 'hard': return 'Advanced';
            default: return 'Beginner';
        }
    };

    // 计算准确率
    const calculateAccuracy = (): number => {
        return Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100);
    };

    // 获取星级评价
    const getStarRating = (accuracy: number): number => {
        return Math.min(5, Math.ceil(accuracy / 20));
    };

    // 获取结果消息
    const getResultMessage = (accuracy: number): string => {
        if (accuracy === 100) return "Excellent! Full marks! Your listening skills are outstanding!";
        if (accuracy >= 80) return "Great! Your listening skills are excellent, keep it up!";
        if (accuracy >= 60) return "Good! With more practice, you'll get even better!";
        return "Keep practicing! Language learning takes time, and persistence pays off!";
    };

    // AI 分析功能
    const analyzeWithAI = async () => {
        if (gameState.isAnalyzing) return;

        setGameState(prev => ({ ...prev, isAnalyzing: true }));

        try {
            const accuracy = calculateAccuracy();

            const aiRequestData = {
                score: gameState.score,
                accuracy: accuracy,
                totalQuestions: gameState.totalQuestions,
                correctAnswers: gameState.correctAnswers,
                maxStreak: gameState.maxStreak,
                difficulty: getLevelLabel(gameState.currentLevel),
                gameType: 'Listening Game',
                timestamp: new Date().toISOString()
            };

            const aiAnalysis = await AIService.analyzeGameResults(aiRequestData);

            setGameState(prev => ({
                ...prev,
                aiAnalysis: aiAnalysis,
                showAIFeedback: true
            }));

        } catch (error: any) {
            console.error('AI analysis error:', error);
            const defaultAnalysis = AIService.getDefaultAnalysisResponse();
            setGameState(prev => ({
                ...prev,
                aiAnalysis: defaultAnalysis,
                showAIFeedback: true
            }));
        } finally {
            setGameState(prev => ({ ...prev, isAnalyzing: false }));
        }
    };

    const currentQuestion = getCurrentQuestion();
    const accuracy = calculateAccuracy();
    const stars = getStarRating(accuracy);
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    // 加载进度
    if (gameState.isLoading) {
        const progress = (gameState.questions.length / 6) * 100;

        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Listening Game',
                        headerStyle: { backgroundColor: '#4b6cb7' },
                        headerTintColor: '#fff',
                        headerLeft: () => (
                            <TouchableOpacity onPress={goBackToGames} style={{ marginLeft: 10 }}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4b6cb7" />
                    <Text style={styles.loadingText}>
                        Generating questions with AI... ({gameState.questions.length}/6)
                    </Text>
                    <View style={styles.loadingProgressBar}>
                        <View style={[styles.loadingProgressFill, { width: `${progress}%` }]} />
                    </View>
                    {gameState.questions.length > 0 && (
                        <Text style={styles.loadingSubtext}>
                            Last generated: {gameState.questions[gameState.questions.length - 1]?.audioText}
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    // 加载失败界面
    if (!currentQuestion && !gameState.isLoading) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Listening Game',
                        headerStyle: { backgroundColor: '#4b6cb7' },
                        headerTintColor: '#fff',
                        headerLeft: () => (
                            <TouchableOpacity onPress={goBackToGames} style={{ marginLeft: 10 }}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle" size={50} color="#F44336" />
                    <Text style={styles.errorText}>Failed to load questions</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retryLoadQuestions}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: '#FF5722', marginTop: 10 }]}
                        onPress={goBackToGames}
                    >
                        <Text style={styles.retryButtonText}>Back to Games</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // AI 反馈模态框
    const AIFeedbackModal = () => {
        if (!gameState.aiAnalysis) return null;

        return (
            <Modal
                visible={gameState.showAIFeedback}
                transparent
                animationType="slide"
                onRequestClose={() => setGameState(prev => ({ ...prev, showAIFeedback: false }))}
            >
                <View style={styles.aiModal}>
                    <View style={styles.aiModalContent}>
                        <TouchableOpacity
                            style={styles.aiCloseButton}
                            onPress={() => setGameState(prev => ({ ...prev, showAIFeedback: false }))}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>

                        <View style={styles.aiHeader}>
                            <LinearGradient
                                colors={['#4b6cb7', '#182848']}
                                style={styles.aiAvatar}
                            >
                                <Ionicons name="sparkles" size={32} color="white" />
                            </LinearGradient>
                            <Text style={styles.aiTitle}>AI Learning Coach</Text>
                            <Text style={styles.aiSubtitle}>Personalized Learning Suggestions</Text>
                        </View>

                        <View style={styles.scoreSummary}>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreLabel}>Score</Text>
                                <Text style={styles.scoreValue}>{gameState.score}</Text>
                            </View>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreLabel}>Accuracy</Text>
                                <Text style={styles.scoreValue}>{calculateAccuracy()}%</Text>
                            </View>
                        </View>

                        <View style={styles.aiSection}>
                            <View style={styles.aiSectionHeader}>
                                <Ionicons name="chatbubble-ellipses" size={20} color="#4b6cb7" />
                                <Text style={styles.aiSectionTitle}>Feedback</Text>
                            </View>
                            <Text style={styles.aiFeedbackText}>{gameState.aiAnalysis.feedback}</Text>
                        </View>

                        {gameState.aiAnalysis.suggestions && gameState.aiAnalysis.suggestions.length > 0 && (
                            <View style={styles.aiSection}>
                                <View style={styles.aiSectionHeader}>
                                    <Ionicons name="bulb" size={20} color="#FF9800" />
                                    <Text style={styles.aiSectionTitle}>Suggestions</Text>
                                </View>
                                <View style={styles.aiList}>
                                    {gameState.aiAnalysis.suggestions.map((suggestion, index) => (
                                        <View key={index} style={styles.aiListItem}>
                                            <Ionicons name="arrow-forward" size={16} color="#4b6cb7" />
                                            <Text style={styles.aiListItemText}>{suggestion}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.aiCloseButtonMain}
                            onPress={() => setGameState(prev => ({ ...prev, showAIFeedback: false }))}
                        >
                            <Text style={styles.aiCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Listening Game',
                    headerStyle: { backgroundColor: '#4b6cb7' },
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity onPress={goBackToGames} style={{ marginLeft: 10 }}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 游戏标题 */}
                <LinearGradient
                    colors={['#4b6cb7', '#182848']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>🎧 Listening Game</Text>
                    <Text style={styles.headerSubtitle}>Listen and choose the correct answer</Text>
                </LinearGradient>

                {/* 游戏信息 */}
                <View style={styles.gameInfo}>
                    <View style={styles.stats}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{gameState.score}</Text>
                            <Text style={styles.statLabel}>Score</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
                            </Text>
                            <Text style={styles.statLabel}>Question</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{gameState.streak}</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                    </View>

                    {/* 难度选择器 */}
                    <View style={styles.levelSelector}>
                        <Text style={styles.levelLabel}>Level:</Text>
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.levelButton,
                                    gameState.currentLevel === level && styles.levelButtonActive
                                ]}
                                onPress={() => changeLevel(level)}
                                disabled={gameState.isPlaying}
                            >
                                <Text style={[
                                    styles.levelButtonText,
                                    gameState.currentLevel === level && styles.levelButtonTextActive
                                ]}>
                                    {level === 'easy' ? 'Beginner' : level === 'medium' ? 'Intermediate' : 'Advanced'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 问题区域 */}
                <View style={styles.questionArea}>
                    <Text style={styles.questionText}>
                        {gameState.currentLevel === 'easy' ? 'Listen and choose the correct word' :
                            gameState.currentLevel === 'medium' ? 'Listen and choose the correct sentence' :
                                'Listen and choose the correct meaning'}
                    </Text>

                    {/* 音频控制 */}
                    <View style={styles.audioControls}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.playButton, gameState.isPlaying && styles.playButtonPlaying]}
                                onPress={playAudio}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={gameState.isPlaying ? "pause" : "volume-high"}
                                    size={32}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </Animated.View>

                        <View style={[styles.audioInfo, gameState.isPlaying && styles.audioInfoPlaying]}>
                            <Ionicons
                                name={gameState.isPlaying ? "play" : "musical-notes"}
                                size={16}
                                color={gameState.isPlaying ? "#4b6cb7" : "#666"}
                            />
                            <Text style={[
                                styles.audioInfoText,
                                gameState.isPlaying && styles.audioInfoTextPlaying
                            ]}>
                                {gameState.isPlaying ? "Playing..." : "Tap to play"}
                            </Text>
                        </View>
                    </View>

                    {/* 进度条 */}
                    <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                </View>

                {/* 选项容器 */}
                <View style={styles.optionsGrid}>
                    {currentQuestion.options.map((option) => {
                        const isSelected = gameState.isAnswered && option.correct;
                        const isIncorrect = gameState.isAnswered &&
                            !option.correct &&
                            option.id === gameState.selectedOptionId;

                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.option,
                                    isSelected && styles.optionCorrect,
                                    isIncorrect && styles.optionIncorrect
                                ]}
                                onPress={() => handleOptionSelect(option)}
                                disabled={gameState.isAnswered || gameState.gameCompleted}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.optionText}>{option.text}</Text>

                                {gameState.isAnswered && (
                                    <View style={styles.optionFeedback}>
                                        {option.correct ? (
                                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                        ) : isIncorrect ? (
                                            <Ionicons name="close-circle" size={24} color="#F44336" />
                                        ) : null}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 反馈区域 */}
                {gameState.isAnswered && (
                    <View style={[
                        styles.feedbackArea,
                        gameState.streak > 0 ? styles.feedbackCorrect : styles.feedbackIncorrect
                    ]}>
                        <Text style={styles.feedbackText}>
                            {gameState.streak > 0
                                ? `Correct! +${10 * gameState.streak} points`
                                : "Incorrect! Try again"}
                        </Text>
                    </View>
                )}

                {/* 提示区域 */}
                {gameState.showHint && (
                    <View style={styles.hintArea}>
                        <View style={styles.hintTitle}>
                            <Ionicons name="bulb" size={20} color="#ff8f00" />
                            <Text style={styles.hintTitleText}>Hint</Text>
                        </View>
                        <Text style={styles.hintText}>{currentQuestion.hint}</Text>
                    </View>
                )}

                {/* 控制按钮 */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlButton, styles.hintButton]}
                        onPress={toggleHint}
                        disabled={gameState.isAnswered}
                    >
                        <Ionicons name="bulb" size={20} color="#666" />
                        <Text style={styles.hintButtonText}>
                            {gameState.showHint ? "Hide Hint" : "Show Hint"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, styles.nextButton]}
                        onPress={nextQuestion}
                        disabled={!gameState.isAnswered}
                    >
                        <Ionicons
                            name={gameState.currentQuestionIndex >= gameState.totalQuestions - 1 ? "flag" : "arrow-forward"}
                            size={20}
                            color="white"
                        />
                        <Text style={styles.nextButtonText}>
                            {gameState.currentQuestionIndex >= gameState.totalQuestions - 1
                                ? "View Results"
                                : "Next"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 最高分显示 */}
                <View style={styles.highScoreContainer}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.highScoreText}>High Score: {highScore}</Text>
                    <Text style={styles.currentLevelText}>{getLevelLabel(gameState.currentLevel)}</Text>
                </View>
            </ScrollView>

            {/* 结果模态框 */}
            <Modal
                visible={showResult}
                transparent
                animationType="slide"
                onRequestClose={() => setShowResult(false)}
            >
                <View style={styles.resultModal}>
                    <View style={styles.resultContent}>
                        <View style={styles.completionBadge}>
                            <Ionicons name="trophy" size={20} color="white" />
                            <Text style={styles.completionBadgeText}>Quiz Completed</Text>
                        </View>

                        <Text style={styles.resultTitle}>Quiz Results</Text>
                        <Text style={styles.finalScore}>{gameState.score}</Text>

                        {/* 星级评价 */}
                        <View style={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                                <Text key={i} style={styles.star}>
                                    {i < stars ? '★' : '☆'}
                                </Text>
                            ))}
                        </View>

                        <Text style={styles.resultMessage}>{getResultMessage(accuracy)}</Text>

                        {/* 详细数据 */}
                        <View style={styles.resultDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Correct Answers:</Text>
                                <Text style={styles.detailValue}>{gameState.correctAnswers}/{gameState.totalQuestions}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Accuracy:</Text>
                                <Text style={styles.detailValue}>{accuracy}%</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Max Streak:</Text>
                                <Text style={styles.detailValue}>{gameState.maxStreak}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Level:</Text>
                                <Text style={styles.detailValue}>{getLevelLabel(gameState.currentLevel)}</Text>
                            </View>
                        </View>

                        {/* 结果操作按钮 */}
                        <View style={styles.resultActions}>
                            <TouchableOpacity
                                style={[styles.resultButton, styles.playAgainButton]}
                                onPress={restartGame}
                            >
                                <Ionicons name="refresh" size={20} color="white" />
                                <Text style={styles.playAgainButtonText}>Play Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.resultButton, styles.aiAnalysisButton]}
                                onPress={analyzeWithAI}
                                disabled={gameState.isAnalyzing}
                            >
                                {gameState.isAnalyzing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="white" />
                                        <Text style={styles.aiAnalysisButtonText}>AI Analysis</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* 返回按钮 */}
                            <TouchableOpacity
                                style={[styles.resultButton, styles.backButton]}
                                onPress={goBackToGames}
                            >
                                <Ionicons name="arrow-back" size={20} color="white" />
                                <Text style={styles.backButtonText}>Back to Games</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* AI 反馈模态框 */}
            <AIFeedbackModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
        textAlign: 'center',
    },
    loadingProgressBar: {
        width: '80%',
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginTop: 20,
        overflow: 'hidden',
    },
    loadingProgressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    loadingSubtext: {
        marginTop: 20,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#F44336',
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#4b6cb7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
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
    gameInfo: {
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
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    levelSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    levelLabel: {
        fontSize: 16,
        color: '#333',
        marginRight: 10,
    },
    levelButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#4b6cb7',
        backgroundColor: 'white',
        marginHorizontal: 5,
        marginVertical: 3,
    },
    levelButtonActive: {
        backgroundColor: '#4b6cb7',
    },
    levelButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b6cb7',
    },
    levelButtonTextActive: {
        color: 'white',
    },
    questionArea: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    questionText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    audioControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 15,
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4b6cb7',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    playButtonPlaying: {
        backgroundColor: '#182848',
    },
    audioInfo: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    audioInfoPlaying: {
        backgroundColor: '#e8edff',
    },
    audioInfoText: {
        fontSize: 14,
        color: '#666',
    },
    audioInfoTextPlaying: {
        color: '#4b6cb7',
        fontWeight: '600',
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4b6cb7',
        borderRadius: 4,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    option: {
        width: '48%',
        minHeight: 100,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 16,
        backgroundColor: 'white',
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    optionCorrect: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    optionIncorrect: {
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    optionFeedback: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    feedbackArea: {
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedbackCorrect: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    feedbackIncorrect: {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
    },
    feedbackText: {
        fontSize: 16,
        fontWeight: '500',
    },
    hintArea: {
        backgroundColor: '#fff8e1',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#ffb300',
    },
    hintTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    hintTitleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff8f00',
        marginLeft: 8,
    },
    hintText: {
        fontSize: 14,
        color: '#5d4037',
        lineHeight: 20,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        flex: 1,
        gap: 8,
    },
    hintButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#ddd',
    },
    hintButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    nextButton: {
        backgroundColor: '#4b6cb7',
    },
    nextButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    highScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    highScoreText: {
        fontSize: 14,
        color: '#666',
    },
    currentLevelText: {
        fontSize: 12,
        color: '#4b6cb7',
        backgroundColor: 'rgba(75, 108, 183, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    resultModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
    },
    completionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30,
        marginBottom: 20,
        gap: 8,
    },
    completionBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4b6cb7',
        marginBottom: 10,
    },
    finalScore: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#182848',
        marginBottom: 10,
    },
    stars: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 5,
    },
    star: {
        fontSize: 24,
        color: '#FFD700',
    },
    resultMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    resultDetails: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        width: '100%',
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#182848',
    },
    resultActions: {
        flexDirection: 'column',
        gap: 10,
        width: '100%',
    },
    resultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    playAgainButton: {
        backgroundColor: '#4b6cb7',
    },
    playAgainButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    aiAnalysisButton: {
        backgroundColor: '#9C27B0',
    },
    aiAnalysisButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    backButton: {
        backgroundColor: '#FF5722',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    // AI 模态框样式
    aiModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    aiModalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        width: '95%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    aiCloseButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
        padding: 5,
    },
    aiHeader: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    aiAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    aiTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    aiSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    scoreSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    scoreItem: {
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    aiSection: {
        marginBottom: 20,
    },
    aiSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    aiSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    aiFeedbackText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
    },
    aiList: {
        gap: 8,
    },
    aiListItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 6,
    },
    aiListItemText: {
        fontSize: 14,
        color: '#444',
        flex: 1,
        lineHeight: 20,
    },
    aiCloseButtonMain: {
        backgroundColor: '#4b6cb7',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    aiCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});