// app/games/chinese/chinesesentence.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, Star, Languages, BookOpen } from 'lucide-react-native';
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

type Difficulty = 'easy' | 'medium' | null;
type GameState = 'difficulty_select' | 'playing' | 'result';

const TOTAL_QUESTIONS = 10;

const difficultyOptions = [
    {
        id: 'easy',
        title: 'Easy',
        level: 'beginner',
        description: 'Common vocabulary and basic sentence patterns for beginners.',
        icon: '🌱',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        features: []
    },
    {
        id: 'medium',
        title: 'Medium',
        level: 'advanced',
        description: 'Standard daily language and more complex sentence structures.',
        icon: '🌳',
        color: '#FF9800',
        bgColor: '#FFF3E0',
        features: []
    }
];

export default function ChineseSentenceGame() {
    const router = useRouter();

    // 難度選擇狀態
    const [difficulty, setDifficulty] = useState<Difficulty>(null);
    const [gameState, setGameState] = useState<GameState>('difficulty_select');

    // 遊戲狀態
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [aiFeedback, setAiFeedback] = useState('');

    // 初始化遊戲（當難度選擇後）
    const startGame = (selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        setGameState('playing');
        setLoading(true);
        setQuestions([]);
        setCurrentIndex(0);
        setInputText('');
        setShowHint(false);
        setShowFeedback(false);
        loadFirstQuestion(selectedDifficulty);
    };

    const loadFirstQuestion = async (selectedDifficulty: Difficulty) => {
        setLoading(true);
        try {
            const response = await chineseSentenceAIService.generateSentence({
                currentQuestionIndex: 0,
                difficulty: selectedDifficulty || 'medium'
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
            // 遊戲完成，顯示結果頁面
            generateFinalFeedback();
            setGameState('result');
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
                difficulty: difficulty || 'medium'
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

    const generateFinalFeedback = () => {
        const score = calculateScore();
        const percentage = score.percentage;

        let feedback = '';
        if (score.correct === TOTAL_QUESTIONS) {
            feedback = `Perfect score! You got all ${score.correct} out of ${TOTAL_QUESTIONS} correct! 🌟🌟🌟`;
        } else if (percentage >= 90) {
            feedback = `Excellent! You got ${score.correct} out of ${TOTAL_QUESTIONS} correct. Great job! 👍`;
        } else if (percentage >= 70) {
            feedback = `Good work! You got ${score.correct} out of ${TOTAL_QUESTIONS} correct. Keep practicing! 💪`;
        } else if (percentage >= 50) {
            feedback = `You got ${score.correct} out of ${TOTAL_QUESTIONS} correct. You're making progress! 📚`;
        } else {
            feedback = `You got ${score.correct} out of ${TOTAL_QUESTIONS} correct. Don't give up, you'll do better next time! 💪✨`;
        }

        setAiFeedback(feedback);
    };

    // 返回難度選擇頁面
    const handleNewDifficulty = () => {
        setGameState('difficulty_select');
        setDifficulty(null);
        setQuestions([]);
        setCurrentIndex(0);
        setInputText('');
        setShowHint(false);
        setShowFeedback(false);
    };

    // 重新開始同一難度
    const handleTryAgain = () => {
        if (difficulty) {
            startGame(difficulty);
        }
    };

    // 返回遊戲列表
    const handleBackToGames = () => {
        router.back(); // 使用 back() 方法
    };

    // 返回主頁
    const handleBackToHome = () => {
        router.push('/');
    };

    const handleBack = () => {
        if (gameState === 'difficulty_select') {
            // 如果在難度選擇頁面，返回上一頁
            if (router.canGoBack()) {
                router.back();
            } else {
                router.push('/games/chinese/chinese');
            }
        } else if (gameState === 'playing') {
            // 如果在遊戲中，詢問是否退出
            Alert.alert(
                '退出遊戲',
                '確定要退出嗎？進度將不會保存。',
                [
                    { text: '取消', style: 'cancel' },
                    {
                        text: '退出',
                        style: 'destructive',
                        onPress: () => {
                            setGameState('difficulty_select');
                            setDifficulty(null);
                            setQuestions([]);
                            setCurrentIndex(0);
                        }
                    }
                ]
            );
        } else if (gameState === 'result') {
            // 如果在結果頁面，返回難度選擇
            handleNewDifficulty();
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

    // 難度選擇頁面
    const renderDifficultySelector = () => {
        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 仿照 AnimalGamesIndex 的頭部區域[cite: 3] */}
                <View style={styles.headerSection}>
                    <Languages size={60} color="#4CAF50" style={{ marginBottom: 20 }} />
                    <Text style={styles.mainTitle}>Chinese Sentence Quiz</Text>
                    <Text style={styles.subTitle}>
                        Master Mandarin sentence structures through interactive filling!
                    </Text>
                </View>

                {/* 難度選擇網格[cite: 3] */}
                <View style={styles.menuGrid}>
                    {difficultyOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.diffCard,
                                { backgroundColor: option.bgColor, borderColor: option.color }
                            ]}
                            onPress={() => startGame(option.id as Difficulty)}
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
                                        <Text style={styles.levelBadgeText}>
                                            {option.level === 'beginner' ? 'Easy Start' : 'Challenge'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.diffDesc}>{option.description}</Text>

                                {/* 特色功能列表[cite: 3] */}
                                <View style={styles.featuresList}>
                                    {option.features.map((feature, index) => (
                                        <View key={index} style={styles.featureItem}>
                                            <Star size={12} color={option.color} style={styles.featureIcon} />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* 開始按鈕[cite: 3] */}
                                <View style={styles.startButtonContainer}>
                                    <View style={[styles.startButton, { backgroundColor: option.color }]}>
                                        <Text style={styles.startButtonText}>
                                            Start Quiz →
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        );
    };

    // 結果頁面
    const renderResult = () => {
        const score = calculateScore();

        return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>📊 遊戲結果</Text>

                    <View style={styles.scoreCircle}>
                        <Text style={styles.scorePercentage}>{score.totalScore}</Text>
                        <Text style={styles.scorePercentSign}>/100</Text>
                        <Text style={styles.scoreLabel}>總分</Text>
                    </View>

                    <View style={styles.scoreDetails}>
                        <Text style={styles.scoreDetailText}>
                            答對 {score.correct} / {score.total} 題
                        </Text>
                        <View style={styles.percentageBadge}>
                            <Text style={styles.percentageText}>
                                正確率 {score.percentage}%
                            </Text>
                        </View>
                    </View>

                    <View style={styles.feedbackBox}>
                        <Text style={styles.feedbackTitle}>💡 AI 學習建議</Text>
                        <Text style={styles.feedbackText}>{aiFeedback}</Text>
                    </View>

                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>📝 答題摘要：</Text>
                        {questions.map((q, index) => (
                            <View key={index} style={styles.summaryItem}>
                                <Text style={styles.summaryNumber}>{index + 1}.</Text>
                                <Text style={styles.summaryAnswer} numberOfLines={1}>
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

                    <View style={styles.resultButtonContainer}>
                        <TouchableOpacity
                            style={[styles.resultButton, styles.tryAgainButton]}
                            onPress={handleTryAgain}
                        >
                            <Text style={styles.resultButtonText}>🔄 Try Again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.newDifficultyButton]}
                            onPress={handleNewDifficulty}
                        >
                            <Text style={styles.resultButtonText}>🎯 New Difficulty</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.backToGamesButton]}
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

    // 加載中畫面
    if (loading && questions.length === 0 && gameState === 'playing') {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>AI 正在生成題目...</Text>
            </View>
        );
    }

    // 遊戲主畫面
    if (gameState === 'playing') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        中文填空 - {difficulty === 'easy' ? '簡單' : '中等'}
                    </Text>
                    <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>
                            {questions.filter(q => q.isCorrect).length}/{TOTAL_QUESTIONS}
                        </Text>
                    </View>
                </View>

                {renderQuestion()}
            </SafeAreaView>
        );
    }

    if (gameState === 'result') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>遊戲結果</Text>
                    <View style={styles.headerButton} />
                </View>
                {renderResult()}
            </SafeAreaView>
        );
    }

    // 難度選擇畫面
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>中文填空遊戲</Text>
                <View style={styles.headerButton} />
            </View>
            {renderDifficultySelector()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    buttonSpacing: {
        width: '85%',
        marginVertical: 12,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 40,
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
        marginBottom: 30,
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
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20, // 額外增加間距
    },
    cardIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
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
        gap: 8,
    },
    diffBtnText: {
        fontSize: 18,
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
    scoreBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    scoreBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
    // 結果頁面樣式
    resultContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
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
        color: '#4CAF50',
        marginBottom: 30,
        textAlign: 'center',
    },
    scoreCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        flexDirection: 'row',
    },
    scorePercentage: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    scorePercentSign: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginLeft: 5,
    },
    scoreLabel: {
        fontSize: 16,
        color: '#666',
        marginLeft: 10,
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
    percentageBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    percentageText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    feedbackBox: {
        width: '100%',
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
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
    summaryContainer: {
        width: '100%',
        marginBottom: 30,
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
    tryAgainButton: {
        backgroundColor: '#4CAF50',
    },
    newDifficultyButton: {
        backgroundColor: '#FF9800',
    },
    backToGamesButton: {
        backgroundColor: '#2196F3',
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