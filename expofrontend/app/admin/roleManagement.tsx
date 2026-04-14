// RoleManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
    Alert, ActivityIndicator, RefreshControl, Modal, ScrollView, Switch,
    Platform
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';
import { Filter, X, Check, UserX } from 'lucide-react-native';

interface User {
    id: number;
    username: string;
    email: string;
    schoolId?: number;
    schoolName: string;
    isAdmin: boolean;
    isEducator: boolean;
    active: boolean;
    educatorStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
}

interface FilterParams {
    username?: string;
    email?: string;
    schoolName?: string;
    educatorStatus?: string;
    isActive?: boolean;
    roleId?: number;
}

const RoleManagement: React.FC = () => {
    const { user, token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState<FilterParams>({});
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [tempFilters, setTempFilters] = useState<FilterParams>({});

    const api = axios.create({
        baseURL: getApiBaseUrl(),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const fetchUsers = useCallback(async () => {
        if (!isAdmin) return;
        try {
            setLoading(true);
            const params: any = {
                page: currentPage,
                size: 20,
                ...filters,
            };
            // 移除 undefined 值
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await api.get('/api/admin/filter/user', { params });
            const { content, totalPages, totalElements } = response.data;
            const transformedUsers = content.map((u: any) => ({
                id: u.userId,
                username: u.username,
                email: u.email,
                schoolId: u.schoolId,
                schoolName: u.schoolName,
                isAdmin: u.isAdmin,
                isEducator: u.isEducator,
                active: u.isActive,
                educatorStatus: u.educatorStatus,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
            }));
            setUsers(transformedUsers);
            setTotalPages(totalPages);
            setTotalElements(totalElements);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, filters, isAdmin]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onRefresh = () => {
        setRefreshing(true);
        setCurrentPage(0);
        fetchUsers();
    };

    const applyFilters = () => {
        setFilters(tempFilters);
        setCurrentPage(0);
        setFilterModalVisible(false);
    };

    const resetFilters = () => {
        setTempFilters({});
        setFilters({});
        setCurrentPage(0);
        setFilterModalVisible(false);
    };

    const handleActivate = async (userId: number, currentStatus: boolean) => {
        if (currentStatus) {
            Alert.alert('Info', 'User is already active');
            return;
        }
        Alert.alert('Confirm', 'Activate this user?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Activate',
                onPress: async () => {
                    try {
                        await api.patch(`/api/admin/user/${userId}/activate`);
                        Alert.alert('Success', 'User activated successfully');
                        fetchUsers();
                    } catch (error: any) {
                        Alert.alert('Error', error.response?.data?.message || 'Activation failed');
                    }
                },
            },
        ]);
    };

    const handleReject = async (userId: number) => {
        Alert.alert('Confirm', 'Reject this educator? The user will be deactivated and educator role removed.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.patch(`/api/admin/user/${userId}/reject`);
                        Alert.alert('Success', 'Educator rejected');
                        fetchUsers();
                    } catch (error: any) {
                        Alert.alert('Error', error.response?.data?.message || 'Rejection failed');
                    }
                },
            },
        ]);
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity style={styles.userItem} onPress={() => { setSelectedUser(item); setModalVisible(true); }}>
            <View style={styles.userHeader}>
                <Text style={styles.username}>{item.username}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.educatorStatus) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.educatorStatus)}</Text>
                </View>
            </View>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.school}>{item.schoolName}</Text>
            <View style={styles.rolesContainer}>
                {item.isAdmin && <View style={[styles.roleBadge, styles.adminRole]}><Text style={styles.roleText}>ADMIN</Text></View>}
                {item.isEducator && <View style={[styles.roleBadge, styles.educatorRole]}><Text style={styles.roleText}>EDUCATOR</Text></View>}
                <View style={[styles.roleBadge, item.active ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.roleText}>{item.active ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
            </View>
            <View style={styles.userFooter}>
                <Text style={styles.date}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.actionButtons}>
                {!item.active && (
                    <TouchableOpacity style={styles.activateBtn} onPress={() => handleActivate(item.id, item.active)}>
                        <Check size={16} color="#FFF" />
                        <Text style={styles.actionBtnText}>Activate</Text>
                    </TouchableOpacity>
                )}
                {item.isEducator && item.educatorStatus !== 'REJECTED' && (
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                        <UserX size={16} color="#FFF" />
                        <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#FFA500';
            case 'APPROVED': return '#4CAF50';
            case 'REJECTED': return '#F44336';
            case 'ADMIN': return '#9C27B0';
            default: return '#757575';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pending';
            case 'APPROVED': return 'Approved';
            case 'REJECTED': return 'Rejected';
            case 'ADMIN': return 'Admin';
            default: return 'None';
        }
    };

    if (!isAdmin) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>You do not have admin permissions</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Role Management</Text>
                <TouchableOpacity style={styles.filterIcon} onPress={() => { setTempFilters(filters); setFilterModalVisible(true); }}>
                    <Filter size={24} color="#9C27B0" />
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Total: {totalElements} users</Text>

            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={() => { if (currentPage + 1 < totalPages) setCurrentPage(currentPage + 1); }}
                onEndReachedThreshold={0.3}
                ListFooterComponent={() => loading && <ActivityIndicator size="small" color="#9C27B0" />}
            />

            {/* User Detail Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>User Details</Text>
                            {selectedUser && (
                                <>
                                    <Text style={styles.detailLabel}>Username: <Text style={styles.detailValue}>{selectedUser.username}</Text></Text>
                                    <Text style={styles.detailLabel}>Email: <Text style={styles.detailValue}>{selectedUser.email}</Text></Text>
                                    <Text style={styles.detailLabel}>School: <Text style={styles.detailValue}>{selectedUser.schoolName}</Text></Text>
                                    <Text style={styles.detailLabel}>Educator Status: <Text style={styles.detailValue}>{getStatusText(selectedUser.educatorStatus)}</Text></Text>
                                    <Text style={styles.detailLabel}>Active: <Text style={styles.detailValue}>{selectedUser.active ? 'Yes' : 'No'}</Text></Text>
                                    <Text style={styles.detailLabel}>Roles: {selectedUser.isAdmin && 'Admin '}{selectedUser.isEducator && 'Educator '}</Text>
                                    <Text style={styles.detailLabel}>Created: {new Date(selectedUser.createdAt).toLocaleString()}</Text>
                                </>
                            )}
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeModalText}>Close</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Filter Modal */}
            <Modal visible={filterModalVisible} animationType="slide" transparent onRequestClose={() => setFilterModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.filterModalContent}>
                        <Text style={styles.filterTitle}>Filter Users</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Username"
                            value={tempFilters.username || ''}
                            onChangeText={text => setTempFilters(prev => ({ ...prev, username: text }))}
                        />
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Email"
                            value={tempFilters.email || ''}
                            onChangeText={text => setTempFilters(prev => ({ ...prev, email: text }))}
                        />
                        <TextInput
                            style={styles.filterInput}
                            placeholder="School Name"
                            value={tempFilters.schoolName || ''}
                            onChangeText={text => setTempFilters(prev => ({ ...prev, schoolName: text }))}
                        />
                        <View style={styles.filterRow}>
                            <Text style={styles.filterLabel}>Educator Status:</Text>
                            <View style={styles.statusOptions}>
                                {['', 'PENDING', 'APPROVED', 'REJECTED', 'NONE'].map(status => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.statusChip, tempFilters.educatorStatus === status && styles.statusChipActive]}
                                        onPress={() => setTempFilters(prev => ({ ...prev, educatorStatus: status || undefined }))}
                                    >
                                        <Text style={styles.statusChipText}>{status || 'All'}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.filterRow}>
                            <Text style={styles.filterLabel}>Active:</Text>
                            <View style={styles.statusOptions}>
                                {[undefined, true, false].map(active => (
                                    <TouchableOpacity
                                        key={String(active)}
                                        style={[styles.statusChip, tempFilters.isActive === active && styles.statusChipActive]}
                                        onPress={() => setTempFilters(prev => ({ ...prev, isActive: active }))}
                                    >
                                        <Text style={styles.statusChipText}>
                                            {active === undefined ? 'All' : active ? 'Active' : 'Inactive'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.filterButtonsRow}>
                            <TouchableOpacity style={styles.applyFilterBtn} onPress={applyFilters}>
                                <Text style={styles.applyFilterText}>Apply</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.resetFilterBtn} onPress={resetFilters}>
                                <Text style={styles.resetFilterText}>Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    filterIcon: { padding: 8 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
    userItem: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#9C27B0' },
    userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    username: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    email: { fontSize: 14, color: '#666', marginBottom: 4 },
    school: { fontSize: 14, color: '#666', marginBottom: 8 },
    rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    adminRole: { backgroundColor: '#9C27B0' },
    educatorRole: { backgroundColor: '#2196F3' },
    activeBadge: { backgroundColor: '#4CAF50' },
    inactiveBadge: { backgroundColor: '#F44336' },
    roleText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    userFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    date: { fontSize: 12, color: '#999' },
    actionButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 },
    activateBtn: { backgroundColor: '#4CAF50', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    rejectBtn: { backgroundColor: '#F44336', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    errorText: { fontSize: 18, color: '#F44336', textAlign: 'center', marginTop: 50 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    detailLabel: { fontSize: 16, fontWeight: '600', marginTop: 8, color: '#333' },
    detailValue: { fontWeight: 'normal', color: '#666' },
    closeModalBtn: { backgroundColor: '#9C27B0', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    closeModalText: { color: '#FFF', fontWeight: 'bold' },
    filterModalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%' },
    filterTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    filterInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16 },
    filterRow: { marginBottom: 16 },
    filterLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0' },
    statusChipActive: { backgroundColor: '#9C27B0' },
    statusChipText: { color: '#333' },
    filterButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
    applyFilterBtn: { flex: 1, backgroundColor: '#9C27B0', padding: 12, borderRadius: 8, alignItems: 'center' },
    applyFilterText: { color: '#FFF', fontWeight: 'bold' },
    resetFilterBtn: { flex: 1, backgroundColor: '#F0F0F0', padding: 12, borderRadius: 8, alignItems: 'center' },
    resetFilterText: { color: '#333', fontWeight: 'bold' },
});

export default RoleManagement;