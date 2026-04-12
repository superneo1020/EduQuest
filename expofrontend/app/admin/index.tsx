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
    Target,
    School,
    TrendingUp,
    Clock,
    Gamepad2,
    BookOpen,
    Activity,
    GraduationCap,
    LogOut,
    Sparkles
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalGamesPlayed: number;
    totalMissionsCompleted: number;
    totalSchools: number;
    newUsersThisMonth: number;
    pendingTeacherRequests: number;
    usersByRole: {
        admins: number;
        educators: number;
        students: number;
    };
}

interface RecentActivity {
    type: string;
    username: string;
    gameName?: string;
    missionName?: string;
    score?: number;
    timestamp: string;
}

const AdminDashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
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
            // Since we don't have admin-specific APIs, we'll use existing user APIs
            // and simulate admin dashboard data

            // Fetch basic user info to demonstrate admin access
            const userInfo = await api.get('/api/user/');
            console.log('Admin user info:', userInfo.data);

            // Mock dashboard stats (in real implementation, these would come from admin APIs)
            const mockStats: DashboardStats = {
                totalUsers: 150,
                activeUsers: 120,
                totalGamesPlayed: 2500,
                totalMissionsCompleted: 800,
                totalSchools: 5,
                newUsersThisMonth: 15,
                pendingTeacherRequests: 3,
                usersByRole: {
                    admins: 3,
                    educators: 12,
                    students: 135
                }
            };

            // Mock recent activities
            const mockActivities: RecentActivity[] = [
                {
                    type: 'GAME_SCORE',
                    username: 'student1',
                    gameName: 'Math Challenge',
                    score: 95,
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'MISSION_COMPLETION',
                    username: 'student2',
                    missionName: 'Daily Reader',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    type: 'USER_REGISTRATION',
                    username: 'newStudent',
                    timestamp: new Date(Date.now() - 7200000).toISOString()
                }
            ];

            setStats(mockStats);
            setRecentActivities(mockActivities);
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

    const StatCard = ({
                          title,
                          value,
                          icon: Icon,
                          color,
                          subtitle
                      }: {
        title: string;
        value: string | number;
        icon: any;
        color: string;
        subtitle?: string;
    }) => (
        <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statHeader}>
                <Icon size={24} color={color} />
                <Text style={styles.statTitle}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </TouchableOpacity>
    );

    const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
        const getActivityIcon = () => {
            switch (activity.type) {
                case 'GAME_SCORE': return <Gamepad2 size={16} color="#4CAF50" />;
                case 'MISSION_COMPLETION': return <BookOpen size={16} color="#2196F3" />;
                case 'USER_REGISTRATION': return <Users size={16} color="#FF9800" />;
                default: return <Activity size={16} color="#757575" />;
            }
        };

        const getActivityText = () => {
            switch (activity.type) {
                case 'GAME_SCORE':
                    return `${activity.username} scored ${activity.score} in ${activity.gameName}`;
                case 'MISSION_COMPLETION':
                    return `${activity.username} completed mission: ${activity.missionName}`;
                case 'USER_REGISTRATION':
                    return `${activity.username} joined the platform`;
                default:
                    return `${activity.username} performed an action`;
            }
        };

        return (
            <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                    {getActivityIcon()}
                </View>
                <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{getActivityText()}</Text>
                    <Text style={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleString()}
                    </Text>
                </View>
            </View>
        );
    };

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

            {/* Professional Header */}
            <View style={styles.mainHeader}>
                {/* Left side - Logo and Title */}
                <View style={styles.headerLeft}>
                    <View style={styles.logoIcon}>
                        <Sparkles size={20} color="white" fill="white" />
                    </View>
                    <Text style={styles.headerTitle}>EduQuest Admin</Text>
                </View>

                {/* Right side - User Info and Logout */}
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.userInfoWrapper}
                        onPress={() => router.push('/Profile/profile')}
                    >
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarLetter}>
                                {user?.username?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                        </View>
                        <View style={styles.userMeta}>
                            <Text style={styles.userNameText}>{user?.username || 'Admin'}</Text>
                            <Text style={styles.userRoleText}>Administrator</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                    >
                        <LogOut size={18} color="#FF4757" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Admin Dashboard</Text>
                    <Text style={styles.subtitle}>Welcome, {user?.username}</Text>
                </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {/* Navigate to user management */}}
                >
                    <Users size={20} color="#FFF" />
                    <Text style={styles.actionText}>User Management</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/admin/teacherRequests')}
                >
                    <GraduationCap size={20} color="#FFF" />
                    <Text style={styles.actionText}>Teacher Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {/* Navigate to role management */}}
                >
                    <Trophy size={20} color="#FFF" />
                    <Text style={styles.actionText}>Role Management</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {/* Navigate to system settings */}}
                >
                    <School size={20} color="#FFF" />
                    <Text style={styles.actionText}>System Settings</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>System Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers ?? 0}
                        icon={Users}
                        color="#9C27B0"
                        subtitle={`${stats?.newUsersThisMonth ?? 0} new this month`}
                    />

                    <StatCard
                        title="Active Users"
                        value={stats?.activeUsers ?? 0}
                        icon={Activity}
                        color="#4CAF50"
                    />

                    <StatCard
                        title="Games Played"
                        value={stats?.totalGamesPlayed ?? 0}
                        icon={Gamepad2}
                        color="#2196F3"
                    />

                    <StatCard
                        title="Missions Completed"
                        value={stats?.totalMissionsCompleted ?? 0}
                        icon={Target}
                        color="#FF9800"
                    />

                    <StatCard
                        title="Total Schools"
                        value={stats?.totalSchools ?? 0}
                        icon={School}
                        color="#607D8B"
                    />

                    <StatCard
                        title="New This Month"
                        value={stats?.newUsersThisMonth ?? 0}
                        icon={TrendingUp}
                        color="#00BCD4"
                    />

                    <StatCard
                        title="Teacher Requests"
                        value={stats?.pendingTeacherRequests ?? 0}
                        icon={GraduationCap}
                        color="#FF9800"
                        subtitle="Pending approval"
                    />
                </View>
            </View>

            {/* User Roles Distribution */}
            <View style={styles.rolesSection}>
                <Text style={styles.sectionTitle}>User Roles Distribution</Text>
                <View style={styles.rolesContainer}>
                    <View style={styles.roleItem}>
                        <View style={[styles.roleIndicator, { backgroundColor: '#9C27B0' }]} />
                        <Text style={styles.roleLabel}>Admins</Text>
                        <Text style={styles.roleCount}>{stats?.usersByRole.admins}</Text>
                    </View>

                    <View style={styles.roleItem}>
                        <View style={[styles.roleIndicator, { backgroundColor: '#2196F3' }]} />
                        <Text style={styles.roleLabel}>Educators</Text>
                        <Text style={styles.roleCount}>{stats?.usersByRole.educators}</Text>
                    </View>

                    <View style={styles.roleItem}>
                        <View style={[styles.roleIndicator, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.roleLabel}>Students</Text>
                        <Text style={styles.roleCount}>{stats?.usersByRole.students}</Text>
                    </View>
                </View>
            </View>

            {/* Recent Activities */}
            <View style={styles.activitiesSection}>
                <Text style={styles.sectionTitle}>Recent Activities</Text>
                <View style={styles.activitiesContainer}>
                    {recentActivities.map((activity, index) => (
                        <ActivityItem key={index} activity={activity} />
                    ))}
                </View>
            </View>
            </ScrollView>
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
        zIndex: 100,
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
    contentContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        flexWrap: 'wrap',
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#9C27B0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: width * 0.22,
        marginBottom: 8,
    },
    actionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statsSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statTitle: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#999',
    },
    rolesSection: {
        padding: 20,
        backgroundColor: '#FFF',
        marginTop: 10,
    },
    rolesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    roleItem: {
        alignItems: 'center',
    },
    roleIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    roleLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    roleCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    activitiesSection: {
        padding: 20,
        backgroundColor: '#FFF',
        marginTop: 10,
        marginBottom: 20,
    },
    activitiesContainer: {
        marginTop: 12,
    },
    activityItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: '#999',
    },
});

export default AdminDashboard;
