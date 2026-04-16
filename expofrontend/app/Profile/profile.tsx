import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
    StatusBar, Dimensions, ActivityIndicator, TextInput, Modal, ImageBackground , Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Trophy, Gamepad2, Mail, User as UserIcon, Settings, ChevronRight,
    LogOut, Calculator, BookOpen, Brain, FlaskConical, Eye, EyeOff, Key, ShoppingCart, List,
    Calendar, Clock, TrendingUp, Award, Target, Zap, Star, BarChart3, PieChart, Package, Edit
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import SkillBarsChart from "@/app/Profile/SkillRadarChart";
import { LineChart, BarChart, PieChart as RNPieChart } from 'react-native-chart-kit';
import { AvatarSelector, renderAvatar, avatarOptions } from "@/app/Profile/AvatarSelector";
import { BackgroundSelector, renderBackground, backgroundOptions } from "@/app/Profile/BackgroundSelector";
import { BadgeSelector, renderBadge, badgeOptions, badgeIconNameMapping } from "@/app/Profile/BadgeSelector";
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundIcons } from "@/app/Profile/BackgroundIcons";

const { width, height } = Dimensions.get('window');



export default function ProfileScreen() {
    const router = useRouter();
    const { user, token, signOut } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [recordMode, setRecordMode] = useState<'recent' | 'best'>('recent');

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Email change state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    // Nickname change state
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [newNickname, setNewNickname] = useState('');

    // School change state (removed editing ability, only display)
    const [currentSchool, setCurrentSchool] = useState('');

    // Items state
    const [userItems, setUserItems] = useState<any[]>([]);
    const [showItemsModal, setShowItemsModal] = useState(false);

    // Missions state
    const [userMissions, setUserMissions] = useState<any[]>([]);
    const [showMissionsModal, setShowMissionsModal] = useState(false);

    // User roles state
    const [userRoles, setUserRoles] = useState<string[]>([]);

    // Error feedback state
    const [showErrorFeedbackModal, setShowErrorFeedbackModal] = useState(false);
    const [errorContext, setErrorContext] = useState('');
    const [userFeedback, setUserFeedback] = useState('');

    const [modalMessage, setModalMessage] = useState({ text: '', type: '' });

    // AI Learning suggestions state
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Load AI suggestions from AsyncStorage
    const loadAiSuggestions = useCallback(async () => {
        try {
            const storedSuggestions = await AsyncStorage.getItem('aiSuggestions');
            if (storedSuggestions) {
                setAiSuggestions(JSON.parse(storedSuggestions));
            }
        } catch (error) {
            console.error('Failed to load AI suggestions:', error);
        }
    }, []);

    // Save AI suggestions to AsyncStorage
    const saveAiSuggestions = useCallback(async (suggestions: any[]) => {
        try {
            await AsyncStorage.setItem('aiSuggestions', JSON.stringify(suggestions));
        } catch (error) {
            console.error('Failed to save AI suggestions:', error);
        }
    }, []);

    
    // Enhanced Profile states
    const [showLearningStats, setShowLearningStats] = useState(false);
    const [showEquipment, setShowEquipment] = useState(false);
    const [showTrends, setShowTrends] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Edit Profile states (removed school and avatar)
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nickname: '',
        email: '',
        password: '',
        confirmPassword: '',
        oldPassword: ''
    });

    // Profile Icon selection states
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<string>('default');

    // Background selection states
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);
    const [selectedBackground, setSelectedBackground] = useState<string>('default');

    const isSpecialBackground = ['Space', 'Ocean', 'Forest', 'City'].includes(selectedBackground);
    // Badge selection states
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [selectedBadges, setSelectedBadges] = useState<string[]>(['default']);

    // User points state
    const [userPoints, setUserPoints] = useState<number>(0);

    const handleAvatarSelect = async (avatarId: string) => {
        try {
            const avatarOption = avatarOptions.find(opt => opt.id === avatarId);
            const avatarName = avatarOption?.name || avatarId;

            const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rawItems = itemsResponse.data?.items || itemsResponse.data || [];
            const userItemsList = Array.isArray(rawItems) ? rawItems : [];

            let existingItem = userItemsList.find((item: any) => {
                const itemData = item.item || item;
                return itemData.name === avatarName;
            });

            if (!existingItem) {
                try {
                    await axios.post(`${getApiBaseUrl()}/api/user/item`, {
                        itemName: avatarName
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const newItemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const newRawItems = newItemsResponse.data?.items || newItemsResponse.data || [];
                    const newUserItemsList = Array.isArray(newRawItems) ? newRawItems : [];
                    existingItem = newUserItemsList.find((item: any) => {
                        const itemData = item.item || item;
                        return itemData.name === avatarName;
                    });
                    setUserItems(newUserItemsList);
                } catch (itemError: any) {
                    console.error('Failed to grant item:', itemError);
                    Alert.alert('Error', 'Failed to get avatar item. Please try again.');
                    return;
                }
            }

            if (!existingItem) {
                Alert.alert('Error', 'Avatar item not found in system');
                return;
            }

            const itemData = existingItem.item || existingItem;
            const updateData = {
                equippedItems: {
                    "AVATAR": itemData.itemId || itemData.id
                }
            };
            if (displayUser?.nickname) {
                Object.assign(updateData, { nickname: displayUser.nickname });
            }

            await axios.post(`${getApiBaseUrl()}/api/user/profile`, updateData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            setSelectedAvatar(avatarId);
            setShowAvatarModal(false);
            Alert.alert('Success', 'Avatar updated successfully!');

            const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Preserve points when updating profileData
            setProfileData(prev => ({
                ...profileResponse.data,
                points: prev?.points ?? userPoints ?? profileResponse.data.points ?? userPoints ?? 0,
                userGameScores: prev?.userGameScores || profileResponse.data.userGameScores || []
            }));

        } catch (error: any) {
            console.error("Update failed", error.response?.data);
            Alert.alert('Error', error.response?.data?.detail || 'Update failed. Please try again.');
        }
    };

    const handleBackgroundSelect = async (backgroundId: string) => {
        try {
            const backgroundOption = backgroundOptions.find(opt => opt.id === backgroundId);
            const backgroundName = backgroundOption?.name || backgroundId;

            const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rawItems = itemsResponse.data?.items || itemsResponse.data || [];
            const userItemsList = Array.isArray(rawItems) ? rawItems : [];

            let existingItem = userItemsList.find((item: any) => {
                const itemData = item.item || item;
                return itemData.name === backgroundName;
            });

            if (!existingItem) {
                try {
                    await axios.post(`${getApiBaseUrl()}/api/user/item`, {
                        itemName: backgroundName
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const newItemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const newRawItems = newItemsResponse.data?.items || newItemsResponse.data || [];
                    const newUserItemsList = Array.isArray(newRawItems) ? newRawItems : [];
                    existingItem = newUserItemsList.find((item: any) => {
                        const itemData = item.item || item;
                        return itemData.name === backgroundName;
                    });
                    setUserItems(newUserItemsList);
                } catch (itemError: any) {
                    console.error('Failed to grant item:', itemError);
                    Alert.alert('Error', 'Failed to get background item. Please try again.');
                    return;
                }
            }

            if (!existingItem) {
                Alert.alert('Error', 'Background item not found in system');
                return;
            }

            const itemData = existingItem.item || existingItem;
            const updateData = {
                equippedItems: {
                    "BACKGROUND": itemData.itemId || itemData.id
                }
            };
            if (displayUser?.nickname) {
                Object.assign(updateData, { nickname: displayUser.nickname });
            }

            await axios.post(`${getApiBaseUrl()}/api/user/profile`, updateData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            setSelectedBackground(backgroundId);
            setShowBackgroundModal(false);
            Alert.alert('Success', 'Background updated successfully!');

            const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Preserve points when updating profileData
            setProfileData(prev => ({
                ...profileResponse.data,
                points: prev?.points ?? userPoints ?? profileResponse.data.points ?? userPoints ?? 0,
                userGameScores: prev?.userGameScores || profileResponse.data.userGameScores || []
            }));

        } catch (error: any) {
            console.error("Background update failed", error.response?.data);
            Alert.alert('Error', error.response?.data?.detail || 'Background update failed. Please try again.');
        }
    };

    const handleBadgeSelect = async (badgeIds: string[]) => {
        try {
            const badgeId = badgeIds[0] || 'default';
            const badgeOption = badgeOptions.find(opt => opt.id === badgeId);
            const badgeName = badgeOption?.name || badgeId;

            const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rawItems = itemsResponse.data?.items || itemsResponse.data || [];
            const userItemsList = Array.isArray(rawItems) ? rawItems : [];

            let existingItem = userItemsList.find((item: any) => {
                const itemData = item.item || item;
                return itemData.name === badgeName;
            });

            if (!existingItem) {
                try {
                    await axios.post(`${getApiBaseUrl()}/api/user/item`, {
                        itemName: badgeName
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const newItemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const newRawItems = newItemsResponse.data?.items || newItemsResponse.data || [];
                    const newUserItemsList = Array.isArray(newRawItems) ? newRawItems : [];
                    existingItem = newUserItemsList.find((item: any) => {
                        const itemData = item.item || item;
                        return itemData.name === badgeName;
                    });
                    setUserItems(newUserItemsList);
                } catch (itemError: any) {
                    console.error('Failed to grant item:', itemError);
                    Alert.alert('Error', 'Failed to get badge item. Please try again.');
                    return;
                }
            }

            if (!existingItem) {
                Alert.alert('Error', 'Badge item not found in system');
                return;
            }

            const itemData = existingItem.item || existingItem;
            const updateData = {
                equippedItems: {
                    "BADGE": itemData.itemId || itemData.id
                }
            };
            if (displayUser?.nickname) {
                Object.assign(updateData, { nickname: displayUser.nickname });
            }

            await axios.post(`${getApiBaseUrl()}/api/user/profile`, updateData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            setSelectedBadges(badgeIds);
            setShowBadgeModal(false);
            Alert.alert('Success', 'Badge updated successfully!');

            const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Preserve points when updating profileData
            setProfileData(prev => ({
                ...profileResponse.data,
                points: prev?.points ?? userPoints ?? profileResponse.data.points ?? userPoints ?? 0,
                userGameScores: prev?.userGameScores || profileResponse.data.userGameScores || []
            }));

        } catch (error: any) {
            console.error("Badge update failed", error.response?.data);
            Alert.alert('Error', error.response?.data?.detail || 'Badge update failed. Please try again.');
        }
    };

    const showErrorWithFeedback = (errorMessage: string, context: string) => {
        Alert.alert(
            'Error',
            errorMessage,
            [
                { text: 'OK', style: 'cancel' },
                {
                    text: 'Report Issue',
                    onPress: () => {
                        setErrorContext(context);
                        setShowErrorFeedbackModal(true);
                    }
                }
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            const fetchLatestProfile = async () => {
                if (!token) return;
                try {
                    setLoading(true);
                    
                    // Load AI suggestions from storage first
                    loadAiSuggestions();

                    const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProfileData(profileResponse.data);

                    // Avatar
                    const equippedAvatarId = profileResponse.data?.equipped_items?.AVATAR
                        || profileResponse.data?.equippedItems?.AVATAR;
                    if (equippedAvatarId) {
                        const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const rawItems = itemsResponse.data?.items || itemsResponse.data || [];
                        const userItemsList = Array.isArray(rawItems) ? rawItems : [];
                        const equippedItem = userItemsList.find((item: any) => {
                            const itemData = item.item || item;
                            return itemData.id === equippedAvatarId || itemData.itemId === equippedAvatarId;
                        });
                        if (equippedItem) {
                            const itemData = equippedItem.item || equippedItem;
                            if (itemData.icon) setSelectedAvatar(itemData.icon);
                        }
                    } else {
                        setSelectedAvatar('default');
                    }

                    // Badge
                    const equippedBadgeId = profileResponse.data?.equipped_items?.BADGE
                        || profileResponse.data?.equippedItems?.BADGE;
                    if (equippedBadgeId) {
                        const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const rawItems = itemsResponse.data?.items || itemsResponse.data || [];
                        const userItemsList = Array.isArray(rawItems) ? rawItems : [];
                        const equippedItem = userItemsList.find((item: any) => {
                            const itemData = item.item || item;
                            return itemData.id === equippedBadgeId || itemData.itemId === equippedBadgeId;
                        });
                        if (equippedItem) {
                            const itemData = equippedItem.item || equippedItem;
                            if (itemData.icon) {
                                const mappedId = badgeIconNameMapping[itemData.icon] || itemData.icon;
                                setSelectedBadges([mappedId]);
                            }
                        }
                    } else {
                        setSelectedBadges(['default']);
                    }

                    // Background
                    const equippedBackgroundId = profileResponse.data?.equipped_items?.BACKGROUND
                        || profileResponse.data?.equippedItems?.BACKGROUND;
                    if (equippedBackgroundId) {
                        const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const rawItems = itemsResponse.data?.items || itemsResponse.data || [];
                        const userItemsList = Array.isArray(rawItems) ? rawItems : [];
                        const equippedItem = userItemsList.find((item: any) => {
                            const itemData = item.item || item;
                            return itemData.id === equippedBackgroundId || itemData.itemId === equippedBackgroundId;
                        });
                        if (equippedItem) {
                            const itemData = equippedItem.item || equippedItem;
                            if (itemData.icon) {
                                setSelectedBackground(itemData.icon);
                            }
                        }
                    } else {
                        setSelectedBackground('default');
                    }

                    // School
                    try {
                        const schoolResponse = await axios.get(`${getApiBaseUrl()}/api/user/school`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setCurrentSchool(schoolResponse.data);
                    } catch (error) { console.log("School info not available"); }

                    // Items
                    try {
                        const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const items = itemsResponse.data?.items || itemsResponse.data || [];
                        setUserItems(Array.isArray(items) ? items : []);
                    } catch (error) {
                        setUserItems([]);
                    }

                    // Missions
                    try {
                        const missionsResponse = await axios.get(`${getApiBaseUrl()}/api/user/mission`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUserMissions(missionsResponse.data || []);
                    } catch (error) { }

                    // Roles
                    try {
                        const rolesResponse = await axios.get(`${getApiBaseUrl()}/api/user/roles`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUserRoles(rolesResponse.data || []);
                    } catch (error) { }


                    // Points
                    try {
                        const pointsResponse = await axios.get(`${getApiBaseUrl()}/api/user/point`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (pointsResponse.data !== undefined) setUserPoints(pointsResponse.data);
                    } catch (error) { }

                    // Game history
                    const gameHistoryResponse = await axios.get(`${getApiBaseUrl()}/api/user/game/score`, {
                        params: { page: 0, size: 50 },
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProfileData((prev: any) => ({
                        ...profileResponse.data,
                        userGameScores: gameHistoryResponse.data.content || []
                    }));
                } catch (error) {
                    console.error("無法獲取最新資料", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchLatestProfile();
        }, [token])
    );

    const displayUser = profileData
        ? { ...user, ...profileData, points: userPoints ?? 0 }
        : { ...user, points: userPoints ?? 0 };

    const gameHistory = displayUser?.userGameScores || [];

    // Function to fetch AI learning suggestions
    const fetchAiLearningSuggestions = useCallback(async () => {
        // 如果正在加載，或者根本沒有遊戲紀錄，就不要浪費資源請求 AI
        if (loadingSuggestions || !gameHistory || gameHistory.length === 0) {
            console.log('Skip AI fetch: No game history or already loading.');
            return;
        }

        console.log('Starting AI suggestions fetch for new user...');
        try {
            setLoadingSuggestions(true);

            // 獲取當前用戶名 (轉小寫以確保一致性)
            const currentUsername = (displayUser?.username || user?.username || 'Guest').toLowerCase();

            // 構建發送給 Python 後端的數據
            const gameScoreData = {
                // 直接傳送 username，讓 Python 後端處理字符串
                user_id: currentUsername,
                game_scores: gameHistory.map((game: any) => ({
                    game_type: game.gameType || 'GENERAL',
                    game_name: game.name || game.gameName || 'Unknown Game',
                    score: game.scores || 0,
                    difficulty: game.gameDifficulty || 'MEDIUM',
                    // 確保日期格式正確
                    createdAt: game.createdAt || new Date().toISOString()
                }))
            };

            console.log('Sending to AI backend (FastAPI):', gameScoreData);

            // 注意：如果你在實機測試，localhost 可能需要換成你電腦的 IP
            const response = await axios.post('http://localhost:8000/api/learning/suggestions', gameScoreData, {
                timeout: 20000, // AI 運算可能較慢，給予 20 秒緩衝
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.suggestions) {
                const suggestions = response.data.suggestions;
                console.log('AI Analysis Success:', suggestions);

                setAiSuggestions(suggestions);
                // 如果你有本地持久化存儲，也可以存起來
                if (typeof saveAiSuggestions === 'function') {
                    saveAiSuggestions(suggestions);
                }
            }
        } catch (error: any) {
            console.error('AI Suggestion Error:', error);

            // 如果是網絡錯誤或後端沒開，顯示提示
            let errorTitle = 'AI 分析暫時不可用';
            let errorMsg = '請確保 Python 後端 (Ollama) 已啟動。';

            if (error.code === 'ECONNABORTED') {
                errorMsg = 'AI 回應超時，請檢查 Ollama 運行狀態。';
            }

            Alert.alert(errorTitle, errorMsg, [{ text: '好的' }]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [gameHistory, user, displayUser, loadingSuggestions, saveAiSuggestions]);

    // Fetch AI suggestions when game history changes
    useEffect(() => {
        if (gameHistory.length > 0 && !loadingSuggestions) {
            fetchAiLearningSuggestions();
        }
    }, [gameHistory]);

    const calculateImprovementRate = useCallback(() => {
        if (gameHistory.length < 3) return 0;
        const sortedHistory = [...gameHistory].sort((a, b) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        const totalGames = sortedHistory.length;
        const recentCount = Math.min(10, totalGames);
        const earlierCount = Math.min(10, totalGames - recentCount);
        const recentGames = sortedHistory.slice(-recentCount);
        const earlierGames = sortedHistory.slice(0, earlierCount);
        const calculateWeightedAverage = (games: any[], baseWeight: number) => {
            if (games.length === 0) return 0;
            let weightedSum = 0, totalWeight = 0;
            games.forEach((game, index) => {
                const weight = baseWeight + index;
                const score = game.scores || 0;
                weightedSum += score * weight;
                totalWeight += weight;
            });
            return weightedSum / totalWeight;
        };
        const recentWeightedAvg = calculateWeightedAverage(recentGames, 1);
        const earlierWeightedAvg = earlierGames.length > 0 ? calculateWeightedAverage(earlierGames, 1) : recentWeightedAvg;
        const improvementRate = earlierWeightedAvg > 0 ? ((recentWeightedAvg - earlierWeightedAvg) / earlierWeightedAvg) * 100 : 0;
        return Math.round(improvementRate);
    }, [gameHistory]);

    const calculateLearningStats = useMemo(() => {
        if (gameHistory.length === 0) return {
            subjectAverages: {}, bestSubject: null, difficultyPreference: {}, totalPlayTime: 0, averageScore: 0, improvementRate: 0
        };
        const subjectScores: { [key: string]: number[] } = {};
        const difficultyCount: { [key: string]: number } = {};
        let totalScore = 0;
        gameHistory.forEach((record: any) => {
            const subject = record.gameType || 'UNKNOWN';
            const difficulty = record.gameDifficulty || 'MEDIUM';
            const score = record.scores || 0;
            if (!subjectScores[subject]) subjectScores[subject] = [];
            subjectScores[subject].push(score);
            difficultyCount[difficulty] = (difficultyCount[difficulty] || 0) + 1;
            totalScore += score;
        });
        const subjectAverages: { [key: string]: number } = {};
        let bestSubject = null, bestAverage = 0;
        Object.entries(subjectScores).forEach(([subject, scores]) => {
            const average = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
            subjectAverages[subject] = Math.round(average);
            if (average > bestAverage) {
                bestAverage = average;
                bestSubject = subject;
            }
        });
        const calculateRealisticPlayTime = () => {
            if (gameHistory.length === 0) return 0;
            const difficultyTimeMap: { [key: string]: number } = { 'EASY': 5, 'MEDIUM': 10, 'HARD': 15 };
            let totalTime = 0;
            gameHistory.forEach((record: any) => {
                const difficulty = record.gameDifficulty || 'MEDIUM';
                totalTime += difficultyTimeMap[difficulty] || 10;
            });
            return totalTime;
        };
        return {
            subjectAverages, bestSubject, difficultyPreference: difficultyCount,
            totalPlayTime: calculateRealisticPlayTime(),
            averageScore: Math.round(totalScore / gameHistory.length),
            improvementRate: calculateImprovementRate()
        };
    }, [gameHistory, calculateImprovementRate]);

    const getEquipmentStats = useMemo(() => {
        const equipped = profileData?.equipped_items || profileData?.equippedItems || {};
        const totalItems = Array.isArray(userItems) ? userItems.length : 0;
        const equippedCount = Object.values(equipped).filter(item => item !== null).length;
        const rareItems = Array.isArray(userItems) ? userItems.filter(item => item.price > 100) : [];
        return { equipped, totalItems, equippedCount, collectionProgress: Math.round((equippedCount / Math.max(totalItems, 1)) * 100), rareItems };
    }, [profileData, userItems]);

    const generateLearningSuggestions = useMemo(() => {
        const stats = calculateLearningStats;
        const suggestions = [];
        const subjectEntries = Object.entries(stats.subjectAverages);
        if (subjectEntries.length > 0) {
            const sortedSubjects = subjectEntries.sort(([, a], [, b]) => a - b);
            const weakestSubject = sortedSubjects[0];
            const strongestSubject = sortedSubjects[sortedSubjects.length - 1];
            if (weakestSubject[1] < 70) {
                const gap = strongestSubject[1] - weakestSubject[1];
                suggestions.push({
                    type: 'weakness', icon: <Target size={16} color="#FF6B6B" />,
                    title: `Key areas to strengthen ${weakestSubject[0]}`,
                    description: `your ${weakestSubject[0]} average ${weakestSubject[1]} points, The difference between ${strongestSubject[0]} and the strongest subject is ${gap} points. It is recommended to practice for 15-20 minutes each day.`
                });
            }
        }
        const totalGames = Object.values(stats.difficultyPreference).reduce((a: number, b: number) => a + b, 0);
        const easyRatio = (stats.difficultyPreference['EASY'] || 0) / totalGames;
        const hardRatio = (stats.difficultyPreference['HARD'] || 0) / totalGames;
        if (easyRatio > 0.9) {
            suggestions.push({
                type: 'challenge', icon: <Zap size={16} color="#FFA500" />,
                title: 'Break out of your comfort zone',
                description: `You spent ${Math.round(easyRatio * 100)}% of your time on easy mode. AI analysis shows you have mastered the basics; we recommend trying medium difficulty to stimulate brain development.`
            });
        } else if (hardRatio > 0.4 && stats.averageScore < 80) {
            suggestions.push({
                type: 'balance', icon: <BarChart3 size={16} color="#9C27B0" />,
                title: 'Balanced difficulty selection',
                description: `You frequently attempt the hard mode but your average score is low. It's recommended that you first solidify your foundation on the medium difficulty before tackling the higher difficulties.`
            });
        }
        if (gameHistory.length >= 5) {
            const recentScores = gameHistory.slice(-5).map(g => g.scores || 0);
            const mean = recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length;
            const scoreVariance = Math.sqrt(recentScores.reduce((sum: number, score: number) => sum + Math.pow(score - mean, 2), 0) / recentScores.length);
            if (scoreVariance > 20) {
                suggestions.push({
                    type: 'consistency', icon: <TrendingUp size={16} color="#4ECDC4" />,
                    title: 'Improve learning stability',
                    description: `AI analysis shows your score fluctuates significantly. We recommend establishing a fixed study schedule and maintaining a consistent practice rhythm.`
                });
            }
        }
        if (gameHistory.length >= 3) {
            const recentGames = gameHistory.slice(-3);
            const avgRecentScore = recentGames.reduce((sum: number, game: any) => sum + (game.scores || 0), 0) / recentGames.length;
            if (avgRecentScore > stats.averageScore * 1.1) {
                suggestions.push({
                    type: 'momentum', icon: <Star size={16} color="#FFD93D" />,
                    title: 'Maintain the momentum of learning',
                    description: `Your recent performance has been above average ${Math.round(((avgRecentScore - stats.averageScore) / stats.averageScore) * 100)}%！This is the golden period for learning, and it is recommended to increase the frequency of practice.`
                });
            }
        }
        if (stats.averageScore >= 85 && Object.keys(stats.subjectAverages).length >= 3) {
            const balancedSubjects = Object.values(stats.subjectAverages).filter(score => score >= 80).length;
            if (balancedSubjects >= 2) {
                suggestions.push({
                    type: 'advanced', icon: <Award size={16} color="#4CAF50" />,
                    title: 'Advanced learning suggestions',
                    description: `You're excelling in multiple subjects! AI suggests you start trying cross-subject integrated practice or take on more challenging tasks.`
                });
            }
        }
        const daysSinceFirstGame = gameHistory.length > 0 ? Math.ceil((Date.now() - new Date(gameHistory[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const gamesPerDay = daysSinceFirstGame > 0 ? gameHistory.length / daysSinceFirstGame : 0;
        if (gamesPerDay < 0.5 && gameHistory.length < 10) {
            suggestions.push({
                type: 'habit', icon: <Calendar size={16} color="#2196F3" />,
                title: 'Develop learning habits',
                description: `AI analysis suggests completing at least 1-2 games daily to maintain learning continuity. Research indicates that consistent learning is more effective than intermittent learning.`
            });
        }
        return suggestions;
    }, [calculateLearningStats, gameHistory]);

    const bestScores = useMemo(() => {
        if (gameHistory.length === 0) return [];
        const scoresMap = new Map();
        gameHistory.forEach((record: any) => {
            const existing = scoresMap.get(record.name);
            if (!existing || record.scores > existing.scores) scoresMap.set(record.name, record);
        });
        return Array.from(scoresMap.values());
    }, [gameHistory]);

    const processedUserItems = useMemo(() => {
        return userItems.map(item => {
            const itemData = item.item || item;
            return {
                ...itemData,
                icon: itemData.icon?.replace(/\.png$/i, '') || itemData.icon,
                quantity: item.quantity || itemData.quantity || 1
            };
        });
    }, [userItems]);

    const ownedBadges = useMemo(() => {
        const badges: any[] = [];
        userItems.forEach((userItem) => {
            const itemData = userItem.item || userItem;
            if (itemData.type?.toUpperCase() === 'BADGE') {
                let iconName = itemData.icon || '';
                if (iconName.includes('/')) iconName = iconName.split('/').pop() || '';
                iconName = iconName.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');
                const mappedId = badgeIconNameMapping[iconName] || iconName;
                const badgeInfo = badgeOptions.find(b => b.id === mappedId);
                if (badgeInfo) {
                    badges.push({
                        id: itemData.id,
                        name: badgeInfo.name,
                        iconId: mappedId,
                        color: badgeInfo.color,
                    });
                }
            }
        });
        return badges;
    }, [userItems]);

    const ownedBackgrounds = useMemo(() => {
        const backgrounds: any[] = [];
        userItems.forEach((userItem) => {
            const itemData = userItem.item || userItem;
            if (itemData.type?.toUpperCase() === 'BACKGROUND') {
                let iconName = itemData.icon || '';
                if (iconName.includes('/')) iconName = iconName.split('/').pop() || '';
                iconName = iconName.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');
                const backgroundInfo = backgroundOptions.find(b => b.id === iconName);
                if (backgroundInfo) {
                    backgrounds.push({
                        id: itemData.id,
                        name: backgroundInfo.name,
                        iconId: iconName,
                    });
                }
            }
        });
        return backgrounds;
    }, [userItems]);

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

    const getBackgroundGradient = (backgroundId: string): readonly [string, string] => {
        switch (backgroundId) {
            case 'Space': return ['#0F172A', '#1E293B'] as const;
            case 'Ocean': return ['#006994', '#00CED1'] as const;
            case 'Forest': return ['#228B22', '#90EE90'] as const;
            case 'City': return ['#708090', '#2C3E50'] as const;
            default: return ['#FFFFFF', '#FFFFFF'] as const;
        }
    };

    const getBackgroundColor = (backgroundId: string) => {
        switch (backgroundId) {
            case 'Space': return '#0F172A';   // 深藍黑
            case 'Ocean': return '#006994';   // 深海藍
            case 'Forest': return '#228B22';   // 森林綠
            case 'City': return '#708090';     // 都市灰
            default: return '#F8F9FA';         // 預設淺灰
        }
    };



    const displayList = recordMode === 'recent' ? gameHistory.slice(0, 5) : bestScores;

    const prepareTrendData = useMemo(() => {
        const last7Days = gameHistory.slice(-7);
        return {
            labels: last7Days.map((_: any, index: number) => `Day ${index + 1}`),
            datasets: [{
                data: last7Days.map((game: any) => game.scores || 0),
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                strokeWidth: 2
            }]
        };
    }, [gameHistory]);

    const prepareSubjectData = useMemo(() => {
        const stats = calculateLearningStats;
        const subjects = Object.keys(stats.subjectAverages);
        const scores = subjects.map((subject: string) => stats.subjectAverages[subject]);
        return { labels: subjects, datasets: [{ data: scores }] };
    }, [calculateLearningStats]);

    const prepareDifficultyData = useMemo(() => {
        const stats = calculateLearningStats;
        const difficulties = Object.keys(stats.difficultyPreference);
        const counts = difficulties.map((diff: string) => stats.difficultyPreference[diff]);
        return { labels: difficulties, datasets: [{ data: counts }] };
    }, [calculateLearningStats]);

    // Password change function
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            setModalMessage({ text: 'Please fill in all password fields', type: 'error' });
            showErrorWithFeedback('Please fill in all password fields', 'Password Change - Empty Fields');
            return;
        }

        if (newPassword.length < 8) {
            setModalMessage({ text: 'New password must be at least 8 characters long', type: 'error' });
            showErrorWithFeedback('New password must be at least 8 characters long', 'Password Change - Too Short');
            return;
        }

        try {
            setLoading(true);
            await axios.post(`${getApiBaseUrl()}/api/user/password`,
                { oldPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('✅ Success', 'Password changed successfully!');
            setModalMessage({ text: 'Password changed successfully!', type: 'success' });

            setTimeout(() => {
                setShowPasswordModal(false);
                setModalMessage({ text: '', type: '' });
                setOldPassword('');
                setNewPassword('');
            }, 1500);

        } catch (error: any) {
            console.error('Password change error:', error);
            let errorMessage = 'Failed to change password';
            let context = 'Password Change - Unknown Error';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                context = `Password Change - Server: ${error.response.data.message}`;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid current password or new password format';
                context = 'Password Change - Validation Error';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again';
                context = 'Password Change - Auth Error';
            }

            setModalMessage({ text: errorMessage, type: 'error' });
            Alert.alert('❌ Error', errorMessage);
            showErrorWithFeedback(errorMessage, context);
        } finally {
            setLoading(false);
        }
    };

    // Email change function
    const handleChangeEmail = async () => {
        if (!newEmail) {
            setModalMessage({ text: 'Please enter a new email address', type: 'error' });
            showErrorWithFeedback('Please enter a new email address', 'Email Change - Empty Field');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            setModalMessage({ text: 'Please enter a valid email address', type: 'error' });
            showErrorWithFeedback('Please enter a valid email address', 'Email Change - Invalid Format');
            return;
        }

        // Check if new email is the same as current email
        if (displayUser?.email && newEmail.trim().toLowerCase() === displayUser.email.toLowerCase()) {
            setModalMessage({ text: 'New email cannot be the same as your current email', type: 'error' });
            showErrorWithFeedback('New email cannot be the same as your current email', 'Email Change - Same Email');
            return;
        }

        try {
            setLoading(true);

            // 發送更改郵箱請求
            await axios.post(`${getApiBaseUrl()}/api/user/email`,
                { newEmail: newEmail.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 重新獲取用戶資料以更新郵箱顯示
            const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 更新 profileData，保留遊戲記錄
            setProfileData((prev: any) => ({
                ...profileResponse.data,
                email: newEmail.trim() || profileResponse.data.email,
                userGameScores: prev?.userGameScores || []
            }));

            // 顯示成功提示
            Alert.alert(
                '✅ Success',
                `Email changed to: ${newEmail.trim()}`,
                [{ text: 'OK' }]
            );

            setModalMessage({ text: 'Email changed successfully!', type: 'success' });

            setTimeout(() => {
                setShowEmailModal(false);
                setModalMessage({ text: '', type: '' });
                setNewEmail('');
            }, 1500);

        } catch (error: any) {
            console.error('Email change error:', error);
            let errorMessage = 'Failed to change email';
            let context = 'Email Change - Unknown Error';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                context = `Email Change - Server: ${error.response.data.message}`;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid email address or email already exists';
                context = 'Email Change - Validation Error';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again';
                context = 'Email Change - Auth Error';
            }

            setModalMessage({ text: errorMessage, type: 'error' });
            Alert.alert('❌ Error', errorMessage);
            showErrorWithFeedback(errorMessage, context);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeNickname = async () => {
        if (!newNickname || newNickname.trim() === '') {
            setModalMessage({ text: 'Please enter a nickname', type: 'error' });
            showErrorWithFeedback('Please enter a nickname', 'Nickname Change - Empty Field');
            return;
        }

        if (newNickname.trim().length > 50) {
            setModalMessage({ text: 'Nickname must be 50 characters or less', type: 'error' });
            showErrorWithFeedback('Nickname must be 50 characters or less', 'Nickname Change - Too Long');
            return;
        }

        try {
            setLoading(true);

            // 發送更改暱稱請求
            await axios.post(`${getApiBaseUrl()}/api/user/profile`,
                { nickname: newNickname.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 重新獲取用戶資料
            const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 更新 profileData，保留遊戲記錄
            setProfileData((prev: any) => ({
                ...profileResponse.data,
                nickname: newNickname.trim() || profileResponse.data.nickname,
                userGameScores: prev?.userGameScores || []
            }));

            // 顯示成功提示
            Alert.alert(
                '✅ Success',
                `Nickname changed to: ${newNickname.trim()}`,
                [{ text: 'OK' }]
            );

            setModalMessage({ text: 'Nickname changed successfully!', type: 'success' });

            setTimeout(() => {
                setShowNicknameModal(false);
                setModalMessage({ text: '', type: '' });
                setNewNickname('');
            }, 1500);

        } catch (error: any) {
            console.error('Nickname change error:', error);
            let errorMessage = 'Failed to change nickname';
            let context = 'Nickname Change - Unknown Error';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                context = `Nickname Change - Server: ${error.response.data.message}`;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid nickname format or length';
                context = 'Nickname Change - Validation Error';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again';
                context = 'Nickname Change - Auth Error';
            }

            setModalMessage({ text: errorMessage, type: 'error' });
            Alert.alert('❌ Error', errorMessage);
            showErrorWithFeedback(errorMessage, context);
        } finally {
            setLoading(false);
        }
    };

    // Function to handle feedback submission
    const handleSubmitFeedback = async () => {
        try {
            const feedbackData = {
                context: errorContext,
                userFeedback: userFeedback,
                timestamp: new Date().toISOString(),
                userAgent: 'EduQuest Mobile App'
            };

            console.log('User feedback submitted:', feedbackData);

            Alert.alert('Thank You', 'Your feedback has been submitted. We\'ll look into this issue.');
            setShowErrorFeedbackModal(false);
            setUserFeedback('');
            setErrorContext('');
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            Alert.alert('Error', 'Failed to submit feedback. Please try again later.');
        }
    };
                    // 即使没有游戏记录，也发送空数组，让后端返回通用建议


    const chartWidth = width - 96; // 根據 masterInfoCard 的邊距計算

    const getProfileCoverGradient = (backgroundId: string): readonly [string, string] => {
        switch (backgroundId) {
            case 'Space': return ['#0F172A', '#1E293B'] as const;
            case 'Ocean': return ['#006994', '#00CED1'] as const;
            case 'Forest': return ['#228B22', '#90EE90'] as const;
            case 'City': return ['#708090', '#2C3E50'] as const;
            default: return ['#4CAF50', '#4CAF50'] as const;   // 默认绿色
        }
    };
    
    // 根據背景動態漸變色彩
    const getCardGradientColors = (backgroundId: string) => {
        switch (backgroundId) {
            case 'Space': return [
                'rgba(15, 23, 42, 0.85)',   // 深藍黑
                'rgba(30, 41, 59, 0.85)',   // 中藍黑
                'rgba(99, 102, 241, 0.85)'   // 紫藍色
            ] as const;
            case 'Ocean': return [
                'rgba(0, 105, 148, 0.85)',   // 深海藍
                'rgba(0, 206, 209, 0.85)',   // 淺海藍
                'rgba(34, 197, 94, 0.85)'    // 海綠色
            ] as const;
            case 'Forest': return [
                'rgba(34, 139, 34, 0.85)',    // 深森林綠
                'rgba(144, 238, 144, 0.85)',  // 淺森林綠
                'rgba(76, 175, 80, 0.85)'    // 草綠色
            ] as const;
            case 'City': return [
                'rgba(112, 128, 144, 0.85)',  // 深灰
                'rgba(44, 62, 80, 0.85)',    // 深藍灰
                'rgba(59, 130, 246, 0.85)'   // 都市藍
            ] as const;
            default: return [
                'rgba(99, 102, 241, 0.85)',  // 紫藍色
                'rgba(139, 92, 246, 0.85)',  // 紫色
                'rgba(236, 72, 153, 0.85)'   // 粉紅色
            ] as const;
        }
    };
    
    // 根據背景決定文字顏色
    const getTextColor = (backgroundId: string) => {
        switch (backgroundId) {
            case 'Space': return '#FFF';  // 深色背景用白色
            case 'Ocean': return '#2D3436';  // 淺色背景用深色
            case 'Forest': return '#2D3436';  // 淺色背景用深色
            case 'City': return '#FFF';  // 深色背景用白色
            default: return '#2D3436';  // 預設白色背景用深色
        }
    };
    
    const cardTextColor = getTextColor(selectedBackground);
    const iconColor = (selectedBackground === 'Ocean' || selectedBackground === 'Forest' || (!['Space','Ocean','Forest','City'].includes(selectedBackground))) ? 'rgba(45, 52, 54, 0.7)' : 'rgba(255,255,255,0.7)';
    
    const gradientColors = getCardGradientColors(selectedBackground);

    return (
        <View style={{ flex: 1 }}>
            {/* 背景 SVG - 絕對定位填滿 */}
            <View style={StyleSheet.absoluteFillObject}>
                {selectedBackground === 'Space' && <BackgroundIcons.Space size="100%" />}
                {selectedBackground === 'Ocean' && <BackgroundIcons.Ocean size="100%" />}
                {selectedBackground === 'Forest' && <BackgroundIcons.Forest size="100%" />}
                {selectedBackground === 'City' && <BackgroundIcons.City size="100%" />}
                {!['Space','Ocean','Forest','City'].includes(selectedBackground) && (
                    <BackgroundIcons.default size="100%" />
                )}
            </View>
            <LinearGradient
                colors={getBackgroundGradient(selectedBackground)}
                style={styles.fullScreenBackground}
            />
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Unified User Profile Section */}
                    <View style={styles.unifiedProfileContainer}>
                        <View style={styles.profileCover}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setShowBackgroundModal(true)}
                                style={styles.profileCover}
                            >
                                <LinearGradient
                                    colors={getProfileCoverGradient(selectedBackground)}
                                    style={styles.profileCoverGradient}
                                />

                                <View style={styles.profileContent}>
                                    <View style={styles.avatarAndBadgeRow}>
                                        <TouchableOpacity
                                            style={styles.avatarContainer}
                                            onPress={() => setShowAvatarModal(true)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.avatarCircle}>
                                                {renderAvatar(selectedAvatar, 50)}
                                            </View>
                                        </TouchableOpacity>
                                        {/* 移除 badgeContainer */}
                                    </View>

                                    <View style={styles.profileInfo}>
                                        <Text style={styles.userName}>{displayUser?.nickname || displayUser?.username || 'Learner'}</Text>
                                        {ownedBadges.length > 0 && (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileBadgesScroll}>
                                                {ownedBadges.map((badge) => (
                                                    <View key={badge.id} style={styles.profileBadgeItem}>
                                                        {renderBadge(badge.iconId, 28)}
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        )}
                                        <Text style={styles.userTitle}>🎓 Learning Explorer</Text>
                                        <View style={styles.profileStats}>
                                            <View style={styles.statItem}>
                                                <Trophy size={16} color="#FFD700" />
                                                <Text style={styles.statValue}>{displayUser?.points || 0}</Text>
                                                <Text style={styles.statLabel}>Points</Text>
                                            </View>
                                            <View style={styles.statDivider} />
                                            <View style={styles.statItem}>
                                                <Gamepad2 size={16} color="#FF6B6B" />
                                                <Text style={styles.statValue}>{gameHistory.length}</Text>
                                                <Text style={styles.statLabel}>Games</Text>
                                            </View>
                                            <View style={styles.statDivider} />
                                            <View style={styles.statItem}>
                                                <Calendar size={16} color="#4ECDC4" />
                                                <Text style={styles.statValue}>{calculateLearningStats.improvementRate > 0 ? '+' : ''}{calculateLearningStats.improvementRate}%</Text>
                                                <Text style={styles.statLabel}>Progress</Text>
                                            </View>
                                        </View>
                                    </View>
                                                                    </View>
                            </TouchableOpacity>
                        </View>

                        {/* 統一的大資訊卡片 - 包含所有用戶資訊 */}
                        {isSpecialBackground ? (
                            <LinearGradient
                                colors={gradientColors}
                                style={styles.masterInfoCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {/* 卡片標題 */}
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.cardTitle, { color: cardTextColor }]}>👤 My Profile</Text>
                                    <TouchableOpacity
                                        style={styles.editCardBtn}
                                        onPress={() => setShowEditProfileModal(true)}
                                    >
                                        <Edit size={16} color={cardTextColor} />
                                    </TouchableOpacity>
                                </View>
                            
                            {/* 基本資訊區域 - 緊湊網格布局 */}
                                <View style={styles.infoSection}>
                                    <Text style={[styles.sectionLabel, { color: cardTextColor }]}>Basic Info</Text>
                                    <View style={styles.compactInfoGrid}>
                                        <View style={styles.infoRow}>
                                            <View style={styles.compactInfoItem}>
                                                <UserIcon size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Username</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{displayUser?.username || 'N/A'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.compactInfoItem}>
                                                <Trophy size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Points</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{displayUser?.points || 0} XP</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <View style={styles.compactInfoItem}>
                                                <Mail size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Email</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]} numberOfLines={1}>{displayUser?.email || 'N/A'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.compactInfoItem}>
                                                <Gamepad2 size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Games</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{gameHistory.length}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        {(currentSchool || userRoles.length > 0) && (
                                            <View style={styles.infoRow}>
                                                {currentSchool && (
                                                    <View style={styles.compactInfoItem}>
                                                        <BookOpen size={12} color="rgba(255,255,255,0.7)" />
                                                        <View style={styles.compactInfoContent}>
                                                            <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>School</Text>
                                                            <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{currentSchool}</Text>
                                                        </View>
                                                    </View>
                                                )}
                                                {userRoles.length > 0 && (
                                                    <View style={styles.compactInfoItem}>
                                                        <Award size={12} color="rgba(255,255,255,0.7)" />
                                                        <View style={styles.compactInfoContent}>
                                                            <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Role</Text>
                                                            <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{userRoles.join(', ')}</Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                                
                                {/* 徽章和背景組合區域 - 善用空間 */}
                                {(ownedBadges.length > 0 || ownedBackgrounds.length > 0) && (
                                    <View style={styles.collectionSection}>
                                        {ownedBadges.length > 0 && (
                                            <View style={styles.collectionSubsection}>
                                                <View style={styles.miniSectionHeader}>
                                                    <Text style={[styles.miniSectionLabel, { color: cardTextColor }]}>Badges ({ownedBadges.length})</Text>
                                                    <TouchableOpacity
                                                        style={styles.miniViewBtn}
                                                        onPress={() => setShowBadgeModal(true)}
                                                    >
                                                        <Text style={[styles.miniViewText, { color: cardTextColor }]}>Edit</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniBadgesScroll}>
                                                    {ownedBadges.slice(0, 5).map((badge) => (
                                                        <View key={badge.id} style={styles.miniBadgeItem}>
                                                            {renderBadge(badge.iconId, 28)}
                                                        </View>
                                                    ))}
                                                    {ownedBadges.length > 5 && (
                                                        <TouchableOpacity 
                                                            style={styles.moreMiniBtn}
                                                            onPress={() => setShowBadgeModal(true)}
                                                        >
                                                            <Text style={[styles.moreMiniText, { color: cardTextColor }]}>+{ownedBadges.length - 5}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </ScrollView>
                                            </View>
                                        )}
                                        
                                        {ownedBackgrounds.length > 0 && (
                                            <View style={styles.collectionSubsection}>
                                                <View style={styles.miniSectionHeader}>
                                                    <Text style={[styles.miniSectionLabel, { color: cardTextColor }]}>Backgrounds ({ownedBackgrounds.length})</Text>
                                                    <TouchableOpacity
                                                        style={styles.miniViewBtn}
                                                        onPress={() => router.push('/shop')}
                                                    >
                                                        <Text style={[styles.miniViewText, { color: cardTextColor }]}>Shop</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniBackgroundsScroll}>
                                                    {ownedBackgrounds.slice(0, 3).map((background) => (
                                                        <TouchableOpacity
                                                            key={background.id}
                                                            style={styles.miniBackgroundItem}
                                                            onPress={() => handleBackgroundSelect(background.iconId)}
                                                        >
                                                            {renderBackground(background.iconId, 40)}
                                                        </TouchableOpacity>
                                                    ))}
                                                    {ownedBackgrounds.length > 3 && (
                                                        <TouchableOpacity 
                                                            style={styles.moreMiniBtn}
                                                            onPress={() => setShowBackgroundModal(true)}
                                                        >
                                                            <Text style={[styles.moreMiniText, { color: cardTextColor }]}>+{ownedBackgrounds.length - 3}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                )}
                                
                                                                
                                {/* 技能分析區域 */}
                                <View style={styles.skillsSection}>
                                    <Text style={[styles.sectionLabel, { color: cardTextColor }]}>📊 Skills Analysis & AI Tips</Text>
                                    <View style={{ width: chartWidth, alignSelf: 'center' }}>
                                        <SkillBarsChart gameHistory={gameHistory} />
                                    </View>


                                    {/* AI 建議直接顯示 */}
                                    {/* AI 建議直接顯示 */}
                                    <View style={{ marginTop: 16 }}>
                                        <Text style={[styles.sectionLabel, { color: cardTextColor, marginBottom: 8 }]}>🤖 AI Learning Suggestions</Text>
                                        {loadingSuggestions ? (
                                            <View style={[styles.statsCard, { alignItems: 'center', padding: 20 }]}>
                                                <ActivityIndicator size="small" color="#4CAF50" />
                                                <Text style={[styles.statsLabel, { textAlign: 'center', color: cardTextColor, marginTop: 8 }]}>
                                                    AI is analyzing your learning patterns...
                                                </Text>
                                            </View>
                                        ) : (aiSuggestions.length > 0 || generateLearningSuggestions.length > 0) ? (
                                            (aiSuggestions.length > 0 ? aiSuggestions : generateLearningSuggestions).slice(0, 3).map((suggestion: any, index: number) => (
                                                <View key={index} style={[styles.suggestionCard, { marginBottom: 8 }]}>
                                                    <View style={styles.suggestionIcon}>
                                                        {suggestion.icon || (suggestion.type === 'strength' ? <Trophy size={16} color="#4CAF50" /> : suggestion.type === 'weakness' ? <Target size={16} color="#FF6B6B" /> : <Zap size={16} color="#FFA500" />)}
                                                    </View>
                                                    <View style={styles.suggestionContent}>
                                                        <Text style={[styles.suggestionTitle, { color: cardTextColor }]}>{suggestion.title}</Text>
                                                        <Text style={[styles.suggestionDescription, { color: cardTextColor }]}>{suggestion.description}</Text>
                                                    </View>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={[styles.statsCard, { alignItems: 'center', padding: 16 }]}>
                                                <Text style={[styles.statsCardTitle, { color: cardTextColor, marginBottom: 8 }]}>Great Job! 🎉</Text>
                                                <Text style={[styles.statsLabel, { textAlign: 'center', color: cardTextColor }]}>
                                                    You're doing excellently! Keep up the good work and continue challenging yourself.
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </LinearGradient>
                        ) : (
                            <View style={styles.masterInfoCard}>
                                {/* 卡片標題 */}
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.cardTitle, { color: cardTextColor }]}>👤 My Profile</Text>
                                    <TouchableOpacity
                                        style={styles.editCardBtn}
                                        onPress={() => setShowEditProfileModal(true)}
                                    >
                                        <Edit size={16} color={cardTextColor} />
                                    </TouchableOpacity>
                                </View>
                                
                                {/* 基本資訊區域 - 緊湊網格布局 */}
                                <View style={styles.infoSection}>
                                    <Text style={[styles.sectionLabel, { color: cardTextColor }]}>Basic Info</Text>
                                    <View style={styles.compactInfoGrid}>
                                        <View style={styles.infoRow}>
                                            <View style={styles.compactInfoItem}>
                                                <UserIcon size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Username</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{displayUser?.username || 'N/A'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.compactInfoItem}>
                                                <Trophy size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Points</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{displayUser?.points || 0} XP</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <View style={styles.compactInfoItem}>
                                                <Mail size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Email</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]} numberOfLines={1}>{displayUser?.email || 'N/A'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.compactInfoItem}>
                                                <Gamepad2 size={12} color="rgba(255,255,255,0.7)" />
                                                <View style={styles.compactInfoContent}>
                                                    <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Games</Text>
                                                    <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{gameHistory.length}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        {(currentSchool || userRoles.length > 0) && (
                                            <View style={styles.infoRow}>
                                                {currentSchool && (
                                                    <View style={styles.compactInfoItem}>
                                                        <BookOpen size={12} color="rgba(255,255,255,0.7)" />
                                                        <View style={styles.compactInfoContent}>
                                                            <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>School</Text>
                                                            <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{currentSchool}</Text>
                                                        </View>
                                                    </View>
                                                )}
                                                {userRoles.length > 0 && (
                                                    <View style={styles.compactInfoItem}>
                                                        <Award size={12} color="rgba(255,255,255,0.7)" />
                                                        <View style={styles.compactInfoContent}>
                                                            <Text style={[styles.compactInfoLabel, { color: cardTextColor }]}>Role</Text>
                                                            <Text style={[styles.compactInfoValue, { color: cardTextColor }]}>{userRoles.join(', ')}</Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                                
                                {/* 徽章和背景組合區域 - 善用空間 */}
                                {(ownedBadges.length > 0 || ownedBackgrounds.length > 0) && (
                                    <View style={styles.collectionSection}>
                                        {ownedBadges.length > 0 && (
                                            <View style={styles.collectionSubsection}>
                                                <View style={styles.miniSectionHeader}>
                                                    <Text style={[styles.miniSectionLabel, { color: cardTextColor }]}>Badges ({ownedBadges.length})</Text>
                                                    <TouchableOpacity
                                                        style={styles.miniViewBtn}
                                                        onPress={() => setShowBadgeModal(true)}
                                                    >
                                                        <Text style={[styles.miniViewText, { color: cardTextColor }]}>Edit</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniBadgesScroll}>
                                                    {ownedBadges.slice(0, 5).map((badge) => (
                                                        <View key={badge.id} style={styles.miniBadgeItem}>
                                                            {renderBadge(badge.iconId, 28)}
                                                        </View>
                                                    ))}
                                                    {ownedBadges.length > 5 && (
                                                        <TouchableOpacity 
                                                            style={styles.moreMiniBtn}
                                                            onPress={() => setShowBadgeModal(true)}
                                                        >
                                                            <Text style={[styles.moreMiniText, { color: cardTextColor }]}>+{ownedBadges.length - 5}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </ScrollView>
                                            </View>
                                        )}
                                        
                                        {ownedBackgrounds.length > 0 && (
                                            <View style={styles.collectionSubsection}>
                                                <View style={styles.miniSectionHeader}>
                                                    <Text style={[styles.miniSectionLabel, { color: cardTextColor }]}>Backgrounds ({ownedBackgrounds.length})</Text>
                                                    <TouchableOpacity
                                                        style={styles.miniViewBtn}
                                                        onPress={() => router.push('/shop')}
                                                    >
                                                        <Text style={[styles.miniViewText, { color: cardTextColor }]}>Shop</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniBackgroundsScroll}>
                                                    {ownedBackgrounds.slice(0, 3).map((background) => (
                                                        <TouchableOpacity
                                                            key={background.id}
                                                            style={styles.miniBackgroundItem}
                                                            onPress={() => handleBackgroundSelect(background.iconId)}
                                                        >
                                                            {renderBackground(background.iconId, 40)}
                                                        </TouchableOpacity>
                                                    ))}
                                                    {ownedBackgrounds.length > 3 && (
                                                        <TouchableOpacity 
                                                            style={styles.moreMiniBtn}
                                                            onPress={() => setShowBackgroundModal(true)}
                                                        >
                                                            <Text style={[styles.moreMiniText, { color: cardTextColor }]}>+{ownedBackgrounds.length - 3}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                )}
                                
                                                                
                                {/* 技能分析區域 */}
                                <View style={styles.skillsSection}>
                                    <Text style={[styles.sectionLabel, { color: cardTextColor }]}>📊 Skills Analysis & AI Tips</Text>
                                    <View style={{ width: chartWidth, alignSelf: 'center' }}>
                                        <SkillBarsChart gameHistory={gameHistory} />
                                    </View>
                                    
                                    {/* AI 建議直接顯示 */}
                                    <View style={{ marginTop: 16 }}>
                                        <Text style={[styles.sectionLabel, { color: cardTextColor, marginBottom: 8 }]}>🤖 AI Learning Suggestions</Text>
                                        {loadingSuggestions ? (
                                            <View style={{ alignItems: 'center', padding: 20 }}>
                                                <ActivityIndicator size="small" color="#4CAF50" />
                                                <Text style={{ marginTop: 8, color: '#636E72', fontSize: 12 }}>AI is analyzing your learning patterns...</Text>
                                            </View>
                                        ) : generateLearningSuggestions.length > 0 ? (
                                            generateLearningSuggestions.slice(0, 3).map((suggestion: any, index: number) => (
                                                <View key={index} style={[styles.suggestionCard, { marginBottom: 8 }]}>
                                                    <View style={styles.suggestionIcon}>
                                                        {suggestion.icon}
                                                    </View>
                                                    <View style={styles.suggestionContent}>
                                                        <Text style={[styles.suggestionTitle, { color: cardTextColor }]}>{suggestion.title}</Text>
                                                        <Text style={[styles.suggestionDescription, { color: cardTextColor }]}>{suggestion.description}</Text>
                                                    </View>
                                                </View>
                                            ))
                                        ) : (
                                            <View style={[styles.statsCard, { alignItems: 'center', padding: 16 }]}>
                                                <Text style={[styles.statsCardTitle, { color: cardTextColor, marginBottom: 8 }]}>Great Job! 🎉</Text>
                                                <Text style={[styles.statsLabel, { textAlign: 'center', color: cardTextColor }]}>
                                                    You're doing excellently! Keep up the good work and continue challenging yourself.
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                    </View>

                    {/* Segmented Control */}
                    <LinearGradient
                        colors={gradientColors}
                        style={styles.segmentedControl}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <TouchableOpacity
                            onPress={() => setRecordMode('recent')}
                            style={[styles.segmentBtn, recordMode === 'recent' && styles.activeSegment]}
                        >
                            <Text style={[styles.segmentText, recordMode === 'recent' && styles.activeSegmentText, { color: cardTextColor }]}>RECENT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setRecordMode('best')}
                            style={[styles.segmentBtn, recordMode === 'best' && styles.activeSegment]}
                        >
                            <Text style={[styles.segmentText, recordMode === 'best' && styles.activeSegmentText, { color: cardTextColor }]}>BEST</Text>
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={styles.activityList}>
                        {displayList.length > 0 ? displayList.map((record: any, index: number) => (
                            <View key={index} style={styles.activityCard}>
                                <View style={styles.gameIconBg}>
                                    {recordMode === 'best' ? <Trophy size={18} color="#F1C40F" /> : renderGameIcon(record.gameType)}
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.activityName, { color: cardTextColor }]}>{record.name}</Text>
                                    <Text style={[styles.activityDate, { color: cardTextColor }]}>{new Date(record.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.scoreContainer}>
                                    <Text style={[styles.activityScore, { color: cardTextColor }, recordMode === 'best' && { color: '#F1C40F' }]}>
                                        {recordMode === 'best' ? 'BEST' : `Score: ${record.scores || 0}`}
                                    </Text>
                                </View>
                            </View>
                        )) : <Text style={styles.emptyText}>No records found.</Text>}
                    </View>

                    {/* View All Game Records Button */}
                    <LinearGradient
                        colors={gradientColors}
                        style={styles.viewAllRecordsBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}
                            onPress={() => router.push('/Profile/GameRecords')}
                        >
                        <List size={20} color="#4CAF50" />
                            <Text style={[styles.viewAllRecordsText, { color: cardTextColor }]}>View All Game Records</Text>
                            <ChevronRight size={20} color={cardTextColor} />
                        </TouchableOpacity>
                    </LinearGradient>

                    <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Password Change Modal */}
                <Modal
                    visible={showPasswordModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowPasswordModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Change Password</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Current Password</Text>
                                <View style={styles.passwordInput}>
                                    <TextInput
                                        style={[styles.textInput, { borderWidth: 0, backgroundColor: 'transparent' }]}
                                        placeholder="Enter current password"
                                        secureTextEntry={!showOldPassword}
                                        value={oldPassword}
                                        onChangeText={setOldPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                                        {showOldPassword ? <EyeOff size={20} color="#636E72" /> : <Eye size={20} color="#636E72" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <View style={styles.passwordInput}>
                                    <TextInput
                                        style={[styles.textInput, { borderWidth: 0, backgroundColor: 'transparent' }]}
                                        placeholder="Enter new password (min 8 characters)"
                                        secureTextEntry={!showNewPassword}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                        {showNewPassword ? <EyeOff size={20} color="#636E72" /> : <Eye size={20} color="#636E72" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {modalMessage.text ? (
                                <Text style={{
                                    color: modalMessage.type === 'success' ? '#4CAF50' : '#FF4757',
                                    textAlign: 'center',
                                    marginBottom: 15,
                                    fontSize: 16,
                                    fontWeight: '600'
                                }}>
                                    {modalMessage.text}
                                </Text>
                            ) : null}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => {
                                        setShowPasswordModal(false);
                                        setOldPassword('');
                                        setNewPassword('');
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={handleChangePassword}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#FFF" />
                                            <Text style={[styles.confirmBtnText, { marginLeft: 8 }]}>Updating...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.confirmBtnText}>Update</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Email Change Modal */}
                <Modal
                    visible={showEmailModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowEmailModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Change Email</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>New Email Address</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter new email address"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                />
                            </View>

                            {modalMessage.text ? (
                                <Text style={{
                                    color: modalMessage.type === 'success' ? '#4CAF50' : '#FF4757',
                                    textAlign: 'center',
                                    marginBottom: 15,
                                    fontSize: 16,
                                    fontWeight: '600'
                                }}>
                                    {modalMessage.text}
                                </Text>
                            ) : null}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => {
                                        setShowEmailModal(false);
                                        setNewEmail('');
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={handleChangeEmail}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#FFF" />
                                            <Text style={[styles.confirmBtnText, { marginLeft: 8 }]}>Updating...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.confirmBtnText}>Update</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Nickname Change Modal */}
                <Modal
                    visible={showNicknameModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowNicknameModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Change Nickname</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>New Nickname</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter your new nickname (max 50 characters)"
                                    value={newNickname}
                                    onChangeText={setNewNickname}
                                    maxLength={50}
                                />
                            </View>

                            {modalMessage.text ? (
                                <Text style={{
                                    color: modalMessage.type === 'success' ? '#4CAF50' : '#FF4757',
                                    textAlign: 'center',
                                    marginBottom: 15,
                                    fontSize: 16,
                                    fontWeight: '600'
                                }}>
                                    {modalMessage.text}
                                </Text>
                            ) : null}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => {
                                        setShowNicknameModal(false);
                                        setNewNickname('');
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={handleChangeNickname}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#FFF" />
                                            <Text style={[styles.confirmBtnText, { marginLeft: 8 }]}>Updating...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.confirmBtnText}>Update</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Missions Modal */}
                <Modal
                    visible={showMissionsModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowMissionsModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                            <Text style={styles.modalTitle}>My Missions</Text>

                            <ScrollView style={{ flex: 1, maxHeight: 300 }}>
                                {userMissions.length > 0 ? userMissions.map((mission: any, index: number) => (
                                    <View key={index} style={styles.missionCard}>
                                        <View style={[styles.missionStatus, {
                                            backgroundColor: mission.completed ? '#4CAF50' : '#FFC107'
                                        }]}>
                                            <Text style={styles.missionStatusText}>
                                                {mission.completed ? '✓' : '○'}
                                            </Text>
                                        </View>
                                        <View style={styles.missionInfo}>
                                            <Text style={styles.missionName}>{mission.name || 'Unknown Mission'}</Text>
                                            <Text style={styles.missionType}>{mission.type || 'Mission'}</Text>
                                            {mission.description && (
                                                <Text style={styles.missionDescription}>{mission.description}</Text>
                                            )}
                                            <View style={styles.missionMeta}>
                                                <Text style={styles.missionDifficulty}>
                                                    {mission.difficulty || 'Easy'}
                                                </Text>
                                                <Text style={styles.missionScores}>
                                                    +{mission.scores || 0} XP
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )) : (
                                    <View style={styles.emptyMissionsContainer}>
                                        <Text style={styles.emptyMissionsText}>No missions yet</Text>
                                        <Text style={styles.emptyMissionsSubText}>Start playing to unlock missions!</Text>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={() => setShowMissionsModal(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Items Modal */}
                <Modal
                    visible={showItemsModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowItemsModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                            <Text style={styles.modalTitle}>My Items</Text>

                            <ScrollView style={{ flex: 1, maxHeight: 300 }}>
                                {userItems.length > 0 ? userItems.map((item: any, index: number) => (
                                    <View key={index} style={styles.itemCard}>
                                        <View style={styles.itemIcon}>
                                            <Text style={styles.itemIconText}>{item.name?.charAt(0) || 'I'}</Text>
                                        </View>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{item.name || 'Unknown Item'}</Text>
                                            <Text style={styles.itemType}>{item.type || 'Item'}</Text>
                                            {item.description && (
                                                <Text style={styles.itemDescription}>{item.description}</Text>
                                            )}
                                        </View>
                                    </View>
                                )) : (
                                    <View style={styles.emptyItemsContainer}>
                                        <Text style={styles.emptyItemsText}>No items yet</Text>
                                        <Text style={styles.emptyItemsSubText}>Complete missions to earn items!</Text>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={() => setShowItemsModal(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Error Feedback Modal */}
                <Modal
                    visible={showErrorFeedbackModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowErrorFeedbackModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Report Issue</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>What went wrong?</Text>
                                <Text style={styles.errorContextText}>{errorContext}</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Please describe what happened (optional)</Text>
                                <TextInput
                                    style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                                    placeholder="Tell us more about what you were trying to do and what happened..."
                                    multiline
                                    value={userFeedback}
                                    onChangeText={setUserFeedback}
                                    maxLength={500}
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => {
                                        setShowErrorFeedbackModal(false);
                                        setUserFeedback('');
                                        setErrorContext('');
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={handleSubmitFeedback}
                                >
                                    <Text style={styles.confirmBtnText}>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Learning Statistics Modal */}
                <Modal
                    visible={showLearningStats}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowLearningStats(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                            <Text style={styles.modalTitle}>Learning Statistics</Text>

                            <ScrollView style={{ flex: 1, maxHeight: 400 }}>
                                <View style={styles.statsCard}>
                                    <Text style={styles.statsCardTitle}>Performance Overview</Text>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Average Score</Text>
                                        <Text style={styles.statsValue}>{calculateLearningStats.averageScore}</Text>
                                    </View>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Best Subject</Text>
                                        <Text style={styles.statsValue}>{calculateLearningStats.bestSubject || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Total Play Time</Text>
                                        <Text style={styles.statsValue}>{calculateLearningStats.totalPlayTime} min</Text>
                                    </View>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Improvement Rate</Text>
                                        <Text style={[styles.statsValue, { color: calculateLearningStats.improvementRate >= 0 ? '#4CAF50' : '#FF4757' }]}>
                                            {calculateLearningStats.improvementRate >= 0 ? '+' : ''}{calculateLearningStats.improvementRate}%
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.statsCard}>
                                    <Text style={styles.statsCardTitle}>Subject Performance</Text>
                                    {Object.entries(calculateLearningStats.subjectAverages).map(([subject, avg]: [string, number]) => (
                                        <View key={subject} style={styles.statsRow}>
                                            <Text style={styles.statsLabel}>{subject}</Text>
                                            <Text style={styles.statsValue}>{avg}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.statsCard}>
                                    <Text style={styles.statsCardTitle}>Difficulty Preference</Text>
                                    {Object.entries(calculateLearningStats.difficultyPreference).map(([difficulty, count]: [string, number]) => (
                                        <View key={difficulty} style={styles.statsRow}>
                                            <Text style={styles.statsLabel}>{difficulty}</Text>
                                            <Text style={styles.statsValue}>{count} games</Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={() => setShowLearningStats(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Equipment & Collection Modal */}
                <Modal
                    visible={showEquipment}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowEquipment(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                            <Text style={styles.modalTitle}>Equipment & Collection</Text>

                            <ScrollView style={{ flex: 1, maxHeight: 400 }}>
                                <View style={styles.statsCard}>
                                    <Text style={styles.statsCardTitle}>Collection Stats</Text>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Total Items</Text>
                                        <Text style={styles.statsValue}>{getEquipmentStats.totalItems}</Text>
                                    </View>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Equipped Items</Text>
                                        <Text style={styles.statsValue}>{getEquipmentStats.equippedCount}</Text>
                                    </View>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Collection Progress</Text>
                                        <Text style={styles.statsValue}>{getEquipmentStats.collectionProgress}%</Text>
                                    </View>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsLabel}>Rare Items</Text>
                                        <Text style={styles.statsValue}>{getEquipmentStats.rareItems.length}</Text>
                                    </View>
                                </View>

                                <View style={styles.statsCard}>
                                    <Text style={styles.statsCardTitle}>Equipped Items</Text>
                                    <View style={styles.equipmentGrid}>
                                        {Object.entries(getEquipmentStats.equipped).map(([type, itemId]: [string, any]) => (
                                            <View key={type} style={styles.equipmentItem}>
                                                <Text style={styles.equipmentIcon}>
                                                    {type === 'AVATAR' ? '👤' : type === 'BADGE' ? '🏆' : '🎨'}
                                                </Text>
                                                <Text style={styles.equipmentName}>{type}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {getEquipmentStats.rareItems.length > 0 && (
                                    <View style={styles.statsCard}>
                                        <Text style={styles.statsCardTitle}>Rare Items</Text>
                                        {getEquipmentStats.rareItems.map((item: any, index: number) => (
                                            <View key={index} style={styles.statsRow}>
                                                <Text style={styles.statsLabel}>{item.name}</Text>
                                                <Text style={styles.statsValue}>{item.price} pts</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={() => setShowEquipment(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Learning Trends Modal */}
                <Modal
                    visible={showTrends}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowTrends(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                            <Text style={styles.modalTitle}>Learning Trends</Text>

                            <ScrollView style={{ flex: 1, maxHeight: 400 }}>
                                <View style={styles.chartContainer}>
                                    <Text style={styles.chartTitle}>Recent Performance (Last 7 Games)</Text>
                                    {prepareTrendData.labels.length > 0 ? (
                                        <LineChart
                                            data={prepareTrendData}
                                            width={width * 0.7}
                                            height={200}
                                            chartConfig={{
                                                backgroundColor: '#FFF',
                                                backgroundGradientFrom: '#FFF',
                                                backgroundGradientTo: '#FFF',
                                                decimalPlaces: 0,
                                                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                                                labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
                                                style: {
                                                    borderRadius: 16
                                                },
                                                propsForDots: {
                                                    r: '4',
                                                    strokeWidth: '2',
                                                    stroke: '#4CAF50'
                                                }
                                            }}
                                            bezier
                                            style={{
                                                marginVertical: 8,
                                                borderRadius: 16
                                            }}
                                        />
                                    ) : (
                                        <Text style={styles.emptyText}>No data available</Text>
                                    )}
                                </View>

                                <View style={styles.chartContainer}>
                                    <Text style={styles.chartTitle}>Subject Performance</Text>
                                    {prepareSubjectData.labels.length > 0 ? (
                                        <BarChart
                                            data={prepareSubjectData}
                                            width={width * 0.7}
                                            height={200}
                                            yAxisLabel="Score"
                                            yAxisSuffix=""
                                            chartConfig={{
                                                backgroundColor: '#FFF',
                                                backgroundGradientFrom: '#FFF',
                                                backgroundGradientTo: '#FFF',
                                                decimalPlaces: 0,
                                                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                                                labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
                                                style: {
                                                    borderRadius: 16
                                                }
                                            }}
                                            style={{
                                                marginVertical: 8,
                                                borderRadius: 16
                                            }}
                                        />
                                    ) : (
                                        <Text style={styles.emptyText}>No data available</Text>
                                    )}
                                </View>

                                <View style={styles.chartContainer}>
                                    <Text style={styles.chartTitle}>Difficulty Preference</Text>
                                    {prepareDifficultyData.labels.length > 0 ? (
                                        <RNPieChart
                                            data={prepareDifficultyData.labels.map((label: string, index: number) => ({
                                                name: label,
                                                population: prepareDifficultyData.datasets[0].data[index],
                                                color: label === 'EASY' ? '#4CAF50' : label === 'MEDIUM' ? '#FF9800' : '#F44336',
                                                legendFontColor: '#2D3436',
                                                legendFontSize: 12
                                            }))}
                                            width={width * 0.7}
                                            height={200}
                                            chartConfig={{
                                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
                                            }}
                                            accessor="population"
                                            backgroundColor="transparent"
                                            paddingLeft="15"
                                            center={[10, 10]}
                                            absolute
                                        />
                                    ) : (
                                        <Text style={styles.emptyText}>No data available</Text>
                                    )}
                                </View>
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={() => setShowTrends(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Learning Suggestions Modal */}
                <Modal
                    visible={showSuggestions}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowSuggestions(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                            <Text style={styles.modalTitle}>Learning Suggestions</Text>

                            <ScrollView style={{ flex: 1, maxHeight: 400 }}>
                                {loadingSuggestions ? (
                                    <View style={{ alignItems: 'center', padding: 40 }}>
                                        <ActivityIndicator size="large" color="#4CAF50" />
                                        <Text style={{ marginTop: 10, color: '#636E72' }}>AI is analyzing your learning patterns...</Text>
                                    </View>
                                ) : aiSuggestions.length > 0 ? (
                                    aiSuggestions.map((suggestion: any, index: number) => (
                                        <View key={index} style={styles.suggestionCard}>
                                            <View style={styles.suggestionIcon}>
                                                {suggestion.type === 'strength' && <Trophy size={16} color="#4CAF50" />}
                                                {suggestion.type === 'weakness' && <Target size={16} color="#FF6B6B" />}
                                                {suggestion.type === 'recommendation' && <Zap size={16} color="#FFA500" />}
                                            </View>
                                            <View style={styles.suggestionContent}>
                                                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                                                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                                                <View style={styles.suggestionPriority}>
                                                    <Text style={[
                                                        styles.priorityText,
                                                        {
                                                            color: suggestion.priority === 'high' ? '#FF6B6B' :
                                                                suggestion.priority === 'medium' ? '#FFA500' : '#4CAF50'
                                                        }
                                                    ]}>
                                                        {suggestion.priority?.toUpperCase() || 'MEDIUM'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                ) : generateLearningSuggestions.length > 0 ? (
                                    generateLearningSuggestions.map((suggestion: any, index: number) => (
                                        <View key={index} style={styles.suggestionCard}>
                                            <View style={styles.suggestionIcon}>
                                                {suggestion.icon}
                                            </View>
                                            <View style={styles.suggestionContent}>
                                                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                                                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.statsCard}>
                                        <Text style={styles.statsCardTitle}>Great Job! 🎉</Text>
                                        <Text style={[styles.statsLabel, { textAlign: 'center', marginTop: 10 }]}>
                                            You're doing excellently! Keep up the good work and continue challenging yourself.
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.statsCard}>
                                    <Text style={styles.statsCardTitle}>AI Learning Strategy Suggestions</Text>
                                    <Text style={styles.statsLabel}>🧠 **Principles of Cognitive Science**: Spaced repetition is more effective than massed learning</Text>
                                    <Text style={styles.statsLabel}>⏰ **Optimal Study Duration**: 25-30 minutes each session, followed by a 5-minute break</Text>
                                    <Text style={styles.statsLabel}>🎯 **Goal Setting**: Set specific and measurable learning objectives</Text>
                                    <Text style={styles.statsLabel}>🔄 **Diverse Learning**: Combining different levels of difficulty and subjects to enhance overall abilities</Text>
                                    <Text style={styles.statsLabel}>📊 **Data-Driven**: Regularly check learning data and adjust learning strategies</Text>
                                </View>
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={() => setShowSuggestions(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Edit Profile Modal */}
                <Modal
                    visible={showEditProfileModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowEditProfileModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>⚙️ Edit Profile</Text>

                            <ScrollView style={{ flex: 1, maxHeight: 400 }}>
                                <View style={styles.editSection}>
                                    <Text style={styles.editSectionTitle}>👤 Personal Information</Text>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Nickname</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editFormData.nickname ?? displayUser?.nickname ?? ''}
                                            onChangeText={(text) => setEditFormData(prev => ({ ...prev, nickname: text }))}
                                            placeholder="Enter your nickname"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Email</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editFormData.email ?? displayUser?.email ?? ''}
                                            onChangeText={(text) => setEditFormData(prev => ({ ...prev, email: text }))}
                                            placeholder="Enter your email"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    {/* Security 部分 */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Current Password</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editFormData.oldPassword ?? ''}
                                            onChangeText={(text) => setEditFormData(prev => ({ ...prev, oldPassword: text }))}
                                            placeholder="Enter current password"
                                            secureTextEntry
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>New Password</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editFormData.password ?? ''}
                                            onChangeText={(text) => setEditFormData(prev => ({ ...prev, password: text }))}
                                            placeholder="Enter new password (optional)"
                                            secureTextEntry
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Confirm Password</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editFormData.confirmPassword ?? ''}
                                            onChangeText={(text) => setEditFormData(prev => ({ ...prev, confirmPassword: text }))}
                                            placeholder="Confirm new password"
                                            secureTextEntry
                                        />
                                    </View>
                                </View>
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={() => {
                                        setShowEditProfileModal(false);
                                        setEditFormData({
                                            nickname: '',
                                            email: '',
                                            password: '',
                                            confirmPassword: '',
                                            oldPassword: ''
                                        });
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={async () => {
                                        try {
                                            const updateData: any = {
                                                nickname: editFormData.nickname || displayUser?.nickname || '',
                                            };
                                            await axios.post(`${getApiBaseUrl()}/api/user/profile`, updateData, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });

                                            if (editFormData.email && editFormData.email !== displayUser?.email) {
                                                await axios.post(`${getApiBaseUrl()}/api/user/email`,
                                                    { newEmail: editFormData.email.trim() },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                            }

                                            if (editFormData.password && editFormData.password.trim() !== '') {
                                                if (!editFormData.oldPassword || editFormData.oldPassword.trim() === '') {
                                                    Alert.alert('Error', 'Current password is required to change password');
                                                    return;
                                                }
                                                if (editFormData.password !== editFormData.confirmPassword) {
                                                    Alert.alert('Error', 'Passwords do not match');
                                                    return;
                                                }
                                                if (editFormData.password.length < 8) {
                                                    Alert.alert('Error', 'Password must be at least 8 characters');
                                                    return;
                                                }
                                                await axios.post(`${getApiBaseUrl()}/api/user/password`,
                                                    { oldPassword: editFormData.oldPassword, newPassword: editFormData.password },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                            }

                                            Alert.alert('Success', 'Profile updated successfully!');
                                            setShowEditProfileModal(false);
                                            setEditFormData({
                                                nickname: '',
                                                email: '',
                                                password: '',
                                                confirmPassword: '',
                                                oldPassword: ''
                                            });

                                            const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            setProfileData((prev: any) => ({
                                                ...profileResponse.data,
                                                email: editFormData.email?.trim() || profileResponse.data.email,
                                                nickname: editFormData.nickname?.trim() || profileResponse.data.nickname,
                                                userGameScores: prev?.userGameScores || []
                                            }));

                                        } catch (error: any) {
                                            console.error('Profile update error:', error);
                                            let errorMessage = 'Failed to update profile';
                                            if (error.response?.data?.message) {
                                                errorMessage = error.response.data.message;
                                            }
                                            Alert.alert('Error', errorMessage);
                                        }
                                    }}
                                >
                                    <Text style={styles.confirmBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <AvatarSelector
                    visible={showAvatarModal}
                    onClose={() => setShowAvatarModal(false)}
                    onSelect={handleAvatarSelect}
                    selectedAvatar={selectedAvatar}
                    userItems={processedUserItems}
                    onGoToShop={() => router.push('/shop')}
                />

                <BadgeSelector
                    visible={showBadgeModal}
                    onClose={() => setShowBadgeModal(false)}
                    onSelect={handleBadgeSelect}
                    selectedBadges={selectedBadges}
                    userItems={processedUserItems}
                    onGoToShop={() => router.push('/shop')}
                />

                <BackgroundSelector
                    visible={showBackgroundModal}
                    onClose={() => setShowBackgroundModal(false)}
                    onSelect={handleBackgroundSelect}
                    selectedBackground={selectedBackground}
                    userItems={processedUserItems}
                    onGoToShop={() => router.push('/shop')}
                />
            </SafeAreaView>
        </View>
    );
}

// Styles (unchanged, keep existing styles)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    unifiedCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',  // 半透明白色
        borderRadius: 28,
        marginHorizontal: 24,                         // 縮小寬度，左右留白更多
        marginBottom: 24,
        paddingVertical: 20,
        paddingHorizontal: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
        marginVertical: 16,
    },
    unifiedProfileContainer: { marginHorizontal: 32, marginTop: 20 },
    profileCover: {
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        elevation: 8,
        marginBottom: 20,
        // 移除固定背景色，改為半透明
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    profileCoverGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // 移除固定顏色，改為黑色半透明漸層
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    profileContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: 30 },
    fullScreenBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    unifiedTransparentContainer: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        elevation: 2,
    },
    avatarAndBadgeRow: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
    avatarContainer: { position: 'relative', marginRight: 0 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.3)' },
    badgeContainer: { alignItems: 'center', marginLeft: 10 },
    badgeLabel: { fontSize: 10, color: '#FFF', marginTop: 4, fontWeight: '500' },
    profileInfo: { flex: 1 },
    userName: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 4 },
    userTitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 15 },
    profileStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 4 },
    statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 12 },
    statValue: { fontSize: 16, fontWeight: '700', color: '#FFF', marginLeft: 4 },
    statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginLeft: 4 },
    profileActions: { flexDirection: 'row', gap: 10 },
    inventoryBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)', position: 'relative' },
    inventoryBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF6B6B', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    inventoryBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
    editProfileBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)' },
    masterInfoCard: {
        backgroundColor: 'rgba(255,255,255,0.85)',  // 提高不透明度，減少疊加問題
        borderRadius: 20,
        padding: 16,  // 減少padding，善用空間
        marginTop: 20,
        marginHorizontal: 32,  // 統一寬度
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.85)',
    },
    // 移除的舊樣式 - 已合併到 masterInfoCard
    // 主卡片內部樣式
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 24, fontWeight: '900' },
    editCardBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    infoSection: { marginBottom: 16 },
    sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    // 緊湊布局樣式
    compactInfoGrid: { gap: 6 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    compactInfoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(248,249,250,0.2)', borderRadius: 8, padding: 6 },
    compactInfoContent: { marginLeft: 8, flex: 1 },
    compactInfoLabel: { fontSize: 12, marginBottom: 1 },
    compactInfoValue: { fontSize: 14, fontWeight: '700' },
    // 收藏品區域樣式
    collectionSection: { marginBottom: 16 },
    collectionSubsection: { marginBottom: 12 },
    miniSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    miniSectionLabel: { fontSize: 14, fontWeight: '700' },
    miniViewBtn: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 8 },
    miniViewText: { fontSize: 12, fontWeight: '600' },
    miniBadgesScroll: { flexDirection: 'row' },
    miniBadgeItem: { alignItems: 'center', marginRight: 8 },
    miniBackgroundsScroll: { flexDirection: 'row' },
    miniBackgroundItem: { alignItems: 'center', marginRight: 8 },
    moreMiniBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center' },
    moreMiniText: { fontSize: 9, fontWeight: '700' },
    actionsSection: { marginBottom: 16 },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, padding: 10 },
    actionBtnText: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
    skillsSection: { marginBottom: 0 },
    skillsChartContainer: {
        backgroundColor: 'rgba(248,249,250,0.3)',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        minHeight: 120,   // 减小最小高度
        maxHeight: 130,   // 减小最大高度
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', alignSelf: 'flex-start', marginBottom: 10 },
    segmentedControl: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 32, marginTop: 20, padding: 4, borderRadius: 16, borderWidth: 2, borderColor: '#4CAF50' },
    segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    activeSegment: { backgroundColor: '#4CAF50', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    segmentText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
    activeSegmentText: { color: '#4CAF50', fontSize: 14, fontWeight: '800' },
    activityList: { marginHorizontal: 32, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    activityCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
    gameIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    activityName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
    row: { flexDirection: 'row', alignItems: 'center' },
    activityDifficulty: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
    dot: { color: 'rgba(255,255,255,0.85)' },
    activityDate: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
    scoreContainer: { alignItems: 'flex-end' },
    activityScore: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
    activityScoreValue: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
    logoutBtn: { margin: 20, padding: 15, backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center' },
    logoutText: { color: '#FF4757', fontWeight: '800', fontSize: 18 },
    emptyText: { textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.85)' },
    viewAllRecordsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#4CAF50', marginVertical: 15, marginHorizontal: 32 },
    viewAllRecordsText: { fontSize: 18, fontWeight: '700', color: '#4CAF50', flex: 1, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, width: '85%', maxWidth: 400 },
    modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
    inputContainer: { marginBottom: 20 },
    inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
    textInput: { backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, borderWidth: 1, borderColor: '#E2E8F0' },
    passwordInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8F9FA', paddingHorizontal: 15 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
    cancelBtn: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E2E8F0' },
    cancelBtnText: { fontWeight: '800', fontSize: 16 },
    confirmBtn: { backgroundColor: '#4CAF50' },
    confirmBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    errorContextText: { fontSize: 14, color: '#FF4757', fontWeight: '600', backgroundColor: '#FFF5F5', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FFB6B6' },
    itemCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F2F6' },
    itemIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemIconText: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 18, fontWeight: '800' },
    itemType: { fontSize: 14, marginTop: 2 },
    itemDescription: { fontSize: 14, color: '#A0A0A0', marginTop: 4 },
    emptyItemsContainer: { alignItems: 'center', padding: 40 },
    emptyItemsText: { fontSize: 18, fontWeight: 'bold', color: '#636E72' },
    emptyItemsSubText: { fontSize: 14, color: '#A0A0A0', marginTop: 5 },
    missionCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F2F6' },
    missionStatus: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    missionStatusText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
    missionInfo: { flex: 1 },
    missionName: { fontSize: 18, fontWeight: '800' },
    missionType: { fontSize: 14, color: '#636E72', marginTop: 2 },
    missionDescription: { fontSize: 14, color: '#A0A0A0', marginTop: 4 },
    missionMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    missionDifficulty: { fontSize: 13, fontWeight: '700', color: '#FF9800' },
    missionScores: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
    emptyMissionsContainer: { alignItems: 'center', padding: 40 },
    emptyMissionsText: { fontSize: 16, fontWeight: 'bold', color: '#636E72' },
    emptyMissionsSubText: { fontSize: 12, color: '#A0A0A0', marginTop: 5 },
    statsCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    statsCardTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 10 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statsLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
    statsValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    equipmentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    equipmentItem: { width: '48%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    equipmentIcon: { fontSize: 24, marginBottom: 5 },
    equipmentName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
    suggestionCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center' },
    suggestionIcon: { marginRight: 15 },
    suggestionContent: { flex: 1 },
    suggestionTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
    suggestionDescription: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 5 },
    suggestionPriority: { alignSelf: 'flex-start' },
    priorityText: { fontSize: 12, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
    chartContainer: { marginVertical: 10, alignItems: 'center' },
    chartTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 5, textAlign: 'center' },
    editSection: { marginBottom: 20 },
    editSectionTitle: { fontSize: 18, fontWeight: '800', color: '#2D3436', marginBottom: 12 },
    // Styles for multiple badges display
    badgesSection: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    badgesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
        marginLeft: 6,
    },
    badgesCount: {
        fontSize: 14,
        color: '#636E72',
        marginLeft: 4,
    },
    editBadgesBtn: {
        marginLeft: 'auto',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
    },
    editBadgesText: {
        fontSize: 13,
        color: '#3498DB',
        fontWeight: '600',
    },
    badgesScroll: {
        flexDirection: 'row',
    },
    badgeItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 80,           // 增加寬度以容納更長的名稱
    },
    badgeItemName: {
        fontSize: 12,
        color: '#2D3436',
        marginTop: 4,
        textAlign: 'center',
        flexWrap: 'wrap',    // 允許換行
        width: 80,           // 與父容器一致
    },
    backgroundsSection: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    backgroundsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    backgroundsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
        marginLeft: 6,
    },
    backgroundsCount: {
        fontSize: 14,
        color: '#636E72',
        marginLeft: 4,
    },
    editBackgroundsBtn: {
        marginLeft: 'auto',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
    },
    editBackgroundsText: {
        fontSize: 13,
        color: '#3498DB',
        fontWeight: '600',
    },
    backgroundsScroll: {
        flexDirection: 'row',
    },
    backgroundItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 100,
    },
    backgroundItemName: {
        fontSize: 12,
        color: '#2D3436',
        marginTop: 4,
        textAlign: 'center',
        flexWrap: 'wrap',
        width: 100,
    },
    profileBadgesScroll: {
        marginVertical: 8,
        maxHeight: 40,
    },
    profileBadgeItem: {
        marginRight: 8,
    },
    inputGroup: { marginBottom: 15 },
    // 新增的簡化樣式
    infoCardTitle: { fontSize: 16, fontWeight: '800', color: '#2D3436', marginBottom: 12 },
    basicInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    infoColumn: { flex: 1, paddingHorizontal: 8 },
    miniBadgesSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
    miniSectionTitle: { fontSize: 13, fontWeight: '700', color: '#636E72', marginBottom: 8 },

    moreBadgesBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
    moreBadgesText: { fontSize: 10, fontWeight: '700', color: '#636E72' },
    quickActionBtn: { alignItems: 'center', padding: 8 },
    quickActionText: { fontSize: 11, fontWeight: '700', color: '#2D3436', marginTop: 4 },
});
