import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Platform
} from 'react-native';
import {
    Trophy,
    Award,
    Target,
    Mail,
    User as UserIcon,
    Settings,
    ChevronRight,
    LogOut,
    History // 引入歷史圖標
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/Profile/Login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Settings size={22} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. 用戶資訊：現在會顯示資料庫的真實數據 */}
                <View style={styles.profileCard}>
                    <Text style={styles.userName}>
                        {user?.username || 'Learner'}
                    </Text>

                    <View style={styles.emailBadge}>
                        <Mail size={14} color="#666" />
                        <Text style={styles.emailText}>
                            {user?.email || 'No email set'}
                        </Text>
                    </View>
                </View>

                {/* 2. 學習統計：連結 point_history 與 points 欄位 */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Learning Statistics</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Trophy size={24} color="#FFD700" />
                            {/* 顯示資料庫中的 points 欄位 */}
                            <Text style={styles.statValue}>{user?.points ?? 0}</Text>
                            <Text style={styles.statLabel}>Total Points</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Target size={24} color="#4CAF50" />
                            {/* 這裡未來可以透過 API 獲取 game_play_history 的次數 */}
                            <Text style={styles.statValue}>-</Text>
                            <Text style={styles.statLabel}>Games Played</Text>
                        </View>
                    </View>
                </View>

                {/* 3. 功能選單 */}
                <View style={styles.menuContainer}>
                    {/* 點擊前往積分明細 (對應 point_history 表) */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/Profile/history')}
                    >
                        <View style={styles.menuLeft}>
                            <History size={20} color="#555" />
                            <Text style={styles.menuText}>Point History</Text>
                        </View>
                        <ChevronRight size={18} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <UserIcon size={20} color="#555" />
                            <Text style={styles.menuText}>Edit Profile</Text>
                        </View>
                        <ChevronRight size={18} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={styles.menuLeft}>
                            <LogOut size={20} color="#FF4757" />
                            <Text style={[styles.menuText, { color: '#FF4757' }]}>Sign Out</Text>
                        </View>
                        <ChevronRight size={18} color="#CCC" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>EduQuest v1.1.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        height: 60,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    iconBtn: {
        position: 'absolute',
        right: 15,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    // 用戶卡片樣式
    profileCard: {
        backgroundColor: '#FFF',
        paddingVertical: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 }
        }),
    },
    avatarWrapper: {
        marginBottom: 15,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        elevation: 2,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    emailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F2F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
    },
    emailText: {
        fontSize: 14,
        color: '#636E72',
        marginLeft: 6,
    },
    // 統計區樣式
    sectionCard: {
        backgroundColor: '#FFF',
        margin: 20,
        padding: 20,
        borderRadius: 20,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statBox: {
        width: '48%',
        backgroundColor: '#FAFAFA',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 15,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#95A5A6',
        marginTop: 2,
    },
    // 選單列表樣式
    menuContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 20,
        paddingVertical: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F9FA',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3436',
        marginLeft: 12,
    },
    versionText: {
        textAlign: 'center',
        color: '#BDC3C7',
        fontSize: 12,
        marginTop: 20,
    }
});