import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    useWindowDimensions,
    SafeAreaView,
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    Modal,
    Image
} from 'react-native';
import {
    Calculator,
    Languages,
    Atom,
    Brain,
    LogOut,
    User,
    Trophy,
    Clock,
    Target,
    Sparkles,
    Star,
    Zap,
    GraduationCap,
    Rocket,
    ShoppingCart,
    Users,
    BookOpen
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import { renderAvatar, avatarOptions } from "@/app/Profile/AvatarSelector";
import { badgeIconNameMapping } from "@/app/Profile/BadgeSelector";

import {Bot} from "lucide-react-native/icons";

export default function LandscapeOptimizedHome() {
    const router = useRouter();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { width, height } = useWindowDimensions();

    const { token, loading, signOut, user } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [selectedAvatar, setSelectedAvatar] = useState<string>('default');
    const [userItems, setUserItems] = useState<any[]>([]);

    // 獲取用戶資料和 avatar
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!token || !user) {
                console.log('No token or user available, skipping profile fetch');
                return;
            }
            
            try {
                console.log('Fetching user profile with token:', token.substring(0, 20) + '...');
                
                // 獲取用戶資料 - 使用正確的API端點
                const profileResponse = await axios.get(`${getApiBaseUrl()}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Profile response:', profileResponse.data);
                setProfileData(profileResponse.data);

                // 獲取用戶物品
                try {
                    const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const rawItems = itemsResponse.data?.items || itemsResponse.data || [];
                    const userItemsList = Array.isArray(rawItems) ? rawItems : [];
                    setUserItems(userItemsList);

                    // 獲取裝備的 avatar
                    const equippedAvatarId = profileResponse.data?.equipped_items?.AVATAR
                        || profileResponse.data?.equippedItems?.AVATAR;
                    
                    if (equippedAvatarId) {
                        const equippedItem = userItemsList.find((item: any) => {
                            const itemData = item.item || item;
                            return itemData.id === equippedAvatarId || itemData.itemId === equippedAvatarId;
                        });
                        
                        if (equippedItem) {
                            const itemData = equippedItem.item || equippedItem;
                            if (itemData.icon) {
                                setSelectedAvatar(itemData.icon);
                            }
                        }
                    } else {
                        setSelectedAvatar('default');
                    }
                } catch (itemsError) {
                    console.warn('Failed to fetch user items:', itemsError);
                    setUserItems([]);
                    setSelectedAvatar('default');
                }
            } catch (error: any) {
                console.error('Failed to fetch user profile:', error);
                
                // 如果是401錯誤，使用已存的用戶數據而不是登出
                if (error.response?.status === 401) {
                    console.log('Profile endpoint not accessible, using stored user data');
                    setProfileData(user);
                    setSelectedAvatar('default');
                    return;
                }
                
                // 如果是404，嘗試使用用戶登錄時的基本信息
                if (error.response?.status === 404) {
                    console.log('Profile endpoint not found, using basic user data');
                    setProfileData(user);
                    setSelectedAvatar('default');
                    return;
                }
                
                // 其他錯誤也使用基本用戶數據
                console.log('Using fallback user data due to API error');
                setProfileData(user);
                setSelectedAvatar('default');
            }
        };

        fetchUserProfile();
    }, [token, user]);

    // Debug: 檢查用戶角色數據
    console.log('User data:', user);
    console.log('User roles:', user?.roles);
    console.log('Is teacher:', user?.roles?.includes('teacher'));

    // 替換現有的 onPress 邏輯
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = async () => {
        try {
            await signOut();
            router.replace('/Profile/Login');
        } catch (error) {
            console.error("Logout Error:", error);
        }
        setShowLogoutModal(false);
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    useEffect(() => {

        if (!loading && !token) {
            router.replace('/Profile/Login');
        }
    }, [token, loading, router]);


    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }


    const isLandscape = width > height;

    const gameButtons = [
        { id: 1, title: 'Math', icon: Calculator, color: '#4CAF50', route: '/games/math/math', pos: { x: '20%', y: '25%' } },
        { id: 2, title: 'Language', icon: BookOpen, color: '#2196F3', route: '/games/english/language', pos: { x: '70%', y: '20%' } },
        { id: 3, title: 'Science', icon: Atom, color: '#FF9800', route: '/games/science', pos: { x: '25%', y: '65%' } },
        { id: 4, title: 'Chinese', icon: Languages, color: '#9C27B0', route: '/games/chinese/chinese', pos: { x: '75%', y: '60%' } },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* --- 美化後的 Header --- */}
            {/* --- 仿圖片風格的 Header --- */}
            {/* --- 仿圖片風格極簡 Header (移除 Online 狀態) --- */}
            <View style={styles.header}>
                {/* 左側：Logo 與 名稱 */}
                <View style={styles.headerLeft}>
                    <View style={styles.logoIcon}>
                        <Image 
                            source={require('../assets/images/icon/EduQuest_icon.png')} 
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.headerTitle}>EduQuest</Text>
                </View>

                {/* 中間：導航文字 (保留排行榜跳轉功能) */}


                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.userInfoWrapper}
                        onPress={() => router.push('/Profile/profile' as any)}
                    >
                        <View style={styles.avatarCircle}>
                            {renderAvatar(selectedAvatar, 34)}
                        </View>
                        <View style={styles.userMeta}>
                            <Text style={styles.userNameText}>{profileData?.nickname || user?.username || 'Guest'}</Text>
                            <Text style={styles.userRoleText}>{user?.roles?.some((role: string) => role === 'ROLE_EDUCATOR' || role === 'EDUCATOR' || role === 'teacher') ? 'Teacher' : 'Student'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* 新增的教师页面按钮 */}
                    {/* 新增的教师页面按钮 - 只对教师身份显示 */}
                    {user?.roles?.some((role: string) => role === 'ROLE_EDUCATOR' || role === 'EDUCATOR' || role === 'teacher') && (
                        <TouchableOpacity
                            style={styles.teacherBtn}
                            onPress={() => router.push('/teacher/teacher' as any)}
                        >
                            <GraduationCap size={22} color="#6C5CE7" />
                            <Text style={styles.teacherText}>Teacher</Text>
                        </TouchableOpacity>
                    )}

                    {/* 新增的学生班级按钮 - 只对学生身份显示 */}
                    {!user?.roles?.some((role: string) => role === 'ROLE_EDUCATOR' || role === 'EDUCATOR' || role === 'teacher') && (
                        <TouchableOpacity
                            style={styles.studentClassBtn}
                            onPress={() => router.push('/student/StudentClasses' as any)}
                        >
                            <Users size={22} color="#4CAF50" />
                            <Text style={styles.studentClassText}>My Classes</Text>
                        </TouchableOpacity>
                    )}



                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => router.push('/rank/leaderboard' as any)}
                    >
                        <Trophy size={26} color="#2D3436" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => router.push('/shop/shopScreen' as any)}
                    >
                        <ShoppingCart size={26} color="#2D3436" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                    >
                        <LogOut size={22} color="#FF4757" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 主內容區 */}
            <View style={[styles.mainContent, isLandscape ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>

                {/* 地圖區域 */}
                <View style={styles.mapSection}>
                    <ImageBackground
                        source={require('../assets/images/map.jpg')}
                        style={styles.mapImage}
                        resizeMode="cover"
                    >
                        {gameButtons.map((button) => {
                            const IconComponent = button.icon;
                            return (
                                <TouchableOpacity
                                    key={button.id}
                                    style={[
                                        styles.gameButton,
                                        { backgroundColor: button.color, left: button.pos.x as any, top: button.pos.y as any }
                                    ]}
                                    onPress={() => router.push(button.route as any)}
                                >
                                    <IconComponent size={30} color="white" />
                                    <Text style={styles.buttonText}>{button.title}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* --- 獨立的懸浮 Chatbot 按鈕 --- */}
                        <TouchableOpacity
                            style={styles.floatingChatBtn}
                            onPress={() => router.push('/games/chatbot' as any)}
                        >
                            <Bot size={32} color="white" />
                            <View style={styles.chatBadge}>
                                <Sparkles size={10} color="white" fill="white" />
                            </View>
                        </TouchableOpacity>
                    </ImageBackground>
                </View>

                {/* 右側面板 */}
                <View style={[styles.sidePanel, isLandscape ? { width: 280 } : { height: 'auto', marginTop: 10 }]}>
                    <Text style={styles.panelTitle}>Progress</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.miniStat}>
                            <Trophy size={24} color="#FFD700" />
                            <Text style={styles.statVal}>
                                {String(profileData?.points ?? user?.points ?? 0)}
                            </Text>
                        </View>

                    </View>

                    <View style={styles.divider} />

                    {/*<Text style={styles.panelTitle}>Missions</Text>*/}
                    {/*<TouchableOpacity */}
                    {/*    style={styles.questCard} */}
                    {/*    activeOpacity={0.8}*/}
                    {/*    onPress={() => router.push('/mission/missionScreen' as any)}*/}
                    {/*>*/}
                    {/*    <Rocket size={28} color="#FF4757" />*/}
                    {/*    <View style={{marginLeft: 15, flex: 1}}>*/}
                    {/*        <Text style={styles.questTitle}>View Missions</Text>*/}
                    {/*        <Text style={styles.questSub}>Complete quests for rewards</Text>*/}
                    {/*    </View>*/}
                    {/*</TouchableOpacity>*/}
                </View>
            </View>
            {/* Logout Confirmation Modal */}
            <Modal
                visible={showLogoutModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelLogout}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>Logout</Text>
                        <Text style={styles.confirmMessage}>Are you sure you want to logout?</Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={handleCancelLogout}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.logoutButton]}
                                onPress={handleConfirmLogout}
                            >
                                <Text style={styles.logoutButtonText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    // Header 執美與字體加大
    header: {
        height: 70, // 增加高度
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
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoImage: {
        width: 150,
        height: 150,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00A8E8',
    },
    headerCenter: {
        flexDirection: 'row',
        gap: 40,
    },
    navBtn: { paddingVertical: 10 },
    navText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
    navTextActive: { fontSize: 15, color: '#64748B', fontWeight: '500' }, // 圖片中 Home 是普通色
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    userMeta: {
        marginLeft: 10,
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
    logoutIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF1F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F2F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 15,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    userTagText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#636E72',
    },

    headerIconBtn: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
    },
    logoutText: {
        color: '#FF4757',
        fontWeight: '800',
        fontSize: 16,
        marginLeft: 6,
    },
    // 新增教师按钮样式
    teacherBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#F0E6FF',
        borderRadius: 12,
    },
    teacherText: {
        color: '#6C5CE7',
        fontWeight: '800',
        fontSize: 16,
        marginLeft: 6,
    },
    // 新增学生班级按钮样式
    studentClassBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginLeft: 6,
        backgroundColor: '#E8F5E8',
        borderRadius: 12,
    },
    studentClassText: {
        color: '#4CAF50',
        fontWeight: '800',
        fontSize: 16,
        marginLeft: 6,
    },
    mainContent: {
        flex: 1,
    },
    mapSection: {
        flex: 1,
        backgroundColor: '#ddd',
        overflow: 'hidden',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    sidePanel: {
        backgroundColor: 'white',
        padding: 20,
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
    },
    panelTitle: {
        fontSize: 20, // 字體加大
        fontWeight: '800',
        marginBottom: 15,
        color: '#2D3436',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    miniStat: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 15,
        width: '48%',
    },
    statVal: {
        marginLeft: 10,
        fontWeight: '900',
        fontSize: 18, // 數值放大
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    questCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        padding: 15,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FFE3E3',
    },
    questTitle: {
        fontSize: 17, // 字體加大
        fontWeight: '800',
        color: '#2D3436',
    },
    questSub: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
    },
    gameButton: {
        position: 'absolute',
        width: 78, // 按鈕變大
        height: 78,
        borderRadius: 39,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
        transform: [{ translateX: -39 }, { translateY: -39 }],
        elevation: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        marginTop: 2,
    },
    floatingChatBtn: {
        position: 'absolute',
        right: 25,
        bottom: 25,
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#6C5CE7', // 使用顯眼的紫色
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        borderWidth: 3,
        borderColor: 'white',
    },
    chatBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 300,
        alignItems: 'center',
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 12,
    },
    confirmMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
    },
    logoutButton: {
        backgroundColor: '#FF4757',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    }
});