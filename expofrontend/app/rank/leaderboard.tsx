import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, FlatList, ActivityIndicator,
    StyleSheet, RefreshControl, TouchableOpacity, ScrollView, Dimensions
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/auth/AuthContext';
import { getApiBaseUrl } from '@/src/api/client';

const GAME_CATEGORIES = [
    "Speed Calculation",
    "AI Math Adventure",
    "Listening multiple choice questions",
    "Word matching game",
    "Sentence Reordering Game",
    "Animal sorting game",
    "Human Body Puzzle"
].sort(); // Sort alphabetically for consistent ordering

const { width } = Dimensions.get('window');

const LeaderboardScreen = () => {
    const { token } = useAuth();
    const [selectedGame, setSelectedGame] = useState(GAME_CATEGORIES[0]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [hasNext, setHasNext] = useState(true);

    const fetchLeaderboard = async (pageNum: number, isRefreshing = false, targetGame = selectedGame) => {

        if (!hasNext && !isRefreshing && pageNum !== 0) return;

        try {
            const authToken = token || await AsyncStorage.getItem('auth_token');
            const response = await axios.get(
                `${getApiBaseUrl()}/api/game/${targetGame}/leaderboard`,
                {
                    params: { page: pageNum, size: 10 },
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }
            );

            const { slice: userGameScores, hasNext: nextExists } = response.data;
            
            // Ensure userGameScores is always an array
            const scoresArray = Array.isArray(userGameScores) ? userGameScores : [];

            if (isRefreshing || pageNum === 0) {
                setData(scoresArray);
            } else {
                setData(prev => [...(prev || []), ...scoresArray]);
            }

            setHasNext(nextExists);
            setPage(pageNum);
        } catch (error) {
            console.error(`${targetGame} Ranking fetch failed:`, error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // When switching game categories
    useEffect(() => {
        setData([]); // 清空舊數據
        setHasNext(true);
        setPage(0);
        setLoading(true);
        fetchLeaderboard(0, true, selectedGame);
    }, [selectedGame]);


    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaderboard(0, true, selectedGame);
    }, [selectedGame]);


    const handleLoadMore = () => {
        if (hasNext && !loading && !refreshing) {
            fetchLeaderboard(page + 1);
        }
    };

    // Render the ranking of each row
    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const rank = index + 1;
        const isTopThree = rank <= 3;
        const trophyColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

        return (
            <View style={[styles.rankItem, isTopThree && styles.topThreeItem]}>
                <View style={[styles.rankBadge, isTopThree && { backgroundColor: trophyColors[index] }]}>
                    <Text style={styles.rankText}>{rank}</Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={[styles.score, isTopThree && { color: trophyColors[index] }]}>
                        {item.scores}
                    </Text>
                    <Text style={styles.ptText}>pt</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.mainTitle}>Leaderboard</Text>


            <View style={styles.selectorWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {GAME_CATEGORIES.map((game) => (
                        <TouchableOpacity
                            key={game}
                            style={[
                                styles.categoryButton,
                                selectedGame === game && styles.categoryButtonActive
                            ]}
                            onPress={() => setSelectedGame(game)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedGame === game && styles.categoryTextActive
                            ]}>
                                {game}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${selectedGame}-${item.username}-${index}`}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.2}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                }
                ListEmptyComponent={
                    !loading ? <Text style={styles.emptyText}>There are currently no records to challenge.</Text> : null
                }
                ListFooterComponent={
                    hasNext && loading ? <ActivityIndicator style={{ margin: 20 }} color="#4CAF50" /> : <View style={{ height: 40 }} />
                }
            />
        </View>
    );
};



const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    mainTitle: {
        fontSize: 26, fontWeight: '800', color: '#1A1A1A',
        textAlign: 'center', marginTop: 60, marginBottom: 20
    },
    selectorWrapper: { backgroundColor: '#F0F2F5', paddingBottom: 10 },
    categoryScroll: { paddingHorizontal: 16 },
    categoryButton: {
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25,
        backgroundColor: '#E0E0E0', marginRight: 10, elevation: 1
    },
    categoryButtonActive: { backgroundColor: '#4CAF50' },
    categoryText: { color: '#666', fontWeight: 'bold' },
    categoryTextActive: { color: '#FFF' },

    listContent: { padding: 16 },
    rankItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        padding: 16, borderRadius: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
    },
    topThreeItem: { borderLeftWidth: 5, borderLeftColor: '#4CAF50' },
    rankBadge: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#BDC3C7',
        justifyContent: 'center', alignItems: 'center', marginRight: 16
    },
    rankText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
    userInfo: { flex: 1 },
    username: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
    date: { fontSize: 12, color: '#95A5A6', marginTop: 2 },
    scoreContainer: { flexDirection: 'row', alignItems: 'baseline' },
    score: { fontSize: 22, fontWeight: '900', color: '#2C3E50' },
    ptText: { fontSize: 12, color: '#95A5A6', marginLeft: 2, fontWeight: '600' },
    emptyText: { textAlign: 'center', marginTop: 100, color: '#95A5A6', fontSize: 16 }
});

export default LeaderboardScreen;