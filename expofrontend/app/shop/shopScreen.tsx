import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Search, ShoppingCart, Star, Coins, Filter } from 'lucide-react-native';
import axios from 'axios';
import { getApiBaseUrl } from '../../src/api/client';

interface Item {
    id: number;
    name: string;
    type: string;
    icon: string;
    description: string;
    price: number;
    owned?: boolean;
}

export default function ShopScreen({ navigation }: any) {
    const [items, setItems] = useState<Item[]>([]);
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [userPoints, setUserPoints] = useState<number>(0);
    const [showOnlyAffordable, setShowOnlyAffordable] = useState(false);

    const itemTypes = ['All', 'Avatar', 'Badge', 'Background', 'Effect'];

    useEffect(() => {
        fetchItems();
        fetchUserPoints();
    }, []);

    useEffect(() => {
        filterItems();
    }, [items, searchText, selectedType, showOnlyAffordable]);

    const fetchItems = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await axios.get(`${getApiBaseUrl()}/api/item/find`, {
                params: { 
                    page: 0, 
                    size: 100,
                    filterWithUserPoints: showOnlyAffordable
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setItems(response.data.content || []);
        } catch (error) {
            console.error('Failed to fetch items:', error);
            Alert.alert('Error', 'Failed to load shop items');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchUserPoints = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await axios.get(`${getApiBaseUrl()}/api/user/points`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUserPoints(response.data.points || 0);
        } catch (error) {
            console.error('Failed to fetch user points:', error);
        }
    };

    const getAuthToken = async () => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            return await AsyncStorage.getItem('userToken');
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    };

    const filterItems = () => {
        let filtered = [...items];

        // Filter by type
        if (selectedType && selectedType !== 'All') {
            filtered = filtered.filter(item => item.type === selectedType);
        }

        // Filter by search text
        if (searchText) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Filter by affordability
        if (showOnlyAffordable) {
            filtered = filtered.filter(item => item.price <= userPoints);
        }

        setFilteredItems(filtered);
    };

    const handlePurchaseItem = async (item: Item) => {
        if (item.price > userPoints) {
            Alert.alert('Insufficient Points', `You need ${item.price} points to purchase this item.`);
            return;
        }

        Alert.alert(
            'Confirm Purchase',
            `Purchase "${item.name}" for ${item.price} points?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Purchase', 
                    style: 'default',
                    onPress: async () => {
                        try {
                            const token = await getAuthToken();
                            if (!token) return;

                            await axios.post(`${getApiBaseUrl()}/api/user/item/`,
                                { itemName: item.name },
                                { headers: { Authorization: `Bearer ${token}` }
                            });

                            Alert.alert('Success', `Successfully purchased "${item.name}"!`);
                            fetchUserPoints();
                            fetchItems(); // Refresh items to update owned status
                        } catch (error: any) {
                            console.error('Purchase failed:', error);
                            Alert.alert('Purchase Failed', error.response?.data?.message || 'Failed to purchase item');
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchItems();
        fetchUserPoints();
    };

    const renderShopItem = (item: Item) => (
        <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={styles.itemIcon}>
                    <Text style={styles.itemIconText}>{item.icon || '🎁'}</Text>
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemType}>{item.type}</Text>
                    {item.description && (
                        <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                </View>
            </View>
            <View style={styles.itemFooter}>
                <View style={styles.priceContainer}>
                    <Coins size={16} color="#FF9800" />
                    <Text style={styles.price}>{item.price}</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.purchaseButton,
                        item.owned && styles.ownedButton,
                        item.price > userPoints && styles.disabledButton
                    ]}
                    onPress={() => handlePurchaseItem(item)}
                    disabled={item.owned || item.price > userPoints}
                >
                    <Text style={[
                        styles.purchaseButtonText,
                        item.owned && styles.ownedButtonText
                    ]}>
                        {item.owned ? 'Owned' : 'Purchase'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading Shop...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.pointsContainer}>
                    <Coins size={24} color="#FF9800" />
                    <Text style={styles.pointsText}>{userPoints} Points</Text>
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowOnlyAffordable(!showOnlyAffordable)}
                >
                    <Filter size={20} color={showOnlyAffordable ? "#4CAF50" : "#636E72"} />
                    <Text style={[
                        styles.filterButtonText,
                        showOnlyAffordable && styles.filterButtonTextActive
                    ]}>
                        Affordable Only
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={20} color="#636E72" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search items..."
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>

            {/* Type Filter */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.typeFilterContainer}
            >
                {itemTypes.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.typeFilter,
                            selectedType === type && styles.typeFilterActive
                        ]}
                        onPress={() => setSelectedType(type)}
                    >
                        <Text style={[
                            styles.typeFilterText,
                            selectedType === type && styles.typeFilterTextActive
                        ]}>
                            {type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Items List */}
            <ScrollView
                style={styles.itemsContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredItems.length > 0 ? (
                    filteredItems.map(renderShopItem)
                ) : (
                    <View style={styles.emptyContainer}>
                        <ShoppingCart size={48} color="#636E72" />
                        <Text style={styles.emptyText}>No items found</Text>
                        <Text style={styles.emptySubText}>Try adjusting your filters</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#636E72',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pointsText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
    },
    filterButtonText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#636E72',
    },
    filterButtonTextActive: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#2D3436',
    },
    typeFilterContainer: {
        paddingHorizontal: 20,
        marginTop: 15,
    },
    typeFilter: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    typeFilterActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    typeFilterText: {
        fontSize: 14,
        color: '#636E72',
        fontWeight: '600',
    },
    typeFilterTextActive: {
        color: '#FFF',
    },
    itemsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 15,
    },
    itemCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    itemIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemIconText: {
        fontSize: 24,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    itemType: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 14,
        color: '#A0A0A0',
        lineHeight: 18,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        marginLeft: 4,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    purchaseButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    ownedButton: {
        backgroundColor: '#95A5A6',
    },
    disabledButton: {
        backgroundColor: '#E1E4E8',
    },
    purchaseButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    ownedButtonText: {
        color: '#FFF',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#636E72',
        marginTop: 15,
    },
    emptySubText: {
        fontSize: 14,
        color: '#A0A0A0',
        marginTop: 5,
    },
});
