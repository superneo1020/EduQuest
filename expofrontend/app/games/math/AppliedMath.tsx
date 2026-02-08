import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';

const MAX_STEPS = 10;

const AppliedMath = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [userSteps, setUserSteps] = useState('');
    const [userFinalAnswer, setUserFinalAnswer] = useState('');

    const [currentStep, setCurrentStep] = useState(1);
    const [sessionHistory, setSessionHistory] = useState<any[]>([]);
    const [aiFeedback, setAiFeedback] = useState({ isCorrect: null as boolean | null, message: '' });
    const [isFinished, setIsFinished] = useState(false);
    const [finalReport, setFinalReport] = useState({ summary: '', accuracy: 0 });

    const fetchQuestion = async () => {
        setLoading(true);
        setAiFeedback({ isCorrect: null, message: '' });
        setUserFinalAnswer('');
        setUserSteps('');
        try {
            const res = await axios.get(`http://localhost:8000/api/math/generate?t=${Date.now()}`);
            setData(res.data);
        } catch (e) { console.error("Fetch error", e); }
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
            const { is_correct, feedback } = res.data;
            setAiFeedback({ isCorrect: is_correct, message: feedback });
            setSessionHistory(prev => [...prev, { question: data.question, user_answer: userFinalAnswer, is_correct: is_correct }]);
        } catch (e) { setAiFeedback({ isCorrect: false, message: "Server Error" }); }
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
            const res = await axios.post('http://localhost:8000/api/math/final_report', { history: sessionHistory });
            setFinalReport(res.data);
            setIsFinished(true);
        } catch (e) { setIsFinished(true); }
        setLoading(false);
    };

    if (isFinished) {
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Session Report 🎓</Text>
                <View style={styles.reportBox}>
                    <Text style={styles.accuracyText}>Accuracy: {finalReport.accuracy.toFixed(0)}%</Text>
                    <Text style={styles.summaryText}>{finalReport.summary}</Text>
                </View>
                <Button title="Restart Practice" onPress={() => {
                    setCurrentStep(1); setSessionHistory([]); setIsFinished(false); fetchQuestion();
                }} />
            </ScrollView>
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
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 }
});

export default AppliedMath;