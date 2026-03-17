import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Link, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChineseGamesIndex() {
    const games = [
        {
            id: 'chinesequiz',
            title: 'Chinese Quiz',
            description: 'Match the Chinese characters',
            emoji: '🧠',
            route: '/games/chinese/chinesequiz',
        },
        {
            id: 'chinesesentence',
            title: 'chinesesentence',
            description: 'Match the Chinese characters',
            route: '/games/chinese/chinesesentence',
        },
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Chinese Games',
                    headerStyle: { backgroundColor: '#4c669f' },
                    headerTintColor: '#fff',
                    headerBackVisible: true,
                }}
            />

            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>🎮 Chinese Games</Text>
                <Text style={styles.headerSubtitle}>Choose a game to start learning</Text>
            </LinearGradient>

            <View style={styles.gamesList}>
                {games.map((game) => (
                    <Link key={game.id} href={game.route} asChild>
                        <Pressable style={styles.gameCard}>
                            <View style={styles.gameEmojiContainer}>
                                <Text style={styles.gameEmoji}>{game.emoji}</Text>
                            </View>
                            <View style={styles.gameInfo}>
                                <Text style={styles.gameTitle}>{game.title}</Text>
                                <Text style={styles.gameDescription}>{game.description}</Text>
                            </View>
                            <Text style={styles.arrow}>→</Text>
                        </Pressable>
                    </Link>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    gamesList: {
        flex: 1,
        paddingTop: 30,
        paddingHorizontal: 20,
    },
    gameCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    gameEmojiContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    gameEmoji: {
        fontSize: 30,
    },
    gameInfo: {
        flex: 1,
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    gameDescription: {
        fontSize: 14,
        color: '#666',
    },
    arrow: {
        fontSize: 20,
        color: '#4c669f',
        fontWeight: '300',
        marginLeft: 8,
    },
});