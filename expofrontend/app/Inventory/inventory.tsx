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
            const response = await axios.get(`${getApiBaseUrl()}/api/user/item/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserItems(response.data || []);
        } catch (error) {
            console.log("Items info not available");
        } finally {
            setLoading(false);
        }
    };

    const getItemIcon = (itemType: string) => {
        const iconProps = { size: 32, color: '#FFF' };
        
        switch (itemType?.toLowerCase()) {
            case 'trophy': return <Trophy {...iconProps} color="#FFD700" />;
            case 'star': return <Star {...iconProps} color="#FFD700" />;
            case 'heart': return <Heart {...iconProps} color="#FF69B4" />;
            case 'shield': return <Shield {...iconProps} color="#4169E1" />;
            case 'power': return <Zap {...iconProps} color="#FF4500" />;
            case 'gift': return <Gift {...iconProps} color="#FF69B4" />;
            case 'crown': return <Crown {...iconProps} color="#FFD700" />;
            case 'sword': return <Sword {...iconProps} color="#C0C0C0" />;
            case 'gem': return <Gem {...iconProps} color="#9370DB" />;
            case 'food': return <Cookie {...iconProps} color="#8B4513" />;
            case 'candy': return <Candy {...iconProps} color="#FF69B4" />;
            default: return <Gamepad2 {...iconProps} color="#4CAF50" />;
        }
    };

    const getItemBackground = (itemType: string) => {
        switch (itemType?.toLowerCase()) {
            case 'trophy': return '#FFF9E6';
            case 'star': return '#FFF9E6';
            case 'heart': return '#FFE6F0';
            case 'shield': return '#E6F3FF';
            case 'power': return '#FFE6E6';
            case 'gift': return '#FFE6F0';
            case 'crown': return '#FFF9E6';
            case 'sword': return '#F5F5F5';
            case 'gem': return '#F3E6FF';
            case 'food': return '#F5E6D3';
            case 'candy': return '#FFE6F0';
            default: return '#E8F5E9';
        }
    };

    const getItemRarity = (itemType: string) => {
        const rarities: { [key: string]: { color: string, label: string } } = {
            'trophy': { color: '#FFD700', label: 'LEGENDARY' },
            'crown': { color: '#FFD700', label: 'LEGENDARY' },
            'gem': { color: '#9370DB', label: 'EPIC' },
            'star': { color: '#4169E1', label: 'RARE' },
            'shield': { color: '#4169E1', label: 'RARE' },
            'sword': { color: '#4169E1', label: 'RARE' },
            'heart': { color: '#FF69B4', label: 'SPECIAL' },
            'power': { color: '#FF4500', label: 'SPECIAL' },
            'gift': { color: '#FF69B4', label: 'SPECIAL' },
        };
        
        return rarities[itemType?.toLowerCase()] || { color: '#4CAF50', label: 'COMMON' };
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

        if (userItems.length === 0) {
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
                {userItems.map((item: any, index: number) => {
                    const rarity = getItemRarity(item.type);
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.itemSlot}
                            onPress={() => {
                                // Only show modal on mobile, not on web/desktop
                                if (Platform.OS !== 'web') {
                                    setSelectedItem(item);
                                    setShowItemDetail(true);
                                }
                            }}
                            onHoverIn={(e) => {
                                if (Platform.OS === 'web') {
                                    setHoveredItem(item);
                                    // Get position for tooltip
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
                            <View style={[styles.itemBackground, { backgroundColor: getItemBackground(item.item?.type || 'AVATAR') }]}>
                                <View style={styles.itemIconContainer}>
                                    {item.item?.type === 'AVATAR' ? (
                                        <AvatarIconRenderer 
                                            iconName={item.item?.icon || 'default'} 
                                            size={32} 
                                            color="#FFF" 
                                        />
                                    ) : (
                                        getItemIcon(item.item?.type || 'AVATAR')
                                    )}
                                </View>
                                <View style={[styles.rarityBadge, { backgroundColor: getItemRarity(item.item?.type || 'AVATAR').color }]}>
                                    <Text style={styles.rarityText}>{getItemRarity(item.item?.type || 'AVATAR').label}</Text>
                                </View>
                            </View>
                            <Text style={styles.itemName} numberOfLines={1}>{item.item?.name || 'Unknown'}</Text>
                            {item.quantity && item.quantity > 1 && (
                                <View style={styles.quantityBadge}>
                                    <Text style={styles.quantityText}>x{item.quantity}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
                
                {/* Empty slots for game-like appearance */}
                {[...Array(Math.max(0, 12 - userItems.length))].map((_, index) => (
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
                        <Text style={styles.itemCountText}>{userItems.length}</Text>
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
                        left: hoverPosition.x - 100, // Center the tooltip
                        top: hoverPosition.y - 150, // Position above the item
                    }
                ]}>
                    <View style={[styles.tooltipItemBackground, { backgroundColor: getItemBackground(hoveredItem.type) }]}>
                        <View style={styles.tooltipIconContainer}>
                            {getItemIcon(hoveredItem.type)}
                        </View>
                    </View>
                    <Text style={styles.tooltipItemName}>{hoveredItem.name || 'Unknown Item'}</Text>
                    <View style={[styles.tooltipRarityBadge, { backgroundColor: getItemRarity(hoveredItem.type).color }]}>
                        <Text style={styles.tooltipRarityText}>{getItemRarity(hoveredItem.type).label}</Text>
                    </View>
                    {hoveredItem.description && (
                        <Text style={styles.tooltipDescription} numberOfLines={3}>
                            {hoveredItem.description}
                        </Text>
                    )}
                    {hoveredItem.quantity && (
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
                                        {getItemIcon(selectedItem.type)}
                                    </View>
                                </View>
                                
                                <Text style={styles.detailItemName}>{selectedItem.name || 'Unknown Item'}</Text>
                                <View style={[styles.detailRarityBadge, { backgroundColor: getItemRarity(selectedItem.type).color }]}>
                                    <Text style={styles.detailRarityText}>{getItemRarity(selectedItem.type).label}</Text>
                                </View>
                                
                                {selectedItem.description && (
                                    <View style={styles.descriptionContainer}>
                                        <Info size={16} color="#636E72" />
                                        <Text style={styles.detailDescription}>{selectedItem.description}</Text>
                                    </View>
                                )}
                                
                                {selectedItem.quantity && (
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
    container: {
        flex: 1,
        backgroundColor: '#87CEEB', // Sky blue background
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
    inventoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    itemSlot: {
        width: (width - 60) / 3,
        height: (width - 60) / 3,
        marginBottom: 15,
        position: 'relative',
    },
    itemBackground: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    itemIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    rarityBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
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
        marginTop: 5,
    },
    quantityBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#FF4757',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    quantityText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
    },
    emptySlot: {
        width: (width - 60) / 3,
        height: (width - 60) / 3,
        marginBottom: 15,
    },
    emptySlotInner: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.1)',
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
        width: 100,
        height: 100,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
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
    tooltipItemBackground: {
        width: 60,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
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
