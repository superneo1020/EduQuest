import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { TrendingUp, Users, Target, Brain, Award, Clock } from 'lucide-react-native';
import educatorService, { Course } from './educatorService';

interface ClassAnalyticsPanelProps {
    selectedClass: Course | null;
    onBack?: () => void;
}

interface MockAnalytics {
    totalStudents: number;
    activeStudents: number;
    averagePerformance: number;
    totalQuestsCompleted: number;
    averagePlayTime: number;
    subjectAverages: Record<string, number>;
    topPerformers: Array<{ name: string; score: number; rank: number }>;
    engagementRate: number;
}

export const ClassAnalyticsPanel: React.FC<ClassAnalyticsPanelProps> = ({ selectedClass, onBack }) => {
    const [analytics, setAnalytics] = useState<MockAnalytics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedClass) {
            loadAnalytics();
        }
    }, [selectedClass]);

    const loadAnalytics = async () => {
        if (!selectedClass) return;

        try {
            setLoading(true);
            // Generate mock analytics based on class ID for consistency
            const mockData: MockAnalytics = {
                totalStudents: Math.floor(selectedClass.id * 3 + 15), // Mock student count
                activeStudents: Math.floor(selectedClass.id * 2 + 12),
                averagePerformance: 65 + (selectedClass.id % 20), // 65-85%
                totalQuestsCompleted: selectedClass.id * 25 + 100,
                averagePlayTime: selectedClass.id * 15 + 45, // minutes
                subjectAverages: {
                    math: 70 + (selectedClass.id % 15),
                    english: 68 + (selectedClass.id % 18),
                    science: 72 + (selectedClass.id % 20),
                    chinese: 65 + (selectedClass.id % 22),
                },
                topPerformers: [
                    { name: 'Alice Chen', score: 92, rank: 1 },
                    { name: 'Bob Wang', score: 88, rank: 2 },
                    { name: 'Charlie Li', score: 85, rank: 3 },
                ],
                engagementRate: 0.75 + (selectedClass.id % 20) / 100, // 75-95%
            };
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setAnalytics(mockData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedClass) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Brain size={48} color="#DDD" />
                    <Text style={styles.emptyStateTitle}>No Class Selected</Text>
                    <Text style={styles.emptyStateSubtitle}>Select a class to view analytics</Text>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C5CE7" />
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </View>
        );
    }

    if (!analytics) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Brain size={48} color="#DDD" />
                    <Text style={styles.emptyStateTitle}>Analytics Unavailable</Text>
                    <Text style={styles.emptyStateSubtitle}>Unable to load class analytics</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Class Analytics</Text>
                <Text style={styles.headerSubtitle}>
                    {selectedClass.grade} {selectedClass.suffix} - {selectedClass.academicYear}
                </Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Performance Overview */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Performance Overview</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Users size={24} color="#6C5CE7" />
                            <Text style={styles.statValue}>{analytics.totalStudents}</Text>
                            <Text style={styles.statLabel}>Total Students</Text>
                        </View>
                        <View style={styles.statItem}>
                            <TrendingUp size={24} color="#4CAF50" />
                            <Text style={styles.statValue}>{analytics.averagePerformance.toFixed(1)}%</Text>
                            <Text style={styles.statLabel}>Average Score</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Target size={24} color="#FF9800" />
                            <Text style={styles.statValue}>{analytics.totalQuestsCompleted}</Text>
                            <Text style={styles.statLabel}>Quests Completed</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Clock size={24} color="#FF4757" />
                            <Text style={styles.statValue}>{Math.floor(analytics.averagePlayTime / 60)}h {analytics.averagePlayTime % 60}m</Text>
                            <Text style={styles.statLabel}>Avg. Play Time</Text>
                        </View>
                    </View>
                </View>

                {/* Engagement Metrics */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Engagement Metrics</Text>
                    <View style={styles.engagementStats}>
                        <View style={styles.engagementItem}>
                            <Text style={styles.engagementValue}>{analytics.activeStudents}</Text>
                            <Text style={styles.engagementLabel}>Active Students</Text>
                            <Text style={styles.engagementSubtext}>Last 7 days</Text>
                        </View>
                        <View style={styles.engagementItem}>
                            <Text style={styles.engagementValue}>{(analytics.engagementRate * 100).toFixed(1)}%</Text>
                            <Text style={styles.engagementLabel}>Engagement Rate</Text>
                            <Text style={styles.engagementSubtext}>Class participation</Text>
                        </View>
                    </View>
                </View>

                {/* Subject Performance */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Subject Performance</Text>
                    {Object.entries(analytics.subjectAverages).map(([subject, avg]) => (
                        <View key={subject} style={styles.subjectItem}>
                            <Text style={styles.subjectName}>
                                {subject.charAt(0).toUpperCase() + subject.slice(1)}
                            </Text>
                            <View style={styles.subjectProgress}>
                                <View style={styles.subjectProgressBar}>
                                    <View 
                                        style={[
                                            styles.subjectProgressFill, 
                                            { width: `${avg}%` }
                                        ]} 
                                    />
                                </View>
                                <Text style={styles.subjectProgressText}>{avg.toFixed(1)}%</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Top Performers */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Top Performers</Text>
                    {analytics.topPerformers.map((student, index) => (
                        <View key={index} style={styles.performerItem}>
                            <View style={styles.rankBadge}>
                                <Award size={16} color="#FFD700" />
                                <Text style={styles.rankText}>#{student.rank}</Text>
                            </View>
                            <Text style={styles.performerName}>{student.name}</Text>
                            <Text style={styles.performerScore}>{student.score}%</Text>
                        </View>
                    ))}
                </View>

                {/* Performance Distribution */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Performance Distribution</Text>
                    <View style={styles.distributionContainer}>
                        <View style={styles.distributionBar}>
                            <View style={[styles.distributionSegment, { backgroundColor: '#4CAF50', flex: 0.3 }]} />
                            <View style={[styles.distributionSegment, { backgroundColor: '#FF9800', flex: 0.5 }]} />
                            <View style={[styles.distributionSegment, { backgroundColor: '#FF4757', flex: 0.2 }]} />
                        </View>
                        <View style={styles.distributionLabels}>
                            <View style={styles.distributionLabel}>
                                <View style={[styles.distributionIndicator, { backgroundColor: '#4CAF50' }]} />
                                <Text style={styles.distributionLabelText}>Excellent (85-100%)</Text>
                            </View>
                            <View style={styles.distributionLabel}>
                                <View style={[styles.distributionIndicator, { backgroundColor: '#FF9800' }]} />
                                <Text style={styles.distributionLabelText}>Good (70-84%)</Text>
                            </View>
                            <View style={styles.distributionLabel}>
                                <View style={[styles.distributionIndicator, { backgroundColor: '#FF4757' }]} />
                                <Text style={styles.distributionLabelText}>Needs Improvement (&lt;70%)</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 16,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3436',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    engagementStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    engagementItem: {
        alignItems: 'center',
    },
    engagementValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#6C5CE7',
    },
    engagementLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginTop: 4,
    },
    engagementSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    subjectItem: {
        marginBottom: 12,
    },
    subjectName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginBottom: 8,
    },
    subjectProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subjectProgressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        overflow: 'hidden',
    },
    subjectProgressFill: {
        height: '100%',
        backgroundColor: '#6C5CE7',
        borderRadius: 4,
    },
    subjectProgressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        width: 40,
        textAlign: 'right',
    },
    performerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rankText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFD700',
    },
    performerName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
        marginLeft: 12,
    },
    performerScore: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4CAF50',
    },
    distributionContainer: {
        gap: 16,
    },
    distributionBar: {
        height: 24,
        flexDirection: 'row',
        borderRadius: 12,
        overflow: 'hidden',
    },
    distributionSegment: {
        height: '100%',
    },
    distributionLabels: {
        gap: 8,
    },
    distributionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    distributionIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    distributionLabelText: {
        fontSize: 14,
        color: '#666',
    },


});
