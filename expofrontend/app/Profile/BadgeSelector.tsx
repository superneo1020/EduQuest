// BadgeSelector.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { BadgeIcons } from './BadgeIcons';

// Badge options matching the database items
export const badgeOptions = [
    { id: 'default', name: 'Default', color: '#FFD700' },
    { id: 'Trophy', name: 'Math Champion', color: '#FFD700' },
    { id: 'Book', name: 'Reading Star', color: '#8B4513' },
    { id: 'Microscope', name: 'Science Explorer', color: '#4169E1' },
    { id: 'Brain', name: 'Memory Master', color: '#FF9800' },
];

// Icon name mapping: backend icon field -> badgeOptions id
export const badgeIconNameMapping: Record<string, string> = {
    'Trophy': 'Trophy',
    'Book': 'Book',
    'Microscope': 'Microscope',
    'Brain': 'Brain',
};

// Function to render badge based on selection
export const renderBadge = (badgeId: string, size: number = 50) => {
    const badge = badgeOptions.find(opt => opt.id === badgeId);
    // Use mapped icon component or fallback to a simple circle
    const IconComponent = (BadgeIcons as any)[badgeId] || BadgeIcons.default || (() => (
        <View style={{ width: size * 0.8, height: size * 0.8, backgroundColor: '#FFF', borderRadius: size * 0.4 }} />
    ));

    return (
        <View style={[
            styles.badgeContainer,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: badge?.color || '#FFD700',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
            }
        ]}>
            <IconComponent size={size * 0.8} color="#fff" />
        </View>
    );
};

// Badge selector modal component
interface BadgeSelectorProps {
    visible: boolean;
    selectedBadges: string[];
    onSelect: (badgeIds: string[]) => void;
    onClose: () => void;
    userItems: any[];
    onGoToShop: () => void;
}

export const BadgeSelector: React.FC<BadgeSelectorProps> = ({
                                                                visible,
                                                                selectedBadges,
                                                                onSelect,
                                                                onClose,
                                                                userItems,
                                                                onGoToShop
                                                            }) => {
    // Always include default badge
    const ownedBadgeIds: string[] = ['default'];

    // Process user items to find badge types
    const itemsArray = Array.isArray(userItems) ? userItems : [];

    itemsArray.forEach((userItem) => {
        const itemData = userItem.item || userItem;
        const rawType = itemData.type || itemData.category || itemData.itemType || '';
        const itemType = rawType.toUpperCase();
        const rawIcon = itemData.icon || itemData.image || itemData.badgeId || '';

        let iconId = rawIcon;
        if (iconId.includes('/')) {
            iconId = iconId.split('/').pop() || '';
        }
        iconId = iconId.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');

        if (itemType === 'BADGE' && iconId) {
            const mappedId = badgeIconNameMapping[iconId] || iconId;
            const existsInOptions = badgeOptions.some(opt => opt.id === mappedId);
            if (existsInOptions && !ownedBadgeIds.includes(mappedId)) {
                ownedBadgeIds.push(mappedId);
            }
        }
    });

    const ownedBadges = badgeOptions.filter(badge => ownedBadgeIds.includes(badge.id));

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Your Badges</Text>

                    <ScrollView style={styles.badgeGrid}>
                        <View style={styles.gridContainer}>
                            {ownedBadges.map((badge) => (
                                <TouchableOpacity
                                    key={badge.id}
                                    style={[
                                        styles.badgeOption,
                                        selectedBadges.includes(badge.id) && styles.selectedBadge
                                    ]}
                                    onPress={() => {
                                        const newSelection = selectedBadges.includes(badge.id)
                                            ? selectedBadges.filter(id => id !== badge.id)
                                            : [...selectedBadges, badge.id];
                                        onSelect(newSelection);
                                    }}
                                >
                                    {renderBadge(badge.id, 55)}
                                    <Text style={styles.badgeName}>{badge.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {ownedBadges.length <= 1 && (
                            <Text style={styles.noBadgeHint}>
                                You haven't unlocked any other badges yet. Visit the shop to get more!
                            </Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.shopButton} onPress={onGoToShop}>
                        <Text style={styles.shopButtonText}>Get More Badges</Text>
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
    badgeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        position: 'relative',
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
    badgeGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    badgeOption: {
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
    selectedBadge: {
        borderColor: '#3498DB',
        backgroundColor: '#EBF5FB',
        transform: [{ scale: 1.1 }],
        zIndex: 10,
    },
    badgeName: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 8,
        color: '#475569',
        fontWeight: '600',
    },
    noBadgeHint: {
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