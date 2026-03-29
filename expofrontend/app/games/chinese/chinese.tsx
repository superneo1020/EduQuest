import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChineseGamesIndex() {
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

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Chinese Games',
                    headerBackVisible: false, // 隐藏返回按钮
                    headerLeft: () => null,   // 确保左侧没有返回按钮
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
                        onPress={() => {
                            // 使用 router 进行导航
                            const router = require('expo-router').router;
                            router.push(game.route);
                        }}
                    >
                        <View style={styles.gameInfo}>
                            <Text style={styles.gameTitle}>{game.title}</Text>
                            <Text style={styles.gameDescription}>{game.description}</Text>
                        </View>
                        <Text style={styles.arrow}>→</Text>
                    </Pressable>
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
    gradientHeader: {
        height: 0, // 完全隐藏渐变装饰
    },
    gamesList: {
        flex: 1,
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
});