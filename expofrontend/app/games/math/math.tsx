import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import { ArrowLeft, Trophy, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function MathGameScreen() {
    const router = useRouter();
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<number[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameActive, setGameActive] = useState(true);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const TOTAL_QUESTIONS = 40;

    // --- 1. 先定義最基礎的生成題目函數 ---
    const generateQuestion = useCallback(() => {
        let maxNum = 10;
        let ops = ['+'];

        if (level === 1) {
            maxNum = 10;
            ops = ['+', '-'];
        } else if (level === 2) {
            maxNum = 20;
            ops = ['+', '-', '*'];
        } else if (level === 3) {
            maxNum = 50;
            ops = ['+', '-', '*', '/'];
        } else {
            maxNum = 100;
            ops = ['+', '-', '*', '/'];
        }

        const operator = ops[Math.floor(Math.random() * ops.length)];
        let questionText = '';
        let answer = 0;

        switch (operator) {
            case '+':
                const a1 = Math.floor(Math.random() * maxNum) + 1;
                const a2 = Math.floor(Math.random() * maxNum) + 1;
                questionText = `${a1} + ${a2} = ?`;
                answer = a1 + a2;
                break;
            case '-':
                const s1 = Math.floor(Math.random() * maxNum) + 10;
                const s2 = Math.floor(Math.random() * s1) + 1;
                questionText = `${s1} - ${s2} = ?`;
                answer = s1 - s2;
                break;
            case '*':
                const m1 = Math.floor(Math.random() * (level * 3)) + 2;
                const m2 = Math.floor(Math.random() * 9) + 2;
                questionText = `${m1} × ${m2} = ?`;
                answer = m1 * m2;
                break;
            case '/':
                const divisor = Math.floor(Math.random() * (level + 3)) + 2;
                const quotient = Math.floor(Math.random() * 10) + 1;
                const dividend = divisor * quotient;
                questionText = `${dividend} ÷ ${divisor} = ?`;
                answer = quotient;
                break;
        }

        const optionsList = [answer];
        while (optionsList.length < 4) {
            const variation = Math.floor(Math.random() * 5) + 1;
            const opt = Math.random() > 0.5 ? answer + variation : answer - variation;
            if (!optionsList.includes(opt) && opt >= 0) optionsList.push(opt);
        }

        setQuestion(questionText);
        setOptions(optionsList.sort(() => Math.random() - 0.5));
        setCorrectAnswer(answer);
    }, [level]);

    // --- 2. 定義重置遊戲 (依賴 generateQuestion) ---
    const resetGame = useCallback(() => {
        setScore(0);
        setLevel(1);
        setTimeLeft(90);
        setGameActive(true);
        setQuestionsAnswered(0);
        setStreak(0);
        generateQuestion();
    }, [generateQuestion]);

    // --- 3. 定義檢查答案 ---
    const checkAnswer = useCallback((selectedAnswer: number) => {
        // 如果遊戲結束或是正在處理中，直接 return，防止重複點擊
        if (!gameActive || isProcessing) return;

        setIsProcessing(true); // 立即鎖定按鈕

        const isCorrect = selectedAnswer === correctAnswer;
        const nextCount = questionsAnswered + 1;
        setQuestionsAnswered(nextCount);

        if (isCorrect) {
            setScore(prev => prev + 10);
            setStreak(prev => prev + 1);
            if (nextCount % 10 === 0 || streak + 1 >= 5) {
                setLevel(prev => Math.min(prev + 1, 4));
                setStreak(0);
            }
        } else {
            setStreak(0);
            if (level > 1) setLevel(prev => prev - 1);
        }

        if (nextCount >= TOTAL_QUESTIONS) {
            setGameActive(false);
            setIsProcessing(false); // 遊戲結束解鎖
            Alert.alert("Mission Complete!", `Finished ${TOTAL_QUESTIONS} questions!`, [
                { text: "Finish", onPress: () => router.back() }
            ]);
        } else {
            // 延遲後生成新題目，並解鎖
            setTimeout(() => {
                generateQuestion();
                setIsProcessing(false); // 生成新題目後才解鎖，允許下一次點擊
            }, 300);
        }
    }, [gameActive, isProcessing, correctAnswer, questionsAnswered, streak, level, generateQuestion]);
    // --- 4. 定義結束遊戲 ---
    const endGame = useCallback(() => {
        setGameActive(false);
        Alert.alert('Time\'s Up!', `Final score: ${score}`, [
            { text: 'Play Again', onPress: resetGame },
            { text: 'Back', onPress: () => router.back() }
        ]);
    }, [score, resetGame]);

    // --- 5. 最後才是 useEffect 鉤子 ---
    useEffect(() => {
        generateQuestion();
    }, [generateQuestion]);

    useEffect(() => {
        let timer: any;
        if (timeLeft > 0 && gameActive) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0 && gameActive) {
            endGame();
        }
        return () => timer && clearTimeout(timer);
    }, [timeLeft, gameActive, endGame]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Trophy size={20} color="#FFD700" />
                        <Text style={styles.statText}>{score}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Clock size={20} color="#FF6B6B" />
                        <Text style={[styles.statText, timeLeft <= 10 && styles.lowTime]}>
                            {timeLeft}s
                        </Text>
                    </View>
                </View>
            </View>

            {/* Game Area */}
            <View style={styles.gameArea}>
                <Text style={styles.gameTitle}>Math Challenge</Text>
                <Text style={styles.levelText}>Level {level}</Text>

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        Questions: {questionsAnswered}
                    </Text>
                </View>

                <Text style={styles.question}>{question}</Text>

                <View style={styles.optionsContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                (!gameActive || isProcessing) && styles.disabledButton
                            ]}
                            onPress={() => checkAnswer(option)}
                            disabled={!gameActive || isProcessing}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[styles.resetButton, styles.smallButton]}
                        onPress={resetGame}
                    >
                        <Text style={styles.resetButtonText}>Restart</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuButton, styles.smallButton]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.menuButtonText}>Menu</Text>
                    </TouchableOpacity>
                </View>

                {/* Time Warning */}
                {timeLeft <= 10 && (
                    <View style={styles.timeWarning}>
                        <Text style={styles.timeWarningText}>
                            ⚠️ Hurry up! {timeLeft}s left!
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f8ff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    stats: {
        flexDirection: 'row',
        gap: 15,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    lowTime: {
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
    gameArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    gameTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2c3e50',
        textAlign: 'center',
    },
levelText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#27ae60',
  marginBottom: 10,
},
    progressContainer: {
        marginBottom: 20,
    },
    progressText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    question: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#2c3e50',
        textAlign: 'center',
        minHeight: 50,
    },
    optionsContainer: {
        width: '100%',
        gap: 15,
        marginBottom: 30,
    },
    optionButton: {
        backgroundColor: '#3498db',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledButton: {
        opacity: 0.6,
    },
    optionText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    smallButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
    },
    resetButton: {
        backgroundColor: '#e74c3c',
    },
    menuButton: {
        backgroundColor: '#95a5a6',
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    menuButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    timeWarning: {
        backgroundColor: '#FFF3CD',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFEAA7',
    },
    timeWarningText: {
        color: '#856404',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});