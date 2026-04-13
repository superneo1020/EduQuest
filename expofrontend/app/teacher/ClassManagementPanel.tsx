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
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showClassMembersModal, setShowClassMembersModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Course | null>(null);
    const [newClassData, setNewClassData] = useState<CourseRequest>({ grade: '', suffix: '', academicYear: '' });
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [currentView, setCurrentView] = useState<'classes' | 'students'>('classes');

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

    // ClassManagementPanel.tsx - 修改 deleteClass 函數
    // ClassManagementPanel.tsx - 在刪除前檢查權限
    // ClassManagementPanel.tsx - 完整版
    // ClassManagementPanel.tsx - 修改 deleteClass 函數
    // ClassManagementPanel.tsx - 修改獲取學校信息的代碼

    // ClassManagementPanel.tsx - 完整版 deleteClass
    // ClassManagementPanel.tsx - 修改 deleteClass 函數
    // ClassManagementPanel.tsx - 修改 deleteClass 函數
    const deleteClass = async (classId: number) => {
        const classToDelete = classesResponse?.items.find(c => c.id === classId);

        if (!classToDelete) {
            Alert.alert('Error', 'Class not found');
            return;
        }

        Alert.alert(
            'Delete Class',
            `Are you sure you want to delete class ${classToDelete.grade} ${classToDelete.suffix}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log(`Attempting to delete class ${classId}`);
                            const result = await educatorService.deleteClass(classId);
                            console.log('Delete result:', result);

                            if (result && !result.error) {
                                Alert.alert('Success', result.message || 'Class deleted successfully');
                                await loadData(); // 重新加載數據
                            } else {
                                Alert.alert('Error', result?.message || 'Failed to delete class');
                            }
                        } catch (error: any) {
                            console.error('Error deleting class:', error);
                            Alert.alert('Error', `Failed to delete class: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };
    const addStudentsToClass = async () => {
        if (selectedStudents.length === 0) {
            Alert.alert('Error', 'Please select at least one student');
            return;
        }

        try {
            // Check if user is class member and staff
            const isMemberAndStaff = await educatorService.getUserRoleInClass(selectedClass!.id);
            if (isMemberAndStaff !== 'TEACHER' && isMemberAndStaff !== 'ASSISTANT') {
                // Try to add user as teacher first
                try {
                    await educatorService.ensureTeacherAsMember(selectedClass!.id);
                    console.log('Teacher added as class member');
                } catch (ensureError) {
                    console.error('Error ensuring teacher as member:', ensureError);
                    Alert.alert(
                        'Permission Denied',
                        'You need to be a teacher or assistant in this class to add students.\n\n' +
                        'Failed to automatically add you as a teacher to this class.'
                    );
                    return;
                }
            }

            // Add students
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
            const members = await educatorService.getClassMembers(classId);
            console.log('Class members loaded:', members);
            setClassMembers(members);
        } catch (error) {
            console.error('Error loading class members:', error);
            setClassMembers([]);
        }
    };
// ClassManagementPanel.tsx - 確保 viewClassMembers 被正確調用
    const viewClassMembers = async (classItem: Course) => {
        console.log('Viewing members for class:', classItem.id);
        setSelectedClass(classItem);
        setShowClassMembersModal(true);
        await loadClassMembers(classItem.id);
    };

    // Render methods remain the same
    const renderClassCard = ({ item: classItem }: { item: Course }) => (
        <TouchableOpacity
            style={styles.classCard}
            onPress={() => viewClassMembers(classItem)}
        >
            <View style={styles.classHeader}>
                <View>
                    <Text style={styles.classTitle}>{classItem.grade} {classItem.suffix}</Text>
                    <Text style={styles.classYear}>{classItem.academicYear}</Text>
                </View>
                <View style={styles.classActions}>
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
                            e.stopPropagation();
                            setSelectedClass(classItem);
                            setShowAddStudentModal(true);
                        }}
                    >
                        <UserPlus size={16} color="#6C5CE7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={(e) => {
                            e.stopPropagation();
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
                <View style={styles.content}>
                    {/* NEW: Using ApiListHandler for classes */}
                    <ApiListHandler
                        response={classesResponse}
                        loading={loading}
                        renderItem={renderClassCard}
                        onRefresh={loadData}
                    />
                </View>
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

            {/* Class Members Modal */}
            {/* Class Members Modal */}
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
                                renderItem={({ item }) => (
                                    <View style={styles.memberItem}>
                                        <View style={styles.memberInfo}>
                                            <Text style={styles.memberName}>{item.username}</Text>
                                            <Text style={styles.memberEmail}>{item.email}</Text>
                                            <Text style={styles.memberRole}>{item.roleInClass}</Text>
                                        </View>
                                        <View style={[
                                            styles.roleBadge,
                                            item.roleInClass === 'TEACHER' && styles.teacherBadge,
                                            item.roleInClass === 'ASSISTANT' && styles.assistantBadge,
                                            item.roleInClass === 'STUDENT' && styles.studentBadge
                                        ]}>
                                            <Text style={styles.roleBadgeText}>
                                                {item.roleInClass}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                keyExtractor={item => item.userId.toString()}
                                contentContainerStyle={styles.modalStudentList}
                            />
                        )}
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
