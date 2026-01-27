// app/games/SentenceReorderGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Modal,
    Animated
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 題庫數據
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

const SentenceReorderGame = () => {
    // 遊戲狀態
    const [gameState, setGameState] = useState<GameState>({
        currentQuestion: 0,
        score: 0,
        words: [],
        feedback: 'Drag words to reorder the sentence',
        isChecking: false,
        showCompletionModal: false,
        correctAnswers: 0,
        wrongAnswers: 0,
        questionStatus: new Array(sentenceBank.length).fill('unanswered')
    });

    const currentQuestion = sentenceBank[gameState.currentQuestion];

    // 初始化題目
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
            feedback: 'Drag words to reorder the sentence',
            isChecking: false
        }));
    };

    // 交換單字位置
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

    // 檢查答案
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
                    feedback: `✅ Correct! Earned 10 points\n"${currentSentence}"`
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

    // 下一題
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

    // 重來當前題目
    const retryQuestion = () => {
        initializeQuestion();
    };

    // 重新開始遊戲
    const restartGame = () => {
        setGameState({
            currentQuestion: 0,
            score: 0,
            words: [],
            feedback: 'Drag words to reorder the sentence',
            isChecking: false,
            showCompletionModal: false,
            correctAnswers: 0,
            wrongAnswers: 0,
            questionStatus: new Array(sentenceBank.length).fill('unanswered')
        });
    };

    // 計算正確率
    const getAccuracy = () => {
        return gameState.correctAnswers > 0
            ? Math.round((gameState.correctAnswers / sentenceBank.length) * 100)
            : 0;
    };

    // 渲染單字卡片
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
        <SafeAreaView style={styles.container}>
            {/* Completed image */}
            <Modal
                transparent={true}
                visible={gameState.showCompletionModal}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Game Completed</Text>

                        <View style={styles.modalStats}>
                            <View style={styles.modalStat}>
                                <Text style={styles.modalStatValue}>{gameState.score}</Text>
                                <Text style={styles.modalStatLabel}>Final Score</Text>
                            </View>
                        </View>

                        <View style={styles.detailedStats}>
                            <View style={styles.statItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.statText}>Correct: {gameState.correctAnswers} questions</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="close-circle" size={20} color="#F44336" />
                                <Text style={styles.statText}>Incorrect: {gameState.wrongAnswers} questions</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="help-circle" size={20} color="#757575" />
                                <Text style={styles.statText}>Unanswered: {sentenceBank.length - gameState.correctAnswers - gameState.wrongAnswers} questions</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="stats-chart" size={20} color="#2196F3" />
                                <Text style={styles.statText}>Correct Rate: {getAccuracy()}%</Text>
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
                                <Text style={styles.buttonText}>Play again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.secondaryButton]}
                                onPress={() => {
                                    setGameState(prev => ({ ...prev, showCompletionModal: false }));
                                    setTimeout(() => router.back(), 300);
                                }}
                            >
                                <Text style={styles.buttonText}>Return to menu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 遊戲界面 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sentence Reordering Game</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content}>
                {/* 統計 */}
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

                {/* 題目區域 */}
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
                        Current sentence: {gameState.words
                            .sort((a, b) => a.currentIndex - b.currentIndex)
                            .map(word => word.text)
                            .join(' ')}
                    </Text>
                </View>

                {/* 反饋 */}
                <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackText}>{gameState.feedback}</Text>
                </View>

                {/* 控制按鈕 */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.button, styles.checkButton]}
                        onPress={checkAnswer}
                        disabled={gameState.isChecking}
                    >
                        <Text style={styles.buttonText}>{gameState.isChecking ? 'Checking...' : 'Check Answer'}</Text>
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
                            {gameState.currentQuestion === sentenceBank.length - 1 ? 'Finish' : 'Next Question'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 簡短說明 */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionsTitle}>Game Instructions</Text>
                    <Text style={styles.instructionsText}>
                        1. Click a word to swap it with the word to its left{"\n"}
                        2. If you get it wrong, you can try again or click the next question{"\n"}
                        3. Get 10 points for each correct answer
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    headerRight: {
        width: 32,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
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
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
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
        gap: 10,
        minHeight: 80,
        marginBottom: 16,
    },
    wordCard: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 70,
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
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    feedbackText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    controls: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkButton: {
        backgroundColor: '#2196F3',
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
        marginBottom: 24,
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
    // 完成畫面樣式
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalStats: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalStat: {
        alignItems: 'center',
    },
    modalStatValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2196F3',
        marginBottom: 8,
    },
    modalStatLabel: {
        fontSize: 18,
        color: '#666',
    },
    detailedStats: {
        marginBottom: 24,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
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
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#2196F3',
    },
    secondaryButton: {
        backgroundColor: '#757575',
    },
});

export default SentenceReorderGame;