import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { Brain, Star } from 'lucide-react-native';
import axios from 'axios';
import {useAuth} from "@/src/auth/AuthContext";
import { useRouter } from 'expo-router';

const MAX_STEPS = 2;

const AppliedMath = () => {
    const router = useRouter();
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
    const { token } = useAuth();
    // 從這裡取得 token
    const [currentScore, setCurrentScore] = useState(0);


    const fetchQuestion = async (selectedDiff?: string, retries = 3) => {
        const diff = selectedDiff || difficulty;
        if (!diff) return;

        setLoading(true);

        // 定義一個重試函數
        const attemptFetch = async (currentRetry: number): Promise<any> => {
            try {
                const res = await axios.get(`http://localhost:8000/api/math/generate?difficulty=${diff}&t=${Date.now()}`);
                return res.data;
            } catch (e) {
                if (currentRetry > 0) {
                    console.log(`請求失敗，重試中...剩餘次數: ${currentRetry}`);
                    // 等待 1 秒後重試
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return attemptFetch(currentRetry - 1);
                }
                throw e; // 重試次數用盡，拋出錯誤
            }
        };

        try {
            const data = await attemptFetch(retries);
            setData(data);
            setAiFeedback({ isCorrect: null, message: '' });
            setUserFinalAnswer('');
            setUserSteps('');
        } catch (e) {
            console.error("所有重試均失敗", e);
            alert("AI 目前繁忙，請重新點擊難度按鈕。");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAnswer = async () => {
        if (!userFinalAnswer.trim()) return;
        setLoading(true);

        try {
            // 關鍵：確保這四個欄位名稱與 Python 的 CheckRequest 完全一致
            const payload = {
                question: data.question,
                user_steps: userSteps || "",     // 如果是空的，傳送空字串而不是 undefined
                user_answer: userFinalAnswer,
                correct_answer: data.answer      // 這裡要對應 Python 的 correct_answer
            };

            console.log("正在發送 Check 請求:", payload);

            const res = await axios.post('http://localhost:8000/api/math/check', payload);

            const { is_correct, feedback } = res.data;
            setAiFeedback({ isCorrect: is_correct, message: feedback });

            if (is_correct) {
                setCurrentScore(prev => prev + 10);
            }

            setSessionHistory(prev => [...prev, {
                question: data.question,
                user_answer: userFinalAnswer,
                is_correct: is_correct
            }]);
        } catch (e) {
            if (axios.isAxiosError(e) && e.response) {
                console.error("FastAPI 驗證錯誤詳情:", e.response.data);
            }
            setAiFeedback({ isCorrect: false, message: "AI 檢查出錯，請再試一次" });
        }
        setLoading(false);
    };

    const handleNext = () => {
        if (currentStep < MAX_STEPS) {
            setCurrentStep(s => s + 1);
            fetchQuestion();
        } else {
            generateFinalSummary();
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
                const gameId = 2;

                await axios.post('http://localhost:8080/api/user/game/score',
                    { gameId, scores: finalScore },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                console.log(`Score saved successfully: ${finalScore} points`);

                // ... 在 generateFinalSummary 函數內
                const scorePayload = {
                    gameId,
                    scores: finalScore,
                    difficulty: difficulty // 加入這一行，傳送 'easy', 'medium' 或 'hard'
                };

                await axios.post('http://localhost:8080/api/user/game/score',
                    scorePayload,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } catch (scoreError) {
                console.error("主要存分失敗，嘗試後備方案:", scoreError);
                // 後備方案依然使用計算好的 finalScore
                await axios.post('http://localhost:8080/api/user/game/score',
                    { gameId: 2, scores: finalScore },
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
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Session Report 🎓</Text>
                <View style={styles.reportBox}>
                    <Text style={styles.accuracyText}>Accuracy: {finalReport.accuracy.toFixed(0)}%</Text>
                    <Text style={styles.summaryText}>{finalReport.summary}</Text>
                </View>
                <View style={styles.buttonContainer}>
                    <Button 
                        title="View Leaderboard" 
                        onPress={() => router.push('/rank/leaderboard')} 
                        color="#2196F3"
                    />
                    <View style={styles.buttonSpacing} />
                    <Button 
                        title="Restart Practice" 
                        onPress={() => {
                            setCurrentScore(0);
                            setCurrentStep(1);
                            setSessionHistory([]);
                            setIsFinished(false);
                            fetchQuestion();
                        }} 
                        color="#4CAF50"
                    />
                </View>
            </ScrollView>
        );
    }

    if (!difficulty) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Brain size={60} color="#4CAF50" style={{ marginBottom: 20 }} />
                <Text style={styles.mainTitle}>AI Math Adventure</Text>
                <Text style={styles.subTitle}>Master math with AI guidance!</Text>

                {loading ? (
                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>AI is generating your challenge...</Text>
                    </View>
                ) : (
                    <View style={styles.menuGrid}>
                        <TouchableOpacity
                            style={[styles.diffCard, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}
                            onPress={() => { setDifficulty('easy'); fetchQuestion('easy'); }}
                        >
                            <Star size={24} color="#4CAF50" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.diffBtnText, { color: '#2E7D32' }]}>Easy</Text>
                                <Text style={styles.diffDesc}>Addition & Subtraction within 100</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.diffCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}
                            onPress={() => { setDifficulty('medium'); fetchQuestion('medium'); }}
                        >
                            <Star size={24} color="#FF9800" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.diffBtnText, { color: '#EF6C00' }]}>Medium</Text>
                                <Text style={styles.diffDesc}>Multiplication & Division logic</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.diffCard, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}
                            onPress={() => { setDifficulty('hard'); fetchQuestion('hard'); }}
                        >
                            <Star size={24} color="#F44336" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.diffBtnText, { color: '#C62828' }]}>Hard</Text>
                                <Text style={styles.diffDesc}>Complex multi-step word problems</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.progressText}>Question {currentStep} / {MAX_STEPS}</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${(currentStep / MAX_STEPS) * 100}%` }]} />
                </View>
            </View>

            <View style={styles.questionBox}>
                {/* 使用 data?.question 確保 data 不是 null 的時候才讀取 */}
                <Text style={styles.questionText}>
                    {data ? data.question : "Loading question..."}
                </Text>
            </View>

            <TextInput
                multiline placeholder="Show your work here (optional)..."
                value={userSteps} onChangeText={setUserSteps}
                style={styles.textArea}
            />

            <TextInput
                placeholder="Final Answer (Number)" keyboardType="numeric"
                value={userFinalAnswer} onChangeText={setUserFinalAnswer}
                style={styles.input}
            />

            {aiFeedback.isCorrect === null ? (
                <Button title={loading ? "Checking..." : "Submit Answer"} onPress={handleCheckAnswer} disabled={loading} />
            ) : (
                <View style={[styles.feedbackBox, { borderColor: aiFeedback.isCorrect ? '#4CAF50' : '#F44336' }]}>
                    <Text style={styles.feedbackTitle}>{aiFeedback.isCorrect ? "✅ Correct!" : "❌ Not Quite"}</Text>
                    <Text style={styles.feedbackMsg}>{aiFeedback.message}</Text>
                    <View style={{marginTop: 15}}>
                        <Button title={currentStep === MAX_STEPS ? "See Final Report" : "Next Question"} onPress={handleNext} color="#4CAF50" />
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#fff' },
    header: { marginBottom: 20 },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff'
    },
    buttonSpacing: {
        marginVertical: 5,
    },
    buttonContainer: {
        marginTop: 20,
    },
    difficultyButtonContainer: {
        width: '80%',
        marginVertical: 10,
    },
    progressText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    progressBarBg: { height: 8, backgroundColor: '#eee', borderRadius: 4 },
    progressBar: { height: 8, backgroundColor: '#4CAF50', borderRadius: 4 },
    questionBox: { backgroundColor: '#f0f4f8', padding: 20, borderRadius: 12, marginBottom: 20 },
    questionText: { fontSize: 18, lineHeight: 26 },
    textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, minHeight: 80, marginBottom: 15, textAlignVertical: 'top' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, marginBottom: 20 },
    feedbackBox: { padding: 15, borderRadius: 8, borderLeftWidth: 8, backgroundColor: '#f9f9f9' },
    feedbackTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    feedbackMsg: { fontSize: 16 },
    reportBox: { backgroundColor: '#fff9c4', padding: 20, borderRadius: 12, marginBottom: 30 },
    accuracyText: { fontSize: 24, fontWeight: 'bold', color: '#f57f17', textAlign: 'center', marginBottom: 10 },
    summaryText: { fontSize: 16, lineHeight: 24 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    mainTitle: { fontSize: 32, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
    subTitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 30 },
    loadingText: { marginTop: 15, fontSize: 14, color: '#666' },
    menuGrid: { width: '100%', gap: 15 },
    diffCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 2, gap: 15 },
    diffBtnText: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    diffDesc: { fontSize: 14, color: '#64748B' },
    actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
    actionBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' }
});

export default AppliedMath;