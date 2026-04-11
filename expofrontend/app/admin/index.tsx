import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';

const AdminNavigate: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();

    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const goToDashboard = () => {
        router.push('/admin/adminDashboard');
    };

    const goBack = () => {
        router.back();
    };

    if (!isAdmin) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Access Denied</Text>
                <Text style={styles.subText}>You don't have admin permissions</Text>
                <TouchableOpacity style={styles.button} onPress={goBack}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Admin Access</Text>
                <Text style={styles.subtitle}>Welcome, {user?.username}</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity style={styles.card} onPress={goToDashboard}>
                    <Text style={styles.cardTitle}>User Management</Text>
                    <Text style={styles.cardDescription}>
                        Manage users, approve educator applications, and monitor system activity
                    </Text>
                    <View style={styles.arrow}>»</View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.card} 
                    onPress={() => router.push('/admin/roleManagement')}
                >
                    <Text style={styles.cardTitle}>Role Management</Text>
                    <Text style={styles.cardDescription}>
                        Manage user roles and permissions for all users
                    </Text>
                    <View style={styles.arrow}>»</View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={goBack}>
                    <Text style={styles.cardTitle}>Back to Profile</Text>
                    <Text style={styles.cardDescription}>
                        Return to your profile page
                    </Text>
                    <View style={styles.arrow}>«</View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#9C27B0',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
    },
    content: {
        flex: 1,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    arrow: {
        position: 'absolute',
        right: 24,
        top: '50%',
        fontSize: 24,
        color: '#9C27B0',
        fontWeight: 'bold',
        marginTop: -12,
    },
    errorText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F44336',
        textAlign: 'center',
        marginBottom: 16,
    },
    subText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        backgroundColor: '#9C27B0',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AdminNavigate;
