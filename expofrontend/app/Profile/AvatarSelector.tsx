import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { AvatarIcons } from './AvatarIcons';

// 扩展 avatarOptions，包含商城可购买的四种头像
export const avatarOptions = [
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
    // 新增商城可购买的头像
    { id: 'cool_hat', name: 'Cool Hat', color: '#4B0082' },
    { id: 'superhero_cape', name: 'Superhero Cape', color: '#DC143C' },
];

// 图标名映射表：后端 icon 字段 -> avatarOptions 中的 id
const iconNameMapping: Record<string, string> = {
    'Hat': 'cool_hat',
    'Cape': 'superhero_cape',
};

// Function to render avatar based on selection
export const renderAvatar = (avatarId: string, size: number = 50) => {
    const avatar = avatarOptions.find(opt => opt.id === avatarId);
    // 优先使用映射后的图标组件
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
    userItems: any[];
    onGoToShop: () => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
                                                                  visible,
                                                                  selectedAvatar,
                                                                  onSelect,
                                                                  onClose,
                                                                  userItems,
                                                                  onGoToShop
                                                              }) => {
    // 1. 始终包含默认头像
    const ownedAvatarIds: string[] = [];

    console.log('=== AvatarSelector Debug ===');
    console.log('Raw userItems:', JSON.stringify(userItems, null, 2));

    // 2. 遍历用户已拥有的物品，找出头像类型的道具
    const itemsArray = Array.isArray(userItems) ? userItems : [];

    itemsArray.forEach((userItem, index) => {
        const itemData = userItem.item || userItem;
        const rawType = itemData.type || itemData.category || itemData.itemType || '';
        const itemType = rawType.toUpperCase();
        const rawIcon = itemData.icon || itemData.image || itemData.avatarId || '';

        let iconId = rawIcon;
        if (iconId.includes('/')) {
            iconId = iconId.split('/').pop() || '';
        }
        iconId = iconId.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');

        console.log(`Item ${index}: rawType="${rawType}", itemType="${itemType}", rawIcon="${rawIcon}", iconId="${iconId}"`);

        if (itemType === 'AVATAR' && iconId) {
            // 应用映射表，将后端图标名转换为 avatarOptions 中的 id
            const mappedId = iconNameMapping[iconId] || iconId;
            const existsInOptions = avatarOptions.some(opt => opt.id === mappedId);
            console.log(`  -> iconId "${iconId}" mapped to "${mappedId}", exists in avatarOptions? ${existsInOptions}`);

            if (existsInOptions && !ownedAvatarIds.includes(mappedId)) {
                ownedAvatarIds.push(mappedId);
            }
        }
    });

    console.log('Owned avatar IDs:', ownedAvatarIds);

    const ownedAvatars = avatarOptions.filter(avatar => ownedAvatarIds.includes(avatar.id));
    console.log('Owned avatars (filtered):', ownedAvatars.map(a => a.id));
    console.log('===========================');

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Your Avatars</Text>

                    <ScrollView style={styles.avatarGrid}>
                        <View style={styles.gridContainer}>
                            {ownedAvatars.map((avatar) => (
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
                        {ownedAvatars.length <= 1 && (
                            <Text style={styles.noAvatarHint}>
                                You haven't unlocked any other avatars yet. Visit the shop to get more!
                            </Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.shopButton} onPress={onGoToShop}>
                        <Text style={styles.shopButtonText}>🛍️ Get More Avatars</Text>
                    </TouchableOpacity>

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
        paddingVertical: 15,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        borderWidth: 2,
        borderColor: 'transparent',
        width: '18%',
        marginHorizontal: '1%',
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedAvatar: {
        borderColor: '#3498DB',
        backgroundColor: '#EBF5FB',
        transform: [{ scale: 1.1 }],
        zIndex: 10,
    },
    avatarName: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 8,
        color: '#475569',
        fontWeight: '600',
    },
    noAvatarHint: {
        textAlign: 'center',
        color: '#7F8C8D',
        fontSize: 14,
        marginTop: 20,
        paddingHorizontal: 20,
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
    shopButton: {
        backgroundColor: '#FF9800',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});