import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Switch
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';

// Types
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

interface Role {
  id: number;
  name: string;
}

interface FilterRequest {
  username?: string;
  email?: string;
  schoolName?: string;
  educatorStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADMIN';
  isActive?: boolean;
  roleId?: number;
}

interface ApiResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

const RoleManagement: React.FC = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterRequest>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Check if user has admin role
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchRoles();
    }
  }, [isAdmin, currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Since we don't have admin-specific filtering APIs, we'll fetch all users
      // and filter on the frontend
      const response = await api.get('/api/user/all');
      
      // Transform the user data to match our interface
      const transformedUsers = Array.isArray(response.data) ? response.data.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        schoolId: user.school?.id,
        schoolName: user.school?.name || 'No School',
        isAdmin: user.roles?.includes('ROLE_ADMIN') || false,
        isEducator: user.roles?.includes('ROLE_EDUCATOR') || false,
        active: user.active !== false, // Default to true if not specified
        educatorStatus: (user.roles?.includes('ROLE_ADMIN') ? 'ADMIN' : 
                     user.roles?.includes('ROLE_EDUCATOR') ? 'APPROVED' : 'NONE') as 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADMIN',
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
      })) : [];
      
      // Apply frontend filtering
      let filteredUsers = transformedUsers;
      if (filters.username) {
        filteredUsers = filteredUsers.filter(user => 
          user.username.toLowerCase().includes(filters.username!.toLowerCase())
        );
      }
      if (filters.email) {
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(filters.email!.toLowerCase())
        );
      }
      if (filters.schoolName) {
        filteredUsers = filteredUsers.filter(user => 
          user.schoolName.toLowerCase().includes(filters.schoolName!.toLowerCase())
        );
      }
      if (filters.educatorStatus) {
        filteredUsers = filteredUsers.filter(user => 
          user.educatorStatus === filters.educatorStatus
        );
      }
      if (filters.isActive !== undefined) {
        filteredUsers = filteredUsers.filter(user => 
          user.active === filters.isActive
        );
      }
      
      // Apply pagination
      const startIndex = currentPage * 20;
      const endIndex = startIndex + 20;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
      setTotalPages(Math.ceil(filteredUsers.length / 20));
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Unable to fetch user list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRoles = async () => {
    try {
      // Since we don't have admin roles API, we'll use predefined roles
      const predefinedRoles = [
        { id: 1, name: 'ROLE_USER' },
        { id: 2, name: 'ROLE_EDUCATOR' },
        { id: 3, name: 'ROLE_ADMIN' }
      ];
      setRoles(predefinedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(0);
    fetchUsers();
  };

  const handleRoleToggle = async (userId: number, roleName: string, enable: boolean) => {
    try {
      // Since we don't have admin role management APIs, we'll show a message
      // In a real implementation, this would call admin-specific endpoints
      Alert.alert(
        'Role Management', 
        `Role ${roleName} ${enable ? 'addition' : 'removal'} for user ${userId} would be processed by admin API.\n\nThis is a demo - actual role management requires backend admin endpoints.`,
        [{ text: 'OK' }]
      );
      
      // For demo purposes, we'll update the local state
      if (enable) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { 
                  ...user, 
                  ...(roleName === 'ROLE_ADMIN' && { isAdmin: true, educatorStatus: 'ADMIN' }),
                  ...(roleName === 'ROLE_EDUCATOR' && { isEducator: true, educatorStatus: 'APPROVED' }),
                  ...(roleName === 'ROLE_USER' && { active: true })
                }
              : user
          )
        );
      } else {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { 
                  ...user, 
                  ...(roleName === 'ROLE_ADMIN' && { isAdmin: false, educatorStatus: user.isEducator ? 'APPROVED' : 'NONE' }),
                  ...(roleName === 'ROLE_EDUCATOR' && { isEducator: false, educatorStatus: user.isAdmin ? 'ADMIN' : 'NONE' }),
                  ...(roleName === 'ROLE_USER' && { active: false })
                }
              : user
          )
        );
      }
    } catch (error: any) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user role');
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    const currentUserRoles = [];
    if (user.isAdmin) currentUserRoles.push('ROLE_ADMIN');
    if (user.isEducator) currentUserRoles.push('ROLE_EDUCATOR');
    if (user.active) currentUserRoles.push('ROLE_USER');
    setUserRoles(currentUserRoles);
    setRoleModalVisible(true);
  };

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

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => openRoleModal(item)}
    >
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
        {item.active && <View style={[styles.roleBadge, styles.userRole]}><Text style={styles.roleText}>USER</Text></View>}
      </View>
      
      <View style={styles.userFooter}>
        <Text style={styles.activeStatus}>
          Account: {item.active ? 'Active' : 'Inactive'}
        </Text>
        <Text style={styles.date}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.editIndicator}>
        <Text style={styles.editText}>Tap to edit roles</Text>
      </View>
    </TouchableOpacity>
  );

  const RoleModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={roleModalVisible}
      onRequestClose={() => setRoleModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Manage User Roles</Text>
            
            {selectedUser && (
              <>
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoText}>User: {selectedUser.username}</Text>
                  <Text style={styles.userInfoText}>Email: {selectedUser.email}</Text>
                  <Text style={styles.userInfoText}>School: {selectedUser.schoolName}</Text>
                </View>
                
                <View style={styles.roleSection}>
                  <Text style={styles.sectionTitle}>Available Roles</Text>
                  
                  <View style={styles.roleItem}>
                    <View style={styles.roleInfo}>
                      <Text style={styles.roleName}>ROLE_USER</Text>
                      <Text style={styles.roleDescription}>Basic user access</Text>
                    </View>
                    <Switch
                      value={userRoles.includes('ROLE_USER')}
                      onValueChange={(value) => handleRoleToggle(selectedUser.id, 'ROLE_USER', value)}
                      disabled={selectedUser.username === user?.username} // Can't change own roles
                    />
                  </View>
                  
                  <View style={styles.roleItem}>
                    <View style={styles.roleInfo}>
                      <Text style={styles.roleName}>ROLE_EDUCATOR</Text>
                      <Text style={styles.roleDescription}>Can create and manage educational content</Text>
                    </View>
                    <Switch
                      value={userRoles.includes('ROLE_EDUCATOR')}
                      onValueChange={(value) => handleRoleToggle(selectedUser.id, 'ROLE_EDUCATOR', value)}
                      disabled={selectedUser.username === user?.username}
                    />
                  </View>
                  
                  <View style={styles.roleItem}>
                    <View style={styles.roleInfo}>
                      <Text style={[styles.roleName, { color: '#9C27B0' }]}>ROLE_ADMIN</Text>
                      <Text style={styles.roleDescription}>Full system administration access</Text>
                    </View>
                    <Switch
                      value={userRoles.includes('ROLE_ADMIN')}
                      onValueChange={(value) => handleRoleToggle(selectedUser.id, 'ROLE_ADMIN', value)}
                      disabled={selectedUser.username === user?.username}
                    />
                  </View>
                </View>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>You do not have admin permissions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Role Management</Text>
      <Text style={styles.subtitle}>Manage user roles and permissions</Text>
      
      {/* Filters */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Search username..."
          value={filters.username || ''}
          onChangeText={(text) => setFilters({ ...filters, username: text })}
        />
        
        <TextInput
          style={styles.filterInput}
          placeholder="Search email..."
          value={filters.email || ''}
          onChangeText={(text) => setFilters({ ...filters, email: text })}
        />
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            setFilters({});
            setCurrentPage(0);
          }}
        >
          <Text style={styles.buttonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#9C27B0" />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={() => {
            if (currentPage < totalPages - 1) {
              setCurrentPage(currentPage + 1);
            }
          }}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => (
            <View style={styles.pagination}>
              <Text style={styles.paginationText}>
                Page {currentPage + 1} of {totalPages}
              </Text>
            </View>
          )}
        />
      )}

      <RoleModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 50,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#9C27B0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  userItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  school: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  adminRole: {
    backgroundColor: '#9C27B0',
  },
  educatorRole: {
    backgroundColor: '#2196F3',
  },
  userRole: {
    backgroundColor: '#4CAF50',
  },
  roleText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeStatus: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  editIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  editText: {
    fontSize: 12,
    color: '#9C27B0',
    fontStyle: 'italic',
  },
  pagination: {
    padding: 20,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
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
  userInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  userInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  roleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  roleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#9C27B0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RoleManagement;
