import { useState } from 'react';

interface AlertOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const useAlert = () => {
    const [alert, setAlert] = useState<AlertOptions | null>(null);

    const showAlert = (options: AlertOptions) => {
        setAlert(options);
    };

    const hideAlert = () => {
        setAlert(null);
    };

    // 簡化的方法
    const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
        showAlert({ title, message, type: 'success', onConfirm });
    };

    const showError = (title: string, message: string, onConfirm?: () => void) => {
        showAlert({ title, message, type: 'error', onConfirm });
    };

    const showWarning = (title: string, message: string, onConfirm?: () => void) => {
        showAlert({ title, message, type: 'warning', onConfirm });
    };

    const showInfo = (title: string, message: string, onConfirm?: () => void) => {
        showAlert({ title, message, type: 'info', onConfirm });
    };

    const showConfirm = (
        title: string,
        message: string,
        onConfirm: () => void,
        onCancel?: () => void,
        options?: { confirmText?: string; cancelText?: string }
    ) => {
        showAlert({
            title,
            message,
            type: 'warning',
            onConfirm,
            onCancel,
            confirmText: options?.confirmText || 'Confirm',
            cancelText: options?.cancelText || 'Cancel'
        });
    };

    return {
        alert,
        showAlert,
        hideAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm
    };
};
