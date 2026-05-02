import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import {
    Users,
    ChevronRight,
    School,
    User,
    Clock,
    Award,
    BookOpen,
    LogOut,
    X,
    RefreshCw,
    Trophy
} from 'lucide-react-native';
import studentService, { StudentClass, ClassMember } from './studentService';

export default function StudentClasses() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
    const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);

    useEffect(() => {
        loadClasses();
    }, [token]);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const classesData = await studentService.getStudentClasses();
            setClasses(classesData);
            console.log('Student classes loaded:', classesData);
        } catch (error: any) {
            console.error('Error loading student classes:', error);
            Alert.alert('Error', 'Failed to load your classes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadClassMembers = async (classItem: StudentClass) => {
        try {
            setLoadingMembers(true);
            const members = await studentService.getClassMembers(classItem.id);
            setClassMembers(members);
            setSelectedClass(classItem);
            setShowMembersModal(true);
            console.log('Class members loaded:', members);
        } catch (error: any) {
            console.error('Error loading class members:', error);
            Alert.alert('Error', 'Failed to load class members. Please try again.');
        } finally {
            setLoadingMembers(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadClasses().finally(() => setRefreshing(false));
    }, []);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Unknown Date';
            }
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown Date';
        }
    };

    const getRoleDisplay = (role: string) => {
        if (['ASSISTANT', 'HEAD_TEACHER', 'TEACHER'].includes(role)) {
            return 'Teacher';
        }
        return 'Student';
    };

    const getRoleColor = (role: string) => {
        if (['ASSISTANT', 'HEAD_TEACHER', 'TEACHER'].includes(role)) {
            return '#6C5CE7';
        }
        return '#4CAF50';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C5CE7" />
                    <Text style={styles.loadingText}>Loading your classes...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronRight size={24} color="#2D3436" style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Classes</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <RefreshCw size={24} color="#6C5CE7" />
                    </TouchableOpacity>
                </View>

                {/* Student Info */}
                <View style={styles.studentInfoContainer}>
                    <View style={styles.studentInfo}>
                        <User size={24} color="#6C5CE7" />
                        <View style={styles.studentInfoText}>
                            <Text style={styles.studentName}>{user?.username || 'Student'}</Text>
                            <Text style={styles.studentRole}>Student</Text>
                        </View>
                    </View>
                    <View style={styles.classCount}>
                        <School size={20} color="#4CAF50" />
                        <Text style={styles.classCountText}>{classes.length} Classes</Text>
                    </View>
                </View>

                {/* Classes List */}
                <View style={styles.content}>
                    {classes.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <School size={48} color="#DDD" />
                            <Text style={styles.emptyTitle}>No Classes Found</Text>
                            <Text style={styles.emptyDescription}>
                                You haven't been assigned to any classes yet.
                            </Text>
                        </View>
                    ) : (
                        classes.map((classItem) => (
                            <TouchableOpacity
                                key={classItem.id}
                                style={styles.classCard}
                                onPress={() => loadClassMembers(classItem)}
                            >
                                <View style={styles.classHeader}>
                                    <View style={styles.classInfo}>
                                        <Text style={styles.className}>{classItem.name}</Text>
                                        {classItem.description && (
                                            <Text style={styles.classDescription}>
                                                {classItem.description}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.classActions}>
                                        <TouchableOpacity
                                            style={styles.leaderboardBtn}
                                            onPress={() => router.push(`/student/ClassLeaderboard?classId=${classItem.id}&className=${encodeURIComponent(classItem.name)}` as any)}
                                        >
                                            <Trophy size={18} color="#FFD700" />
                                        </TouchableOpacity>
                                        <ChevronRight size={20} color="#6C5CE7" />
                                    </View>
                                </View>
                                
                                <View style={styles.classDetails}>
                                    <View style={styles.detailItem}>
                                        <Clock size={16} color="#666" />
                                        <Text style={styles.detailText}>
                                            Joined {formatDate(classItem.createdAt)}
                                        </Text>
                                    </View>
                                    
                                    {classItem.schoolName && (
                                        <View style={styles.detailItem}>
                                            <School size={16} color="#666" />
                                            <Text style={styles.detailText}>{classItem.schoolName}</Text>
                                        </View>
                                    )}
                                    
                                    {classItem.teacherName && (
                                        <View style={styles.detailItem}>
                                            <BookOpen size={16} color="#666" />
                                            <Text style={styles.detailText}>Teacher: {classItem.teacherName}</Text>
                                        </View>
                                    )}
                                    
                                    <View style={styles.detailItem}>
                                        <Users size={16} color="#666" />
                                        <Text style={styles.detailText}>
                                            {classItem.memberCount || 0} Members
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Class Members Modal */}
            <Modal
                visible={showMembersModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowMembersModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity style={styles.modalBackBtn} onPress={() => setShowMembersModal(false)}>
                            <X size={24} color="#2D3436" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Class Members</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.modalContent}>
                        {selectedClass && (
                            <View style={styles.selectedClassInfo}>
                                <Text style={styles.selectedClassName}>{selectedClass.name}</Text>
                                <Text style={styles.selectedClassDescription}>
                                    {classMembers.length} Members
                                </Text>
                            </View>
                        )}

                        {loadingMembers ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#6C5CE7" />
                                <Text style={styles.loadingText}>Loading members...</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.membersList}>
                                {classMembers.map((member) => (
                                    <View key={member.id} style={styles.memberCard}>
                                        <View style={styles.memberInfo}>
                                            <View style={styles.memberAvatar}>
                                                <Text style={styles.memberAvatarText}>
                                                    {member.username.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.memberDetails}>
                                                <Text style={styles.memberName}>{member.username}</Text>
                                                {member.email && (
                                                    <Text style={styles.memberEmail}>{member.email}</Text>
                                                )}
                                                {member.createdAt && (
                                                    <Text style={styles.memberJoined}>
                                                        Joined {formatDate(member.createdAt)}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.memberStats}>
                                            <View style={styles.memberRole}>
                                                <Text style={[
                                                    styles.memberRoleText,
                                                    { color: getRoleColor(member.roleInClass) }
                                                ]}>
                                                    {getRoleDisplay(member.roleInClass)}
                                                </Text>
                                            </View>
                                            <View style={styles.memberPoints}>
                                                <Award size={16} color="#FFD700" />
                                                <Text style={styles.memberPointsText}>{member.points || 0}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </SafeAreaView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    refreshBtn: {
        padding: 8,
    },
    studentInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 20,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    studentInfoText: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    studentRole: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    classCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    classCountText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    emptyDescription: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    classCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    classHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    classActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    leaderboardBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF8DC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    classDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    classDetails: {
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalBackBtn: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    selectedClassInfo: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedClassName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    selectedClassDescription: {
        fontSize: 16,
        color: '#666',
    },
    membersList: {
        flex: 1,
    },
    memberCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    memberDetails: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 2,
    },
    memberEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    memberJoined: {
        fontSize: 12,
        color: '#999',
    },
    memberStats: {
        alignItems: 'flex-end',
        gap: 8,
    },
    memberRole: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    memberRoleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    memberPoints: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    memberPointsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
    },
});
