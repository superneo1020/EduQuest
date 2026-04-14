import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    FlatList,
    Dimensions,
    SafeAreaView,
    StatusBar,
    useWindowDimensions
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { router } from 'expo-router';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import {
    Users,
    Plus,
    Search,
    GraduationCap,
    UserPlus,
    UserMinus,
    Edit,
    Trash2,
    School,
    Calendar,
    Award,
    ArrowLeft,
    Home,
    BarChart3,
    TrendingUp,
    Star,
    Filter,
    CheckCircle,
    Clock,
    Calculator,
    Languages,
    Atom,
    Brain,
    Sparkles,
    ChevronRight
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Course {
    id: number;
    grade: string;
    suffix: string;
    academicYear: string;
    schoolId: number;
    schoolName: string;
    createdAt: string;
    members: CourseMember[];
}

interface CourseMember {
    id: number;
    userId: number;
    username: string;
    email: string;
    roleInClass: 'student' | 'teacher' | 'assistant';
    createdAt: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    schoolName: string;
    educatorStatus: string;
}

const ClassManagement: React.FC = () => {
    const { user, token } = useAuth();
    const { width } = useWindowDimensions();
    const [courses, setCourses] = useState<Course[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');

    const isLandscape = width > 800;
    const isTablet = width > 600;
    
    // Modal states
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
    
    // Form states
    const [grade, setGrade] = useState('');
    const [suffix, setSuffix] = useState('');
    const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [memberRole, setMemberRole] = useState<'student' | 'teacher' | 'assistant'>('student');

    const api = axios.create({
        baseURL: getApiBaseUrl(),
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    useEffect(() => {
        fetchCourses();
        fetchAvailableUsers();
        fetchStudents();
    }, []);

    const getPerformanceColor = (score: number) => {
        if (score >= 85) return '#4CAF50';
        if (score >= 70) return '#FF9800';
        return '#FF4757';
    };

    const fetchStudents = async () => {
        try {
            // Mock student data from teacher.tsx
            const mockStudents = [
                {
                    id: '1',
                    username: 'Alex Chen',
                    email: 'alex.chen@example.com',
                    points: 2450,
                    level: 8,
                    joinDate: '2024-01-15',
                    lastActive: '2024-03-28',
                    gameProgress: { math: 85, english: 72, science: 90, chinese: 68 },
                    performance: { averageScore: 78.5, totalTimeSpent: 45, completedQuests: 32, accuracy: 82 },
                },
                {
                    id: '2',
                    username: 'Emma Wang',
                    email: 'emma.wang@example.com',
                    points: 3890,
                    level: 12,
                    joinDate: '2023-11-20',
                    lastActive: '2024-03-29',
                    gameProgress: { math: 92, english: 88, science: 85, chinese: 91 },
                    performance: { averageScore: 89.0, totalTimeSpent: 68, completedQuests: 54, accuracy: 91 },
                }
            ];
            setStudents(mockStudents);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            setLoading(true);
            // Since we don't have admin course APIs, we'll simulate course data
            const mockCourses: Course[] = [
                {
                    id: 1,
                    grade: '3A',
                    suffix: 'A',
                    academicYear: '2024',
                    schoolId: 1,
                    schoolName: 'Demo School',
                    createdAt: new Date().toISOString(),
                    members: [
                        {
                            id: 1,
                            userId: 1,
                            username: 'teacher1',
                            email: 'teacher1@school.com',
                            roleInClass: 'teacher',
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: 2,
                            userId: 2,
                            username: 'student1',
                            email: 'student1@school.com',
                            roleInClass: 'student',
                            createdAt: new Date().toISOString()
                        }
                    ]
                }
            ];
            setCourses(mockCourses);
        } catch (error) {
            console.error('Error fetching courses:', error);
            Alert.alert('Error', 'Unable to fetch courses');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const response = await api.get('/api/user/all');
            const users = Array.isArray(response.data) ? response.data.map((user: any) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                schoolName: user.school?.name || 'No School',
                educatorStatus: user.roles?.includes('ROLE_EDUCATOR') ? 'APPROVED' : 'NONE'
            })) : [];
            setAvailableUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses();
    };

    const createCourse = async () => {
        if (!grade || !suffix || !academicYear) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            // In real implementation, this would call admin course creation API
            Alert.alert(
                'Create Course',
                `Course ${grade}-${suffix} for ${academicYear} would be created.\n\nThis is a demo - actual course creation requires backend admin endpoints.`,
                [{ text: 'OK' }]
            );
            
            // For demo purposes, add to local state
            const newCourse: Course = {
                id: Date.now(),
                grade,
                suffix,
                academicYear,
                schoolId: 1,
                schoolName: 'Demo School',
                createdAt: new Date().toISOString(),
                members: []
            };
            setCourses([...courses, newCourse]);
            setCreateModalVisible(false);
            setGrade('');
            setSuffix('');
            setAcademicYear(new Date().getFullYear().toString());
        } catch (error: any) {
            console.error('Error creating course:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create course');
        }
    };

    const addMemberToCourse = async () => {
        if (!selectedCourse || !selectedUser) {
            Alert.alert('Error', 'Please select course and user');
            return;
        }

        try {
            // In real implementation, this would call admin course member API
            Alert.alert(
                'Add Member',
                `${selectedUser.username} would be added to ${selectedCourse.grade}-${selectedCourse.suffix} as ${memberRole}.\n\nThis is a demo - actual member addition requires backend admin endpoints.`,
                [{ text: 'OK' }]
            );
            
            // For demo purposes, add to local state
            const newMember: CourseMember = {
                id: Date.now(),
                userId: selectedUser.id,
                username: selectedUser.username,
                email: selectedUser.email,
                roleInClass: memberRole,
                createdAt: new Date().toISOString()
            };
            
            setCourses(courses.map(course => 
                course.id === selectedCourse.id 
                    ? { ...course, members: [...course.members, newMember] }
                    : course
            ));
            setAddMemberModalVisible(false);
            setSelectedUser(null);
            setMemberRole('student');
        } catch (error: any) {
            console.error('Error adding member:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to add member');
        }
    };

    const removeMemberFromCourse = async (courseId: number, member: CourseMember) => {
        try {
            Alert.alert(
                'Remove Member',
                `${member.username} would be removed from the course.\n\nThis is a demo - actual member removal requires backend admin endpoints.`,
                [{ text: 'OK' }]
            );
            
            // For demo purposes, remove from local state
            setCourses(courses.map(course => 
                course.id === courseId 
                    ? { ...course, members: course.members.filter(m => m.id !== member.id) }
                    : course
            ));
        } catch (error: any) {
            console.error('Error removing member:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to remove member');
        }
    };

    const deleteCourse = async (course: Course) => {
        try {
            Alert.alert(
                'Delete Course',
                `Course ${course.grade}-${course.suffix} would be deleted.\n\nThis is a demo - actual course deletion requires backend admin endpoints.`,
                [{ text: 'OK' }]
            );
            
            // For demo purposes, remove from local state
            setCourses(courses.filter(c => c.id !== course.id));
        } catch (error: any) {
            console.error('Error deleting course:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete course');
        }
    };

    const renderCourseItem = ({ item }: { item: Course }) => (
        <TouchableOpacity 
            style={[
                styles.courseCard,
                selectedCourse?.id === item.id && styles.selectedCourseCard
            ]}
            onPress={() => setSelectedCourse(item)}
        >
            <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                    <View style={styles.courseTitleRow}>
                        <Text style={styles.courseTitle}>{item.grade}-{item.suffix}</Text>
                        <View style={styles.yearBadge}>
                            <Calendar size={12} color="#FFF" />
                            <Text style={styles.yearText}>{item.academicYear}</Text>
                        </View>
                    </View>
                    <Text style={styles.schoolName}>{item.schoolName}</Text>
                    <Text style={styles.memberCount}>
                        <Users size={14} color="#666" /> {item.members.length} members
                    </Text>
                </View>
                <View style={styles.courseActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            setSelectedCourse(item);
                            setMemberModalVisible(true);
                        }}
                    >
                        <Users size={16} color="#9C27B0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            setSelectedCourse(item);
                            setEditModalVisible(true);
                        }}
                    >
                        <Edit size={16} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteCourse(item)}
                    >
                        <Trash2 size={16} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </View>
            {selectedCourse?.id === item.id && (
                <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓ Selected</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderMemberItem = ({ item }: { item: CourseMember }) => (
        <View style={styles.memberItem}>
            <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{item.username}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                </View>
            </View>
            <View style={styles.memberRole}>
                <View style={[styles.roleBadge, { 
                    backgroundColor: item.roleInClass === 'teacher' ? '#9C27B0' : 
                                   item.roleInClass === 'assistant' ? '#FF9800' : '#4CAF50' 
                }]}>
                    <Text style={styles.roleText}>
                        {item.roleInClass.charAt(0).toUpperCase() + item.roleInClass.slice(1)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => selectedCourse && removeMemberFromCourse(selectedCourse.id, item)}
                >
                    <UserMinus size={16} color="#F44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9C27B0" />
                <Text style={styles.loadingText}>Loading Class Management...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Navigation Header */}
            <View style={styles.navigationHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/teacher/teacher')}
                >
                    <ArrowLeft size={24} color="#2D3436" />
                </TouchableOpacity>
                
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Class Management</Text>
                    <Text style={styles.headerSubtitle}>Create and manage class groups</Text>
                </View>
                
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => router.push('/teacher/teacher')}
                    >
                        <Home size={20} color="#6C5CE7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => {/* Navigate to analytics */}}
                    >
                        <BarChart3 size={20} color="#6C5CE7" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.mainScrollView}>
                {/* Class Management Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Class Management</Text>
                    <Text style={styles.sectionSubtitle}>Create and manage class groups</Text>
                    
                    {/* Search and Create */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Search size={20} color="#666" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search classes..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Plus size={20} color="#FFF" />
                            <Text style={styles.createButtonText}>Create Class</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Courses List */}
                    <FlatList
                        data={courses.filter(course => 
                            course.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            course.suffix.toLowerCase().includes(searchQuery.toLowerCase())
                        )}
                        renderItem={renderCourseItem}
                        keyExtractor={(item) => item.id.toString()}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        contentContainerStyle={styles.listContainer}
                        scrollEnabled={false}
                    />
                </View>

                {/* Student Management Section */}
                {selectedCourse && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Student Management - {selectedCourse.grade}-{selectedCourse.suffix}</Text>
                        <Text style={styles.sectionSubtitle}>View and manage students in {selectedCourse.grade}-{selectedCourse.suffix}</Text>
                    
                    {/* Student Stats Cards */}
                    <View style={styles.studentStatsGrid}>
                        <View style={[styles.studentStatCard, { backgroundColor: '#6C5CE7' + '10' }]}>
                            <Users size={28} color="#6C5CE7" />
                            <Text style={[styles.studentStatValue, { color: '#6C5CE7' }]}>{students.length}</Text>
                            <Text style={styles.studentStatTitle}>Total Students</Text>
                        </View>
                        <View style={[styles.studentStatCard, { backgroundColor: '#4CAF50' + '10' }]}>
                            <TrendingUp size={28} color="#4CAF50" />
                            <Text style={[styles.studentStatValue, { color: '#4CAF50' }]}>
                                {students.length > 0 ? `${Math.round(students.reduce((sum, s) => sum + s.performance.averageScore, 0) / students.length)}%` : '0%'}
                            </Text>
                            <Text style={styles.studentStatTitle}>Avg Score</Text>
                        </View>
                        <View style={[styles.studentStatCard, { backgroundColor: '#FF9800' + '10' }]}>
                            <Award size={28} color="#FF9800" />
                            <Text style={[styles.studentStatValue, { color: '#FF9800' }]}>
                                {students.length > 0 ? students.reduce((sum, s) => sum + s.points, 0).toLocaleString() : 0}
                            </Text>
                            <Text style={styles.studentStatTitle}>Total XP</Text>
                        </View>
                        <View style={[styles.studentStatCard, { backgroundColor: '#FF4757' + '10' }]}>
                            <Star size={28} color="#FF4757" />
                            <Text style={[styles.studentStatValue, { color: '#FF4757' }]}>
                                {students.filter(s => s.performance.averageScore >= 85).length}
                            </Text>
                            <Text style={styles.studentStatTitle}>High Performers</Text>
                        </View>
                    </View>

                    {/* Quick Action Bar */}
                    <View style={styles.studentActionBar}>
                        <View style={styles.studentSearchContainer}>
                            <Search size={20} color="#999" style={styles.studentSearchIcon} />
                            <TextInput
                                style={styles.studentSearchInput}
                                placeholder="Search students..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.studentActionButtons}>
                            <TouchableOpacity
                                style={[styles.studentFilterBtn, selectedSubject !== 'all' && styles.studentFilterBtnActive]}
                                onPress={() => setSelectedSubject('all')}
                            >
                                <Filter size={18} color={selectedSubject !== 'all' ? '#6C5CE7' : '#666'} />
                                <Text style={[styles.studentFilterBtnText, selectedSubject !== 'all' && styles.studentFilterBtnTextActive]}>All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.studentAddBtn}
                                onPress={() => {/* Add student functionality */}}
                            >
                                <UserPlus size={18} color="white" />
                                <Text style={styles.studentAddBtnText}>Add Student</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Students Grid */}
                    {students.filter(student => 
                        student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        student.email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                        <View style={styles.studentEmptyState}>
                            <Users size={48} color="#ccc" />
                            <Text style={styles.studentEmptyStateText}>No students found</Text>
                        </View>
                    ) : (
                        <View style={[styles.studentCardsGrid, isTablet && styles.studentCardsGridTablet]}>
                            {students.filter(student => 
                                student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                student.email.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((student) => (
                                <View key={student.id} style={styles.studentMainCard}>
                                    <View style={styles.studentMainCardHeader}>
                                        <View style={styles.studentMainAvatar}>
                                            <Text style={styles.studentMainAvatarText}>
                                                {student.username.charAt(0)}
                                            </Text>
                                        </View>
                                        <View style={styles.studentMainInfo}>
                                            <Text style={styles.studentMainName}>{student.username}</Text>
                                            <Text style={styles.studentMainEmail}>{student.email}</Text>
                                        </View>
                                        <View style={styles.studentCardActions}>
                                            <TouchableOpacity style={styles.studentActionIcon}>
                                                <Edit size={18} color="#6C5CE7" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.studentActionIcon}>
                                                <Trash2 size={18} color="#FF4757" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.studentMainProgressSection}>
                                        <View style={styles.studentMainSubjectProgress}>
                                            <View style={styles.studentMainSubjectItem}>
                                                <Calculator size={14} color="#4CAF50" />
                                                <Text style={styles.studentMainSubjectLabel}>Math</Text>
                                                <View style={styles.studentMainProgressBar}>
                                                    <View style={[styles.studentMainProgressFill, { width: `${student.gameProgress.math}%`, backgroundColor: '#4CAF50' }]} />
                                                </View>
                                                <Text style={styles.studentMainProgressPercent}>{student.gameProgress.math}%</Text>
                                            </View>
                                            <View style={styles.studentMainSubjectItem}>
                                                <Languages size={14} color="#2196F3" />
                                                <Text style={styles.studentMainSubjectLabel}>English</Text>
                                                <View style={styles.studentMainProgressBar}>
                                                    <View style={[styles.studentMainProgressFill, { width: `${student.gameProgress.english}%`, backgroundColor: '#2196F3' }]} />
                                                </View>
                                                <Text style={styles.studentMainProgressPercent}>{student.gameProgress.english}%</Text>
                                            </View>
                                            <View style={styles.studentMainSubjectItem}>
                                                <Atom size={14} color="#FF9800" />
                                                <Text style={styles.studentMainSubjectLabel}>Science</Text>
                                                <View style={styles.studentMainProgressBar}>
                                                    <View style={[styles.studentMainProgressFill, { width: `${student.gameProgress.science}%`, backgroundColor: '#FF9800' }]} />
                                                </View>
                                                <Text style={styles.studentMainProgressPercent}>{student.gameProgress.science}%</Text>
                                            </View>
                                            <View style={styles.studentMainSubjectItem}>
                                                <Brain size={14} color="#9C27B0" />
                                                <Text style={styles.studentMainSubjectLabel}>Chinese</Text>
                                                <View style={styles.studentMainProgressBar}>
                                                    <View style={[styles.studentMainProgressFill, { width: `${student.gameProgress.chinese}%`, backgroundColor: '#9C27B0' }]} />
                                                </View>
                                                <Text style={styles.studentMainProgressPercent}>{student.gameProgress.chinese}%</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.studentMainPerformanceRow}>
                                        <View style={styles.studentMainPerformanceBadge}>
                                            <Award size={16} color={getPerformanceColor(student.performance.averageScore)} />
                                            <Text style={[styles.studentMainPerformanceScore, { color: getPerformanceColor(student.performance.averageScore) }]}>
                                                {student.performance.averageScore}%
                                            </Text>
                                        </View>
                                        <View style={styles.studentMainPerformanceBadge}>
                                            <CheckCircle size={16} color="#4CAF50" />
                                            <Text style={styles.studentMainPerformanceText}>{student.performance.accuracy}% Acc.</Text>
                                        </View>
                                        <View style={styles.studentMainPerformanceBadge}>
                                            <Clock size={16} color="#FF9800" />
                                            <Text style={styles.studentMainPerformanceText}>{student.performance.totalTimeSpent}h</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.studentMainAiAnalysisBtn}>
                                        <Brain size={18} color="#6C5CE7" />
                                        <Text style={styles.studentMainAiAnalysisBtnText}>AI Performance Analysis</Text>
                                        <Sparkles size={14} color="#6C5CE7" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.studentMainViewDetailsBtn}>
                                        <Text style={styles.studentMainViewDetailsText}>View Full Report</Text>
                                        <ChevronRight size={16} color="#6C5CE7" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                )}

                {/* Analytics Section */}
                {selectedCourse && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Analytics Dashboard - {selectedCourse.grade}-{selectedCourse.suffix}</Text>
                        <Text style={styles.sectionSubtitle}>Performance insights and statistics for {selectedCourse.grade}-{selectedCourse.suffix}</Text>
                    
                    <View>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{students.length}</Text>
                            <Text style={styles.statLabel}>Total Students</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{courses.length}</Text>
                            <Text style={styles.statLabel}>Total Classes</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {students.length > 0 ? `${Math.round(students.reduce((sum, s) => sum + s.performance.averageScore, 0) / students.length)}%` : '0%'}
                            </Text>
                            <Text style={styles.statLabel}>Avg Score</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {students.length > 0 ? students.reduce((sum, s) => sum + s.points, 0).toLocaleString() : 0}
                            </Text>
                            <Text style={styles.statLabel}>Total XP</Text>
                        </View>
                    </View>
                    
                    <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Performance Overview</Text>
                        <View style={styles.chartPlaceholder}>
                            <BarChart3 size={48} color="#ccc" />
                            <Text style={styles.chartPlaceholderText}>Analytics charts coming soon</Text>
                        </View>
                    </View>
                    </View>
                </View>
                )}
            </ScrollView>

            {/* Create Course Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Class</Text>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Grade</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 3A, 1B"
                                value={grade}
                                onChangeText={setGrade}
                            />
                        </View>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Class Suffix</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., A, B, C"
                                value={suffix}
                                onChangeText={setSuffix}
                            />
                        </View>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Academic Year</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 2024"
                                value={academicYear}
                                onChangeText={setAcademicYear}
                            />
                        </View>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setCreateModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={createCourse}
                            >
                                <Text style={styles.confirmButtonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Members Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={memberModalVisible}
                onRequestClose={() => setMemberModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedCourse?.grade}-{selectedCourse?.suffix} Members
                            </Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setAddMemberModalVisible(true)}
                            >
                                <UserPlus size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={selectedCourse?.members || []}
                            renderItem={renderMemberItem}
                            keyExtractor={(item) => item.id.toString()}
                            style={styles.membersList}
                        />
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.closeButton]}
                            onPress={() => setMemberModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addMemberModalVisible}
                onRequestClose={() => setAddMemberModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Member</Text>
                        
                        <ScrollView style={styles.userList}>
                            {availableUsers.map(user => (
                                <TouchableOpacity
                                    key={user.id}
                                    style={[
                                        styles.userItem,
                                        selectedUser?.id === user.id && styles.selectedUserItem
                                    ]}
                                    onPress={() => setSelectedUser(user)}
                                >
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{user.username}</Text>
                                        <Text style={styles.userEmail}>{user.email}</Text>
                                    </View>
                                    <View style={styles.userStatus}>
                                        <Text style={styles.schoolText}>{user.schoolName}</Text>
                                        <Text style={[
                                            styles.roleText,
                                            { color: user.educatorStatus === 'APPROVED' ? '#9C27B0' : '#666' }
                                        ]}>
                                            {user.educatorStatus === 'APPROVED' ? 'Educator' : 'Student'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Role in Class</Text>
                            <View style={styles.roleOptions}>
                                {(['student', 'teacher', 'assistant'] as const).map(role => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            styles.roleOption,
                                            memberRole === role && styles.selectedRoleOption
                                        ]}
                                        onPress={() => setMemberRole(role)}
                                    >
                                        <Text style={[
                                            styles.roleOptionText,
                                            memberRole === role && styles.selectedRoleOptionText
                                        ]}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setAddMemberModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={addMemberToCourse}
                            >
                                <Text style={styles.confirmButtonText}>Add Member</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
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
    navigationHeader: {
        height: 70,
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
    backButton: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#636E72',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainScrollView: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    sectionContainer: {
        backgroundColor: '#FFF',
        margin: 20,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    studentsScrollView: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    studentsContainer: {
        flex: 1,
        padding: 20,
    },
    studentStatsGrid: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    studentStatCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    studentStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    studentStatTitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    studentActionBar: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        paddingTop: 0,
    },
    studentSearchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    studentSearchIcon: {
        marginRight: 12,
    },
    studentSearchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2D3436',
    },
    studentActionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    studentFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    studentFilterBtnActive: {
        backgroundColor: '#6C5CE7',
    },
    studentFilterBtnText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    studentFilterBtnTextActive: {
        color: '#FFF',
    },
    studentAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    studentAddBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    studentsSection: {
        padding: 20,
        paddingTop: 0,
    },
    studentSectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 8,
    },
    studentSectionSubtitle: {
        fontSize: 16,
        color: '#636E72',
        marginBottom: 20,
    },
    studentEmptyState: {
        alignItems: 'center',
        padding: 40,
    },
    studentEmptyStateText: {
        fontSize: 16,
        color: '#999',
        marginTop: 12,
    },
    studentCardsGrid: {
        gap: 16,
    },
    studentCardsGridTablet: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    studentMainCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    studentMainCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentMainAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    studentMainAvatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    studentMainInfo: {
        flex: 1,
    },
    studentMainName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    studentMainEmail: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    studentCardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    studentActionIcon: {
        padding: 6,
    },
    studentMainProgressSection: {
        marginVertical: 12,
    },
    studentMainSubjectProgress: {
        gap: 8,
    },
    studentMainSubjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    studentMainSubjectLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        width: 50,
    },
    studentMainProgressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    studentMainProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    studentMainProgressPercent: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        width: 35,
        textAlign: 'right',
    },
    studentMainPerformanceRow: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 12,
    },
    studentMainPerformanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    studentMainPerformanceScore: {
        fontSize: 14,
        fontWeight: '700',
    },
    studentMainPerformanceText: {
        fontSize: 12,
        color: '#666',
    },
    studentMainAiAnalysisBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0E6FF',
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
    },
    studentMainAiAnalysisBtnText: {
        color: '#6C5CE7',
        fontWeight: '600',
        fontSize: 14,
    },
    studentMainViewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 12,
        paddingVertical: 8,
    },
    studentMainViewDetailsText: {
        color: '#6C5CE7',
        fontSize: 13,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    studentCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    studentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    studentEmail: {
        fontSize: 14,
        color: '#666',
    },
    studentStats: {
        alignItems: 'flex-end',
    },
    studentPoints: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6C5CE7',
    },
    studentLevel: {
        fontSize: 12,
        color: '#666',
    },
    progressSection: {
        marginBottom: 12,
    },
    subjectProgress: {
        gap: 8,
    },
    subjectItem: {
        gap: 8,
    },
    subjectLabel: {
        fontSize: 12,
        color: '#666',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    performanceRow: {
        flexDirection: 'row',
        gap: 12,
    },
    performanceBadge: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
    },
    performanceScore: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    performanceLabel: {
        fontSize: 10,
        color: '#666',
    },
    analyticsContainer: {
        flex: 1,
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6C5CE7',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    chartContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    chartPlaceholder: {
        alignItems: 'center',
        padding: 40,
    },
    chartPlaceholderText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    searchSection: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9C27B0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    listContainer: {
        padding: 20,
    },
    courseCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedCourseCard: {
        borderWidth: 2,
        borderColor: '#6C5CE7',
        backgroundColor: '#F8F9FA',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    selectedText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    courseInfo: {
        flex: 1,
    },
    courseTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    courseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    yearBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9C27B0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    yearText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    schoolName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    memberCount: {
        fontSize: 12,
        color: '#666',
        flexDirection: 'row',
        alignItems: 'center',
    },
    courseActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        margin: 20,
        maxHeight: '80%',
        width: '90%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: '#9C27B0',
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#9C27B0',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: '#F5F5F5',
        marginTop: 20,
    },
    closeButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    membersList: {
        maxHeight: 300,
        marginBottom: 20,
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#9C27B0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberDetails: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    memberEmail: {
        fontSize: 14,
        color: '#666',
    },
    memberRole: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FFF1F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userList: {
        maxHeight: 200,
        marginBottom: 16,
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectedUserItem: {
        backgroundColor: '#F3E5F5',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    userStatus: {
        alignItems: 'flex-end',
    },
    schoolText: {
        fontSize: 12,
        color: '#666',
    },
    roleOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    roleOption: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    selectedRoleOption: {
        backgroundColor: '#9C27B0',
    },
    roleOptionText: {
        fontSize: 14,
        color: '#666',
    },
    selectedRoleOptionText: {
        color: '#FFF',
    },
});

export default ClassManagement;
