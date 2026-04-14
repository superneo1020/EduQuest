// app/games/science/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Microscope, Heart, Star, Zap, Bug } from 'lucide-react-native';

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
            title: '?? Animal Games',
            component: 'AnimalGamesIndex',
            description: 'Explore amazing animals and have fun! ??',
            icon: '??',
            color: '#4CAF50',
            bgColor: '#E8F5E8'
        },
        {
            id: 2,
            title: '?? Human Body',
            component: 'HumanBody',
            description: 'Discover how your body works! ?',
            icon: '??',
            color: '#FF6B6B',
            bgColor: '#FFE5E5'
        },
    ];

    const handleBackToHome = () => {
        router.push('/');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>?? Science Games ??</Text>
                    <View style={styles.starsContainer}>
                        <Star size={20} color="#FFD700" />
                        <Star size={20} color="#FFD700" />
                        <Star size={20} color="#FFD700" />
                    </View>
                </View>
                <Text style={styles.subtitle}>Explore, learn, and discover! ?</Text>
                <View style={styles.decorationLine} />
            </View>

            <View style={styles.gamesGrid}>
                {games.map((game, index) => (
                    <TouchableOpacity
                        key={game.id}
                        style={[styles.gameCard, { backgroundColor: game.bgColor, borderLeftColor: game.color }]}
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
                            <View style={[styles.iconContainer, { backgroundColor: game.color }]}>
                                <Text style={styles.gameIcon}>{game.icon}</Text>
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.gameTitle, { color: game.color }]}>{game.title}</Text>
                                <Text style={styles.gameDescription}>
                                    {game.description}
                                </Text>
                            </View>
                            <View style={styles.playButton}>
                                <Text style={styles.playButtonText}>PLAY!</Text>
                            </View>
                        </View>
                        <View style={styles.cardFooter}>
                            <View style={styles.difficultyBadge}>
                                <Text style={styles.difficultyText}>{index === 0 ? 'FUN' : 'COOL'}</Text>
                            </View>
                            <View style={styles.pointsBadge}>
                                <Zap size={12} color="#FFA500" />
                                <Text style={styles.pointsText}>+{index === 0 ? '15' : '25'} pts</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Back to home link */}
            <TouchableOpacity style={styles.backLink} onPress={handleBackToHome}>
                <View style={styles.backButton}>
                    <Text style={styles.backLinkText}>?? Back to Home ??</Text>
                </View>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9F0',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    header: {
        padding: 25,
        backgroundColor: '#FFF5E6',
        marginBottom: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#4CAF50',
        textAlign: 'center',
        textShadowColor: '#FFD700',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    starsContainer: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 4,
    },
    subtitle: {
        fontSize: 18,
        color: '#FF8C42',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    },
    decorationLine: {
        width: 100,
        height: 4,
        backgroundColor: '#4CAF50',
        borderRadius: 2,
        marginTop: 12,
    },
    gamesGrid: {
        padding: 20,
        gap: 20,
    },
    gameCard: {
        borderRadius: 25,
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        overflow: 'hidden',
        borderLeftWidth: 6,
        transform: [{ scale: 1 }],
    },
    gameCardContent: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    gameIcon: {
        fontSize: 28,
    },
    textContainer: {
        flex: 1,
    },
    gameTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 6,
    },
    gameDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        fontWeight: '500',
    },
    playButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    playButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    difficultyBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1976D2',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF8C00',
    },
    backLink: {
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    backLinkText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '800',
    },
});

export default ScienceGamesIndex;
