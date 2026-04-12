import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { AvatarIcons } from './AvatarIcons';

// Elementary school style avatar options with cute icons and colors
export const avatarOptions = [
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
    { id: 'crayon_dragon', name: 'Crayon Dragon', color: '#E74C3C' }
];

// Function to render avatar based on selection
export const renderAvatar = (avatarId: string, size: number = 50) => {
    const avatar = avatarOptions.find(opt => opt.id === avatarId);
    
    // Get the appropriate icon component
    const IconComponent = AvatarIcons[avatarId as keyof typeof AvatarIcons] || AvatarIcons.default;
    
    return (
        <View style={[
            styles.avatarContainer,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: avatar?.color || '#636E72'
            }
        ]}>
            <IconComponent size={size * 0.8} color="#fff" />
        </View>
    );
};

// Avatar selector modal component
interface AvatarSelectorProps {
    visible: boolean;
    selectedAvatar: string;
    onSelect: (avatarId: string) => void;
    onClose: () => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
    visible,
    selectedAvatar,
    onSelect,
    onClose
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Choose Your Avatar</Text>
                    
                    <ScrollView style={styles.avatarGrid}>
                        <View style={styles.gridContainer}>
                            {avatarOptions.map((avatar) => (
                                <TouchableOpacity
                                    key={avatar.id}
                                    style={[
                                        styles.avatarOption,
                                        selectedAvatar === avatar.id && styles.selectedAvatar
                                    ]}
                                    onPress={() => onSelect(avatar.id)}
                                >
                                    {renderAvatar(avatar.id, 55)}
                                    <Text style={styles.avatarName}>{avatar.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
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
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#2C3E50',
    },
    avatarGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    avatarOption: {
        alignItems: 'center',
        paddingVertical: 15, // 增加垂直內距，讓格子更高一點
        borderRadius: 20,    // 圓角加大更顯活潑
        backgroundColor: '#F8F9FA',
        borderWidth: 2,
        borderColor: 'transparent',

        // 寬度稍微縮減，增加格子之間的空隙感
        width: '18%',
        marginHorizontal: '1%',
        marginVertical: 8,

        // 增加陰影效果，讓頭像有「浮出來」的感覺，更吸引小朋友
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedAvatar: {
        borderColor: '#3498DB',
        backgroundColor: '#EBF5FB',
        transform: [{ scale: 1.1 }], // 被選中時稍微放大 10%
        zIndex: 10, // 確保放大的時候不會被旁邊的擋住
    },
    avatarName: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 8, // 增加文字與圖示的距離
        color: '#475569',
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: '#3498DB',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
