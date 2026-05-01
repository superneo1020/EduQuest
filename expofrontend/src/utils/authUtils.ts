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
        if (parts.length !== 3) {
            console.log('Token expiry check: Invalid token format, parts length:', parts.length);
            return true;
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        const expiryTime = payload.exp;
        const timeUntilExpiry = expiryTime - now;
        
        console.log('Token expiry check:', {
            exp: expiryTime,
            now: now,
            timeUntilExpiry: timeUntilExpiry,
            isExpired: expiryTime < now,
            expiryDate: new Date(expiryTime * 1000).toLocaleString(),
            currentDate: new Date(now * 1000).toLocaleString()
        });
        
        return expiryTime < now;
    } catch (error) {
        console.error('Error checking token expiry:', error);
        return true;
    }
};
