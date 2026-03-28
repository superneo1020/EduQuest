// english/sentencereordergame.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ReorderService, { ReorderQuestion } from '../../services/reorderService';

const { width } = Dimensions.get('window');

// 难度级别配置 - 只保留 Easy 和 Medium
const DIFFICULTY_LEVELS = {
    easy: { label: 'Easy', color: '#4CAF50', questionsPerGame: 5, desc: 'Simple 3-4 word sentences', hint: 'Short sentences • Basic word order' },
    medium: { label: 'Medium', color: '#FF9800', questionsPerGame: 5, desc: 'Common 4-5 word phrases', hint: 'Moderate length • Common phrases' }
};

type Difficulty = 'easy' | 'medium';

interface WordItem {
    id: string;
    text: string;
    originalIndex: number;
    currentIndex: number;
}

interface GameState {
    currentQuestion: number;
    score: number;
    words: WordItem[];
    feedback: string;
    isChecking: boolean;
    correctAnswers: number;
    wrongAnswers: number;
    questions: ReorderQuestion[];
    isLoading: boolean;
    difficulty: Difficulty | null;
    gameStarted: boolean;
    gameFinished: boolean;
}

export default function SentenceReorderScreen() {
    // 游戏状态
    const [gameState, setGameState] = useState<GameState>({
        currentQuestion: 0,
        score: 0,
        words: [],
        feedback: '',
        isChecking: false,
        correctAnswers: 0,
        wrongAnswers: 0,
        questions: [],
        isLoading: false,
        difficulty: null,
        gameStarted: false,
        gameFinished: false
    });

    const currentQuestion = gameState.questions[gameState.currentQuestion];

    // 初始化游戏 - 生成题目
    const initializeGame = useCallback(async (difficulty: Difficulty) => {
        setGameState(prev => ({
            ...prev,
            isLoading: true,
            difficulty: difficulty,
            gameStarted: true,
            gameFinished: false
        }));

        try {
            // 检查 AI 是否可用
            const aiAvailable = await ReorderService.isAIAvailable();
            console.log('AI available:', aiAvailable);

            // 生成题目
            const questionsCount = DIFFICULTY_LEVELS[difficulty].questionsPerGame;
            let generatedQuestions: ReorderQuestion[];

            if (aiAvailable) {
                // 使用 AI 生成题目
                console.log('Generating questions with AI...');
                generatedQuestions = await ReorderService.generateQuestions(difficulty, questionsCount);
                console.log(`Generated ${generatedQuestions.length} questions`);
            } else {
                // 使用备用题目
                console.log('Using fallback questions...');
                generatedQuestions = [];
                for (let i = 0; i < questionsCount; i++) {
                    generatedQuestions.push(ReorderService.getFallbackQuestion(difficulty, i));
                }
            }

            setGameState(prev => ({
                ...prev,
                questions: generatedQuestions,
                currentQuestion: 0,
                score: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                isLoading: false
            }));

            // 初始化第一题
            if (generatedQuestions.length > 0) {
                initializeQuestion(generatedQuestions[0]);
            }

        } catch (error) {
            console.error('Failed to initialize game:', error);
            Alert.alert('Error', 'Failed to generate questions. Using fallback questions.');

            // 使用备用题目
            const questionsCount = DIFFICULTY_LEVELS[difficulty].questionsPerGame;
            const fallbackQuestions: ReorderQuestion[] = [];
            for (let i = 0; i < questionsCount; i++) {
                fallbackQuestions.push(ReorderService.getFallbackQuestion(difficulty, i));
            }

            setGameState(prev => ({
                ...prev,
                questions: fallbackQuestions,
                isLoading: false
            }));

            if (fallbackQuestions.length > 0) {
                initializeQuestion(fallbackQuestions[0]);
            }
        }
    }, []);

    // 初始化当前题目
    const initializeQuestion = (question: ReorderQuestion) => {
        // 打乱单词顺序
        const shuffled = ReorderService.shuffleWords(question.words);

        const words: WordItem[] = shuffled.map((item, newIndex) => ({
            id: `${item.originalIndex}-${Date.now()}-${Math.random()}`,
            text: item.word,
            originalIndex: item.originalIndex,
            currentIndex: newIndex
        }));

        setGameState(prev => ({
            ...prev,
            words: words,
            feedback: '',
            isChecking: false
        }));
    };

    // 向左移动单词
    const moveLeft = (wordId: string) => {
        if (gameState.isChecking) return;

        const currentWords = [...gameState.words];
        const index = currentWords.findIndex(w => w.id === wordId);

        if (index > 0) {
            const temp = currentWords[index];
            currentWords[index] = currentWords[index - 1];
            currentWords[index - 1] = temp;

            const updatedWords = currentWords.map((word, idx) => ({
                ...word,
                currentIndex: idx
            }));

            setGameState(prev => ({
                ...prev,
                words: updatedWords
            }));
        }
    };

    // 检查答案
    const checkAnswer = () => {
        if (gameState.isChecking) return;

        setGameState(prev => ({ ...prev, isChecking: true }));

        // 获取当前顺序
        const currentOrder = [...gameState.words]
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map(word => word.originalIndex);

        // 检查是否正确（顺序应为 0,1,2,3...）
        const isCorrect = ReorderService.checkAnswer(currentOrder);

        const currentSentence = gameState.words
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map(word => word.text)
            .join(' ');

        const originalSentence = currentQuestion.sentence;

        setTimeout(() => {
            if (isCorrect) {
                const pointsEarned = 20; // 每题20分，满分100分（5题）
                const newScore = gameState.score + pointsEarned;
                const newCorrectAnswers = gameState.correctAnswers + 1;

                setGameState(prev => ({
                    ...prev,
                    score: newScore,
                    correctAnswers: newCorrectAnswers,
                    feedback: `✅ Correct! +${pointsEarned} points`,
                    isChecking: false
                }));
            } else {
                setGameState(prev => ({
                    ...prev,
                    wrongAnswers: prev.wrongAnswers + 1,
                    isChecking: false,
                    feedback: `❌ Incorrect\nCorrect: "${originalSentence}"`
                }));
            }
        }, 500);
    };

    // 下一题
    const nextQuestion = () => {
        if (gameState.currentQuestion < gameState.questions.length - 1) {
            setGameState(prev => ({
                ...prev,
                currentQuestion: prev.currentQuestion + 1,
                feedback: ''
            }));
            initializeQuestion(gameState.questions[gameState.currentQuestion + 1]);
        } else {
            // 游戏完成
            setGameState(prev => ({
                ...prev,
                gameFinished: true
            }));
        }
    };

    // 重来当前题目
    const retryQuestion = () => {
        initializeQuestion(currentQuestion);
    };

    // 重新开始游戏
    const restartGame = () => {
        if (gameState.difficulty) {
            initializeGame(gameState.difficulty);
        } else {
            setGameState({
                currentQuestion: 0,
                score: 0,
                words: [],
                feedback: '',
                isChecking: false,
                correctAnswers: 0,
                wrongAnswers: 0,
                questions: [],
                isLoading: false,
                difficulty: null,
                gameStarted: false,
                gameFinished: false
            });
        }
    };

    // 返回上一页（难度选择）
    const backToDifficulty = () => {
        setGameState(prev => ({
            ...prev,
            gameStarted: false,
            gameFinished: false,
            difficulty: null,
            questions: []
        }));
    };

    // 返回主页
    const goToHome = () => {
        router.back();
    };

    // 计算正确率
    const getAccuracy = () => {
        const totalAnswered = gameState.correctAnswers + gameState.wrongAnswers;
        if (totalAnswered === 0) return 0;
        return Math.round((gameState.correctAnswers / totalAnswered) * 100);
    };

    // 计算满分百分比（满分100分）
    const getScorePercentage = () => {
        const maxScore = DIFFICULTY_LEVELS[gameState.difficulty as Difficulty]?.questionsPerGame * 20 || 100;
        return Math.round((gameState.score / maxScore) * 100);
    };

    // 获取得分颜色
    const getScoreColor = () => {
        const percentage = getScorePercentage();
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 60) return '#FF9800';
        return '#F44336';
    };

    // 获取进度百分比
    const getProgress = () => {
        if (gameState.questions.length === 0) return 0;
        return ((gameState.currentQuestion + 1) / gameState.questions.length) * 100;
    };

    // 渲染单词卡片
    const renderWordCard = (word: WordItem, index: number) => {
        return (
            <TouchableOpacity
                key={word.id}
                style={styles.wordCard}
                onPress={() => moveLeft(word.id)}
                activeOpacity={0.7}
                disabled={gameState.isChecking}
            >
                <Text style={styles.wordText}>{word.text}</Text>
                {index > 0 && (
                    <View style={styles.moveHint}>
                        <Ionicons name="arrow-back" size={12} color="rgba(255,255,255,0.7)" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // 难度选择页面 - 采用 writing.tsx 风格
    const renderDifficultySelector = () => (
        <ScrollView
            style={styles.difficultyScroll}
            contentContainerStyle={styles.difficultyScrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.difficultyContainer}>
                <Text style={styles.difficultyTitle}>Sentence Reorder</Text>
                <Text style={styles.difficultySubtitle}>Arrange words to form correct sentences</Text>

                <View style={styles.difficultyOptions}>
                    {(Object.keys(DIFFICULTY_LEVELS) as Difficulty[]).map((level) => {
                        const config = DIFFICULTY_LEVELS[level];
                        return (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.difficultyCard,
                                    { borderColor: config.color }
                                ]}
                                onPress={() => initializeGame(level)}
                            >
                                <View style={[styles.difficultyBadge, { backgroundColor: config.color }]}>
                                    <Text style={styles.difficultyBadgeText}>{config.label}</Text>
                                </View>
                                <Text style={styles.difficultyDescription}>
                                    {config.desc}
                                </Text>
                                <Text style={styles.difficultyHint}>
                                    {config.hint}
                                </Text>
                                <Text style={styles.difficultyPoints}>
                                    {config.questionsPerGame} questions • 20 points each
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.backToHomeButton} onPress={goToHome}>
                    <Ionicons name="home" size={20} color="#666" />
                    <Text style={styles.backToHomeText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // 游戏完成页面
    const renderCompletionScreen = () => {
        const maxScore = DIFFICULTY_LEVELS[gameState.difficulty as Difficulty]?.questionsPerGame * 20 || 100;
        const scorePercentage = getScorePercentage();

        let performanceMessage = '';
        if (scorePercentage >= 80) performanceMessage = 'Excellent! 🎉';
        else if (scorePercentage >= 60) performanceMessage = 'Good job! 👍';
        else if (scorePercentage >= 40) performanceMessage = 'Keep practicing! 💪';
        else performanceMessage = 'Try again! You can do it! 🌟';

        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.completionContainer}>
                <LinearGradient
                    colors={['#4b6cb7', '#182848']}
                    style={styles.completionHeader}
                >
                    <Text style={styles.completionTitle}>Game Completed! 🎉</Text>
                    <Text style={styles.completionSubtitle}>{performanceMessage}</Text>
                </LinearGradient>

                {/* 分数圆环 */}
                <View style={styles.scoreCircle}>
                    <Text style={[styles.scoreNumber, { color: getScoreColor() }]}>
                        {gameState.score}
                    </Text>
                    <Text style={styles.scoreMax}>/ {maxScore}</Text>
                    <Text style={styles.scoreLabel}>Final Score</Text>
                </View>

                {/* 详细统计 */}
                <View style={styles.statsCard}>
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                            <Text style={styles.statNumber}>{gameState.correctAnswers}</Text>
                            <Text style={styles.statLabel}>Correct</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="close-circle" size={32} color="#F44336" />
                            <Text style={styles.statNumber}>{gameState.wrongAnswers}</Text>
                            <Text style={styles.statLabel}>Incorrect</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="stats-chart" size={32} color="#4b6cb7" />
                            <Text style={styles.statNumber}>{getAccuracy()}%</Text>
                            <Text style={styles.statLabel}>Accuracy</Text>
                        </View>
                    </View>
                </View>

                {/* 每题详情 */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>📊 Question Summary</Text>
                    {gameState.questions.map((q, idx) => {
                        const status = idx < gameState.correctAnswers ? 'correct' :
                            idx < gameState.correctAnswers + gameState.wrongAnswers ? 'wrong' : 'unanswered';
                        return (
                            <View key={idx} style={styles.detailRow}>
                                <View style={[styles.detailStatus, {
                                    backgroundColor: status === 'correct' ? '#4CAF50' :
                                        status === 'wrong' ? '#F44336' : '#E0E0E0'
                                }]}>
                                    {status === 'correct' && <Ionicons name="checkmark" size={16} color="white" />}
                                    {status === 'wrong' && <Ionicons name="close" size={16} color="white" />}
                                    {status === 'unanswered' && <Text style={styles.detailNumber}>{idx + 1}</Text>}
                                </View>
                                <Text style={styles.detailSentence} numberOfLines={1}>
                                    Q{idx + 1}: {q.sentence}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* 按钮区域 */}
                <View style={styles.completionButtons}>
                    <TouchableOpacity style={[styles.completionButton, styles.playAgainButton]} onPress={restartGame}>
                        <Ionicons name="refresh" size={20} color="white" />
                        <Text style={styles.completionButtonText}>Play Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.completionButton, styles.backDifficultyButton]} onPress={backToDifficulty}>
                        <Ionicons name="options" size={20} color="white" />
                        <Text style={styles.completionButtonText}>Change Difficulty</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.completionButton, styles.homeButton]} onPress={goToHome}>
                        <Ionicons name="home" size={20} color="white" />
                        <Text style={styles.completionButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    // 游戏主界面
    const renderGameScreen = () => {
        if (!currentQuestion) return null;

        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: `Sentence Reorder - ${DIFFICULTY_LEVELS[gameState.difficulty as Difficulty]?.label || ''}`,
                        headerStyle: { backgroundColor: '#4b6cb7' },
                        headerTintColor: '#fff',
                        headerLeft: () => (
                            <TouchableOpacity onPress={backToDifficulty} style={styles.headerBackButton}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                        ),
                    }}
                />

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* 游戏标题 */}
                    <LinearGradient
                        colors={['#4b6cb7', '#182848']}
                        style={styles.header}
                    >
                        <Text style={styles.headerTitle}>🔤 Sentence Reorder</Text>
                        <Text style={styles.headerSubtitle}>Arrange the words to form correct sentences</Text>
                    </LinearGradient>

                    {/* 进度条 */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
                    </View>

                    {/* 统计 */}
                    <View style={styles.statsBar}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{gameState.score}</Text>
                            <Text style={styles.statLabel}>Score</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{gameState.correctAnswers}</Text>
                            <Text style={styles.statLabel}>Correct</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{gameState.wrongAnswers}</Text>
                            <Text style={styles.statLabel}>Incorrect</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {gameState.currentQuestion + 1}/{gameState.questions.length}
                            </Text>
                            <Text style={styles.statLabel}>Question</Text>
                        </View>
                    </View>

                    {/* 题目区域 */}
                    <View style={styles.questionCard}>
                        <View style={styles.questionHeader}>
                            <Text style={styles.questionTitle}>Question {gameState.currentQuestion + 1}</Text>
                            <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_LEVELS[gameState.difficulty as Difficulty]?.color }]}>
                                <Text style={styles.difficultyBadgeText}>
                                    {DIFFICULTY_LEVELS[gameState.difficulty as Difficulty]?.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.translation}>{currentQuestion.translation}</Text>

                        <View style={styles.wordsContainer}>
                            {gameState.words.length > 0 ? (
                                gameState.words
                                    .sort((a, b) => a.currentIndex - b.currentIndex)
                                    .map((word, idx) => renderWordCard(word, idx))
                            ) : (
                                <Text style={styles.loadingText}>Loading...</Text>
                            )}
                        </View>

                        <Text style={styles.instructionHint}>
                            💡 Tap a word to move it left
                        </Text>
                    </View>

                    {/* 反馈 */}
                    {gameState.feedback !== '' && (
                        <View style={[
                            styles.feedbackBox,
                            gameState.feedback.includes('✅') ? styles.feedbackCorrect :
                                gameState.feedback.includes('❌') ? styles.feedbackIncorrect : {}
                        ]}>
                            <Text style={styles.feedbackText}>{gameState.feedback}</Text>
                        </View>
                    )}

                    {/* 控制按钮 */}
                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={[styles.button, styles.checkButton]}
                            onPress={checkAnswer}
                            disabled={gameState.isChecking}
                        >
                            <Text style={styles.buttonText}>
                                {gameState.isChecking ? 'Checking...' : 'Check'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.retryButton]}
                            onPress={retryQuestion}
                        >
                            <Text style={styles.buttonText}>Retry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.nextButton]}
                            onPress={nextQuestion}
                        >
                            <Text style={styles.buttonText}>
                                {gameState.currentQuestion === gameState.questions.length - 1 ? 'Finish' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    };

    // 加载界面
    if (gameState.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4b6cb7" />
                <Text style={styles.loadingText}>Generating questions with AI...</Text>
                <Text style={styles.loadingSubText}>This may take a few seconds</Text>
            </View>
        );
    }

    // 游戏完成显示完成页面
    if (gameState.gameFinished) {
        return renderCompletionScreen();
    }

    // 未开始游戏显示难度选择
    if (!gameState.gameStarted) {
        return renderDifficultySelector();
    }

    // 显示游戏主界面
    return renderGameScreen();
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#4b6cb7',
        fontWeight: '500',
    },
    loadingSubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
    headerBackButton: {
        marginLeft: 10,
        padding: 5,
    },
    // 难度选择页面样式 (采用 writing.tsx 风格)
    difficultyScroll: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    difficultyScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    difficultyContainer: {
        paddingHorizontal: 20,
    },
    difficultyTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    difficultySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    difficultyOptions: {
        gap: 16,
    },
    difficultyCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    difficultyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 12,
    },
    difficultyBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    difficultyDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    difficultyHint: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    difficultyPoints: {
        fontSize: 12,
        color: '#4b6cb7',
        fontWeight: '500',
    },
    backToHomeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        padding: 12,
    },
    backToHomeText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    // 游戏主界面样式
    header: {
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4b6cb7',
        borderRadius: 2,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyBadgeText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '600',
    },
    translation: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    wordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        minHeight: 80,
        marginBottom: 16,
    },
    wordCard: {
        backgroundColor: '#4b6cb7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
        position: 'relative',
    },
    wordText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    moveHint: {
        position: 'absolute',
        bottom: -8,
        left: '50%',
        transform: [{ translateX: -8 }],
    },
    instructionHint: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    loadingText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
    feedbackBox: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#4b6cb7',
    },
    feedbackCorrect: {
        borderLeftColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    feedbackIncorrect: {
        borderLeftColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    feedbackText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    controls: {
        flexDirection: 'row',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkButton: {
        backgroundColor: '#4b6cb7',
    },
    retryButton: {
        backgroundColor: '#F44336',
    },
    nextButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    // 完成页面样式
    completionContainer: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    completionHeader: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        marginBottom: 30,
    },
    completionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    completionSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    scoreCircle: {
        alignItems: 'center',
        marginBottom: 30,
    },
    scoreNumber: {
        fontSize: 72,
        fontWeight: 'bold',
    },
    scoreMax: {
        fontSize: 24,
        color: '#999',
        marginTop: -10,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    statsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    detailsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailStatus: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    detailSentence: {
        flex: 1,
        fontSize: 14,
        color: '#666',
    },
    completionButtons: {
        paddingHorizontal: 20,
        gap: 12,
    },
    completionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    playAgainButton: {
        backgroundColor: '#4b6cb7',
    },
    backDifficultyButton: {
        backgroundColor: '#FF9800',
    },
    homeButton: {
        backgroundColor: '#FF5722',
    },
    completionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});