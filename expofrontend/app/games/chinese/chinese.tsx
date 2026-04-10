import { View, Text, StyleSheet, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChineseGamesIndex() {
    const router = useRouter();
    const games = [
        {
            id: 'chinesequiz',
            title: 'Chinese Quiz',
            description: 'Match the Chinese characters',
            route: '/games/chinese/chinesequiz',
        },
        {
            id: 'chinesesentence',
            title: 'Chinese Sentence',
            description: 'Build correct sentences',
            route: '/games/chinese/chinesesentence',
        },
    ];

    const handleBackToHome = () => {
        router.push('/');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Stack.Screen
                options={{
                    title: 'Chinese Games',
                    headerBackVisible: false,
                    headerLeft: () => null,
                    headerStyle: { backgroundColor: '#4c669f' },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontSize: 20,
                        fontWeight: '600',
                    },
                }}
            />

            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.gradientHeader}
            />

            <View style={styles.gamesList}>
                {games.map((game) => (
                    <Pressable
                        key={game.id}
                        style={styles.gameCard}
                        onPress={() => router.push(game.route)}
                    >
                        <View style={styles.gameInfo}>
                            <Text style={styles.gameTitle}>{game.title}</Text>
                            <Text style={styles.gameDescription}>{game.description}</Text>
                        </View>
                        <Text style={styles.arrow}>→</Text>
                    </Pressable>
                ))}
            </View>

            {/* 返回首页链接 - 新增 */}
            <TouchableOpacity style={styles.backLink} onPress={handleBackToHome}>
                <Text style={styles.backLinkText}>← Return to home page</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    gradientHeader: {
        height: 0,
    },
    gamesList: {
        paddingTop: 20,
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
        color: '#4c669f',
        fontWeight: '300',
        marginLeft: 8,
    },
    // 新增样式
    backLink: {
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    backLinkText: {
        fontSize: 16,
        color: '#4c669f',
        fontWeight: '500',
    },
});