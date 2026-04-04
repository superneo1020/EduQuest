// app/games/_layout.tsx
import { Stack } from 'expo-router';

export default function GamesLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="science/index"
                options={{
                    headerShown: false,  // 改为 false
                }}
            />
            <Stack.Screen
                name="science/AnimalClassificationGame"
                options={{
                    headerShown: false,  // 改为 false
                }}
            />
            <Stack.Screen
                name="language"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="LanguageGameScreen"
                options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                }}
            />
            <Stack.Screen
                name="MatchingGame"
                options={{
                    headerShown: false,  // 改为 false
                }}
            />
            <Stack.Screen
                name="ListeningGame"
                options={{
                    headerShown: false,  // 改为 false
                }}
            />
            <Stack.Screen
                name="SentenceReorderGame"
                options={{
                    headerShown: false,  // 改为 false
                }}
            />
            {/* 添加中文句子游戏的路由配置 */}
            <Stack.Screen
                name="chinese/chinesesentence"
                options={{
                    headerShown: false,
                }}
            />
            {/* 添加中文游戏列表页面的路由配置 */}
            <Stack.Screen
                name="chinese/index"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
}