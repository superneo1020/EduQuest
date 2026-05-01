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
    FlatList,
    Dimensions
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
    Crown,
    Target
} from 'lucide-react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { getApiBaseUrl } from '@/src/api/client';
import axios from 'axios';

interface LeaderboardEntry {
    username: string;
    scores: number;
    createdAt: string;
    avatar?: string;
    rank?: number;
}

interface Game {
    id: number;
    name: string;
    type: string;
    difficulty: string;
    icon: string;
    description: string;
}

const { width } = Dimensions.get('window');

export default function StudentClassLeaderboard() {
    const router = useRouter();
    const { user, token } = useAuth();
    const params = useLocalSearchParams();
    
    // Get classId and className from URL parameters
    const classId = params.classId as string;
    const className = params.className as string;
    
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedGame, setSelectedGame] = useState<string>('');
    const [games, setGames] = useState<Game[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    useEffect(() => {
        loadGames();
    }, [token]);

    useEffect(() => {
        if (selectedGame && classId && token) {
            loadLeaderboard(true);
        }
    }, [selectedGame, classId, token]);

    const loadGames = async () => {
        // Hardcoded games list since backend doesn't have /api/games endpoint
        const gamesList = [
            { id: 1, name: 'Speed Calculation', type: 'math', difficulty: 'easy', icon: '🧮', description: 'Quick math problems' },
            { id: 2, name: 'AI Math Adventure', type: 'math', difficulty: 'medium', icon: '🤖', description: 'AI-powered math challenges' },
            { id: 3, name: 'Listening Game', type: 'english', difficulty: 'easy', icon: '🎧', description: 'Audio comprehension' },
            { id: 4, name: 'Writing Game', type: 'english', difficulty: 'medium', icon: '✍️', description: 'Writing exercises' },
            { id: 5, name: 'Sentence Reorder', type: 'english', difficulty: 'medium', icon: '📝', description: 'Sentence structure' },
            { id: 6, name: 'Animal Catcher', type: 'science', difficulty: 'easy', icon: '🦁', description: 'Animal identification' },
            { id: 7, name: 'Human organs', type: 'science', difficulty: 'medium', icon: '🫀', description: 'Human body systems' },
            { id: 8, name: 'Animal Classification', type: 'science', difficulty: 'medium', icon: '🐾', description: 'Animal classification' },
            { id: 9, name: 'Body Parts Matching', type: 'science', difficulty: 'easy', icon: '🦴', description: 'Body parts identification' },
            { id: 10, name: 'ChineseGame', type: 'chinese', difficulty: 'medium', icon: '🀄', description: 'Chinese characters' },
            { id: 11, name: 'ChineseSentenceGame', type: 'chinese', difficulty: 'medium', icon: '📖', description: 'Chinese sentences' }
        ];
        setGames(gamesList);
        
        // Auto-select first game
        if (gamesList.length > 0 && !selectedGame) {
            setSelectedGame(gamesList[0].name);
        }
    };

    const loadLeaderboard = async (reset = false) => {
        if (!selectedGame || !classId) {
            return;
        }
        if (!token || token.trim() === '') {
            console.log('No token available, skipping leaderboard load');
            return;
        }

        try {
            setLoading(true);
            const currentPage = reset ? 0 : page;
            
            const encodedGameName = encodeURIComponent(selectedGame);
            const url = `${getApiBaseUrl()}/api/user/game/${encodedGameName}/leaderboard/class/${classId}?page=${currentPage}&size=${pageSize}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newEntries = response.data.content || response.data || [];
            
            if (reset) {
                setLeaderboard(newEntries);
                setPage(1);
            } else {
                setLeaderboard(prev => [...prev, ...newEntries]);
                setPage(prev => prev + 1);
            }
            
            setHasMore(response.data.hasNext || false);
        } catch (error: any) {
            console.error('StudentClassLeaderboard - Error loading leaderboard:', error.response?.status, error.response?.data || error.message);
            
            // Handle 401 errors gracefully
            if (error.response?.status === 401) {
                console.log('StudentClassLeaderboard - Authentication failed for class leaderboard');
                setLeaderboard([]);
                setHasMore(false);
            } else {
                // For other errors, show empty leaderboard
                setLeaderboard([]);
                setHasMore(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadLeaderboard(true).finally(() => setRefreshing(false));
    }, [selectedGame, classId]);

    const loadMore = () => {
        if (hasMore && !loading) {
            loadLeaderboard(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown size={24} color="#FFD700" />;
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
                return '#636E72';
        }
    };

    const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const rank = index + 1;
        const isCurrentUser = item.username === user?.username;
        
        return (
            <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
                <View style={styles.rankContainer}>
                    {getRankIcon(rank)}
                </View>
                
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {item.username.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
                            {item.username}
                            {isCurrentUser && <Text style={styles.youText}> (You)</Text>}
                        </Text>
                        <Text style={styles.score}>
                            Score: <Text style={styles.scoreValue}>{item.scores}</Text>
                        </Text>
                    </View>
                </View>
                
                <View style={styles.scoreContainer}>
                    <Target size={20} color="#6C5CE7" />
                    <Text style={styles.totalScore}>{item.scores}</Text>
                </View>
            </View>
        );
    };

    const renderGameItem = ({ item }: { item: Game }) => (
        <TouchableOpacity
            style={[styles.gameItem, selectedGame === item.name && styles.selectedGameItem]}
            onPress={() => {
                setSelectedGame(item.name);
                setLeaderboard([]);
                setPage(0);
            }}
        >
            <Text style={styles.gameIcon}>{item.icon}</Text>
            <Text style={[styles.gameName, selectedGame === item.name && styles.selectedGameName]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

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
            <View style={styles.classInfoContainer}>
                <Text style={styles.classInfoText}>{className || 'Class'} Students</Text>
                <Users size={20} color="#4CAF50" />
                <Text style={styles.studentCount}>{leaderboard.length} Students</Text>
            </View>

            {/* Game Selection */}
            <View style={styles.gameSelectionContainer}>
                <Text style={styles.sectionTitle}>Select Game</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.gamesList}
                    contentContainerStyle={styles.gamesListContent}
                >
                    {games.map((game) => (
                        <View key={game.id}>
                            {renderGameItem({ item: game })}
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Leaderboard */}
            <View style={styles.leaderboardContainer}>
                <View style={styles.leaderboardHeader}>
                    <Trophy size={24} color="#FFD700" />
                    <Text style={styles.leaderboardTitle}>Top Performers</Text>
                    {selectedGame && (
                        <Text style={styles.selectedGameText}>{selectedGame}</Text>
                    )}
                </View>

                {loading && leaderboard.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6C5CE7" />
                        <Text style={styles.loadingText}>Loading leaderboard...</Text>
                    </View>
                ) : leaderboard.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Trophy size={48} color="#DDD" />
                        <Text style={styles.emptyTitle}>No Scores Yet</Text>
                        <Text style={styles.emptyDescription}>
                            Be the first to play {selectedGame} and set a record!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={leaderboard}
                        renderItem={renderLeaderboardItem}
                        keyExtractor={(item, index) => `${item.username}-${index}`}
                        contentContainerStyle={styles.leaderboardList}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.1}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    refreshBtn: {
        padding: 8,
    },
    classInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    classInfoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
        marginRight: 8,
    },
    studentCount: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    gameSelectionContainer: {
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
    },
    gamesList: {
        flexGrow: 0,
    },
    gamesListContent: {
        paddingRight: 20,
    },
    gameItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minWidth: 80,
    },
    selectedGameItem: {
        backgroundColor: '#6C5CE7',
        borderColor: '#6C5CE7',
    },
    gameIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    gameName: {
        fontSize: 12,
        color: '#636E72',
        textAlign: 'center',
        fontWeight: '600',
    },
    selectedGameName: {
        color: 'white',
    },
    leaderboardContainer: {
        flex: 1,
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    leaderboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        flex: 1,
        marginLeft: 12,
    },
    selectedGameText: {
        fontSize: 14,
        color: '#6C5CE7',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    emptyDescription: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    leaderboardList: {
        padding: 0,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    currentUserItem: {
        backgroundColor: '#E8F5E8',
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#636E72',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 16,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    userDetails: {
        marginLeft: 12,
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    currentUsername: {
        color: '#4CAF50',
    },
    youText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    score: {
        fontSize: 14,
        color: '#666',
    },
    scoreValue: {
        fontWeight: '600',
        color: '#2D3436',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    totalScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6C5CE7',
    },
});
