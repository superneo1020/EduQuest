import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl, Dimensions, Image, Platform,
    SafeAreaView, StatusBar
} from 'react-native';
import axios from 'axios';
import { ShoppingBag, Coins, Package, CheckCircle2, AlertCircle, Star, Sparkles, Gift } from 'lucide-react-native';
import { getApiBaseUrl } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';
import AvatarIconRenderer from '@/components/AvatarIconRenderer';
import { BackgroundIcons } from '@/app/Profile/BackgroundIcons';
import { BadgeIcons } from '@/app/Profile/BadgeIcons';
// Import all item images
// Create image mapping for dynamic loading with proper types

// Helper functions to render icons properly
const renderBackgroundIcon = (iconName: string, size: number) => {
    const BackgroundComponent = (BackgroundIcons as any)[iconName] || BackgroundIcons.default;
    return <BackgroundComponent size={size} />;
};

const renderBadgeIcon = (iconName: string, size: number) => {
    const BadgeComponent = (BadgeIcons as any)[iconName] || BadgeIcons.default;
    return <BadgeComponent size={size} color="#FFF" />;
};

const { width } = Dimensions.get('window');
// 物品類型定義
const ITEM_TYPES = ['ALL', 'AVATAR', 'BACKGROUND', 'BADGE'];

// 狀態中添加篩選器


// 輔助函數：根據物品類型返回顏色
const getItemColor = (type: string) => {
    switch (type?.toUpperCase()) {
        case 'AVATAR': return '#FF6B6B';
        case 'BACKGROUND': return '#4ECDC4';
        case 'BADGE': return '#FFD93D';
        default: return '#A8E6CF';
    }
};

export default function ShopScreen() {
    const { token } = useAuth();
    const [userPoints, setUserPoints] = useState<number>(0);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [buyingId, setBuyingId] = useState<number | null>(null);

    const [selectedType, setSelectedType] = useState<string>('ALL');

    // 保持原有的數據獲取邏輯
    const fetchData = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const authHeader = { Authorization: `Bearer ${token.trim()}` };

            const [pointsRes, itemsRes] = await Promise.all([
                axios.get(`${getApiBaseUrl()}/api/user/point`, { headers: authHeader }),
                axios.get(`${getApiBaseUrl()}/api/item/find`, {
                    params: {
                        page: 0,
                        size: 50,
                        type: selectedType === 'ALL' ? undefined : selectedType // 添加類型篩選
                    },
                    headers: authHeader
                })
            ]);

            if (pointsRes.data !== undefined) {
                setUserPoints(pointsRes.data);
            }

            setItems(itemsRes.data.content || []);

        } catch (error: any) {
            console.error("Shop Data Fetch Error:", error.response?.status);
            if (error.response?.status === 401) {
                Alert.alert("認證逾時", "請嘗試重新登入以刷新權限。");
            }
        } finally {
            setLoading(false);
        }
    }, [token, selectedType]); // 添加 selectedType 到依賴

    // 保持原有的購買邏輯
    const handlePurchase = async (item: any) => {
        if (!token) {
            Alert.alert("請先登入", "需要登入才能兌換道具。");
            return;
        }

        if (userPoints < item.price) {
             Alert.alert("Insufficient points", `need ${item.price} points to redeem this item!`);
            return;
        }

        try {
            setBuyingId(item.id);

            // Token validation (保持原有邏輯)
            try {
                await axios.get(`${getApiBaseUrl()}/api/user/point`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (tokenTestError: any) {
                if (tokenTestError.response?.status === 401) {
                    throw new Error("Token expired or invalid");
                }
                throw tokenTestError;
            }

            const cleanToken = token!.trim();
            const authHeader = { Authorization: `Bearer ${cleanToken}` };

            let response;
            try {
                response = await axios.post(
                    `${getApiBaseUrl()}/api/user/item`,
                    { itemName: item.name },
                    {
                        headers: authHeader,
                        timeout: 10000
                    }
                );
            } catch (postError: any) {
                if (postError.response?.status === 401) {
                    const retryTokenTest = await axios.get(`${getApiBaseUrl()}/api/user/point`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    response = await axios.post(
                        `${getApiBaseUrl()}/api/user/item`,
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

            const successMsg = `Successful redemption ${item.name}！`;
            Platform.OS === 'web' ? alert(successMsg) : Alert.alert("success", successMsg);

            fetchData();
        } catch (error: any) {
            console.error("Purchase Error:", error);
            Alert.alert("Purchase failed", error.response?.data?.message || "Please try again later.");
        } finally {
            setBuyingId(null);
        }
    };

    
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData().finally(() => setRefreshing(false));
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 可愛的頂部標題區 */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <ShoppingBag size={24} color="#FFF" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Item Shop</Text>
                        <Text style={styles.headerSubtitle}>Redeem exquisite items with your points!</Text>
                    </View>
                </View>

                {/* 積分顯示 - 更有趣的設計 */}
                <View style={styles.pointsCard}>
                    <View style={styles.pointsIconContainer}>
                        <Coins size={22} color="#FFF" />
                    </View>
                    <View style={styles.pointsInfo}>
                        <Text style={styles.pointsValue}>{userPoints}</Text>
                        <Text style={styles.pointsLabel}>My points</Text>
                    </View>
                    <View style={styles.pointsDecoration}>
                        <Sparkles size={16} color="#FFD700" />
                    </View>
                </View>
            </View>

            {/* 物品類型篩選器 */}
            <View style={styles.filterSection}>
                <View style={styles.filterHeader}>
                    <Package size={20} color="#4CAF50" />
                    <Text style={styles.filterTitle}>Item type</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {ITEM_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterChip,
                                selectedType === type && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedType(type)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedType === type && styles.filterChipTextActive
                            ]}>
                                {type === 'ALL' ? 'All' :
                                    type === 'AVATAR' ? 'Avatar' :
                                        type === 'BACKGROUND' ? 'Background' : 'Badge'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                }
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 商品分類標題 */}
                <View style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                        <Gift size={20} color="#4CAF50" />
                        <Text style={styles.categoryTitle}>Selected Props</Text>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.badgeText}>{items.length}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.itemsGrid}>
                    {items.map((item) => {
                        const isBuying = buyingId === item.id;
                        const canAfford = userPoints >= item.price;
                        const itemType = item.type || 'AVATAR';
                        const itemColor = getItemColor(itemType);

                        return (
                            <View key={item.id} style={[
                                styles.itemCard,
                                !canAfford && styles.itemCardDisabled
                            ]}>
                                {/* 可愛的物品圖標 */}
                                <View style={[
                                    styles.itemIconContainer,
                                    { backgroundColor: itemColor }
                                ]}>
                                    {item.type === 'AVATAR' ? (
                                        <AvatarIconRenderer 
                                            iconName={item.icon} 
                                            size={50} 
                                            color="#FFF" 
                                        />
                                    ) : item.type === 'BACKGROUND' ? renderBackgroundIcon(item.icon, 50)
                                    : item.type === 'BADGE' ? renderBadgeIcon(item.icon, 40)
                                    : item.icon ? (
                                        <>
                                            {console.log('Debug - Item:', item.name, 'Type:', item.type, 'Icon:', item.icon)}
                                            <Package size={32} color="#FFF" strokeWidth={2} />
                                        </>
                                    ) : (
                                        <Package size={32} color="#FFF" strokeWidth={2} />
                                    )}
                                    {item.price > 100 && (
                                        <View style={styles.rareBadge}>
                                            <Star size={10} color="#FFF" fill="#FFF" />
                                        </View>
                                    )}
                                </View>

                                {/* 物品信息 */}
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description || "Super cool props!"}</Text>
                                </View>

                                {/* 價格和購買按鈕 */}
                                <View style={styles.itemBottom}>
                                    <View style={styles.priceContainer}>
                                        <Coins size={16} color={canAfford ? "#F1C40F" : "#95A5A6"} />
                                        <Text style={[
                                            styles.priceText,
                                            !canAfford && styles.priceTextDisabled
                                        ]}>{item.price}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.buyButton,
                                            canAfford ? styles.buyButtonEnabled : styles.buyButtonDisabled,
                                            isBuying && styles.buyButtonLoading
                                        ]}
                                        onPress={() => handlePurchase(item)}
                                        disabled={isBuying}
                                        activeOpacity={0.8}
                                    >
                                        {isBuying ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <View style={styles.buyButtonContent}>
                                                <Text style={[
                                                    styles.buyButtonText,
                                                    !canAfford && styles.buyButtonTextDisabled
                                                ]}>
                                                    {canAfford ? "exchange" : "Insufficient points"}
                                                </Text>
                                                {canAfford && <Sparkles size={12} color="#FFF" />}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F9F0' }, // 淺綠色背景，更有親和力
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header 設計
    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    logoContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#4CAF50',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },

    // 積分卡片設計
    pointsCard: {
        flexDirection: 'row',
        backgroundColor: '#667EEA',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    pointsIconContainer: {
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pointsInfo: {
        flex: 1,
    },
    pointsValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
    },
    pointsLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 1,
    },
    pointsDecoration: {
        marginLeft: 8,
    },

    // 分類區域
    categorySection: {
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    categoryTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginLeft: 10,
    },
    categoryBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFF',
    },
    // 篩選器樣式
    filterSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        marginVertical: 10,
        padding: 15,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginLeft: 8,
    },
    filterScroll: {
        flexGrow: 0,
    },
    filterScrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 20,
    },
    filterChip: {
        backgroundColor: '#F1F3F4',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterChipActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636E72',
    },
    filterChipTextActive: {
        color: '#FFF',
    },

    // 商品網格
    scrollContent: { padding: 12 },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // 改為向左對齊，靠卡片的 margin 自動撐開中間間距
        paddingHorizontal: 4, // 稍微給一點側邊緩衝
    },
    itemCard: {
        backgroundColor: '#FFF',
        width: (width - 40) / 2, // 兩列佈局
        borderRadius: 20,         // 稍微縮小圓角
        padding: 12,
        marginBottom: 12,         // 縮小底部間距
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1.5,
        borderColor: '#E8F5E9',
    },
    itemCardDisabled: {
        opacity: 0.6,
        borderColor: '#E0E0E0',
    },

    // 物品圖標
    itemIconContainer: {
        width: 80,  // 增加到 80
        height: 80, // 增加到 80
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
    },
    rareBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 16, // 從20減少到16
        height: 16, // 從20減少到16
        backgroundColor: '#FFD700',
        borderRadius: 8, // 從10減少到8
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1, // 從2減少到1
        borderColor: '#FFF',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    // 物品信息
    itemInfo: {
        marginBottom: 8,
    },
    itemName: {
        fontSize: 18, // 字體放大到 18
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 6,
        textAlign: 'center',
    },
    itemDesc: {
        fontSize: 14, // 說明文字放大到 14
        color: '#636E72',
        textAlign: 'center',
        lineHeight: 18,
        height: 40, // 給予足夠高度顯示兩行說明
        marginBottom: 12,
    },

    // 底部區域
    itemBottom: {
        alignItems: 'center',
        width: '100%',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    priceText: {
        fontSize: 20, // 從16減少到14
        fontWeight: '900',
        color: '#F1C40F',
        marginLeft: 6, // 從4減少到2
    },
    priceTextDisabled: {
        color: '#95A5A6',
    },

    // 購買按鈕
    buyButton: {
        width: '100%',
        paddingVertical: 14, // 從10減少到6
        borderRadius: 18, // 從16減少到8
        alignItems: 'center',
        elevation: 4,
    },
    buyButtonEnabled: {
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buyButtonDisabled: {
        backgroundColor: '#BDC3C7',
        elevation: 0,
    },
    buyButtonLoading: {
        opacity: 0.7,
    },
    buyButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyButtonText: {
        fontSize: 16, // 從14減少到11
        fontWeight: '800',
        color: '#FFF',
    },
    buyButtonTextDisabled: {
        color: 'rgba(255,255,255,0.7)',
    },

    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#666',
    },
    emptyContainer: { width: '100%', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#95A5A6', fontSize: 16 }
});