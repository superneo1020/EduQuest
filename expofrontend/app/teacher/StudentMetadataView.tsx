import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import { X, Gamepad2, Trophy, Target, Clock, Brain, Check, AlertCircle } from 'lucide-react-native';
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
    gameId?: number;
    gameName: string;
    scores: number;
    metadata: GameMetadata;
    createdAt: string;
}

export function StudentMetadataView({ visible, onClose, student, token }: StudentMetadataViewProps) {
    const [loading, setLoading] = useState(false);
    const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
    const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);
    const [showGameDetails, setShowGameDetails] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [showAiAnalysis, setShowAiAnalysis] = useState(false);
    const [analyzingWithAi, setAnalyzingWithAi] = useState(false);
    const [showGameSelectionModal, setShowGameSelectionModal] = useState(false);
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
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data && response.data.content) {
                const records = response.data.content.map((record: any) => ({
                    id: record.id,
                    gameId: record.gameId || record.game_id || record.game?.id,
                    gameName: record.name,
                    scores: record.scores,
                    metadata: {
                        ...record.metadata,
                        questions: record.metadata?.questions?.map((q: any) => ({
                            ...q,
                            question: q.content || q.question,
                        })) || [],
                    },
                    createdAt: record.createdAt,
                }));
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
                headers: { Authorization: `Bearer ${token}` },
            });
            return formatSpringBootAIResponse(response.data, studentName, gameRecords);
        } catch (error) {
            console.error('Spring Boot AI API error:', error);
            throw error;
        }
    };

    const formatSpringBootAIResponse = (aiData: any, studentName: string, records: GameRecord[]): string => {
        const totalScore = records.reduce((sum, r) => sum + r.scores, 0);
        const averageScore = records.length ? totalScore / records.length : 0;
        const allQuestions = records.flatMap(r => r.metadata?.questions || []);
        const correctAnswers = allQuestions.filter(q => q.isCorrect).length;
        const accuracyRate = allQuestions.length ? (correctAnswers / allQuestions.length) * 100 : 0;

        const gameTypeStats = records.reduce((acc, record) => {
            const type = record.metadata?.gameType || 'Unknown';
            if (!acc[type]) acc[type] = { count: 0, totalScore: 0 };
            acc[type].count++;
            acc[type].totalScore += record.scores;
            return acc;
        }, {} as Record<string, { count: number; totalScore: number }>);

        let result = `🧠 AI Learning Analysis Report\n`;
        result += `👤 Student：${studentName}\n`;
        result += `📅 Analysis time：${new Date().toLocaleDateString('zh-TW')}\n\n`;
        result += `📈 Overall performance\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        result += `🎮 Games played: ${records.length}\n`;
        result += `📊 Average score: ${averageScore.toFixed(1)}\n`;
        result += `🎯 Accuracy: ${accuracyRate.toFixed(1)}%\n\n`;
        result += `📚 Subject analysis\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        Object.entries(gameTypeStats).forEach(([type, stats]) => {
            const avgScore = stats.totalScore / stats.count;
            result += `🔹 ${type}: ${stats.count} games, avg ${avgScore.toFixed(1)}\n`;
        });
        result += `\n💡 AI Suggestions\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        if (aiData) {
            if (aiData.encouragementMessage) result += `🌟 ${aiData.encouragementMessage}\n\n`;
            if (aiData.analysis) result += `📊 ${aiData.analysis}\n\n`;
            if (aiData.strengths && Array.isArray(aiData.strengths)) {
                result += `💪 Strengths:\n`;
                aiData.strengths.forEach((s: string, idx: number) => result += `  ${idx + 1}. ${s}\n`);
                result += `\n`;
            }
            if (aiData.powerUpTips && Array.isArray(aiData.powerUpTips)) {
                result += `⚡ Improvement tips:\n`;
                aiData.powerUpTips.forEach((t: string, idx: number) => result += `  ${idx + 1}. ${t}\n`);
                result += `\n`;
            }
            if (aiData.gamesForNextSteps) result += `🎮 Next recommended: ${aiData.gamesForNextSteps}\n`;
        } else {
            result += `AI analysis temporarily unavailable. Please try again later.\n`;
        }
        return result;
    };

    const generateFallbackAnalysis = () => {
        if (gameRecords.length === 0) {
            setAiAnalysis('📊 No game data available.\n\nPlease ask the student to play more games to generate analysis.');
            setShowAiAnalysis(true);
            return;
        }
        const totalGames = gameRecords.length;
        const totalScore = gameRecords.reduce((sum, record) => sum + record.scores, 0);
        const averageScore = totalScore / totalGames;
        const allQuestions = gameRecords.flatMap(r => r.metadata.questions || []);
        const correctAnswers = allQuestions.filter(q => q.isCorrect).length;
        const accuracyRate = allQuestions.length ? (correctAnswers / allQuestions.length) * 100 : 0;

        let analysis = `📊 Learning Performance Analysis\n\n`;
        analysis += `🎮 Total Games: ${totalGames}\n`;
        analysis += `📈 Average Score: ${averageScore.toFixed(1)}\n`;
        analysis += `🎯 Accuracy: ${accuracyRate.toFixed(1)}%\n\n`;
        analysis += `💡 Suggestions:\n`;
        if (accuracyRate < 60) {
            analysis += `• Strengthen basic concepts.\n• Try easier difficulty games to build confidence.\n`;
        } else if (accuracyRate > 80) {
            analysis += `• Excellent! Challenge higher difficulty.\n• Explore new subjects.\n`;
        } else {
            analysis += `• Keep up the good work!\n• Moderate increase in difficulty may help.\n`;
        }
        setAiAnalysis(analysis);
        setShowAiAnalysis(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getGameIcon = (gameName: string) => {
        const gameIcons: { [key: string]: string } = {
            'Speed Calculation': '🧮',
            'AI Math Adventure': '🤖',
            'Listening Game': '🎧',
            'Writing Game': '✍️',
            'Sentence Reorder': '📝',
            'Animal Catcher': '🦁',
            'Human organs': '🫀',
            'Animal Classification': '🐾',
            'Body Parts Matching': '🦴',
            'ChineseGame': '🀄',
            'ChineseSentenceGame': '📖'
        };
        return gameIcons[gameName] || '🎮';
    };

    const analyzeSelectedGameWithAI = async () => {
        if (!selectedGameForAnalysis) {
            Alert.alert('Error', 'Please select a game');
            return;
        }
        setAnalyzingWithAi(true);
        setShowGameSelectionModal(false);
        try {
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
                'ChineseSentenceGame': 11,
            };
            const gameId = gameNameToIdMap[selectedGameForAnalysis] || 1;
            const response = await axios.get(
                `${getApiBaseUrl()}/api/educator/student/${student.id}/game/${gameId}/result`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data) {
                const analysis = formatGameAIAnalysis(response.data, selectedGameForAnalysis);
                setAiAnalysis(analysis);
                setShowAiAnalysis(true);
            }
        } catch (error: any) {
            console.error('Error analyzing selected game:', error);
            let errorMessage = 'Unable to load AI analysis.';
            if (error.response?.status === 401) errorMessage = 'Authentication expired, please login again';
            else if (error.response?.status === 403) errorMessage = 'No permission to view this analysis';
            else if (error.response?.status === 404) errorMessage = 'Game data not found';
            setAiAnalysis(`❌ ${errorMessage}\n\nGame: ${selectedGameForAnalysis}\nStudent: ${student.username}`);
            setShowAiAnalysis(true);
        } finally {
            setAnalyzingWithAi(false);
            setSelectedGameForAnalysis(null);
        }
    };

    const formatGameAIAnalysis = (aiData: any, gameName: string): string => {
        let result = `🧠 Individual Game AI Analysis\n`;
        result += `👤 Student: ${student.username}\n🎮 Game: ${gameName}\n📅 ${new Date().toLocaleDateString()}\n\n`;
        result += `📈 Analysis Results\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        if (aiData.overallAnalysis) result += `🎯 ${aiData.overallAnalysis}\n\n`;
        if (aiData.strengths && Array.isArray(aiData.strengths)) {
            result += `💪 Strengths:\n`;
            aiData.strengths.forEach((s: string) => result += `• ${s}\n`);
            result += `\n`;
        }
        if (aiData.weaknesses && Array.isArray(aiData.weaknesses)) {
            result += `🔍 Areas to improve:\n`;
            aiData.weaknesses.forEach((w: string) => result += `• ${w}\n`);
            result += `\n`;
        }
        if (aiData.suggestions && Array.isArray(aiData.suggestions)) {
            result += `💡 Suggestions:\n`;
            aiData.suggestions.forEach((s: string) => result += `• ${s}\n`);
        }
        return result;
    };

    const renderGameDetails = (metadata: GameMetadata, gameScore: number) => {
        const correctCount = metadata.questions.filter(q => q.isCorrect).length;
        const totalQuestions = metadata.questions.length;
        const totalScore = gameScore; // Use the actual game score
        const totalTime = metadata.questions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);

        return (
            <ScrollView style={styles.gameDetailsContainer}>
                <View style={styles.statsSummaryCard}>
                    <Text style={styles.statsTitle}>📊 Performance Summary</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBlock}>
                            <Target size={20} color="#4CAF50" />
                            <Text style={styles.statValue}>{correctCount}/{totalQuestions}</Text>
                            <Text style={styles.statLabel}>Correct</Text>
                        </View>
                        <View style={styles.statBlock}>
                            <Trophy size={20} color="#FF9800" />
                            <Text style={styles.statValue}>{totalScore}</Text>
                            <Text style={styles.statLabel}>Total Score</Text>
                        </View>
                        <View style={styles.statBlock}>
                            <Clock size={20} color="#6C5CE7" />
                            <Text style={styles.statValue}>{totalTime}s</Text>
                            <Text style={styles.statLabel}>Total Time</Text>
                        </View>
                    </View>
                </View>

                {metadata.questions && metadata.questions.length > 0 && (
                    <View style={styles.questionsSection}>
                        <Text style={styles.sectionHeader}>📝 Question Details</Text>
                        {metadata.questions.map((question, index) => (
                            <View key={question.id || index} style={styles.questionCard}>
                                <View style={styles.questionHeader}>
                                    <View style={styles.questionNumberContainer}>
                                        <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                    </View>
                                    <View style={[styles.resultBadge, question.isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
                                        {question.isCorrect ? (
                                            <>
                                                <Check size={14} color="#4CAF50" />
                                                <Text style={styles.correctText}>Correct</Text>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={14} color="#FF4757" />
                                                <Text style={styles.incorrectText}>Incorrect</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                                <Text style={styles.questionText}>{question.question}</Text>
                                {question.timeSpent !== undefined && question.timeSpent > 0 && (
                                    <View style={styles.timeMeta}>
                                        <Clock size={12} color="#666" />
                                        <Text style={styles.timeText}>{question.timeSpent}s</Text>
                                    </View>
                                )}
                                <View style={styles.answerArea}>
                                    <View style={styles.answerRow}>
                                        <Text style={styles.answerLabel}>Your Answer:</Text>
                                        <Text style={styles.answerValue}>{String(question.userAnswer || '—')}</Text>
                                    </View>
                                    <View style={styles.answerRow}>
                                        <Text style={styles.answerLabel}>Correct Answer:</Text>
                                        <Text style={styles.answerValue}>{String(question.correctAnswer)}</Text>
                                    </View>
                                    {question.score !== undefined && (
                                        <View style={styles.answerRow}>
                                            <Text style={styles.answerLabel}>Score:</Text>
                                            <Text style={styles.answerValue}>{question.score}/{question.maxScore || 'N/A'}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Game Metadata - {student.username}</Text>
                    <View style={styles.headerButtons}>
                        {gameRecords.length > 0 && (
                            <TouchableOpacity onPress={() => setShowGameSelectionModal(true)} style={styles.gameSelectionButton}>
                                <Gamepad2 size={18} color="#fff" />
                                <Text style={styles.gameSelectionButtonText}>Game analysis</Text>
                            </TouchableOpacity>
                        )}
                        {gameRecords.length > 0 && (
                            <TouchableOpacity
                                onPress={analyzeWithAi}
                                style={[styles.aiAnalysisButton, analyzingWithAi && styles.aiAnalysisButtonDisabled]}
                                disabled={analyzingWithAi}
                            >
                                {analyzingWithAi ? <ActivityIndicator size="small" color="#fff" /> : <Brain size={20} color="#fff" />}
                                <Text style={styles.aiAnalysisButtonText}>{analyzingWithAi ? 'Analyzing...' : 'AI Overall analysis'}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6C5CE7" />
                        <Text style={styles.loadingText}>Loading game metadata...</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.content}>
                        {gameRecords.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Gamepad2 size={48} color="#ccc" />
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
                                    <View style={styles.gameCardHeader}>
                                        <View style={styles.gameIcon}>
                                            <Text style={styles.gameIconText}>{getGameIcon(record.gameName)}</Text>
                                        </View>
                                        <View style={styles.gameCardInfo}>
                                            <Text style={styles.gameCardName}>{record.gameName}</Text>
                                            <Text style={styles.gameCardDate}>{formatDate(record.createdAt)}</Text>
                                        </View>
                                        <View style={styles.gameCardScore}>
                                            <Trophy size={16} color="#FF9800" />
                                            <Text style={styles.gameCardScoreText}>{record.scores}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.gameCardFooter}>
                                        <View style={styles.previewStats}>
                                            <Text style={styles.previewLabel}>Accuracy:</Text>
                                            <Text style={styles.previewValue}>
                                                {record.metadata?.questions
                                                    ? `${((record.metadata.questions.filter(q => q.isCorrect).length / record.metadata.questions.length) * 100).toFixed(0)}%`
                                                    : '—'}
                                            </Text>
                                        </View>
                                        <View style={styles.previewStats}>
                                            <Text style={styles.previewLabel}>Questions:</Text>
                                            <Text style={styles.previewValue}>{record.metadata?.questions?.length || 0}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}

                {/* Game Details Modal */}
                <Modal visible={showGameDetails} animationType="slide" presentationStyle="pageSheet">
                    <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>{selectedGame?.gameName} Details</Text>
                            <TouchableOpacity onPress={() => setShowGameDetails(false)} style={styles.closeButton}>
                                <X size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {selectedGame && renderGameDetails(selectedGame.metadata, selectedGame.scores)}
                    </SafeAreaView>
                </Modal>

                {/* Game Selection Modal */}
                <Modal visible={showGameSelectionModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowGameSelectionModal(false)}>
                    <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Select Game for AI Analysis</Text>
                            <TouchableOpacity onPress={() => setShowGameSelectionModal(false)} style={styles.closeButton}>
                                <X size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.gameSelectionContent}>
                            <Text style={styles.gameSelectionSubtitle}>Choose a game to analyze {student.username}'s performance</Text>
                            {gameRecords.length > 0 ? (
                                <ScrollView style={styles.gameListContainer}>
                                    {Array.from(new Set(gameRecords.map(record => record.gameName))).map((gameName, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.gameSelectionItem, selectedGameForAnalysis === gameName && styles.gameSelectionItemSelected]}
                                            onPress={() => setSelectedGameForAnalysis(gameName)}
                                        >
                                            <View style={styles.gameSelectionItemContent}>
                                                <Text style={styles.gameSelectionItemIcon}>{getGameIcon(gameName)}</Text>
                                                <Text style={styles.gameSelectionItemText}>{gameName}</Text>
                                            </View>
                                            <View style={[styles.gameSelectionRadio, selectedGameForAnalysis === gameName && styles.gameSelectionRadioSelected]}>
                                                {selectedGameForAnalysis === gameName && <View style={styles.gameSelectionRadioDot} />}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={styles.emptyGameSelection}>
                                    <Gamepad2 size={48} color="#ccc" />
                                    <Text style={styles.emptyGameSelectionText}>No games available</Text>
                                </View>
                            )}
                            <View style={styles.gameSelectionActions}>
                                <TouchableOpacity
                                    style={[styles.analyzeSelectedGameButton, (!selectedGameForAnalysis || analyzingWithAi) && styles.analyzeSelectedGameButtonDisabled]}
                                    onPress={() => selectedGameForAnalysis && analyzeSelectedGameWithAI()}
                                    disabled={!selectedGameForAnalysis || analyzingWithAi}
                                >
                                    {analyzingWithAi ? <ActivityIndicator size="small" color="#fff" /> : <Brain size={18} color="#fff" />}
                                    <Text style={styles.analyzeSelectedGameButtonText}>{analyzingWithAi ? 'Analyzing...' : 'Analyze Selected Game'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </Modal>

                {/* AI Analysis Modal */}
                <Modal visible={showAiAnalysis} animationType="slide" presentationStyle="pageSheet">
                    <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                            <View style={styles.headerTitleContainer}>
                                <Brain size={24} color="#6C5CE7" />
                                <Text style={styles.headerTitle}>AI Learning Analysis Report</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAiAnalysis(false)} style={styles.closeButton}>
                                <X size={24} color="#333" />
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
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#2D3436', flex: 1 },
    headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    gameSelectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    gameSelectionButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
    aiAnalysisButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    aiAnalysisButtonDisabled: { backgroundColor: '#A29BFE' },
    aiAnalysisButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
    closeButton: { padding: 8 },
    content: { flex: 1, padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyStateText: { marginTop: 10, fontSize: 16, color: '#999' },
    gameRecordCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    gameCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    gameIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0E6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    gameIconText: {
        fontSize: 20,
    },
    gameCardInfo: { flex: 1 },
    gameCardName: { fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 2 },
    gameCardDate: { fontSize: 12, color: '#999' },
    gameCardScore: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    gameCardScoreText: { marginLeft: 4, fontSize: 14, fontWeight: '700', color: '#FF9800' },
    gameCardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    previewStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    previewLabel: { fontSize: 12, color: '#999' },
    previewValue: { fontSize: 12, fontWeight: '600', color: '#2D3436' },
    gameDetailsContainer: { flex: 1, padding: 16 },
    statsSummaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    statsTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 12 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statBlock: { alignItems: 'center', gap: 4 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#2D3436' },
    statLabel: { fontSize: 12, color: '#999' },
    questionsSection: { marginBottom: 20 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 12 },
    questionCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    questionNumberContainer: { backgroundColor: '#F0F4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    questionNumber: { fontSize: 12, fontWeight: '700', color: '#6C5CE7' },
    resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    correctBadge: { backgroundColor: '#E8F5E8' },
    incorrectBadge: { backgroundColor: '#FFEBEE' },
    correctText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
    incorrectText: { fontSize: 12, fontWeight: '600', color: '#FF4757' },
    questionText: { fontSize: 14, color: '#2D3436', marginBottom: 8, lineHeight: 20 },
    timeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    timeText: { fontSize: 11, color: '#999' },
    answerArea: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12, gap: 6 },
    answerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    answerLabel: { fontSize: 12, color: '#999', flex: 1 },
    answerValue: { fontSize: 12, fontWeight: '500', color: '#2D3436', flex: 2, textAlign: 'right' },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    aiAnalysisContent: { flex: 1, padding: 20 },
    aiAnalysisCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    aiAnalysisText: { fontSize: 14, lineHeight: 22, color: '#2D3436' },
    gameSelectionContent: { flex: 1, padding: 20 },
    gameSelectionSubtitle: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
    gameListContainer: { flex: 1, marginBottom: 20 },
    gameSelectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    gameSelectionItemSelected: { backgroundColor: '#F0F4FF', borderColor: '#6C5CE7' },
    gameSelectionItemContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    gameSelectionItemIcon: { fontSize: 20 },
    gameSelectionItemText: { fontSize: 16, fontWeight: '500', color: '#2D3436' },
    gameSelectionRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    gameSelectionRadioSelected: { borderColor: '#6C5CE7' },
    gameSelectionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6C5CE7' },
    emptyGameSelection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyGameSelectionText: { fontSize: 16, color: '#999', marginTop: 16 },
    gameSelectionActions: { paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E9ECEF' },
    analyzeSelectedGameButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6C5CE7',
        paddingVertical: 12,
        borderRadius: 12,
    },
    analyzeSelectedGameButtonDisabled: { backgroundColor: '#ccc' },
    analyzeSelectedGameButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default StudentMetadataView;