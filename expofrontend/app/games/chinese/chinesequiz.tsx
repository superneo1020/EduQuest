// app/games/chinese/chinesequiz.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    BackHandler
} from 'react-native';
import { router, Stack } from 'expo-router';
import ChineseAIService, { ChineseQuestion } from '../../services/ChineseAIService';

type GameState = 'difficulty_select' | 'playing' | 'result';

const ChineseGame = () => {
    const [questions, setQuestions] = useState<ChineseQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [gameState, setGameState] = useState<GameState>('difficulty_select');
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);
    const [difficulty, setDifficulty] = useState<'beginner' | 'advanced' | null>(null);
    const [aiFeedback, setAiFeedback] = useState<string>('');

    // 處理 Android 返回鍵
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (gameState === 'result') {
                handleRestart();
                return true;
            }
            if (gameState === 'playing') {
                setGameState('difficulty_select');
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [gameState]);

    const loadQuestions = async (selectedDifficulty: 'beginner' | 'advanced') => {
        setLoading(true);
        try {
            const newQuestions = await ChineseAIService.generateQuestions({
                difficulty: selectedDifficulty,
                count: 11
            });
            setQuestions(newQuestions);
            resetGame();
            setGameState('playing');
        } catch (error) {
            console.error('Failed to load questions:', error);
            Alert.alert('Error', 'Failed to load questions. Please try again.');
            setGameState('difficulty_select');
        } finally {
            setLoading(false);
        }
    };

    const resetGame = () => {
        setCurrentIndex(0);
        setSelectedAnswers([]);
        setScore(0);
        setAiFeedback('');
    };

    const handleAnswer = (optionIndex: number) => {
        if (selectedAnswers[currentIndex] !== undefined) return;

        const newSelectedAnswers = [...selectedAnswers];
        newSelectedAnswers[currentIndex] = optionIndex;
        setSelectedAnswers(newSelectedAnswers);

        // 檢查答案是否正確並更新分數
        const isCorrect = optionIndex === questions[currentIndex].correctAnswer;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        // 判斷是否為最後一題
        const isLastQuestion = currentIndex === questions.length - 1;

        if (!isLastQuestion) {
            // 不是最後一題，延遲後進入下一題
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 500);
        } else {
            // 是最後一題，延遲後顯示結果頁面
            setTimeout(() => {
                // 計算最終分數（包括當前這一題）
                const finalScore = isCorrect ? score + 1 : score;
                generateAIFeedback(finalScore);
                setGameState('result');
            }, 500);
        }
    };

    const generateAIFeedback = (finalScore: number) => {
        const totalQuestions = questions.length;
        const percentage = (finalScore / totalQuestions) * 100;

        let feedback = '';
        if (finalScore === totalQuestions) {
            feedback = `Perfect score! You got all ${finalScore} out of ${totalQuestions} correct! 🌟🌟🌟`;
        } else if (percentage >= 90) {
            feedback = `Excellent! You got ${finalScore} out of ${totalQuestions} correct. Great job! 👍`;
        } else if (percentage >= 70) {
            feedback = `Good work! You got ${finalScore} out of ${totalQuestions} correct. Keep practicing! 💪`;
        } else if (percentage >= 50) {
            feedback = `You got ${finalScore} out of ${totalQuestions} correct. You're making progress! 📚`;
        } else {
            feedback = `You got ${finalScore} out of ${totalQuestions} correct. Don't give up, you'll do better next time! 💪✨`;
        }

        setAiFeedback(feedback);
    };

    // 返回遊戲列表
    const handleBackToGames = () => {
        router.back();
    };

    // 返回主頁
    const handleBackToHome = () => {
        router.push('/'); // 根據你的主頁路由調整
    };

    // 選擇難度並開始遊戲
    const handleSelectDifficulty = (level: 'beginner' | 'advanced') => {
        setDifficulty(level);
        loadQuestions(level);
    };

    // 重新開始（回到難度選擇）
    const handleRestart = () => {
        setDifficulty(null);
        setGameState('difficulty_select');
        resetGame();
        setQuestions([]);
    };

    // 重試（同一難度）
    const handleTryAgain = () => {
        if (difficulty) {
            loadQuestions(difficulty);
        }
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

    const renderDifficultySelect = () => {
        const totalQuestions = 11;

        return (
            <ScrollView contentContainerStyle={styles.difficultySelectContainer}>
                <Text style={styles.difficultySelectTitle}>Select Difficulty 🀄️</Text>
                <Text style={styles.difficultySelectSubtitle}>
                    Choose your Chinese learning level
                </Text>

                <TouchableOpacity
                    style={[styles.difficultySelectButton, styles.beginnerButton]}
                    onPress={() => handleSelectDifficulty('beginner')}
                >
                    <Text style={styles.difficultySelectButtonTitle}>Beginner</Text>
                    <Text style={styles.difficultySelectButtonDesc}>
                        Basic vocabulary, simple sentences, pinyin support
                    </Text>
                    <Text style={styles.questionCountText}>
                        {totalQuestions} questions per session
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.difficultySelectButton, styles.advancedButton]}
                    onPress={() => handleSelectDifficulty('advanced')}
                >
                    <Text style={styles.difficultySelectButtonTitle}>Advanced</Text>
                    <Text style={styles.difficultySelectButtonDesc}>
                        Complex characters, idioms, and cultural context
                    </Text>
                    <Text style={styles.questionCountText}>
                        {totalQuestions} questions per session
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backToGamesButton}
                    onPress={handleBackToGames}
                >
                    <Text style={styles.backToGamesButtonText}>← Back to Games</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderResult = () => {
        const totalQuestions = questions.length;
        const percentage = (score / totalQuestions) * 100;
        const correctCount = score;

        return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>🎉 Game Complete! 🎉</Text>

                    <View style={styles.scoreCircle}>
                        <Text style={styles.scorePercentage}>{Math.round(percentage)}</Text>
                        <Text style={styles.scorePercentSign}>%</Text>
                        <Text style={styles.scoreLabel}>Score</Text>
                    </View>

                    <View style={styles.scoreDetails}>
                        <Text style={styles.scoreDetailText}>
                            You got {correctCount} out of {totalQuestions} questions correct
                        </Text>
                        <Text style={styles.scoreDetailSubtext}>
                            {correctCount === totalQuestions
                                ? "Perfect! You're a Chinese master! 🌟"
                                : percentage >= 70
                                    ? "Great effort! Keep up the good work! 💪"
                                    : "Keep practicing and you'll improve! 📚"}
                        </Text>
                    </View>

                    <View style={styles.feedbackBox}>
                        <Text style={styles.feedbackTitle}>💡 AI Feedback</Text>
                        <Text style={styles.feedbackText}>{aiFeedback}</Text>
                    </View>

                    <View style={styles.resultButtonContainer}>
                        <TouchableOpacity
                            style={[styles.resultButton, styles.tryAgainResultButton]}
                            onPress={handleTryAgain}
                        >
                            <Text style={styles.resultButtonText}>🔄 Try Again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.newDifficultyButton]}
                            onPress={handleRestart}
                        >
                            <Text style={styles.resultButtonText}>🎯 New Difficulty</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.backToGamesResultButton]}
                            onPress={handleBackToGames}
                        >
                            <Text style={styles.resultButtonText}>🎮 Back to Games</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.homeButton]}
                            onPress={handleBackToHome}
                        >
                            <Text style={styles.resultButtonText}>🏠 Back to Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderPlaying = () => (
        <>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.headerBackButton}
                        onPress={handleRestart}
                    >
                        <Text style={styles.headerBackButtonText}>← Exit</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chinese Learning</Text>
                    <View style={styles.difficultyBadge}>
                        <Text style={styles.difficultyBadgeText}>
                            {difficulty === 'beginner' ? '初级' : '高级'}
                        </Text>
                    </View>
                </View>
                <View style={styles.scoreHeader}>
                    <Text style={styles.scoreHeaderText}>
                        Score: {score}/{questions.length}
                    </Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderQuestion()}
            </ScrollView>
        </>
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
            <Stack.Screen
                options={{
                    title: 'Chinese Quiz',
                    headerStyle: { backgroundColor: '#4c669f' },
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleBackToGames}>
                            <Text style={{ color: '#fff', marginLeft: 15 }}>← Back</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            {gameState === 'difficulty_select' && renderDifficultySelect()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && renderResult()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    // 難度選擇頁面樣式
    difficultySelectContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA',
        minHeight: '100%',
    },
    difficultySelectTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 10,
    },
    difficultySelectSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    difficultySelectButton: {
        width: '90%',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    beginnerButton: {
        backgroundColor: '#4A90E2',
    },
    advancedButton: {
        backgroundColor: '#E67E22',
    },
    difficultySelectButtonTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    difficultySelectButtonDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
        marginBottom: 8,
    },
    questionCountText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    backToGamesButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    backToGamesButtonText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '600',
    },
    // 遊戲頁面標題
    header: {
        backgroundColor: '#4A90E2',
        padding: 20,
        paddingTop: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    difficultyBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    difficultyBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    scoreHeader: {
        alignItems: 'center',
        marginTop: 5,
    },
    scoreHeaderText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
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
    // 結果頁面樣式
    resultContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA',
        minHeight: '100%',
    },
    resultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 30,
        textAlign: 'center',
    },
    scoreCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    scorePercentage: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    scorePercentSign: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4A90E2',
        position: 'absolute',
        top: 10,
        right: -25,
    },
    scoreLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    scoreDetails: {
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
    },
    scoreDetailText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    scoreDetailSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    feedbackBox: {
        width: '100%',
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: '#4A90E2',
    },
    feedbackTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    feedbackText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    resultButtonContainer: {
        width: '100%',
        gap: 12,
    },
    resultButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tryAgainResultButton: {
        backgroundColor: '#4A90E2',
    },
    newDifficultyButton: {
        backgroundColor: '#E67E22',
    },
    backToGamesResultButton: {
        backgroundColor: '#4CAF50',
    },
    homeButton: {
        backgroundColor: '#9C27B0',
    },
    resultButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ChineseGame;