// TeacherDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    TextInput,
    Modal,
    Alert,
    useWindowDimensions,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import {
    Users,
    TrendingUp,
    Brain,
    BarChart3,
    Download,
    Filter,
    Search,
    Star,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    Award,
    BookOpen,
    Calculator,
    Languages,
    Atom,
    UserPlus,
    Edit,
    Trash2,
    Sparkles,
    RefreshCw,
    ArrowLeft,
    X,
    Plus,
    LogOut,
    User,
    Trophy,
    Gamepad2,
} from 'lucide-react-native';
import { ClassManagementPanel } from './ClassManagementPanel';
import { ClassAnalyticsPanel } from './ClassAnalyticsPanel';
import educatorService, { Course, StudentAnalytics } from './educatorService';
import StudentMetadataView from './StudentMetadataView';
import { getApiBaseUrl } from '@/src/api/client';
import axios from 'axios';

const { width } = Dimensions.get('window');

// 學生數據類型
interface Student {
    id: number;
    username: string;
    email: string;
    points: number;
    level: number;
    joinDate: string;
    lastActive: string;
    gameProgress: {
        math: number;
        english: number;
        science: number;
        chinese: number;
    };
    performance: {
        averageScore: number;
        totalTimeSpent: number;
        completedQuests: number;
        accuracy: number;
    };
}

export default function TeacherDashboard() {
    const router = useRouter();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { width: windowWidth } = useWindowDimensions();
    const { user, token, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState<Partial<Student>>({});
    const [classes, setClasses] = useState<Course[]>([]);
    const [metadataModalVisible, setMetadataModalVisible] = useState(false);

    // Navigation state (移除 studentLeaderboard)
    type TeacherView = 'dashboard' | 'students' | 'classes' | 'analytics';
    const [currentView, setCurrentView] = useState<TeacherView>('dashboard');
    const [selectedClass, setSelectedClass] = useState<Course | null>(null);

    const isLandscape = windowWidth > 800;
    const isTablet = windowWidth > 600;

    useEffect(() => {
        loadData();
    }, []);

    // 移除之前错误的 useEffect 导航副作用

    const loadData = async () => {
        try {
            setLoading(true);

            if (!token) {
                console.log('TeacherDashboard - No authentication token');
                setLoading(false);
                return;
            }

            // Load classes from backend
            const classesResponse = await educatorService.getClasses();
            const classesData = classesResponse.items || [];
            setClasses(classesData);
            console.log('Loaded classes:', classesData.length);

            // Load school members
            try {
                const membersData = await educatorService.getSchoolMembers();
                console.log('Loaded school members:', membersData.length);
            } catch (memberError) {
                console.error('Failed to load school members:', memberError);
            }

            // Load students
            await loadStudents();

        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            if (!token) {
                console.log('TeacherDashboard - No token available, skipping student load');
                setStudents([]);
                setFilteredStudents([]);
                return;
            }
            // Load real students from API
            const response = await axios.get(`${getApiBaseUrl()}/api/educator/school/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.content) {
                const studentsData = response.data.content.map((member: any) => ({
                    id: member.id,
                    username: member.username,
                    email: member.email,
                    points: member.points || 0,
                    level: member.level || 1,
                    joinDate: member.createdAt ? new Date(member.createdAt).toISOString().split('T')[0] : 'Unknown',
                    lastActive: member.lastActiveAt ? new Date(member.lastActiveAt).toISOString().split('T')[0] : 'Unknown',
                    gameProgress: {
                        math: member.mathProgress || 0,
                        english: member.englishProgress || 0,
                        science: member.scienceProgress || 0,
                        chinese: member.chineseProgress || 0
                    },
                    performance: {
                        averageScore: member.averageScore || 0,
                        totalTimeSpent: member.totalTimeSpent || 0,
                        completedQuests: member.completedQuests || 0,
                        accuracy: member.accuracy || 0
                    },
                }));

                // Enhance student data with progress analytics
                const studentsWithProgress = await Promise.all(
                    studentsData.map(async (student) => {
                        try {
                            const analytics = await educatorService.getStudentAnalytics(student.id);
                            if (analytics && analytics.progressTrends && analytics.progressTrends.subjectPerformance) {
                                const subjectPerformance = analytics.progressTrends.subjectPerformance;
                                const gameProgress = {
                                    math: subjectPerformance.find((s: any) => s.subject.toLowerCase() === 'math')?.average || 0,
                                    english: subjectPerformance.find((s: any) => s.subject.toLowerCase() === 'english')?.average || 0,
                                    science: subjectPerformance.find((s: any) => s.subject.toLowerCase() === 'science')?.average || 0,
                                    chinese: subjectPerformance.find((s: any) => s.subject.toLowerCase() === 'chinese')?.average || 0
                                };
                                return { ...student, gameProgress };
                            }
                            return student;
                        } catch (error) {
                            console.error(`Error loading analytics for student ${student.id}:`, error);
                            return student;
                        }
                    })
                );

                setStudents(studentsWithProgress);
                setFilteredStudents(studentsWithProgress);
            } else {
                setStudents([]);
                setFilteredStudents([]);
            }
        } catch (error: any) {
            console.error('TeacherDashboard - Error loading students:', error.response?.status, error.response?.data || error.message);
            if (error.response?.status === 401) {
                console.error('TeacherDashboard - Authentication failed - token may be invalid');
                setStudents([]);
                setFilteredStudents([]);
                // 强制登出并跳转登录页
                signOut();
                router.replace('/Profile/Login');
                return;
            }
            throw error;
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData().finally(() => setRefreshing(false));
    }, []);

    const handleClassSelect = (classItem: Course) => {
        setSelectedClass(classItem);
        setCurrentView('analytics');
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedClass(null);
    };

    const handleBackToClasses = () => {
        setCurrentView('classes');
        setSelectedClass(null);
    };

    // 新增：跳转至独立 Leaderboard 页面
    const navigateToLeaderboard = () => {
        router.push('/teacher/studentLeaderboard');
    };

    useEffect(() => {
        filterStudents();
    }, [searchQuery, selectedSubject, students]);

    const filterStudents = () => {
        let filtered = [...students];

        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedSubject !== 'all') {
            filtered = filtered.filter(s => {
                const progress = s.gameProgress[selectedSubject as keyof typeof s.gameProgress];
                return progress >= 70;
            });
        }

        setFilteredStudents(filtered);
    };

    const getPerformanceColor = (score: number) => {
        if (score >= 85) return '#4CAF50';
        if (score >= 70) return '#FF9800';
        return '#FF4757';
    };

    const getPerformanceLabel = (score: number) => {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Needs Improvement';
        return 'At Risk';
    };

    const generateAIAnalysis = async (student: Student) => {
        setAnalysisLoading(true);
        setAiAnalysis('');

        try {
            // Call AI analysis API
            const response = await axios.post(
                `${getApiBaseUrl()}/api/ai/analyze-student`,
                { studentId: student.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAiAnalysis(response.data.analysis);
        } catch (error) {
            // Fallback to local analysis
            const strengths = [];
            const weaknesses = [];
            const recommendations = [];

            if (student.gameProgress.math >= 80) strengths.push('Mathematics');
            else if (student.gameProgress.math < 60) weaknesses.push('Mathematics');

            if (student.gameProgress.english >= 80) strengths.push('English');
            else if (student.gameProgress.english < 60) weaknesses.push('English');

            if (student.gameProgress.science >= 80) strengths.push('Science');
            else if (student.gameProgress.science < 60) weaknesses.push('Science');

            if (student.gameProgress.chinese >= 80) strengths.push('Chinese');
            else if (student.gameProgress.chinese < 60) weaknesses.push('Chinese');

            if (student.performance.accuracy < 75) {
                recommendations.push('Focus on foundational concepts and practice more basic exercises');
            }
            if (student.performance.completedQuests < 30) {
                recommendations.push('Encourage daily quest completion to build consistent learning habits');
            }

            const analysis = `
📊 **AI Performance Analysis for ${student.username}**

**Overall Assessment:**
${getPerformanceLabel(student.performance.averageScore)} Level ${student.level} Learner
Average Score: ${student.performance.averageScore}% | Accuracy: ${student.performance.accuracy}%

**Strengths:**
${strengths.length > 0 ? strengths.map(s => `✓ ${s}`).join('\n') : '✓ Consistent effort across all subjects'}

**Areas for Improvement:**
${weaknesses.length > 0 ? weaknesses.map(w => `⚠️ ${w}`).join('\n') : '⚠️ Maintaining consistency in all subjects'}

**Key Metrics:**
• Total Points: ${student.points} XP
• Quests Completed: ${student.performance.completedQuests}
• Time Spent: ${student.performance.totalTimeSpent} hours
• Current Level: ${student.level}

**AI Recommendations:**
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

**Predicted Performance:**
With current trajectory, ${student.username} is expected to improve by 15-20% in the next month.

**Suggested Interventions:**
${student.performance.averageScore < 70 ? '🔴 Immediate intervention recommended' : '🟢 On track - continue current learning path'}
            `;
            setAiAnalysis(analysis);
        } finally {
            setAnalysisLoading(false);
            setAnalysisModalVisible(true);
        }
    };

    const deleteStudent = (studentId: number) => {
        Alert.alert(
            'Delete Student',
            'Are you sure you want to remove this student? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Call API to remove student from school/class
                            await axios.delete(`${getApiBaseUrl()}/api/admin/user/${studentId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            setStudents(students.filter(s => s.id !== studentId));
                            setFilteredStudents(filteredStudents.filter(s => s.id !== studentId));
                            Alert.alert('Success', 'Student removed successfully');
                        } catch (error) {
                            console.error('Error removing student:', error);
                            Alert.alert('Error', 'Failed to remove student. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const updateStudent = async (updatedStudent: Student) => {
        try {
            // Call API to update student information
            await axios.put(`${getApiBaseUrl()}/api/admin/user/${updatedStudent.id}`, {
                username: updatedStudent.username,
                email: updatedStudent.email,
                points: updatedStudent.points,
                level: updatedStudent.level,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStudents(students.map(s =>
                s.id === updatedStudent.id ? updatedStudent : s
            ));
            setFilteredStudents(filteredStudents.map(s =>
                s.id === updatedStudent.id ? updatedStudent : s
            ));
            Alert.alert('Success', 'Student information updated');
            setEditModalVisible(false);
            setEditingStudent(null);
        } catch (error) {
            console.error('Error updating student:', error);
            Alert.alert('Error', 'Failed to update student information. Please try again.');
        }
    };

    const addStudent = async () => {
        if (!newStudent.username || !newStudent.email) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            // Call API to register new student
            const response = await axios.post(`${getApiBaseUrl()}/api/auth/register`, {
                username: newStudent.username,
                email: newStudent.email,
                password: 'defaultPassword123', // You may want to generate or ask for this
                isEducator: false, // This is a student, not educator
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                const newStudentData: Student = {
                    id: response.data.id,
                    username: response.data.username,
                    email: response.data.email,
                    points: response.data.points || 0,
                    level: response.data.level || 1,
                    joinDate: response.data.createdAt ? new Date(response.data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    lastActive: new Date().toISOString().split('T')[0],
                    gameProgress: { math: 0, english: 0, science: 0, chinese: 0 },
                    performance: { averageScore: 0, totalTimeSpent: 0, completedQuests: 0, accuracy: 0 },
                };

                setStudents([newStudentData, ...students]);
                setFilteredStudents([newStudentData, ...filteredStudents]);
                setShowAddModal(false);
                setNewStudent({});
                Alert.alert('Success', 'Student added successfully');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            Alert.alert('Error', 'Failed to add student. Please try again.');
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = async () => {
        try {
            await signOut();
            router.replace('/Profile/Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
        setShowLogoutModal(false);
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    const handleViewMetadata = (student: Student) => {
        setSelectedStudent(student);
        setMetadataModalVisible(true);
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <View style={[styles.statCard, { backgroundColor: color + '10' }]}>
            <Icon size={28} color={color} />
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C5CE7" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // 計算整體統計
    const totalStudents = students.length;
    const avgScore = students.reduce((sum, s) => sum + s.performance.averageScore, 0) / (totalStudents || 1);
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const highPerformers = students.filter(s => s.performance.averageScore >= 85).length;

    // 根據 currentView 渲染不同內容
    if (currentView === 'classes') {
        return (
            <SafeAreaView style={styles.container}>
                <ClassManagementPanel onBack={() => setCurrentView('dashboard')} />
            </SafeAreaView>
        );
    }

    if (currentView === 'analytics' && selectedClass) {
        return (
            <SafeAreaView style={styles.container}>
                <ClassAnalyticsPanel
                    selectedClass={selectedClass}
                    onBack={handleBackToClasses}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Welcome back, {user?.username || 'Teacher'}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                            <RefreshCw size={22} color="#6C5CE7" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/teacher/teacherProfile')}>
                            <User size={22} color="#4CAF50" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <LogOut size={22} color="#FF4757" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Navigation Tabs */}
                <View style={styles.tabContainer}>
                    {(['dashboard', 'students', 'classes', 'analytics'] as TeacherView[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, currentView === tab && styles.tabActive]}
                            onPress={() => setCurrentView(tab)}
                        >
                            {tab === 'dashboard' && <TrendingUp size={18} color={currentView === tab ? '#6C5CE7' : '#666'} />}
                            {tab === 'students' && <Users size={18} color={currentView === tab ? '#6C5CE7' : '#666'} />}
                            {tab === 'classes' && <BookOpen size={18} color={currentView === tab ? '#6C5CE7' : '#666'} />}
                            {tab === 'analytics' && <BarChart3 size={18} color={currentView === tab ? '#6C5CE7' : '#666'} />}
                            <Text style={[styles.tabText, currentView === tab && styles.tabTextActive]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {/* 独立 Leaderboard 标签按钮 */}
                    <TouchableOpacity
                        style={styles.tab}
                        onPress={navigateToLeaderboard}
                    >
                        <Award size={18} color="#666" />
                        <Text style={styles.tabText}>Leaderboard</Text>
                    </TouchableOpacity>
                </View>

                {/* Dashboard View */}
                {currentView === 'dashboard' && (
                    <>
                        <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
                            <StatCard title="Total Students" value={totalStudents} icon={Users} color="#6C5CE7" />
                            <StatCard title="Avg Score" value={`${avgScore.toFixed(1)}%`} icon={TrendingUp} color="#4CAF50" />
                            <StatCard title="Total XP" value={totalPoints.toLocaleString()} icon={Award} color="#FF9800" />
                            <StatCard title="High Performers" value={highPerformers} icon={Star} color="#FF4757" />
                        </View>

                        <View style={styles.quickActionsGrid}>
                            <TouchableOpacity style={styles.quickActionCard} onPress={() => setCurrentView('students')}>
                                <Users size={28} color="#6C5CE7" />
                                <Text style={styles.quickActionTitle}>Student Management</Text>
                                <Text style={styles.quickActionSubtitle}>View all students</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickActionCard} onPress={() => setCurrentView('classes')}>
                                <BookOpen size={28} color="#4CAF50" />
                                <Text style={styles.quickActionTitle}>Class Management</Text>
                                <Text style={styles.quickActionSubtitle}>Manage classes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickActionCard}
                                onPress={() => {
                                    if (classes.length > 0) {
                                        handleClassSelect(classes[0]);
                                    } else {
                                        Alert.alert('No Classes', 'Please create a class first');
                                    }
                                }}
                            >
                                <BarChart3 size={28} color="#FF9800" />
                                <Text style={styles.quickActionTitle}>Analytics</Text>
                                <Text style={styles.quickActionSubtitle}>View performance</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Students View */}
                {currentView === 'students' && (
                    <>
                        <View style={styles.actionBar}>
                            <View style={styles.searchContainer}>
                                <Search size={20} color="#999" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor="#999"
                                />
                            </View>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.filterBtn, selectedSubject !== 'all' && styles.filterBtnActive]}
                                    onPress={() => setSelectedSubject(selectedSubject === 'all' ? 'math' : 'all')}
                                >
                                    <Filter size={18} color={selectedSubject !== 'all' ? '#6C5CE7' : '#666'} />
                                    <Text style={[styles.filterBtnText, selectedSubject !== 'all' && styles.filterBtnTextActive]}>
                                        {selectedSubject === 'all' ? 'All' : selectedSubject}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                                    <UserPlus size={18} color="white" />
                                    <Text style={styles.addBtnText}>Add Student</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.studentsSection}>
                            <Text style={styles.sectionTitle}>Student Management</Text>
                            <Text style={styles.sectionSubtitle}>View and manage all student data</Text>

                            {filteredStudents.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Users size={48} color="#ccc" />
                                    <Text style={styles.emptyStateText}>No students found</Text>
                                </View>
                            ) : (
                                <View style={[styles.studentsGrid, isTablet && styles.studentsGridTablet]}>
                                    {filteredStudents.map((student) => (
                                        <View key={student.id} style={styles.studentCard}>
                                            <View style={styles.studentCardHeader}>
                                                <View style={styles.studentAvatar}>
                                                    <Text style={styles.avatarText}>{student.username.charAt(0)}</Text>
                                                </View>
                                                <View style={styles.studentInfo}>
                                                    <Text style={styles.studentName}>{student.username}</Text>
                                                    <Text style={styles.studentEmail}>{student.email}</Text>
                                                </View>
                                                <View style={styles.cardActions}>
                                                    <TouchableOpacity onPress={() => {
                                                        setEditingStudent(student);
                                                        setEditModalVisible(true);
                                                    }} style={styles.actionIcon}>
                                                        <Edit size={18} color="#6C5CE7" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => deleteStudent(student.id)} style={styles.actionIcon}>
                                                        <Trash2 size={18} color="#FF4757" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <View style={styles.progressSection}>
                                                <View style={styles.subjectProgress}>
                                                    {Object.entries(student.gameProgress).map(([subject, progress]) => (
                                                        <View key={subject} style={styles.subjectItem}>
                                                            {subject === 'math' && <Calculator size={14} color="#4CAF50" />}
                                                            {subject === 'english' && <Languages size={14} color="#2196F3" />}
                                                            {subject === 'science' && <Atom size={14} color="#FF9800" />}
                                                            {subject === 'chinese' && <Brain size={14} color="#9C27B0" />}
                                                            <Text style={styles.subjectLabel}>{subject.charAt(0).toUpperCase() + subject.slice(1)}</Text>
                                                            <View style={styles.progressBar}>
                                                                <View style={[
                                                                    styles.progressFill,
                                                                    {
                                                                        width: `${progress}%`,
                                                                        backgroundColor: subject === 'math' ? '#4CAF50' :
                                                                            subject === 'english' ? '#2196F3' :
                                                                                subject === 'science' ? '#FF9800' :
                                                                                    subject === 'chinese' ? '#9C27B0' : '#666'
                                                                    }
                                                                ]} />
                                                            </View>
                                                            <Text style={styles.progressPercent}>{progress}%</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>

                                            <View style={styles.performanceRow}>
                                                <View style={styles.performanceBadge}>
                                                    <Award size={16} color={getPerformanceColor(student.performance.averageScore)} />
                                                    <Text style={[styles.performanceScore, { color: getPerformanceColor(student.performance.averageScore) }]}>
                                                        {student.performance.averageScore}%
                                                    </Text>
                                                </View>
                                                <View style={styles.performanceBadge}>
                                                    <CheckCircle size={16} color="#4CAF50" />
                                                    <Text style={styles.performanceText}>{student.performance.accuracy}% Acc.</Text>
                                                </View>
                                                <View style={styles.performanceBadge}>
                                                    <Clock size={16} color="#FF9800" />
                                                    <Text style={styles.performanceText}>{student.performance.totalTimeSpent}h</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity style={styles.aiAnalysisBtn} onPress={() => generateAIAnalysis(student)}>
                                                <Brain size={18} color="#6C5CE7" />
                                                <Text style={styles.aiAnalysisBtnText}>AI Performance Analysis</Text>
                                                <Sparkles size={14} color="#6C5CE7" />
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.metadataBtn} onPress={() => handleViewMetadata(student)}>
                                                <Gamepad2 size={18} color="#4CAF50" />
                                                <Text style={styles.metadataBtnText}>View Game Metadata</Text>
                                                <ChevronRight size={16} color="#4CAF50" />
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => {
                                                setSelectedStudent(student);
                                                setModalVisible(true);
                                            }}>
                                                <Text style={styles.viewDetailsText}>View Full Report</Text>
                                                <ChevronRight size={16} color="#6C5CE7" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Student Detail Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isLandscape && styles.modalContentLandscape]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedStudent && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Student Report</Text>
                                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                                            <XCircle size={24} color="#999" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.reportSection}>
                                        <Text style={styles.reportSectionTitle}>Basic Information</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Name:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.username}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Email:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.email}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Level:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.level}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Points:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.points} XP</Text>
                                        </View>
                                    </View>

                                    <View style={styles.reportSection}>
                                        <Text style={styles.reportSectionTitle}>Performance Metrics</Text>
                                        <View style={styles.metricsGrid}>
                                            <View style={styles.metricCard}>
                                                <Text style={styles.metricValue}>{selectedStudent.performance.averageScore}%</Text>
                                                <Text style={styles.metricLabel}>Avg Score</Text>
                                            </View>
                                            <View style={styles.metricCard}>
                                                <Text style={styles.metricValue}>{selectedStudent.performance.accuracy}%</Text>
                                                <Text style={styles.metricLabel}>Accuracy</Text>
                                            </View>
                                            <View style={styles.metricCard}>
                                                <Text style={styles.metricValue}>{selectedStudent.performance.completedQuests}</Text>
                                                <Text style={styles.metricLabel}>Quests</Text>
                                            </View>
                                            <View style={styles.metricCard}>
                                                <Text style={styles.metricValue}>{selectedStudent.performance.totalTimeSpent}h</Text>
                                                <Text style={styles.metricLabel}>Time Spent</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.fullAnalysisBtn} onPress={() => {
                                        setModalVisible(false);
                                        generateAIAnalysis(selectedStudent);
                                    }}>
                                        <Brain size={20} color="white" />
                                        <Text style={styles.fullAnalysisBtnText}>Generate AI Analysis Report</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* AI Analysis Modal */}
            <Modal animationType="slide" transparent={true} visible={analysisModalVisible} onRequestClose={() => setAnalysisModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, styles.aiModalContent]}>
                        <View style={styles.modalHeader}>
                            <View style={styles.aiModalHeaderLeft}>
                                <Brain size={24} color="#6C5CE7" />
                                <Text style={styles.modalTitle}>AI Analysis Report</Text>
                            </View>
                            <TouchableOpacity onPress={() => setAnalysisModalVisible(false)}>
                                <XCircle size={24} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {analysisLoading ? (
                            <View style={styles.aiLoadingContainer}>
                                <ActivityIndicator size="large" color="#6C5CE7" />
                                <Text style={styles.aiLoadingText}>AI is analyzing student performance...</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.aiAnalysisContent}>
                                <Text style={styles.aiAnalysisText}>{aiAnalysis}</Text>
                            </ScrollView>
                        )}

                        {!analysisLoading && (
                            <TouchableOpacity style={styles.downloadReportBtn} onPress={() => {
                                Alert.alert('Download', 'Report download started');
                                setAnalysisModalVisible(false);
                            }}>
                                <Download size={18} color="white" />
                                <Text style={styles.downloadReportText}>Download Report</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Edit Student Modal */}
            <Modal animationType="slide" transparent={true} visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Student</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                        {editingStudent && (
                            <ScrollView>
                                <View style={styles.editForm}>
                                    <Text style={styles.inputLabel}>Username</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingStudent.username}
                                        onChangeText={(text) => setEditingStudent({ ...editingStudent, username: text })}
                                    />
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editingStudent.email}
                                        onChangeText={(text) => setEditingStudent({ ...editingStudent, email: text })}
                                        keyboardType="email-address"
                                    />
                                    <Text style={styles.inputLabel}>Points</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(editingStudent.points)}
                                        onChangeText={(text) => setEditingStudent({ ...editingStudent, points: parseInt(text) || 0 })}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.inputLabel}>Level</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={String(editingStudent.level)}
                                        onChangeText={(text) => setEditingStudent({ ...editingStudent, level: parseInt(text) || 1 })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <TouchableOpacity style={styles.saveBtn} onPress={() => updateStudent(editingStudent)}>
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Add Student Modal */}
            <Modal animationType="slide" transparent={true} visible={showAddModal} onRequestClose={() => setShowAddModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Student</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <X size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <View style={styles.editForm}>
                                <Text style={styles.inputLabel}>Username *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newStudent.username || ''}
                                    onChangeText={(text) => setNewStudent({ ...newStudent, username: text })}
                                    placeholder="Enter username"
                                />
                                <Text style={styles.inputLabel}>Email *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newStudent.email || ''}
                                    onChangeText={(text) => setNewStudent({ ...newStudent, email: text })}
                                    placeholder="Enter email"
                                    keyboardType="email-address"
                                />
                                <Text style={styles.inputLabel}>Initial Points</Text>
                                <TextInput
                                    style={styles.input}
                                    value={String(newStudent.points || 0)}
                                    onChangeText={(text) => setNewStudent({ ...newStudent, points: parseInt(text) || 0 })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <TouchableOpacity style={styles.saveBtn} onPress={addStudent}>
                                <Text style={styles.saveBtnText}>Add Student</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

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

            <StudentMetadataView
                visible={metadataModalVisible}
                onClose={() => setMetadataModalVisible(false)}
                student={selectedStudent || { id: 0, username: '', email: '' }}
                token={token || ''}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0E6FF', justifyContent: 'center', alignItems: 'center' },
    headerTextContainer: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#2D3436' },
    headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
    headerActions: { flexDirection: 'row', gap: 8 },
    refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0E6FF', justifyContent: 'center', alignItems: 'center' },
    profileBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E8', justifyContent: 'center', alignItems: 'center' },
    logoutBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFE6E6', justifyContent: 'center', alignItems: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statsGridTablet: { flexDirection: 'row' },
    statCard: { flex: 1, minWidth: 120, padding: 16, borderRadius: 16, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '900', marginTop: 8 },
    statTitle: { fontSize: 12, color: '#666', marginTop: 4 },
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    tabActive: { backgroundColor: '#6C5CE7' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#666' },
    tabTextActive: { color: '#fff' },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
    quickActionCard: { flex: 1, minWidth: 100, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    quickActionTitle: { fontSize: 14, fontWeight: '700', color: '#2D3436', marginTop: 8, textAlign: 'center' },
    quickActionSubtitle: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },
    recentSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#2D3436', marginBottom: 12 },
    recentStudentsList: { gap: 12 },
    recentStudentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    recentStudentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center' },
    recentAvatarText: { color: 'white', fontSize: 16, fontWeight: '700' },
    recentStudentInfo: { flex: 1, marginLeft: 12 },
    recentStudentName: { fontSize: 14, fontWeight: '600', color: '#2D3436' },
    recentStudentScore: { fontSize: 12, color: '#4CAF50', fontWeight: '700', marginTop: 2 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 12 },
    viewAllBtnText: { fontSize: 14, fontWeight: '600', color: '#6C5CE7' },
    actionBar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E0E0E0', height: 44 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#2D3436' },
    actionButtons: { flexDirection: 'row', gap: 8 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white', borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#E0E0E0' },
    filterBtnActive: { backgroundColor: '#F0E6FF', borderColor: '#6C5CE7' },
    filterBtnText: { fontSize: 14, color: '#666' },
    filterBtnTextActive: { color: '#6C5CE7' },
    addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#6C5CE7', borderRadius: 12, gap: 6 },
    addBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
    studentsSection: { marginTop: 8 },
    sectionSubtitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 20 },
    studentsGrid: { gap: 16 },
    studentsGridTablet: { flexDirection: 'row', flexWrap: 'wrap' },
    studentCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    studentCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    studentAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
    studentEmail: { fontSize: 12, color: '#999', marginTop: 2 },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionIcon: { padding: 6 },
    progressSection: { marginVertical: 12 },
    subjectProgress: { gap: 8 },
    subjectItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    subjectLabel: { fontSize: 12, fontWeight: '600', color: '#666', width: 50 },
    progressBar: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressPercent: { fontSize: 11, fontWeight: '600', color: '#666', width: 35, textAlign: 'right' },
    performanceRow: { flexDirection: 'row', gap: 12, marginVertical: 12 },
    performanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8F9FA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    performanceScore: { fontSize: 14, fontWeight: '700' },
    performanceText: { fontSize: 12, color: '#666' },
    aiAnalysisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0E6FF', paddingVertical: 10, borderRadius: 12, marginTop: 8 },
    aiAnalysisBtnText: { color: '#6C5CE7', fontWeight: '600', fontSize: 14 },
    viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingVertical: 8 },
    viewDetailsText: { color: '#6C5CE7', fontSize: 13, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyStateText: { marginTop: 12, fontSize: 16, color: '#999' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 24, width: '90%', maxHeight: '80%', padding: 20 },
    modalContentLandscape: { width: '70%', maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#2D3436' },
    reportSection: { marginBottom: 20 },
    reportSectionTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436', marginBottom: 12 },
    infoRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    infoLabel: { width: 80, fontSize: 14, color: '#666' },
    infoValue: { flex: 1, fontSize: 14, color: '#2D3436', fontWeight: '500' },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metricCard: { flex: 1, minWidth: 80, backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, alignItems: 'center' },
    metricValue: { fontSize: 20, fontWeight: '900', color: '#6C5CE7' },
    metricLabel: { fontSize: 11, color: '#666', marginTop: 4 },
    fullAnalysisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6C5CE7', paddingVertical: 14, borderRadius: 12, marginTop: 20 },
    fullAnalysisBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
    aiModalContent: { maxHeight: '85%' },
    aiModalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiLoadingContainer: { alignItems: 'center', paddingVertical: 40 },
    aiLoadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#2D3436' },
    aiAnalysisContent: { maxHeight: 500, marginVertical: 16 },
    aiAnalysisText: { fontSize: 14, lineHeight: 22, color: '#2D3436' },
    metadataBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#E8F5E8',
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
    },
    metadataBtnText: {
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: 14,
    },
    downloadReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 12, marginTop: 16 },
    downloadReportText: { color: 'white', fontWeight: '600', fontSize: 14 },
    editForm: { gap: 12, marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, backgroundColor: '#F8F9FA' },
    saveBtn: { backgroundColor: '#6C5CE7', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
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
    },
});