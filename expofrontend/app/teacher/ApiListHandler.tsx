export interface DetailedListResponse<T> {
    items: T[];
    total: number;
    isEmpty: boolean;
}
import React from 'react';
import { FlatList, Text, View, ActivityIndicator, ListRenderItem } from 'react-native';

interface Props<T> {
    response: DetailedListResponse<T> | null;
    loading: boolean;
    renderItem: ListRenderItem<T>; // How to draw a single item
    onRefresh?: () => void;
}

export function ApiListHandler<T>({ response, loading, renderItem, onRefresh }: Props<T>) {
    if (loading && !response) {
        return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
    }

    if (!response || response.isEmpty) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Text>No items found.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={response.items}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
            refreshing={loading}
            onRefresh={onRefresh}
            ListHeaderComponent={
                <Text style={{ fontWeight: 'bold', padding: 10 }}>
                    Showing {response.items.length} of {response.total}
                </Text>
            }
        />
    );
}