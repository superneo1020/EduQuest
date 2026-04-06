import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl, Dimensions, Image, Platform
} from 'react-native';
import axios from 'axios';
import { ShoppingBag, Coins, Package, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { getApiBaseUrl } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';

const { width } = Dimensions.get('window');

export default function ShopScreen() {
    const { token } = useAuth();
    const [userPoints, setUserPoints] = useState<number>(0);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [buyingId, setBuyingId] = useState<number | null>(null);

    // 1. 獲取數據 (參考 Profile 做法以避開 401)
    const fetchData = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const authHeader = { Authorization: `Bearer ${token.trim()}` };

            // 同步獲取：個人資料(含積分) + 商店商品
            const [pointsRes, itemsRes] = await Promise.all([
                axios.get(`${getApiBaseUrl()}/api/user/point`, { headers: authHeader }),
                axios.get(`${getApiBaseUrl()}/api/item/find`, {
                    params: { page: 0, size: 50 },
                    headers: authHeader
                })
            ]);

            // 設定積分
            if (pointsRes.data !== undefined) {
                setUserPoints(pointsRes.data);
            }

            // 設定商品清單
            setItems(itemsRes.data.content || []);

        } catch (error: any) {
            console.error("Shop Data Fetch Error:", error.response?.status);
            if (error.response?.status === 401) {
                Alert.alert("認證逾時", "請嘗試重新登入以刷新權限。");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 2. 購買邏輯 (利用資料庫 Trigger 自動扣分)
    const handlePurchase = async (item: any) => {
        if (!token) {
            const errorMsg = "請先登入後再購買";
            Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("需要登入", errorMsg);
            return;
        }
        
        console.log("🚀 Buy item:", item.name);
        const testRes = await axios.get(`${getApiBaseUrl()}/api/user/point`, {
            headers: { Authorization: `Bearer ${token}` }
        });


        // 1. 基本檢查：積分不足直接阻斷
        if (userPoints < item.price) {
            const msg = `積分不足！需要 ${item.price}，你只有 ${userPoints}`;
            Platform.OS === 'web' ? alert(msg) : Alert.alert("提示", msg);
            return;
        }

        // 2. 開始執行購買流程
        try {
            setBuyingId(item.id);

            console.log("Token being sent:", token ? token.substring(0, 20) + "..." : "No token");
            console.log("Item being purchased:", item.name);

            // First test if token is valid by calling a simple authenticated endpoint
            try {
                console.log("🔍 Testing token validity...");
                const tokenTest = await axios.get(`${getApiBaseUrl()}/api/user/point`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("✅ Token validation successful, current points:", tokenTest.data);
            } catch (tokenTestError: any) {
                console.log("❌ Token validation failed:", tokenTestError.response?.status);
                if (tokenTestError.response?.status === 401) {
                    console.log("Token is expired or invalid");
                    throw new Error("Token expired or invalid");
                }
                throw tokenTestError; // Re-throw other errors
            }

            // Use the same authHeader pattern that works for GET requests
            const cleanToken = token!.trim();
            const authHeader = { Authorization: `Bearer ${cleanToken}` };
            console.log("🔧 Using authHeader:", authHeader.Authorization.substring(0, 30) + "...");
            
            let response;
            try {
                response = await axios.post(
                    `${getApiBaseUrl()}/api/user/item/`,
                    { itemName: item.name },
                    {
                        headers: authHeader,
                        timeout: 10000
                    }
                );
            } catch (postError: any) {
                if (postError.response?.status === 401) {
                    console.log("🔄 POST failed with 401, retrying with fresh token validation...");
                    // Retry once after re-validating token
                    const retryTokenTest = await axios.get(`${getApiBaseUrl()}/api/user/point`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log("🔄 Retry token validation successful:", retryTokenTest.data);
                    
                    response = await axios.post(
                        `${getApiBaseUrl()}/api/user/item/`,
                        { itemName: item.name },
                        {
                            headers: authHeader,
                            timeout: 10000
                        }
                    );
                } else {
                    throw postError;
                }
            }

            console.log("✅ 購買成功響應:", response.data);

            // 成功後的提示
            const successMsg = `成功兌換 ${item.name}！`;
            Platform.OS === 'web' ? alert(successMsg) : Alert.alert("成功", successMsg);

            // 3. 刷新數據 (這會觸發 Profile 接口拿到 Trigger 扣除後的積分)
            fetchData();

        } catch (error: any) {
            console.error("❌ 購買失敗詳情:", error.response?.data || error.message);
            
            // Check if it's a 401 error - token might be expired
            if (error.response?.status === 401) {
                const errorMsg = "登入已過期，請重新登入後再試";
                Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("需要重新登入", errorMsg);
                
                // Optionally clear the invalid token and redirect to login
                // You might want to use navigation to go to login screen
                return;
            }

            let errorMsg = "購買失敗，請稍後再試";
            if (error.response?.status === 500) {
                errorMsg = "伺服器錯誤 (500)：請檢查後端日誌，可能是餘額扣除失敗或重複購買。";
            }

            Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("錯誤", errorMsg);
        } finally {
            setBuyingId(null);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}><ActivityIndicator size="large" color="#4b6cb7" /></View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 頂部積分欄 */}
            <View style={styles.header}>
                <View style={styles.pointsWrapper}>
                    <Coins size={20} color="#F1C40F" />
                    <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
                    <Text style={styles.pointsLabel}>可用積分</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.sectionHeader}>
                    <ShoppingBag size={22} color="#333" />
                    <Text style={styles.sectionTitle}>道具商城</Text>
                </View>

                <View style={styles.grid}>
                    {items.map((item) => {
                        const isBuying = buyingId === item.id;
                        const canAfford = userPoints >= item.price;

                        return (
                            <View key={item.id} style={styles.card}>
                                <View style={styles.iconContainer}>
                                    <Package size={40} color="#4b6cb7" strokeWidth={1.5} />
                                </View>

                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.itemDesc} numberOfLines={2}>{item.description || "暫無描述"}</Text>

                                <View style={styles.priceTag}>
                                    <Coins size={14} color="#F1C40F" />
                                    <Text style={styles.priceText}>{item.price}</Text>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.buyButton,
                                        (!canAfford || isBuying) && styles.buyButtonDisabled
                                    ]}
                                    onPress={() => handlePurchase(item)} // 確保這裡正確觸發
                                    disabled={isBuying} // 只有正在買的時候禁用，餘額不足依然可以按（進去跳提示）
                                >
                                    {isBuying ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.buyButtonText}>
                                            {canAfford ? "兌換" : "積分不足"}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    pointsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A2A6C',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 15,
        alignSelf: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    pointsValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginLeft: 10 },
    pointsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginLeft: 8, marginTop: 4 },
    scrollContent: { padding: 15 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginLeft: 10, color: '#333' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: {
        backgroundColor: '#FFF',
        width: (width - 45) / 2,
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        alignItems: 'center',
    },
    iconContainer: {
        width: 70,
        height: 70,
        backgroundColor: '#F0F4FF',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 },
    itemDesc: { fontSize: 12, color: '#636E72', textAlign: 'center', height: 32, marginBottom: 10 },
    priceTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    priceText: { marginLeft: 5, fontWeight: '700', color: '#2D3436', fontSize: 16 },
    buyButton: {
        backgroundColor: '#4b6cb7',
        width: '100%',
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
    },
    buyButtonDisabled: { backgroundColor: '#BDC3C7' },
    buyButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    emptyContainer: { width: '100%', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#95A5A6', fontSize: 16 }
});