import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
    SafeAreaView, StatusBar
} from 'react-native';
import { Brain, TrendingUp, Target, Zap, Trophy, X, ChevronRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';

interface GameAnalysis {
    encouragementMessage?: string;
    analysis?: string;
    strengths?: string;
    powerUpTips?: string;
    gamesForNextSteps?: string;
}

export default function GameAnalysisScreen() {
    const router = useRouter();
    const { gameId } = useLocalSearchParams();
    const { token } = useAuth();
    const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
    const [gameData, setGameData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper function to safely render any value as a string
    const safeRender = (value: any, fallback: string = ''): string => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        // Check if it's a React element
        if (value && typeof value === 'object' && value.type && value.props) {
            console.warn('React element passed to safeRender:', value);
            return fallback;
        }
        try {
            return JSON.stringify(value);
        } catch {
            return fallback;
        }
    };

    useEffect(() => {
        if (gameId) {
            fetchGameAnalysis();
        }
    }, [gameId]);

    const safeString = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
        // 排除 React 元素（$$typeof 是 React 元素的标志）
        if (typeof value === 'object' && value.$$typeof) return '';
        try {
            return JSON.stringify(value);
        } catch {
            return '';
        }
    };

    const fetchGameAnalysis = async () => {
        if (!gameId) return;
        setLoading(true);
        setError(null);
        
        console.log('Fetching game analysis for gameId:', gameId);
        
        try {
            const response = await axios.get(
                `${getApiBaseUrl()}/api/user/game/results/${gameId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('Game analysis response:', response.data);
            
            if (response.data) {
                // 清洗所有可能出问题的字段
                setAnalysis({
                    encouragementMessage: safeString(response.data.encouragementMessage),
                    analysis: safeString(response.data.analysis),
                    strengths: safeString(response.data.strengths),
                    powerUpTips: safeString(response.data.powerUpTips),
                    gamesForNextSteps: safeString(response.data.gamesForNextSteps),
                });
                
                // 設置遊戲數據
                setGameData({
                    gameId: response.data.gameId || gameId,
                    name: response.data.gameName || gameId,
                    gameType: response.data.gameType || 'EDUCATIONAL',
                    scores: response.data.scores || 0,
                    gameDifficulty: response.data.gameDifficulty || 'MEDIUM',
                    totalPlays: response.data.totalPlays || 1,
                });
            } else {
                console.warn('No data received from game analysis API');
                setError('No analysis data available');
            }
        } catch (error: any) {
            console.error('Failed to fetch game analysis:', error);
            
            if (error.response) {
                console.error('Error response:', {
                    status: error.response.status,
                    data: error.response.data
                });
                
                if (error.response.status === 404) {
                    setError(`Game "${gameId}" not found. The game may not have been played yet.`);
                } else {
                    setError(`Failed to load analysis: ${error.response.data?.message || 'Unknown error'}`);
                }
            } else {
                setError('Failed to load analysis. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const AnalysisCard = ({ icon, title, content, color = "#4CAF50" }: any) => {
        // Ensure icon is a valid React element
        const safeIcon = icon && typeof icon === 'object' && icon.type ? icon : null;

        return (
            <View style={[styles.analysisCard, { borderLeftColor: color }]}>
                <View style={styles.cardHeader}>
                    {safeIcon}
                    <Text style={styles.cardTitle}>{safeRender(title)}</Text>
                </View>
                <Text style={styles.cardContent}>{safeRender(content)}</Text>
            </View>
        );
    };

    try {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
                
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.gameInfo}>
                            <Brain size={24} color="#FFF" />
                            <View style={styles.gameDetails}>
                                <Text style={styles.gameName}>{safeRender(gameData?.name, 'Game Analysis')}</Text>
                                <Text style={styles.gameType}>{safeRender(gameData?.gameType, 'Specific Game')} AI Analysis</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                            <X size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                            <Text style={styles.loadingText}>AI is analyzing your game performance...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{safeRender(error, 'An error occurred')}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchGameAnalysis}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : analysis ? (
                        <View style={styles.analysisContainer}>
                            {/* Encouragement Message */}
                            {analysis.encouragementMessage && typeof analysis.encouragementMessage !== 'object' && (
                                <AnalysisCard
                                    icon={<Trophy size={20} color="#FFD700" />}
                                    title="🌟 Encouragement"
                                    content={analysis.encouragementMessage}
                                    color="#FFD700"
                                />
                            )}

                            {/* Analysis */}
                            {analysis.analysis && typeof analysis.analysis !== 'object' && (
                                <AnalysisCard
                                    icon={<Brain size={20} color="#4CAF50" />}
                                    title="📊 Performance Analysis"
                                    content={analysis.analysis}
                                    color="#4CAF50"
                                />
                            )}

                            {/* Strengths */}
                            {analysis.strengths && typeof analysis.strengths !== 'object' && (
                                <AnalysisCard
                                    icon={<TrendingUp size={20} color="#2196F3" />}
                                    title="💪 Your Strengths"
                                    content={analysis.strengths}
                                    color="#2196F3"
                                />
                            )}

                            {/* Power Up Tips */}
                            {analysis.powerUpTips && typeof analysis.powerUpTips !== 'object' && (
                                <AnalysisCard
                                    icon={<Zap size={20} color="#FF9800" />}
                                    title="⚡ Power-Up Tips"
                                    content={analysis.powerUpTips}
                                    color="#FF9800"
                                />
                            )}

                            {/* Next Steps */}
                            {analysis.gamesForNextSteps && typeof analysis.gamesForNextSteps !== 'object' && (
                                <AnalysisCard
                                    icon={<Target size={20} color="#9C27B0" />}
                                    title="🎯 Next Steps"
                                    content={analysis.gamesForNextSteps}
                                    color="#9C27B0"
                                />
                            )}

                            {/* Game Stats Summary */}
                            <View style={styles.statsSummary}>
                                <Text style={styles.statsTitle}>📈 Game Statistics</Text>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{safeRender(gameData?.scores, 0)}</Text>
                                        <Text style={styles.statLabel}>Latest Score</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{safeRender(gameData?.gameDifficulty, 'MEDIUM')}</Text>
                                        <Text style={styles.statLabel}>Difficulty</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{safeRender(gameData?.totalPlays, 1)}</Text>
                                        <Text style={styles.statLabel}>Times Played</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Brain size={48} color="#CCC" />
                            <Text style={styles.noDataText}>No analysis available yet</Text>
                            <Text style={styles.noDataSubtext}>Play more games to get AI insights!</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    } catch (renderError) {
        console.error('Render error in GameAnalysis:', renderError);
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Unable to display game analysis</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                        <Text style={styles.retryButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gameInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    gameDetails: {
        marginLeft: 12,
        flex: 1,
    },
    gameName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 2,
    },
    gameType: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    analysisContainer: {
        paddingBottom: 20,
    },
    analysisCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginLeft: 8,
    },
    cardContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    statsSummary: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginTop: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4CAF50',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    noDataText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    noDataSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
