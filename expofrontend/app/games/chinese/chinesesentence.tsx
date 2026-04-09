// app/games/chinese/chinesesentence.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, StatusBar, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Languages, Star } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';
import chineseSentenceAIService from '../../services/chisentenceAIService';

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
    score?: number; // 0-10分 (原始AI分數/10)
};

type Difficulty = 'easy' | 'medium' | null;
type GameState = 'difficulty_select' | 'playing' | 'result';

// 修改：總題數改為 4 題
const TOTAL_QUESTIONS = 4;

// --- 💥 浮動文字元件 (HIT / OUCH) ---
const FloatingText = ({ text, color, onComplete }: { text: string, color: string, onComplete: () => void }) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -80,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => onComplete());
    }, []);

    return (
        <Animated.View style={[styles.floatingLayer, { opacity, transform: [{ translateY }] }]}>
            <Text style={[styles.hitText, { color }]}>{text}</Text>
        </Animated.View>
    );
};

// 可愛角色狀態配置
const CHARACTER_STATES = {
    idle: { icon: '🐼', message: 'Let\'s learn Chinese!', bgColor: '#E8F5E9' },
    thinking: { icon: '🤔🐼', message: 'Think about it...', bgColor: '#FFF3E0' },
    correct: { icon: '🎉🐼', message: 'Great！', bgColor: '#E8F5E9' },
    perfect: { icon: '🌟🐼✨', message: 'Perfect answer！', bgColor: '#E8F5E9' },
    incorrect: { icon: '😊🐼', message: 'It\'s okay, try again！', bgColor: '#FFEBEE' },
    encouraging: { icon: '💪🐼', message: 'Come on! You can do it！', bgColor: '#E3F2FD' },
    celebrate: { icon: '🎊🐼🎉', message: 'Congratulations on completing！', bgColor: '#FFF9C4' }
};

// 鼓勵語錄庫
const ENCOURAGEMENT_MESSAGES = {
    ggreat: [
        '🎉 Amazing!', '🌟 You are a genius!', '💪 Keep it up!',
        '✨ Perfect!', '🏆 Super awesome!', '🎈 Wow! So impressive!'
    ],
    good: [
        '👍 Not bad!', '📚 You learn fast!', '✨ Keep going!',
        '💡 Very good!', '🌟 Much improved!', '🎯 Keep it up!'
    ],
    tryAgain: [
        '🌱 Try again — you’ll do better', '💡 So close!', '🎈 It’s okay, keep trying!',
        '📖 Take a look at the hints', '🌟 You’ll do better next time', '💪 Give it another try!'
    ]
};

// 主題色彩配置
const THEME_COLORS = {
    easy: {
        primary: '#6B8C5C',
        secondary: '#A7C5A3',
        background: ['#E8F5E9', '#C8E6C9'],
        accent: '#FFD966',
        characterBg: '#E8F5E9'
    },
    medium: {
        primary: '#FF9F4A',
        secondary: '#FFC857',
        background: ['#FFF3E0', '#FFE0B5'],
        accent: '#FF6B6B',
        characterBg: '#FFF3E0'
    }
};

const difficultyOptions = [
    {
        id: 'easy',
        title: 'Easy',
        level: 'beginner',
        description: 'Simple vocabulary and sentences, suitable for children who are just starting to learn!',
        icon: '🌱',
        color: '#6B8C5C',
        bgColor: '#E8F5E9',
        gradientColors: ['#E8F5E9', '#C8E6C9'],
        features: ['🎨 Cute character companionship', '💡 Detailed prompt']
    },
    {
        id: 'medium',
        title: 'Medium',
        level: 'advanced',
        description: 'Everyday expressions and slightly more complex sentences, challenge yourself！',
        icon: '🌳',
        color: '#FF9F4A',
        bgColor: '#FFF3E0',
        gradientColors: ['#FFF3E0', '#FFE0B5'],
        features: ['🎨 Cute character companionship', '💡 Detailed prompt']
    }
];

export default function ChineseSentenceGame() {
    const router = useRouter();
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // 動畫值
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const feedbackAnim = useRef(new Animated.Value(0)).current;

    // 倒數計時狀態
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useRef(new Animated.Value(0)).current;
    const [gameActive, setGameActive] = useState(false);

    // 特效狀態
    const [floatingText, setFloatingText] = useState<{ id: number, text: string, color: string } | null>(null);
    const screenShake = useRef(new Animated.Value(0)).current;

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
    const [characterState, setCharacterState] = useState<keyof typeof CHARACTER_STATES>('idle');
    const [encouragementText, setEncouragementText] = useState('');

    // 保存分數到伺服器
    const saveScore = async (finalScore: number) => {
        if (!token || !difficulty) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "ChineseSentenceGame",
                scores: finalScore,
                difficulty: difficulty === 'easy' ? 'EASY' : 'MEDIUM'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Score synced to server!");
        } catch (e) {
            console.error("Failed to sync score:", e);
        } finally {
            setIsSaving(false);
        }
    };

    // 倒數準備序列
    const startPrepSequence = () => {
        setGameActive(false);

        setTimeout(() => {
            setPrepText('GO!');
            prepScale.setValue(0);
            Animated.spring(prepScale, {
                toValue: 1.5,
                friction: 3,
                tension: 150,
                useNativeDriver: true,
            }).start();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 100);

        setTimeout(() => {
            setPrepText(null);
            setGameActive(true);
        }, 1200);
    };

    // 觸發螢幕震動效果
    const triggerScreenShake = () => {
        Animated.sequence([
            Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // 播放彈跳動畫
    const playBounceAnimation = () => {
        bounceAnim.setValue(0);
        Animated.spring(bounceAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true
        }).start();
    };

    // 播放搖晃動畫（答錯時）
    const playShakeAnimation = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true
            }),
            Animated.timing(shakeAnim, {
                toValue: -10,
                duration: 50,
                useNativeDriver: true
            }),
            Animated.timing(shakeAnim, {
                toValue: 5,
                duration: 50,
                useNativeDriver: true
            }),
            Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 50,
                useNativeDriver: true
            })
        ]).start();
    };

    // 獲取隨機鼓勵語錄
    const getRandomEncouragement = (type: 'great' | 'good' | 'tryAgain') => {
        const messages = ENCOURAGEMENT_MESSAGES[type];
        return messages[Math.floor(Math.random() * messages.length)];
    };

    // 更新角色狀態
    const updateCharacterState = (type: keyof typeof CHARACTER_STATES, customMessage?: string) => {
        setCharacterState(type);
        if (customMessage) {
            setEncouragementText(customMessage);
        } else {
            setEncouragementText(CHARACTER_STATES[type].message);
        }
    };

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
        setGameActive(false);
        updateCharacterState('idle');
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
            updateCharacterState('idle');
            // 開始倒數
            startPrepSequence();
        } catch (error) {
            console.error('Failed to load first question:', error);
            Alert.alert('錯誤', '無法加載題目，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const loadNextQuestion = async () => {
        if (currentIndex + 1 >= TOTAL_QUESTIONS) {
            await generateFinalFeedback();
            setGameState('result');
            updateCharacterState('celebrate');
            return;
        }

        setLoading(true);
        setGameActive(false);
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
            updateCharacterState('idle');
            // 每題之間重新倒數
            startPrepSequence();
        } catch (error) {
            console.error('Failed to load next question:', error);
            Alert.alert('錯誤', '無法加載下一題，請稍後再試');
            setGameActive(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!gameActive) {
            Alert.alert('Prompt', 'Please wait, the game is being prepared！');
            return;
        }
        if (!inputText.trim()) {
            Alert.alert('Prompt', 'Please enter the answer');
            updateCharacterState('thinking', '💭 Enter your answer！');
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

            // 修改：根據難度計算每題得分
            // Easy: 每題滿分 25 分 (總分 100)
            // Medium: 每題滿分 30 分 (總分 120)
            let questionScore = 0;
            if (difficulty === 'easy') {
                // Easy: 原始分數 0-100 轉換為 0-25
                questionScore = Math.round((result.score / 100) * 25);
            } else {
                // Medium: 原始分數 0-100 轉換為 0-30
                questionScore = Math.round((result.score / 100) * 30);
            }

            setQuestions(prev => prev.map((q, idx) =>
                idx === currentIndex
                    ? {
                        ...q,
                        userAnswer: inputText.trim(),
                        isCorrect: result.isCorrect,
                        feedback: result.feedback,
                        score: questionScore
                    }
                    : q
            ));

            setShowFeedback(true);
            setGameActive(false);

            // 根據答案顯示角色狀態和鼓勵語錄
            if (result.isCorrect) {
                // ✅ 正確 - 打擊回饋
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setFloatingText({ id: Date.now(), text: 'HIT!', color: '#FFD700' });
                playBounceAnimation();
                if (result.score >= 90) {
                    updateCharacterState('perfect');
                    setEncouragementText(getRandomEncouragement('great'));
                } else {
                    updateCharacterState('correct');
                    setEncouragementText(getRandomEncouragement('good'));
                }
            } else {
                // ❌ 錯誤 - 被打擊回饋
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                triggerScreenShake();
                setFloatingText({ id: Date.now(), text: 'OUCH!', color: '#FF4757' });
                playShakeAnimation();
                updateCharacterState('incorrect');
                setEncouragementText(getRandomEncouragement('tryAgain'));
            }

            // 清除浮動文字
            setTimeout(() => {
                setFloatingText(null);
            }, 800);

        } catch (error) {
            console.error('Failed to check answer:', error);
            Alert.alert('錯誤', '無法檢查答案，請稍後再試');
            setGameActive(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        setShowFeedback(false);
        loadNextQuestion();
    };

    // 修改：計算總分（根據難度不同滿分不同）
    const calculateScore = () => {
        const totalScore = questions.reduce((acc, q) => acc + (q.score || 0), 0);
        const correctCount = questions.filter(q => q.isCorrect).length;
        const maxScore = difficulty === 'easy' ? 100 : 120;

        return {
            correct: correctCount,
            total: TOTAL_QUESTIONS,
            percentage: Math.round((correctCount / TOTAL_QUESTIONS) * 100),
            totalScore: totalScore,
            maxScore: maxScore
        };
    };

    const generateFinalFeedback = async () => {
        const score = calculateScore();
        const percentage = score.percentage;
        const maxScore = score.maxScore;

        // 保存分數到伺服器
        await saveScore(score.totalScore);

        let feedback = '';
        if (score.correct === TOTAL_QUESTIONS) {
            feedback = `🎉 Perfect! You got them all right. ${score.correct} Question! You are a little Chinese genius! 🌟🌟🌟 (Score: ${score.totalScore}/${maxScore})`;
        } else if (percentage >= 90) {
            feedback = `🌟 Awesome! You got it right. ${score.correct} Keep it up! 👍 (Score: ${score.totalScore}/${maxScore})`;
        } else if (percentage >= 70) {
            feedback = `📚 Very good! You got it right. ${score.correct} Practice the problems a bit more and you'll get even better! 💪 (Score: ${score.totalScore}/${maxScore})`;
        } else if (percentage >= 50) {
            feedback = `🌱 Improvement! You got it right. ${score.correct} Keep it up with the questions! 📖 (Score: ${score.totalScore}/${maxScore})`;
        } else {
            feedback = `💪 Don't be discouraged! You got it right. ${score.correct} Try again, it will be better! Let's work hard together! ✨ (Score: ${score.totalScore}/${maxScore})`;
        }

        setAiFeedback(feedback);
    };

    // 返回難度選擇頁面
    const handleNewDifficulty = async () => {
        // 如果有進行中的遊戲且已有分數，保存當前分數
        if (gameState === 'playing' && questions.length > 0) {
            const currentScore = calculateScore();
            if (currentScore.totalScore > 0) {
                await saveScore(currentScore.totalScore);
            }
        }
        setGameState('difficulty_select');
        setDifficulty(null);
        setQuestions([]);
        setCurrentIndex(0);
        setInputText('');
        setShowHint(false);
        setShowFeedback(false);
        setGameActive(false);
        updateCharacterState('idle');
    };

    const handleTryAgain = () => {
        if (difficulty) {
            startGame(difficulty);
        }
    };

    const handleBackToGames = () => {
        router.back();
    };

    const handleBackToHome = () => {
        router.push('/');
    };

    const handleBack = async () => {
        if (gameState === 'difficulty_select') {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.push('/games/chinese/chinese');
            }
        } else if (gameState === 'playing') {
            Alert.alert(
                '退出遊戲',
                '確定要退出嗎？進度將不會保存。',
                [
                    { text: '取消', style: 'cancel' },
                    {
                        text: '退出',
                        style: 'destructive',
                        onPress: async () => {
                            // 如果有分數，保存當前分數
                            const currentScore = calculateScore();
                            if (currentScore.totalScore > 0) {
                                await saveScore(currentScore.totalScore);
                            }
                            setGameState('difficulty_select');
                            setDifficulty(null);
                            setQuestions([]);
                            setCurrentIndex(0);
                            setGameActive(false);
                        }
                    }
                ]
            );
        } else if (gameState === 'result') {
            handleNewDifficulty();
        }
    };

    // 渲染可愛角色
    const renderCharacter = () => {
        const state = CHARACTER_STATES[characterState];
        const currentTheme = difficulty ? THEME_COLORS[difficulty] : THEME_COLORS.easy;

        return (
            <View
                style={[
                    styles.characterContainer,
                    { backgroundColor: state.bgColor || currentTheme.characterBg }
                ]}
            >
                <Text style={styles.characterIcon}>{state.icon}</Text>
                <Text style={styles.characterMessage}>{encouragementText || state.message}</Text>
            </View>
        );
    };

    // 渲染遊戲中的反饋卡片
    const renderFeedback = () => {
        if (!showFeedback) return null;

        const currentQuestion = questions[currentIndex];
        const score = currentQuestion.score || 0;
        const maxQuestionScore = difficulty === 'easy' ? 25 : 30;

        return (
            <Animated.View
                style={[
                    styles.feedbackCard,
                    currentQuestion.isCorrect ? styles.correctCard : styles.incorrectCard,
                    {
                        transform: [{
                            scale: bounceAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1]
                            })
                        }]
                    }
                ]}
            >
                <View style={styles.feedbackRow}>
                    <Text style={styles.feedbackLabel}>Score：</Text>
                    <Text style={[styles.scoreText, score >= (maxQuestionScore * 0.8) ? styles.highScore : score >= (maxQuestionScore * 0.6) ? styles.mediumScore : styles.lowScore]}>
                        {score}/{maxQuestionScore}
                    </Text>
                </View>

                {!currentQuestion.isCorrect && (
                    <View style={styles.feedbackRow}>
                        <Text style={styles.feedbackLabel}>Correct answer：</Text>
                        <Text style={styles.correctAnswerText}>{currentQuestion.correctAnswer}</Text>
                    </View>
                )}

                <View style={styles.feedbackRow}>
                    <Text style={styles.feedbackLabel}>Improvement Suggestions：</Text>
                    <Text style={styles.suggestionText}>{currentQuestion.feedback || 'Keep going！'}</Text>
                </View>

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentIndex + 1 >= TOTAL_QUESTIONS ? '🎉 Complete the challenge 🎉' : '➡️ Next question'}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderQuestion = () => {
        if (questions.length === 0) return null;

        const currentQuestion = questions[currentIndex];
        const parts = currentQuestion.sentence.split('__');
        const currentTheme = difficulty ? THEME_COLORS[difficulty] : THEME_COLORS.easy;

        const animatedShake = {
            transform: [{ translateX: shakeAnim }]
        };

        return (
            <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: screenShake }] }]}>
                <View style={styles.questionContainer}>
                    {/* 可愛角色 */}
                    {renderCharacter()}

                    {/* 倒數覆蓋層 */}
                    {prepText && (
                        <Animated.View style={[styles.prepOverlay, { transform: [{ scale: prepScale }] }]}>
                            <Text style={[styles.prepText, { color: currentTheme.primary }]}>{prepText}</Text>
                        </Animated.View>
                    )}

                    {/* 浮動文字特效 */}
                    {floatingText && (
                        <FloatingText
                            key={floatingText.id}
                            text={floatingText.text}
                            color={floatingText.color}
                            onComplete={() => setFloatingText(null)}
                        />
                    )}

                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>
                            📝  {currentIndex + 1} / {TOTAL_QUESTIONS} question
                        </Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%`, backgroundColor: currentTheme.primary }
                                ]}
                            />
                        </View>
                    </View>

                    <Animated.View style={[styles.sentenceCard, animatedShake]}>
                        <Text style={styles.sentenceText}>
                            {parts.map((part, index) => (
                                <React.Fragment key={index}>
                                    <Text>{part}</Text>
                                    {index < parts.length - 1 && (
                                        <Text style={[styles.blankSpace, { color: currentTheme.primary }]}>_____</Text>
                                    )}
                                </React.Fragment>
                            ))}
                        </Text>

                        {currentQuestion.translation && (
                            <Text style={styles.translationText}>
                                📖 {currentQuestion.translation}
                            </Text>
                        )}
                    </Animated.View>

                    {!showFeedback && (
                        <>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, !gameActive && styles.disabledInput]}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    placeholder="✏️ Please enter the answer..."
                                    placeholderTextColor="#999"
                                    editable={!submitting && !loading && gameActive}
                                />

                                <TouchableOpacity
                                    style={[styles.hintButton, { borderColor: currentTheme.primary }]}
                                    onPress={() => setShowHint(!showHint)}
                                    disabled={!gameActive}
                                >
                                    <Ionicons name="help-circle-outline" size={24} color={currentTheme.primary} />
                                </TouchableOpacity>
                            </View>

                            {showHint && currentQuestion.hint && (
                                <View style={[styles.hintContainer, { backgroundColor: currentTheme.bgColor || currentTheme.characterBg }]}>
                                    <Text style={styles.hintText}>💡 Tip：{currentQuestion.hint}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, (!inputText.trim() || submitting || loading || !gameActive) && styles.disabledButton, { backgroundColor: currentTheme.primary }]}
                                onPress={handleSubmit}
                                disabled={!inputText.trim() || submitting || loading || !gameActive}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>✨ Submit Answer ✨</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {renderFeedback()}
                </View>
            </Animated.View>
        );
    };

    // 難度選擇頁面（優化視覺設計）
    const renderDifficultySelector = () => {
        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <Languages size={60} color="#FF9F4A" style={{ marginBottom: 20 }} />
                    <Text style={styles.mainTitle}>🐼 Chinese Fill-in-the-Blank Paradise 🐼</Text>
                    <Text style={styles.subTitle}>
                        Learn Chinese together with the cute panda! Complete the fill-in-the-blank exercises to gain a sense of accomplishment!✨
                    </Text>
                    <View style={styles.scoreInfoBox}>
                        <Text style={styles.scoreInfoText}>🏆 Easy: 4 questions, total 100 points</Text>
                        <Text style={styles.scoreInfoText}>⚡ Medium: 4 questions, total 120 points</Text>
                    </View>
                </View>

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
                            <View style={[styles.cardIconContainer, { backgroundColor: `${option.color}20` }]}>
                                <Text style={styles.cardIcon}>{option.icon}</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.diffBtnText, { color: option.color }]}>
                                        {option.title}
                                    </Text>
                                    <View style={[styles.levelBadge, { backgroundColor: option.color }]}>
                                        <Text style={styles.levelBadgeText}>
                                            {option.level === 'beginner' ? '🌟 Learn Easily' : '⚡ Challenge'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.diffDesc}>{option.description}</Text>

                                {/* 修改：顯示計分方式 */}
                                <View style={styles.scoreInfoRow}>
                                    <Text style={[styles.scoreInfoDetail, { color: option.color }]}>
                                        {option.id === 'easy' ? '🏆 25 points per question (Total 100)' : '⚡ 30 points per question (Total 120)'}
                                    </Text>
                                </View>

                                <View style={styles.featuresList}>
                                    {option.features.map((feature, index) => (
                                        <View key={index} style={styles.featureItem}>
                                            <Star size={12} color={option.color} style={styles.featureIcon} />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.startButtonContainer}>
                                    <View style={[styles.startButton, { backgroundColor: option.color }]}>
                                        <Text style={styles.startButtonText}>
                                            🚀 Start Game →
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
        const maxScore = score.maxScore;

        return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>🎉 Game Result 🎉</Text>

                    {renderCharacter()}

                    <View style={styles.scoreCircle}>
                        <Text style={styles.scorePercentage}>{score.totalScore}</Text>
                        <Text style={styles.scorePercentSign}>/{maxScore}</Text>
                        <Text style={styles.scoreLabel}>Total Score</Text>
                    </View>

                    {isSaving && (
                        <View style={styles.savingIndicator}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                            <Text style={styles.savingText}>Synchronizing scores...</Text>
                        </View>
                    )}

                    <View style={styles.scoreDetails}>
                        <Text style={styles.scoreDetailText}>
                            ✅ Correct {score.correct} / {score.total} question
                        </Text>
                        <View style={[styles.percentageBadge, { backgroundColor: '#E8F5E9' }]}>
                            <Text style={[styles.percentageText, { color: '#4CAF50' }]}>
                                Accuracy {score.percentage}%
                            </Text>
                        </View>
                    </View>

                    <View style={styles.feedbackBox}>
                        <Text style={styles.feedbackTitle}>💡 AI Study Tips</Text>
                        <Text style={styles.feedbackText}>{aiFeedback}</Text>
                    </View>

                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>📝 Answer Summary：</Text>
                        {questions.map((q, index) => {
                            const maxQScore = difficulty === 'easy' ? 25 : 30;
                            return (
                                <View key={index} style={styles.summaryItem}>
                                    <Text style={styles.summaryNumber}>{index + 1}.</Text>
                                    <Text style={styles.summaryAnswer} numberOfLines={1}>
                                        {q.userAnswer || 'Not answered'}
                                    </Text>
                                    <Text style={[
                                        styles.summaryScore,
                                        q.isCorrect ? styles.correctScore : styles.incorrectScore
                                    ]}>
                                        {q.score || 0}/{maxQScore}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.resultButtonContainer}>
                        <TouchableOpacity
                            style={[styles.resultButton, styles.tryAgainButton]}
                            onPress={handleTryAgain}
                        >
                            <Text style={styles.resultButtonText}>🔄 Play again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.newDifficultyButton]}
                            onPress={handleNewDifficulty}
                        >
                            <Text style={styles.resultButtonText}>🎯 Replacement Difficulty</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.backToGamesButton]}
                            onPress={handleBackToGames}
                        >
                            <Text style={styles.resultButtonText}>🎮 Return to game list</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.resultButton, styles.homeButton]}
                            onPress={handleBackToHome}
                        >
                            <Text style={styles.resultButtonText}>🏠 Return to homepage</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    };

    if (loading && questions.length === 0 && gameState === 'playing') {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF9F4A" />
                    <Text style={styles.loadingText}>🤖 AI Generating questions...</Text>
                    <Text style={styles.loadingSubText}>The panda is preparing a surprise for you!</Text>
                </View>
            </>
        );
    }

    if (gameState === 'playing') {
        const currentTheme = difficulty ? THEME_COLORS[difficulty] : THEME_COLORS.easy;
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]} edges={['top']}>
                    <StatusBar barStyle="dark-content" />
                    <View style={[styles.header, { backgroundColor: currentTheme.primary }]}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            🐼 Chinese fill-in-the-blank - {difficulty === 'easy' ? 'Simple mode' : 'Medium mode'}
                        </Text>
                        <View style={[styles.scoreBadge, { backgroundColor: '#fff' }]}>
                            <Text style={[styles.scoreBadgeText, { color: currentTheme.primary }]}>
                                {questions.filter(q => q.isCorrect).length}/{TOTAL_QUESTIONS}
                            </Text>
                        </View>
                    </View>
                    {renderQuestion()}
                </SafeAreaView>
            </>
        );
    }

    if (gameState === 'result') {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.container} edges={['top']}>
                    <StatusBar barStyle="dark-content" />
                    <View style={[styles.header, { backgroundColor: '#FF9F4A' }]}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>🎉 Game Result 🎉</Text>
                        <View style={styles.headerButton} />
                    </View>
                    {renderResult()}
                </SafeAreaView>
            </>
        );
    }

    // 难度选择页面
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <View style={[styles.header, { backgroundColor: '#FF9F4A' }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🐼 Chinese Fill-in-the-Blank Paradise</Text>
                    <View style={styles.headerButton} />
                </View>
                {renderDifficultySelector()}
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    // 角色樣式
    characterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 30,
        marginBottom: 20,
        marginHorizontal: 10,
    },
    characterIcon: {
        fontSize: 40,
        marginRight: 12,
    },
    characterMessage: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 1,
    },
    // 加載樣式
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#FF9F4A',
        fontWeight: '600',
    },
    loadingSubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    scoreBadgeText: {
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
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    sentenceCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    sentenceText: {
        fontSize: 22,
        lineHeight: 34,
        color: '#333',
        textAlign: 'center',
    },
    blankSpace: {
        fontSize: 22,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    translationText: {
        fontSize: 14,
        color: '#888',
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
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10,
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        opacity: 0.7,
    },
    hintButton: {
        width: 50,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    hintContainer: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 15,
    },
    hintText: {
        fontSize: 14,
        color: '#2E7D32',
    },
    submitButton: {
        height: 55,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    feedbackCard: {
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
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
        fontSize: 15,
        color: '#666',
        flex: 1,
        lineHeight: 22,
    },
    nextButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        alignSelf: 'center',
        marginTop: 10,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // 倒數覆蓋層樣式
    prepOverlay: {
        position: 'absolute',
        top: '35%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
        backgroundColor: 'transparent',
    },
    prepText: {
        fontSize: 72,
        fontWeight: '900',
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 60,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    // 浮動文字層樣式
    floatingLayer: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 150,
        backgroundColor: 'transparent',
    },
    hitText: {
        fontSize: 48,
        fontWeight: '900',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    // 難度選擇頁面樣式
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
        fontSize: 28,
        fontWeight: '800',
        color: '#FF9F4A',
        textAlign: 'center',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    scoreInfoBox: {
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    scoreInfoText: {
        fontSize: 12,
        color: '#FF9F4A',
        fontWeight: '500',
        textAlign: 'center',
    },
    menuGrid: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 20,
    },
    diffCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        borderWidth: 2,
        gap: 15,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 20,
    },
    cardIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
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
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    scoreInfoRow: {
        marginBottom: 12,
    },
    scoreInfoDetail: {
        fontSize: 12,
        fontWeight: '600',
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
        color: '#666',
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
        color: '#FF9F4A',
        marginBottom: 30,
        textAlign: 'center',
    },
    scoreCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
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
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
    },
    savingText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
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
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '600',
    },
    feedbackBox: {
        width: '100%',
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9F4A',
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