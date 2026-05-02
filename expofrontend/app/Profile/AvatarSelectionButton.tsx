import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AvatarSelector, renderAvatar } from './AvatarSelector';

interface AvatarSelectionButtonProps {
    selectedAvatar: string;
    onSelect: (avatarId: string) => void;
    size?: number;
    userItems?: any[];
}

export const AvatarSelectionButton: React.FC<AvatarSelectionButtonProps> = ({
    selectedAvatar,
    onSelect,
    size = 50,
    userItems = []
}) => {
    const [showModal, setShowModal] = React.useState(false);
    const router = useRouter();

    const handleGoToShop = () => {
        setShowModal(false);
        router.push('/shop');
    };

    return (
        <>
            <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setShowModal(true)}
            >
                {renderAvatar(selectedAvatar, size)}
                <Text style={styles.changeText}>Change Avatar</Text>
            </TouchableOpacity>
            
            <AvatarSelector
                visible={showModal}
                selectedAvatar={selectedAvatar}
                onSelect={(avatarId) => {
                    onSelect(avatarId);
                    setShowModal(false);
                }}
                onClose={() => setShowModal(false)}
                userItems={userItems}
                onGoToShop={handleGoToShop}
            />
        </>
    );
};

const styles = StyleSheet.create({
    avatarButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    changeText: {
        fontSize: 12,
        color: '#3498DB',
        marginTop: 5,
        fontWeight: '500',
    },
});
