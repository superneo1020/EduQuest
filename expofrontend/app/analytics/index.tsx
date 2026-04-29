import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
    SafeAreaView, StatusBar
} from 'react-native';
import { 
    Brain, TrendingUp, Target, Zap, Trophy, BarChart3, 
    PieChart, Calendar, Clock, ChevronRight 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';

export default function AnalyticsScreen() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [recentGames, setRecentGames] = useState<any[]>([]);
    const [gameAnalyses, setGameAnalyses] = useState<{[key: string]: any}>({});
    const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            
            // 調試信息：檢查 token 和用戶狀態
            console.log('Token exists:', !!token);
            console.log('User exists:', !!user);
            console.log('API URL:', `${getApiBaseUrl()}/api/user/game/results`);
            
            if (!token) {
                console.error('No token available - user might not be logged in');
                return;
            }
            
            // 獲取總體分析數據
            const analyticsResponse = await axios.get(
                `${getApiBaseUrl()}/api/user/game/results`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // 獲取最近遊戲記錄
            const gamesResponse = await axios.get(
                `${getApiBaseUrl()}/api/user/game/score`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Analytics data loaded:', analyticsResponse.data);
            console.log('Games data loaded:', gamesResponse.data);
            
            // Extract games from content array or use direct data
            const gamesData = gamesResponse.data?.content || gamesResponse.data || [];
            
            // Debug: Check the structure of games data
            if (Array.isArray(gamesData)) {
                console.log('Number of games:', gamesData.length);
                gamesData.forEach((game, index) => {
                    console.log(`Game ${index}:`, {
                        name: game.name || game.gameName,
                        gameId: game.gameId || game.id,
                        scores: game.scores,
                        gameType: game.gameType || game.type,
                        difficulty: game.difficulty
                    });
                });
            }

            setAnalyticsData(analyticsResponse.data);
            setRecentGames(gamesData);
        } catch (error) {
            console.error('Failed to load analytics data:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchGameAnalysis = async (gameIdentifier: string, gameData: any) => {
        if (!token || !gameIdentifier) return;
        
        try {
            console.log(`=== FETCHING GAME ANALYSIS FOR: ${gameIdentifier} ===`);
            
            // Get game ID using game name mapping
            const gameId = await getGameIdByName(gameIdentifier);
            
            if (gameId) {
                console.log(`=== USING GAME ID: ${gameId} FOR ${gameIdentifier} ===`);
                const response = await axios.get(
                    `${getApiBaseUrl()}/api/user/game/results/${gameId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                console.log(`Successfully fetched analysis for ${gameIdentifier}:`, response.data);
                
                setGameAnalyses(prev => ({
                    ...prev,
                    [gameIdentifier]: response.data
                }));
            } else {
                throw new Error(`Game ID not found for ${gameIdentifier}`);
            }
        } catch (error: any) {
            console.error(`=== FAILED TO FETCH ANALYSIS FOR ${gameIdentifier} ===`);
            console.error(`Error details:`, error);
            
            // Set error state for this game
            setGameAnalyses(prev => ({
                ...prev,
                [gameIdentifier]: { 
                    error: true, 
                    message: error.response?.data?.message || 'Unable to load analysis' 
                }
            }));
        }
    };

    const getGameIdByName = async (gameName: string): Promise<number | null> => {
        try {
            console.log(`Looking up game ID for: ${gameName}`);
            
            // Create a mapping based on known game names
            const gameNameToIdMap: { [key: string]: number } = {
                'Speed Calculation': 1,
                'AI Math Adventure': 2,
                'Listening Game': 3,
                'Writing Game': 4,
                'Sentence Reorder': 5,
                'Animal Catcher': 6,
                'Animal Classification': 7,
                'Body Parts Matching': 8,
                'Human organs' :9,
                'ChineseGame' :10,
                'ChineseSentenceGame' :11

                // Add more mappings as needed
            };
            
            // Try to find exact match first
            if (gameNameToIdMap[gameName]) {
                console.log(`Found game ID ${gameNameToIdMap[gameName]} for ${gameName}`);
                return gameNameToIdMap[gameName];
            }
            
            // Try case-insensitive match
            const lowerGameName = gameName.toLowerCase();
            for (const [name, id] of Object.entries(gameNameToIdMap)) {
                if (name.toLowerCase() === lowerGameName) {
                    console.log(`Found game ID ${id} for ${gameName} (case-insensitive match)`);
                    return id;
                }
            }
            
            console.log(`Game ID not found for ${gameName}`);
            return null;
        } catch (error) {
            console.error(`Error getting game ID for ${gameName}:`, error);
            return null;
        }
    };

    const toggleGameExpansion = async (gameData: any) => {
        const gameIdentifier = gameData.gameName || gameData.name || gameData.gameId || gameData.id;
        
        // DEBUG: Log game data immediately
        console.log(`=== TOGGLE EXPANSION DEBUG ===`);
        console.log(`Game identifier: ${gameIdentifier}`);
        console.log(`Full game data:`, JSON.stringify(gameData, null, 2));
        console.log(`Game data keys:`, Object.keys(gameData));
        console.log(`ID fields:`, {
            id: gameData.id,
            gameId: gameData.gameId,
            game_id: gameData.game_id
        });
        
        setExpandedGames(prev => {
            const newSet = new Set(prev);
            if (newSet.has(gameIdentifier)) {
                newSet.delete(gameIdentifier);
            } else {
                newSet.add(gameIdentifier);
                // Fetch analysis if not already loaded
                if (!gameAnalyses[gameIdentifier]) {
                    fetchGameAnalysis(gameIdentifier, gameData);
                }
            }
            return newSet;
        });
    };

    const navigateToGameAnalysis = (gameData: any) => {
        // Use game name as the identifier since backend uses game names
        const gameIdentifier = gameData.gameName || gameData.name || gameData.gameId || gameData.id;
        console.log('Navigating to game analysis with identifier:', gameIdentifier);
        console.log('Game data:', gameData);
        
        router.push({
            pathname: '/analytics/games/[gameId]',
            params: { gameId: gameIdentifier }
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>載入分析數據中...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Brain size={28} color="#FFF" />
                    <Text style={styles.headerTitle}>AI 分析中心</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 總體統計卡片 */}
                {analyticsData && (
                    <View style={styles.overviewSection}>
                        <Text style={styles.sectionTitle}>📊 Overall performance</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Trophy size={24} color="#FFD700" />
                                <Text style={styles.statValue}>{analyticsData.totalGames || 0}</Text>
                                <Text style={styles.statLabel}>Total number of games</Text>
                            </View>
                            <View style={styles.statCard}>
                                <TrendingUp size={24} color="#4CAF50" />
                                <Text style={styles.statValue}>{analyticsData.averageScore || 0}</Text>
                                <Text style={styles.statLabel}>平均分數</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Clock size={24} color="#2196F3" />
                                <Text style={styles.statValue}>{analyticsData.totalPlayTime || 0}h</Text>
                                <Text style={styles.statLabel}>總時長</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* 最近遊戲分析 */}
                <View style={styles.recentGamesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🎮 最近遊戲</Text>
                        <Text style={styles.viewAllText}>查看全部</Text>
                    </View>
                    
                    {recentGames.length > 0 ? (
                        recentGames.map((game, index) => {
                            const gameIdentifier = game.gameName || game.name || game.gameId || game.id;
                            const isExpanded = expandedGames.has(gameIdentifier);
                            const analysis = gameAnalyses[gameIdentifier];
                            const hasScoreData = game.scores !== undefined && game.scores !== null;
                            
                            return (
                                <View key={index} style={styles.gameCardContainer}>
                                    <TouchableOpacity
                                        style={styles.gameCard}
                                        onPress={() => toggleGameExpansion(game)}
                                    >
                                        <View style={styles.gameInfo}>
                                            <View style={styles.gameIcon}>
                                                <Brain size={20} color="#4CAF50" />
                                            </View>
                                            <View style={styles.gameDetails}>
                                                <Text style={styles.gameName}>{game.name || game.gameName || '未知遊戲'}</Text>
                                                <Text style={styles.gameMeta}>
                                                    {game.gameType || game.type || '益智'} • {game.difficulty || 'MEDIUM'}
                                                    {hasScoreData && ` • ${game.totalPlays || 1}次遊玩`}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.gameStats}>
                                            <Text style={[
                                                styles.gameScore, 
                                                !hasScoreData && styles.noScoreText
                                            ]}>
                                                {hasScoreData ? game.scores : '未遊玩'}
                                            </Text>
                                            <ChevronRight 
                                                size={16} 
                                                color="#999" 
                                                style={{transform: [{rotate: isExpanded ? '90deg' : '0deg'}]}}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                    
                                    {/* Expanded Analysis Section */}
                                    {isExpanded && (
                                        <View style={styles.expandedAnalysis}>
                                            {hasScoreData ? (
                                                analysis ? (
                                                    analysis.error ? (
                                                        <View style={styles.errorContainer}>
                                                            <Text style={styles.errorText}>⚠️ {analysis.message}</Text>
                                                            <Text style={styles.errorSubtext}>請稍後再試或查看完整分析</Text>
                                                            <TouchableOpacity
                                                                style={styles.viewFullAnalysisButton}
                                                                onPress={() => navigateToGameAnalysis(game)}
                                                            >
                                                                <Text style={styles.viewFullAnalysisText}>查看完整分析</Text>
                                                                <ChevronRight size={14} color="#4CAF50" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.analysisContent}>
                                                            {analysis.encouragementMessage && (
                                                                <View style={styles.analysisItem}>
                                                                    <Trophy size={16} color="#FFD700" />
                                                                    <Text style={styles.analysisText}>{analysis.encouragementMessage}</Text>
                                                                </View>
                                                            )}
                                                            {analysis.analysis && (
                                                                <View style={styles.analysisItem}>
                                                                    <Brain size={16} color="#4CAF50" />
                                                                    <Text style={styles.analysisText}>{analysis.analysis}</Text>
                                                                </View>
                                                            )}
                                                            {analysis.strengths && (
                                                                <View style={styles.analysisItem}>
                                                                    <TrendingUp size={16} color="#2196F3" />
                                                                    <Text style={styles.analysisText}>{analysis.strengths}</Text>
                                                                </View>
                                                            )}
                                                            {analysis.powerUpTips && (
                                                                <View style={styles.analysisItem}>
                                                                    <Zap size={16} color="#FF9800" />
                                                                    <Text style={styles.analysisText}>{analysis.powerUpTips}</Text>
                                                                </View>
                                                            )}
                                                            <TouchableOpacity
                                                                style={styles.viewFullAnalysisButton}
                                                                onPress={() => navigateToGameAnalysis(game)}
                                                            >
                                                                <Text style={styles.viewFullAnalysisText}>查看完整分析</Text>
                                                                <ChevronRight size={14} color="#4CAF50" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )
                                                ) : (
                                                    <View style={styles.analysisLoading}>
                                                        <ActivityIndicator size="small" color="#4CAF50" />
                                                        <Text style={styles.analysisLoadingText}>載入AI分析中...</Text>
                                                    </View>
                                                )
                                            ) : (
                                                <View style={styles.noGameDataContainer}>
                                                    <Text style={styles.noGameDataText}>🎮 還未遊玩過這個遊戲</Text>
                                                    <Text style={styles.noGameDataSubtext}>開始遊玩以獲得個人化 AI 分析</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Brain size={48} color="#CCC" />
                            <Text style={styles.emptyText}>暫無遊戲記錄</Text>
                            <Text style={styles.emptySubtext}>開始遊戲以獲得 AI 分析</Text>
                        </View>
                    )}
                </View>

                {/* AI 洞察卡片 */}
                <View style={styles.insightsSection}>
                    <Text style={styles.sectionTitle}>🧠 AI 洞察</Text>
                    <View style={styles.insightCard}>
                        <Zap size={20} color="#FF9800" />
                        <Text style={styles.insightTitle}>學習建議</Text>
                        <Text style={styles.insightText}>
                            根據你的遊戲表現，建議多加練習邏輯思維類型的遊戲來提升認知能力。
                        </Text>
                    </View>
                    <View style={styles.insightCard}>
                        <Target size={20} color="#9C27B0" />
                        <Text style={styles.insightTitle}>下一步目標</Text>
                        <Text style={styles.insightText}>
                            挑戰更高難度的遊戲來突破當前水平，目標是將平均分數提升20%。
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
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
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 12,
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
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    overviewSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    recentGamesSection: {
        marginBottom: 24,
    },
    gameCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    gameInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    gameIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameDetails: {
        marginLeft: 12,
        flex: 1,
    },
    gameName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    gameMeta: {
        fontSize: 12,
        color: '#666',
    },
    gameStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gameScore: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CAF50',
        marginRight: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    insightsSection: {
        marginBottom: 20,
    },
    insightCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 8,
    },
    insightText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    gameCardContainer: {
        marginBottom: 8,
    },
    expandedAnalysis: {
        backgroundColor: '#F8F9FA',
        marginTop: 4,
        borderRadius: 8,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    analysisContent: {
        gap: 12,
    },
    analysisItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    analysisText: {
        flex: 1,
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
    },
    analysisLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    analysisLoadingText: {
        fontSize: 13,
        color: '#666',
    },
    viewFullAnalysisButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginTop: 8,
        gap: 4,
    },
    viewFullAnalysisText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
    },
    noScoreText: {
        color: '#999',
        fontSize: 14,
    },
    noGameDataContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noGameDataText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    noGameDataSubtext: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F44336',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
});
