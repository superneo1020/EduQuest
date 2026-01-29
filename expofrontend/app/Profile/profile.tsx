import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ActivityIndicator
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
    Calculator,
    BookOpen,
    Brain,
    FlaskConical
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const { user, token, signOut } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // 每次回到此頁面時，重新抓取後端 UserService.showProfile 的真實資料
    useFocusEffect(
        useCallback(() => {
            const fetchLatestProfile = async () => {
                if (!token) return;
                try {
                    setLoading(true);
                    const response = await axios.get(`${getApiBaseUrl()}/api/user/profile?page=0`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log("response.data", response.data);
                    // 對應後端 UserProfileDto
                    setProfileData(response.data);
                } catch (error) {
                    console.error("無法獲取最新資料，將顯示快取或預設值", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchLatestProfile();
        }, [token])
    );

    // 資料來源優先級：1. API 即時資料 > 2. AuthContext 快取資料 > 3. 預設值
    const displayUser = profileData ? { ...user, ...profileData } : user;
    const totalPoints = typeof displayUser?.points === 'number' ? displayUser.points : 0;
    const totalGames = typeof displayUser?.totalItems === 'number' ? displayUser.totalItems : 0;
    const gameHistory = displayUser?.userGameScores || [];

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/Profile/Login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const renderGameIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'MATH': return <Calculator size={20} color="#4CAF50" />;
            case 'ENGLISH': return <BookOpen size={20} color="#2196F3" />;
            case 'SCIENCE': return <FlaskConical size={20} color="#FF9800" />;
            case 'MEMORY': return <Brain size={20} color="#9C27B0" />;
            default: return <Gamepad2 size={20} color="#636E72" />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.topBanner} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Student Profile</Text>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Settings size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* 1. 用戶資訊卡片 */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarCircle}>
                        <UserIcon size={45} color="#4CAF50" />
                    </View>
                    <Text style={styles.userName}>{displayUser?.username || 'Learner'}</Text>
                    <View style={styles.emailBadge}>
                        <Mail size={12} color="#636E72" />
                        <Text style={styles.emailText}>{displayUser?.email || 'N/A'}</Text>
                    </View>
                </View>

                {/* 2. 統計數據 */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#FFF9E6', borderColor: '#FFEAA7' }]}>
                        <Trophy size={24} color="#F1C40F" />
                        <Text style={styles.statNumber}>{totalPoints}</Text>
                        <Text style={styles.statTitle}>Total Points</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
                        <Gamepad2 size={24} color="#4CAF50" />
                        <Text style={styles.statNumber}>{totalGames}</Text>
                        <Text style={styles.statTitle}>Games Played</Text>
                    </View>
                </View>

                {/* 3. 最近成就列表 (對應 UserGameScore 模型) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.menuSectionTitle}>Recent Achievements</Text>
                    {loading && <ActivityIndicator size="small" color="#4CAF50" />}
                </View>

                <View style={styles.activityList}>
                    {gameHistory.length > 0 ? (
                        gameHistory.slice(0, 5).map((record: any, index: number) => (
                            <View key={index} style={[styles.activityCard, index === 0 && { borderTopWidth: 0 }]}>
                                <View style={styles.gameIconBg}>
                                    {renderGameIcon(record.gameType)}
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.activityName}>{record.gameName}</Text>
                                    <View style={styles.row}>
                                        <Text style={styles.activityDifficulty}>{record.gameDifficulty}</Text>
                                        <Text style={styles.dot}> • </Text>
                                        <Text style={styles.activityDate}>
                                            {new Date(record.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.scoreContainer}>
                                    <Text style={styles.activityScore}>+{record.points} XP</Text>
                                    <Text style={styles.activityScoreValue}>Score: {record.scores}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No games recorded yet.</Text>
                        </View>
                    )}
                </View>

                {/* 4. 選單部分 */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Settings & Account</Text>
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

                <Text style={styles.versionText}>EduQuest v1.1.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const MenuButton = ({ icon, label, onPress, isLast, color = "#2D3436" }: any) => (
    <TouchableOpacity style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
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
        height: 180,
        backgroundColor: '#4CAF50',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    settingsBtn: { position: 'absolute', right: 20 },
    scrollContent: { paddingBottom: 40 },
    profileHeader: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 24,
        padding: 25,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
    },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F8E9',
        justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF', marginBottom: 12
    },
    userName: { fontSize: 22, fontWeight: '900', color: '#2D3436' },
    emailBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    emailText: { fontSize: 14, color: '#636E72', marginLeft: 5 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
    statCard: { width: '47%', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
    statNumber: { fontSize: 20, fontWeight: '900', color: '#2D3436', marginTop: 8 },
    statTitle: { fontSize: 11, color: '#636E72', fontWeight: '700', marginTop: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 25 },
    menuSectionTitle: { fontSize: 13, fontWeight: '800', color: '#A0A0A0', marginBottom: 12, marginLeft: 25, marginTop: 25, textTransform: 'uppercase' },
    activityList: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 24, paddingHorizontal: 15, elevation: 2 },
    activityCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F1F2F6' },
    gameIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F2F6' },
    activityName: { fontSize: 15, fontWeight: '800', color: '#2D3436' },
    row: { flexDirection: 'row', alignItems: 'center' },
    activityDifficulty: { fontSize: 11, color: '#4CAF50', fontWeight: '700' },
    dot: { color: '#BDC3C7' },
    activityDate: { fontSize: 11, color: '#A0A0A0' },
    scoreContainer: { alignItems: 'flex-end' },
    activityScore: { fontSize: 16, fontWeight: '900', color: '#4CAF50' },
    activityScoreValue: { fontSize: 10, color: '#636E72', fontWeight: '600' },
    menuSection: { paddingHorizontal: 20 },
    menuList: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F2F6' },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    iconWrapper: { width: 30, alignItems: 'center' },
    menuText: { fontSize: 15, fontWeight: '700', marginLeft: 10 },
    versionText: { textAlign: 'center', color: '#BDC3C7', fontSize: 11, marginTop: 30 },
    emptyState: { padding: 30, alignItems: 'center' },
    emptyText: { color: '#BDC3C7', fontWeight: '600' }
});