import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Trophy, Clock, Brain, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from "@/src/auth/AuthContext";

export default function CalculationGame() {
    const router = useRouter();
    const { token } = useAuth();

    // 狀態管理
    const [gameStarted, setGameStarted] = useState(false);
    const [difficulty, setDifficulty] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(90);
    const [gameActive, setGameActive] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const TOTAL_QUESTIONS = 10;

    // --- 1. 從 AI 獲取 10 題 ---
    const fetchQuestions = async (selectedDiff: string) => {
        setLoading(true);
        setDifficulty(selectedDiff);
        try {
            // 注意：請確保 IP 在實機測試時正確 (例如 192.168.x.x)
            const res = await axios.get(`http://localhost:8000/api/math/batch_generate?difficulty=${selectedDiff}&count=${TOTAL_QUESTIONS}`);
            setQuestions(res.data);
            setCurrentIndex(0);
            setScore(0);
            setTimeLeft(selectedDiff === 'hard' ? 120 : 90);
            setupOptions(res.data[0]);
            setGameStarted(true);
            setGameActive(true);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "AI is busy generating problems. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- 2. 隨機生成 4 個選項 ---
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

    // --- 3. 儲存分數到 Spring Boot ---
    const saveScoreToLeaderboard = async (finalPoints: number) => {
        setIsSaving(true);
        try {
            const payload = {
                gameName: "Speed Calculation",
                scores: finalPoints,
                difficulty: difficulty
            };

            await axios.post('http://localhost:8080/api/user/game/score', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            Alert.alert("Mission Complete!", `Base Score: ${finalPoints}\nRankings updated!`, [
                { text: "Leaderboard", onPress: () => router.push('/rank/leaderboard') },
                { text: "Home", onPress: () => router.push('/') }
            ]);
        } catch (e) {
            Alert.alert("Notice", "Game finished! (Score sync failed)");
        } finally {
            setIsSaving(false);
        }
    };

    // --- 4. 處理答題 ---
    const handleAnswer = (selected: string) => {
        if (!gameActive || isSaving) return;

        const isCorrect = selected === questions[currentIndex].answer;
        const newScore = isCorrect ? score + 10 : score;

        if (isCorrect) setScore(newScore);

        if (currentIndex + 1 < TOTAL_QUESTIONS) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setupOptions(questions[nextIdx]);
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

    // 介面 A: 難度選擇
    // 在 CalculationGame 內替換掉原有的 !gameStarted 判斷部分
    if (!gameStarted) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Trophy size={60} color="#2196F3" style={{ marginBottom: 20 }} />
                <Text style={styles.mainTitle}>Speed Calculation</Text>
                <Text style={styles.subTitle}>Beat the clock with AI math!</Text>

                {loading ? (
                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#2196F3" />
                        <Text style={styles.loadingText}>AI is crafting 10 problems...</Text>
                    </View>
                ) : (
                    <View style={styles.menuGrid}>
                        <TouchableOpacity
                            style={[styles.diffCard, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}
                            onPress={() => fetchQuestions('easy')}
                        >
                            <Star size={24} color="#4CAF50" />
                            <View>
                                <Text style={[styles.diffBtnText, { color: '#2E7D32' }]}>Easy</Text>
                                <Text style={styles.diffDesc}>Relaxed pace (90s)</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.diffCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}
                            onPress={() => fetchQuestions('medium')}
                        >
                            <Star size={24} color="#FF9800" />
                            <View>
                                <Text style={[styles.diffBtnText, { color: '#EF6C00' }]}>Medium</Text>
                                <Text style={styles.diffDesc}>Standard challenge (90s)</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.diffCard, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}
                            onPress={() => fetchQuestions('hard')}
                        >
                            <Star size={24} color="#F44336" />
                            <View>
                                <Text style={[styles.diffBtnText, { color: '#C62828' }]}>Hard</Text>
                                <Text style={styles.diffDesc}>Expert speed (120s)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        );
    }

    // 介面 C: 遊戲結算畫面
    if (gameEnded) {
        const correctAnswers = score / 10;
        const accuracy = Math.round((correctAnswers / TOTAL_QUESTIONS) * 100);
        
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Trophy size={80} color="#FFD700" style={{ marginBottom: 20 }} />
                <Text style={styles.mainTitle}>Mission Complete!</Text>
                <Text style={styles.subTitle}>Here's your performance</Text>
                
                <View style={styles.scoreCard}>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Final Score</Text>
                        <Text style={styles.scoreValue}>{score}</Text>
                    </View>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Correct Answers</Text>
                        <Text style={styles.scoreValue}>{correctAnswers}/{TOTAL_QUESTIONS}</Text>
                    </View>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Accuracy</Text>
                        <Text style={styles.scoreValue}>{accuracy}%</Text>
                    </View>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Difficulty</Text>
                        <Text style={styles.scoreValue}>{difficulty?.toUpperCase()}</Text>
                    </View>
                </View>

                {isSaving ? (
                    <View style={{ marginTop: 20 }}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Saving score...</Text>
                    </View>
                ) : (
                    <View style={styles.menuGrid}>
                        <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => saveScoreToLeaderboard(score)}>
                            <Trophy size={24} color="#4CAF50" />
                            <Text style={[styles.diffBtnText, { color: '#2E7D32' }]}>Save Score</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.diffBtn, { backgroundColor: '#FFF3E0' }]} onPress={() => router.push('/')}>
                            <Star size={24} color="#FF9800" />
                            <Text style={[styles.diffBtnText, { color: '#EF6C00' }]}>Home</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        );
    }

    // 介面 B: 遊戲進行中
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
                <View style={styles.stats}>
                    <View style={styles.stat}><Trophy size={18} color="#FFD700" /><Text style={styles.statText}>{score}</Text></View>
                    <View style={styles.stat}><Clock size={18} color="#FF6B6B" /><Text style={styles.statText}>{timeLeft}s</Text></View>
                </View>
            </View>

            <View style={styles.gameArea}>
                <Text style={styles.progressText}>Question {currentIndex + 1} / {TOTAL_QUESTIONS}</Text>

                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{questions[currentIndex]?.question} = ?</Text>
                </View>

                <View style={styles.optionsGrid}>
                    {options.map((opt, i) => (
                        <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleAnswer(opt)} disabled={isSaving}>
                            <Text style={styles.optionText}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {isSaving && <ActivityIndicator style={{ marginTop: 20 }} color="#4CAF50" />}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
    mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
    subTitle: { fontSize: 16, color: '#64748B', marginBottom: 30 },
    menuGrid: { width: '100%', gap: 15 },
    diffCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 15, gap: 15, borderWidth: 2 },
    diffBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 15, gap: 15 },
    diffBtnText: { fontSize: 20, fontWeight: 'bold' },
    diffDesc: { fontSize: 14, color: '#64748B', marginTop: 4 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2 },
    stats: { flexDirection: 'row', gap: 12 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statText: { fontWeight: '700', color: '#334155' },
    gameArea: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
    progressText: { fontSize: 16, color: '#64748B', fontWeight: '600', marginBottom: 10 },
    questionCard: { width: '100%', backgroundColor: '#fff', paddingVertical: 50, borderRadius: 30, alignItems: 'center', marginBottom: 40, elevation: 5 },
    questionText: { fontSize: 42, fontWeight: '800', color: '#1E293B' },
    optionsGrid: { width: '100%', gap: 15 },
    optionBtn: { backgroundColor: '#fff', padding: 22, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
    optionText: { fontSize: 22, fontWeight: '700', color: '#334155' },
    loadingText: { marginTop: 15, fontSize: 14, color: '#666' },
    scoreCard: { width: '100%', backgroundColor: '#F8FAFC', padding: 25, borderRadius: 20, marginBottom: 30, borderWidth: 2, borderColor: '#E2E8F0' },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    scoreLabel: { fontSize: 16, fontWeight: '600', color: '#64748B' },
    scoreValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },

});