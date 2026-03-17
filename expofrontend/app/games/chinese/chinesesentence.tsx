// app/games/chinese/chinesesentence.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import chineseSentenceAIService, {
    ChineseSentenceResponse,
    ChineseSentenceCheckResponse
} from '../../services/chisentenceAIService';

type Question = {
    id: number;
    sentence: string;
    correctAnswer: string;
    hint?: string;
    translation?: string;
    alternatives?: string[];
    explanation?: string;
    userAnswer: string;
    isCorrect: boolean;
    feedback?: string;
    score?: number; // 0-10分
};

const TOTAL_QUESTIONS = 10; // 改為10題

export default function ChineseSentenceGame() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    // 初始化遊戲
    useEffect(() => {
        loadFirstQuestion();
    }, []);

    const loadFirstQuestion = async () => {
        setLoading(true);
        try {
            const response = await chineseSentenceAIService.generateSentence({
                currentQuestionIndex: 0,
                difficulty: 'medium'
            });

            setQuestions([{
                id: 0,
                sentence: response.sentence,
                correctAnswer: response.correctAnswer,
                hint: response.hint,
                translation: response.translation,
                alternatives: response.alternatives,
                explanation: response.explanation,
                userAnswer: '',
                isCorrect: false
            }]);
        } catch (error) {
            console.error('Failed to load first question:', error);
            Alert.alert('錯誤', '無法加載題目，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const loadNextQuestion = async () => {
        if (currentIndex + 1 >= TOTAL_QUESTIONS) {
            // 遊戲完成，顯示結果
            setGameCompleted(true);
            setShowResultModal(true);
            return;
        }

        setLoading(true);
        try {
            const response = await chineseSentenceAIService.generateSentence({
                previousAnswers: questions.map(q => ({
                    sentence: q.sentence,
                    userAnswer: q.userAnswer,
                    correctAnswer: q.correctAnswer,
                    isCorrect: q.isCorrect,
                    feedback: q.feedback
                })),
                currentQuestionIndex: currentIndex + 1,
                difficulty: getDifficultyBasedOnPerformance()
            });

            setQuestions(prev => [...prev, {
                id: currentIndex + 1,
                sentence: response.sentence,
                correctAnswer: response.correctAnswer,
                hint: response.hint,
                translation: response.translation,
                alternatives: response.alternatives,
                explanation: response.explanation,
                userAnswer: '',
                isCorrect: false
            }]);

            setCurrentIndex(prev => prev + 1);
            setInputText('');
            setShowHint(false);
            setShowFeedback(false);
        } catch (error) {
            console.error('Failed to load next question:', error);
            Alert.alert('錯誤', '無法加載下一題，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    // 根據表現調整難度
    const getDifficultyBasedOnPerformance = (): string => {
        const correctCount = questions.filter(q => q.isCorrect).length;
        if (correctCount <= 3) return 'easy';
        if (correctCount >= 7) return 'hard';
        return 'medium';
    };

    const handleSubmit = async () => {
        if (!inputText.trim()) {
            Alert.alert('提示', '請輸入答案');
            return;
        }

        const currentQuestion = questions[currentIndex];
        setSubmitting(true);

        try {
            const result = await chineseSentenceAIService.checkAnswer({
                sentence: currentQuestion.sentence,
                userAnswer: inputText.trim(),
                correctAnswer: currentQuestion.correctAnswer,
                alternatives: currentQuestion.alternatives
            });

            // 將分數轉換為10分制
            const score10 = Math.round(result.score / 10);

            // 更新當前問題的答案和正確性
            setQuestions(prev => prev.map((q, idx) =>
                idx === currentIndex
                    ? {
                        ...q,
                        userAnswer: inputText.trim(),
                        isCorrect: result.isCorrect,
                        feedback: result.feedback,
                        score: score10
                    }
                    : q
            ));

            setShowFeedback(true);

        } catch (error) {
            console.error('Failed to check answer:', error);
            Alert.alert('錯誤', '無法檢查答案，請稍後再試');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        setShowFeedback(false);
        loadNextQuestion();
    };

    const calculateScore = () => {
        const totalScore = questions.reduce((acc, q) => acc + (q.score || 0), 0);
        const correctCount = questions.filter(q => q.isCorrect).length;

        return {
            correct: correctCount,
            total: TOTAL_QUESTIONS,
            percentage: Math.round((correctCount / TOTAL_QUESTIONS) * 100),
            totalScore: totalScore // 滿分100
        };
    };

    const handleTryAgain = () => {
        setShowResultModal(false);
        // 重置遊戲
        setQuestions([]);
        setCurrentIndex(0);
        setInputText('');
        setShowHint(false);
        setGameCompleted(false);
        setShowFeedback(false);
        loadFirstQuestion();
    };

    const handleBack = () => {
        // 確保返回上一頁，即 chinese.tsx
        if (router.canGoBack()) {
            router.back();
        } else {
            // 如果不能返回，則導航到中文遊戲列表
            router.push('/games/chinese');
        }
    };

    // 簡化的評價卡片
    const renderFeedback = () => {
        if (!showFeedback) return null;

        const currentQuestion = questions[currentIndex];
        const score = currentQuestion.score || 0;

        return (
            <View style={[styles.feedbackCard, currentQuestion.isCorrect ? styles.correctCard : styles.incorrectCard]}>
                <View style={styles.feedbackRow}>
                    <Text style={styles.feedbackLabel}>得分：</Text>
                    <Text style={[styles.scoreText, score >= 8 ? styles.highScore : score >= 6 ? styles.mediumScore : styles.lowScore]}>
                        {score}/10
                    </Text>
                </View>

                {!currentQuestion.isCorrect && (
                    <View style={styles.feedbackRow}>
                        <Text style={styles.feedbackLabel}>正確答案：</Text>
                        <Text style={styles.correctAnswerText}>{currentQuestion.correctAnswer}</Text>
                    </View>
                )}

                <View style={styles.feedbackRow}>
                    <Text style={styles.feedbackLabel}>改進建議：</Text>
                    <Text style={styles.suggestionText}>{currentQuestion.feedback || '繼續加油！'}</Text>
                </View>

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentIndex + 1 >= TOTAL_QUESTIONS ? '完成' : '下一題'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderQuestion = () => {
        if (questions.length === 0) return null;

        const currentQuestion = questions[currentIndex];
        const parts = currentQuestion.sentence.split('__');

        return (
            <View style={styles.questionContainer}>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        {currentIndex + 1} / {TOTAL_QUESTIONS}
                    </Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.sentenceCard}>
                    <Text style={styles.sentenceText}>
                        {parts.map((part, index) => (
                            <React.Fragment key={index}>
                                <Text>{part}</Text>
                                {index < parts.length - 1 && (
                                    <Text style={styles.blankSpace}>_____</Text>
                                )}
                            </React.Fragment>
                        ))}
                    </Text>

                    {currentQuestion.translation && (
                        <Text style={styles.translationText}>
                            {currentQuestion.translation}
                        </Text>
                    )}
                </View>

                {!showFeedback && (
                    <>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="請輸入答案"
                                placeholderTextColor="#999"
                                editable={!submitting && !loading}
                            />

                            <TouchableOpacity
                                style={styles.hintButton}
                                onPress={() => setShowHint(!showHint)}
                            >
                                <Ionicons name="help-circle-outline" size={24} color="#4CAF50" />
                            </TouchableOpacity>
                        </View>

                        {showHint && currentQuestion.hint && (
                            <View style={styles.hintContainer}>
                                <Text style={styles.hintText}>💡 {currentQuestion.hint}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.submitButton, (!inputText.trim() || submitting || loading) && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={!inputText.trim() || submitting || loading}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>提交答案</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                {renderFeedback()}
            </View>
        );
    };

    const renderResultModal = () => {
        const score = calculateScore();

        return (
            <Modal
                visible={showResultModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowResultModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowResultModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>遊戲結果</Text>

                            <View style={styles.scoreContainer}>
                                <Text style={styles.totalScoreText}>
                                    {score.totalScore}/100
                                </Text>
                                <Text style={styles.correctCountText}>
                                    答對 {score.correct}/{score.total} 題
                                </Text>
                            </View>

                            <View style={styles.summaryContainer}>
                                <Text style={styles.summaryTitle}>答題摘要：</Text>
                                {questions.map((q, index) => (
                                    <View key={index} style={styles.summaryItem}>
                                        <Text style={styles.summaryNumber}>{index + 1}.</Text>
                                        <Text style={styles.summaryAnswer}>
                                            {q.userAnswer || '未答'}
                                        </Text>
                                        <Text style={[
                                            styles.summaryScore,
                                            q.isCorrect ? styles.correctScore : styles.incorrectScore
                                        ]}>
                                            {q.score || 0}/10
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.tryAgainButton]}
                                    onPress={handleTryAgain}
                                >
                                    <Text style={styles.tryAgainButtonText}>Try Again</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.backButton]}
                                    onPress={handleBack}
                                >
                                    <Text style={styles.backButtonText}>Back</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading && questions.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>AI 正在生成題目...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>中文填字遊戲</Text>
                <View style={styles.headerButton} />
            </View>

            {renderQuestion()}
            {renderResultModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    questionContainer: {
        flex: 1,
        padding: 20,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        textAlign: 'right',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    sentenceCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sentenceText: {
        fontSize: 24,
        lineHeight: 36,
        color: '#333',
        textAlign: 'center',
    },
    blankSpace: {
        fontSize: 24,
        color: '#4CAF50',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    translationText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    input: {
        flex: 1,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10,
    },
    hintButton: {
        width: 50,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    hintContainer: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
    },
    hintText: {
        fontSize: 15,
        color: '#2E7D32',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    // 簡化的評價卡片樣式
    feedbackCard: {
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    correctCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    incorrectCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
    },
    feedbackRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    feedbackLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        width: 80,
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    highScore: {
        color: '#4CAF50',
    },
    mediumScore: {
        color: '#FF9800',
    },
    lowScore: {
        color: '#f44336',
    },
    correctAnswerText: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: '600',
        flex: 1,
    },
    suggestionText: {
        fontSize: 16,
        color: '#666',
        flex: 1,
        lineHeight: 22,
    },
    nextButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // 模態框樣式
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
    },
    closeButton: {
        position: 'absolute',
        right: 15,
        top: 15,
        zIndex: 1,
        padding: 5,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
    },
    totalScoreText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    correctCountText: {
        fontSize: 18,
        color: '#666',
        marginTop: 5,
    },
    summaryContainer: {
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    summaryNumber: {
        width: 30,
        fontSize: 14,
        color: '#666',
    },
    summaryAnswer: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    summaryScore: {
        width: 50,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
    },
    correctScore: {
        color: '#4CAF50',
    },
    incorrectScore: {
        color: '#f44336',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    tryAgainButton: {
        backgroundColor: '#4CAF50',
    },
    tryAgainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        backgroundColor: '#f0f0f0',
    },
    backButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
});