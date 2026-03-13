// app/games/chinese/chinesequiz.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    ActivityIndicator,
    Alert,
    BackHandler
} from 'react-native';
import { router, Stack } from 'expo-router';
import ChineseAIService, { ChineseQuestion } from '../../services/ChineseAIService';

type GameState = 'playing' | 'result';

// 滿分常量
const TOTAL_SCORE = 100;

const ChineseGame = () => {
    const [questions, setQuestions] = useState<ChineseQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [gameState, setGameState] = useState<GameState>('playing');
    const [score, setScore] = useState(0); // 答對題數
    const [totalScore, setTotalScore] = useState(0); // 100分制的總分
    const [loading, setLoading] = useState(true);
    const [difficulty, setDifficulty] = useState<'beginner' | 'advanced'>('beginner');
    const [aiFeedback, setAiFeedback] = useState('');

    useEffect(() => {
        loadQuestions();
    }, [difficulty]);

    // 處理 Android 返回鍵
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (gameState === 'result') {
                setGameState('playing');
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [gameState]);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const newQuestions = await ChineseAIService.generateQuestions({
                difficulty: difficulty,
                count: 11
            });
            setQuestions(newQuestions);
            resetGame();
        } catch (error) {
            console.error('Failed to load questions:', error);
            Alert.alert('Error', 'Failed to load questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetGame = () => {
        setCurrentIndex(0);
        setSelectedAnswers([]);
        setGameState('playing');
        setScore(0);
        setTotalScore(0);
        setAiFeedback('');
    };

    // 計算100分制分數
    const calculateTotalScore = (correctCount: number) => {
        return Math.round((correctCount / questions.length) * TOTAL_SCORE);
    };

    const handleAnswer = (optionIndex: number) => {
        if (selectedAnswers[currentIndex] !== undefined) return;

        const newSelectedAnswers = [...selectedAnswers];
        newSelectedAnswers[currentIndex] = optionIndex;
        setSelectedAnswers(newSelectedAnswers);

        if (optionIndex === questions[currentIndex].correctAnswer) {
            const newScore = score + 1;
            setScore(newScore);
        }

        if (currentIndex < questions.length - 1) {
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 500);
        } else {
            // 遊戲結束時計算總分
            const finalCorrectCount = optionIndex === questions[currentIndex].correctAnswer ? score + 1 : score;
            const finalTotalScore = calculateTotalScore(finalCorrectCount);
            setTotalScore(finalTotalScore);

            setTimeout(() => {
                setGameState('result');
                generateAIFeedback(finalCorrectCount, finalTotalScore);
            }, 500);
        }
    };

    const generateAIFeedback = (correctCount: number, finalTotalScore: number) => {
        let feedback = '';
        if (correctCount === questions.length) {
            feedback = `Perfect! You got all ${correctCount} out of ${questions.length} correct! Your score: ${finalTotalScore}/${TOTAL_SCORE}! Excellent work! 🌟`;
        } else if (correctCount >= questions.length - 1) {
            feedback = `You got ${correctCount} out of ${questions.length} correct. Score: ${finalTotalScore}/${TOTAL_SCORE}. Great job! 👍`;
        } else if (correctCount >= questions.length / 2) {
            feedback = `You got ${correctCount} out of ${questions.length} correct. Score: ${finalTotalScore}/${TOTAL_SCORE}. Good effort, keep practicing! 💪`;
        } else {
            feedback = `You got ${correctCount} out of ${questions.length} correct. Score: ${finalTotalScore}/${TOTAL_SCORE}. Don't give up, you can do better! 📚`;
        }

        setAiFeedback(feedback);
    };

    // 返回上一頁（遊戲列表）
    const handleBack = () => {
        router.back();
    };

    // 關閉彈窗（X 按鈕）
    const handleCloseModal = () => {
        setGameState('playing');
    };

    // 重新開始（Try Again 按鈕）
    const handleTryAgain = () => {
        loadQuestions();
    };

    const renderQuestion = () => {
        if (questions.length === 0) return null;
        const question = questions[currentIndex];

        return (
            <View style={styles.questionContainer}>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        Question {currentIndex + 1} of {questions.length}
                    </Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${((currentIndex + 1) / questions.length) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                <Text style={styles.questionText}>{question.question}</Text>

                <View style={styles.optionsContainer}>
                    {question.options.map((option, index) => {
                        const isSelected = selectedAnswers[currentIndex] === index;
                        const isCorrect = index === question.correctAnswer;
                        const showResult = selectedAnswers[currentIndex] !== undefined;

                        let optionStyle = styles.optionButton;
                        if (showResult) {
                            if (isCorrect) {
                                optionStyle = styles.correctOption;
                            } else if (isSelected && !isCorrect) {
                                optionStyle = styles.wrongOption;
                            }
                        } else if (isSelected) {
                            optionStyle = styles.selectedOption;
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                style={optionStyle}
                                onPress={() => handleAnswer(index)}
                                disabled={selectedAnswers[currentIndex] !== undefined}
                            >
                                <Text style={styles.optionText}>
                                    {String.fromCharCode(65 + index)}. {option}
                                    {showResult && isCorrect && question.pinyin && (
                                        <Text style={styles.pinyinInline}> ({question.pinyin})</Text>
                                    )}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {selectedAnswers[currentIndex] !== undefined && (
                    <View style={styles.explanationContainer}>
                        <Text style={styles.explanationText}>
                            {question.explanation}
                        </Text>
                        {question.pinyin && (
                            <Text style={styles.pinyinText}>
                                Pronunciation: {question.pinyin}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderResult = () => {
        const correctCount = score;

        return (
            <Modal
                visible={gameState === 'result'}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* 右上角 X 按鈕 */}
                        <TouchableOpacity
                            style={styles.closeButtonTop}
                            onPress={handleCloseModal}
                        >
                            <Text style={styles.closeButtonTopText}>✕</Text>
                        </TouchableOpacity>

                        <Text style={styles.resultTitle}>Game Complete!</Text>

                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreLabel}>Your Score</Text>
                            {/* 顯示100分制分數 */}
                            <Text style={styles.scoreValue}>{totalScore}</Text>
                            <Text style={styles.scoreDetail}>
                                {totalScore}/{TOTAL_SCORE} ({correctCount} out of {questions.length} correct)
                            </Text>
                        </View>

                        <View style={styles.feedbackContainer}>
                            <Text style={styles.feedbackTitle}>AI Feedback</Text>
                            <Text style={styles.feedbackText}>{aiFeedback}</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.tryAgainButton]}
                                onPress={handleTryAgain}
                            >
                                <Text style={styles.buttonText}>Try Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.backButton]}
                                onPress={handleBack}
                            >
                                <Text style={styles.buttonText}>Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity
                    style={styles.headerBackButton}
                    onPress={handleBack}
                >
                    <Text style={styles.headerBackButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chinese Learning</Text>
                <View style={styles.placeholder} />
            </View>
            <View style={styles.difficultyContainer}>
                {['beginner', 'advanced'].map((level) => (
                    <TouchableOpacity
                        key={level}
                        style={[
                            styles.difficultyButton,
                            difficulty === level && styles.activeDifficulty
                        ]}
                        onPress={() => setDifficulty(level as 'beginner' | 'advanced')}
                    >
                        <Text style={[
                            styles.difficultyText,
                            difficulty === level && styles.activeDifficultyText
                        ]}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Generating questions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 設置 Stack 標題 */}
            <Stack.Screen
                options={{
                    title: 'Chinese Quiz',
                    headerStyle: { backgroundColor: '#4c669f' },
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleBack}>
                            <Text style={{ color: '#fff', marginLeft: 15 }}>← Back</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderQuestion()}
            </ScrollView>
            {renderResult()}
        </View>
    );
};

// 樣式保持不變
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        backgroundColor: '#4A90E2',
        padding: 20,
        paddingTop: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    headerBackButton: {
        padding: 10,
        marginLeft: -10,
    },
    headerBackButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    placeholder: {
        width: 50,
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    difficultyButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    activeDifficulty: {
        backgroundColor: '#FFFFFF',
    },
    difficultyText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    activeDifficultyText: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    questionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4A90E2',
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        lineHeight: 28,
    },
    optionsContainer: {
        marginTop: 10,
    },
    optionButton: {
        backgroundColor: '#F5F7FA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectedOption: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
        borderWidth: 2,
    },
    correctOption: {
        backgroundColor: '#C8E6C9',
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    wrongOption: {
        backgroundColor: '#FFCDD2',
        borderColor: '#F44336',
        borderWidth: 2,
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    pinyinInline: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    explanationContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FFF9C4',
        borderRadius: 10,
    },
    explanationText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    pinyinText: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
        fontStyle: 'italic',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        position: 'relative',
    },
    closeButtonTop: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    closeButtonTopText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 20,
        marginTop: 10,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    scoreLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    scoreDetail: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
    feedbackContainer: {
        width: '100%',
        backgroundColor: '#F5F7FA',
        borderRadius: 10,
        padding: 15,
        marginBottom: 30,
    },
    feedbackTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    feedbackText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        gap: 10,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        flex: 1,
        alignItems: 'center',
    },
    tryAgainButton: {
        backgroundColor: '#4A90E2',
    },
    backButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ChineseGame;