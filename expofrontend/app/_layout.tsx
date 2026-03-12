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
            title: 'Math Challenge',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
        />
        <Stack.Screen
          name="games/language"
          options={{
            title: 'Language Learning',
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
        />
        <Stack.Screen
          name="games/science"
          options={{
            title: 'Science Explorer',
            headerStyle: {
              backgroundColor: '#FF9800',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
        />
        <Stack.Screen
          name="games/chinese/chinese"
          options={{
            title: 'Memory Training',
            headerStyle: {
              backgroundColor: '#9C27B0',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Learning Progress',
            headerStyle: {
              backgroundColor: '#607D8B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
        />
          <Stack.Screen
              name="Profile/history"
              options={{
                  title: 'Point History',
                  headerStyle: {
                      backgroundColor: '#607D8B',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                      fontWeight: 'bold',
                  }
              }}
          />
      </Stack>
    </AuthProvider>
  );
}