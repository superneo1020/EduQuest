// app/games/language.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type GameIconName = keyof typeof Ionicons.glyphMap;

interface Game {
    id: string;
    title: string;
    description: string;
    icon: GameIconName;
    color: string;
    gradient: readonly [string, string];
    level: string;
    players: string;
    route: string;
    native: boolean;
}

const LanguageGamesPage = () => {
    const games: Game[] = [
        {
            id: 'listening',
            title: 'Listening multiple choice questions',
            description: 'Listen to the image and identify it to improve your listening and pronunciation recognition skills.',
            icon: 'headset-outline',
            color: '#4b6cb7',
            gradient: ['#4b6cb7', '#182848'] as const,
            level: 'Beginner to Advanced',
            players: 'Suitable for all levels',
            route: '/games/english/listeninggame', // 使用原生组件版本
            native: true
        },
        {
            id: 'writing',
            title: 'Writing Game',
            description: 'Match English words with their Chinese meanings or images',
            icon: 'game-controller-outline',
            color: '#6a11cb',
            gradient: ['#6a11cb', '#2575fc'] as const,
            level: 'Beginner to Intermediate',
            players: 'Memory training',
            route: '/games/english/matchinggame', // 使用原生组件版本
            native: true
        },
        {
            id: 'sentence-reorder',
            title: 'Sentence Reordering Game',
            description: 'Drag and reorder words to form correct English sentences',
            icon: 'swap-horizontal-outline',
            color: '#667eea',
            gradient: ['#667eea', '#764ba2'] as const,
            level: 'Beginner to Advanced',
            players: 'Grammar practice',
            route: '/games/english/sentencereordergame',
            native: true
        }
    ];

    const stats = {
        totalGames: 24,
        correctRate: '87%',
        streak: 5,
        totalTime: '3小时'
    };

    const navigateToGame = (game: any) => {
        if (game.native) {
            // 跳转到原生游戏组件
            router.push(game.route);
        } else {
            // 跳转到WebView游戏
            router.push({
                pathname: game.route,
                params: { type: game.id }
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Language learning games</Text>
                <Text style={styles.headerSubtitle}>Improve your language skills through fun games</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* 统计数据卡片 */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.statsCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.totalGames}</Text>
                            <Text style={styles.statLabel}>Games played</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.correctRate}</Text>
                            <Text style={styles.statLabel}>Correct rate</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.streak}</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* 游戏列表 */}
                <View style={styles.gamesSection}>
                    <Text style={styles.sectionTitle}>Select Game</Text>

                    {games.map((game) => (
                        <TouchableOpacity
                            key={game.id}
                            style={styles.gameCard}
                            onPress={() => navigateToGame(game)}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={game.gradient}
                                style={styles.gameCardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.gameCardContent}>
                                    <View style={styles.gameInfo}>
                                        <View style={styles.gameIconContainer}>
                                            <Ionicons name={game.icon} size={28} color="white" />
                                        </View>
                                        <View style={styles.gameTextContainer}>
                                            <Text style={styles.gameTitle}>{game.title}</Text>
                                            <Text style={styles.gameDescription}>{game.description}</Text>
                                            <View style={styles.gameMeta}>
                                                <View style={styles.gameMetaItem}>
                                                    <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
                                                    <Text style={styles.gameMetaText}>{game.level}</Text>
                                                </View>
                                                <View style={styles.gameMetaItem}>
                                                    <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.8)" />
                                                    <Text style={styles.gameMetaText}>{game.players}</Text>
                                                </View>
                                            </View>
                                            {game.native && (
                                                <Text style={styles.nativeBadge}>
                                                    <Ionicons name="star" size={12} /> 原生版本
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="play-circle-outline" size={36} color="white" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 游戏特色说明 */}
                <View style={styles.featuresCard}>
                    <Text style={styles.featuresTitle}>✨ Game Features</Text>
                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="flash" size={20} color="#4b6cb7" />
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Native Performance</Text>
                                <Text style={styles.featureDescription}>
                                    All games are developed using native components for smooth performance and fluid animations
                                </Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="volume-high" size={20} color="#4b6cb7" />
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Speech Synthesis</Text>
                                <Text style={styles.featureDescription}>
                                    Listening games support English speech synthesis, simulating a real pronunciation environment
                                </Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="stats-chart" size={20} color="#4b6cb7" />
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Progress Tracking</Text>
                                <Text style={styles.featureDescription}>
                                    Automatically saves game progress and high scores, tracking your learning achievements
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// 保持原有的样式不变
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        padding: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    gamesSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    gameCard: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    gameCardGradient: {
        padding: 20,
    },
    gameCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    gameInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    gameIconContainer: {
        marginRight: 16,
    },
    gameTextContainer: {
        flex: 1,
    },
    gameTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
    },
    gameDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
        lineHeight: 20,
    },
    gameMeta: {
        flexDirection: 'row',
    },
    gameMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    gameMetaText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginLeft: 4,
    },
    nativeBadge: {
        fontSize: 11,
        color: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 4,
        overflow: 'hidden',
    },
    featuresCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    featuresList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});

export default LanguageGamesPage;