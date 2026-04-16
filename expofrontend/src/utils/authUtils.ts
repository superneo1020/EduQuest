import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const clearAuthAndPromptRelogin = async (signOut: () => Promise<void>) => {
    try {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
        await signOut();
        
        Alert.alert(
            'Authentication Required',
            'Please log in again to continue.',
            [{ text: 'OK' }]
        );
    } catch (error) {
        console.error('Error clearing auth:', error);
    }
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    } catch (error) {
        console.error('Error checking token expiry:', error);
        return true;
    }
};
