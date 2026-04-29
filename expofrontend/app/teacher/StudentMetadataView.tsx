import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView, Alert,
} from 'react-native';
import { X, Calendar, Gamepad2, Trophy, Target, Clock, TrendingUp, Brain } from 'lucide-react-native';
import { getApiBaseUrl } from '@/src/api/client';
import axios from 'axios';
import { GameMetadata } from '@/types/GameMetadata';

interface StudentMetadataViewProps {
    visible: boolean;
    onClose: () => void;
    student: {
        id: number;
        username: string;
        email: string;
    };
    token: string;
}

interface GameRecord {
    id: number;
    gameId?: number;  // Add gameId for AI analysis API
    gameName: string;
    scores: number;
    metadata: GameMetadata;
    createdAt: string;
}

export function StudentMetadataView({visible, onClose, student, token}: StudentMetadataViewProps) {
    const [loading, setLoading] = useState(false);
    const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
    const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);
    const [showGameDetails, setShowGameDetails] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [showAiAnalysis, setShowAiAnalysis] = useState(false);
    const [analyzingWithAi, setAnalyzingWithAi] = useState(false);
    // Game selection modal state
    const [showGameSelectionModal, setShowGameSelectionModal] = useState(false);
    const [availableGames, setAvailableGames] = useState<string[]>([]);
    const [selectedGameForAnalysis, setSelectedGameForAnalysis] = useState<string | null>(null);

    useEffect(() => {
        if (visible && student) {
            loadStudentGameMetadata();
        }
    }, [visible, student]);

    const loadStudentGameMetadata = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${getApiBaseUrl()}/api/educator/student/${student.id}/game/score`, {
                headers: {Authorization: `Bearer ${token}`}
            });

            if (response.data && response.data.content) {
                console.log('Full API response:', response.data);
                console.log('Sample record structure:', response.data.content[0]);
                console.log('All fields in first record:', Object.keys(response.data.content[0]));

                const records = response.data.content.map((record: any) => {
                    console.log('Processing record:', record);
                    console.log('Available fields in this record:', Object.keys(record));

                    return {
                        id: record.id,
                        gameId: record.gameId || record.game_id || record.game?.id || record.gameId,  // Try multiple possible fields
                        gameName: record.name,
                        scores: record.scores,
                        metadata: {
                            ...record.metadata,
                            questions: record.metadata?.questions?.map((q: any) => ({
                                ...q,
                                question: q.content || q.question
                            })) || []
                        },
                        createdAt: record.createdAt
                    };
                });
                setGameRecords(records);
            }
        } catch (error) {
            console.error('Error loading student game metadata:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeWithAi = async () => {
        if (gameRecords.length === 0) {
            generateFallbackAnalysis();
            return;
        }
        setAnalyzingWithAi(true);
        try {
            const analysis = await callSpringBootAIAnalysis(student.username);
            setAiAnalysis(analysis);
            setShowAiAnalysis(true);
        } catch (error) {
            console.error('Error calling Spring Boot AI analysis:', error);
            generateFallbackAnalysis();
        } finally {
            setAnalyzingWithAi(false);
        }
    };

    const callSpringBootAIAnalysis = async (studentName: string): Promise<string> => {
        try {

            const response = await axios.get(`${getApiBaseUrl()}/api/user/game/results`, {
                headers: {Authorization: `Bearer ${token}`}
            });

            // 后端返回的数据结构应该是 AiOverallResponse
            const aiData = response.data;
            return formatSpringBootAIResponse(aiData, studentName, gameRecords);
        } catch (error) {
            console.error('Spring Boot AI API error:', error);
            throw error;
        }
    };

    const formatSpringBootAIResponse = (aiData: any, studentName: string, records: GameRecord[]): string => {
        // 统计基本数据
        const totalScore = records.reduce((sum, r) => sum + r.scores, 0);
        const averageScore = records.length ? totalScore / records.length : 0;
        const allQuestions = records.flatMap(r => r.metadata?.questions || []);
        const correctAnswers = allQuestions.filter(q => q.isCorrect).length;
        const accuracyRate = allQuestions.length ? (correctAnswers / allQuestions.length) * 100 : 0;

        // 游戏类型统计
        const gameTypeStats = records.reduce((acc, record) => {
            const type = record.metadata?.gameType || 'Unknown';
            if (!acc[type]) acc[type] = {count: 0, totalScore: 0};
            acc[type].count++;
            acc[type].totalScore += record.scores;
            return acc;
        }, {} as Record<string, { count: number; totalScore: number }>);

        let result = `🧠 AI Learning Analysis Report\n`;
        result += `👤 Student：${studentName}\n`;
        result += `📅 Analysis time：${new Date().toLocaleDateString('zh-TW')}\n\n`;
        result += `📈 Overall performance analysis\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        result += `🎮 Total number of games：${records.length} game\n`;
        result += `📊 Average score：${averageScore.toFixed(1)} point\n`;
        result += `🎯 Answer accuracy：${accuracyRate.toFixed(1)}%\n\n`;
        result += `📚 Learning domain analysis\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        Object.entries(gameTypeStats).forEach(([type, stats]) => {
            const avgScore = stats.totalScore / stats.count;
            result += `🔹 ${type}：${stats.count} games，average ${avgScore.toFixed(1)} point\n`;
        });
        result += `\n💡 AI Learning suggestions\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        if (aiData) {
            if (aiData.encouragementMessage) result += `🌟 ${aiData.encouragementMessage}\n\n`;
            if (aiData.analysis) result += `📊 ${aiData.analysis}\n\n`;
            if (aiData.strengths && Array.isArray(aiData.strengths)) {
                result += `💪 Advantages：\n`;
                aiData.strengths.forEach((s: string, idx: number) => result += `  ${idx + 1}. ${s}\n`);
                result += `\n`;
            }
            if (aiData.powerUpTips && Array.isArray(aiData.powerUpTips)) {
                result += `⚡ Strengthening recommendations：\n`;
                aiData.powerUpTips.forEach((t: string, idx: number) => result += `  ${idx + 1}. ${t}\n`);
                result += `\n`;
            }
            if (aiData.gamesForNextSteps) result += `🎮 Next recommendation：${aiData.gamesForNextSteps}\n`;
        } else {
            result += `AI analysis is temporarily unavailable. Please try again later.\n`;
        }
        return result;
    };

    const formatAIResponse = (aiResponse: string, studentName: string, records: GameRecord[]): string => {
        // Calculate basic statistics
        const totalScore = records.reduce((sum, r) => sum + r.scores, 0);
        const averageScore = totalScore / records.length;
        const allQuestions = records.flatMap(r => r.metadata.questions || []);
        const correctAnswers = allQuestions.filter(q => q.isCorrect).length;
        const accuracyRate = allQuestions.length > 0 ? (correctAnswers / allQuestions.length * 100) : 0;

        // Game types analysis
        const gameTypeStats = records.reduce((acc, record) => {
            const type = record.metadata.gameType || 'Unknown';
            if (!acc[type]) {
                acc[type] = {count: 0, totalScore: 0};
            }
            acc[type].count++;
            acc[type].totalScore += record.scores;
            return acc;
        }, {} as Record<string, { count: number; totalScore: number }>);

        let formattedResponse = `🧠 AI Intelligent Learning Analysis Report \n`;
        formattedResponse += `👤 Student：${studentName}\n`;
        formattedResponse += `📅 Analysis time：${new Date().toLocaleDateString('zh-TW')}\n\n`;

        formattedResponse += `📈 Overall performance analysis\n`;
        formattedResponse += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        formattedResponse += `🎮 Total number of games：${records.length} games\n`;
        formattedResponse += `📊 average score：${averageScore.toFixed(1)} score\n`;
        formattedResponse += `🎯 Answer accuracy：${accuracyRate.toFixed(1)}%\n\n`;

        formattedResponse += `📚 Learning domain analysis\n`;
        formattedResponse += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        Object.entries(gameTypeStats).forEach(([type, stats]) => {
            const avgScore = stats.totalScore / stats.count;
            formattedResponse += `🔹 ${type}：${stats.count} games，average ${avgScore.toFixed(1)} score\n`;
        });
        formattedResponse += `\n`;

        formattedResponse += `💡 AI Learning suggestions\n`;
        formattedResponse += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        formattedResponse += `${aiResponse}\n\n`;


        return formattedResponse;
    };

    const analyzeSelectedGameWithAI = async () => {
        if (!selectedGameForAnalysis) {
            Alert.alert('Error', 'Please select a game first');
            return;
        }

        setAnalyzingWithAi(true);
        setShowGameSelectionModal(false);

        try {
            // Static mapping of game names to their IDs
            const gameNameToIdMap: { [key: string]: number } = {
                'Speed Calculation': 1,
                'AI Math Adventure': 2,
                'Listening Game': 3,
                'Writing Game': 4,
                'Sentence Reorder': 5,
                'Animal Catcher': 6,
                'Animal Classification': 7,
                'Body Parts Matching': 8,
                'Human organs': 9,
                'ChineseGame': 10,
                'ChineseSentenceGame': 11
                // Add more mappings as needed
            };

            const gameId = gameNameToIdMap[selectedGameForAnalysis] || 1;

            console.log(`Analyzing game: ${selectedGameForAnalysis} with ID: ${gameId}`);

            const response = await axios.get(
                `${getApiBaseUrl()}/api/educator/student/${student.id}/game/${gameId}/result`,
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            );

            if (response.data) {
                const analysis = formatGameAIAnalysis(response.data, selectedGameForAnalysis);
                setAiAnalysis(analysis);
                setShowAiAnalysis(true);
            }
        } catch (error: any) {
            console.error('Error analyzing selected game with AI:', error);

            let errorMessage = '無法載入AI分析，請稍後重試。';
            if (error.response?.status === 401) {
                errorMessage = '認證已過期，請重新登入';
            } else if (error.response?.status === 403) {
                errorMessage = '無權限查看此學生的遊戲分析';
            } else if (error.response?.status === 404) {
                errorMessage = '找不到遊戲數據';
            }

            // Show error in analysis modal
            setAiAnalysis(`❌ ${errorMessage}\n\n📊 遊戲信息：\n🎮 ${selectedGameForAnalysis}\n👤 學生：${student.username}\n📅 分析時間：${new Date().toLocaleDateString('zh-TW')}`);
            setShowAiAnalysis(true);
        } finally {
            setAnalyzingWithAi(false);
            setSelectedGameForAnalysis(null);
        }
    };

    const generateFallbackAnalysis = () => {
        if (gameRecords.length === 0) {
            setAiAnalysis('📊 There is currently insufficient game data for analysis.\n\nStudents are encouraged to participate in different types of learning games to accumulate more learning records.');
            setShowAiAnalysis(true);
            return;
        }

        // Basic statistics
        const totalGames = gameRecords.length;
        const totalScore = gameRecords.reduce((sum, record) => sum + record.scores, 0);
        const averageScore = totalScore / totalGames;

        // Game types analysis
        const gameTypeStats = gameRecords.reduce((acc, record) => {
            const type = record.metadata.gameType || 'Unknown';
            if (!acc[type]) {
                acc[type] = {count: 0, totalScore: 0};
            }
            acc[type].count++;
            acc[type].totalScore += record.scores;
            return acc;
        }, {} as Record<string, { count: number; totalScore: number }>);

        // Question performance analysis
        const allQuestions = gameRecords.flatMap(record => record.metadata.questions || []);
        const totalQuestions = allQuestions.length;
        const correctAnswers = allQuestions.filter(q => q.isCorrect).length;
        const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100) : 0;

        let analysis = `📊 學習表現分析報告\n\n`;
        analysis += `🎮 遊戲總數：${totalGames} 場\n`;
        analysis += `📈 平均分數：${averageScore.toFixed(1)} 分\n`;
        analysis += `🎯 答題準確率：${accuracyRate.toFixed(1)}%\n\n`;

        analysis += `📚 學習領域：\n`;
        Object.entries(gameTypeStats).forEach(([type, stats]) => {
            const avgScore = stats.totalScore / stats.count;
            analysis += `• ${type}: ${stats.count} 場，平均 ${avgScore.toFixed(1)} 分\n`;
        });

        analysis += `\n💡 學習建議：\n`;

        if (accuracyRate < 60) {
            analysis += `• 建議加強基礎概念的理解\n`;
            analysis += `• 可以嘗試較低難度的遊戲建立信心\n`;
        } else if (accuracyRate > 80) {
            analysis += `• 表現優秀！可以挑戰更高難度的內容\n`;
            analysis += `• 建議探索新的學習領域\n`;
        } else {
            analysis += `• 繼續保持學習進度\n`;
            analysis += `• 可以適度增加挑戰性\n`;
        }

        setAiAnalysis(analysis);
        setShowAiAnalysis(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return '#4CAF50';
            case 'medium':
                return '#FF9800';
            case 'hard':
                return '#FF4757';
            default:
                return '#666';
        }
    };

    const analyzeGameWithAI = async (gameRecord: GameRecord) => {
        setAnalyzingWithAi(true);
        try {
            // Debug logging to see what fields are available
            console.log('GameRecord structure:', gameRecord);
            console.log('Available fields:', Object.keys(gameRecord));
            console.log('Game ID values:', {
                gameId: gameRecord.gameId,
                game_id: (gameRecord as any).game_id,
                id: gameRecord.id,
                game: (gameRecord as any).game?.id
            });

            // The API expects gameId, not the score record id
            // Try multiple possible field names for the game ID
            let gameId = gameRecord.gameId ||
                (gameRecord as any).game_id ||
                (gameRecord as any).game?.id ||
                (gameRecord as any).gameId ||
                gameRecord.id;

            // If still no game ID, try to extract from metadata or other fields
            if (!gameId && gameRecord.metadata) {
                gameId = (gameRecord.metadata as any).gameId ||
                    (gameRecord.metadata as any).game_id ||
                    (gameRecord.metadata as any).game?.id;
            }

            if (!gameId) {
                // For now, let's try using a hardcoded game ID for testing
                // This is a temporary solution to test the API flow
                console.log('No game ID found, using fallback for testing');
                gameId = 1; // Temporary fallback - replace with actual logic
                console.warn('Using fallback game ID 1 for testing - this should be replaced with proper game ID extraction');
            }

            console.log('Using gameId:', gameId);

            const response = await axios.get(
                `${getApiBaseUrl()}/api/educator/student/${student.id}/game/${gameId}/result`,
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            );

            if (response.data) {
                const analysis = formatGameAIAnalysis(response.data, gameRecord.gameName);
                setAiAnalysis(analysis);
                setShowAiAnalysis(true);
            }
        } catch (error: any) {
            console.error('Error analyzing game with AI:', error);

            let errorMessage = '無法載入AI分析，請稍後重試。';
            if (error.response?.status === 401) {
                errorMessage = '認證已過期，請重新登入';
            } else if (error.response?.status === 403) {
                errorMessage = '無權限查看此學生的遊戲分析';
            } else if (error.response?.status === 404) {
                errorMessage = '找不到遊戲數據';
            }

            // Show error in analysis modal
            setAiAnalysis(`❌ ${errorMessage}\n\n📊 遊戲信息：\n🎮 ${gameRecord.gameName}\n📊 得分：${gameRecord.scores}\n📅 日期：${formatDate(gameRecord.createdAt)}`);
            setShowAiAnalysis(true);
        } finally {
            setAnalyzingWithAi(false);
        }
    };

    const formatGameAIAnalysis = (aiData: any, gameName: string): string => {
        let result = `🧠 Individual Game AI Analysis Report\n`;
        result += `👤 Student：${student.username}\n`;
        result += `🎮 Game：${gameName}\n`;
        result += `📅 Analysis time：${new Date().toLocaleDateString('zh-TW')}\n\n`;

        result += `📈 AIAnalysis results\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        if (aiData.overallAnalysis) {
            result += `🎯 Overall performance：\n${aiData.overallAnalysis}\n\n`;
        }

        if (aiData.strengths && Array.isArray(aiData.strengths)) {
            result += `💪 Advantages Analysis：\n`;
            aiData.strengths.forEach((strength: string, index: number) => {
                result += `• ${strength}\n`;
            });
            result += `\n`;
        }

        if (aiData.weaknesses && Array.isArray(aiData.weaknesses)) {
            result += `🔍 Areas for improvement：\n`;
            aiData.weaknesses.forEach((weakness: string, index: number) => {
                result += `• ${weakness}\n`;
            });
            result += `\n`;
        }

        if (aiData.emotions && Array.isArray(aiData.emotions)) {
            result += `😊 Emotional state：\n`;
            aiData.emotions.forEach((emotion: string, index: number) => {
                result += `• ${emotion}\n`;
            });
            result += `\n`;
        }

        if (aiData.suggestions && Array.isArray(aiData.suggestions)) {
            result += `💡 Learning suggestions：\n`;
            aiData.suggestions.forEach((suggestion: string, index: number) => {
                result += `• ${suggestion}\n`;
            });
        }

        return result;
    };

    const renderGameDetails = (metadata: GameMetadata) => {
        return (
            <ScrollView style={styles.gameDetailsContainer}>
                <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>Game Information</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Game Type:</Text>
                        <Text style={styles.detailValue}>{metadata.gameType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Difficulty:</Text>
                        <Text style={[styles.detailValue, {color: getDifficultyColor(metadata.gameDifficulty)}]}>
                            {metadata.gameDifficulty}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Final Score:</Text>
                        <Text style={styles.detailValue}>{metadata.finalScore}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Timestamp:</Text>
                        <Text style={styles.detailValue}>{formatDate(metadata.timestamp)}</Text>
                    </View>
                </View>

                {metadata.gameSpecificData && Object.keys(metadata.gameSpecificData).length > 0 && (
                    <View style={styles.detailSection}>
                        <Text style={styles.detailTitle}>Game Specific Data</Text>
                        {Object.entries(metadata.gameSpecificData).map(([key, value]) => (
                            <View key={key} style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                </Text>
                                <Text style={styles.detailValue}>{String(value)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {metadata.questions && metadata.questions.length > 0 && (
                    <View style={styles.detailSection}>
                        <Text style={styles.detailTitle}>Questions Performance</Text>
                        <View style={styles.questionStats}>
                            <View style={styles.statItem}>
                                <Target size={16} color="#4CAF50"/>
                                <Text style={styles.statText}>
                                    Correct: {metadata.questions.filter(q => q.isCorrect).length}/{metadata.questions.length}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Trophy size={16} color="#FF9800"/>
                                <Text style={styles.statText}>
                                    Avg
                                    Score: {Math.round(metadata.questions.reduce((sum, q) => sum + (q.score || 0), 0) / metadata.questions.length)}
                                </Text>
                            </View>
                        </View>

                        {metadata.questions.slice(0, 5).map((question, index) => (
                            <View key={question.id || index} style={styles.questionItem}>
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                    <Text
                                        style={[styles.questionResult, {color: question.isCorrect ? '#4CAF50' : '#FF4757'}]}>
                                        {question.isCorrect ? 'Correct' : 'Incorrect'}
                                    </Text>
                                </View>
                                <Text style={styles.questionText}>{question.question}</Text>

                                {/*  Game Type and Time Info */}
                                <View style={styles.questionMeta}>
                                    <View style={styles.metaItem}>
                                        <Text style={styles.metaLabel}>Game Type:</Text>
                                        <Text style={styles.metaValue}>{metadata.gameType || 'N/A'}</Text>
                                    </View>
                                    {question.timeSpent !== undefined && question.timeSpent > 0 && (
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Time Spent:</Text>
                                            <Text style={styles.metaValue}>{question.timeSpent}s</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.answerRow}>
                                    <Text style={styles.answerLabel}>Your Answer:</Text>
                                    <Text style={styles.answerValue}>{String(question.userAnswer || 'No answer')}</Text>
                                </View>
                                <View style={styles.answerRow}>
                                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                                    <Text style={styles.answerValue}>{String(question.correctAnswer)}</Text>
                                </View>
                                {question.score !== undefined && (
                                    <View style={styles.answerRow}>
                                        <Text style={styles.answerLabel}>Score:</Text>
                                        <Text
                                            style={styles.answerValue}>{question.score}/{question.maxScore || 'N/A'}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        {metadata.questions.length > 5 && (
                            <Text style={styles.moreQuestionsText}>
                                ... and {metadata.questions.length - 5} more questions
                            </Text>
                        )}
                    </View>
                )}
            </ScrollView>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Game Metadata - {student.username}</Text>
                    <View style={styles.headerButtons}>
                        {gameRecords.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowGameSelectionModal(true)}
                                style={styles.gameSelectionButton}
                            >
                                <Gamepad2 size={18} color="#fff"/>
                                <Text style={styles.gameSelectionButtonText}>Select Game</Text>
                            </TouchableOpacity>
                        )}
                        {gameRecords.length > 0 && (
                            <TouchableOpacity
                                onPress={analyzeWithAi}
                                style={[styles.aiAnalysisButton, analyzingWithAi && styles.aiAnalysisButtonDisabled]}
                                disabled={analyzingWithAi}
                            >
                                {analyzingWithAi ? (
                                    <ActivityIndicator size="small" color="#fff"/>
                                ) : (
                                    <Brain size={20} color="#fff"/>
                                )}
                                <Text style={styles.aiAnalysisButtonText}>
                                    {analyzingWithAi ? '分析中...' : 'AI analysis'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#333"/>
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6C5CE7"/>
                        <Text style={styles.loadingText}>Loading game metadata...</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.content}>
                        {gameRecords.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Gamepad2 size={48} color="#ccc"/>
                                <Text style={styles.emptyStateText}>No game records found</Text>
                            </View>
                        ) : (
                            gameRecords.map((record) => (
                                <TouchableOpacity
                                    key={record.id}
                                    style={styles.gameRecordCard}
                                    onPress={() => {
                                        setSelectedGame(record);
                                        setShowGameDetails(true);
                                    }}
                                >
                                    <View style={styles.gameRecordHeader}>
                                        <View style={styles.gameInfo}>
                                            <Text style={styles.gameName}>{record.gameName}</Text>
                                            <Text style={styles.gameDate}>{formatDate(record.createdAt)}</Text>
                                        </View>
                                        <View style={styles.gameActions}>
                                            <View style={styles.gameScore}>
                                                <Trophy size={20} color="#FF9800"/>
                                                <Text style={styles.scoreText}>{record.scores}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {record.metadata && (
                                        <View style={styles.gamePreview}>
                                            <View style={styles.previewItem}>
                                                <Text style={styles.previewLabel}>Type:</Text>
                                                <Text style={styles.previewValue}>{record.metadata.gameType}</Text>
                                            </View>
                                            <View style={styles.previewItem}>
                                                <Text style={styles.previewLabel}>Difficulty:</Text>
                                                <Text
                                                    style={[styles.previewValue, {color: getDifficultyColor(record.metadata.gameDifficulty)}]}>
                                                    {record.metadata.gameDifficulty}
                                                </Text>
                                            </View>
                                            {record.metadata.questions && (
                                                <View style={styles.previewItem}>
                                                    <Text style={styles.previewLabel}>Questions:</Text>
                                                    <Text style={styles.previewValue}>
                                                        {record.metadata.questions.filter(q => q.isCorrect).length}/{record.metadata.questions.length}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}

                <Modal
                    visible={showGameDetails}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>{selectedGame?.gameName} Details</Text>
                            <TouchableOpacity onPress={() => setShowGameDetails(false)} style={styles.closeButton}>
                                <X size={24} color="#333"/>
                            </TouchableOpacity>
                        </View>
                        {selectedGame && renderGameDetails(selectedGame.metadata)}
                    </SafeAreaView>
                </Modal>

                {/* Game Selection Modal */}
                <Modal
                    visible={showGameSelectionModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setShowGameSelectionModal(false)}
                >
                    <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Select Game for AI Analysis</Text>
                            <TouchableOpacity onPress={() => setShowGameSelectionModal(false)}
                                              style={styles.closeButton}>
                                <X size={24} color="#333"/>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.gameSelectionContent}>
                            <Text style={styles.gameSelectionSubtitle}>
                                Choose a game to analyze {student.username}'s performance
                            </Text>

                            {gameRecords.length > 0 ? (
                                <ScrollView style={styles.gameListContainer}>
                                    {Array.from(new Set(gameRecords.map(record => record.gameName))).map((gameName, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.gameSelectionItem,
                                                selectedGameForAnalysis === gameName && styles.gameSelectionItemSelected
                                            ]}
                                            onPress={() => setSelectedGameForAnalysis(gameName)}
                                        >
                                            <View style={styles.gameSelectionItemContent}>
                                                <Gamepad2 size={20} color="#6C5CE7"/>
                                                <Text style={styles.gameSelectionItemText}>{gameName}</Text>
                                            </View>
                                            <View style={[
                                                styles.gameSelectionRadio,
                                                selectedGameForAnalysis === gameName && styles.gameSelectionRadioSelected
                                            ]}>
                                                {selectedGameForAnalysis === gameName && (
                                                    <View style={styles.gameSelectionRadioDot}/>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={styles.emptyGameSelection}>
                                    <Gamepad2 size={48} color="#ccc"/>
                                    <Text style={styles.emptyGameSelectionText}>No games available</Text>
                                </View>
                            )}

                            <View style={styles.gameSelectionActions}>
                                <TouchableOpacity
                                    style={[
                                        styles.analyzeSelectedGameButton,
                                        (!selectedGameForAnalysis || analyzingWithAi) && styles.analyzeSelectedGameButtonDisabled
                                    ]}
                                    onPress={() => selectedGameForAnalysis && analyzeSelectedGameWithAI()}
                                    disabled={!selectedGameForAnalysis || analyzingWithAi}
                                >
                                    {analyzingWithAi ? (
                                        <ActivityIndicator size="small" color="#fff"/>
                                    ) : (
                                        <Brain size={18} color="#fff"/>
                                    )}
                                    <Text style={styles.analyzeSelectedGameButtonText}>
                                        {analyzingWithAi ? 'Analyzing...' : 'Analyze Selected Game'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </Modal>

                {/* AI Analysis Modal */}
                <Modal
                    visible={showAiAnalysis}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                            <View style={styles.headerTitleContainer}>
                                <Brain size={24} color="#6C5CE7"/>
                                <Text style={styles.headerTitle}>AI Learning Analysis Report</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAiAnalysis(false)} style={styles.closeButton}>
                                <X size={24} color="#333"/>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.aiAnalysisContent}>
                            <View style={styles.aiAnalysisCard}>
                                <Text style={styles.aiAnalysisText}>{aiAnalysis}</Text>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </Modal>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
        flex: 1,
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    gameRecordCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gameRecordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    gameInfo: {
        flex: 1,
    },
    gameName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    gameDate: {
        fontSize: 14,
        color: '#666',
    },
    gameActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    gameScore: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    scoreText: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    aiAnalysisBtn: {
        backgroundColor: '#F0F4FF',
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D1D5FF',
    },
    gamePreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    previewItem: {
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    previewValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3436',
    },
    gameDetailsContainer: {
        flex: 1,
        padding: 20,
    },
    detailSection: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3436',
        flex: 2,
        textAlign: 'right',
    },
    questionStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
    },
    questionItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6C5CE7',
    },
    questionResult: {
        fontSize: 12,
        fontWeight: '500',
    },
    questionText: {
        fontSize: 14,
        color: '#2D3436',
        marginBottom: 8,
    },
    questionMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#e8f4f8',
        borderRadius: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 11,
        color: '#666',
        marginRight: 4,
        fontWeight: '500',
    },
    metaValue: {
        fontSize: 11,
        color: '#2D3436',
        fontWeight: '600',
    },
    answerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    answerLabel: {
        fontSize: 12,
        color: '#666',
        flex: 1,
    },
    answerValue: {
        fontSize: 12,
        color: '#2D3436',
        flex: 2,
        textAlign: 'right',
    },
    moreQuestionsText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    aiAnalysisButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    aiAnalysisButtonDisabled: {
        backgroundColor: '#a29bfe',
    },
    aiAnalysisButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    aiAnalysisContent: {
        flex: 1,
        padding: 20,
    },
    aiAnalysisCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    aiAnalysisText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#2D3436',
    },
    // Game Selection Modal Styles
    gameSelectionContent: {
        flex: 1,
        padding: 20,
    },
    gameSelectionSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    gameListContainer: {
        flex: 1,
        marginBottom: 20,
    },
    gameSelectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    gameSelectionItemSelected: {
        backgroundColor: '#f0f4ff',
        borderColor: '#6C5CE7',
    },
    gameSelectionItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    gameSelectionItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3436',
    },
    gameSelectionRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameSelectionRadioSelected: {
        borderColor: '#6C5CE7',
    },
    gameSelectionRadioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#6C5CE7',
    },
    emptyGameSelection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyGameSelectionText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    gameSelectionActions: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    gameSelectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    gameSelectionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    analyzeSelectedGameButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6C5CE7',
        paddingVertical: 14,
        borderRadius: 8,
    },
    analyzeSelectedGameButtonDisabled: {
        backgroundColor: '#ccc',
    },
    analyzeSelectedGameButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});