import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';

interface AdminButtonProps {
  style?: any;
}

const AdminButton: React.FC<AdminButtonProps> = ({ style }) => {
  const router = useRouter();
  const { user } = useAuth();

  // Only show admin button if user has admin role
  if (!user?.roles?.includes('ROLE_ADMIN')) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.adminBtn, style]}
      onPress={() => router.push('/admin/index' as any)}
    >
      <User size={22} color="#9C27B0" />
      <Text style={styles.adminText}>Admin</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
  },
  adminText: {
    color: '#9C27B0',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 6,
  },
});

export default AdminButton;
