// english/sentencereorder.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 题库数据
const sentenceBank = [
    { id: 1, sentence: "I like apples", words: ["I", "like", "apples"], translation: "I like apples." },
    { id: 2, sentence: "She reads a book", words: ["She", "reads", "a", "book"], translation: "She reads a book." },
    { id: 3, sentence: "We are students", words: ["We", "are", "students"], translation: "We are students." },
    { id: 4, sentence: "Do you like coffee?", words: ["Do", "you", "like", "coffee", "?"], translation: "Do you like coffee?" },
    { id: 5, sentence: "The cat is sleeping", words: ["The", "cat", "is", "sleeping"], translation: "The cat is sleeping." }
];

interface WordItem {
    id: number;
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
    showCompletionModal: boolean;
    correctAnswers: number;
    wrongAnswers: number;
    questionStatus: ('correct' | 'wrong' | 'unanswered')[];
}

export default function SentenceReorderScreen() {
    // 游戏状态
    const [gameState, setGameState] = useState<GameState>({
        currentQuestion: 0,
        score: 0,
        words: [],
        feedback: 'Tap words to reorder the sentence',
        isChecking: false,
        showCompletionModal: false,
        correctAnswers: 0,
        wrongAnswers: 0,
        questionStatus: new Array(sentenceBank.length).fill('unanswered')
    });

    const currentQuestion = sentenceBank[gameState.currentQuestion];

    // 初始化题目
    useEffect(() => {
        initializeQuestion();
    }, [gameState.currentQuestion]);

    const initializeQuestion = () => {
        const question = sentenceBank[gameState.currentQuestion];
        const shuffledWords = [...question.words]
            .map((word, index) => ({ id: index, text: word, originalIndex: index, currentIndex: index }))
            .sort(() => Math.random() - 0.5)
            .map((word, newIndex) => ({ ...word, currentIndex: newIndex }));

        setGameState(prev => ({
            ...prev,
            words: shuffledWords,
            feedback: 'Tap words to reorder the sentence',
            isChecking: false
        }));
    };

    // 交换单词位置
    const swapWords = (wordId1: number, wordId2: number) => {
        if (gameState.isChecking) return;

        const currentWords = [...gameState.words];
        const index1 = currentWords.findIndex(w => w.id === wordId1);
        const index2 = currentWords.findIndex(w => w.id === wordId2);

        if (index1 !== -1 && index2 !== -1) {
            const temp = currentWords[index1];
            currentWords[index1] = currentWords[index2];
            currentWords[index2] = temp;

            const updatedWords = currentWords.map((word, index) => ({
                ...word,
                currentIndex: index
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

        const currentOrder = [...gameState.words]
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map(word => word.originalIndex);

        const isCorrect = JSON.stringify(currentOrder) === JSON.stringify([...Array(currentQuestion.words.length).keys()]);
        const currentSentence = gameState.words
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map(word => word.text)
            .join(' ');

        if (isCorrect) {
            setTimeout(() => {
                const newScore = gameState.score + 10;
                const newCorrectAnswers = gameState.correctAnswers + 1;
                const newQuestionStatus = [...gameState.questionStatus];
                newQuestionStatus[gameState.currentQuestion] = 'correct';

                setGameState(prev => ({
                    ...prev,
                    score: newScore,
                    correctAnswers: newCorrectAnswers,
                    questionStatus: newQuestionStatus,
                    feedback: `✅ Correct! +10 points\n"${currentSentence}"`,
                    isChecking: false
                }));
            }, 500);
        } else {
            setTimeout(() => {
                const newQuestionStatus = [...gameState.questionStatus];
                newQuestionStatus[gameState.currentQuestion] = 'wrong';

                setGameState(prev => ({
                    ...prev,
                    wrongAnswers: prev.wrongAnswers + 1,
                    isChecking: false,
                    questionStatus: newQuestionStatus,
                    feedback: `❌ Incorrect\n"${currentSentence}"`
                }));
            }, 500);
        }
    };

    // 下一题
    const nextQuestion = () => {
        if (gameState.currentQuestion < sentenceBank.length - 1) {
            setGameState(prev => ({
                ...prev,
                currentQuestion: prev.currentQuestion + 1,
                words: [],
                feedback: 'Loading...'
            }));
        } else {
            setGameState(prev => ({ ...prev, showCompletionModal: true }));
        }
    };

    // 重来当前题目
    const retryQuestion = () => {
        initializeQuestion();
    };

    // 重新开始游戏
    const restartGame = () => {
        setGameState({
            currentQuestion: 0,
            score: 0,
            words: [],
            feedback: 'Tap words to reorder the sentence',
            isChecking: false,
            showCompletionModal: false,
            correctAnswers: 0,
            wrongAnswers: 0,
            questionStatus: new Array(sentenceBank.length).fill('unanswered')
        });
    };

    // 计算正确率
    const getAccuracy = () => {
        return gameState.correctAnswers > 0
            ? Math.round((gameState.correctAnswers / sentenceBank.length) * 100)
            : 0;
    };

    // 渲染单词卡片
    const renderWordCard = (word: WordItem) => {
        const isCorrectPosition = gameState.isChecking && word.currentIndex === word.originalIndex;

        return (
            <TouchableOpacity
                key={`word-${word.id}`}
                style={[
                    styles.wordCard,
                    isCorrectPosition && styles.wordCardCorrect
                ]}
                onPress={() => {
                    if (gameState.isChecking) return;
                    const currentIndex = word.currentIndex;
                    if (currentIndex > 0) {
                        const leftWord = gameState.words.find(w => w.currentIndex === currentIndex - 1);
                        if (leftWord) swapWords(word.id, leftWord.id);
                    }
                }}
                activeOpacity={0.7}
                disabled={gameState.isChecking}
            >
                <Text style={styles.wordText}>{word.text}</Text>
                {isCorrectPosition && (
                    <View style={styles.correctBadge}>
                        <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Sentence Reorder',
                    headerStyle: { backgroundColor: '#667eea' },
                    headerTintColor: '#fff',
                }}
            />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* 游戏标题 */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>🔤 Sentence Reorder</Text>
                    <Text style={styles.headerSubtitle}>Arrange the words to form correct sentences</Text>
                </LinearGradient>

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
                        <Text style={styles.statValue}>{gameState.currentQuestion + 1}/{sentenceBank.length}</Text>
                        <Text style={styles.statLabel}>Question</Text>
                    </View>
                </View>

                {/* 题目区域 */}
                <View style={styles.questionCard}>
                    <Text style={styles.questionTitle}>Question {gameState.currentQuestion + 1}</Text>
                    <Text style={styles.translation}>{currentQuestion.translation}</Text>

                    <View style={styles.wordsContainer}>
                        {gameState.words.length > 0 ? (
                            gameState.words
                                .sort((a, b) => a.currentIndex - b.currentIndex)
                                .map(renderWordCard)
                        ) : (
                            <Text style={styles.loadingText}>Loading...</Text>
                        )}
                    </View>

                    <Text style={styles.currentSentence}>
                        Current: {gameState.words
                        .sort((a, b) => a.currentIndex - b.currentIndex)
                        .map(word => word.text)
                        .join(' ')}
                    </Text>
                </View>

                {/* 反馈 */}
                <View style={[
                    styles.feedbackBox,
                    gameState.feedback.includes('✅') ? styles.feedbackCorrect :
                        gameState.feedback.includes('❌') ? styles.feedbackIncorrect : {}
                ]}>
                    <Text style={styles.feedbackText}>{gameState.feedback}</Text>
                </View>

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
                            {gameState.currentQuestion === sentenceBank.length - 1 ? 'Finish' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 游戏说明 */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionsTitle}>How to Play</Text>
                    <Text style={styles.instructionsText}>
                        1. Tap a word to swap it with the word on its left{"\n"}
                        2. Try to form the correct sentence{"\n"}
                        3. Get 10 points for each correct answer
                    </Text>
                </View>
            </ScrollView>

            {/* 完成模态框 */}
            <Modal
                transparent={true}
                visible={gameState.showCompletionModal}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Game Completed! 🎉</Text>

                        <View style={styles.modalStats}>
                            <View style={styles.modalStat}>
                                <Text style={styles.modalStatValue}>{gameState.score}</Text>
                                <Text style={styles.modalStatLabel}>Final Score</Text>
                            </View>
                        </View>

                        <View style={styles.detailedStats}>
                            <View style={styles.statItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.statText}>Correct: {gameState.correctAnswers}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="close-circle" size={20} color="#F44336" />
                                <Text style={styles.statText}>Incorrect: {gameState.wrongAnswers}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="help-circle" size={20} color="#757575" />
                                <Text style={styles.statText}>
                                    Unanswered: {sentenceBank.length - gameState.correctAnswers - gameState.wrongAnswers}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="stats-chart" size={20} color="#667eea" />
                                <Text style={styles.statText}>Accuracy: {getAccuracy()}%</Text>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.primaryButton]}
                                onPress={() => {
                                    setGameState(prev => ({ ...prev, showCompletionModal: false }));
                                    setTimeout(restartGame, 300);
                                }}
                            >
                                <Text style={styles.buttonText}>Play Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
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
        color: '#667eea',
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
    questionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
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
        backgroundColor: '#667eea',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
        position: 'relative',
    },
    wordCardCorrect: {
        backgroundColor: '#4CAF50',
    },
    wordText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    correctBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
    currentSentence: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    feedbackBox: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
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
        backgroundColor: '#667eea',
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
    instructions: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    instructionsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    // 完成模态框样式
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#667eea',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalStats: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalStat: {
        alignItems: 'center',
    },
    modalStatValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: 8,
    },
    modalStatLabel: {
        fontSize: 16,
        color: '#666',
    },
    detailedStats: {
        marginBottom: 24,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    statText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    modalButton: {
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 150,
    },
    primaryButton: {
        backgroundColor: '#667eea',
    },
});