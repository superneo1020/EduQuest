import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, BookOpen, Users2, TrendingUp, Target, UserPlus, X, Edit2, Trash2, Gamepad2 } from 'lucide-react-native';
import educatorService, {Course, CourseRequest, UserMini, CourseMemberRequest, CourseMember, GameScore, BestGameScore, StudentProfile} from './educatorService';
import { getApiBaseUrl } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';
import { ApiListHandler, DetailedListResponse } from './ApiListHandler';

interface ClassManagementPanelProps {
    onBack?: () => void;
}

export const ClassManagementPanel: React.FC<ClassManagementPanelProps> = ({ onBack }) => {
    const { signOut } = useAuth();
    const [classesResponse, setClassesResponse] = useState<DetailedListResponse<Course> | null>(null);
    const [schoolMembers, setSchoolMembers] = useState<UserMini[]>([]);
    const [classMembers, setClassMembers] = useState<CourseMember[]>([]);
    const [classMemberCounts, setClassMemberCounts] = useState<Map<number, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showClassMembersModal, setShowClassMembersModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Course | null>(null);
    const [newClassData, setNewClassData] = useState<CourseRequest>({ grade: '', suffix: '', academicYear: '' });
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [currentView, setCurrentView] = useState<'classes' | 'students'>('classes');
    // 確認刪除 Modal 狀態
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [pendingDeleteName, setPendingDeleteName] = useState('');
    const [deleteType, setDeleteType] = useState<'class' | 'student'>('class');
    const [pendingStudentId, setPendingStudentId] = useState<number | null>(null);
    const [pendingStudentName, setPendingStudentName] = useState('');
    // Game score modal state
    const [showGameScoreModal, setShowGameScoreModal] = useState(false);
    const [selectedStudentForScores, setSelectedStudentForScores] = useState<{id: number, name: string} | null>(null);
    const [studentGameScores, setStudentGameScores] = useState<GameScore[]>([]);
    const [studentBestScores, setStudentBestScores] = useState<BestGameScore[]>([]);
    const [loadingScores, setLoadingScores] = useState(false);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    // Role management state
    const [showRoleManagementModal, setShowRoleManagementModal] = useState(false);
    const [selectedMemberForRole, setSelectedMemberForRole] = useState<CourseMember | null>(null);
    // Member game data state
    const [memberGameData, setMemberGameData] = useState<Record<number, GameScore[]>>({});
    const [loadingMemberData, setLoadingMemberData] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // ClassManagementPanel.tsx - 確保 loadData 正確刷新列表
    const loadData = async () => {
        try {
            setLoading(true);

            // Load classes using updated educatorService
            try {
                const classesData = await educatorService.getClasses();
                setClassesResponse(classesData);
                console.log('Classes loaded:', classesData.items.length);
                
                // Load member counts for each class
                if (classesData?.items) {
                    const counts = new Map<number, number>();
                    await Promise.all(
                        classesData.items.map(async (course) => {
                            try {
                                const members = await educatorService.getClassMembersSafe(course.id);
                                counts.set(course.id, members.length);
                            } catch (error) {
                                console.error(`Error loading members for class ${course.id}:`, error);
                                counts.set(course.id, 0);
                            }
                        })
                    );
                    setClassMemberCounts(counts);
                }
            } catch (classError) {
                console.error('Error loading classes:', classError);
                setClassesResponse(null);
                Alert.alert('Error', 'Failed to load classes. Please check your connection.');
            }

            // Load school members (unchanged)
            try {
                const membersData = await educatorService.getSchoolMembers();
                setSchoolMembers(membersData);
                console.log('School members loaded:', membersData.length);
            } catch (memberError) {
                console.error('Error loading school members (optional):', memberError);
                setSchoolMembers([]);
            }

        } catch (error: any) {
            console.error('Error in loadData:', error);

            if (error.message?.includes('expired') || error.message?.includes('authentication')) {
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [
                        {
                            text: 'OK',
                            onPress: async () => {
                                await signOut();
                                if (onBack) onBack();
                            }
                        }
                    ]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const createClass = async () => {
        if (!newClassData.grade || !newClassData.suffix || !newClassData.academicYear) {
            Alert.alert('Error', 'Please fill in all class details');
            return;
        }

        try {
            await educatorService.createClass(newClassData);
            Alert.alert('Success', 'Class created successfully');
            setShowCreateModal(false);
            setNewClassData({ grade: '', suffix: '', academicYear: '' });
            loadData();
        } catch (error) {
            console.error('Error creating class:', error);
            Alert.alert('Error', 'Failed to create class');
        }
    };

    // ClassManagementPanel.tsx - 在 deleteClass 函數最開頭添加日誌
    // ClassManagementPanel.tsx - 修改 deleteClass 函數中的 Alert
    const ensureUserAsTeacher = async (classId: number): Promise<boolean> => {
        try {
            console.log(`Ensuring user is teacher for class ${classId}`);
            await educatorService.ensureTeacherAsMember(classId);
            console.log('User added as teacher successfully');
            return true;
        } catch (error: any) {
            console.error('Error ensuring user as teacher:', error);
            Alert.alert(
                'Permission Issue',
                'Cannot manage this class. You need to be assigned as a teacher to this class first.\n\n' +
                'Please contact your administrator to be assigned as a teacher to this class.',
                [{ text: 'OK' }]
            );
            return false;
        }
    };

    const deleteClass = (classId: number) => {
        const classToDelete = classesResponse?.items.find(c => c.id === classId);
        if (!classToDelete) {
            console.log('Class not found');
            return;
        }

        setPendingDeleteId(classId);
        setPendingDeleteName(`${classToDelete.grade} ${classToDelete.suffix}`);
        setDeleteType('class');
        setShowConfirmModal(true);
    };

    // ClassManagementPanel.tsx - 添加 removeStudentFromClass 函數
    const confirmRemoveStudent = (userId: number, userName: string) => {
        setPendingStudentId(userId);
        setPendingStudentName(userName);
        setDeleteType('student');
        setShowConfirmModal(true);
    };

// 實際執行刪除的函數
    const executeDelete = async () => {
        setShowConfirmModal(false);

        if (deleteType === 'class' && pendingDeleteId) {
            try {
                console.log(`Deleting class ${pendingDeleteId}`);
                const result = await educatorService.deleteClass(pendingDeleteId);
                if (result && !result.warning) {
                    Alert.alert('Success', result.message || 'Class deleted successfully');
                    await loadData();
                } else {
                    Alert.alert('Error', result?.message || 'Failed to delete class');
                }
            } catch (error: any) {
                console.error('Error deleting class:', error);
                Alert.alert('Error', `Failed to delete class: ${error.message}`);
            } finally {
                setPendingDeleteId(null);
                setPendingDeleteName('');
            }
        } else if (deleteType === 'student' && pendingStudentId && selectedClass) {
            try {
                console.log(`Removing student ${pendingStudentId} from class ${selectedClass.id}`);
                const result = await educatorService.removeStudentFromClass(selectedClass.id, pendingStudentId);
                if (result && !result.warning) {
                    Alert.alert('Success', 'Student removed from class successfully');
                    
                    // Update member count for the class
                    const currentCount = classMemberCounts.get(selectedClass.id) || 0;
                    setClassMemberCounts(prev => new Map(prev).set(selectedClass.id, Math.max(0, currentCount - 1)));
                    
                    await loadClassMembers(selectedClass.id);
                    await loadData();
                } else {
                    Alert.alert('Error', result?.message || 'Failed to remove student');
                }
            } catch (error: any) {
                console.error('Error removing student:', error);
                Alert.alert('Error', `Failed to remove student: ${error.message}`);
            } finally {
                setPendingStudentId(null);
                setPendingStudentName('');
            }
        }

        setDeleteType('class');
    };
    const addStudentsToClass = async () => {
        if (selectedStudents.length === 0) {
            Alert.alert('Error', 'Please select at least one student');
            return;
        }

        // 直接嘗試添加學生，不再調用 ensureTeacherAsMember
        try {
            const promises = selectedStudents.map(studentId =>
                educatorService.addStudentToClass({
                    userId: studentId,
                    courseId: selectedClass!.id,
                    role: 'STUDENT'
                })
            );

            await Promise.all(promises);
            Alert.alert('Success', `${selectedStudents.length} students added to class`);
            setShowAddStudentModal(false);
            setSelectedStudents([]);

            // Update member count
            const currentCount = classMemberCounts.get(selectedClass!.id) || 0;
            setClassMemberCounts(prev => new Map(prev).set(selectedClass!.id, currentCount + selectedStudents.length));

            loadData();

        } catch (error: any) {
            console.error('Error adding students:', error);
            if (error.message?.includes('403') || error.message?.includes('Access Denied')) {
                Alert.alert(
                    'Permission Denied',
                    'You do not have permission to add students to this class.\n\n' +
                    'Possible reasons:\n' +
                    'You are not a teacher/assistant in this class\n' +
                    'Your educator account is not approved\n' +
                    'The student is not from the same school\n\n' +
                    'Please contact an administrator for assistance.'
                );
            } else if (error.message?.includes('409')) {
                Alert.alert('Already Added', 'Some students are already in this class.');
            } else {
                Alert.alert('Error', `Failed to add students: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const toggleStudentSelection = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Calculate subject scores similar to SkillRadarChart logic
    const calculateSubjectScores = (gameHistory: GameScore[]) => {
        console.log('Calculating subject scores from game history:', gameHistory);
        
        const subjects = [
            { key: 'MATH', label: 'Math', color: '#4CAF50' },
            { key: 'ENGLISH', label: 'English', color: '#2196F3' },
            { key: 'SCIENCE', label: 'Science', color: '#FF9800' },
            { key: 'CHINESE', label: 'Chinese', color: '#9C27B0' }
        ];

        const results = subjects.map(subject => {
            const scores = gameHistory
                .filter(g => g.type?.toUpperCase() === subject.key)
                .map(g => g.scores || 0);

            console.log(`Subject ${subject.key}: filtered scores =`, scores);

            let avg = 0;
            if (scores.length > 0) {
                // Base average score
                avg = scores.reduce((a, b) => a + b, 0) / scores.length;

                // Difficulty weighting: HARD +10%, MEDIUM +5%, EASY unchanged
                const difficultyBonus = gameHistory
                    .filter(g => g.type?.toUpperCase() === subject.key)
                    .reduce((bonus, g) => {
                        switch(g.difficulty?.toUpperCase()) {
                            case 'HARD': return bonus + 10;
                            case 'MEDIUM': return bonus + 5;
                            default: return bonus;
                        }
                    }, 0) / scores.length;

                avg = Math.min(avg + difficultyBonus, 100);
                console.log(`Subject ${subject.key}: avg=${avg}, bonus=${difficultyBonus}, final=${Math.round(avg)}`);
            }

            return {
                label: subject.label,
                percentage: Math.round(avg),
                color: subject.color
            };
        });

        console.log('Final calculated subject scores:', results);
        return results;
    };

    // Load game data for all class members
    const loadMemberGameData = async (members: CourseMember[]) => {
        try {
            setLoadingMemberData(true);
            console.log('Loading game data for members:', members.map(m => ({ id: m.userId, name: m.username, role: m.roleInClass })));
            
            const studentMembers = members.filter(member => member.roleInClass === 'STUDENT');
            console.log('Student members found:', studentMembers.map(m => ({ id: m.userId, name: m.username, role: m.roleInClass })));
            
            if (studentMembers.length === 0) {
                console.log('No student members found, skipping game data loading');
                setMemberGameData({});
                setLoadingMemberData(false);
                return;
            }
            
            const gameDataPromises = studentMembers
                .map(async (member) => {
                    try {
                        console.log(`Fetching game scores for student ${member.username} (ID: ${member.userId})`);
                        const scores = await educatorService.getStudentGameScores(member.userId);
                        console.log(`Game scores for ${member.username}:`, scores);
                        return { userId: member.userId, scores };
                    } catch (error) {
                        console.error(`Error loading game data for member ${member.userId}:`, error);
                        return { userId: member.userId, scores: [] };
                    }
                });

            const results = await Promise.all(gameDataPromises);
            const gameDataMap = results.reduce((acc, result) => {
                acc[result.userId] = result.scores;
                return acc;
            }, {} as Record<number, GameScore[]>);

            console.log('Final memberGameData map:', gameDataMap);
            setMemberGameData(gameDataMap);
        } catch (error) {
            console.error('Error loading member game data:', error);
        } finally {
            setLoadingMemberData(false);
        }
    };

    // ClassManagementPanel.tsx - 修改 loadClassMembers 函數
    const loadClassMembers = async (classId: number) => {
        try {
            const members = await educatorService.getClassMembersSafe(classId);
            console.log('Class members loaded:', members);
            setClassMembers(members);
            
            // Load game data for student members
            await loadMemberGameData(members);
        } catch (error) {
            console.error('Error loading class members:', error);
            setClassMembers([]);
        }
    };
// ClassManagementPanel.tsx - 確保 viewClassMembers 被正確調用
    const viewClassMembers = async (classItem: Course) => {
        try {
            console.log('Opening modal for class:', classItem.id);
            setSelectedClass(classItem);

            // 1. 先開啟 Modal，讓用戶感覺「有反應」
            setShowClassMembersModal(true);

            // 2. 加載數據
            await loadClassMembers(classItem.id);
        } catch (error: any) {
            console.error('View members failed:', error);
            // 如果失敗，關閉 Modal 並報錯
            setShowClassMembersModal(false);
            Alert.alert('Error', 'Could not load class members: ' + error.message);
        }
    };

    // Student game score viewing functions
    const viewStudentScores = async (studentId: number, studentName: string) => {
        try {
            setLoadingScores(true);
            setSelectedStudentForScores({ id: studentId, name: studentName });
            setShowGameScoreModal(true);

            console.log(`Loading scores for student ${studentId} (${studentName})`);

            // Load student profile, game scores and best scores
            const [profile, gameScores, bestScores] = await Promise.all([
                educatorService.getStudentProfile(studentId, selectedClass?.id || 0),
                educatorService.getStudentGameScores(studentId),
                educatorService.getStudentBestScores(studentId)
            ]);

            console.log('API Responses:');
            console.log('Profile:', profile);
            console.log('Game Scores:', gameScores);
            console.log('Best Scores:', bestScores);
            console.log('Game Scores type:', typeof gameScores);
            console.log('Game Scores isArray:', Array.isArray(gameScores));
            console.log('Game Scores length:', gameScores?.length);

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

    // Role management functions
    const openRoleManagement = (member: CourseMember) => {
        setSelectedMemberForRole(member);
        setShowRoleManagementModal(true);
    };

    const updateMemberRole = async (newRole: 'STUDENT' | 'TEACHER' | 'ASSISTANT') => {
        if (!selectedMemberForRole || !selectedClass) return;

        try {
            const result = await educatorService.updateCourseMemberRole(
                selectedClass.id,
                selectedMemberForRole.userId,
                newRole
            );

            if (result && !result.warning) {
                Alert.alert('Success', `Role updated successfully`);
                setShowRoleManagementModal(false);
                setSelectedMemberForRole(null);
                await loadClassMembers(selectedClass.id);
                await loadData();
            } else {
                Alert.alert('Error', result?.message || 'Failed to update role');
            }
        } catch (error: any) {
            console.error('Error updating role:', error);
            Alert.alert('Error', `Failed to update role: ${error.message}`);
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
            case 'CHINESE': return <Users2 {...props} />;
            default: return <Target {...props} />;
        }
    };

    
    // Render methods remain the same
    const renderClassCard = ({ item: classItem }: { item: Course }) => (
        <TouchableOpacity
            style={styles.classCard}
            // 確保外層點擊明確觸發查看成員
            onPress={() => {
                console.log('Outer card pressed for:', classItem.id);
                viewClassMembers(classItem);
            }}
            activeOpacity={0.7}
        >
            <View style={styles.classHeader}>
                <View pointerEvents="none"> {/* 讓標題部分不干擾點擊 */}
                    <Text style={styles.classTitle}>{classItem.grade} {classItem.suffix}</Text>
                    <Text style={styles.classYear}>{classItem.academicYear}</Text>
                </View>

                <View style={styles.classActions}>
                    {/* 內部按鈕必須明確使用 e.stopPropagation() */}
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            viewClassMembers(classItem);
                        }}
                    >
                        <Users2 size={16} color="#6C5CE7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={(e) => {
                            e.stopPropagation();  // 阻止事件冒泡到父級
                            console.log('Add student button pressed for class:', classItem.id);
                            setSelectedClass(classItem);
                            setShowAddStudentModal(true);
                        }}
                    >
                        <UserPlus size={16} color="#6C5CE7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={(e) => {
                            e.stopPropagation();  // 阻止事件冒泡到父級
                            console.log('Delete button pressed for class:', classItem.id);
                            deleteClass(classItem.id);
                        }}
                    >
                        <Trash2 size={16} color="#FF4757" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.classStats}>
                <View style={styles.statRow}>
                    <View style={styles.statItem}>
                        <Users2 size={16} color="#6C5CE7" />
                        <Text style={styles.statText}>{classMemberCounts.get(classItem.id) || 0} Members</Text>
                    </View>
                    <View style={styles.statItem}>
                        <BookOpen size={16} color="#4CAF50" />
                        <Text style={styles.statText}>{classItem.grade} {classItem.suffix}</Text>
                    </View>
                </View>
                
                <View style={styles.statRow}>
                    <View style={styles.statItem}>
                        <Target size={16} color="#FF9800" />
                        <Text style={styles.statText}>{classItem.academicYear}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <TrendingUp size={16} color="#2196F3" />
                        <Text style={styles.statText}>ID: {classItem.id}</Text>
                    </View>
                </View>
                
                <View style={styles.creationDate}>
                    <Text style={styles.creationDateText}>
                        Created {new Date(classItem.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    
    // Render function for student selection (used in Add Students modal)
    const renderStudentSelectionItem = ({ item }: { item: UserMini }) => {
        const isAlreadyInClass = selectedClass && classMembers.some(member => member.userId === item.id);
        
        // Safety checks for undefined properties - prioritize username over name
        const displayName = item.username || item.name || `User ${item.id}`;
        const displayEmail = item.email || 'No email provided';
        
        return (
            <TouchableOpacity
                style={[
                    styles.studentItem,
                    selectedStudents.includes(item.id) && styles.studentItemSelected,
                    isAlreadyInClass && styles.studentItemDisabled
                ]}
                onPress={() => !isAlreadyInClass && toggleStudentSelection(item.id)}
                disabled={isAlreadyInClass}
            >
                <View style={styles.studentInfo}>
                    <Text style={[
                        styles.studentName,
                        isAlreadyInClass && styles.studentNameDisabled
                    ]}>
                        {displayName}
                    </Text>
                    <Text style={[
                        styles.studentEmail,
                        isAlreadyInClass && styles.studentEmailDisabled
                    ]}>
                        {displayEmail}
                    </Text>
                    {isAlreadyInClass && (
                        <Text style={styles.alreadyInClassText}>Already in class</Text>
                    )}
                </View>
                <View style={styles.studentCheckbox}>
                    {!isAlreadyInClass && selectedStudents.includes(item.id) && (
                        <View style={styles.checkboxChecked} />
                    )}
                    {isAlreadyInClass && (
                        <Text style={styles.checkmarkDisabled}>×</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Render function for student list view (used in Students tab)
    const renderStudentListItem = ({ item }: { item: UserMini }) => {
        // Check which classes this student belongs to
        const studentClasses = classesResponse?.items.filter(classItem => 
            classMembers.some(member => member.userId === item.id && member.courseId === classItem.id)
        ) || [];

        // Safety checks for undefined properties - prioritize username over name
        const displayName = item.username || item.name || `User ${item.id}`;
        const displayEmail = item.email || 'No email provided';
        const primaryName = item.username || item.name;
        const avatarText = primaryName ? primaryName.charAt(0).toUpperCase() : '?';

        return (
            <View style={styles.studentListItem}>
                <View style={styles.studentListItemHeader}>
                    <View style={styles.studentListItemAvatar}>
                        <Text style={styles.studentListItemAvatarText}>
                            {avatarText}
                        </Text>
                    </View>
                    <View style={styles.studentListInfo}>
                        <Text style={styles.studentListItemName}>{displayName}</Text>
                        <Text style={styles.studentListItemEmail}>{displayEmail}</Text>
                        <View style={styles.classBadgesContainer}>
                            {studentClasses.length > 0 ? (
                                studentClasses.map(classItem => (
                                    <View key={classItem.id} style={styles.classBadge}>
                                        <Text style={styles.classBadgeText}>
                                            {classItem.grade} {classItem.suffix}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noClassesText}>Not enrolled in any class</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.studentListItemActions}>
                        <TouchableOpacity style={styles.viewStudentBtn}>
                            <Text style={styles.viewStudentBtnText}>View Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (loading && !classesResponse) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C5CE7" />
                <Text style={styles.loadingText}>Loading classes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <X size={24} color="#2D3436" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Class Management</Text>
                <TouchableOpacity
                    style={styles.createClassBtn}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Plus size={18} color="white" />
                </TouchableOpacity>
            </View>

            {/* View Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, currentView === 'classes' && styles.tabActive]}
                    onPress={() => setCurrentView('classes')}
                >
                    <BookOpen size={20} color={currentView === 'classes' ? '#6C5CE7' : '#666'} />
                    <Text style={[styles.tabText, currentView === 'classes' && styles.tabTextActive]}>
                        Classes ({classesResponse?.items.length || 0})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, currentView === 'students' && styles.tabActive]}
                    onPress={() => setCurrentView('students')}
                >
                    <Users2 size={20} color={currentView === 'students' ? '#6C5CE7' : '#666'} />
                    <Text style={[styles.tabText, currentView === 'students' && styles.tabTextActive]}>
                        Students ({schoolMembers.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {currentView === 'classes' && (
                <FlatList
                    data={classesResponse?.items || []}
                    renderItem={renderClassCard}
                    keyExtractor={(item) => item.id.toString()}
                    refreshing={loading}
                    onRefresh={loadData}
                    ListHeaderComponent={
                        classesResponse && (
                            <Text style={{ fontWeight: 'bold', padding: 10 }}>
                                Showing {classesResponse.items.length} of {classesResponse.total}
                            </Text>
                        )
                    }
                />
            )}

            {currentView === 'students' && (
                <View style={styles.content}>
                    <View style={styles.studentsHeader}>
                        <Text style={styles.studentsHeaderTitle}>All Students</Text>
                        <Text style={styles.studentsHeaderSubtitle}>
                            Total: {schoolMembers.length} students
                        </Text>
                    </View>
                    <FlatList
                        data={schoolMembers}
                        renderItem={renderStudentListItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.studentListContainer}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            )}

            {/* Modals remain the same... */}
            {/* Create Class Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create New Class</Text>
                        <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Grade</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g., 1A, 2B, 3C"
                                value={newClassData.grade}
                                onChangeText={(text) => setNewClassData(prev => ({ ...prev, grade: text }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Suffix</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g., A, B, C"
                                value={newClassData.suffix}
                                onChangeText={(text) => setNewClassData(prev => ({ ...prev, suffix: text }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Academic Year</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g., 2024-2025"
                                value={newClassData.academicYear}
                                onChangeText={(text) => setNewClassData(prev => ({ ...prev, academicYear: text }))}
                            />
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={createClass}>
                            <Text style={styles.submitBtnText}>Create Class</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Students Modal */}
            <Modal
                visible={showAddStudentModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddStudentModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Add Students to {selectedClass?.grade} {selectedClass?.suffix}
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddStudentModal(false)}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <Text style={styles.selectionInfo}>
                            {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                        </Text>

                        <FlatList
                            data={schoolMembers}
                            renderItem={renderStudentSelectionItem}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.modalStudentList}
                        />

                        <TouchableOpacity style={styles.submitBtn} onPress={addStudentsToClass}>
                            <Text style={styles.submitBtnText}>
                                Add {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Class Members Modal - 保留這個有刪除按鈕的版本 */}
            <Modal
                visible={showClassMembersModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowClassMembersModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedClass?.grade} {selectedClass?.suffix} - Class Members
                        </Text>
                        <TouchableOpacity onPress={() => setShowClassMembersModal(false)}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <Text style={styles.selectionInfo}>
                            {classMembers.length} member{classMembers.length !== 1 ? 's' : ''}
                        </Text>

                        {classMembers.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text>No members found</Text>
                            </View>
                        ) : (
                            // 在 ClassMembers Modal 的 FlatList renderItem 中
                            <FlatList
                                data={classMembers}
                                renderItem={({ item }) => {
                                    const isStudent = item.roleInClass === 'STUDENT';
                                    return (
                                        <View style={styles.memberCard}>
                                            {/* 頭部和基本信息 */}
                                            <View style={styles.memberCardHeader}>
                                                <View style={styles.memberAvatar}>
                                                    <Text style={styles.memberAvatarText}>
                                                        {item.username.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={styles.memberInfo}>
                                                    <Text style={styles.memberName}>{item.username}</Text>
                                                    <Text style={styles.memberEmail}>{item.email}</Text>
                                                    <View style={[
                                                        styles.roleBadge,
                                                        item.roleInClass === 'TEACHER' && styles.teacherBadge,
                                                        item.roleInClass === 'ASSISTANT' && styles.assistantBadge,
                                                        item.roleInClass === 'STUDENT' && styles.studentBadge
                                                    ]}>
                                                        <Text style={styles.roleBadgeText}>{item.roleInClass}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* 如果是學生，顯示學科進度條 */}
                                            {isStudent && (
                                                <View style={styles.subjectPerformanceSection}>
                                                    <Text style={styles.sectionLabel}>Subject Performance</Text>
                                                    {loadingMemberData ? (
                                                        <ActivityIndicator size="small" color="#9C27B0" />
                                                    ) : (
                                                        <View style={styles.subjectBars}>
                                                            {(() => {
                                                                const gameData = memberGameData[item.userId] || [];
                                                                const subjectScores = calculateSubjectScores(gameData);
                                                                return subjectScores.map((subject, index) => (
                                                                    <View key={index} style={styles.subjectBarContainer}>
                                                                        <Text style={styles.subjectLabel}>{subject.label}</Text>
                                                                        <View style={styles.subjectBarBg}>
                                                                            <View style={[styles.subjectBarFill, { width: `${subject.percentage}%`, backgroundColor: subject.color }]} />
                                                                        </View>
                                                                        <Text style={[styles.subjectPercentage, { color: subject.color }]}>
                                                                            {subject.percentage > 0 ? `${subject.percentage}%` : 'N/A'}
                                                                        </Text>
                                                                    </View>
                                                                ));
                                                            })()}
                                                        </View>
                                                    )}
                                                </View>
                                            )}

                                            {/* 操作按鈕區域 */}
                                            <View style={styles.memberActions}>
                                                {/* 編輯角色按鈕（所有人） */}
                                                <TouchableOpacity style={styles.actionButton} onPress={() => openRoleManagement(item)}>
                                                    <Edit2 size={16} color="#007AFF" />
                                                    <Text style={styles.actionButtonText}>Edit</Text>
                                                </TouchableOpacity>

                                                {/* 學生成績按鈕 */}
                                                {isStudent && (
                                                    <TouchableOpacity style={styles.actionButton} onPress={() => viewStudentScores(item.userId, item.username)}>
                                                        <TrendingUp size={16} color="#4CAF50" />
                                                        <Text style={styles.actionButtonText}>Scores</Text>
                                                    </TouchableOpacity>
                                                )}

                                                {/* 移除學生按鈕 */}
                                                {isStudent && (
                                                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => confirmRemoveStudent(item.userId, item.username)}>
                                                        <Trash2 size={16} color="#FF4757" />
                                                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Remove</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    );
                                }}
                                keyExtractor={item => item.userId.toString()}
                                contentContainerStyle={styles.modalStudentList}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* 自定義確認刪除 Modal - 修正 visible 為 showConfirmModal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>
                            {deleteType === 'class' ? 'Delete Class' : 'Remove Student'}
                        </Text>
                        <Text style={styles.confirmMessage}>
                            {deleteType === 'class'
                                ? `Are you sure you want to delete class "${pendingDeleteName}"? This action cannot be undone.`
                                : `Are you sure you want to remove "${pendingStudentName}" from this class?`
                            }
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.cancelConfirmBtn]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={styles.cancelConfirmText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.deleteConfirmBtn]}
                                onPress={executeDelete}
                            >
                                <Text style={styles.deleteConfirmText}>
                                    {deleteType === 'class' ? 'Delete' : 'Remove'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Game Score Modal */}
            <Modal
                visible={showGameScoreModal}
                animationType="slide"
                onRequestClose={() => setShowGameScoreModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedStudentForScores?.name}'s Game Scores
                        </Text>
                        <TouchableOpacity onPress={() => setShowGameScoreModal(false)}>
                            <X size={24} color="#666" />
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
                                                {score.difficulty && (
                                                    <Text style={styles.scoreDifficulty}>Difficulty: {score.difficulty}</Text>
                                                )}
                                            </View>
                                            <Text style={styles.scoreDate}>
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
                                                {score.difficulty && (
                                                    <Text style={styles.scoreDifficulty}>Difficulty: {score.difficulty}</Text>
                                                )}
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
                                                            <Text style={[styles.recordDifficulty, { color: getDifficultyColor(score.difficulty) }]}>
                                                                {score.difficulty}
                                                            </Text>
                                                            <Text style={styles.recordDate}>
                                                                {new Date(score.createdAt).toLocaleDateString()}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.recordScores}>
                                                        <Text style={styles.recordScore}>{score.scores}</Text>
                                                        {score.type && (
                                                            <Text style={styles.recordPoints}>{score.type}</Text>
                                                        )}
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
            </Modal>

            {/* Role Management Modal */}
            <Modal
                visible={showRoleManagementModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowRoleManagementModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>Manage Role</Text>
                        <Text style={styles.confirmMessage}>
                            Change role for {selectedMemberForRole?.username}?
                        </Text>
                        
                        <View style={styles.roleOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    selectedMemberForRole?.roleInClass === 'STUDENT' && styles.currentRole
                                ]}
                                onPress={() => updateMemberRole('STUDENT')}
                            >
                                <Text style={styles.roleOptionText}>Student</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    selectedMemberForRole?.roleInClass === 'ASSISTANT' && styles.currentRole
                                ]}
                                onPress={() => updateMemberRole('ASSISTANT')}
                            >
                                <Text style={styles.roleOptionText}>Assistant</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    selectedMemberForRole?.roleInClass === 'TEACHER' && styles.currentRole
                                ]}
                                onPress={() => updateMemberRole('TEACHER')}
                            >
                                <Text style={styles.roleOptionText}>Teacher</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.cancelConfirmBtn]}
                                onPress={() => {
                                    setShowRoleManagementModal(false);
                                    setSelectedMemberForRole(null);
                                }}
                            >
                                <Text style={styles.cancelConfirmText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Styles remain the same...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    // 成員卡片主容器
    memberCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    memberCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    memberEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
// 角色徽章（可重用原有的 roleBadge 等）
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    teacherBadge: { backgroundColor: '#FF6B6B' },
    assistantBadge: { backgroundColor: '#4ECDC4' },
    studentBadge: { backgroundColor: '#95E1D3' },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
// 學科進度區域
    subjectPerformanceSection: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    subjectBars: {
        gap: 8,
    },
    subjectBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subjectLabel: {
        fontSize: 12,
        color: '#666',
        width: 60,
        fontWeight: '500',
    },
    subjectBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        marginHorizontal: 8,
    },
    subjectBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    subjectPercentage: {
        fontSize: 12,
        fontWeight: '600',
        width: 35,
        textAlign: 'right',
    },
// 操作按鈕區域
    memberActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    deleteButton: {
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    deleteButtonText: {
        color: '#FF4757',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModal: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
    },
    confirmMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelConfirmBtn: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelConfirmText: {
        color: '#666',
        fontWeight: '600',
    },
    deleteConfirmBtn: {
        backgroundColor: '#FF4757',
    },
    deleteConfirmText: {
        color: '#FFF',
        fontWeight: '600',
    },
    removeMemberBtn: {
        padding: 10,
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#FFE0E0',
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3436',
    },
    createClassBtn: {
        backgroundColor: '#6C5CE7',
        padding: 8,
        borderRadius: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 16,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    tabActive: {
        backgroundColor: '#6C5CE7',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    tabTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    classCard: {
        backgroundColor: '#fff',
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    classTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    classYear: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 4,
    },
    classActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        backgroundColor: '#F8F9FA',
        padding: 8,
        borderRadius: 6,
    },
    classStats: {
        gap: 12,
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    statText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    creationDate: {
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    creationDateText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    studentList: {
        gap: 8,
    },
    studentItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    studentItemSelected: {
        backgroundColor: '#F0F4FF',
        borderWidth: 1,
        borderColor: '#6C5CE7',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    studentEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    studentCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#6C5CE7',
    },
    studentItemDisabled: {
        backgroundColor: '#F5F5F5',
        opacity: 0.6,
    },
    studentNameDisabled: {
        color: '#999',
    },
    studentEmailDisabled: {
        color: '#BBB',
    },
    alreadyInClassText: {
        fontSize: 12,
        color: '#FF4757',
        fontWeight: '600',
        marginTop: 4,
    },
    checkmarkDisabled: {
        fontSize: 16,
        color: '#999',
        fontWeight: 'bold',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    // Student list view styles
    studentsHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: '#F8F9FA',
    },
    studentsHeaderTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 4,
    },
    studentsHeaderSubtitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    studentListContainer: {
        padding: 16,
        gap: 12,
    },
    studentListItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    studentListItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentListItemAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6C5CE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    studentListItemAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    studentListInfo: {
        flex: 1,
    },
    studentListItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 2,
    },
    studentListItemEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    classBadgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    classBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    classBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2196F3',
    },
    noClassesText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    studentListItemActions: {
        alignItems: 'flex-end',
    },
    viewStudentBtn: {
        backgroundColor: '#F0F4FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D5FF',
    },
    viewStudentBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6C5CE7',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3436',
    },
    form: {
        padding: 20,
        gap: 20,
    },
    formGroup: {
        gap: 8,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    submitBtn: {
        backgroundColor: '#6C5CE7',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    selectionInfo: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6C5CE7',
        marginBottom: 16,
    },
    modalStudentList: {
        gap: 8,
        marginBottom: 20,
    },
    // styles 中添加

    memberItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    memberRole: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    scoresContainer: {
        flex: 1,
        padding: 20,
    },
    scoreSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
    },
    scoreItem: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    scoreInfo: {
        flex: 1,
    },
    gameName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
        marginTop: 4,
    },
    scoreDate: {
        fontSize: 12,
        color: '#666',
    },
    scoreDifficulty: {
        fontSize: 12,
        color: '#FF9800',
        marginTop: 2,
    },
    scoreType: {
        fontSize: 12,
        color: '#2196F3',
        marginTop: 2,
    },
    noDataText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        padding: 20,
    },
    // Student profile styles
    profileSection: {
        marginBottom: 24,
    },
    profileCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    profileInfo: {
        marginBottom: 16,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    profileType: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    profileStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    profileStat: {
        alignItems: 'center',
    },
    profileStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    profileStatLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    // Game records styles
    gameRecordCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    gameRecordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    gameRecordInfo: {
        flex: 1,
    },
    gameRecordName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 6,
    },
    gameRecordMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    gameRecordType: {
        fontSize: 12,
        color: '#2196F3',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontWeight: '500',
    },
    gameRecordDifficulty: {
        fontSize: 12,
        color: '#FF9800',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontWeight: '500',
    },
    gameRecordScore: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    gameRecordDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    metadataSection: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    metadataTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    metadataItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    metadataKey: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        width: 80,
    },
    metadataValue: {
        fontSize: 12,
        color: '#333',
        flex: 1,
    },
    // Profile-style game records styles
    gameRecordsSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 5,
        elevation: 2,
    },
    gameRecordsList: {
        // Container for the list items
    },
    emptyGameRecords: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyGameRecordsText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#636E72',
        marginTop: 15,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    gameIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    recordInfo: {
        flex: 1,
    },
    recordName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    recordMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    recordDifficulty: {
        fontSize: 12,
        fontWeight: '600',
    },
    recordDate: {
        fontSize: 12,
        color: '#636E72',
        marginLeft: 8,
    },
    recordScores: {
        alignItems: 'flex-end',
    },
    recordScore: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
    },
    recordPoints: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    // Student Management style
    studentManagementItem: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#F0F0F0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    studentAvatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    studentBasicInfo: {
        flex: 1,
    },
    studentActions: {
        flexDirection: 'row',
        gap: 8,
    },

    actionBtnText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    deleteBtn: {
        backgroundColor: '#FFEBEE',
        borderColor: '#FFCDD2',
    },
    deleteBtnText: {
        color: '#FF4757',
    },
    // Legacy styles (keep for backward compatibility)
    scoreMemberBtn: {
        padding: 10,
        backgroundColor: '#E8F5E8',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    roleManageBtn: {
        padding: 10,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    roleOptions: {
        gap: 12,
        marginVertical: 20,
    },
    roleOption: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    currentRole: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    roleOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});
