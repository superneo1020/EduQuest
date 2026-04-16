import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

interface CommonAlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    type?: 'info' | 'success' | 'error' | 'warning';
}

export const CommonAlertModal: React.FC<CommonAlertModalProps> = ({
    visible,
    title,
    message,
    confirmText = 'OK',
    cancelText,
    onConfirm,
    onCancel,
    type = 'info'
}) => {
    const getConfirmButtonStyle = () => {
        switch (type) {
            case 'error':
                return styles.errorButton;
            case 'warning':
                return styles.warningButton;
            case 'success':
                return styles.successButton;
            default:
                return styles.infoButton;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>
                    <View style={styles.modalButtons}>
                        {cancelText && (
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.modalButton, getConfirmButtonStyle()]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// 簡化的 Alert 類函數
export const showAlert = (
    title: string,
    message: string,
    onConfirm?: () => void,
    options?: {
        confirmText?: string;
        type?: 'info' | 'success' | 'error' | 'warning';
    }
) => {
    // 這個函數需要在組件中使用，因為需要 state
    console.log('Alert:', { title, message, options });
    if (onConfirm) {
        onConfirm();
    }
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 300,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
    },
    infoButton: {
        backgroundColor: '#6C5CE7',
    },
    successButton: {
        backgroundColor: '#4CAF50',
    },
    warningButton: {
        backgroundColor: '#FF9800',
    },
    errorButton: {
        backgroundColor: '#FF4757',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});
