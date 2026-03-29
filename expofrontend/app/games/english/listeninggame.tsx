// games/english/listeninggame.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
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
import {useAuth} from "@/src/auth/AuthContext";
import axios from "axios";

const { width } = Dimensions.get('window');

// 游戏数据类型
type Difficulty = 'easy' | 'medium' | 'hard';

type Option = {
    id: string;
    text: string;
    correct: boolean;
};

// 游戏状态类型
type GameState = {
    currentLevel: Difficulty | null;
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
    isLoading: boolean;
    questions: Question[];
};

// 难度配置
const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; description: string; hint: string; icon: string }> = {
    easy: {
        label: 'Beginner',
        color: '#4CAF50',
        description: 'Simple words and phrases',
        hint: 'Slow speed • Basic vocabulary',
        icon: 'leaf'
    },
    medium: {
        label: 'Intermediate',
        color: '#FF9800',
        description: 'Short sentences',
        hint: 'Normal speed • Common phrases',
        icon: 'flame'
    },
    hard: {
        label: 'Advanced',
        color: '#F44336',
        description: 'Complex sentences',
        hint: 'Fast speed • Idiomatic expressions',
        icon: 'flash'
    }
};

export default function ListeningScreen() {
    // 游戏状态
    const [gameState, setGameState] = useState<GameState>({
        currentLevel: null,
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
        isLoading: false,
        questions: [],
    });
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [highScore, setHighScore] = useState(0);

    // 动画引用
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // 加载最高分
    useEffect(() => {
        if (gameState.currentLevel) {
            loadHighScore();
        }
    }, [gameState.currentLevel]);

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

    // 加载题目
    const loadQuestions = async (level: Difficulty) => {
        setGameState(prev => ({ ...prev, isLoading: true, questions: [] }));

        try {
            const questions: Question[] = [];
            const totalNeeded = 6;

            for (let i = 0; i < totalNeeded; i++) {
                const question = await AIService.generateSingleQuestion(level, i);

                if (question) {
                    questions.push(question);

                    setGameState(prev => ({
                        ...prev,
                        questions: [...questions],
                        totalQuestions: questions.length,
                    }));

                    console.log(`Generated question ${i + 1}/${totalNeeded}:`, question.audioText);
                }

                if (i < totalNeeded - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                questions: questions,
                totalQuestions: questions.length,
                currentQuestionIndex: 0,
                gameCompleted: false,
                score: 0,
                streak: 0,
                maxStreak: 0,
                correctAnswers: 0,
                isAnswered: false,
            }));

            progressAnim.setValue(0);

            console.log(`All ${questions.length} questions generated successfully`);

        } catch (error) {
            console.error('Failed to load questions:', error);
            setGameState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // 选择难度并开始游戏
    const selectDifficulty = async (level: Difficulty) => {
        setGameState(prev => ({
            ...prev,
            currentLevel: level,
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
        }));

        progressAnim.setValue(0);
        await loadQuestions(level);
    };

    // 重新开始游戏
    const restartGame = async () => {
        if (!gameState.currentLevel) return;

        stopAudio();

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
        }));

        progressAnim.setValue(0);
        await loadQuestions(gameState.currentLevel);
    };

    // 重试加载
    const retryLoadQuestions = async () => {
        if (!gameState.currentLevel) return;
        setGameState(prev => ({ ...prev, isLoading: true }));
        await loadQuestions(gameState.currentLevel);
    };

    // 返回难度选择页面
    const backToDifficultySelect = () => {
        stopAudio();
        setGameState({
            currentLevel: null,
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
            isLoading: false,
            questions: [],
        });
    };

    // 返回主页面
    const goBackToGames = () => {
        router.back();
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

        Animated.timing(progressAnim, {
            toValue: ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100,
            duration: 500,
            useNativeDriver: false,
        }).start();
    };

    // 下一题或结束游戏
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

    // 结束游戏
    // 结束游戏
    const endGame = async () => {
        setGameState(prev => ({ ...prev, gameCompleted: true }));
        saveHighScore(gameState.score);

        // Save score to database
        const percentageScore = calculatePercentageScore();
        await saveScore(percentageScore);
    };

    // 显示提示
    const toggleHint = () => {
        setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
    };

    // 获取难度标签
    const getLevelLabel = (level: Difficulty): string => {
        return DIFFICULTY_CONFIG[level].label;
    };

    // 计算准确率
    const calculateAccuracy = (): number => {
        return Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100);
    };

    // 计算分数（满分100分制）
    const calculatePercentageScore = (): number => {
        // 最高分 = 总题数 * 10 * (最大连击系数，最高6) = 6 * 10 * 6 = 360
        const maxPossibleScore = gameState.totalQuestions * 10 * 6;
        return Math.round((gameState.score / maxPossibleScore) * 100);
    };

    // 获取结果消息
    const getResultMessage = (accuracy: number): string => {
        if (accuracy === 100) return "Excellent! Perfect score! Your listening skills are outstanding!";
        if (accuracy >= 80) return "Great! Your listening skills are excellent, keep it up!";
        if (accuracy >= 60) return "Good! With more practice, you'll get even better!";
        return "Keep practicing! Language learning takes time, and persistence pays off!";
    };

    // 获取星级评价
    const getStarRating = (percentage: number): number => {
        return Math.min(5, Math.ceil(percentage / 20));
    };

    const saveScore = async (finalScore: number) => {
        setIsSaving(true);
        try {
            // 注意：這裡建議使用你電腦的 IP 地址代替 localhost，如果是手機實體機測試的話
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "Listening Game",
                scores: finalScore,
                difficulty: getLevelLabel(gameState.currentLevel!).toUpperCase()
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 儲存成功後可以選擇跳轉或留在結果頁
            // router.push('/rank/leaderboard');
        } catch (e) {
            console.error("Save score failed:", e);
            // 如果失敗了，我們至少讓玩家留在結果頁看到自己的分數
        } finally {
            setIsSaving(false);
        }
    };

    const currentQuestion = getCurrentQuestion();
    const accuracy = calculateAccuracy();
    const percentageScore = calculatePercentageScore();
    const stars = getStarRating(percentageScore);

    // 难度选择页面 (采用 writing.tsx 风格)
    if (gameState.currentLevel === null) {
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
                    style={styles.difficultyScroll}
                    contentContainerStyle={styles.difficultyScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.difficultyContainer}>
                        <Text style={styles.difficultyTitle}>Listening Game</Text>
                        <Text style={styles.difficultySubtitle}>Test your listening skills</Text>

                        <View style={styles.difficultyOptions}>
                            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => {
                                const config = DIFFICULTY_CONFIG[level];
                                return (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.difficultyCard,
                                            { borderColor: config.color }
                                        ]}
                                        onPress={() => selectDifficulty(level)}
                                    >
                                        <View style={[styles.difficultyBadge, { backgroundColor: config.color }]}>
                                            <Text style={styles.difficultyBadgeText}>{config.label}</Text>
                                        </View>
                                        <Text style={styles.difficultyDescription}>
                                            {config.description}
                                        </Text>
                                        <Text style={styles.difficultyHint}>
                                            {config.hint}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

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
                            <TouchableOpacity onPress={backToDifficultySelect} style={{ marginLeft: 10 }}>
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
                </View>
            </View>
        );
    }

    // 加载失败界面
    if (!currentQuestion && !gameState.isLoading && !gameState.gameCompleted) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Listening Game',
                        headerStyle: { backgroundColor: '#4b6cb7' },
                        headerTintColor: '#fff',
                        headerLeft: () => (
                            <TouchableOpacity onPress={backToDifficultySelect} style={{ marginLeft: 10 }}>
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
                        onPress={backToDifficultySelect}
                    >
                        <Text style={styles.retryButtonText}>Back to Difficulty</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // 游戏结束页面 - 显示结果
    if (gameState.gameCompleted) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Game Results',
                        headerStyle: { backgroundColor: '#4b6cb7' },
                        headerTintColor: '#fff',
                        headerLeft: () => (
                            <TouchableOpacity onPress={backToDifficultySelect} style={{ marginLeft: 10 }}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <ScrollView contentContainerStyle={styles.resultPageContainer}>
                    <LinearGradient
                        colors={['#4b6cb7', '#182848']}
                        style={styles.resultHeader}
                    >
                        <Ionicons name="trophy" size={60} color="#FFD700" />
                        <Text style={styles.resultHeaderTitle}>Quiz Completed!</Text>
                    </LinearGradient>

                    <View style={styles.resultCard}>
                        {/* 分数显示 */}
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreCircleNumber}>{percentageScore}</Text>
                            <Text style={styles.scoreCircleLabel}>out of 100</Text>
                        </View>

                        {/* 星级评价 */}
                        <View style={styles.resultStars}>
                            {[...Array(5)].map((_, i) => (
                                <Ionicons
                                    key={i}
                                    name={i < stars ? "star" : "star-outline"}
                                    size={32}
                                    color="#FFD700"
                                />
                            ))}
                        </View>

                        <Text style={styles.resultMessage}>{getResultMessage(accuracy)}</Text>

                        {/* 详细数据 */}
                        <View style={styles.resultStats}>
                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Correct Answers</Text>
                                    <Text style={styles.resultStatValue}>
                                        {gameState.correctAnswers} / {gameState.totalQuestions}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="analytics" size={24} color="#FF9800" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Accuracy</Text>
                                    <Text style={styles.resultStatValue}>{accuracy}%</Text>
                                </View>
                            </View>

                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="flag" size={24} color="#4b6cb7" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Total Points</Text>
                                    <Text style={styles.resultStatValue}>{gameState.score}</Text>
                                </View>
                            </View>

                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="flame" size={24} color="#F44336" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Max Streak</Text>
                                    <Text style={styles.resultStatValue}>{gameState.maxStreak}</Text>
                                </View>
                            </View>

                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="medal" size={24} color="#FFD700" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Difficulty</Text>
                                    <Text style={styles.resultStatValue}>
                                        {getLevelLabel(gameState.currentLevel!)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="trophy" size={24} color="#FF9800" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>High Score</Text>
                                    <Text style={styles.resultStatValue}>{highScore}</Text>
                                </View>
                            </View>
                        </View>

                        {/* 操作按钮 */}
                        <View style={styles.resultButtons}>
                            <TouchableOpacity
                                style={[styles.resultButton, styles.playAgainButton]}
                                onPress={restartGame}
                            >
                                <Ionicons name="refresh" size={20} color="white" />
                                <Text style={styles.resultButtonText}>Play Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.resultButton, styles.changeDifficultyButton]}
                                onPress={backToDifficultySelect}
                            >
                                <Ionicons name="options" size={20} color="white" />
                                <Text style={styles.resultButtonText}>Change Difficulty</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.resultButton, styles.homeButton]}
                                onPress={goBackToGames}
                            >
                                <Ionicons name="home" size={20} color="white" />
                                <Text style={styles.resultButtonText}>Back to Home</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // 游戏主界面
    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: `Listening Game - ${getLevelLabel(gameState.currentLevel)}`,
                    headerStyle: { backgroundColor: '#4b6cb7' },
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity onPress={backToDifficultySelect} style={{ marginLeft: 10 }}>
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
                {/* 游戏信息 */}
                <View style={styles.gameInfo}>
                    <View style={styles.stats}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{gameState.score}</Text>
                            <Text style={styles.statLabel}>Points</Text>
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

                    <View style={styles.currentDifficultyBadge}>
                        <Text style={styles.currentDifficultyText}>
                            {getLevelLabel(gameState.currentLevel)}
                        </Text>
                    </View>
                </View>

                {/* 问题区域 */}
                <View style={styles.questionArea}>
                    <Text style={styles.questionText}>
                        {gameState.currentLevel === 'easy' ? 'Listen and choose the correct word' :
                            gameState.currentLevel === 'medium' ? 'Listen and choose the correct sentence' :
                                'Listen and choose the correct meaning'}
                    </Text>

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

                    <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
                    </View>
                </View>

                {/* 选项容器 */}
                <View style={styles.optionsGrid}>
                    {currentQuestion?.options.map((option) => {
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
                {gameState.showHint && currentQuestion && (
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
                                ? "Finish"
                                : "Next"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.highScoreContainer}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.highScoreText}>High Score: {highScore}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    // 难度选择页面样式 (采用 writing.tsx 风格)
    difficultyScroll: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    difficultyScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    difficultyContainer: {
        paddingHorizontal: 20,
    },
    difficultyTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    difficultySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    difficultyOptions: {
        gap: 16,
    },
    difficultyCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    difficultyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 12,
    },
    difficultyBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    difficultyDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    difficultyHint: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
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
    gameInfo: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
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
        marginBottom: 15,
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
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    currentDifficultyBadge: {
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    currentDifficultyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4b6cb7',
        backgroundColor: 'rgba(75, 108, 183, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
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
    // 结果页面样式
    resultPageContainer: {
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
    },
    resultHeader: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    resultHeaderTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
    },
    resultCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        marginHorizontal: 20,
        marginBottom: 30,
        padding: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    scoreCircle: {
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreCircleNumber: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    scoreCircleLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: -8,
    },
    resultStars: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    resultMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    resultStats: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    resultStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    resultStatIcon: {
        width: 40,
        alignItems: 'center',
    },
    resultStatInfo: {
        flex: 1,
        marginLeft: 12,
    },
    resultStatLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    resultStatValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    resultButtons: {
        gap: 12,
    },
    resultButton: {
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
    homeButton: {
        backgroundColor: '#FF5722',
    },
    resultButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});