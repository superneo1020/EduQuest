// app/games/_layout.tsx
import { Stack } from 'expo-router';

export default function GamesLayout() {
    return (
        // 全局隐藏导航栏，避免任何页面出现系统返回按钮或标题
        <Stack screenOptions={{ headerShown: false }}>
            {/* games/index.tsx（游戏总览页，如果有的话） */}
            <Stack.Screen
                name="index"
                options={{ headerShown: false }}
            />

            {/* 科学游戏相关页面 */}
            <Stack.Screen
                name="science/index"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="science/AnimalClassificationGame"
                options={{ headerShown: false }}
            />

            {/* 英语游戏相关页面（旧版 language 入口） */}
            <Stack.Screen
                name="language"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="LanguageGameScreen"
                options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="MatchingGame"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ListeningGame"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SentenceReorderGame"
                options={{ headerShown: false }}
            />

            {/* 中文游戏相关页面 */}
            {/* 中文游戏列表页：对应 app/games/chinese/index.tsx */}
            <Stack.Screen
                name="chinese/index"
                options={{ headerShown: false }}
            />
            {/* 中文识字游戏：对应 app/games/chinese/chinesequiz.tsx */}
            <Stack.Screen
                name="chinese/chinesequiz"
                options={{ headerShown: false }}
            />
            {/* 中文句子游戏：对应 app/games/chinese/chinesesentence.tsx */}
            <Stack.Screen
                name="chinese/chinesesentence"
                options={{ headerShown: false }}
            />

            {/* 如果有其他游戏分类，可以继续添加 */}
        </Stack>
    );
}