import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    Trophy,
    Medal,
    Award,
    Users,
    ChevronRight,
    ChevronLeft,
    RefreshCw,
    TrendingUp,
    Star,
} from 'lucide-react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { getApiBaseUrl } from '@/src/api/client';
import axios from 'axios';

interface LeaderboardEntry {
    username: string;
    scores: number;
    createdAt: string;
}

interface Game {
    id: number;
    name: string;
    type: string;
    difficulty: string;
    icon: string;
    description: string;
}

export default function ClassLeaderboard() {
    const router = useRouter();
    const { user, token } = useAuth();
    const params = useLocalSearchParams();
    
    // Get classId and className from URL parameters
    const classId = params.classId as string;
    const className = params.className as string;
    
    
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedGame, setSelectedGame] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 20;

    useEffect(() => {
        // Load games when token is available
        if (token) {
            loadGames();
        }
    }, [token]);

    useEffect(() => {
        if (selectedGame && classId && token) {
            loadLeaderboard(true);
        }
    }, [selectedGame, classId, token]);

    const loadGames = async () => {
        // Hardcoded games list since backend doesn't have /api/games endpoint
        const hardcodedGames = [
            { id: 1, name: 'Speed Calculation'},
            { id: 2, name: 'AI Math Adventure'},
            { id: 3, name: 'Listening Game'},
            { id: 4, name: 'Writing Game'},
            { id: 5, name: 'Sentence Reorder'},
            { id: 6, name: 'Animal Catcher'},
            { id: 7, name: 'Human organs'},
            { id: 8, name: 'Animal Classification'},
            { id: 9, name: 'Body Parts Matching'},
            { id: 10, name: 'ChineseGame'},
            { id: 11, name: 'ChineseSentenceGame'}
        ];

        setGames(hardcodedGames);
        if (hardcodedGames.length > 0) {
            setSelectedGame(hardcodedGames[0].name);
        }
    };

    const loadLeaderboard = async (reset = false) => {
        if (!selectedGame || !classId) {
            return;
        }
        if (!token || token.trim() === '') {
            console.error('No valid token available for loading leaderboard');
            return;
        }
        
        try {
            if (reset) {
                setLoading(true);
                setPage(0);
                setHasMore(true);
            }

            const encodedGameName = encodeURIComponent(selectedGame);
            const url = `${getApiBaseUrl()}/api/user/game/${encodedGameName}/leaderboard/class/${classId}?page=${reset ? 0 : page}&size=${pageSize}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newEntries = response.data.slice || [];
            
            if (reset) {
                setLeaderboard(newEntries);
            } else {
                setLeaderboard(prev => [...prev, ...newEntries]);
            }

            setHasMore(response.data.hasNext || false);
            setPage(prev => reset ? 1 : prev + 1);
        } catch (error: any) {
            console.error('ClassLeaderboard - Error loading leaderboard:', error.response?.status, error.response?.data || error.message);
            if (error.response?.status === 401) {
                console.error('ClassLeaderboard - Authentication failed for class leaderboard - educator is not enrolled as class member');
                // Set empty leaderboard for 401 errors since educator can't access class leaderboard
                setLeaderboard([]);
                setHasMore(false);
            } else {
                // For other errors, set empty data to prevent UI crashes
                setLeaderboard([]);
                setHasMore(false);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadLeaderboard(true);
    }, [selectedGame, classId]);

    const loadMore = () => {
        if (hasMore && !loading) {
            loadLeaderboard(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy size={24} color="#FFD700" />;
            case 2:
                return <Medal size={24} color="#C0C0C0" />;
            case 3:
                return <Award size={24} color="#CD7F32" />;
            default:
                return <Text style={styles.rankNumber}>{rank}</Text>;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return '#FFD700';
            case 2:
                return '#C0C0C0';
            case 3:
                return '#CD7F32';
            default:
                return '#666';
        }
    };

    if (loading && leaderboard.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C5CE7" />
                    <Text style={styles.loadingText}>Loading leaderboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#2D3436" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{className || 'Class'} Leaderboard</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                    <RefreshCw size={24} color="#6C5CE7" />
                </TouchableOpacity>
            </View>

            {/* Class Info */}
            <View style={styles.schoolInfoContainer}>
                <Text style={styles.schoolInfoText}>{className || 'Class'} Students</Text>
                <Users size={20} color="#4CAF50" />
                <Text style={styles.studentCount}>{leaderboard.length} Students</Text>
            </View>

            {/* Game Selection */}
            <View style={styles.selectionContainer}>
                <View style={styles.selectionGroup}>
                    <Text style={styles.selectionLabel}>Game</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {games.map((game) => (
                            <TouchableOpacity
                                key={game.id}
                                style={[
                                    styles.gameChip,
                                    selectedGame === game.name && styles.gameChipActive
                                ]}
                                onPress={() => setSelectedGame(game.name)}
                            >
                                <Text style={[
                                    styles.gameChipText,
                                    selectedGame === game.name && styles.gameChipTextActive
                                ]}>
                                    {game.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* Leaderboard */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
                    if (isCloseToBottom) {
                        loadMore();
                    }
                }}
                scrollEventThrottle={400}
            >
                {leaderboard.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Trophy size={48} color="#ccc" />
                        <Text style={styles.emptyStateText}>No scores yet</Text>
                        <Text style={styles.emptyStateSubtext}>Be the first to play!</Text>
                    </View>
                ) : (
                    <View style={styles.leaderboardContainer}>
                        {/* Top 3 Highlight */}
                        {leaderboard.slice(0, 3).map((entry, index) => (
                            <View key={index} style={[
                                styles.leaderboardItem,
                                styles.topThreeItem
                            ]}>
                                <View style={[
                                    styles.rankContainer,
                                    styles.topThreeRankContainer
                                ]}>
                                    {getRankIcon(index + 1)}
                                </View>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.topPlayerName}>{entry.username}</Text>
                                    <Text style={styles.playerDate}>
                                        {new Date(entry.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.scoreContainer}>
                                    <Text style={[
                                        styles.topScore,
                                        { color: getRankColor(index + 1) }
                                    ]}>
                                        {entry.scores}
                                    </Text>
                                    <TrendingUp size={20} color="#4CAF50" />
                                </View>
                            </View>
                        ))}

                        {/* Rest of the leaderboard */}
                        {leaderboard.slice(3).map((entry, index) => (
                            <View key={index + 3} style={styles.leaderboardItem}>
                                <View style={styles.rankContainer}>
                                    <Text style={styles.rankNumber}>{index + 4}</Text>
                                </View>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>{entry.username}</Text>
                                    <Text style={styles.playerDate}>
                                        {new Date(entry.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.scoreContainer}>
                                    <Text style={styles.score}>{entry.scores}</Text>
                                    <TrendingUp size={16} color="#4CAF50" />
                                </View>
                            </View>
                        ))}
                        
                        {hasMore && (
                            <View style={styles.loadMoreContainer}>
                                <ActivityIndicator size="small" color="#6C5CE7" />
                                <Text style={styles.loadMoreText}>Loading more...</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F0E6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F0E6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionContainer: {
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    selectionGroup: {
        marginBottom: 16,
    },
    selectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    gameChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0E6FF',
        marginRight: 8,
    },
    gameChipActive: {
        backgroundColor: '#6C5CE7',
    },
    gameChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    gameChipTextActive: {
        color: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    leaderboardContainer: {
        padding: 16,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rankContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    playerDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    score: {
        fontSize: 18,
        fontWeight: '700',
    },
    loadMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadMoreText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    schoolInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    schoolInfoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6C5CE7',
        flex: 1,
        marginLeft: 8,
    },
    studentCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
        marginLeft: 4,
    },
    topThreeItem: {
        borderWidth: 2,
        borderColor: '#FFD700',
        backgroundColor: '#FFFAF0',
    },
    topThreeRankContainer: {
        backgroundColor: '#FFFAF0',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    topPlayerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    topScore: {
        fontSize: 20,
        fontWeight: '800',
    },
});
