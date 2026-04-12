import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
    StatusBar, Dimensions, ActivityIndicator, TextInput, Modal, Alert
} from 'react-native';
import {
    Trophy, Gamepad2, Mail, User as UserIcon, Settings, ChevronRight,
    LogOut, Calculator, BookOpen, Brain, FlaskConical, Eye, EyeOff, Key, ShoppingCart, List,
    Calendar, Clock, TrendingUp, Award, Target, Zap, Star, BarChart3, PieChart, Package
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import SkillBarsChart from "@/app/Profile/SkillRadarChart";
import { LineChart, BarChart, PieChart as RNPieChart } from 'react-native-chart-kit';
import {AvatarSelector, renderAvatar} from "@/app/Profile/AvatarSelector";

const { width } = Dimensions.get('window');

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

    // School change state
    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [newSchool, setNewSchool] = useState('');
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

    const [modalMessage, setModalMessage] = useState({ text: '', type: '' }); // type: 'error' | 'success'

    // AI Learning suggestions state
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Enhanced Profile states
    const [showLearningStats, setShowLearningStats] = useState(false);
    const [showEquipment, setShowEquipment] = useState(false);
    const [showTrends, setShowTrends] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Edit Profile states
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nickname: '',
        email: '',
        school: '',
        password: '',
        confirmPassword: ''
    });





    // Profile Icon selection states
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<string>('default');

    const avatarOptions = [
        // Avatar options are now handled in AvatarSelector component
        { id: 'default', emoji: 'default', name: 'Default', color: '#636E72' },
        { id: 'happy', emoji: 'happy', name: 'Happy Face', color: '#FFD93D' },
        { id: 'cool', emoji: 'cool', name: 'Cool Kid', color: '#4ECDC4' },
        { id: 'smart', emoji: 'smart', name: 'Smart Student', color: '#9B59B6' },
        { id: 'sporty', emoji: 'sporty', name: 'Sporty', color: '#FF6B6B' },
        { id: 'artistic', emoji: 'artistic', name: 'Artistic', color: '#FF9FF3' },
        { id: 'bookworm', emoji: 'bookworm', name: 'Bookworm', color: '#54A0FF' },
        { id: 'explorer', emoji: 'explorer', name: 'Explorer', color: '#1DD1A1' },
        { id: 'star', emoji: 'star', name: 'Star Student', color: '#FFA502' },
        { id: 'rainbow', emoji: 'rainbow', name: 'Rainbow', color: '#A29BFE' },
        { id: 'rocket', emoji: 'rocket', name: 'Rocket', color: '#FF6348' },
        { id: 'heart', emoji: 'heart', name: 'Heart', color: '#FF4757' }
    ];

    // Function to update avatar selection
    const handleAvatarSelect = async (avatarId: string) => {
        try {
            setSelectedAvatar(avatarId);
            setShowAvatarModal(false);

            // Here you would save the avatar selection to backend
            await axios.post(`${getApiBaseUrl()}/api/user/avatar`,
                 { avatar: avatarId },
                 { headers: { Authorization: `Bearer ${token}` } }
             );

            Alert.alert('Success', 'Avatar updated successfully!');
        } catch (error) {
            console.error('Avatar update error:', error);
            Alert.alert('Error', 'Failed to update avatar');
        }
    };

    // Function to show error with feedback option
    const showErrorWithFeedback = (errorMessage: string, context: string) => {
        Alert.alert(
            'Error',
            errorMessage,
            [
                {
                    text: 'OK',
                    style: 'cancel'
                },
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
                    // Fetch profile data
                    const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProfileData(profileResponse.data);

                    // Fetch school info
                    try {
                        const schoolResponse = await axios.get(`${getApiBaseUrl()}/api/user/school`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setCurrentSchool(schoolResponse.data);
                    } catch (error) {
                        console.log("School info not available");
                    }

                    // Fetch user items
                    try {
                        const itemsResponse = await axios.get(`${getApiBaseUrl()}/api/user/item/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUserItems(itemsResponse.data || []);
                    } catch (error) {
                        console.log("Items info not available");
                    }

                    // Fetch user missions
                    try {
                        const missionsResponse = await axios.get(`${getApiBaseUrl()}/api/user/mission/`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUserMissions(missionsResponse.data || []);
                    } catch (error) {
                        console.log("Missions info not available");
                    }

                    // Fetch user roles
                    try {
                        const rolesResponse = await axios.get(`${getApiBaseUrl()}/api/user/roles`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setUserRoles(rolesResponse.data || []);
                    } catch (error) {
                        console.log("Roles info not available");
                    }

                    // Fetch game history separately
                    const gameHistoryResponse = await axios.get(`${getApiBaseUrl()}/api/user/game/score`, {
                        params: { page: 0, size: 50 }, // Get up to 50 recent game records
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Combine profile data with game history
                    setProfileData({
                        ...profileResponse.data,
                        userGameScores: gameHistoryResponse.data.content || []
                    });
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

    // Move calculateImprovementRate before calculateLearningStats
    const calculateImprovementRate = useCallback(() => {
        if (gameHistory.length < 3) return 0;
        
        // 按時間排序遊戲記錄
        const sortedHistory = [...gameHistory].sort((a, b) => 
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        
        // 使用加權平均：最近的遊戲權重更高
        const totalGames = sortedHistory.length;
        const recentCount = Math.min(10, totalGames); // 最近10個遊戲
        const earlierCount = Math.min(10, totalGames - recentCount); // 早期10個遊戲
        
        const recentGames = sortedHistory.slice(-recentCount);
        const earlierGames = sortedHistory.slice(0, earlierCount);
        
        // 計算加權平均（越近權重越高）
        const calculateWeightedAverage = (games: any[], baseWeight: number) => {
            if (games.length === 0) return 0;
            
            let weightedSum = 0;
            let totalWeight = 0;
            
            games.forEach((game, index) => {
                // 權重：baseWeight + index (越新的遊戲權重越高)
                const weight = baseWeight + index;
                const score = game.scores || 0;
                
                weightedSum += score * weight;
                totalWeight += weight;
            });
            
            return weightedSum / totalWeight;
        };
        
        const recentWeightedAvg = calculateWeightedAverage(recentGames, 1);
        const earlierWeightedAvg = earlierGames.length > 0 ? 
            calculateWeightedAverage(earlierGames, 1) : recentWeightedAvg;
        
        // 計算改善率，使用加權平均
        const improvementRate = earlierWeightedAvg > 0 ? 
            ((recentWeightedAvg - earlierWeightedAvg) / earlierWeightedAvg) * 100 : 0;
        
        return Math.round(improvementRate);
    }, [gameHistory]);

    // Enhanced Analytics Functions
    const calculateLearningStats = useMemo(() => {
        if (gameHistory.length === 0) return {
            subjectAverages: {},
            bestSubject: null,
            difficultyPreference: {},
            totalPlayTime: 0,
            averageScore: 0,
            improvementRate: 0
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
        let bestSubject = null;
        let bestAverage = 0;

        Object.entries(subjectScores).forEach(([subject, scores]: [string, number[]]) => {
            const average = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
            subjectAverages[subject] = Math.round(average);
            if (average > bestAverage) {
                bestAverage = average;
                bestSubject = subject;
            }
        });

        // 計算更真實的學習時間
        const calculateRealisticPlayTime = () => {
            if (gameHistory.length === 0) return 0;
            
            // 基於難度估算時間
            const difficultyTimeMap: { [key: string]: number } = {
                'EASY': 5,    // 簡單題目約5分鐘
                'MEDIUM': 10,  // 中等題目約10分鐘
                'HARD': 15     // 困難題目約15分鐘
            };
            
            let totalTime = 0;
            gameHistory.forEach((record: any) => {
                const difficulty = record.gameDifficulty || 'MEDIUM';
                const estimatedTime = difficultyTimeMap[difficulty] || 10;
                totalTime += estimatedTime;
            });
            
            return totalTime;
        };
        
        return {
            subjectAverages,
            bestSubject,
            difficultyPreference: difficultyCount,
            totalPlayTime: calculateRealisticPlayTime(),
            averageScore: Math.round(totalScore / gameHistory.length),
            improvementRate: calculateImprovementRate()
        };
    }, [gameHistory, calculateImprovementRate]);

    const getEquipmentStats = useMemo(() => {
        const equipped = profileData?.equipped_items || {};
        const totalItems = userItems.length;
        const equippedCount = Object.values(equipped).filter(item => item !== null).length;
        
        return {
            equipped,
            totalItems,
            equippedCount,
            collectionProgress: Math.round((equippedCount / Math.max(totalItems, 1)) * 100),
            rareItems: userItems.filter(item => {
                const itemData = item;
                return itemData.price > 100; // 假設價格超過100的為稀有物品
            })
        };
    }, [profileData, userItems]);

    const generateLearningSuggestions = useMemo(() => {
        const stats = calculateLearningStats;
        const suggestions = [];

        // AI 分析 1: 弱項科目深度分析
        const subjectEntries = Object.entries(stats.subjectAverages);
        if (subjectEntries.length > 0) {
            const sortedSubjects = subjectEntries.sort(([, a], [, b]) => a - b);
            const weakestSubject = sortedSubjects[0];
            const strongestSubject = sortedSubjects[sortedSubjects.length - 1];
            
            if (weakestSubject[1] < 70) {
                const gap = strongestSubject[1] - weakestSubject[1];
                suggestions.push({
                    type: 'weakness',
                    icon: <Target size={16} color="#FF6B6B" />,
                    title: `重點加強${weakestSubject[0]}`,
                    description: `你的${weakestSubject[0]}平均${weakestSubject[1]}分，與最強項${strongestSubject[0]}相差${gap}分。建議每天專注練習15-20分鐘。`
                });
            }
        }

        // AI 分析 2: 學習模式分析
        const totalGames = Object.values(stats.difficultyPreference).reduce((a, b) => a + b, 0);
        const easyRatio = (stats.difficultyPreference['EASY'] || 0) / totalGames;
        const mediumRatio = (stats.difficultyPreference['MEDIUM'] || 0) / totalGames;
        const hardRatio = (stats.difficultyPreference['HARD'] || 0) / totalGames;
        
        if (easyRatio > 0.6) {
            suggestions.push({
                type: 'challenge',
                icon: <Zap size={16} color="#FFA500" />,
                title: '突破舒適區',
                description: `你${Math.round(easyRatio * 100)}%的時間都在簡單模式。AI分析顯示你已經掌握基礎，建議嘗試中等難度來刺激大腦發展。`
            });
        } else if (hardRatio > 0.4 && stats.averageScore < 80) {
            suggestions.push({
                type: 'balance',
                icon: <BarChart3 size={16} color="#9C27B0" />,
                title: '平衡難度選擇',
                description: `你經常挑戰困難模式但平均分數較低。建議先在中等難度鞏固基礎，再挑戰高難度。`
            });
        }

        // AI 分析 3: 學習一致性模式
        if (gameHistory.length >= 5) {
            const recentScores = gameHistory.slice(-5).map(g => g.scores || 0);
            const scoreVariance = Math.sqrt(recentScores.reduce((sum, score) => {
                const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
                return sum + Math.pow(score - mean, 2);
            }, 0) / recentScores.length);
            
            if (scoreVariance > 20) {
                suggestions.push({
                    type: 'consistency',
                    icon: <TrendingUp size={16} color="#4ECDC4" />,
                    title: '提升學習穩定性',
                    description: `AI分析顯示你的分數波動較大。建議建立固定的學習時間，保持規律的練習節奏。`
                });
            }
        }

        // AI 分析 4: 最佳學習時間建議
        if (gameHistory.length >= 3) {
            const recentGames = gameHistory.slice(-3);
            const avgRecentScore = recentGames.reduce((sum, game) => sum + (game.scores || 0), 0) / recentGames.length;
            
            if (avgRecentScore > stats.averageScore * 1.1) {
                suggestions.push({
                    type: 'momentum',
                    icon: <Star size={16} color="#FFD93D" />,
                    title: '保持學習勢頭',
                    description: `你最近的表現超出平均水平${Math.round(((avgRecentScore - stats.averageScore) / stats.averageScore) * 100)}%！這是學習的黃金時期，建議增加練習頻率。`
                });
            }
        }

        // AI 分析 5: 個人化學習路徑
        if (stats.averageScore >= 85 && Object.keys(stats.subjectAverages).length >= 3) {
            const balancedSubjects = Object.values(stats.subjectAverages).filter(score => score >= 80).length;
            if (balancedSubjects >= 2) {
                suggestions.push({
                    type: 'advanced',
                    icon: <Award size={16} color="#4CAF50" />,
                    title: '進階學習建議',
                    description: `你在多個科目都表現優秀！AI建議你可以開始嘗試跨科目綜合練習，或參與更具挑戰性的任務。`
                });
            }
        }

        // AI 分析 6: 學習習慣優化
        const daysSinceFirstGame = gameHistory.length > 0 ? 
            Math.ceil((Date.now() - new Date(gameHistory[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const gamesPerDay = daysSinceFirstGame > 0 ? gameHistory.length / daysSinceFirstGame : 0;
        
        if (gamesPerDay < 0.5 && gameHistory.length < 10) {
            suggestions.push({
                type: 'habit',
                icon: <Calendar size={16} color="#2196F3" />,
                title: '建立學習習慣',
                description: `AI分析建議每天至少完成1-2個遊戲，保持學習連續性。研究表明規律的學習比間歇學習效果更好。`
            });
        }

        return suggestions;
    }, [calculateLearningStats, gameHistory]);

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

    // Chart data preparation
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
        
        return {
            labels: subjects,
            datasets: [{
                data: scores
            }]
        };
    }, [calculateLearningStats]);

    const prepareDifficultyData = useMemo(() => {
        const stats = calculateLearningStats;
        const difficulties = Object.keys(stats.difficultyPreference);
        const counts = difficulties.map((diff: string) => stats.difficultyPreference[diff]);
        
        return {
            labels: difficulties,
            datasets: [{
                data: counts
            }]
        };
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

            Alert.alert('Success', 'Password changed successfully');
            setModalMessage({ text: 'Password changed successfully!', type: 'success' });
            setTimeout(() => {
                setShowPasswordModal(false);
                setModalMessage({ text: '', type: '' });
            }, 1500);
            setOldPassword('');
            setNewPassword('');
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
            await axios.post(`${getApiBaseUrl()}/api/user/email`,
                { newEmail: newEmail.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Success', 'Email changed successfully');
            setModalMessage({ text: 'Email changed successfully!', type: 'success' });
            setTimeout(() => {
                setShowEmailModal(false);
                setModalMessage({ text: '', type: '' });
            }, 1500);
            setNewEmail('');

            // Refresh profile data to get new email
            const response = await axios.get(`${getApiBaseUrl()}/api/user/profile/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileData(response.data);
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
            showErrorWithFeedback(errorMessage, context);
        } finally {
            setLoading(false);
        }
    };

    // School change function
    const handleChangeSchool = async () => {
        if (!newSchool || newSchool.trim() === '') {
            setModalMessage({ text: 'Please enter a school name', type: 'error' });
            showErrorWithFeedback('Please enter a school name', 'School Change - Empty Field');
            return;
        }

        if (newSchool.trim().length > 100) {
            setModalMessage({ text: 'School name must be 100 characters or less', type: 'error' });
            showErrorWithFeedback('School name must be 100 characters or less', 'School Change - Too Long');
            return;
        }

        try {
            setLoading(true);
            await axios.post(`${getApiBaseUrl()}/api/user/school`,
                { school: newSchool.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Success', 'School updated successfully');
            setModalMessage({ text: 'School updated successfully!', type: 'success' });
            setTimeout(() => {
                setShowSchoolModal(false);
                setModalMessage({ text: '', type: '' });
            }, 1500);
            setNewSchool('');
            setCurrentSchool(newSchool.trim());
        } catch (error: any) {
            console.error('School change error:', error);
            let errorMessage = 'Failed to update school';
            let context = 'School Change - Unknown Error';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                context = `School Change - Server: ${error.response.data.message}`;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid school name format';
                context = 'School Change - Validation Error';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again';
                context = 'School Change - Auth Error';
            }

            setModalMessage({ text: errorMessage, type: 'error' });
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
            await axios.post(`${getApiBaseUrl()}/api/user/profile/`,
                { nickname: newNickname.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Success', 'Nickname changed successfully');
            setModalMessage({ text: 'Nickname changed successfully!', type: 'success' });
            setTimeout(() => {
                setShowNicknameModal(false);
                setModalMessage({ text: '', type: '' });
            }, 1500);
            setNewNickname('');

            // Refresh profile data to get new nickname
            const profileResponse = await axios.get(`${getApiBaseUrl()}/api/user/profile/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Preserve existing game history while updating profile
            setProfileData((prev: any) => ({
                ...profileResponse.data,
                userGameScores: prev?.userGameScores || []
            }));
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
            showErrorWithFeedback(errorMessage, context);
        } finally {
            setLoading(false);
        }
    };

    // Function to handle feedback submission
    const handleSubmitFeedback = async () => {
        try {
            // Here you would send the feedback to your backend or logging service
            const feedbackData = {
                context: errorContext,
                userFeedback: userFeedback,
                timestamp: new Date().toISOString(),
                userAgent: 'EduQuest Mobile App'
            };

            console.log('User feedback submitted:', feedbackData);

            // You could also send this to a logging service
            // await axios.post(`${getApiBaseUrl()}/api/feedback`, feedbackData);

            Alert.alert('Thank You', 'Your feedback has been submitted. We\'ll look into this issue.');
            setShowErrorFeedbackModal(false);
            setUserFeedback('');
            setErrorContext('');
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            Alert.alert('Error', 'Failed to submit feedback. Please try again later.');
        }
    };

    // Function to fetch AI learning suggestions
    const fetchAiLearningSuggestions = async () => {
        if (loadingSuggestions || gameHistory.length === 0) return;

        try {
            setLoadingSuggestions(true);
            
            // Prepare game score data for Python backend
            const gameScoreData = {
                user_id: displayUser?.id || 1,
                game_scores: gameHistory.map((game: any) => ({
                    game_type: game.gameType || 'UNKNOWN',
                    game_name: game.name || 'Unknown Game',
                    score: game.scores || 0,
                    difficulty: game.gameDifficulty || 'MEDIUM',
                    created_at: game.createdAt
                }))
            };

            // Call Python backend API
            const response = await axios.post('http://localhost:8000/api/learning/suggestions', gameScoreData, {
                timeout: 30000, // 30 seconds timeout
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setAiSuggestions(response.data.suggestions || []);
        } catch (error: any) {
            console.error('Failed to fetch AI suggestions:', error);
            
            // Fallback to local suggestions if AI fails
            Alert.alert(
                'AI Analysis Unavailable',
                'Using local analysis instead. Make sure Python backend is running.',
                [{ text: 'OK' }]
            );
            
            // Keep existing local suggestions as fallback
        } finally {
            setLoadingSuggestions(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Unified User Profile Section */}
                <View style={styles.unifiedProfileContainer}>
                    <View style={styles.profileCover}>
                        <View style={styles.profileCoverGradient} />
                        <View style={styles.profileContent}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarCircle}>
                                    {renderAvatar(selectedAvatar, 50)}
                                </View>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.userName}>{displayUser?.nickname || displayUser?.username || 'Learner'}</Text>
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
                            <View style={styles.profileActions}>
                                <TouchableOpacity
                                    style={styles.inventoryBtn}
                                    onPress={() => router.push('/Inventory/inventory')}
                                >
                                    <Package size={20} color="#FFF" />
                                    <View style={styles.inventoryBadge}>
                                        <Text style={styles.inventoryBadgeText}>{userItems.length}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editProfileBtn}
                                    onPress={() => setShowEditProfileModal(true)}
                                >
                                    <Settings size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    
                    {/* Unified User Information */}
                    <View style={styles.unifiedInfoSection}>
                        <Text style={styles.infoSectionTitle}>📋 User Information</Text>
                        <View style={styles.infoList}>
                            <View style={styles.infoItem}>
                                <UserIcon size={16} color="#636E72" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Username</Text>
                                    <Text style={styles.infoValue}>{displayUser?.username || 'N/A'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Mail size={16} color="#636E72" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{displayUser?.email || 'N/A'}</Text>
                                </View>
                            </View>
                            {currentSchool && (
                                <View style={styles.infoItem}>
                                    <BookOpen size={16} color="#636E72" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>School</Text>
                                        <Text style={styles.infoValue}>{currentSchool}</Text>
                                    </View>
                                </View>
                            )}
                            {userRoles.length > 0 && (
                                <View style={styles.infoItem}>
                                    <Award size={16} color="#636E72" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Role</Text>
                                        <Text style={styles.infoValue}>{userRoles.join(', ')}</Text>
                                    </View>
                                </View>
                            )}
                            <View style={styles.infoItem}>
                                <Trophy size={16} color="#636E72" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>User ID</Text>
                                    <Text style={styles.infoValue}>#{displayUser?.id || 'N/A'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Calendar size={16} color="#636E72" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Member Since</Text>
                                    <Text style={styles.infoValue}>
                                        {displayUser?.created_at ? new Date(displayUser.created_at).toLocaleDateString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <Trophy size={16} color="#636E72" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Current Points</Text>
                                    <Text style={styles.infoValue}>{displayUser?.points || 0} XP</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>



                {/* Enhanced Features Section */}
                <View style={styles.enhancedFeaturesContainer}>
                    <Text style={styles.sectionTitle}>Enhanced Analytics</Text>
                    
                    
                    <TouchableOpacity
                        style={styles.featureItem}
                        onPress={() => setShowLearningStats(true)}
                    >
                        <BarChart3 size={20} color="#FF9800" />
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Learning Statistics</Text>
                            <Text style={styles.featureDescription}>Analyze your learning performance</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.featureItem}
                        onPress={() => setShowEquipment(true)}
                    >
                        <Award size={20} color="#9C27B0" />
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Equipment & Collection</Text>
                            <Text style={styles.featureDescription}>View your equipped items and collection</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.featureItem}
                        onPress={() => setShowTrends(true)}
                    >
                        <TrendingUp size={20} color="#4CAF50" />
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Learning Trends</Text>
                            <Text style={styles.featureDescription}>Track your progress over time</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.featureItem}
                        onPress={() => {
                            setShowSuggestions(true);
                            fetchAiLearningSuggestions();
                        }}
                    >
                        <Target size={20} color="#F44336" />
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>Learning Suggestions</Text>
                            <Text style={styles.featureDescription}>AI-powered learning recommendations</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>


                </View>

                {/* Personal Achievements Section */}
                <View style={styles.achievementsContainer}>
                    <Text style={styles.sectionTitle}>🏆 My Achievements</Text>
                    <View style={styles.achievementsGrid}>
                        <View style={styles.achievementCard}>
                            <View style={styles.achievementIcon}>
                                <Trophy size={28} color="#FFD700" />
                            </View>
                            <Text style={styles.achievementNumber}>{displayUser?.points || 0}</Text>
                            <Text style={styles.achievementLabel}>Total Points</Text>
                            <Text style={styles.achievementSubLabel}>Proof of hard work</Text>
                        </View>
                        <View style={styles.achievementCard}>
                            <View style={styles.achievementIcon}>
                                <Gamepad2 size={28} color="#FF6B6B" />
                            </View>
                            <Text style={styles.achievementNumber}>{gameHistory.length}</Text>
                            <Text style={styles.achievementLabel}>Games Played</Text>
                            <Text style={styles.achievementSubLabel}>Result of continuous learning</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.achievementCard}
                            onPress={() => setShowMissionsModal(true)}
                        >
                            <View style={styles.achievementIcon}>
                                <Target size={28} color="#9C27B0" />
                            </View>
                            <Text style={styles.achievementNumber}>{userMissions.filter(m => m.completed).length}</Text>
                            <Text style={styles.achievementLabel}>Missions Done</Text>
                            <Text style={styles.achievementSubLabel}>Achievement of challenging yourself</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.achievementCard}
                            onPress={() => router.push('/Inventory/inventory')}
                        >
                            <View style={styles.achievementIcon}>
                                <Star size={28} color="#FF9800" />
                            </View>
                            <Text style={styles.achievementNumber}>{userItems.length}</Text>
                            <Text style={styles.achievementLabel}>Items Collected</Text>
                            <Text style={styles.achievementSubLabel}>Rewards on the learning journey</Text>
                        </TouchableOpacity>
                    </View>
                </View>



                {/* Learning Progress Section */}
                <View style={styles.learningProgressContainer}>
                    <Text style={styles.sectionTitle}>📊 Learning Progress</Text>
                    <View style={styles.progressCards}>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressTitle}>Skill Analysis</Text>
                            <View style={styles.radarSection}>
                                <SkillBarsChart gameHistory={gameHistory} />
                            </View>
                        </View>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressTitle}>Learning Statistics</Text>
                            <View style={styles.learningStatsList}>
                                <View style={styles.learningStatItem}>
                                    <Text style={styles.learningStatLabel}>Average Score</Text>
                                    <Text style={styles.learningStatValue}>{calculateLearningStats.averageScore}</Text>
                                </View>
                                <View style={styles.learningStatItem}>
                                    <Text style={styles.learningStatLabel}>Best Subject</Text>
                                    <Text style={styles.learningStatValue}>{calculateLearningStats.bestSubject || 'N/A'}</Text>
                                </View>
                                <View style={styles.learningStatItem}>
                                    <Text style={styles.learningStatLabel}>Study Time</Text>
                                    <Text style={styles.learningStatValue}>{calculateLearningStats.totalPlayTime} minutes</Text>
                                </View>
                                <View style={styles.learningStatItem}>
                                    <Text style={styles.learningStatLabel}>Improvement Rate</Text>
                                    <Text style={[styles.learningStatValue, { color: calculateLearningStats.improvementRate >= 0 ? '#4CAF50' : '#FF4757' }]}>
                                        {calculateLearningStats.improvementRate >= 0 ? '+' : ''}{calculateLearningStats.improvementRate}%
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
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

                {/* View All Game Records Button */}
                <TouchableOpacity 
                    style={styles.viewAllRecordsBtn} 
                    onPress={() => router.push('/Profile/GameRecords')}
                >
                    <List size={20} color="#4CAF50" />
                    <Text style={styles.viewAllRecordsText}>View All Game Records</Text>
                    <ChevronRight size={20} color="#4CAF50" />
                </TouchableOpacity>

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

            {/* School Change Modal */}
            <Modal
                visible={showSchoolModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSchoolModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change School</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>New School Name</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter your school name"
                                value={newSchool}
                                onChangeText={setNewSchool}
                                maxLength={100}
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
                                    setShowSchoolModal(false);
                                    setNewSchool('');
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={handleChangeSchool}
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
                                <Text style={styles.statsCardTitle}>AI 學習策略建議</Text>
                                <Text style={styles.statsLabel}>🧠 **認知科學原理**：間隔重複比集中學習更有效</Text>
                                <Text style={styles.statsLabel}>⏰ **最佳學習時長**：每次25-30分鐘，之後休息5分鐘</Text>
                                <Text style={styles.statsLabel}>🎯 **目標設定**：設定具體可衡量的學習目標</Text>
                                <Text style={styles.statsLabel}>🔄 **多樣化學習**：結合不同難度和科目提升綜合能力</Text>
                                <Text style={styles.statsLabel}>📊 **數據驅動**：定期檢查學習數據，調整學習策略</Text>
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
                                        value={editFormData.nickname || displayUser?.nickname || ''}
                                        onChangeText={(text) => setEditFormData(prev => ({ ...prev, nickname: text }))}
                                        placeholder="Enter your nickname"
                                    />
                                </View>
                                
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editFormData.email || displayUser?.email || ''}
                                        onChangeText={(text) => setEditFormData(prev => ({ ...prev, email: text }))}
                                        placeholder="Enter your email"
                                        keyboardType="email-address"
                                    />
                                </View>
                                
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>School</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editFormData.school || currentSchool || ''}
                                        onChangeText={(text) => setEditFormData(prev => ({ ...prev, school: text }))}
                                        placeholder="Enter your school"
                                    />
                                </View>
                            </View>
                            
                            <View style={styles.editSection}>
                                <Text style={styles.editSectionTitle}>🔒 Security</Text>
                                
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>New Password</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editFormData.password}
                                        onChangeText={(text) => setEditFormData(prev => ({ ...prev, password: text }))}
                                        placeholder="Enter new password (optional)"
                                        secureTextEntry
                                    />
                                </View>
                                
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Confirm Password</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editFormData.confirmPassword}
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
                                    setEditFormData({ nickname: '', email: '', school: '', password: '', confirmPassword: '' });
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={() => {
                                    // Handle profile update logic here
                                    Alert.alert('Success', 'Profile updated successfully!');
                                    setShowEditProfileModal(false);
                                    setEditFormData({ nickname: '', email: '', school: '', password: '', confirmPassword: '' });
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
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    
    // Unified Profile Container
    unifiedProfileContainer: {
        marginHorizontal: 20,
        marginTop: 20,
    },
    profileCover: {
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        elevation: 8,
        marginBottom: 20,
    },
    profileCoverGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#4CAF50',
    },
    profileContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 20,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 4,
    },
    profileActions: {
        flexDirection: 'row',
        gap: 10,
    },
    inventoryBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        position: 'relative',
    },
    inventoryBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    inventoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
    },
    editProfileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    
    // Unified User Information Section
    unifiedInfoSection: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginTop: 20,
        elevation: 2,
    },
    infoSectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 12,
    },
    infoList: {
        gap: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 10,
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
    },
    
    // Edit Profile Modal Styles
    editSection: {
        marginBottom: 20,
    },
    editSectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 5,
    },
    textInput: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#2D3436',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    userTitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 15,
    },
    profileStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 8,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 4,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
        marginLeft: 4,
    },
    
    // Info Cards
    infoCardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    infoCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoCardContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoCardLabel: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 2,
    },
    infoCardValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 10 // Reduced from 20 for tighter layout
    },
    
    // Achievements Section
    achievementsContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
        elevation: 2,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginTop: 15,
    },
    achievementCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    achievementIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
    },
    achievementNumber: {
        fontSize: 22,
        fontWeight: '900',
        color: '#2D3436',
        marginBottom: 4,
    },
    achievementLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#636E72',
        marginBottom: 2,
    },
    achievementSubLabel: {
        fontSize: 10,
        color: '#A0A0A0',
        textAlign: 'center',
    },
    
    // Learning Progress Section
    learningProgressContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
        elevation: 2,
    },
    progressCards: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 15,
    },
    progressCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        elevation: 2,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 15,
        textAlign: 'center',
    },
    learningStatsList: {
        gap: 12,
    },
    learningStatItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    learningStatLabel: {
        fontSize: 13,
        color: '#636E72',
        fontWeight: '600',
    },
    learningStatValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2D3436',
    },
    
    // Profile Settings Section
    profileSettingsContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
        elevation: 2,
    },
    settingsGrid: {
        gap: 12,
        marginBottom: 20,
    },
    profileSettingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        elevation: 2,
    },
    settingIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        elevation: 2,
    },
    settingCardContent: {
        flex: 1,
    },
    settingCardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 2,
    },
    settingCardValue: {
        fontSize: 13,
        color: '#636E72',
    },
    accountDetailsCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
    },
    accountDetailsTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 12,
    },
    accountDetailsList: {
        gap: 8,
    },
    accountDetailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    accountDetailLabel: {
        fontSize: 13,
        color: '#636E72',
        fontWeight: '600',
    },
    accountDetailValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2D3436',
    },
    
    // Legacy styles for compatibility
    statsAndSkillsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        justifyContent: 'space-between'
    },
    statsColumn: {
        flex: 1,
        marginRight: 10
    },
    skillsColumn: {
        flex: 1,
        marginLeft: 10
    },
    radarSection: {
        marginTop: 10,
        borderRadius: 24,
        padding: 12,
        alignItems: 'center',
        elevation: 2,
        flex: 1
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    statCard: {
        width: '48%', // Adjusted from 31% to fit in column layout
        padding: 12, // Reduced from default
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 8 // Reduced from default
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
    emailBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    emailText: { fontSize: 14, color: '#636E72', marginLeft: 5 },
    schoolBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    schoolText: { fontSize: 14, color: '#636E72', marginLeft: 5 },
    rolesBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    rolesText: { fontSize: 14, color: '#636E72', marginLeft: 5 },
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
    emptyText: { textAlign: 'center', padding: 20, color: '#BDC3C7' },

    // Settings styles
    settingsContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    settingContent: {
        flex: 1,
        marginLeft: 15,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
    },
    settingDescription: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 25,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#2D3436',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    passwordInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelBtn: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelBtnText: {
        color: '#636E72',
        fontWeight: '800',
    },
    confirmBtn: {
        backgroundColor: '#4CAF50',
    },
    confirmBtnText: {
        color: '#FFF',
        fontWeight: '800',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContextText: {
        fontSize: 14,
        color: '#FF4757',
        fontWeight: '600',
        backgroundColor: '#FFF5F5',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFB6B6',
    },
    // Items modal styles
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemIconText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
    },
    itemType: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    itemDescription: {
        fontSize: 12,
        color: '#A0A0A0',
        marginTop: 4,
    },
    emptyItemsContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyItemsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#636E72',
    },
    emptyItemsSubText: {
        fontSize: 12,
        color: '#A0A0A0',
        marginTop: 5,
    },
    // Missions modal styles
    missionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    missionStatus: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    missionStatusText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    missionInfo: {
        flex: 1,
    },
    missionName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
    },
    missionType: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    missionDescription: {
        fontSize: 12,
        color: '#A0A0A0',
        marginTop: 4,
    },
    missionMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    missionDifficulty: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FF9800',
    },
    missionScores: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4CAF50',
    },
    emptyMissionsContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyMissionsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#636E72',
    },
    emptyMissionsSubText: {
        fontSize: 12,
        color: '#A0A0A0',
        marginTop: 5,
    },
    viewAllRecordsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 18,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4CAF50',
        marginVertical: 15,
    },
    viewAllRecordsText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CAF50',
        flex: 1,
        textAlign: 'center',
    },
    // Enhanced Features styles
    enhancedFeaturesContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
        elevation: 2,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    featureContent: {
        flex: 1,
        marginLeft: 15,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
    },
    featureDescription: {
        fontSize: 12,
        color: '#636E72',
        marginTop: 2,
    },
    // Account Details Modal styles
    accountDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    // Account Info styles
    accountInfoSection: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    accountInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    accountInfoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636E72',
    },
    accountInfoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
    },
    // Learning Stats styles
    statsCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statsCardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statsLabel: {
        fontSize: 14,
        color: '#636E72',
    },
    statsValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
    },
    // Equipment styles
    equipmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    equipmentItem: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    equipmentIcon: {
        fontSize: 24,
        marginBottom: 5,
    },
    equipmentName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3436',
        textAlign: 'center',
    },
    // Suggestions styles
    suggestionCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    suggestionIcon: {
        marginRight: 15,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 2,
    },
    suggestionDescription: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 5,
    },
    suggestionPriority: {
        alignSelf: 'flex-start',
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
    },
    // Chart container styles
    chartContainer: {
        marginVertical: 10,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 5,
        textAlign: 'center',
    },
    
});