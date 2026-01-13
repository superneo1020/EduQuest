import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Trophy, Star, Award, Target } from 'lucide-react-native';

export default function ProfileScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Learning Progress</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Learning Statistics</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Trophy size={24} color="#FFD700" />
                            <Text style={styles.statNumber}>150</Text>
                            <Text style={styles.statLabel}>Total Points</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Target size={24} color="#4CAF50" />
                            <Text style={styles.statNumber}>8</Text>
                            <Text style={styles.statLabel}>Games Completed</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Star size={24} color="#2196F3" />
                            <Text style={styles.statNumber}>3</Text>
                            <Text style={styles.statLabel}>Achievements</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Award size={24} color="#FF9800" />
                            <Text style={styles.statNumber}>15</Text>
                            <Text style={styles.statLabel}>Streak Days</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    statsCard: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        alignItems: 'center',
        padding: 15,
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
});