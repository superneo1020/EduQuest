import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { BackgroundIcons } from './BackgroundIcons';

// Background options matching the database items
export const backgroundOptions = [
    { id: 'default', name: 'Default Background', color: '#F0F4F8' },
    { id: 'Space', name: 'Space Theme', color: '#0F172A' },
    { id: 'Ocean', name: 'Ocean View', color: '#006994' },
    { id: 'Forest', name: 'Forest Adventure', color: '#228B22' },
    { id: 'City', name: 'City Skyline', color: '#708090' },
];

// Icon name mapping: backend icon field -> backgroundOptions id
const iconNameMapping: Record<string, string> = {
    'Space': 'Space',
    'Ocean': 'Ocean',
    'Forest': 'Forest',
    'City': 'City',
};

// Function to render background based on selection
export const renderBackground = (backgroundId: string, size: number = 50) => {
    const background = backgroundOptions.find(opt => opt.id === backgroundId);
    // Use mapped icon component or default
    const IconComponent = (BackgroundIcons as any)[backgroundId] || BackgroundIcons.default;

    return (
        <View style={[
            styles.backgroundContainer,
            {
                width: size,
                height: size,
                borderRadius: 8,
                backgroundColor: background?.color || '#F0F4F8',
                overflow: 'hidden'
            }
        ]}>
            <IconComponent size={size} color={background?.color || '#F0F4F8'} />
        </View>
    );
};

// Background selector modal component
interface BackgroundSelectorProps {
    visible: boolean;
    selectedBackground: string;
    onSelect: (backgroundId: string) => void;
    onClose: () => void;
    userItems: any[];
    onGoToShop: () => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
    visible,
    selectedBackground,
    onSelect,
    onClose,
    userItems,
    onGoToShop
}) => {
    // Always include default background
    const ownedBackgroundIds: string[] = ['default'];

    console.log('=== BackgroundSelector Debug ===');
    console.log('Raw userItems:', JSON.stringify(userItems, null, 2));

    // Process user items to find background types
    const itemsArray = Array.isArray(userItems) ? userItems : [];

    itemsArray.forEach((userItem, index) => {
        const itemData = userItem.item || userItem;
        const rawType = itemData.type || itemData.category || itemData.itemType || '';
        const itemType = rawType.toUpperCase();
        const rawIcon = itemData.icon || itemData.image || itemData.backgroundId || '';

        let iconId = rawIcon;
        if (iconId.includes('/')) {
            iconId = iconId.split('/').pop() || '';
        }
        iconId = iconId.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');

        console.log(`Item ${index}: rawType="${rawType}", itemType="${itemType}", rawIcon="${rawIcon}", iconId="${iconId}"`);

        if (itemType === 'BACKGROUND' && iconId) {
            // Apply mapping to convert backend icon name to backgroundOptions id
            const mappedId = iconNameMapping[iconId] || iconId;
            const existsInOptions = backgroundOptions.some(opt => opt.id === mappedId);
            console.log(`  -> iconId "${iconId}" mapped to "${mappedId}", exists in backgroundOptions? ${existsInOptions}`);

            if (existsInOptions && !ownedBackgroundIds.includes(mappedId)) {
                ownedBackgroundIds.push(mappedId);
            }
        }
    });

    console.log('Owned background IDs:', ownedBackgroundIds);

    const ownedBackgrounds = backgroundOptions.filter(background => ownedBackgroundIds.includes(background.id));
    console.log('Owned backgrounds (filtered):', ownedBackgrounds.map(b => b.id));
    console.log('=============================');

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Your Backgrounds</Text>

                    <ScrollView style={styles.backgroundGrid}>
                        <View style={styles.gridContainer}>
                            {ownedBackgrounds.map((background) => (
                                <TouchableOpacity
                                    key={background.id}
                                    style={[
                                        styles.backgroundOption,
                                        selectedBackground === background.id && styles.selectedBackground
                                    ]}
                                    onPress={() => onSelect(background.id)}
                                >
                                    {renderBackground(background.id, 55)}
                                    <Text style={styles.backgroundName}>{background.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {ownedBackgrounds.length <= 1 && (
                            <Text style={styles.noBackgroundHint}>
                                You haven't unlocked any other backgrounds yet. Visit the shop to get more!
                            </Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.shopButton} onPress={onGoToShop}>
                        <Text style={styles.shopButtonText}>Get More Backgrounds</Text>
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
    backgroundGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    backgroundOption: {
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
    selectedBackground: {
        borderColor: '#3498DB',
        backgroundColor: '#EBF5FB',
        transform: [{ scale: 1.1 }],
        zIndex: 10,
    },
    backgroundName: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 8,
        color: '#475569',
        fontWeight: '600',
    },
    noBackgroundHint: {
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
