// app/games/_layout.tsx
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
                    headerShown: true,
                    title: 'Science games',
                    headerStyle: {
                        backgroundColor: '#4CAF50',
                    },
                    headerTintColor: 'white',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
            <Stack.Screen
                name="science/AnimalClassificationGame"
                options={{
                    headerShown: true,
                    title: 'Animal sorting game',
                    headerStyle: {
                        backgroundColor: '#4CAF50',
                    },
                    headerTintColor: 'white',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
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
                    headerShown: true,
                    title: 'Word matching game',
                    headerStyle: {
                        backgroundColor: '#6a11cb',
                    },
                    headerTintColor: 'white',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
            <Stack.Screen
                name="ListeningGame"
                options={{
                    headerShown: true,
                    title: 'Listening multiple choice questions',
                    headerStyle: {
                        backgroundColor: '#4b6cb7',
                    },
                    headerTintColor: 'white',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
            <Stack.Screen
                name="SentenceReorderGame"
                options={{
                    headerShown: true,
                    title: 'Sentence Reordering Game',
                    headerStyle: {
                        backgroundColor: '#667eea',
                    },
                    headerTintColor: 'white',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
        </Stack>
    );
}