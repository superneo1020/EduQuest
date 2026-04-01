import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
    StatusBar, Dimensions, ActivityIndicator, TextInput, Modal, Alert
} from 'react-native';
import {
    Trophy, Gamepad2, Mail, User as UserIcon, Settings, ChevronRight,
    LogOut, Calculator, BookOpen, Brain, FlaskConical, Eye, EyeOff, Key, ShoppingCart
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
            setProfileData(prev => ({
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
                    <Text style={styles.userName}>{displayUser?.nickname || displayUser?.username || 'Learner'}</Text>
                    <View style={styles.emailBadge}>
                        <Mail size={12} color="#636E72" />
                        <Text style={styles.emailText}>{displayUser?.email || 'N/A'}</Text>
                    </View>
                    {currentSchool && (
                        <View style={styles.schoolBadge}>
                            <BookOpen size={12} color="#636E72" />
                            <Text style={styles.schoolText}>{currentSchool}</Text>
                        </View>
                    )}
                    {userRoles.length > 0 && (
                        <View style={styles.rolesBadge}>
                            <Settings size={12} color="#636E72" />
                            <Text style={styles.rolesText}>{userRoles.join(', ')}</Text>
                        </View>
                    )}
                </View>


                {/* Settings Section */}
                <View style={styles.settingsContainer}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    
                    <TouchableOpacity 
                        style={styles.settingItem}
                        onPress={() => setShowPasswordModal(true)}
                    >
                        <Key size={20} color="#4CAF50" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Change Password</Text>
                            <Text style={styles.settingDescription}>Update your account password</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.settingItem}
                        onPress={() => setShowEmailModal(true)}
                    >
                        <Mail size={20} color="#2196F3" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Change Email</Text>
                            <Text style={styles.settingDescription}>Update your email address</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowSchoolModal(true)}
                    >
                        <BookOpen size={20} color="#FF9800" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Change School</Text>
                            <Text style={styles.settingDescription}>Update your school information</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowNicknameModal(true)}
                    >
                        <UserIcon size={20} color="#9C27B0" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Change Nickname</Text>
                            <Text style={styles.settingDescription}>Update your display nickname</Text>
                        </View>
                        <ChevronRight size={20} color="#BDC3C7" />
                    </TouchableOpacity>
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
                    <TouchableOpacity 
                        style={[styles.statCard, { backgroundColor: '#F3E5F5', borderColor: '#E1BEE7' }]}
                        onPress={() => setShowMissionsModal(true)}
                    >
                        <Trophy size={24} color="#9C27B0" />
                        <Text style={styles.statNumber}>{userMissions.filter(m => m.completed).length}</Text>
                        <Text style={styles.statTitle}>Missions Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.statCard, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}
                        onPress={() => setShowItemsModal(true)}
                    >
                        <Trophy size={24} color="#FF9800" />
                        <Text style={styles.statNumber}>{userItems.length}</Text>
                        <Text style={styles.statTitle}>My Items</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.statCard, { backgroundColor: '#E8F4F8', borderColor: '#B3E5FC' }]}
                        onPress={() => router.push('/shop')}
                    >
                        <ShoppingCart size={24} color="#03A9F4" />
                        <Text style={styles.statNumber}>Shop</Text>
                        <Text style={styles.statTitle}>Store</Text>
                    </TouchableOpacity>
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
        flexWrap: 'wrap',
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
        width: '31%',
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 10
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
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
        flex: 1,
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
    }
});