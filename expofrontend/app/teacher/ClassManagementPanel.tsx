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
import { Plus, BookOpen, Users2, TrendingUp, Target, UserPlus, X, Edit2, Trash2 } from 'lucide-react-native';
import educatorService, {Course, CourseRequest, UserMini, CourseMemberRequest, CourseMember} from './educatorService';
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
            const currentCount = classMemberCounts.get(selectedClass.id) || 0;
            setClassMemberCounts(prev => new Map(prev).set(selectedClass.id, currentCount + selectedStudents.length));

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

    // ClassManagementPanel.tsx - 修改 loadClassMembers 函數
    const loadClassMembers = async (classId: number) => {
        try {
            const members = await educatorService.getClassMembersSafe(classId);
            console.log('Class members loaded:', members);
            setClassMembers(members);
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
            const members = await educatorService.getClassMembersSafe(classItem.id);
            console.log('Fetched members:', members);
            setClassMembers(members);
        } catch (error: any) {
            console.error('View members failed:', error);
            // 如果失敗，關閉 Modal 並報錯
            setShowClassMembersModal(false);
            Alert.alert('Error', 'Could not load class members: ' + error.message);
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
                <View style={styles.statItem}>
                    <Users2 size={16} color="#6C5CE7" />
                    <Text style={styles.statText}>Class ID: {classItem.id}</Text>
                </View>
                {classItem.schoolId && (
                    <View style={styles.statItem}>
                        <Target size={16} color="#FF9800" />
                        <Text style={styles.statText}>School ID: {classItem.schoolId}</Text>
                    </View>
                )}
                <View style={styles.statItem}>
                    <Users2 size={16} color="#6C5CE7" />
                    <Text style={styles.statText}>Members: {classMemberCounts.get(classItem.id) || 0}</Text>
                </View>
                <View style={styles.statItem}>
                    <BookOpen size={16} color="#4CAF50" />
                    <Text style={styles.statText}>Created: {new Date(classItem.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderStudentItem = ({ item }: { item: UserMini }) => (
        <TouchableOpacity
            style={[
                styles.studentItem,
                selectedStudents.includes(item.id) && styles.studentItemSelected
            ]}
            onPress={() => toggleStudentSelection(item.id)}
        >
            <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentEmail}>{item.email}</Text>
            </View>
            <View style={styles.studentCheckbox}>
                {selectedStudents.includes(item.id) && (
                    <View style={styles.checkboxChecked} />
                )}
            </View>
        </TouchableOpacity>
    );

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
                    <FlatList
                        data={schoolMembers}
                        renderItem={renderStudentItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.studentList}
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
                            renderItem={renderStudentItem}
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
                            <FlatList
                                data={classMembers}
                                renderItem={({ item }) => {
                                    const isStudent = item.roleInClass === 'STUDENT';
                                    return (
                                        <View style={styles.memberItem}>
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
                                            {isStudent && (
                                                <TouchableOpacity
                                                    style={styles.removeMemberBtn}
                                                    onPress={() => confirmRemoveStudent(item.userId, item.username)}
                                                >
                                                    <Trash2 size={18} color="#FF4757" />
                                                </TouchableOpacity>
                                            )}
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
        </View>
    );
};

// Styles remain the same...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
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
        gap: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statText: {
        fontSize: 14,
        color: '#666',
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
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    memberEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    memberRole: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
    },
    teacherBadge: {
        backgroundColor: '#FF6B6B',
    },
    assistantBadge: {
        backgroundColor: '#4ECDC4',
    },
    studentBadge: {
        backgroundColor: '#95E1D3',
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
});
