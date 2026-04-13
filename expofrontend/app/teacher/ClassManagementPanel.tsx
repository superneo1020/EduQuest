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
import { Plus, BookOpen, Users2, TrendingUp, Target, UserPlus, X, Edit2, Trash2 } from 'lucide-react-native';
import educatorService, { Course, CourseRequest, UserMini, CourseMemberRequest } from './educatorService';

interface ClassManagementPanelProps {
    onBack?: () => void;
}

export const ClassManagementPanel: React.FC<ClassManagementPanelProps> = ({ onBack }) => {
    const [classes, setClasses] = useState<Course[]>([]);
    const [schoolMembers, setSchoolMembers] = useState<UserMini[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Course | null>(null);
    const [newClassData, setNewClassData] = useState<CourseRequest>({ grade: '', suffix: '', academicYear: '' });
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [currentView, setCurrentView] = useState<'classes' | 'students'>('classes');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [classesData, membersData] = await Promise.all([
                educatorService.getClasses(),
                educatorService.getSchoolMembers()
            ]);
            setClasses(classesData);
            setSchoolMembers(membersData);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load data');
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

    const deleteClass = async (classId: number) => {
        Alert.alert(
            'Delete Class',
            'Are you sure you want to delete this class? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await educatorService.deleteClass(classId);
                            Alert.alert('Success', 'Class deleted successfully');
                            loadData();
                        } catch (error) {
                            console.error('Error deleting class:', error);
                            Alert.alert('Error', 'Failed to delete class');
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
        } catch (error) {
            console.error('Error adding students:', error);
            Alert.alert('Error', 'Failed to add students to class');
        }
    };

    const toggleStudentSelection = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const renderClassCard = ({ item: classItem }: { item: Course }) => (
        <View style={styles.classCard}>
            <View style={styles.classHeader}>
                <View>
                    <Text style={styles.classTitle}>{classItem.grade} {classItem.suffix}</Text>
                    <Text style={styles.classYear}>{classItem.academicYear}</Text>
                </View>
                <View style={styles.classActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            setSelectedClass(classItem);
                            setShowAddStudentModal(true);
                        }}
                    >
                        <UserPlus size={16} color="#6C5CE7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => deleteClass(classItem.id)}
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
                <View style={styles.statItem}>
                    <Target size={16} color="#FF9800" />
                    <Text style={styles.statText}>School ID: {classItem.schoolId}</Text>
                </View>
            </View>
        </View>
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

    if (loading) {
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
                        Classes ({classes.length})
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
                    {classes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <BookOpen size={48} color="#DDD" />
                            <Text style={styles.emptyStateTitle}>No classes yet</Text>
                            <Text style={styles.emptyStateSubtitle}>Create your first class to get started</Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => setShowCreateModal(true)}
                            >
                                <Plus size={18} color="white" />
                                <Text style={styles.primaryBtnText}>Create First Class</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={classes}
                            renderItem={renderClassCard}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.classList}
                        />
                    )}
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
        </View>
    );
};

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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2D3436',
        marginTop: 16,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    primaryBtnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    classList: {
        gap: 12,
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
});
