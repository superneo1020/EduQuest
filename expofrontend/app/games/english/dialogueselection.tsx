// english/dialogueselection.tsx
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, StatusBar, Image, Animated, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';
import { writingAIService, TOPICS, Topic, Question, ConversationTurn, ConversationAnalysis } from '../../services/dialogueAIService';

type GameState = 'difficulty_select' | 'topic_select' | 'playing' | 'summary';
type SubTopicState = 'selecting' | 'playing';

const CHARACTERS = {
    ai: {
        name: 'Lingua',
        avatar: '🦊',
        color: '#FFB74D',
        greeting: "Hi there! I'm Lingua! Let's learn English together! 🎉"
    },
    user: {
        name: 'You',
        avatar: '🐻',
        color: '#81C784'
    }
};

const DIFFICULTY_CONFIG = {
    easy: { label: 'Easy', color: '#4CAF50', bgColor: '#E8F5E9', icon: '🌟' },
    hard: { label: 'Hard', color: '#F44336', bgColor: '#FFEBEE', icon: '🔥' }
};

// 總題數
const TOTAL_QUESTIONS = 8;

// 子主題選項（以 Sports 為例）
const SUB_TOPICS: Record<string, string[]> = {
    sports: ['Basketball', 'Football', 'Tennis', 'Swimming'],
    lunch: ['Sandwich', 'Pizza', 'Salad', 'Pasta'],
    hobbies: ['Drawing', 'Reading', 'Music', 'Gaming'],
    selfIntro: ['Family', 'School', 'Pets', 'Friends'],
    interests: ['Movies', 'Sports', 'Art', 'Science'],
    commute: ['Bus', 'Walking', 'Bike', 'Car'],
    directions: ['Museum', 'Library', 'Park', 'Hospital'],
    travel: ['Beach', 'Mountain', 'City', 'Countryside'],
    culture: ['Festivals', 'Food', 'Music', 'Dance'],
    help: ['Emergency', 'Lost', 'Sick', 'Stuck']
};

export default function WritingScreen() {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // 完全隐藏系统导航栏（包括返回按钮和标题）
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const [gameState, setGameState] = useState<GameState>('difficulty_select');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'hard' | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

    // 修改：改为单题模式
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [conversation, setConversation] = useState<ConversationTurn[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingNext, setIsLoadingNext] = useState(false);  // 加載下一題中
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false); // AI 生成題目中
    const [summary, setSummary] = useState<ConversationAnalysis | null>(null);
    const [scoreAnimation] = useState(new Animated.Value(0));

    // 子主題相關狀態
    const [subTopicState, setSubTopicState] = useState<SubTopicState>('selecting');
    const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);

    // 統計數據
    const [correctCount, setCorrectCount] = useState(0);
    const [totalScore, setTotalScore] = useState(0);

    const scrollViewRef = useRef<ScrollView>(null);

    // ========== 💾 保存分數到伺服器 ==========
    const saveScore = async (finalScore: number) => {
        if (!token) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "Dialogue Selection",
                scores: finalScore,
                difficulty: selectedDifficulty === 'easy' ? 'EASY' : 'HARD'
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

    const selectDifficulty = (difficulty: 'easy' | 'hard') => {
        setSelectedDifficulty(difficulty);
        setGameState('topic_select');
    };

    // 生成單一題目
    const generateSingleQuestion = async (topic: Topic, questionNumber: number): Promise<Question> => {
        console.log(`Generating question ${questionNumber + 1} for topic: ${topic.name}`);

        // 顯示 AI 生成中狀態
        setIsGeneratingQuestion(true);

        try {
            const generatedQuestions = await writingAIService.generateQuestions(topic, 1, questionNumber);

            if (generatedQuestions && generatedQuestions.length > 0) {
                return generatedQuestions[0];
            }

            // 如果生成失敗，使用備用題目
            return writingAIService.getFallbackQuestion(topic, questionNumber);
        } finally {
            setIsGeneratingQuestion(false);
        }
    };

    // 生成子主題選擇問題
    const generateSubTopicSelection = async (topic: Topic) => {
        setIsLoading(true);
        const subTopics = SUB_TOPICS[topic.id] || ['Option 1', 'Option 2'];

        const selectionQuestion = await writingAIService.generateSubTopicQuestion(topic, subTopics);
        setCurrentQuestion(selectionQuestion);
        setSubTopicState('selecting');

        // 添加 AI 的開場白
        const aiTurn: ConversationTurn = {
            role: 'assistant',
            content: selectionQuestion.context,
        };
        setConversation([aiTurn]);
        setIsLoading(false);
    };

    // 處理子主題選擇
    const handleSubTopicSelection = async (answer: string) => {
        if (!selectedTopic || !currentQuestion) return;

        // 提取用戶選擇的子主題
        let chosenSubTopic = '';
        const subTopics = SUB_TOPICS[selectedTopic.id] || ['Option 1', 'Option 2'];

        for (const st of subTopics) {
            if (answer.includes(st)) {
                chosenSubTopic = st;
                break;
            }
        }

        if (!chosenSubTopic) {
            // 如果無法匹配，使用第一個選項
            chosenSubTopic = subTopics[0];
        }

        setSelectedSubTopic(chosenSubTopic);

        // 添加用戶的選擇
        const userTurn: ConversationTurn = {
            role: 'user',
            content: answer,
            isCorrect: true,
            score: 100
        };

        const aiResponse: ConversationTurn = {
            role: 'assistant',
            content: `Great choice! I love ${chosenSubTopic} too! Let's talk more about ${chosenSubTopic}! 🎉`,
        };

        setConversation(prev => [...prev, userTurn, aiResponse]);

        // 切換到遊戲模式並生成第一題
        setSubTopicState('playing');
        setCurrentIndex(0);
        setCorrectCount(0);
        setTotalScore(0);
        setSelectedAnswer(null);

        // 生成第一題（基於選擇的子主題）
        const firstQuestion = await writingAIService.generateSubTopicQuestionContent(selectedTopic, chosenSubTopic, 0);
        setCurrentQuestion(firstQuestion);

        // 添加 AI 的下一題對話
        const nextAiTurn: ConversationTurn = {
            role: 'assistant',
            content: firstQuestion.context,
        };
        setConversation(prev => [...prev, nextAiTurn]);

        // 滾動到底部
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const selectTopic = async (topic: Topic) => {
        setSelectedTopic(topic);
        setGameState('playing');

        // 重置狀態
        setCurrentIndex(0);
        setCorrectCount(0);
        setTotalScore(0);
        setConversation([]);
        setSelectedAnswer(null);
        setSelectedSubTopic(null);
        setSubTopicState('selecting');

        // 生成子主題選擇問題
        await generateSubTopicSelection(topic);
    };

    // 加載下一題
    const loadNextQuestion = async () => {
        if (!selectedTopic || !selectedSubTopic) return;

        const nextIdx = currentIndex + 1;

        // 檢查是否還有下一題
        if (nextIdx >= TOTAL_QUESTIONS) {
            finishGame();
            return;
        }

        setIsLoadingNext(true);

        try {
            // 生成下一題（基於選擇的子主題）
            const nextQuestionData = await writingAIService.generateSubTopicQuestionContent(selectedTopic, selectedSubTopic, nextIdx);
            setCurrentQuestion(nextQuestionData);
            setCurrentIndex(nextIdx);
            setSelectedAnswer(null);

            // 添加 AI 的下一題對話
            const aiTurn: ConversationTurn = {
                role: 'assistant',
                content: nextQuestionData.context,
            };
            setConversation(prev => [...prev, aiTurn]);

            // 滾動到底部
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Failed to load next question:', error);
            // 使用備用題目
            const fallbackQuestion = writingAIService.getFallbackSubTopicContentQuestion(selectedTopic, selectedSubTopic, nextIdx);
            setCurrentQuestion(fallbackQuestion);
            setCurrentIndex(nextIdx);
            setSelectedAnswer(null);

            const aiTurn: ConversationTurn = {
                role: 'assistant',
                content: fallbackQuestion.context,
            };
            setConversation(prev => [...prev, aiTurn]);
        } finally {
            setIsLoadingNext(false);
        }
    };

    const handleAnswer = (answer: string) => {
        if (selectedAnswer !== null || isLoading || isLoadingNext || isGeneratingQuestion || !currentQuestion) return;

        // 如果還在選擇子主題階段，調用專門的處理函數
        if (subTopicState === 'selecting') {
            handleSubTopicSelection(answer);
            return;
        }

        const evaluation = writingAIService.evaluateAnswer(currentQuestion, answer);

        setSelectedAnswer(answer);

        // 更新統計
        if (evaluation.isCorrect) {
            setCorrectCount(prev => prev + 1);
            setTotalScore(prev => prev + evaluation.score);
        }

        // 添加用戶的回答
        const userTurn: ConversationTurn = {
            role: 'user',
            content: answer,
            score: evaluation.score,
            feedback: evaluation.feedback,
            isCorrect: evaluation.isCorrect
        };

        // 添加 AI 的回饋
        const aiResponse: ConversationTurn = {
            role: 'assistant',
            content: evaluation.feedback,
        };

        setConversation(prev => [...prev, userTurn, aiResponse]);

        // 延遲後加載下一題
        setTimeout(() => {
            loadNextQuestion();
        }, 1500);
    };

    const finishGame = async () => {
        if (!selectedTopic) return;

        setIsLoading(true);

        // 計算最終分數（百分比）
        const finalPercentage = TOTAL_QUESTIONS > 0 ? Math.round((correctCount / TOTAL_QUESTIONS) * 100) : 0;

        // 生成總結
        const analysis = await writingAIService.generateConversationSummary(conversation, selectedTopic);

        // 更新總結中的分數
        const finalAnalysis: ConversationAnalysis = {
            ...analysis,
            totalScore: finalPercentage,
            averageScore: finalPercentage,
            correctCount: correctCount,
            totalQuestions: TOTAL_QUESTIONS
        };

        setSummary(finalAnalysis);

        // 保存分數到伺服器
        await saveScore(finalPercentage);

        setGameState('summary');
        setIsLoading(false);
    };

    const restartCurrentTopic = async () => {
        if (!selectedTopic) return;

        setIsLoading(true);

        // 重置所有狀態
        setCurrentIndex(0);
        setCorrectCount(0);
        setTotalScore(0);
        setSelectedAnswer(null);
        setSummary(null);
        setSelectedSubTopic(null);
        setSubTopicState('selecting');

        // 重新生成子主題選擇問題
        await generateSubTopicSelection(selectedTopic);

        setGameState('playing');
        setIsLoading(false);
    };

    const exitToDifficultySelect = () => {
        setGameState('difficulty_select');
        setSelectedDifficulty(null);
        setSelectedTopic(null);
        setCurrentQuestion(null);
        setCurrentIndex(0);
        setConversation([]);
        setSelectedAnswer(null);
        setSummary(null);
        setCorrectCount(0);
        setTotalScore(0);
        setSelectedSubTopic(null);
        setSubTopicState('selecting');
    };

    const handleBackToGames = () => router.back();

    const CharacterAvatar = ({ role, size = 50 }: { role: 'ai' | 'user', size?: number }) => {
        const char = role === 'ai' ? CHARACTERS.ai : CHARACTERS.user;
        return (
            <View style={[styles.avatar, { width: size, height: size, backgroundColor: char.color }]}>
                <Text style={[styles.avatarText, { fontSize: size * 0.5 }]}>{char.avatar}</Text>
            </View>
        );
    };

    const MessageBubble = ({ turn, index }: { turn: ConversationTurn, index: number }) => {
        const isUser = turn.role === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
                {!isUser && <CharacterAvatar role="ai" size={40} />}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    <Text style={isUser ? styles.userText : styles.aiText}>{turn.content}</Text>
                    {turn.isCorrect !== undefined && (
                        <View style={[styles.resultBadge, turn.isCorrect ? styles.correctBadge : styles.wrongBadge]}>
                            <Text style={styles.resultBadgeText}>
                                {turn.isCorrect ? `✓ Correct! +${turn.score}` : '✗ Try again next time!'}
                            </Text>
                        </View>
                    )}
                </View>
                {isUser && <CharacterAvatar role="user" size={40} />}
            </View>
        );
    };

    // ========== 难度选择页面 ==========
    const renderDifficultySelect = () => (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="chatbubbles-sharp" size={60} color="#4b6cb7" />
                    </View>
                    <Text style={styles.mainTitle}>Dialogue Selection</Text>
                    <Text style={styles.subTitle}>
                        Practice English through AI-guided dialogues. Get instant scores and final feedback after {TOTAL_QUESTIONS} rounds!
                    </Text>
                </View>

                <View style={styles.menuGrid}>
                    {(['easy', 'hard'] as const).map(level => {
                        const config = DIFFICULTY_CONFIG[level];
                        const features = level === 'easy'
                            ? ['Daily conversations', '6 topics: sports, lunch, hobbies...', 'Fun and simple']
                            : ['Real-world scenarios', '4 topics: directions, travel, culture...', 'More challenging'];
                        return (
                            <TouchableOpacity
                                key={level}
                                style={[styles.diffCard, { backgroundColor: config.bgColor, borderColor: config.color }]}
                                onPress={() => selectDifficulty(level)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardIconContainer}>
                                    <Text style={styles.cardIcon}>{config.icon}</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.diffBtnText, { color: config.color }]}>
                                            {config.label}
                                        </Text>
                                        <View style={[styles.levelBadge, { backgroundColor: config.color }]}>
                                            <Text style={styles.levelBadgeText}>
                                                {level === 'easy' ? 'Beginner' : 'Advanced'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.diffDesc}>{config.label === 'Easy' ? 'Daily conversations' : 'Real-world scenarios'}</Text>

                                    <View style={styles.featuresList}>
                                        {features.map((feature, idx) => (
                                            <View key={idx} style={styles.featureItem}>
                                                <Ionicons name="star" size={12} color={config.color} style={styles.featureIcon} />
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.startButtonContainer}>
                                        <View style={[styles.startButton, { backgroundColor: config.color }]}>
                                            <Text style={styles.startButtonText}>Start →</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.backLink} onPress={handleBackToGames}>
                    <Text style={styles.backLinkText}>← Back to Game Library</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );

    // ========== 主题选择页面 ==========
    const renderTopicSelect = () => {
        const availableTopics = TOPICS.filter(t => t.difficulty === selectedDifficulty);
        const config = selectedDifficulty ? DIFFICULTY_CONFIG[selectedDifficulty] : null;
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#4b6cb7" />
                <LinearGradient colors={['#4b6cb7', '#182848']} style={styles.gameHeader}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => setGameState('difficulty_select')} style={styles.exitButton}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={[styles.difficultyBadge, { backgroundColor: config?.color }]}>
                            <Text style={styles.difficultyBadgeText}>{config?.label}</Text>
                        </View>
                    </View>
                    <Text style={styles.topicSelectTitle}>Select a Topic</Text>
                    <Text style={styles.topicSelectSubtitle}>Choose what you want to practice</Text>
                </LinearGradient>
                <ScrollView style={styles.chatArea} contentContainerStyle={styles.topicGridContainer}>
                    <View style={styles.topicGrid}>
                        {availableTopics.map(topic => (
                            <TouchableOpacity
                                key={topic.id}
                                style={[styles.topicCard, { backgroundColor: topic.color + '15', borderColor: topic.color }]}
                                onPress={() => selectTopic(topic)}
                            >
                                <Text style={styles.topicIcon}>{topic.icon}</Text>
                                <Text style={[styles.topicName, { color: topic.color }]}>{topic.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    // ========== AI 生成題目的加載提示（顯示在回答框區域） ==========
    const renderAIGeneratingIndicator = () => {
        return (
            <View style={styles.optionsPanel}>
                <View style={styles.aiGeneratingContainer}>
                    <View style={styles.aiGeneratingIcon}>
                        <Text style={styles.aiGeneratingIconText}>🦊</Text>
                        <ActivityIndicator size="small" color="#4b6cb7" style={styles.aiGeneratingSpinner} />
                    </View>
                    <Text style={styles.aiGeneratingTitle}>Lingua is thinking...</Text>
                    <Text style={styles.aiGeneratingSubtitle}>Creating a new question for you ✨</Text>
                    <View style={styles.aiGeneratingDots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                    </View>
                </View>
            </View>
        );
    };

    // ========== 加載下一題的提示（顯示在對話區域） ==========
    const renderLoadingNextIndicator = () => {
        return (
            <View style={styles.aiRow}>
                <CharacterAvatar role="ai" size={40} />
                <View style={[styles.bubble, styles.aiBubble, styles.loadingBubble]}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="small" color="#4b6cb7" />
                        <Text style={styles.loadingBubbleText}>Loading next question...</Text>
                    </View>
                </View>
            </View>
        );
    };

    // ========== 游戏主界面 ==========
    const renderPlaying = () => {
        const progress = ((currentIndex) / TOTAL_QUESTIONS) * 100;
        const currentScore = TOTAL_QUESTIONS > 0 ? Math.round((correctCount / TOTAL_QUESTIONS) * 100) : 0;

        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#4b6cb7" />
                <LinearGradient colors={['#4b6cb7', '#182848']} style={styles.gameHeader}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={exitToDifficultySelect} style={styles.exitButton}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreBadgeText}>⭐ {correctCount}/{currentIndex}</Text>
                        </View>
                        <View style={[styles.scoreBadge, { backgroundColor: '#FFD700' }]}>
                            <Text style={styles.scoreBadgeText}>🏆 {currentScore}%</Text>
                        </View>
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.topicNameHeader}>
                        {selectedTopic?.icon} {selectedTopic?.name}
                        {selectedSubTopic && ` • ${selectedSubTopic}`}
                        {subTopicState === 'playing' && ` • Question ${currentIndex + 1}/${TOTAL_QUESTIONS}`}
                        {subTopicState === 'selecting' && ` • Choose your topic`}
                    </Text>
                </LinearGradient>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {conversation.map((turn, idx) => (
                        <MessageBubble key={idx} turn={turn} index={idx} />
                    ))}

                    {/* 顯示加載下一題的提示 */}
                    {isLoadingNext && renderLoadingNextIndicator()}

                    {isLoading && !isLoadingNext && (
                        <View style={styles.aiRow}>
                            <CharacterAvatar role="ai" size={40} />
                            <View style={[styles.bubble, styles.aiBubble]}>
                                <ActivityIndicator size="small" color="#4b6cb7" />
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* 回答框區域 - 顯示 AI 生成題目的加載狀態 */}
                {isGeneratingQuestion ? (
                    renderAIGeneratingIndicator()
                ) : (
                    !isLoading && !isLoadingNext && currentQuestion && selectedAnswer === null && (
                        <View style={styles.optionsPanel}>
                            <View style={styles.optionsContainer}>
                                {currentQuestion.options.map((option, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.optionButton}
                                        onPress={() => handleAnswer(option)}
                                    >
                                        <View style={styles.optionLetter}>
                                            <Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text>
                                        </View>
                                        <Text style={styles.optionText}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {subTopicState === 'selecting' ? (
                                <Text style={styles.hintText}>💡 Choose what you want to talk about!</Text>
                            ) : (
                                <Text style={styles.hintText}>💡 Tap an answer above</Text>
                            )}
                        </View>
                    )
                )}

                {selectedAnswer !== null && !isLoading && !isLoadingNext && !isGeneratingQuestion && (
                    <View style={styles.waitingPanel}>
                        <ActivityIndicator size="large" color="#4b6cb7" />
                        <Text style={styles.waitingText}>Moving to next question...</Text>
                    </View>
                )}
            </View>
        );
    };

    // ========== 总结页面 ==========
    const renderSummary = () => (
        <View style={styles.summaryContainer}>
            <LinearGradient colors={['#4b6cb7', '#182848']} style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>🎉 Great Job! 🎉</Text>
                <Text style={styles.summarySubtitle}>You completed {selectedTopic?.name}{selectedSubTopic && ` - ${selectedSubTopic}`}!</Text>
            </LinearGradient>
            <ScrollView contentContainerStyle={styles.summaryContent}>
                <View style={styles.resultCard}>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreNumber}>{summary?.correctCount}/{summary?.totalQuestions}</Text>
                        <Text style={styles.scoreLabel}>Correct Answers</Text>
                    </View>
                    <View style={styles.percentageCircle}>
                        <Text style={styles.percentageText}>{summary?.totalScore}%</Text>
                    </View>
                </View>

                {isSaving && (
                    <View style={styles.savingIndicator}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.savingText}>Syncing score...</Text>
                    </View>
                )}

                <View style={styles.feedbackCard}>
                    <Text style={styles.feedbackTitle}>🤗 {CHARACTERS.ai.name}'s Feedback</Text>
                    <Text style={styles.feedbackText}>{summary?.feedback}</Text>
                </View>

                {summary?.strengths && summary.strengths.length > 0 && (
                    <View style={styles.strengthsCard}>
                        <Text style={styles.cardTitle}>🌟 Your Strengths</Text>
                        {summary.strengths.map((s, i) => (
                            <View key={i} style={styles.bulletItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.bulletText}>{s}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {summary?.suggestions && summary.suggestions.length > 0 && (
                    <View style={styles.suggestionsCard}>
                        <Text style={styles.cardTitle}>💡 Tips to Improve</Text>
                        {summary.suggestions.map((s, i) => (
                            <View key={i} style={styles.bulletItem}>
                                <Ionicons name="bulb-outline" size={20} color="#FFC107" />
                                <Text style={styles.bulletText}>{s}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.summaryButtons}>
                    <TouchableOpacity style={[styles.summaryBtn, styles.playAgainBtn]} onPress={restartCurrentTopic}>
                        <Ionicons name="refresh" size={22} color="white" />
                        <Text style={styles.summaryBtnText}>Play Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.summaryBtn, styles.difficultySelectBtn]} onPress={exitToDifficultySelect}>
                        <Ionicons name="options" size={22} color="white" />
                        <Text style={styles.summaryBtnText}>Difficulty Select</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.summaryBtn, styles.backBtn]} onPress={handleBackToGames}>
                        <Ionicons name="home" size={22} color="white" />
                        <Text style={styles.summaryBtnText}>Back to Games</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    if (gameState === 'difficulty_select') return renderDifficultySelect();
    if (gameState === 'topic_select') return renderTopicSelect();
    if (gameState === 'summary') return renderSummary();
    return renderPlaying();
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingBottom: 40 },

    // ========== 难度选择页面样式 ==========
    header: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: '#fff',
    },
    iconCircle: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#f0f7ff',
        borderRadius: 60,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        paddingHorizontal: 10,
        lineHeight: 22,
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
        gap: 8,
    },
    diffBtnText: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
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
        lineHeight: 18,
    },
    startButtonContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    startButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 100,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    backLink: {
        marginTop: 20,
        alignItems: 'center',
        paddingBottom: 40,
    },
    backLinkText: {
        fontSize: 16,
        color: '#4b6cb7',
        fontWeight: '600',
    },

    // ========== 主题选择页面样式 ==========
    gameHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    exitButton: { padding: 8 },
    difficultyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    difficultyBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    topicSelectTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    topicSelectSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    topicGridContainer: { paddingVertical: 20, paddingHorizontal: 16 },
    topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    topicCard: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center', flexDirection: 'row', gap: 12 },
    topicIcon: { fontSize: 28 },
    topicName: { fontSize: 16, fontWeight: '600' },

    // ========== 游戏主界面样式 ==========
    scoreBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginLeft: 8 },
    scoreBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
    topicNameHeader: { fontSize: 16, color: 'white', fontWeight: '500' },
    chatArea: { flex: 1, paddingHorizontal: 16 },
    chatContent: { paddingVertical: 16, paddingBottom: 20 },
    messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },
    avatar: { borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    avatarText: { fontWeight: 'bold' },
    bubble: { maxWidth: '70%', padding: 12, borderRadius: 20 },
    userBubble: { backgroundColor: '#4b6cb7', borderBottomRightRadius: 4, marginRight: 8 },
    aiBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4, marginLeft: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    userText: { color: 'white', fontSize: 15 },
    aiText: { color: '#333', fontSize: 15 },
    resultBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    correctBadge: { backgroundColor: '#4CAF50' },
    wrongBadge: { backgroundColor: '#F44336' },
    resultBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },

    optionsPanel: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingTop: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    optionsContainer: { gap: 12 },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4b6cb7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    optionLetterText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    optionText: { flex: 1, fontSize: 15, color: '#333' },
    hintText: { marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' },
    waitingPanel: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 30,
        alignItems: 'center',
        gap: 12
    },
    waitingText: { fontSize: 14, color: '#666' },

    // ========== AI 生成題目加載樣式 ==========
    aiGeneratingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    aiGeneratingIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    aiGeneratingIconText: {
        fontSize: 48,
        marginRight: 12,
    },
    aiGeneratingSpinner: {
        marginLeft: 8,
    },
    aiGeneratingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4b6cb7',
        marginBottom: 8,
    },
    aiGeneratingSubtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
    },
    aiGeneratingDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4b6cb7',
        marginHorizontal: 4,
    },
    dot1: {
        opacity: 0.4,
    },
    dot2: {
        opacity: 0.7,
    },
    dot3: {
        opacity: 1,
    },

    // ========== 加載下一題對話框樣式 ==========
    loadingBubble: {
        backgroundColor: '#f0f0f0',
    },
    loadingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loadingBubbleText: {
        fontSize: 14,
        color: '#666',
    },

    // ========== 总结页面样式 ==========
    summaryContainer: { flex: 1, backgroundColor: '#f5f5f5' },
    summaryHeader: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    summaryTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    summarySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    summaryContent: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
    resultCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 24, padding: 24, marginTop: -30, marginBottom: 20, width: '100%', elevation: 4, justifyContent: 'space-around' },
    scoreCircle: { alignItems: 'center' },
    scoreNumber: { fontSize: 32, fontWeight: 'bold', color: '#4b6cb7' },
    scoreLabel: { fontSize: 12, color: '#666', marginTop: 4 },
    percentageCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4b6cb7', alignItems: 'center', justifyContent: 'center' },
    percentageText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
        alignSelf: 'center',
    },
    savingText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    feedbackCard: { backgroundColor: '#E8F5E9', borderRadius: 20, padding: 20, width: '100%', marginBottom: 16 },
    feedbackTitle: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
    feedbackText: { fontSize: 15, color: '#555', lineHeight: 22 },
    strengthsCard: { backgroundColor: '#E3F2FD', borderRadius: 20, padding: 20, width: '100%', marginBottom: 16 },
    suggestionsCard: { backgroundColor: '#FFF3E0', borderRadius: 20, padding: 20, width: '100%', marginBottom: 24 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    bulletItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    bulletText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 20 },
    summaryButtons: { flexDirection: 'row', gap: 12, width: '100%', flexWrap: 'wrap' },
    summaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, minWidth: '30%' },
    playAgainBtn: { backgroundColor: '#4b6cb7' },
    difficultySelectBtn: { backgroundColor: '#FF9800' },
    backBtn: { backgroundColor: '#FF5722' },
    summaryBtnText: { fontSize: 16, fontWeight: '600', color: 'white' }
});