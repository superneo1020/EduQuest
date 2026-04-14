import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
    StatusBar, Dimensions, ActivityIndicator, TextInput, FlatList
} from 'react-native';
import {
    Trophy, Gamepad2, Calculator, BookOpen, Brain, FlaskConical,
    ArrowLeft, Search, Filter, ChevronRight, Clock, Star, Zap, ChevronDown, TrendingUp
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import { LinearGradient } from 'expo-linear-gradient'; // 建議安裝 expo-linear-gradient 增加質感

const { width } = Dimensions.get('window');

export default function GameRecordsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [gameHistory, setGameHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');


    const categories = ['ALL', 'MATH', 'ENGLISH', 'SCIENCE', 'CHINESE'];
    const difficulties = ['ALL', 'EASY', 'MEDIUM', 'HARD'];
    const sortOptions = ['date_desc', 'date_asc', 'score_desc', 'score_asc'];

    const fetchGameRecords = useCallback(async (page: number = 0) => {
        if (!token) return;
        try {
            setLoading(true);
            // Try minimal parameters first
            const params = new URLSearchParams({
                page: page.toString(),
                size: '20'
            });
            const response = await axios.get(`${getApiBaseUrl()}/api/user/game/score?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGameHistory(response.data.content || []);
            setCurrentPage(response.data.currentPage || 0);
            setTotalPages(response.data.totalPages || 0);
            setHasNext(response.data.hasNext || false);
            setHasPrevious(response.data.hasPrevious || false);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        fetchGameRecords();
    }, [fetchGameRecords]);

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(0);
        fetchGameRecords(0);
    }, [selectedCategory, selectedDifficulty, searchQuery, sortBy]);

    const loadNextPage = () => {
        if (hasNext && !loading) {
            fetchGameRecords(currentPage + 1);
        }
    };

    const loadPreviousPage = () => {
        if (hasPrevious && !loading) {
            fetchGameRecords(currentPage - 1);
        }
    };

    // Debug: 檢查數據結構
    React.useEffect(() => {
        if (gameHistory.length > 0) {
            console.log('Game record sample:', gameHistory[0]);
            console.log('All fields:', Object.keys(gameHistory[0]));
            console.log('Available game types:', [...new Set(gameHistory.map(g => g.gameType || g.type || g.game_category))]);
            console.log('Available difficulties:', [...new Set(gameHistory.map(g => g.gameDifficulty || g.difficulty || g.game_difficulty))]);
        }
    }, [gameHistory]);

    // Sort options display labels
    const getSortLabel = (sort: string) => {
        switch (sort) {
            case 'date_desc': return 'Date (Newest)';
            case 'date_asc': return 'Date (Oldest)';
            case 'score_desc': return 'Score (Highest)';
            case 'score_asc': return 'Score (Lowest)';
            default: return sort;
        }
    };

    const getSortColor = (sort: string) => {
        switch (sort) {
            case 'date_desc': return '#FF6B6B';
            case 'date_asc': return '#FFA07A';
            case 'score_desc': return '#4ECDC4';
            case 'score_asc': return '#45B7D1';
            default: return '#636E72';
        }
    };


    // 前端過濾與排序邏輯
    const filteredRecords = useMemo(() => {
        let filtered = gameHistory.filter(r => {
            // 支持多種可能的字段名稱
            const gameType = r.gameType || r.type || r.game_category || r.gameCategory;
            const difficulty = r.gameDifficulty || r.difficulty || r.game_difficulty || r.gameDifficulty;
            const name = r.name || r.gameName || r.game_name;

            const matchCat = selectedCategory === 'ALL' || gameType?.toString().toUpperCase() === selectedCategory;
            const matchDiff = selectedDifficulty === 'ALL' || difficulty?.toString().toUpperCase() === selectedDifficulty;
            const matchSearch = name?.toString().toLowerCase().includes(searchQuery.toLowerCase());



            return matchCat && matchDiff && matchSearch;
        });

        // 排序邏輯
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date_desc':
                    return new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime();
                case 'date_asc':
                    return new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime();
                case 'score_desc':
                    return (b.scores || b.score || 0) - (a.scores || a.score || 0);
                case 'score_asc':
                    return (a.scores || a.score || 0) - (b.scores || b.score || 0);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [gameHistory, selectedCategory, selectedDifficulty, searchQuery, sortBy]);

    // 統計基於當前頁數據
    const stats = useMemo(() => ({
        totalPoints: gameHistory.reduce((sum, r) => sum + (r.points || 0), 0),
        totalGames: gameHistory.length,
        bestScore: gameHistory.length > 0 ? Math.max(...gameHistory.map(r => r.scores || r.score || 0)) : 0
    }), [gameHistory]);

    // 輔助組件：渲染圖標與顏色
    const getThemeColor = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'MATH': return '#4CAF50';
            case 'ENGLISH': return '#2196F3';
            case 'SCIENCE': return '#FF9800';
            case 'CHINESE': return '#9C27B0';
            default: return '#636E72';
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff?.toUpperCase()) {
            case 'HARD': return '#FF4757';
            case 'MEDIUM': return '#FF9800';
            default: return '#4CAF50';
        }
    };

    const renderGameIcon = (type: string, color: string) => {
        const props = { size: 22, color };
        switch (type?.toUpperCase()) {
            case 'MATH': return <Calculator {...props} />;
            case 'ENGLISH': return <BookOpen {...props} />;
            case 'SCIENCE': return <FlaskConical {...props} />;
            case 'CHINESE': return <Brain {...props} />;
            default: return <Gamepad2 {...props} />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Area */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        // Fallback to navigate back to profile if no history
                        router.replace('/Profile/profile');
                    }
                }} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Play History</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Trophy size={22} color="#F1C40F" />
                        <Text style={styles.statNumber}>{stats.totalGames}</Text>
                        <Text style={styles.statTitle}>Games Played</Text>
                    </View>
                    <View style={styles.statCard}>
                        <TrendingUp size={22} color="#4CAF50" />
                        <Text style={styles.statNumber}>{stats.totalPoints.toLocaleString()}</Text>
                        <Text style={styles.statTitle}>Total Points</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Star size={22} color="#FF9800" />
                        <Text style={styles.statNumber}>{stats.bestScore}</Text>
                        <Text style={styles.statTitle}>Highest Score</Text>
                    </View>
                </View>

                {/* Search & Filters */}
                <View style={styles.controlsContainer}>
                    <View style={styles.searchBox}>
                        <Search size={18} color="#B2BEC3" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for game name..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.filterToggleBtn}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} color="#FFF" />
                        <Text style={styles.filterToggleText}>Filter</Text>
                        {(selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL' || sortBy !== 'date_desc' || searchQuery !== '') && (
                            <View style={styles.activeFilterDot} />
                        )}
                    </TouchableOpacity>

                    {showFilters && (
                        <View style={styles.combinedFilterPanel}>
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Game Type</Text>
                                <View style={styles.filterOptions}>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => setSelectedCategory(cat)}
                                            style={[styles.filterOption, selectedCategory === cat && { backgroundColor: getThemeColor(cat) }]}
                                        >
                                            <Text style={[styles.filterOptionText, selectedCategory === cat && styles.activeFilterOptionText]}>
                                                {cat === 'ALL' ? 'All' : cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Difficulty</Text>
                                <View style={styles.filterOptions}>
                                    {difficulties.map(diff => (
                                        <TouchableOpacity
                                            key={diff}
                                            onPress={() => setSelectedDifficulty(diff)}
                                            style={[styles.filterOption, selectedDifficulty === diff && { backgroundColor: getDifficultyColor(diff) }]}
                                        >
                                            <Text style={[styles.filterOptionText, selectedDifficulty === diff && styles.activeFilterOptionText]}>
                                                {diff === 'ALL' ? 'All' : diff}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Sort By</Text>
                                <View style={styles.filterOptions}>
                                    {sortOptions.map(option => (
                                        <TouchableOpacity
                                            key={option}
                                            onPress={() => setSortBy(option as 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc')}
                                            style={[styles.filterOption, sortBy === option && { backgroundColor: getSortColor(option) }]}
                                        >
                                            <Text style={[styles.filterOptionText, sortBy === option && styles.activeFilterOptionText]}>
                                                {getSortLabel(option)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>


                            <TouchableOpacity
                                style={styles.clearFiltersBtn}
                                onPress={() => {
                                    setSelectedCategory('ALL');
                                    setSelectedDifficulty('ALL');
                                    setSortBy('date_desc');
                                    setSearchQuery('');
                                }}
                            >
                                <Text style={styles.clearFiltersText}>Clear all filters</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Records List Area */}
                <View style={styles.recordsContainer}>
                    {loading ? (
                        <ActivityIndicator style={{ marginVertical: 40 }} color="#4CAF50" />
                    ) : filteredRecords.length > 0 ? (
                        <>
                            {/* 正確的列表渲染 */}
                            {filteredRecords.map((item: any, index: number) => {
                                const gameType = item.gameType || item.type || item.game_category;
                                const difficulty = item.gameDifficulty || item.difficulty;
                                const name = item.name || item.gameName;
                                const themeColor = getThemeColor(gameType);
                                return (
                                    <View key={`game-${index}`} style={styles.activityCard}>
                                        <View style={[styles.gameIconBg, { backgroundColor: `${themeColor}20` }]}>
                                            {renderGameIcon(gameType, themeColor)}
                                        </View>
                                        <View style={styles.recordInfo}>
                                            <Text style={styles.recordName}>{name}</Text>
                                            <View style={styles.recordMeta}>
                                                <Text style={[styles.recordDifficulty, { color: getDifficultyColor(difficulty) }]}>
                                                    {difficulty}
                                                </Text>
                                                <Text style={styles.recordDate}>
                                                    {new Date(item.createdAt || item.created_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.recordScores}>
                                            <Text style={styles.recordScore}>Score: {item.scores || 0}</Text>
                                            {(item.points || 0) > 0 && (
                                                <Text style={styles.recordPoints}>+{item.points} XP</Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}

                            {/* 分頁控制項放這裡（在 map 之外） */}
                            {(hasNext || hasPrevious) && (
                                <View style={styles.paginationContainer}>
                                    <TouchableOpacity
                                        style={[styles.paginationBtn, !hasPrevious && styles.disabledBtn]}
                                        onPress={loadPreviousPage}
                                        disabled={!hasPrevious || loading}
                                    >
                                        <Text style={styles.paginationBtnText}>Prev</Text>
                                    </TouchableOpacity>

                                    <Text style={styles.paginationInfo}>
                                        {currentPage + 1} / {totalPages || 1}
                                    </Text>

                                    <TouchableOpacity
                                        style={[styles.paginationBtn, !hasNext && styles.disabledBtn]}
                                        onPress={loadNextPage}
                                        disabled={!hasNext || loading}
                                    >
                                        <Text style={styles.paginationBtnText}>Next</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Gamepad2 size={48} color="#DFE6E9" />
                            <Text style={styles.emptyText}>No records found.</Text>
                        </View>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#2D3436' },
    backBtn: { padding: 8 },
    placeholder: { width: 40 },

    // Stats Section
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 10
    },
    statCard: {
        width: '31%',
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 10
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '900',
        color: '#2D3436',
        marginVertical: 5,
    },
    statTitle: {
        fontSize: 11,
        color: '#636E72',
        fontWeight: '700',
        marginTop: 2
    },

    // Controls
    controlsContainer: { paddingHorizontal: 20 },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 45,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        marginTop: 10
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },

    // Filter Toggle Button
    filterToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 12,
        position: 'relative',
    },
    filterToggleText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    activeFilterDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4757',
    },

    // Combined Filter Panel
    combinedFilterPanel: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 24,
        marginTop: 10,
        elevation: 2,
    },
    filterSection: {
        marginBottom: 20,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    activeSortOption: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636E72',
        marginRight: 4,
    },
    activeFilterOptionText: {
        color: '#FFF',
    },
    clearFiltersBtn: {
        backgroundColor: '#FF4757',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    clearFiltersText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },

    // Records Container
    recordsContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 5,
        elevation: 2
    },

    // Activity Cards (matching Profile style)
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    gameIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    recordInfo: {
        flex: 1,
    },
    recordName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    recordMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    recordDifficulty: {
        fontSize: 12,
        fontWeight: '600',
    },
    recordDate: {
        fontSize: 12,
        color: '#636E72',
        marginLeft: 8,
    },
    recordScores: {
        alignItems: 'flex-end',
    },
    recordScore: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    recordPoints: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#636E72',
        marginTop: 15,
    },

    // Pagination
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F2F6',
    },
    paginationBtn: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#E1E4E8',
    },
    paginationBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    paginationInfo: {
        fontSize: 14,
        color: '#636E72',
        fontWeight: '500',
    },
});