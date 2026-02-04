import React, { useState, useEffect } from 'react';

import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import axios from 'axios';

const AppliedMath = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ question: '', options: [] as string[], answer: '' });
    const [userSteps, setUserSteps] = useState('');
    const [userFinalAnswer, setUserFinalAnswer] = useState('');
    const [score, setScore] = useState(0);

    // --- 新增：存放 AI 回饋的狀態 ---
    const [aiFeedback, setAiFeedback] = useState<{ isCorrect: boolean | null, message: string }>({
        isCorrect: null,
        message: ''
    });

    const fetchQuestion = async () => {
        setLoading(true);
        setAiFeedback({ isCorrect: null, message: '' }); // 換題時清空回饋
        try {
            const res = await axios.get(`http://localhost:8000/api/math/generate?t=${Date.now()}`);
            setData(res.data);
        } catch (e) {
            console.error("無法生成題目");
        }
        setLoading(false);
    };

    useEffect(() => { fetchQuestion(); }, []);

    const handleCheckAnswer = async () => {
        if (!userFinalAnswer.trim()) return;

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/math/check', {
                question: data.question,
                user_steps: userSteps,
                user_answer: userFinalAnswer,
                correct_answer: data.answer
            });

            const is_correct = res.data?.is_correct ?? false;
            const feedback_msg = res.data?.feedback ?? "AI 老師解析中...";

            // 將結果存入狀態，直接顯示在畫面上，不再彈窗
            setAiFeedback({
                isCorrect: is_correct,
                message: feedback_msg
            });

            if (is_correct) {
                setScore(prev => prev + 10);
                // 答對了，可以提供一個按鈕讓學生自己決定何時換「下一題」
            }
        } catch (e) {
            setAiFeedback({ isCorrect: false, message: "連線失敗，請檢查 API 狀態。" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={styles.scoreText}>當前積分: {score}</Text>
            {loading && !data.question ? (
                <Text style={styles.loadingText}>AI 正在準備題目...</Text>
            ) : (
                <View>
                    {/* 題目區 */}
                    <View style={styles.questionBox}>
                        <Text style={styles.questionTitle}>Question：</Text>
                        <Text style={styles.questionText}>{data.question}</Text>
                    </View>

                    {/* 輸入區 */}
                    <Text style={styles.label}>Step：</Text>
                    <TextInput
                        multiline

                        value={userSteps}
                        onChangeText={setUserSteps}
                        style={styles.textArea}
                    />

                    <Text style={styles.label}>Answer：</Text>
                    <TextInput

                        keyboardType="numeric"
                        value={userFinalAnswer}
                        onChangeText={setUserFinalAnswer}
                        style={styles.input}
                    />

                    <Button title={loading ? "Grading in progress..." : "submit answer"} onPress={handleCheckAnswer} disabled={loading} />

                    {/* --- 核心修正：AI 回饋區 --- */}
                    {aiFeedback.message !== '' && (
                        <View style={[
                            styles.feedbackBox,
                            { borderColor: aiFeedback.isCorrect ? '#4CAF50' : '#F44336' }
                        ]}>
                            <Text style={[styles.feedbackTitle, { color: aiFeedback.isCorrect ? '#2E7D32' : '#C62828' }]}>
                                {aiFeedback.isCorrect ? "✅ Correct！" : "❌ Need to think about it again"}
                            </Text>
                            <Text style={styles.feedbackText}>{aiFeedback.message}</Text>

                            {aiFeedback.isCorrect && (
                                <View style={{ marginTop: 15 }}>
                                    <Button title="Next Question" color="#4CAF50" onPress={fetchQuestion} />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    loadingText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    questionBox: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    questionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#495057',
    },
    questionText: {
        fontSize: 16,
        lineHeight: 22,
        color: '#212529',
    },
    feedbackBox: {
        marginTop: 20,
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        backgroundColor: '#fff',
        // 加一點陰影
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    feedbackTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    feedbackText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },

});

export default AppliedMath;