// app/games/components/ListeningGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    Modal,
    ScrollView,
    Dimensions,
    SafeAreaView,
    Vibration,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// 遊戲數據類型
type Difficulty = 'easy' | 'medium' | 'hard';

type Option = {
    id: string;
    text: string;
    emoji: string;
    correct: boolean;
};

type Question = {
    id: string;
    audioText: string;
    options: Option[];
    hint: string;
    level: Difficulty;
};

// AI 分析響應類型
type AIAnalysisResponse = {
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areas_to_improve: string[];
    estimated_level: string;
    recommended_next_steps: string[];
};

// 遊戲數據庫
const gameData: Record<Difficulty, Question[]> = {
    easy: [
        {
            id: '1',
            audioText: "apple",
            options: [
                { id: '1', text: "apple", emoji: "🍎", correct: true },
                { id: '2', text: "banana", emoji: "🍌", correct: false },
                { id: '3', text: "orange", emoji: "🍊", correct: false },
                { id: '4', text: "grape", emoji: "🍇", correct: false }
            ],
            hint: "This is a common red or green fruit.",
            level: 'easy'
        },
        {
            id: '2',
            audioText: "cat",
            options: [
                { id: '1', text: "dog", emoji: "🐶", correct: false },
                { id: '2', text: "cat", emoji: "🐱", correct: true },
                { id: '3', text: "bird", emoji: "🐦", correct: false },
                { id: '4', text: "fish", emoji: "🐟", correct: false }
            ],
            hint: "This is a common pet that makes a \"meow\" sound.",
            level: 'easy'
        }
    ],
    medium: [
        {
            id: '3',
            audioText: "I like coffee",
            options: [
                { id: '1', text: "I like coffee", emoji: "☕", correct: true },
                { id: '2', text: "I like tea", emoji: "🍵", correct: false },
                { id: '3', text: "I like water", emoji: "💧", correct: false },
                { id: '4', text: "I like juice", emoji: "🧃", correct: false }
            ],
            hint: "This is a common morning beverage.",
            level: 'medium'
        },
        {
            id: '4',
            audioText: "It's raining",
            options: [
                { id: '1', text: "It's sunny", emoji: "🌤️", correct: false },
                { id: '2', text: "It's raining", emoji: "🌧️", correct: true },
                { id: '3', text: "It's windy", emoji: "💨", correct: false },
                { id: '4', text: "It's snowing", emoji: "❄️", correct: false }
            ],
            hint: "Water falls from the sky.",
            level: 'medium'
        }
    ],
    hard: [
        {
            id: '5',
            audioText: "Where is the library?",
            options: [
                { id: '1', text: "Ask about time", emoji: "🕒", correct: false },
                { id: '2', text: "Ask about library location", emoji: "📚", correct: true },
                { id: '3', text: "Ask about food", emoji: "🍴", correct: false },
                { id: '4', text: "Ask about transportation", emoji: "🚆", correct: false }
            ],
            hint: "Asking for a place with books.",
            level: 'hard'
        },
        {
            id: '6',
            audioText: "Can you help me?",
            options: [
                { id: '1', text: "Provide assistance", emoji: "🤝", correct: true },
                { id: '2', text: "Ask about price", emoji: "💰", correct: false },
                { id: '3', text: "Self-introduction", emoji: "👤", correct: false },
                { id: '4', text: "Express gratitude", emoji: "🙏", correct: false }
            ],
            hint: "Requesting help from someone.",
            level: 'hard'
        }
    ]
};

type GameState = {
    currentLevel: Difficulty;
    currentQuestionIndex: number;
    score: number;
    streak: number;
    maxStreak: number;
    correctAnswers: number;
    totalQuestions: number;
    isAnswered: boolean;
    isPlaying: boolean;
    gameCompleted: boolean;
    showHint: boolean;
    selectedOptionId: string | null;
    isAnalyzing: boolean;
    aiAnalysis: AIAnalysisResponse | null;
    showAIFeedback: boolean;
};

const ListeningGame = () => {
    // 遊戲狀態
    const [gameState, setGameState] = useState<GameState>({
        currentLevel: 'easy',
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctAnswers: 0,
        totalQuestions: 2,
        isAnswered: false,
        isPlaying: false,
        gameCompleted: false,
        showHint: false,
        selectedOptionId: null,
        isAnalyzing: false,
        aiAnalysis: null,
        showAIFeedback: false,
    });

    const [highScore, setHighScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    // 動畫引用
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // 獲取當前問題
    const getCurrentQuestion = (): Question => {
        const questions = gameData[gameState.currentLevel];
        return questions[gameState.currentQuestionIndex];
    };

    // 加載最高分
    useEffect(() => {
        loadHighScore();
    }, []);

    const loadHighScore = async () => {
        try {
            const saved = await AsyncStorage.getItem(`listening_game_high_score_${gameState.currentLevel}`);
            if (saved) setHighScore(parseInt(saved));
        } catch (error) {
            console.error('Failed to load highest score:', error);
        }
    };

    const saveHighScore = async (newScore: number) => {
        try {
            if (newScore > highScore) {
                setHighScore(newScore);
                await AsyncStorage.setItem(`listening_game_high_score_${gameState.currentLevel}`, newScore.toString());
            }
        } catch (error) {
            console.error('Failed to save highest score:', error);
        }
    };

    // 播放語音
    const playAudio = async () => {
        if (gameState.isPlaying) {
            stopAudio();
            return;
        }

        const question = getCurrentQuestion();

        setGameState(prev => ({ ...prev, isPlaying: true }));

        // 播放按鈕動畫
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            const rate = gameState.currentLevel === 'easy' ? 0.9 :
                gameState.currentLevel === 'medium' ? 1.0 : 1.1;

            await Speech.speak(question.audioText, {
                language: 'en-US',
                rate,
                pitch: 1.0,
                volume: 1.0,
                onDone: () => {
                    setGameState(prev => ({ ...prev, isPlaying: false }));
                },
                onError: () => {
                    setGameState(prev => ({ ...prev, isPlaying: false }));
                    Alert.alert('Playback failed', 'Unable to play audio, please check your device.');
                }
            });
        } catch (error) {
            setGameState(prev => ({ ...prev, isPlaying: false }));
            Alert.alert('Playback failed', 'Unable to play audio, please check your device.');
        }
    };

    const stopAudio = () => {
        Speech.stop();
        setGameState(prev => ({ ...prev, isPlaying: false }));
    };

    // 選擇選項
    const handleOptionSelect = (option: Option) => {
        if (gameState.isAnswered || gameState.gameCompleted) return;

        stopAudio();

        const isCorrect = option.correct;
        setGameState(prev => ({
            ...prev,
            isAnswered: true,
            selectedOptionId: option.id
        }));

        if (isCorrect) {
            Vibration.vibrate(50);
            const newStreak = gameState.streak + 1;
            const newScore = gameState.score + 10 * newStreak;
            const newMaxStreak = Math.max(newStreak, gameState.maxStreak);

            setGameState(prev => ({
                ...prev,
                score: newScore,
                streak: newStreak,
                maxStreak: newMaxStreak,
                correctAnswers: prev.correctAnswers + 1
            }));
        } else {
            Vibration.vibrate([0, 50, 50, 50]);
            setGameState(prev => ({ ...prev, streak: 0 }));
        }

        // 更新進度條
        Animated.timing(progressAnim, {
            toValue: ((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100,
            duration: 500,
            useNativeDriver: false,
        }).start();
    };

    // 下一題
    const nextQuestion = () => {
        if (gameState.currentQuestionIndex >= gameState.totalQuestions - 1) {
            endGame();
            return;
        }

        setGameState(prev => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
            isAnswered: false,
            showHint: false,
            selectedOptionId: null
        }));

        stopAudio();
    };

    // 切換難度
    const changeLevel = (level: Difficulty) => {
        if (gameState.isPlaying) {
            Alert.alert('hint', 'Please stop audio playback first.');
            return;
        }

        // 重置所有狀態，包括 AI 相關狀態
        setGameState({
            currentLevel: level,
            currentQuestionIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctAnswers: 0,
            totalQuestions: gameData[level].length, // 根據新難度動態設置總題數
            isAnswered: false,
            isPlaying: false,
            gameCompleted: false,
            showHint: false,
            selectedOptionId: null,
            isAnalyzing: false,
            aiAnalysis: null,
            showAIFeedback: false
        });

        progressAnim.setValue(0);
        loadHighScore();
        setShowResult(false); // 確保結果模態框關閉
    };
    // 結束遊戲
    const endGame = () => {
        setGameState(prev => ({ ...prev, gameCompleted: true }));
        saveHighScore(gameState.score);
        setShowResult(true);
    };

    // 重新開始遊戲
    const restartGame = () => {
        setGameState({
            currentLevel: 'easy',
            currentQuestionIndex: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            correctAnswers: 0,
            totalQuestions: 2,
            isAnswered: false,
            isPlaying: false,
            gameCompleted: false,
            showHint: false,
            selectedOptionId: null,
            isAnalyzing: false,
            aiAnalysis: null,
            showAIFeedback: false
        });

        progressAnim.setValue(0);
        setShowResult(false);
    };

    // 顯示提示
    const toggleHint = () => {
        setGameState(prev => ({ ...prev, showHint: !prev.showHint }));
    };

    // 獲取難度標籤
    const getLevelLabel = (level: Difficulty): string => {
        switch (level) {
            case 'easy': return 'Elementary (vocabulary)';
            case 'medium': return 'Intermediate (sentences)';
            case 'hard': return 'Advanced (Dialogue)';
            default: return 'primary';
        }
    };

    // 計算準確率
    const calculateAccuracy = (): number => {
        return Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100);
    };

    // 獲取星級評價
    const getStarRating = (accuracy: number): number => {
        return Math.min(5, Math.ceil(accuracy / 20));
    };

    // 獲取結果消息
    const getResultMessage = (accuracy: number): string => {
        if (accuracy === 100) return "Excellent! Full marks! Your listening skills are outstanding!";
        if (accuracy >= 80) return "Great! Your listening skills are excellent, keep it up!";
        if (accuracy >= 60) return "Good! With more practice, you'll get even better!";
        return "Keep practicing! Language learning takes time, and persistence pays off!";
    };

    // AI 分析功能
    const analyzeWithAI = async () => {
        if (gameState.isAnalyzing) return;

        setGameState(prev => ({ ...prev, isAnalyzing: true }));

        try {
            const accuracy = calculateAccuracy();

            // 準備發送給 AI 的數據
            const aiRequestData = {
                score: gameState.score,
                accuracy: accuracy,
                totalQuestions: gameState.totalQuestions,
                correctAnswers: gameState.correctAnswers,
                maxStreak: gameState.maxStreak,
                difficulty: getLevelLabel(gameState.currentLevel),
                gameType: 'Listening Game',
                timestamp: new Date().toISOString()
            };

            console.log('發送給 AI 的數據:', aiRequestData);

            // 直接連接到 LM Studio 本地模型
            // 修改 fetch 請求中的 system prompt
            const response = await fetch('http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'local-model',
                    messages: [
                        {
                            role: "system",
                            content: "You are an English language learning expert. You MUST respond ONLY with valid, COMPLETE JSON format. Ensure the JSON is properly closed with all brackets. Do not include any other text or explanation."
                        },
                        {
                            role: "user",
                            content: `Analyze this English listening game performance and provide feedback in JSON format:

Game Difficulty: ${aiRequestData.difficulty}
Total Score: ${aiRequestData.score}
Accuracy: ${aiRequestData.accuracy}%
Correct Answers: ${aiRequestData.correctAnswers}/${aiRequestData.totalQuestions}
Max Streak: ${aiRequestData.maxStreak}

Return EXACTLY this JSON structure:
{
  "feedback": "Your concise feedback here (max 15 words)",
  "suggestions": ["First suggestion", "Second suggestion"],
  "strengths": [],
  "areas_to_improve": [],
  "estimated_level": "",
  "recommended_next_steps": []
}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 300,  // 增加 tokens 確保完整回應
                    stream: false
                }),
            });

            if (!response.ok) {
                throw new Error(`AI Service error: ${response.status}`);
            }

            const data = await response.json();
            console.log('AI 原始響應:', data);

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('AI response format is incorrect');
            }

            const aiResponseText = data.choices[0].message.content;
            console.log('AI 響應文本:', aiResponseText);

            // 解析 AI 響應
            let aiAnalysis: AIAnalysisResponse;

            try {
                // 清理響應文本
                let cleanedText = aiResponseText.trim();

                // 移除可能的 markdown 代碼塊
                if (cleanedText.startsWith('```json')) {
                    cleanedText = cleanedText.substring(7);
                }
                if (cleanedText.startsWith('```')) {
                    cleanedText = cleanedText.substring(3);
                }
                if (cleanedText.endsWith('```')) {
                    cleanedText = cleanedText.substring(0, cleanedText.length - 3);
                }

                cleanedText = cleanedText.trim();

                console.log('清理後的文本:', cleanedText);

                // === 新增：修復不完整的 JSON ===
                // 檢查 JSON 是否完整，如果不完整則修復
                let jsonStr = cleanedText;

                // 統計大括號數量
                const openBraces = (jsonStr.match(/{/g) || []).length;
                const closeBraces = (jsonStr.match(/}/g) || []).length;

                // 如果缺少結束大括號，則添加
                if (openBraces > closeBraces) {
                    console.log('檢測到不完整 JSON，嘗試修復...');
                    jsonStr = jsonStr + '}';
                }

                // 如果 JSON 不以 { 開頭，嘗試找到並提取 JSON
                if (!jsonStr.startsWith('{')) {
                    const jsonStart = jsonStr.indexOf('{');
                    if (jsonStart !== -1) {
                        jsonStr = jsonStr.substring(jsonStart);
                    }
                }

                console.log('修復後的 JSON:', jsonStr);
                // === 修復結束 ===

                // 嘗試解析 JSON
                const parsed = JSON.parse(jsonStr);  // 使用修復後的 jsonStr

                // 驗證必需字段
                if (!parsed.feedback || !Array.isArray(parsed.suggestions)) {
                    throw new Error('Missing required fields in AI response');
                }

                // 確保簡短
                const truncateText = (text: string, maxWords: number = 15) => {
                    const words = text.split(' ');
                    if (words.length > maxWords) {
                        return words.slice(0, maxWords).join(' ') + '...';
                    }
                    return text;
                };

                aiAnalysis = {
                    feedback: truncateText(parsed.feedback, 15),
                    suggestions: parsed.suggestions.slice(0, 3).map((s: string) => truncateText(s, 10)),
                    strengths: parsed.strengths || [],
                    areas_to_improve: parsed.areas_to_improve || [],
                    estimated_level: parsed.estimated_level || "",
                    recommended_next_steps: parsed.recommended_next_steps || []
                };

            } catch (parseError) {
                console.error('AI 響應解析失敗:', parseError);
                console.error('原始響應:', aiResponseText);

                // 創建有意義的默認響應
                let performanceLevel = '';
                if (accuracy >= 80) performanceLevel = 'excellent';
                else if (accuracy >= 60) performanceLevel = 'good';
                else if (accuracy >= 40) performanceLevel = 'fair';
                else performanceLevel = 'needs improvement';

                let suggestionsList = [];
                if (gameState.currentLevel === 'easy') {
                    suggestionsList = [
                        "Practice basic vocabulary daily",
                        "Listen to simple English words",
                        "Use flashcards for memorization"
                    ];
                } else if (gameState.currentLevel === 'medium') {
                    suggestionsList = [
                        "Listen to simple sentences",
                        "Practice common phrases",
                        "Watch English videos with subtitles"
                    ];
                } else {
                    suggestionsList = [
                        "Practice listening to conversations",
                        "Focus on question patterns",
                        "Try English podcasts for beginners"
                    ];
                }

                aiAnalysis = {
                    feedback: `You scored ${aiRequestData.score} points with ${accuracy}% accuracy. ${performanceLevel} performance!`,
                    suggestions: suggestionsList.slice(0, 2),
                    strengths: [],
                    areas_to_improve: [],
                    estimated_level: "",
                    recommended_next_steps: []
                };
            }

            console.log('最終 AI 分析結果:', aiAnalysis);



            setGameState(prev => ({
                ...prev,
                aiAnalysis: aiAnalysis,
                showAIFeedback: true
            }));

        } catch (error: any) {
            console.error('AI 分析錯誤:', error);

            // 創建一個有意義的默認響應
            const accuracy = calculateAccuracy();
            let suggestions = [];

            if (gameState.currentLevel === 'easy') {
                suggestions = ["Practice daily vocabulary", "Use word games"];
            } else if (gameState.currentLevel === 'medium') {
                suggestions = ["Listen to simple sentences", "Practice common phrases"];
            } else {
                suggestions = ["Try conversation practice", "Focus on question forms"];
            }

            const mockAnalysis: AIAnalysisResponse = {
                feedback: `Your performance: ${gameState.score} points, ${accuracy}% accuracy. Good effort!`,
                suggestions: suggestions,
                strengths: [],
                areas_to_improve: [],
                estimated_level: "",
                recommended_next_steps: []
            };

            setGameState(prev => ({
                ...prev,
                aiAnalysis: mockAnalysis,
                showAIFeedback: true
            }));
        } finally {
            setGameState(prev => ({ ...prev, isAnalyzing: false }));
        }
    };

    const currentQuestion = getCurrentQuestion();
    const accuracy = calculateAccuracy();
    const stars = getStarRating(accuracy);
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    // AI 反饋模態框
    // AI 反饋模態框 - 簡化版本
    const AIFeedbackModal = () => {
        if (!gameState.aiAnalysis) return null;

        return (
            <Modal
                visible={gameState.showAIFeedback}
                transparent
                animationType="slide"
                onRequestClose={() => setGameState(prev => ({ ...prev, showAIFeedback: false }))}
            >
                <View style={styles.aiModal}>
                    <View style={styles.aiModalContent}>
                        {/* 關閉按鈕 */}
                        <TouchableOpacity
                            style={styles.aiCloseButton}
                            onPress={() => setGameState(prev => ({ ...prev, showAIFeedback: false }))}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>

                        {/* AI 頭像和標題 */}
                        <View style={styles.aiHeader}>
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.aiAvatar}
                            >
                                <Ionicons name="sparkles" size={32} color="white" />
                            </LinearGradient>
                            <Text style={styles.aiTitle}>AI Learning Coach Analysis</Text>
                            <Text style={styles.aiSubtitle}>Personalized Learning Suggestions</Text>
                        </View>

                        {/* 成績摘要 */}
                        <View style={styles.scoreSummary}>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreLabel}>Total Score</Text>
                                <Text style={styles.scoreValue}>{gameState.score}</Text>
                            </View>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreLabel}>Correct Answers</Text>
                                <Text style={styles.scoreValue}>
                                    {gameState.correctAnswers}/{gameState.totalQuestions}
                                </Text>
                            </View>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreLabel}>Accuracy</Text>
                                <Text style={styles.scoreValue}>{calculateAccuracy()}%</Text>
                            </View>
                        </View>

                        {/* 整體反饋 */}
                        <View style={styles.aiSection}>
                            <View style={styles.aiSectionHeader}>
                                <Ionicons name="chatbubble-ellipses" size={20} color="#4b6cb7" />
                                <Text style={styles.aiSectionTitle}>Overall Feedback</Text>
                            </View>
                            <Text style={styles.aiFeedbackText}>{gameState.aiAnalysis.feedback}</Text>
                        </View>

                        {/* 改進建議 - 只顯示這個 */}
                        {gameState.aiAnalysis.suggestions && gameState.aiAnalysis.suggestions.length > 0 && (
                            <View style={styles.aiSection}>
                                <View style={styles.aiSectionHeader}>
                                    <Ionicons name="bulb" size={20} color="#FF9800" />
                                    <Text style={styles.aiSectionTitle}>Learning Suggestions</Text>
                                </View>
                                <View style={styles.aiList}>
                                    {gameState.aiAnalysis.suggestions.map((suggestion, index) => (
                                        <View key={index} style={styles.aiListItem}>
                                            <Ionicons name="arrow-forward" size={16} color="#4b6cb7" />
                                            <Text style={styles.aiListItemText}>{suggestion}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* 關閉按鈕 */}
                        <TouchableOpacity
                            style={styles.aiCloseButtonMain}
                            onPress={() => setGameState(prev => ({ ...prev, showAIFeedback: false }))}
                        >
                            <Text style={styles.aiCloseButtonText}>Close analysis</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
            >
                <LinearGradient
                    colors={['#f5f7fa', '#c3cfe2']}
                    style={styles.gradient}
                >
                    {/* 遊戲標題 */}
                    <View style={styles.header}>
                        <Ionicons name="headset" size={32} color="#4b6cb7" />
                        <Text style={styles.title}>Listening Game</Text>
                        <Text style={styles.subtitle}>Listen to the audio and select the correct image/text</Text>
                    </View>

                    {/* 遊戲信息 */}
                    <View style={styles.gameInfo}>
                        <View style={styles.stats}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{gameState.score}</Text>
                                <Text style={styles.statLabel}>Score</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>
                                    {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
                                </Text>
                                <Text style={styles.statLabel}>Question</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{gameState.streak}</Text>
                                <Text style={styles.statLabel}>Streak</Text>
                            </View>
                        </View>

                        {/* 難度選擇器 */}
                        <View style={styles.levelSelector}>
                            <Text style={styles.levelLabel}>Difficulty:</Text>
                            {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.levelButton,
                                        gameState.currentLevel === level && styles.levelButtonActive
                                    ]}
                                    onPress={() => changeLevel(level)}
                                    disabled={gameState.isPlaying}
                                >
                                    <Text style={[
                                        styles.levelButtonText,
                                        gameState.currentLevel === level && styles.levelButtonTextActive
                                    ]}>
                                        {level === 'easy' ? 'Beginner' : level === 'medium' ? 'Intermediate' : 'Advanced'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 問題區域 */}
                    <View style={styles.questionArea}>
                        <Text style={styles.questionText}>
                            {gameState.currentLevel === 'easy' ? 'Listen to the word and select the correct image/text' :
                                gameState.currentLevel === 'medium' ? 'Listen to the sentence and select the correct image/text' :
                                    'Listen to the conversation and select the correct image/text'}
                        </Text>

                        {/* 音頻控制 */}
                        <View style={styles.audioControls}>
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <TouchableOpacity
                                    style={[styles.playButton, gameState.isPlaying && styles.playButtonPlaying]}
                                    onPress={playAudio}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={gameState.isPlaying ? "pause" : "volume-high"}
                                        size={32}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            </Animated.View>

                            <View style={[styles.audioInfo, gameState.isPlaying && styles.audioInfoPlaying]}>
                                <Ionicons
                                    name={gameState.isPlaying ? "play" : "musical-notes"}
                                    size={16}
                                    color={gameState.isPlaying ? "#4b6cb7" : "#666"}
                                />
                                <Text style={[
                                    styles.audioInfoText,
                                    gameState.isPlaying && styles.audioInfoTextPlaying
                                ]}>
                                    {gameState.isPlaying ? "Playing..." : "Click the play button to hear the pronunciation"}
                                </Text>
                            </View>
                        </View>

                        {/* 進度條 */}
                        <View style={styles.progressBar}>
                            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                        </View>
                    </View>

                    {/* 選項容器 */}
                    <View style={styles.optionsGrid}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = gameState.isAnswered && option.correct;
                            const isIncorrect = gameState.isAnswered &&
                                !option.correct &&
                                option.id === gameState.selectedOptionId;

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.option,
                                        currentQuestion.options.length % 2 !== 0 &&
                                        index === currentQuestion.options.length - 1 &&
                                        styles.lastOption,
                                        isSelected && styles.optionCorrect,
                                        isIncorrect && styles.optionIncorrect
                                    ]}
                                    onPress={() => handleOptionSelect(option)}
                                    disabled={gameState.isAnswered || gameState.gameCompleted}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                    <Text style={styles.optionText}>{option.text}</Text>

                                    {/* 顯示正確/錯誤標記 */}
                                    {gameState.isAnswered && (
                                        <View style={styles.optionFeedback}>
                                            {option.correct ? (
                                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                            ) : isIncorrect ? (
                                                <Ionicons name="close-circle" size={24} color="#F44336" />
                                            ) : null}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* 反饋區域 */}
                    {gameState.isAnswered && (
                        <View style={[
                            styles.feedbackArea,
                            gameState.streak > 0 ? styles.feedbackCorrect : styles.feedbackIncorrect
                        ]}>
                            <Text style={styles.feedbackText}>
                                {gameState.streak > 0
                                    ? `Correct! +${10 * gameState.streak} points`
                                    : "Incorrect! Try again"}
                            </Text>
                        </View>
                    )}

                    {/* 提示區域 */}
                    {gameState.showHint && (
                        <View style={styles.hintArea}>
                            <View style={styles.hintTitle}>
                                <Ionicons name="bulb" size={20} color="#ff8f00" />
                                <Text style={styles.hintTitleText}>Hint</Text>
                            </View>
                            <Text style={styles.hintText}>{currentQuestion.hint}</Text>
                        </View>
                    )}

                    {/* 控制按鈕 */}
                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.hintButton]}
                            onPress={toggleHint}
                            disabled={gameState.isAnswered}
                        >
                            <Ionicons name="bulb" size={20} color="#666" />
                            <Text style={styles.hintButtonText}>
                                {gameState.showHint ? "Hide Hint" : "Show Hint"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.controlButton, styles.nextButton]}
                            onPress={nextQuestion}
                            disabled={!gameState.isAnswered}
                        >
                            <Ionicons
                                name={gameState.currentQuestionIndex >= gameState.totalQuestions - 1 ? "flag" : "arrow-forward"}
                                size={20}
                                color="white"
                            />
                            <Text style={styles.nextButtonText}>
                                {gameState.currentQuestionIndex >= gameState.totalQuestions - 1
                                    ? "View Results"
                                    : "Next Question"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 最高分顯示 */}
                    <View style={styles.highScoreContainer}>
                        <Ionicons name="trophy" size={16} color="#FFD700" />
                        <Text style={styles.highScoreText}>High Score: {highScore}</Text>
                        <Text style={styles.currentLevelText}>{getLevelLabel(gameState.currentLevel)}</Text>
                    </View>
                </LinearGradient>
            </ScrollView>

            {/* 結果模態框 */}
            <Modal
                visible={showResult}
                transparent
                animationType="slide"
                onRequestClose={() => setShowResult(false)}
            >
                <View style={styles.resultModal}>
                    <View style={styles.resultContent}>
                        <View style={styles.completionBadge}>
                            <Ionicons name="trophy" size={20} color="white" />
                            <Text style={styles.completionBadgeText}>Quiz Completed</Text>
                        </View>

                        <Text style={styles.resultTitle}>
                            <Ionicons name="trophy" size={28} color="#4b6cb7" />
                            <Text>  Quiz Results</Text>
                        </Text>

                        <Text style={styles.finalScore}>{gameState.score}</Text>

                        {/* 星級評價 */}
                        <View style={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                                <Text key={i} style={styles.star}>
                                    {i < stars ? '★' : '☆'}
                                </Text>
                            ))}
                        </View>

                        <Text style={styles.resultMessage}>
                            {getResultMessage(accuracy)}
                        </Text>

                        {/* 詳細數據 */}
                        <View style={styles.resultDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Correct Answers:</Text>
                                <Text style={styles.detailValue}>{gameState.correctAnswers}/{gameState.totalQuestions}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Accuracy:</Text>
                                <Text style={styles.detailValue}>{accuracy}%</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Max Streak:</Text>
                                <Text style={styles.detailValue}>{gameState.maxStreak}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Difficulty Level:</Text>
                                <Text style={styles.detailValue}>{getLevelLabel(gameState.currentLevel)}</Text>
                            </View>
                        </View>

                        {/* 結果操作按鈕 */}
                        <View style={styles.resultActions}>
                            <TouchableOpacity
                                style={[styles.resultButton, styles.playAgainButton]}
                                onPress={restartGame}
                            >
                                <Ionicons name="refresh" size={20} color="white" />
                                <Text style={styles.playAgainButtonText}>Play Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.resultButton, styles.changeLevelButton]}
                                onPress={() => {
                                    setShowResult(false);
                                    changeLevel(gameState.currentLevel === 'easy' ? 'medium' :
                                        gameState.currentLevel === 'medium' ? 'hard' : 'easy');
                                }}
                            >
                                <Ionicons name="swap-horizontal" size={20} color="#4b6cb7" />
                                <Text style={styles.changeLevelButtonText}>Change Difficulty</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.resultButton, styles.aiAnalysisButton]}
                                onPress={analyzeWithAI}
                                disabled={gameState.isAnalyzing}
                            >
                                {gameState.isAnalyzing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="white" />
                                        <Text style={styles.aiAnalysisButtonText}>
                                            AI Analysis
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.resultButton, styles.menuButton]}
                                onPress={() => {
                                    setShowResult(false);
                                    restartGame();
                                }}
                            >
                                <Ionicons name="home" size={20} color="#666" />
                                <Text style={styles.menuButtonText}>Return to Main Menu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* AI 反饋模態框 */}
            <AIFeedbackModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    gradient: {
        flex: 1,
        padding: 20,
        minHeight: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#182848',
        marginTop: 10,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    gameInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    levelSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    levelLabel: {
        fontSize: 16,
        color: '#333',
        marginRight: 10,
    },
    levelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#4b6cb7',
        backgroundColor: 'white',
        marginHorizontal: 5,
        marginVertical: 3,
    },
    levelButtonActive: {
        backgroundColor: '#4b6cb7',
    },
    levelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4b6cb7',
    },
    levelButtonTextActive: {
        color: 'white',
    },
    questionArea: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    questionText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    audioControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 15,
    },
    playButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#4b6cb7',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    playButtonPlaying: {
        backgroundColor: '#182848',
    },
    audioInfo: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    audioInfoPlaying: {
        backgroundColor: '#e8edff',
    },
    audioInfoText: {
        fontSize: 14,
        color: '#666',
    },
    audioInfoTextPlaying: {
        color: '#4b6cb7',
        fontWeight: '600',
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        marginTop: 15,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4b6cb7',
        borderRadius: 4,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 15,
    },
    option: {
        width: '48%',
        minHeight: 120,
        borderWidth: 3,
        borderColor: '#e9ecef',
        borderRadius: 15,
        backgroundColor: 'white',
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    optionCorrect: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    optionIncorrect: {
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    optionEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    optionFeedback: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    feedbackArea: {
        minHeight: 60,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedbackCorrect: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    feedbackIncorrect: {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
    },
    feedbackText: {
        fontSize: 16,
        fontWeight: '500',
    },
    hintArea: {
        backgroundColor: '#fff8e1',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 5,
        borderLeftColor: '#ffb300',
    },
    hintTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    hintTitleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff8f00',
        marginLeft: 8,
    },
    hintText: {
        fontSize: 14,
        color: '#5d4037',
        lineHeight: 20,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 15,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 140,
        gap: 8,
    },
    hintButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#dee2e6',
    },
    hintButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
    },
    nextButton: {
        backgroundColor: '#4b6cb7',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    highScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 10,
    },
    highScoreText: {
        fontSize: 14,
        color: '#666',
    },
    currentLevelText: {
        fontSize: 12,
        color: '#4b6cb7',
        backgroundColor: 'rgba(75, 108, 183, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    resultModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
    },
    completionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30,
        marginBottom: 20,
        gap: 8,
    },
    completionBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4b6cb7',
        marginBottom: 20,
        textAlign: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    finalScore: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#182848',
        marginVertical: 20,
    },
    stars: {
        flexDirection: 'row',
        marginVertical: 20,
        gap: 10,
    },
    star: {
        fontSize: 32,
        color: '#FFD700',
    },
    resultMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    resultDetails: {
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        marginBottom: 30,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#182848',
    },
    resultActions: {
        flexDirection: 'column',
        gap: 15,
        width: '100%',
    },
    resultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 140,
        gap: 8,
    },
    playAgainButton: {
        backgroundColor: '#4b6cb7',
    },
    playAgainButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    changeLevelButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#4b6cb7',
    },
    changeLevelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b6cb7',
    },
    menuButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#dee2e6',
    },
    menuButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    lastOption: {
        alignSelf: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    aiAnalysisButton: {
        backgroundColor: '#9C27B0',
    },
    aiAnalysisButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    // AI 模態框樣式
    aiModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    aiModalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        width: '95%',
        maxWidth: 500,
        maxHeight: '85%',
    },
    aiCloseButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
        padding: 5,
    },
    aiHeader: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    aiAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    aiTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    aiSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    scoreSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    scoreItem: {
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4b6cb7',
    },
    aiSection: {
        marginBottom: 20,
    },
    aiSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    aiSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    aiFeedbackText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        textAlign: 'justify',
    },
    aiList: {
        gap: 10,
    },
    aiListItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 8,
    },
    aiListItemText: {
        fontSize: 15,
        color: '#444',
        flex: 1,
        lineHeight: 22,
    },
    levelBadge: {
        backgroundColor: '#9C27B0',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    levelText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    aiCloseButtonMain: {
        backgroundColor: '#4b6cb7',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    aiCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ListeningGame;