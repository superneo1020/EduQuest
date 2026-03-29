import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
    StatusBar, Dimensions, ActivityIndicator
} from 'react-native';
import {
    Trophy, Gamepad2, Mail, User as UserIcon, Settings, ChevronRight,
    LogOut, Calculator, BookOpen, Brain, FlaskConical
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import SkillBarsChart from "@/app/Profile/SkillRadarChart";

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const { user, token, signOut } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [recordMode, setRecordMode] = useState<'recent' | 'best'>('recent');

    useFocusEffect(
        useCallback(() => {
            const fetchLatestProfile = async () => {
                if (!token) return;
                try {
                    setLoading(true);
                    const response = await axios.get(`${getApiBaseUrl()}/api/user/profile?page=0`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProfileData(response.data);
                } catch (error) {
                    console.error("無法獲取最新資料", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchLatestProfile();
        }, [token])
    );

    const displayUser = profileData ? { ...user, ...profileData } : user;
    const gameHistory = displayUser?.userGameScores || [];

    // 計算最高分邏輯
    const bestScores = useMemo(() => {
        if (gameHistory.length === 0) return [];
        const scoresMap = new Map();
        gameHistory.forEach((record: any) => {
            const existing = scoresMap.get(record.name);
            if (!existing || record.scores > existing.scores) {
                scoresMap.set(record.name, record);
            }
        });
        return Array.from(scoresMap.values());
    }, [gameHistory]);

    const getDifficultyColor = (diff: string) => {
        switch (diff?.toUpperCase()) {
            case 'HARD': return '#FF4757';
            case 'MEDIUM': return '#FF9800';
            default: return '#4CAF50';
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

    const displayList = recordMode === 'recent' ? gameHistory.slice(0, 5) : bestScores;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.topBanner} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Student Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarCircle}><UserIcon size={45} color="#4CAF50" /></View>
                    <Text style={styles.userName}>{displayUser?.username || 'Learner'}</Text>
                    <View style={styles.emailBadge}>
                        <Mail size={12} color="#636E72" />
                        <Text style={styles.emailText}>{displayUser?.email || 'N/A'}</Text>
                    </View>
                </View>


                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#FFF9E6', borderColor: '#FFEAA7' }]}>
                        <Trophy size={24} color="#F1C40F" />
                        <Text style={styles.statNumber}>{displayUser?.points || 0}</Text>
                        <Text style={styles.statTitle}>Total Points</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
                        <Gamepad2 size={24} color="#4CAF50" />
                        <Text style={styles.statNumber}>{gameHistory.length}</Text>
                        <Text style={styles.statTitle}>Games Played</Text>
                    </View>
                </View>

                <View style={styles.radarSection}>
                    <Text style={styles.sectionTitle}>Skill Analysis</Text>
                    <SkillBarsChart gameHistory={gameHistory} />
                </View>

                {/* 切換標籤 */}
                {/* 在 return 裡替換原有的 tabContainer */}
                <View style={styles.segmentedControl}>
                    <TouchableOpacity
                        onPress={() => setRecordMode('recent')}
                        style={[styles.segmentBtn, recordMode === 'recent' && styles.activeSegment]}
                    >
                        <Text style={[styles.segmentText, recordMode === 'recent' && styles.activeSegmentText]}>RECENT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setRecordMode('best')}
                        style={[styles.segmentBtn, recordMode === 'best' && styles.activeSegment]}
                    >
                        <Text style={[styles.segmentText, recordMode === 'best' && styles.activeSegmentText]}>BEST</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.activityList}>
                    {displayList.length > 0 ? displayList.map((record: any, index: number) => (
                        <View key={index} style={styles.activityCard}>
                            <View style={[styles.gameIconBg, recordMode === 'best' && { backgroundColor: '#FFF9E6' }]}>
                                {recordMode === 'best' ? <Trophy size={18} color="#F1C40F" /> : renderGameIcon(record.gameType)}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.activityName}>{record.name}</Text>
                                <View style={styles.row}>
                                    <Text style={[styles.activityDifficulty, { color: getDifficultyColor(record.gameDifficulty) }]}>{record.gameDifficulty}</Text>
                                    <Text style={styles.dot}> • </Text>
                                    <Text style={styles.activityDate}>{new Date(record.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <View style={styles.scoreContainer}>
                                <Text style={[styles.activityScore, recordMode === 'best' && { color: '#F1C40F' }]}>
                                    {recordMode === 'best' ? 'BEST' : `+${record.points} XP`}
                                </Text>
                                <Text style={styles.activityScoreValue}>Score: {record.scores}</Text>
                            </View>
                        </View>
                    )) : <Text style={styles.emptyText}>No records found.</Text>}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    topBanner: { position: 'absolute', top: 0, width: width, height: 180, backgroundColor: '#4CAF50', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    header: { height: 60, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    profileHeader: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 15, borderRadius: 24, padding: 25, alignItems: 'center', elevation: 4 },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20
    },
    radarSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    statCard: {
        width: '47%',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '900',
        color: '#2D3436',
        marginTop: 8
    },
    statTitle: {
        fontSize: 11,
        color: '#636E72',
        fontWeight: '700',
        marginTop: 2
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
        marginTop: 25,
        padding: 4,
        borderRadius: 16,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    activeSegment: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
    },
    activeSegmentText: {
        color: '#4CAF50',
    },

    // 列表樣式微調
    activityList: {
        marginHorizontal: 20,
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingHorizontal: 20, // 增加內距
        paddingVertical: 5,
        marginTop: 15,
        elevation: 2
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18, // 增加高度更舒適
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6'
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1F8E9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    userName: { fontSize: 22, fontWeight: '900', color: '#2D3436' },
    emailBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    emailText: { fontSize: 14, color: '#636E72', marginLeft: 5 },
    tabContainer: { flexDirection: 'row', marginLeft: 25, marginTop: 20, gap: 20 },
    tabBtn: { paddingBottom: 5, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#4CAF50' },
    tabText: { fontSize: 13, fontWeight: '800', color: '#A0A0A0' },
    activeTabText: { color: '#4CAF50' },

    gameIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
    activityName: { fontSize: 15, fontWeight: '800', color: '#2D3436' },
    row: { flexDirection: 'row', alignItems: 'center' },
    activityDifficulty: { fontSize: 11, fontWeight: '700' },
    dot: { color: '#BDC3C7' },
    activityDate: { fontSize: 11, color: '#A0A0A0' },
    scoreContainer: { alignItems: 'flex-end' },
    activityScore: { fontSize: 14, fontWeight: '900', color: '#4CAF50' },
    activityScoreValue: { fontSize: 10, color: '#636E72', fontWeight: '600' },
    logoutBtn: { margin: 20, padding: 15, backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center' },
    logoutText: { color: '#FF4757', fontWeight: '800' },
    emptyText: { textAlign: 'center', padding: 20, color: '#BDC3C7' }
});