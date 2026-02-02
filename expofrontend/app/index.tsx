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
    StatusBar
} from 'react-native';
import { Calculator, Languages, Atom, Brain, LogOut, User, Trophy, Clock, Target, Sparkles, Star, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';

import {Bot} from "lucide-react-native/icons";

export default function LandscapeOptimizedHome() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();


    const { token, loading, signOut, user } = useAuth();

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
        { id: 2, title: 'Language', icon: Languages, color: '#2196F3', route: '/games/english/language', pos: { x: '70%', y: '20%' } },
        { id: 3, title: 'Science', icon: Atom, color: '#FF9800', route: '/games/science', pos: { x: '25%', y: '65%' } },
        { id: 4, title: 'Memory', icon: Brain, color: '#9C27B0', route: '/games/memory/memory',  pos: { x: '75%', y: '60%' } },



    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* --- 美化後的 Header --- */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>EduQuest</Text>
                    <View style={styles.userTag}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.userTagText}>{user?.username || 'Guest'}</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => router.push('/Profile/profile' as any)}
                    >
                        <User size={26} color="#2D3436" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={async () => {
                            try {
                                await signOut();
                                router.replace('/Profile/Login');
                            } catch (error) {
                                console.error("Logout Error:", error);
                            }
                        }}
                    >
                        <LogOut size={22} color="#FF4757" />
                        <Text style={styles.logoutText}>Exit</Text>
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
                                {String(user?.points ?? 0)}
                            </Text>
                        </View>

                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.panelTitle}>Daily Quest</Text>
                    <TouchableOpacity style={styles.questCard} activeOpacity={0.8}>
                        <Target size={28} color="#FF4757" />
                        <View style={{marginLeft: 15, flex: 1}}>
                            <Text style={styles.questTitle}>Math Mountain</Text>
                            <Text style={styles.questSub}>Earn 20 XP</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
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
    headerTitle: {
        fontSize: 26, // 字體加大
        fontWeight: '900',
        color: '#2D3436',
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    }
});