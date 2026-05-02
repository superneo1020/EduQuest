// games/english/listeninggame.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createGameMetadata, GameMetadata } from '../../../types/GameMetadata';
import { convertToBackendMetadata } from '../../utils/metadataConverter';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated as RNAnimated,
    ScrollView,
    Dimensions,
    Vibration,
    ActivityIndicator,
    Easing,
    Image,
} from 'react-native';
import { Star, Fish } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIService, { Question } from '../../services/AIService';
import { useAuth } from "@/src/auth/AuthContext";
import axios from "axios";
import ReAnimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type Difficulty = 'easy' | 'medium' | 'hard';

type Option = {
    id: string;
    text: string;
    correct: boolean;
    color?: string;
    emoji?: string;
};

interface ExtendedQuestion extends Question {
    maxPoints: number;
    earnedPoints?: number;
    timeSpent?: number; // 新增：本题耗时（秒）
}

type FishPosition = {
    x: RNAnimated.Value;
    y: RNAnimated.Value;
    direction: number;
    speed: number;
    amplitude: number;
    phase: RNAnimated.Value;
};

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
    questions: ExtendedQuestion[];
    fishCaught: boolean;
    totalTime: number;
};

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

const FISH_COLORS = {
    easy: ['#FFB6C1', '#FFC0CB', '#FF69B4', '#FF1493'],
    medium: ['#87CEEB', '#00BFFF', '#1E90FF', '#4169E1'],
    hard: ['#FFA500', '#FF8C00', '#FF7F50', '#FF6347'],
};

const FISH_EMOJIS = ['🐟', '🐠', '🐡', '🎏', '🐋'];

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getMaxPointsForQuestion = (level: Difficulty, index: number): number => {
    if (level === 'easy') return 50;
    else if (level === 'medium') return 55;
    else return 60;
};

const getTotalMaxScore = (level: Difficulty): number => {
    if (level === 'easy') return 100;
    if (level === 'medium') return 110;
    return 120;
};

export default function ListeningScreen() {
    const [gameState, setGameState] = useState<GameState>({
        currentLevel: null,
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctAnswers: 0,
        totalQuestions: 2,
        isAnswered: false,
        isPlaying: false,
        gameCompleted: false,
        showHint: false,
        selectedOptionId: null,
        isLoading: false,
        questions: [],
        fishCaught: false,
        totalTime: 0,
    });

    const [elapsedTime, setElapsedTime] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useSharedValue(0);
    const prepTriggered = useRef(false);

    // 新增：记录游戏真正的开始时间戳（绝对时间）
    const startTimeRef = useRef<number>(0);
    // 新增：记录当前题目开始时的 elapsedTime（秒）
    const questionStartTimeRef = useRef<number>(0);
    // 标记当前题目是否已经开始计时（避免重复记录）
    const hasStartedQuestionRef = useRef<boolean>(false);

    const prepAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: prepScale.value }],
        opacity: prepScale.value === 0 ? 0 : 1,
    }));

    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const isCompletingRef = useRef(false);

    const [highScore, setHighScore] = useState(0);
    const [fishPositions, setFishPositions] = useState<FishPosition[]>([]);
    const [rippleAnim] = useState(new RNAnimated.Value(0));
    const [caughtFishAnim] = useState(new RNAnimated.Value(0));
    const [waterLevel] = useState(new RNAnimated.Value(0));
    const [bobberAnim] = useState(new RNAnimated.Value(0));

    const scaleAnim = useRef(new RNAnimated.Value(1)).current;
    const progressAnim = useRef(new RNAnimated.Value(0)).current;

    const difficultyOptions = [
        {
            id: 'easy' as const,
            title: 'Easy',
            badgeText: 'Beginner',
            description: 'Simple words and phrases. Catch the right fish! Total 100 points.',
            icon: '🐟',
            color: '#4CAF50',
            bgColor: '#E8F5E9',
            features: ['Slow speed', 'Basic vocabulary', '2 Questions', 'Points: 50+50=100']
        },
        {
            id: 'medium' as const,
            title: 'Medium',
            badgeText: 'Intermediate',
            description: 'Short everyday sentences. Watch them swim faster! Total 110 points.',
            icon: '🐠',
            color: '#FF9800',
            bgColor: '#FFF3E0',
            features: ['Normal speed', 'Common phrases', '2 Questions', 'Points: 55+55=110']
        },
        {
            id: 'hard' as const,
            title: 'Hard',
            badgeText: 'Advanced',
            description: 'Complex sentences. Can you catch the right one? Total 120 points.',
            icon: '🐡',
            color: '#F44336',
            bgColor: '#FFEBEE',
            features: ['Fast speed', 'Idiomatic usage', '2 Questions', 'Points: 60+60=120']
        }
    ];

    const totalMaxScore = gameState.currentLevel ? getTotalMaxScore(gameState.currentLevel) : 100;

    const startTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setElapsedTime(0);
        timerIntervalRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    const resetTimer = () => {
        stopTimer();
        setElapsedTime(0);
        questionStartTimeRef.current = 0;
        hasStartedQuestionRef.current = false;
    };

    useEffect(() => {
        if (gameState.currentLevel) {
            loadHighScore();
        }
    }, [gameState.currentLevel]);

    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(waterLevel, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
                RNAnimated.timing(waterLevel, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
            ])
        ).start();

        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(bobberAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
                RNAnimated.timing(bobberAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
            ])
        ).start();
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

    // 记录当前题目开始时间（应在题目可见时调用）
    const recordCurrentQuestionStart = () => {
        if (!hasStartedQuestionRef.current && !gameState.isAnswered && !gameState.gameCompleted) {
            questionStartTimeRef.current = elapsedTime;
            hasStartedQuestionRef.current = true;
            console.log(`[Time] Question ${gameState.currentQuestionIndex + 1} started at ${elapsedTime}s`);
        }
    };

    // 当题目可见时触发布置（prepText消失且题目已加载）
    useEffect(() => {
        if (!prepText && !gameState.isLoading && gameState.questions.length > 0 && !gameState.isAnswered && !gameState.gameCompleted) {
            recordCurrentQuestionStart();
        }
    }, [prepText, gameState.isLoading, gameState.questions.length, gameState.currentQuestionIndex, gameState.isAnswered, gameState.gameCompleted]);

    const initFishPositions = (options: Option[]) => {
        const positions: FishPosition[] = [];
        const speedMultiplier = gameState.currentLevel === 'easy' ? 0.5 :
            gameState.currentLevel === 'medium' ? 1 : 1.5;

        options.forEach((option, index) => {
            const startX = Math.random() * (width - 100);
            const startY = 100 + (index * 80) + Math.random() * 60;

            positions.push({
                x: new RNAnimated.Value(startX),
                y: new RNAnimated.Value(startY),
                direction: Math.random() > 0.5 ? 1 : -1,
                speed: (0.5 + Math.random() * 0.5) * speedMultiplier,
                amplitude: 15 + Math.random() * 15,
                phase: new RNAnimated.Value(Math.random() * Math.PI * 2),
            });
        });

        setFishPositions(positions);
        startFishAnimation(positions);
    };

    const startFishAnimation = (positions: FishPosition[]) => {
        positions.forEach((fish, index) => {
            const animate = () => {
                let newX = fish.x._value + (fish.direction * fish.speed);

                if (newX > width - 80) {
                    newX = width - 80;
                    fish.direction = -1;
                } else if (newX < 20) {
                    newX = 20;
                    fish.direction = 1;
                }

                fish.x.setValue(newX);

                fish.phase.setValue(fish.phase._value + 0.05);
                const sinValue = Math.sin(fish.phase._value);
                const newY = 100 + (index * 70) + (sinValue * fish.amplitude);
                fish.y.setValue(Math.max(50, Math.min(height - 150, newY)));

                requestAnimationFrame(animate);
            };
            animate();
        });
    };

    const generateAndAddQuestion = async (index: number, level: Difficulty): Promise<ExtendedQuestion | null> => {
        try {
            const question = await AIService.generateSingleQuestion(level, index);
            if (!question) return null;

            const maxPoints = getMaxPointsForQuestion(level, index);

            const coloredOptions = question.options.map((opt, idx) => ({
                ...opt,
                color: FISH_COLORS[level][idx % FISH_COLORS[level].length],
                emoji: FISH_EMOJIS[idx % FISH_EMOJIS.length],
            }));

            return { ...question, options: coloredOptions, maxPoints, timeSpent: 0 };
        } catch (error) {
            console.error(`Failed to generate question at index ${index}:`, error);
            return null;
        }
    };

    const loadFirstQuestion = async (level: Difficulty) => {
        setGameState(prev => ({ ...prev, isLoading: true, questions: [] }));

        try {
            const firstQuestion = await generateAndAddQuestion(0, level);
            if (firstQuestion) {
                setGameState(prev => ({
                    ...prev,
                    isLoading: false,
                    questions: [firstQuestion],
                    totalQuestions: 2,
                    currentQuestionIndex: 0,
                    gameCompleted: false,
                    score: 0,
                    streak: 0,
                    maxStreak: 0,
                    correctAnswers: 0,
                    isAnswered: false,
                    fishCaught: false,
                }));
                progressAnim.setValue(0);
                // 重置题目开始标记，等待 prepText 结束后记录
                hasStartedQuestionRef.current = false;
            } else {
                setGameState(prev => ({ ...prev, isLoading: false }));
            }
        } catch (error) {
            console.error('Failed to load first question:', error);
            setGameState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const startPrepSequence = () => {
        // 记录绝对开始时间
        startTimeRef.current = Date.now();

        setPrepText('READY');
        prepScale.value = 0;
        prepScale.value = withSpring(1.2);
        setTimeout(() => {
            setPrepText('GO!');
            prepScale.value = 0;
            prepScale.value = withSpring(1.5);
            setTimeout(() => {
                setPrepText(null);
                startTimer(); // UI 计时器开始
                // 重置题目开始标记，准备记录第一题时间
                hasStartedQuestionRef.current = false;
            }, 600);
        }, 1000);
    };

    useEffect(() => {
        if (!gameState.isLoading && !gameState.gameCompleted && gameState.currentLevel && gameState.questions.length > 0 && !prepTriggered.current) {
            prepTriggered.current = true;
            startPrepSequence();
        }
    }, [gameState.isLoading, gameState.gameCompleted, gameState.currentLevel, gameState.questions.length]);

    const selectDifficulty = async (level: Difficulty) => {
        prepTriggered.current = false;
        resetTimer();
        AIService.resetGameSession(level);

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
            fishCaught: false,
            totalTime: 0,
            totalQuestions: 2,
        }));

        progressAnim.setValue(0);
        await loadFirstQuestion(level);
    };

    const restartGame = async () => {
        if (!gameState.currentLevel) return;
        stopAudio();
        prepTriggered.current = false;
        resetTimer();
        AIService.resetGameSession(gameState.currentLevel);

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
            fishCaught: false,
            totalTime: 0,
            totalQuestions: 2,
        }));

        progressAnim.setValue(0);
        hasStartedQuestionRef.current = false;
        await loadFirstQuestion(gameState.currentLevel);
    };

    const retryLoadQuestions = async () => {
        if (!gameState.currentLevel) return;
        setGameState(prev => ({ ...prev, isLoading: true }));
        await loadFirstQuestion(gameState.currentLevel);
    };

    const backToDifficultySelect = () => {
        prepTriggered.current = false;
        stopAudio();
        resetTimer();
        setGameState({
            currentLevel: null,
            currentQuestionIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctAnswers: 0,
            totalQuestions: 2,
            isAnswered: false,
            isPlaying: false,
            gameCompleted: false,
            showHint: false,
            selectedOptionId: null,
            isLoading: false,
            questions: [],
            fishCaught: false,
            totalTime: 0,
        });
        setFishPositions([]);
        hasStartedQuestionRef.current = false;
    };

    const goBackToGames = () => {
        resetTimer();
        router.back();
    };

    const getCurrentQuestion = (): ExtendedQuestion | null => {
        if (gameState.questions.length === 0) return null;
        return gameState.questions[gameState.currentQuestionIndex];
    };

    const playAudio = async () => {
        if (gameState.isPlaying || prepText !== null) {
            if (gameState.isPlaying) stopAudio();
            return;
        }

        const question = getCurrentQuestion();
        if (!question) return;

        setGameState(prev => ({ ...prev, isPlaying: true }));

        RNAnimated.sequence([
            RNAnimated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            RNAnimated.timing(scaleAnim, {
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

    const catchFish = (option: Option, index: number) => {
        if (gameState.isAnswered || gameState.gameCompleted || gameState.fishCaught || prepText !== null) return;

        // 计算本题耗时（秒）
        const timeSpentForThis = Math.max(0, elapsedTime - questionStartTimeRef.current);
        console.log(`[Time] Question ${gameState.currentQuestionIndex + 1} answered, spent ${timeSpentForThis}s`);

        stopAudio();

        const isCorrect = option.correct;
        const currentQ = getCurrentQuestion();
        if (!currentQ) return;

        const maxPoints = currentQ.maxPoints;
        let pointsEarned = 0;

        setGameState(prev => ({ ...prev, isAnswered: true, selectedOptionId: option.id, fishCaught: true }));

        RNAnimated.sequence([
            RNAnimated.timing(rippleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            RNAnimated.timing(rippleAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        RNAnimated.spring(caughtFishAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            caughtFishAnim.setValue(0);
        }, 500);

        if (isCorrect) {
            Vibration.vibrate(100);
            const newStreak = gameState.streak + 1;
            pointsEarned = maxPoints;
            const newScore = Math.min(gameState.score + pointsEarned, totalMaxScore);
            const newMaxStreak = Math.max(newStreak, gameState.maxStreak);

            setGameState(prev => ({
                ...prev,
                score: newScore,
                streak: newStreak,
                maxStreak: newMaxStreak,
                correctAnswers: prev.correctAnswers + 1
            }));
        } else {
            Vibration.vibrate([0, 100, 100, 100]);
            setGameState(prev => ({ ...prev, streak: 0 }));
            pointsEarned = 0;
        }

        RNAnimated.timing(progressAnim, {
            toValue: ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100,
            duration: 500,
            useNativeDriver: false,
        }).start();

        // 更新当前题目的 timeSpent 和 earnedPoints
        const updatedQuestions = [...gameState.questions];
        if (updatedQuestions[gameState.currentQuestionIndex]) {
            updatedQuestions[gameState.currentQuestionIndex].earnedPoints = pointsEarned;
            updatedQuestions[gameState.currentQuestionIndex].timeSpent = timeSpentForThis;
            setGameState(prev => ({ ...prev, questions: updatedQuestions }));
        }
    };

    const nextQuestion = async () => {
        if (prepText !== null) return;
        if (gameState.isLoading) return;

        const nextIndex = gameState.currentQuestionIndex + 1;

        if (nextIndex >= gameState.totalQuestions) {
            endGame();
            return;
        }

        // 重置题目开始标记，下一题准备记录
        hasStartedQuestionRef.current = false;

        if (gameState.questions.length > nextIndex) {
            setGameState(prev => ({
                ...prev,
                currentQuestionIndex: nextIndex,
                isAnswered: false,
                showHint: false,
                selectedOptionId: null,
                fishCaught: false,
            }));
            stopAudio();
        } else {
            setGameState(prev => ({ ...prev, isLoading: true }));
            try {
                const newQuestion = await generateAndAddQuestion(nextIndex, gameState.currentLevel!);
                if (newQuestion) {
                    setGameState(prev => ({
                        ...prev,
                        isLoading: false,
                        questions: [...prev.questions, newQuestion],
                        currentQuestionIndex: nextIndex,
                        isAnswered: false,
                        showHint: false,
                        selectedOptionId: null,
                        fishCaught: false,
                    }));
                    stopAudio();
                } else {
                    Alert.alert('Error', 'Failed to load next fish. Please try again.', [
                        { text: 'Retry', onPress: () => nextQuestion() },
                        { text: 'Cancel', style: 'cancel' }
                    ]);
                    setGameState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error('Error generating next question:', error);
                setGameState(prev => ({ ...prev, isLoading: false }));
                Alert.alert('Error', 'Unable to load next question. Please try again.');
            }
        }
    };

    const endGame = async () => {
        stopTimer();

        const realSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

        setGameState(prev => ({ ...prev, gameCompleted: true, totalTime: realSeconds }));
        saveHighScore(gameState.score);
        await saveScore(gameState.score, realSeconds);
    };

    const toggleHint = () => {
        if (prepText !== null) return;
        setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
    };

    const getLevelLabel = (level: Difficulty): string => {
        return DIFFICULTY_CONFIG[level].label;
    };

    const calculateAccuracy = (): number => {
        return Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100);
    };

    const calculatePercentageScore = (): number => {
        const currentScore = Math.min(gameState.score, totalMaxScore);
        const percentage = (currentScore / totalMaxScore) * 100;
        return Math.round(percentage);
    };

    const getResultMessage = (accuracy: number): string => {
        if (accuracy === 100) return "🐟 Amazing! You caught all the right fish! 🎣";
        if (accuracy >= 80) return "🎣 Great fishing! Your listening skills are excellent!";
        if (accuracy >= 60) return "🐠 Good catch! Keep practicing to catch more fish!";
        return "🐡 Keep trying! Every fisherman learns with practice!";
    };

    const getStarRating = (percentage: number): number => {
        return Math.min(5, Math.ceil(percentage / 20));
    };

    const saveScore = async (finalScore: number, totalSeconds: number) => {
        if (isCompletingRef.current) {
            console.log("saveScore already in progress, skip");
            return;
        }
        isCompletingRef.current = true;
        setIsSaving(true);
        try {
            const scoreToSave = Math.max(finalScore, 0);
            const gameData = {
                gameName: "Listening Game",
                scores: scoreToSave,
                gameType: "ENGLISH",
                gameDifficulty: getLevelLabel(gameState.currentLevel!).toUpperCase()
            };

            // 使用 questions 中保存的 timeSpent
            const questionsData = gameState.questions.map((q, index) => ({
                id: index + 1,
                question: q.question,
                correctAnswer: q.answer,
                userAnswer: q.userAnswer || "",
                isCorrect: q.isCorrect || false,
                questionType: 'listening-audio',
                options: q.options,
                earnedPoints: q.earnedPoints || 0,
                timeSpent: q.timeSpent !== undefined ? q.timeSpent : 0
            }));

            const totalTimeFormatted = formatTime(totalSeconds);

            const metadata: GameMetadata = createGameMetadata(
                gameData.gameType,
                gameData.gameDifficulty,
                finalScore,
                {
                    audioClips: gameState.questions.length,
                    correctAnswers: gameState.correctAnswers,
                    totalTimeSeconds: totalSeconds,
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
            console.log("Score synced to server with time:", totalSeconds);
        } catch (e) {
            console.error("Save score failed:", e);
        } finally {
            setIsSaving(false);
            setTimeout(() => {
                isCompletingRef.current = false;
            }, 500);
        }
    };

    useEffect(() => {
        const currentQ = getCurrentQuestion();
        if (currentQ && !gameState.isLoading && !gameState.gameCompleted && !prepText) {
            initFishPositions(currentQ.options);
        }
    }, [gameState.currentQuestionIndex, gameState.questions, gameState.isLoading, gameState.gameCompleted, prepText]);

    const currentQuestion = getCurrentQuestion();
    const accuracy = calculateAccuracy();
    const percentageScore = calculatePercentageScore();
    const stars = getStarRating(percentageScore);
    const currentMaxPoints = currentQuestion?.maxPoints || 0;

    // 难度选择页面
    if (gameState.currentLevel === null) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerSection}>
                        <Fish size={60} color="#4b6cb7" style={{ marginBottom: 20 }} />
                        <Text style={styles.mainTitle}>Fishing Listening Game</Text>
                        <Text style={styles.subTitle}>
                            Listen carefully and catch the right fish! 🎣
                        </Text>
                        <View style={styles.scoreInfoBox}>
                            <Text style={styles.scoreInfoText}>🐟 Easy: 2 questions, total 100 points (50+50)</Text>
                            <Text style={styles.scoreInfoText}>🐠 Medium: 2 questions, total 110 points (55+55)</Text>
                            <Text style={styles.scoreInfoText}>🐡 Hard: 2 questions, total 120 points (60+60)</Text>
                        </View>
                    </View>

                    <View style={styles.menuGrid}>
                        {difficultyOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.diffCard,
                                    { backgroundColor: option.bgColor, borderColor: option.color }
                                ]}
                                onPress={() => selectDifficulty(option.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardIconContainer}>
                                    <Text style={styles.cardIcon}>{option.icon}</Text>
                                </View>

                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.diffBtnText, { color: option.color }]}>
                                            {option.title}
                                        </Text>
                                        <View style={[styles.levelBadge, { backgroundColor: option.color }]}>
                                            <Text style={styles.levelBadgeText}>{option.badgeText}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.diffDesc}>{option.description}</Text>

                                    <View style={styles.featuresList}>
                                        {option.features.map((feature, index) => (
                                            <View key={index} style={styles.featureItem}>
                                                <Star size={12} color={option.color} style={styles.featureIcon} />
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.startButtonContainer}>
                                        <View style={[styles.startButton, { backgroundColor: option.color }]}>
                                            <Text style={styles.startButtonText}>Start Fishing →</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.backLink} onPress={goBackToGames}>
                        <Text style={styles.backLinkText}>← Back to Game Library</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (gameState.isLoading) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Fishing Game',
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
                        🎣 Preparing fishing pond... (1/2)
                    </Text>
                </View>
            </View>
        );
    }

    if (!currentQuestion && !gameState.isLoading && !gameState.gameCompleted) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Fishing Game',
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
                    <Text style={styles.errorText}>Failed to load fishing pond!</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retryLoadQuestions}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (gameState.gameCompleted) {
        const finalTime = gameState.totalTime;
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Fishing Results',
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
                    <LinearGradient colors={['#4b6cb7', '#182848']} style={styles.resultHeader}>
                        <Fish size={60} color="#FFD700" />
                        <Text style={styles.resultHeaderTitle}>Fishing Trip Completed!</Text>
                    </LinearGradient>

                    <View style={styles.resultCard}>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreCircleNumber}>{gameState.score}</Text>
                            <Text style={styles.scoreCircleLabel}>/ {totalMaxScore} points</Text>
                        </View>

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

                        <View style={styles.resultStats}>
                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="fish" size={24} color="#4CAF50" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Fish Caught</Text>
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
                                    <Ionicons name="flame" size={24} color="#F44336" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Max Streak</Text>
                                    <Text style={styles.resultStatValue}>{gameState.maxStreak}</Text>
                                </View>
                            </View>

                            <View style={styles.resultStatItem}>
                                <View style={styles.resultStatIcon}>
                                    <Ionicons name="time" size={24} color="#4b6cb7" />
                                </View>
                                <View style={styles.resultStatInfo}>
                                    <Text style={styles.resultStatLabel}>Total Time</Text>
                                    <Text style={styles.resultStatValue}>{formatTime(finalTime)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.detailScoreContainer}>
                            <Text style={styles.detailScoreTitle}>📊 Per Question Score:</Text>
                            {gameState.questions.map((q, idx) => {
                                const earned = q.earnedPoints || 0;
                                const maxPts = q.maxPoints;
                                const timeSpent = q.timeSpent || 0;
                                return (
                                    <View key={idx} style={styles.detailScoreItem}>
                                        <Text style={styles.detailScoreNumber}>{idx + 1}.</Text>
                                        <Text style={styles.detailScoreAnswer} numberOfLines={1}>
                                            {q.options.find(opt => opt.correct)?.text || '?'}
                                        </Text>
                                        <Text style={[styles.detailScoreValue, earned > 0 ? styles.correctScore : styles.incorrectScore]}>
                                            {earned > 0 ? `${earned}/${maxPts}` : '0'}
                                        </Text>
                                        <Text style={styles.detailTimeSpent}>
                                            {formatTime(timeSpent)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.resultButtons}>
                            <TouchableOpacity style={[styles.resultButton, styles.playAgainButton]} onPress={restartGame}>
                                <Ionicons name="refresh" size={20} color="white" />
                                <Text style={styles.resultButtonText}>Fish Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.resultButton, styles.changeDifficultyButton]} onPress={backToDifficultySelect}>
                                <Ionicons name="options" size={20} color="white" />
                                <Text style={styles.resultButtonText}>Change Difficulty</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.resultButton, styles.backToGameButton]} onPress={goBackToGames}>
                                <Ionicons name="home" size={20} color="white" />
                                <Text style={styles.resultButtonText}>Back to Game</Text>
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
                    title: `Fishing Game - ${getLevelLabel(gameState.currentLevel)}`,
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
                contentContainerStyle={styles.fishingScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.fishingGameInfo}>
                    <View style={styles.fishingStats}>
                        <View style={styles.fishingStatBox}>
                            <Fish size={24} color="#4b6cb7" />
                            <Text style={styles.fishingStatValue}>{gameState.score}</Text>
                            <Text style={styles.fishingStatLabel}>/ {totalMaxScore}</Text>
                        </View>
                        <View style={styles.fishingStatBox}>
                            <Ionicons name="flag" size={24} color="#FF9800" />
                            <Text style={styles.fishingStatValue}>
                                {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
                            </Text>
                            <Text style={styles.fishingStatLabel}>Question</Text>
                        </View>
                        <View style={styles.fishingStatBox}>
                            <Ionicons name="flame" size={24} color="#F44336" />
                            <Text style={styles.fishingStatValue}>{gameState.streak}</Text>
                            <Text style={styles.fishingStatLabel}>Streak</Text>
                        </View>
                        <View style={styles.fishingStatBox}>
                            <Ionicons name="time-outline" size={24} color="#4b6cb7" />
                            <Text style={styles.fishingStatValue}>{formatTime(elapsedTime)}</Text>
                            <Text style={styles.fishingStatLabel}>Time</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.fishingArea}>
                    <RNAnimated.View
                        style={[
                            styles.waterBackground,
                            {
                                transform: [{
                                    translateY: waterLevel.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 8]
                                    })
                                }]
                            }
                        ]}
                    />

                    <View style={styles.seaweedContainer} pointerEvents="none">
                        <Image
                            source={require('../../../assets/images/seaweed.png')}
                            style={[styles.seaweedImage, styles.seaweedImage1]}
                            resizeMode="contain"
                        />
                        <Image
                            source={require('../../../assets/images/seaweed.png')}
                            style={[styles.seaweedImage, styles.seaweedImage2]}
                            resizeMode="contain"
                        />
                        <Image
                            source={require('../../../assets/images/seaweed.png')}
                            style={[styles.seaweedImage, styles.seaweedImage3]}
                            resizeMode="contain"
                        />
                        <Image
                            source={require('../../../assets/images/seaweed.png')}
                            style={[styles.seaweedImage, styles.seaweedImage4]}
                            resizeMode="contain"
                        />
                    </View>

                    <RNAnimated.View
                        style={[
                            styles.bobber,
                            {
                                transform: [{
                                    translateY: bobberAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 8]
                                    })
                                }]
                            }
                        ]}
                    >
                        <View style={styles.bobberLine} />
                        <View style={styles.bobberFloat}>
                            <Ionicons name="radio-button-on" size={20} color="#FF6B6B" />
                        </View>
                    </RNAnimated.View>

                    {currentQuestion?.options.map((option, index) => {
                        const fishPos = fishPositions[index];
                        if (!fishPos) return null;

                        const isCaught = gameState.isAnswered && option.id === gameState.selectedOptionId;

                        return (
                            <RNAnimated.View
                                key={option.id}
                                style={[
                                    styles.fish,
                                    {
                                        transform: [
                                            { translateX: fishPos.x },
                                            { translateY: fishPos.y },
                                        ],
                                        opacity: isCaught ? 0 : 1,
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    onPress={() => catchFish(option, index)}
                                    disabled={gameState.isAnswered || prepText !== null}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[option.color || '#FFB6C1', (option.color || '#FFB6C1') + 'CC']}
                                        style={[
                                            styles.fishBody,
                                            {
                                                transform: [{ scaleX: fishPos.direction === 1 ? 1 : -1 }]
                                            }
                                        ]}
                                    >
                                        <View style={styles.fishContent}>
                                            <Text style={styles.fishEmoji}>
                                                {option.emoji || '🐟'}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.fishText,
                                                    {
                                                        transform: [{ scaleX: fishPos.direction === 1 ? 1 : -1 }]
                                                    }
                                                ]}
                                            >
                                                {option.text}
                                            </Text>
                                        </View>
                                        {!gameState.isAnswered && (
                                            <View style={styles.fishBubble}>
                                                <Text style={styles.bubbleText}>?</Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </RNAnimated.View>
                        );
                    })}

                    {gameState.fishCaught && (
                        <RNAnimated.View
                            style={[
                                styles.ripple,
                                {
                                    opacity: rippleAnim,
                                    transform: [{ scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] }) }]
                                }
                            ]}
                        />
                    )}

                    {gameState.fishCaught && (
                        <RNAnimated.View
                            style={[
                                styles.caughtFish,
                                {
                                    transform: [{ scale: caughtFishAnim }],
                                    opacity: caughtFishAnim,
                                }
                            ]}
                        >
                            <Text style={styles.caughtFishEmoji}>
                                {gameState.streak > 0 ? '🎣✨' : '😢💧'}
                            </Text>
                        </RNAnimated.View>
                    )}
                </View>

                <View style={styles.fishingAudioArea}>
                    <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            style={[styles.fishingPlayButton, gameState.isPlaying && styles.fishingPlayButtonPlaying]}
                            onPress={playAudio}
                            activeOpacity={0.7}
                            disabled={prepText !== null}
                        >
                            <Ionicons
                                name={gameState.isPlaying ? "pause" : "volume-high"}
                                size={32}
                                color="white"
                            />
                        </TouchableOpacity>
                    </RNAnimated.View>
                    <Text style={styles.fishingAudioText}>
                        {gameState.isPlaying ? "🎵 Listening..." : "🔊 Listen to the fish!"}
                    </Text>
                </View>

                <View style={styles.fishingProgressBar}>
                    <RNAnimated.View style={[styles.fishingProgressFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
                </View>

                {gameState.isAnswered && (
                    <View style={[
                        styles.fishingFeedback,
                        gameState.streak > 0 ? styles.fishingFeedbackCorrect : styles.fishingFeedbackIncorrect
                    ]}>
                        <Text style={styles.fishingFeedbackText}>
                            {gameState.streak > 0
                                ? `🎣 Great catch! +${currentMaxPoints} points!`
                                : "😢 Oops! That fish got away... Try again!"}
                        </Text>
                    </View>
                )}

                {gameState.showHint && currentQuestion && (
                    <View style={styles.fishingHintArea}>
                        <View style={styles.fishingHintTitle}>
                            <Ionicons name="bulb" size={20} color="#ff8f00" />
                            <Text style={styles.fishingHintTitleText}>Fishing Tip</Text>
                        </View>
                        <Text style={styles.fishingHintText}>🎣 {currentQuestion.hint}</Text>
                    </View>
                )}

                <View style={styles.fishingControls}>
                    <TouchableOpacity
                        style={[styles.fishingControlButton, styles.fishingHintButton]}
                        onPress={toggleHint}
                        disabled={gameState.isAnswered || prepText !== null}
                    >
                        <Ionicons name="bulb" size={20} color="#666" />
                        <Text style={styles.fishingHintButtonText}>
                            {gameState.showHint ? "Hide Tip" : "Get Tip"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.fishingControlButton, styles.fishingNextButton]}
                        onPress={nextQuestion}
                        disabled={!gameState.isAnswered || prepText !== null || gameState.isLoading}
                    >
                        <Ionicons
                            name={gameState.currentQuestionIndex >= gameState.totalQuestions - 1 ? "flag" : "arrow-forward"}
                            size={20}
                            color="white"
                        />
                        <Text style={styles.fishingNextButtonText}>
                            {gameState.currentQuestionIndex >= gameState.totalQuestions - 1
                                ? "Finish Fishing"
                                : "Next Fish →"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.fishingHighScoreContainer}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.fishingHighScoreText}>Best Catch: {highScore}</Text>
                </View>
            </ScrollView>

            <ReAnimated.View
                style={[
                    styles.prepOverlay,
                    prepAnimatedStyle,
                    { display: prepText !== null ? 'flex' : 'none' }
                ]}
            >
                <Text style={styles.prepText}>{prepText}</Text>
            </ReAnimated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F4FD' },
    scrollContent: { flexGrow: 1 },
    headerSection: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20, paddingBottom: 30, backgroundColor: '#fff' },
    mainTitle: { fontSize: 32, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
    subTitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 10 },
    scoreInfoBox: { backgroundColor: '#FFF8E1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
    scoreInfoText: { fontSize: 12, color: '#FF9F4A', fontWeight: '500', textAlign: 'center' },
    menuGrid: { width: '100%', paddingHorizontal: 20, gap: 20 },
    diffCard: { flexDirection: 'row', padding: 20, borderRadius: 16, borderWidth: 2, gap: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    cardIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    cardIcon: { fontSize: 32 },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    diffBtnText: { fontSize: 20, fontWeight: '700' },
    levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    levelBadgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
    diffDesc: { fontSize: 14, color: '#64748B', marginBottom: 12, lineHeight: 20 },
    featuresList: { marginBottom: 15, gap: 6 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    featureIcon: { marginRight: 4 },
    featureText: { fontSize: 12, color: '#475569' },
    startButtonContainer: { alignItems: 'flex-end' },
    startButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minWidth: 120, alignItems: 'center' },
    startButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    backLink: { marginTop: 20, alignItems: 'center' },
    backLinkText: { fontSize: 16, color: '#4b6cb7', fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
    loadingText: { marginTop: 20, fontSize: 16, color: '#4b6cb7', textAlign: 'center' },
    errorText: { fontSize: 18, color: '#F44336', marginTop: 16, marginBottom: 16, textAlign: 'center' },
    retryButton: { backgroundColor: '#4b6cb7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, minWidth: 200, alignItems: 'center' },
    retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    scrollView: { flex: 1 },
    fishingScrollContent: { flexGrow: 1, paddingBottom: 30 },
    fishingGameInfo: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 15, marginHorizontal: 15, marginTop: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    fishingStats: { flexDirection: 'row', justifyContent: 'space-around' },
    fishingStatBox: { alignItems: 'center', gap: 5, flex: 1 },
    fishingStatValue: { fontSize: 20, fontWeight: 'bold', color: '#4b6cb7' },
    fishingStatLabel: { fontSize: 12, color: '#666' },
    fishingArea: { height: 400, backgroundColor: '#6BB5FF', borderRadius: 30, marginHorizontal: 15, marginVertical: 10, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: '#4A90E2' },
    waterBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#6BB5FF', zIndex: 0 },
    seaweedContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, zIndex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingHorizontal: 10 },
    seaweedImage: { width: 140, height: 160 },
    seaweedImage1: { height: 170, width: 135 },
    seaweedImage2: { height: 190, width: 145 },
    seaweedImage3: { height: 160, width: 130 },
    seaweedImage4: { height: 185, width: 140 },
    bobber: { position: 'absolute', top: 20, right: 30, zIndex: 10, alignItems: 'center' },
    bobberLine: { width: 2, height: 60, backgroundColor: '#8B4513' },
    bobberFloat: { width: 20, height: 20, backgroundColor: '#FF6B6B', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
    fish: { position: 'absolute', zIndex: 5 },
    fishBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 30, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
    fishEmoji: { fontSize: 24, marginRight: 8 },
    fishText: { fontSize: 14, fontWeight: '600', color: '#fff', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
    fishBubble: { position: 'absolute', top: -15, right: -10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 15, paddingHorizontal: 6, paddingVertical: 3 },
    bubbleText: { fontSize: 12, fontWeight: 'bold', color: '#4b6cb7' },
    ripple: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.6)', top: '50%', left: '50%', marginLeft: -50, marginTop: -50, zIndex: 20 },
    caughtFish: { position: 'absolute', top: '40%', left: '50%', marginLeft: -40, zIndex: 30 },
    caughtFishEmoji: { fontSize: 80 },
    fishingAudioArea: { alignItems: 'center', marginVertical: 15 },
    fishingPlayButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#4b6cb7', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    fishingPlayButtonPlaying: { backgroundColor: '#182848', transform: [{ scale: 1.05 }] },
    fishingAudioText: { marginTop: 10, fontSize: 14, color: '#4b6cb7', fontWeight: '500' },
    fishingProgressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginHorizontal: 20, marginVertical: 10, overflow: 'hidden' },
    fishingProgressFill: { height: '100%', backgroundColor: '#4b6cb7', borderRadius: 4 },
    fishingFeedback: { marginHorizontal: 20, padding: 15, borderRadius: 16, marginVertical: 10, justifyContent: 'center', alignItems: 'center' },
    fishingFeedbackCorrect: { backgroundColor: 'rgba(76, 175, 80, 0.2)', borderWidth: 1, borderColor: '#4CAF50' },
    fishingFeedbackIncorrect: { backgroundColor: 'rgba(244, 67, 54, 0.2)', borderWidth: 1, borderColor: '#F44336' },
    fishingFeedbackText: { fontSize: 16, fontWeight: '600', color: '#333' },
    fishingHintArea: { backgroundColor: '#FFF8E7', borderRadius: 16, padding: 15, marginHorizontal: 20, marginVertical: 10, borderLeftWidth: 4, borderLeftColor: '#FFB300' },
    fishingHintTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    fishingHintTitleText: { fontSize: 16, fontWeight: '600', color: '#FF8F00', marginLeft: 8 },
    fishingHintText: { fontSize: 14, color: '#5D4037', lineHeight: 20 },
    fishingControls: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginHorizontal: 20, marginVertical: 10 },
    fishingControlButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flex: 1, gap: 8 },
    fishingHintButton: { backgroundColor: 'white', borderWidth: 2, borderColor: '#ddd' },
    fishingHintButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
    fishingNextButton: { backgroundColor: '#4b6cb7' },
    fishingNextButtonText: { fontSize: 14, fontWeight: '600', color: 'white' },
    fishingHighScoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 10 },
    fishingHighScoreText: { fontSize: 14, color: '#666' },
    resultPageContainer: { flexGrow: 1, backgroundColor: '#f5f5f5' },
    resultHeader: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 20 },
    resultHeaderTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 16 },
    resultCard: { backgroundColor: 'white', borderRadius: 24, marginHorizontal: 20, marginBottom: 30, padding: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    scoreCircle: { alignItems: 'center', marginBottom: 20 },
    scoreCircleNumber: { fontSize: 72, fontWeight: 'bold', color: '#4b6cb7' },
    scoreCircleLabel: { fontSize: 14, color: '#666', marginTop: -8 },
    resultStars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    resultMessage: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 24, lineHeight: 24, paddingHorizontal: 16 },
    resultStats: { backgroundColor: '#f8f9fa', borderRadius: 16, padding: 16, marginBottom: 24 },
    resultStatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    resultStatIcon: { width: 40, alignItems: 'center' },
    resultStatInfo: { flex: 1, marginLeft: 12 },
    resultStatLabel: { fontSize: 14, color: '#666', marginBottom: 2 },
    resultStatValue: { fontSize: 18, fontWeight: '600', color: '#333' },
    detailScoreContainer: { backgroundColor: '#f8f9fa', borderRadius: 16, padding: 16, marginBottom: 24 },
    detailScoreTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
    detailScoreItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
    detailScoreNumber: { width: 30, fontSize: 12, color: '#666' },
    detailScoreAnswer: { flex: 1, fontSize: 12, color: '#333' },
    detailScoreValue: { width: 50, fontSize: 12, fontWeight: '600', textAlign: 'right' },
    detailTimeSpent: { width: 50, fontSize: 12, color: '#666', textAlign: 'right' },
    correctScore: { color: '#4CAF50' },
    incorrectScore: { color: '#f44336' },
    resultButtons: { gap: 12 },
    resultButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    playAgainButton: { backgroundColor: '#4b6cb7' },
    changeDifficultyButton: { backgroundColor: '#FF9800' },
    backToGameButton: { backgroundColor: '#FF5722' },
    resultButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
    prepOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    prepText: { fontSize: 80, fontWeight: '900', color: '#FFD700', fontStyle: 'italic' },
    fishContent: { flexDirection: 'row', alignItems: 'center' },
});