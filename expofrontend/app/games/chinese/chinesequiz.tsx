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
    BackHandler,
    SafeAreaView
} from 'react-native';
import { router, Stack } from 'expo-router';
// 引入與 AnimalGamesIndex 相同的圖標庫
import { Languages, BookOpen, Star, Brain } from 'lucide-react-native';
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

    const difficultyOptions = [
        {
            id: 'beginner',
            level: 'beginner' as const,
            title: 'Beginner',
            badgeText: 'Easy Start',
            description: 'Basic vocabulary, simple sentences, pinyin support',
            icon: '🀄️',
            color: '#4A90E2',
            bgColor: '#E3F2FD',
            features: []
        },
        {
            id: 'advanced',
            level: 'advanced' as const,
            title: 'Advanced',
            badgeText: 'Challenge',
            description: 'Complex characters, idioms, and cultural context',
            icon: '📜',
            color: '#E67E22',
            bgColor: '#FFF3E0',
            features: []
        }
    ];

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
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* 頂部標題區域 - 仿 AnimalGamesIndex */}
                    <View style={styles.headerSection}>
                        <Languages size={60} color="#4A90E2" style={{ marginBottom: 20 }} />
                        <Text style={styles.mainTitle}>Chinese Learning</Text>
                        <Text style={styles.subTitle}>
                            Master Mandarin through AI-powered interactive quizzes!
                        </Text>
                    </View>

                    {/* 難度選擇卡片列表 - 仿 AnimalGamesIndex diffCard */}
                    <View style={styles.menuGrid}>
                        {difficultyOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.diffCard,
                                    { backgroundColor: option.bgColor, borderColor: option.color }
                                ]}
                                onPress={() => handleSelectDifficulty(option.level)}
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

                                    {/* 特色列表 */}
                                    <View style={styles.featuresList}>
                                        {option.features.map((feature, index) => (
                                            <View key={index} style={styles.featureItem}>
                                                <Star size={12} color={option.color} style={styles.featureIcon} />
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* 開始按鈕 */}
                                    <View style={styles.startButtonContainer}>
                                        <View style={[styles.startButton, { backgroundColor: option.color }]}>
                                            <Text style={styles.startButtonText}>Start Game →</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.backLink}
                        onPress={handleBackToGames}
                    >
                        <Text style={styles.backLinkText}>← Back to Game Library</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
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
                    headerShown: gameState === 'difficulty_select' ? false : true, // 難度頁面隱藏原生 Header
                    title: 'Chinese Quiz',
                    headerStyle: { backgroundColor: '#4A90E2' },
                    headerTintColor: '#fff',
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

    headerSection: {
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: '#fff',
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
        paddingHorizontal: 20,
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
    featuresList: {
        marginBottom: 15,
        gap: 6,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureIcon: {
        marginRight: 4,
    },
    featureText: {
        fontSize: 12,
        color: '#475569',
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
    },
    backLinkText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '600',
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