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
  Gamepad2,
  GraduationCap
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalUsers: number;
  totalGames: number;          // 游戏数目
  totalStudents: number;
  totalEducators: number;
  pendingTeacherRequests: number;
}

const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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

      // 1. 总用户数
      const totalUsersRes = await api.get('/api/admin/filter/user', { params: { page: 0, size: 1 } });
      const totalUsers = totalUsersRes.data.totalElements;

      // 2. 游戏数目（假设后端提供 /api/admin/stats/games 或类似接口）
      // 这里使用 mock 或真实接口，若无则先设为 0
      let totalGames = 0;
      try {
        const gamesRes = await api.get('/api/admin/stats/games'); // 需后端实现
        totalGames = gamesRes.data.totalGames;
      } catch (e) {
        console.warn('Games stats API not implemented, using mock');
        totalGames = 0;
      }

      // 3. 教师数目（已审批的教师）
      const educatorRes = await api.get('/api/admin/filter/user', { params: { educatorStatus: 'APPROVED', page: 0, size: 1 } });
      const totalEducators = educatorRes.data.totalElements;

      // 4. 学生数目（非教师、非管理员的普通用户）
      // 方法：总用户 - 管理员 - 教师（假设管理员数量很少，可单独查询）
      const adminRes = await api.get('/api/admin/filter/user', { params: { roleId: 3, page: 0, size: 1 } });
      const admins = adminRes.data.totalElements;
      const totalStudents = totalUsers - admins - totalEducators;

      // 5. 待审批教师请求
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

        {/* Quick Actions - 移除 System Settings */}
        <View style={styles.quickActions}>
          <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/userManagement')} // 跳转到用户管理
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
              onPress={() => router.push('/admin/roleManagement')}
          >
            <Trophy size={20} color="#FFF" />
            <Text style={styles.actionText}>Role Management</Text>
          </TouchableOpacity>
        </View>

        {/* Core Stats Grid - 仅保留四个核心指标 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
                title="Total Users"
                value={stats?.totalUsers ?? 0}
                icon={Users}
                color="#9C27B0"
            />
            <StatCard
                title="Total Games"
                value={stats?.totalGames ?? 0}
                icon={Gamepad2}
                color="#2196F3"
            />
            <StatCard
                title="Students"
                value={stats?.totalStudents ?? 0}
                icon={Users}
                color="#4CAF50"
            />
            <StatCard
                title="Educators"
                value={stats?.totalEducators ?? 0}
                icon={GraduationCap}
                color="#FF9800"
                subtitle={`${stats?.pendingTeacherRequests ?? 0} pending`}
            />
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
    minWidth: width * 0.28,
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
});

export default AdminDashboard;