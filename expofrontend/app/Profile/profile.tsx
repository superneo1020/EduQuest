import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Dimensions
} from 'react-native';
import {
    Trophy,
    Gamepad2,
    Mail,
    User as UserIcon,
    Settings,
    ChevronRight,
    LogOut,
    History,
    ShieldCheck
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';

const { width } = Dimensions.get('window');

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
            <StatusBar barStyle="light-content" />

            {/* 頂部綠色背景裝飾 */}
            <View style={styles.topBanner} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Settings size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. 用戶頭像與基本資訊 */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <UserIcon size={45} color="#4CAF50" />
                        </View>

                    </View>

                    <Text style={styles.userName}>{user?.username || 'Guest Learner'}</Text>
                    <View style={styles.emailBadge}>
                        <Mail size={12} color="#636E72" />
                        <Text style={styles.emailText}>{user?.email || 'learner@eduquest.com'}</Text>
                    </View>
                </View>

                {/* 2. 數據統計卡片 */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#FFF9E6', borderColor: '#FFEAA7' }]}>
                        <Trophy size={24} color="#F1C40F" />
                        <Text style={styles.statNumber}>{user?.points ?? 0}</Text>
                        <Text style={styles.statTitle}>Total Points</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
                        <Gamepad2 size={24} color="#4CAF50" />
                        <Text style={styles.statNumber}>-</Text>
                        <Text style={styles.statTitle}>Games</Text>
                    </View>
                </View>

                {/* 3. 功能清單 */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Account Settings</Text>
                    <View style={styles.menuList}>
                        <MenuButton
                            icon={<History size={20} color="#4CAF50" />}
                            label="Point History"
                            onPress={() => router.push('/Profile/history')}
                        />
                        <MenuButton
                            icon={<UserIcon size={20} color="#2196F3" />}
                            label="Edit Profile"
                        />
                    </View>

                    <Text style={[styles.menuSectionTitle, { marginTop: 25 }]}>App Preferences</Text>
                    <View style={styles.menuList}>
                        <MenuButton
                            icon={<LogOut size={20} color="#FF4757" />}
                            label="Sign Out"
                            onPress={handleLogout}
                            isLast
                            color="#FF4757"
                        />
                    </View>
                </View>

                <Text style={styles.versionText}>EduQuest Version 1.1.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

// 抽離選單按鈕組件提升代碼整潔度
const MenuButton = ({ icon, label, onPress, isLast, color = "#2D3436" }: any) => (
    <TouchableOpacity
        style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]}
        onPress={onPress}
    >
        <View style={styles.menuLeft}>
            <View style={styles.iconWrapper}>{icon}</View>
            <Text style={[styles.menuText, { color }]}>{label}</Text>
        </View>
        <ChevronRight size={18} color="#BDC3C7" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    topBanner: {
        position: 'absolute',
        top: 0,
        width: width,
        height: 200,
        backgroundColor: '#4CAF50',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    settingsBtn: { position: 'absolute', right: 20 },
    scrollContent: { paddingBottom: 40 },

    // 用戶資訊卡片
    profileHeader: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    avatarContainer: { marginBottom: 15 },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F8E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    levelBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFA000',
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF'
    },
    levelText: { color: '#FFF', fontSize: 10, fontWeight: '800', marginLeft: 3 },
    userName: { fontSize: 24, fontWeight: '800', color: '#2D3436' },
    emailBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    emailText: { fontSize: 14, color: '#636E72', marginLeft: 5 },

    // 統計區
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20
    },
    statCard: {
        width: '47%',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
    },
    statNumber: { fontSize: 22, fontWeight: '800', color: '#2D3436', marginTop: 10 },
    statTitle: { fontSize: 12, color: '#636E72', fontWeight: '600', marginTop: 2 },

    // 選單區
    menuSection: { paddingHorizontal: 20, marginTop: 30 },
    menuSectionTitle: { fontSize: 14, fontWeight: '700', color: '#A0A0A0', marginBottom: 12, marginLeft: 5 },
    menuList: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden' },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    iconWrapper: { width: 35, alignItems: 'center' },
    menuText: { fontSize: 16, fontWeight: '600', marginLeft: 10 },
    versionText: { textAlign: 'center', color: '#BDC3C7', fontSize: 12, marginTop: 40 }
});