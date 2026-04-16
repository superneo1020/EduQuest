import React from 'react';
import { View } from 'react-native';
import { AvatarIcons } from '../app/Profile/AvatarIcons';

interface AvatarIconRendererProps {
    iconName: string;
    size?: number;
    color?: string;
}

export default function AvatarIconRenderer({ iconName, size = 60, color = '#636E72' }: AvatarIconRendererProps) {
    console.log('AvatarIconRenderer - iconName:', iconName);
    console.log('AvatarIconRenderer - Available icons:', Object.keys(AvatarIcons));
    
    try {
        const AvatarIcon = AvatarIcons[iconName as keyof typeof AvatarIcons];
        
        if (!AvatarIcon) {
            console.log('AvatarIconRenderer - Icon not found, using default');
            // Fallback to default icon if not found
            const DefaultIcon = AvatarIcons.default;
            return (
                <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                    <DefaultIcon size={size} color={color} />
                </View>
            );
        }
        
        console.log('AvatarIconRenderer - Rendering icon:', iconName);
        return (
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <AvatarIcon size={size} color={color} />
            </View>
        );
    } catch (error) {
        console.error('AvatarIconRenderer - Error rendering icon:', error);
        // Fallback to default icon on error
        const DefaultIcon = AvatarIcons.default;
        return (
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <DefaultIcon size={size} color={color} />
            </View>
        );
    }
}
