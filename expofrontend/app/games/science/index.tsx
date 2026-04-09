// app/games/science/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const ScienceGamesIndex: React.FC = () => {
    const navigation = useNavigation();
    const router = useRouter();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null,
            title: 'Science Games',
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

    const handleBackToHome = () => {
        router.push('/');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Science Games</Text>
                <Text style={styles.subtitle}>Choose a game to start learning</Text>
            </View>

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

            {/* 返回首页链接 - 新增 */}
            <TouchableOpacity style={styles.backLink} onPress={handleBackToHome}>
                <Text style={styles.backLinkText}>← Return to home page</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
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
    // 新增样式
    backLink: {
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    backLinkText: {
        fontSize: 16,
        color: '#4c669f',
        fontWeight: '500',
    },
});

export default ScienceGamesIndex;