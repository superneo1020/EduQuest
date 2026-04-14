import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions
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
  GraduationCap
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

interface User {
  username: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setLoading(true);
      
      // 获取总用户数
      const totalUsersRes = await api.get('/api/admin/filter/user', { params: { page: 0, size: 1 } });
      const totalUsers = totalUsersRes.data.totalElements;

      // 获取活跃用户数
      const activeRes = await api.get('/api/admin/filter/user', { params: { isActive: true, page: 0, size: 1 } });
      const activeUsers = activeRes.data.totalElements;

      // 获取教育者数量 (educatorStatus APPROVED 且 isEducator true)
      const educatorRes = await api.get('/api/admin/filter/user', { params: { educatorStatus: 'APPROVED', page: 0, size: 1 } });
      const educators = educatorRes.data.totalElements;

      // 获取管理员数量 (roleId 假设为 ADMIN 的 roleId，需根据实际调整)
      const adminRes = await api.get('/api/admin/filter/user', { params: { roleId: 3, page: 0, size: 1 } }); // 假设 roleId=3 是 ADMIN
      const admins = adminRes.data.totalElements;

      // 获取待审批教师 (educatorStatus PENDING)
      const pendingRes = await api.get('/api/admin/filter/user', { params: { educatorStatus: 'PENDING', page: 0, size: 1 } });
      const pendingTeachers = pendingRes.data.totalElements;

      setStats({
        totalUsers,
        activeUsers,
        totalGamesPlayed: 0,
        totalMissionsCompleted: 0,
        totalSchools: 0,
        newUsersThisMonth: 0,
        pendingTeacherRequests: pendingTeachers,
        usersByRole: {
          admins,
          educators,
          students: totalUsers - admins - educators
        }
      });

      // 还可以获取最近注册的用户（分页取前5条）
      const recentUsersRes = await api.get('/api/admin/filter/user', { params: { page: 0, size: 5, sort: 'createdAt,desc' } });
      setRecentActivities(recentUsersRes.data.content.map((u: User) => ({
        type: 'USER_REGISTRATION',
        username: u.username,
        timestamp: u.createdAt,
      })));
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
    <ScrollView 
      style={styles.container}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
