import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import axios from 'axios';

const MAX_STEPS = 10;

const AppliedMath = () => {
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

    // 在你的 AppliedMath 組件中
    // 檢查你的 setData 是否有賦予預設值，或者在失敗時做了什麼？
    const handleDifficultySelect = async (diff: string) => {
        setDifficulty(diff);
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/math/generate?difficulty=${diff}&t=${Date.now()}`);
            console.log("=== API 成功回應 ===", res.data);
            setData(res.data);
        } catch (e) {
            console.error("=== API 請求失敗！後端沒開 ===", e);
            setData(null); // ← 關鍵：清除舊資料
            alert("後端服務未啟動，請確認 Server 狀態");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAnswer = async () => {
        if (!userFinalAnswer.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/math/check', {
                question: data.question, user_steps: userSteps, user_answer: userFinalAnswer, correct_answer: data.answer
            });
            const { is_correct, feedback } = res.data;
            setAiFeedback({ isCorrect: is_correct, message: feedback });
            setSessionHistory(prev => [...prev, { question: data.question, user_answer: userFinalAnswer, is_correct: is_correct }]);
        } catch (e) { setAiFeedback({ isCorrect: false, message: "Server Error" }); }
        setLoading(false);
    };

    const handleNext = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/math/generate?difficulty=${difficulty}&t=${Date.now()}`);
            setData(res.data);
        } catch (e) {
            console.error("=== API 請求失敗！後端沒開 ===", e);
            setData(null); // ← 清除舊資料
        } finally {
            setLoading(false);
        }
    };
    const generateFinalSummary = async () => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/math/final_report', { history: sessionHistory });
            setFinalReport(res.data);
            setIsFinished(true);
        } catch (e) { setIsFinished(true); }
        setLoading(false);
    };

    // 選擇難度介面：使用绝对定位确保点击区域在最上层
    if (!difficulty) return (
        <View style={styles.fullscreenContainer}>
            <Text style={styles.title}>Select Difficulty</Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={() => handleDifficultySelect('easy')}><Text style={styles.buttonText}>Easy</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#FF9800' }]} onPress={() => handleDifficultySelect('medium')}><Text style={styles.buttonText}>Medium</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#F44336' }]} onPress={() => handleDifficultySelect('hard')}><Text style={styles.buttonText}>Hard</Text></TouchableOpacity>
        </View>
    );

    return (

        <SafeAreaView style={{ flex: 1 }}>
            <Text style={{ color: 'red' }}>
                當前題目難度: {data?.difficulty || '尚未載入'}
            </Text>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text>Q {currentStep} / {MAX_STEPS}</Text>
                <View style={styles.questionBox}><Text style={styles.questionText}>{data?.question || "Loading..."}</Text></View>
                <TextInput style={styles.textArea} multiline placeholder="Workings..." value={userSteps} onChangeText={setUserSteps} />
                <TextInput style={styles.input} keyboardType="numeric" placeholder="Answer" value={userFinalAnswer} onChangeText={setUserFinalAnswer} />

                {aiFeedback.isCorrect === null ? (
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#2196F3' }]} onPress={handleCheckAnswer}><Text style={styles.buttonText}>{loading ? "Checking..." : "Submit"}</Text></TouchableOpacity>
                ) : (
                    <View style={styles.feedbackBox}>
                        <Text>{aiFeedback.message}</Text>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={handleNext}><Text style={styles.buttonText}>Next</Text></TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    fullscreenContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', zIndex: 100 },
    scrollContainer: { padding: 20 },
    button: { padding: 18, borderRadius: 12, marginVertical: 10, width: '85%', alignItems: 'center', elevation: 5 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30 },
    questionBox: { backgroundColor: '#f0f4f8', padding: 20, borderRadius: 12, marginBottom: 20 },
    questionText: { fontSize: 18 },
    textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, minHeight: 100, marginBottom: 15 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, marginBottom: 20 },
    feedbackBox: { padding: 15, borderRadius: 8, borderLeftWidth: 8, borderColor: '#4CAF50', backgroundColor: '#f9f9f9' }
});

export default AppliedMath;