import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { ArrowLeft, Trophy, Clock, Zap, Heart, CheckCircle2, XCircle, Brain, Timer } from 'lucide-react-native';
import { useRouter, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withSpring, runOnJS
} from 'react-native-reanimated';
import axios from 'axios';
import { useAuth } from "@/src/auth/AuthContext";

// 格式化時間為 mm:ss
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- 💥 浮動文字元件 (HIT / OUCH) ---
const FloatingText = ({ text, color, onComplete }: { text: string, color: string, onComplete: () => void }) => {
    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withTiming(-100, { duration: 800 });
        opacity.value = withTiming(0, { duration: 800 }, () => runOnJS(onComplete)());
    }, []);
    return (
        <Animated.View style={[styles.floatingLayer, useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }))]}>
            <Text style={[styles.hitText, { color }]}>{text}</Text>
        </Animated.View>
    );
};

// --- 難度選項配置 ---
const difficultyOptions = [
    {
        id: 'easy',
        level: 'easy' as const,
        title: 'Easy',
        badgeText: 'Gentle Start',
        description: 'Basic addition & subtraction, numbers within 20, gentle pace',
        icon: '☁️',
        color: '#22C55E',
        bgColor: '#F0FDF4',
        features: []
    },
    {
        id: 'medium',
        level: 'medium' as const,
        title: 'Medium',
        badgeText: 'Challenge',
        description: 'Mixed operations, numbers within 100, time pressure',
        icon: '🌵',
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        features: []
    },
    {
        id: 'hard',
        level: 'hard' as const,
        title: 'Hard',
        badgeText: 'Master',
        description: 'Complex equations, multiplication & division, fast-paced battle',
        icon: '🌋',
        color: '#EF4444',
        bgColor: '#FEF2F2',
        features: []
    }
];

const GAME_SCENES = {
    easy: { bg: ['#F0FDF4', '#DCFCE7'], boss: '☁️', color: '#22C55E' },
    medium: { bg: ['#FFFBEB', '#FEF3C7'], boss: '🌵', color: '#F59E0B' },
    hard: { bg: ['#FEF2F2', '#FEE2E2'], boss: '🌋', color: '#EF4444' }
} as const;

export default function CalculationGame() {
    const router = useRouter();
    const navigation = useNavigation();
    const { token } = useAuth();

    // 完全隐藏系统导航栏（包括返回按钮）
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // 遊戲狀態
    const [gameStarted, setGameStarted] = useState(false);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameActive, setGameActive] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // 倒數計時狀態
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useSharedValue(0);

    // 計時器狀態
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerIntervalRef = useRef<number | null>(null);
    const [totalGameTime, setTotalGameTime] = useState(0);

    // 戰鬥數值
    const [bossHP, setBossHP] = useState(100);
    const [playerHP, setPlayerHP] = useState(100);
    const [combo, setCombo] = useState(0);
    const [userAnswers, setUserAnswers] = useState<any[]>([]);
    const [floatingText, setFloatingText] = useState<{ id: number, text: string, color: string } | null>(null);

    // 動畫 Shared Values
    const bossY = useSharedValue(0);
    const bossScale = useSharedValue(1);
    const screenShake = useSharedValue(0);

    const currentScene = useMemo(() => difficulty ? GAME_SCENES[difficulty] : GAME_SCENES.easy, [difficulty]);

    // 啟動計時器
    const startTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setElapsedTime(0);
        timerIntervalRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    // 停止計時器並記錄時間
    const stopTimerAndRecord = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setTotalGameTime(elapsedTime);
    };

    // 重置計時器
    const resetTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setElapsedTime(0);
    };

    useEffect(() => {
        bossY.value = withRepeat(withTiming(-10, { duration: 2000 }), -1, true);
    }, []);

    const animatedBossStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bossY.value }, { scale: bossScale.value }] }));
    const animatedScreenStyle = useAnimatedStyle(() => ({ transform: [{ translateX: screenShake.value }] }));
    const animatedPrepStyle = useAnimatedStyle(() => ({ transform: [{ scale: prepScale.value }], opacity: withTiming(prepText ? 1 : 0) }));

    const fetchQuestions = async (selectedDiff: 'easy' | 'medium' | 'hard') => {
        setLoading(true);
        setDifficulty(selectedDiff);
        resetTimer();
        try {
            const res = await axios.get(`http://localhost:8000/api/math/batch_generate?difficulty=${selectedDiff}&count=10`);
            setQuestions(res.data);
            setBossHP(100);
            setPlayerHP(100);
            setScore(0);
            setCombo(0);
            setCurrentIndex(0);
            setUserAnswers([]);
            setupOptions(res.data[0]);

            setLoading(false);
            setGameStarted(true);
            startPrepSequence();
        } catch (e) {
            Alert.alert("Error", "Backend offline!");
            setLoading(false);
        }
    };

    const startPrepSequence = () => {
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
            startTimer(); // 準備動畫結束後啟動計時器
        }, 1600);
    };

    const setupOptions = (qData: any) => {
        if (!qData) return;
        const correct = qData.answer;
        const opts = new Set<string>([correct]);
        while (opts.size < 4) {
            const fake = (parseInt(correct) + (Math.floor(Math.random() * 20) - 10)).toString();
            if (parseInt(fake) >= 0 && fake !== correct) opts.add(fake);
        }
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    };

    const handleAnswer = (selected: string) => {
        if (!gameActive || isSaving) return;
        const currentQ = questions[currentIndex];
        const isCorrect = selected === currentQ.answer;

        setUserAnswers(prev => [...prev, { ...currentQ, userChoice: selected, isCorrect }]);

        if (isCorrect) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            bossScale.value = withSequence(withTiming(1.3, { duration: 100 }), withSpring(1));
            setFloatingText({ id: Date.now(), text: 'HIT!', color: '#FFD700' });
            setBossHP(prev => Math.max(0, prev - 15));
            setScore(prev => prev + 10 + combo);
            setCombo(prev => prev + 1);
            setTimeout(nextQuestion, 500);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            screenShake.value = withSequence(
                withTiming(15, { duration: 50 }), withTiming(-15, { duration: 50 }),
                withTiming(15, { duration: 50 }), withTiming(0, { duration: 50 })
            );
            setFloatingText({ id: Date.now(), text: 'OUCH!', color: '#FF4757' });
            setPlayerHP(prev => {
                const newHP = Math.max(0, prev - 20);
                if (newHP <= 0) {
                    setGameActive(false);
                    setTimeout(() => {
                        stopTimerAndRecord();
                        setGameEnded(true);
                    }, 600);
                }
                return newHP;
            });
            setCombo(0);
            setTimeout(nextQuestion, 500);
        }
    };

    const nextQuestion = () => {
        if (currentIndex + 1 < 10 && playerHP > 0) {
            setupOptions(questions[currentIndex + 1]);
            setCurrentIndex(prev => prev + 1);
        } else {
            stopTimerAndRecord();
            setGameActive(false);
            setGameEnded(true);
        }
    };

    const saveScore = async () => {
        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', { gameName: "Speed Calculation", scores: score, difficulty }, { headers: { 'Authorization': `Bearer ${token}` } });
            router.push('/rank/leaderboard');
        } catch (e) { router.push('/'); }
    };

    const handleBackToGames = () => {
        resetTimer();
        if (router.canGoBack()) {
            router.back();
        }
    };

    const handleRestart = () => {
        resetTimer();
        setGameStarted(false);
        setGameEnded(false);
        setDifficulty(null);
        setScore(0);
        setUserAnswers([]);
        setTotalGameTime(0);
        setElapsedTime(0);
    };

    // --- 難度選擇頁面渲染 ---
    const renderDifficultySelect = () => (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 頂部標題區域 */}
                <View style={styles.headerSection}>
                    <Brain size={60} color="#F59E0B" style={{ marginBottom: 20 }} />
                    <Text style={styles.mainTitle}>Math Boss Battle</Text>
                    <Text style={styles.subTitle}>
                        Defeat the boss by solving math problems correctly!
                    </Text>
                </View>

                {/* 難度選擇卡片列表 */}
                <View style={styles.menuGrid}>
                    {difficultyOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.diffCard,
                                { backgroundColor: option.bgColor, borderColor: option.color }
                            ]}
                            onPress={() => fetchQuestions(option.level)}
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
                                        <Text style={styles.startButtonText}>Start Battle →</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.backLink}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backLinkText}>← Back to Game Library</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );

    // --- 結果頁面渲染（新增總時間顯示）---
    const renderResult = () => (
        <SafeAreaView style={styles.resultContainer}>
            <Text style={styles.resultTitle}>{playerHP > 0 ? "🏆 VICTORY!" : "💀 DEFEATED"}</Text>
            <Text style={styles.resultScore}>Final Score: {score}</Text>

            {/* 顯示總花費時間 */}
            <View style={styles.totalTimeContainer}>
                <Timer size={24} color="#4b6cb7" />
                <Text style={styles.totalTimeText}>Total Time: {formatTime(totalGameTime)}</Text>
            </View>

            <ScrollView style={{ marginVertical: 20 }}>
                {userAnswers.map((item, i) => (
                    <View key={i} style={[styles.reviewCard, item.isCorrect ? styles.cardCorrect : styles.cardWrong]}>
                        <Text style={styles.reviewText}>{item.question} = {item.answer}</Text>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>Your answer: {item.userChoice}</Text>
                    </View>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveScore}>
                <Text style={styles.saveBtnText}>BACK TO LOBBY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleBackToGames}>
                <Text style={styles.saveBtnText}>BACK TO GAME LIST</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#22C55E' }]} onPress={handleRestart}>
                <Text style={styles.saveBtnText}>RESTART BATTLE</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

    // --- 遊戲進行中渲染（在題目右邊增加計時器）---
    const renderPlaying = () => (
        <LinearGradient colors={currentScene.bg} style={{ flex: 1 }}>
            <Animated.View style={[{ flex: 1 }, animatedScreenStyle]}>
                <SafeAreaView style={styles.gameContainer}>
                    <View style={styles.hpHeader}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.hpBarBg}>
                                <View style={[styles.hpBarFill, { width: `${playerHP}%`, backgroundColor: '#FF4757' }]} />
                            </View>
                            <Text style={styles.hpLabel}>PLAYER: {playerHP}</Text>
                        </View>
                        <Heart color="#FF4757" fill="#FF4757" size={20} />
                        <View style={{ flex: 1 }}>
                            <View style={styles.hpBarBg}>
                                <View style={[styles.hpBarFill, { width: `${bossHP}%`, backgroundColor: currentScene.color }]} />
                            </View>
                            <Text style={[styles.hpLabel, { textAlign: 'right' }]}>BOSS: {bossHP}</Text>
                        </View>
                    </View>

                    <View style={styles.battleArena}>
                        {/* 題目卡片 + 計時器並排 */}
                        <View style={styles.questionHeader}>
                            <View style={styles.questionCard}>
                                <Text style={[styles.questionMain, !gameActive && { color: '#CBD5E1' }]}>
                                    {gameActive ? questions[currentIndex]?.question : "---"}
                                </Text>
                            </View>
                            {/* 計時器放在題目右邊 */}
                            <View style={styles.timerCard}>
                                <Timer size={28} color={currentScene.color} />
                                <Text style={[styles.timerText, { color: currentScene.color }]}>{formatTime(elapsedTime)}</Text>
                            </View>
                        </View>

                        <View style={styles.bossStage}>
                            {prepText && (
                                <Animated.View style={[styles.prepOverlay, animatedPrepStyle]}>
                                    <Text style={styles.prepText}>{prepText}</Text>
                                </Animated.View>
                            )}
                            {floatingText && <FloatingText key={floatingText.id} text={floatingText.text} color={floatingText.color} onComplete={() => setFloatingText(null)} />}
                            <Animated.Text style={[styles.bossEmoji, animatedBossStyle]}>{currentScene.boss}</Animated.Text>
                        </View>

                        <View style={[styles.gridContainer, !gameActive && { opacity: 0.3 }]}>
                            {options.map((opt, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.gridBtn}
                                    onPress={() => handleAnswer(opt)}
                                    disabled={!gameActive}
                                >
                                    <Text style={styles.gridBtnText}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </LinearGradient>
    );

    if (loading) return (
        <SafeAreaView style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>PREPARING BATTLE...</Text>
        </SafeAreaView>
    );

    if (!gameStarted) return renderDifficultySelect();
    if (gameEnded) return renderResult();
    return renderPlaying();
}

const styles = StyleSheet.create({
    // 容器
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    gameContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },

    // 難度選擇頁面樣式
    headerSection: {
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: '#fff',
        marginBottom: 20,
        borderRadius: 24,
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
        backgroundColor: '#fff',
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
        color: '#F59E0B',
        fontWeight: '600',
    },

    // 加載樣式
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    loadingText: {
        marginTop: 15,
        fontWeight: '800',
        color: '#64748B',
    },

    // 遊戲進行中樣式
    hpHeader: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        gap: 12,
    },
    hpBarBg: {
        height: 12,
        backgroundColor: '#E2E8F0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    hpBarFill: {
        height: '100%',
    },
    hpLabel: {
        fontSize: 11,
        fontWeight: '900',
        marginTop: 4,
        color: '#475569',
    },
    battleArena: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    questionCard: {
        flex: 3,
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    questionMain: {
        fontSize: 56,
        fontWeight: '900',
        color: '#1E293B',
    },
    timerCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        gap: 8,
    },
    timerText: {
        fontSize: 24,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    bossStage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    bossEmoji: {
        fontSize: 130,
    },
    prepOverlay: {
        position: 'absolute',
        zIndex: 100,
        alignItems: 'center',
    },
    prepText: {
        fontSize: 80,
        fontWeight: '900',
        color: '#1E293B',
        fontStyle: 'italic',
    },
    floatingLayer: {
        position: 'absolute',
        zIndex: 50,
    },
    hitText: {
        fontSize: 45,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    gridBtn: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 22,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 4,
    },
    gridBtnText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#334155',
    },

    // 結果頁面樣式
    resultContainer: {
        flex: 1,
        padding: 25,
        backgroundColor: '#F8FAFC',
    },
    resultTitle: {
        fontSize: 34,
        fontWeight: '900',
        textAlign: 'center',
        color: '#1E293B',
    },
    resultScore: {
        fontSize: 22,
        textAlign: 'center',
        color: '#F59E0B',
        fontWeight: 'bold',
        marginTop: 10,
    },
    totalTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 15,
        padding: 12,
        backgroundColor: '#E8F4FD',
        borderRadius: 20,
    },
    totalTimeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4b6cb7',
    },
    reviewCard: {
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    reviewText: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardCorrect: {
        borderLeftWidth: 6,
        borderLeftColor: '#22C55E',
    },
    cardWrong: {
        borderLeftWidth: 6,
        borderLeftColor: '#EF4444',
    },
    saveBtn: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 18,
    },
});