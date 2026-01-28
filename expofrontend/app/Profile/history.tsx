import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar, FlatList
} from 'react-native';
import {ChevronLeft, Gamepad2, History, ScrollText} from 'lucide-react-native';
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

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. 先從儲存空間拿 Token
                const token = await AsyncStorage.getItem('auth_token');

                if (!token) {
                    console.error("No token found, redirecting...");
                    return;
                }

                // 2. 建立一個帶有 Header 的請求 (不依賴 defaults)
                const response = await axios.get(`${getApiBaseUrl()}/api/points/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                setHistory(response.data);
            } catch (error: any) {
                console.error("Fetch history failed:", error.message);
                if (error.response?.status === 401) {
                    console.error("Token 可能已過期或無效");
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const renderItem = ({ item }: { item: PointHistoryItem }) => (
        <View style={styles.historyItem}>
            <View style={styles.itemLeft}>
                <View style={[styles.iconBox, { backgroundColor: item.sourceType === 'GAME' ? '#E3F2FD' : '#E8F5E9' }]}>
                    {item.sourceType === 'GAME' ? <Gamepad2 size={20} color="#2196F3" /> : <ScrollText size={20} color="#4CAF50" />}
                </View>
                <View>
                    <Text style={styles.sourceText}>{item.sourceType === 'GAME' ? 'Game Reward' : 'Mission Reward'}</Text>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>
            <Text style={[styles.amountText, { color: item.amount >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                {item.amount >= 0 ? `+${item.amount}` : item.amount}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color="#333" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Point History</Text>
                <View style={{ width: 24 }} />
            </View>

            {history.length > 0 ? (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listPadding}
                />
            ) : (
                <View style={styles.emptyState}>
                    <History size={48} color="#CCC" />
                    <Text style={styles.emptyText}>{loading ? "Loading..." : "No history yet"}</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        height: 60,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#636E72',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#95A5A6',
        marginTop: 8,
    },
    listPadding: { padding: 20 },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sourceText: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
    dateText: { fontSize: 12, color: '#95A5A6' },
    amountText: { fontSize: 18, fontWeight: 'bold' }
});