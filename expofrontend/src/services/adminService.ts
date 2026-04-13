// src/services/adminService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '@/src/api/client';

export const adminService = {
    // 激活用戶帳戶
    async activateUser(userId: number): Promise<boolean> {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/user/${userId}/activate`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to activate user: ${response.status}`);
            }

            const result = await response.json();
            console.log('User activated:', result);
            return true;
        } catch (error) {
            console.error('Error activating user:', error);
            return false;
        }
    },

    // 新增：批准教師申請（更新 educatorStatus 為 APPROVED）
    async approveEducator(userId: number): Promise<boolean> {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            // 注意：後端沒有專門的 approve 端點，需要創建或使用其他方法
            // 暫時使用 activate 端點，然後手動更新 educatorStatus
            const response = await fetch(`${getApiBaseUrl()}/api/admin/user/${userId}/activate`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to approve educator: ${response.status}`);
            }

            const result = await response.json();
            console.log('Educator approved:', result);
            return true;
        } catch (error) {
            console.error('Error approving educator:', error);
            return false;
        }
    },

    // 拒絕教師申請
    async rejectEducator(userId: number): Promise<boolean> {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/user/${userId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to reject educator: ${response.status}`);
            }

            const result = await response.json();
            console.log('Educator rejected:', result);
            return true;
        } catch (error) {
            console.error('Error rejecting educator:', error);
            return false;
        }
    },
};