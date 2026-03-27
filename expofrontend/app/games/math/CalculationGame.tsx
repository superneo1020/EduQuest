import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Dimensions, Image, ImageBackground } from 'react-native';
import { ArrowLeft, Trophy, Clock, Brain, Star, zap, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from "@/src/auth/AuthContext";

const { width, height } = Dimensions.get('window');

// --- 🎮 遊戲資材定義 (這裡假設你已經有這些圖片) ---
// 如果沒有圖片，可以用網路圖片網址代替，或者先用我提供的佔位代碼
const GAME_ASSETS = {
    easy: {
        bg: require('@/assets/games/bg_plains.png'), // 青青草原背景
        monster: require('@/assets/games/monster_cloud.png'), // 雲朵怪
        color: '#4CAF50'
    },
    medium: {
        bg: require('@/assets/games/bg_desert.png'), // 荒漠遺蹟背景
        monster: require('@/assets/games/monster_cactus.png'), // 仙人掌怪
        color: '#FF9800'
    },
    hard: {
        bg: require('@/assets/games/bg_volcano.png'), // 熔岩火山背景
        monster: require('@/assets/games/monster_golem.png'), // 熔岩巨像
        color: '#F44336'
    }
};

export default function CalculationGame() {
    const router = useRouter();
    const { token } = useAuth();

    // --- 遊戲狀態管理 ---
    const [gameStarted, setGameStarted] = useState(false);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(90);
    const [gameActive, setGameActive] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // 🎮 遊戲化狀態
    const [combo, setCombo] = useState(0);

    const TOTAL_QUESTIONS = 10;

    // --- 獲取當前場景資材 ---
    const currentScene = useMemo(() => {
        if (!difficulty) return null;
        return GAME_ASSETS[difficulty];
    }, [difficulty]);

    // --- 1. 從 AI 獲取題目 (闖關內容) ---
    const fetchQuestions = async (selectedDiff: 'easy' | 'medium' | 'hard') => {
        setLoading(true);
        setDifficulty(selectedDiff);
        try {
            const res = await axios.get(`http://localhost:8000/api/math/batch_generate?difficulty=${selectedDiff}&count=${TOTAL_QUESTIONS}`);
            setQuestions(res.data);
            setCurrentIndex(0);
            setScore(0);
            setCombo(0);
            setTimeLeft(selectedDiff === 'hard' ? 120 : 90);
            setupOptions(res.data[0]);
            setGameStarted(true);
            setGameActive(true);
        } catch (e) {
            Alert.alert("Error", "AI Monster blocked your path. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- 2. 生成選項 (攻擊目標) ---
    const setupOptions = (qData: any) => {
        if (!qData) return;
        const correctAnswer = qData.answer;
        const correctNum = parseInt(correctAnswer);
        const opts = new Set<string>();
        opts.add(correctAnswer);

        while (opts.size < 4) {
            const offset = Math.floor(Math.random() * 20) - 10;
            const fake = (correctNum + offset).toString();
            if (parseInt(fake) >= 0 && fake !== correctAnswer) opts.add(fake);
        }
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    };

    // --- 3. 儲存分數 (戰利品同步) ---
    const saveScoreToLeaderboard = async (finalPoints: number) => {
        setIsSaving(true);
        try {
            const payload = {
                gameName: "AI Math Boss Battle",
                scores: finalPoints,
                difficulty: difficulty
            };
            await axios.post('http://localhost:8080/api/user/game/score', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            Alert.alert("Battle Won!", `Accuracy: ${finalPoints}%`, [
                { text: "Leaderboard", onPress: () => router.push('/rank/leaderboard') },
                { text: "Home", onPress: () => router.push('/') }
            ]);
        } catch (e) {
            Alert.alert("Notice", "Victory recorded locally.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- 4. 處理答題 (攻擊 Boss) ---
    const handleAnswer = (selected: string) => {
        if (!gameActive || isSaving) return;

        const isCorrect = selected === questions[currentIndex].answer;

        if (isCorrect) {
            setCombo(prev => prev + 1);
            setScore(prev => Math.min(prev + 10, 100));
        } else {
            setCombo(0);
        }

        if (currentIndex + 1 < TOTAL_QUESTIONS) {
            setupOptions(questions[currentIndex + 1]);
            setCurrentIndex(prev => prev + 1);
        } else {
            setGameActive(false);
            setGameEnded(true);
        }
    };

    // 計時器邏輯
    useEffect(() => {
        let timer: any;
        if (gameActive && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && gameActive) {
            setGameActive(false);
            setGameEnded(true);
        }
        return () => clearInterval(timer);
    }, [gameActive, timeLeft]);

    // 🏆 計算評價等級
    const getBattleStats = () => {
        const accuracy = score;
        if (accuracy === 100) return { title: "S - MATH KING", color: "#FFD700", stars: 3 };
        if (accuracy >= 80) return { title: "A - WIZARD", color: "#FF9800", stars: 2 };
        if (accuracy >= 60) return { title: "B - LEARNER", color: "#4CAF50", stars: 1 };
        return { title: "C - TRY AGAIN", color: "#94A3B8", stars: 0 };
    };

    // --- 介面 A: 難度選擇 (闖關入口) - 這裡可以做成一個漂亮的選單 ---
    if (!gameStarted) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                {/* 這裡是原本的難度選擇 UI，保持不變，或優化為卡片式 */}
                {/* ... (為了縮短代碼，這裡省略，請使用原本的卡片式設計) ... */}
            </SafeAreaView>
        );
    }

    // --- 介面 C: 遊戲結算畫面 (戰利品發放) ---
    if (gameEnded) {
        const stats = getBattleStats();
        return (
            <SafeAreaView style={styles.centerContainer}>
                {/* ... (原本的結算 UI，保持不變) ... */}
            </SafeAreaView>
        );
    }

    // --- 介面 B: 遊戲進行中 (真正的戰鬥場景) ---
    const bossHP = TOTAL_QUESTIONS - currentIndex;

    if (!currentScene) return null; // 保險機制

    return (
        <ImageBackground source={currentScene.bg} style={styles.backgroundImage}>
            <SafeAreaView style={styles.container}>
                {/* 頂部 Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
                    <View style={styles.stats}>
                        <View style={styles.stat}><Trophy size={18} color="#FFD700" /><Text style={styles.statText}>{score}</Text></View>
                        <View style={styles.stat}><Clock size={18} color="#FF6B6B" /><Text style={styles.statText}>{timeLeft}s</Text></View>
                    </View>
                </View>

                {/* 戰鬥區域 (Battle Arena) */}
                <View style={styles.battleArena}>
                    {/* 1. 怪獸形象與血條 */}
                    <View style={styles.monsterHeader}>
                        <Image source={currentScene.monster} style={styles.monsterImage} resizeMode="contain" />
                        <View style={styles.hpContainer}>
                            <View style={styles.hpBarBg}>
                                <View style={[styles.hpBarFill, { width: `${(bossHP / TOTAL_QUESTIONS) * 100}%`, backgroundColor: currentScene.color }]} />
                            </View>
                            <Text style={styles.hpText}>BOSS HP: {bossHP} / {TOTAL_QUESTIONS}</Text>
                        </View>
                    </View>

                    {/* 2. 連擊特效 (Combo) */}
                    <View style={styles.comboArea}>
                        {combo > 1 && (
                            <Text style={styles.comboText}>🔥 {combo} HITS!</Text>
                        )}
                    </View>

                    {/* 3. 攻擊指令 (題目卡片) */}
                    <View style={styles.questionCard}>
                        <Text style={styles.questionText}>{questions[currentIndex]?.question}</Text>
                        <Text style={styles.equalsText}>= ?</Text>
                    </View>

                    {/* 4. 攻擊選項 (答案) */}
                    <View style={styles.optionsGrid}>
                        {options.map((opt, i) => (
                            <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleAnswer(opt)} disabled={isSaving}>
                                <Target size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                                <Text style={styles.optionText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    // 通用與背景
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    container: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }, // 讓內容背景半透明，透出遊戲背景
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 25 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', elevation: 2 },
    stats: { flexDirection: 'row', gap: 12 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statText: { fontWeight: '700', color: '#334155' },

    // 戰鬥畫面 (Interface B)
    battleArena: { flex: 1, padding: 20, alignItems: 'center' },
    monsterHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 15, borderRadius: 20, elevation: 4, marginBottom: 15 },
    monsterImage: { width: 70, height: 70 },
    hpContainer: { flex: 1, marginLeft: 15 },
    hpBarBg: { height: 16, backgroundColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1' },
    hpBarFill: { height: '100%' }, // 顏色在代碼中動態設定
    hpText: { fontSize: 10, fontWeight: '900', color: '#1E293B', marginTop: 4, textAlign: 'center' },

    comboArea: { height: 40, justifyContent: 'center' },
    comboText: { fontSize: 26, fontWeight: '900', color: '#FF4757', fontStyle: 'italic', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 },

    questionCard: { width: '100%', backgroundColor: '#FFF', paddingVertical: 35, borderRadius: 30, alignItems: 'center', marginBottom: 20, elevation: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    questionText: { fontSize: 48, fontWeight: '800', color: '#1E293B' },
    equalsText: { fontSize: 22, color: '#94A3B8', fontWeight: '600' },

    optionsGrid: { width: '100%', gap: 12 },
    optionBtn: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', elevation: 2 },
    optionText: { fontSize: 24, fontWeight: '700', color: '#334155' },

    // ... 省略原本的難度選擇與結算樣式 (請使用卡片式設計) ...
});