import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    FlatList,
    ActivityIndicator,
    Platform
} from 'react-native';
import { ChevronLeft, Gamepad2, History as HistoryIcon, ScrollText, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '@/src/api/client';

interface PointHistoryItem {
    id: number;
    amount: number;
    sourceType: 'GAME' | 'MISSION';
    sourceId: number;
    createdAt: string;
}

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<PointHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // 計算總獲得積分 (簡易邏輯)
    const totalEarned = history.reduce((sum, item) => item.amount > 0 ? sum + item.amount : sum, 0);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                if (!token) return;

                const response = await axios.get(`${getApiBaseUrl()}/api/points/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setHistory(response.data);
            } catch (error: any) {
                console.error("Fetch history failed:", error.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const renderItem = ({ item }: { item: PointHistoryItem }) => (
        <View style={styles.historyItem}>
            <View style={styles.itemLeft}>
                <View style={[
                    styles.iconBox,
                    { backgroundColor: item.sourceType === 'GAME' ? '#E3F2FD' : '#E8F5E9' }
                ]}>
                    {item.sourceType === 'GAME' ?
                        <Gamepad2 size={20} color="#2196F3" /> :
                        <ScrollText size={20} color="#4CAF50" />
                    }
                </View>
                <View>
                    <Text style={styles.sourceText}>
                        {item.sourceType === 'GAME' ? 'Game Reward' : 'Mission Complete'}
                    </Text>
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                </View>
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.amountText, { color: item.amount >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                    {item.amount >= 0 ? `+${item.amount}` : item.amount}
                </Text>
                {item.amount >= 0 ?
                    <ArrowUpRight size={14} color="#2ECC71" /> :
                    <ArrowDownLeft size={14} color="#E74C3C" />
                }
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={28} color="#2D3436" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Points Ledger</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View>
                    <Text style={styles.summaryLabel}>Total Rewards Earned</Text>
                    <Text style={styles.summaryValue}>{totalEarned} <Text style={styles.pts}>PTS</Text></Text>
                </View>
                <View style={styles.summaryIconBox}>
                    <HistoryIcon size={30} color="#FFF" />
                </View>
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Recent Transactions</Text>
            </View>

            {loading ? (
                <View style={styles.centerMode}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            ) : history.length > 0 ? (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconCircle}>
                        <HistoryIcon size={40} color="#BDC3C7" />
                    </View>
                    <Text style={styles.emptyText}>No transactions yet</Text>
                    <Text style={styles.emptySubtext}>Play games to earn your first points!</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#2D3436' },

    // Summary Card
    summaryCard: {
        backgroundColor: '#2D3436', // 深色卡片更有高級感
        margin: 20,
        padding: 25,
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    summaryLabel: { color: '#B2BEC3', fontSize: 14, fontWeight: '600' },
    summaryValue: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 5 },
    pts: { fontSize: 16, color: '#4CAF50' },
    summaryIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

    listHeader: { paddingHorizontal: 25, marginBottom: 10 },
    listTitle: { fontSize: 18, fontWeight: '700', color: '#2D3436' },
    listPadding: { paddingHorizontal: 20, paddingBottom: 30 },

    // List Items
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
            android: { elevation: 2 }
        }),
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    sourceText: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
    dateText: { fontSize: 13, color: '#A0A0A0', marginTop: 2 },
    amountContainer: { flexDirection: 'row', alignItems: 'center' },
    amountText: { fontSize: 18, fontWeight: '800', marginRight: 4 },

    // Empty State
    centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 20, fontWeight: '700', color: '#636E72' },
    emptySubtext: { fontSize: 14, color: '#95A5A6', marginTop: 8 },
});