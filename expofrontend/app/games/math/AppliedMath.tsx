import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createGameMetadata, GameMetadata } from '../../../types/GameMetadata';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, SafeAreaView
} from 'react-native';
import { Brain, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import axios from 'axios';
import { useAuth } from "@/src/auth/AuthContext";
import { useRouter, useNavigation } from 'expo-router';

const MAX_STEPS = 3;

// 格式化時間為 mm:ss
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
    }
];

const AppliedMath = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const { token } = useAuth();

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // 原有狀態
    const [loading, setLoading] = useState(false);
    const [difficulty, setDifficulty] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    const [userSteps, setUserSteps] = useState('');
    const [userFinalAnswer, setUserFinalAnswer] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [sessionHistory, setSessionHistory] = useState<any[]>([]);
    const [aiFeedback, setAiFeedback] = useState({ isCorrect: null as boolean | null, message: '' });
    const [isFinished, setIsFinished] = useState(false);
    const [finalReport, setFinalReport] = useState({ summary: '', accuracy: 0, totalTime: 0 });

    // 計時器狀態
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 遊戲化狀態
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useSharedValue(0);
    const prepAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: prepScale.value }] }));

    // 啟動計時器
    const startTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setElapsedTime(0);
        timerIntervalRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    // 停止計時器並返回當前秒數（不依賴 state 非同步問題）
    const stopTimerAndGetElapsed = (): number => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        return elapsedTime;
    };

    // 重置計時器（不啟動）
    const resetTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setElapsedTime(0);
    };

    const startPrepSequence = () => {
        setPrepText('READY');
        prepScale.value = withSpring(1.5);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setTimeout(() => {
            setPrepText('GO!');
            prepScale.value = withSpring(2);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);

        setTimeout(() => {
            setPrepText(null);
            prepScale.value = 0;
            startTimer(); // 開始計時
        }, 1600);
    };

    const fetchQuestion = async (selectedDiff?: string) => {
        const diff = selectedDiff || difficulty;
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/math/generate?difficulty=${diff}&t=${Date.now()}`);
            setData(res.data);
            setAiFeedback({ isCorrect: null, message: '' });
            setUserFinalAnswer('');
            setUserSteps('');
            if (selectedDiff) startPrepSequence(); // 僅在初次選擇難度時啟動準備動畫和計時器
        } catch (e) {
            alert("AI 賢者正在冥想中，請重試。");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAnswer = async () => {
        if (!userFinalAnswer.trim()) return;
        setLoading(true);
        try {
            const payload = {
                question: data.question,
                user_steps: userSteps || "",
                user_answer: userFinalAnswer,
                correct_answer: data.answer
            };
            const res = await axios.post('http://localhost:8000/api/math/check', payload);
            const { is_correct, feedback } = res.data;
            setAiFeedback({ isCorrect: is_correct, message: feedback });

            if (is_correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            setSessionHistory(prev => [...prev, {
                question: data.question, user_answer: userFinalAnswer, is_correct: is_correct
            }]);
        } catch (e) {
            setAiFeedback({ isCorrect: false, message: "解析失敗，請再試一次" });
        } finally {
            setLoading(false);
        }
    };

    const generateFinalSummary = async () => {
        // 停止計時並取得實際花費秒數
        const finalTime = stopTimerAndGetElapsed();

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/math/final_report', { history: sessionHistory });
            const reportData = res.data;
            // 直接使用 finalTime 確保總時間正確
            setFinalReport({ ...reportData, totalTime: finalTime });

            const finalScore = Math.round((reportData.accuracy / 100) * sessionHistory.length * 10);
            
            const gameData = {
                gameName: "AI Math Adventure",
                scores: finalScore,
                gameType: "MATH",
                gameDifficulty: "HARD"
            };
            
            const questionsData = sessionHistory.map((item, index) => ({
                id: index + 1,
                question: item.question,
                correctAnswer: 'AI evaluated answer',
                userAnswer: item.user_answer,
                isCorrect: item.is_correct,
                questionType: 'applied-math',
                timeSpent: 0
            }));

            const metadata: GameMetadata = createGameMetadata(
                gameData.gameType,
                gameData.gameDifficulty,
                finalScore,
                {
                    totalProblems: sessionHistory.length,
                    correctProblems: Math.round(sessionHistory.length * reportData.accuracy / 100)
                },
                questionsData
            );

            const backendRequest = {
                gameName: gameData.gameName,
                scores: gameData.scores,
                metadata: metadata
            };
            
            await axios.post('http://localhost:8080/api/user/game/score', backendRequest,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setIsFinished(true);
        } catch (e) {
            console.error(e);
            alert("存檔過程出現問題，請檢查網路連接。");
            setIsFinished(true);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToGames = () => {
        resetTimer();
        if (router.canGoBack()) router.back();
    };

    const handleRestart = () => {
        resetTimer();
        setCurrentStep(1);
        setSessionHistory([]);
        setIsFinished(false);
        setDifficulty(null);
        setElapsedTime(0);
    };

    // 總結頁面
    if (isFinished) {
        return (
            <LinearGradient colors={['#F8FAFC', '#E2E8F0']} style={styles.centerContainer}>
                <Award size={80} color="#F59E0B" />
                <Text style={styles.title}>Session Report 🎓</Text>
                <View style={styles.reportBox}>
                    <Text style={styles.accuracyText}>Accuracy: {finalReport.accuracy.toFixed(0)}%</Text>
                    <Text style={styles.timeText}>⏱️ Total Time: {formatTime(finalReport.totalTime)}</Text>
                    <Text style={styles.summaryText}>{finalReport.summary}</Text>
                </View>
                <View style={{ width: '100%', gap: 10 }}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2196F3' }]} onPress={() => router.push('/rank/leaderboard')}>
                        <Text style={styles.actionBtnText}>View Leaderboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={handleRestart}>
                        <Text style={styles.actionBtnText}>Restart Practice</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2196F3' }]} onPress={handleBackToGames}>
                        <Text style={styles.actionBtnText}>Go back to game list</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    if (loading && !difficulty) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>PREPARING TRIAL...</Text>
            </SafeAreaView>
        );
    }

    // 難度選擇
    if (!difficulty) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerSection}>
                        <Brain size={60} color="#F59E0B" style={{ marginBottom: 20 }} />
                        <Text style={styles.mainTitle}>Sage's Trial</Text>
                        <Text style={styles.subTitle}>Prove your logic to the AI Guardian</Text>
                    </View>
                    <View style={styles.menuGrid}>
                        {difficultyOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.diffCard, { backgroundColor: option.bgColor, borderColor: option.color }]}
                                onPress={() => { setDifficulty(option.level); fetchQuestion(option.level); }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardIconContainer}><Text style={styles.cardIcon}>{option.icon}</Text></View>
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.diffBtnText, { color: option.color }]}>{option.title}</Text>
                                        <View style={[styles.levelBadge, { backgroundColor: option.color }]}><Text style={styles.levelBadgeText}>{option.badgeText}</Text></View>
                                    </View>
                                    <Text style={styles.diffDesc}>{option.description}</Text>
                                    <View style={styles.startButtonContainer}>
                                        <View style={[styles.startButton, { backgroundColor: option.color }]}><Text style={styles.startButtonText}>Start Trial →</Text></View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.backLink} onPress={() => router.back()}><Text style={styles.backLinkText}>← Back to Game Library</Text></TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 遊戲主介面（包含右上角即時計時器）
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <SafeAreaView style={styles.gameHeader}>
                <View style={styles.headerRow}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.stepText}>Trial {currentStep}/{MAX_STEPS}</Text>
                        <View style={styles.barBg}>
                            <View style={[styles.barFill, { width: `${(currentStep / MAX_STEPS) * 100}%` }]} />
                        </View>
                    </View>
                    {/* 即時計時器 */}
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerIcon}>⏱️</Text>
                        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.sageSection}>
                    <Text style={styles.sageEmoji}>{aiFeedback.isCorrect === false ? '🧐' : '🤖'}</Text>
                    <View style={styles.bubble}>
                        <Text style={styles.questionText}>{data?.question || "Constructing trial..."}</Text>
                    </View>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Your Reasoning (Steps):</Text>
                    <TextInput
                        multiline value={userSteps} onChangeText={setUserSteps}
                        placeholder="Explain your logic here..."
                        style={styles.textArea}
                    />
                    <Text style={styles.inputLabel}>Final Conclusion:</Text>
                    <TextInput
                        value={userFinalAnswer} onChangeText={setUserFinalAnswer}
                        keyboardType="numeric" placeholder="Numerical answer"
                        style={styles.input}
                    />
                </View>

                {aiFeedback.isCorrect === null ? (
                    <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleCheckAnswer} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit to Sage</Text>}
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.feedbackCard, { borderLeftColor: aiFeedback.isCorrect ? '#22C55E' : '#EF4444' }]}>
                        <Text style={styles.feedbackTitle}>{aiFeedback.isCorrect ? "✨ Insightful!" : "⚠️ A Flaw in Logic"}</Text>
                        <Text style={styles.feedbackMsg}>{aiFeedback.message}</Text>
                        <TouchableOpacity style={styles.nextBtn} onPress={() => {
                            if (currentStep < MAX_STEPS) {
                                setCurrentStep(s => s + 1);
                                fetchQuestion();
                            } else {
                                generateFinalSummary();
                            }
                        }}>
                            <Text style={styles.nextBtnText}>Continue Adventure</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {prepText && (
                <Animated.View style={[styles.prepOverlay, prepAnimatedStyle]}>
                    <Text style={styles.prepText}>{prepText}</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    scrollContent: { padding: 20 },
    headerSection: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30, backgroundColor: '#fff', marginBottom: 20, borderRadius: 24 },
    mainTitle: { fontSize: 32, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
    subTitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 10 },
    menuGrid: { width: '100%', gap: 20 },
    diffCard: { flexDirection: 'row', padding: 20, borderRadius: 16, borderWidth: 2, gap: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, backgroundColor: '#fff' },
    cardIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    cardIcon: { fontSize: 32 },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap' },
    diffBtnText: { fontSize: 20, fontWeight: '700' },
    levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    levelBadgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
    diffDesc: { fontSize: 14, color: '#64748B', marginBottom: 12, lineHeight: 20 },
    startButtonContainer: { alignItems: 'flex-end', marginTop: 8 },
    startButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minWidth: 120, alignItems: 'center' },
    startButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    backLink: { marginTop: 30, alignItems: 'center', marginBottom: 40 },
    backLinkText: { fontSize: 16, color: '#F59E0B', fontWeight: '600' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    loadingText: { marginTop: 15, fontWeight: '800', color: '#64748B' },
    gameHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 20, paddingTop: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    progressInfo: { flex: 1, paddingVertical: 15, paddingRight: 15 },
    stepText: { fontSize: 14, fontWeight: '800', color: '#64748B', marginBottom: 8 },
    barBg: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5 },
    barFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 5 },
    timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
    timerIcon: { fontSize: 16 },
    timerText: { fontSize: 16, fontWeight: '600', color: '#1E293B', fontVariant: ['tabular-nums'] },
    sageSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30, gap: 15 },
    sageEmoji: { fontSize: 40 },
    bubble: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderTopLeftRadius: 0, borderWidth: 1, borderColor: '#E2E8F0' },
    questionText: { fontSize: 18, lineHeight: 28, color: '#1E293B', fontWeight: '500' },
    inputSection: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 10, marginLeft: 5 },
    textArea: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#F1F5F9', borderRadius: 15, padding: 15, minHeight: 120, textAlignVertical: 'top', fontSize: 16, marginBottom: 20 },
    input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#F1F5F9', borderRadius: 15, padding: 15, fontSize: 18, fontWeight: 'bold' },
    submitBtn: { backgroundColor: '#1E293B', padding: 20, borderRadius: 15, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
    feedbackCard: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderLeftWidth: 8, marginTop: 10 },
    feedbackTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10 },
    feedbackMsg: { fontSize: 16, color: '#475569', lineHeight: 24, marginBottom: 20 },
    nextBtn: { backgroundColor: '#22C55E', padding: 15, borderRadius: 12, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontWeight: '700' },
    prepOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    prepText: { fontSize: 80, fontWeight: '900', color: '#1E293B' },
    reportBox: { backgroundColor: '#fff9c4', padding: 20, borderRadius: 12, marginBottom: 30 },
    accuracyText: { fontSize: 24, fontWeight: 'bold', color: '#f57f17', textAlign: 'center', marginBottom: 10 },
    timeText: { fontSize: 18, fontWeight: '600', color: '#4b6cb7', textAlign: 'center', marginBottom: 15 },
    summaryText: { fontSize: 16, lineHeight: 24 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
    actionBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default AppliedMath;