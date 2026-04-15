import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    TouchableOpacity
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { router } from 'expo-router';
import {
    Sparkles,
    LogOut
} from 'lucide-react-native';
import RoleManagement from './roleManagement'; // 引入角色管理组件

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // 管理员权限检查
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    useEffect(() => {
        // 模拟简单的加载延迟（实际 RoleManagement 内部也会加载数据）
        const timer = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = async () => {
        try {
            await router.replace('/Profile/Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (!isAdmin) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>You do not have admin permissions</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9C27B0" />
                <Text style={styles.loadingText}>Loading Admin Panel...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {/* 保留顶部管理员信息栏 */}
            <View style={styles.mainHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoIcon}>
                        <Sparkles size={20} color="white" fill="white" />
                    </View>
                    <Text style={styles.headerTitle}>EduQuest Admin</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.userInfoWrapper} onPress={() => router.push('/Profile/profile')}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarLetter}>{user?.username?.charAt(0).toUpperCase() || 'A'}</Text>
                        </View>
                        <View style={styles.userMeta}>
                            <Text style={styles.userNameText}>{user?.username || 'Admin'}</Text>
                            <Text style={styles.userRoleText}>Administrator</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <LogOut size={18} color="#FF4757" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 直接显示角色管理组件，不再显示其他内容 */}
            <View style={styles.roleManagementContainer}>
                <RoleManagement />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    mainHeader: {
        height: 70,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
        elevation: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#00A8E8',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00A8E8',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatarCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#00A8E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    userMeta: {
        marginLeft: 8,
    },
    userNameText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    userRoleText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
    },
    logoutBtn: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#FFF1F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleManagementContainer: {
        flex: 1,
        // 移除内边距，让 RoleManagement 自己控制边距
    },
    errorText: {
        fontSize: 18,
        color: '#F44336',
        textAlign: 'center',
        marginTop: 50,
    },
});

export default AdminDashboard;