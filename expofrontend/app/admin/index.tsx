import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { router } from 'expo-router';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import {
    Users,
    Trophy,
    Gamepad2,
    GraduationCap,
    LogOut,
    Sparkles
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DashboardStats {
    totalUsers: number;
    totalGames: number;
    totalStudents: number;
    totalEducators: number;
    pendingTeacherRequests: number;
}

const AdminDashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleLogout = async () => {
        try {
            await router.replace('/Profile/Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const api = axios.create({
        baseURL: getApiBaseUrl(),
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 实际 API 调用，同 adminDashboard.tsx
            const totalUsersRes = await api.get('/api/admin/filter/user', { params: { page: 0, size: 1 } });
            const totalUsers = totalUsersRes.data.totalElements;

            let totalGames = 0;
            try {
                const gamesRes = await api.get('/api/admin/stats/games');
                totalGames = gamesRes.data.totalGames;
            } catch (e) {
                console.warn('Games API not available');
            }

            const educatorRes = await api.get('/api/admin/filter/user', { params: { educatorStatus: 'APPROVED', page: 0, size: 1 } });
            const totalEducators = educatorRes.data.totalElements;

            const adminRes = await api.get('/api/admin/filter/user', { params: { roleId: 3, page: 0, size: 1 } });
            const admins = adminRes.data.totalElements;
            const totalStudents = totalUsers - admins - totalEducators;

            const pendingRes = await api.get('/api/admin/filter/user', { params: { educatorStatus: 'PENDING', page: 0, size: 1 } });
            const pendingTeachers = pendingRes.data.totalElements;

            setStats({
                totalUsers,
                totalGames,
                totalStudents,
                totalEducators,
                pendingTeacherRequests: pendingTeachers,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
        <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statHeader}>
                <Icon size={24} color={color} />
                <Text style={styles.statTitle}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9C27B0" />
                <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
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

            <ScrollView
                style={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Admin Dashboard</Text>
                    <Text style={styles.subtitle}>Welcome, {user?.username}</Text>
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/admin/userManagement')}>
                        <Users size={20} color="#FFF" />
                        <Text style={styles.actionText}>User Management</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/admin/teacherRequests')}>
                        <GraduationCap size={20} color="#FFF" />
                        <Text style={styles.actionText}>Teacher Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/admin/roleManagement')}>
                        <Trophy size={20} color="#FFF" />
                        <Text style={styles.actionText}>Role Management</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>System Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="#9C27B0" />
                        <StatCard title="Total Games" value={stats?.totalGames ?? 0} icon={Gamepad2} color="#2196F3" />
                        <StatCard title="Students" value={stats?.totalStudents ?? 0} icon={Users} color="#4CAF50" />
                        <StatCard title="Educators" value={stats?.totalEducators ?? 0} icon={GraduationCap} color="#FF9800"
                                  subtitle={`${stats?.pendingTeacherRequests ?? 0} pending`} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    mainHeader: { height: 70, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F2F6', elevation: 4 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 32, height: 32, backgroundColor: '#00A8E8', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#00A8E8' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    userInfoWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 25, borderWidth: 1, borderColor: '#E2E8F0' },
    avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#00A8E8', justifyContent: 'center', alignItems: 'center' },
    avatarLetter: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    userMeta: { marginLeft: 8 },
    userNameText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    userRoleText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
    logoutBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center' },
    contentContainer: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#666' },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', flexWrap: 'wrap' },
    actionButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#9C27B0', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, minWidth: width * 0.28, marginBottom: 8 },
    actionText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
    statsSection: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    statTitle: { fontSize: 14, color: '#666', marginLeft: 8, flex: 1 },
    statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    statSubtitle: { fontSize: 12, color: '#999' },
});

export default AdminDashboard;