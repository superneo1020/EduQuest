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
import { X, Calendar, Gamepad2, Trophy, Target, Clock, TrendingUp } from 'lucide-react-native';
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
                    gameName: record.gameName,
                    scores: record.scores,
                    metadata: record.metadata || {},
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
                                <Text style={styles.questionText}>{question.content || question.question}</Text>
                                
                                {/*  Game Type and Time Info */}
                                <View style={styles.questionMeta}>
                                    <View style={styles.metaItem}>
                                        <Text style={styles.metaLabel}>Game Type:</Text>
                                        <Text style={styles.metaValue}>{metadata.extraData?.gameType || 'N/A'}</Text>
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
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#333" />
                    </TouchableOpacity>
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
});
