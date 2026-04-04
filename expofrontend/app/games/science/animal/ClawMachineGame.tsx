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

const ANIMAL_TYPES: AnimalType[] = [
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

// ========== 🎯 浮動文字元件 (HIT / OUCH) ==========
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

    // ⭐ 完全隐藏系统导航栏（包括返回按钮和标题）
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

    // AI 出題模式狀態
    const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
    const [showQuestionHint, setShowQuestionHint] = useState<boolean>(false);

    // ========== ✨ 新增特效狀態 ==========
    // 1. 浮動文字特效
    const [floatingText, setFloatingText] = useState<{ id: number; text: string; color: string } | null>(null);
    // 2. 螢幕震動效果
    const screenShake = useRef(new Animated.Value(0)).current;
    // 3. 倒數準備狀態
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useRef(new Animated.Value(0)).current;

    // 動畫值
    const dropAnim = useRef(new Animated.Value(0)).current;
    const clawScaleAnim = useRef(new Animated.Value(1)).current;
    const suctionAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scoreAnim = useRef(new Animated.Value(1)).current;
    const feedbackAnim = useRef(new Animated.Value(0)).current;

    // 計算統計
    const totalAnimals = items.filter(i => i.isAnimal).length;
    const correctCatches = collectedAnimals.filter(a => a.isAnimal).length;
    const wrongCatches = collectedAnimals.length - correctCatches;

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

    // 獲取當前場上未被抓的動物名稱
    const getAvailableAnimalNames = useCallback((): string[] => {
        return items
            .filter(item => item.isAnimal && !item.caught)
            .map(item => item.type.name);
    }, [items]);

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

    // ========== 🎯 顯示打擊回饋 ==========
    const showHitFeedback = (isCorrect: boolean, animalName?: string) => {
        // 觸覺回饋
        if (isCorrect) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            // 錯誤時觸發螢幕震動
            triggerScreenShake();
        }

        // 浮動文字
        setFloatingText({
            id: Date.now(),
            text: isCorrect ? '✨ GREAT! ✨' : '💥 OH NO! 💥',
            color: isCorrect ? '#FFD700' : '#FF4757',
        });
    };

    // ========== 🎪 倒數準備動畫 (withSpring 彈性效果) ==========
    const startPrepSequence = () => {
        // READY 彈跳
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

        // GO! 更大的彈跳
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

        // 隱藏倒數文字，開始遊戲
        setTimeout(() => {
            Animated.timing(prepScale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setPrepText(null));
        }, 1600);
    };

    // 初始化物品（確保所有動物都出現）
    const initializeItems = () => {
        const newItems: Item[] = [];
        const itemCount = 12;
        const startX = 20;
        const bottomY = GAME_HEIGHT - 70;
        const spacingX = (GAME_WIDTH - 40) / itemCount;

        // 使用全部10種動物
        const animalCount = 10;
        const nonAnimalCount = itemCount - animalCount; // 2個干擾物

        for (let i = 0; i < animalCount; i++) {
            const animalType = ANIMAL_TYPES[i % ANIMAL_TYPES.length];
            newItems.push({
                id: i,
                type: animalType,
                x: startX + i * spacingX + (Math.random() - 0.5) * 10,
                y: bottomY + (Math.random() - 0.5) * 6,
                caught: false,
                isAnimal: true,
            });
        }

        const shuffledNonAnimals = [...NON_ANIMAL_TYPES].sort(() => 0.5 - Math.random());
        for (let i = 0; i < nonAnimalCount; i++) {
            const nonAnimalType = shuffledNonAnimals[i % shuffledNonAnimals.length];
            newItems.push({
                id: animalCount + i,
                type: nonAnimalType,
                x: startX + (animalCount + i) * spacingX + (Math.random() - 0.5) * 10,
                y: bottomY + (Math.random() - 0.5) * 6,
                caught: false,
                isAnimal: false,
            });
        }

        setItems(newItems.sort(() => 0.5 - Math.random()));
        setScore(0);
        setCollectedAnimals([]);
        setGameOver(false);
        setGameComplete(false);
        setShowReport(false);
        setClawX((GAME_WIDTH - 36) / 2);
    };

    // 生成 AI 題目（確保目標動物存在）
    const generateValidQuestion = useCallback(() => {
        const availableAnimals = getAvailableAnimalNames();
        if (availableAnimals.length > 0) {
            const newQuestion = clawAIService.generateQuestionWithAvailableAnimals(availableAnimals);
            setCurrentQuestion(newQuestion);
        } else {
            const newQuestion = clawAIService.generateQuestion();
            setCurrentQuestion(newQuestion);
        }
    }, [getAvailableAnimalNames]);

    // 初始化遊戲和倒數
    useEffect(() => {
        initializeItems();
        // 遊戲初始化完成後開始倒數
        setTimeout(() => {
            startPrepSequence();
        }, 500);
    }, []);

    useEffect(() => {
        if (items.length > 0) {
            generateValidQuestion();
        }
    }, [items, generateValidQuestion]);

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
        if (leftPressed && !isDropping && !gameOver && !gameComplete && !showReport && prepText === null) {
            const interval = setInterval(() => {
                setClawX(prev => Math.max(8, prev - 12));
            }, 50);
            setMoveInterval(interval);
            return () => clearInterval(interval);
        } else if (rightPressed && !isDropping && !gameOver && !gameComplete && !showReport && prepText === null) {
            const interval = setInterval(() => {
                setClawX(prev => Math.min(GAME_WIDTH - 44, prev + 12));
            }, 50);
            setMoveInterval(interval);
            return () => clearInterval(interval);
        } else if (moveInterval) {
            clearInterval(moveInterval);
            setMoveInterval(null);
        }
    }, [leftPressed, rightPressed, isDropping, gameOver, gameComplete, showReport, prepText]);

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

    // AI 處理答案
    const handleAIAnswer = async (caughtItem: Item) => {
        if (!caughtItem.isAnimal) return;
        setIsAiThinking(true);
        try {
            const feedback = await clawAIService.checkAnswer(caughtItem.type.name);
            setAiFeedback(feedback);
            showFeedback(feedback.message, feedback.isCorrect ? 'correct' : 'wrong');
            setScore(prev => Math.min(100, Math.max(0, prev + feedback.scoreChange)));
            generateValidQuestion();
            setShowQuestionHint(false);
            setTimeout(() => setAiFeedback(null), 4000);
        } catch (error) {
            console.error('AI 處理失敗:', error);
        }
        setIsAiThinking(false);
    };

    const handleCatch = (caughtItem: Item) => {
        let newScore = score;
        let message = '';
        let type: 'correct' | 'wrong' = 'correct';

        if (caughtItem.isAnimal) {
            message = `🎉 ${caughtItem.type.name} caught! +10 points! 🎉`;
            type = 'correct';
            animateScore();
            // ✨ 顯示打擊回饋
            showHitFeedback(true, caughtItem.type.name);
            handleAIAnswer(caughtItem);
            newScore = Math.min(100, score + 10);
        } else {
            newScore = Math.max(0, score - 10);
            message = `💔 Oops! ${caughtItem.type.name} is not an animal! -10 points 💔`;
            type = 'wrong';
            animateScore();
            // ✨ 顯示錯誤打擊回饋
            showHitFeedback(false);
            setScore(newScore);
        }

        showFeedback(message, type);
        setItems(prev => prev.map(i =>
            i.id === caughtItem.id ? { ...i, caught: true } : i
        ));
        if (caughtItem.isAnimal) {
            setCollectedAnimals(prev => [...prev, caughtItem]);
        }

        const remainingAnimalsCount = items.filter(i => i.isAnimal && !i.caught && i.id !== caughtItem.id).length;
        if (newScore <= 0) {
            setGameOver(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (remainingAnimalsCount === 0) {
            setGameComplete(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const dropClaw = () => {
        if (isDropping || gameOver || gameComplete || showReport || prepText !== null) return;
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
                    handleCatch(caughtItem);
                    setIsSuction(false);
                    setSuctionItem(null);
                }, 200);
            } else {
                showFeedback('❌ Missed! Position the claw above an item! ❌', 'wrong');
                // 抓空也有輕微回饋
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        dropAnim.setValue(0);
        clawAIService.resetGame();
        // 重新開始倒數
        setTimeout(() => {
            startPrepSequence();
        }, 500);
    };

    const showReportPage = async () => {
        // 保存分數到伺服器
        await saveScore(score);
        setShowReport(true);
    };

    // ⭐  goBack 函数，不再需要返回按钮
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

    // ✨ 螢幕震動動畫樣式
    const screenShakeStyle = {
        transform: [{ translateX: screenShake }],
    };

    // ✨ 倒數動畫樣式
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
                            {score === 100 ? '🏆' : score >= 70 ? '🎉' : '📊'}
                        </Text>
                        <Text style={styles.reportTitle}>遊戲總結</Text>
                        <View style={styles.reportScoreBox}>
                            <Text style={styles.reportScoreLabel}>最終分數</Text>
                            <Text style={styles.reportScoreValue}>{score}/100</Text>
                        </View>

                        {/* 保存中指示器 */}
                        {isSaving && (
                            <View style={styles.savingIndicator}>
                                <ActivityIndicator size="small" color="#4CAF50" />
                                <Text style={styles.savingText}>同步分數中...</Text>
                            </View>
                        )}

                        <View style={styles.reportStatsBox}>
                            <View style={styles.reportStatItem}>
                                <Text style={styles.reportStatEmoji}>🐾</Text>
                                <Text style={styles.reportStatLabel}>抓到動物</Text>
                                <Text style={styles.reportStatValue}>{correctCatches}/{totalAnimals}</Text>
                            </View>
                            <View style={styles.reportStatItem}>
                                <Text style={styles.reportStatEmoji}>⚠️</Text>
                                <Text style={styles.reportStatLabel}>錯誤抓取</Text>
                                <Text style={styles.reportStatValue}>{wrongCatches}</Text>
                            </View>
                            <View style={styles.reportStatItem}>
                                <Text style={styles.reportStatEmoji}>🎯</Text>
                                <Text style={styles.reportStatLabel}>準確率</Text>
                                <Text style={styles.reportStatValue}>
                                    {totalAnimals > 0 ? Math.round((correctCatches / totalAnimals) * 100) : 0}%
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
            {/* 倒數準備覆蓋層 */}
            {prepText && (
                <Animated.View style={[styles.prepOverlay, prepAnimatedStyle]}>
                    <View style={styles.prepCard}>
                        <Text style={styles.prepEmoji}>
                            {prepText === 'READY' ? '🎪' : '🎯'}
                        </Text>
                        <Text style={styles.prepText}>{prepText}</Text>
                        <Text style={styles.prepSubtext}>
                            {prepText === 'READY' ? '準備好抓動物了嗎？' : 'GO GO GO!'}
                        </Text>
                    </View>
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

            {/* 頂部欄 - 移除返回按鈕，只保留標題和分數 */}
            <View style={styles.header}>
                <View style={styles.headerPlaceholder} />
                <Text style={styles.title}>🐾 動物抓抓樂 🐾</Text>
                <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreScale }] }]}>
                    <Text style={styles.scoreValue}>{score}</Text>
                    <Text style={styles.scoreMax}>/100</Text>
                </Animated.View>
            </View>

            {/* AI 出題面板 */}
            {currentQuestion && (
                <View style={styles.aiQuestionPanel}>
                    <View style={styles.questionBox}>
                        <Text style={styles.questionLabel}>📋 題目</Text>
                        <Text style={styles.questionText}>{currentQuestion.description}</Text>
                        <TouchableOpacity
                            style={styles.hintButton}
                            onPress={() => setShowQuestionHint(!showQuestionHint)}
                        >
                            <Text style={styles.hintButtonText}>💡 提示</Text>
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
                    {isAiThinking && (
                        <View style={styles.aiThinkingBox}>
                            <Text style={styles.aiThinkingText}>🤖 AI 評分中...</Text>
                        </View>
                    )}
                </View>
            )}

            {/* 夾公仔機 */}
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
                        <Animated.View
                            style={[styles.rope, { left: clawX + 16, height: dropHeight }]}
                        />
                        <Animated.View
                            style={[
                                styles.claw,
                                { left: clawX, top: Animated.add(dropHeight, 15), transform: [{ scale: clawScale }] }
                            ]}
                        >
                            <View style={styles.clawTop}>
                                <Text style={styles.clawIcon}>🦾</Text>
                            </View>
                            <View style={styles.clawArms}>
                                <View style={styles.clawArm} />
                                <View style={styles.clawArm} />
                                <View style={styles.clawArm} />
                            </View>
                            {isSuction && suctionItem && (
                                <Animated.View style={[styles.suctionEffect, { transform: [{ scale: suctionScale }] }]}>
                                    <Text style={styles.suctionText}>⚡</Text>
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
                            disabled={isDropping || gameOver || gameComplete || showReport || prepText !== null}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnText}>◀</Text>
                        </TouchableOpacity>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={[styles.controlBtn, styles.grabBtn]}
                                onPress={dropClaw}
                                disabled={isDropping || gameOver || gameComplete || showReport || prepText !== null}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.grabBtnText}>⚡ 抓取 ⚡</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <TouchableOpacity
                            style={[styles.controlBtn, styles.rightBtn]}
                            onPressIn={() => setRightPressed(true)}
                            onPressOut={() => setRightPressed(false)}
                            disabled={isDropping || gameOver || gameComplete || showReport || prepText !== null}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnText}>▶</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bottomBar}>
                        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
                            <Text style={styles.resetBtnText}>⟳ 重來</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.completeBtn} onPress={showReportPage} disabled={showReport}>
                            <Text style={styles.completeBtnText}>✓ 完成</Text>
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
        width: 40, // 佔位符，保持標題置中
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
    aiThinkingBox: {
        backgroundColor: '#3a2a1f',
        borderRadius: 12,
        padding: 10,
        marginTop: 8,
        alignItems: 'center',
    },
    aiThinkingText: {
        fontSize: 11,
        color: '#ffdd88',
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
        top: -45,
    },
    claw: {
        position: 'absolute',
        width: 36,
        height: 48,
        zIndex: 10,
    },
    clawTop: {
        width: 24,
        height: 14,
        backgroundColor: '#c0c0c0',
        borderRadius: 6,
        marginLeft: 6,
        borderWidth: 1,
        borderColor: '#8b6946',
        alignItems: 'center',
    },
    clawIcon: {
        fontSize: 12,
    },
    clawArms: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 2,
    },
    clawArm: {
        width: 10,
        height: 28,
        backgroundColor: '#a0a0a0',
        borderRadius: 4,
        marginHorizontal: 1,
        borderWidth: 1,
        borderColor: '#6b4c3b',
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

    // ========== ✨ 新增特效樣式 ==========
    // 浮動文字樣式
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
    // 倒數準備覆蓋層樣式
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