import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
    StatusBar, Dimensions, ActivityIndicator, Modal, Platform
} from 'react-native';
import {
    Backpack, Star, Heart, Shield, Zap, Gift, Crown, Sword,
    Gem, Cookie, Candy, Trophy, Gamepad2, ArrowLeft, Info
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import AvatarIconRenderer from '@/components/AvatarIconRenderer';

const { width, height } = Dimensions.get('window');

export default function InventoryScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [userItems, setUserItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [showItemDetail, setShowItemDetail] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<any>(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        fetchUserItems();
    }, []);

    const fetchUserItems = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // 後端返回的資料結構是 UserItemDto 數組
            // 每個元素包含 id, name, type, icon, description, createdAt
            setUserItems(response.data || []);
            console.log('Fetched items:', response.data);
        } catch (error) {
            console.log("Items info not available", error);
        } finally {
            setLoading(false);
        }
    };

    // 獲取物品的實際資料（處理可能的巢狀結構）
    const getItemData = (item: any) => {
        // 如果 item 有 item 屬性（巢狀結構），使用 item.item
        // 否則直接使用 item
        const itemData = item.item || item;
        return {
            id: itemData?.id,
            name: itemData?.name || 'Unknown Item',
            type: itemData?.type || 'AVATAR',
            icon: itemData?.icon || 'default',
            description: itemData?.description || 'No description available',
            createdAt: item.createdAt || itemData?.createdAt,
            quantity: item.quantity || 1
        };
    };

    const getItemIcon = (itemType: string, itemIcon?: string) => {
        // 減小圖標大小，讓它不填滿整個容器
        const iconProps = { size: 28, color: '#FFF' };  // 從 32 改為 28

        // 如果是頭像類型，使用 AvatarIconRenderer
        if (itemType === 'AVATAR') {
            return (
                <AvatarIconRenderer
                    iconName={itemIcon || 'default'}
                    size={28}  // 從 32 改為 28
                    color="#FFF"
                />
            );
        }

        // 根據物品類型顯示不同圖標
        const typeMap: { [key: string]: any } = {
            'TROPHY': <Trophy {...iconProps} color="#FFD700" />,
            'STAR': <Star {...iconProps} color="#FFD700" />,
            'HEART': <Heart {...iconProps} color="#FF69B4" />,
            'SHIELD': <Shield {...iconProps} color="#4169E1" />,
            'POWER': <Zap {...iconProps} color="#FF4500" />,
            'GIFT': <Gift {...iconProps} color="#FF69B4" />,
            'CROWN': <Crown {...iconProps} color="#FFD700" />,
            'SWORD': <Sword {...iconProps} color="#C0C0C0" />,
            'GEM': <Gem {...iconProps} color="#9370DB" />,
            'FOOD': <Cookie {...iconProps} color="#8B4513" />,
            'CANDY': <Candy {...iconProps} color="#FF69B4" />,
            'BACKGROUND': <Gamepad2 {...iconProps} color="#4CAF50" />,
            'BADGE': <Trophy {...iconProps} color="#FFD700" />,
        };

        return typeMap[itemType] || <Gamepad2 {...iconProps} color="#4CAF50" />;
    };

    const getItemBackground = (itemType: string) => {
        const bgMap: { [key: string]: string } = {
            'AVATAR': '#E8F5E9',
            'TROPHY': '#FFF9E6',
            'STAR': '#FFF9E6',
            'HEART': '#FFE6F0',
            'SHIELD': '#E6F3FF',
            'POWER': '#FFE6E6',
            'GIFT': '#FFE6F0',
            'CROWN': '#FFF9E6',
            'SWORD': '#F5F5F5',
            'GEM': '#F3E6FF',
            'FOOD': '#F5E6D3',
            'CANDY': '#FFE6F0',
            'BACKGROUND': '#E8F5E9',
            'BADGE': '#FFF9E6',
        };
        return bgMap[itemType] || '#E8F5E9';
    };

    const getItemRarity = (itemType: string) => {
        const rarities: { [key: string]: { color: string, label: string } } = {
            'AVATAR': { color: '#4CAF50', label: 'COMMON' },
            'TROPHY': { color: '#FFD700', label: 'LEGENDARY' },
            'CROWN': { color: '#FFD700', label: 'LEGENDARY' },
            'GEM': { color: '#9370DB', label: 'EPIC' },
            'STAR': { color: '#4169E1', label: 'RARE' },
            'SHIELD': { color: '#4169E1', label: 'RARE' },
            'SWORD': { color: '#4169E1', label: 'RARE' },
            'HEART': { color: '#FF69B4', label: 'SPECIAL' },
            'POWER': { color: '#FF4500', label: 'SPECIAL' },
            'GIFT': { color: '#FF69B4', label: 'SPECIAL' },
            'BACKGROUND': { color: '#4CAF50', label: 'COMMON' },
            'BADGE': { color: '#FF9800', label: 'RARE' },
        };

        return rarities[itemType] || { color: '#4CAF50', label: 'COMMON' };
    };

    const renderInventoryGrid = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading your backpack...</Text>
                </View>
            );
        }

        if (!Array.isArray(userItems) || userItems.length === 0) {
            return (
                <View style={styles.emptyInventory}>
                    <Backpack size={80} color="#C0C0C0" />
                    <Text style={styles.emptyTitle}>Empty Backpack!</Text>
                    <Text style={styles.emptySubtitle}>Complete missions to collect items</Text>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => router.push('/')}
                    >
                        <Text style={styles.playButtonText}>Start Playing</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.inventoryGrid}>
                {(Array.isArray(userItems) ? userItems : []).map((item: any, index: number) => {
                    const itemData = getItemData(item);
                    const rarity = getItemRarity(itemData.type);
                    const backgroundColor = getItemBackground(itemData.type);

                    return (
                        <TouchableOpacity
                            key={itemData.id || index}
                            style={styles.itemSlot}
                            onPress={() => {
                                if (Platform.OS !== 'web') {
                                    setSelectedItem(itemData);
                                    setShowItemDetail(true);
                                }
                            }}
                            onHoverIn={(e) => {
                                if (Platform.OS === 'web') {
                                    setHoveredItem(itemData);
                                    const node = e.target;
                                    if (node && node.getBoundingClientRect) {
                                        const rect = node.getBoundingClientRect();
                                        setHoverPosition({
                                            x: rect.left + rect.width / 2,
                                            y: rect.top - 10
                                        });
                                    }
                                }
                            }}
                            onHoverOut={() => {
                                if (Platform.OS === 'web') {
                                    setHoveredItem(null);
                                }
                            }}
                        >
                            <View style={[styles.itemBackground, { backgroundColor }]}>
                                <View style={styles.itemIconContainer}>
                                    {getItemIcon(itemData.type, itemData.icon)}
                                </View>
                                <View style={[styles.rarityBadge, { backgroundColor: rarity.color }]}>
                                    <Text style={styles.rarityText}>{rarity.label}</Text>
                                </View>
                            </View>
                            <Text style={styles.itemName} numberOfLines={1}>{itemData.name}</Text>
                            {itemData.quantity > 1 && (
                                <View style={styles.quantityBadge}>
                                    <Text style={styles.quantityText}>x{itemData.quantity}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

                {/* Empty slots for game-like appearance */}
                {[...Array(Math.max(0, 12 - (Array.isArray(userItems) ? userItems.length : 0)))].map((_, index) => (
                    <View key={`empty-${index}`} style={styles.emptySlot}>
                        <View style={styles.emptySlotInner} />
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header with backpack design */}
            <View style={styles.headerContainer}>
                <View style={styles.backpackHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Backpack size={32} color="#FFF" />
                        <Text style={styles.headerTitle}>My Backpack</Text>
                    </View>
                    <View style={styles.itemCount}>
                        <Text style={styles.itemCountText}>{Array.isArray(userItems) ? userItems.length : 0}</Text>
                    </View>
                </View>
            </View>

            {/* Inventory content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.inventoryContainer}>
                    <View style={styles.inventoryHeader}>
                        <Text style={styles.inventoryTitle}>Your Collection</Text>
                        <Text style={styles.inventorySubtitle}>Tap items to see details</Text>
                    </View>

                    {renderInventoryGrid()}
                </View>
            </ScrollView>

            {/* Hover Tooltip for Desktop/Web */}
            {Platform.OS === 'web' && hoveredItem && (
                <View style={[
                    styles.hoverTooltip,
                    {
                        left: hoverPosition.x - 100,
                        top: hoverPosition.y - 150,
                    }
                ]}>
                    <View style={[styles.tooltipItemBackground, { backgroundColor: getItemBackground(hoveredItem.type) }]}>
                        <View style={styles.tooltipIconContainer}>
                            {getItemIcon(hoveredItem.type, hoveredItem.icon)}
                        </View>
                    </View>
                    <Text style={styles.tooltipItemName}>{hoveredItem.name}</Text>
                    <View style={[styles.tooltipRarityBadge, { backgroundColor: getItemRarity(hoveredItem.type).color }]}>
                        <Text style={styles.tooltipRarityText}>{getItemRarity(hoveredItem.type).label}</Text>
                    </View>
                    {hoveredItem.description && hoveredItem.description !== 'No description available' && (
                        <Text style={styles.tooltipDescription} numberOfLines={3}>
                            {hoveredItem.description}
                        </Text>
                    )}
                    {hoveredItem.quantity > 1 && (
                        <Text style={styles.tooltipQuantity}>Quantity: {hoveredItem.quantity}</Text>
                    )}
                    <View style={styles.tooltipArrow} />
                </View>
            )}

            {/* Item Detail Modal */}
            <Modal
                visible={showItemDetail}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowItemDetail(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.itemDetailModal}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowItemDetail(false)}
                        >
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>

                        {selectedItem && (
                            <View style={styles.itemDetailContent}>
                                <View style={[styles.detailItemBackground, { backgroundColor: getItemBackground(selectedItem.type) }]}>
                                    <View style={styles.detailIconContainer}>
                                        {getItemIcon(selectedItem.type, selectedItem.icon)}
                                    </View>
                                </View>

                                <Text style={styles.detailItemName}>{selectedItem.name}</Text>
                                <View style={[styles.detailRarityBadge, { backgroundColor: getItemRarity(selectedItem.type).color }]}>
                                    <Text style={styles.detailRarityText}>{getItemRarity(selectedItem.type).label}</Text>
                                </View>

                                {selectedItem.description && selectedItem.description !== 'No description available' && (
                                    <View style={styles.descriptionContainer}>
                                        <Info size={16} color="#636E72" />
                                        <Text style={styles.detailDescription}>{selectedItem.description}</Text>
                                    </View>
                                )}

                                {selectedItem.quantity > 1 && (
                                    <View style={styles.detailQuantity}>
                                        <Text style={styles.detailQuantityText}>Quantity: {selectedItem.quantity}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    inventoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
    },
    itemSlot: {
        width: (width - 40) / 3,  // 稍微增大寬度
        marginBottom: 20,
        alignItems: 'center',
        position: 'relative',
    },
    itemBackground: {
        width: 90,  // 固定寬度，不依賴百分比
        height: 90, // 固定高度
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
    itemIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    rarityBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
    },
    rarityText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#FFF',
    },
    itemName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3436',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 90,
    },
    quantityBadge: {
        position: 'absolute',
        bottom: -8,
        right: -5,
        backgroundColor: '#FF4757',
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        paddingHorizontal: 5,
    },
    quantityText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
    },
    emptySlot: {
        width: (width - 40) / 3,
        height: 110,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptySlotInner: {
        width: 90,
        height: 90,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 修改圖標大小

    container: {
        flex: 1,
        backgroundColor: '#87CEEB',
    },
    headerContainer: {
        backgroundColor: '#4CAF50',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 20,
    },
    backpackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginLeft: 10,
    },
    itemCount: {
        backgroundColor: '#FFD700',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    itemCountText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4CAF50',
    },
    content: {
        flex: 1,
    },
    inventoryContainer: {
        padding: 20,
    },
    inventoryHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    inventoryTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 5,
    },
    inventorySubtitle: {
        fontSize: 16,
        color: '#636E72',
        fontWeight: '600',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        fontSize: 16,
        color: '#636E72',
        fontWeight: '600',
        marginTop: 15,
    },
    emptyInventory: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#636E72',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#A0A0A0',
        marginTop: 10,
        textAlign: 'center',
    },
    playButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 20,
    },
    playButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemDetailModal: {
        backgroundColor: '#FFF',
        borderRadius: 30,
        padding: 30,
        width: '85%',
        maxWidth: 350,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: '#4CAF50',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemDetailContent: {
        alignItems: 'center',
        width: '100%',
    },
    detailItemBackground: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 4,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    detailIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    detailItemName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 10,
        textAlign: 'center',
    },
    detailRarityBadge: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        marginBottom: 15,
    },
    detailRarityText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFF',
    },
    descriptionContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 15,
        width: '100%',
        marginBottom: 15,
    },
    detailDescription: {
        fontSize: 14,
        color: '#636E72',
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
    },
    detailQuantity: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
    },
    detailQuantityText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4CAF50',
    },
    hoverTooltip: {
        position: 'absolute',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        width: 200,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        zIndex: 1000,
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    // 修改 tooltip 相關樣式
    tooltipItemBackground: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    tooltipIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipItemName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 5,
        textAlign: 'center',
    },
    tooltipRarityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        marginBottom: 8,
    },
    tooltipRarityText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
    },
    tooltipDescription: {
        fontSize: 11,
        color: '#636E72',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 14,
    },
    tooltipQuantity: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4CAF50',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tooltipArrow: {
        position: 'absolute',
        bottom: -8,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#4CAF50',
    },
});