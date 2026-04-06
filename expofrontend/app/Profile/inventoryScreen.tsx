import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';
import { getApiBaseUrl } from '@/src/api/client';

export default function inventoryScreen() {
    const { token } = useAuth();
    const [myItems, setMyItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyItems = async () => {
        try {
            // 對應你的 UserItemController.getMyItem
            const response = await axios.get(`${getApiBaseUrl()}/api/user/item/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyItems(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyItems(); }, []);

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>My Inventory</Text>
            {loading ? <ActivityIndicator /> : (
                <FlatList
                    data={myItems}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={{ backgroundColor: '#f9f9f9', padding: 15, marginBottom: 10, borderRadius: 10 }}>
                            <Text style={{ fontSize: 16 }}>{item.itemName} (x{item.quantity})</Text>
                            <Text style={{ color: '#666', fontSize: 12 }}>Type: {item.itemType}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}