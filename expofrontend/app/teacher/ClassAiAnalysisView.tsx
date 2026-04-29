import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import { X, Brain, Users, TrendingUp, Target, Clock, AlertCircle } from 'lucide-react-native';
import { getApiBaseUrl } from '@/src/api/client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenExpired } from '@/src/utils/authUtils';

interface ClassAiAnalysisViewProps {
    visible: boolean;
    onClose: () => void;
    classId: number;
    className: string;
    token: string;
}

interface ClassAiAnalysis {
    overallAnalysis: string;
    studentAnalysis: string[];
}

export default function ClassAiAnalysisView({ 
    visible, 
    onClose, 
    classId, 
    className, 
    token 
}: ClassAiAnalysisViewProps) {
    const [loading, setLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<ClassAiAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && classId) {
            loadClassAiAnalysis();
        }
    }, [visible, classId]);

    const loadClassAiAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            // Validate token before making request
            if (!token) {
                throw new Error('No authentication token available');
            }

            if (isTokenExpired(token)) {
                await AsyncStorage.removeItem('auth_token');
                await AsyncStorage.removeItem('auth_user');
                throw new Error('Authentication token has expired. Please log in again.');
            }

            const response = await axios.get(
                `${getApiBaseUrl()}/api/educator/class/${classId}/game/score/result`,
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    timeout: 30000 // 30 second timeout
                }
            );

            if (response.data) {
                setAiAnalysis(response.data);
            } else {
                setError('未收到分析數據');
            }
        } catch (error: any) {
            console.error('Error loading class AI analysis:', error);
            
            if (error.message?.includes('expired') || error.message?.includes('authentication')) {
                setError('Your authentication has expired. Please log in again.');
                // Optionally trigger sign out or navigation to login
                setTimeout(() => {
                    Alert.alert(
                        'Expired certification',
                        'Your login has expired. Please log in again.',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    onClose();
                                    // You might want to navigate to login screen here
                                }
                            }
                        ]
                    );
                }, 1000);
            } else if (error.response?.status === 401) {
                setError('權限不足，請確認您有權限查看此班級的分析');
            } else if (error.response?.status === 403) {
                setError('無權限訪問此班級的AI分析');
            } else if (error.response?.status === 404) {
                setError('找不到班級數據，請確認班級ID正確');
            } else if (error.code === 'ECONNABORTED') {
                setError('請求超時，請檢查網絡連接後重試');
            } else {
                setError('載入班級AI分析時發生錯誤，請稍後重試');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderAnalysisContent = () => {
        if (!aiAnalysis) return null;

        return (
            <View style={styles.analysisContainer}>
                {/* Header with class info */}
                <View style={styles.analysisHeader}>
                    <View style={styles.classInfo}>
                        <Users size={24} color="#6C5CE7" />
                        <View style={styles.classInfoText}>
                            <Text style={styles.className}>{className}</Text>
                            <Text style={styles.analysisDate}>{formatDate()}</Text>
                        </View>
                    </View>
                </View>

                {/* Overall Analysis */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TrendingUp size={20} color="#FF9800" />
                        <Text style={styles.sectionTitle}>Overall performance analysis</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <Text style={styles.analysisText}>{aiAnalysis.overallAnalysis || 'No overall analysis data available.'}</Text>
                    </View>
                </View>

                {/* Student Analysis */}
                {aiAnalysis.studentAnalysis && aiAnalysis.studentAnalysis.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Target size={20} color="#4CAF50" />
                            <Text style={styles.sectionTitle}>Student Individual Analysis</Text>
                        </View>
                        <View style={styles.sectionContent}>
                            {aiAnalysis.studentAnalysis.map((analysis, index) => {
                                // Extract student name from analysis text if it contains "Student {name}:"
                                let studentName = `Student ${index + 1}`;
                                let analysisText = analysis || 'No analysis data available.';
                                
                                // Check if analysis contains student name pattern like "Student qqq:"
                                const studentNameMatch = analysis.match(/^Student\s+([^:]+):\s*(.*)$/s);
                                if (studentNameMatch) {
                                    studentName = studentNameMatch[1].trim();
                                    analysisText = studentNameMatch[2].trim();
                                }
                                
                                return (
                                    <View key={index} style={styles.studentAnalysisItem}>
                                        <View style={styles.studentAnalysisHeader}>
                                            <View style={styles.studentNumber}>
                                                <Text style={styles.studentNumberText}>{studentName}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.studentAnalysisText}>{analysisText}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={loadClassAiAnalysis}
                        disabled={loading}
                    >
                        <Clock size={16} color="#6C5CE7" />
                        <Text style={styles.refreshButtonText}>Reanalysis</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <Brain size={24} color="#6C5CE7" />
                        <Text style={styles.headerTitle}>Class AI Analysis Report</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6C5CE7" />
                        <Text style={styles.loadingText}>Generating AI analysis report...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <AlertCircle size={48} color="#FF4757" />
                        <Text style={styles.errorTitle}>分析失敗</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={loadClassAiAnalysis}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : aiAnalysis ? (
                    <ScrollView style={styles.content}>
                        {renderAnalysisContent()}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Brain size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No analysis data available.</Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF4757',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    analysisContainer: {
        flex: 1,
    },
    analysisHeader: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    classInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    classInfoText: {
        flex: 1,
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 4,
    },
    analysisDate: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    sectionContent: {
        padding: 16,
    },
    analysisText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#495057',
    },
    studentAnalysisItem: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    studentAnalysisHeader: {
        marginBottom: 8,
    },
    studentNumber: {
        backgroundColor: '#6C5CE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    studentNumberText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    studentAnalysisText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#495057',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 20,
        gap: 12,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f1f3f5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    refreshButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6C5CE7',
    },
});
