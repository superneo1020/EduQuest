// app/games/components/ListeningGame.tsx
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
    SafeAreaView,
    ActivityIndicator,
    Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 游戏数据类型
type Difficulty = 'easy' | 'medium' | 'hard';

type Option = {
    id: string;
    text: string;
    emoji: string;
    correct: boolean;
};

type Question = {
    id: string;
    audioText: string;
    options: Option[];
    hint: string;
    level: Difficulty;
};

// 游戏数据库
const gameData: Record<Difficulty, Question[]> = {
    easy: [
        {
            id: '1',
            audioText: "apple",
            options: [
                { id: '1', text: "apple", emoji: "🍎", correct: true },
                { id: '2', text: "banana", emoji: "🍌", correct: false },
                { id: '3', text: "orange", emoji: "🍊", correct: false },
                { id: '4', text: "grape", emoji: "🍇", correct: false }
            ],
            hint: "This is a common red or green fruit, sometimes called the fruit of wisdom.",
            level: 'easy'
        },
        {
            id: '2',
            audioText: "cat",
            options: [
                { id: '1', text: "dog", emoji: "🐶", correct: false },
                { id: '2', text: "cat", emoji: "🐱", correct: true },
                { id: '3', text: "bird", emoji: "🐦", correct: false },
                { id: '4', text: "fish", emoji: "🐟", correct: false }
            ],
            hint: "This is a common pet that makes a \"meow\" sound.",
            level: 'easy'
        },
        {
            id: '3',
            audioText: "sun",
            options: [
                { id: '1', text: "sun", emoji: "☀️", correct: true },
                { id: '2', text: "moon", emoji: "🌙", correct: false },
                { id: '3', text: "star", emoji: "⭐", correct: false },
                { id: '4', text: "cloud", emoji: "☁️", correct: false }
            ],
            hint: "This is the brightest celestial body in the sky during the day, giving us light and heat.",
            level: 'easy'
        },
        {
            id: '4',
            audioText: "car",
            options: [
                { id: '1', text: "car", emoji: "🚗", correct: true },
                { id: '2', text: "bus", emoji: "🚌", correct: false },
                { id: '3', text: "bicycle", emoji: "🚲", correct: false },
                { id: '4', text: "train", emoji: "🚆", correct: false }
            ],
            hint: "This is a common four-wheeled vehicle, usually powered by gasoline or electricity",
            level: 'easy'
        }
    ],
    medium: [
        {
            id: '5',
            audioText: "I like coffee",
            options: [
                { id: '1', text: "I like coffee", emoji: "☕", correct: true },
                { id: '2', text: "I like tea", emoji: "🍵", correct: false },
                { id: '3', text: "I like water", emoji: "💧", correct: false },
                { id: '4', text: "I like juice", emoji: "🧃", correct: false }
            ],
            hint: "This is a common beverage, often consumed in the morning, containing caffeine",
            level: 'medium'
        },
        {
            id: '6',
            audioText: "It's raining",
            options: [
                { id: '1', text: "It's sunny", emoji: "🌤️", correct: false },
                { id: '2', text: "It's raining", emoji: "🌧️", correct: true },
                { id: '3', text: "It's windy", emoji: "💨", correct: false },
                { id: '4', text: "It's snowing", emoji: "❄️", correct: false }
            ],
            hint: "This is a weather phenomenon where water falls from the sky, often requiring an umbrella when going out",
            level: 'medium'
        },
        {
            id: '7',
            audioText: "Good morning",
            options: [
                { id: '1', text: "Good night", emoji: "🌙", correct: false },
                { id: '2', text: "Good afternoon", emoji: "☀️", correct: false },
                { id: '3', text: "Good morning", emoji: "🌅", correct: true },
                { id: '4', text: "Goodbye", emoji: "👋", correct: false }
            ],
            hint: "This is a common greeting used when meeting someone in the morning",
            level: 'medium'
        },
        {
            id: '8',
            audioText: "I'm hungry",
            options: [
                { id: '1', text: "I'm thirsty", emoji: "💧", correct: false },
                { id: '2', text: "I'm tired", emoji: "😴", correct: false },
                { id: '3', text: "I'm hungry", emoji: "🍽️", correct: true },
                { id: '4', text: "I'm fine", emoji: "👍", correct: false }
            ],
            hint: "This is a physical sensation indicating the need for food",
            level: 'medium'
        }
    ],
    hard: [
        {
            id: '9',
            audioText: "Where is the library?",
            options: [
                { id: '1', text: "Ask about time", emoji: "🕒", correct: false },
                { id: '2', text: "Ask about library location", emoji: "📚", correct: true },
                { id: '3', text: "Ask about restaurant recommendations", emoji: "🍴", correct: false },
                { id: '4', text: "Ask about transportation", emoji: "🚆", correct: false }
            ],
            hint: "This is a question asking for a location, often related to books and reading",
            level: 'hard'
        },
        {
            id: '10',
            audioText: "Can you help me?",
            options: [
                { id: '1', text: "Provide assistance", emoji: "🤝", correct: true },
                { id: '2', text: "Ask about price", emoji: "💰", correct: false },
                { id: '3', text: "Self-introduction", emoji: "👤", correct: false },
                { id: '4', text: "Express gratitude", emoji: "🙏", correct: false }
            ],
            hint: "When you need help from others, this is a common request",
            level: 'hard'
        },
        {
            id: '11',
            audioText: "How much does it cost?",
            options: [
                { id: '1', text: "Ask about price", emoji: "💰", correct: true },
                { id: '2', text: "Ask about time", emoji: "🕒", correct: false },
                { id: '3', text: "Ask about direction", emoji: "🧭", correct: false },
                { id: '4', text: "Ask about size", emoji: "📏", correct: false }
            ],
            hint: "This is a common question when shopping for an item's price",
            level: 'hard'
        },
        {
            id: '12',
            audioText: "What time is it?",
            options: [
                { id: '1', text: "Ask about date", emoji: "📅", correct: false },
                { id: '2', text: "Ask about weather", emoji: "🌤️", correct: false },
                { id: '3', text: "Ask about time", emoji: "🕒", correct: true },
                { id: '4', text: "Ask about age", emoji: "🎂", correct: false }
            ],
            hint: "This is a common question when shopping for an item's price",
            level: 'hard'
        }
    ]
};

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
};

const ListeningGame = () => {
    // 游戏状态
    const [gameState, setGameState] = useState<GameState>({
        currentLevel: 'easy',
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctAnswers: 0,
        totalQuestions: 4,
        isAnswered: false,
        isPlaying: false,
        gameCompleted: false,
        showHint: false
    });

    const [highScore, setHighScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 动画引用
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const optionAnimations = useRef<Animated.Value[]>([]).current;

    // 获取当前问题
    const getCurrentQuestion = (): Question => {
        const questions = gameData[gameState.currentLevel];
        return questions[gameState.currentQuestionIndex];
    };

    // 加载最高分
    useEffect(() => {
        loadHighScore();
        initializeAnimations();
    }, []);

    const loadHighScore = async () => {
        try {
            const saved = await AsyncStorage.getItem(`listening_game_high_score_${gameState.currentLevel}`);
            if (saved) setHighScore(parseInt(saved));
        } catch (error) {
            console.error('加载最高分失败:', error);
        }
    };

    const saveHighScore = async (newScore: number) => {
        try {
            if (newScore > highScore) {
                setHighScore(newScore);
                await AsyncStorage.setItem(`listening_game_high_score_${gameState.currentLevel}`, newScore.toString());
            }
        } catch (error) {
            console.error('保存最高分失败:', error);
        }
    };

    const initializeAnimations = () => {
        // 初始化选项动画
        for (let i = 0; i < 4; i++) {
            optionAnimations[i] = new Animated.Value(1);
        }
    };

    // 播放语音
    const playAudio = async () => {
        if (gameState.isPlaying) {
            stopAudio();
            return;
        }

        const question = getCurrentQuestion();

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
            // 设置语音参数
            const rate = gameState.currentLevel === 'easy' ? 0.9 :
                gameState.currentLevel === 'medium' ? 1.0 : 1.1;

            Speech.speak(question.audioText, {
                language: 'en-US',
                rate,
                pitch: 1.0,
                volume: 1.0,
                onStart: () => {
                    setGameState(prev => ({...prev, isPlaying: true}));
                },
                onDone: () => {
                    setGameState(prev => ({...prev, isPlaying: false}));
                },
                onError: (error) => {
                    console.error('语音播放错误:', error);
                    setGameState(prev => ({...prev, isPlaying: false}));
                    Alert.alert('Playback failed', 'Unable to play audio, please check your device.');
                }
            });
        } catch (error) {
            console.error('abnormal audio playback:', error);
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

        // 停止当前语音
        stopAudio();

        const isCorrect = option.correct;
        setGameState(prev => ({ ...prev, isAnswered: true }));

        // 播放选择动画
        const optionIndex = getCurrentQuestion().options.findIndex(o => o.id === option.id);
        if (optionIndex >= 0 && optionAnimations[optionIndex]) {
            Animated.sequence([
                Animated.timing(optionAnimations[optionIndex], {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(optionAnimations[optionIndex], {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        // 更新分数和连对记录
        if (isCorrect) {
            Vibration.vibrate(50);
            const newStreak = gameState.streak + 1;
            const newScore = gameState.score + 10 * newStreak;
            const newMaxStreak = Math.max(newStreak, gameState.maxStreak);
            const newCorrectAnswers = gameState.correctAnswers + 1;

            setGameState(prev => ({
                ...prev,
                score: newScore,
                streak: newStreak,
                maxStreak: newMaxStreak,
                correctAnswers: newCorrectAnswers
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
            // 游戏结束
            endGame();
            return;
        }

        // 重置状态
        setGameState(prev => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
            isAnswered: false,
            showHint: false
        }));

        // 停止语音
        stopAudio();
    };

    // 切换难度
    const changeLevel = (level: Difficulty) => {
        if (gameState.gameCompleted || gameState.isPlaying) {
            Alert.alert('hint', 'Please finish the current game or stop voice playback first.');
            return;
        }

        setGameState({
            currentLevel: level,
            currentQuestionIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctAnswers: 0,
            totalQuestions: 4,
            isAnswered: false,
            isPlaying: false,
            gameCompleted: false,
            showHint: false
        });

        // 重置进度条
        progressAnim.setValue(0);

        // 加载新难度的最高分
        loadHighScore();
    };

    // 结束游戏
    const endGame = () => {
        setGameState(prev => ({ ...prev, gameCompleted: true }));
        saveHighScore(gameState.score);
        setShowResult(true);
    };

    // 重新开始游戏
    const restartGame = () => {
        setGameState({
            currentLevel: 'easy',
            currentQuestionIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctAnswers: 0,
            totalQuestions: 4,
            isAnswered: false,
            isPlaying: false,
            gameCompleted: false,
            showHint: false
        });

        // 重置进度条
        progressAnim.setValue(0);
        setShowResult(false);
    };

    // 显示提示
    const toggleHint = () => {
        setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
    };

    // 获取难度标签
    const getLevelLabel = (level: Difficulty): string => {
        switch (level) {
            case 'easy': return 'Elementary (vocabulary)';
            case 'medium': return 'Intermediate (short sentences)';
            case 'hard': return 'Advanced (dialogue)';
        }
    };

    // 获取当前问题描述
    const getQuestionDescription = (): string => {
        const level = gameState.currentLevel;
        if (level === 'easy') return 'Please listen to the word and select the correct image or text';
        if (level === 'medium') return 'Please listen to the short sentence and select the correct image or text';
        return 'Please listen to the dialogue excerpt and select the correct image or text';
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
        if (accuracy === 100) return "Excellent! You scored a perfect score! Your listening skills are outstanding!";
        if (accuracy >= 80) return "Great job! Your listening skills are good, keep it up!";
        if (accuracy >= 60) return "Good effort! With more practice, your listening skills will improve!";
        if (accuracy >= 40) return "Keep trying! Listen more and you'll get better!";
        return "Don't give up! Language learning takes time, keep practicing and you'll improve!";
    };

    const currentQuestion = getCurrentQuestion();
    const accuracy = calculateAccuracy();
    const stars = getStarRating(accuracy);
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#f5f7fa', '#c3cfe2']}
                style={styles.gradient}
            >
                {/* 游戏标题 */}
                <View style={styles.header}>
                    <Ionicons name="headset" size={32} color="#4b6cb7" />
                    <Text style={styles.title}>Listening multiple choice questions</Text>
                    <Text style={styles.subtitle}>Listen & Choose - Listen to the image/Text</Text>
                </View>

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
                            <Text style={styles.statLabel}>Questions</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{gameState.streak}</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                    </View>

                    {/* 难度选择器 */}
                    <View style={styles.levelSelector}>
                        <Text style={styles.levelLabel}>Difficulty:</Text>
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
                        {getQuestionDescription()}
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
                                {gameState.isPlaying ? "Now playing..." : "Click the play button to hear the pronunciation"}
                            </Text>
                        </View>
                    </View>

                    {/* 当前音频文字 */}
                    <View style={styles.currentAudioText}>
                        <Ionicons name="volume-high" size={16} color="#4b6cb7" />
                        <Text style={styles.audioTextDisplay}>
                            "{currentQuestion.audioText}"
                        </Text>
                    </View>

                    {/* 进度条 */}
                    <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                </View>

                {/* 选项容器 */}
                <ScrollView
                    style={styles.optionsContainer}
                    contentContainerStyle={styles.optionsContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.optionsGrid}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = gameState.isAnswered && option.correct;
                            const isIncorrect = gameState.isAnswered && !option.correct &&
                                gameState.isAnswered && option.id ===
                                currentQuestion.options.find(o => !o.correct)?.id;

                            return (
                                <Animated.View
                                    key={option.id}
                                    style={[
                                        styles.option,
                                        isSelected && styles.optionCorrect,
                                        isIncorrect && styles.optionIncorrect,
                                        { transform: [{ scale: optionAnimations[index] || 1 }] }
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={styles.optionButton}
                                        onPress={() => handleOptionSelect(option)}
                                        disabled={gameState.isAnswered || gameState.gameCompleted}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                        <Text style={styles.optionText}>{option.text}</Text>

                                        {/* 显示正确/错误标记 */}
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
                                </Animated.View>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* 反馈区域 */}
                {gameState.isAnswered && (
                    <View style={[
                        styles.feedbackArea,
                        gameState.streak > 0 ? styles.feedbackCorrect : styles.feedbackIncorrect
                    ]}>
                        <Text style={styles.feedbackText}>
                            {gameState.streak > 0
                                ? `Correct! +${10 * gameState.streak} points`
                                : "Incorrect! Please try again"}
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
                                : "Next Question"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 最高分显示 */}
                <View style={styles.highScoreContainer}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.highScoreText}>High Score: {highScore}</Text>
                    <Text style={styles.currentLevelText}>{getLevelLabel(gameState.currentLevel)}</Text>
                </View>
            </LinearGradient>

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

                        <Text style={styles.resultTitle}>
                            <Ionicons name="trophy" size={28} color="#4b6cb7" />
                            <Text>  Quiz Results</Text>
                        </Text>

                        <Text style={styles.finalScore}>{gameState.score}</Text>

                        {/* 星级评价 */}
                        <View style={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                                <Text key={i} style={styles.star}>
                                    {i < stars ? '★' : '☆'}
                                </Text>
                            ))}
                        </View>

                        <Text style={styles.resultMessage}>
                            {getResultMessage(accuracy)}
                        </Text>

                        {/* 详细数据 */}
                        <View style={styles.resultDetails}>
                            <Text style={styles.detailsTitle}>
                                <Ionicons name="stats-chart" size={20} color="#4b6cb7" />
                                <Text>  Detailed Data</Text>
                            </Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Correct Answers:</Text>
                                <Text style={styles.detailValue}>{gameState.correctAnswers}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Total Questions:</Text>
                                <Text style={styles.detailValue}>{gameState.totalQuestions}</Text>
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
                                <Text style={styles.detailLabel}>Difficulty Level:</Text>
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
                                style={[styles.resultButton, styles.changeLevelButton]}
                                onPress={() => {
                                    setShowResult(false);
                                    changeLevel(gameState.currentLevel === 'easy' ? 'medium' :
                                        gameState.currentLevel === 'medium' ? 'hard' : 'easy');
                                }}
                            >
                                <Ionicons name="swap-horizontal" size={20} color="#4b6cb7" />
                                <Text style={styles.changeLevelButtonText}>Change Level</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#182848',
        marginTop: 10,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    gameInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
        fontSize: 28,
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
        paddingHorizontal: 16,
        paddingVertical: 8,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#4b6cb7',
    },
    levelButtonTextActive: {
        color: 'white',
    },
    questionArea: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    questionText: {
        fontSize: 18,
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
        width: 70,
        height: 70,
        borderRadius: 35,
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
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
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
    currentAudioText: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 10,
    },
    audioTextDisplay: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
        marginLeft: 8,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        marginTop: 15,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4b6cb7',
        borderRadius: 4,
    },
    optionsContainer: {
        flex: 1,
        marginBottom: 15,
    },
    optionsContent: {
        flexGrow: 1,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    option: {
        width: (width - 60) / 2,
        borderWidth: 3,
        borderColor: '#e9ecef',
        borderRadius: 15,
        backgroundColor: 'white',
        overflow: 'hidden',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    optionCorrect: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    optionIncorrect: {
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    optionButton: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    optionFeedback: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    feedbackArea: {
        minHeight: 60,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
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
    feedbackCorrectText: {
        color: '#2e7d32',
    },
    feedbackIncorrectText: {
        color: '#c62828',
    },
    hintArea: {
        backgroundColor: '#fff8e1',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 5,
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
        marginBottom: 15,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 140,
        gap: 8,
    },
    hintButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#dee2e6',
    },
    hintButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
    },
    nextButton: {
        backgroundColor: '#4b6cb7',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    highScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 10,
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
    // 结果模态框样式
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
        backgroundColor: 'linear-gradient(135deg, #FFD700, #FFA500)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30,
        marginBottom: 20,
        gap: 8,
    },
    completionBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4b6cb7',
        marginBottom: 20,
        textAlign: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    finalScore: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#182848',
        marginVertical: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    stars: {
        flexDirection: 'row',
        marginVertical: 20,
        gap: 10,
    },
    star: {
        fontSize: 32,
        color: '#FFD700',
    },
    resultMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    resultDetails: {
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        marginBottom: 30,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4b6cb7',
        marginBottom: 15,
        textAlign: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
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
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        width: '100%',
    },
    resultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 140,
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
    changeLevelButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#4b6cb7',
    },
    changeLevelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b6cb7',
    },
});

export default ListeningGame;