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
    Target,
} from 'lucide-react-native';
import { ClassManagementPanel } from './ClassManagementPanel';
import { ClassAnalyticsPanel } from './ClassAnalyticsPanel';
import educatorService, { Course, StudentAnalytics } from './educatorService';
import {StudentMetadataView} from './StudentMetadataView';
import { getApiBaseUrl } from '@/src/api/client';
import axios from 'axios';
import { AvatarIcons } from '../Profile/AvatarIcons';

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
    classes?: Course[]; // 學生所屬的班级
    avatar?: string;
    selectedAvatar?: string;
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
    const [selectedClass, setSelectedClass] = useState<string | null>('all');
    const [showClassFilterModal, setShowClassFilterModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
        const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState<Partial<Student>>({});
    const [classes, setClasses] = useState<Course[]>([]);
    const [metadataModalVisible, setMetadataModalVisible] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
    const [showGameScoreModal, setShowGameScoreModal] = useState(false);
    const [selectedStudentForScores, setSelectedStudentForScores] = useState<{id: number, name: string} | null>(null);
    const [studentGameScores, setStudentGameScores] = useState<any[]>([]);
    const [studentBestScores, setStudentBestScores] = useState<any[]>([]);
    const [loadingScores, setLoadingScores] = useState(false);
    const [studentProfile, setStudentProfile] = useState<any>(null);

    // Navigation state (移除 studentLeaderboard)
    type TeacherView = 'dashboard' | 'students' | 'classes';
    const [currentView, setCurrentView] = useState<TeacherView>('dashboard');


    const isLandscape = windowWidth > 800;
    const isTablet = windowWidth > 600;

    useEffect(() => {
        loadData();
    }, [token]);

    // Load detailed student data when students are loaded
    useEffect(() => {
        console.log('useEffect triggered - students.length:', students.length);
        if (students.length > 0) {
            console.log('Calling loadStudentDetails...');
            loadStudentDetails();
        }
    }, [students.length]);

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

        } catch (error: any) {
            console.error('Error loading data:', error);
            
            // Handle authentication errors specifically
            if (error.message === 'AUTH_REQUIRED' || error.message === 'TOKEN_INVALID' || error.message === 'TOKEN_EXPIRED') {
                console.log('TeacherDashboard - Authentication error in loadData, clearing session');
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                signOut();
                router.replace('/Profile/Login');
                return;
            }
            
            // Handle 401 errors from API
            if (error.response?.status === 401) {
                console.log('TeacherDashboard - 401 Unauthorized in loadData, clearing session');
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                signOut();
                router.replace('/Profile/Login');
                return;
            }
            
            Alert.alert('Error', 'Failed to load data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            if (!token) {
                console.log('TeacherDashboard - No token available, skipping student load');
                return; // 不要清空現有數據
            }

            console.log('Loading students from API...');
            const response = await axios.get(`${getApiBaseUrl()}/api/educator/school/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 處理不同的響應結構
            let membersData = [];
            if (response.data) {
                if (response.data.content) {
                    membersData = response.data.content;
                } else if (Array.isArray(response.data)) {
                    membersData = response.data;
                } else if (response.data.items) {
                    membersData = response.data.items;
                }
            }

            if (membersData.length > 0) {
                const studentsData: Student[] = membersData.map((member: any) => ({
                    id: member.id,
                    username: member.username || member.name || 'Unknown',
                    email: member.email || 'No email',
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

                // 使用Promise.allSettled代替Promise.all
                const studentsWithProgress = await Promise.allSettled(
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
                            return student; // 返回原始數據
                        }
                    })
                );

                // 只保留成功的結果
                const validStudents = studentsWithProgress
                    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
                    .map(result => result.value);

                // 為每個學生獲取班级信息
                const studentsWithClasses = await Promise.allSettled(
                    validStudents.map(async (student) => {
                        try {
                            const studentClasses = await educatorService.getStudentClasses(student.id);
                            return { ...student, classes: studentClasses };
                        } catch (error) {
                            console.error(`Error loading classes for student ${student.id}:`, error);
                            return { ...student, classes: [] };
                        }
                    })
                );

                // 只保留成功的結果
                const finalStudents = studentsWithClasses
                    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
                    .map(result => result.value);

                setStudents(finalStudents);
                setFilteredStudents(finalStudents);
            } else {
                console.log('No members data found, keeping existing students');
                // 不要清空現有數據
            }
        } catch (error: any) {
            console.error('TeacherDashboard - Error loading students:', error.response?.status, error.response?.data || error.message);

            // Handle authentication errors specifically
            if (error.message === 'AUTH_REQUIRED' || error.message === 'TOKEN_INVALID' || error.message === 'TOKEN_EXPIRED') {
                console.log('TeacherDashboard - Authentication error, clearing session');
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                signOut();
                router.replace('/Profile/Login');
                return;
            }
            
            // Handle 401 errors from API
            if (error.response?.status === 401) {
                console.log('TeacherDashboard - 401 Unauthorized, clearing session');
                Alert.alert('Session Expired', 'Your session has expired. Please login again.');
                signOut();
                router.replace('/Profile/Login');
                return;
            }

            // 其他錯誤不清空數據
            Alert.alert('Error', 'Failed to load students. Please try again.');
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData().finally(() => setRefreshing(false));
    }, []);

    const handleClassSelect = (classItem: Course) => {
        setSelectedClass(`${classItem.grade} ${classItem.suffix}`);
        // Analytics view was removed, just stay on dashboard or go to classes
        setCurrentView('classes');
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedClass(null);
    };

    const handleBackToClasses = () => {
        setCurrentView('classes');
        setSelectedClass(null);
    };


    const navigateToLeaderboard = () => {
        router.push('/teacher/studentLeaderboard');
    };

    useEffect(() => {
        filterStudents();
    }, [searchQuery, selectedClass, students]);

    const filterStudents = () => {
        let filtered = [...students];

        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedClass !== 'all') {
            filtered = filtered.filter(s => 
                s.classes && s.classes.some(c => 
                    `${c.grade} ${c.suffix}` === selectedClass
                )
            );
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

    // Function to render user avatar
    const renderUserAvatar = (student: Student, size: number = 48) => {
        if (student.selectedAvatar && AvatarIcons[student.selectedAvatar as keyof typeof AvatarIcons]) {
            const AvatarComponent = AvatarIcons[student.selectedAvatar as keyof typeof AvatarIcons];
            return <AvatarComponent size={size} />;
        } else {
            // Fallback to initials
            const avatarText = student.username ? student.username.charAt(0).toUpperCase() : '?';
            return (
                <View style={[styles.studentAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
                    <Text style={[styles.avatarText, { fontSize: size / 2.4 }]}>
                        {avatarText}
                    </Text>
                </View>
            );
        }
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
        setStudentToDelete(studentId);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!studentToDelete) return;

        try {
            // Use educator service to remove student from school
            await educatorService.removeStudentFromSchool(studentToDelete);

            setStudents(students.filter(s => s.id !== studentToDelete));
            setFilteredStudents(filteredStudents.filter(s => s.id !== studentToDelete));
            Alert.alert('Success', 'Student removed from school successfully');
        } catch (error: any) {
            console.error('Error removing student:', error);
            if (error.response?.status === 401 || error.message?.includes('Permission denied')) {
                Alert.alert('Permission Denied', 'You do not have permission to remove students from school. Please contact your administrator.');
            } else if (error.response?.status === 404 || error.message?.includes('not found')) {
                Alert.alert('Student Not Found', 'The student you are trying to remove does not exist.');
            } else {
                Alert.alert('Error', 'Failed to remove student. Please try again.');
            }
        } finally {
            setShowDeleteModal(false);
            setStudentToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setStudentToDelete(null);
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
                password: 'defaultPassword123', // Default password for new students
                isEducator: false, // This is a student, not educator
                schoolName: user?.school || '', // Include teacher's school name
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
                Alert.alert('Success', 'Student added successfully\n\nDefault password: defaultPassword123\n\nPlease share this password with the student for their first login.');
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

    const viewStudentScores = async (studentId: number, studentName: string) => {
        try {
            setLoadingScores(true);
            setSelectedStudentForScores({ id: studentId, name: studentName });
            setShowGameScoreModal(true);

            console.log(`Loading scores for student ${studentId} (${studentName})`);

            // Load student profile, game scores and best scores
            const [profile, gameScores, bestScores] = await Promise.all([
                educatorService.getStudentProfile(studentId, 0), // No class context in teacher dashboard
                educatorService.getStudentGameScores(studentId),
                educatorService.getStudentBestScores(studentId)
            ]);

            console.log('API Responses:');
            console.log('Profile:', profile);
            console.log('Game Scores:', gameScores);
            console.log('Best Scores:', bestScores);

            setStudentProfile(profile);
            setStudentGameScores(gameScores);
            setStudentBestScores(bestScores);
        } catch (error: any) {
            console.error('Error loading student scores:', error);
            Alert.alert('Error', 'Failed to load student scores: ' + error.message);
            setShowGameScoreModal(false);
        } finally {
            setLoadingScores(false);
        }
    };

    // Helper functions for Profile-style display
    const getGameThemeColor = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'MATH': return '#4CAF50';
            case 'ENGLISH': return '#2196F3';
            case 'SCIENCE': return '#FF9800';
            case 'CHINESE': return '#9C27B0';
            default: return '#636E72';
        }
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff?.toUpperCase()) {
            case 'HARD': return '#FF4757';
            case 'MEDIUM': return '#FF9800';
            default: return '#4CAF50';
        }
    };

    const renderGameIcon = (type: string, color: string) => {
        const props = { size: 22, color };
        switch (type?.toUpperCase()) {
            case 'MATH': return <Target {...props} />;
            case 'ENGLISH': return <BookOpen {...props} />;
            case 'SCIENCE': return <TrendingUp {...props} />;
            case 'CHINESE': return <Users {...props} />;
            default: return <Target {...props} />;
        }
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
    const totalClasses = classes.length;
    const activeStudents = students.filter(s => s.lastActive !== 'Unknown').length;
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);

    const loadStudentDetails = async () => {
        try {
            console.log('loadStudentDetails called - students.length:', students.length);
            if (students.length === 0) {
                console.log('No students to process');
                return;
            }

            const gameDataPromises = students
                .map(async (student) => {
                    try {
                        const scores = await educatorService.getStudentGameScores(student.id);
                        console.log(`Student ${student.username} scores:`, scores);

                        if (!scores || scores.length === 0) {
                            console.log(`No scores for student ${student.username}`);
                            return { student, performance: { averageScore: 0, totalTimeSpent: 0, completedQuests: 0, accuracy: 0 } };
                        }

                        // Calculate performance metrics from game scores
                        const totalScore = scores.reduce((sum, score) => sum + (score.scores || 0), 0);
                        const averageScore = Math.round(totalScore / scores.length);
                        const gameCount = scores.length;

                        const performance = {
                            averageScore: averageScore,
                            totalTimeSpent: 0, // GameScore doesn't have timeSpent property
                            completedQuests: gameCount, // Use game count as completed quests
                            accuracy: 0 // GameScore doesn't have isCorrect property
                        };

                        console.log(`Student ${student.username} performance:`, performance);

                        return { student, performance };
                    } catch (error) {
                        console.error(`Error loading game data for student ${student.id}:`, error);
                        return { student, performance: { averageScore: 0, totalTimeSpent: 0, completedQuests: 0, accuracy: 0 } };
                    }
                });

            const results = await Promise.all(gameDataPromises);
            const studentsWithPerformance = results.map(result => ({
                ...result.student,
                performance: result.performance
            }));

            console.log('Updated students with performance data:', studentsWithPerformance.length);
            studentsWithPerformance.forEach(s => {
                console.log(`Final: ${s.username} - games: ${s.performance.completedQuests}, avg: ${s.performance.averageScore}`);
            });

            setStudents(studentsWithPerformance);
            setFilteredStudents(studentsWithPerformance);

        } catch (error) {
            console.error('Error loading student details:', error);
        }
    };

    // Test function to manually trigger data loading
    const testLoadStudentData = () => {
        console.log('Manual test triggered');
        loadStudentDetails();
    };

    // 根據 currentView 渲染不同內容
    if (currentView === 'classes') {
        return (
            <SafeAreaView style={styles.container}>
                <ClassManagementPanel onBack={() => setCurrentView('dashboard')} />
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
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/index_with_teacher')}>
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
                    {(['dashboard', 'students', 'classes'] as TeacherView[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, currentView === tab && styles.tabActive]}
                            onPress={() => setCurrentView(tab)}
                        >
                            {tab === 'dashboard' && <TrendingUp size={18} color={currentView === tab ? '#6C5CE7' : '#666'} />}
                            {tab === 'students' && <Users size={18} color={currentView === tab ? '#6C5CE7' : '#666'} />}
                            {tab === 'classes' && <BookOpen size={18} color={currentView === tab ? '#6C5CE7' : '#666'} />}
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
                            <StatCard title="Total Classes" value={totalClasses} icon={BookOpen} color="#4CAF50" />
                            <StatCard title="Active Students" value={activeStudents} icon={TrendingUp} color="#FF9800" />
                            <StatCard title="Total Points" value={totalPoints.toLocaleString()} icon={Award} color="#FF4757" />
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
                                    style={[styles.filterBtn, selectedClass !== 'all' && styles.filterBtnActive]}
                                    onPress={() => setShowClassFilterModal(true)}
                                >
                                    <Filter size={18} color={selectedClass !== 'all' ? '#6C5CE7' : '#666'} />
                                    <Text style={[styles.filterBtnText, selectedClass !== 'all' && styles.filterBtnTextActive]}>
                                        {selectedClass === 'all' ? 'All Classes' : selectedClass}
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
                                                {renderUserAvatar(student)}
                                                <View style={styles.studentInfo}>
                                                    <Text style={styles.studentName} numberOfLines={1} ellipsizeMode="tail">{student.username}</Text>
                                                    <Text style={styles.studentEmail} numberOfLines={1} ellipsizeMode="tail">{student.email}</Text>
                                                    {student.classes && student.classes.length > 0 && (
                                                        <View style={styles.classBadgesContainer}>
                                                            {student.classes.map((classItem) => (
                                                                <View key={classItem.id} style={styles.classBadge}>
                                                                    <Text style={styles.classBadgeText}>
                                                                        {classItem.grade} {classItem.suffix}
                                                                    </Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                    {(!student.classes || student.classes.length === 0) && (
                                                        <Text style={styles.noClassText}>No class assigned</Text>
                                                    )}
                                                </View>
                                                <View style={styles.cardActions}>
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
                                                    <Gamepad2 size={16} color="#FF9800" />
                                                    <Text style={styles.performanceText}>{student.performance.completedQuests} games</Text>
                                                </View>

                                            </View>



                                            <TouchableOpacity style={styles.metadataBtn} onPress={() => handleViewMetadata(student)}>
                                                <Gamepad2 size={18} color="#4CAF50" />
                                                <Text style={styles.metadataBtnText}>View Game Metadata</Text>
                                                <Sparkles size={12} color="#4CAF50" />
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => viewStudentScores(student.id, student.username)}>
                                                <TrendingUp size={16} color="#6C5CE7" />
                                                <Text style={styles.viewDetailsBtnText}>View Details</Text>
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

                                <Text style={styles.inputLabel}>School Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={user?.school || ''}
                                    editable={false}
                                    placeholder="Your school will be assigned automatically"
                                />

                                <Text style={styles.inputLabel}>Default password for new students is 'defaultPassword123'</Text>
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

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelDelete}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>Delete Student</Text>
                        <Text style={styles.confirmMessage}>Are you sure you want to delete this student? This action cannot be undone.</Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={handleCancelDelete}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.deleteButton]}
                                onPress={handleConfirmDelete}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Game Score Modal */}
            <Modal animationType="slide" transparent={true} visible={showGameScoreModal} onRequestClose={() => setShowGameScoreModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isLandscape && styles.modalContentLandscape]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedStudentForScores?.name}'s Game Scores
                            </Text>
                            <TouchableOpacity onPress={() => setShowGameScoreModal(false)}>
                                <XCircle size={24} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {loadingScores ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Loading scores...</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.scoresContainer}>
                                {/* Student Profile Section */}
                                {studentProfile && (
                                    <View style={styles.profileSection}>
                                        <Text style={styles.sectionTitle}>Student Profile</Text>
                                        <View style={styles.profileCard}>
                                            <View style={styles.profileInfo}>
                                                <Text style={styles.profileName}>{studentProfile.name}</Text>
                                                <Text style={styles.profileEmail}>{studentProfile.email}</Text>
                                                {studentProfile.type && (
                                                    <Text style={styles.profileType}>Role: {studentProfile.type}</Text>
                                                )}
                                            </View>
                                            <View style={styles.profileStats}>
                                                <View style={styles.profileStat}>
                                                    <Text style={styles.profileStatValue}>{studentGameScores.length}</Text>
                                                    <Text style={styles.profileStatLabel}>Total Scores</Text>
                                                </View>
                                                <View style={styles.profileStat}>
                                                    <Text style={styles.profileStatValue}>{studentBestScores.length}</Text>
                                                    <Text style={styles.profileStatLabel}>Best Scores</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                
                                {/* Best Scores Section */}
                                <View style={styles.scoreSection}>
                                    <Text style={styles.sectionTitle}>Best Scores</Text>
                                    {!Array.isArray(studentBestScores) || studentBestScores.length === 0 ? (
                                        <Text style={styles.noDataText}>No best scores available</Text>
                                    ) : (
                                        studentBestScores.map((score, index) => (
                                            <View key={index} style={styles.scoreItem}>
                                                <View style={styles.scoreInfo}>
                                                    <Text style={styles.gameName}>{score.name}</Text>
                                                    <Text style={styles.scoreValue}>{score.scores}</Text>
                                                </View>
                                                <Text style={styles.scoreDate}>F
                                                    {new Date(score.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        ))
                                    )}
                                </View>

                                {/* Recent Scores Section */}
                                <View style={styles.scoreSection}>
                                    <Text style={styles.sectionTitle}>Recent Scores</Text>
                                    {!Array.isArray(studentGameScores) || studentGameScores.length === 0 ? (
                                        <Text style={styles.noDataText}>No recent scores available</Text>
                                    ) : (
                                        studentGameScores.map((score, index) => (
                                            <View key={index} style={styles.scoreItem}>
                                                <View style={styles.scoreInfo}>
                                                    <Text style={styles.gameName}>{score.name}</Text>
                                                    <Text style={styles.scoreValue}>{score.scores}</Text>
                                                    {score.type && (
                                                        <Text style={styles.scoreType}>Type: {score.type}</Text>
                                                    )}
                                                </View>
                                                <Text style={styles.scoreDate}>
                                                    {new Date(score.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        ))
                                    )}
                                </View>
                                
                                {/* Game Records Section - Profile Style */}
                                <View style={styles.gameRecordsSection}>
                                    <Text style={styles.sectionTitle}>Game Records</Text>
                                    {!Array.isArray(studentGameScores) || studentGameScores.length === 0 ? (
                                        <View style={styles.emptyGameRecords}>
                                            <Gamepad2 size={48} color="#DFE6E9" />
                                            <Text style={styles.emptyGameRecordsText}>No game records found</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.gameRecordsList}>
                                            {studentGameScores.map((score, index) => {
                                                const themeColor = getGameThemeColor(score.type);
                                                return (
                                                    <View key={index} style={styles.activityCard}>
                                                        <View style={[styles.gameIconBg, { backgroundColor: `${themeColor}20` }]}>
                                                            {renderGameIcon(score.type, themeColor)}
                                                        </View>
                                                        <View style={styles.recordInfo}>
                                                            <Text style={styles.recordName}>{score.name}</Text>
                                                            <View style={styles.recordMeta}>
                                                                {score.type && (
                                                                    <Text style={styles.recordType}>{score.type}</Text>
                                                                )}
                                                                <Text style={styles.recordDate}>
                                                                    {new Date(score.createdAt).toLocaleDateString()}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.recordScores}>
                                                            <Text style={styles.recordScore}>{score.scores}</Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Class Filter Selection Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showClassFilterModal}
                onRequestClose={() => setShowClassFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.classFilterModal}>
                        <View style={styles.classFilterHeader}>
                            <Text style={styles.classFilterTitle}>Select Class</Text>
                            <TouchableOpacity onPress={() => setShowClassFilterModal(false)}>
                                <X size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.classFilterList}>
                            <TouchableOpacity
                                style={[
                                    styles.classFilterOption,
                                    selectedClass === 'all' && styles.classFilterOptionSelected
                                ]}
                                onPress={() => {
                                    setSelectedClass('all');
                                    setShowClassFilterModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.classFilterOptionText,
                                    selectedClass === 'all' && styles.classFilterOptionTextSelected
                                ]}>
                                    All Classes
                                </Text>
                                {selectedClass === 'all' && (
                                    <CheckCircle size={20} color="#6C5CE7" />
                                )}
                            </TouchableOpacity>
                            
                            {classes.map((classItem) => (
                                <TouchableOpacity
                                    key={classItem.id}
                                    style={[
                                        styles.classFilterOption,
                                        selectedClass === `${classItem.grade} ${classItem.suffix}` && styles.classFilterOptionSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedClass(`${classItem.grade} ${classItem.suffix}`);
                                        setShowClassFilterModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.classFilterOptionText,
                                        selectedClass === `${classItem.grade} ${classItem.suffix}` && styles.classFilterOptionTextSelected
                                    ]}>
                                        {classItem.grade} {classItem.suffix}
                                    </Text>
                                    {selectedClass === `${classItem.grade} ${classItem.suffix}` && (
                                        <CheckCircle size={20} color="#6C5CE7" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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
    studentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    studentsGridTablet: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    studentCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, width: '48%', minWidth: 280, maxWidth: 320, },
    studentCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    studentAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
    studentEmail: { fontSize: 12, color: '#999', marginTop: 2 },
    classBadgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    classBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#BBDEFB' },
    classBadgeText: { fontSize: 10, fontWeight: '600', color: '#2196F3' },
    noClassText: { fontSize: 10, color: '#999', fontStyle: 'italic', marginTop: 2 },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionIcon: { padding: 6 },
    progressSection: { marginVertical: 12, flex: 1 },
    subjectProgress: { gap: 8 },
    subjectItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    subjectLabel: { fontSize: 12, fontWeight: '600', color: '#666', width: 50 },
    progressBar: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressPercent: { fontSize: 11, fontWeight: '600', color: '#666', width: 35, textAlign: 'right' },
    performanceRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16, flexWrap: 'wrap' },
    performanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8F9FA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    performanceScore: { fontSize: 14, fontWeight: '700' },
    performanceText: { fontSize: 12, color: '#666' },
    aiAnalysisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0E6FF', paddingVertical: 10, borderRadius: 12, marginTop: 8 },
    aiAnalysisBtnText: { color: '#6C5CE7', fontWeight: '600', fontSize: 14 },
    viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingVertical: 8 },
    viewDetailsBtnText: { color: '#6C5CE7', fontSize: 13, fontWeight: '600' },
    scoresContainer: { flex: 1, padding: 20 },
    scoreSection: { marginBottom: 24 },
    scoreItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    scoreInfo: { flex: 1 },
    gameName: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
    scoreValue: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', marginTop: 4 },
    scoreDate: { fontSize: 12, color: '#666' },
    scoreType: { fontSize: 12, color: '#2196F3', marginTop: 2 },
    noDataText: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic', padding: 20 },
    // Student profile styles
    profileSection: { marginBottom: 24 },
    profileCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    profileInfo: { marginBottom: 16 },
    profileName: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 },
    profileEmail: { fontSize: 14, color: '#666', marginBottom: 4 },
    profileType: { fontSize: 12, color: '#007AFF', fontWeight: '500' },
    profileStats: { flexDirection: 'row', justifyContent: 'space-around' },
    profileStat: { alignItems: 'center' },
    profileStatValue: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
    profileStatLabel: { fontSize: 12, color: '#666', marginTop: 2 },
    // Game records styles
    gameRecordsSection: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 10, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 5, elevation: 2 },
    gameRecordsList: { },
    emptyGameRecords: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
    emptyGameRecordsText: { fontSize: 18, fontWeight: '700', color: '#636E72', marginTop: 15 },
    activityCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F2F6' },
    gameIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    recordInfo: { flex: 1 },
    recordName: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
    recordMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    recordDate: { fontSize: 12, color: '#636E72', marginLeft: 8 },
    recordType: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginLeft: 8 },
    recordScores: { alignItems: 'flex-end' },
    recordScore: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
    recordPoints: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
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
    deleteButton: {
        backgroundColor: '#FF4757',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    // Class Filter Modal Styles
    classFilterModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '80%',
        maxWidth: 300,
        maxHeight: '60%',
    },
    classFilterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    classFilterTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    classFilterList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    classFilterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F9FA',
    },
    classFilterOptionSelected: {
        backgroundColor: '#F0E6FF',
    },
    classFilterOptionText: {
        fontSize: 16,
        color: '#2D3436',
        fontWeight: '500',
    },
    classFilterOptionTextSelected: {
        color: '#6C5CE7',
        fontWeight: '600',
    },
});