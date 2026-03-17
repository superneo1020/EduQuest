// english/language.tsx
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Link, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function EnglishGamesIndex() {
    const games = [
        {
            id: 'listening',
            title: 'Listening Game',
            description: 'Listen to the audio and select the correct image',
            route: 'games/english/listeninggame',
        },
        {
            id: 'writing',
            title: 'Writing Game',
            description: 'Describe scenes and get AI feedback on your writing',
            route: 'games/english/writing',
        },
        {
            id: 'sentencereorder',
            title: 'Sentence Reorder',
            description: 'Drag and reorder words to form correct sentences',
            route: 'games/english/sentencereordergame',
        },
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'English Games',
                    headerStyle: { backgroundColor: '#4b6cb7' },
                    headerTintColor: '#fff',
                    headerBackVisible: true,
                }}
            />

            <LinearGradient
                colors={['#4b6cb7', '#182848']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>🇬🇧 English Games</Text>
                <Text style={styles.headerSubtitle}>Improve your English skills through fun games</Text>
            </LinearGradient>

            <View style={styles.gamesList}>
                {games.map((game) => (
                    <Link key={game.id} href={game.route} asChild>
                        <Pressable style={styles.gameCard}>
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
        color: '#4b6cb7',
        fontWeight: '300',
        marginLeft: 8,
    },
});