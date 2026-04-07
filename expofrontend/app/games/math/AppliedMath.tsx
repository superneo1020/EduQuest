import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, SafeAreaView, Animated as RNAnimated, Button
} from 'react-native';
import { Brain, Star, ChevronRight, Award, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import axios from 'axios';
import { useAuth } from "@/src/auth/AuthContext";
import { useRouter, useNavigation } from 'expo-router';

const MAX_STEPS = 5; // 假設 5 題為一場試煉

// --- 難度選項配置 (完全複製自 CalculationGame) ---
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

    // 完全隐藏系统导航栏（包括返回按钮）
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // --- 保留原有狀態 ---
    const [loading, setLoading] = useState(false);
    const [difficulty, setDifficulty] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    const [userSteps, setUserSteps] = useState('');
    const [userFinalAnswer, setUserFinalAnswer] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [sessionHistory, setSessionHistory] = useState<any[]>([]);
    const [aiFeedback, setAiFeedback] = useState({ isCorrect: null as boolean | null, message: '' });
    const [isFinished, setIsFinished] = useState(false);
    const [finalReport, setFinalReport] = useState({ summary: '', accuracy: 0 });

    // --- 新增遊戲化狀態 ---
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useSharedValue(0);
    const prepAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: prepScale.value }] }));

    // --- Ready... Go! 邏輯 (包裝在原有 fetch 之後) ---
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
            if (selectedDiff) startPrepSequence(); // 只有第一次選難度或換題時觸發
        } catch (e) {
            alert("AI 賢者正在冥想中，請重試。");
        } finally {
            setLoading(false);
        }
    };

    // --- 原有 handleCheckAnswer 邏輯 (完全保留) ---
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

            // 答題反饋震動
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
        setLoading(true);
        try {
            // 1. 從 FastAPI 獲取報告數據
            const res = await axios.post('http://localhost:8000/api/math/final_report', { history: sessionHistory });
            const reportData = res.data;

            // 更新狀態供 UI 顯示
            setFinalReport(reportData);

            // 2. 計算分數 (直接使用 reportData，確保準確率正確)
            const finalScore = Math.round((reportData.accuracy / 100) * sessionHistory.length * 10);
            console.log(`Prepare to store scores: ${finalScore}, accuracy: ${reportData.accuracy}%`);

            // 3. 執行存分邏輯
            try {
                // Use hardcoded game ID for AI Math Adventure (gameId: 2)
                const gameName = "AI Math Adventure"

                await axios.post('http://localhost:8080/api/user/game/score',
                    { gameName, scores: finalScore },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                console.log(`Score saved successfully: ${finalScore} points`);

                // ... 在 generateFinalSummary 函數內
                const scorePayload = {
                    gameName: "AI Math Adventure",
                    scores: finalScore
                };

                await axios.post('http://localhost:8080/api/user/game/score',
                    scorePayload,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } catch (scoreError) {
                console.error("主要存分失敗，嘗試後備方案:", scoreError);
                // 後備方案依然使用計算好的 finalScore
                await axios.post('http://localhost:8080/api/user/game/score',
                    { gameName: "AI Math Adventure", scores: finalScore },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            }

            setIsFinished(true);
        } catch (e) {
            console.error("生成報告或存分過程錯誤:", e);
            alert("存檔過程出現問題，請檢查網路連接。");
            setIsFinished(true);
        } finally {
            setLoading(false);
        }
    };

    if (isFinished) {
        return (
            <LinearGradient colors={['#F8FAFC', '#E2E8F0']} style={styles.centerContainer}>
                <Award size={80} color="#F59E0B" />
                <Text style={styles.title}>Session Report 🎓</Text>

                <View style={styles.reportBox}>
                    <Text style={styles.accuracyText}>Accuracy: {finalReport.accuracy.toFixed(0)}%</Text>
                    <Text style={styles.summaryText}>{finalReport.summary}</Text>
                </View>

                <View style={{ width: '100%', gap: 10 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
                        onPress={() => router.push('/rank/leaderboard')}
                    >
                        <Text style={styles.actionBtnText}>View Leaderboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                        onPress={() => {
                            setCurrentStep(1);
                            setSessionHistory([]);
                            setIsFinished(false);
                            setDifficulty(null);
                        }}
                    >
                        <Text style={styles.actionBtnText}>Restart Practice</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    // --- 加载状态显示 (与 CalculationGame 一致) ---
    if (loading && !difficulty) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>PREPARING TRIAL...</Text>
            </SafeAreaView>
        );
    }

    // --- 难度选择页面 (完全复制 CalculationGame 的 UI 风格) ---
    if (!difficulty) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* 頂部標題區域 */}
                    <View style={styles.headerSection}>
                        <Brain size={60} color="#F59E0B" style={{ marginBottom: 20 }} />
                        <Text style={styles.mainTitle}>Sage's Trial</Text>
                        <Text style={styles.subTitle}>
                            Prove your logic to the AI Guardian
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
                                onPress={() => {
                                    setDifficulty(option.level);
                                    fetchQuestion(option.level);
                                }}
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
                                            <Text style={styles.startButtonText}>Start Trial →</Text>
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
    }

    // --- 游戏主界面 (完全保留原有逻辑和样式) ---
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* 頂部進度條 */}
            <SafeAreaView style={styles.gameHeader}>
                <View style={styles.progressInfo}>
                    <Text style={styles.stepText}>Trial {currentStep}/{MAX_STEPS}</Text>
                    <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${(currentStep / MAX_STEPS) * 100}%` }]} />
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 賢者對話區 */}
                <View style={styles.sageSection}>
                    <Text style={styles.sageEmoji}>{aiFeedback.isCorrect === false ? '🧐' : '🤖'}</Text>
                    <View style={styles.bubble}>
                        <Text style={styles.questionText}>{data?.question || "Constructing trial..."}</Text>
                    </View>
                </View>

                {/* 輸入區 */}
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

                {/* 反饋與按鈕 */}
                {aiFeedback.isCorrect === null ? (
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                        onPress={handleCheckAnswer} disabled={loading}
                    >
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
                            }
                            else {
                                // 這裡要呼叫你寫好的存分與報告邏輯
                                generateFinalSummary();
                            }
                        }}>
                            <Text style={styles.nextBtnText}>Continue Adventure</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* 预备动画覆盖层 */}
            {prepText && (
                <Animated.View style={[styles.prepOverlay, prepAnimatedStyle]}>
                    <Text style={styles.prepText}>{prepText}</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // ========== 难度选择页面样式 (完全复制自 CalculationGame) ==========
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        padding: 20,
    },
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

    // ========== 通用样式 ==========
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 15,
        fontWeight: '800',
        color: '#64748B',
    },

    // ========== 原有游戏主界面样式 (完全保留) ==========
    gameHeader: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    progressInfo: {
        padding: 20,
    },
    stepText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#64748B',
        marginBottom: 8,
    },
    barBg: {
        height: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 5,
    },
    barFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 5,
    },
    sageSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 30,
        gap: 15,
    },
    sageEmoji: {
        fontSize: 40,
    },
    bubble: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 20,
        borderTopLeftRadius: 0,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    questionText: {
        fontSize: 18,
        lineHeight: 28,
        color: '#1E293B',
        fontWeight: '500',
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 10,
        marginLeft: 5,
    },
    textArea: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#F1F5F9',
        borderRadius: 15,
        padding: 15,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#F1F5F9',
        borderRadius: 15,
        padding: 15,
        fontSize: 18,
        fontWeight: 'bold',
    },
    submitBtn: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 18,
    },
    feedbackCard: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 20,
        borderLeftWidth: 8,
        marginTop: 10,
    },
    feedbackTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 10,
    },
    feedbackMsg: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 20,
    },
    nextBtn: {
        backgroundColor: '#22C55E',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    nextBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    prepOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    prepText: {
        fontSize: 80,
        fontWeight: '900',
        color: '#1E293B',
    },
    reportBox: {
        backgroundColor: '#fff9c4',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
    },
    accuracyText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f57f17',
        textAlign: 'center',
        marginBottom: 10,
    },
    summaryText: {
        fontSize: 16,
        lineHeight: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    actionBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default AppliedMath;