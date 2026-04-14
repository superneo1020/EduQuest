import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    User,
    Mail,
    GraduationCap,
    Calendar,
    Settings,
    Edit,
    LogOut,
    ChevronRight,
    X,
    Users,
    BookOpen,
    Award,
} from 'lucide-react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { getApiBaseUrl } from '@/src/api/client';
import axios from 'axios';

export default function TeacherProfile() {
    const router = useRouter();
    const { user, token, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    
    // Real profile data from backend
    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        school: '',
        points: 0,
        roles: [] as string[],
        educatorStatus: '',
        createdAt: '',
    });

    // Edit form data
    const [editFormData, setEditFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Field-level errors
    const [fieldErrors, setFieldErrors] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            
            // Load real data from backend APIs
            const [basicInfo, points, school, roles, educatorStatus] = await Promise.all([
                axios.get(`${getApiBaseUrl()}/api/user`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${getApiBaseUrl()}/api/user/point`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${getApiBaseUrl()}/api/user/school`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${getApiBaseUrl()}/api/user/roles`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${getApiBaseUrl()}/api/user/educator-status`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setProfileData({
                username: user?.username || '',
                email: basicInfo.data.email || user?.email || '',
                school: school.data || '',
                points: points.data || 0,
                roles: roles.data || [],
                educatorStatus: educatorStatus.data || '',
                createdAt: basicInfo.data.createdAt || '',
            });

        } catch (error) {
            console.error('Error loading profile data:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        setEditFormData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setFieldErrors({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setEditModalVisible(true);
    };

    const saveProfile = async () => {
        // Reset errors
        setFieldErrors({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        });

        // Validate old password
        if (!editFormData.oldPassword) {
            setFieldErrors(prev => ({ ...prev, oldPassword: 'Current password is required' }));
            return;
        }

        // Validate new password
        if (!editFormData.newPassword) {
            setFieldErrors(prev => ({ ...prev, newPassword: 'New password is required' }));
            return;
        }

        if (editFormData.newPassword.length < 8) {
            setFieldErrors(prev => ({ ...prev, newPassword: 'Password must be at least 8 characters long' }));
            return;
        }

        if (editFormData.newPassword === editFormData.oldPassword) {
            setFieldErrors(prev => ({ ...prev, newPassword: 'New password must be different from current password' }));
            return;
        }

        // Validate confirm password
        if (!editFormData.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your new password' }));
            return;
        }

        if (editFormData.newPassword !== editFormData.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            return;
        }

        try {
            // Update password
            await axios.post(`${getApiBaseUrl()}/api/user/password`, {
                oldPassword: editFormData.oldPassword,
                newPassword: editFormData.newPassword,
                confirmPassword: editFormData.confirmPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEditModalVisible(false);
            Alert.alert('Success', 'Password updated successfully!');

        } catch (error: any) {
            console.error('Error updating password:', error);
            
            // Handle different error types
            if (error.response?.status === 400) {
                const errorMessage = error.response.data?.message || 'Invalid password data';
                
                if (errorMessage.includes('old password') || errorMessage.includes('current password')) {
                    setFieldErrors(prev => ({ ...prev, oldPassword: 'Current password is incorrect' }));
                } else if (errorMessage.includes('new password')) {
                    setFieldErrors(prev => ({ ...prev, newPassword: 'New password is invalid' }));
                } else {
                    Alert.alert('Error', errorMessage);
                }
            } else if (error.response?.status === 401) {
                setFieldErrors(prev => ({ ...prev, oldPassword: 'Current password is incorrect' }));
            } else if (error.response?.status === 403) {
                Alert.alert('Error', 'You are not authorized to change password');
            } else {
                Alert.alert('Error', 'Failed to update password. Please try again later.');
            }
        }
    };

    const handleLogout = () => {
        console.log('Logout button pressed');
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('Logout confirmed, signing out...');
                            await signOut();
                            console.log('SignOut successful, navigating to login...');
                            router.replace('/Profile/Login');
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const InfoCard = ({ title, value, icon: Icon, color }: any) => (
        <View style={[styles.infoCard, { backgroundColor: color + '10' }]}>
            <Icon size={20} color={color} />
            <Text style={styles.infoTitle}>{title}</Text>
            <Text style={[styles.infoValue, { color }]}>{value}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C5CE7" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
        >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronRight size={24} color="#2D3436" style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Teacher Profile</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
                        <Edit size={24} color="#6C5CE7" />
                    </TouchableOpacity>
                </View>

                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <User size={48} color="#FFF" />
                    </View>
                    <Text style={styles.name}>{profileData.username}</Text>
                    <Text style={styles.email}>{profileData.email}</Text>
                    
                    {/* Real Data Info Cards */}
                    <View style={styles.infoGrid}>
                        <InfoCard 
                            title="School" 
                            value={profileData.school || 'Not set'} 
                            icon={GraduationCap} 
                            color="#6C5CE7" 
                        />
                        <InfoCard 
                            title="Points" 
                            value={profileData.points.toString()} 
                            icon={Award} 
                            color="#4CAF50" 
                        />
                        <InfoCard 
                            title="Status" 
                            value={profileData.educatorStatus || 'Unknown'} 
                            icon={Users} 
                            color="#FF9800" 
                        />
                        <InfoCard 
                            title="Roles" 
                            value={profileData.roles.join(', ') || 'User'} 
                            icon={BookOpen} 
                            color="#FF4757" 
                        />
                    </View>

                    {profileData.createdAt && (
                        <View style={styles.joinDate}>
                            <Calendar size={14} color="#999" />
                            <Text style={styles.joinDateText}>Joined {new Date(profileData.createdAt).toLocaleDateString()}</Text>
                        </View>
                    )}
                </View>

                
                {/* Logout Button */}
                <TouchableOpacity 
                    style={styles.logoutBtn} 
                    onPress={handleLogout}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                >
                    <LogOut size={20} color="#FF4757" />
                    <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Current Password</Text>
                                <TextInput
                                    style={[styles.input, fieldErrors.oldPassword && styles.inputError]}
                                    value={editFormData.oldPassword}
                                    onChangeText={(text) => {
                                        setEditFormData(prev => ({ ...prev, oldPassword: text }));
                                        // Clear error when user starts typing
                                        if (fieldErrors.oldPassword) {
                                            setFieldErrors(prev => ({ ...prev, oldPassword: '' }));
                                        }
                                    }}
                                    placeholder="Enter current password"
                                    secureTextEntry
                                />
                                {fieldErrors.oldPassword ? (
                                    <Text style={styles.errorText}>{fieldErrors.oldPassword}</Text>
                                ) : null}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <TextInput
                                    style={[styles.input, fieldErrors.newPassword && styles.inputError]}
                                    value={editFormData.newPassword}
                                    onChangeText={(text) => {
                                        setEditFormData(prev => ({ ...prev, newPassword: text }));
                                        // Clear error when user starts typing
                                        if (fieldErrors.newPassword) {
                                            setFieldErrors(prev => ({ ...prev, newPassword: '' }));
                                        }
                                    }}
                                    placeholder="Enter new password (min 8 characters)"
                                    secureTextEntry
                                />
                                {fieldErrors.newPassword ? (
                                    <Text style={styles.errorText}>{fieldErrors.newPassword}</Text>
                                ) : null}
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Confirm New Password</Text>
                                <TextInput
                                    style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
                                    value={editFormData.confirmPassword}
                                    onChangeText={(text) => {
                                        setEditFormData(prev => ({ ...prev, confirmPassword: text }));
                                        // Clear error when user starts typing
                                        if (fieldErrors.confirmPassword) {
                                            setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                                        }
                                    }}
                                    placeholder="Confirm new password"
                                    secureTextEntry
                                />
                                {fieldErrors.confirmPassword ? (
                                    <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
                                ) : null}
                            </View>
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]} 
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.saveBtn]} 
                                onPress={saveProfile}
                            >
                                <Text style={styles.saveBtnText}>Save</Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0E6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D3436',
    },
    editBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0E6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileSection: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 20,
        width: '100%',
    },
    infoCard: {
        flex: 1,
        minWidth: 140,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoTitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    schoolInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    schoolText: {
        fontSize: 14,
        color: '#666',
    },
    joinDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    joinDateText: {
        fontSize: 12,
        color: '#999',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: 140,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 8,
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    statSubtitle: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
    },
    subjectsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    subjectBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    subjectText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    achievementsContainer: {
        gap: 12,
    },
    achievementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    achievementText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    activityContainer: {
        gap: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    activityValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFE6E6',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 40,
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logoutBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF4757',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
    },
    modalBody: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
    },
    inputError: {
        borderColor: '#FF4757',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#FF4757',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F0F0F0',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    saveBtn: {
        backgroundColor: '#6C5CE7',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    settingsContainer: {
        gap: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    settingValue: {
        fontSize: 16,
        color: '#666',
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: '#6C5CE7',
    },
    toggleDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        position: 'absolute',
        left: 2,
    },
    toggleDotActive: {
        left: 22,
    },
});
