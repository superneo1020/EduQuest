import React, { useState, useEffect } from 'react';
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
    AlertCircle,
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
    Zap,
    LineChart,
    PieChart,
    Activity,
    RefreshCw,
    ArrowLeft,
} from 'lucide-react-native';

// 定義學生數據類型
interface Student {
    id: string;
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
    aiAnalysis?: string;
}

// 模擬數據
const mockStudents: Student[] = [
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
    },
    {
        id: '3',
        username: 'Marcus Li',
        email: 'marcus.li@example.com',
        points: 1890,
        level: 6,
        joinDate: '2024-02-10',
        lastActive: '2024-03-27',
        gameProgress: { math: 65, english: 70, science: 60, chinese: 55 },
        performance: { averageScore: 62.5, totalTimeSpent: 32, completedQuests: 18, accuracy: 68 },
    },
    {
        id: '4',
        username: 'Sophia Zhang',
        email: 'sophia.zhang@example.com',
        points: 4210,
        level: 14,
        joinDate: '2023-10-05',
        lastActive: '2024-03-29',
        gameProgress: { math: 95, english: 93, science: 96, chinese: 89 },
        performance: { averageScore: 93.2, totalTimeSpent: 82, completedQuests: 67, accuracy: 95 },
    },
    {
        id: '5',
        username: 'Oliver Liu',
        email: 'oliver.liu@example.com',
        points: 3100,
        level: 10,
        joinDate: '2024-01-28',
        lastActive: '2024-03-28',
        gameProgress: { math: 78, english: 82, science: 75, chinese: 80 },
        performance: { averageScore: 78.8, totalTimeSpent: 55, completedQuests: 41, accuracy: 85 },
    },
];

export default function TeacherDashboard() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { user } = useAuth();
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

    const isLandscape = width > 800;
    const isTablet = width > 600;

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = () => {
        setTimeout(() => {
            setStudents(mockStudents);
            setFilteredStudents(mockStudents);
            setLoading(false);
        }, 1000);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStudents();
        setRefreshing(false);
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

        // 模擬 AI 分析 API 調用
        await new Promise(resolve => setTimeout(resolve, 2000));

        const strengths = [];
        const weaknesses = [];
        const recommendations = [];

        // 分析各科表現
        if (student.gameProgress.math >= 80) strengths.push('Mathematics');
        else if (student.gameProgress.math < 60) weaknesses.push('Mathematics');

        if (student.gameProgress.english >= 80) strengths.push('English');
        else if (student.gameProgress.english < 60) weaknesses.push('English');

        if (student.gameProgress.science >= 80) strengths.push('Science');
        else if (student.gameProgress.science < 60) weaknesses.push('Science');

        if (student.gameProgress.chinese >= 80) strengths.push('Chinese');
        else if (student.gameProgress.chinese < 60) weaknesses.push('Chinese');

        // 生成建議
        if (student.performance.accuracy < 75) {
            recommendations.push('Focus on foundational concepts and practice more basic exercises');
        }
        if (student.performance.completedQuests < 30) {
            recommendations.push('Encourage daily quest completion to build consistent learning habits');
        }
        if (student.gameProgress.math < 70) {
            recommendations.push('Additional support in Mathematics: focus on problem-solving strategies');
        }
        if (student.gameProgress.english < 70) {
            recommendations.push('English improvement: increase vocabulary practice and reading comprehension');
        }
        if (student.gameProgress.science < 70) {
            recommendations.push('Science: hands-on experiments and visual learning materials recommended');
        }
        if (student.gameProgress.chinese < 70) {
            recommendations.push('Chinese: practice character writing and daily conversation exercises');
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
With current trajectory, ${student.username} is expected to improve by 15-20% in the next month if consistent practice continues.

**Suggested Interventions:**
${student.performance.averageScore < 70 ? '🔴 Immediate intervention recommended - schedule parent-teacher meeting' : '🟢 On track - continue current learning path'}
        `;

        setAiAnalysis(analysis);
        setAnalysisLoading(false);
        setAnalysisModalVisible(true);
    };

    const deleteStudent = (studentId: string) => {
        Alert.alert(
            'Delete Student',
            'Are you sure you want to remove this student? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setStudents(students.filter(s => s.id !== studentId));
                        Alert.alert('Success', 'Student removed successfully');
                    }
                }
            ]
        );
    };

    const updateStudent = (updatedStudent: Student) => {
        setStudents(students.map(s =>
            s.id === updatedStudent.id ? updatedStudent : s
        ));
        Alert.alert('Success', 'Student information updated');
        setEditModalVisible(false);
        setEditingStudent(null);
    };

    const addStudent = () => {
        if (!newStudent.username || !newStudent.email) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const student: Student = {
            id: Date.now().toString(),
            username: newStudent.username || '',
            email: newStudent.email || '',
            points: newStudent.points || 0,
            level: newStudent.level || 1,
            joinDate: new Date().toISOString().split('T')[0],
            lastActive: new Date().toISOString().split('T')[0],
            gameProgress: { math: 0, english: 0, science: 0, chinese: 0 },
            performance: { averageScore: 0, totalTimeSpent: 0, completedQuests: 0, accuracy: 0 },
        };

        setStudents([student, ...students]);
        setShowAddModal(false);
        setNewStudent({});
        Alert.alert('Success', 'Student added successfully');
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
    const avgScore = students.reduce((sum, s) => sum + s.performance.averageScore, 0) / totalStudents;
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const highPerformers = students.filter(s => s.performance.averageScore >= 85).length;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Welcome back, {user?.username || 'Teacher'}</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <RefreshCw size={22} color="#6C5CE7" />
                    </TouchableOpacity>
                </View>

                {/* 整體統計卡片 */}
                <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
                    <StatCard title="Total Students" value={totalStudents} icon={Users} color="#6C5CE7" />
                    <StatCard title="Avg Score" value={`${avgScore.toFixed(1)}%`} icon={TrendingUp} color="#4CAF50" />
                    <StatCard title="Total XP" value={totalPoints.toLocaleString()} icon={Award} color="#FF9800" />
                    <StatCard title="High Performers" value={highPerformers} icon={Star} color="#FF4757" />
                </View>

                {/* 快速操作欄 */}
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
                            onPress={() => setSelectedSubject('all')}
                        >
                            <Filter size={18} color={selectedSubject !== 'all' ? '#6C5CE7' : '#666'} />
                            <Text style={[styles.filterBtnText, selectedSubject !== 'all' && styles.filterBtnTextActive]}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setShowAddModal(true)}
                        >
                            <UserPlus size={18} color="white" />
                            <Text style={styles.addBtnText}>Add Student</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 學生列表 */}
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
                                            <Text style={styles.avatarText}>
                                                {student.username.charAt(0)}
                                            </Text>
                                        </View>
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{student.username}</Text>
                                            <Text style={styles.studentEmail}>{student.email}</Text>
                                        </View>
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditingStudent(student);
                                                    setEditModalVisible(true);
                                                }}
                                                style={styles.actionIcon}
                                            >
                                                <Edit size={18} color="#6C5CE7" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => deleteStudent(student.id)}
                                                style={styles.actionIcon}
                                            >
                                                <Trash2 size={18} color="#FF4757" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.progressSection}>
                                        <View style={styles.subjectProgress}>
                                            <View style={styles.subjectItem}>
                                                <Calculator size={14} color="#4CAF50" />
                                                <Text style={styles.subjectLabel}>Math</Text>
                                                <View style={styles.progressBar}>
                                                    <View style={[styles.progressFill, { width: `${student.gameProgress.math}%`, backgroundColor: '#4CAF50' }]} />
                                                </View>
                                                <Text style={styles.progressPercent}>{student.gameProgress.math}%</Text>
                                            </View>
                                            <View style={styles.subjectItem}>
                                                <Languages size={14} color="#2196F3" />
                                                <Text style={styles.subjectLabel}>English</Text>
                                                <View style={styles.progressBar}>
                                                    <View style={[styles.progressFill, { width: `${student.gameProgress.english}%`, backgroundColor: '#2196F3' }]} />
                                                </View>
                                                <Text style={styles.progressPercent}>{student.gameProgress.english}%</Text>
                                            </View>
                                            <View style={styles.subjectItem}>
                                                <Atom size={14} color="#FF9800" />
                                                <Text style={styles.subjectLabel}>Science</Text>
                                                <View style={styles.progressBar}>
                                                    <View style={[styles.progressFill, { width: `${student.gameProgress.science}%`, backgroundColor: '#FF9800' }]} />
                                                </View>
                                                <Text style={styles.progressPercent}>{student.gameProgress.science}%</Text>
                                            </View>
                                            <View style={styles.subjectItem}>
                                                <Brain size={14} color="#9C27B0" />
                                                <Text style={styles.subjectLabel}>Chinese</Text>
                                                <View style={styles.progressBar}>
                                                    <View style={[styles.progressFill, { width: `${student.gameProgress.chinese}%`, backgroundColor: '#9C27B0' }]} />
                                                </View>
                                                <Text style={styles.progressPercent}>{student.gameProgress.chinese}%</Text>
                                            </View>
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

                                    <TouchableOpacity
                                        style={styles.aiAnalysisBtn}
                                        onPress={() => generateAIAnalysis(student)}
                                    >
                                        <Brain size={18} color="#6C5CE7" />
                                        <Text style={styles.aiAnalysisBtnText}>AI Performance Analysis</Text>
                                        <Sparkles size={14} color="#6C5CE7" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.viewDetailsBtn}
                                        onPress={() => {
                                            setSelectedStudent(student);
                                            setModalVisible(true);
                                        }}
                                    >
                                        <Text style={styles.viewDetailsText}>View Full Report</Text>
                                        <ChevronRight size={16} color="#6C5CE7" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* 學生詳細報告 Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
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
                                            <Text style={styles.infoLabel}>Join Date:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.joinDate}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Last Active:</Text>
                                            <Text style={styles.infoValue}>{selectedStudent.lastActive}</Text>
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

                                    <View style={styles.reportSection}>
                                        <Text style={styles.reportSectionTitle}>Subject Progress</Text>
                                        {Object.entries(selectedStudent.gameProgress).map(([subject, progress]) => (
                                            <View key={subject} style={styles.reportProgressItem}>
                                                <Text style={styles.reportSubjectLabel}>
                                                    {subject.charAt(0).toUpperCase() + subject.slice(1)}
                                                </Text>
                                                <View style={styles.reportProgressBar}>
                                                    <View style={[styles.reportProgressFill, { width: `${progress}%` }]} />
                                                </View>
                                                <Text style={styles.reportProgressValue}>{progress}%</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.fullAnalysisBtn}
                                        onPress={() => {
                                            setModalVisible(false);
                                            generateAIAnalysis(selectedStudent);
                                        }}
                                    >
                                        <Brain size={20} color="white" />
                                        <Text style={styles.fullAnalysisBtnText}>Generate AI Analysis Report</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* AI 分析 Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={analysisModalVisible}
                onRequestClose={() => setAnalysisModalVisible(false)}
            >
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
                                <Text style={styles.aiLoadingSubtext}>This may take a moment</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.aiAnalysisContent}>
                                <Text style={styles.aiAnalysisText}>{aiAnalysis}</Text>
                            </ScrollView>
                        )}

                        {!analysisLoading && (
                            <TouchableOpacity
                                style={styles.downloadReportBtn}
                                onPress={() => {
                                    Alert.alert('Download', 'Report download started');
                                    setAnalysisModalVisible(false);
                                }}
                            >
                                <Download size={18} color="white" />
                                <Text style={styles.downloadReportText}>Download Report</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* 編輯學生 Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Student</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <XCircle size={24} color="#999" />
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
                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={() => updateStudent(editingStudent)}
                                >
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* 新增學生 Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showAddModal}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Student</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <XCircle size={24} color="#999" />
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
                                    placeholder="0"
                                />
                                <Text style={styles.inputLabel}>Initial Level</Text>
                                <TextInput
                                    style={styles.input}
                                    value={String(newStudent.level || 1)}
                                    onChangeText={(text) => setNewStudent({ ...newStudent, level: parseInt(text) || 1 })}
                                    keyboardType="numeric"
                                    placeholder="1"
                                />
                            </View>
                            <TouchableOpacity style={styles.saveBtn} onPress={addStudent}>
                                <Text style={styles.saveBtnText}>Add Student</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
    headerTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    refreshBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0E6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statsGridTablet: {
        flexDirection: 'row',
    },
    statCard: {
        flex: 1,
        minWidth: 120,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 8,
    },
    statTitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    actionBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#2D3436',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterBtnActive: {
        backgroundColor: '#F0E6FF',
        borderColor: '#6C5CE7',
    },
    filterBtnText: {
        fontSize: 14,
        color: '#666',
    },
    filterBtnTextActive: {
        color: '#6C5CE7',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#6C5CE7',
        borderRadius: 12,
        gap: 6,
    },
    addBtnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    studentsSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2D3436',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        marginBottom: 20,
    },
    studentsGrid: {
        gap: 16,
    },
    studentsGridTablet: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    studentCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    studentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    studentEmail: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionIcon: {
        padding: 6,
    },
    progressSection: {
        marginVertical: 12,
    },
    subjectProgress: {
        gap: 8,
    },
    subjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subjectLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        width: 50,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressPercent: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        width: 35,
        textAlign: 'right',
    },
    performanceRow: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 12,
    },
    performanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    performanceScore: {
        fontSize: 14,
        fontWeight: '700',
    },
    performanceText: {
        fontSize: 12,
        color: '#666',
    },
    aiAnalysisBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0E6FF',
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
    },
    aiAnalysisBtnText: {
        color: '#6C5CE7',
        fontWeight: '600',
        fontSize: 14,
    },
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 12,
        paddingVertical: 8,
    },
    viewDetailsText: {
        color: '#6C5CE7',
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyStateText: {
        marginTop: 12,
        fontSize: 16,
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    modalContentLandscape: {
        width: '70%',
        maxHeight: '90%',
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
    reportSection: {
        marginBottom: 20,
    },
    reportSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    infoLabel: {
        width: 100,
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        color: '#2D3436',
        fontWeight: '500',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metricCard: {
        flex: 1,
        minWidth: 80,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#6C5CE7',
    },
    metricLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
    },
    reportProgressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    reportSubjectLabel: {
        width: 70,
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    reportProgressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    reportProgressFill: {
        height: '100%',
        backgroundColor: '#6C5CE7',
        borderRadius: 4,
    },
    reportProgressValue: {
        width: 40,
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textAlign: 'right',
    },
    fullAnalysisBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6C5CE7',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 20,
    },
    fullAnalysisBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    aiModalContent: {
        maxHeight: '85%',
    },
    aiModalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiLoadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    aiLoadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    aiLoadingSubtext: {
        marginTop: 8,
        fontSize: 13,
        color: '#999',
    },
    aiAnalysisContent: {
        maxHeight: 500,
        marginVertical: 16,
    },
    aiAnalysisText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#2D3436',
    },
    downloadReportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    downloadReportText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    editForm: {
        gap: 12,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
    },
    saveBtn: {
        backgroundColor: '#6C5CE7',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});