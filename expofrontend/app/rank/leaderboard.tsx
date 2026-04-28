import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, FlatList, ActivityIndicator,
    StyleSheet, RefreshControl, TouchableOpacity, Dimensions
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/auth/AuthContext';
import { getApiBaseUrl } from '@/src/api/client';
import { Trophy, Crown, Medal, Star, User, Award } from 'lucide-react-native';

const GAME_CATEGORIES = [
    "Speed Calculation",
    "AI Math Adventure",
    "Listening Game",
    "Writing Game",
    "Sentence Reorder",
    "Animal Catcher",
    "Animal Classification",
    "Body Parts Matching",
    "Human organs",
    "ChineseGame",
    "ChineseSentenceGame"
].sort();

const { width } = Dimensions.get('window');

// 隨機頭像顏色（根據用戶名生成固定顏色）
const getAvatarColor = (username: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

// 頭像組件
const Avatar = ({ username, size = 50 }: { username: string; size?: number }) => {
    const backgroundColor = getAvatarColor(username);
    const initial = username.charAt(0).toUpperCase();
    return (
        <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.45 }]}>{initial}</Text>
        </View>
    );
};

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
        setLoading(true);
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
            const scoresArray = Array.isArray(userGameScores) ? userGameScores : [];
            if (isRefreshing || pageNum === 0) {
                setData(scoresArray);
            } else {
                setData(prev => [...prev, ...scoresArray]);
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

    useEffect(() => {
        setData([]);
        setHasNext(true);
        setPage(0);
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

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={22} color="#FFD700" />;
        if (rank === 2) return <Medal size={22} color="#C0C0C0" />;
        if (rank === 3) return <Medal size={22} color="#CD7F32" />;
        return null;
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return styles.rankFirst;
        if (rank === 2) return styles.rankSecond;
        if (rank === 3) return styles.rankThird;
        return styles.rankNormal;
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const rank = index + 1;
        const isTopThree = rank <= 3;
        const rankIcon = getRankIcon(rank);
        const rankStyle = getRankStyle(rank);
        const score = item.scores || 0;

        return (
            <View style={[styles.rankItem, isTopThree && styles.topThreeItem]}>
                <View style={[styles.rankBadge, rankStyle]}>
                    {rankIcon ? rankIcon : <Text style={styles.rankText}>{rank}</Text>}
                </View>
                <Avatar username={item.username} size={50} />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <View style={styles.levelBadge}>
                        <Star size={12} color="#FFA500" />
                        <Text style={styles.levelText}>Lv.{Math.floor(score / 100) + 1}</Text>
                    </View>
                </View>
                <View style={styles.scoreContainer}>
                    <Text style={[styles.score, isTopThree && { color: '#FFA500' }]}>{score}</Text>
                    <Text style={styles.ptText}>score</Text>
                </View>
            </View>
        );
    };

    // 標題與遊戲類別網格（作為 FlatList 的頭部）
    const ListHeader = () => (
        <>
            <View style={styles.header}>
                <Text style={styles.mainTitle}>🏆 Ranking</Text>
                <Text style={styles.subTitle}>Let's see who is the strongest learner!</Text>
            </View>
            <View style={styles.categoryGridContainer}>
                <View style={styles.categoryGrid}>
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
                                {game.replace(/([A-Z])/g, ' $1').trim()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${selectedGame}-${item.username}-${index}`}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.2}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={ListHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
                }
                ListEmptyComponent={
                    !loading ? <Text style={styles.emptyText}>✨ No challenge record yet, go and try it! ✨</Text> : null
                }
                ListFooterComponent={
                    hasNext && loading ? <ActivityIndicator style={{ margin: 20 }} color="#FF6B6B" /> : <View style={{ height: 40 }} />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF9F0' },
    header: { alignItems: 'center', marginTop: 60, marginBottom: 16 },
    mainTitle: { fontSize: 32, fontWeight: '900', color: '#FF6B6B', textShadowColor: '#FFD700', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
    subTitle: { fontSize: 14, color: '#FFA500', fontWeight: '600', marginTop: 4 },

    // 類別網格容器
    categoryGridContainer: { paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 10, // React Native 0.71+ 支援，若不支援可改用 margin
    },
    categoryButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: '#FFE4B5',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // 自適應最小寬度，避免按鈕過窄
        minWidth: width > 600 ? 140 : 110,
        alignItems: 'center',
    },
    categoryButtonActive: { backgroundColor: '#FF6B6B', transform: [{ scale: 1.02 }] },
    categoryText: { color: '#FF8C42', fontWeight: 'bold', fontSize: 14 },
    categoryTextActive: { color: '#FFF', fontWeight: 'bold' },

    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    rankItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        padding: 12, borderRadius: 20, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
        borderWidth: 1, borderColor: '#FFE0B5'
    },
    topThreeItem: { backgroundColor: '#FFF5E6', borderLeftWidth: 8, borderLeftColor: '#FFD700' },
    rankBadge: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
        backgroundColor: '#F0F0F0'
    },
    rankFirst: { backgroundColor: '#FFD700', borderWidth: 2, borderColor: '#FFF' },
    rankSecond: { backgroundColor: '#C0C0C0', borderWidth: 2, borderColor: '#FFF' },
    rankThird: { backgroundColor: '#CD7F32', borderWidth: 2, borderColor: '#FFF' },
    rankNormal: { backgroundColor: '#FFE4C4' },
    rankText: { color: '#FFF', fontWeight: '800', fontSize: 20 },
    avatarContainer: { justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowRadius: 4, shadowOpacity: 0.2 },
    avatarText: { color: '#FFF', fontWeight: 'bold' },
    userInfo: { flex: 1, justifyContent: 'center' },
    username: { fontSize: 16, fontWeight: '800', color: '#4A2E1A' },
    levelBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    levelText: { fontSize: 11, color: '#FFA500', fontWeight: '600' },
    scoreContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: 8 },
    score: { fontSize: 24, fontWeight: '900', color: '#FF8C42' },
    ptText: { fontSize: 12, color: '#FFA500', marginLeft: 2, fontWeight: '600' },
    emptyText: { textAlign: 'center', marginTop: 60, fontSize: 16, color: '#FFA500', fontWeight: '600' }
});

export default LeaderboardScreen;