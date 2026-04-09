// app/games/science/animal/ClawMachineGame.tsx
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    Animated,
    Platform,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';
import clawAIService, { AIQuestion, AIFeedback } from '../../../services/ClawAIService';

const { width: screenWidth } = Dimensions.get('window');

// 像素風格配置
const MACHINE_WIDTH = Math.min(760, screenWidth - 40);
const GAME_WIDTH = MACHINE_WIDTH - 40;
const GAME_HEIGHT = 240;

// 動物類型定義
interface AnimalType {
    name: string;
    icon: string;
    width: number;
    height: number;
    isAnimal: boolean;
}

// ========== 🐾 完整動物列表（22 種） ==========
const ALL_ANIMAL_TYPES: AnimalType[] = [
    { name: 'Bear', icon: '🐻', width: 44, height: 52, isAnimal: true },
    { name: 'Bunny', icon: '🐰', width: 44, height: 56, isAnimal: true },
    { name: 'Penguin', icon: '🐧', width: 48, height: 46, isAnimal: true },
    { name: 'Kangaroo', icon: '🦘', width: 48, height: 56, isAnimal: true },
    { name: 'Fox', icon: '🦊', width: 44, height: 52, isAnimal: true },
    { name: 'Panda', icon: '🐼', width: 44, height: 52, isAnimal: true },
    { name: 'Koala', icon: '🐨', width: 44, height: 52, isAnimal: true },
    { name: 'Monkey', icon: '🐒', width: 44, height: 52, isAnimal: true },
    { name: 'Elephant', icon: '🐘', width: 48, height: 52, isAnimal: true },
    { name: 'Giraffe', icon: '🦒', width: 48, height: 56, isAnimal: true },
    { name: 'Dog', icon: '🐶', width: 44, height: 52, isAnimal: true },
    { name: 'Cat', icon: '🐱', width: 44, height: 52, isAnimal: true },
    { name: 'Lion', icon: '🦁', width: 48, height: 52, isAnimal: true },
    { name: 'Tiger', icon: '🐯', width: 48, height: 52, isAnimal: true },
    { name: 'Goldfish', icon: '🐠', width: 44, height: 40, isAnimal: true },
    { name: 'Fish', icon: '🐟', width: 44, height: 40, isAnimal: true },
    { name: 'Whale', icon: '🐳', width: 52, height: 44, isAnimal: true },
    { name: 'Dolphin', icon: '🐬', width: 52, height: 44, isAnimal: true },
    { name: 'Butterfly', icon: '🦋', width: 44, height: 40, isAnimal: true },
    { name: 'Bird', icon: '🐦', width: 44, height: 40, isAnimal: true },
    { name: 'Eagle', icon: '🦅', width: 48, height: 48, isAnimal: true },
    { name: 'Frog', icon: '🐸', width: 44, height: 44, isAnimal: true },
];

// 非動物干擾物
const NON_ANIMAL_TYPES: AnimalType[] = [
    { name: 'Rock', icon: '🪨', width: 40, height: 40, isAnimal: false },
    { name: 'Tree', icon: '🌲', width: 40, height: 48, isAnimal: false },
    { name: 'Flower', icon: '🌸', width: 38, height: 42, isAnimal: false },
    { name: 'Star', icon: '⭐', width: 40, height: 40, isAnimal: false },
    { name: 'Cloud', icon: '☁️', width: 48, height: 32, isAnimal: false },
];

interface Item {
    id: number;
    type: AnimalType;
    x: number;
    y: number;
    caught: boolean;
    isAnimal: boolean;
}

// ========== 🎯 浮動文字元件 ==========
interface FloatingTextProps {
    text: string;
    color: string;
    onComplete: () => void;
}

const FloatingText: React.FC<FloatingTextProps> = ({ text, color, onComplete }) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -80,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => onComplete());
    }, []);

    return (
        <Animated.View
            style={[
                styles.floatingContainer,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Text style={[styles.floatingText, { color, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }]}>
                {text}
            </Text>
        </Animated.View>
    );
};

// ========== 🎮 主遊戲元件 ==========
const ClawMachineGame: React.FC = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // 遊戲狀態
    const [items, setItems] = useState<Item[]>([]);
    const [collectedAnimals, setCollectedAnimals] = useState<Item[]>([]);
    const [score, setScore] = useState<number>(0);
    const [clawX, setClawX] = useState<number>((GAME_WIDTH - 36) / 2);
    const [isDropping, setIsDropping] = useState<boolean>(false);
    const [moveInterval, setMoveInterval] = useState<NodeJS.Timeout | null>(null);
    const [leftPressed, setLeftPressed] = useState<boolean>(false);
    const [rightPressed, setRightPressed] = useState<boolean>(false);
    const [isSuction, setIsSuction] = useState<boolean>(false);
    const [suctionItem, setSuctionItem] = useState<Item | null>(null);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameComplete, setGameComplete] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(null);
    const [processing, setProcessing] = useState<boolean>(false);

    // AI 出題模式狀態
    const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
    const [showQuestionHint, setShowQuestionHint] = useState<boolean>(false);

    // 特效狀態
    const [floatingText, setFloatingText] = useState<{ id: number; text: string; color: string } | null>(null);
    const screenShake = useRef(new Animated.Value(0)).current;
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useRef(new Animated.Value(0)).current;

    // 動畫值
    const dropAnim = useRef(new Animated.Value(0)).current;
    const clawScaleAnim = useRef(new Animated.Value(1)).current;
    const suctionAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scoreAnim = useRef(new Animated.Value(1)).current;
    const feedbackAnim = useRef(new Animated.Value(0)).current;

    // 请求去重
    const refreshAIPromiseRef = useRef<Promise<void> | null>(null);

    // ========== 🎯 新增：回答次数限制 ==========
    const MAX_ANSWERS = 4;               // 最多回答4次
    const [answerCount, setAnswerCount] = useState<number>(0);  // 已回答次数
    const pointsPerAnimal = 100 / MAX_ANSWERS; // 每题满分25分

    // 計算正確捕獲數量
    const correctCatches = collectedAnimals.length;

    // 獲取當前場上未被抓的動物名稱（用於 AI 出題）
    const getAvailableAnimalNames = useCallback((): string[] => {
        return items
            .filter(item => item.isAnimal && !item.caught)
            .map(item => item.type.name);
    }, [items]);

    // ========== 💾 保存分數到伺服器 ==========
    const saveScore = async (finalScore: number) => {
        if (!token) return;
        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "Animal Catcher",
                scores: finalScore,
                difficulty: "ANIMAL"
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

    // ========== 🎬 螢幕震動效果 ==========
    const triggerScreenShake = () => {
        Animated.sequence([
            Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // ========== 🎯 打擊回饋（HIT! / OUCH! + 震動 + 觸覺） ==========
    const showHitFeedback = (isCorrect: boolean) => {
        if (isCorrect) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            triggerScreenShake();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            triggerScreenShake();
        }
        setFloatingText({
            id: Date.now(),
            text: isCorrect ? 'HIT!' : 'OUCH!',
            color: isCorrect ? '#FFD700' : '#FF4757',
        });
    };

    // ========== 🎪 倒數準備動畫 ==========
    const startPrepSequence = () => {
        setTimeout(() => {
            setPrepText('READY');
            prepScale.setValue(0);
            Animated.spring(prepScale, {
                toValue: 1.2,
                friction: 3,
                tension: 100,
                useNativeDriver: true,
            }).start();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 100);
        setTimeout(() => {
            setPrepText('GO!');
            prepScale.setValue(0);
            Animated.spring(prepScale, {
                toValue: 1.5,
                friction: 2,
                tension: 120,
                useNativeDriver: true,
            }).start();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);
        setTimeout(() => {
            Animated.timing(prepScale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setPrepText(null));
        }, 1600);
    };

    // ========== 🧠 刷新 AI 題目 ==========
    const refreshAIQuestion = useCallback(async () => {
        if (gameComplete || showReport) return;
        if (refreshAIPromiseRef.current) {
            console.log("AI refresh already in progress, waiting...");
            return refreshAIPromiseRef.current;
        }

        const promise = (async () => {
            const availableAnimals = getAvailableAnimalNames();
            if (availableAnimals.length === 0) {
                console.log("No available animals, keep current question");
                return;
            }

            setIsAiThinking(true);
            try {
                console.log("Generating new question for animals:", availableAnimals);
                const newQuestion = await clawAIService.generateQuestionAsync(availableAnimals);
                if (newQuestion && newQuestion.description && newQuestion.targetAnimal) {
                    setCurrentQuestion(newQuestion);
                    console.log("New question set:", newQuestion.description);
                } else {
                    console.warn("Generated question is invalid, using fallback");
                    const fallbackQuestion = clawAIService.generateQuestionWithAvailableAnimals(availableAnimals);
                    if (fallbackQuestion) {
                        setCurrentQuestion(fallbackQuestion);
                    }
                }
            } catch (error) {
                console.error('Failed to generate AI question:', error);
                const fallbackQuestion = clawAIService.generateQuestionWithAvailableAnimals(availableAnimals);
                if (fallbackQuestion) {
                    setCurrentQuestion(fallbackQuestion);
                }
            } finally {
                setIsAiThinking(false);
                refreshAIPromiseRef.current = null;
            }
        })();

        refreshAIPromiseRef.current = promise;
        return promise;
    }, [getAvailableAnimalNames, gameComplete, showReport]);

    // ========== 初始化物品（隨機選取 8 種動物 + 4 個干擾物，總數 12） ==========
    const initializeItems = () => {
        const newItems: Item[] = [];
        const itemCount = 12;
        const animalCount = 8;      // 場上放置 8 隻動物
        const nonAnimalCount = 4;   // 干擾物 4 個

        const shuffledAnimals = [...ALL_ANIMAL_TYPES].sort(() => 0.5 - Math.random());
        const selectedAnimals = shuffledAnimals.slice(0, animalCount);

        const startX = 20;
        const bottomY = GAME_HEIGHT - 70;
        const spacingX = (GAME_WIDTH - 40) / itemCount;

        for (let i = 0; i < selectedAnimals.length; i++) {
            const animalType = selectedAnimals[i];
            newItems.push({
                id: i,
                type: animalType,
                x: startX + i * spacingX + (Math.random() - 0.5) * 10,
                y: bottomY + (Math.random() - 0.5) * 6,
                caught: false,
                isAnimal: true,
            });
        }

        const shuffledNon = [...NON_ANIMAL_TYPES].sort(() => 0.5 - Math.random());
        for (let i = 0; i < nonAnimalCount; i++) {
            const nonType = shuffledNon[i % shuffledNon.length];
            newItems.push({
                id: selectedAnimals.length + i,
                type: nonType,
                x: startX + (selectedAnimals.length + i) * spacingX + (Math.random() - 0.5) * 10,
                y: bottomY + (Math.random() - 0.5) * 6,
                caught: false,
                isAnimal: false,
            });
        }

        // 隨機排列
        setItems(newItems.sort(() => 0.5 - Math.random()));
        setScore(0);
        setCollectedAnimals([]);
        setGameOver(false);
        setGameComplete(false);
        setShowReport(false);
        setClawX((GAME_WIDTH - 36) / 2);
        setAnswerCount(0);          // 重置回答次数
        clawAIService.resetGame();
        setCurrentQuestion(null);
    };

    // ========== 初始化遊戲和倒數 ==========
    useEffect(() => {
        initializeItems();
        setTimeout(() => {
            startPrepSequence();
        }, 500);
    }, []);

    // 當物品清單變化時重新生成 AI 題目
    useEffect(() => {
        if (items.length > 0 && !gameOver && !gameComplete && !showReport && prepText === null) {
            const timer = setTimeout(() => {
                refreshAIQuestion();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [items, gameOver, gameComplete, showReport, prepText, refreshAIQuestion]);

    // 脈衝動畫
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const animateScore = () => {
        Animated.sequence([
            Animated.timing(scoreAnim, {
                toValue: 1.3,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scoreAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const showFeedback = (message: string, type: 'correct' | 'wrong') => {
        setFeedbackMessage({ text: message, type });
        feedbackAnim.setValue(0);
        Animated.sequence([
            Animated.timing(feedbackAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(feedbackAnim, {
                toValue: 0,
                duration: 200,
                delay: 800,
                useNativeDriver: true,
            }),
        ]).start(() => setFeedbackMessage(null));
    };

    // 移動邏輯
    useEffect(() => {
        if (leftPressed && !isDropping && !gameOver && !gameComplete && !showReport && prepText === null && !processing && !isAiThinking) {
            const interval = setInterval(() => {
                setClawX(prev => Math.max(8, prev - 12));
            }, 50);
            setMoveInterval(interval);
            return () => clearInterval(interval);
        } else if (rightPressed && !isDropping && !gameOver && !gameComplete && !showReport && prepText === null && !processing && !isAiThinking) {
            const interval = setInterval(() => {
                setClawX(prev => Math.min(GAME_WIDTH - 44, prev + 12));
            }, 50);
            setMoveInterval(interval);
            return () => clearInterval(interval);
        } else if (moveInterval) {
            clearInterval(moveInterval);
            setMoveInterval(null);
        }
    }, [leftPressed, rightPressed, isDropping, gameOver, gameComplete, showReport, prepText, processing, isAiThinking]);

    useEffect(() => {
        return () => {
            if (moveInterval) clearInterval(moveInterval);
        };
    }, [moveInterval]);

    useEffect(() => {
        if (isSuction && suctionItem) {
            Animated.sequence([
                Animated.timing(suctionAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(suctionAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isSuction]);

    const checkSuction = (): Item | null => {
        const clawCenterX = clawX + 18;
        const clawBottomY = GAME_HEIGHT - 20;
        for (const item of items) {
            if (item.caught) continue;
            const itemCenterX = item.x + item.type.width / 2;
            const itemCenterY = item.y + item.type.height / 2;
            const distance = Math.sqrt(
                Math.pow(clawCenterX - itemCenterX, 2) +
                Math.pow(clawBottomY - itemCenterY, 2)
            );
            if (distance < 42) return item;
        }
        return null;
    };

    // 結束遊戲（顯示總結）
    const endGameAndShowReport = async (finalScore: number) => {
        if (gameComplete || showReport) return;
        setGameComplete(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await saveScore(finalScore);
        setShowReport(true);
    };

    // 處理抓取結果
    const processCatch = async (caughtItem: Item) => {
        setProcessing(true);
        let isCorrect = false;

        try {
            if (!caughtItem.isAnimal) {
                // 抓错非动物，不计数回答次数
                showFeedback(`❌ ${caughtItem.type.name} It's not an animal! Try again.～`, 'wrong');
                showHitFeedback(false);
                await refreshAIQuestion();
            } else {
                if (!currentQuestion) {
                    showFeedback('🤖 The AI questions are not ready yet, please wait.', 'wrong');
                    setProcessing(false);
                    return;
                }
                const aiResult = await clawAIService.checkAnswer(caughtItem.type.name);
                isCorrect = aiResult.isCorrect;
                setAiFeedback(aiResult);
                showFeedback(aiResult.message, aiResult.isCorrect ? 'correct' : 'wrong');
                showHitFeedback(aiResult.isCorrect);
                setTimeout(() => setAiFeedback(null), 4000);

                // 回答次数增加（无论对错）
                const newCount = answerCount + 1;
                setAnswerCount(newCount);

                // ✅ 关键修改：达到最大次数立即结束，不再进行任何刷新或后续操作
                if (newCount >= MAX_ANSWERS) {
                    // 如果是正确回答，先加分再结束
                    let finalScore = score;
                    if (isCorrect) {
                        finalScore = Math.min(100, score + pointsPerAnimal);
                        setScore(finalScore);
                        animateScore();
                        // 更新物品和收集列表
                        setItems(prev => prev.map(i =>
                            i.id === caughtItem.id ? { ...i, caught: true } : i
                        ));
                        setCollectedAnimals(prev => [...prev, caughtItem]);
                    }
                    await endGameAndShowReport(finalScore);
                    setProcessing(false);
                    return;  // ✅ 直接返回，不再刷新题目
                }

                // 未达到最大次数，正常处理
                if (isCorrect) {
                    const newScore = Math.min(100, score + pointsPerAnimal);
                    setScore(newScore);
                    animateScore();

                    setItems(prev => prev.map(i =>
                        i.id === caughtItem.id ? { ...i, caught: true } : i
                    ));
                    setCollectedAnimals(prev => [...prev, caughtItem]);
                } else {
                    // 错误回答，刷新题目
                    await refreshAIQuestion();
                }
            }
        } catch (error) {
            console.error('Handling fetch failures:', error);
            showFeedback('System error, please try again.', 'wrong');
        } finally {
            setProcessing(false);
            setIsSuction(false);
            setSuctionItem(null);
        }
    };

    const dropClaw = () => {
        if (isDropping || gameOver || gameComplete || showReport || prepText !== null || processing || isAiThinking) return;
        setIsDropping(true);
        Animated.timing(dropAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: false,
        }).start();

        setTimeout(() => {
            const caughtItem = checkSuction();
            if (caughtItem) {
                setIsSuction(true);
                setSuctionItem(caughtItem);
                Animated.sequence([
                    Animated.timing(clawScaleAnim, {
                        toValue: 1.4,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(clawScaleAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start();
                setTimeout(() => {
                    processCatch(caughtItem);
                }, 200);
            } else {
                showFeedback('❌ Didn\'t catch it! Try moving the claw over the item again.', 'wrong');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeout(() => {
                    setIsDropping(false);
                }, 350);
            }
            setTimeout(() => {
                Animated.timing(dropAnim, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: false,
                }).start();
                setTimeout(() => setIsDropping(false), 350);
            }, 800);
        }, 450);
    };

    const resetGame = () => {
        initializeItems();
        setClawX((GAME_WIDTH - 36) / 2);
        setIsDropping(false);
        setIsSuction(false);
        setSuctionItem(null);
        setGameOver(false);
        setGameComplete(false);
        setShowReport(false);
        setFloatingText(null);
        setAiFeedback(null);
        setCurrentQuestion(null);
        setScore(0);
        setCollectedAnimals([]);
        setAnswerCount(0);
        dropAnim.setValue(0);
        clawAIService.resetGame();
        setProcessing(false);
        setTimeout(() => {
            startPrepSequence();
        }, 500);
    };

    const showReportPage = async () => {
        await saveScore(Math.round(score));
        setShowReport(true);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const goHome = () => navigation.navigate('science/index' as never);

    const dropHeight = dropAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, GAME_HEIGHT - 55],
    });
    const clawScale = clawScaleAnim;
    const suctionScale = suctionAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });
    const scoreScale = scoreAnim;
    const feedbackTranslateY = feedbackAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [20, -10, 0],
    });
    const feedbackOpacity = feedbackAnim;
    const screenShakeStyle = {
        transform: [{ translateX: screenShake }],
    };
    const prepAnimatedStyle = {
        transform: [{ scale: prepScale }],
        opacity: prepScale.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 1],
        }),
    };

    if (showReport) {
        return (
            <SafeAreaView style={styles.reportContainer}>
                <ScrollView contentContainerStyle={styles.reportScrollContent}>
                    <View style={styles.reportCard}>
                        <Text style={styles.reportEmoji}>
                            {Math.round(score) === 100 ? '🏆' : Math.round(score) >= 70 ? '🎉' : '📊'}
                        </Text>
                        <Text style={styles.reportTitle}>Game Summary</Text>
                        <View style={styles.reportScoreBox}>
                            <Text style={styles.reportScoreLabel}>Final score</Text>
                            <Text style={styles.reportScoreValue}>{Math.round(score)}/100</Text>
                        </View>
                        {isSaving && (
                            <View style={styles.savingIndicator}>
                                <ActivityIndicator size="small" color="#4CAF50" />
                                <Text style={styles.savingText}>In synchronous scores...</Text>
                            </View>
                        )}
                        <View style={styles.reportStatsBox}>
                            <View style={styles.reportStatItem}>
                                <Text style={styles.reportStatEmoji}>🐾</Text>
                                <Text style={styles.reportStatLabel}>Correct Answers</Text>
                                <Text style={styles.reportStatValue}>{correctCatches}/{MAX_ANSWERS}</Text>
                            </View>
                            <View style={styles.reportStatItem}>
                                <Text style={styles.reportStatEmoji}>🎯</Text>
                                <Text style={styles.reportStatLabel}>Accuracy</Text>
                                <Text style={styles.reportStatValue}>
                                    {Math.round((correctCatches / MAX_ANSWERS) * 100)}%
                                </Text>
                            </View>
                        </View>
                        <View style={styles.reportButtonGroup}>
                            <TouchableOpacity style={styles.reportPlayAgainBtn} onPress={resetGame}>
                                <Text style={styles.reportPlayAgainText}>⟳ play again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.reportHomeBtn} onPress={handleGoBack}>
                                <Text style={styles.reportHomeBtnText}>🏠 select level</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.reportHomeBtn} onPress={goHome}>
                                <Text style={styles.reportHomeBtnText}>🏠 go to game list</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <Animated.View style={[styles.container, screenShakeStyle]}>
            {prepText && (
                <Animated.View style={[styles.prepOverlay, prepAnimatedStyle]}>
                    <View style={styles.prepCard}>
                        <Text style={styles.prepEmoji}>
                            {prepText === 'READY' ? '🎪' : '🎯'}
                        </Text>
                        <Text style={styles.prepText}>{prepText}</Text>
                        <Text style={styles.prepSubtext}>
                            {prepText === 'READY' ? 'Ready to catch some animals?' : 'GO GO GO!'}
                        </Text>
                    </View>
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

            <View style={styles.header}>
                <View style={styles.headerPlaceholder} />
                <Text style={styles.title}>🐾 Animal Scratch Fun 🐾</Text>
                <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreScale }] }]}>
                    <Text style={styles.scoreValue}>{Math.round(score)}</Text>
                    <Text style={styles.scoreMax}>/100</Text>
                </Animated.View>
            </View>

            {/* AI 問題面板 */}
            <View style={styles.aiQuestionPanel}>
                {isAiThinking ? (
                    <View style={styles.questionBoxLoading}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.aiLoadingText}>🤖 AI is thinking about the question....</Text>
                        <Text style={styles.aiLoadingSubtext}>Almost done！</Text>
                    </View>
                ) : currentQuestion ? (
                    <>
                        <View style={styles.questionBox}>
                            <Text style={styles.questionLabel}>📋 question</Text>
                            <Text style={styles.questionText}>{currentQuestion.description}</Text>
                            <TouchableOpacity
                                style={styles.hintButton}
                                onPress={() => setShowQuestionHint(!showQuestionHint)}
                            >
                                <Text style={styles.hintButtonText}>💡 hint</Text>
                            </TouchableOpacity>
                            {showQuestionHint && (
                                <Text style={styles.hintText}>🔍 {currentQuestion.hint}</Text>
                            )}
                        </View>
                        {aiFeedback && (
                            <Animated.View style={[
                                styles.aiFeedbackBox,
                                aiFeedback.isCorrect ? styles.feedbackCorrectBox : styles.feedbackWrongBox
                            ]}>
                                <Text style={styles.aiFunFact}>📖 {aiFeedback.funFact}</Text>
                                <Text style={styles.aiEncouragement}>💪 {aiFeedback.encouragement}</Text>
                            </Animated.View>
                        )}
                    </>
                ) : (
                    <View style={styles.questionBoxLoading}>
                        <Text style={styles.aiLoadingText}>🐣 Get ready...</Text>
                        <Text style={styles.aiLoadingSubtext}>AI will ask a question soon!</Text>
                    </View>
                )}
            </View>

            <View style={styles.machineContainer}>
                <View style={styles.machineBody}>
                    <View style={styles.machineTop}>
                        <View style={styles.railHorizontal} />
                        <View style={styles.railVertical} />
                        <Text style={styles.machineLabel}>ANIMAL CATCHER</Text>
                    </View>
                    <View style={styles.gameArea}>
                        <View style={styles.gameBackground}>
                            <View style={styles.gridPattern} />
                        </View>
                        {items.map(item => !item.caught && (
                            <Animated.View
                                key={item.id}
                                style={[
                                    styles.item,
                                    {
                                        left: item.x,
                                        top: item.y,
                                        width: item.type.width,
                                        height: item.type.height,
                                        transform: [{
                                            scale: suctionItem?.id === item.id && isSuction ? suctionScale : 1
                                        }],
                                        borderColor: item.isAnimal ? '#4caf50' : '#e74c3c',
                                        backgroundColor: item.isAnimal ? 'rgba(76, 175, 80, 0.15)' : 'rgba(231, 76, 60, 0.1)',
                                    }
                                ]}
                            >
                                <Text style={styles.itemIcon}>{item.type.icon}</Text>
                                <Text style={styles.itemName}>{item.type.name}</Text>
                                {!item.isAnimal && (
                                    <View style={styles.warningBadge}>
                                        <Text style={styles.warningText}>⚠️</Text>
                                    </View>
                                )}
                            </Animated.View>
                        ))}
                        {/* 伸长柱（绳子）保持不变 */}
                        <Animated.View
                            style={[styles.rope, { left: clawX + 22, height: dropHeight }]}
                        />
                        {/* 爪子改为图片 */}
                        <Animated.View
                            style={[
                                styles.claw,
                                { left: clawX, top: Animated.add(dropHeight, 15), transform: [{ scale: clawScale }] }
                            ]}
                        >
                            <Image
                                source={require('@/assets/images/claw_arm.png')}
                                style={styles.clawImage}
                                resizeMode="contain"
                            />
                            {isSuction && suctionItem && (
                                <Animated.View style={[styles.suctionEffect, { transform: [{ scale: suctionScale }] }]}>
                                    <Text style={styles.suctionText}></Text>
                                </Animated.View>
                            )}
                        </Animated.View>
                        <View style={styles.suctionZone}>
                            <Text style={styles.suctionZoneText}>⬇️ CATCH ZONE ⬇️</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.controlPanel}>
                    <View style={styles.controlButtons}>
                        <TouchableOpacity
                            style={[styles.controlBtn, styles.leftBtn]}
                            onPressIn={() => setLeftPressed(true)}
                            onPressOut={() => setLeftPressed(false)}
                            disabled={isDropping || gameOver || gameComplete || showReport || prepText !== null || processing || isAiThinking}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnText}>◀</Text>
                        </TouchableOpacity>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={[styles.controlBtn, styles.grabBtn]}
                                onPress={dropClaw}
                                disabled={isDropping || gameOver || gameComplete || showReport || prepText !== null || processing || isAiThinking}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.grabBtnText}>⚡ Scraping ⚡</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <TouchableOpacity
                            style={[styles.controlBtn, styles.rightBtn]}
                            onPressIn={() => setRightPressed(true)}
                            onPressOut={() => setRightPressed(false)}
                            disabled={isDropping || gameOver || gameComplete || showReport || prepText !== null || processing || isAiThinking}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnText}>▶</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bottomBar}>
                        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
                            <Text style={styles.resetBtnText}>⟳ Start over</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.completeBtn} onPress={showReportPage} disabled={showReport}>
                            <Text style={styles.completeBtnText}>✓ Finish</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {feedbackMessage && (
                <Animated.View
                    style={[
                        styles.feedbackContainer,
                        { transform: [{ translateY: feedbackTranslateY }], opacity: feedbackOpacity }
                    ]}
                >
                    <View style={[
                        styles.feedbackBox,
                        feedbackMessage.type === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong
                    ]}>
                        <Text style={styles.feedbackText}>{feedbackMessage.text}</Text>
                    </View>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3a2f',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: MACHINE_WIDTH,
        marginBottom: 10,
    },
    headerPlaceholder: {
        width: 40,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffdd88',
        backgroundColor: '#3a2a1f',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    scoreContainer: {
        backgroundColor: '#2d2b1f',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'baseline',
        borderWidth: 2,
        borderColor: '#ffaa44',
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffdd88',
    },
    scoreMax: {
        fontSize: 10,
        color: '#c9a87b',
        marginLeft: 2,
    },
    aiQuestionPanel: {
        width: MACHINE_WIDTH,
        marginBottom: 10,
    },
    questionBox: {
        backgroundColor: '#2d2b1f',
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: '#ffaa44',
    },
    questionBoxLoading: {
        backgroundColor: '#2d2b1f',
        borderRadius: 12,
        padding: 24,
        borderWidth: 2,
        borderColor: '#ffaa44',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionLabel: {
        fontSize: 11,
        color: '#ffaa44',
        marginBottom: 6,
        fontWeight: 'bold',
    },
    questionText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 22,
    },
    hintButton: {
        backgroundColor: '#3a2a1f',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    hintButtonText: {
        fontSize: 11,
        color: '#ffdd88',
    },
    hintText: {
        fontSize: 12,
        color: '#c9a87b',
        marginTop: 8,
        padding: 8,
        backgroundColor: '#1e3a2f',
        borderRadius: 8,
    },
    aiFeedbackBox: {
        borderRadius: 12,
        padding: 10,
        marginTop: 8,
    },
    feedbackCorrectBox: {
        backgroundColor: '#2e7d32',
    },
    feedbackWrongBox: {
        backgroundColor: '#c62828',
    },
    aiFunFact: {
        fontSize: 12,
        color: '#fff',
        marginBottom: 4,
    },
    aiEncouragement: {
        fontSize: 11,
        color: '#ffdd88',
    },
    aiLoadingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffdd88',
        marginTop: 12,
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    aiLoadingSubtext: {
        fontSize: 12,
        color: '#c9a87b',
        marginTop: 4,
    },
    machineContainer: {
        width: MACHINE_WIDTH,
        backgroundColor: '#2d2b1f',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#c9a87b',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    machineBody: {
        backgroundColor: '#7fcfed',
        height: 360,
        position: 'relative',
    },
    machineTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: '#70f7f3',
        zIndex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    railHorizontal: {
        position: 'absolute',
        top: 25,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#33a5da',
    },
    railVertical: {
        position: 'absolute',
        top: 0,
        left: (MACHINE_WIDTH - 8) / 2,
        width: 8,
        height: 70,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#33a5da',
    },
    machineLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#33a5da',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    gameArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 290,
        backgroundColor: '#def7f6',
        overflow: 'visible',
    },
    gameBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f9e5b3',
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
        backgroundColor: '#d4a373',
    },
    rope: {
        position: 'absolute',
        width: 4,
        backgroundColor: '#8B4513',
        borderRadius: 2,
        top: 15,
    },
    claw: {
        position: 'absolute',
        width: 48,
        height: 48,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clawImage: {
        width: '100%',
        height: '100%',
    },
    suctionEffect: {
        position: 'absolute',
        top: -15,
        left: 8,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suctionText: {
        fontSize: 18,
        color: '#ff66aa',
    },
    item: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 248, 225, 0.95)',
        borderRadius: 10,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        padding: 4,
    },
    itemIcon: {
        fontSize: 28,
    },
    itemName: {
        fontSize: 9,
        marginTop: 2,
        fontWeight: '500',
        color: '#57280f',
    },
    warningBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#e74c3c',
        borderRadius: 12,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    warningText: {
        fontSize: 10,
        color: '#fff',
    },
    suctionZone: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 35,
        backgroundColor: 'rgba(76, 175, 80, 0.25)',
        borderTopWidth: 2,
        borderTopColor: '#4caf50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    suctionZoneText: {
        fontSize: 10,
        color: '#2e7d32',
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    controlPanel: {
        backgroundColor: '#3a94b7',
        padding: 10,
        borderTopWidth: 2,
        borderTopColor: '#c9a87b',
    },
    controlButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    controlBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    leftBtn: { backgroundColor: '#3498db' },
    rightBtn: { backgroundColor: '#3498db' },
    grabBtn: { width: 100, backgroundColor: '#4caf50' },
    btnText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    grabBtnText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    resetBtn: {
        backgroundColor: '#57280f',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffaa44',
    },
    resetBtnText: { color: '#ffaa44', fontSize: 11, fontWeight: 'bold' },
    completeBtn: {
        backgroundColor: '#4caf50',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffdd88',
    },
    completeBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    feedbackContainer: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 200,
    },
    feedbackBox: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    feedbackCorrect: { backgroundColor: '#4caf50' },
    feedbackWrong: { backgroundColor: '#e74c3c' },
    feedbackText: { fontSize: 14, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    reportContainer: { flex: 1, backgroundColor: '#1e3a2f' },
    reportScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    reportCard: {
        backgroundColor: '#2d2b1f',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffaa44',
        width: '100%',
        maxWidth: 400,
    },
    reportEmoji: { fontSize: 72, marginBottom: 16 },
    reportTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffaa44',
        marginBottom: 24,
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    reportScoreBox: {
        backgroundColor: '#3a2a1f',
        padding: 16,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    reportScoreLabel: { fontSize: 14, color: '#c9a87b', marginBottom: 8 },
    reportScoreValue: { fontSize: 48, fontWeight: 'bold', color: '#ffdd88' },
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#1e3a2f',
        borderRadius: 20,
    },
    savingText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    reportStatsBox: { width: '100%', marginBottom: 32 },
    reportStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e2a1f',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    reportStatEmoji: { fontSize: 24, width: 40 },
    reportStatLabel: { fontSize: 14, color: '#fff', flex: 1, marginLeft: 8 },
    reportStatValue: { fontSize: 18, fontWeight: 'bold', color: '#ffaa44' },
    reportButtonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
    },
    reportPlayAgainBtn: {
        backgroundColor: '#ffaa44',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        minWidth: 120,
        alignItems: 'center',
    },
    reportPlayAgainText: { fontSize: 14, fontWeight: 'bold', color: '#57280f' },
    reportHomeBtn: {
        backgroundColor: '#57280f',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        minWidth: 120,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffaa44',
    },
    reportHomeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#ffaa44' },
    floatingContainer: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 300,
    },
    floatingText: {
        fontSize: 48,
        fontWeight: '900',
        textAlign: 'center',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    prepOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 400,
        alignItems: 'center',
        justifyContent: 'center',
    },
    prepCard: {
        backgroundColor: '#2d2b1f',
        paddingHorizontal: 40,
        paddingVertical: 30,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: '#ffaa44',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    prepEmoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    prepText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#ffdd88',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
        textShadowColor: '#ffaa44',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    prepSubtext: {
        fontSize: 16,
        color: '#c9a87b',
        marginTop: 15,
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
});

export default ClawMachineGame;