import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { ArrowLeft, Trophy, Clock, Zap, Heart, CheckCircle2, XCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withSpring, runOnJS
} from 'react-native-reanimated';
import axios from 'axios';
import { useAuth } from "@/src/auth/AuthContext";

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

export default function CalculationGame() {
    const router = useRouter();
    const { token } = useAuth();

    // 遊戲狀態
    const [gameStarted, setGameStarted] = useState(false);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameActive, setGameActive] = useState(false); // 控制是否可以答題
    const [gameEnded, setGameEnded] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // 倒數計時狀態
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useSharedValue(0);

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

    useEffect(() => {
        bossY.value = withRepeat(withTiming(-10, { duration: 2000 }), -1, true);
    }, []);

    const animatedBossStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bossY.value }, { scale: bossScale.value }] }));
    const animatedScreenStyle = useAnimatedStyle(() => ({ transform: [{ translateX: screenShake.value }] }));
    const animatedPrepStyle = useAnimatedStyle(() => ({ transform: [{ scale: prepScale.value }], opacity: withTiming(prepText ? 1 : 0) }));

    const fetchQuestions = async (selectedDiff: 'easy' | 'medium' | 'hard') => {
        setLoading(true);
        setDifficulty(selectedDiff);
        try {
            // 模擬或調用後端 API 獲取 10 題
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
            setGameStarted(true); // 切換到遊戲場景
            startPrepSequence(); // 開始 Ready Go
        } catch (e) {
            Alert.alert("Error", "Backend offline!");
            setLoading(false);
        }
    };

    const startPrepSequence = () => {
        // Ready...
        setTimeout(() => {
            setPrepText('READY');
            prepScale.value = 0;
            prepScale.value = withSpring(1.2);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 100);

        // Go!
        setTimeout(() => {
            setPrepText('GO!');
            prepScale.value = 0;
            prepScale.value = withSpring(1.5);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);

        // Start Game
        setTimeout(() => {
            setPrepText(null);
            setGameActive(true); // 正式解鎖按鈕和題目
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
                if (newHP <= 0) { setGameActive(false); setTimeout(() => setGameEnded(true), 600); }
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
            setGameActive(false);
            setGameEnded(true);
        }
    };

    const saveScore = async () => {
        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', { gameName: "Math Boss", scores: score, difficulty }, { headers: { 'Authorization': `Bearer ${token}` } });
            router.push('/rank/leaderboard');
        } catch (e) { router.push('/'); }
    };

    // --- 渲染邏輯 ---

    if (loading) return (
        <SafeAreaView style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF9800" />
            <Text style={styles.loadingText}>PREPARING BATTLE...</Text>
        </SafeAreaView>
    );

    if (!gameStarted) return (
        <SafeAreaView style={styles.centerContainer}>
            <Zap size={60} color="#FF9800" fill="#FF9800" />
            <Text style={styles.menuTitle}>Math Boss Battle</Text>
            <View style={styles.menuList}>
                {(['easy', 'medium', 'hard'] as const).map(d => (
                    <TouchableOpacity key={d} style={[styles.menuBtn, {borderColor: GAME_SCENES[d].color}]} onPress={() => fetchQuestions(d)}>
                        <Text style={[styles.menuBtnText, {color: GAME_SCENES[d].color}]}>{d.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );

    if (gameEnded) return (
        <SafeAreaView style={styles.resultContainer}>
            <Text style={styles.resultTitle}>{playerHP > 0 ? "🏆 VICTORY!" : "💀 DEFEATED"}</Text>
            <Text style={styles.resultScore}>Final Score: {score}</Text>
            <ScrollView style={{ marginVertical: 20 }}>
                {userAnswers.map((item, i) => (
                    <View key={i} style={[styles.reviewCard, item.isCorrect ? styles.cardCorrect : styles.cardWrong]}>
                        <Text style={styles.reviewText}>{item.question} = {item.answer}</Text>
                        <Text style={{fontSize: 12, color: '#64748B'}}>Your answer: {item.userChoice}</Text>
                    </View>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveScore}><Text style={styles.saveBtnText}>BACK TO LOBBY</Text></TouchableOpacity>
        </SafeAreaView>
    );

    return (
        <LinearGradient colors={currentScene.bg} style={{ flex: 1 }}>
            <Animated.View style={[{ flex: 1 }, animatedScreenStyle]}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.hpHeader}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.hpBarBg}><View style={[styles.hpBarFill, { width: `${playerHP}%`, backgroundColor: '#FF4757' }]} /></View>
                            <Text style={styles.hpLabel}>PLAYER: {playerHP}</Text>
                        </View>
                        <Heart color="#FF4757" fill="#FF4757" size={20} />
                        <View style={{ flex: 1 }}>
                            <View style={styles.hpBarBg}><View style={[styles.hpBarFill, { width: `${bossHP}%`, backgroundColor: currentScene.color }]} /></View>
                            <Text style={[styles.hpLabel, { textAlign: 'right' }]}>BOSS: {bossHP}</Text>
                        </View>
                    </View>

                    <View style={styles.battleArena}>
                        <View style={styles.questionCard}>
                            <Text style={[styles.questionMain, !gameActive && { color: '#CBD5E1' }]}>
                                {gameActive ? questions[currentIndex]?.question : "---"}
                            </Text>
                        </View>

                        <View style={styles.bossStage}>
                            {/* Ready Go 文字層 */}
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
}

const GAME_SCENES = {
    easy: { bg: ['#F0FDF4', '#DCFCE7'], boss: '☁️', color: '#22C55E' },
    medium: { bg: ['#FFFBEB', '#FEF3C7'], boss: '🌵', color: '#F59E0B' },
    hard: { bg: ['#FEF2F2', '#FEE2E2'], boss: '🌋', color: '#EF4444' }
} as const; // ✨ 加上這一行，TS 就會識別為特定的 Tuple 類型

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
    loadingText: { marginTop: 15, fontWeight: '800', color: '#64748B' },
    menuTitle: { fontSize: 26, fontWeight: '900', marginBottom: 25, color: '#1E293B' },
    menuList: { width: '100%', gap: 12 },
    menuBtn: { padding: 18, borderRadius: 15, borderWidth: 3, alignItems: 'center', backgroundColor: '#fff' },
    menuBtnText: { fontWeight: '900', fontSize: 18 },
    hpHeader: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 12 },
    hpBarBg: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden' },
    hpBarFill: { height: '100%' },
    hpLabel: { fontSize: 11, fontWeight: '900', marginTop: 4, color: '#475569' },
    battleArena: { flex: 1, padding: 20, justifyContent: 'space-between' },
    questionCard: { backgroundColor: '#fff', padding: 30, borderRadius: 25, alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    questionMain: { fontSize: 56, fontWeight: '900', color: '#1E293B' },
    bossStage: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    bossEmoji: { fontSize: 130 },
    prepOverlay: { position: 'absolute', zIndex: 100, alignItems: 'center' },
    prepText: { fontSize: 80, fontWeight: '900', color: '#1E293B', fontStyle: 'italic' },
    floatingLayer: { position: 'absolute', zIndex: 50 },
    hitText: { fontSize: 45, fontWeight: '900', fontStyle: 'italic' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    gridBtn: { width: '47%', backgroundColor: '#fff', padding: 22, borderRadius: 20, alignItems: 'center', elevation: 4 },
    gridBtnText: { fontSize: 36, fontWeight: 'bold', color: '#334155' },
    resultContainer: { flex: 1, padding: 25, backgroundColor: '#F8FAFC' },
    resultTitle: { fontSize: 34, fontWeight: '900', textAlign: 'center', color: '#1E293B' },
    resultScore: { fontSize: 22, textAlign: 'center', color: '#FF9800', fontWeight: 'bold' },
    reviewCard: { padding: 15, borderRadius: 15, marginBottom: 10, backgroundColor: '#fff' },
    reviewText: { fontSize: 18, fontWeight: '700' },
    cardCorrect: { borderLeftWidth: 6, borderLeftColor: '#22C55E' },
    cardWrong: { borderLeftWidth: 6, borderLeftColor: '#EF4444' },
    saveBtn: { backgroundColor: '#1E293B', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 }
});