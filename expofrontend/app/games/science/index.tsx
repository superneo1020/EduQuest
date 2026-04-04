// app/games/science/chinese.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ScienceGamesIndex: React.FC = () => {
    const navigation = useNavigation();

    // 隱藏返回按鈕，但保留標題
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null, // 隱藏返回按鈕
            title: 'Science Games', // 保留標題
        });
    }, [navigation]);

    const games = [
        {
            id: 1,
            title: 'Animal Games',
            component: 'AnimalGamesIndex',
            description: 'Learn about animals through fun games'
        },
        {
            id: 2,
            title: 'HumanBody',
            component: 'HumanBody',
            description: 'Learn the positions of human organs'
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.gamesGrid}>
                {games.map(game => (
                    <TouchableOpacity
                        key={game.id}
                        style={styles.gameCard}
                        onPress={() => {
                            if (game.id === 1) {
                                navigation.navigate('science/AnimalGamesIndex' as never);
                            }
                            if (game.id === 2) {
                                navigation.navigate('science/HumanBodyGamesIndex' as never);
                            }
                        }}
                    >
                        <View style={styles.gameCardContent}>
                            <Text style={styles.gameTitle}>{game.title}</Text>
                            <Text style={styles.gameDescription}>
                                {game.description}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    gamesGrid: {
        padding: 15,
    },
    gameCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    gameCardContent: {
        padding: 25,
    },
    gameTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    gameDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
});

export default ScienceGamesIndex;