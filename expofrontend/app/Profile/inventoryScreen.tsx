import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Trophy, Star, Heart, Shield, Zap, Gift, Crown, Sword, Gem, Cookie, Candy, Gamepad2, X } from 'lucide-react-native';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';
import { getApiBaseUrl } from '@/src/api/client';

export default function inventoryScreen() {
    const { token } = useAuth();
    const [myItems, setMyItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [showItemDetail, setShowItemDetail] = useState(false);

    const fetchMyItems = async () => {
        if (!token) return;
        try {
            const response = await axios.get(`${getApiBaseUrl()}/api/user/item/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Items response:', response.data);
            setMyItems(response.data || []);
        } catch (error) {
            console.log("Items info not available", error);
            setMyItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchMyItems(); 
    }, [token]);

    const getItemIcon = (itemType: string) => {
        const iconProps = { size: 24, color: '#FFF' };
        
        switch (itemType?.toLowerCase()) {
            case 'trophy': return <Trophy {...iconProps} color="#FFD700" />;
            case 'star': return <Star {...iconProps} color="#FFA500" />;
            case 'heart': return <Heart {...iconProps} color="#FF69B4" />;
            case 'shield': return <Shield {...iconProps} color="#4169E1" />;
            case 'zap': return <Zap {...iconProps} color="#FFD700" />;
            case 'gift': return <Gift {...iconProps} color="#FF1493" />;
            case 'crown': return <Crown {...iconProps} color="#FFD700" />;
            case 'sword': return <Sword {...iconProps} color="#C0C0C0" />;
            case 'gem': return <Gem {...iconProps} color="#9370DB" />;
            case 'cookie': return <Cookie {...iconProps} color="#D2691E" />;
            case 'candy': return <Candy {...iconProps} color="#FF69B4" />;
            case 'gamepad': return <Gamepad2 {...iconProps} color="#32CD32" />;
            default: return <Star {...iconProps} color="#888" />;
        }
    };

    const getItemColor = (itemType: string) => {
        switch (itemType?.toLowerCase()) {
            case 'trophy': return '#FFD700';
            case 'star': return '#FFA500';
            case 'heart': return '#FF69B4';
            case 'shield': return '#4169E1';
            case 'zap': return '#FFD700';
            case 'gift': return '#FF1493';
            case 'crown': return '#FFD700';
            case 'sword': return '#C0C0C0';
            case 'gem': return '#9370DB';
            case 'cookie': return '#D2691E';
            case 'candy': return '#FF69B4';
            case 'gamepad': return '#32CD32';
            default: return '#888';
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const itemName = item.itemName || item.name || 'Unknown Item';
        const quantity = item.quantity || 1;
        const itemType = item.itemType || item.type || 'unknown';
        
        return (
            <TouchableOpacity 
                style={styles.itemCard}
                onPress={() => {
                    console.log('Item clicked:', item);
                    setSelectedItem(item);
                    setShowItemDetail(true);
                    console.log('Modal should show:', true);
                }}
            >
                <View style={[styles.itemIcon, { backgroundColor: getItemColor(itemType) }]}>
                    {getItemIcon(itemType)}
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.itemType}>Type: {itemType}</Text>
                    <Text style={styles.itemQuantity}>Quantity: x{quantity}</Text>
                </View>
                <View style={styles.itemArrow}>
                    <Text style={styles.arrowText}>›</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Inventory</Text>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading items...</Text>
                </View>
            ) : myItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No items found</Text>
                    <Text style={styles.emptySubText}>Start playing games to collect items!</Text>
                </View>
            ) : (
                <FlatList
                    data={myItems}
                    keyExtractor={(item, index) => `${item.id || index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
            
            {/* Item Detail Modal */}
            <Modal
                visible={showItemDetail}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    console.log('Modal closing');
                    setShowItemDetail(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Item Details</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    console.log('Close button pressed');
                                    setShowItemDetail(false);
                                }}
                            >
                                <X size={24} color="#636E72" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ padding: 20 }}>
                            <Text>Debug: Modal is visible: {showItemDetail ? 'true' : 'false'}</Text>
                            <Text>Debug: Selected item: {selectedItem ? JSON.stringify(selectedItem, null, 2) : 'null'}</Text>
                        </View>
                        
                        {selectedItem && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.detailHeader}>
                                    <View style={[styles.detailIcon, { backgroundColor: getItemColor(selectedItem.itemType || selectedItem.type) }]}>
                                        {getItemIcon(selectedItem.itemType || selectedItem.type)}
                                    </View>
                                    <View style={styles.detailInfo}>
                                        <Text style={styles.detailName}>
                                            {selectedItem.itemName || selectedItem.name || 'Unknown Item'}
                                        </Text>
                                        <Text style={styles.detailType}>
                                            Type: {selectedItem.itemType || selectedItem.type || 'unknown'}
                                        </Text>
                                        <Text style={styles.detailQuantity}>
                                            Quantity: x{selectedItem.quantity || 1}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionTitle}>Item Information</Text>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Item ID:</Text>
                                        <Text style={styles.infoValue}>#{selectedItem.id || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Rarity:</Text>
                                        <Text style={styles.infoValue}>{selectedItem.rarity || 'Common'}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Description:</Text>
                                        <Text style={styles.infoValue}>
                                            {selectedItem.description || 'A mysterious item with special properties.'}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionTitle}>Usage Information</Text>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Can Use:</Text>
                                        <Text style={styles.infoValue}>{selectedItem.usable ? 'Yes' : 'No'}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Can Trade:</Text>
                                        <Text style={styles.infoValue}>{selectedItem.tradable ? 'Yes' : 'No'}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Obtained:</Text>
                                        <Text style={styles.infoValue}>
                                            {selectedItem.created_at ? 
                                                new Date(selectedItem.created_at).toLocaleDateString() : 
                                                'Unknown'
                                            }
                                        </Text>
                                    </View>
                                </View>
                                
                                {selectedItem.effects && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Effects</Text>
                                        {Array.isArray(selectedItem.effects) ? 
                                            selectedItem.effects.map((effect: string, index: number) => (
                                                <Text key={index} style={styles.effectText}>• {effect}</Text>
                                            )) :
                                            <Text style={styles.effectText}>• {selectedItem.effects}</Text>
                                        }
                                    </View>
                                )}
                            </ScrollView>
                        )}
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.useBtn]}
                                onPress={() => {
                                    console.log('Use item button pressed');
                                    // Handle item usage logic here
                                    Alert.alert('Item Used', 'Item has been used!');
                                    setShowItemDetail(false);
                                }}
                            >
                                <Text style={styles.useBtnText}>Use Item</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F8F9FA',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2D3436',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#636E72',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#636E72',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#B2BEC3',
    },
    listContainer: {
        paddingBottom: 20,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 15,
        marginBottom: 10,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 4,
    },
    itemType: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 2,
    },
    itemQuantity: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    itemArrow: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 20,
        color: '#BDC3C7',
        fontWeight: '300',
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    detailInfo: {
        flex: 1,
    },
    detailName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 4,
    },
    detailType: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 2,
    },
    detailQuantity: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    detailSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F4',
    },
    infoLabel: {
        fontSize: 14,
        color: '#636E72',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#2D3436',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    effectText: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 4,
        lineHeight: 20,
    },
    modalButtons: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    modalBtn: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    useBtn: {
        backgroundColor: '#4CAF50',
    },
    useBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});