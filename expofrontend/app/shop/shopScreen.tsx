import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl, Dimensions, Image, Platform,
    SafeAreaView, StatusBar, Modal
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
    const BackgroundComponent = (BackgroundIcons as any)[iconName];
    if (!BackgroundComponent) return null;
    return <BackgroundComponent size={size} />;
};

const renderBadgeIcon = (iconName: string, size: number) => {
    const BadgeComponent = (BadgeIcons as any)[iconName];
    if (!BadgeComponent) return null;
    return <BadgeComponent size={size} color="#FFF" />;
};
const { width } = Dimensions.get('window');
// Item type definitions
const ITEM_TYPES = ['ALL', 'AVATAR', 'BACKGROUND', 'BADGE'];

// State add filter

// Helper function: return color based on item type
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
    const [userItems, setUserItems] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [buyingId, setBuyingId] = useState<number | null>(null);

    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [showOwnedItemModal, setShowOwnedItemModal] = useState(false);
    const [ownedItemName, setOwnedItemName] = useState<string>('');

    // Check if user already owns an item
    const isItemOwned = useCallback((itemName: string) => {
        return userItems.some(userItem =>
            userItem.itemName === itemName || userItem.name === itemName
        );
    }, [userItems]);

    // Keep original data fetching logic
    const fetchData = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const authHeader = { Authorization: `Bearer ${token.trim()}` };

            const [pointsRes, itemsRes, userItemsRes] = await Promise.all([
                axios.get(`${getApiBaseUrl()}/api/user/point`, { headers: authHeader }),
                axios.get(`${getApiBaseUrl()}/api/item/find`, {
                    params: {
                        page: 0,
                        size: 50,
                        type: selectedType === 'ALL' ? undefined : selectedType
                    },
                    headers: authHeader
                }),
                axios.get(`${getApiBaseUrl()}/api/user/item`, { headers: authHeader })
            ]);

// Handle user item data
            const rawUserItems = userItemsRes.data?.items || userItemsRes.data || [];
            setUserItems(Array.isArray(rawUserItems) ? rawUserItems : []);

            if (pointsRes.data !== undefined) {
                setUserPoints(pointsRes.data);
            }

            setItems(itemsRes.data.content || []);

        } catch (error: any) {
            console.error("Shop Data Fetch Error:", error.response?.status);
            if (error.response?.status === 401) {
                Alert.alert("Authentication timeout", "Please try logging in again to refresh permissions.");
            }
        } finally {
            setLoading(false);
        }
    }, [token, selectedType]); // Add selectedType to dependency

    // Keep original purchase logic
    const handlePurchase = async (item: any) => {
        if (!token) {
            Alert.alert("Please login first", "Login required to redeem items.");
            return;
        }

        if (userPoints < item.price) {
            Alert.alert("Insufficient points", `need ${item.price} points to redeem this item!`);
            return;
        }

        // Check if user already owns this item
        if (isItemOwned(item.name)) {
            setOwnedItemName(item.name);
            setShowOwnedItemModal(true);
            return;
        }

        try {
            setBuyingId(item.id);

            // Token validation (keep original logic)
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

            const successMsg = `Successful redemption ${item.name}!`;
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

            {/* Cute top header area */}
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

                {/* Points display - more interesting design */}
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

            {/* Item type filter */}
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
                {/* Product category title */}
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
                        const isOwned = isItemOwned(item.name);
                        const canPurchase = canAfford && !isOwned;

                        return (
                            <View key={item.id} style={[
                                styles.itemCard,
                                (!canAfford || isOwned) && styles.itemCardDisabled
                            ]}>
                                {/* Cute item icon */}
                                {/* Original icon block */}
                                <View style={[styles.itemIconContainer, { backgroundColor: itemColor }]}>
                                    {item.type === 'AVATAR' ? (
                                        <AvatarIconRenderer iconName={item.icon} size={50} color="#FFF" />
                                    ) : item.type === 'BACKGROUND' ? renderBackgroundIcon(item.icon, 50)
                                        : item.type === 'BADGE' ? renderBadgeIcon(item.icon, 40)
                                            : item.icon ? (
                                                // This place originally displayed Package icon, changed to null
                                                null
                                            ) : null}
                                    {/* Rare badge can still be kept */}
                                    {item.price > 100 && (
                                        <View style={styles.rareBadge}>
                                            <Star size={10} color="#FFF" fill="#FFF" />
                                        </View>
                                    )}
                                </View>

                                {/* Item info */}
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description || "Super cool props!"}</Text>
                                </View>

                                {/* Price and purchase button */}
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
                                            canPurchase ? styles.buyButtonEnabled : styles.buyButtonDisabled,
                                            isBuying && styles.buyButtonLoading
                                        ]}
                                        onPress={() => handlePurchase(item)}
                                        disabled={isBuying || isOwned}
                                        activeOpacity={0.8}
                                    >
                                        {isBuying ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <View style={styles.buyButtonContent}>
                                                <Text style={[
                                                    styles.buyButtonText,
                                                    !canPurchase && styles.buyButtonTextDisabled
                                                ]}>
                                                    {isOwned ? "Already Owned" :
                                                        canAfford ? "exchange" : "Insufficient points"}
                                                </Text>
                                                {canPurchase && <Sparkles size={12} color="#FFF" />}
                                                {isOwned && <CheckCircle2 size={12} color="#FFF" />}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Owned Item Confirmation Modal */}
            <Modal
                visible={showOwnedItemModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOwnedItemModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>Already Owned</Text>
                        <Text style={styles.confirmMessage}>You already own "{ownedItemName}". This item cannot be purchased again.</Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.okButton]}
                                onPress={() => setShowOwnedItemModal(false)}
                            >
                                <Text style={styles.okButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F9F0' }, // Light green background, more friendly
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header design
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

    // Points card design
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

    // Category area
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
    // Filter styles
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

    // Product grid
    scrollContent: { padding: 12 },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // Change to left align, let card margin auto create middle spacing
        paddingHorizontal: 4, // Give some side buffer
    },
    itemCard: {
        backgroundColor: '#FFF',
        width: (width - 40) / 2, // Two column layout
        borderRadius: 20,         // Slightly reduce rounded corners
        padding: 12,
        marginBottom: 12,         // Reduce bottom spacing
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

    // Item icon
    itemIconContainer: {
        width: 80,  // Increase to 80
        height: 80, // Increase to 80
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
        width: 16, // Reduce from 20 to 16
        height: 16, // Reduce from 20 to 16
        backgroundColor: '#FFD700',
        borderRadius: 8, // Reduce from 10 to 8
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1, // Reduce from 2 to 1
        borderColor: '#FFF',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    // Item info
    itemInfo: {
        marginBottom: 8,
    },
    itemName: {
        fontSize: 18, // Increase font to 18
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 6,
        textAlign: 'center',
    },
    itemDesc: {
        fontSize: 14, // Increase description text to 14
        color: '#636E72',
        textAlign: 'center',
        lineHeight: 18,
        height: 40, // Give enough height to display two lines of description
        marginBottom: 12,
    },

    // Bottom area
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
        fontSize: 20, // Reduce from 16 to 14
        fontWeight: '900',
        color: '#F1C40F',
        marginLeft: 6, // Reduce from 4 to 2
    },
    priceTextDisabled: {
        color: '#95A5A6',
    },

    // Purchase button
    buyButton: {
        width: '100%',
        paddingVertical: 14, // Reduce from 10 to 6
        borderRadius: 18, // Reduce from 16 to 8
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
        fontSize: 16, // Reduce from 14 to 11
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
    emptyText: { marginTop: 15, color: '#95A5A6', fontSize: 16 },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 12,
    },
    confirmMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    confirmButtons: {
        flexDirection: 'row',
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    okButton: {
        backgroundColor: '#4CAF50',
    },
    okButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
