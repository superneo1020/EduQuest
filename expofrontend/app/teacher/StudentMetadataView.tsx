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
    gameName: string;
    scores: number;
    metadata: GameMetadata;
    createdAt: string;
}

export default function StudentMetadataView({ visible, onClose, student, token }: StudentMetadataViewProps) {
    const [loading, setLoading] = useState(false);
    const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
    const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);
    const [showGameDetails, setShowGameDetails] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [showAiAnalysis, setShowAiAnalysis] = useState(false);
    const [analyzingWithAi, setAnalyzingWithAi] = useState(false);

    useEffect(() => {
        if (visible && student) {
            loadStudentGameMetadata();
        }
    }, [visible, student]);

    const loadStudentGameMetadata = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${getApiBaseUrl()}/api/educator/student/${student.id}/game/score`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.content) {
                const records = response.data.content.map((record: any) => ({
                    id: record.id,
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
                headers: { Authorization: `Bearer ${token}` }
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
            if (!acc[type]) acc[type] = { count: 0, totalScore: 0 };
            acc[type].count++;
            acc[type].totalScore += record.scores;
            return acc;
        }, {} as Record<string, { count: number; totalScore: number }>);

        let result = `🧠 AI 学习分析报告\n`;
        result += `👤 学生：${studentName}\n`;
        result += `📅 分析时间：${new Date().toLocaleDateString('zh-TW')}\n\n`;
        result += `📈 整体表现分析\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        result += `🎮 游戏总数：${records.length} 场\n`;
        result += `📊 平均得分：${averageScore.toFixed(1)} 分\n`;
        result += `🎯 答题准确率：${accuracyRate.toFixed(1)}%\n\n`;
        result += `📚 学习领域分析\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        Object.entries(gameTypeStats).forEach(([type, stats]) => {
            const avgScore = stats.totalScore / stats.count;
            result += `🔹 ${type}：${stats.count} 场，平均 ${avgScore.toFixed(1)} 分\n`;
        });
        result += `\n💡 AI 学习建议\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        if (aiData) {
            if (aiData.encouragementMessage) result += `🌟 ${aiData.encouragementMessage}\n\n`;
            if (aiData.analysis) result += `📊 ${aiData.analysis}\n\n`;
            if (aiData.strengths && Array.isArray(aiData.strengths)) {
                result += `💪 优势：\n`;
                aiData.strengths.forEach((s: string, idx: number) => result += `  ${idx+1}. ${s}\n`);
                result += `\n`;
            }
            if (aiData.powerUpTips && Array.isArray(aiData.powerUpTips)) {
                result += `⚡ 强化建议：\n`;
                aiData.powerUpTips.forEach((t: string, idx: number) => result += `  ${idx+1}. ${t}\n`);
                result += `\n`;
            }
            if (aiData.gamesForNextSteps) result += `🎮 下一步推荐：${aiData.gamesForNextSteps}\n`;
        } else {
            result += `暂时无法获取 AI 分析，请稍后重试。\n`;
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
                acc[type] = { count: 0, totalScore: 0 };
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

    const generateFallbackAnalysis = () => {
        if (gameRecords.length === 0) {
            setAiAnalysis('📊 暫無足夠的遊戲數據進行分析\n\n建議學生多參與不同類型的學習遊戲，積累更多學習記錄。');
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
                acc[type] = { count: 0, totalScore: 0 };
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
            case 'easy': return '#4CAF50';
            case 'medium': return '#FF9800';
            case 'hard': return '#FF4757';
            default: return '#666';
        }
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
                        <Text style={[styles.detailValue, { color: getDifficultyColor(metadata.gameDifficulty) }]}>
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
                                <Target size={16} color="#4CAF50" />
                                <Text style={styles.statText}>
                                    Correct: {metadata.questions.filter(q => q.isCorrect).length}/{metadata.questions.length}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Trophy size={16} color="#FF9800" />
                                <Text style={styles.statText}>
                                    Avg Score: {Math.round(metadata.questions.reduce((sum, q) => sum + (q.score || 0), 0) / metadata.questions.length)}
                                </Text>
                            </View>
                        </View>
                        
                        {metadata.questions.slice(0, 5).map((question, index) => (
                            <View key={question.id || index} style={styles.questionItem}>
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                    <Text style={[styles.questionResult, { color: question.isCorrect ? '#4CAF50' : '#FF4757' }]}>
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
                                        <Text style={styles.answerValue}>{question.score}/{question.maxScore || 'N/A'}</Text>
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
                                onPress={analyzeWithAi} 
                                style={[styles.aiAnalysisButton, analyzingWithAi && styles.aiAnalysisButtonDisabled]}
                                disabled={analyzingWithAi}
                            >
                                {analyzingWithAi ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Brain size={20} color="#fff" />
                                )}
                                <Text style={styles.aiAnalysisButtonText}>
                                    {analyzingWithAi ? '分析中...' : 'AI analysis'}
                                </Text>
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
                                    <View style={styles.gameRecordHeader}>
                                        <View style={styles.gameInfo}>
                                            <Text style={styles.gameName}>{record.gameName}</Text>
                                            <Text style={styles.gameDate}>{formatDate(record.createdAt)}</Text>
                                        </View>
                                        <View style={styles.gameScore}>
                                            <Trophy size={20} color="#FF9800" />
                                            <Text style={styles.scoreText}>{record.scores}</Text>
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
                                                <Text style={[styles.previewValue, { color: getDifficultyColor(record.metadata.gameDifficulty) }]}>
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
                                <X size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {selectedGame && renderGameDetails(selectedGame.metadata)}
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
});
