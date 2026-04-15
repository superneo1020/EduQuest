import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AvatarIcons } from './AvatarIcons';
import { BackgroundIcons } from './BackgroundIcons';
import { BadgeIcons } from './BadgeIcons';

// Unified icon manager for all icon types
export class IconManager {
    static renderIcon(type: 'avatar' | 'background' | 'badge', iconId: string, size: number = 50) {
        switch (type) {
            case 'avatar':
                const AvatarComponent = AvatarIcons[iconId as keyof typeof AvatarIcons] || AvatarIcons.default;
                return (
                    <View style={[
                        styles.iconContainer,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                        }
                    ]}>
                        <AvatarComponent size={size * 0.8} color="#fff" />
                    </View>
                );
            case 'background':
                const BackgroundComponent = (BackgroundIcons as any)[iconId] || BackgroundIcons.default;
                return (
                    <View style={[
                        styles.backgroundContainer,
                        {
                            width: size,
                            height: size,
                            borderRadius: 8,
                            overflow: 'hidden'
                        }
                    ]}>
                        <BackgroundComponent size={size} />
                    </View>
                );
            case 'badge':
                const BadgeComponent = (BadgeIcons as any)[iconId] || BadgeIcons.default;
                return (
                    <View style={[
                        styles.badgeContainer,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                        }
                    ]}>
                        <BadgeComponent size={size * 0.8} color="#fff" />
                    </View>
                );
            default:
                return null;
        }
    }

    static getIconOptions(type: 'avatar' | 'background' | 'badge') {
        switch (type) {
            case 'avatar':
                return [
                    { id: 'default', name: 'Default', color: '#636E72' },
                    { id: 'happy_cat', name: 'Happy Cat', color: '#FFD93D' },
                    { id: 'cool_dog', name: 'Cool Dog', color: '#4ECDC4' },
                    { id: 'smart_owl', name: 'Smart Owl', color: '#9B59B6' },
                    { id: 'sporty_rabbit', name: 'Sporty Rabbit', color: '#FF6B6B' },
                    { id: 'artistic_butterfly', name: 'Artistic Butterfly', color: '#FF9FF3' },
                    { id: 'bookworm_bear', name: 'Bookworm Bear', color: '#54A0FF' },
                    { id: 'explorer_monkey', name: 'Explorer Monkey', color: '#1DD1A1' },
                    { id: 'star_student', name: 'Star Student', color: '#FFA502' },
                    { id: 'rainbow_unicorn', name: 'Rainbow Unicorn', color: '#A29BFE' },
                    { id: 'rocket_raccoon', name: 'Rocket Raccoon', color: '#FF6348' },
                    { id: 'heart_panda', name: 'Heart Panda', color: '#FF4757' },
                    { id: 'sunshine_bee', name: 'Sunshine Bee', color: '#FFA500' },
                    { id: 'moon_turtle', name: 'Moon Turtle', color: '#3498DB' },
                    { id: 'flower_ladybug', name: 'Flower Ladybug', color: '#E91E63' },
                    { id: 'rainbow_frog', name: 'Rainbow Frog', color: '#00BCD4' },
                    { id: 'cloud_sheep', name: 'Cloud Sheep', color: '#ECF0F1' },
                    { id: 'apple_teacher', name: 'Apple Teacher', color: '#27AE60' },
                    { id: 'pencil_wizard', name: 'Pencil Wizard', color: '#8E44AD' },
                    { id: 'crayon_dragon', name: 'Crayon Dragon', color: '#E74C3C' },
                    { id: 'cool_hat', name: 'Cool Hat', color: '#4B0082' },
                    { id: 'superhero_cape', name: 'Superhero Cape', color: '#DC143C' },
                    { id: 'science_glasses', name: 'Science Glasses', color: '#4169E1' },
                    { id: 'sports_jersey', name: 'Sports Jersey', color: '#FF6B6B' },
                ];
            case 'background':
                return [
                    { id: 'default', name: 'Default', color: '#F0F4F8' },
                    { id: 'Space', name: 'Space Theme', color: '#0F172A' },
                    { id: 'Ocean', name: 'Ocean View', color: '#006994' },
                    { id: 'Forest', name: 'Forest Adventure', color: '#228B22' },
                    { id: 'City', name: 'City Skyline', color: '#708090' },
                ];
            case 'badge':
                return [
                    { id: 'default', name: 'Default', color: '#FFD700' },
                    { id: 'Trophy', name: 'Math Champion', color: '#FFD700' },
                    { id: 'Book', name: 'Reading Star', color: '#8B4513' },
                    { id: 'Microscope', name: 'Science Explorer', color: '#4169E1' },
                    { id: 'Brain', name: 'Memory Master', color: '#FF9800' },
                ];
            default:
                return [];
        }
    }

    static getIconMapping(type: 'avatar' | 'background' | 'badge'): Record<string, string> {
        switch (type) {
            case 'avatar':
                return {
                    'Hat': 'cool_hat',
                    'Cape': 'superhero_cape',
                    'Glasses': 'science_glasses',
                    'Jersey': 'sports_jersey',
                };
            case 'background':
                return {
                    'Space': 'Space',
                    'Ocean': 'Ocean',
                    'Forest': 'Forest',
                    'City': 'City',
                };
            case 'badge':
                return {
                    'Trophy': 'Trophy',
                    'Book': 'Book',
                    'Microscope': 'Microscope',
                    'Brain': 'Brain',
                };
            default:
                return {};
        }
    }
}

// Icon selection button component
interface IconSelectionButtonProps {
    type: 'avatar' | 'background' | 'badge';
    selectedIcon: string;
    onPress: () => void;
    size?: number;
}

export const IconSelectionButton: React.FC<IconSelectionButtonProps> = ({
    type,
    selectedIcon,
    onPress,
    size = 60
}) => {
    const getIconLabel = () => {
        switch (type) {
            case 'avatar': return 'Avatar';
            case 'background': return 'Background';
            case 'badge': return 'Badge';
            default: return 'Icon';
        }
    };

    return (
        <TouchableOpacity style={styles.selectionButton} onPress={onPress}>
            <View style={styles.iconPreview}>
                {IconManager.renderIcon(type, selectedIcon, size)}
            </View>
            <Text style={styles.iconLabel}>{getIconLabel()}</Text>
            <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backgroundContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    badgeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        position: 'relative',
    },
    selectionButton: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E1E8ED',
        minWidth: 100,
    },
    iconPreview: {
        marginBottom: 8,
    },
    iconLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    changeText: {
        fontSize: 10,
        color: '#3498DB',
        fontWeight: '500',
    },
});
