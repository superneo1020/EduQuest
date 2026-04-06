// app/games/chinese/chinesequiz.tsx
// 餐廳大作戰 - 傳送帶版本（加入打擊回饋與倒數特效版）
// 修改：總分滿分為100分

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    BackHandler,
    SafeAreaView,
    Animated,
    Dimensions,
    StatusBar,
    Easing,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Star, Sparkles, Heart, Utensils } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';
import ChineseAIService, { ChineseQuestion } from '../../services/ChineseAIService';

const { width: screenWidth } = Dimensions.get('window');
const CONVEYOR_WIDTH = Math.min(700, screenWidth - 40);
const ITEM_SIZE = 80;
const CONVEYOR_HEIGHT = 280;

type GameState = 'difficulty_select' | 'playing' | 'result';

interface ConveyorItem {
    id: number;
    text: string;
    isCorrect: boolean;
    x: Animated.Value;
    y: number;
    pinyin?: string;
    explanation?: string;
    scale: Animated.Value;
    opacity: Animated.Value;
    icon: string;
    isAnimating: boolean;
}

interface ExtendedQuestion extends ChineseQuestion {
    userAnswer?: string;
    isAnsweredCorrectly?: boolean;
    userSelectedIndex?: number;
}

type CustomerState = 'happy' | 'angry' | 'waiting';

// --- 💥 浮動文字元件 (HIT / OUCH) ---
const FloatingText = ({ text, color, onComplete }: { text: string, color: string, onComplete: () => void }) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -80,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => onComplete());
    }, [onComplete, opacity, translateY]);

    return (
        <Animated.View style={[styles.floatingLayer, { opacity, transform: [{ translateY }] }]}>
            <Text style={[styles.hitText, { color }]}>{text}</Text>
        </Animated.View>
    );
};

const ChineseRestaurantGame = () => {
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [questions, setQuestions] = useState<ExtendedQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameState, setGameState] = useState<GameState>('difficulty_select');
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);
    const [difficulty, setDifficulty] = useState<'beginner' | 'advanced' | null>(null);
    const [aiFeedback, setAiFeedback] = useState<string>('');

    const [items, setItems] = useState<ConveyorItem[]>([]);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [isGameActive, setIsGameActive] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
    const [customerState, setCustomerState] = useState<CustomerState>('waiting');
    const [hintVisible, setHintVisible] = useState(false);
    const [hintText, setHintText] = useState('');
    const [hintColor, setHintColor] = useState('#4CAF50');
    const [nextQuestionDelay, setNextQuestionDelay] = useState(false);
    const [beltWidth, setBeltWidth] = useState(CONVEYOR_WIDTH);

    // 倒數計時狀態
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useRef(new Animated.Value(0)).current;
    const [gameActive, setGameActive] = useState(false);

    // 特效狀態
    const [floatingText, setFloatingText] = useState<{ id: number, text: string, color: string } | null>(null);
    const screenShake = useRef(new Animated.Value(0)).current;

    const scoreAnim = useRef(new Animated.Value(1)).current;
    const comboAnim = useRef(new Animated.Value(1)).current;
    const conveyorAnim = useRef(new Animated.Value(0)).current;
    const customerAnim = useRef(new Animated.Value(1)).current;

    const currentQuestion = questions[currentIndex];

    // 所有食材圖標列表
    const foodIcons = [
        '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭',
        '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽',
        '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🧀', '🍗',
        '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚',
        '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🍱', '🍘', '🍙', '🍚', '🍛',
        '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡',
        '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭',
        '🍮', '🍯', '🥛', '☕', '🍵', '🧃', '🥤', '🧋'
    ];

    // 隨機獲取圖標
    const getRandomIcon = (): string => {
        return foodIcons[Math.floor(Math.random() * foodIcons.length)];
    };

    // 修改：倍率調整為 1 / 1.2 / 1.5，配合滿分100
    const getMultiplier = (currentCombo: number) => {
        if (currentCombo >= 5) return 1.5;
        if (currentCombo >= 3) return 1.2;
        return 1;
    };

    // 保存分數到伺服器（滿分100）
    const saveScore = async (finalScore: number) => {
        if (!token || !difficulty) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "ChineseGame",
                scores: finalScore,
                difficulty: difficulty === 'beginner' ? 'BEGINNER' : 'ADVANCED'
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

    // 倒數準備序列
    const startPrepSequence = () => {
        setGameActive(false);

        setTimeout(() => {
            setPrepText('READY');
            prepScale.setValue(0);
            Animated.spring(prepScale, {
                toValue: 1.2,
                friction: 4,
                tension: 100,
                useNativeDriver: true,
            }).start();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }, 100);

        setTimeout(() => {
            setPrepText('GO!');
            prepScale.setValue(0);
            Animated.spring(prepScale, {
                toValue: 1.5,
                friction: 3,
                tension: 150,
                useNativeDriver: true,
            }).start();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }, 1000);

        setTimeout(() => {
            setPrepText(null);
            setGameActive(true);
        }, 1600);
    };

    // 觸發螢幕震動效果
    const triggerScreenShake = () => {
        Animated.sequence([
            Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // 獲取 Animated.Value 的當前值
    const getAnimatedValue = (value: Animated.Value): number => {
        // @ts-ignore - 使用 __getValue 作為替代方案
        return value.__getValue();
    };

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (gameState === 'result') {
                handleRestart();
                return true;
            }
            if (gameState === 'playing') {
                Alert.alert(
                    'Exit the restaurant',
                    'Are you sure you want to leave? Progress will not be saved.',
                    [
                        { text: 'Continue cooking', style: 'cancel' },
                        {
                            text: 'Exit',
                            style: 'destructive',
                            onPress: () => {
                                setGameState('difficulty_select');
                                resetGame();
                            }
                        }
                    ]
                );
                return true;
            }
            return false;
        });
        return () => backHandler.remove();
    }, [gameState]);

    useEffect(() => {
        if (isGameActive && !gameComplete && !nextQuestionDelay) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(conveyorAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                        easing: Easing.linear,
                    }),
                    Animated.timing(conveyorAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                        easing: Easing.linear,
                    }),
                ])
            ).start();
        }
    }, [isGameActive, gameComplete, nextQuestionDelay, conveyorAnim]);

    useEffect(() => {
        if (isGameActive && currentQuestion && !nextQuestionDelay && items.length < 5) {
            const spawnInterval = setInterval(() => {
                if (items.length < 8 && !nextQuestionDelay) {
                    spawnItem();
                }
            }, 1500);
            return () => clearInterval(spawnInterval);
        }
    }, [isGameActive, currentQuestion, items.length, nextQuestionDelay]);

    useEffect(() => {
        if (isGameActive && !gameComplete && !nextQuestionDelay && items.length > 0) {
            const moveInterval = setInterval(() => {
                setItems(prev => {
                    const updated = prev.map(item => {
                        const currentX = getAnimatedValue(item.x);
                        const newX = currentX - 3.5;
                        item.x.setValue(newX);
                        return item;
                    });
                    const filtered = updated.filter(item => getAnimatedValue(item.x) > -ITEM_SIZE);
                    return filtered;
                });
            }, 30);
            return () => clearInterval(moveInterval);
        }
    }, [isGameActive, gameComplete, nextQuestionDelay, items.length]);

    const spawnItem = () => {
        if (!currentQuestion || nextQuestionDelay) return;

        const isCorrectItem = Math.random() < 0.4;
        let itemText = '';
        let isCorrect = false;
        let pinyin = '';
        let explanation = '';

        if (isCorrectItem) {
            const correctAnswerText = currentQuestion.options[currentQuestion.correctAnswer];
            itemText = correctAnswerText;
            isCorrect = true;
            pinyin = currentQuestion.pinyin || '';
            explanation = currentQuestion.explanation || '';
        } else {
            const wrongOptions = currentQuestion.options.filter((_, idx) => idx !== currentQuestion.correctAnswer);
            if (wrongOptions.length > 0) {
                itemText = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            } else {
                itemText = currentQuestion.options[0];
            }
            isCorrect = false;
        }

        const yPositions = [60, 140, 190];
        const randomY = yPositions[Math.floor(Math.random() * yPositions.length)];
        const startX = beltWidth - ITEM_SIZE;

        setItems(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: itemText,
            isCorrect,
            x: new Animated.Value(startX),
            y: randomY,
            pinyin,
            explanation,
            scale: new Animated.Value(1),
            opacity: new Animated.Value(1),
            icon: getRandomIcon(),
            isAnimating: false,
        }]);
    };

    const animateItemToCustomer = (item: ConveyorItem, _isCorrect: boolean) => {
        return new Promise<void>((resolve) => {
            Animated.parallel([
                Animated.timing(item.scale, {
                    toValue: 1.5,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(item.x, {
                    toValue: 50,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back),
                }),
                Animated.timing(item.opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => resolve());
        });
    };

    const animateCustomerReaction = (isHappy: boolean) => {
        return new Promise<void>((resolve) => {
            if (isHappy) {
                Animated.sequence([
                    Animated.timing(customerAnim, {
                        toValue: 1.2,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(customerAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start(() => resolve());
            } else {
                Animated.sequence([
                    Animated.timing(customerAnim, {
                        toValue: 0.8,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(customerAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start(() => resolve());
            }
        });
    };

    const handleItemClick = async (item: ConveyorItem) => {
        if (!isGameActive || gameComplete || nextQuestionDelay || !gameActive) return;

        setNextQuestionDelay(true);

        await animateItemToCustomer(item, item.isCorrect);

        setItems(prev => prev.filter(i => i.id !== item.id));

        const updatedQuestions = [...questions];
        updatedQuestions[currentIndex] = {
            ...updatedQuestions[currentIndex],
            userAnswer: item.text,
            isAnsweredCorrectly: item.isCorrect,
            userSelectedIndex: currentQuestion.options.findIndex(opt => opt === item.text),
        };
        setQuestions(updatedQuestions);

        if (item.isCorrect) {
            // ✅ 正確 - 打擊回饋
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
            setFloatingText({ id: Date.now(), text: 'HIT!', color: '#FFD700' });

            const newCombo = combo + 1;
            const multiplier = getMultiplier(newCombo);
            const pointsEarned = Math.round(10 * multiplier); // 四捨五入取整
            let newScore = score + pointsEarned;
            // 滿分限制 100
            if (newScore > 100) newScore = 100;
            setScore(newScore);
            setCombo(newCombo);
            setMaxCombo(prev => Math.max(prev, newCombo));

            Animated.sequence([
                Animated.timing(scoreAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
                Animated.timing(scoreAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();
            Animated.sequence([
                Animated.timing(comboAnim, { toValue: 1.5, duration: 100, useNativeDriver: true }),
                Animated.timing(comboAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();

            setCustomerState('happy');
            await animateCustomerReaction(true);
            showTemporaryHint(`🎉 So delicious! +${pointsEarned} `, '#4CAF50');
        } else {
            // ❌ 錯誤 - 被打擊回饋
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            triggerScreenShake();
            setFloatingText({ id: Date.now(), text: 'OUCH!', color: '#FF4757' });

            let newScore = score - 5;
            if (newScore < 0) newScore = 0;
            setScore(newScore);
            setCombo(0);

            setCustomerState('angry');
            await animateCustomerReaction(false);
            showTemporaryHint(`😠 This is not what I want！ -5 `, '#F44336');
        }

        // 清除浮動文字
        setTimeout(() => {
            setFloatingText(null);
        }, 800);

        setTimeout(() => {
            const isLast = currentIndex + 1 >= questions.length;
            if (!isLast) {
                setCurrentIndex(prev => prev + 1);
                setItems([]);
                setCustomerState('waiting');
                setNextQuestionDelay(false);
                // 每題之間重新倒數
                startPrepSequence();
            } else {
                handleGameComplete();
            }
        }, 800);
    };

    const showTemporaryHint = (message: string, color: string) => {
        setHintText(message);
        setHintColor(color);
        setHintVisible(true);
        setTimeout(() => setHintVisible(false), 1500);
    };

    const handleGameComplete = async () => {
        setIsGameActive(false);
        setGameActive(false);
        setGameComplete(true);
        setNextQuestionDelay(false);

        // 保存分數到伺服器 (滿分100)
        await saveScore(score);

        const totalQuestions = questions.length;
        const correctCount = questions.filter(q => q.isAnsweredCorrectly).length;
        const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

        // 根據滿分100調整評價反饋
        let feedback = '';
        if (score >= 90) {
            feedback = `🍽️ Five-star chef! You did it ${correctCount}/${totalQuestions} Dish!\n🔥 Highest Combo: ${maxCombo} | 🎯 準確率: ${Math.round(accuracy)}%\n Amazing! Welcome to visit again next time!🌟`;
        } else if (score >= 70) {
            feedback = `🍲 Excellent chef! You did it ${correctCount}/${totalQuestions} Dish!\n🔥 Highest Combo: ${maxCombo} | 🎯 準確率: ${Math.round(accuracy)}%\n With a bit more practice, you can become a master！💪`;
        } else if (score >= 50) {
            feedback = `🥗 Keep it up! You did it ${correctCount}/${totalQuestions} Dish\n🔥 Highest Combo: ${maxCombo}\n More correct ingredients will make customers happier！✨`;
        } else {
            feedback = `🍜 Go for it, little chef! You did it. ${correctCount}/${totalQuestions} Dish\n Try clicking on the ingredients that the customer wants to eat！\n It will be better next time！🎈`;
        }

        setAiFeedback(feedback);
        setGameState('result');
    };

    const loadQuestions = async (selectedDifficulty: 'beginner' | 'advanced') => {
        setLoading(true);
        try {
            const newQuestions = await ChineseAIService.generateQuestions({
                difficulty: selectedDifficulty,
                count: 8
            });
            const extendedQuestions: ExtendedQuestion[] = newQuestions.map(q => ({
                ...q,
                userAnswer: '',
                isAnsweredCorrectly: false,
            }));
            setQuestions(extendedQuestions);
            resetGame();
            setGameState('playing');
            setIsGameActive(true);
            // 開始倒數
            startPrepSequence();
        } catch (error) {
            console.error('Failed to load questions:', error);
            Alert.alert('錯誤', '無法載入菜單，請稍後再試');
            setGameState('difficulty_select');
        } finally {
            setLoading(false);
        }
    };

    const resetGame = () => {
        setCurrentIndex(0);
        setScore(0);
        setAiFeedback('');
        setItems([]);
        setCombo(0);
        setMaxCombo(0);
        setGameComplete(false);
        setIsGameActive(false);
        setGameActive(false);
        setCustomerState('waiting');
        setNextQuestionDelay(false);
        setPrepText(null);
        setFloatingText(null);
    };

    const handleSelectDifficulty = (level: 'beginner' | 'advanced') => {
        setDifficulty(level);
        loadQuestions(level);
    };

    const handleRestart = async () => {
        // 如果遊戲正在進行中且有分數，保存當前分數
        if (gameState === 'playing' && score > 0 && difficulty) {
            await saveScore(score);
        }
        setDifficulty(null);
        setGameState('difficulty_select');
        resetGame();
        setQuestions([]);
        setIsGameActive(false);
        setGameActive(false);
    };

    const handleTryAgain = () => {
        if (difficulty) {
            setScore(0);
            setCombo(0);
            setMaxCombo(0);
            loadQuestions(difficulty);
        }
    };

    const handleBackToGames = () => router.back();

    const calculateScoreStats = () => {
        const totalQuestions = questions.length;
        const correctCount = questions.filter(q => q.isAnsweredCorrectly).length;
        const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        return { totalQuestions, correctCount, accuracy };
    };

    const getCustomerEmoji = () => {
        switch (customerState) {
            case 'happy': return '😋';
            case 'angry': return '😠';
            default: return '🧑‍🍳';
        }
    };

    const getCustomerMessage = () => {
        switch (customerState) {
            case 'happy': return 'It\'s so delicious!';
            case 'angry': return 'This is not what I want...';
            default: return 'I want to eat...';
        }
    };

    const renderPlaying = () => (
        <View style={styles.gameContainer}>
            <StatusBar barStyle="dark-content" />

            <Animated.View style={{ flex: 1, transform: [{ translateX: screenShake }] }}>
                <View style={styles.gameHeader}>
                    <TouchableOpacity onPress={handleRestart} style={styles.exitButton}>
                        <Text style={styles.exitButtonText}>← Leave</Text>
                    </TouchableOpacity>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Star size={18} color="#FFD966" />
                            <Animated.Text style={[styles.statValue, { transform: [{ scale: scoreAnim }] }]}>
                                {score}/100
                            </Animated.Text>
                        </View>
                        <View style={styles.statBox}>
                            <Sparkles size={18} color="#FF6B6B" />
                            <Animated.Text style={[styles.statValue, styles.comboText, { transform: [{ scale: comboAnim }] }]}>
                                x{combo}
                            </Animated.Text>
                        </View>
                        <View style={styles.statBox}>
                            <Heart size={18} color="#FF6B6B" />
                            <Text style={styles.statValue}>
                                {questions.filter(q => q.isAnsweredCorrectly).length}/{questions.length}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.restaurantArea}>
                    <Animated.View style={[styles.customerArea, { transform: [{ scale: customerAnim }] }]}>
                        <View style={styles.customerCard}>
                            <View style={styles.customerAvatar}>
                                <Text style={styles.customerEmoji}>{getCustomerEmoji()}</Text>
                            </View>
                            <View style={styles.speechBubble}>
                                <Text style={styles.speechText}>{getCustomerMessage()}</Text>
                                {currentQuestion && (
                                    <Text style={styles.dishName}>{currentQuestion.question}</Text>
                                )}
                                {currentQuestion?.pinyin && (
                                    <Text style={styles.dishPinyin}>{currentQuestion.pinyin}</Text>
                                )}
                            </View>
                        </View>
                    </Animated.View>

                    <View style={styles.conveyorArea}>
                        <View
                            style={styles.conveyorBelt}
                            onLayout={(e) => {
                                const { width } = e.nativeEvent.layout;
                                if (width > 0) {
                                    setBeltWidth(width);
                                }
                            }}
                        >
                            {/* 倒數覆蓋層 */}
                            {prepText && (
                                <Animated.View style={[styles.prepOverlay, { transform: [{ scale: prepScale }] }]}>
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

                            <Animated.View
                                style={[
                                    styles.conveyorStripes,
                                    {
                                        transform: [{
                                            translateX: conveyorAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, -20]
                                            })
                                        }]
                                    }
                                ]}
                            >
                                {[...Array(20)].map((_, i) => (
                                    <View key={i} style={styles.conveyorStripe} />
                                ))}
                            </Animated.View>

                            {items.map(item => (
                                <Animated.View
                                    key={item.id}
                                    style={[
                                        styles.conveyorItem,
                                        {
                                            transform: [
                                                { translateX: item.x },
                                                { scale: item.scale }
                                            ],
                                            opacity: item.opacity,
                                            top: item.y,
                                        }
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[styles.foodButton, !gameActive && styles.disabledFoodButton]}
                                        onPress={() => handleItemClick(item)}
                                        activeOpacity={0.7}
                                        disabled={!gameActive}
                                    >
                                        <Text style={styles.foodIcon}>{item.icon}</Text>
                                        <Text style={[
                                            styles.foodText,
                                            item.isCorrect ? styles.correctText : styles.wrongText
                                        ]}>
                                            {item.text}
                                        </Text>
                                        {item.isCorrect && item.pinyin && (
                                            <Text style={styles.foodPinyin}>{item.pinyin}</Text>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}

                            {items.length === 0 && isGameActive && !gameComplete && !nextQuestionDelay && gameActive && (
                                <View style={styles.conveyorHint}>
                                    <Text style={styles.conveyorHintText}>✨ The ingredients come out from here ✨</Text>
                                    <Text style={[styles.conveyorHintText, { fontSize: 10, marginTop: 4 }]}>→ Move to the left</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.conveyorLeftWheel} />
                        <View style={styles.conveyorRightWheel} />
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                        </View>
                        <Text style={styles.multiplierText}>
                            {combo >= 3 && `🔥 ${combo} Combo! ${getMultiplier(combo)}x score`}
                        </Text>
                    </View>
                </View>

                <View style={styles.controlPanel}>
                    <TouchableOpacity style={styles.resetGameBtn} onPress={resetGame}>
                        <Text style={styles.resetGameBtnText}>⟳ Start over</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.completeGameBtn} onPress={handleGameComplete}>
                        <Text style={styles.completeGameBtnText}>✓ Closed for business</Text>
                    </TouchableOpacity>
                </View>

                {hintVisible && (
                    <Animated.View style={[styles.floatingHint, { backgroundColor: hintColor }]}>
                        <Text style={styles.floatingHintText}>{hintText}</Text>
                    </Animated.View>
                )}
            </Animated.View>
        </View>
    );

    const renderDifficultySelect = () => (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <Utensils size={60} color="#FFA07A" style={{ marginBottom: 20 }} />
                    <Text style={styles.mainTitle}>🍜 Restaurant Battle</Text>
                    <Text style={styles.subTitle}>
                        What does the customer want to eat? Quickly take the correct ingredients from the conveyor belt to them! Total score: 100 points!
                    </Text>
                </View>
                <View style={styles.menuGrid}>
                    {difficultyOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.diffCard, { backgroundColor: option.bgColor, borderColor: option.color }]}
                            onPress={() => handleSelectDifficulty(option.level)}
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
                                <View style={styles.startButtonContainer}>
                                    <View style={[styles.startButton, { backgroundColor: option.color }]}>
                                        <Text style={styles.startButtonText}>Start taking orders 🍽️</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.backLink} onPress={handleBackToGames}>
                    <Text style={styles.backLinkText}>← Return to game list</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderResult = () => {
        const { totalQuestions, correctCount, accuracy } = calculateScoreStats();
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.resultHeader}>
                    <TouchableOpacity onPress={handleRestart} style={styles.resultBackButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.resultHeaderTitle}>Business Closed</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={styles.resultContainer}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>🍽️ Today's performance 🍽️</Text>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scorePercentage}>{score}</Text>
                            <Text style={styles.scoreLabel}>Total Score (Full Score 100)</Text>
                        </View>
                        {isSaving && (
                            <View style={styles.savingIndicator}>
                                <ActivityIndicator size="small" color="#4CAF50" />
                                <Text style={styles.savingText}>Synchronizing scores...</Text>
                            </View>
                        )}
                        <View style={styles.scoreDetails}>
                            <Text style={styles.scoreDetailText}>✅ Serve the correct order: {correctCount}/{totalQuestions}</Text>
                            <Text style={styles.scoreDetailText}>🔥 Highest Combo: x{maxCombo}</Text>
                            <View style={styles.percentageBadge}>
                                <Text style={styles.percentageText}>🎯 Customer satisfaction: {accuracy}%</Text>
                            </View>
                        </View>
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryTitle}>📝 Order History：</Text>
                            {questions.map((q, index) => (
                                <View key={index} style={styles.summaryItem}>
                                    <Text style={styles.summaryNumber}>{index + 1}.</Text>
                                    <Text style={styles.summaryAnswer} numberOfLines={1}>
                                        {q.userAnswer || 'Meal not served'}
                                    </Text>
                                    <Text style={[styles.summaryScore, q.isAnsweredCorrectly ? styles.correctScore : styles.incorrectScore]}>
                                        {q.isAnsweredCorrectly ? '✓' : '✗'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.feedbackBox}>
                            <Text style={styles.feedbackTitle}>💡 Chef's Review</Text>
                            <Text style={styles.feedbackText}>{aiFeedback}</Text>
                        </View>
                        <View style={styles.resultButtonContainer}>
                            <TouchableOpacity style={[styles.resultButton, styles.tryAgainResultButton]} onPress={handleTryAgain}>
                                <Text style={styles.resultButtonText}>🔄 Play again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.resultButton, styles.newDifficultyButton]} onPress={handleRestart}>
                                <Text style={styles.resultButtonText}>🎯 Select Difficulty</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.resultButton, styles.backToGamesResultButton]} onPress={handleBackToGames}>
                                <Text style={styles.resultButtonText}>🎮 Return to game</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    };

    const difficultyOptions = [
        {
            id: 'beginner',
            level: 'beginner' as const,
            title: 'Intern chef',
            badgeText: 'Easy to serve',
            description: 'The conveyor belt is slower, with simple dishes, suitable for beginner little chefs.',
            icon: '👨‍🍳',
            color: '#FFA07A',
            bgColor: '#FFF3E0',
        },
        {
            id: 'advanced',
            level: 'advanced' as const,
            title: 'Master Chef',
            badgeText: 'Expert Challenge',
            description: 'The conveyor belt is faster, with complex dishes, testing your reaction speed.',
            icon: '👩‍🍳',
            color: '#E67E22',
            bgColor: '#FFE4C4',
        }
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFA07A" />
                <Text style={styles.loadingText}>Menu in preparation...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {gameState === 'difficulty_select' && renderDifficultySelect()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && renderResult()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCE4B2',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFA07A',
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
        flexWrap: 'wrap',
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
        marginBottom: 12,
        lineHeight: 20,
    },
    startButtonContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    startButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 120,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    backLink: {
        marginTop: 30,
        alignItems: 'center',
        marginBottom: 40,
    },
    backLinkText: {
        fontSize: 16,
        color: '#FFA07A',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FCE4B2',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    gameContainer: {
        flex: 1,
        backgroundColor: '#FCE4B2',
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFB347',
        borderBottomWidth: 2,
        borderBottomColor: '#FFD966',
    },
    exitButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    exitButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    comboText: {
        color: '#FFD700',
    },
    restaurantArea: {
        flex: 1,
        padding: 15,
    },
    customerArea: {
        marginBottom: 20,
    },
    customerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    customerAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFE0B5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    customerEmoji: {
        fontSize: 44,
    },
    speechBubble: {
        flex: 1,
        backgroundColor: '#FFF9C4',
        borderRadius: 25,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FFB347',
    },
    speechText: {
        fontSize: 14,
        color: '#E67E22',
        fontWeight: 'bold',
    },
    dishName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 4,
    },
    dishPinyin: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    conveyorArea: {
        height: CONVEYOR_HEIGHT,
        position: 'relative',
        marginVertical: 10,
        width: '100%',
    },
    conveyorBelt: {
        flex: 1,
        backgroundColor: '#C0A080',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#8B5A2B',
        overflow: 'hidden',
        position: 'relative',
    },
    conveyorStripes: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    conveyorStripe: {
        width: 15,
        height: CONVEYOR_HEIGHT,
        backgroundColor: '#DAA520',
        marginHorizontal: 5,
        opacity: 0.5,
    },
    conveyorItem: {
        position: 'absolute',
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        zIndex: 10,
        left: 0,
    },
    foodButton: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFB347',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledFoodButton: {
        opacity: 0.6,
    },
    foodIcon: {
        fontSize: 32,
        marginBottom: 4,
    },
    foodText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    correctText: {
        color: '#4CAF50',
    },
    wrongText: {
        color: '#F44336',
    },
    foodPinyin: {
        fontSize: 9,
        color: '#666',
        marginTop: 2,
    },
    conveyorHint: {
        position: 'absolute',
        right: 20,
        top: CONVEYOR_HEIGHT / 2 - 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    conveyorHintText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    conveyorLeftWheel: {
        position: 'absolute',
        left: -15,
        top: CONVEYOR_HEIGHT / 2 - 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8B5A2B',
        borderWidth: 2,
        borderColor: '#5D3A1A',
    },
    conveyorRightWheel: {
        position: 'absolute',
        right: -15,
        top: CONVEYOR_HEIGHT / 2 - 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8B5A2B',
        borderWidth: 2,
        borderColor: '#5D3A1A',
    },
    progressContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    multiplierText: {
        fontSize: 12,
        color: '#FF6B6B',
        marginTop: 8,
        fontWeight: 'bold',
    },
    controlPanel: {
        backgroundColor: '#FFB347',
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 2,
        borderTopColor: '#FFD966',
    },
    resetGameBtn: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    resetGameBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    completeGameBtn: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    completeGameBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    floatingHint: {
        position: 'absolute',
        top: '40%',
        left: '10%',
        right: '10%',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        zIndex: 100,
    },
    floatingHintText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    // 倒數覆蓋層樣式
    prepOverlay: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 200,
        backgroundColor: 'transparent',
    },
    prepText: {
        fontSize: 56,
        fontWeight: '900',
        color: '#FF6B6B',
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
    // 浮動文字層樣式
    floatingLayer: {
        position: 'absolute',
        top: '20%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 150,
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
    // 結果頁面樣式
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    resultBackButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultHeaderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    resultContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FCE4B2',
        minHeight: '100%',
    },
    resultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFA07A',
        marginBottom: 30,
        textAlign: 'center',
    },
    scoreCircle: {
        alignItems: 'center',
        marginBottom: 30,
    },
    scorePercentage: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#FFA07A',
    },
    scoreLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
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
    scoreDetails: {
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
    },
    scoreDetailText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    percentageBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
    },
    percentageText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    summaryContainer: {
        width: '100%',
        marginBottom: 30,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    summaryNumber: {
        width: 35,
        fontSize: 14,
        color: '#666',
    },
    summaryAnswer: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    summaryScore: {
        width: 30,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
    },
    correctScore: {
        color: '#4CAF50',
    },
    incorrectScore: {
        color: '#f44336',
    },
    feedbackBox: {
        width: '100%',
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: '#FFA07A',
    },
    feedbackTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    feedbackText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    resultButtonContainer: {
        width: '100%',
        gap: 12,
    },
    resultButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tryAgainResultButton: {
        backgroundColor: '#FFA07A',
    },
    newDifficultyButton: {
        backgroundColor: '#E67E22',
    },
    backToGamesResultButton: {
        backgroundColor: '#4CAF50',
    },
    resultButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ChineseRestaurantGame;