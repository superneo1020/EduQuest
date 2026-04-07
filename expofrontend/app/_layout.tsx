import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/auth/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="games/math/math"
                    options={{
                        headerShown: false,  // 改为 false
                    }}
                />
                <Stack.Screen
                    name="games/language"
                    options={{
                        headerShown: false,  // 改为 false
                    }}
                />
                <Stack.Screen
                    name="games/science"
                    options={{
                        headerShown: false,  // 改为 false
                    }}
                />
                <Stack.Screen
                    name="games/chinese/chinese"
                    options={{
                        headerShown: false,  // 改为 false
                    }}
                />
                <Stack.Screen
                    name="profile"
                    options={{
                        headerShown: false,  // 改为 false
                    }}
                />
                <Stack.Screen
                    name="Profile/history"
                    options={{
                        headerShown: false,  // 改为 false
                    }}
                />
                <Stack.Screen
                    name="rank/leaderboard"
                    options={{
                        headerShown: false,  // 改为 false
                    }}
                />
                {/* 添加其他可能需要的路由，确保所有页面都隐藏导航栏 */}
                <Stack.Screen
                    name="Profile/Login"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="Profile/profile"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="Profile/teacher"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="games/english/language"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="games/english/MatchingGame"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="games/english/ListeningGame"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="games/english/SentenceReorderGame"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="games/chinese/chinesesentence"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="games/chatbot"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </AuthProvider>
    );
}